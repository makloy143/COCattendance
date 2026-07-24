"use client";

import { useState } from "react";
import { QrCode, ScanFace } from "lucide-react";
import { FaceScanner } from "@/components/face-scanner";
import { QrScanner } from "@/components/qr-scanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScanMode = "face" | "qr";

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>("face");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Attendance Scan
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "face"
            ? "Face recognition records time in or time out"
            : "Scan a student QR code to record time in or time out"}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-lg justify-center">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1.5",
              mode === "face" && "bg-background shadow-sm hover:bg-background"
            )}
            onClick={() => setMode("face")}
          >
            <ScanFace />
            Face
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1.5",
              mode === "qr" && "bg-background shadow-sm hover:bg-background"
            )}
            onClick={() => setMode("qr")}
          >
            <QrCode />
            QR Code
          </Button>
        </div>
      </div>

      {mode === "face" ? <FaceScanner /> : <QrScanner />}
    </div>
  );
}
