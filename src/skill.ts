import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MARKER_BEGIN = "<!-- BEGIN:prdstudio-skill -->";
const MARKER_END = "<!-- END:prdstudio-skill -->";

function skillBlock(): string {
  return [
    MARKER_BEGIN,
    "## PRD Studio Agent Loop",
    "",
    "Kamu akan mengerjakan task dari PRD Studio lewat CLI `npx prdstudio`.",
    "",
    "Prasyarat: Node.js terpasang (cek `node -v`). CLI otomatis ter-download saat dijalankan lewat",
    "`npx` — tidak perlu install manual.",
    "",
    "Langkah 1 — login (sekali saja per mesin, lewati kalau sudah pernah login):",
    "npx prdstudio login --token <token> --url <baseUrl>",
    "",
    "Langkah 2 — baca PRD dulu (konteks project, sekali di awal sesi, sebelum mengambil task apa pun):",
    "npx prdstudio get-prd",
    "Pahami tujuan produk, fitur, dan tech stack-nya dulu sebelum mulai kerja.",
    "",
    "Langkah 3 — LOOP: kerjakan SATU card per satu. Server yang menentukan card berikutnya,",
    "jangan menebak urutan sendiri.",
    "1. npx prdstudio task next --json",
    "   -> card: null berarti seluruh board sudah selesai, berhenti total.",
    '2. Kerjakan tiap item di "checklist" card ini satu per satu, lalu tandai selesai:',
    "   npx prdstudio checklist done <itemId>",
    "   (pakai `checklist error <itemId>` kalau task itu gagal/butuh keputusan manusia — JANGAN",
    "   auto-retry, JANGAN lanjut ke checklist berikutnya sebelum ini diselesaikan manusia)",
    "3. Setelah seluruh checklist card ini selesai, card otomatis pindah ke Done. Tulis ringkasan",
    "   singkat 1-2 kalimat tentang apa yang dikerjakan (dipakai sebagai konteks task berikutnya):",
    '   npx prdstudio card move <cardId> --to done --summary "ringkasan singkat di sini"',
    "4. Ulangi dari langkah 1 untuk card berikutnya.",
    "",
    "Berhenti dan tunggu keputusan manusia kalau ada card/checklist berstatus error — jangan mencoba",
    "memperbaikinya sendiri secara diam-diam.",
    MARKER_END,
  ].join("\n");
}

/**
 * Writes/updates a marked block in AGENTS.md at `cwd` — the convention several
 * coding agents (Claude Code included) auto-load on session start, so the
 * loop above gets picked up without the user pasting a prompt manually.
 * Idempotent: re-running `init` replaces the existing block instead of
 * duplicating it, keyed by the BEGIN/END HTML-comment markers.
 */
export function writeSkillFile(cwd: string = process.cwd()): { path: string; created: boolean } {
  const path = join(cwd, "AGENTS.md");
  const block = skillBlock();

  if (!existsSync(path)) {
    writeFileSync(path, `# Agent Instructions\n\n${block}\n`, "utf8");
    return { path, created: true };
  }

  const existing = readFileSync(path, "utf8");
  const beginIdx = existing.indexOf(MARKER_BEGIN);
  const endIdx = existing.indexOf(MARKER_END);

  if (beginIdx !== -1 && endIdx !== -1) {
    const updated = existing.slice(0, beginIdx) + block + existing.slice(endIdx + MARKER_END.length);
    writeFileSync(path, updated, "utf8");
  } else {
    const separator = existing.endsWith("\n") ? "\n" : "\n\n";
    writeFileSync(path, `${existing}${separator}${block}\n`, "utf8");
  }

  return { path, created: false };
}
