import QRCode from "qrcode";

const QR_PREFIX = "cociligan://student/";

export function buildQrPayload(qrToken: string): string {
  return `${QR_PREFIX}${qrToken}`;
}

export function parseQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(QR_PREFIX)) {
    return trimmed.slice(QR_PREFIX.length).trim() || null;
  }

  return trimmed;
}

export async function generateQrPngBuffer(qrToken: string): Promise<Buffer> {
  const payload = buildQrPayload(qrToken);
  return QRCode.toBuffer(payload, {
    type: "png",
    width: 320,
    margin: 2,
    color: {
      dark: "#14532d",
      light: "#ffffff",
    },
  });
}

export async function generateQrDataUrl(qrToken: string): Promise<string> {
  const payload = buildQrPayload(qrToken);
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: {
      dark: "#14532d",
      light: "#ffffff",
    },
  });
}
