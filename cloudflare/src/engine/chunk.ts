import { formatId, wordCount } from "./text.ts";

export interface Section {
  level: number;
  title: string;
  path: string;
  body: string;
  words: number;
}

export interface PackedChunk {
  id: string;
  heading: string;
  word_count: number;
  text: string;
  sections: Section[];
}

const MIN_WORDS = 1500;
const MAX_WORDS = 2500;

export function parseSections(text: string): Section[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const raw: { level: number; title: string; bodyLines: string[] }[] = [];
  let current: { level: number; title: string; bodyLines: string[] } | null = null;
  let sawHeading = false;

  for (const line of lines) {
    const heading = headingOf(line);
    if (heading) {
      if (current && (sawHeading || current.bodyLines.some((row) => row.trim()))) {
        raw.push(current);
      }
      sawHeading = true;
      current = { level: heading.level, title: heading.title, bodyLines: [] };
    } else {
      if (!current) current = { level: 1, title: "Document", bodyLines: [] };
      current.bodyLines.push(line);
    }
  }
  if (current && (sawHeading || current.bodyLines.some((row) => row.trim()))) {
    raw.push(current);
  }

  const stack: { level: number; title: string }[] = [];
  const sections: Section[] = [];
  for (const section of raw) {
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }
    stack.push({ level: section.level, title: section.title });
    const body = section.bodyLines.join("\n").trim();
    const path = stack.map((item) => item.title).join(" > ");
    sections.push({
      level: section.level,
      title: section.title,
      path,
      body,
      words: wordCount(`${section.title} ${body}`),
    });
  }
  return sections;
}

export function chunkDocument(text: string): PackedChunk[] {
  const source = text.replace(/\r\n/g, "\n").trim();
  if (!source) return [];
  const sections = parseSections(source);
  const groups: Section[][] = [];
  let current: Section[] = [];
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
    const rendered = group
      .map((section) => `${"#".repeat(Math.min(section.level, 6))} ${section.title}\n\n${section.body}`)
      .join("\n\n")
      .trim();
    return {
      id: formatId("K", index + 1),
      heading,
      word_count: wordCount(rendered),
      text: rendered,
      sections: group,
    };
  });
}

function splitLarge(section: Section): Section[] {
  const paragraphs = section.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [section];
  const parts: Section[] = [];
  let buf: string[] = [];
  let count = 0;
  const push = () => {
    if (buf.length === 0) return;
    const body = buf.join("\n\n");
    parts.push({
      ...section,
      body,
      words: wordCount(`${section.title} ${body}`),
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

function headingOf(line: string): { level: number; title: string } | null {
  const markdown = /^(#{1,6})\s+(\S.*)$/.exec(line.trim());
  if (markdown) return { level: markdown[1].length, title: markdown[2].trim() };
  const title = line.trim();
  if (!title || title.length > 72 || /[.!?]$/.test(title)) return null;
  if (/^(?:[-*•]|\d+[.)])\s+/.test(title)) return null;
  const words = title.split(/\s+/);
  if (words.length > 8) return null;
  if (title === title.toUpperCase() && /[A-Z]/.test(title)) return { level: 2, title };
  return null;
}
