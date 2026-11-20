/**
* ============================================================
* REPORTSPIKE.GS — Phase 0 report spike (test data only)
*
* Builds a report for the OMFS sample round (10 Julai 2026) with section 1 (Pemerhatian Umum),
* section 5 (Audit Kawalan Infeksi) and section 11 (Kejururawatan, checklist mode), then exports the PDF.
* Text was transcribed from the scanned sample; photos are generated placeholders (the real
* clinical photos must never be committed). Compare the PDF side by side with the scan (plan §4.7).
*
* Guarded: set Script Property ALLOW_SPIKE = 1 (Project Settings → Script properties) before running.
* ============================================================
*/

// Two tiny PNGs (checkerboards) used as stand-in photos
const SPIKE_PNG_A_ = "iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAIAAAD6wG44AAABNElEQVR42u3ZMQ0AIAxFwWpHBJpqgwUdzE1qALiE8U3/thIxR/tyr/bpL+sNBNiggPWA9YD1gPWA9aU3xNs9YMAGBawHrAesB6wHrK/PEC5ZBgWsB6wHrAesB6wH7D/YcC5ZesB6wHrAesB6wIAN5D/YcC5ZesB6wHrAesB6wIAN5D9Y75KlB6wHrAesBwzYQID1/oP1Lll6wHrAesCADQTYoID1/oP1Lll6wHrAesCADQRYD1jvP1jvkqUHrAcM2ECA9YD1gPX+g/UuWXrAgA0E2KCA9YD1gPX+g/UuWXrAgA0EWA9YD1gPWO8/WO+SBdhAgA0KWA9YD1gPWO8/WO+SBdiggPWA9YD1gPWA9f6DXbIMBFgPWA9YD1gPWA/Yf7AhXLIMClgPWA9YD1gPWA/4i/4AKIT+eSQlSkwAAAAASUVORK5CYII=";
const SPIKE_PNG_B_ = "iVBORw0KGgoAAAANSUhEUgAAAHgAAACgCAIAAABIaz/HAAABQUlEQVR42u3YMQ0AIAxFwcphRhMikIgcJGCgEwMkzSUd33Tbb+zV05ujpae/6wMEaNB60KBBgwBdChrQmx40aNB60KBBgwBdCxqQZQhaDxo0aBCgQev9oy1D0CBAg9aDBg0ahH+0ZagHDRo0CNCg9aD9oy1DEKBB60GDBg0CtH+03jIEDRocaNB60KD9owFZhqD1oEGDBgcatN4/2jIEDQ40aD1o0KDB+UdbhnrQoEGDAw1aD9o/2jIEBxq0HjRo0OBA+0frLUPQoMGBBq0HDdo/GpBlCFoPGjRocKBB6/2jLUPQ4ECD1oMGDRqcf7RlqAcNGjQ40KD1oP2jLUNwoEHrQYMGDQ60f7TeMgQNGhxo0HrQoP2jAVmGoPWgQYMGBxq03j/aMgQNDjRoPWjQoMH5R1uGetCgQYMDDVoP+mt/AHri42QDO7sUAAAAAElFTkSuQmCC";

function spikeReportOMFS() {
 if (PropertiesService.getScriptProperties().getProperty("ALLOW_SPIKE") !== "1") {
   throw new Error("Spike disabled. Set Script Property ALLOW_SPIKE=1 in the Apps Script editor to run it.");
 }
 const data = spikeOmfsData_();
 const rep = buildReport_(data);
 const pdf = exportPdf_(rep.sheetId);
 Logger.log("SHEET: " + rep.url + "\nPDF:   " + pdf.url);
 return { sheetUrl: rep.url, pdfUrl: pdf.url };
}

function spikePhoto_(b64, name) {
 return Utilities.newBlob(Utilities.base64Decode(b64), "image/png", name);
}

function spikeOmfsData_() {
 const A = () => spikePhoto_(SPIKE_PNG_A_, "placeholder-a.png");
 const B = () => spikePhoto_(SPIKE_PNG_B_, "placeholder-b.png");
 const CONT = "Continue supervision by clinic supervisor";

 // ── Section 1 — Pemerhatian Umum (BM9) ──
 const sec1 = {
   number: 1, bannerTitle: "PEMERHATIAN UMUM (GENERAL OBSERVATION)", laporanPrefix: false, template: "BM9",
   kandunganLabel: "Pemerhatian Umum", contentLabel: "Pemerhatian Umum",
   entries: [
     { perkara: "Perjawatan",
       penemuan: "Terdapat\n- 2 Pakar Perubatan Pembedahan Pergigian\n- 10 Pegawai Perubatan Pergigian\n- 1 Penyelia Juruterapi Pergigian\n\nPihak kami mendapati jumlah harian pesakit datang ke klinik adalah sekitar 30-35 sehari\n\nMereka juga harus melakukan pembedahan di OT dan melihat pesakit di Jabatan Kecemasan.\n\nPihak kami dimaklumkan buat masa ini jumlah pegawai perubatan pergigian akan berkurangan kerana 2 orang pegawai wanita akan bersalin.",
       tindakan: "Pihak pengurusan menyarankan agar pengurusan slot masa dan susun atur anggota di lapangan dilakukan bagi mengelakkan pesakit menunggu lama.",
       fasiliti: "Ruang klinik" },
     { perkara: "Peralatan Perubatan",
       penemuan: "Buat masa ini terdapat 4 Dental Chair yang digunakan, namun hanya 2 sahaja yang dapat berfungsi dengan sepenuhnya.\n1 Dental Chair telah dilupuskan kerana Beyond Economic Repair dan 1 lagi Dental Chair partially function kerana tidak dapat turun dan naik.\n\nIni menyebabkan slot klinik tidak dapat dioptimumkan memandangkan kekurangan Dental Chair.\n\nList menunggu pesakit mendapatkan rawatan telah meningkat sehingga 8 bulan\n\nPeruntukan Dental Chair pula hanya dapat diluluskan diperingkat Kementerian Kewangan kerana ianya bernilai lebih RM400 000",
       photos: [A()],
       tindakan: "Pihak pengurusan meminta pihak OMFS untuk membuat permohonan aset kepada pihak Bahagian Kesihatan Pergigian Jabatan Kesihatan Negeri Selangor.",
       fasiliti: "Ruang klinik" },
     { perkara: "OT",
       penemuan: "OT Slot pada masa ini ialah pada hari Khamis, setiap minggu. Manakala elektif trauma ialah pada hari Selasa, sebulan sekali.\n\nPihak ini mendapati OT slot baru ditambah 1kali sebulan bermula bulan April 2026",
       tindakan: "Sekiranya masih berlaku ketidakcapaian bagi Pembedahan ORIF, bagi pencapaian Objektif Kualiti, hendaklah memohon slot OT ditambah.",
       fasiliti: "Dewan Bedah OMFS" },
     { perkara: "Pintu utama",
       penemuan: "Memandangkan tiada Dental Chair di Jabatan Kecemasan, pesakit perlu dihantar ke Jabatan OMFS, dan jika berlaku pada waktu malam, Pegawai Pergigian perlu membuka pintu tersebut dan ianya hanya dikunci menggunakan rantai yang tidak dapat dibuka dari sebelah luar.",
       photos: [B()],
       tindakan: "Mengadakan akses kad pada pintu utama bagi keselamatan anggota. Pihak Jabatan perlu membuat permohonan kepada Bahagian Pengurusan.",
       fasiliti: "Pintu Utama Klinik" },
   ],
 };

 // ── Section 5 — Audit Kawalan Infeksi (EN9) ──
 const IPC = "Audit Kawalan Infeksi  ( Infection Control Audit )";
 const sec5 = {
   number: 5, bannerTitle: "AUDIT KAWALAN INFEKSI", laporanPrefix: false, template: "EN9",
   kandunganLabel: "Audit Kawalan Infeksi ( Infection Control Audit )", contentLabel: IPC,
   entries: [
     { perkara: "Triaging policy & Respiratory Hygiene / Cough Etiqutte",
       penemuan: "No triaging SOP on patient with respiratory symptoms & dedicated isolation area for patient who on special precautions (droplets)",
       tindakan: "1.Suggest department to put cough ettiqutte signage displayed at entrances and to offer surgical mask to coughing patients upon entry.\n2. Ensure MANDATORY cleaning of shared biomedical equipment at triage (BP cuff & machine) after each patient use.",
       fasiliti: "Main / registration counter" },
     { perkara: "PPE",
       penemuan: "1. PPE Trolley located next to hand hygiene sink that is high likely to cross contaminate the PPE\n2. PPE box (mask & gloves) at dental lab fill with dust",
       photos: [A()],
       tindakan: "1.suggest department to put PPE trolley at clean area outside patient zone & sink splash zone but accessible to the HCW\n2. To inform Radicare to clean all dusty high-touch surfaces immediately, including the PPE storage containers, the PPE trolley next to the clinical sink, and the light fixtures in the dental lab.",
       fasiliti: "1.Procedure Area\n2. dental lab" },
     { perkara: "Disinfection & Sterilisation",
       penemuan: "1.Reprocessed items left on the surfaces with mechanical fan open (predisposed to recontaminate) .\n2.Sterile towel used changed after 24 hrs but not properly dated to ensure the scheduled changed",
       photos: [B()],
       tindakan: "1. To ensure fan are not open during drying processed to avoid recontaminating clean item with surrounding",
       fasiliti: "1. Biomedical Equipment Reprocessing Area" },
     { perkara: "Patient Care Equipment",
       penemuan: "1. Clean & Sterile Equipment Cabinet was opened (door was removed because non functioning magnet and the cabinet is less then 1 metre with the dental chair for procedur.\n2. Clinical waste bin located next to patien care equipment (sterile water)",
       photos: [A(), B()],
       tindakan: "Repair or replace the magnetic latch on the sterile equipment cabinet in Surgery Room 4 immediately. Ensure the door remains closed at all times to protect sterile items from the adjacent dental chair aerosol zone (< 1 meter).",
       fasiliti: "Room 4 Procedure Area" },
     { perkara: "Environmental Survey",
       penemuan: "1. Hole & crack at pantry Ceiling\n2. Cracked wall at dirty utility area & dental lab\n3. Light surfaces at dental lab very dusty",
       photos: [B()],
       tindakan: "Department to follow up with the report made to Radicare",
       fasiliti: "Pantry, dirty utility, dental lab" },
   ],
 };

 // ── Section 11 — Kejururawatan (EN9, checklist mode) ──
 // Group wording comes from NURSING_GROUPS_ (Setup.gs) so the spike also exercises the seed data.
 const grp = n => NURSING_GROUPS_.find(g => g.from <= n && n <= g.to);
 const row = (n, e) => Object.assign({ group: grp(n).group_en, groupKpi: grp(n).kpi, perkara: NURSING_EN_[n] }, e);
 const na = { penemuan: "N/A", tindakan: "N/A", fasiliti: "-", photoText: "N/A" };
 const nursing = [
   // Patient Management (Random Check)
   row(1, { penemuan: "Penyelia Juruterapi Pergigian : 1\nDSA : 7", photos: [A()], tindakan: "This clinic needs to mapping required of additional staf", fasiliti: "Clinic" }),
   row(2, { penemuan: "Its was noted that blood pressure, pulse, temparature and pain score were not documented in outpatients notes.", photos: [B()], tindakan: "All vital signs should be documented as evidence of patient's health status at the time of their visit to clinic.", fasiliti: "Outpatient notes" }),
   row(3, { penemuan: "Yes, charted at out patient notes and SSPA-AI", tindakan: CONT, fasiliti: "Outpatient notes and SSPA-AI" }),
   row(4, { penemuan: "Medication served by Doctor. Usual T. Paracetamol", fasiliti: "Outpatient notes" }),
   row(5, na),
   row(6, { penemuan: "About 1 hour", tindakan: "Clients may have to wait for more than 1 hours for any procedures but if trauma cases will be attended stat", fasiliti: "Dental Treatment Area/Room" }),
   row(9, { penemuan: "Satisfactory", tindakan: CONT }),
   row(12, na),
   // Transfusion Safety — one N/A block over three items
   row(13, Object.assign({ span: 3 }, na)), row(14, {}), row(15, {}),
   // Patient Fall
   row(20, Object.assign({ span: 3 }, na, { penemuan: "N/A\nNo incident outpatient fall reported" })), row(21, {}), row(22, {}),
   // Correct Patient Identification
   row(27, Object.assign({ span: 3 }, na, { penemuan: "N/A\nNo incident wrong patient reported" })), row(28, {}), row(29, {}),
   // Patient Discharge
   row(34, Object.assign({ span: 3 }, na)), row(35, {}), row(36, {}),
   // Surgical Safety
   row(40, Object.assign({ span: 2 }, na)), row(41, {}),
   // Medication Safety
   row(44, { penemuan: "DDA cupboard is available but it is currently use for medication floor stock. No storage of drug @ non fridge item seen.", photos: [A()], tindakan: "OMFS Clinic shares the DDA medication with SCD if required\n\nThe DDA cupboard ( lock ) should be repaired if there is a future requirement for the storage of DDA medications.", fasiliti: "Dental Treatment Area/Room" }),
   row(45, {}),
   row(46, { penemuan: "Yes, compliance", tindakan: CONT }),
   row(47, { penemuan: "No incident of medication error or near miss reported", tindakan: "None", fasiliti: "-" }),
 ];
 // Others: Emergency Trolley (photo + action + facility span all four rows; the 'random check' row is shaded)
 const trolley = (perkara, e) => Object.assign({ group: "Others: Emergency Trolley", perkara }, e);
 nursing.push(
   trolley("System for daily checking", { penemuan: "Daily checked and immediately after use", photos: [A()], span: 4, spanFields: ["photo", "tindakan", "fasiliti"], tindakan: CONT, fasiliti: "Emergency Trolley" }),
   trolley("- system is available", { penemuan: "Yes" }),
   trolley("Conduct random check on 5 drug items", { penemuan: "", shade: ["penemuan"] }),
   trolley("- laryngoscope – adult available?", { penemuan: "Available" }),
   // Others: Emergency Equipment
   { group: "Others: Emergency Equipment", perkara: "System for regular checking on function of equipment?", penemuan: "Checked every day or immediately after use", photos: [B()], span: 3, spanFields: ["photo", "tindakan", "fasiliti"], tindakan: CONT, fasiliti: "Emergency Equipment" },
   { group: "Others: Emergency Equipment", perkara: "System of regular checking being carried out?", penemuan: "Yes" },
   { group: "Others: Emergency Equipment", perkara: "Any vital equipment not functioning?", penemuan: "The equipments are functioning properly" }
 );
 nursing.forEach(e => { e.kandungan = "Nursing"; });

 const sec11 = {
   number: 11, bannerTitle: "KEJURURAWATAN", laporanPrefix: false, template: "EN9 checklist", mode: "checklist",
   kandunganLabel: "Kejururawatan", contentLabel: "Nursing", entries: nursing,
   preparedBy: { name: "Nor Suraya Binti Safar", designation: "Ketua Penyelia Jururawat Hospital", date: "2026-07-21" },
 };

 return {
   year: 2026,
   deptName: "Klinik Pakar Bedah Mulut dan Maksilofasial",
   date: "2026-07-10", waktu: "02.30 petang",
   fileName: "SPIKE TEST — Laporan CGR Klinik Pakar Bedah Mulut dan Maksilofasial 2026",
   folder: childFolder_(reportsRoot_(), "_spike"),
   panel: [
     "Dr. Hj. Muhd Siv Azhar Merican Bin Abdullah", "Dr. Ferwahn Fairis Bin Ab Karim", "Dr. Naim bin Abdul Malek", "Pn. Uma a/p Annamallai",
     "Dr. Norhidayah Binti Mahmood (UPRSK)", "Dr. Aina Zuhana Binti Bukhari (UPRSK)", "Dr. Nor Amirah Binti Ahmad Shukor (UPRSK)", "Dr. Nur Fadhilah Binti Masrah (UPRSK)",
     "Dr. Nor Zaila Binti Zaidan (UKI)", "Dr. Siti Saihah Binti Selamat (UKI)", "Pn. Rosena Harun (UKI)",
     "Dr. Nurzahratul Hikma Binti Mohamad Zakaria (UPPPPP)", "Dr. Nur Farhana Binti Ab Aziz (UPPPPP)", "Dr. Nor Aziela Binti Muda (Medikolegal)",
     "Dr. Premila Thevi a/p Gobalakrishnan (UKA/OSH)", "KPJ. Nor Suraya binti Safar (Kejururawatan)", "PPP. Zurina binti Abdul Jabar (Penyeliaan)",
     "Pn. Naimah Binti Abd Jalal (Kejuruteraan)", "En. Farid Haziq bin Mohd Han (Kejuruteraan)", "En. Mohd Ramli Bin Che Amah (Kejuruteraan)",
     "Pn. Zuraida Binti Abdul Haziz@Abdul Aziz (UPAS)", "En. Raja Syahrizal Aliff Bin Raja Abdullah (UPAS)", "Pn. Tengku Masitah Binti Tengku Shahrom (Rekod Perubatan)",
   ],
   // Full contents list exactly as on the sample cover (the spike only builds sections 1, 5 and 11)
   kandunganList: [
     "1) Pemerhatian Umum", "2) Keselamatan Kebakaran (Fire Safety)", "3) Perkhidmatan Sokongan Klinikal",
     "4) Audit Keselamatan dan Kesihatan (Safety and Health Audit)", "5) Audit Kawalan Infeksi ( Infection Control Audit )",
     "6) Audit Unit Pengurusan Risiko dan Survelan Klinikal", "7) Perkembangan Profesion Pakar dan Pegawai Perubatan", "8) Medikolegal",
     "9) Pengurusan Aset", "10) Rekod Perubatan", "11) Kejururawatan", "12) Teknologi Maklumat",
   ],
   sections: [sec1, sec5, sec11],
   signoff: {
     prepared: { name: "Dr Aina Zuhana Binti Bukhari", designation: "Pegawai Perubatan", unit: "Unit Pengurusan Risiko dan Survelan Klinikal", date: "2026-07-17", approvedAt: "2026-07-17T10:15:00" },
     reviewed: { name: "Dr. Norhidayah Binti Mahmood", designation: "Ketua Unit Pengurusan Risiko dan Survelan Klinikal", date: "2026-07-17", approvedAt: "2026-07-17T14:40:00" },
     approved: { name: "Dr. Hj. Muhd Siv Azhar Merican Bin Abdullah", designation: "Pengarah Hospital", date: "", approvedAt: "2026-07-20T09:05:00" },
   },
 };
}
