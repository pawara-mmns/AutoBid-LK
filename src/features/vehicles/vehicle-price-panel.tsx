import { VehiclePrice } from "@/features/vehicles/vehicle-price";
import { AuctionInformation } from "@/features/vehicles/auction-information";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehiclePricePanel({ minor }: { minor: number }) {
  return <section aria-label={getDictionary().vehicles.pricePanel} className="mt-6 border-y border-border py-6">
    <VehiclePrice minor={minor} prominent />
    <AuctionInformation />
  </section>;
}
