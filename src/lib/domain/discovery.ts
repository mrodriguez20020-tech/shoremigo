/**
 * Immersive discovery content (WP-05 reef, WP-06 canopy). Scenes are ORIGINAL ILLUSTRATIONS, not footage of a
 * real reef, rainforest or tour; species are typical of the wider Caribbean, never promised sightings. Every
 * booking route points at an existing catalog excursion, so prices, times and availability stay server-side.
 */
import { EXCURSIONS } from "./catalog";

export interface DiscoveryPoi {
  id: string;
  name: string;
  /** hotspot position in the scene, percent of width / height */
  x: number;
  y: number;
  tags: string[];
  fact: string;
  detail: string;
  excursionIds: string[];
  migo: string;
}
export interface DiscoveryConfig {
  id: "reef" | "canopy";
  kicker: string;
  title: string;
  intro: string;
  entryLabel: string;
  filters: { id: string; label: string }[];
  pois: DiscoveryPoi[];
  note?: string;
  disclosure: string;
}

export const REEF: DiscoveryConfig = {
  id: "reef",
  kicker: "Underwater discovery",
  title: "Slip beneath the surface.",
  intro: "Scroll down through the waterline into a Caribbean reef. Tap what you see to learn about it and find the shore days that take you there.",
  entryLabel: "Descending through the waterline",
  filters: [
    { id: "snorkel", label: "Snorkel" },
    { id: "dive", label: "Dive" },
  ],
  pois: [
    { id: "elkhorn", name: "Elkhorn coral garden", x: 18, y: 66, tags: ["snorkel", "dive"], fact: "Shallow, 1–5 m", detail: "Branching corals grow toward the light in calm shallows, which is why reef snorkels stay at the surface and never stand on coral.", excursionIds: ["coz-palancar-snorkel", "roa-west-bay"], migo: "Coral cathedrals are best seen from the surface. Check Palancar Reef against the current ship timings before you reserve." },
    { id: "turtle", name: "Green sea turtle", x: 63, y: 38, tags: ["snorkel", "dive"], fact: "Often seen grazing seagrass", detail: "Turtles graze seagrass beds near the reef. Keep a respectful distance and let them surface to breathe.", excursionIds: ["coz-afternoon-reef"], migo: "The Afternoon Reef & Sandbar includes a reef and sandbar stop. Let’s check its current LastBoard timing and availability." },
    { id: "rays", name: "Southern stingrays", x: 44, y: 82, tags: ["snorkel"], fact: "Sandy flats, waist-deep", detail: "Rays glide over shallow sandbars. Shuffle your feet in the sand and follow your guide's instructions.", excursionIds: ["gcm-stingray"], migo: "Stingray City is waist-deep in Grand Cayman, an easy choice if anyone in your group is new to snorkelling." },
    { id: "wall", name: "Reef wall drop-off", x: 84, y: 60, tags: ["snorkel", "dive"], fact: "From 3 m to the deep blue", detail: "Where the reef crest meets the wall, the sea floor falls away. Snorkellers see the edge from above; divers explore the face.", excursionIds: ["roa-west-bay"], migo: "West Bay in Roatán floats you right over the wall. It's on the Mesoamerican reef." },
    { id: "parrotfish", name: "Parrotfish and reef fish", x: 46, y: 50, tags: ["snorkel", "dive"], fact: "Busy mid-reef", detail: "Parrotfish scrape algae from coral and help make the reef's white sand. Wrasse, tangs and sergeant majors gather nearby.", excursionIds: ["coz-palancar-snorkel", "coz-afternoon-reef"], migo: "Morning light on Palancar makes the reef fish glow. Want me to check it against your ship's timing?" },
  ],
  note: "Diving: no scuba excursion is in this demo inventory yet, so dive points link to the snorkel trips that visit the same reef.",
  disclosure: "Original illustrated scene, not footage of a real reef or tour. Species are typical of the Caribbean; sightings are never guaranteed.",
};

export const CANOPY: DiscoveryConfig = {
  id: "canopy",
  kicker: "Rainforest and canopy",
  title: "Rise into the canopy.",
  intro: "Scroll up from the forest floor, through the leaves, to the zipline above the trees. Tap what you find to plan the shore day that goes there.",
  entryLabel: "Rising through the rainforest",
  filters: [
    { id: "zipline", label: "Zipline" },
    { id: "wildlife", label: "Wildlife" },
    { id: "waterfall", label: "Waterfalls" },
  ],
  pois: [
    { id: "zipline", name: "Canopy zipline", x: 58, y: 18, tags: ["zipline"], fact: "Above the treetops", detail: "Lines run between platforms above the canopy, with guides clipping you in at every stage.", excursionIds: ["roa-canopy"], migo: "The Roatán canopy tour pairs the zipline with a sloth sanctuary. Want me to check it against your ship's timing?" },
    { id: "sloth", name: "Sloths", x: 45, y: 38, tags: ["wildlife"], fact: "Slow and high in the branches", detail: "Sloths spend most of their day resting in the canopy. Sanctuaries let you see rescued animals up close and calmly.", excursionIds: ["roa-canopy"], migo: "Sloths are the stars of the Roatán canopy morning." },
    { id: "falls", name: "Cascading falls", x: 82, y: 58, tags: ["waterfall"], fact: "Terraced limestone", detail: "Rivers tumble over limestone terraces down to the sea. Climbs are guided and hand-in-hand; water shoes help.", excursionIds: ["och-dunns", "och-blue-hole"], migo: "Dunn's River Falls in Ocho Rios is a guided climb straight up from the sea." },
    { id: "pools", name: "Jade swimming holes", x: 66, y: 78, tags: ["waterfall"], fact: "Hidden in the hills", detail: "Spring-fed pools collect below the falls, with rope swings and quieter water away from the coast.", excursionIds: ["och-blue-hole"], migo: "Blue Hole Secret Falls has rope swings and jade pools. Bring a change of clothes." },
    { id: "lagoon", name: "Lagoon and coastal wildlife", x: 14, y: 74, tags: ["wildlife"], fact: "Mangroves and lagoons", detail: "Coastal parks protect lagoons, mangroves and nesting beaches. You might see crocodiles from viewing platforms.", excursionIds: ["coz-punta-sur"], migo: "Punta Sur in Cozumel mixes lagoon wildlife with a lighthouse and an empty beach." },
  ],
  disclosure: "Original illustrated scene, not footage of a real rainforest or tour. Wildlife is typical of the region; sightings are never guaranteed.",
};

export const DISCOVERIES = { reef: REEF, canopy: CANOPY };
export const excursionsFor = (poi: DiscoveryPoi) => poi.excursionIds.map((id) => EXCURSIONS.find((e) => e.id === id)).filter((e): e is (typeof EXCURSIONS)[number] => !!e);
