/**
* ============================================================
* DB.GS — small data layer over the portal tabs
* Sheets is the database: whole-tab reads, LockService around writes.
* All helpers end with "_" so google.script.run cannot call them.
*
* Portal tabs are formatted as plain text, so IDs such as "0123" or
* "2026-07-10" are never coerced to numbers/dates. Values read back
* may therefore be strings — use Number()/bool_() where it matters.
* ============================================================
*/

function getSpreadsheet_() {
 return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

// Tab by name; null if missing.
function getSheet_(name) {
 return getSpreadsheet_().getSheetByName(name);
}

function getSheetOrThrow_(name) {
 const sh = getSheet_(name);
 if (!sh) throw new Error("Tab not found: " + name + " — run setupPortal() first.");
 return sh;
}

// Whole tab → array of objects keyed by the header row. Blank rows are skipped.
function readTable_(name) {
 const sh = getSheetOrThrow_(name);
 const lastRow = sh.getLastRow();
 const lastCol = sh.getLastColumn();
 if (lastRow < 2 || lastCol < 1) return [];
 const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
 const headers = values[0].map(String);
 const out = [];
 for (let r = 1; r < values.length; r++) {
   const row = values[r];
   if (row.every(v => v === "" || v === null)) continue;
   const obj = {};
   headers.forEach((h, c) => { if (h) obj[h] = row[c]; });
   obj._row = r + 1; // 1-based sheet row, handy for updates
   out.push(obj);
 }
 return out;
}

// Append objects (keys = header names; missing keys → blank). Returns the number of rows added.
function appendRows_(name, objects) {
 if (!objects || !objects.length) return 0;
 return withLock_(() => {
   const sh = getSheetOrThrow_(name);
   const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
   const rows = objects.map(o => headers.map(h => cell_(o[h])));
   sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
   return rows.length;
 });
}

// Merge `patch` into the first row whose keyField equals keyValue. Returns true if a row was found.
function updateRow_(name, keyField, keyValue, patch) {
 return withLock_(() => {
   const sh = getSheetOrThrow_(name);
   const lastRow = sh.getLastRow();
   if (lastRow < 2) return false;
   const lastCol = sh.getLastColumn();
   const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
   const headers = values[0].map(String);
   const keyCol = headers.indexOf(keyField);
   if (keyCol < 0) throw new Error("Unknown column " + keyField + " in " + name);
   for (let r = 1; r < values.length; r++) {
     if (String(values[r][keyCol]) !== String(keyValue)) continue;
     Object.keys(patch).forEach(k => {
       const c = headers.indexOf(k);
       if (c >= 0) sh.getRange(r + 1, c + 1).setValue(cell_(patch[k]));
     });
     return true;
   }
   return false;
 });
}

// Value → what we store in a (plain-text) cell: dates as ISO text, booleans as TRUE/FALSE.
function cell_(v) {
 if (v === undefined || v === null) return "";
 if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
 if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
 return v;
}

// Read a stored boolean back (true / "TRUE" / "true" / 1).
function bool_(v) {
 return v === true || String(v).toLowerCase() === "true" || String(v) === "1";
}

// Sequential id per prefix and day, e.g. newId_("R") → "R-20261120-0007".
// The counter lives in Script Properties and is bumped under the script lock.
function newId_(prefix) {
 return withLock_(() => {
   const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
   const props = PropertiesService.getScriptProperties();
   const key = "seq:" + prefix + ":" + day;
   const n = Number(props.getProperty(key) || 0) + 1;
   props.setProperty(key, String(n));
   return prefix + "-" + day + "-" + String(n).padStart(4, "0");
 });
}

// Run fn under the script-wide lock (waits up to 30 s). Re-entrant within one execution.
let LOCK_DEPTH_ = 0;
function withLock_(fn) {
 if (LOCK_DEPTH_ > 0) return fn();
 const lock = LockService.getScriptLock();
 lock.waitLock(30000);
 LOCK_DEPTH_++;
 try {
   return fn();
 } finally {
   LOCK_DEPTH_--;
   lock.releaseLock();
 }
}
