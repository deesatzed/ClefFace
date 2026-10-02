import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DQNFQt75.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-Cn9IAqA5.css";
var APP_NAME = "Clef Extract";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Closed-field document extraction. Facts, theories, and workflows as binary labels, with a human gate."
			},
			{
				name: "theme-color",
				content: "#145c4a"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,640&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter = () => import("./routes-SJBKkOkj.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var CONFIDENCE_THRESHOLD = .72;
var ABBR = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Fig|No|St|Dept|Inc|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|e\.g|i\.e|U\.S|U\.K)\./g;
function wordCount(text) {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
function textHash(input) {
	let h = 5381;
	for (let i = 0; i < input.length; i++) h = (h << 5) + h ^ input.charCodeAt(i);
	return (h >>> 0).toString(16).padStart(8, "0");
}
function formatId(prefix, n) {
	return prefix + String(n).padStart(3, "0");
}
function shortQuote(text) {
	const clean = text.trim();
	if (clean.length <= 180) return clean;
	const slice = clean.slice(0, 180);
	const sp = slice.lastIndexOf(" ");
	return sp > 80 ? slice.slice(0, sp) : slice;
}
function splitSentences(paragraph) {
	let marked = paragraph.replace(ABBR, (match) => match.replace(/\./g, "∯"));
	marked = marked.replace(/(\d)\.(\d)/g, "$1∯$2");
	const parts = marked.split(/(?<=[.!?])\s+(?=[A-Z0-9“"(\[])/);
	const out = [];
	for (const part of parts) {
		const restored = part.replace(/∯/g, ".").trim();
		if (!restored) continue;
		const bits = restored.split(/;\s+/);
		if (bits.length > 1 && bits.every((bit) => wordCount(bit) >= 6)) for (const bit of bits) {
			const piece = bit.trim();
			if (piece) out.push(piece);
		}
		else out.push(restored);
	}
	return out;
}
function normalizeKey(text) {
	return text.toLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
}
var ROLES = [
	"ward nurse",
	"night supervisor",
	"covering physician",
	"physician",
	"nurse",
	"supervisor",
	"operator",
	"reviewer",
	"clerk",
	"clinician"
];
var VERBS = [
	"records",
	"calls",
	"writes",
	"states",
	"starts",
	"reviews",
	"notifies",
	"checks",
	"confirms",
	"sends",
	"opens",
	"closes",
	"assigns",
	"rejects",
	"merges",
	"stores",
	"reads",
	"logs",
	"pages",
	"contacts",
	"documents",
	"enters",
	"signs",
	"extracts",
	"submits",
	"queues",
	"marks",
	"accepts"
];
function actorOf(text) {
	const re = new RegExp(`((?:[Tt]he )?(?:${ROLES.join("|")}))\\s+(?:${VERBS.join("|")})\\b`, "i");
	const match = text.match(re);
	return match ? match[1] : "unspecified";
}
function slot(text, kind) {
	const re = kind === "input" ? /\b(?:from|using|given|based on)\s+([^.,;]+)/i : /\b(?:produces?|producing|outputs?|writes|records|logs)\s+([^.,;]+)/i;
	const match = text.match(re);
	if (!match) return "unspecified";
	const phrase = match[1].trim();
	if (!phrase || phrase.length > 80 || !text.includes(phrase)) return "unspecified";
	return phrase;
}
function emptyState() {
	return {
		ids_used: [],
		open_questions: [],
		rejected_labels: []
	};
}
/** Rejects a stage that drops an id it was given. */
function echoState(prior, next) {
	for (const id of prior.ids_used) if (!next.ids_used.includes(id)) throw new Error(`state echo failed for ${id}`);
	return next;
}
var MemoryRegistry = class {
	used = /* @__PURE__ */ new Set();
	issue(documentId, id) {
		const key = `${documentId}:${id}`;
		if (this.used.has(key)) throw new Error(`id reuse rejected: ${key}`);
		this.used.add(key);
		return id;
	}
};
var STOP$1 = new Set("a an the and or of to for from with within on in into over that this those these than then not does do did is are was were be been being by as at it its their they he she you we who whom which what when where while".split(" "));
function contentWords(text) {
	const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP$1.has(word));
	return new Set(words);
}
function isContrast(text) {
	return /^(however|but)\b/i.test(text.trim()) || /\b(contrary|in contrast)\b/i.test(text);
}
var MIN_WORDS = 1500;
var MAX_WORDS = 2500;
function parseSections(text) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const raw = [];
	let current = null;
	let sawHeading = false;
	for (const line of lines) {
		const heading = headingOf(line);
		if (heading) {
			if (current && (sawHeading || current.bodyLines.some((row) => row.trim()))) raw.push(current);
			sawHeading = true;
			current = {
				level: heading.level,
				title: heading.title,
				bodyLines: []
			};
		} else {
			if (!current) current = {
				level: 1,
				title: "Document",
				bodyLines: []
			};
			current.bodyLines.push(line);
		}
	}
	if (current && (sawHeading || current.bodyLines.some((row) => row.trim()))) raw.push(current);
	const stack = [];
	const sections = [];
	for (const section of raw) {
		while (stack.length > 0 && stack[stack.length - 1].level >= section.level) stack.pop();
		stack.push({
			level: section.level,
			title: section.title
		});
		const body = section.bodyLines.join("\n").trim();
		const path = stack.map((item) => item.title).join(" > ");
		sections.push({
			level: section.level,
			title: section.title,
			path,
			body,
			words: wordCount(`${section.title} ${body}`)
		});
	}
	return sections;
}
function chunkDocument(text) {
	const source = text.replace(/\r\n/g, "\n").trim();
	if (!source) return [];
	const sections = parseSections(source);
	const groups = [];
	let current = [];
	let count = 0;
	const flush = () => {
		if (current.length === 0) return;
		groups.push(current);
		current = [];
		count = 0;
	};
	for (const section of sections) {
		if (section.words > MAX_WORDS) {
			flush();
			for (const part of splitLarge(section)) {
				if (count >= MIN_WORDS && count + part.words > MAX_WORDS) flush();
				current.push(part);
				count += part.words;
				if (count >= MAX_WORDS) flush();
			}
			continue;
		}
		if (count >= MIN_WORDS && count + section.words > MAX_WORDS) flush();
		current.push(section);
		count += section.words;
	}
	flush();
	return groups.map((group, index) => {
		const heading = group[0]?.title ?? "Document";
		const rendered = group.map((section) => `${"#".repeat(Math.min(section.level, 6))} ${section.title}\n\n${section.body}`).join("\n\n").trim();
		return {
			id: formatId("K", index + 1),
			heading,
			word_count: wordCount(rendered),
			text: rendered,
			sections: group
		};
	});
}
function splitLarge(section) {
	const paragraphs = section.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
	if (paragraphs.length === 0) return [section];
	const parts = [];
	let buf = [];
	let count = 0;
	const push = () => {
		if (buf.length === 0) return;
		const body = buf.join("\n\n");
		parts.push({
			...section,
			body,
			words: wordCount(`${section.title} ${body}`)
		});
		buf = [];
		count = 0;
	};
	for (const paragraph of paragraphs) {
		const words = wordCount(paragraph);
		if (count >= MIN_WORDS && count + words > MAX_WORDS) push();
		buf.push(paragraph);
		count += words;
	}
	push();
	return parts.length > 0 ? parts : [section];
}
function headingOf(line) {
	const markdown = /^(#{1,6})\s+(\S.*)$/.exec(line.trim());
	if (markdown) return {
		level: markdown[1].length,
		title: markdown[2].trim()
	};
	const title = line.trim();
	if (!title || title.length > 72 || /[.!?]$/.test(title)) return null;
	if (/^(?:[-*•]|\d+[.)])\s+/.test(title)) return null;
	if (title.split(/\s+/).length > 8) return null;
	if (title === title.toUpperCase() && /[A-Z]/.test(title)) return {
		level: 2,
		title
	};
	return null;
}
/**
* Preview stand-in. Same response shape as Clef (noul + choice).
* Not a model call. The Worker path uses @cf/cloudflare/clef instead.
*/
function localClef(unit) {
	const text = unit.text.trim();
	unit.section_path;
	const kind = kindOf(unit);
	const polarity = polarityOf(text);
	const status = theoryStatus$1(text, kind);
	const causal = causalOf(text);
	const falsifiable = falsifiableOf(text, kind);
	const timeScope = timeOf(text);
	const conceptType = conceptTypeOf(text, kind);
	const deterministic = deterministicOf(text, kind);
	const quantity = quantityOf(text);
	const defined = definitionOf(text);
	const decision = decisionOf(text);
	const full = fullySpecified$1(text, kind);
	const external = externalOf(text);
	const boilerplate = kind === "none" && wordish(text) < 8;
	const conflict = isConflict(text, kind);
	const kindConfidence = conflict ? .5 : kind === "none" && !boilerplate ? .55 : .9;
	return {
		model: "local-stand-in",
		answers: {
			boilerplate: noul(boilerplate),
			deterministic: noul(deterministic),
			quantity_present: noul(quantity),
			definition_present: noul(defined),
			decision_point: noul(decision),
			fully_specified: noul(full),
			external_check: noul(external),
			polarity: choice(polarity, [
				"affirmed",
				"denied",
				"conditional",
				"unclear"
			], polarity === "unclear" ? .5 : .9),
			record_kind: choice(kind, [
				"fact",
				"theory",
				"concept",
				"workflow_step",
				"none"
			], kindConfidence, conflict ? "fact" : void 0),
			theory_status: choice(status, [
				"hypothesis",
				"model",
				"interpretation",
				"prediction",
				"not_applicable"
			], .88),
			causal: choice(causal, [
				"yes",
				"no",
				"unclear"
			], causal === "unclear" ? .5 : .9),
			falsifiable: choice(falsifiable, [
				"yes",
				"no",
				"unclear"
			], falsifiable === "unclear" ? .86 : .9),
			time_scope: choice(timeScope, [
				"past",
				"present",
				"future",
				"unspecified"
			], .88),
			concept_type: choice(conceptType, [
				"entity",
				"process",
				"metric",
				"role",
				"tool",
				"other",
				"not_applicable"
			], .88)
		}
	};
}
function kindOf(unit) {
	const text = unit.text.trim();
	if (unit.from_table) return quantityOf(text) ? "fact" : "concept";
	if (/^\d+[.)]\s+/.test(text) || /^[-*•]\s+/.test(text)) return "workflow_step";
	if (isDefinition(text)) return "concept";
	if (/^when\b/i.test(text) && /procedure|workflow|process|steps/i.test(unit.section_path)) return "workflow_step";
	if (theorySignal(text)) return "theory";
	if (wordish(text) >= 5) return "fact";
	return "none";
}
function isDefinition(text) {
	return /\b(is defined as|are defined as|defined as|refers to|means)\b/i.test(text);
}
function theorySignal(text) {
	return /\b(may|might|could|suggests?|likely|possibly|perhaps|hypothesis|hypothesi[sz]e|appears to|seems to|interpreted as|interpretation|presumably|we believe|according to)\b/i.test(text);
}
function isConflict(text, kind) {
	return kind === "theory" && /\bleads? to\b/i.test(text) && /\baccording to\b/i.test(text) && !/\b(may|might|could)\b/i.test(text);
}
function polarityOf(text) {
	if (/\b(if|unless|provided that|only if|only when|when)\b/i.test(text) && !/^\d+[.)]\s+/.test(text)) return "conditional";
	if (/\bnot optional\b/i.test(text)) return "affirmed";
	const trailingContrast = /,\s+not\b/i.test(text);
	if (/\b(no|not|never|cannot|can't|doesn't|does not|do not|don't|isn't|aren't|wasn't|weren't|won't|must not|shall not)\b/i.test(text) && !trailingContrast) return "denied";
	if (wordish(text) < 4) return "unclear";
	return "affirmed";
}
function theoryStatus$1(text, kind) {
	if (kind !== "theory") return "not_applicable";
	if (/hypothes/i.test(text)) return "hypothesis";
	if (/\bmodel\b/i.test(text)) return "model";
	if (/\b(predict|forecast|expected to|will)\b/i.test(text)) return "prediction";
	if (/\b(may|might|could)\b/i.test(text)) return "hypothesis";
	return "interpretation";
}
function causalOf(text) {
	if (/\b(because|causes?|caused|leads? to|results? in|due to|therefore|hence|consequently)\b/i.test(text)) return "yes";
	return "no";
}
function falsifiableOf(text, kind) {
	if (kind !== "theory") return "unclear";
	if (/\b(cannot be tested|unfalsifiable)\b/i.test(text)) return "no";
	if (/\b(measured by|if and only if|percent|within \d+)\b/i.test(text)) return "yes";
	return "unclear";
}
function timeOf(text) {
	const future = /\b(will|going to|forecast)\b/i.test(text);
	const past = /\b(was|were|had|did|logged|arrived|recorded|stated|previously)\b/i.test(text) || /\b(19|20)\d{2}\b/.test(text);
	const present = /\b(is|are|does|do|means|shall)\b/i.test(text);
	if (future && past) return "unspecified";
	if (future) return "future";
	if (past && !/\bis defined as\b|\bmeans\b/i.test(text)) return "past";
	if (present) return "present";
	return "unspecified";
}
function conceptTypeOf(text, kind) {
	if (kind !== "concept") return "not_applicable";
	const term = termOf$1(text) ?? text;
	if (/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(term)) return "metric";
	if (/\b(nurse|physician|supervisor|operator|reviewer|clerk|clinician|officer)\b/i.test(term)) return "role";
	if (/\b(system|software|database|dashboard|platform|ehr|epic)\b/i.test(term)) return "tool";
	if (/\b(process|procedure|protocol|workflow|pipeline|callback|drill)\b/i.test(term)) return "process";
	return "other";
}
function deterministicOf(text, kind) {
	if (kind === "theory") return false;
	if (theorySignal(text)) return false;
	return kind === "fact" || kind === "concept";
}
function quantityOf(text) {
	return /\b\d+(?:[.:]\d+)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|percent)\b/i.test(text);
}
function definitionOf(text) {
	return isDefinition(text);
}
function decisionOf(text) {
	return /\b(if|whether|otherwise|decide|decision)\b/i.test(text);
}
function fullySpecified$1(text, kind) {
	if (kind !== "workflow_step") return false;
	if (actorOf(text) === "unspecified") return false;
	const input = slot(text, "input");
	const output = slot(text, "output");
	return input !== "unspecified" || output !== "unspecified";
}
function externalOf(text) {
	return /\b(according to (?:the )?(?:literature|guidelines|published)|et al\.|citation needed)\b/i.test(text);
}
function termOf$1(text) {
	const match = /^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text);
	if (!match) return null;
	return match[1].replace(/^(a|an|the)\s+/i, "").trim();
}
function wordish(text) {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
function noul(yes, confidence = .9) {
	const p = Math.min(.99, Math.max(.51, .5 + confidence / 2));
	return {
		type: "noul",
		noul: yes ? p : 1 - p
	};
}
function choice(selected, labels, confidence, runnerUp) {
	const probabilities = {};
	const rest = labels.filter((label) => label !== selected);
	const top = runnerUp ? .48 : confidence;
	const second = runnerUp ? .44 : 0;
	let used = top + (runnerUp ? second : 0);
	for (const label of labels) if (label === selected) probabilities[label] = top;
	else if (label === runnerUp) probabilities[label] = second;
	else probabilities[label] = 0;
	const others = rest.filter((label) => label !== runnerUp);
	const share = others.length > 0 ? (1 - used) / others.length : 0;
	for (const label of others) probabilities[label] = share;
	used = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
	if (used > 0 && Math.abs(used - 1) > .001) probabilities[selected] += 1 - used;
	return {
		type: "choice",
		choice: selected,
		confidence: runnerUp ? .5 : confidence,
		probabilities
	};
}
var POLARITY = [
	"affirmed",
	"denied",
	"conditional",
	"unclear"
];
var KIND = [
	"fact",
	"theory",
	"concept",
	"workflow_step",
	"none"
];
var STATUS = [
	"hypothesis",
	"model",
	"interpretation",
	"prediction",
	"not_applicable"
];
var TERNARY = [
	"yes",
	"no",
	"unclear"
];
var TIME = [
	"past",
	"present",
	"future",
	"unspecified"
];
var CONCEPT = [
	"entity",
	"process",
	"metric",
	"role",
	"tool",
	"other",
	"not_applicable"
];
function normalizeAnswers(raw, unitId) {
	const answers = raw.answers ?? {};
	const boilerplate = readNoul(answers.boilerplate);
	const deterministic = readNoul(answers.deterministic);
	const quantity = readNoul(answers.quantity_present);
	const defined = readNoul(answers.definition_present);
	const decision = readNoul(answers.decision_point);
	const full = readNoul(answers.fully_specified);
	const external = readNoul(answers.external_check);
	const polarity = readChoice(answers.polarity, POLARITY, "unclear");
	const kind = readChoice(answers.record_kind, KIND, "none");
	const status = readChoice(answers.theory_status, STATUS, "not_applicable");
	const causal = readChoice(answers.causal, TERNARY, "unclear");
	const falsifiable = readChoice(answers.falsifiable, TERNARY, "unclear");
	const timeScope = readChoice(answers.time_scope, TIME, "unspecified");
	const conceptType = readChoice(answers.concept_type, CONCEPT, "not_applicable");
	const scores = [kind.confidence, boilerplate.confidence];
	if (kind.value === "fact" || kind.value === "theory") scores.push(polarity.confidence, deterministic.confidence, timeScope.confidence, quantity.confidence);
	if (kind.value === "theory") scores.push(status.confidence, causal.confidence, falsifiable.confidence);
	if (kind.value === "workflow_step") scores.push(decision.confidence, full.confidence);
	if (kind.value === "concept") scores.push(defined.confidence, conceptType.confidence);
	if (external.yes === "yes") scores.push(external.confidence);
	const conflict = kind.conflict || polarity.conflict || kind.value === "theory" && (status.conflict || causal.conflict || falsifiable.conflict);
	return {
		unit_id: unitId,
		boilerplate: boilerplate.yes,
		deterministic: deterministic.yes,
		quantity_present: quantity.yes,
		definition_present: defined.yes,
		decision_point: decision.yes,
		fully_specified: full.yes,
		polarity: polarity.value,
		record_kind: kind.value,
		theory_status: status.value,
		causal: causal.value,
		falsifiable: falsifiable.value,
		time_scope: timeScope.value,
		concept_type: conceptType.value,
		external_check: external.yes,
		confidence: Math.min(...scores),
		conflict,
		model: raw.model ?? "unknown"
	};
}
function reviewReasons(decision, human) {
	if (decision.boilerplate === "yes") return [];
	const reasons = /* @__PURE__ */ new Set();
	if (!human && decision.confidence < .72) reasons.add("low_confidence");
	if (!human && decision.conflict) reasons.add("conflict");
	if (!human && decision.external_check === "yes") reasons.add("external_check_required");
	if (decision.record_kind === "none") reasons.add("unclear");
	if ((decision.record_kind === "fact" || decision.record_kind === "theory") && decision.polarity === "unclear") reasons.add("unclear");
	if (!human && decision.record_kind === "theory" && (decision.causal === "unclear" || decision.falsifiable === "unclear" || decision.theory_status === "not_applicable")) reasons.add("unclear");
	return [...reasons];
}
function readNoul(value) {
	let p = null;
	if (typeof value === "number") p = value;
	else if (value && typeof value === "object") {
		const obj = value;
		if (typeof obj.noul === "number") p = obj.noul;
		else if (typeof obj.probability === "number") p = obj.probability;
	}
	if (p === null || Number.isNaN(p) || p < 0 || p > 1) return {
		yes: "no",
		confidence: 0
	};
	return {
		yes: p >= .5 ? "yes" : "no",
		confidence: Math.abs(p - .5) * 2
	};
}
function readChoice(value, allowed, fallback) {
	if (!value || typeof value !== "object") return {
		value: fallback,
		confidence: 0,
		conflict: false
	};
	const obj = value;
	const selected = typeof obj.choice === "string" ? obj.choice : fallback;
	const known = allowed.includes(selected);
	const safe = known ? selected : fallback;
	let confidence = typeof obj.confidence === "number" ? obj.confidence : 0;
	let conflict = false;
	if (obj.probabilities && typeof obj.probabilities === "object") {
		const ranked = Object.entries(obj.probabilities).filter((entry) => typeof entry[1] === "number").sort((a, b) => b[1] - a[1]);
		if (ranked.length >= 2 && ranked[1][1] >= ranked[0][1] - .08) conflict = true;
		if (typeof obj.confidence !== "number" && ranked[0]) confidence = ranked[0][1];
	}
	if (!known) confidence = Math.min(confidence, .4);
	return {
		value: safe,
		confidence,
		conflict
	};
}
function segmentDocument(text, tables = []) {
	const packed = chunkDocument(text);
	const units = [];
	for (const chunk of packed) for (const section of chunk.sections) for (const sentence of sentencesIn(section.body)) units.push({
		id: "",
		chunk_id: chunk.id,
		ordinal: units.length + 1,
		section_path: section.path,
		text: sentence,
		from_table: false,
		list_order: listOrder(sentence)
	});
	for (const table of tables) {
		const section = `Table: ${table.name?.trim() || "Untitled"}`;
		for (const row of table.rows) {
			const cells = row.map((cell) => cell.trim()).filter((cell) => cell.length > 0);
			if (cells.length === 0) continue;
			units.push({
				id: "",
				chunk_id: packed[0]?.id ?? "K001",
				ordinal: units.length + 1,
				section_path: section,
				text: cells.join(" | "),
				from_table: true,
				list_order: null
			});
		}
	}
	units.forEach((unit, index) => {
		unit.id = formatId("U", index + 1);
		unit.ordinal = index + 1;
	});
	const chunks = packed.map((chunk) => ({
		id: chunk.id,
		heading: chunk.heading,
		word_count: chunk.word_count,
		text: chunk.text
	}));
	if (chunks.length === 0 && units.length > 0) chunks.push({
		id: "K001",
		heading: "Document",
		word_count: wordCount(text),
		text
	});
	return {
		chunks,
		units
	};
}
function sentencesIn(body) {
	const lines = body.split("\n");
	const out = [];
	let prose = [];
	const flush = () => {
		const joined = prose.join(" ").trim();
		prose = [];
		if (!joined) return;
		out.push(...splitSentences(joined));
	};
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			flush();
			continue;
		}
		if (isListLine(trimmed)) {
			flush();
			const marker = /^((?:\d+[.)]|[-*•])\s+)(.*)$/.exec(trimmed);
			const pieces = splitSentences(marker ? marker[2] : trimmed);
			if (pieces.length <= 1) out.push(trimmed);
			else out.push(...pieces);
			continue;
		}
		prose.push(trimmed);
	}
	flush();
	return out.filter((sentence) => wordCount(sentence) > 0);
}
function isListLine(line) {
	return /^(?:[-*•]|\d+[.)])\s+\S/.test(line);
}
function listOrder(text) {
	const match = /^(\d+)[.)]\s+/.exec(text);
	if (!match) return null;
	return Number(match[1]);
}
function extractDocument(text, tables = [], resolutions = [], provided) {
	const source = text.replace(/\r\n/g, "\n").trim();
	if (!source && tables.length === 0) throw new Error("empty_document");
	const id = "job_" + textHash(JSON.stringify({
		source,
		tables,
		resolutions,
		engine: provided?.engine ?? "local"
	}));
	const registry = new MemoryRegistry();
	let state = emptyState();
	const { chunks, units } = provided ? {
		chunks: provided.chunks,
		units: provided.units
	} : segmentDocument(source, tables);
	if (provided && provided.decisions.length !== units.length) throw new Error("decision count does not match units");
	state = take(state, registry, id, units.map((unit) => unit.id));
	const byUnit = new Map(resolutions.map((item) => [item.unit_id, item]));
	const tuned = units.map((unit, index) => {
		const decision = provided ? provided.decisions[index] : normalizeAnswers(localClef(unit), unit.id);
		if (decision.unit_id !== unit.id) throw new Error(`decision unit mismatch for ${unit.id}`);
		return tune(decision, byUnit.get(unit.id));
	});
	const facts = [];
	const theories = [];
	const concepts = [];
	const factKey = /* @__PURE__ */ new Map();
	let factN = 0;
	let theoryN = 0;
	let conceptN = 0;
	let reviewN = 0;
	const review = [];
	const boilerplate = /* @__PURE__ */ new Set();
	for (const unit of units) {
		const decision = tuned[unit.ordinal - 1];
		const reasons = reviewReasons(decision, decision.human);
		if (decision.boilerplate === "yes") {
			boilerplate.add(unit.id);
			continue;
		}
		const held = reasons.length > 0;
		if (held) {
			reviewN += 1;
			const reviewId = formatId("Q", reviewN);
			state = take(state, registry, id, [reviewId]);
			review.push({
				id: reviewId,
				unit_id: unit.id,
				section_path: unit.section_path,
				quote: unit.text,
				reasons,
				confidence: round(decision.confidence),
				proposed_kind: decision.record_kind,
				proposed_polarity: decision.polarity,
				proposed_status: decision.theory_status,
				causal: decision.causal,
				falsifiable: decision.falsifiable,
				deterministic: decision.deterministic,
				conflict: decision.conflict
			});
		}
		if (decision.record_kind === "concept") {
			conceptN += 1;
			const conceptId = formatId("C", conceptN);
			state = take(state, registry, id, [conceptId]);
			const term = termOf(unit.text);
			const quote = decision.definition_present === "yes" ? definitionQuote(unit.text) : "";
			concepts.push({
				id: conceptId,
				term,
				definition_present: quote ? "yes" : "no",
				definition_quote: quote,
				type: conceptType(term, unit.text, decision.concept_type),
				unit_ids: [unit.id],
				held
			});
			continue;
		}
		if (decision.record_kind === "theory") {
			theoryN += 1;
			const theoryId = formatId("T", theoryN);
			state = take(state, registry, id, [theoryId]);
			theories.push({
				id: theoryId,
				claim: unit.text,
				evidence_quote: shortQuote(unit.text),
				status: theoryStatus(decision.theory_status),
				causal: decision.causal,
				falsifiable: decision.falsifiable,
				conflicts_with_fact_id: "none",
				unit_ids: [unit.id],
				held: held || decision.theory_status === "not_applicable"
			});
			continue;
		}
		if (decision.record_kind === "fact") {
			const key = normalizeKey(unit.text);
			const existing = factKey.get(key);
			if (existing) {
				existing.unit_ids.push(unit.id);
				continue;
			}
			const polarity = decision.polarity;
			if (polarity === "unclear") continue;
			factN += 1;
			const factId = formatId("F", factN);
			state = take(state, registry, id, [factId]);
			const fact = {
				id: factId,
				statement: unit.text,
				evidence_quote: shortQuote(unit.text),
				deterministic: decision.deterministic,
				polarity,
				time_scope: decision.time_scope,
				quantity_present: decision.quantity_present,
				unit_ids: [unit.id],
				held
			};
			facts.push(fact);
			factKey.set(key, fact);
		}
	}
	const workflows = buildWorkflows(units, tuned, state, registry, id);
	state = workflows.state;
	const relations = buildRelations(concepts, facts, theories, workflows.records, state, registry, id);
	state = relations.state;
	const rejected = critique(source, tables, facts, theories, concepts, workflows.records);
	state = echoState(state, {
		...state,
		open_questions: [
			...state.open_questions,
			...relations.openQuestions,
			...rejected.open
		],
		rejected_labels: [...state.rejected_labels, ...rejected.rejected]
	});
	for (const unitId of rejected.holdUnits) for (const fact of facts) if (fact.unit_ids.includes(unitId)) fact.held = true;
	const output = project(units, boilerplate, concepts, facts, theories, workflows.records, relations.records);
	return {
		id,
		status: output.coverage.unassigned_quotes.length === 0 && review.length === 0 ? "complete" : "needs_review",
		engine: provided?.engine ?? "local-stand-in",
		threshold: CONFIDENCE_THRESHOLD,
		output,
		review,
		units,
		chunks: chunks.map((chunk) => ({
			id: chunk.id,
			heading: chunk.heading,
			word_count: chunk.word_count
		})),
		decisions: tuned.map(({ human: _human, ...decision }) => decision),
		state
	};
}
function tune(decision, resolution) {
	if (!resolution) return {
		...decision,
		human: false
	};
	if (resolution.action === "boilerplate") return {
		...decision,
		human: true,
		boilerplate: "yes",
		record_kind: "none",
		confidence: 1,
		conflict: false
	};
	if (resolution.action === "file_as_fact") {
		const polarity = resolution.polarity ?? (decision.polarity === "unclear" ? "affirmed" : decision.polarity);
		return {
			...decision,
			human: true,
			record_kind: "fact",
			theory_status: "not_applicable",
			deterministic: "no",
			conflict: false,
			confidence: 1,
			polarity,
			causal: "no"
		};
	}
	return {
		...decision,
		human: true,
		confidence: 1,
		conflict: false,
		polarity: resolution.polarity ?? decision.polarity
	};
}
function buildWorkflows(units, tuned, state, registry, documentId) {
	const groups = /* @__PURE__ */ new Map();
	for (const unit of units) {
		const decision = tuned[unit.ordinal - 1];
		if (decision.boilerplate === "yes" || decision.record_kind !== "workflow_step") continue;
		const list = groups.get(unit.section_path) ?? [];
		list.push(unit);
		groups.set(unit.section_path, list);
	}
	const records = [];
	let n = 0;
	let next = state;
	for (const [path, group] of groups) {
		const triggerUnit = group.find((unit) => unit.list_order === null && /^(when|if)\b/i.test(unit.text));
		const steps = group.filter((unit) => unit !== triggerUnit);
		if (steps.length === 0 && !triggerUnit) continue;
		n += 1;
		const workflowId = formatId("W", n);
		next = take(next, registry, documentId, [workflowId]);
		const exportedSteps = steps.map((unit, index) => {
			const decision = tuned[unit.ordinal - 1];
			const held = reviewReasons(decision, decision.human).length > 0;
			const lexicalDecision = /\b(if|whether|otherwise|decide|decision)\b/i.test(unit.text);
			let decisionFlag = decision.decision_point;
			if (decisionFlag === "yes" && !lexicalDecision) {
				next = echoState(next, {
					...next,
					rejected_labels: [...next.rejected_labels, {
						unit_id: unit.id,
						label: "decision_point:yes",
						reason: "no explicit decision word in the step"
					}]
				});
				decisionFlag = "no";
			}
			return {
				order: unit.list_order ?? index + 1,
				action: unit.text,
				actor: actorOf(unit.text),
				input: slot(unit.text, "input"),
				output: slot(unit.text, "output"),
				decision: decisionFlag,
				unit_id: unit.id,
				held
			};
		}).filter((step) => !step.held);
		const triggerHeld = triggerUnit ? reviewReasons(tuned[triggerUnit.ordinal - 1], tuned[triggerUnit.ordinal - 1].human).length > 0 : true;
		const trigger = triggerUnit && !triggerHeld ? triggerUnit.text : "unspecified";
		const end = endCondition(group.map((unit) => unit.text));
		const roles = unique(exportedSteps.map((step) => step.actor));
		const blob = [trigger, ...exportedSteps.map((step) => step.action)].join(" ");
		const structural = fullySpecified(trigger, end, exportedSteps);
		const record = {
			id: workflowId,
			name: path.split(" > ").at(-1) || "Unspecified procedure",
			trigger,
			steps: exportedSteps.map(({ unit_id: _id, held: _held, ...step }) => step),
			end_condition: end,
			roles: roles.length > 0 ? roles : ["unspecified"],
			tools_mentioned: /\b(software|database|dashboard|platform|EHR|Epic|spreadsheet|system)\b/i.test(blob) ? "yes" : "no",
			fully_specified: structural,
			unit_ids: [...triggerUnit && !triggerHeld ? [triggerUnit.id] : [], ...exportedSteps.map((step) => step.unit_id)],
			held: exportedSteps.length === 0 && trigger === "unspecified"
		};
		if (record.name === "Document") record.name = "Unspecified procedure";
		records.push(record);
	}
	return {
		records,
		state: next
	};
}
function fullySpecified(trigger, end, steps) {
	if (trigger === "unspecified" || end === "unspecified" || steps.length === 0) return "no";
	for (const step of steps) {
		if (step.actor === "unspecified") return "no";
		if (step.input === "unspecified" && step.output === "unspecified") return "no";
	}
	return "yes";
}
function endCondition(texts) {
	const hit = texts.find((text) => /\b(end when|done when|complete when|until complete|then stop)\b/i.test(text));
	return hit ? shortQuote(hit) : "unspecified";
}
function buildRelations(concepts, facts, theories, workflows, state, registry, documentId) {
	const records = [];
	const openQuestions = [];
	let n = 0;
	let next = state;
	const add = (source, target, relation, held) => {
		n += 1;
		const relationId = formatId("R", n);
		next = take(next, registry, documentId, [relationId]);
		records.push({
			source_id: source,
			target_id: target,
			relation,
			held
		});
	};
	for (const concept of concepts) {
		if (concept.held) continue;
		const needle = concept.term.toLowerCase();
		if (needle.length < 3) continue;
		for (const workflow of workflows) {
			if (workflow.held) continue;
			if (`${workflow.trigger} ${workflow.steps.map((step) => step.action).join(" ")}`.toLowerCase().includes(needle)) add(concept.id, workflow.id, "part_of", false);
		}
	}
	for (const theory of theories) {
		if (theory.causal !== "yes") continue;
		const words = contentWords(theory.claim);
		const hits = facts.filter((fact) => overlap(words, contentWords(fact.statement)) >= 3);
		if (hits.length === 1) add(theory.id, hits[0].id, "causes", theory.held || hits[0].held);
	}
	for (const fact of facts) {
		const text = fact.statement;
		if (!isContrast(text)) continue;
		const words = contentWords(text);
		let best = null;
		for (const other of facts) {
			if (other.id === fact.id) continue;
			if (other.polarity === fact.polarity) continue;
			const score = overlap(words, contentWords(other.statement));
			if (score >= 2 && (!best || score > best.score)) best = {
				id: other.id,
				score
			};
		}
		if (!best) {
			openQuestions.push(`No opposing fact for contrast unit on ${fact.id}`);
			continue;
		}
		const other = facts.find((item) => item.id === best?.id);
		add(fact.id, best.id, "contradicts", fact.held || Boolean(other?.held));
	}
	return {
		records,
		state: next,
		openQuestions
	};
}
function critique(source, tables, facts, theories, concepts, workflows) {
	const corpus = [source, ...tables.flatMap((table) => table.rows.map((row) => row.join(" | ")))].join("\n");
	const holdUnits = [];
	const rejected = [];
	const seen = /* @__PURE__ */ new Set();
	const check = (id, unitId, quote) => {
		if (seen.has(id)) rejected.push({
			unit_id: unitId,
			label: id,
			reason: "duplicate id"
		});
		seen.add(id);
		if (quote && !corpus.includes(quote)) {
			rejected.push({
				unit_id: unitId,
				label: "evidence_quote",
				reason: "quote is not an exact substring"
			});
			holdUnits.push(unitId);
		}
	};
	for (const fact of facts) check(fact.id, fact.unit_ids[0], fact.evidence_quote);
	for (const theory of theories) check(theory.id, theory.unit_ids[0], theory.evidence_quote);
	for (const concept of concepts) if (concept.definition_present === "yes") check(concept.id, concept.unit_ids[0], concept.definition_quote);
	else check(concept.id, concept.unit_ids[0], "");
	for (const workflow of workflows) for (const step of workflow.steps) {
		if (!step.order || !step.actor) rejected.push({
			unit_id: workflow.id,
			label: "workflow_step",
			reason: "step missing order or actor"
		});
		if (step.action && !corpus.includes(step.action)) rejected.push({
			unit_id: workflow.id,
			label: "action",
			reason: "step action is not an exact substring"
		});
	}
	return {
		holdUnits,
		open: [],
		rejected
	};
}
function project(units, boilerplate, concepts, facts, theories, workflows, relations) {
	const covered = new Set(boilerplate);
	for (const concept of concepts) if (!concept.held) concept.unit_ids.forEach((unitId) => covered.add(unitId));
	for (const fact of facts) if (!fact.held) fact.unit_ids.forEach((unitId) => covered.add(unitId));
	for (const theory of theories) if (!theory.held) theory.unit_ids.forEach((unitId) => covered.add(unitId));
	for (const workflow of workflows) if (!workflow.held) workflow.unit_ids.forEach((unitId) => covered.add(unitId));
	const unassigned = units.filter((unit) => !covered.has(unit.id)).map((unit) => unit.text);
	const live = /* @__PURE__ */ new Set([
		...concepts.filter((item) => !item.held).map((item) => item.id),
		...facts.filter((item) => !item.held).map((item) => item.id),
		...theories.filter((item) => !item.held).map((item) => item.id),
		...workflows.filter((item) => !item.held).map((item) => item.id)
	]);
	return {
		concepts: concepts.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
		facts: facts.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
		theories: theories.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
		workflows: workflows.filter((item) => !item.held).map(({ unit_ids: _u, held: _h, ...item }) => item),
		relations: relations.filter((item) => !item.held && live.has(item.source_id) && live.has(item.target_id)).map(({ held: _h, ...item }) => item),
		coverage: {
			segments_total: units.length,
			segments_classified: units.length - unassigned.length,
			unassigned_quotes: unassigned
		}
	};
}
function take(state, registry, documentId, ids) {
	for (const id of ids) registry.issue(documentId, id);
	return echoState(state, {
		...state,
		ids_used: [...state.ids_used, ...ids]
	});
}
function termOf(text) {
	const match = /^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text.trim());
	if (!match) return text.trim().slice(0, 80);
	return match[1].replace(/^(a|an|the)\s+/i, "").trim();
}
function definitionQuote(text) {
	const match = /\b(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(text);
	if (!match || match.index === void 0) return "";
	return shortQuote(text.slice(match.index + match[0].length).trim());
}
function conceptType(term, text, fallback) {
	if (fallback !== "not_applicable") return fallback;
	if (/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(term)) return "metric";
	if (/\b(callback|procedure|process|protocol|workflow)\b/i.test(term)) return "process";
	if (/\b(score|rate|sum)\b/i.test(text)) return "metric";
	return "other";
}
function overlap(a, b) {
	let n = 0;
	for (const word of a) if (b.has(word)) n += 1;
	return n;
}
function unique(values) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const value of values) {
		const key = value.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(value);
	}
	return out;
}
function round(n) {
	return Math.round(n * 100) / 100;
}
function theoryStatus(status) {
	if (status === "hypothesis" || status === "model" || status === "prediction" || status === "interpretation") return status;
	return "interpretation";
}
var bag = globalThis;
var jobStore = bag.__clefJobs ?? /* @__PURE__ */ new Map();
bag.__clefJobs = jobStore;
var Route$2 = createFileRoute("/api/extract")({ server: { handlers: { POST: async ({ request }) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "bad_json" }, { status: 400 });
	}
	const text = body.text ?? "";
	if (text.length > 1e5) return Response.json({ error: "document_too_large" }, { status: 413 });
	try {
		const job = extractDocument(text, body.tables ?? [], body.resolutions ?? []);
		jobStore.set(job.id, job);
		return Response.json({
			id: job.id,
			status: job.status,
			engine: job.engine,
			threshold: job.threshold,
			output: job.output,
			review_queue: job.review
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "extract_failed";
		return Response.json({ error: message }, { status: message === "empty_document" ? 400 : 500 });
	}
} } } });
var STOP = /* @__PURE__ */ new Set([
	"the",
	"and",
	"for",
	"are",
	"was",
	"were",
	"but",
	"not",
	"you",
	"your",
	"this",
	"that",
	"with",
	"from",
	"have",
	"has",
	"had",
	"what",
	"when",
	"where",
	"which",
	"who",
	"why",
	"how",
	"does",
	"did",
	"can",
	"could",
	"would",
	"should",
	"about",
	"into",
	"than",
	"then",
	"them",
	"they",
	"their",
	"there",
	"been",
	"being",
	"will",
	"just",
	"also",
	"only",
	"over",
	"under",
	"after",
	"before",
	"between",
	"each",
	"other"
]);
function contentTokens(text) {
	return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length > 2 && !STOP.has(token));
}
function embedText(text) {
	const vector = /* @__PURE__ */ new Float32Array(64);
	for (const token of contentTokens(text)) {
		const hash = fnv(token);
		const index = hash % 64;
		vector[index] += hash & 1 ? 1 : -1;
	}
	let norm = 0;
	for (const value of vector) norm += value * value;
	norm = Math.sqrt(norm);
	if (norm > 0) for (let index = 0; index < 64; index++) vector[index] /= norm;
	return vector;
}
function fnv(token) {
	let hash = 2166136261;
	for (let index = 0; index < token.length; index++) {
		hash ^= token.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
var MIN_OVERLAP = .34;
/** Word overlap first. Optional WebGPU scores may only reorder records that already overlap. */
function answerQuestion(query, views, gpuScores) {
	const asked = query.trim();
	const held = views.reduce((sum, view) => sum + view.review_count, 0);
	const gate = views.some((view) => view.status !== "complete") ? "held" : "closed";
	if (!asked) return {
		stance: "empty",
		gate,
		held_records: held,
		scorer: "words",
		text: "Ask a question. The reply can only quote accepted records.",
		hits: [],
		contradictions: []
	};
	if (views.length === 0 || views.every((view) => view.records.length === 0)) return {
		stance: "unspecified",
		gate,
		held_records: held,
		scorer: "words",
		text: held ? "Nothing accepted matches, and the gate is still held. Those rows are not in force." : "The ledger has no accepted records for this question.",
		hits: [],
		contradictions: []
	};
	const queryTokens = contentTokens(asked);
	const hits = [];
	for (const view of views) for (const record of view.records) {
		const overlap = overlapScore(queryTokens, `${record.text} ${record.quote} ${record.label}`);
		if (overlap < MIN_OVERLAP) continue;
		const key = hitKey(view.version_id, record.record_id);
		const gpu = gpuScores?.get(key);
		const score = gpu === void 0 ? overlap : overlap * .55 + Math.max(0, gpu) * .45;
		hits.push({
			version_id: view.version_id,
			version_title: view.title,
			record_id: record.record_id,
			kind: record.kind,
			label: record.label,
			quote: record.quote,
			score
		});
	}
	hits.sort((a, b) => b.score - a.score || a.record_id.localeCompare(b.record_id));
	const top = hits.slice(0, 5);
	const contradictions = contradictionsAmong(views, top);
	for (const link of contradictions) {
		const missing = [link.source_id, link.target_id].filter((id) => !top.some((hit) => hit.version_id === link.version_id && hit.record_id === id));
		for (const id of missing) {
			const view = views.find((item) => item.version_id === link.version_id);
			const record = view?.records.find((item) => item.record_id === id);
			if (!view || !record) continue;
			top.push({
				version_id: view.version_id,
				version_title: view.title,
				record_id: record.record_id,
				kind: record.kind,
				label: record.label,
				quote: record.quote,
				score: 0
			});
		}
	}
	const scorer = gpuScores && gpuScores.size > 0 ? "webgpu" : "words";
	if (top.length === 0) return {
		stance: "unspecified",
		gate,
		held_records: held,
		scorer,
		text: unspecified(gate, held),
		hits: [],
		contradictions: []
	};
	const lines = top.map((hit) => `${hit.version_title} ${hit.record_id} (${hit.kind}, ${hit.label}): ${hit.quote}`);
	const lead = contradictions.length > 0 ? "These accepted records disagree. Neither was dropped." : "Accepted records only.";
	const gateLine = gate === "held" ? `Gate held. ${held} row${held === 1 ? "" : "s"} excluded from this answer.` : "";
	return {
		stance: contradictions.length > 0 ? "conflict" : "grounded",
		gate,
		held_records: held,
		scorer,
		text: [
			gateLine,
			lead,
			...lines
		].filter(Boolean).join("\n"),
		hits: top,
		contradictions
	};
}
function hitKey(versionId, recordId) {
	return `${versionId}:${recordId}`;
}
function overlapScore(queryTokens, text) {
	if (queryTokens.length === 0) return 0;
	const seen = new Set(contentTokens(text));
	let matched = 0;
	for (const token of queryTokens) if (seen.has(token)) matched += 1;
	return matched / queryTokens.length;
}
function contradictionsAmong(views, hits) {
	const found = [];
	for (const view of views) {
		const ids = new Set(hits.filter((hit) => hit.version_id === view.version_id).map((hit) => hit.record_id));
		for (const relation of view.relations) {
			if (relation.relation !== "contradicts") continue;
			if (ids.has(relation.source_id) || ids.has(relation.target_id)) found.push({
				version_id: view.version_id,
				source_id: relation.source_id,
				target_id: relation.target_id
			});
		}
	}
	return found;
}
function unspecified(gate, held) {
	if (gate === "held") return `The accepted ledger does not say. ${held} held row${held === 1 ? " is" : "s are"} not used to fill the gap.`;
	return "The accepted ledger does not say.";
}
function projectLedger(source) {
	const version_id = source.id;
	const records = [];
	for (const concept of source.output.concepts) {
		const quote = concept.definition_quote || concept.term;
		records.push({
			version_id,
			record_id: concept.id,
			kind: "concept",
			label: concept.type,
			text: concept.term,
			quote
		});
	}
	for (const fact of source.output.facts) records.push({
		version_id,
		record_id: fact.id,
		kind: "fact",
		label: `${fact.polarity} · ${fact.time_scope}`,
		text: fact.statement,
		quote: fact.evidence_quote || fact.statement
	});
	for (const theory of source.output.theories) records.push({
		version_id,
		record_id: theory.id,
		kind: "theory",
		label: theory.status,
		text: theory.claim,
		quote: theory.evidence_quote || theory.claim
	});
	for (const workflow of source.output.workflows) workflow.steps.forEach((step, index) => {
		records.push({
			version_id,
			record_id: `${workflow.id}.${step.order || index + 1}`,
			kind: "workflow_step",
			label: step.decision === "yes" ? "decision" : "step",
			text: `${workflow.name}. ${step.actor}: ${step.action}`,
			quote: step.action
		});
	});
	return {
		version_id,
		title: source.title?.trim() || "Document",
		status: source.status,
		engine: source.engine,
		created_at: source.created_at ?? "",
		review_count: source.review_count,
		segments_total: source.output.coverage.segments_total,
		segments_classified: source.output.coverage.segments_classified,
		unassigned: source.output.coverage.unassigned_quotes.length,
		records,
		relations: source.output.relations.map((relation) => ({
			version_id,
			source_id: relation.source_id,
			target_id: relation.target_id,
			relation: relation.relation
		}))
	};
}
var PROTOCOL = "2025-03-26";
function discovery() {
	return {
		protocol: "mcp",
		transport: "streamable-http",
		protocolVersion: PROTOCOL,
		note: "Tools return accepted ledger rows only. Held rows are counted and omitted. This server does not answer from outside the ledger.",
		tools: TOOLS.map((tool) => tool.name)
	};
}
async function mcpResponse(request, corpus) {
	const headers = {
		"access-control-allow-origin": "*",
		"access-control-allow-methods": "GET, POST, OPTIONS",
		"access-control-allow-headers": "content-type, accept, mcp-protocol-version",
		"cache-control": "no-store"
	};
	if (request.method === "OPTIONS") return new Response(null, {
		status: 204,
		headers
	});
	if (request.method === "GET") return Response.json(discovery(), { headers });
	if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, {
		status: 405,
		headers
	});
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json(rpcError(null, -32700, "parse error"), {
			status: 400,
			headers
		});
	}
	if (Array.isArray(body)) {
		const replies = [];
		for (const item of body) {
			const reply = await dispatch(item, corpus);
			if (reply) replies.push(reply);
		}
		if (replies.length === 0) return new Response(null, {
			status: 202,
			headers
		});
		return Response.json(replies, { headers });
	}
	const reply = await dispatch(body, corpus);
	if (!reply) return new Response(null, {
		status: 202,
		headers
	});
	return Response.json(reply, { headers });
}
async function dispatch(message, corpus) {
	if (!message || typeof message !== "object") return rpcError(null, -32600, "invalid request");
	const rpc = message;
	const id = rpc.id ?? null;
	const method = rpc.method ?? "";
	if (!method) return rpcError(id, -32600, "invalid request");
	if (rpc.id === void 0) return null;
	if (method === "initialize") {
		const requested = protocolOf(rpc.params);
		return {
			jsonrpc: "2.0",
			id,
			result: {
				protocolVersion: requested === "2025-06-18" ? requested : PROTOCOL,
				capabilities: { tools: { listChanged: false } },
				serverInfo: {
					name: "clef-ledger",
					version: "1.0.0"
				},
				instructions: "Quote accepted records only. If stance is unspecified, say the document does not say. If stance is conflict, report both records. Never treat a held row as policy."
			}
		};
	}
	if (method === "ping") return {
		jsonrpc: "2.0",
		id,
		result: {}
	};
	if (method === "tools/list") return {
		jsonrpc: "2.0",
		id,
		result: { tools: TOOLS }
	};
	if (method === "tools/call") return toolCall(id, rpc.params, corpus);
	return rpcError(id, -32601, `unknown method ${method}`);
}
async function toolCall(id, params, corpus) {
	const name = params && typeof params === "object" ? String(params.name ?? "") : "";
	const args = argumentsOf(params);
	try {
		const data = await runTool(name, args, corpus);
		return {
			jsonrpc: "2.0",
			id,
			result: {
				content: [{
					type: "text",
					text: JSON.stringify(data)
				}],
				structuredContent: data,
				isError: false
			}
		};
	} catch (error) {
		return {
			jsonrpc: "2.0",
			id,
			result: {
				content: [{
					type: "text",
					text: error instanceof Error ? error.message : "tool_failed"
				}],
				isError: true
			}
		};
	}
}
async function runTool(name, args, corpus) {
	if (name === "list_versions") return { versions: await corpus.list() };
	if (name === "job_status") {
		const versionId = stringArg(args.version_id);
		if (!versionId) throw new Error("version_id is required");
		const view = await corpus.load(versionId);
		if (!view) throw new Error("not_found");
		return statusOf(view);
	}
	if (name === "lookup" || name === "quote_answer") {
		const query = stringArg(args.query);
		if (!query) throw new Error("query is required");
		const versionId = stringArg(args.version_id);
		const views = versionId ? compact(await corpus.load(versionId)) : await corpus.loadAll();
		if (versionId && views.length === 0) throw new Error("not_found");
		const answer = answerQuestion(query, views);
		if (name === "lookup") return {
			stance: answer.stance,
			gate: answer.gate,
			held_records: answer.held_records,
			hits: answer.hits,
			contradictions: answer.contradictions
		};
		return answer;
	}
	if (name === "ingest_document") {
		if (!corpus.ingest) throw new Error("ingest_unavailable");
		const text = stringArg(args.text);
		if (!text.trim()) throw new Error("empty_document");
		if (text.length > 1e5) throw new Error("document_too_large");
		return corpus.ingest(text);
	}
	throw new Error(`unknown tool ${name || "(missing)"}`);
}
function statusOf(view) {
	return {
		version_id: view.version_id,
		title: view.title,
		status: view.status,
		engine: view.engine,
		review_count: view.review_count,
		segments_total: view.segments_total,
		segments_classified: view.segments_classified,
		unassigned: view.unassigned,
		accepted_records: view.records.length,
		note: view.review_count > 0 ? "Held rows are not returned by lookup." : "Gate closed."
	};
}
function compact(view) {
	return view ? [view] : [];
}
function stringArg(value) {
	return typeof value === "string" ? value : "";
}
function argumentsOf(params) {
	if (!params || typeof params !== "object") return {};
	const raw = params.arguments;
	if (typeof raw === "string") try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
	if (raw && typeof raw === "object") return raw;
	return {};
}
function protocolOf(params) {
	if (!params || typeof params !== "object") return PROTOCOL;
	const version = params.protocolVersion;
	return typeof version === "string" ? version : PROTOCOL;
}
function rpcError(id, code, message) {
	return {
		jsonrpc: "2.0",
		id,
		error: {
			code,
			message
		}
	};
}
var TOOLS = [
	{
		name: "list_versions",
		description: "List ingested document versions. Does not return source text or held rows.",
		inputSchema: {
			type: "object",
			properties: {}
		},
		annotations: { readOnlyHint: true }
	},
	{
		name: "job_status",
		description: "Coverage and review count for one version. Held rows are not policy.",
		inputSchema: {
			type: "object",
			properties: { version_id: { type: "string" } },
			required: ["version_id"]
		},
		annotations: { readOnlyHint: true }
	},
	{
		name: "lookup",
		description: "Find accepted records whose quotes overlap the question. Omits held rows. A miss means the document does not say.",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string" },
				version_id: {
					type: "string",
					description: "Omit to search every ingested version."
				}
			},
			required: ["query"]
		},
		annotations: { readOnlyHint: true }
	},
	{
		name: "quote_answer",
		description: "Deterministic answer made only of accepted quotes. stance is grounded, conflict, or unspecified. Do not add facts the hits do not contain.",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string" },
				version_id: { type: "string" }
			},
			required: ["query"]
		},
		annotations: { readOnlyHint: true }
	},
	{
		name: "ingest_document",
		description: "Compile a document into a ledger version. Do not send text that contains patient identifiers. Returns id and gate status, not an answer.",
		inputSchema: {
			type: "object",
			properties: { text: { type: "string" } },
			required: ["text"]
		},
		annotations: { readOnlyHint: false }
	}
];
var seen = /* @__PURE__ */ new Map();
function viewOf(job) {
	if (!seen.has(job.id)) seen.set(job.id, (/* @__PURE__ */ new Date()).toISOString());
	return projectLedger({
		id: job.id,
		status: job.status,
		engine: job.engine,
		title: job.chunks[0]?.heading || "Document",
		created_at: seen.get(job.id),
		review_count: job.review.length,
		output: job.output
	});
}
function summaryOf(job) {
	const view = viewOf(job);
	return {
		version_id: view.version_id,
		title: view.title,
		status: view.status,
		engine: view.engine,
		created_at: view.created_at,
		review_count: view.review_count,
		segments_total: view.segments_total,
		segments_classified: view.segments_classified,
		unassigned: view.unassigned
	};
}
function corpus() {
	return {
		async list() {
			return [...jobStore.values()].map(summaryOf);
		},
		async load(versionId) {
			const job = jobStore.get(versionId);
			return job ? viewOf(job) : null;
		},
		async loadAll() {
			return [...jobStore.values()].map(viewOf);
		},
		async ingest(text) {
			const job = extractDocument(text);
			jobStore.set(job.id, job);
			return {
				version_id: job.id,
				status: job.status,
				review_count: job.review.length
			};
		}
	};
}
var Route$1 = createFileRoute("/api/mcp")({ server: { handlers: {
	GET: async ({ request }) => mcpResponse(request, corpus()),
	POST: async ({ request }) => mcpResponse(request, corpus()),
	OPTIONS: async ({ request }) => mcpResponse(request, corpus())
} } });
var Route = createFileRoute("/api/jobs/$id")({ server: { handlers: { GET: async ({ params }) => {
	const job = jobStore.get(params.id);
	if (!job) return Response.json({ error: "not_found" }, { status: 404 });
	return Response.json({
		id: job.id,
		status: job.status,
		engine: job.engine,
		threshold: job.threshold,
		output: job.output,
		review_queue: job.review
	});
} } } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ApiExtractRoute: Route$2.update({
		id: "/api/extract",
		path: "/api/extract",
		getParentRoute: () => Route$4
	}),
	ApiMcpRoute: Route$1.update({
		id: "/api/mcp",
		path: "/api/mcp",
		getParentRoute: () => Route$4
	}),
	ApiJobsIdRoute: Route.update({
		id: "/api/jobs/$id",
		path: "/api/jobs/$id",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { embedText as a, hitKey as i, projectLedger as n, extractDocument as o, answerQuestion as r, CONFIDENCE_THRESHOLD as s, router_exports as t };
