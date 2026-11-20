/**
* ============================================================
* CONFIG.GS — IDs, constants, sheet names, report layout
* Hospital Tengku Permaisuri Norashikin (HTPN)
* Unit Pengurusan Risiko dan Survelan Klinikal
* ============================================================
* Real IDs below are the live ones. On a STAGING project point
* SHEET_ID / PHOTO_FOLDER_ID at copies before running anything.
* ============================================================
*/

const CONFIG = {
 // Spreadsheet "CGR 2026 Responses" (URL: .../spreadsheets/d/SHEET_ID_HERE/edit)
 SHEET_ID: "1s66ybd5OGg1iGegeZ88EXFPWSy9idzAkcAaWARKc41E",

 // CGR Coordinator (Dr. Aina Zuhana) — gets the submission email
 NOTIFICATION_EMAIL: "dr_ainazuhana@moh.gov.my",

 // Legacy form responses tab (never modified by the portal)
 SHEET_TAB: "CGR Responses",

 // Drive folder for uploaded photos (private files — no public links)
 PHOTO_FOLDER_ID: "1Y0nH3OlWqM18ZT_1udUE5Zi71wsmPnh1",

 // Drive folder for generated reports. Blank = setupPortal() creates "CGR Reports"
 // in the owner's Drive and remembers it in Script Properties (REPORTS_FOLDER_ID).
 REPORTS_FOLDER_ID: "",
};

// ── PORTAL TABS (see docs/PORTAL_PLAN.md §6.2) ──────────────
const TAB = {
 USERS: "Users",
 UNITS: "Units",
 DEPARTMENTS: "Departments",
 SECTIONS: "Sections",
 CHECKLIST_ITEMS: "ChecklistItems",
 ROUNDS: "Rounds",
 PANEL: "Panel",
 ROUND_SECTIONS: "RoundSections",
 ENTRIES: "Entries",
 OSH_SCORES: "OshScores",
 AUDIT_LOG: "AuditLog",
};

const HOSPITAL_NAME = "Hospital Tengku Permaisuri Norashikin";

// ── REPORT LAYOUT (plan §4) ─────────────────────────────────
const REPORT = {
 FONT: "Arial",
 FONT_SIZE: 8,
 COLOR: {
   BANNER: "#215967",      // section banner row
   HEADER: "#D9D9D9",      // column header row
   BAND: "#92CDDC",        // checklist group band
   KPI: "#FF0000",         // KPI text inside a band
   BORDER: "#000000",
   GREY: "#7F7F7F",        // "Diluluskan secara digital..." line
   SHADE: "#000000",       // not-applicable cells in checklist mode
 },
 // Total printable width in px that the relative column widths are scaled to
 // (A4 landscape 11.69in - 2 x 0.4in margins = ~10.9in ≈ 1045px @ 96dpi).
 // PDF export uses fit-to-width, so this only fixes proportions.
 TOTAL_WIDTH_PX: 1050,
 // Row-height estimation for Arial 8 (Sheets does not auto-fit rows that are merged / hold images)
 CHAR_PX: 5.2,
 LINE_PX: 12,
 ROW_PAD_PX: 6,
 MIN_ROW_PX: 21,
 BAND_LINE_PX: 14,
 // Photos in the RUJUKAN cell
 PHOTO_PAD_PX: 3,
 PHOTO_GAP_PX: 4,
 PHOTO_MAX_H_PX: 360,
 // Blank rows left above a name for wet signature / stamp
 SIGN_GAP_ROWS: 3,
 SIGN_GAP_ROW_PX: 18,

 // Column templates. `fields` map each column to a field of an entry (photo = image cell).
 // Widths are relative units (plan §4.3) — scaled to TOTAL_WIDTH_PX per tab.
 TEMPLATES: {
   BM9: {
     headers: ["BIL", "KANDUNGAN", "PERKARA", "PENEMUAN", "RUJUKAN (GAMBAR)", "TINDAKAN PEMBETULAN & PENAMBAHBAIKAN", "FASILITI/ NAMA RUANG", "MAKLUMBALAS JABATAN", "TINDAKAN SUSULAN"],
     fields: ["bil", "kandungan", "perkara", "penemuan", "photo", "tindakan", "fasiliti", "maklumbalas", "susulan"],
     widths: [4, 10, 12, 17, 13, 14, 10, 10, 10],
     photoText: "Tiada",
   },
   EN9: {
     headers: ["NO", "CONTENT", "ISSUE", "FINDINGS", "REFERENCE (PHOTO)", "CORRECTIVE & IMPROVEMENT ACTIONS", "FACILITY / ROOM /AREA", "DEPARTMENT FEEDBACK", "FOLLOW-UP ACTION"],
     fields: ["bil", "kandungan", "perkara", "penemuan", "photo", "tindakan", "fasiliti", "maklumbalas", "susulan"],
     widths: [4, 10, 12, 17, 13, 14, 10, 10, 10],
     photoText: "N/A",
   },
   "QUALITY+photo": {
     headers: ["Bil.", "Clause - Plan of Action/ Issue", "Findings", "Reference (Photo)", "Suggested Improvements", "Feedback from Department"],
     fields: ["bil", "perkara", "penemuan", "photo", "tindakan", "maklumbalas"],
     widths: [4, 16, 34, 16, 20, 14],
     photoText: "N/A",
   },
   QUALITY: {
     headers: ["Bil.", "Clause - Plan of Action/ Issue", "Findings", "Suggested Improvements", "Feedback from Department"],
     fields: ["bil", "perkara", "penemuan", "tindakan", "maklumbalas"],
     widths: [4, 16, 34, 20, 14],
     photoText: "",
   },
 },
};

// Malay month names for long dates ("10 Julai 2026")
const BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
