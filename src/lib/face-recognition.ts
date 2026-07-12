"use client";

import * as faceapi from "@vladmandic/face-api";

export const FACE_MATCH_THRESHOLD = 0.55;
export const FACE_DESCRIPTOR_LENGTH = 128;

const MODEL_URL = "/models";

let modelsLoaded: Promise<void> | null = null;

export type EnrolledFace = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  descriptor: number[];
};

export async function loadFaceModels(): Promise<void> {
  if (!modelsLoaded) {
    modelsLoaded = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }

  await modelsLoaded;
}

function detectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });
}

export async function getFaceDescriptorFromSource(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(source, detectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}

export async function getFaceDescriptorFromFile(
  file: File
): Promise<Float32Array | null> {
  const url = URL.createObjectURL(file);

  try {
    const image = await faceapi.fetchImage(url);
    return getFaceDescriptorFromSource(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function getFaceDescriptorFromImageUrl(
  imageUrl: string
): Promise<Float32Array | null> {
  const image = await faceapi.fetchImage(imageUrl);
  return getFaceDescriptorFromSource(image);
}

export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

export function isValidDescriptor(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === FACE_DESCRIPTOR_LENGTH &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

export function matchFace(
  query: Float32Array,
  enrolled: EnrolledFace[]
): { student: EnrolledFace; distance: number } | null {
  let best: { student: EnrolledFace; distance: number } | null = null;

  for (const student of enrolled) {
    if (!isValidDescriptor(student.descriptor)) continue;

    const distance = faceapi.euclideanDistance(
      query,
      new Float32Array(student.descriptor)
    );

    if (distance > FACE_MATCH_THRESHOLD) continue;

    if (!best || distance < best.distance) {
      best = { student, distance };
    }
  }

  return best;
}

export async function enrollFaceDescriptor(
  studentId: string,
  descriptor: number[]
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/attendance/faces/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, descriptor }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { ok: false, error: data?.error ?? "Failed to enroll face" };
  }

  return { ok: true };
}

export async function enrollFaceFromFile(
  studentId: string,
  file: File
): Promise<{ ok: boolean; error?: string }> {
  const descriptor = await getFaceDescriptorFromFile(file);

  if (!descriptor) {
    return {
      ok: false,
      error: "No face detected in photo. Use a clear front-facing photo.",
    };
  }

  return enrollFaceDescriptor(studentId, descriptorToArray(descriptor));
}
