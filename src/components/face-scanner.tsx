"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScanFace } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { AttendanceStatusBadge } from "@/components/attendance-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/date-utils";
import {
  descriptorToArray,
  enrollFaceDescriptor,
  getFaceDescriptorFromImageUrl,
  getFaceDescriptorFromSource,
  loadFaceModels,
  matchFace,
  type EnrolledFace,
} from "@/lib/face-recognition";

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

type PendingFace = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
};

type FacesResponse = {
  enrolled: EnrolledFace[];
  pending: PendingFace[];
  enrolledCount: number;
  pendingCount: number;
};

export function FaceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);
  const enrolledRef = useRef<EnrolledFace[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastDetectAtRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading face models...");
  const [enrolled, setEnrolled] = useState<EnrolledFace[]>([]);
  const [pending, setPending] = useState<PendingFace[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const loadFaces = useCallback(async () => {
    const response = await fetch("/api/attendance/faces");
    const data = (await response.json()) as FacesResponse & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load enrolled faces");
    }

    enrolledRef.current = data.enrolled;
    setEnrolled(data.enrolled);
    setPending(data.pending);
    return data;
  }, []);

  const enrollPendingFaces = useCallback(async () => {
    setEnrolling(true);
    setStatus("Enrolling faces from profile photos...");

    try {
      await loadFaceModels();
      const faces = await loadFaces();

      if (faces.pending.length === 0) {
        toast.success("All students with photos are already enrolled");
        setStatus(
          faces.enrolled.length > 0
            ? "Looking for a face..."
            : "No enrolled faces yet"
        );
        return;
      }

      let success = 0;
      let failed = 0;

      for (const student of faces.pending) {
        if (!student.photoUrl) {
          failed += 1;
          continue;
        }

        try {
          const descriptor = await getFaceDescriptorFromImageUrl(
            student.photoUrl
          );

          if (!descriptor) {
            failed += 1;
            continue;
          }

          const result = await enrollFaceDescriptor(
            student.id,
            descriptorToArray(descriptor)
          );

          if (result.ok) {
            success += 1;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }

      const refreshed = await loadFaces();

      if (success > 0) {
        toast.success(
          `Enrolled ${success} face${success === 1 ? "" : "s"}${
            failed > 0 ? ` (${failed} skipped)` : ""
          }`
        );
      } else {
        toast.error(
          failed > 0
            ? "Could not detect faces in pending photos"
            : "Nothing to enroll"
        );
      }

      setStatus(
        refreshed.enrolled.length > 0
          ? "Looking for a face..."
          : "No enrolled faces yet"
      );
    } catch (enrollError) {
      toast.error(
        enrollError instanceof Error
          ? enrollError.message
          : "Failed to enroll faces"
      );
      setStatus("Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  }, [loadFaces]);

  const recordMatch = useCallback(async (student: EnrolledFace) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setStatus(`Recognized ${student.firstName}...`);

    try {
      const response = await fetch("/api/attendance/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Recognition failed");
        toast.error(data.error ?? "Recognition failed");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setError(null);
        setStatus("Looking for a face...");
        return;
      }

      setLastResult(data);
      toast.success(data.message);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setLastResult(null);
      setStatus("Looking for a face...");
    } catch {
      toast.error("Recognition failed");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("Looking for a face...");
    } finally {
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        setStatus("Loading face models...");
        await loadFaceModels();
        if (!mounted) return;

        setStatus("Loading enrolled faces...");
        const faces = await loadFaces();
        if (!mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setReady(true);

        if (faces.enrolled.length === 0 && faces.pending.length > 0) {
          setStatus("Enroll faces from profile photos to start scanning");
        } else if (faces.enrolled.length === 0) {
          setStatus("No enrolled faces yet — add student photos first");
        } else {
          setStatus("Looking for a face...");
        }

        const detectLoop = async () => {
          if (!mounted) return;

          const now = Date.now();
          const video = videoRef.current;

          if (
            video &&
            !processingRef.current &&
            enrolledRef.current.length > 0 &&
            video.readyState >= 2 &&
            now - lastDetectAtRef.current >= 700
          ) {
            lastDetectAtRef.current = now;

            try {
              const descriptor = await getFaceDescriptorFromSource(video);

              if (descriptor && !processingRef.current) {
                const match = matchFace(descriptor, enrolledRef.current);

                if (match) {
                  await recordMatch(match.student);
                }
              }
            } catch {
              // Ignore transient detection errors between frames.
            }
          }

          rafRef.current = requestAnimationFrame(() => {
            void detectLoop();
          });
        };

        rafRef.current = requestAnimationFrame(() => {
          void detectLoop();
        });
      } catch (startError) {
        if (!mounted) return;
        toast.error(
          startError instanceof Error
            ? startError.message
            : "Could not start face scanner"
        );
        setStatus("Camera or model load failed");
      }
    }

    void start();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [loadFaces, recordMatch, stopCamera]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-1 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl border bg-black shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted px-4">
            <p className="text-center text-sm text-muted-foreground">{status}</p>
          </div>
        )}
        {ready && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <p className="flex items-center justify-center gap-2 text-center text-sm text-white">
              <ScanFace className="size-4 shrink-0" />
              {status}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Enrolled: {enrolled.length}
          {pending.length > 0 ? ` · Pending: ${pending.length}` : ""}
        </p>
        {pending.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={enrolling}
            onClick={() => void enrollPendingFaces()}
          >
            {enrolling ? "Enrolling..." : "Enroll from photos"}
          </Button>
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
        Look at the camera to record time in or time out. Students need a
        clear profile photo enrolled for recognition.
      </p>
    </div>
  );
}
