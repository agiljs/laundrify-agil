/**
 * Memuat snap.js Midtrans sekali saja (sandbox / production mengikuti respons backend)
 * lalu membuka popup pembayaran.
 */

let loadingPromise: Promise<void> | null = null;
let loadedFor: string | null = null;

function loadSnapScript(clientKey: string, isProduction: boolean) {
  const src = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  if (window.snap && loadedFor === src) return Promise.resolve();
  if (loadingPromise && loadedFor === src) return loadingPromise;

  loadedFor = src;
  loadingPromise = new Promise<void>((resolve, reject) => {
    document.querySelectorAll("script[data-midtrans-snap]").forEach((node) => node.remove());

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.clientKey = clientKey;
    script.dataset.midtransSnap = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Gagal memuat halaman pembayaran Midtrans. Periksa koneksi internet Anda."));
    };
    document.body.appendChild(script);
  });

  return loadingPromise;
}

export type SnapOutcome = "success" | "pending" | "error" | "closed";

/** Buka popup Snap. Promise selesai saat popup ditutup / transaksi berubah status. */
export async function openMidtransSnap(params: {
  token: string;
  clientKey: string;
  isProduction: boolean;
}): Promise<SnapOutcome> {
  if (!params.clientKey) {
    throw new Error("MIDTRANS_CLIENT_KEY belum diatur di server.");
  }

  await loadSnapScript(params.clientKey, params.isProduction);

  const snap = window.snap;
  if (!snap) throw new Error("Midtrans Snap tidak tersedia.");

  return new Promise<SnapOutcome>((resolve) => {
    snap.pay(params.token, {
      onSuccess: () => resolve("success"),
      onPending: () => resolve("pending"),
      onError: () => resolve("error"),
      onClose: () => resolve("closed"),
    });
  });
}
