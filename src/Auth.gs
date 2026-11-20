/**
* ============================================================
* AUTH.GS — PIN hashing + PEPPER handling (Phase 0 only)
* Login, sessions and lockout arrive in Phase 1.
*
* PIN hash = hex SHA-256 of  salt + pin + PEPPER
* PEPPER is a random secret in Script Properties (never in the Sheet), so a
* leaked Sheet alone cannot be brute-forced offline.
* ============================================================
*/

const PEPPER_PROP_ = "PIN_PEPPER";

// Every top-level function without a trailing "_" can be called from the browser via
// google.script.run — and the web app is anonymous. Admin/maintenance functions must
// call this first so they only run from the Apps Script editor.
// From the editor, getActiveUser() is the person running it; from an anonymous web-app
// call it is empty, so the check fails.
function requireEditor_() {
 const active = Session.getActiveUser().getEmail();
 const effective = Session.getEffectiveUser().getEmail();
 if (!active || active !== effective) {
   throw new Error("Run this function from the Apps Script editor.");
 }
}

// Returns the pepper, creating a random one on first use.
function getPepper_() {
 const props = PropertiesService.getScriptProperties();
 let pepper = props.getProperty(PEPPER_PROP_);
 if (!pepper) {
   pepper = Utilities.getUuid() + Utilities.getUuid();
   props.setProperty(PEPPER_PROP_, pepper);
 }
 return pepper;
}

// 16 random hex chars
function newSalt_() {
 return Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}

function hashPin_(pin, salt) {
 const digest = Utilities.computeDigest(
   Utilities.DigestAlgorithm.SHA_256,
   String(salt) + String(pin) + getPepper_(),
   Utilities.Charset.UTF_8
 );
 return bytesToHex_(digest);
}

function verifyPin_(pin, salt, expectedHash) {
 return hashPin_(pin, salt) === String(expectedHash);
}

// Random 6-digit PIN (leading zeros allowed)
function randomPin_() {
 const hex = Utilities.getUuid().replace(/-/g, "");
 let n = 0;
 for (let i = 0; i < 12; i++) n = (n * 16 + parseInt(hex[i], 16)) % 1000000;
 return ("000000" + n).slice(-6);
}

// Apps Script digests are signed bytes — mask to unsigned before hex.
function bytesToHex_(bytes) {
 return bytes.map(b => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
}
