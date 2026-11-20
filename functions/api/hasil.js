export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const mapel = url.searchParams.get("mapel");
  const kelas = url.searchParams.get("kelas");

  try {
    let query = "SELECT * FROM hasil_ujian";
    let params = [];

    if (mapel && kelas) {
      query += " WHERE mapel = ? AND kelas = ?";
      params.push(mapel, kelas);
    }
    query += " ORDER BY waktu_selesai DESC";

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return Response.json({ status: "success", data: results });
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    await env.DB.prepare(`
      INSERT INTO hasil_ujian (nisn, nama_siswa, kelas, mapel, skor, benar, salah, jawaban_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        data.nisn || "",
        data.nama_siswa,
        data.kelas,
        data.mapel,
        data.skor || 0,
        data.benar || 0,
        data.salah || 0,
        JSON.stringify(data.jawaban || {})
      )
      .run();

    return Response.json({ status: "success", message: "Hasil ujian berhasil disimpan." });
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
