/**
 * Culinary data for Taste & Indulge and Ship Dining.
 *
 * Source status matters: everything here is either a factual dish guide
 * ("guide": what a dish is, no price, no venue claim) or a sample menu at a
 * fictional demo venue ("sample": illustrative prices, not a real restaurant,
 * not bookable). Real bookable food experiences live in the excursion catalog
 * (category "food") and go through LastBoard + PayPal like any other tour.
 */

export type SourceStatus = "guide" | "sample";
export type Region = "Trinidad & Tobago" | "Cozumel, Mexico" | "Roatán, Honduras" | "Grand Cayman" | "Jamaica";

export interface Dish {
  id: string;
  name: string;
  region: Region;
  kind: "street" | "main" | "breakfast" | "drink" | "sweet";
  description: string;
  /** palette for the original vector illustration */
  tone: [string, string];
}

/** Factual guide to dishes travelers meet on this route and in Trinidad & Tobago. No prices, no venues. */
export const LOCAL_FLAVOURS: Dish[] = [
  { id: "doubles", name: "Doubles", region: "Trinidad & Tobago", kind: "street", tone: ["#e9a35c", "#7a4a1d"], description: "Two pieces of soft fried flatbread (bara) filled with curried chickpeas (channa), finished with chutneys and pepper sauce. A much-loved breakfast street food." },
  { id: "roti", name: "Roti", region: "Trinidad & Tobago", kind: "main", tone: ["#f0c27a", "#8a5a2a"], description: "Flatbread, such as dhalpuri filled with ground split peas or flaky paratha (\"buss-up-shut\"), served with curried chicken, goat, potatoes or vegetables." },
  { id: "bake-shark", name: "Bake and shark", region: "Trinidad & Tobago", kind: "street", tone: ["#d9b98a", "#56707a"], description: "Fried bread (bake) filled with seasoned fried shark, then loaded with toppings and sauces such as shado beni (culantro) sauce. Famously eaten at Maracas Bay." },
  { id: "pelau", name: "Pelau", region: "Trinidad & Tobago", kind: "main", tone: ["#b9783a", "#4b3017"], description: "A one-pot dish of rice and pigeon peas cooked with meat, often chicken, that is first caramelised in browned sugar, then simmered with coconut milk." },
  { id: "cochinita", name: "Cochinita pibil", region: "Cozumel, Mexico", kind: "main", tone: ["#d4552f", "#5e1f12"], description: "Yucatán-style pork marinated in achiote and sour orange, wrapped in banana leaves and slow-roasted, traditionally in an underground pit." },
  { id: "marquesita", name: "Marquesita", region: "Cozumel, Mexico", kind: "sweet", tone: ["#f4c777", "#9a6420"], description: "A Yucatán street dessert: a crisp rolled crêpe, often filled with grated Edam cheese and a sweet spread such as cajeta or chocolate." },
  { id: "baleada", name: "Baleada", region: "Roatán, Honduras", kind: "breakfast", tone: ["#f3e3c3", "#8b6a3e"], description: "A thick flour tortilla folded over refried beans, cream (mantequilla) and crumbled cheese, with egg, avocado or meat as optional extras." },
  { id: "cayman-fish", name: "Cayman-style fish", region: "Grand Cayman", kind: "main", tone: ["#e46d4b", "#2d6d73"], description: "Fresh fish cooked down with tomatoes, onions, sweet peppers and a little Scotch bonnet, usually served with rice and beans or fried plantain." },
  { id: "jerk", name: "Jerk chicken", region: "Jamaica", kind: "main", tone: ["#7a2e1b", "#2b1a10"], description: "Chicken marinated with Scotch bonnet peppers, allspice (pimento) and thyme, then slow-cooked over pimento wood for its smoky heat." },
  { id: "ackee", name: "Ackee and saltfish", region: "Jamaica", kind: "breakfast", tone: ["#f2d24b", "#6a7a3a"], description: "Jamaica's national dish: ackee fruit sautéed with salted cod, onions, tomatoes and peppers, often served with fried dumplings." },
  { id: "sorrel", name: "Sorrel", region: "Trinidad & Tobago", kind: "drink", tone: ["#9b1b3a", "#3e0a18"], description: "A deep-red drink brewed from hibiscus (roselle) sepals with ginger and spice, especially popular around Christmas across the Caribbean." },
  { id: "mauby", name: "Mauby", region: "Trinidad & Tobago", kind: "drink", tone: ["#6b3b1c", "#2a160a"], description: "A bittersweet drink made from the bark of the mauby tree, sweetened and spiced. An acquired taste locals love." },
];

export interface MenuItem {
  name: string;
  description: string;
  priceCents: number;
  /** links to the factual guide when the item is a local specialty */
  dishId?: string;
  tags?: ("local" | "vegetarian-option" | "non-alcoholic" | "contains-alcohol")[];
}
export interface MenuSection {
  id: string;
  title: string;
  note?: string;
  items: MenuItem[];
}
export interface Venue {
  id: string;
  name: string;
  where: string;
  status: SourceStatus;
  atmosphere: string;
  hours: string;
  currency: "USD";
  sections: MenuSection[];
}

/** Fictional demo venue with a complete sample menu. Not a real restaurant; prices illustrative. */
export const DEMO_VENUE: Venue = {
  id: "tidewalk-kitchen",
  name: "Tidewalk Kitchen",
  where: "Cozumel waterfront (fictional demo venue)",
  status: "sample",
  atmosphere: "Open-air terrace over the water, ceiling fans, island playlists and a long communal table for cruise groups.",
  hours: "Sample hours: 7:30 AM – 9:00 PM",
  currency: "USD",
  sections: [
    {
      id: "breakfast",
      title: "Breakfast",
      items: [
        { name: "Baleada sencilla", description: "Flour tortilla, refried beans, cream, crumbled cheese. Add egg or avocado.", priceCents: 700, dishId: "baleada", tags: ["local", "vegetarian-option"] },
        { name: "Ackee & saltfish plate", description: "With fried dumplings and steamed callaloo.", priceCents: 1400, dishId: "ackee", tags: ["local"] },
        { name: "Tropical fruit bowl", description: "Papaya, pineapple, mango and passion fruit with lime.", priceCents: 800, tags: ["vegetarian-option"] },
      ],
    },
    {
      id: "street",
      title: "Island street food",
      note: "Small plates, perfect before an afternoon excursion.",
      items: [
        { name: "Doubles (two)", description: "Bara and curried channa with tamarind and mango chutney; pepper on request.", priceCents: 600, dishId: "doubles", tags: ["local", "vegetarian-option"] },
        { name: "Bake and shark", description: "Fried bake, seasoned shark, shado beni sauce and the full topping bar.", priceCents: 1300, dishId: "bake-shark", tags: ["local"] },
        { name: "Conch fritters", description: "Golden fritters with a lime-pepper dip.", priceCents: 1100 },
      ],
    },
    {
      id: "mains",
      title: "Lunch & dinner",
      items: [
        { name: "Cochinita pibil tacos", description: "Achiote-marinated pork, pickled red onion, habanero salsa on the side.", priceCents: 1500, dishId: "cochinita", tags: ["local"] },
        { name: "Jerk chicken", description: "Quarter chicken, rice and peas, festival bread.", priceCents: 1700, dishId: "jerk", tags: ["local"] },
        { name: "Cayman-style catch", description: "Fish of the day cooked down with tomato, sweet pepper and Scotch bonnet.", priceCents: 2200, dishId: "cayman-fish", tags: ["local"] },
        { name: "Chicken pelau", description: "Browned-sugar chicken, pigeon peas and coconut rice.", priceCents: 1600, dishId: "pelau", tags: ["local"] },
        { name: "Roti with curried pumpkin & potato", description: "Dhalpuri roti, curried pumpkin, potato and channa.", priceCents: 1400, dishId: "roti", tags: ["local", "vegetarian-option"] },
      ],
    },
    {
      id: "drinks",
      title: "Drinks & cocktails",
      note: "Alcoholic drinks are served only to guests of legal drinking age.",
      items: [
        { name: "Fresh coconut water", description: "Served in the coconut.", priceCents: 500, tags: ["non-alcoholic"] },
        { name: "Sorrel", description: "Hibiscus, ginger and clove over ice.", priceCents: 450, dishId: "sorrel", tags: ["local", "non-alcoholic"] },
        { name: "Mauby", description: "Bittersweet bark brew, lightly spiced.", priceCents: 400, dishId: "mauby", tags: ["local", "non-alcoholic"] },
        { name: "Passion fruit & lime cooler", description: "Mocktail with mint and soda.", priceCents: 600, tags: ["non-alcoholic"] },
        { name: "Island rum punch", description: "Dark rum, lime, fruit juices and nutmeg.", priceCents: 1000, tags: ["contains-alcohol"] },
        { name: "Cocoa tea", description: "Warm spiced cocoa with milk.", priceCents: 450, tags: ["non-alcoholic"] },
      ],
    },
    {
      id: "desserts",
      title: "Desserts & sweets",
      items: [
        { name: "Marquesita", description: "Crisp rolled crêpe with Edam and cajeta.", priceCents: 600, dishId: "marquesita", tags: ["local"] },
        { name: "Caribbean black cake", description: "Dark, rich fruit cake soaked in rum and spice. Contains alcohol.", priceCents: 750, tags: ["contains-alcohol"] },
        { name: "Coconut ice cream", description: "Two scoops with toasted coconut and lime zest.", priceCents: 650 },
        { name: "Tamarind balls & coconut drops", description: "A tasting plate of classic island sweets.", priceCents: 550, tags: ["local"] },
        { name: "Chocolate & cocoa nib tart", description: "Dark chocolate ganache, cocoa nibs, sea salt.", priceCents: 800 },
      ],
    },
  ],
};

/** Onboard dining aboard the fictional demo vessel Aurora Tide (sample menus). */
export const SHIP_VENUES: Venue[] = [
  {
    id: "compass-rose",
    name: "Compass Rose Dining Room",
    where: "Aurora Tide · Deck 5 aft (demo vessel)",
    status: "sample",
    atmosphere: "Main dining room with floor-to-ceiling windows over the wake.",
    hours: "Sample: breakfast 7–10, dinner 5:30–9:30",
    currency: "USD",
    sections: [
      { id: "starters", title: "Starters", items: [{ name: "Callaloo soup", description: "Leafy greens, okra and coconut.", priceCents: 0, tags: ["vegetarian-option"] }, { name: "Shrimp & mango ceviche", description: "Lime, chili, cilantro.", priceCents: 0 }] },
      { id: "mains", title: "Main courses", items: [{ name: "Herb-crusted mahi-mahi", description: "Plantain mash, sauce vierge.", priceCents: 0 }, { name: "Slow-braised short rib", description: "Rum-pepper glaze, roasted roots.", priceCents: 0 }, { name: "Coconut vegetable curry", description: "Jasmine rice, roti.", priceCents: 0, tags: ["vegetarian-option"] }] },
      { id: "desserts", title: "Desserts", items: [{ name: "Key lime pie", description: "Graham crust, whipped cream.", priceCents: 0 }, { name: "Warm chocolate cake", description: "Coconut sorbet.", priceCents: 0 }] },
    ],
  },
  {
    id: "sea-glass-grill",
    name: "Sea Glass Grill",
    where: "Aurora Tide · Deck 7 aft pool terrace (demo vessel)",
    status: "sample",
    atmosphere: "Casual poolside grill and juice bar.",
    hours: "Sample: 11:00 AM – 6:00 PM",
    currency: "USD",
    sections: [
      { id: "grill", title: "From the grill", items: [{ name: "Jerk chicken sandwich", description: "Pineapple slaw.", priceCents: 0 }, { name: "Grilled veggie wrap", description: "Hummus, peppers, greens.", priceCents: 0, tags: ["vegetarian-option"] }] },
      { id: "drinks", title: "Juice bar", items: [{ name: "Mango-passion smoothie", description: "Blended to order.", priceCents: 450, tags: ["non-alcoholic"] }, { name: "Fresh coconut", description: "Chilled.", priceCents: 500, tags: ["non-alcoholic"] }] },
    ],
  },
  {
    id: "nightwatch",
    name: "Nightwatch Patisserie",
    where: "Aurora Tide · Deck 5 promenade (demo vessel)",
    status: "sample",
    atmosphere: "Coffee, cakes and late-night sweets on the promenade.",
    hours: "Sample: 7:00 AM – midnight",
    currency: "USD",
    sections: [
      { id: "sweets", title: "Cakes & pastries", items: [{ name: "Coconut gizzada", description: "Pinched-crust coconut tart.", priceCents: 350 }, { name: "Rum-raisin cheesecake", description: "Contains alcohol.", priceCents: 550, tags: ["contains-alcohol"] }] },
      { id: "coffee", title: "Coffee & tea", items: [{ name: "Jamaica Blue Mountain pour-over", description: "Single origin.", priceCents: 600, tags: ["non-alcoholic"] }, { name: "Cocoa tea", description: "Spiced, with milk.", priceCents: 400, tags: ["non-alcoholic"] }] },
    ],
  },
];
