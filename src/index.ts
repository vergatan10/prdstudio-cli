#!/usr/bin/env node
import { Command } from "commander";
import { clearConfig, configPath, saveConfig } from "./config.js";
import { ApiError, apiRequest } from "./api.js";
import { formatCardCurrent, formatTaskNext } from "./format.js";
import type {
  CardCurrentResponse,
  CardMoveResponse,
  CardStatus,
  ChecklistUpdateResponse,
  TaskNextResponse,
} from "./types.js";

const VALID_CARD_STATUSES: CardStatus[] = ["todo", "in_progress", "done", "error"];

async function run<T>(fn: () => Promise<T>, json: boolean, human: (data: T) => string): Promise<void> {
  try {
    const data = await fn();
    console.log(json ? JSON.stringify(data, null, 2) : human(data));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : undefined;
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      console.log(JSON.stringify({ error: message, status }));
    } else {
      console.error(`Error${status ? ` (${status})` : ""}: ${message}`);
    }
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name("prdstudio")
  .description("CLI privat untuk PRD Studio Agent API (/api/cli/*) — lihat docs/4.PRD_CLI_MCP_Agent_Tooling_v1.md")
  .version("1.0.0");

program
  .command("login")
  .description("Simpan token + base URL project ke ~/.prdstudio/config.json")
  .requiredOption("--token <token>", "Token CLI/Agent project, dari /projects/:id/settings di web app")
  .requiredOption("--url <baseUrl>", "Base URL PRD Studio, mis. https://prdstudio.app")
  .action((opts: { token: string; url: string }) => {
    saveConfig({ token: opts.token, baseUrl: opts.url });
    console.log(`Tersimpan di ${configPath()} (permission 600).`);
    console.log(`Base URL: ${opts.url}`);
  });

program
  .command("logout")
  .description("Hapus config lokal (TIDAK me-revoke token di server — pakai UI Token Manager untuk itu)")
  .action(() => {
    clearConfig();
    console.log("Config lokal dihapus. Token masih aktif di server sampai di-revoke lewat UI Token Manager.");
  });

const task = program.command("task").description("Aksi terkait task/card aktif berikutnya");
task
  .command("next")
  .description("Ambil card aktif berikutnya + checklist + ringkasan task sebelumnya")
  .option("--json", "Output JSON mesin-terbaca")
  .action(async (opts: { json?: boolean }) => {
    await run<TaskNextResponse>(
      () => apiRequest<TaskNextResponse>("GET", "/api/cli/task/next"),
      !!opts.json,
      formatTaskNext
    );
  });

const checklist = program.command("checklist").description("Update status item checklist");
checklist
  .command("done <itemId>")
  .description("Tandai checklist item selesai")
  .option("--json", "Output JSON mesin-terbaca")
  .action(async (itemId: string, opts: { json?: boolean }) => {
    await run<ChecklistUpdateResponse>(
      () => apiRequest<ChecklistUpdateResponse>("POST", `/api/cli/checklist/${itemId}`, { status: "done" }),
      !!opts.json,
      (data) => `Checklist item ${itemId} ditandai done. Card status sekarang: ${data.cardStatus}.`
    );
  });

checklist
  .command("error <itemId>")
  .description("Tandai checklist item gagal")
  .option("--json", "Output JSON mesin-terbaca")
  .action(async (itemId: string, opts: { json?: boolean }) => {
    await run<ChecklistUpdateResponse>(
      () => apiRequest<ChecklistUpdateResponse>("POST", `/api/cli/checklist/${itemId}`, { status: "error" }),
      !!opts.json,
      (data) => `Checklist item ${itemId} ditandai error. Card status sekarang: ${data.cardStatus}.`
    );
  });

const card = program.command("card").description("Aksi terkait card kanban");
card
  .command("current")
  .description("Ambil card yang sedang in_progress (kalau ada)")
  .option("--json", "Output JSON mesin-terbaca")
  .action(async (opts: { json?: boolean }) => {
    await run<CardCurrentResponse>(
      () => apiRequest<CardCurrentResponse>("GET", "/api/cli/card/current"),
      !!opts.json,
      formatCardCurrent
    );
  });

card
  .command("move <cardId>")
  .description("Pindahkan card ke kolom lain")
  .requiredOption("--to <status>", `Kolom tujuan: ${VALID_CARD_STATUSES.join("|")}`)
  .option("--summary <summary>", "Ringkasan (disimpan ke card kalau --to done)")
  .option("--json", "Output JSON mesin-terbaca")
  .action(async (cardId: string, opts: { to: string; summary?: string; json?: boolean }) => {
    if (!VALID_CARD_STATUSES.includes(opts.to as CardStatus)) {
      console.error(`Error: --to harus salah satu dari ${VALID_CARD_STATUSES.join("|")}`);
      process.exitCode = 1;
      return;
    }
    await run<CardMoveResponse>(
      () =>
        apiRequest<CardMoveResponse>("POST", `/api/cli/card/${cardId}/move`, {
          to: opts.to,
          summary: opts.summary,
        }),
      !!opts.json,
      () => `Card ${cardId} dipindah ke ${opts.to}.`
    );
  });

program.parseAsync(process.argv);
