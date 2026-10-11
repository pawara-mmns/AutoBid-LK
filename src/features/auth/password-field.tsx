"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n/get-dictionary";

export function PasswordField({ name, label, autoComplete, minLength = 1, invalid = false, hint }: {
  name: string; label: string; autoComplete: "current-password" | "new-password"; minLength?: number; invalid?: boolean; hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const copy = getDictionary().auth;
  return <div>
    <label htmlFor={name} className="mb-2 block text-ui font-semibold">{label}</label>
    <div className="relative">
      <Input id={name} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} autoCapitalize="none" autoCorrect="off" spellCheck={false} required minLength={minLength} maxLength={128}
        className="pe-16" aria-invalid={invalid} aria-describedby={hint ? `${name}-hint` : undefined} />
      <Button variant="ghost" className="absolute end-0 top-0 h-full w-12 px-0" aria-controls={name} aria-pressed={visible}
        aria-label={(visible ? copy.hidePassword : copy.showPassword).replace("{field}", label.toLowerCase())} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
    {hint && <p id={`${name}-hint`} className={`mt-2 text-ui ${invalid ? "text-danger" : "text-muted-foreground"}`}>{hint}</p>}
  </div>;
}
