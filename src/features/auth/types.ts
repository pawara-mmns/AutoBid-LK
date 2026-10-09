import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Database } from "@/types/database";

export type AppSupabaseClient = SupabaseClient<Database>;
export type AuthMessage = keyof Dictionary["auth"]["messages"];
export type FormState = {
  status: "idle" | "error" | "success";
  message?: AuthMessage;
  fields?: string[];
};
export type AuthResult = FormState & { destination?: "/account" | "/sign-in?message=passwordChanged" };
export type ClientFactory = () => Promise<AppSupabaseClient | null>;
