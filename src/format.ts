import type { CardCurrentResponse, CardOut, ChecklistStatus, PrdResponse, TaskNextResponse } from "./types.js";

function checkbox(status: ChecklistStatus): string {
  if (status === "done") return "x";
  if (status === "error") return "!";
  return " ";
}

function formatCard(card: CardOut, previousSummary?: string | null): string {
  const lines = [`Card: ${card.title} [${card.status}]`];
  if (card.description) lines.push(card.description);
  if (previousSummary) lines.push("", `Ringkasan task sebelumnya: ${previousSummary}`);
  if (card.checklist && card.checklist.length > 0) {
    lines.push("", "Checklist:");
    for (const item of card.checklist) {
      lines.push(`  [${checkbox(item.status)}] ${item.title} (${item.id})`);
    }
  }
  return lines.join("\n");
}

export function formatTaskNext(data: TaskNextResponse): string {
  if (!data.card) return "Tidak ada task berikutnya — board kosong atau sudah selesai semua.";
  return formatCard(data.card, data.previousSummary);
}

export function formatCardCurrent(data: CardCurrentResponse): string {
  if (!data.card) return "Tidak ada card yang sedang in_progress.";
  return formatCard(data.card);
}

export function formatPrd(data: PrdResponse): string {
  if (!data.project) return "Project tidak ditemukan.";
  const lines = [`Project: ${data.project.name} [${data.project.mode}, ${data.project.status}]`];
  if (data.project.description) lines.push(data.project.description);
  lines.push("");
  if (!data.prd) {
    lines.push("Belum ada draft PRD untuk project ini.");
  } else {
    lines.push(`--- PRD v${data.prd.versionNumber} ---`, "", data.prd.contentMd);
  }
  return lines.join("\n");
}
