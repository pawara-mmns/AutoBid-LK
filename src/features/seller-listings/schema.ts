import { z } from "zod";
import { districts, fuelValues, transmissionValues, maxVehicleYear } from "@/features/vehicles/search-schema";
import { rupeesToMinor, minorToRupees } from "@/features/vehicles/money";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import type { SellerListing } from "./queries";
const text = z.string().max(1000);
export const detailsSchema = z.object({
  category: z.literal("car").default("car"), make: text.default(""), model: text.default(""), year: text.default(""), registered: text.default(""), registrationYear: text.default(""), fuel: text.default(""), transmission: text.default(""), mileage: text.default(""),
  district: text.default(""), town: text.default(""), condition: text.default(""), accident: text.default(""), accidentDetails: text.default(""), flood: text.default(""), floodDetails: text.default(""), mechanical: text.default(""), mechanicalDetails: text.default(""), finance: text.default(""), financeDetails: text.default(""), description: text.default(""), colour: text.default(""), serviceHistory: text.default(""), repairHistory: text.default(""), previousOwners: text.default(""), duration: text.default("3"), phone: text.default(""), contactMethod: text.default("call"), registeredOwner: text.default(""), terms: text.default(""), accuracy: text.default(""),
}).strict();
export const formSchema = detailsSchema.extend({ expectedPrice: z.string().max(20).default(""), minimumPrice: z.string().max(20).default(""), buyNowPrice: z.string().max(20).default("") }).strict();
export type SellerForm = z.infer<typeof formSchema>;
export type Field = keyof SellerForm;
export type Errors = Partial<Record<Field | "photos", string>>;
export function priceMinor(value: string) { return value === "" ? null : rupeesToMinor(value.replaceAll(",", "")); }
export function initialForm(listing: SellerListing): SellerForm {
  return formSchema.parse({ ...detailsSchema.parse(listing.details), expectedPrice: listing.expected_price_minor === null ? "" : minorToRupees(listing.expected_price_minor), minimumPrice: listing.minimum_price_minor === null ? "" : minorToRupees(listing.minimum_price_minor), buyNowPrice: listing.buy_now_price_minor === null ? "" : minorToRupees(listing.buy_now_price_minor) });
}
export function savePayload(form: SellerForm) {
  const { expectedPrice, minimumPrice, buyNowPrice, ...details } = formSchema.parse(form);
  const values = [expectedPrice, minimumPrice, buyNowPrice].map(priceMinor);
  if ([expectedPrice, minimumPrice, buyNowPrice].some((p, i) => p !== "" && (values[i] === null || values[i] === 0))) throw new Error("invalid_price");
  return { details: { ...details, phone: normalizePhone(details.phone) ?? details.phone }, expected_price_minor: values[0]!, minimum_price_minor: values[1]!, buy_now_price_minor: values[2]! };
}
export function normalizePhone(value: string) {
  const phone = value.replace(/[\s()-]/g, "");
  if (/^0[1-9]\d{8}$/.test(phone)) return `+94${phone.slice(1)}`;
  return /^\+94[1-9]\d{8}$/.test(phone) ? phone : null;
}
export function validateStep(form: SellerForm, step: number, slots: string[] = []): Errors {
  const c = getSellerDictionary(); const errors: Errors = {};
  const required = (field: Field) => { if (!form[field].trim()) errors[field] = c.required; };
  const choice = (field: Field, choices: readonly string[]) => { if (!choices.includes(form[field])) errors[field] = c.required; };
  const number = (field: Field, min: number, max: number, message = c.invalid as string) => { if (!/^\d+$/.test(form[field]) || Number(form[field]) < min || Number(form[field]) > max) errors[field] = message; };
  if (step === 1) {
    required("make"); required("model"); if (form.make.length > 60) errors.make = c.invalid; if (form.model.length > 80) errors.model = c.invalid;
    number("year", 1900, maxVehicleYear, c.yearError); choice("registered", ["yes", "no"]);
    if (form.registered === "yes") number("registrationYear", Number(form.year) || 1900, maxVehicleYear, c.yearError);
    choice("fuel", fuelValues); choice("transmission", transmissionValues); number("mileage", 0, 3000000, c.mileageError);
  }
  if (step === 2) {
    choice("district", districts); required("town"); if (form.town.length > 80) errors.town = c.invalid;
    choice("condition", ["good", "some_repairs", "major_repairs"]);
    for (const field of ["accident", "flood", "mechanical", "finance"] as const) { choice(field, ["yes", "no", "unsure"]); if (form[field] === "yes") required(`${field}Details`); }
    if (form.condition !== "good") required("mechanicalDetails");
    if (form.previousOwners) number("previousOwners", 0, 50);
  }
  if (step === 3 && !["front", "back", "interior", "dashboard"].every((slot) => slots.includes(slot))) errors.photos = c.photosRequired;
  if (step === 4) {
    const expected = priceMinor(form.expectedPrice), minimum = priceMinor(form.minimumPrice), buy = priceMinor(form.buyNowPrice);
    if (!expected) errors.expectedPrice = c.priceError; if (!minimum) errors.minimumPrice = c.priceError;
    if (expected && minimum && minimum > expected) errors.minimumPrice = c.minimumError;
    if (form.buyNowPrice && !buy) errors.buyNowPrice = c.priceError; else if (buy && expected && buy < expected) errors.buyNowPrice = c.buyNowError;
    choice("duration", ["1", "3", "7"]);
  }
  if (step === 5) { if (!normalizePhone(form.phone)) errors.phone = c.phoneError; choice("contactMethod", ["call", "whatsapp"]); choice("registeredOwner", ["yes", "no"]); choice("terms", ["yes"]); choice("accuracy", ["yes"]); }
  return errors;
}
export function validateSubmission(form: SellerForm, slots: string[]) { return Object.assign({}, ...[1, 2, 3, 4, 5].map((step) => validateStep(form, step, slots))) as Errors; }
