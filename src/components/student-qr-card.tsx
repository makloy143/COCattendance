"use client";

import Image from "next/image";
import { Download, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StudentQrCardProps = {
  studentDbId: string;
  studentId: string;
  firstName: string;
  lastName: string;
};

export function StudentQrCard({
  studentDbId,
  studentId,
  firstName,
  lastName,
}: StudentQrCardProps) {
  const qrUrl = `/api/students/${studentDbId}/qr`;

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${firstName} ${lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
            img { width: 240px; height: 240px; }
            h2 { margin: 16px 0 4px; }
            p { color: #555; margin: 0; }
          </style>
        </head>
        <body>
          <img src="${qrUrl}" alt="Student QR code" />
          <h2>${firstName} ${lastName}</h2>
          <p>${studentId}</p>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-xl border bg-white p-4">
          <Image
            src={qrUrl}
            alt={`QR code for ${firstName} ${lastName}`}
            width={240}
            height={240}
            unoptimized
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Scan this code at the kiosk to record time in or time out.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={qrUrl}
            download={`${studentId}-qr.png`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Download className="size-4" />
            Download
          </a>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
