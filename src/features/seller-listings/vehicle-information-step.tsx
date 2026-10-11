"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { fuelValues, transmissionValues } from "@/features/vehicles/search-schema";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import { ChoiceField, SelectField, TextField, type StepProps } from "./fields";
// Suggestions, not an exhaustive vehicle registry. Other always allows a real model.
const models: Record<string, readonly string[]> = { Toyota: ["Aqua", "Axio", "Corolla", "Prius", "Vitz", "Yaris"], Honda: ["Civic", "Fit", "Grace", "Vezel"], Suzuki: ["Alto", "Celerio", "Swift", "Wagon R"], Nissan: ["March", "Leaf", "Sunny", "Tiida"], Mitsubishi: ["Lancer", "Mirage"], Mazda: ["Axela", "Demio"], Hyundai: ["i10", "i20", "Elantra"], Kia: ["Picanto", "Rio"], BMW: ["3 Series", "5 Series"], "Mercedes-Benz": ["C-Class", "E-Class"], Perodua: ["Axia", "Bezza"], Datsun: ["Redi-GO", "GO"], Tata: ["Indica", "Tiago"], Micro: [], Peugeot: [], Volkswagen: ["Polo", "Golf"] };
export function VehicleInformationStep(props: StepProps) {
  const c = getSellerDictionary(); const [otherMake, setOtherMake] = useState(false), [otherModel, setOtherModel] = useState(false);
  return <div className="space-y-6"><SelectField {...props} field="category" options={["car"]} /><p className="text-ui text-muted-foreground">{c.carOnly}</p>
    <TextField {...props} form={{ ...props.form, make: otherMake ? c.options.other : props.form.make }} field="make" list="seller-brands" update={(field, value) => { setOtherMake(value === c.options.other); setOtherModel(false); props.update(field, value === c.options.other ? "" : value); props.update("model", ""); }} /><datalist id="seller-brands">{Object.keys(models).sort().map((make) => <option key={make} value={make} />)}<option value={c.options.other} /></datalist>
    {otherMake && <label className="block space-y-2"><span className="font-medium">{c.otherMake}</span><Input value={props.form.make} onChange={(e) => props.update("make", e.target.value)} maxLength={60} autoFocus /></label>}
    <TextField {...props} form={{ ...props.form, model: otherModel ? c.options.other : props.form.model }} field="model" list="seller-models" update={(field, value) => { setOtherModel(value === c.options.other); props.update(field, value === c.options.other ? "" : value); }} /><datalist id="seller-models">{(models[props.form.make] ?? []).map((model) => <option key={model} value={model} />)}<option value={c.options.other} /></datalist>
    {otherModel && <label className="block space-y-2"><span className="font-medium">{c.otherModel}</span><Input value={props.form.model} onChange={(e) => props.update("model", e.target.value)} maxLength={80} autoFocus /></label>}
    <TextField {...props} field="year" inputMode="numeric" /><ChoiceField {...props} field="registered" choices={["yes", "no"]} />
    {props.form.registered === "yes" && <TextField {...props} field="registrationYear" inputMode="numeric" />}
    <SelectField {...props} field="fuel" options={fuelValues} /><SelectField {...props} field="transmission" options={transmissionValues} /><TextField {...props} field="mileage" inputMode="numeric" />
  </div>;
}
