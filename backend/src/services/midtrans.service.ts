import { createHash } from "node:crypto";

/**
 * Klien tipis untuk Midtrans (Snap + Status API) memakai fetch bawaan Node.
 * Tidak butuh dependency tambahan.
 */

export type MidtransStatusPayload = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  signature_key?: string;
  status_message?: string;
  transaction_id?: string;
  [key: string]: unknown;
};

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

const GENERIC_UNAVAILABLE = "Pembayaran online sedang tidak tersedia. Silakan coba lagi nanti atau hubungi admin.";

/**
 * Masalah konfigurasi ditampilkan lengkap saat development (supaya mudah diperbaiki),
 * tetapi customer di production hanya melihat pesan umum; detailnya tetap ada di log server.
 */
function configError(detail: string) {
  console.error(`[Midtrans] ${detail}`);
  return new Error(process.env.NODE_ENV === "production" ? GENERIC_UNAVAILABLE : detail);
}

/** Ringkasan key yang AMAN ditampilkan di log (tanpa membocorkan key): awalan, panjang, 4 karakter terakhir, karakter janggal. */
function describeKey(raw: string | undefined) {
  const key = raw ?? "";
  if (!key) return "(kosong)";
  const trimmed = key.trim();
  const odd = [...trimmed].filter((c) => !/[A-Za-z0-9_-]/.test(c));
  const parts = [
    `awalan "${trimmed.slice(0, 14)}"`,
    `panjang ${trimmed.length}`,
    `4 karakter terakhir "...${trimmed.slice(-4)}"`,
  ];
  if (key !== trimmed) parts.push("ADA SPASI di awal/akhir");
  if (odd.length) parts.push(`KARAKTER JANGGAL: ${odd.map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(" ")}`);
  return parts.join(", ");
}

/** Ringkasan key yang terbaca backend, untuk log saat start & pesan error (hanya di luar production). */
export function describeMidtransKeys() {
  return `Server Key terbaca: ${describeKey(process.env.MIDTRANS_SERVER_KEY)} | Client Key terbaca: ${describeKey(process.env.MIDTRANS_CLIENT_KEY)}`;
}

const looksLikePlaceholder = (value: string) => /x{4,}|your[-_]|isi[-_]|changeme/i.test(value);

/** Mengembalikan penjelasan masalah konfigurasi Midtrans, atau null bila sudah benar. */
export function getMidtransConfigProblem(): string | null {
  const server = process.env.MIDTRANS_SERVER_KEY?.trim() ?? "";
  const client = process.env.MIDTRANS_CLIENT_KEY?.trim() ?? "";
  if (!server) return "MIDTRANS_SERVER_KEY belum diisi di backend/.env. Isi dengan Server Key dari Dashboard Midtrans (Settings > Access Keys), lalu restart backend.";
  if (!client) return "MIDTRANS_CLIENT_KEY belum diisi di backend/.env. Isi dengan Client Key dari Dashboard Midtrans (Settings > Access Keys), lalu restart backend.";
  if (looksLikePlaceholder(server) || looksLikePlaceholder(client)) {
    return "MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY di backend/.env masih berisi nilai contoh. Ganti dengan key asli dari Dashboard Midtrans, lalu restart backend.";
  }

  // Key tertukar (Client Key di kolom Server Key atau sebaliknya) adalah penyebab 401 yang paling sering.
  if (/-client-/i.test(server) && !/-server-/i.test(server)) {
    return "MIDTRANS_SERVER_KEY berisi CLIENT Key (mengandung '-client-'). Tertukar: Server Key mengandung '-server-', Client Key mengandung '-client-'.";
  }
  if (/-server-/i.test(client) && !/-client-/i.test(client)) {
    return "MIDTRANS_CLIENT_KEY berisi SERVER Key (mengandung '-server-'). Tertukar: Client Key mengandung '-client-', Server Key mengandung '-server-'.";
  }
  if (!/-server-/i.test(server)) return "MIDTRANS_SERVER_KEY tidak terlihat seperti Server Key (seharusnya mengandung '-server-', mis. Mid-server-... / SB-Mid-server-...).";
  if (!/-client-/i.test(client)) return "MIDTRANS_CLIENT_KEY tidak terlihat seperti Client Key (seharusnya mengandung '-client-', mis. Mid-client-... / SB-Mid-client-...).";

  if (/\s|["']/.test(server) || /\s|["']/.test(client)) {
    return "MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY mengandung spasi atau tanda kutip di tengah nilai. Tulis persis seperti di dashboard, satu baris, tanpa tanda kutip.";
  }

  return null;
}

/** Dipanggil sebelum membuat transaksi, agar tidak ada catatan pembayaran yang menggantung bila konfigurasi salah. */
export function assertMidtransConfigured() {
  const problem = getMidtransConfigProblem();
  if (problem) throw configError(problem);
}

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!key) {
    throw configError("MIDTRANS_SERVER_KEY belum diisi di backend/.env. Isi lalu restart backend.");
  }
  return key;
}

export function getMidtransClientConfig() {
  return {
    clientKey: process.env.MIDTRANS_CLIENT_KEY?.trim() ?? "",
    isProduction: isProduction(),
  };
}

function snapBaseUrl() {
  return isProduction() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

function apiBaseUrl() {
  return isProduction() ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
}

function authHeader() {
  return `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`;
}

async function midtransRequest<T>(url: string, init: RequestInit): Promise<T> {
  // Dihitung di luar try: bila server key kosong, pesannya harus "belum dikonfigurasi", bukan "tidak dapat terhubung".
  const authorization = authHeader();

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke Midtrans. Coba lagi beberapa saat.");
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    console.error(`[Midtrans] ${init.method ?? "GET"} ${url} -> HTTP ${response.status}`, JSON.stringify(body));

    if (response.status === 401) {
      throw configError(
        `Midtrans menolak Server Key (HTTP 401). ${describeMidtransKeys()}. ` +
          "Tulis key PERSIS seperti di dashboard Midtrans, jangan menambah atau menghapus awalan apa pun (mis. \"SB-\"). " +
          `Pastikan lingkungan dashboard tempat key diambil sama dengan MIDTRANS_IS_PRODUCTION (Sandbox -> false, Production -> true; saat ini: ${isProduction() ? "true" : "false"}). ` +
          "Bandingkan awalan, 4 karakter terakhir, dan panjang key di atas dengan dashboard. Jika sama persis dan tetap ditolak: key bukan milik lingkungan itu atau sudah diganti — buat ulang di dashboard. Lalu restart backend.",
      );
    }

    const messages = Array.isArray(body.error_messages)
      ? (body.error_messages as string[]).join(", ")
      : typeof body.status_message === "string"
        ? body.status_message
        : `HTTP ${response.status}`;
    throw new Error(`Midtrans: ${messages}`);
  }

  return body as T;
}

export async function createSnapTransaction(input: {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  finishUrl?: string;
}) {
  const [firstName, ...rest] = input.customer.name.trim().split(/\s+/);

  const body = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.grossAmount,
    },
    item_details: [
      {
        id: input.orderId,
        price: input.grossAmount,
        quantity: 1,
        name: input.itemName.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: firstName || "Customer",
      last_name: rest.join(" ") || undefined,
      email: input.customer.email ?? undefined,
      phone: input.customer.phone && !input.customer.phone.startsWith("GOOGLE-")
        ? input.customer.phone
        : undefined,
    },
    credit_card: { secure: true },
    expiry: { unit: "minutes", duration: 24 * 60 },
    ...(input.finishUrl ? { callbacks: { finish: input.finishUrl } } : {}),
  };

  return midtransRequest<{ token: string; redirect_url: string }>(
    `${snapBaseUrl()}/snap/v1/transactions`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

/** Ambil status transaksi langsung dari Midtrans (dipercaya karena kita yang memanggil). */
export async function getMidtransStatus(midtransOrderId: string) {
  return midtransRequest<MidtransStatusPayload>(
    `${apiBaseUrl()}/v2/${encodeURIComponent(midtransOrderId)}/status`,
    { method: "GET" },
  );
}

/** Batalkan transaksi pending di Midtrans. Best effort: error diabaikan. */
export async function cancelMidtransTransaction(midtransOrderId: string) {
  try {
    await midtransRequest(
      `${apiBaseUrl()}/v2/${encodeURIComponent(midtransOrderId)}/cancel`,
      { method: "POST" },
    );
  } catch {
    // transaksi belum dibuat / sudah final -> abaikan
  }
}

/** Validasi signature notifikasi webhook: SHA512(order_id + status_code + gross_amount + serverKey). */
export function isValidMidtransSignature(payload: Partial<MidtransStatusPayload>) {
  if (!payload.order_id || !payload.status_code || !payload.gross_amount || !payload.signature_key) {
    return false;
  }

  const expected = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey()}`)
    .digest("hex");

  return expected === payload.signature_key;
}
