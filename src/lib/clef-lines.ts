/** Split a growing network chunk into complete NDJSON lines. */
export function takeLines(buffer: string, chunk: string): { lines: string[]; rest: string } {
  const parts = (buffer + chunk).split("\n");
  const rest = parts.pop() ?? "";
  return { lines: parts.filter((line) => line.trim().length > 0), rest };
}
