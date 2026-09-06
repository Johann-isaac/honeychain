import QRCode from "qrcode";

export function getVerificationUrl(batchCode: string, origin?: string) {
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify/${batchCode}`;
}

export async function generateBatchQrDataUrl(batchCode: string, origin?: string) {
  const url = getVerificationUrl(batchCode, origin);
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 320,
    color: { dark: "#3a2a12", light: "#fffaf0" },
  });
}
