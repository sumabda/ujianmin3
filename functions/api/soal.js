export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const mapel = url.searchParams.get("mapel");
  const kelas = url.searchParams.get("kelas");

  try {
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
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    // Mendukung input 1 soal atau banyak soal sekaligus (array)
    const daftarSoal = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(`
      INSERT INTO bank_soal (mapel, kelas, tipe, bobot, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci, pembahasan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = daftarSoal.map((s) =>
      stmt.bind(
        s.mapel || "",
        s.kelas || "",
        s.tipe || "PG",
        s.bobot || 1,
        s.pertanyaan || "",
        s.pilihan_a || "",
        s.pilihan_b || "",
        s.pilihan_c || "",
        s.pilihan_d || "",
        s.kunci || "",
        s.pembahasan || ""
      )
    );

    await env.DB.batch(batch);
    return Response.json({ status: "success", message: `${daftarSoal.length} soal berhasil disimpan.` });
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
