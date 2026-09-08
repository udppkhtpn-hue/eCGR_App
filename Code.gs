/**
* ============================================================
* CGR 2026 WEB APP — BACKEND (Code.gs)
* Hospital Tengku Permaisuri Norashikin (HTPN)
* Unit Pengurusan Risiko dan Survelan Klinikal
* ============================================================
*
* SETUP INSTRUCTIONS:
* 1. Go to script.google.com → New Project → name it "CGR 2026 Web App"
* 2. Create two files:
*    - Code.gs  → paste this file
*    - Index.html → paste the Index.html file
* 3. Update CONFIG below (Sheet ID and notification email)
* 4. Click Deploy → New Deployment → Web App
*    - Execute as: Me
*    - Who has access: Anyone (within your organisation, or Anyone)
* 5. Copy the Web App URL and share with CGR team
* ============================================================
*/


const CONFIG = {
 // STEP 1: Create a new Google Sheet, copy its ID from the URL
 // URL format: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
 SHEET_ID: "1s66ybd5OGg1iGegeZ88EXFPWSy9idzAkcAaWARKc41E",


 // STEP 2: Update with Dr. Aina Zuhana's actual MOH email
 NOTIFICATION_EMAIL: "dr_ainazuhana@moh.gov.my",


 // Sheet tab name for responses
 SHEET_TAB: "CGR Responses",


 // Google Drive folder ID to store uploaded photos
 // Create a folder in Drive, share it, copy the ID from URL
 PHOTO_FOLDER_ID: "1Y0nH3OlWqM18ZT_1udUE5Zi71wsmPnh1",
};


// ── SERVE THE WEB APP ───────────────────────────────────────
function doGet() {
 return HtmlService.createHtmlOutputFromFile("Index")
   .setTitle("CGR 2026 — HTPN")
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
   .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}


// ── RECEIVE FORM SUBMISSION ─────────────────────────────────
function submitForm(data) {
 try {
   const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
   let sheet = ss.getSheetByName(CONFIG.SHEET_TAB);


   // Create sheet with headers if it doesn't exist
   if (!sheet) {
     sheet = ss.insertSheet(CONFIG.SHEET_TAB);
     const headers = [
       "Timestamp", "Auditor", "Jawatan/Unit", "Jabatan Dilawati",
       "Tarikh Rondaan", "Masa Mula", "Masa Tamat", "Bahasa",
       "Checklist", "Bil", "Perkara", "Status",
       "Penemuan", "Tindakan Pembetulan", "Penemuan Susulan",
       "Foto URL", "Lain-lain Perkara", "Rumusan", "Isu Kritikal"
     ];
     sheet.appendRow(headers);
     sheet.setFrozenRows(1);
     sheet.getRange(1, 1, 1, headers.length).setBackground("#1a4a7a").setFontColor("#ffffff").setFontWeight("bold");
   }


   const timestamp = new Date();
   const rows = [];


   // Write one row per checklist item
   for (const section of data.sections) {
     for (const item of section.items) {
       rows.push([
         timestamp,
         data.auditor,
         data.jawatan,
         data.jabatan,
         data.tarikh,
         data.masaMula,
         data.masaTamat || "",
         data.bahasa,
         section.title,
         item.bil,
         item.perkara,
         item.status || "",
         item.penemuan || "",
         item.tindakan || "",
         item.susulan || "",
         item.fotoUrl || "",
         section.lainLain || "",
         data.rumusan || "",
         data.isuKritikal || "",
       ]);
     }
   }


   if (rows.length > 0) {
     sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
   }


   // Send email notification
   sendEmail(data, timestamp);


   return { success: true, message: "Berjaya dihantar! / Submitted successfully!" };
 } catch (e) {
   Logger.log("Error: " + e.toString());
   return { success: false, message: "Ralat: " + e.toString() };
 }
}


// ── UPLOAD PHOTO TO GOOGLE DRIVE ────────────────────────────
function uploadPhoto(base64Data, fileName, mimeType) {
 try {
   const folder = DriveApp.getFolderById(CONFIG.PHOTO_FOLDER_ID);
   const blob = Utilities.newBlob(
     Utilities.base64Decode(base64Data),
     mimeType,
     fileName
   );
   const file = folder.createFile(blob);
   file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
   return { success: true, url: file.getUrl(), id: file.getId() };
 } catch (e) {
   Logger.log("Photo upload error: " + e.toString());
   return { success: false, url: "", message: e.toString() };
 }
}


// ── SEND EMAIL NOTIFICATION ─────────────────────────────────
function sendEmail(data, timestamp) {
 try {
   const checklistNames = data.sections.map(s => s.title).join("\n  • ");
   const subject = `[CGR 2026] Laporan Baru — ${data.jabatan} (${data.tarikh})`;


   const body = `
Assalamualaikum / Selamat Sejahtera Dr. Aina Zuhana,


Laporan CGR baru telah dihantar. Maklumat ringkas:


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAKLUMAT RONDAAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auditor        : ${data.auditor}
Jawatan / Unit : ${data.jawatan}
Jabatan        : ${data.jabatan}
Tarikh         : ${data.tarikh}
Masa           : ${data.masaMula} — ${data.masaTamat || "belum diisi"}


SENARAI SEMAK DIGUNAKAN:
 • ${checklistNames}


${data.isuKritikal ? "⚠️  ISU KRITIKAL:\n" + data.isuKritikal + "\n" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RUMUSAN:
${data.rumusan || "Tiada rumusan diisi."}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sila semak respons penuh dalam Google Sheets:
https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}


Dihantar pada: ${timestamp.toLocaleString("ms-MY")}
─────────────────────────────────
Sistem CGR Digital HTPN 2026
Unit Pengurusan Risiko dan Survelan Klinikal
Hospital Tengku Permaisuri Norashikin
   `;


   MailApp.sendEmail({
     to: CONFIG.NOTIFICATION_EMAIL,
     subject: subject,
     body: body,
   });
 } catch (e) {
   Logger.log("Email error: " + e.toString());
 }
}
