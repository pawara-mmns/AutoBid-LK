import { getAdminDictionary } from '@/i18n/get-dictionary';
import type { VerificationDocument } from './queries';
export function EvidenceList({id,documents,admin=false}:{id:string;documents:VerificationDocument[];admin?:boolean}) {
 const c=getAdminDictionary(),base=admin?`/admin/listings/${id}`:`/seller/vehicles/${id}`;
 return documents.length?<ul className="mt-5 divide-y divide-border border-y border-border">{documents.map(document=><li key={document.id} className="py-4"><p className="font-medium">{c.documentKinds[document.kind as keyof typeof c.documentKinds]}</p>{document.uploaded_at?<a href={`${base}/documents/${document.id}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center text-primary underline">{document.format==='pdf'?c.documentDownload:c.documentPreview}</a>:<p className="mt-3 text-ui">{c.documentMissing}</p>}{document.format==='pdf'&&<p className="text-ui text-muted-foreground">{c.pdfHelp}</p>}</li>)}</ul>:<p className="mt-5">{c.noDocuments}</p>;
}
