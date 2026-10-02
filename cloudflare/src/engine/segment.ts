import { chunkDocument } from "./chunk.ts";
import { formatId, splitSentences, wordCount } from "./text.ts";
import type { Chunk, TableInput, Unit } from "./types.ts";

export interface Segmented {
  chunks: Chunk[];
  units: Unit[];
}

export function segmentDocument(text: string, tables: TableInput[] = []): Segmented {
  const packed = chunkDocument(text);
  const units: Unit[] = [];
  for (const chunk of packed) {
    for (const section of chunk.sections) {
      for (const sentence of sentencesIn(section.body)) {
        units.push({
          id: "",
          chunk_id: chunk.id,
          ordinal: units.length + 1,
          section_path: section.path,
          text: sentence,
          from_table: false,
          list_order: listOrder(sentence),
        });
      }
    }
  }
  for (const table of tables) {
    const name = table.name?.trim() || "Untitled";
    const section = `Table: ${name}`;
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
        list_order: null,
      });
    }
  }
  units.forEach((unit, index) => {
    unit.id = formatId("U", index + 1);
    unit.ordinal = index + 1;
  });
  const chunks: Chunk[] = packed.map((chunk) => ({
    id: chunk.id,
    heading: chunk.heading,
    word_count: chunk.word_count,
    text: chunk.text,
  }));
  if (chunks.length === 0 && units.length > 0) {
    chunks.push({ id: "K001", heading: "Document", word_count: wordCount(text), text });
  }
  return { chunks, units };
}

function sentencesIn(body: string): string[] {
  const lines = body.split("\n");
  const out: string[] = [];
  let prose: string[] = [];
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
      const rest = marker ? marker[2] : trimmed;
      const pieces = splitSentences(rest);
      if (pieces.length <= 1) out.push(trimmed);
      else out.push(...pieces);
      continue;
    }
    prose.push(trimmed);
  }
  flush();
  return out.filter((sentence) => wordCount(sentence) > 0);
}

function isListLine(line: string): boolean {
  return /^(?:[-*•]|\d+[.)])\s+\S/.test(line);
}

function listOrder(text: string): number | null {
  const match = /^(\d+)[.)]\s+/.exec(text);
  if (!match) return null;
  return Number(match[1]);
}
