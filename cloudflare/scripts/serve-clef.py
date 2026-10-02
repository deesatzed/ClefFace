"""Serve local Clef and answer GET / with a status page.

The upstream clef_mlx server only accepts /health, /v1/models, and
POST /v1/systemone. A browser opening the port otherwise sees
{"error": {"message": "not found: /"}}.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from huggingface_hub import snapshot_download


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8010
    repo = sys.argv[2] if len(sys.argv) > 2 else "mlx-community/clef-flash-4bit"
    path = Path(snapshot_download(repo))
    sys.path.insert(0, str(path))
    import clef_mlx

    model = clef_mlx.load(path)
    served_name = clef_mlx._model_name(str(path))
    model.systemone(
        {
            "model": served_name,
            "state": "warmup",
            "questions": {"w": {"type": "noul", "instructions": "Is this a warmup?"}},
        }
    )
    lock = threading.Lock()
    max_body = 32 * 1024 * 1024

    class Handler(BaseHTTPRequestHandler):
        server_version = "clef-mlx"

        def _send(self, status: int, body: dict) -> None:
            data = json.dumps(body, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _html(self, status: int, text: str) -> None:
            data = text.encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _error(self, status: int, message: str) -> None:
            self._send(status, {"error": {"message": message}})

        def do_GET(self) -> None:
            path_only = self.path.split("?", 1)[0]
            if path_only in ("/", "/health"):
                body = {
                    "status": "ok",
                    "model": served_name,
                    "health": "/health",
                    "systemone": "POST /v1/systemone",
                }
                if path_only == "/" and "text/html" in (self.headers.get("Accept") or ""):
                    self._html(
                        200,
                        "<!doctype html><title>Clef</title>"
                        f"<p>Clef is running ({served_name}).</p>"
                        "<p>Health: <a href=\"/health\">/health</a></p>"
                        "<p>Decisions: POST /v1/systemone</p>",
                    )
                    return
                self._send(200, body)
                return
            if path_only == "/v1/models":
                self._send(200, {"object": "list", "data": [{"id": served_name, "object": "model"}]})
                return
            self._error(404, f"not found: {path_only}")

        def do_POST(self) -> None:
            path_only = self.path.split("?", 1)[0]
            if path_only != "/v1/systemone":
                return self._error(404, f"not found: {path_only}")
            length = int(self.headers.get("Content-Length") or 0)
            if length > max_body:
                return self._error(413, "request body larger than 32 MB")
            try:
                request = json.loads(self.rfile.read(length))
                if not isinstance(request, dict):
                    raise ValueError("request body must be a JSON object")
                if request.get("videos"):
                    raise ValueError("videos are not supported over HTTP")
                request.setdefault("model", served_name)
                if request.get("images"):
                    request["images"] = [clef_mlx._decode_image(item) for item in request["images"]]
                truncate = request.pop("truncate", True)
            except (json.JSONDecodeError, ValueError, OSError) as error:
                return self._error(400, str(error))
            started = time.perf_counter()
            try:
                with lock:
                    response = model.systemone(request, max_length=16384, truncate=bool(truncate))
            except clef_mlx.ContextTooLong as error:
                return self._error(413, f"maximum context length exceeded: {error}")
            except (ValueError, KeyError, TypeError) as error:
                return self._error(400, str(error))
            except Exception as error:  # noqa: BLE001
                return self._error(500, f"{type(error).__name__}: {error}")
            response["usage"]["latency_ms"] = round((time.perf_counter() - started) * 1000, 1)
            self._send(200, response)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving {served_name} on http://127.0.0.1:{port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
