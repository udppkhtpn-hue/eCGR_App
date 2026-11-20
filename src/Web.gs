/**
* ============================================================
* WEB.GS — serve the web app
* The UI is split into Index (shell) + Styles + App; Index pulls
* the other two in with include().
* ============================================================
*/

// ── SERVE THE WEB APP ───────────────────────────────────────
function doGet() {
 return HtmlService.createTemplateFromFile("Index")
   .evaluate()
   .setTitle("CGR 2026 — HTPN")
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
   .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

// Used in templates as <?!= include('Styles') ?> — returns the raw file content
// (no scriptlet evaluation, so JS/CSS containing "<?" is safe).
function include(name) {
 return HtmlService.createHtmlOutputFromFile(name).getContent();
}
