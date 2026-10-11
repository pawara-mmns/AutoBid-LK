"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import type { SellerListing } from "./queries";
import { initialForm, validateStep, validateSubmission, type Field, type Errors } from "./schema";
import { submitListing } from "./actions";
import { VehicleInformationStep } from "./vehicle-information-step";
import { ConditionLocationStep } from "./condition-location-step";
import { PricingStep } from "./pricing-step";
import { ReviewSubmitStep } from "./review-submit-step";
import { WizardProgress } from "./wizard-progress";
import { useDraftSave } from "./use-draft-save";
import { VehiclePhotosStep } from "./vehicle-photos-step";
import type { SellerPhoto } from "./photos";
export function SellerListingWizard({ listing, initialPhotos, accountEmail }: { listing: SellerListing; initialPhotos: SellerPhoto[]; accountEmail: string }) {
  const c = getSellerDictionary(); const editable = listing.status === "draft";
  const [form, setForm] = useState(() => initialForm(listing)), [step, setStep] = useState(editable ? listing.last_step : 5), [errors, setErrors] = useState<Errors>({}), [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const changedStep = useRef(false);
  const [photos, setPhotos] = useState(initialPhotos), [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false), [submissionError, setSubmissionError] = useState(""); const submitting = useRef(false);
  const save = useDraftSave(listing.id, listing.revision, form, step, editable && !submitted);
  useEffect(() => { if (changedStep.current) heading.current?.focus(); changedStep.current = true; }, [step, submitted]);
  const update = (field: Field, value: string) => { save.markDirty(); setForm((old) => ({ ...old, [field]: value, ...(field === "registered" && value === "no" ? { registrationYear: "" } : {}) })); setErrors((old) => ({ ...old, [field]: undefined })); };
  const go = async (next: number, validate = false) => {
    if (busy || (validate && step === 3 && uploading)) return;
    if (validate) { const found = validateStep(form, step, photos.filter((p) => p.uploaded_at).map((p) => p.slot)); setErrors(found); if (Object.keys(found).length) { requestAnimationFrame(() => document.querySelector<HTMLElement>('main [aria-invalid="true"],main [data-invalid="true"],main [role="alert"]')?.focus()); return; } }
    setBusy(true); const ok = await save.flush(); setBusy(false); if (ok) { setErrors({}); save.markDirty(); setStep(next); }
  };
  const props = { form, update, errors };
  const submit = async () => {
    if (submitting.current || uploading) return; const found = validateSubmission(form, photos.filter((p) => p.uploaded_at).map((p) => p.slot));
    if (Object.keys(found).length) { setErrors(found); setSubmissionError(c.submissionFailed); const firstStep = [1,2,3,4,5].find((s) => Object.keys(validateStep(form,s,photos.filter((p) => p.uploaded_at).map((p) => p.slot))).length); if (firstStep) setStep(firstStep); return; }
    submitting.current = true; setBusy(true); setSubmissionError("");
    try { if (!await save.flush()) return; const result = await submitListing({ id: listing.id, revision: save.version.current }); if (result.ok) setSubmitted(true); else { setErrors(result.errors ?? {}); setSubmissionError(result.conflict ? c.conflict : c.submissionFailed); } } catch { setSubmissionError(c.submissionFailed); } finally { submitting.current = false; setBusy(false); }
  };
  if (submitted) return <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8"><h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold outline-none">{c.statuses.pending_review.label}</h1><p className="mt-5">{c.confirmation}</p><p className="mt-4 text-ui text-muted-foreground">{c.phoneHelp}</p><Button asChild className="mt-8"><Link href="/seller/vehicles">{c.dashboardLink}</Link></Button></div>;
  return <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/seller/vehicles" className="flex min-h-12 items-center text-primary underline underline-offset-4">{c.dashboard}</Link>{editable && <p role="status" aria-live="polite" className={`text-ui ${save.state === "failed" || save.state === "conflict" ? "text-danger" : "text-muted-foreground"}`}>{save.state === "saved" ? c.saved : save.state === "saving" ? c.saving : c.failed}</p>}</div>
    {editable ? <WizardProgress step={step} /> : <p className="mb-6 border-s-2 border-primary ps-4">{c.noEdit}</p>}
    <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">{c.headings[step - 1]}</h1><p className="mb-8 mt-3 text-muted-foreground">{editable ? c.help[step - 1] : c.confirmation}</p>
    {(save.state === "failed" || save.state === "conflict") && <div role="alert" className="mb-6 border-s-2 border-danger ps-4"><p>{save.state === "conflict" ? c.conflict : c.failed}</p>{save.state === "conflict" ? <Button variant="outline" className="mt-3" onClick={() => location.reload()}>{c.reload}</Button> : <Button variant="outline" className="mt-3" onClick={() => { void save.flush(); }}>{c.retry}</Button>}</div>}
    {submissionError && <p role="alert" className="mb-6 text-danger">{submissionError}</p>}
    {step === 1 && <VehicleInformationStep {...props} />}{step === 2 && <ConditionLocationStep {...props} />}
    {editable && <div hidden={step !== 3}><VehiclePhotosStep id={listing.id} photos={photos} changed={setPhotos} uploadState={setUploading} />{errors.photos && <p role="alert" className="mt-4 text-danger">{errors.photos}</p>}</div>}
    {step === 4 && <PricingStep {...props} />}{step === 5 && <><ReviewSubmitStep {...props} readOnly={!editable} edit={(next) => { void go(next); }} /><dl className="mt-5"><dt className="text-ui text-muted-foreground">{c.accountEmail}</dt><dd className="break-all">{accountEmail}</dd></dl><section className="mt-8 border-t border-border pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">{c.steps[2]}</h2>{editable && <Button variant="ghost" onClick={() => { void go(3); }}>{c.edit}</Button>}</div><VehiclePhotosStep id={listing.id} photos={photos} changed={setPhotos} readOnly /></section></>}
    {editable && <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">{step > 1 && <Button variant="outline" disabled={busy} onClick={() => { void go(step - 1); }}>{c.back}</Button>}{step < 5 ? <Button disabled={busy || (step === 3 && uploading)} className="ms-auto" onClick={() => { void go(step + 1, true); }}>{c.continue}</Button> : <Button disabled={busy || uploading} className="ms-auto" onClick={() => { void submit(); }}>{busy ? c.submitting : c.submit}</Button>}</div>}
  </div>;
}
