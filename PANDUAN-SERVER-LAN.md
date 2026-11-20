# Panduan Menjalankan E-Ujian di Jaringan Lokal (LAN)

Panduan ini membuat website E-Ujian bisa dibuka dari laptop/HP lain dalam satu Wi-Fi atau LAN yang sama, tanpa hosting dan tanpa internet (kecuali instalasi pertama).

## 1. Yang dibutuhkan

- Satu laptop sebagai "server" yang menyimpan folder situs ini.
- Semua perangkat (laptop/HP) tersambung ke Wi-Fi/LAN yang sama.
- Python 3 **atau** Node.js terpasang di laptop server. Python lebih disarankan karena bisa berjalan tanpa internet.

## 2. Langkah cepat

1. Di laptop server, klik dua kali `jalankan-server-lan.cmd`.
2. Jendela hitam akan menampilkan daftar alamat IPv4 laptop. Catat yang berawalan `192.168.`, `10.`, atau `172.` (biasanya alamat Wi-Fi).
3. Server berjalan di port **8080**. Browser di laptop server otomatis terbuka.
4. Dari laptop/HP lain, buka:

   ```
   http://IP-LAPTOP:8080
   ```

   Contoh: `http://192.168.1.10:8080`

5. Biarkan jendela server tetap terbuka selama ujian. Untuk berhenti: tekan `Ctrl+C` atau tutup jendelanya.

## 3. Jika Python/Node.js belum terpasang

Skrip akan memberi tahu. Pilih salah satu:

- **Python (disarankan):** unduh dari https://www.python.org/downloads/ — saat instalasi centang **"Add python.exe to PATH"** — lalu jalankan ulang `jalankan-server-lan.cmd`.
- **Node.js:** unduh LTS dari https://nodejs.org/ — jalankan ulang skrip. Saat pertama kali, `npx` akan mengunduh paket `serve` sehingga butuh internet.

## 4. Firewall Windows

Saat server pertama kali dijalankan, Windows biasanya menampilkan izin firewall. Centang **Private networks** dan klik **Allow access**.

Jika perangkat lain tetap tidak bisa membuka, buka Command Prompt **sebagai Administrator** lalu jalankan:

```
netsh advfirewall firewall add rule name="E-Ujian 8080" dir=in action=allow protocol=TCP localport=8080
```

## 5. Menyamakan data antar perangkat

Data E-Ujian disimpan di browser masing-masing perangkat (`localStorage`), jadi tidak otomatis sama. Untuk menyalin data:

1. Di laptop admin: buka **Pengaturan → Backup & Pindah Data → Ekspor Data (JSON)**.
2. Kirim file `eujian-backup-....json` ke perangkat tujuan.
3. Di perangkat tujuan: login sebagai staf, buka **Pengaturan → Impor Data**, pilih file tersebut.

Lakukan sekali di setiap perangkat baru. Setelah itu siswa login dengan NISN masing-masing dan memakai menu Sinkronisasi Soal.

> Catatan: untuk data yang benar-benar terpusat (soal dan nilai langsung terlihat di semua perangkat), diperlukan backend/database, bukan sekadar server LAN.

### Tautan login siswa terpisah
Portal siswa punya alamat sendiri, terpisah dari portal guru/staf:

```
http://IP-LAPTOP:8080/login-siswa.html
```

Bagikan tautan ini kepada siswa. Tautan yang sama juga muncul di halaman **Pilih Portal** dan bisa disalin lewat tombol **Salin tautan**. Siswa masuk memakai NISN dengan kata sandi awal `123456`.

### Login guru memakai nama atau NIP
Setiap guru pada menu **Data Guru** otomatis memiliki akun di portal `login-staf.html`:

- Masuk memakai **nama lengkap** (misalnya `Rina Marlina`; gelar seperti `S.Pd.` boleh tidak ditulis) atau **NIP** guru tersebut.
- Kata sandi awal setiap guru: `123456`.
- Guru hasil **Import Excel** maupun tambah manual langsung dapat login tanpa pengaturan tambahan.
- Admin dan kepala madrasah tetap memakai username `admin` / `kepala`.

### Import data guru dari Excel
Menu **Data Guru** menyediakan tombol **Template** dan **Import Excel**:

1. Klik **Template** untuk mengunduh `template-data-guru.xlsx`.
2. Isi kolom: **Nama, NIP, Mata Pelajaran, Kelas / Tugas, Status Kepegawaian (PNS/PPPK/GTY), Email** (email opsional).
3. Klik **Import Excel**, pilih file, lalu periksa pratinjau. Baris valid bisa langsung diimport; baris bermasalah (NIP ganda, NIP bukan 8–18 digit, email salah) ditandai untuk dikoreksi.
4. Setelah diimport, guru muncul di daftar dan dapat login memakai nama atau NIP.

### Ekspor & sinkron ke Google Sheets
**Hasil Ujian** (akun staf) memiliki tombol **Sinkron**, **Excel**, **CSV**, dan **Salin ke Google Sheets**:
- **Sinkron** — membuka dialog sinkron untuk mengirim rekap nilai ke spreadsheet lewat Apps Script Web App. Tersedia juga opsi kirim otomatis sekali sehari saat halaman dibuka.
- **Excel/CSV** — unduh file lalu buka di Google Sheets melalui **File → Impor**.
- **Salin ke Google Sheets** — tabel disalin siap tempel (Ctrl+V) di spreadsheet.
- **Hapus** — setiap baris hasil ujian punya tombol hapus (ikon tempat sampah). Data yang dihapus tidak lagi muncul di rekap, peringkat, portal siswa, maupun cetak laporan.

**Cetak Laporan** juga memiliki tombol **Sinkron**. Data yang dikirim mengikuti jenis laporan yang aktif ke sheet berbeda: `Laporan Nilai`, `Daftar Peserta`, atau `Berita Acara`. Pilihan kelas mencakup semua kelas 4A–6B ditambah **Semua Kelas (4–6)**. Daftar Peserta memuat seluruh siswa pada kelas terpilih; Daftar Nilai menggabungkan rekap nilai dan hasil pengerjaan siswa (tanda — bila nilai belum tersedia); Berita Acara mengikuti jadwal ujian kelas tersebut (mapel, tanggal, waktu, dan pengawas).

### Hasil pengerjaan siswa
Saat siswa selesai mengerjakan ujian, nilainya otomatis tersimpan di perangkat siswa dan muncul pada kartu **Hasil Pengerjaan Siswa** di halaman **Hasil Ujian** perangkat yang sama.

Karena situs ini statis (data disimpan di browser), nilai siswa **tidak otomatis berpindah** ke laptop guru di perangkat lain. Ada dua cara mengumpulkannya:

1. **Langsung dari perangkat siswa (disarankan):** pada halaman hasil ujian setelah selesai, siswa menekan **Sinkron Nilai**, menempelkan URL Web App yang sama (cukup sekali per perangkat), lalu **Kirim Sekarang**. Nilai masuk ke sheet **Hasil Siswa**. Bila opsi kirim otomatis dicentang, nilai terkirim sendiri setiap kali ujian selesai.
2. **Dari laptop guru:** buka **Hasil Ujian → kartu Hasil Pengerjaan Siswa → Sinkron** untuk mengirim hasil yang tersimpan di perangkat guru ke sheet **Hasil Siswa**.

Hasil yang sudah masuk juga bisa langsung dicetak: klik **Cetak** pada kartu Hasil Pengerjaan Siswa, atau buka **Cetak Laporan** lalu pilih jenis **Hasil Pengerjaan Siswa** (bisa difilter per kelas). Laporan ini memuat waktu kumpul, nama, NISN, kelas, mapel, jumlah benar PG, nilai PG, dan jumlah soal uraian. Tombol Sinkron pada halaman tersebut mengirim data yang sama ke sheet **Hasil Siswa**.

Guru juga bisa menghapus satu baris hasil pengerjaan lewat ikon tempat sampah (muncul untuk akun guru/admin/kepala). Siswa hanya melihat hasil miliknya sendiri; tombol Sinkron dan hapus pada kartu disembunyikan, sedangkan tombol **Sinkron Nilai** di halaman hasil ujian tetap tersedia untuk mengirim nilainya.

#### Menyiapkan sinkron (sekali saja)
1. Buat Google Sheets baru, buka **Extensions → Apps Script**.
2. Hapus isi `Code.gs`, lalu tempel kode berikut (kode yang sama tersedia lewat bagian **Panduan Apps Script** di dialog Sinkron):

   ```javascript
   const SHEET_ID = "";              // kosongkan bila script terikat ke spreadsheet
   const SHEET_BY_JENIS = {
     "hasil-ujian": "Hasil E-Ujian",
     "laporan-nilai": "Laporan Nilai",
     "daftar-peserta": "Daftar Peserta",
     "berita-acara": "Berita Acara",
     "hasil-siswa": "Hasil Siswa"
   };

   function doPost(e) {
     try {
       var data = {};
       if (e.postData && e.postData.contents) data = JSON.parse(e.postData.contents);
       else if (e.parameter && e.parameter.payload) data = JSON.parse(e.parameter.payload);
       var headers = data.headers || [];
       var rows = data.rows || [];
       if (!headers.length || !rows.length) throw new Error("Data kosong.");
       var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
       var name = SHEET_BY_JENIS[data.jenis] || "Hasil E-Ujian";
       var sh = ss.getSheetByName(name) || ss.insertSheet(name);
       if (sh.getLastRow() === 0) {
         sh.appendRow(headers);
         sh.getRange(1, 1, 1, headers.length).setFontWeight("bold")
           .setBackground("#0f7a63").setFontColor("#ffffff");
         sh.setFrozenRows(1);
       }
       sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
       return ContentService.createTextOutput(JSON.stringify({ ok: true, sheet: name, rows: rows.length }))
         .setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```

3. Klik **Deploy → New deployment → Web app**. Atur **Execute as: Me** dan **Who has access: Anyone**, lalu Deploy dan izinkan akses.
4. Salin URL yang berakhiran **/exec** (bukan /dev), buka tombol **Sinkron** di halaman Hasil Ujian atau Cetak Laporan, tempel URL, lalu klik **Simpan URL**.
5. Tekan **Kirim Sekarang** untuk mengirim data sesuai filter yang aktif. Baris baru ditambahkan ke sheet sesuai jenis data. Bila memakai skrip versi lama (satu sheet `Hasil E-Ujian`), timpa `Code.gs` dengan kode di atas agar data laporan ikut terbaca.

> Catatan: situs ini statis, sehingga browser tidak dapat membaca respons Apps Script. Pastikan baris baru benar-benar muncul di spreadsheet. Jika tidak, periksa akses deployment sudah **Anyone** dan URL berakhiran `/exec`.

## 6. Ganti port

Jika port 8080 sudah dipakai aplikasi lain:

```
jalankan-server-lan.cmd 8081
```

Lalu akses `http://IP-LAPTOP:8081`.

## 7. Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| Halaman tidak terbuka di perangkat lain | Pastikan satu Wi-Fi/LAN, IP benar, dan firewall mengizinkan Python/Node. |
| Alamat IP berubah setiap hari | IP dari Wi-Fi bisa dinamis. Cek ulang dengan `ipconfig`, atau atur IP statis di pengaturan jaringan. |
| `python` membuka Microsoft Store | Python belum benar-benar terpasang. Pasang dari python.org dan centang "Add to PATH". |
| Port sudah digunakan | Jalankan dengan port lain, misalnya `jalankan-server-lan.cmd 8081`. |
| Server berhenti saat laptop sleep | Atur laptop agar tidak sleep selama ujian (Power & sleep). |

## 8. Alternatif tanpa LAN

Jika perangkat berada di lokasi berbeda, gunakan paket `eujian-netlify.zip` dan unggah ke https://app.netlify.com/drop untuk mendapat link online.
