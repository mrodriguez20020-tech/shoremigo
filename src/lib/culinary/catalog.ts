import { DEMO_VENUE, LOCAL_FLAVOURS, type Dish, type MenuItem } from "@/lib/domain/dining";
import credits from "../../../public/culinary/credits.json";
import { EDITORIAL_PHOTOS } from "./editorial-photos";

export interface CulinaryItem extends Dish {
  priceCents?: number;
  tags?: MenuItem["tags"];
  sample?: boolean;
  venueName?: string;
}
export const PHOTO_CREDITS = credits;
export const ALL_PHOTO_CREDITS = [...PHOTO_CREDITS, ...EDITORIAL_PHOTOS];
export function photoFor(id: string) {
  return ALL_PHOTO_CREDITS.find((p) => p.id === id) ?? (id === "sample-desserts-marquesita" ? EDITORIAL_PHOTOS.find((p) => p.id === "marquesita") : undefined);
}
export function menuItemForGallery(item: MenuItem, section: string, venueName = DEMO_VENUE.name): CulinaryItem {
  const guide = LOCAL_FLAVOURS.find((d) => d.id === item.dishId);
  return {
    id: `sample-${section}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: item.name, description: item.description,
    region: guide?.region ?? "Cozumel, Mexico",
    kind: guide?.kind ?? (section === "drinks" || section === "coffee" ? "drink" : section === "desserts" || section === "sweets" ? "sweet" : "main"),
    tone: guide?.tone ?? ["#d7b47f", "#313c36"],
    priceCents: item.priceCents, tags: item.tags, sample: true, venueName,
  };
}
export const GUIDE_ITEMS: CulinaryItem[] = LOCAL_FLAVOURS;
export const DRINK_ITEMS: CulinaryItem[] = [
  ...LOCAL_FLAVOURS.filter((d) => d.kind === "drink"),
  ...DEMO_VENUE.sections.find((s) => s.id === "drinks")!.items.filter((d) => !d.dishId).map((d) => menuItemForGallery(d, "drinks")),
];
export const DESSERT_ITEMS = DEMO_VENUE.sections.find((s) => s.id === "desserts")!.items.map((d) => menuItemForGallery(d, "desserts"));
