/**
* ============================================================
* REPORT.GS — build the UPRSK-format report (Google Sheet + PDF)
* Layout spec: docs/PORTAL_PLAN.md §4. Everything here is internal (ends with "_").
*
* buildReport_(reportData) → { sheetId, url }
* exportPdf_(sheetId)      → { pdfId, url, blob }
*
* reportData shape
* {
*   year: 2026,
*   deptName: "Klinik Pakar Bedah Mulut dan Maksilofasial",   // banner (upper-cased) + file name
*   deptCoverName: "…",            // optional: wording on the cover "Jabatan yang diaudit" (default deptName)
*   date: "2026-07-10" | Date,  waktu: "02.30 petang",
*   panel: ["Dr. Nama (UPRSK)", …],                            // one member per line
*   kandunganList: ["Pemerhatian Umum", …],                     // optional override of the cover list
*   fileName: "…", folder: <Folder>,                            // optional overrides (tests)
*   sections: [{                                                // in report order; first one sits under the cover
*     number: 5,                    // optional override of the 1…n numbering
*     bannerTitle: "AUDIT KAWALAN INFEKSI", laporanPrefix: false,
*     template: "BM9" | "EN9" | "QUALITY+photo" | "QUALITY" | "EN9 checklist",
*     mode: "findings" | "checklist",
*     kandunganLabel: "…", contentLabel: "…",                   // contentLabel = text of the KANDUNGAN/CONTENT column
*     noFindings: false, noFindingsText: "Tiada isu sepanjang lawatan.",
*     entries: [{
*       perkara, penemuan, tindakan, fasiliti, maklumbalas, susulan, kandungan, bil,
*       photos: [DriveFileId | Blob], photoText: "N/A",          // photoText shown when there is no photo
*       group, groupKpi,                                         // checklist mode: new band when group changes
*       span: 3,                    // checklist mode: merge penemuan/photo/tindakan/fasiliti over this row + next 2
*       spanFields: ["photo", …],   // optional: which columns the span merges (default SPAN_FIELDS_)
*       shade: ["penemuan", …],     // cells shaded black (not applicable)
*     }],
*     appendix: { text, url },
*     preparedBy: {name, designation, unit, date}, reviewedBy: {…},
*   }],
*   signoff: { prepared: {name, designation, unit, date, approvedAt}, reviewed: {…}, approved: {…} },
* }
* Text cells may contain **bold** lead-in labels (rendered as rich text).
* ============================================================
*/

// Columns that merge down together in checklist mode (when an entry has `span`)
const SPAN_FIELDS_ = ["penemuan", "photo", "tindakan", "fasiliti"];
// Columns centred horizontally
const CENTER_FIELDS_ = ["bil", "kandungan", "photo"];

// ── PUBLIC ENTRY POINTS ─────────────────────────────────────
function buildReport_(data) {
 const folder = data.folder || getReportFolder_(data);
 const name = data.fileName || ("Laporan CGR " + data.deptName + " " + data.year);
 const ss = SpreadsheetApp.create(name);
 DriveApp.getFileById(ss.getId()).moveTo(folder);

 const sections = data.sections || [];
 if (!sections.length) throw new Error("Report has no sections.");
 const usedNames = {};
 const first = ss.getSheets()[0];

 sections.forEach((sec, i) => {
   const number = sec.number || (i + 1);
   const sheet = i === 0 ? first : ss.insertSheet();
   const tmpl = templateFor_(sec);
   sheet.setName(i === 0 ? "Kandungan" : uniqueTabName_(number + ") " + (sec.kandunganLabel || sec.bannerTitle), usedNames));
   setupSheet_(sheet, tmpl);

   let row = 1;
   if (i === 0) row = writeCover_(sheet, data, sections, tmpl, row);
   row = writeSection_(sheet, row, sec, number, data, tmpl);
   if (i === 0 && data.signoff) writeOverallSignoff_(sheet, row + 1, data.signoff, tmpl);
   trimSheet_(sheet, tmpl.headers.length);
 });

 SpreadsheetApp.flush();
 return { sheetId: ss.getId(), url: ss.getUrl() };
}

// Whole spreadsheet → PDF (A4 landscape, fit to width, no gridlines; every tab starts a new page).
// Saved next to the Sheet. Uses the script owner's OAuth token (needs the drive scope).
function exportPdf_(sheetId) {
 SpreadsheetApp.flush();
 const url = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=pdf&size=A4&portrait=false&fitw=true" +
   "&gridlines=false&printtitle=false&sheetnames=false&pagenum=UNDEFINED" +
   "&top_margin=0.4&bottom_margin=0.4&left_margin=0.4&right_margin=0.4";
 const resp = UrlFetchApp.fetch(url, {
   headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
   muteHttpExceptions: true,
 });
 if (resp.getResponseCode() !== 200) {
   throw new Error("PDF export failed (" + resp.getResponseCode() + "): " + resp.getContentText().slice(0, 300));
 }
 const file = DriveApp.getFileById(sheetId);
 const blob = resp.getBlob().setName(file.getName() + ".pdf");
 const pdf = file.getParents().next().createFile(blob);
 return { pdfId: pdf.getId(), url: pdf.getUrl(), blob };
}

// ── FOLDERS / NAMES ─────────────────────────────────────────
// CGR Reports/<year>/<department>/
function getReportFolder_(data) {
 const year = childFolder_(reportsRoot_(), String(data.year));
 return childFolder_(year, data.deptName);
}

function reportsRoot_() {
 const rootId = CONFIG.REPORTS_FOLDER_ID || PropertiesService.getScriptProperties().getProperty("REPORTS_FOLDER_ID");
 if (!rootId) throw new Error("No reports folder — run setupPortal() first.");
 return DriveApp.getFolderById(rootId);
}

function childFolder_(parent, name) {
 const it = parent.getFoldersByName(name);
 return it.hasNext() ? it.next() : parent.createFolder(name);
}

function uniqueTabName_(raw, used) {
 let base = String(raw).replace(/[\[\]*?:\/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);
 let name = base, n = 2;
 while (used[name]) name = base.slice(0, 46) + " (" + (n++) + ")";
 used[name] = true;
 return name;
}

// ── TEMPLATES / SHEET SETUP ─────────────────────────────────
function templateFor_(sec) {
 const key = String(sec.template || "BM9").replace(/\s*checklist\s*$/i, "").trim();
 const t = REPORT.TEMPLATES[key];
 if (!t) throw new Error("Unknown report template: " + sec.template);
 return t;
}

function colPx_(tmpl) {
 const total = tmpl.widths.reduce((a, b) => a + b, 0);
 return tmpl.widths.map(w => Math.round(w / total * REPORT.TOTAL_WIDTH_PX));
}

function setupSheet_(sheet, tmpl) {
 sheet.setHiddenGridlines(true);
 sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
   .setFontFamily(REPORT.FONT).setFontSize(REPORT.FONT_SIZE).setFontColor("#000000").setVerticalAlignment("top");
 colPx_(tmpl).forEach((px, i) => sheet.setColumnWidth(i + 1, px));
}

// Drop unused columns so the PDF "fit to width" scales to the table, not to 26 columns.
function trimSheet_(sheet, ncols) {
 try {
   if (sheet.getMaxColumns() > ncols) sheet.deleteColumns(ncols + 1, sheet.getMaxColumns() - ncols);
   const last = sheet.getLastRow();
   if (sheet.getMaxRows() > last + 1) sheet.deleteRows(last + 2, sheet.getMaxRows() - last - 1);
 } catch (e) {
   Logger.log("trimSheet_: " + e);
 }
}

// ── COVER (tab "Kandungan", top of page 1) ──────────────────
function writeCover_(sheet, data, sections, tmpl, row) {
 const border = r => r.setBorder(true, true, true, true, false, false, REPORT.COLOR.BORDER, SpreadsheetApp.BorderStyle.SOLID);
 const px = colPx_(tmpl);
 const valueW = px[2] + (px[3] || 0);
 const labelW = px[0] + px[1];

 // Title
 const title = sheet.getRange(row, 1, 1, 4).merge();
 title.setValue("CLINICAL GOVERNANCE ROUND " + data.year).setFontWeight("bold").setFontLine("underline").setHorizontalAlignment("center").setFontSize(9);
 sheet.setRowHeight(row, 24);
 row++;
 sheet.setRowHeight(row, 8);
 row++;

 // Label / value rows
 const pair = (label, value) => {
   sheet.getRange(row, 1, 1, 2).merge().setValue(label).setWrap(true);
   sheet.getRange(row, 3, 1, 2).merge().setValue(value).setWrap(true);
   border(sheet.getRange(row, 1, 1, 2));
   border(sheet.getRange(row, 3, 1, 2));
   sheet.setRowHeight(row, Math.max(REPORT.MIN_ROW_PX - 4, estHeight_(value, valueW)));
   row++;
 };
 pair("Tarikh :", malayDate_(data.date));
 pair("Waktu :", data.waktu || "");
 pair("Jabatan yang diaudit :", data.deptCoverName || data.deptName);
 // Panel: one member per line in a single bordered cell
 const panel = (data.panel || []).join("\n");
 pair("Ahli Kumpulan Yang Menjalankan Rondaan", panel);
 sheet.setRowHeight(row - 1, Math.max(estHeight_(panel, valueW), estHeight_("Ahli Kumpulan Yang Menjalankan Rondaan", labelW)));

 // Kandungan: label spans the list; one bordered line per section
 const list = data.kandunganList || sections.map((s, i) => (s.number || (i + 1)) + ") " + (s.kandunganLabel || s.bannerTitle));
 sheet.getRange(row, 1, list.length, 2).merge().setValue("Kandungan :");
 border(sheet.getRange(row, 1, list.length, 2));
 list.forEach((text, i) => {
   sheet.getRange(row + i, 3, 1, 2).merge().setValue(text);
   border(sheet.getRange(row + i, 3, 1, 2));
   sheet.setRowHeight(row + i, 17);
 });
 row += list.length;

 sheet.setRowHeight(row, 14); // gap before section 1
 return row + 1;
}

// ── ONE SECTION BLOCK ───────────────────────────────────────
// banner → header → rows (+ bands) → appendix → sign-off(s). Returns the next free row.
function writeSection_(sheet, row, sec, number, data, tmpl) {
 const ncols = tmpl.headers.length;
 const px = colPx_(tmpl);
 const fields = tmpl.fields;
 const photoCol = fields.indexOf("photo"); // -1 for QUALITY

 // 1. Banner
 const banner = "" + number + ") " + (sec.laporanPrefix ? "LAPORAN " : "") + "CLINICAL GOVERNANCE ROUND " + data.year + " " +
   String(data.deptName).toUpperCase() + ", HTPN : " + sec.bannerTitle;
 const bannerRange = sheet.getRange(row, 1, 1, ncols).merge();
 bannerRange.setValue(banner).setBackground(REPORT.COLOR.BANNER).setFontColor("#FFFFFF").setFontWeight("bold")
   .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
 boxBorder_(sheet.getRange(row, 1, 1, ncols));
 sheet.setRowHeight(row, 26);
 row++;

 // 2. Column header row
 const headRange = sheet.getRange(row, 1, 1, ncols);
 headRange.setValues([tmpl.headers.map(h => h.toUpperCase())]).setBackground(REPORT.COLOR.HEADER).setFontWeight("bold")
   .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
 boxBorder_(headRange);
 sheet.setRowHeight(row, Math.max(26, Math.max.apply(null, tmpl.headers.map((h, i) => estHeight_(h.toUpperCase(), px[i], 1.5)))));
 row++;

 // 3. Rows
 const model = buildRowModel_(sec, tmpl);
 const first = row;
 const heights = [];
 const values = model.map(m => {
   if (m.type === "band") return fields.map((f, i) => i === 0 ? bandText_(m) : "");
   return fields.map(f => cellText_(m, f, sec));
 });

 // Photos are loaded up front: their size drives the row height
 model.forEach(m => { if (m.type === "entry") m.pics = loadPhotos_(m.entry, photoCol >= 0 ? px[photoCol] : 0); });

 // Height per row (text estimate vs. photo stack); merged spans get the extra added to their last row
 model.forEach((m, i) => {
   if (m.type === "band") {
     heights[i] = bandLines_(m) * REPORT.BAND_LINE_PX + 8;
     return;
   }
   let h = REPORT.MIN_ROW_PX;
   fields.forEach((f, c) => {
     if (f === "photo" || (m.span > 1 && m.spanFields.indexOf(f) >= 0)) return;
     h = Math.max(h, estHeight_(values[i][c], px[c]));
   });
   if ((m.span <= 1 || m.spanFields.indexOf("photo") < 0) && photoCol >= 0) h = Math.max(h, photoStackHeight_(m.pics));
   heights[i] = h;
 });
 model.forEach((m, i) => {
   if (m.type !== "entry" || m.span <= 1) return;
   const last = Math.min(i + m.span - 1, model.length - 1);
   let sum = 0;
   for (let k = i; k <= last; k++) sum += heights[k];
   let need = photoCol >= 0 ? photoStackHeight_(m.pics) : 0;
   fields.forEach((f, c) => { if (m.spanFields.indexOf(f) >= 0 && f !== "photo") need = Math.max(need, estHeight_(values[i][c], px[c])); });
   if (need > sum) heights[last] += need - sum;
 });

 const n = model.length;
 const table = sheet.getRange(first, 1, n, ncols);
 table.setNumberFormat("@").setWrap(true).setVerticalAlignment("top").setValues(values);
 boxBorder_(table, true);
 fields.forEach((f, c) => { if (CENTER_FIELDS_.indexOf(f) >= 0) sheet.getRange(first, c + 1, n, 1).setHorizontalAlignment("center"); });
 heights.forEach((h, i) => sheet.setRowHeight(first + i, Math.round(h)));

 // Bands, merges, shading, rich text
 model.forEach((m, i) => {
   const r = first + i;
   if (m.type === "band") {
     const rg = sheet.getRange(r, 1, 1, ncols).merge();
     rg.setBackground(REPORT.COLOR.BAND).setHorizontalAlignment("left").setVerticalAlignment("middle");
     boxBorder_(rg);
     sheet.getRange(r, 1).setRichTextValue(bandRich_(m));
     return;
   }
   if (m.span > 1) {
     const last = Math.min(m.span, n - i);
     fields.forEach((f, c) => { if (m.spanFields.indexOf(f) >= 0 && last > 1) sheet.getRange(r, c + 1, last, 1).merge(); });
   }
   (m.entry.shade || []).forEach(f => {
     const c = fields.indexOf(f);
     if (c >= 0) sheet.getRange(r, c + 1, m.spanFields.indexOf(f) >= 0 ? Math.max(1, m.span) : 1, 1).setBackground(REPORT.COLOR.SHADE);
   });
   fields.forEach((f, c) => {
     const v = values[i][c];
     if (typeof v === "string" && v.indexOf("**") >= 0) sheet.getRange(r, c + 1).setRichTextValue(boldRich_(v));
   });
 });

 // Photos go in last (rows have their final height)
 if (photoCol >= 0) {
   model.forEach((m, i) => { if (m.type === "entry") placePhotos_(sheet, first + i, photoCol + 1, px[photoCol], m); });
 }
 row = first + n;

 // 4. Appendix line (e.g. "Laporan lengkap IPC Grand Round Jabatan OMFS : <link>")
 if (sec.appendix && (sec.appendix.text || sec.appendix.url)) {
   const text = [sec.appendix.text, sec.appendix.url].filter(String).join(" ");
   const cell = sheet.getRange(row, 1, 1, Math.min(ncols, 6)).merge().setWrap(true);
   const b = SpreadsheetApp.newRichTextValue().setText(text);
   if (sec.appendix.url) b.setLinkUrl(text.length - sec.appendix.url.length, text.length, sec.appendix.url);
   cell.setRichTextValue(b.build());
   sheet.setRowHeight(row, 20);
   row++;
 }

 // 5. Sign-off block(s): prepared (left) and optionally reviewed (right)
 const blocks = [];
 const startCols = ncols >= 9 ? [2, 5] : [2, 4];
 if (sec.preparedBy) blocks.push({ title: "Laporan disediakan oleh :", person: sec.preparedBy, col: startCols[0], dateStyle: "short" });
 if (sec.reviewedBy) blocks.push({ title: "Laporan disemak oleh :", person: sec.reviewedBy, col: startCols[1], dateStyle: "short" });
 if (blocks.length) row = writeSignoffBlocks_(sheet, row + 1, blocks);
 return row;
}

// Row model: entries (+ band rows in checklist mode). "No findings" yields a single "Tiada" row.
function buildRowModel_(sec, tmpl) {
 const checklist = sec.mode === "checklist" || /checklist/i.test(String(sec.template));
 let entries = sec.entries || [];
 if (sec.noFindings || !entries.length) {
   entries = [{ perkara: "", penemuan: sec.noFindingsText || "Tiada", photoText: tmpl.photoText || "Tiada" }];
 }
 const model = [];
 let curGroup = null, n = 0;
 entries.forEach(e => {
   if (checklist && e.group && e.group !== curGroup) {
     curGroup = e.group;
     model.push({ type: "band", group: e.group, kpi: e.groupKpi || "" });
   }
   n++;
   model.push({ type: "entry", entry: e, n: e.bil || n, span: Math.max(1, Number(e.span) || 1), spanFields: e.spanFields || SPAN_FIELDS_, checklist });
 });
 return model;
}

// Cell text for an entry row. Photo cell: image(s) are placed separately; "Tiada"/"N/A" only in findings mode.
function cellText_(m, field, sec) {
 const e = m.entry;
 switch (field) {
   case "bil": return String(m.n);
   case "kandungan": return e.kandungan || sec.contentLabel || sec.kandunganLabel || "";
   case "photo": {
     const has = (e.photos || e.photoIds || []).length > 0;
     if (has) return "";
     if (e.photoText !== undefined) return e.photoText;
     return m.checklist ? "" : (templateFor_(sec).photoText || "");
   }
   default: return e[field] === undefined || e[field] === null ? "" : String(e[field]);
 }
}

// ── BANDS (checklist mode) ──────────────────────────────────
function bandText_(m) {
 return m.kpi ? m.group + "\n" + m.kpi : m.group;
}

function bandLines_(m) {
 return 1 + (m.kpi ? m.kpi.split("\n").length : 0);
}

// Group name bold black; KPI lines bold red
function bandRich_(m) {
 const text = bandText_(m);
 const base = SpreadsheetApp.newTextStyle().setFontFamily(REPORT.FONT).setFontSize(REPORT.FONT_SIZE).setBold(true).setForegroundColor("#000000").build();
 const kpi = SpreadsheetApp.newTextStyle().setFontFamily(REPORT.FONT).setFontSize(REPORT.FONT_SIZE).setBold(true).setForegroundColor(REPORT.COLOR.KPI).build();
 const b = SpreadsheetApp.newRichTextValue().setText(text).setTextStyle(0, text.length, base);
 if (m.kpi) b.setTextStyle(m.group.length + 1, text.length, kpi);
 return b.build();
}

// ── RICH TEXT: **bold** lead-in labels ──────────────────────
function boldRich_(text) {
 const runs = [];
 let plain = "";
 const parts = String(text).split("**");
 parts.forEach((p, i) => {
   // odd-indexed parts sit between ** pairs. An unmatched trailing ** is treated as plain text.
   const bold = i % 2 === 1 && i < parts.length - 1;
   if (i % 2 === 1 && i === parts.length - 1) plain += "**";
   if (bold && p.length) runs.push([plain.length, plain.length + p.length]);
   plain += p;
 });
 const normal = SpreadsheetApp.newTextStyle().setFontFamily(REPORT.FONT).setFontSize(REPORT.FONT_SIZE).setBold(false).setForegroundColor("#000000").build();
 const bold = SpreadsheetApp.newTextStyle().setFontFamily(REPORT.FONT).setFontSize(REPORT.FONT_SIZE).setBold(true).setForegroundColor("#000000").build();
 const b = SpreadsheetApp.newRichTextValue().setText(plain).setTextStyle(0, plain.length, normal);
 runs.forEach(r => b.setTextStyle(r[0], r[1], bold));
 return b.build();
}

// Plain-text length of a cell value for height estimation (strip ** markers)
function plainText_(v) {
 return String(v === undefined || v === null ? "" : v).replace(/\*\*/g, "");
}

// ── ROW HEIGHT ESTIMATE ─────────────────────────────────────
// Sheets cannot auto-fit merged rows or rows holding floating images, so we estimate.
// Tune REPORT.CHAR_PX / LINE_PX in Config.gs if PDF rows come out too tight or too loose.
function estHeight_(text, widthPx, factor) {
 const usable = Math.max(20, widthPx - 8);
 const perLine = Math.max(1, Math.floor(usable / (REPORT.CHAR_PX * (factor || 1))));
 let lines = 0;
 plainText_(text).split("\n").forEach(par => { lines += Math.max(1, Math.ceil(par.length / perLine)); });
 return lines * REPORT.LINE_PX + REPORT.ROW_PAD_PX;
}

// ── PHOTOS ──────────────────────────────────────────────────
// Entry photos: Drive file ids (private files, read with the script owner's access) or Blobs.
function loadPhotos_(entry, colWidthPx) {
 const list = entry.photos || entry.photoIds || [];
 const out = [];
 list.forEach(p => {
   if (!p) return;
   try {
     const blob = typeof p === "string" ? DriveApp.getFileById(p).getBlob() : p;
     const size = imageSize_(blob);
     const availW = Math.max(20, colWidthPx - 2 * REPORT.PHOTO_PAD_PX);
     let w = availW, h = Math.round(availW * size.h / size.w);
     if (h > REPORT.PHOTO_MAX_H_PX) { h = REPORT.PHOTO_MAX_H_PX; w = Math.round(h * size.w / size.h); }
     out.push({ blob, w, h });
   } catch (err) {
     Logger.log("Photo skipped (" + (typeof p === "string" ? p : "blob") + "): " + err);
     out.push({ error: String(err) });
   }
 });
 return out;
}

function photoStackHeight_(pics) {
 const ok = pics.filter(p => p.blob);
 if (!ok.length) return 0;
 return ok.reduce((s, p) => s + p.h, 0) + (ok.length - 1) * REPORT.PHOTO_GAP_PX + 2 * REPORT.PHOTO_PAD_PX;
}

// Stack photos vertically inside the RUJUKAN cell. A photo that cannot be inserted leaves a note instead.
function placePhotos_(sheet, row, col, colWidthPx, m) {
 let y = REPORT.PHOTO_PAD_PX, failed = 0;
 (m.pics || []).forEach(p => {
   if (!p.blob) { failed++; return; }
   try {
     const img = sheet.insertImage(p.blob, col, row, REPORT.PHOTO_PAD_PX, y);
     img.setWidth(p.w).setHeight(p.h);
     y += p.h + REPORT.PHOTO_GAP_PX;
   } catch (err) {
     failed++;
     Logger.log("insertImage failed: " + err);
   }
 });
 if (failed) {
   const cell = sheet.getRange(row, col);
   cell.setValue((cell.getValue() ? cell.getValue() + "\n" : "") + "[" + failed + " gambar tidak dapat dimasukkan]");
 }
}

// Width/height of PNG, JPEG or GIF straight from the bytes (Apps Script has no image library).
function imageSize_(blob) {
 const b = blob.getBytes();
 const u = i => b[i] & 0xff;
 if (b.length > 24 && u(0) === 0x89 && u(1) === 0x50) { // PNG
   return { w: (u(16) << 24 | u(17) << 16 | u(18) << 8 | u(19)) >>> 0, h: (u(20) << 24 | u(21) << 16 | u(22) << 8 | u(23)) >>> 0 };
 }
 if (b.length > 10 && u(0) === 0x47 && u(1) === 0x49) { // GIF
   return { w: u(6) | u(7) << 8, h: u(8) | u(9) << 8 };
 }
 if (u(0) === 0xff && u(1) === 0xd8) { // JPEG: walk the segments to a SOFn marker
   let i = 2;
   while (i + 9 < b.length) {
     if (u(i) !== 0xff) { i++; continue; }
     const marker = u(i + 1);
     if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
     const len = u(i + 2) << 8 | u(i + 3);
     if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
       return { h: u(i + 5) << 8 | u(i + 6), w: u(i + 7) << 8 | u(i + 8) };
     }
     i += 2 + len;
   }
 }
 return { w: 4, h: 3 }; // unknown format: assume 4:3
}

// ── SIGN-OFF BLOCKS ─────────────────────────────────────────
// Each block: bold title, blank rows for wet signature/stamp, then name (bold), designation, unit,
// hospital, "Tarikh :", and (if approved digitally) a small grey line. No borders.
function writeSignoffBlocks_(sheet, row, blocks) {
 const gap = REPORT.SIGN_GAP_ROWS;
 const lines = blocks.map(b => signoffLines_(b));
 const maxLines = Math.max.apply(null, lines.map(l => l.length));
 const nameRow = 1 + gap;                 // index of the name line inside the block
 blocks.forEach((b, k) => {
   const rowsOfBlock = lines[k];
   rowsOfBlock.forEach((line, i) => {
     const cell = sheet.getRange(row + i, b.col);
     cell.setValue(line.text).setWrap(false).setVerticalAlignment("middle");
     if (line.bold) cell.setFontWeight("bold");
     if (line.grey) cell.setFontColor(REPORT.COLOR.GREY).setFontSize(7);
   });
 });
 for (let i = 0; i < maxLines; i++) {
   sheet.setRowHeight(row + i, (i >= 1 && i < nameRow) ? REPORT.SIGN_GAP_ROW_PX : 16);
 }
 return row + maxLines;
}

function signoffLines_(b) {
 const p = b.person || {};
 const lines = [{ text: b.title, bold: true }];
 for (let i = 0; i < REPORT.SIGN_GAP_ROWS; i++) lines.push({ text: "" });
 lines.push({ text: p.name || "", bold: true });
 if (p.designation) lines.push({ text: p.designation });
 if (p.unit) lines.push({ text: p.unit });
 lines.push({ text: HOSPITAL_NAME });
 const date = p.date ? (b.dateStyle === "short" ? shortDate_(p.date) : malayDate_(p.date)) : "";
 lines.push({ text: "Tarikh : " + date });
 if (p.approvedAt) lines.push({ text: "Diluluskan secara digital dalam Portal CGR — " + stampTime_(p.approvedAt), grey: true });
 return lines;
}

// Overall sign-off under section 1: three blocks side by side (plan §4.6)
function writeOverallSignoff_(sheet, row, signoff, tmpl) {
 const ncols = tmpl.headers.length;
 const cols = ncols >= 9 ? [1, 4, 7] : [1, 3, 5];
 const blocks = [
   { title: "Laporan Keseluruhan Disediakan Oleh :", person: signoff.prepared, col: cols[0] },
   { title: "Laporan Keseluruhan Disemak Oleh :", person: signoff.reviewed, col: cols[1] },
   { title: "Laporan Keseluruhan Disahkan Oleh :", person: signoff.approved, col: cols[2] },
 ].filter(b => b.person);
 return writeSignoffBlocks_(sheet, row, blocks);
}

// ── SMALL HELPERS ───────────────────────────────────────────
function boxBorder_(range, inner) {
 range.setBorder(true, true, true, true, !!inner, !!inner, REPORT.COLOR.BORDER, SpreadsheetApp.BorderStyle.SOLID);
}

// Date / "yyyy-mm-dd[Thh:mm…]" → {y, m, d}; null if not a date
function dateParts_(v) {
 if (v instanceof Date) return { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() };
 const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
 return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

// "10 Julai 2026" (non-dates are returned as typed)
function malayDate_(v) {
 const p = dateParts_(v);
 return p ? p.d + " " + BULAN[p.m - 1] + " " + p.y : String(v || "");
}

// "17/07/2026"
function shortDate_(v) {
 const p = dateParts_(v);
 return p ? ("0" + p.d).slice(-2) + "/" + ("0" + p.m).slice(-2) + "/" + p.y : String(v || "");
}

// dd/mm/yyyy hh:mm for the digital-approval line
function stampTime_(v) {
 const d = v instanceof Date ? v : new Date(v);
 if (isNaN(d.getTime())) return String(v);
 return Utilities.formatDate(d, "Asia/Kuala_Lumpur", "dd/MM/yyyy HH:mm");
}
