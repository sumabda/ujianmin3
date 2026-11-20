/* Data contoh E-Ujian MIN 3 Mukomuko */
window.EXAM_DATA = (function () {
  'use strict';

  const students = [
    { id: 'S01', nisn: '0061234501', nama: 'Ahmad Fauzan', kelas: '4A', jk: 'L', status: 'Aktif' },
    { id: 'S02', nisn: '0061234502', nama: 'Bunga Lestari', kelas: '4A', jk: 'P', status: 'Aktif' },
    { id: 'S03', nisn: '0061234503', nama: 'Citra Ayu Ningsih', kelas: '4A', jk: 'P', status: 'Aktif' },
    { id: 'S04', nisn: '0061234504', nama: 'Dimas Pratama', kelas: '4A', jk: 'L', status: 'Aktif' },
    { id: 'S05', nisn: '0061234505', nama: 'Fadhil Ramadhan', kelas: '4A', jk: 'L', status: 'Aktif' },
    { id: 'S06', nisn: '0061234506', nama: 'Ghina Aulia', kelas: '4B', jk: 'P', status: 'Aktif' },
    { id: 'S07', nisn: '0061234507', nama: 'Hafiz Alfarizi', kelas: '4B', jk: 'L', status: 'Aktif' },
    { id: 'S08', nisn: '0061234508', nama: 'Intan Permata', kelas: '4B', jk: 'P', status: 'Aktif' },
    { id: 'S09', nisn: '0061234509', nama: 'Joko Susilo', kelas: '4B', jk: 'L', status: 'Aktif' },
    { id: 'S10', nisn: '0061234510', nama: 'Khansa Zahira', kelas: '4B', jk: 'P', status: 'Aktif' },
    { id: 'S11', nisn: '0061234511', nama: 'Luthfi Hakim', kelas: '5A', jk: 'L', status: 'Aktif' },
    { id: 'S12', nisn: '0061234512', nama: 'Maulida Rahma', kelas: '5A', jk: 'P', status: 'Aktif' },
    { id: 'S13', nisn: '0061234513', nama: 'Naufal Arkan', kelas: '5A', jk: 'L', status: 'Aktif' },
    { id: 'S14', nisn: '0061234514', nama: 'Oki Setiawan', kelas: '5A', jk: 'L', status: 'Aktif' },
    { id: 'S15', nisn: '0061234515', nama: 'Putri Amelia', kelas: '5A', jk: 'P', status: 'Aktif' },
    { id: 'S16', nisn: '0061234516', nama: 'Qori Ananda', kelas: '5B', jk: 'P', status: 'Aktif' },
    { id: 'S17', nisn: '0061234517', nama: 'Rizky Saputra', kelas: '5B', jk: 'L', status: 'Aktif' },
    { id: 'S18', nisn: '0061234518', nama: 'Salsabila Putri', kelas: '5B', jk: 'P', status: 'Aktif' },
    { id: 'S19', nisn: '0061234519', nama: 'Teguh Wibowo', kelas: '5B', jk: 'L', status: 'Aktif' },
    { id: 'S20', nisn: '0061234520', nama: 'Uswatun Hasanah', kelas: '5B', jk: 'P', status: 'Aktif' },
    { id: 'S21', nisn: '0061234521', nama: 'Vina Oktaviani', kelas: '6A', jk: 'P', status: 'Aktif' },
    { id: 'S22', nisn: '0061234522', nama: 'Wahyu Pratama', kelas: '6A', jk: 'L', status: 'Aktif' },
    { id: 'S23', nisn: '0061234523', nama: 'Yasmin Nabila', kelas: '6A', jk: 'P', status: 'Aktif' },
    { id: 'S24', nisn: '0061234524', nama: 'Zaki Mubarak', kelas: '6A', jk: 'L', status: 'Aktif' },
    { id: 'S25', nisn: '0061234525', nama: 'Aisyah Nuraini', kelas: '6A', jk: 'P', status: 'Aktif' },
    { id: 'S26', nisn: '0061234526', nama: 'Bagas Firmansyah', kelas: '6B', jk: 'L', status: 'Aktif' },
    { id: 'S27', nisn: '0061234527', nama: 'Cahaya Ramadhani', kelas: '6B', jk: 'P', status: 'Aktif' },
    { id: 'S28', nisn: '0061234528', nama: 'Daffa Alfarizi', kelas: '6B', jk: 'L', status: 'Aktif' },
    { id: 'S29', nisn: '0061234529', nama: 'Elsa Maharani', kelas: '6B', jk: 'P', status: 'Aktif' },
    { id: 'S30', nisn: '0061234530', nama: 'Farhan Maulana', kelas: '6B', jk: 'L', status: 'Aktif' },
    { id: 'S31', nisn: '0061234531', nama: 'Nabila Syakira', kelas: '4C', jk: 'P', status: 'Aktif' },
    { id: 'S32', nisn: '0061234532', nama: 'Raka Aditya', kelas: '4C', jk: 'L', status: 'Aktif' },
    { id: 'S33', nisn: '0061234533', nama: 'Salma Kamila', kelas: '4C', jk: 'P', status: 'Aktif' },
    { id: 'S34', nisn: '0061234534', nama: 'Taufik Hidayat', kelas: '4C', jk: 'L', status: 'Aktif' },
    { id: 'S35', nisn: '0061234535', nama: 'Zahra Alifah', kelas: '4C', jk: 'P', status: 'Aktif' },
    { id: 'S36', nisn: '0061234536', nama: 'Aditya Pratama', kelas: '5C', jk: 'L', status: 'Aktif' },
    { id: 'S37', nisn: '0061234537', nama: 'Bella Safitri', kelas: '5C', jk: 'P', status: 'Aktif' },
    { id: 'S38', nisn: '0061234538', nama: 'Candra Wijaya', kelas: '5C', jk: 'L', status: 'Aktif' },
    { id: 'S39', nisn: '0061234539', nama: 'Dinda Lestari', kelas: '5C', jk: 'P', status: 'Aktif' },
    { id: 'S40', nisn: '0061234540', nama: 'Eko Prasetyo', kelas: '5C', jk: 'L', status: 'Aktif' }
  ];

  const teachers = [
    { id: 'G01', nama: 'Dra. Hj. Nurhasanah, M.Pd.', nip: '197504122003122003', mapel: 'Kepala Madrasah', kelas: 'Manajemen', status: 'PNS', email: 'kepala@min3mukomuko.sch.id' },
    { id: 'G02', nama: 'Rina Marlina, S.Pd.', nip: '198206142009022004', mapel: 'Matematika', kelas: 'Kelas 4–6', status: 'PNS', email: 'rina@min3mukomuko.sch.id' },
    { id: 'G03', nama: 'Ahmad Subhan, S.Pd.I.', nip: '198511032012011005', mapel: 'Fiqih', kelas: 'Kelas 4–6', status: 'PNS', email: 'subhan@min3mukomuko.sch.id' },
    { id: 'G04', nama: 'Siti Khadijah, S.Pd.', nip: '198703202011012009', mapel: 'Bahasa Indonesia', kelas: 'Kelas 4–6', status: 'PNS', email: 'khadijah@min3mukomuko.sch.id' },
    { id: 'G05', nama: 'M. Ridwan, S.Pd.', nip: '199001152015031006', mapel: 'IPA', kelas: 'Kelas 4–6', status: 'PPPK', email: 'ridwan@min3mukomuko.sch.id' },
    { id: 'G06', nama: 'Yuni Astuti, S.Pd.', nip: '199204252016042010', mapel: 'PKn', kelas: 'Kelas 4–6', status: 'PPPK', email: 'yuni@min3mukomuko.sch.id' },
    { id: 'G07', nama: 'Umar Faruq, S.Ag.', nip: '198812102014011008', mapel: 'Bahasa Arab', kelas: 'Kelas 4–6', status: 'PNS', email: 'umar@min3mukomuko.sch.id' },
    { id: 'G08', nama: 'Dewi Kurnia, S.Pd.', nip: '199307172018012011', mapel: 'Guru Kelas', kelas: 'Kelas 4A', status: 'PPPK', email: 'dewi@min3mukomuko.sch.id' },
    { id: 'G09', nama: 'Hendra Gunawan, S.Pd.', nip: '199109232017031007', mapel: 'PJOK', kelas: 'Kelas 4–6', status: 'GTY', email: 'hendra@min3mukomuko.sch.id' },
    { id: 'G10', nama: 'Lestari Wulandari, S.Pd.I.', nip: '199406082019022012', mapel: "Qur'an Hadis", kelas: 'Kelas 5B', status: 'PPPK', email: 'lestari@min3mukomuko.sch.id' }
  ];

  const classLevels = ['4', '5', '6'];
  const roomByLevel = {};
  students.forEach(function (s) {
    const m = /^(\d)([A-Z])$/.exec(s.kelas);
    if (!m) return;
    if (!roomByLevel[m[1]]) roomByLevel[m[1]] = [];
    if (roomByLevel[m[1]].indexOf(s.kelas) === -1) roomByLevel[m[1]].push(s.kelas);
  });
  Object.keys(roomByLevel).forEach(function (lvl) { roomByLevel[lvl].sort(); });
  const scheduleDays = [
    {
      date: '2026-11-23',
      exams: [
        { mapel: 'Matematika', start: '07:30', end: '09:00', pengawas: 'Rina Marlina, S.Pd.' },
        { mapel: 'Bahasa Indonesia', start: '09:30', end: '11:00', pengawas: 'Siti Khadijah, S.Pd.' }
      ]
    },
    {
      date: '2026-11-24',
      exams: [
        { mapel: 'IPA', start: '07:30', end: '09:00', pengawas: 'M. Ridwan, S.Pd.' },
        { mapel: 'PKn', start: '09:30', end: '11:00', pengawas: 'Yuni Astuti, S.Pd.' }
      ]
    },
    {
      date: '2026-11-25',
      exams: [
        { mapel: 'Bahasa Arab', start: '07:30', end: '09:00', pengawas: 'Umar Faruq, S.Ag.' },
        { mapel: 'Fiqih', start: '09:30', end: '11:00', pengawas: 'Ahmad Subhan, S.Pd.I.' }
      ]
    }
  ];

  const schedules = [];
  let scheduleNo = 1;
  scheduleDays.forEach(function (day) {
    day.exams.forEach(function (exam) {
      classLevels.forEach(function (kelas) {
        schedules.push({
          id: 'J' + String(scheduleNo++).padStart(2, '0'),
          date: day.date,
          start: exam.start,
          end: exam.end,
          mapel: exam.mapel,
          kelas: kelas,
          room: (roomByLevel[kelas] || [kelas + 'A']).map(function (k) { return 'R-' + k; }).join(' / '),
          pengawas: exam.pengawas
        });
      });
    });
  });

  const questions = [
    {
      id: 'Q01', mapel: 'Matematika', kelas: '6', tipe: 'PG', bobot: 10,
      text: 'Hasil dari 2.450 + 1.275 − 900 adalah ....',
      options: ['2.725', '2.825', '2.925', '3.025'], kunci: 'B'
    },
    {
      id: 'Q02', mapel: 'Matematika', kelas: '6', tipe: 'PG', bobot: 10,
      text: 'KPK dari 12 dan 18 adalah ....',
      options: ['24', '30', '36', '72'], kunci: 'C'
    },
    {
      id: 'Q03', mapel: 'Matematika', kelas: '6', tipe: 'PG', bobot: 10,
      text: 'Volume kubus dengan panjang rusuk 9 cm adalah ....',
      options: ['486 cm³', '729 cm³', '1.296 cm³', '2.187 cm³'], kunci: 'B'
    },
    {
      id: 'Q04', mapel: 'Matematika', kelas: '6', tipe: 'Uraian', bobot: 10,
      text: 'Sebuah bak mandi berbentuk balok berukuran panjang 80 cm, lebar 50 cm, dan tinggi 60 cm. Hitunglah volume bak mandi tersebut, lalu nyatakan dalam satuan liter.',
      jawaban: 'Volume = 80 × 50 × 60 = 240.000 cm³ = 240 liter.'
    },
    {
      id: 'Q05', mapel: 'Bahasa Indonesia', kelas: '6', tipe: 'PG', bobot: 10,
      text: 'Kalimat yang menggunakan ejaan dan tanda baca secara tepat adalah ....',
      options: [
        'Ibu membeli sayur, buah dan ikan di pasar.',
        'Ibu membeli sayur, buah, dan ikan di pasar.',
        'ibu membeli sayur, buah, dan ikan di pasar',
        'Ibu membeli sayur buah, dan ikan, di pasar.'
      ], kunci: 'B'
    },
    {
      id: 'Q06', mapel: 'Bahasa Indonesia', kelas: '6', tipe: 'Uraian', bobot: 10,
      text: 'Tuliskan sebuah paragraf deskripsi singkat (3–4 kalimat) tentang suasana belajar di kelasmu.',
      jawaban: 'Rubrik penilaian: kesesuaian tema, kelengkapan kalimat, ejaan, dan kerapian.'
    },
    {
      id: 'Q07', mapel: 'IPA', kelas: '6', tipe: 'PG', bobot: 10,
      text: 'Proses perpindahan panas melalui benda padat tanpa disertai perpindahan zat perantaranya disebut ....',
      options: ['konveksi', 'konduksi', 'radiasi', 'evaporasi'], kunci: 'B'
    },
    {
      id: 'Q08', mapel: 'IPA', kelas: '5', tipe: 'PG', bobot: 10,
      text: 'Alat pernapasan pada tumbuhan yang berupa pori-pori kecil pada daun disebut ....',
      options: ['lentisel', 'stomata', 'trakea', 'akar'], kunci: 'B'
    },
    {
      id: 'Q09', mapel: 'Fiqih', kelas: '4', tipe: 'PG', bobot: 10,
      text: 'Rukun Islam yang keempat adalah ....',
      options: ['salat', 'zakat', 'puasa', 'haji'], kunci: 'C'
    },
    {
      id: 'Q10', mapel: 'Fiqih', kelas: '5', tipe: 'PG', bobot: 10,
      text: 'Salat yang dikerjakan secara berjamaah pada hari Jumat disebut salat ....',
      options: ['idulfitri', 'jumat', 'dhuha', 'tahajud'], kunci: 'B'
    },
    {
      id: 'Q11', mapel: 'Bahasa Arab', kelas: '4', tipe: 'PG', bobot: 10,
      text: 'Arti kata "الْكِتَابُ" adalah ....',
      options: ['buku', 'meja', 'pintu', 'jendela'], kunci: 'A'
    },
    {
      id: 'Q12', mapel: 'Bahasa Arab', kelas: '6', tipe: 'Uraian', bobot: 10,
      text: 'Tulislah dua kalimat bahasa Arab sederhana yang menggunakan kata "الطَّالِبُ" (siswa).',
      jawaban: 'Rubrik: penggunaan kosakata, susunan kalimat, dan ketepatan tulisan Arab.'
    }
  ];

  const exam = {
    mapel: 'Matematika',
    kelas: 'Kelas 6',
    tingkat: 'UAS Ganjil',
    durasi: 60,
    soal: [
      {
        id: 'E01', tipe: 'PG', bobot: 10,
        text: 'Hasil dari 2.450 + 1.275 − 900 adalah ....',
        options: ['2.725', '2.825', '2.925', '3.025'], kunci: 'B'
      },
      {
        id: 'E02', tipe: 'PG', bobot: 10,
        text: 'KPK dari 12 dan 18 adalah ....',
        options: ['24', '30', '36', '72'], kunci: 'C'
      },
      {
        id: 'E03', tipe: 'PG', bobot: 10,
        text: 'Volume kubus dengan panjang rusuk 9 cm adalah ....',
        options: ['486 cm³', '729 cm³', '1.296 cm³', '2.187 cm³'], kunci: 'B'
      },
      {
        id: 'E04', tipe: 'PG', bobot: 10,
        text: 'Nilai 35% dari 800 adalah ....',
        options: ['240', '260', '280', '320'], kunci: 'C'
      },
      {
        id: 'E05', tipe: 'PG', bobot: 10,
        text: 'Jarak 120 km ditempuh dalam waktu 2 jam. Kecepatan rata-ratanya adalah ....',
        options: ['40 km/jam', '50 km/jam', '60 km/jam', '70 km/jam'], kunci: 'C'
      },
      {
        id: 'E06', tipe: 'PG', bobot: 10,
        text: 'Hasil dari 3/4 + 2/5 adalah ....',
        options: ['5/9', '23/20', '6/9', '1 1/20'], kunci: 'B'
      },
      {
        id: 'E07', tipe: 'PG', bobot: 10,
        text: 'Luas lingkaran dengan diameter 28 cm (π = 22/7) adalah ....',
        options: ['154 cm²', '308 cm²', '616 cm²', '924 cm²'], kunci: 'C'
      },
      {
        id: 'E08', tipe: 'PG', bobot: 10,
        text: 'Modus dari data 7, 8, 8, 9, 8, 7, 10 adalah ....',
        options: ['7', '8', '9', '10'], kunci: 'B'
      },
      {
        id: 'E09', tipe: 'Uraian', bobot: 10,
        text: 'Sebuah bak mandi berbentuk balok berukuran panjang 80 cm, lebar 50 cm, dan tinggi 60 cm. Hitunglah volume bak mandi tersebut, lalu nyatakan dalam satuan liter.'
      },
      {
        id: 'E10', tipe: 'Uraian', bobot: 10,
        text: 'Ayah membeli 3 kotak pensil. Setiap kotak berisi 12 pensil. Semua pensil dibagikan sama banyak kepada 9 anak. Berapa pensil yang diterima setiap anak? Tuliskan langkah pengerjaannya.'
      }
    ]
  };

  const results = [
    { studentId: 'S21', mtk: 88, bin: 90, ipa: 86, arab: 85, fiqih: 88 },
    { studentId: 'S22', mtk: 82, bin: 78, ipa: 80, arab: 80, fiqih: 82 },
    { studentId: 'S23', mtk: 95, bin: 92, ipa: 94, arab: 90, fiqih: 93 },
    { studentId: 'S24', mtk: 76, bin: 80, ipa: 78, arab: 78, fiqih: 80 },
    { studentId: 'S25', mtk: 92, bin: 88, ipa: 90, arab: 89, fiqih: 91 },
    { studentId: 'S26', mtk: 70, bin: 74, ipa: 72, arab: 75, fiqih: 76 },
    { studentId: 'S27', mtk: 86, bin: 84, ipa: 88, arab: 86, fiqih: 87 },
    { studentId: 'S28', mtk: 78, bin: 72, ipa: 76, arab: 74, fiqih: 78 },
    { studentId: 'S29', mtk: 90, bin: 94, ipa: 92, arab: 92, fiqih: 90 },
    { studentId: 'S30', mtk: 74, bin: 70, ipa: 72, arab: 72, fiqih: 74 }
  ];

  const announcements = [
    {
      id: 'A1', kategori: 'Jadwal', date: '2026-11-16',
      title: 'Jadwal UAS Ganjil 2026/2027 Telah Terbit',
      excerpt: 'Ujian dilaksanakan 23–25 November 2026 untuk seluruh siswa kelas 4, 5, dan 6.'
    },
    {
      id: 'A2', kategori: 'Penting', date: '2026-11-18',
      title: 'Sosialisasi Teknis Pengerjaan Ujian Berbasis Komputer',
      excerpt: 'Wajib diikuti seluruh peserta didik kelas 6 pada pukul 13.00 WIB di ruang kelas masing-masing.'
    },
    {
      id: 'A3', kategori: 'Pengumuman', date: '2026-11-17',
      title: 'Peserta Wajib Membawa Kartu Peserta Ujian',
      excerpt: 'Kartu peserta dapat diambil di ruang tata usaha mulai 19 November 2026.'
    },
    {
      id: 'A4', kategori: 'Kegiatan', date: '2026-11-14',
      title: 'Pelatihan Guru: Penyusunan Soal Berbasis HOTS',
      excerpt: 'Kegiatan dilaksanakan di aula madrasah dan diikuti seluruh guru mata pelajaran.'
    }
  ];

  const accounts = [
    { role: 'siswa', name: 'Aisyah Nuraini', username: 'siswa', password: '123456', detail: 'Kelas 6A · NISN 0061234525' },
    { role: 'guru', name: 'Rina Marlina, S.Pd.', username: 'guru', password: '123456', detail: 'Guru Matematika' },
    { role: 'admin', name: 'Operator Madrasah', username: 'admin', password: '123456', detail: 'Administrator Sistem' },
    { role: 'kepala', name: 'Dra. Hj. Nurhasanah, M.Pd.', username: 'kepala', password: '123456', detail: 'Kepala Madrasah' }
  ];

  const defaultSettings = {
    namaMadrasah: 'MIN 3 Mukomuko',
    npsn: '10704312',
    kepala: 'Dra. Hj. Nurhasanah, M.Pd.',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kkm: 70,
    durasi: 60,
    acakSoal: false,
    hasilLangsung: true,
    alamat: 'Jl. Raya Mukomuko–Ipuh, Kecamatan Kota Mukomuko, Kabupaten Mukomuko, Provinsi Bengkulu',
    logo: ''
  };

  return {
    students: students,
    teachers: teachers,
    schedules: schedules,
    questions: questions,
    exam: exam,
    results: results,
    announcements: announcements,
    accounts: accounts,
    defaultSettings: defaultSettings
  };
})();
