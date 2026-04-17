// src/lib/crew.ts
/**
 * EVNTSZN Crew Marketplace Data Structure
 */

export type CrewCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  roles: string[]; // e.g., ['DJ', 'Producer']
};

export const CREW_CATEGORIES: CrewCategory[] = [
  {
    id: "talent-music-dj",
    name: "DJs",
    description: "Sets for any atmosphere.",
    icon: "🎵",
    roles: ["DJ", "Turntablist", "Live DJ"],
  },
  {
    id: "talent-music-producer",
    name: "Music Producers",
    description: "Crafting unique sounds.",
    icon: "🎧",
    roles: ["Producer", "Beatmaker"],
  },
  {
    id: "creative-photography",
    name: "Photographers",
    description: "Capture every moment.",
    icon: "📷",
    roles: ["Event Photographer", "Portrait Photographer", "Product Photographer"],
  },
  {
    id: "creative-videography",
    name: "Videographers",
    description: "Film your event.",
    icon: "🎥",
    roles: ["Event Videographer", "Promo Video", "Documentary"],
  },
  {
    id: "hospitality-bartending",
    name: "Bartenders",
    description: "Professional service.",
    icon: "🍸",
    roles: ["Event Bartender", "Mixologist"],
  },
  {
    id: "talent-performance-dancer",
    name: "Dancers",
    description: "Stage & atmosphere.",
    icon: "💃",
    roles: ["Dancer", "Choreographer"],
  },
  {
    id: "talent-performance-comedian",
    name: "Comedians",
    description: "For laughter.",
    icon: "😂",
    roles: ["Stand-up Comedian", "MC", "Curator"],
  },
  {
    id: "catering-food-vendor",
    name: "Food Vendors",
    description: "Cuisines for crowds.",
    icon: "🍔",
    roles: ["Caterer", "Food Truck", "Specialty Food"],
  },
  {
    id: "creative-content-creator",
    name: "Content Creators",
    description: "Brand stories.",
    icon: "✍️",
    roles: ["Social Media", "Brand Content", "Influencer"],
  },
  {
    id: "event-hosting",
    name: "Curators",
    description: "Event MCs & guides.",
    icon: "🌟",
    roles: ["MC", "Event Curator", "Moderator"],
  },
];

export function getCrewCategoryByName(name: string) {
  return CREW_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
}
