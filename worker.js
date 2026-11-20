export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Endpoint /api/soal
    if (path === "/api/soal") {
      if (request.method === "GET") {
        const mapel = url.searchParams.get("mapel");
        const kelas = url.searchParams.get("kelas");
        let query = "SELECT * FROM bank_soal";
        let params = [];
        if (mapel && kelas) {
          query += " WHERE mapel = ? AND kelas = ?";
          params.push(mapel, kelas);
        } else if (mapel) {
          query += " WHERE mapel = ?";
          params.push(mapel);
        }
        const { results } = await env.DB.prepare(query).bind(...params).all();
        return Response.json({ status: "success", data: results });
      }

      if (request.method === "POST") {
        const body = await request.json();
        const daftarSoal = Array.isArray(body) ? body : [body];
        const stmt = env.DB.prepare(
          `INSERT INTO bank_soal (mapel, kelas, tipe, bobot, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci, pembahasan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const batch = daftarSoal.map((s) =>
          stmt.bind(
            s.mapel || "", s.kelas || "", s.tipe || "PG", s.bobot || 1,
            s.pertanyaan || "", s.pilihan_a || "", s.pilihan_b || "",
            s.pilihan_c || "", s.pilihan_d || "", s.kunci || "", s.pembahasan || ""
          )
        );
        await env.DB.batch(batch);
        return Response.json({ status: "success", message: `${daftarSoal.length} soal disimpan.` });
      }
    }

    // 2. Endpoint /api/hasil
    if (path === "/api/hasil") {
      if (request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM hasil_ujian ORDER BY waktu_selesai DESC").all();
        return Response.json({ status: "success", data: results });
      }

      if (request.method === "POST") {
        const data = await request.json();
        await env.DB.prepare(
          `INSERT INTO hasil_ujian (nisn, nama_siswa, kelas, mapel, skor, benar, salah, jawaban_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.nisn || "", data.nama_siswa, data.kelas, data.mapel,
          data.skor || 0, data.benar || 0, data.salah || 0, JSON.stringify(data.jawaban || {})
        ).run();
        return Response.json({ status: "success", message: "Hasil ujian disimpan." });
      }
    }

    // 3. Endpoint /api/jadwal
    if (path === "/api/jadwal") {
      if (request.method === "GET") {
        const token = url.searchParams.get("token");
        if (token) {
          const jadwal = await env.DB.prepare(
            "SELECT * FROM jadwal_ujian WHERE token = ? AND status = 'AKTIF'"
          ).bind(token).first();
          if (!jadwal) return Response.json({ status: "error", message: "Token tidak valid." }, { status: 404 });
          return Response.json({ status: "success", data: jadwal });
        }
        const { results } = await env.DB.prepare("SELECT * FROM jadwal_ujian ORDER BY id DESC").all();
        return Response.json({ status: "success", data: results });
      }
    }

    // Jika bukan rute /api/..., tampilkan halaman web (index.html / static assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
