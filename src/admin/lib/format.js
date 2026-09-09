const PACIFIC = "America/Los_Angeles";

export function formatUsd(cents, { centsIfNeeded = false } = {}) {
  const value = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: centsIfNeeded && value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: centsIfNeeded ? 2 : 0,
  }).format(value);
}

export function formatDollars(dollars, options = {}) {
  return formatUsd(Math.round(Number(dollars || 0) * 100), options);
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function statusLabel(status) {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  if (status === "refunded" || status === "canceled") return "Canceled";
  return status;
}

export function formatPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length === 10) {
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return raw;
}
