// Minimal server-side input validation helpers (no external schema
// library dependency needed for this prototype's surface area).

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function requireString(value: unknown, field: string, opts: { maxLength?: number } = {}): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (opts.maxLength && trimmed.length > opts.maxLength) {
    throw new ValidationError(`${field} must be ${opts.maxLength} characters or fewer.`);
  }
  return trimmed;
}

export function requirePositiveNumber(value: unknown, field: string): number {
  const num = typeof value === "string" ? Number(value) : value;
  if (typeof num !== "number" || Number.isNaN(num) || num <= 0) {
    throw new ValidationError(`${field} must be a positive number.`);
  }
  return num;
}

export function requireNumber(value: unknown, field: string): number {
  const num = typeof value === "string" ? Number(value) : value;
  if (typeof num !== "number" || Number.isNaN(num)) {
    throw new ValidationError(`${field} must be a number.`);
  }
  return num;
}

export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}
