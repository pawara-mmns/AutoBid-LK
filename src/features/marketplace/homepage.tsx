import { HomepageHero } from "@/features/marketplace/homepage-hero";
import { VehicleCategoryList } from "@/features/marketplace/vehicle-category-list";
import { RecentVehicles } from "@/features/marketplace/recent-vehicles";
import { HowItWorks } from "@/features/marketplace/how-it-works";

export function MarketplaceHome() {
  return <>
    <HomepageHero />
    <VehicleCategoryList />
    <RecentVehicles />
    <HowItWorks />
  </>;
}
