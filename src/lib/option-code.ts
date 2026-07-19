export function toOptionCode(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function humanizeOptionCode(code: string): string {
  return code
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export type CatalogOption = {
  code: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
};
