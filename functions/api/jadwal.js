export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  try {
    if (token) {
      const jadwal = await env.DB.prepare(
        "SELECT * FROM jadwal_ujian WHERE token = ? AND status = 'AKTIF'"
      ).bind(token).first();

      if (!jadwal) {
        return Response.json({ status: "error", message: "Token tidak valid atau ujian belum aktif." }, { status: 404 });
      }
      return Response.json({ status: "success", data: jadwal });
    }

    const { results } = await env.DB.prepare("SELECT * FROM jadwal_ujian ORDER BY id DESC").all();
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
      INSERT INTO jadwal_ujian (mapel, kelas, token, durasi_menit, status, tanggal_ujian)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(
        data.mapel,
        data.kelas,
        data.token,
        data.durasi_menit || 60,
        data.status || "AKTIF",
        data.tanggal_ujian || ""
      )
      .run();

    return Response.json({ status: "success", message: "Jadwal ujian berhasil ditambahkan." });
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
