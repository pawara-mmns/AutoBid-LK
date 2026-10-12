import { sellerPageData } from '@/features/seller-listings/page-data';
import { loadEvidence } from '@/features/verification/queries';
import { EvidencePortal } from '@/features/verification/evidence-portal';
import { requireUser } from '@/features/auth/guards';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params,{listing}=await sellerPageData(id),{client}=await requireUser(`/seller/vehicles/${id}/evidence`),evidence=await loadEvidence(client,id);return <EvidencePortal id={id} status={listing.status} scopes={listing.correction_scopes} initialDocuments={evidence.documents} intake={evidence.intake}/>;}
