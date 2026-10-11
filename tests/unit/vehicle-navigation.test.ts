import { describe, expect, it } from "vitest";
import { vehiclesReturnUrl } from "@/features/vehicles/navigation";

describe("public vehicle return navigation", () => {
  it("keeps validated catalog context and discards unrelated parameters", () => {
    expect(vehiclesReturnUrl("/vehicles?q=Toyota&district=Colombo&maxPrice=2500000.25&sort=price-asc&page=2&status=draft&limit=999999"))
      .toBe("/vehicles?q=Toyota&district=Colombo&maxPrice=2500000.25&sort=price-asc&page=2");
  });
  it.each([undefined, null, ["/vehicles"], "https://external.test/vehicles", "//external.test/vehicles", "/vehicles/../account", "/vehicles/fixture-car-1", "/vehicles#private", "/vehicles?sort=unsupported", "/vehicles?minPrice=-1", "/vehicles?page=1001", "/vehicles?q=Toyota&q=Suzuki", "/vehicles?q=" + "a".repeat(2100)])("fails safely for unsupported destinations and ambiguous filters", (input) => {
    expect(vehiclesReturnUrl(input)).toBe("/vehicles");
  });
});
