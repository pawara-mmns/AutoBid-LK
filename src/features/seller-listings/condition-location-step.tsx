"use client";
import { districts } from "@/features/vehicles/search-schema";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import { ChoiceField, SelectField, TextField, type StepProps } from "./fields";
export function ConditionLocationStep(props: StepProps) {
  return <div className="space-y-6"><SelectField {...props} field="district" options={districts} /><TextField {...props} field="town" />
    <SelectField {...props} field="condition" options={["good", "some_repairs", "major_repairs"]} />
    {(["accident", "flood", "mechanical", "finance"] as const).map((field) => <div key={field} className="space-y-4"><ChoiceField {...props} field={field} />{(props.form[field] === "yes" || (field === "mechanical" && ["some_repairs", "major_repairs"].includes(props.form.condition))) && <TextField {...props} field={`${field}Details`} multiline />}</div>)}
    <TextField {...props} field="description" multiline /><details className="border-y border-border py-2"><summary className="min-h-12 cursor-pointer py-3 font-medium">{getSellerDictionary().optionalDetails}</summary><div className="space-y-5 pb-4 pt-3">{(["colour", "serviceHistory", "repairHistory", "previousOwners"] as const).map((field) => <TextField key={field} {...props} field={field} inputMode={field === "previousOwners" ? "numeric" : undefined} />)}</div></details>
  </div>;
}
