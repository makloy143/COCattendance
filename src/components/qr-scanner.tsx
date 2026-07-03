"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { toast } from "sonner";
import { StudentAvatar } from "@/components/student-avatar";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/date-utils";

type ScanResult = {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  message: string;
  action: "timeIn" | "timeOut";
  record: {
    timeIn: string | null;
    timeOut: string | null;
  };
};

const SCANNER_ID_PREFIX = "qr-scanner-region";

function isBenignScannerError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  ) {
    return true;
  }

  if (
    error instanceof Error &&
    error.message.includes("play() request was interrupted")
  ) {
    return true;
  }

  return false;
}

function silenceVideoPlayAborts(video: HTMLVideoElement) {
  const originalPlay = video.play.bind(video);
  video.play = function patchedPlay() {
    return originalPlay().catch((error: unknown) => {
      if (isBenignScannerError(error)) {
        return undefined;
      }
      throw error;
    });
  };
}

function watchScannerVideo(
  containerId: string,
  onVideo: (video: HTMLVideoElement) => void
) {
  const container = document.getElementById(containerId);
  if (!container) return () => {};

  const existingVideo = container.querySelector("video");
  if (existingVideo instanceof HTMLVideoElement) {
    onVideo(existingVideo);
  }

  const observer = new MutationObserver(() => {
    const video = container.querySelector("video");
    if (video instanceof HTMLVideoElement) {
      onVideo(video);
    }
  });

  observer.observe(container, { childList: true, subtree: true });

  return () => observer.disconnect();
}

function suppressPlayAbortRejection(event: PromiseRejectionEvent) {
  if (isBenignScannerError(event.reason)) {
    event.preventDefault();
  }
}

async function stopScannerSafely(scanner: Html5Qrcode) {
  const state = scanner.getState();
  if (
    state === Html5QrcodeScannerState.SCANNING ||
    state === Html5QrcodeScannerState.PAUSED
  ) {
    try {
      await scanner.stop();
    } catch {
      // Scanner may already be stopped during React strict-mode remounts.
    }
  }

  try {
    scanner.clear();
  } catch {
    // Ignore clear errors during cleanup.
  }
}

export function QrScanner() {
  const scannerId = `${SCANNER_ID_PREFIX}-${useId().replace(/:/g, "")}`;
  const processingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let stopWatchingVideo = () => {};
    const scanner = new Html5Qrcode(scannerId);

    window.addEventListener("unhandledrejection", suppressPlayAbortRejection);
    stopWatchingVideo = watchScannerVideo(scannerId, silenceVideoPlayAborts);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const response = await fetch("/api/attendance/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ qrToken: decodedText }),
            });
            const data = await response.json();

            if (!response.ok) {
              setError(data.error ?? "Scan failed");
              toast.error(data.error ?? "Scan failed");
              await new Promise((resolve) => setTimeout(resolve, 2000));
              setError(null);
              processingRef.current = false;
              return;
            }

            setLastResult(data);
            toast.success(data.message);
            await new Promise((resolve) => setTimeout(resolve, 2500));
            setLastResult(null);
          } catch {
            toast.error("Scan failed");
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } finally {
            processingRef.current = false;
          }
        },
        () => {}
      )
      .then(async () => {
        if (!mounted) {
          await stopScannerSafely(scanner);
          return;
        }

        const video = document
          .getElementById(scannerId)
          ?.querySelector("video");
        if (video instanceof HTMLVideoElement) {
          silenceVideoPlayAborts(video);
        }

        setReady(true);
      })
      .catch((error: unknown) => {
        if (!mounted || isBenignScannerError(error)) return;
        toast.error("Could not access camera. Check browser permissions.");
      });

    return () => {
      mounted = false;
      setReady(false);
      stopWatchingVideo();
      void (async () => {
        try {
          await stopScannerSafely(scanner);
          await new Promise((resolve) => setTimeout(resolve, 300));
        } finally {
          window.removeEventListener(
            "unhandledrejection",
            suppressPlayAbortRejection
          );
        }
      })();
    };
  }, [scannerId]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-1 sm:px-0">
      <div className="overflow-hidden rounded-2xl border bg-black shadow-lg">
        <div id={scannerId} className="w-full min-h-[220px] sm:min-h-[280px]" />
        {!ready && (
          <p className="bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Starting camera...
          </p>
        )}
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {lastResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <StudentAvatar
              photoUrl={lastResult.student.photoUrl}
              firstName={lastResult.student.firstName}
              lastName={lastResult.student.lastName}
              size="lg"
            />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                {lastResult.student.firstName} {lastResult.student.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {lastResult.student.studentId}
              </p>
              <p className="text-sm font-medium text-primary">
                {lastResult.message}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>In: {formatTime(lastResult.record.timeIn)}</span>
                <span>Out: {formatTime(lastResult.record.timeOut)}</span>
                <AttendanceStatusBadge
                  timeIn={lastResult.record.timeIn}
                  timeOut={lastResult.record.timeOut}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Point the camera at a student QR code. Time in/out is recorded automatically.
      </p>
    </div>
  );
}
