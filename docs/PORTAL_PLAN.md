# CGR Portal — Build Plan

Turn the single-form CGR 2026 app into a one-stop **CGR Portal**: units record their section of a
round, UPRSK compiles, Ketua UPRSK and the Pengarah approve, the department responds, and every
report is generated in the **UPRSK report format** (§4). Same live deployment (`…MDf1`) and short
link (https://shorturl.at/wciBI).

Planned on Opus (20 Nov 2026); to be built on Sonnet, one phase at a time. Each phase ends
deployable and tested on staging before the next starts.

---

## 1. Decisions (agreed with user)

| Topic | Decision |
|---|---|
| Sign-in | **Staff ID + PIN**, accounts managed by Admin in a `Users` sheet. Keeps current URL. |
| Who enters findings | **Each unit enters its own section** of a round (Fire, OSH, UKI, Aset, Rekod, Nursing, IT, Medikolegal…). UPRSK sees progress and compiles. |
| Sign-off | **Digital approval + print space**: Ketua UPRSK (*disemak*) and Pengarah (*disahkan*) approve in the portal; name/designation/date recorded; the report leaves room for wet signature and stamp. |
| Report output | **Editable Google Sheet + PDF**, laid out exactly like the UPRSK reports (§4). |
| Sections | The **current 11 checklists + 3 sections from the reports** that the app lacks (§3). |
| Auditee can | View own-department report · acknowledge · fill *Maklumbalas Jabatan* per finding · upload rectification evidence |
| Dashboard | Compliance scores · open-actions tracker · trends over time · round coverage |
| Admin can | Users & roles · schedule rounds & panel · edit sections/checklists without code · generate/export reports |
| Platform | Google Apps Script + Google Sheets + Drive (no backend, no paid services). |
| Deployment | Same project in **ffairis@gmail.com**, *Execute as: Me*, *Anyone*. Update `…MDf1` in place. |
| Language | Portal UI bilingual EN/BM. Report text follows each section's template language (§4). |
| Look | Portal: existing HIO house dark style. Report: UPRSK Excel style (§4) — not the dark theme. |

Reference samples (local only, not committed — contain clinical record photos):
`Laporan CGR Jabatan Bedah Mulut Dan Maksilofasial 2026.pdf` (19 pp) and
`Laporan CGR Jabatan Pergigian Penjagaan Khas.pdf` (20 pp), both rounds of 10 Julai 2026.

---

## 2. How a round actually works (from the samples)

1. A **round** visits one department on a date/time with a **panel** (~25 people: UPRSK, UKI,
   UPPPPP, Medikolegal, UKA/OSH, Kejururawatan, Penyelia Hospital, Kejuruteraan, UPAS, Rekod, IT…).
2. After the visit, **each unit writes its own section** (findings, photos, corrective action,
   facility/room) and signs it (*Laporan disediakan oleh*, sometimes *disemak oleh* its unit head).
   Sections arrive over ~2 weeks (e.g. round 10 Jul → sections dated 11–24 Jul).
3. **UPRSK compiles** all sections behind a cover block and signs the whole report
   (*Laporan Keseluruhan Disediakan Oleh*) → **Ketua UPRSK** (*Disemak Oleh*) → **Pengarah**
   (*Disahkan Oleh*).
4. The report goes to the **department**, which fills **Maklumbalas Jabatan** per finding.
5. Units record **Tindakan Susulan** (follow-up) until each finding is resolved.

Columns *Maklumbalas Jabatan* and *Tindakan Susulan* are blank in both samples — the portal makes
them live.

---

## 3. Sections

App numbers stay as today (1–11) with three new ones appended. The **report** uses its own order
(`reportOrder`, matching the samples) and renumbers 1…n per round for only the sections included.

| App # | Section (app) | Report banner title | Template | Owner unit | Report order |
|---|---|---|---|---|---|
| 1 | Pemerhatian Am Wad | PEMERHATIAN UMUM (GENERAL OBSERVATION) | BM9 | UPRSK | 1 |
| 2 | Keselamatan Kebakaran | KESELAMATAN KEBAKARAN | BM9 | Unit Penyelia Hospital | 2 |
| 7 | Perkhidmatan Kejuruteraan | PERKHIDMATAN SOKONGAN KLINIKAL | BM9 | Unit Kejuruteraan | 3 |
| 10 | Pemeriksaan Tempat Kerja OSH | AUDIT KESELAMATAN DAN KESIHATAN | BM9 | UKA / OSH | 4 |
| 3 | Kawalan Infeksi | AUDIT KAWALAN INFEKSI | EN9 | UKI | 5 |
| 5 | Kualiti | UNIT PENGURUSAN RISIKO DAN SURVELAN KLINIKAL | QUALITY+photo | UPRSK | 6 |
| **12 (new)** | Perkembangan Profesion Pakar & Pegawai Perubatan | UNIT PROFESION PAKAR DAN PEGAWAI PERUBATAN | QUALITY (no photo) | UPPPPP | 7 |
| 11 | Medikolegal | MEDIKOLEGAL | EN9 | Unit Medikolegal & Etika | 8 |
| 6 | Pengurusan Aset | UNIT PENGURUSAN ASET DAN SETOR | BM9 | UPAS | 9 |
| **13 (new)** | Rekod Perubatan | PENGURUSAN REKOD PERUBATAN | BM9 | Jabatan Rekod Perubatan | 10 |
| 4 | Kejururawatan | KEJURURAWATAN | EN9 checklist | Unit Kejururawatan | 11 |
| **14 (new)** | Teknologi Maklumat | INFORMATION TECHNOLOGY | EN9 | Unit Teknologi Maklumat | 12 |
| 8 | Jabatan Kecemasan (ETD) | JABATAN KECEMASAN | BM9 | Kumpulan CGR | 13 (ETD only) |
| 9 | Unit Dietetik dan Sajian (JDS) | UNIT DIETETIK DAN SAJIAN | BM9 | Kumpulan CGR | 14 (JDS only) |

All of this lives in a `Sections` sheet (title, banner, template, owner unit, report order, Kandungan
label, departments it applies to), so admin can change it without code.

**Entry modes**
- **findings** (most sections): free rows — one per finding, any number, each with photos.
- **checklist** (Kejururawatan; optional for others): every checklist item is listed in the report,
  grouped under blue bands, each item with its finding/action/facility.
- OSH keeps its Ya/Tidak/TB scoring for the dashboard; its report section shows findings only.
- A section with nothing to report is marked **"Tiada penemuan"** → renders as in the samples
  (one row of "Tiada", or "Tiada isu sepanjang lawatan.").

---

## 4. Report format spec (must match the samples)

Generated as a **Google Sheet** (one per round, in `CGR Reports/<year>/<department>/`) and exported
to **PDF** (A4 landscape, fit to width, no gridlines, each tab starts a new page).
File name: `Laporan CGR <Nama Jabatan> <year>`.

### 4.1 Cover — tab `Kandungan` (top of page 1)
- Title **CLINICAL GOVERNANCE ROUND <year>**, bold, underlined.
- Bordered 2-column label/value table:
  - `Tarikh :` → e.g. *10 Julai 2026* (Malay month names)
  - `Waktu :` → e.g. *02.30 petang*
  - `Jabatan yang dilawati :` → department full name
  - `Ahli Kumpulan Yang Menjalankan Rondaan` → one panel member per line: *Dr. Nama (UNIT)*
  - `Kandungan :` → numbered list of the sections included, one per bordered line:
    *1) Pemerhatian Umum*, *2) Keselamatan Kebakaran (Fire Safety)*, … (Kandungan labels from `Sections`).
- Section 1 follows directly beneath the cover on the same page.

### 4.2 Section block (one tab per section, new page each)
1. **Banner row** merged across all columns, fill **#215967**, white bold UPPERCASE, centred:
   `N) [LAPORAN ]CLINICAL GOVERNANCE ROUND <year> <JABATAN UPPERCASE>, HTPN : <BANNER TITLE>`
   (`LAPORAN ` prefix per section setting — used by Kualiti, UPPPPP, Medikolegal, Aset, Rekod.)
2. **Column header row**, fill **#D9D9D9**, bold UPPERCASE, centred, wrapped.
3. **Rows**, thin black borders on all cells, text top-left wrapped (Bil centred), font **Arial 8**.
   Photos placed inside the *Rujukan/Reference* cell, scaled to the column width, several stacked
   when there are several; empty photo cell shows *Tiada* / *N/A* as entered.
4. **Sign-off block(s)** below the table, no borders: bold `Laporan disediakan oleh :`, then name
   (bold), designation, unit, *Hospital Tengku Permaisuri Norashikin*, `Tarikh : <date>`.
   A second block `Laporan disemak oleh :` to the right when the unit head reviewed it.
   Blank lines above each name for wet signature/stamp.
5. Optional **appendix line** under the table, e.g.
   *Laporan lengkap IPC Grand Round Jabatan OMFS : <link>*.

### 4.3 Column templates

| Template | Columns (left → right) |
|---|---|
| **BM9** | BIL · KANDUNGAN · PERKARA · PENEMUAN · RUJUKAN (GAMBAR) · TINDAKAN PEMBETULAN & PENAMBAHBAIKAN · FASILITI/ NAMA RUANG · MAKLUMBALAS JABATAN · TINDAKAN SUSULAN |
| **EN9** | NO · CONTENT · ISSUE · FINDINGS · REFERENCE (PHOTO) · CORRECTIVE & IMPROVEMENT ACTIONS · FACILITY / ROOM /AREA · DEPARTMENT FEEDBACK · FOLLOW-UP ACTION |
| **QUALITY+photo** | Bil. · Clause - Plan of Action/ Issue · Findings · Reference (Photo) · Suggested Improvements · Feedback from Department |
| **QUALITY** | Bil. · Clause - Plan of Action/ Issue · Findings · Suggested Improvements · Feedback from Department |
| **EN9 checklist** | as EN9, plus group band rows (below) |

Relative column widths (BM9/EN9): 4 · 10 · 12 · 17 · 13 · 14 · 10 · 10 · 10.
QUALITY: 4 · 16 · 34 · (16) · 20 · 14.

### 4.4 Checklist mode extras (Kejururawatan)
- Group band row merged across all columns, fill **#92CDDC**, bold black text, e.g.
  *Patient Management (Random Check)*, *Transfusion Safety*, *Patient Fall*, *Correct Patient
  Identification*, *Patient Discharge…*, *Surgical Safety*, *Medication Safety*,
  *Others: Emergency Trolley*, *Others: Emergency Equipment*.
- Optional KPI line in the band in **bold red #FF0000**, e.g.
  *MPSG KPI 6. Number of incorrect blood component transfusion (IBCT) STANDARD: ZERO*.
- Item numbers run continuously; CONTENT = *Nursing*; ISSUE = the checklist item text.
- One finding/action can span several consecutive items (vertically merged cells), as in the samples.
- Items not applicable to the department may be shaded black (as in the samples).

### 4.5 Rich text inside cells
Medikolegal and Kualiti findings use bold lead-in labels — *Observation:*, *Good Practice:*,
*Bad Practice:*, *Medicolegal Implication:*, *Recommendation:*. The entry form offers these as
quick-insert labels; the generator renders `**label**` as bold using `RichTextValue`.

### 4.6 Overall sign-off (end of section 1, as in the samples)
Three blocks side by side:
- **Laporan Keseluruhan Disediakan Oleh :** UPRSK officer — name, *Pegawai Perubatan*, *Unit
  Pengurusan Risiko dan Survelan Klinikal*, hospital, `Tarikh`.
- **Laporan Keseluruhan Disemak Oleh :** Ketua UPRSK.
- **Laporan Keseluruhan Disahkan Oleh :** Pengarah Hospital.

Each shows the digitally recorded name/designation/date, a blank signature/stamp space, and a small
grey line *Diluluskan secara digital dalam Portal CGR — <dd/mm/yyyy hh:mm>*.

### 4.7 Fidelity checks (acceptance)
Generate the OMFS and SCD rounds from the samples as test data and compare the PDF side-by-side with
the scans: banner text, column headers/order/widths, band colours, sign-off layout, page breaks.

---

## 5. Constraints that drive the design

1. **The web app is anonymous** (`ANYONE_ANONYMOUS`): every `google.script.run` function is callable
   by anyone with the URL → **every public server function takes a session token and checks role
   server-side**; internals end with `_` (hidden from `google.script.run`).
2. Identity only from our own Staff ID + PIN login (owner is gmail; users anonymous).
3. **Sheets is the database** — whole-tab reads, `LockService` around writes, cached aggregates.
4. No external JS libraries (house rule) — charts are inline SVG.
5. User text is shown to other users → all dynamic `innerHTML` goes through `esc()`.
6. **Photos can contain patient-identifiable data** (e.g. medicolegal photos of clinical notes).
   The current app shares uploads as *anyone with the link* — **stop doing that**. Photos stay
   private in Drive; the portal serves them through an authenticated server call (base64 thumbnail),
   and the report generator inserts them from the blob, so no public links are needed.
7. Photos are downscaled in the browser before upload (max 1280 px, JPEG 0.8) — faster uploads,
   and Sheets `insertImage` limits (≤ 2 MB / 1 MP) are respected.
8. Apps Script limits: 6-min execution (report generation runs per section if needed), 100 KB per
   cache key, MailApp ≈ 100 emails/day on gmail.

---

## 6. Architecture

### 6.1 Files (`src/` = the Apps Script project, pushed with clasp)

```
src/
  appsscript.json
  Config.gs     IDs, constants, sheet names, report colours/widths
  Setup.gs      setupPortal(): tabs + headers, seed Sections/Checklists/Departments/Units,
                first admin; migrateLegacy()
  Db.gs         readTable_, appendRows_, updateRow_, ids, locks
  Auth.gs       login, logout, changePin, sessions, PIN hashing, lockout
  Rounds.gs     schedule rounds, panel, section entries, photos, section submit/review
  Signoff.gs    compile (disediakan), review (disemak), approve (disahkan), release
  Actions.gs    acknowledgement, Maklumbalas Jabatan, evidence, Tindakan Susulan, close
  Report.gs     build the Google Sheet report (§4) + PDF export
  Dashboard.gs  aggregates (cached)
  Admin.gs      users, units, departments, sections & checklist editor
  Notify.gs     emails + daily reminder trigger
  Web.gs        doGet, include
  Index.html · Styles.html · App.html · View*.html   (portal UI, dark theme)
  DevMock.html  local-only fake google.script.run (not pushed)
```

### 6.2 Data model (tabs in the "CGR 2026 Responses" spreadsheet)

| Tab | Columns |
|---|---|
| **Users** | staffId · name · designation · role (`admin`/`auditor`/`auditee`) · unitId (auditor) · deptId (auditee) · flags (`unitHead`, `uprskReviewer`, `director`) · email · pinHash · pinSalt · mustChangePin · active · failedLogins · lockedUntil · lastLogin |
| **Units** | unitId · name · shortName (shown in panel list, e.g. UPRSK, UKI, UKA/OSH) |
| **Departments** | deptId · name (report name, e.g. *Klinik Pakar Bedah Mulut dan Maksilofasial*) · headStaffId · roundEveryDays · active |
| **Sections** | sectionId · appNum · title · bannerTitle · laporanPrefix (bool) · template · mode (`findings`/`checklist`) · checklistId · ownerUnitId · reportOrder · kandunganLabel · contentLabel (default KANDUNGAN/CONTENT text) · appliesToDeptIds · active |
| **ChecklistItems** | checklistId · itemId · group · groupKpi · group_en · perkara · perkara_en · order · active |
| **Rounds** | roundId · deptId · date · waktu · status · sectionIds · createdBy · compiledBy/At · reviewedBy/At · approvedBy/At · releasedAt · ackBy/At · reportSheetId · reportPdfId |
| **Panel** | roundId · staffId (or free-text name) · unitShortName · order |
| **RoundSections** | roundId · sectionId · status (`not_started`/`draft`/`submitted`/`reviewed`) · noFindings (bool) · noFindingsText · appendixText · appendixUrl · preparedBy/At · reviewedBy/At |
| **Entries** | entryId · roundId · sectionId · order · itemId (checklist mode) · kandungan · perkara · penemuan · photoIds · tindakan · fasiliti · rating (`C`/`I`/`NC`/`NA`/`OBS`) · maklumbalas · maklumbalasBy/At · susulan · susulanBy/At · evidenceIds · state (`open`/`responded`/`closed`) |
| **OshScores** | roundId · itemKey · value (Ya/Tidak/TB) |
| **AuditLog** | timestamp · staffId · event · refId · details |
| *CGR Responses* | legacy — untouched, migrated read-only |

`rating` is internal (dashboard + whether a response is required); it is **not** printed.
Entries rated `NC` or `I` require Maklumbalas Jabatan and close only after Tindakan Susulan.

### 6.3 Workflow & states

```
Round:   scheduled → in_progress → compiled → reviewed → approved → released → closed
Section: not_started → draft → submitted → (reviewed by unit head, optional)
Entry:   open → responded (dept filled Maklumbalas) → closed (unit filled Tindakan Susulan)
```
- **compiled** when every included section is `submitted` and the UPRSK officer signs *disediakan*.
- **reviewed** = Ketua UPRSK (*disemak*); **approved** = Pengarah (*disahkan*). Either can return the
  report to UPRSK with a note.
- **released**: report Sheet + PDF generated and locked; department head emailed; auditees can see it.
- **closed** when all NC/I entries are closed.

### 6.4 Roles → screens

| Screen | Admin (UPRSK) | Auditor (unit) | Auditee (dept) | Ketua UPRSK / Pengarah |
|---|:-:|:-:|:-:|:-:|
| Rounds list / schedule & panel | ✓ edit | rounds they're on | own dept (released) | ✓ view |
| Section entry (own unit's sections) | all sections | own unit | — | — |
| Compile & sign *disediakan* | ✓ | — | — | — |
| Review *disemak* / approve *disahkan* | — | — | — | ✓ |
| Report (Sheet + PDF) | ✓ generate | own sections preview | own dept (released) | ✓ |
| Maklumbalas Jabatan + evidence | view | view | ✓ own dept | view |
| Tindakan Susulan | ✓ | own unit's entries | view | view |
| Dashboard | all | all | own dept | all |
| Users · Units · Departments · Sections/Checklists | ✓ | — | — | — |

Ketua UPRSK and Pengarah are users with the `uprskReviewer` / `director` flag (any role).

---

## 7. Phases

Each phase: branch `portal` → DevMock local test → **staging** project + spreadsheet copy →
user acceptance → merge → deploy `…MDf1`.

### Phase 0 — Foundations + report spike
- `src/` split, templates + `include()`, `Db.gs`, `Config.gs`, `esc()` everywhere.
- `setupPortal()` (idempotent) seeds Sections (§3), ChecklistItems (from current `CHECKLISTS`),
  Units, Departments, first admin. `migrateLegacy()` with dry-run.
- **Report spike**: build the OMFS sample's sections 1, 5 and 11 into a Google Sheet with photos and
  export PDF; compare with the scan. Settle widths, row heights, image placement, page breaks
  before anything else depends on it.
- Fix photo privacy (no more public links). DevMock. Staging project + clasp configs.
- **Exit:** spike PDF signed off by user as "matches"; current form still works on staging.

### Phase 1 — Login, roles, rounds & unit sections
- Login / change PIN / lockout / sessions; role + flags nav shell.
- Admin: Users, Units, Departments; create a round (department, date, waktu, sections, panel).
- Auditor: *My rounds* → their unit's sections → entry form (findings rows or checklist mode,
  photos, bold-label quick inserts, "Tiada penemuan", appendix link) → save draft → submit.
  Optional unit-head review. localStorage draft autosave.
- **Exit:** a round with several units' sections fully entered on staging.

### Phase 2 — Compile, sign-off, report generation
- UPRSK compile view (section status board, preview), sign *disediakan*.
- Ketua UPRSK *disemak*, Pengarah *disahkan*, return-with-note.
- `Report.gs`: full generator per §4 (all templates, checklist bands, rich text, photos, sign-offs,
  cover) → Sheet in Drive + PDF; regenerate allowed until released, then locked.
- **Exit:** OMFS and SCD sample rounds re-keyed on staging produce reports matching the scans (§4.7).

### Phase 3 — Department response & follow-up
- Release → email department head. Auditee: report view, **acknowledge**, Maklumbalas Jabatan per
  entry, evidence upload. Units: Tindakan Susulan, close entries. Round auto-closes.
- Report regenerates with filled Maklumbalas/Susulan columns ("versi susulan") on demand.
- Daily overdue reminders (digest).
- **Exit:** full cycle incl. a regenerated report showing department feedback and follow-up.

### Phase 4 — Dashboard
- Filters: date range, department, section. Compliance (C ÷ (C+I+NC), NA/OBS excluded) by department
  and section, heatmap; open-entries tracker with overdue; monthly trends; top recurring issues;
  coverage (last round per department vs `roundEveryDays`). Auditees scoped to own department.
- **Exit:** numbers reconcile with a manual pivot for a sample month.

### Phase 5 — Admin tools & go-live
- Sections & checklist editor (titles, banner, template, order, items, groups, KPI lines);
  schedule calendar; AuditLog viewer.
- Run `setupPortal()` + `migrateLegacy()` on the live spreadsheet (backup copy first), create real
  users, deploy `…MDf1`, update README.

---

## 8. Testing

- **DevMock** for every screen at 375 px and desktop; seeded users for each role/flag.
- **`Tests.gs`** on staging: auth, role filtering, state machines, aggregates.
- **Security pass each phase**: every public function without token / with wrong role / auditee of
  another department → must fail. No photo reachable without a session.
- **Report fidelity** (§4.7) at the end of Phases 0, 2 and 3.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Server functions callable by anyone with the URL | Token + role check everywhere; `_` internals; security pass |
| Patient data in photos | Private Drive files, served via authenticated calls; report Sheets shared only with UPRSK/approvers |
| Report not matching the samples | Phase 0 spike + fidelity checks against the scans |
| Sheets image limits / slow generation | Client-side downscale; generate per section; progress shown |
| PIN sharing / weak PINs | 6 digits, lockout, forced change, AuditLog |
| Concurrent edits | `LockService`; each unit edits only its own section |
| MailApp quota | Daily digests; skip users without email |
| Breaking the live app | All work on staging; `…MDf1` updated only after a phase passes |

## 10. Open points

- Unit list and short names for the panel (UPRSK, UKI, UPPPPP, UKA/OSH, UPAS…) — admin to confirm.
- Department full names as they must appear in banners.
- Who may edit a section after submission (plan: owner unit until compiled; UPRSK always).
- Should the report Sheet stay editable after release? (Plan: locked copy + editable working copy for UPRSK.)
