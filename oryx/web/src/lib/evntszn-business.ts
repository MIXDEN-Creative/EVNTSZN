export const HOST_PUBLIC_MARKETS = [
  "Baltimore",
  "Washington",
  "Rehoboth Beach",
  "Ocean City",
  "Bethany Beach",
] as const;

export const HOST_PUBLIC_MARKETS_WITH_STATE = [
  "Baltimore, MD",
  "Washington, DC",
  "Rehoboth Beach, DE",
  "Ocean City, MD",
  "Bethany Beach, DE",
] as const;

export const LINK_TIERS = [
  {
    key: "free",
    label: "Link Free",
    priceLabel: "$0",
    audience: "Independent Organizer Free",
    includedIn: "Available to any organizer account",
    features: [
      "Basic link-in-bio page",
      "Event linking",
      "Basic customization",
    ],
  },
  {
    key: "pro",
    label: "Link Pro",
    priceLabel: "Included",
    audience: "Independent Organizer Pro and EVNTSZN Host Program",
    includedIn: "Included in Organizer Pro, Host, Certified Host, Pro Host, and City Leader paths",
    features: [
      "Custom branded page",
      "Unlimited links",
      "Event integration",
      "NFC card compatibility",
      "Analytics",
      "Conversion tracking",
    ],
  },
] as const;

export const ORGANIZER_PLANS = [
  {
    key: "free",
    label: "Independent Organizer",
    priceLabel: "$0",
    platformFee: 0.99, // Standard ticket fee in USD
    premiumRule: "Cannot pass the premium $1.99 ticket fee to the attendee.",
    features: [
      "Event creation",
      "EVNTSZN listing",
      "Basic discovery",
      "EVNTSZN Link Free",
      "Standard analytics",
    ],
  },
  {
    key: "pro",
    label: "Independent Organizer Pro",
    priceLabel: "$29/month",
    platformFee: 0.99, // Standard ticket fee in USD
    premiumRule: "Can optionally pass the premium $1.99 ticket fee to the attendee.",
    features: [
      "Everything in Free",
      "EVNTSZN Link Pro included",
      "Advanced analytics",
      "Priority discovery boost",
      "Lower Smart Fill pricing",
      "Premium ticket fee passing control",
    ],
  },
] as const;

export const HOST_PROGRAM_LEVELS = [
  {
    label: "Host",
    platformFee: 1.49,
    highlights: [
      "Link Pro included",
      "Smart Fill access at $0",
      "Venue-based execution inside the EVNTSZN network",
    ],
    approvalsWhenCityOfficeActive: [
      "Venue approval required",
      "City Leader approval required",
      "City Office approval required",
      "HQ approval required",
    ],
    approvalsWithoutCityOffice: [
      "Venue approval required",
      "HQ approval required",
    ],
  },
  {
    label: "Certified Host",
    platformFee: 1.49,
    highlights: [
      "Requires approval",
      "Smart Fill access",
      "No Purple Bolt",
    ],
    approvalsWhenCityOfficeActive: [
      "Venue agreement required",
      "City Leader approval required",
    ],
    approvalsWithoutCityOffice: [
      "Venue agreement required",
      "HQ approval required",
    ],
  },
  {
    label: "Pro Host",
    platformFee: 1.49,
    highlights: [
      "Full system access in operating scope",
      "Smart Fill FREE",
      "Purple Bolt ranking signal",
      "Can optionally pass premium $1.99 ticket fee",
    ],
    approvalsWhenCityOfficeActive: [
      "Venue agreement required where venue-based",
      "City Leader approval required",
    ],
    approvalsWithoutCityOffice: [
      "Venue agreement required where venue-based",
      "HQ approval required",
    ],
  },
  {
    label: "City Leader",
    platformFee: 1.49,
    highlights: [
      "Approval authority in assigned scope",
      "Purple Bolt ranking signal",
      "Full system control in market scope",
      "Can optionally pass premium $1.99 ticket fee",
    ],
    approvalsWhenCityOfficeActive: [
      "Venue agreement required where venue-based",
      "City Leader acts as approval authority",
    ],
    approvalsWithoutCityOffice: [
      "Venue agreement required where venue-based",
      "HQ alignment required when needed",
    ],
  },
] as const;

export const PLATFORM_FEE_RULES = [
  "Independent Organizers pay $0.99 per standard ticket.",
  "EVNTSZN network operators pay $1.49 per standard ticket.",
  "If ticket price is over $30.00, the platform fee becomes $1.99.",
  "Passing the fee to attendees is optional on standard tickets for everyone.",
  "Independent Organizer Free cannot pass the premium $1.99 fee.",
  "Independent Organizer Pro can optionally pass the premium $1.99 fee.",
  "Pro Host, City Leader, City Office, and HQ can optionally pass the premium $1.99 fee.",
] as const;

export const VENUE_PLANS = [
  {
    key: "venue-free",
    label: "EVNTSZN Venue",
    priceLabel: "$0",
    sublabel: "Listing only",
    features: [
      "Venue listing",
      "Profile with name, location, and website",
      "Pulse score",
      "Event visibility",
    ],
    note: "Smart Fill is available as a $29.00/month add-on.",
  },
  {
    key: "venue-pro",
    label: "Venue Pro",
    priceLabel: "$39.00/month",
    sublabel: "No Reserve",
    features: [
      "Smart Fill included",
      "Nodes included",
      "NFC cards for bartenders and servers",
      "Messaging and Pulse integration",
      "Event requests and venue photos",
      "Spaces Available section",
      "Private calendar visibility",
      "Restaurant group logic",
    ],
    note: "Does not include the Reserve engine.",
  },
  {
    key: "venue-pro-reserve",
    label: "Venue Pro + Reserve",
    priceLabel: "$99.00/month + $0.30 per reservation",
    sublabel: "Venue operating suite",
    features: [
      "Everything in Venue Pro",
      "EVNTSZN Reserve",
      "Nightlife table flow and dining reservations inside the EVNTSZN ecosystem",
    ],
    note: "Best fit when the venue needs both operating tools and the reservation engine for nightlife and dining.",
  },
] as const;

export const RESERVE_PLANS = [
  {
    key: "reserve-standalone",
    label: "EVNTSZN Reserve Standalone",
    priceLabel: "$79.00/month + $0.50 per reservation",
    features: [
      "Dining and nightlife reservations",
      "Waitlist system",
      "Time slots",
      "Capacity control",
      "Booking dashboard",
    ],
    excludes: [
      "No Smart Fill",
      "No Pulse",
      "No EVNTSZN ecosystem listing layer",
    ],
  },
  {
    key: "reserve-venue-pro",
    label: "Add Reserve to Venue Pro",
    priceLabel: "$99.00/month + $0.30 per reservation",
    features: [
      "Venue Pro operations",
      "Reserve engine for tables and dining reservations",
      "Lower reservation fee than standalone",
      "Pulse, Smart Fill, Nodes, and messaging stay active",
    ],
    excludes: [],
  },
] as const;

export const NODES_PRICING = [
  "Standalone Nodes for capacity 150 or less: $49.00/month",
  "Standalone Nodes for capacity above 150: $89.00/month",
  "Venue Pro includes Nodes by default.",
] as const;

export const SMART_FILL_RULES = [
  "Standard opportunities: Hosts free, Organizer Pro $5.00, Organizer Free $15.00.",
  "Hot opportunities: Hosts free, Organizer Pro $10.00, Organizer Free $20.00.",
  "Smart Fill is managed by City Office, HQ, or Admin.",
  "Venues must be listed to access Smart Fill.",
] as const;

export const BOOSTED_MOMENTS = [
  "2 hours: $5.00",
  "6 hours: $15.00",
  "24 hours: $30.00",
  "Weekend: $75.00",
] as const;

export const FEATURED_VENUE_PLACEMENT = [
  "Starter: $49.00",
  "Standard: $99.00",
  "Premium Cities: $149.00",
] as const;

export const COMMISSION_RULES = [
  "Before a City Office exists, HQ keeps 100% of revenue.",
  "Host event after City Office activation: Host 60%, City Office 15%, HQ 25%.",
  "City Leader event after City Office activation: City Leader 65%, City Office 15%, HQ 20%.",
  "Independent Organizer keeps 100% of event revenue and pays platform fees.",
  "City Office earns 35% of platform fees if onboarded, plus 15% event share and internal overrides.",
  "If a Host is onboarded by HQ, HQ receives 40%. If that Host later becomes a City Leader, HQ receives 35%.",
] as const;

export const EPL_SCHEDULE_BLOCKS = {
  draftNights: [
    {
      label: "Draft Night 1",
      title: "Baltimore Draft Night",
      timing: "Week 0",
      body:
        "Baltimore-market players report first. Six Baltimore clubs lock their first boards, staff assignments, and captain-facing logistics in one live intake night.",
    },
    {
      label: "Draft Night 2",
      title: "Coastal Draft Night",
      timing: "Week 1",
      body:
        "One week later, the coastal intake closes the pool across Rehoboth Beach, Bethany Beach, Ocean City, and the wider Delmarva lane.",
    },
  ],
  seasonFramework: [
    "12 teams total: 6 Baltimore clubs and 6 coastal clubs.",
    "Coed adult flag football with weekly doubleheader windows.",
    "10 to 12 players per team.",
  ],
  weeklyBlocks: [
    {
      title: "Opening Week",
      body: "Inter-region statement games open the season and confirm the first public table.",
    },
    {
      title: "Weekly Game Blocks",
      body: "Saturday evening and Sunday afternoon windows keep the schedule predictable for players, supporters, and venue coordination.",
    },
    {
      title: "Rivalry Weeks",
      body: "Baltimore and coastal clubs rotate through regional rivalry slots before the playoff cut.",
    },
    {
      title: "Playoffs",
      body: "Quarterfinal positioning runs through the final regular-season block, then the bracket narrows to semifinal weekend.",
    },
    {
      title: "Championship Weekend",
      body: "The final block includes championship-week ticketing, sponsor activation, and the Prime Bowl.",
    },
  ],
} as const;
