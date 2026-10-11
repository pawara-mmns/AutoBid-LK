import { getSellerDictionary } from "@/i18n/get-dictionary";
export default function LoadingSeller() { return <div className="site-container py-12"><p role="status">{getSellerDictionary().loading}</p></div>; }
