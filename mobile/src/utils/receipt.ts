import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import type { Order, PaymentRecord } from "../types/api";
import { colors } from "../theme/colors";

const methodLabel: Record<string, string> = {
  CASH: "Tunai (Cash)",
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer Bank",
  OTHER: "Lainnya",
};

function currency(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}

function receiptHtml(order: Order, payment: PaymentRecord) {
  const rows = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;color:#334155;">${item.service?.name ?? "Layanan"} × ${Number(item.quantity)}</td>
        <td style="padding:8px 0;text-align:right;color:#0F172A;font-weight:700;">${currency(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  const extraRows = `
    ${payment.method === "CASH" && payment.cashReceived != null
      ? `<tr><td style="padding:4px 0;color:#64748B;">Uang Diterima</td><td style="padding:4px 0;text-align:right;color:#0F172A;">${currency(payment.cashReceived)}</td></tr>
         <tr><td style="padding:4px 0;color:#64748B;">Kembalian</td><td style="padding:4px 0;text-align:right;color:#0F172A;">${currency(payment.changeAmount)}</td></tr>`
      : ""}
    ${payment.transactionCode ? `<tr><td style="padding:4px 0;color:#64748B;">Kode Transaksi</td><td style="padding:4px 0;text-align:right;color:#0F172A;">${payment.transactionCode}</td></tr>` : ""}
    ${payment.receivedBy?.name ? `<tr><td style="padding:4px 0;color:#64748B;">Diterima Oleh</td><td style="padding:4px 0;text-align:right;color:#0F172A;">${payment.receivedBy.name}</td></tr>` : ""}
  `;

  return `
  <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color:#0F172A;">
      <div style="text-align:center; margin-bottom: 24px;">
        <div style="display:inline-block;width:48px;height:48px;border-radius:14px;background:${colors.brand};color:#fff;font-weight:900;font-size:24px;line-height:48px;">L</div>
        <h1 style="margin:12px 0 2px;font-size:20px;letter-spacing:1px;">LAUNDRIFY</h1>
        <p style="margin:0;color:#64748B;font-size:12px;">Bukti Pembayaran</p>
      </div>

      <div style="background:#F8FAFC;border-radius:16px;padding:16px 20px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:4px 0;color:#64748B;">Kode Order</td><td style="padding:4px 0;text-align:right;font-weight:800;">${order.orderCode}</td></tr>
          <tr><td style="padding:4px 0;color:#64748B;">Customer</td><td style="padding:4px 0;text-align:right;">${order.customer?.name ?? "-"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748B;">Tanggal Bayar</td><td style="padding:4px 0;text-align:right;">${formatDate(payment.paidAt)}</td></tr>
          <tr><td style="padding:4px 0;color:#64748B;">Metode Pembayaran</td><td style="padding:4px 0;text-align:right;font-weight:800;">${methodLabel[payment.method] ?? payment.method}</td></tr>
          ${extraRows}
        </table>
      </div>

      <h3 style="font-size:13px;color:#0F172A;margin-bottom:8px;">Rincian Layanan</h3>
      <table style="width:100%;font-size:13px;border-top:1px solid #E2E8F0;">
        ${rows}
      </table>

      <div style="border-top:2px solid #0F172A;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
        <table style="width:100%;font-size:15px;">
          <tr><td style="font-weight:900;">Jumlah Dibayar</td><td style="text-align:right;font-weight:900;color:${colors.brand};">${currency(payment.amount)}</td></tr>
        </table>
      </div>

      <p style="text-align:center;color:#94A3B8;font-size:10px;margin-top:32px;">
        Dokumen ini dibuat otomatis oleh aplikasi Laundrify Staff sebagai bukti pembayaran yang sah.
      </p>
    </body>
  </html>`;
}

export async function downloadPaymentReceipt(order: Order, payment: PaymentRecord) {
  const html = receiptHtml(order, payment);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Bukti Pembayaran ${order.orderCode}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    Alert.alert("Bukti pembayaran dibuat", `File tersimpan sementara di:\n${uri}`);
  }
  return uri;
}
