import type { CardCurrentResponse, CardOut, ChecklistStatus, TaskNextResponse } from "./types.js";

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
