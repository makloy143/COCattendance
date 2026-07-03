const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StudentPhotoData = {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
};

export async function readStudentPhoto(file: File): Promise<StudentPhotoData> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, or WebP images are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 2MB or smaller");
  }

  const source = new Uint8Array(await file.arrayBuffer());
  const data = new Uint8Array(source.byteLength);
  data.set(source);

  return { data, mimeType: file.type };
}

export function studentPhotoUrl(studentId: string, version?: number | Date): string {
  const stamp =
    version instanceof Date ? version.getTime() : version ?? Date.now();
  return `/api/students/${studentId}/photo?v=${stamp}`;
}
