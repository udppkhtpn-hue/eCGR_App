# CGR 2026 Web App — HTPN

Digital **Clinical Governance Round (Rondaan Tadbir Urus Klinikal)** audit tool for
Hospital Tengku Permaisuri Norashikin (HTPN), Unit Pengurusan Risiko dan Survelan Klinikal.

A mobile-first, bilingual (English / Bahasa Malaysia) form that auditors use to record
ward rounds against 17 checklists, capture findings and photos, auto-score the OSH section,
and submit to a Google Sheet with an email notification to the CGR coordinator.

## Files

| File | Role |
|---|---|
| `Index.html` | Frontend — the entire UI (HTML + CSS + vanilla JS, single file). Runs inside Google Apps Script via `google.script.run`. |
| `Code.gs` | Backend — Apps Script server: saves submissions to Sheets, uploads photos to Drive, emails the coordinator. |

This is a **Google Apps Script web app**, not a Node/Vite project — there is no build step.
The two files map directly to the two files in the Apps Script editor (`Index.html`, `Code.gs`).

## Deploying (Google Apps Script)

1. Go to [script.google.com](https://script.google.com) → **New Project** → name it "CGR 2026 Web App".
2. Create two files matching this repo: `Code.gs` and `Index.html` (paste contents).
3. In `Code.gs`, set `CONFIG`:
   - `SHEET_ID` — the target Google Sheet ID.
   - `NOTIFICATION_EMAIL` — coordinator's email.
   - `PHOTO_FOLDER_ID` — Drive folder for uploaded photos.
4. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: your organisation, or Anyone.
5. Share the Web App URL with the CGR team.

## Notes

- The submit / photo-upload flow only works inside the Apps Script runtime (it depends on
  `google.script.run`). Opening `Index.html` locally previews the UI but cannot submit.
- After editing the app in the Apps Script editor, re-export the changed files back here to
  keep this repo in sync — there is no automatic sync.
