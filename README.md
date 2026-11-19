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
| Live Apps Script project "CGR 2026 Web App" | Script ID `16BW-tc_F5fxUsJZbWlt-l1jbX8e9Twe0n7MT80iJX3rwX928bZSXEP_Q` | ffairis@gmail.com |
| Live deployment ID | `AKfycbwygLuJptq7t-Qb33gpol1NEixJFjm5dPS_mie3W2yIo9YZ4oolHWXhJnrRPfejMDf1` (ends **…MDf1**) — version 4 as of 19 Nov 2026 | ffairis@gmail.com |
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

clasp logins per machine:

| Machine | Default clasp login | Live-project login |
|---|---|---|
| Mac | udppkhtpn@moh.gov.my (no access to live project) | not set up |
| Windows PC | ferwahn@moh.gov.my (sees only the non-live projects) | `--user ffairis` (ffairis@gmail.com) |

**One-time:** add a named login for ffairis@gmail.com without replacing the default one:

```bash
clasp login --user ffairis          # browser opens → pick ffairis@gmail.com → Allow
clasp list --user ffairis           # should show "CGR 2026 Web App"
```

If clasp says the Apps Script API is disabled, turn it on at
https://script.google.com/home/usersettings (signed in as ffairis@gmail.com).

**Each deploy** — work from a scratch folder outside the repo, not the repo itself:

1. `clasp clone 16BW-tc_F5fxUsJZbWlt-l1jbX8e9Twe0n7MT80iJX3rwX928bZSXEP_Q --user ffairis`
   (in an empty folder; gives `Code.js`, `Index.html`, `appsscript.json`).
2. Compare the cloned files with the repo's last commit. If they differ, someone edited in the
   Apps Script editor — bring those edits into the repo first, or the push will overwrite them.
3. Copy repo `Code.gs` → `Code.js` and repo `Index.html` → `Index.html`, **stripping the BOM**
   from `Index.html` (the live file has none; a BOM before `<!DOCTYPE>` can trigger quirks mode).
4. `clasp push --force --user ffairis`
5. `clasp deploy -i AKfycbwygLuJptq7t-Qb33gpol1NEixJFjm5dPS_mie3W2yIo9YZ4oolHWXhJnrRPfejMDf1 -d "<what changed>" --user ffairis`
   — the `-i` updates the existing **…MDf1** deployment in place, so the short link keeps working.
6. `clasp deployments --user ffairis` to confirm …MDf1 moved to the new version, then test via the short link.

Why not push straight from the repo: the repo's `Index.html` has a BOM and the folder holds files
(README, PDFs, helper pages) that clasp would otherwise try to upload.

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

| No. | `id` | Checklist | Unit |
|---|---|---|---|
| 1 | cl1 | Pemerhatian Am Wad | Ketua Kumpulan |
| 2 | cl2 | Keselamatan Kebakaran | Unit Penyelia Hospital |
| 3 | cl3 | Kawalan Infeksi | UKI |
| 4 | cl4 | Kejururawatan | Unit Kejururawatan |
| 5 | cl11 | Kualiti | Unit Kualiti HKJ |
| 6 | cl12 | Pengurusan Aset | Unit Aset |
| 7 | cl13 | Perkhidmatan Kejuruteraan | Unit Kejuruteraan |
| 8 | cl14 | Jabatan Kecemasan (ETD) | Kumpulan CGR |
| 9 | cl16 | Unit Dietetik dan Sajian (JDS) | Kumpulan CGR |
| 10 | cl17 | Pemeriksaan Tempat Kerja OSH (scored Ya/Tidak/TB) | UKA / OSH — KKM 2024 |
| 11 | cl18 | **Medikolegal** — Medico-Legal Documentation Audit (Nov 2026) | Unit Medikolegal & Etika |

Numbering was made sequential on 19 Nov 2026 (previously 1–3, 4–10, 11–14, 16–18). Item numbers
are prefixed with the checklist number (e.g. Kualiti 5.1–5.7; Kejururawatan 4.1–4.47). The
internal `id`s were kept unchanged because the code uses them as keys (e.g. `#section-cl17` for
OSH scoring). Sheet rows submitted before that date carry the old numbers.

### Checklist 11 — Medikolegal (Medico-Legal Documentation Audit)

Source: `CGR AUDIT FORM.pdf` — the general "Medico-Legal Documentation Audit Form" (kept out of git).
Replaced the earlier 34-item Unit Forensik checklist in Nov 2026. 11 items (bil 11.1–11.11):

Date and Time · Header · Signature and Stamp · Mistake Rectification · Handwriting Legibility ·
Inappropriate Abbreviation · Investigation Reports Review · Prescription Slip · Consent Form ·
Record Keeping · Remedial Actions Taken for Medicolegal Cases (if applicable) and Others.

Differences from the paper form:
- C / NC / NA map to the app's statuses Patuh / Tidak Patuh / T/B (the app also offers
  *Perlu Penambahbaikan*).
- *Remarks/Issues* → each item's *Penemuan* field; the "picture proof" appendix → each item's photo.
- *Recommendation* and *Department Feedback* have no dedicated fields — the section note asks
  auditors to record them under *Lain-lain Perkara*.
- Date/Time, Department/Ward and Auditor come from the round's existing Visit Info fields.
- BM translation was done by Claude Code; should be confirmed by Unit Medikolegal.

### Adding or editing a checklist

Standard checklist shape:

```js
{
  id: "cl19", num: "12", title: "…", subtitle: "…",   // next new checklist
  note: "BM note shown at top of section",          // optional
  note_en: "English note",                          // optional
  items: [
    { group: "A. BM heading", group_en: "A. English heading",   // optional, starts a sub-heading
      bil: "12.1", perkara: "BM text", perkara_en: "English text" },  // perkara_en optional
    { bil: "12.2", perkara: "…", perkara_en: "…" },
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
  `.gitattributes` stores it byte-for-byte (`-text`) so Git never converts it; other files are LF.
  Still preserve the BOM/CRLF when editing with scripts, or the diff will show every line changed.
- Word/Excel source documents are not committed.
- Keep this repo in sync manually after any edit made directly in the Apps Script editor.

## Working on another computer (e.g. Windows work PC)

The repo is worked on from both the Mac and a Windows PC. GitHub is the hand-off point.

**One-time setup on Windows** (needs Git for Windows and the Claude desktop app):

1. Open Claude Desktop → **Code** tab, start a session in the folder where you keep projects.
2. Ask Claude: *"Clone https://github.com/udppkhtpn-hue/eCGR_App.git here, then read the README."*
   - If GitHub asks you to sign in, use the **udppkhtpn-hue** account (the repo is private). A different
     GitHub account must first be added as a collaborator on the repo.
   - No line-ending config is needed — `.gitattributes` handles it.
3. Start a new Code session in the cloned `eCGR_App` folder and work as normal.

**Things that do NOT come across via GitHub:**

| Item | How to bring it over |
|---|---|
| Claude's memory for this project (IDs, owners) | Stored per machine. The same facts are in this README — tell Claude to read it first. |
| Global `CLAUDE.md` (house style, git rules) | Copy `~/.claude/CLAUDE.md` from the Mac to `C:\Users\<you>\.claude\CLAUDE.md`. |
| `HTPN_CGR_Medikolegal_Checklist 2026.docx` | Not in git — copy via USB/Drive if needed. |
| `clasp` login | Per machine. Windows PC already has `--user ffairis`; otherwise use the copy-paste deploy (ask Claude for the "copy page"). |

**Every session, on either machine:**

1. `git pull` before you start.
2. Commit and `git push` when you finish, so the other machine gets the changes.
3. Deploying is the same everywhere: paste into the ffairis@gmail.com Apps Script project →
   **Manage deployments → …MDf1 → Edit → New version** — or, on the Windows PC, use clasp
   (see *Using clasp* above).

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
| 29 Sep 2026 | Restyled app in HIO house dark theme (jump nav, per-checklist counters, collapsible findings, pre-submit tally); fixed answers being wiped on re-render and "New Round" carrying over old statuses. |
| 19 Nov 2026 | Added `.gitattributes` and Windows PC setup steps so the repo can be worked on from both machines. |
| 19 Nov 2026 | Replaced checklist 18 with the general Medico-Legal Documentation Audit form (11 items). Set up clasp `--user ffairis` on the Windows PC and deployed via clasp → live …MDf1 now version 4. |
