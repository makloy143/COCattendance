"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PhotoUploadProps = {
  existingPhotoUrl?: string | null;
  onFileChange: (file: File | null) => void;
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

async function capturePhotoFromVideo(video: HTMLVideoElement): Promise<File> {
  const canvas = document.createElement("canvas");
  const maxSize = 1024;
  let width = video.videoWidth;
  let height = video.videoHeight;

  if (!width || !height) {
    throw new Error("Camera is not ready yet");
  }

  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not capture photo");
  }

  context.drawImage(video, 0, 0, width, height);

  let quality = 0.92;
  let blob: Blob | null = null;

  while (quality >= 0.5) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (blob && blob.size <= MAX_PHOTO_BYTES) {
      break;
    }

    quality -= 0.1;
  }

  if (!blob) {
    throw new Error("Photo is too large");
  }

  return new File([blob], `profile-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function PhotoUpload({ existingPhotoUrl, onFileChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(existingPhotoUrl ?? null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      onFileChange(file);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      if (file) {
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setPreview(url);
        return;
      }

      setPreview(existingPhotoUrl ?? null);
    },
    [existingPhotoUrl, onFileChange]
  );

  const startCamera = useCallback(async () => {
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      toast.error("Could not access camera. Check browser permissions.");
      setCameraOpen(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [cameraOpen, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  async function handleCapturePhoto() {
    if (!videoRef.current || !cameraReady) return;

    setCapturing(true);

    try {
      const file = await capturePhotoFromVideo(videoRef.current);
      handleFile(file);
      setCameraOpen(false);
      toast.success("Photo captured");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to capture photo"
      );
    } finally {
      setCapturing(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "relative flex size-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/40",
            preview && "border-solid"
          )}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Camera className="size-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            Upload photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCameraOpen(true)}
          >
            <Camera className="size-4" />
            Take photo
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFile(null)}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            handleFile(file);
            event.target.value = "";
          }}
        />
        <p className="text-center text-xs text-muted-foreground">
          Upload a file or use your camera. JPG, PNG, or WebP up to 2MB.
        </p>
      </div>

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Take profile photo</DialogTitle>
            <DialogDescription>
              Position the student in the frame, then capture the photo.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-xl border bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[4/3] w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCapturePhoto}
              disabled={!cameraReady || capturing}
            >
              {capturing ? "Saving..." : "Capture photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
