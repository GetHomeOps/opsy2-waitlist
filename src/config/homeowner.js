function photoSet(base, width, height, position) {
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    jpgSrcSet: `${base}-800.jpg 800w, ${base}.jpg ${width}w`,
    webpSrcSet: `${base}-800.webp 800w, ${base}.webp ${width}w`,
    width,
    height,
    position,
  };
}

export const homeownerAssets = {
  heroLeft: photoSet("/homeowner/homeowner-hero-left", 1600, 1087, "center 28%"),
  heroAerial: photoSet("/homeowner/homeowner-hero-aerial", 1600, 1067, "center 42%"),
  phoneTilted: {
    src: "/homeowner/homeowner-phone-hero-tilted.png?v=4",
    webp: "/homeowner/homeowner-phone-hero-tilted.webp",
    width: 900,
    height: 1128,
  },
  pricing: photoSet("/homeowner/homeowner-pricing-background", 1600, 1067, "center 35%"),
  features: photoSet("/homeowner/homeowner-features-background", 1600, 1068, "center 48%"),
};

export const FOUNDING_HOUSEHOLD_CAP = 250;
export const HOUSEHOLD_FOUNDING_RATE = 99;
export const HOUSEHOLD_STANDARD_RATE = 199;
export const HOUSEHOLD_DEPOSIT = 1;

export const buyingTimelines = [
  { value: "in_contract", label: "In contract" },
  { value: "within_a_year", label: "Within a year" },
  { value: "already_home", label: "Already home" },
];

export const homeownerFeatures = [
  {
    title: "It remembers",
    body: "Your inspection report, warranties, receipts, and who fixed what — organized, searchable, and answered with sources when you ask.",
  },
  {
    title: "It reminds",
    body: "What your home needs and when — the furnace before winter, the gutters before the rain — before small things become expensive ones.",
  },
  {
    title: "It learns",
    body: "The best companions evolve with you. Opsy understands you and your home's unique needs and builds a dynamic relationship over time.",
  },
  {
    title: "It connects",
    body: "Your trusted professionals, one text away. Opsy finds the right pro and can even draft the service request for you.",
  },
];

export const smsConsentCopy = {
  beforeLinks:
    "I agree to receive text messages from Opsy (HomeOps Inc.) about my home, my waitlist status, and home-maintenance reminders at the number provided. Message frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel. Consent is not a condition of purchase. See our ",
  privacy: "Privacy Policy",
  and: " and ",
  terms: "Terms",
  afterLinks: ".",
};
