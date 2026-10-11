"use client";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import type { SellerForm, Field, Errors } from "./schema";
export type StepProps = { form: SellerForm; update: (field: Field, value: string) => void; errors: Errors };
export function FieldLabel({ field, children, error }: { field: Field; children: ReactNode; error?: string }) {
  return <div className="space-y-2"><label htmlFor={`seller-${field}`} className="block font-medium">{getSellerDictionary().fields[field]}</label>{children}{error && <p id={`error-${field}`} role="alert" className="text-ui text-danger">{error}</p>}</div>;
}
export function TextField({ field, multiline, inputMode, list, ...props }: StepProps & { field: Field; multiline?: boolean; inputMode?: "numeric" | "decimal" | "tel"; list?: string }) {
  const common = { id: `seller-${field}`, name: field, value: props.form[field], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.update(field, e.target.value), "aria-invalid": !!props.errors[field], "aria-describedby": props.errors[field] ? `error-${field}` : undefined, maxLength: 1000 };
  return <FieldLabel field={field} error={props.errors[field]}>{multiline ? <textarea {...common} rows={3} className="w-full rounded-md border border-control-border bg-surface p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" /> : <Input {...common} inputMode={inputMode} list={list} type={inputMode === "tel" ? "tel" : "text"} autoComplete={field === "phone" ? "tel" : "off"} />}</FieldLabel>;
}
export function SelectField({ field, options, ...props }: StepProps & { field: Field; options: readonly string[] | readonly (readonly [string, string])[] }) {
  const c = getSellerDictionary();
  return <FieldLabel field={field} error={props.errors[field]}><select id={`seller-${field}`} value={props.form[field]} onChange={(e) => props.update(field, e.target.value)} aria-invalid={!!props.errors[field]} aria-describedby={props.errors[field] ? `error-${field}` : undefined} className="min-h-12 w-full rounded-md border border-control-border bg-surface px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><option value="">{c.choose}</option>{options.map((option) => { const [value, label] = typeof option === "string" ? [option, c.options[option as keyof typeof c.options] ?? option] : option; return <option key={value} value={value}>{label}</option>; })}</select></FieldLabel>;
}
export function ChoiceField({ field, choices = ["yes", "no", "unsure"], ...props }: StepProps & { field: Field; choices?: readonly string[] }) {
  const c = getSellerDictionary();
  return <fieldset aria-describedby={props.errors[field] ? `error-${field}` : undefined}><legend className="mb-2 font-medium">{c.fields[field]}</legend><div className="flex flex-wrap gap-2">{choices.map((value) => <label key={value} className={`flex min-h-12 min-w-20 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 ${props.form[field] === value ? "border-primary bg-secondary" : "border-control-border bg-surface"}`}><input type="radio" name={field} value={value} checked={props.form[field] === value} onChange={() => props.update(field, value)} className="size-4 accent-primary" data-invalid={!!props.errors[field]} /><span>{c.options[value as keyof typeof c.options]}</span></label>)}</div>{props.errors[field] && <p id={`error-${field}`} role="alert" className="mt-2 text-ui text-danger">{props.errors[field]}</p>}</fieldset>;
}
