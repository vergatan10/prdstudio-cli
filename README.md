# prdstudio-cli

Command-line wrapper privat untuk REST API `/api/cli/*` milik [PRD Studio](https://github.com/vergatan10/prd-studio).
Dipakai AI coding agent (atau manusia) untuk mengambil task dari kanban board, mengerjakannya, dan
update status — tanpa menyusun `curl` manual tiap kali.

Ini **bukan** package publik. Tidak pernah di-`npm publish`, tidak terdaftar di npm registry mana
pun — install langsung dari repo GitHub ini. Lihat
[`docs/4.PRD_CLI_MCP_Agent_Tooling_v1.md`](https://github.com/vergatan10/prd-studio/blob/main/docs/4.PRD_CLI_MCP_Agent_Tooling_v1.md)
di repo utama untuk konteks produk lengkap.

CLI ini murni HTTP client tipis — tidak ada logic bisnis di sini. Semua auto-transition status card
dan validasi ada di server (`/api/cli/*`), sumber kebenaran satu-satunya.

## Install

```bash
npm install -g github:vergatan10/prdstudio-cli#v1.0.0
```

Butuh Node.js ≥ 18. Instalasi lewat repo GitHub privat/public seperti ini otomatis menjalankan
`npm run build` (lewat `prepare` script) sebelum bin `prdstudio` dipakai — tidak perlu langkah
build manual.

## Setup

```bash
prdstudio login --token pk_xxxxxxxxxxxxxxxx --url https://prdstudio.app
```

Token didapat dari halaman **Token CLI/Agent** di `/projects/<id>/settings` pada web app. Config
tersimpan di `~/.prdstudio/config.json` dengan permission `600`.

> **Jangan commit file config ini ke mana pun** — token di dalamnya plaintext (perlu dipakai ulang,
> tidak bisa di-hash). Kalau device hilang/dicuri, revoke token lewat UI Token Manager di web app —
> `prdstudio logout` di sini hanya menghapus file lokal, tidak me-revoke token di server.

Untuk CI/skrip tanpa file config, override lewat env var:

```bash
export PRDSTUDIO_TOKEN=pk_xxxxxxxxxxxxxxxx
export PRDSTUDIO_URL=https://prdstudio.app
```

## Commands

```bash
prdstudio login --token <token> --url <baseUrl>
prdstudio logout

prdstudio task next [--json]
prdstudio card current [--json]
prdstudio checklist done <itemId> [--json]
prdstudio checklist error <itemId> [--json]
prdstudio card move <cardId> --to <todo|in_progress|done|error> [--summary "..."] [--json]
```

Tiap command punya flag `--json` untuk output mesin-terbaca (dipakai agent); tanpa flag itu,
outputnya human-readable. Exit code non-zero + pesan error kalau API mengembalikan 401/404/400.

## Contoh loop agent

```bash
while true; do
  task=$(prdstudio task next --json)
  card_id=$(echo "$task" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).card?.id ?? ''")
  if [ -z "$card_id" ]; then
    echo "Board selesai."
    break
  fi
  # ...agent mengerjakan checklist item satu per satu, lalu:
  prdstudio card move "$card_id" --to done --summary "Ringkasan pekerjaan yang selesai"
done
```

CLI ini **tidak** menyediakan mode eksekusi otomatis penuh (`prdstudio loop`) — itu di luar
cakupan v1: primitives saja, logic "kerjakan task ini" tetap tanggung jawab agent yang
memanggilnya.

## MCP alternative

Kalau agent-mu mendukung Model Context Protocol native (mis. Claude Code), kamu bisa skip CLI ini
sepenuhnya dan connect langsung ke MCP server yang sudah di-hosting di
`https://prdstudio.app/api/mcp` (Streamable HTTP, auth `Authorization: Bearer <token>` yang sama).
Lihat bagian "MCP server (`/api/mcp`)" di README repo utama.

## Development

```bash
npm install
npm run dev -- task next --json   # jalankan langsung dari source lewat tsx, tanpa build
npm run build                     # compile src/ -> dist/
```

## Keamanan

- Token tidak pernah ikut ke kode/commit — selalu di `~/.prdstudio/config.json` (permission 600)
  atau env var.
- Tidak ada telemetry pihak ketiga.
- Tidak ada dependency yang mengirim data pemakaian keluar.
