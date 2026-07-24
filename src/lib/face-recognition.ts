"use client";

import * as faceapi from "@vladmandic/face-api";

/** Max Euclidean distance to accept a match (lower = stricter). */
export const FACE_MATCH_THRESHOLD = 0.45;

/** Best match must beat 2nd-best by at least this distance. */
export const FACE_MATCH_MARGIN = 0.08;

/** Minimum face box size (px) — small faces produce unreliable descriptors. */
export const MIN_FACE_SIZE = 100;

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

export type FaceMatch = {
  student: EnrolledFace;
  distance: number;
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
    // Higher input size improves detection of angled / distant faces.
    inputSize: 416,
    scoreThreshold: 0.55,
  });
}

function faceBoxSize(detection: faceapi.FaceDetection): number {
  const { width, height } = detection.box;
  return Math.min(width, height);
}

function pickBestDetection<
  T extends { detection: faceapi.FaceDetection; descriptor: Float32Array },
>(detections: T[]): T | null {
  let best: T | null = null;
  let bestScore = -1;

  for (const item of detections) {
    const size = faceBoxSize(item.detection);
    if (size < MIN_FACE_SIZE) continue;

    // Prefer larger, higher-confidence faces.
    const score = item.detection.score * Math.sqrt(size);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return best;
}

export async function getFaceDescriptorFromSource(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  await loadFaceModels();

  const detections = await faceapi
    .detectAllFaces(source, detectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  const best = pickBestDetection(detections);
  return best?.descriptor ?? null;
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
): FaceMatch | null {
  let best: FaceMatch | null = null;
  let secondBest: number | null = null;

  for (const student of enrolled) {
    if (!isValidDescriptor(student.descriptor)) continue;

    const distance = faceapi.euclideanDistance(
      query,
      new Float32Array(student.descriptor)
    );

    if (!best || distance < best.distance) {
      secondBest = best?.distance ?? secondBest;
      best = { student, distance };
    } else if (secondBest === null || distance < secondBest) {
      secondBest = distance;
    }
  }

  if (!best || best.distance > FACE_MATCH_THRESHOLD) {
    return null;
  }

  // Reject ambiguous matches (two students similarly close).
  if (
    secondBest !== null &&
    secondBest - best.distance < FACE_MATCH_MARGIN
  ) {
    return null;
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
