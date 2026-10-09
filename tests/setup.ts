import { vi } from "vitest";

// Next.js enforces this boundary in its build; unit tests run in Node outside RSC.
vi.mock("server-only", () => ({}));
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
