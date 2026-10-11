"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { getSellerDictionary } from "@/i18n/get-dictionary";
export function CreateDraftButton() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? getSellerDictionary().saving : getSellerDictionary().start}</Button>; }
