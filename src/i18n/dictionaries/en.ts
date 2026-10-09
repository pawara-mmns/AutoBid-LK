export const en = {
  metadata: {
    title: "AutoBid LK | A simpler road to your next car",
    description: "AutoBid LK is preparing a simpler way to buy and sell used cars in Sri Lanka. The marketplace is not open yet.",
  },
  common: {
    brand: "AutoBid LK",
    brandLabel: "AutoBid LK home",
    skipToContent: "Skip to content",
    navigation: "Main navigation",
    about: "Our approach",
    status: "Launch update",
    market: "Made for Sri Lanka",
    footer: "A simpler road to buying and selling cars.",
    languages: "Planned in English, සිංහල and தமிழ்.",
  },
  home: {
    eyebrow: "A new journey starts here",
    title: "Your next car.\nA simpler way.",
    description: "We’re building an easier way to buy and sell used cars in Sri Lanka. Clear information, guided steps and a marketplace that feels easy to use.",
    action: "See what’s ahead",
    availability: "Getting ready for launch",
    availabilityDescription: "AutoBid LK is being prepared. Vehicle browsing, selling and bidding will be available in a future release.",
    previewLabel: "The road ahead",
    previewTitle: "Less hassle.\nMore clarity.",
    previewDescription: "From your first look to your next set of keys, we’re designing every step around you.",
    previewNote: "Used cars. Sri Lanka first.",
    approachEyebrow: "Built around everyday people",
    approachTitle: "Buying or selling should feel straightforward.",
    approachDescription: "Here’s the experience we’re working towards.",
    principles: [
      { title: "Look around freely", description: "Explore cars without needing an account. Find the information you need at your own pace." },
      { title: "One step at a time", description: "Simple instructions will guide you through selling your car, from adding details to reviewing your listing." },
      { title: "Clear before you commit", description: "Understand the next step and confirm important decisions before moving ahead." },
    ],
    statusTitle: "Good things take a solid foundation.",
    statusDescription: "We’re starting with the essentials and building carefully. There are no vehicles or auctions available yet.",
    backToTop: "Back to top",
  },
  notFound: {
    title: "This page isn’t here",
    description: "You can return to the homepage to see what’s ahead.",
    action: "Go to homepage",
  },
  error: {
    title: "Something went wrong",
    description: "Please try again in a moment.",
    action: "Try again",
  },
} as const;

// Widen text values so future dictionaries must match keys, not English wording.
type DictionaryShape<T> = T extends string ? string
  : T extends readonly (infer Item)[] ? readonly DictionaryShape<Item>[]
  : T extends object ? { [Key in keyof T]: DictionaryShape<T[Key]> }
  : T;

export type Dictionary = DictionaryShape<typeof en>;
