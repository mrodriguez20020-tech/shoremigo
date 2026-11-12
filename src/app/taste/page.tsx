import type { Metadata } from "next";
import { EXCURSIONS, getPort } from "@/lib/domain/catalog";
import { DEMO_VENUE } from "@/lib/domain/dining";
import { GUIDE_ITEMS, DRINK_ITEMS, DESSERT_ITEMS, PHOTO_CREDITS } from "@/lib/culinary/catalog";
import { fmtDuration, fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { MenuViewer } from "@/components/dining/MenuViewer";
import { CulinaryCollection, CulinaryTrigger } from "@/components/dining/CulinaryCollection";
import { CulinaryMedia } from "@/components/dining/CulinaryMedia";
import { CulinaryGallery } from "@/components/dining/CulinaryGallery";
import { AskMigoButton } from "@/components/dining/AskMigoButton";
import { ExcursionPhoto, ExcursionPhotoCredit } from "@/components/excursion/ExcursionPhoto";
import { TideLink } from "@/components/transition/TideTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ArrowIcon } from "@/components/dining/ArrowIcon";
import "./taste.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Taste & Indulge · ShoreMigo", description: "A considered taste of the Caribbean: local dish guides, sample menus and food excursions checked against your port time." };
const SECTIONS = [["flavours", "Local Flavours"], ["restaurants", "Restaurants"], ["tours", "Food Tours"], ["drinks", "Drinks & Cocktails"], ["desserts", "Desserts & Sweets"]] as const;

export default async function TastePage() {
  const snap = await availabilitySnapshot();
  const tours = EXCURSIONS.filter((e) => e.category === "food");
  const doubles = GUIDE_ITEMS.find((d) => d.id === "doubles")!;
  return <>
    <SceneRoute scene="sunset" />
    <div className="taste-page">
      <header className="culinary-hero">
        <div data-migo-avoid className="culinary-hero-copy">
          <p className="culinary-kicker">ShoreMigo / Taste &amp; Indulge</p>
          <h1>A little island.<br /><em>A lot of flavour.</em></h1>
          <p>Follow your curiosity, from the first warm bara to a slow, sweet finish. Discover the dishes, linger over a menu, and leave room for a little adventure.</p>
          <div className="culinary-hero-actions" data-migo-avoid>
            <a href="#flavours" className="culinary-primary">Explore local flavours <span aria-hidden>↓</span></a>
            <AskMigoButton prompt="Use the dining guide to help me plan a food day in Cozumel. Which food experiences fit my ship schedule? Keep sample menus separate from bookable tours." className="culinary-text-link">Plan with Migo <ArrowIcon /></AskMigoButton>
          </div>
          <p className="culinary-hero-note">A dish guide, fictional sample menus and genuine demo booking controls. No restaurant partnerships are implied.</p>
        </div>
        <CulinaryCollection items={[doubles, ...GUIDE_ITEMS.filter((d) => d.id === "jerk" || d.id === "cochinita")]}>
          <figure className="culinary-hero-feature">
            <CulinaryTrigger item={doubles} className="culinary-hero-image"><CulinaryMedia item={doubles} priority /><span className="culinary-feature-open">Meet doubles <ArrowIcon /></span></CulinaryTrigger>
            <figcaption data-migo-avoid><span>01 / Trinidad &amp; Tobago</span><span>Photo: Grueslayer @Wikipedia · CC BY-SA 4.0 · <a href="#photo-credits">Credits</a></span></figcaption>
          </figure>
        </CulinaryCollection>
      </header>
      <nav className="culinary-section-nav" aria-label="Taste & Indulge sections" data-migo-avoid>{SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
      <section id="flavours" className="culinary-section culinary-light">
        <div className="culinary-section-heading"><div><p className="culinary-kicker">01 / Local Flavours</p><h2>Every island has<br /><em>its own language.</em></h2></div><p>Start with what’s on the plate. A guide to the dishes of our route and Trinidad &amp; Tobago; no venue, price or availability is implied.</p></div>
        <CulinaryGallery items={GUIDE_ITEMS.filter((d) => d.kind !== "drink")} filterable />
      </section>
      <section id="restaurants" className="culinary-section culinary-restaurant">
        <div className="culinary-restaurant-story"><p className="culinary-kicker">02 / Restaurants</p><h2>A table.<br />A conversation.<br /><em>Take your time.</em></h2><p>Browse Tidewalk Kitchen, a <strong>fictional demo venue</strong>. Breakfast, street food and long lunches, with a sample menu you can explore at your own pace.</p><p className="culinary-disclosure">Illustrative USD prices. No restaurant reservation integration. Verified partners will appear only when they exist.</p><AskMigoButton prompt="Explain the Tidewalk Kitchen sample menu using the dining guide. It is a fictional venue, not a restaurant I can reserve. Help me compare the local dishes." className="culinary-text-link">Talk menus with Migo <ArrowIcon /></AskMigoButton></div>
        <MenuViewer venue={DEMO_VENUE} />
      </section>
      <section id="tours" className="culinary-section culinary-light">
        <div className="culinary-section-heading"><div><p className="culinary-kicker">03 / Food Tours</p><h2>Meet the island<br /><em>through its food.</em></h2></div><p>Fictional tour inventory, working reservations. Prices and available seats come from the server; LastBoard checks your port window before PayPal sandbox checkout.</p></div>
        <div className="culinary-tours">{tours.map((e) => {
          const s = snap.find((x) => x.excursionId === e.id)!; const port = getPort(e.portId)!;
          return <article key={e.id} className="culinary-tour-card">
            <div className="culinary-tour-art"><ExcursionPhoto excursionId={e.id} art={e.art} className="h-full min-h-[180px] w-full" /></div>
            <div className="culinary-tour-copy"><p className="culinary-kicker">{port.name} · Tidewalk Tours (demo)</p><h3>{e.title}</h3><p>{e.tagline}</p><ExcursionPhotoCredit excursionId={e.id} /><dl><div><dt>Departure</dt><dd>{fmtMin(toMin(e.start))} · {fmtDuration(e.durationMin)}</dd></div><div><dt>Availability</dt><dd>{s.onSale ? `${s.seatsLeft} of ${s.capacity} seats open` : "Not on sale"}</dd></div><div><dt>LastBoard</dt><dd>{s.feasibility.status} · {s.feasibility.reasons[0]}</dd></div></dl><div className="culinary-tour-bottom" data-migo-avoid><p>{fmtUsd(e.priceCents)} <small>/ guest</small></p><TideLink href={`/excursions/${e.id}`} className="culinary-primary">View timing &amp; reserve →</TideLink></div></div>
          </article>;
        })}<aside className="culinary-pairing"><span aria-hidden>✧</span><h3>Leave a little<br /><em>room for the sea.</em></h3><p>Pair a tasting with a gentler afternoon. Explore existing experiences; availability and timing are checked again when you reserve.</p><TideLink href="/excursions?mood=relax" className="culinary-text-link">Explore slower adventures →</TideLink></aside></div>
      </section>
      <section id="drinks" className="culinary-section culinary-drinks">
        <div className="culinary-section-heading"><div><p className="culinary-kicker">04 / Drinks &amp; Cocktails</p><h2>A sip of<br /><em>somewhere lovely.</em></h2></div><p>From bittersweet mauby to a bright lime cooler. Guide descriptions and sample prices stay distinct. Alcoholic drinks are labeled for guests of legal drinking age.</p></div>
        <CulinaryGallery items={DRINK_ITEMS} />
      </section>
      <section id="desserts" className="culinary-section culinary-light">
        <div className="culinary-section-heading"><div><p className="culinary-kicker">05 / Desserts &amp; Sweets</p><h2>The best kind<br /><em>of last word.</em></h2></div><p>Something crisp, something coconut, something chocolate. A fictional sample dessert menu, with original illustrations and illustrative USD prices.</p></div>
        <CulinaryGallery items={DESSERT_ITEMS} />
      </section>
      <section id="photo-credits" className="culinary-credits"><h2>Photography &amp; food notes</h2><p>These photographs illustrate dishes. They do not depict a tour, a partner restaurant or a sample-menu serving. Other subjects use original illustrations; ingredients and allergens must be confirmed with staff.</p><ul>{PHOTO_CREDITS.map((p) => <li key={p.id}><a href={p.source} target="_blank" rel="noreferrer">{p.title.replace("File:", "")} — {p.author}</a> · <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a>. Resized and converted to WebP. These image derivatives retain their source license.</li>)}</ul><a href="/culinary/credits.json">Source, license and image hashes</a></section>
    </div>
    <SiteFooter />
  </>;
}
