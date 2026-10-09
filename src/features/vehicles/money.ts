import { market } from "@/i18n/config";

export const maxPriceMinor = 1_000_000_000_000;

export function rupeesToMinor(value: string): number | null {
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(value)) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return minor <= BigInt(maxPriceMinor) ? Number(minor) : null;
}

export function minorToRupees(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > maxPriceMinor) throw new RangeError("Invalid money amount");
  const minor = BigInt(value);
  const remainder = minor % 100n;
  return `${minor / 100n}${remainder ? `.${String(remainder).padStart(2, "0").replace(/0$/, "")}` : ""}`;
}

export function formatLkr(value: number | bigint | string): string {
  if (typeof value === "number" && !Number.isSafeInteger(value)) throw new RangeError("Invalid money amount");
  if (typeof value === "string" && !/^\d{1,13}$/.test(value)) throw new RangeError("Invalid money amount");
  const minor = BigInt(value);
  if (minor < 0n || minor > BigInt(maxPriceMinor)) throw new RangeError("Invalid money amount");
  const whole = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(minor / 100n);
  const cents = minor % 100n;
  return `${market.currency} ${whole}${cents ? `.${String(cents).padStart(2, "0")}` : ""}`;
}
