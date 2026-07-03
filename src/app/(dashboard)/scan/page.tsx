import { QrScanner } from "@/components/qr-scanner";

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">QR Scan Kiosk</h1>
        <p className="text-sm text-muted-foreground">
          Scan a student QR code to automatically record time in or time out
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
