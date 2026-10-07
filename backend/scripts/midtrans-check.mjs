/**
 * Cek koneksi & key Midtrans TANPA menjalankan aplikasi.
 *   cd backend
 *   node scripts/midtrans-check.mjs
 * Membuat 1 transaksi uji Rp 10.000 di Midtrans (hanya token, tidak ada uang yang bergerak).
 */
import "dotenv/config";

const server = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
const client = (process.env.MIDTRANS_CLIENT_KEY ?? "").trim();
const production = process.env.MIDTRANS_IS_PRODUCTION === "true";

const mask = (k) => {
  const m = k.match(/^(.*?-(?:server|client)-)(.*)$/);
  return k ? `${m ? m[1] : k.slice(0, 6)}…${(m ? m[2] : k).slice(-4)}  (${k.length} karakter)` : "(KOSONG)";
};

console.log("=== Cek Midtrans ===");
console.log(`Mode            : ${production ? "PRODUCTION" : "Sandbox"}`);
console.log(`Server Key      : ${mask(server)}`);
console.log(`Client Key      : ${mask(client)}`);
console.log("(Bandingkan awalan, 4 karakter terakhir & panjang dengan Dashboard Midtrans > Settings > Access Keys)\n");

const problems = [];
if (!server) problems.push("MIDTRANS_SERVER_KEY kosong / tidak terbaca dari backend/.env (pastikan file bernama .env dan dijalankan dari folder backend).");
if (!client) problems.push("MIDTRANS_CLIENT_KEY kosong.");
if (server.includes("-client-")) problems.push("SERVER Key berisi CLIENT Key (tertukar).");
if (client.includes("-server-")) problems.push("CLIENT Key berisi SERVER Key (tertukar).");
if (/\s|["']/.test(server + client)) problems.push("Key mengandung spasi/tanda kutip.");
if (problems.length) {
  console.log("MASALAH TERDETEKSI:\n- " + problems.join("\n- "));
  process.exit(1);
}

const url = production ? "https://app.midtrans.com/snap/v1/transactions" : "https://app.sandbox.midtrans.com/snap/v1/transactions";
try {
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${server}:`).toString("base64") },
    body: JSON.stringify({ transaction_details: { order_id: `check-${Date.now()}`, gross_amount: 10000 } }),
  });
  const text = await res.text();
  console.log(`Respons Midtrans: HTTP ${res.status}\n${text}\n`);
  if (res.ok) console.log("HASIL: BERHASIL. Server Key valid. Jika aplikasi masih error, restart backend & kirim log terbarunya.");
  else if (res.status === 401) {
    console.log("HASIL: DITOLAK (401). Server Key ini tidak diterima Midtrans.");
    console.log("- Tulis key PERSIS seperti di dashboard; jangan menambah/menghapus awalan apa pun (mis. SB-).");
    console.log(`- Lingkungan dashboard tempat key diambil harus sama dengan MIDTRANS_IS_PRODUCTION (sekarang: ${production}; Sandbox -> false).`);
    console.log("- Bandingkan awalan, 4 karakter terakhir & panjang di atas dengan dashboard. Jika sama persis dan tetap ditolak: key sudah diganti / bukan milik lingkungan itu — buat ulang di dashboard.");
  }
  else console.log("HASIL: Midtrans merespons error lain; baca pesan di atas.");
} catch (error) {
  console.log("Gagal menghubungi Midtrans:", error instanceof Error ? error.message : error, "\nPeriksa koneksi internet / firewall / proxy.");
  process.exit(1);
}
