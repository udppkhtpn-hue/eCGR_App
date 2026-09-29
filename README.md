# CGR 2026 Web App — HTPN

Digital **Clinical Governance Round (Rondaan Tadbir Urus Klinikal)** audit tool for
Hospital Tengku Permaisuri Norashikin (HTPN), Unit Pengurusan Risiko dan Survelan Klinikal.

A mobile-first, bilingual (English / Bahasa Malaysia) form that auditors use to record
ward rounds against the CGR checklists, capture findings and photos, auto-score the OSH section,
and submit to a Google Sheet with an email notification to the CGR coordinator.

## Files

| File | Role |
|---|---|
| `Index.html` | Frontend — the entire UI (HTML + CSS + vanilla JS, single file). Runs inside Google Apps Script via `google.script.run`. |
| `Code.gs` | Backend — Apps Script server: saves submissions to Sheets, uploads photos to Drive, emails the coordinator. |

This is a **Google Apps Script web app**, not a Node/Vite project — there is no build step.
The two files map directly to the two files in the Apps Script editor (`Index`, `Code.gs`).

---

## Live system (as of 29 Sep 2026)

| What | Where | Owner / account |
|---|---|---|
| **Live web app** (share this) | https://shorturl.at/wciBI → `https://script.google.com/macros/s/AKfycbwygLuJptq7t-Qb33gpol1NEixJFjm5dPS_mie3W2yIo9YZ4oolHWXhJnrRPfejMDf1/exec` | Apps Script project in **ffairis@gmail.com** |
| Live deployment ID | `AKfycbwygLuJptq7t-Qb33gpol1NEixJFjm5dPS_mie3W2yIo9YZ4oolHWXhJnrRPfejMDf1` (ends **…MDf1**) | ffairis@gmail.com |
| Responses Sheet "CGR 2026 Responses" | https://docs.google.com/spreadsheets/d/1s66ybd5OGg1iGegeZ88EXFPWSy9idzAkcAaWARKc41E (tab `CGR Responses`) | Owned by **ferwahn@moh.gov.my**, shared to ffairis@gmail.com as Editor |
| Photos folder "CGR 2026 Photos" | https://drive.google.com/drive/folders/1Y0nH3OlWqM18ZT_1udUE5Zi71wsmPnh1 | Owned by **ferwahn@moh.gov.my**, shared to ffairis@gmail.com as Editor |
| Notification email | `CONFIG.NOTIFICATION_EMAIL` in `Code.gs` | CGR Coordinator (Dr. Aina Zuhana) |
| Source repo | https://github.com/udppkhtpn-hue/eCGR_App (private) | — |

The short link (shorturl.at) **cannot be edited**, so always update the existing
`…MDf1` deployment in place rather than creating a new deployment — a new deployment
gets a new URL and the short link would keep pointing at the old version.

### Other Apps Script projects you may run into (NOT live)

| Project | Script ID | Notes |
|---|---|---|
| "CGR Web APP HTPN" (ferwahn@moh.gov.my) | `1OPy1ZKgJKjBFzWXTejYODVnRvfNUYyIweqq2rLh_qAIWgKkVfE4RcmNM` | Older copy; its code has placeholder Sheet/folder IDs. Link-sharing is set to *anyone can edit* — should be restricted. |
| "CGR" (ferwahn@moh.gov.my) | `1oP5xnYbwLMywZ8-ByuKV6-hkceypWgbmXAiqvGCpwfhCXMdrKyNnv85K` | Early draft. |

---

## Updating the live app (standard procedure)

1. Edit `Index.html` / `Code.gs` in this repo, test locally (open `Index.html` in a browser —
   UI works, submit doesn't), commit and push to GitHub.
2. Sign in to **script.google.com as ffairis@gmail.com** and open the CGR project.
3. Paste the new contents:
   - repo `Code.gs` → editor file `Code.gs`
   - repo `Index.html` → editor file `Index`
   - Save (⌘S). Keep the real `SHEET_ID`, `PHOTO_FOLDER_ID` and `NOTIFICATION_EMAIL` values.
4. **Deploy → Manage deployments** → select the deployment ending **…MDf1** → ✏️ **Edit** →
   **Version: New version** → keep *Execute as: Me*, *Who has access: Anyone* → **Deploy**.
5. Open https://shorturl.at/wciBI, submit a test round, and confirm a row appears in the Sheet.

Tip: Claude Code can generate a local "copy page" with one-click Copy buttons for both files
to make step 3 easier — just ask.

### Using clasp instead of copy-paste (optional)

`clasp` on the Mac is currently logged in as **udppkhtpn@moh.gov.my**, which does **not** have
access to the live ffairis@gmail.com project. To push directly:

```bash
clasp logout && clasp login        # sign in as ffairis@gmail.com
```

Then add a `.clasp.json` with the live project's Script ID (Apps Script editor →
⚙️ Project Settings → Script ID), and run `clasp push` followed by
`clasp deploy -i AKfycbwygLuJptq7t-Qb33gpol1NEixJFjm5dPS_mie3W2yIo9YZ4oolHWXhJnrRPfejMDf1`.
Note clasp expects `appsscript.json` in the folder — `clasp pull` it first.

---

## Access / permissions — why submissions can fail

The web app runs with **Execute as: Me**, i.e. as **ffairis@gmail.com** (the account that deployed it).
That account must have **Editor** access to both the Sheet and the Photos folder, which are
owned by ferwahn@moh.gov.my.

If users see *"You do not have access"* / *"You do not have permission"* when submitting:

1. Sign in as ferwahn@moh.gov.my and check the Sheet and Photos folder are still shared
   with ffairis@gmail.com as Editor.
2. Check the `SHEET_ID` / `PHOTO_FOLDER_ID` in the live `Code.gs` are the real IDs (not
   `PASTE_YOUR_…` placeholders).
3. If the project was redeployed from a different account, that account needs the same sharing.

MOH Google Workspace may block sharing to external Gmail accounts; if so, create a new Sheet
and folder inside ffairis@gmail.com and update the IDs in `Code.gs` (the script creates the
`CGR Responses` tab and headers automatically on first submit).

---

## Checklists

Defined in the `CHECKLISTS` array in `Index.html`.

| No. | Checklist | Unit |
|---|---|---|
| 1 | Pemerhatian Am Wad | Ketua Kumpulan |
| 2 | Keselamatan Kebakaran | Unit Penyelia Hospital |
| 3 | Kawalan Infeksi | UKI |
| 4–10 | Kejururawatan | Unit Kejururawatan |
| 11 | Kualiti | Unit Kualiti HKJ |
| 12 | Pengurusan Aset | Unit Aset |
| 13 | Perkhidmatan Kejuruteraan | Unit Kejuruteraan |
| 14 | Jabatan Kecemasan (ETD) | Kumpulan CGR |
| 16 | Unit Dietetik dan Sajian (JDS) | Kumpulan CGR |
| 17 | Pemeriksaan Tempat Kerja OSH (scored Ya/Tidak/TB) | UKA / OSH — KKM 2024 |
| 18 | **Medikolegal — Unit Forensik** (added Sep 2026) | Unit Medikolegal & Etika |

### Checklist 18 — Medikolegal (Unit Forensik)

Source: `HTPN_CGR_Medikolegal_Checklist 2026.docx` from Unit Medikolegal & Etika (kept out of git).
34 items in five domains:

- **A. Dokumentasi Am & Integriti Rekod** (A1–A8)
- **B. Pengenalpastian Kematian / Kes & Proses Penerimaan** (B1–B6)
- **C. Dokumentasi Pemeriksaan Forensik / Bedah Siasat** (C1–C8)
- **D. Spesimen, Bahan Bukti & Rantaian Jagaan** (D1–D6)
- **E. Laporan, Sijil & Tadbir Urus Pelepasan** (E1–E6)

Differences from the paper form:
- Uses the app's 4 statuses (Patuh / Perlu Penambahbaikan / Tidak Patuh / T/B) instead of C / NC / NA.
- "No. of records checked" and "Location" have no dedicated fields — the section note asks
  auditors to record them under *Lain-lain Perkara*.
- BM translation was done by Claude Code; key terms (jenazah, bedah siasat, rantaian jagaan,
  bahan bukti, catatan lewat) should be confirmed by Unit Medikolegal.

### Adding or editing a checklist

Standard checklist shape:

```js
{
  id: "cl18", num: "18", title: "…", subtitle: "…",
  note: "BM note shown at top of section",          // optional
  note_en: "English note",                          // optional
  items: [
    { group: "A. BM heading", group_en: "A. English heading",   // optional, starts a sub-heading
      bil: "A1", perkara: "BM text", perkara_en: "English text" },  // perkara_en optional
    { bil: "A2", perkara: "…", perkara_en: "…" },
  ]
}
```

- `perkara` (BM) is what gets written to the Sheet; `perkara_en` / `group_en` / `note_en`
  are only shown when the EN toggle is active. Checklists without `_en` fields show BM in both modes.
- `id` must be unique; `bil` must be unique within a checklist (used as the field key).
- The OSH checklist (`isOSH: true`) uses a separate `sections` shape and scoring renderer.
- `Code.gs` needs no change when adding checklists — it writes one Sheet row per item.

---

## Repo conventions

- `Index.html` is **UTF-8 with BOM and CRLF line endings** (as exported from Apps Script).
  Preserve these when editing with scripts, or the git diff will show every line changed.
- Word/Excel source documents are not committed.
- Keep this repo in sync manually after any edit made directly in the Apps Script editor.

## First-time setup (new Apps Script project)

1. Go to [script.google.com](https://script.google.com) → **New Project** → name it "CGR 2026 Web App".
2. Create two files matching this repo: `Code.gs` and `Index` (HTML) — paste contents.
3. In `Code.gs`, set `CONFIG`: `SHEET_ID`, `NOTIFICATION_EMAIL`, `PHOTO_FOLDER_ID`.
4. **Deploy → New Deployment → Web App** — Execute as: **Me**; Who has access: **Anyone**.
5. Share the Sheet and Photos folder with the deploying account (Editor) if it doesn't own them.
6. Share the Web App URL with the CGR team.

## Change log

| Date | Change |
|---|---|
| 8 Sep 2026 | Initial source backup to git. |
| 29 Sep 2026 | Added checklist 18 Medikolegal — Unit Forensik (BM + EN). Pushed to GitHub `udppkhtpn-hue/eCGR_App`. Fixed "no access" on submit by sharing Sheet + Photos folder with ffairis@gmail.com; redeployed live `…MDf1` deployment in place. |
