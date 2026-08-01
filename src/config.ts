import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync, chmodSync } from "node:fs";

const CONFIG_DIR = join(homedir(), ".prdstudio");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface StoredConfig {
  baseUrl: string;
  token: string;
}

export function loadConfig(): StoredConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as StoredConfig;
  } catch {
    return null;
  }
}

/** Written with mode 600 — the token inside is plaintext, this is the only mitigation (see PRD NFR). */
export function saveConfig(config: StoredConfig): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
  chmodSync(CONFIG_PATH, 0o600);
}

/** Only removes the local file — does NOT revoke the token server-side (that's the UI Token Manager's job). */
export function clearConfig(): void {
  if (existsSync(CONFIG_PATH)) unlinkSync(CONFIG_PATH);
}

export function configPath(): string {
  return CONFIG_PATH;
}
