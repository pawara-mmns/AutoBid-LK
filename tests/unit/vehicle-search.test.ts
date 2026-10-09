import { describe, expect, it } from "vitest";
import { defaultSearch, parseVehicleSearch, vehiclesUrl, escapeLike, slugSchema } from "@/features/vehicles/search-schema";
import { formatLkr, rupeesToMinor, minorToRupees } from "@/features/vehicles/money";

describe("bounded vehicle search", () => {
  it("has safe defaults", () => { expect(parseVehicleSearch({})).toEqual({ valid: true, filters: defaultSearch }); });
  it("validates and preserves shareable filters", () => {
    const parsed = parseVehicleSearch({ q: " Toyota Aqua ", make: "Toyota", model: "Aqua", minPrice: "1000000.25", maxPrice: "2500000", minYear: "2010", maxYear: "2020", district: "Colombo", sort: "price-asc", page: "2" });
    expect(parsed.valid).toBe(true);
    expect(parsed.filters.minPrice).toBe(100000025);
    expect(vehiclesUrl(parsed.filters)).toContain("minPrice=1000000.25");
    expect(vehiclesUrl(parsed.filters, { page: 3 })).toContain("page=3");
  });
  it.each([{ page: "0" }, { page: "1001" }, { page: "1.5" }, { page: ["1", "2"] }, { sort: "random" }, { district: "unknown" }, { category: "motorcycle" }, { q: "x".repeat(81) }, { minPrice: "NaN" }, { minPrice: "-1" }, { minPrice: "1.001" }, { maxPrice: "10000000001" }, { minPrice: "200", maxPrice: "100" }, { minYear: "2020", maxYear: "2010" }, { minYear: "1899" }, { maxYear: "2099" }, { q: "x\u0000y" }])("rejects malformed or unbounded filters", (input) => { expect(parseVehicleSearch(input).valid).toBe(false); });
  it("ignores unsupported visibility/page-size parameters", () => {
    const parsed = parseVehicleSearch({ status: "draft", pageSize: "99999" });
    expect(parsed.filters).toEqual(defaultSearch);
    expect(vehiclesUrl(parsed.filters)).toBe("/vehicles");
  });
  it("escapes LIKE wildcards without raw OR filter strings", () => { expect(escapeLike("50%_\\")).toBe("50\\%\\_\\\\"); });
  it.each(["../private", "INVALID", "a", "a/b", "a".repeat(121)])("rejects invalid public slugs", (slug) => { expect(slugSchema.safeParse(slug).success).toBe(false); });
});

describe("exact LKR minor units", () => {
  it("formats readable rupees and cents without floating point", () => {
    expect(formatLkr(450000000)).toBe("LKR 4,500,000");
    expect(formatLkr("123456789")).toBe("LKR 1,234,567.89");
    expect(formatLkr(1n)).toBe("LKR 0.01");
    expect(rupeesToMinor("0.29")).toBe(29);
    expect(minorToRupees(123456789)).toBe("1234567.89");
  });
  it.each([-1, 0.1, NaN, Infinity, 1000000000001])("refuses unsafe amounts", (amount) => { expect(() => formatLkr(amount)).toThrow(); });
});
