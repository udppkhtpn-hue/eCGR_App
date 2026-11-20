/**
* ============================================================
* SETUP.GS — one-time portal setup + legacy migration
*
*   setupPortal()          idempotent: creates missing tabs + seeds empty ones
*   migrateLegacy(dryRun)  CGR Responses → Rounds/Entries (read-only on the legacy tab)
*
* Run from the Apps Script editor (not callable from the web app:
* the web UI never invokes these, and they only create missing tabs/rows).
* ============================================================
*/

// ── TABLE DEFINITIONS (plan §6.2) ───────────────────────────
const PORTAL_TABLES_ = [
 [TAB.USERS, ["staffId", "name", "designation", "role", "unitId", "deptId", "flags", "email", "pinHash", "pinSalt", "mustChangePin", "active", "failedLogins", "lockedUntil", "lastLogin"]],
 [TAB.UNITS, ["unitId", "name", "shortName"]],
 [TAB.DEPARTMENTS, ["deptId", "name", "headStaffId", "roundEveryDays", "active"]],
 [TAB.SECTIONS, ["sectionId", "appNum", "title", "bannerTitle", "laporanPrefix", "template", "mode", "checklistId", "ownerUnitId", "reportOrder", "kandunganLabel", "contentLabel", "appliesToDeptIds", "active"]],
 [TAB.CHECKLIST_ITEMS, ["checklistId", "itemId", "group", "groupKpi", "group_en", "perkara", "perkara_en", "order", "active"]],
 [TAB.ROUNDS, ["roundId", "deptId", "date", "waktu", "status", "sectionIds", "createdBy", "compiledBy", "compiledAt", "reviewedBy", "reviewedAt", "approvedBy", "approvedAt", "releasedAt", "ackBy", "ackAt", "reportSheetId", "reportPdfId"]],
 [TAB.PANEL, ["roundId", "staffId", "name", "unitShortName", "order"]],
 [TAB.ROUND_SECTIONS, ["roundId", "sectionId", "status", "noFindings", "noFindingsText", "appendixText", "appendixUrl", "preparedBy", "preparedAt", "reviewedBy", "reviewedAt"]],
 [TAB.ENTRIES, ["entryId", "roundId", "sectionId", "order", "itemId", "kandungan", "perkara", "penemuan", "photoIds", "tindakan", "fasiliti", "rating", "maklumbalas", "maklumbalasBy", "maklumbalasAt", "susulan", "susulanBy", "susulanAt", "evidenceIds", "state"]],
 [TAB.OSH_SCORES, ["roundId", "itemKey", "value"]],
 [TAB.AUDIT_LOG, ["timestamp", "staffId", "event", "refId", "details"]],
];

// ── SEED: UNITS (names from the panel list on the sample covers) ──
const SEED_UNITS = [
 { unitId: "uprsk", name: "Unit Pengurusan Risiko dan Survelan Klinikal", shortName: "UPRSK" },
 { unitId: "uki", name: "Unit Kawalan Infeksi", shortName: "UKI" },
 { unitId: "uppppp", name: "Unit Perkembangan Profesion Pakar dan Pegawai Perubatan", shortName: "UPPPPP" },
 { unitId: "medikolegal", name: "Unit Medikolegal dan Etika", shortName: "Medikolegal" },
 { unitId: "uka", name: "Unit Keselamatan dan Kesihatan Pekerjaan", shortName: "UKA/OSH" },
 { unitId: "kejururawatan", name: "Unit Kejururawatan", shortName: "Kejururawatan" },
 { unitId: "penyelia", name: "Unit Penyelia Hospital", shortName: "Penyeliaan" },
 { unitId: "kejuruteraan", name: "Unit Kejuruteraan", shortName: "Kejuruteraan" },
 { unitId: "upas", name: "Unit Pengurusan Aset dan Setor", shortName: "UPAS" },
 { unitId: "rekod", name: "Jabatan Rekod Perubatan", shortName: "Rekod Perubatan" },
 { unitId: "it", name: "Unit Teknologi Maklumat", shortName: "Teknologi Maklumat" },
 { unitId: "cgr", name: "Kumpulan CGR", shortName: "CGR" },
];

// ── SEED: DEPARTMENTS (from the form's dropdown; OMFS and SCD split into the two report names) ──
const SEED_DEPARTMENTS = [
 { deptId: "omfs", name: "Klinik Pakar Bedah Mulut dan Maksilofasial" },
 { deptId: "scd", name: "Klinik Pakar Pergigian Penjagaan Khas" },
 { deptId: "farmasi", name: "Farmasi" },
 { deptId: "kecemasan", name: "Kecemasan dan Trauma" },
 { deptId: "pediatrik", name: "Pediatrik" },
 { deptId: "radiologi", name: "Radiologi" },
 { deptId: "forensik", name: "Forensik" },
 { deptId: "pembedahan", name: "Pembedahan" },
 { deptId: "ortopedik", name: "Ortopedik" },
 { deptId: "patologi", name: "Patologi" },
 { deptId: "nefrologi", name: "Nefrologi" },
 { deptId: "jds", name: "Unit Dietetik dan Sajian" },
 { deptId: "lain", name: "Lain-lain" },
];

// ── SEED: SECTIONS (plan §3, in app-number order) ───────────
// laporanPrefix = banner reads "LAPORAN CLINICAL GOVERNANCE ROUND …" (as seen in the samples).
function seedSections_() {
 const row = (appNum, title, bannerTitle, laporanPrefix, template, mode, checklistId, ownerUnitId, reportOrder, kandunganLabel, contentLabel, appliesToDeptIds) => ({
   sectionId: "sec" + appNum, appNum, title, bannerTitle, laporanPrefix, template, mode, checklistId, ownerUnitId,
   reportOrder, kandunganLabel, contentLabel: contentLabel || kandunganLabel, appliesToDeptIds: appliesToDeptIds || "", active: true,
 });
 return [
   row(1, "Pemerhatian Am Wad", "PEMERHATIAN UMUM (GENERAL OBSERVATION)", false, "BM9", "findings", "cl1", "uprsk", 1, "Pemerhatian Umum"),
   row(2, "Keselamatan Kebakaran", "KESELAMATAN KEBAKARAN", false, "BM9", "findings", "cl2", "penyelia", 2, "Keselamatan Kebakaran (Fire Safety)"),
   row(3, "Kawalan Infeksi", "AUDIT KAWALAN INFEKSI", false, "EN9", "findings", "cl3", "uki", 5, "Audit Kawalan Infeksi ( Infection Control Audit )"),
   row(4, "Kejururawatan", "KEJURURAWATAN", false, "EN9 checklist", "checklist", "cl4", "kejururawatan", 11, "Kejururawatan", "Nursing"),
   row(5, "Kualiti", "UNIT PENGURUSAN RISIKO DAN SURVELAN KLINIKAL", true, "QUALITY+photo", "findings", "cl11", "uprsk", 6, "Audit Unit Pengurusan Risiko dan Survelan Klinikal"),
   row(6, "Pengurusan Aset", "UNIT PENGURUSAN ASET DAN SETOR", true, "BM9", "findings", "cl12", "upas", 9, "Pengurusan Aset"),
   row(7, "Perkhidmatan Kejuruteraan", "PERKHIDMATAN SOKONGAN KLINIKAL", false, "BM9", "findings", "cl13", "kejuruteraan", 3, "Perkhidmatan Sokongan Klinikal"),
   row(8, "Jabatan Kecemasan (ETD)", "JABATAN KECEMASAN", false, "BM9", "findings", "cl14", "cgr", 13, "Jabatan Kecemasan", "", "kecemasan"),
   row(9, "Unit Dietetik dan Sajian (JDS)", "UNIT DIETETIK DAN SAJIAN", false, "BM9", "findings", "cl16", "cgr", 14, "Unit Dietetik dan Sajian", "", "jds"),
   row(10, "Pemeriksaan Tempat Kerja OSH", "AUDIT KESELAMATAN DAN KESIHATAN", false, "BM9", "findings", "cl17", "uka", 4, "Audit Keselamatan dan Kesihatan (Safety and Health Audit)"),
   row(11, "Medikolegal", "MEDIKOLEGAL", true, "EN9", "findings", "cl18", "medikolegal", 8, "Medikolegal"),
   row(12, "Perkembangan Profesion Pakar & Pegawai Perubatan", "UNIT PROFESION PAKAR DAN PEGAWAI PERUBATAN", true, "QUALITY", "findings", "", "uppppp", 7, "Perkembangan Profesion Pakar dan Pegawai Perubatan"),
   row(13, "Rekod Perubatan", "PENGURUSAN REKOD PERUBATAN", true, "BM9", "findings", "", "rekod", 10, "Rekod Perubatan"),
   row(14, "Teknologi Maklumat", "INFORMATION TECHNOLOGY", false, "EN9", "findings", "", "it", 12, "Teknologi Maklumat", "Information Technology"),
 ];
}

// ── SEED: KEJURURAWATAN groups / KPI lines / English text ───
// Wording taken from the nursing section (11) of the OMFS sample report. The live form's
// 47 nursing items (4.1–4.47) map onto the sample's groups in order. BM group names are a
// translation by Claude Code — to be confirmed by Unit Kejururawatan.
const NURSING_GROUPS_ = [
 { from: 1, to: 12, group: "Pengurusan Pesakit (Semakan Rawak)", group_en: "Patient Management (Random Check)", kpi: "" },
 { from: 13, to: 19, group: "Keselamatan Transfusi", group_en: "Transfusion Safety", kpi: "MPSG KPI 6. Number of incorrect blood component transfusion (IBCT) STANDARD: ZERO" },
 { from: 20, to: 24, group: "Kejatuhan Pesakit", group_en: "Patient Fall", kpi: "MPSG KPI 7: Rate of patient fall ( Standard : Inpatient: ≤ 5 per 1000 patient- days, Outpatient/ Primary Healthcare Facilities : ≤ 5%)" },
 { from: 25, to: 31, group: "Pengenalpastian Pesakit yang Betul", group_en: "Correct Patient Identification", kpi: "MPSG KPI no 8. Number of incidents caused by wrong patient identification (Detected through incident reporting and investigation) (Standard : zero case)" },
 { from: 32, to: 37, group: "Discaj Pesakit (Semakan rawak nota kes pesakit discaj)", group_en: "Patient Discharge (Random check on some discharge case notes)", kpi: "" },
 { from: 38, to: 43, group: "Keselamatan Pembedahan", group_en: "Surgical Safety", kpi: "MPSG KPI 3. Number of “Wrong Surgery” performed (Standard:zero case)\nMPSG KPI 4. Number of unintended retained surgical item (URSI) (Standard: zero cases of category 2&3)" },
 { from: 44, to: 47, group: "Keselamatan Ubat", group_en: "Medication Safety", kpi: "MPSG KPI 5 . Number of medication error leading to severe HARM OR DEATH (Standard:zero case)" },
];

const NURSING_EN_ = {
 1: "Number of nurses (all grades) On duty? Nurses:Patient ratio",
 2: "Observation is appropriately recorded according to schedule? Vital signs charts & pain score? Comply with SOP? Checked on patient orientation form?",
 3: "Investigation ordered carried out?",
 4: "Medication ordered served, Nursing Notes/plans is in place, any medication error?",
 5: "Patients on drip- random check, drip flowing & date & time is written on the drip. Comply with SOP and observations include Thrombophlebitis?",
 6: "Any patients waiting for procedures and how long have to wait?",
 7: "Any DIL patients? Family Informed?",
 8: "If patient is having his/her meal, ask for comments on food",
 9: "Cleanliness, area satisfactory?",
 10: "BHT is safety is supervised?",
 11: "Medical Certificate (MC) book is kept in the drawer and locked? Person In charge is contactable",
 12: "Nursing report is update in the IT system (Random Check) - Handover of care - Ensure mechanism for continuation of care in place",
 13: "Are there any blood transfusions occurring in the ward now?",
 14: "Documentation (Statistics)",
 15: "Patient sampling & labelling with 2 identifiers",
 16: "Pre-transfusion checklist",
 17: "Bedside identification",
 18: "Filling up consent form",
 19: "Transfusion check list",
 20: "Documentation",
 21: "Tagging/red band for high-risk patients",
 22: "Magnetic sticker available in ward",
 23: "Evaluation of patients' condition (Eg: hypoglycaemia) and early intervention",
 24: "Environmental assessment",
 25: "Documentation by AJK - Data",
 26: "Upon admission or Transfer / transfer in / transfer to another hospital",
 27: "Dispensing medication (by staffs)",
 28: "Blood Transfusion",
 29: "Collection of bodily fluids (by staffs)",
 30: "Death confirmation",
 31: "Procedure and other Services Searching for patient MRN during registration",
 32: "No. of case notes of patients discharged still in wards",
 33: "No. of case notes checked",
 34: "No. belongings to patients discharged >1/52 ago",
 35: "No. of discharged summaries not completed?",
 36: "If MC given, duration and reference no. stated?",
 37: "If referred case, reply given to referral doctor?",
 38: "Documentation of AJK SSSL",
 39: "Only staff who have been accorded relevant privileges are allowed to perform any procedure/ surgery",
 40: "Conduct 'time-out' just before starting the procedure:",
 41: "Checking of Instrument before Surgery/Pre-op Count",
 42: "Procedure site marking (While patient awake)",
 43: "Implementing Best Practices to Prevent SSI",
 44: "DDA CUPBOARD - System of safe keeping of key in place - system documentation of movement of drugs in place - verification of stock against record- stock balances record",
 45: "Storage of drug - fridge item - non-fridge item",
 46: "Adherence of practice of 7 R",
 47: "Data any medication error or near miss",
};

// Sample items that the live form does not have yet (Others: Emergency Trolley / Equipment).
// Added to ChecklistItems only — BM text is a translation by Claude Code, to be confirmed.
const NURSING_EXTRA_ = [
 { group: "Lain-lain: Troli Kecemasan", group_en: "Others: Emergency Trolley", items: [
   ["Sistem semakan harian", "System for daily checking"],
   ["- sistem ada", "- system is available"],
   ["- semakan dilakukan mengikut jadual?", "- checking is carried out as scheduled?"],
   ["- semakan didokumentasikan?", "- checking is documented?"],
   ["Semakan rawak 5 item ubat", "Conduct random check on 5 drug items"],
   ["- ada ubat tamat tempoh?", "- any expired drugs?"],
   ["- percampuran ubat dalam petak yang sama?", "- mixing of drugs in same compartment?"],
   ["Instrumen/Peralatan Kecemasan", "Emergency Instruments/Equipment"],
   ["- laringoskop dewasa tersedia?", "- laryngoscope – adult available?"],
   ["- laringoskop kanak-kanak tersedia?", "- laryngoscope – child available?"],
 ]},
 { group: "Lain-lain: Peralatan Kecemasan", group_en: "Others: Emergency Equipment", items: [
   ["Sistem semakan berkala fungsi peralatan?", "System for regular checking on function of equipment?"],
   ["Sistem semakan berkala dilaksanakan?", "System of regular checking being carried out?"],
   ["Ada peralatan penting tidak berfungsi?", "Any vital equipment not functioning?"],
 ]},
];

// ── SEED: CHECKLISTS — copy of the CHECKLISTS array in the form (ids cl1…cl18 unchanged) ──
const SEED_CHECKLISTS = [
 {
   id: "cl1",
   num: "1",
   title: "Pemerhatian Am Wad",
   subtitle: "Ketua Kumpulan",
   items: [
     { bil: "1.1", perkara: "Bilangan pesakit vs. bilangan katil. Sistem Pengurusan Katil — siapa yang bertanggungjawab?" },
     { bil: "1.2", perkara: "Bilangan kemasukan baru sejak jam 12 Tengahari?" },
     { bil: "1.3", perkara: "Bilangan kemasukan baru yang belum dilihat oleh HO/MO wad?" },
     { bil: "1.4", perkara: "Bilangan HO/MO semasa lawatan? Mencukupi? Ada yang MIA?" },
     { bil: "1.5", perkara: "Kebersihan kawasan wad?" },
     { bil: "1.6", perkara: "Ada pengunjung di luar waktu melawat (pesakit tidak kritikal)?" },
     { bil: "1.7", perkara: "Bilangan pesakit discaj pagi ini? Pesakit masih di wad?" },
     { bil: "1.8", perkara: "Lain-lain perkara" },
   ]
 },
 {
   id: "cl2",
   num: "2",
   title: "Keselamatan Kebakaran",
   subtitle: "Unit Penyelia Hospital",
   items: [
     { bil: "2.1", perkara: "Sudut Keselamatan — tersedia dan kemaskini?" },
     { bil: "2.2", perkara: "Laluan keluar kecemasan (fire exit route) — bebas halangan?" },
     { bil: "2.3", perkara: "Lampu laluan keluar kecemasan (fire exit light) — berfungsi?" },
     { bil: "2.4", perkara: "Persediaan bencana (Disaster Preparation) — ada pelan?" },
     { bil: "2.5", perkara: "Ujian staf: nombor alat pemadam api & tindakan semasa kebakaran" },
     { bil: "2.6", perkara: "Senarai tanggungjawab (List of responsibility) — dipamerkan?" },
     { bil: "2.7", perkara: "Alat pemadam api — lokasi, bilangan, dan pemeriksaan" },
   ]
 },
 {
   id: "cl3",
   num: "3",
   title: "Kawalan Infeksi",
   subtitle: "Unit Kawalan Infeksi (UKI)",
   items: [
     { bil: "3.1", perkara: "Kesedaran Kebersihan Tangan — poster/papan tanda/program?" },
     { bil: "3.2", perkara: "Bilangan hand scrub tersedia? Mencukupi?" },
     { bil: "3.3", perkara: "Pemerhatian kaedah/kekerapan penggunaan hand scrub?" },
     { bil: "3.4", perkara: "Penggunaan PPE: dipakai dengan betul & dibuang ke tempat yang betul?" },
     { bil: "3.5", perkara: "Kebersihan wad/klinik/unit, pantri, tong sampah, bilik air" },
     { bil: "3.6", perkara: "Troli/peralatan pesakit: bersih, humidifier berlabel, mask oksigen tidak digantung" },
     { bil: "3.7", perkara: "Pengurusan bag kain kotor: bag merah (plastik alginated), bag putih, kedua-dua bertutup" },
     { bil: "3.8", perkara: "Tong sisa klinikal: tidak melimpah, tiada alatan tajam" },
     { bil: "3.9", perkara: "Tong sisa am: tidak melimpah, tiada sisa klinikal" },
     { bil: "3.10", perkara: "Tempat simpanan losyen: bersih, tidak tamat tempoh, ada tarikh dibuka" },
     { bil: "3.11", perkara: "Kes jangkitan/Isolation: MRSA/MRO/ESBL/TB — ada signage & PPE/hand rub?" },
     { bil: "3.12", perkara: "Keputusan audit kebersihan tangan terkini? Kawasan untuk ditambahbaik?" },
     { bil: "3.13", perkara: "Standard pembersihan peralatan klinikal (pam, commode, drip stand, troli)?" },
   ]
 },
 {
   id: "cl4",
   num: "4",
   title: "Kejururawatan",
   subtitle: "Unit Kejururawatan",
   items: [
     { bil: "4.1", perkara: "Bilangan jururawat (semua gred) semasa tugas? Nisbah jururawat:pesakit?" },
     { bil: "4.2", perkara: "Pemerhatian dicatat dengan betul mengikut jadual? Carta tanda vital & skor kesakitan?" },
     { bil: "4.3", perkara: "Siasatan yang diarahkan telah dilaksanakan?" },
     { bil: "4.4", perkara: "Ubat yang diarahkan telah diberikan? Nota penjagaan ada? Kesilapan ubat?" },
     { bil: "4.5", perkara: "Pesakit dengan drip — mengalir? Tarikh & masa ditulis? Pemantauan thrombophlebitis?" },
     { bil: "4.6", perkara: "Ada pesakit menunggu prosedur? Berapa lama?" },
     { bil: "4.7", perkara: "Ada pesakit DIL? Keluarga dimaklumkan?" },
     { bil: "4.8", perkara: "Maklum balas pesakit tentang makanan (jika sedang makan)?" },
     { bil: "4.9", perkara: "Kebersihan kawasan memuaskan?" },
     { bil: "4.10", perkara: "Pengawasan keselamatan BHT?" },
     { bil: "4.11", perkara: "Buku MC dalam laci berkunci? Orang bertanggungjawab boleh dihubungi?" },
     { bil: "4.12", perkara: "Laporan kejururawatan dikemaskini dalam sistem IT? Serah terima penjagaan?" },
     { bil: "4.13", perkara: "Ada transfusi darah berlaku di wad sekarang?" },
     { bil: "4.14", perkara: "Dokumentasi (statistik) transfusi darah?" },
     { bil: "4.15", perkara: "Pensampelan pesakit & pelabelan dengan 2 pengecam?" },
     { bil: "4.16", perkara: "Senarai semak pra-transfusi?" },
     { bil: "4.17", perkara: "Pengenalpastian tepi katil (bedside identification)?" },
     { bil: "4.18", perkara: "Borang persetujuan diisi?" },
     { bil: "4.19", perkara: "Senarai semak transfusi?" },
     { bil: "4.20", perkara: "Dokumentasi kejatuhan pesakit?" },
     { bil: "4.21", perkara: "Penandaan/gelang merah untuk pesakit risiko tinggi?" },
     { bil: "4.22", perkara: "Pelekat magnet tersedia di wad?" },
     { bil: "4.23", perkara: "Penilaian kondisi pesakit (cth: hipoglisemia) dan intervensi awal?" },
     { bil: "4.24", perkara: "Penilaian persekitaran untuk risiko jatuh?" },
     { bil: "4.25", perkara: "Dokumentasi oleh AJK — data pengenalpastian pesakit?" },
     { bil: "4.26", perkara: "Semasa kemasukan atau pemindahan pesakit?" },
     { bil: "4.27", perkara: "Pemberian ubat (oleh staf)?" },
     { bil: "4.28", perkara: "Transfusi darah — pengesahan identiti?" },
     { bil: "4.29", perkara: "Pengumpulan cecair badan (oleh staf)?" },
     { bil: "4.30", perkara: "Pengesahan kematian?" },
     { bil: "4.31", perkara: "Prosedur dan perkhidmatan lain — carian MRN semasa pendaftaran?" },
     { bil: "4.32", perkara: "Bilangan nota kes pesakit discaj masih di wad?" },
     { bil: "4.33", perkara: "Bilangan nota kes yang diperiksa?" },
     { bil: "4.34", perkara: "Bilangan harta pesakit discaj >1 minggu lalu masih di wad?" },
     { bil: "4.35", perkara: "Bilangan rumusan discaj yang belum siap?" },
     { bil: "4.36", perkara: "Jika MC diberikan — tempoh dan nombor rujukan dinyatakan?" },
     { bil: "4.37", perkara: "Jika kes rujukan — adakah balasan kepada doktor perujuk?" },
     { bil: "4.38", perkara: "Dokumentasi AJK SSSL?" },
     { bil: "4.39", perkara: "Hanya staf dengan keistimewaan yang relevan melakukan prosedur/pembedahan?" },
     { bil: "4.40", perkara: "'Time-out' dilakukan sebelum prosedur dimulakan?" },
     { bil: "4.41", perkara: "Pemeriksaan instrumen sebelum pembedahan/kiraan pra-op?" },
     { bil: "4.42", perkara: "Penandaan tapak prosedur (semasa pesakit sedar)?" },
     { bil: "4.43", perkara: "Pelaksanaan amalan terbaik untuk mencegah SSI?" },
     { bil: "4.44", perkara: "Almari DDA: sistem kunci, dokumentasi pergerakan ubat, pengesahan stok?" },
     { bil: "4.45", perkara: "Penyimpanan ubat: item peti sejuk & bukan peti sejuk?" },
     { bil: "4.46", perkara: "Pematuhan amalan 7R?" },
     { bil: "4.47", perkara: "Data kesilapan ubat atau near miss?" },
   ]
 },
 {
   id: "cl11",
   num: "5",
   title: "Kualiti",
   subtitle: "Unit Kualiti HKJ",
   items: [
     { bil: "5.1", perkara: "Mortality & Morbidity/POMR: staf hadir mesyuarat outcome? Tindakan dikomunikasikan?" },
     { bil: "5.2", perkara: "Audit Klinikal & KPI/HPIA: sekurang-kurangnya 1 audit klinikal dalam tahun semasa?" },
     { bil: "5.3", perkara: "Lean Healthcare: petunjuk prestasi dan KPI dianalisis dalam mesyuarat Lean?" },
     { bil: "5.4", perkara: "Malaysian Patient Safety Goals (MPSG): audit dilakukan? Bukti tindakan pembetulan?" },
     { bil: "5.5", perkara: "Incident Reporting (IR): pemfailan, pangkalan data, slip preskripsi, IR/RCA?" },
     { bil: "5.6", perkara: "Program Bebas Kesakitan: dokumentasi, pembaris kesakitan, sudut kesakitan, kit?" },
     { bil: "5.7", perkara: "Credentialing and Privileging: pangkalan data & sijil privileging?" },
   ]
 },
 {
   id: "cl12",
   num: "6",
   title: "Pengurusan Aset",
   subtitle: "Unit Aset",
   items: [
     { bil: "6.1", perkara: "Pemeriksaan fizikal aset dan perbandingan dengan KEW.PA-7?" },
     { bil: "6.2", perkara: "KEW.PA-7 dikemaskini dan dipaparkan?" },
     { bil: "6.3", perkara: "Pegawai penempatan di KEW.PA-7 masih ada di jabatan?" },
     { bil: "6.4", perkara: "Aset ada KEW.PA3/KEW.PA4 (didaftarkan)?" },
     { bil: "6.5", perkara: "Aset ditampal label/sticker dengan nombor berdaftar SPPA?" },
     { bil: "6.6", perkara: "Aset dalam proses pelupusan dilabel 'dalam proses lupus'?" },
     { bil: "6.7", perkara: "Aset rosak telah mohon BER1 dengan Radicare?" },
     { bil: "6.8", perkara: "Pergerakan aset direkodkan dalam KEW.PA9?" },
   ]
 },
 {
   id: "cl13",
   num: "7",
   title: "Perkhidmatan Kejuruteraan",
   subtitle: "Unit Kejuruteraan",
   items: [
     { bil: "7.1", perkara: "Kebersihan am tandas/bilik mandi? Perkhidmatan pembersihan?" },
     { bil: "7.2", perkara: "Sinki/paip/tangki air dalam kondisi baik? Air panas — bilik mandi?" },
     { bil: "7.3", perkara: "Ada kerja penyelenggaraan perlu dilakukan atau permintaan dalam RiW?" },
     { bil: "7.4", perkara: "Peralatan — berfungsi atau status BER?" },
     { bil: "7.5", perkara: "Elektrikal/sivil/mekanikal/bioperubatan — ada kerosakan/tidak berfungsi?" },
     { bil: "7.6", perkara: "Perkhidmatan pembersihan — rekod/pemantauan dan mengikut jadual?" },
     { bil: "7.7", perkara: "Perkhidmatan linen — rekod/pemantauan dan mengikut jadual?" },
     { bil: "7.8", perkara: "Peralatan/aset wad — PPM dilakukan?" },
   ]
 },
 {
   id: "cl14",
   num: "8",
   title: "Jabatan Kecemasan (ETD)",
   subtitle: "Kumpulan CGR",
   items: [
     { bil: "8.1", perkara: "Kawasan menunggu: bilangan pesakit zon hijau, staf kaunter, bilangan MO?" },
     { bil: "8.2", perkara: "Triaj: bilangan MA bertugas, >3 tahun pengalaman, pesakit ditriaj dengan betul?" },
     { bil: "8.3", perkara: "Dokumentasi rekod pesakit: tarikh/masa, aduan, tanda vital, diagnosis, preskripsi, MC?" },
     { bil: "8.4", perkara: "Troli kecemasan: sistem semakan harian, didokumentasikan, 5 item ubat rawak?" },
     { bil: "8.5", perkara: "Peralatan kecemasan: sistem semakan berkala, ada peralatan penting tidak berfungsi?" },
     { bil: "8.6", perkara: "Almari DDA: sistem kunci, dokumentasi pergerakan ubat, pengesahan stok?" },
     { bil: "8.7", perkara: "Bilik rawatan/prosedur: kebersihan, buangan tajam, peti sejuk, stok perubatan?" },
     { bil: "8.8", perkara: "Pusat panggilan: bilangan MA, bilangan panggilan, dokumentasi, ambulans?" },
     { bil: "8.9", perkara: "Teluk pemerhatian: bilangan pesakit vs. katil, jururawat bertugas, pemantauan?" },
     { bil: "8.10", perkara: "Penyelenggaraan garis panduan, surat pekeliling dan rujukan?" },
     { bil: "8.11", perkara: "Dokumentasi: dasar & SOP, minit mesyuarat jabatan, CME, peralatan BER?" },
   ]
 },
 {
   id: "cl16",
   num: "9",
   title: "Unit Dietetik dan Sajian (JDS)",
   subtitle: "Kumpulan CGR",
   items: [
     { bil: "9.1A", perkara: "Kawasan dapur — kebersihan (pengurusan, penyediaan makanan, penyimpanan)?" },
     { bil: "9.1B", perkara: "Lantai berminyak?" },
     { bil: "9.1C", perkara: "Perkhidmatan pembersihan memuaskan?" },
     { bil: "9.1D", perkara: "Pembuangan sampah memuaskan?" },
     { bil: "9.1E", perkara: "Ada lalat di kawasan?" },
     { bil: "9.2A", perkara: "Kebersihan penyediaan makanan memuaskan?" },
     { bil: "9.2B", perkara: "Staf telah divaksin?" },
     { bil: "9.2C", perkara: "Rasa makanan memuaskan?" },
     { bil: "9.2D", perkara: "Dulang hidangan disimpan dengan betul?" },
     { bil: "9.2E", perkara: "Persediaan hidangan memuaskan?" },
     { bil: "9.2F", perkara: "Bahan mentah yang diterima memuaskan? (semakan rawak)" },
     { bil: "9.3", perkara: "Peti sejuk: pembersihan, kebersihan, tiada item reput?" },
     { bil: "9.4", perkara: "Stor: pembersihan, kebersihan, tiada item tamat tempoh, tiada tanda tikus/lipas?" },
     { bil: "9.5", perkara: "Dokumentasi: dasar & SOP, minit mesyuarat, CME, peralatan BER?" },
   ]
 },
 {
   id: "cl17",
   num: "10",
   title: "Pemeriksaan Tempat Kerja OSH",
   subtitle: "UKA / OSH — KKM 2024",
   isOSH: true,
   sections: [
     { title: "A. Dasar Keselamatan dan Kesihatan", items: [
       "A1. Dasar K&K Pekerjaan dipamerkan",
       "A2. Dasar K&K Pekerjaan difahami",
       "A3. Carta Organisasi JKK disediakan",
     ]},
     { title: "B. Kawalan Hazard Fizikal", items: [
       "B1. Lantai tidak licin, rata, tiada hazard jatuh/near miss",
       "B2. Permukaan siling dalam keadaan baik dan selamat",
       "B3. Ruangan kerja kemas, tidak bersepah, bebas habuk",
       "B4. Susun atur peralatan baik, tiada over stacking",
       "B5. Pendawaian elektrik baik, tiada wayar rosak",
       "B6. Stor penyimpanan tersusun rapi, tiada halangan di pintu",
       "B7. Pencahayaan mencukupi, tiada lampu rosak",
       "B8. Pengudaraan tempat kerja baik",
       "B9. Suhu persekitaran memuaskan",
       "B10. Tiada bunyi bising yang mengganggu",
     ]},
     { title: "C. Hazard Kimia", items: [
       "C1. Ruang mesin fotostat mempunyai pengudaraan yang baik",
       "C2. Bahan kimia disimpan di tempat khas, jauh dari makanan",
       "C3. Tiada bahan kimia berbahaya tertumpah di luar tempat simpanan",
       "C4. Pelabelan bahan kimia ada",
       "C5. Tanda amaran bahaya kimia ada",
       "C6. Helaian Data Keselamatan (SDS) disediakan",
     ]},
     { title: "D. Hazard Biologi", items: [
       "D1. Kawasan kerja bebas dari lalat, lipas, tikus dan nyamuk",
       "D2. Permukaan dinding dan siling bebas dari kulat",
       "D3. Sampah makanan tidak dibuang dalam bakul sampah kawasan kerja",
     ]},
     { title: "E. Hazard Ergonomik", items: [
       "E1. Stesen kerja dan peralatan sesuai dengan anggota",
     ]},
     { title: "F. Promosi", items: [
       "F1. Bahan promosi OSH/kesihatan mental/gaya hidup sihat dipamerkan",
     ]},
     { title: "G. Pelan Tindakan Kecemasan (ERP)", items: [
       "G1. Peti pertolongan cemas lengkap, mudah dilihat dan dicapai",
       "G2. Perkakas dalam peti pertolongan cemas mencukupi dan dikemaskini",
       "G3. Pelan lantai/pelan evakuasi dan senarai talian kecemasan dipamerkan",
       "G4. Alat pemadam api ada, mencukupi, belum tamat tarikh, ada tatacara",
       "G5. Gelong hos pemadam api disediakan, boleh digunakan dan diselenggara",
       "G6. Signage/tanda arah KELUAR berfungsi",
       "G7. Pintu rintangan api sentiasa ditutup",
       "G8. Laluan keluar, tangga, pintu kecemasan tiada halangan, cahaya mencukupi",
       "G9. Tempat berkumpul yang ditetapkan ada",
     ]},
     { title: "H. Kebajikan", items: [
       "H1. Kemudahan tandas",
       "H2. Tempat/ruang rehat (ruang solat)",
       "H3. Kemudahan air minuman yang bersih",
       "H4. Kemudahan riadah dan sosial",
     ]},
   ]
 },
 {
   id: "cl18",
   num: "11",
   title: "Medikolegal",
   subtitle: "Audit Dokumentasi Medikolegal (Medico-Legal Documentation Audit)",
   note: "C = Patuh, NC = Tidak Patuh, NA = T/B. Catatkan ulasan/isu di ruangan Penemuan setiap perkara dan lampirkan foto bukti dokumentasi baik/lemah. Catatkan Cadangan (Recommendation) dan Maklum Balas Jabatan (Department Feedback) di bahagian Lain-lain Perkara.",
   note_en: "C = Compliant, NC = Non-compliant, NA = N/A. Record remarks/issues under each item's Finding and attach photo proof of good/poor documentation. Record the Recommendation and Department Feedback under Other Matters.",
   items: [
     { bil: "11.1", perkara: "Tarikh dan Masa", perkara_en: "Date and Time" },
     { bil: "11.2", perkara: "Pengepala (Header)", perkara_en: "Header" },
     { bil: "11.3", perkara: "Tandatangan dan Cop", perkara_en: "Signature and Stamp" },
     { bil: "11.4", perkara: "Pembetulan Kesilapan", perkara_en: "Mistake Rectification" },
     { bil: "11.5", perkara: "Kejelasan Tulisan Tangan", perkara_en: "Handwriting Legibility" },
     { bil: "11.6", perkara: "Singkatan Yang Tidak Sesuai", perkara_en: "Inappropriate Abbreviation" },
     { bil: "11.7", perkara: "Semakan Laporan Penyiasatan", perkara_en: "Investigation Reports Review" },
     { bil: "11.8", perkara: "Slip Preskripsi", perkara_en: "Prescription Slip" },
     { bil: "11.9", perkara: "Borang Keizinan", perkara_en: "Consent Form" },
     { bil: "11.10", perkara: "Penyimpanan Rekod", perkara_en: "Record Keeping" },
     { bil: "11.11", perkara: "Tindakan Pembetulan Diambil bagi Kes Medikolegal (jika berkaitan) dan Lain-lain", perkara_en: "Remedial Actions Taken for Medicolegal Cases (if applicable) and Others" },
   ]
 }
];

// ── SEED: CHECKLIST ITEMS (generated from SEED_CHECKLISTS above) ──
function seedChecklistItems_() {
 const rows = [];
 SEED_CHECKLISTS.forEach(cl => {
   let order = 0;
   const push = (o) => rows.push(Object.assign({ checklistId: cl.id, group: "", groupKpi: "", group_en: "", perkara_en: "", order: ++order, active: true }, o));

   if (cl.isOSH) {
     // OSH keeps Ya/Tidak/TB scoring: section title = group, item code ("A1") = itemId
     cl.sections.forEach(sec => sec.items.forEach(text => {
       push({ itemId: text.split(".")[0], group: sec.title, perkara: text });
     }));
     return;
   }

   let curGroup = "", curGroupEn = "";
   cl.items.forEach(item => {
     if (item.group) { curGroup = item.group; curGroupEn = item.group_en || ""; }
     const o = { itemId: item.bil, group: curGroup, group_en: curGroupEn, perkara: item.perkara, perkara_en: item.perkara_en || "" };
     if (cl.id === "cl4") {
       const n = Number(String(item.bil).split(".")[1]);
       const g = NURSING_GROUPS_.find(x => n >= x.from && n <= x.to);
       if (g) { o.group = g.group; o.group_en = g.group_en; o.groupKpi = g.kpi; }
       if (NURSING_EN_[n]) o.perkara_en = NURSING_EN_[n];
     }
     push(o);
   });

   if (cl.id === "cl4") {
     let n = cl.items.length; // continue 4.48, 4.49, …
     NURSING_EXTRA_.forEach(g => g.items.forEach(it => {
       n++;
       push({ itemId: "4." + n, group: g.group, group_en: g.group_en, perkara: it[0], perkara_en: it[1] });
     }));
   }
 });
 return rows;
}

// ── setupPortal ─────────────────────────────────────────────
// Idempotent: creates any missing tab (header row frozen + bold), seeds empty tabs only,
// never touches "CGR Responses". Run it again any time — it only fills gaps.
function setupPortal() {
 const log = [];
 const ss = getSpreadsheet_();

 PORTAL_TABLES_.forEach(([name, headers]) => {
   let sh = ss.getSheetByName(name);
   if (sh) { log.push("exists   " + name); return; }
   sh = ss.insertSheet(name);
   sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#1a4a7a").setFontColor("#ffffff");
   sh.setFrozenRows(1);
   // Plain text everywhere so ids / ISO dates are never coerced
   sh.getRange(2, 1, sh.getMaxRows() - 1, headers.length).setNumberFormat("@");
   if (sh.getMaxColumns() > headers.length) sh.deleteColumns(headers.length + 1, sh.getMaxColumns() - headers.length);
   log.push("created  " + name);
 });

 seedIfEmpty_(TAB.UNITS, SEED_UNITS, log);
 seedIfEmpty_(TAB.DEPARTMENTS, SEED_DEPARTMENTS.map(d => Object.assign({ headStaffId: "", roundEveryDays: "", active: true }, d)), log);
 seedIfEmpty_(TAB.SECTIONS, seedSections_(), log);
 seedIfEmpty_(TAB.CHECKLIST_ITEMS, seedChecklistItems_(), log);
 seedAdmin_(log);
 ensureReportsFolder_(log);

 Logger.log(log.join("\n"));
 return log;
}

function seedIfEmpty_(tab, objects, log) {
 if (readTable_(tab).length > 0) { log.push("kept     " + tab + " (not empty, not seeded)"); return; }
 const n = appendRows_(tab, objects);
 log.push("seeded   " + tab + " (" + n + " rows)");
}

// First admin: staffId "admin", random 6-digit PIN logged ONCE, must change on first login.
function seedAdmin_(log) {
 if (readTable_(TAB.USERS).length > 0) { log.push("kept     " + TAB.USERS + " (not empty, no admin created)"); return; }
 const pin = randomPin_();
 const salt = newSalt_();
 appendRows_(TAB.USERS, [{
   staffId: "admin", name: "Administrator", designation: "UPRSK", role: "admin", unitId: "uprsk", deptId: "",
   flags: "", email: CONFIG.NOTIFICATION_EMAIL, pinHash: hashPin_(pin, salt), pinSalt: salt,
   mustChangePin: true, active: true, failedLogins: 0, lockedUntil: "", lastLogin: "",
 }]);
 appendRows_(TAB.AUDIT_LOG, [{ timestamp: new Date(), staffId: "system", event: "admin_created", refId: "admin", details: "setupPortal" }]);
 log.push("seeded   " + TAB.USERS + " — admin created. TEMP PIN (shown once, note it now): " + pin);
}

// Reports folder: CONFIG id → Script Property → create "CGR Reports" once.
function ensureReportsFolder_(log) {
 if (CONFIG.REPORTS_FOLDER_ID) { log.push("reports  folder from CONFIG"); return; }
 const props = PropertiesService.getScriptProperties();
 if (props.getProperty("REPORTS_FOLDER_ID")) { log.push("reports  folder exists (Script Property)"); return; }
 const folder = DriveApp.createFolder("CGR Reports");
 props.setProperty("REPORTS_FOLDER_ID", folder.getId());
 log.push("reports  folder created: " + folder.getUrl());
}

// ── migrateLegacy ───────────────────────────────────────────
// Groups legacy "CGR Responses" rows by (Timestamp, Auditor, Jabatan) into Rounds + RoundSections +
// Entries (+ OshScores for the OSH checklist). Rounds are marked status "legacy".
// dryRun (default TRUE) only logs counts. Never modifies "CGR Responses". Re-running is safe:
// groups already migrated are recorded in AuditLog (event legacy_migrated) and skipped.
function migrateLegacy(dryRun) {
 dryRun = dryRun !== false;
 const legacy = getSheetOrThrow_(CONFIG.SHEET_TAB);
 const lastRow = legacy.getLastRow();
 if (lastRow < 2) { Logger.log("CGR Responses is empty."); return { rounds: 0, entries: 0 }; }
 const values = legacy.getRange(1, 1, lastRow, legacy.getLastColumn()).getValues();
 const H = values[0].map(String);
 const col = n => H.indexOf(n);
 const C = {
   ts: col("Timestamp"), auditor: col("Auditor"), jawatan: col("Jawatan/Unit"), jabatan: col("Jabatan Dilawati"),
   tarikh: col("Tarikh Rondaan"), masa: col("Masa Mula"), checklist: col("Checklist"), bil: col("Bil"), perkara: col("Perkara"),
   status: col("Status"), penemuan: col("Penemuan"), tindakan: col("Tindakan Pembetulan"), susulan: col("Penemuan Susulan"),
   foto: col("Foto URL"), lain: col("Lain-lain Perkara"),
 };
 Object.keys(C).forEach(k => { if (C[k] < 0) throw new Error("CGR Responses is missing column for " + k); });

 const sections = readTable_(TAB.SECTIONS);
 const secByApp = {};
 sections.forEach(s => { secByApp[String(s.appNum)] = s; });
 const depts = readTable_(TAB.DEPARTMENTS);
 const done = {};
 readTable_(TAB.AUDIT_LOG).filter(r => r.event === "legacy_migrated").forEach(r => { done[String(r.refId)] = true; });

 // Group rows
 const groups = {}, order = [];
 for (let r = 1; r < values.length; r++) {
   const v = values[r];
   if (v.every(x => x === "")) continue;
   const key = [cell_(v[C.ts]), v[C.auditor], v[C.jabatan]].join("|");
   if (!groups[key]) { groups[key] = []; order.push(key); }
   groups[key].push(v);
 }

 const out = { rounds: [], roundSections: [], entries: [], osh: [], audit: [] };
 let skipped = 0, unmapped = 0;
 order.forEach(key => {
   if (done[key]) { skipped++; return; }
   const rows = groups[key];
   const first = rows[0];
   const roundId = dryRun ? "(dry-run)" : newId_("R");
   const tsIso = cell_(first[C.ts]);
   const secIds = [];
   const perSection = {};
   rows.forEach(v => {
     const m = String(v[C.checklist]).match(/^\s*(\d+)\./);
     const sec = m && secByApp[m[1]];
     if (!sec) { unmapped++; return; }
     if (secIds.indexOf(sec.sectionId) < 0) secIds.push(sec.sectionId);
     (perSection[sec.sectionId] = perSection[sec.sectionId] || { sec: sec, lain: "", n: 0 });
     perSection[sec.sectionId].lain = perSection[sec.sectionId].lain || v[C.lain];
     const rating = legacyRating_(v[C.status]);
     const bil = String(v[C.bil]);
     // OSH legacy Bil is the item code (A1…), same as the seeded itemId
     const isOsh = sec.checklistId === "cl17";
     perSection[sec.sectionId].n++;
     out.entries.push({
       entryId: dryRun ? "" : newId_("E"), roundId, sectionId: sec.sectionId, order: perSection[sec.sectionId].n,
       itemId: bil, kandungan: sec.contentLabel, perkara: v[C.perkara], penemuan: v[C.penemuan],
       photoIds: legacyPhotoIds_(v[C.foto]), tindakan: v[C.tindakan], fasiliti: "", rating,
       susulan: v[C.susulan], state: (rating === "I" || rating === "NC") ? "open" : "closed",
     });
     if (isOsh && rating) out.osh.push({ roundId, itemKey: bil, value: legacyStatusText_(v[C.status]) });
   });
   const dept = legacyDept_(first[C.jabatan], depts);
   out.rounds.push({
     roundId, deptId: dept, date: cell_(first[C.tarikh]).slice(0, 10), waktu: first[C.masa], status: "legacy",
     sectionIds: secIds.join(","), createdBy: first[C.auditor],
   });
   Object.keys(perSection).forEach(sid => {
     out.roundSections.push({
       roundId, sectionId: sid, status: "submitted", noFindings: false, appendixText: perSection[sid].lain,
       preparedBy: first[C.auditor], preparedAt: tsIso,
     });
   });
   out.audit.push({
     timestamp: new Date(), staffId: "system", event: "legacy_migrated", refId: key,
     details: JSON.stringify({ roundId, auditor: first[C.auditor], jawatan: first[C.jawatan], jabatan: first[C.jabatan], rows: rows.length }),
   });
 });

 const msg = (dryRun ? "[DRY RUN] would migrate " : "Migrated ") + out.rounds.length + " rounds, " +
   out.roundSections.length + " round-sections, " + out.entries.length + " entries, " + out.osh.length + " OSH scores" +
   " (" + skipped + " groups already migrated, " + unmapped + " rows with unknown checklist skipped)";
 Logger.log(msg);
 if (dryRun) return { rounds: out.rounds.length, entries: out.entries.length, skipped, unmapped };

 appendRows_(TAB.ROUNDS, out.rounds);
 appendRows_(TAB.ROUND_SECTIONS, out.roundSections);
 appendRows_(TAB.ENTRIES, out.entries);
 appendRows_(TAB.OSH_SCORES, out.osh);
 appendRows_(TAB.AUDIT_LOG, out.audit);
 return { rounds: out.rounds.length, entries: out.entries.length, skipped, unmapped };
}

// Strip emoji / pictographs and surrounding space.
function stripEmoji_(s) {
 return String(s || "").replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "").trim();
}

// Legacy status text → C / I / NC / NA ("" if unanswered)
function legacyRating_(status) {
 const t = stripEmoji_(status).toLowerCase();
 const map = {
   "patuh": "C", "compliant": "C", "ya": "C",
   "perlu penambahbaikan": "I", "needs improvement": "I",
   "tidak patuh": "NC", "non-compliant": "NC", "tidak": "NC",
   "t/b": "NA", "n/a": "NA", "tb": "NA",
 };
 return map[t] || "";
}

function legacyStatusText_(status) {
 return stripEmoji_(status);
}

// Drive file ids from legacy Foto URL cells (".../d/<id>/view", "...?id=<id>"); placeholders → ""
function legacyPhotoIds_(url) {
 const m = String(url || "").match(/\/d\/([\w-]{20,})|[?&]id=([\w-]{20,})/);
 return m ? (m[1] || m[2]) : "";
}

// Legacy Jabatan text → deptId by exact name; the old combined option maps to OMFS (cannot tell
// OMFS from SCD — the original text is kept in the AuditLog details).
function legacyDept_(jabatan, depts) {
 const name = String(jabatan || "").trim();
 const hit = depts.find(d => String(d.name) === name);
 if (hit) return hit.deptId;
 const lower = name.toLowerCase();
 if (lower.indexOf("omfs") >= 0) return "omfs";
 const alias = { "kecemasan dan trauma": "kecemasan" };
 return alias[lower] || "lain";
}
