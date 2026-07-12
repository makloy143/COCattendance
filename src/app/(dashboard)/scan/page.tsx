import { FaceScanner } from "@/components/face-scanner";

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Face Scan Kiosk
        </h1>
        <p className="text-sm text-muted-foreground">
          Face recognition automatically records time in or time out
        </p>
      </div>
      <FaceScanner />
    </div>
  );
}
