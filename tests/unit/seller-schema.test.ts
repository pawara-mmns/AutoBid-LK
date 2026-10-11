import { describe, it, expect } from "vitest";
import { formSchema, validateStep, savePayload, priceMinor, normalizePhone } from "@/features/seller-listings/schema";
describe("seller step validation and exact prices", () => {
  it("saves incomplete forms without requiring future fields", () => { expect(savePayload(formSchema.parse({ make: "Toyota" })).details.make).toBe("Toyota"); });
  it("validates only the selected step", () => { const f = formSchema.parse({ make: "Toyota", model: "Aqua", year: "2015", registered: "no", fuel: "hybrid", transmission: "automatic", mileage: "100000" }); expect(validateStep(f, 1)).toEqual({}); expect(validateStep(f, 2)).toHaveProperty("district"); });
  it("requires conditional registration and defect detail", () => { expect(validateStep(formSchema.parse({ registered: "yes", year: "2015", registrationYear: "2014" }), 1)).toHaveProperty("registrationYear"); expect(validateStep(formSchema.parse({ accident: "yes" }), 2)).toHaveProperty("accidentDetails"); expect(validateStep(formSchema.parse({ condition: "major_repairs" }), 2)).toHaveProperty("mechanicalDetails"); });
  it("keeps accident and flood as separate answers", () => { const f = formSchema.parse({ accident: "no", flood: "yes", floodDetails: "Water reached the carpet" }); expect(validateStep(f, 2)).not.toHaveProperty("accidentDetails"); expect(validateStep(f, 2)).not.toHaveProperty("floodDetails"); });
  it("requires four actual guided views", () => { expect(validateStep(formSchema.parse({}), 3, ["front", "back", "interior", "extra"])).toHaveProperty("photos"); });
  it("parses LKR into exact integer cents", () => { expect(priceMinor("1,250,000.25")).toBe(125000025); expect(priceMinor("1.001")).toBeNull(); expect(priceMinor("1e8")).toBeNull(); });
  it("enforces minimum and buy-now relationships", () => { expect(validateStep(formSchema.parse({ expectedPrice: "100", minimumPrice: "101", buyNowPrice: "99" }), 4)).toMatchObject({ minimumPrice: expect.any(String), buyNowPrice: expect.any(String) }); });
  it("normalizes local phone syntax without claiming verification", () => { expect(normalizePhone("077 123 4567")).toBe("+94771234567"); expect(normalizePhone("+94771234567")).toBe("+94771234567"); expect(normalizePhone("+44771234567")).toBeNull(); });
  it("rejects client role/status mass assignment", () => { expect(formSchema.safeParse({ role: "admin", status: "approved" }).success).toBe(false); });
});
