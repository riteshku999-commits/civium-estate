# Civium Estate

Website for **Civium Estate**, a real estate broking firm in Kolkata. Live at <https://civiumestate.com>.

It is a plain static site: no framework, no build step, no package manager. Whatever is in this repo is what gets served.

## How it is hosted

- **GitHub Pages**, served from the `main` branch root. Pushing to `main` publishes the site (usually within a minute).
- `CNAME` holds the custom domain (`civiumestate.com`). Don't delete it or the domain disconnects.
- `.nojekyll` tells GitHub Pages to serve files as-is without running Jekyll. Keep it.

## Repository map

| Path | What it is |
|---|---|
| `index.html` | The whole site: a single page with all sections, forms, SEO tags and footer |
| `css/style.css` | All styling (one file, organised by section comments). Unused rules were pruned in Nov 2026 |
| `js/script.js` | All behaviour (~1,300 lines, one file, organised by numbered/boxed section comments) |
| `data/properties.json` | Property listings shown in the "Explore Properties" grid. **This is the file you edit to add or change listings** |
| `data/contact.json` | Phone, email, address, hours and social links shown in the Contact section |
| `admin/` | **Listings Manager**: phone-friendly admin page at `/admin/` for adding/editing/removing properties (see `admin/README.md`) |
| `worker/worker.js` | Optional Cloudflare Worker for the admin page's AI suggestions (setup in `admin/README.md`) |
| `images/properties/` | Photos uploaded through the admin page (created on first upload) |
| `data/legal.json` | Terms of Service and Privacy Policy text. **Not currently used by the site** (see "Known issues") |
| `images/logo.png`, `images/logo-icon.png`, `images/apple-touch-icon.png`, `images/og-image.jpg` | Header logo, favicon, iPhone home-screen icon, social-share preview image |
| `robots.txt`, `sitemap.xml` | Search engine files |

Libraries are loaded from CDNs in `index.html`: AOS (scroll animations), EmailJS (form emails) and Google Fonts (Playfair Display, Inter).

## Page sections (in order)

`index.html` section ids, which are also the nav anchors: `#home` (hero) → `#services` → `#properties` → why-choose carousel → `#about` → `#credibility` (animated counters) → testimonials → banking and builder partners (tabbed) → `#sell` (sell-your-property form) → `#contact`, then the footer with the RERA strip.

## How the page works

1. **Properties are not in the HTML.** On load, `script.js` ("DATA BOOTSTRAP") fetches `data/properties.json` and `data/contact.json`.
2. Properties with `"active": false` are dropped. The rest are rendered as cards in `#epGrid`, 6 at a time ("Load More").
3. **Filters are generated from the data.** Budget brackets are computed from the actual prices. Location and type dropdowns are built from the values in use. Display names come from `LOCATION_LABELS` and `TYPE_LABELS` in `script.js`. If you use a new `location` or `type` value, add a label there or the raw key will show.
4. Clicking a card opens a **detail drawer**. Its attribute pills come from `ATTR_CONFIG` in `script.js` (known keys, in a fixed order with icons), followed by **every other attribute in the data**, shown automatically with a prettified label and a guessed icon. Hovering a card runs a photo slideshow.
5. The contact details panel (`#contactInfoPanel`) is injected from `contact.json`. The footer contact block is hard-coded in `index.html`.

## The three forms (all send email through EmailJS)

There is no backend. All three forms call `emailjs.send(...)` from the browser. The credentials live at the top of the "Contact form + EmailJS" section of `script.js`:

| Form | Where | EmailJS template |
|---|---|---|
| Property enquiry (modal opened from the drawer) | `#enquiryModal` | `template_7k362il` |
| Contact Us | `#contactForm` | `template_ffznhgn` |
| Sell your property (3-step wizard) | `#sellForm` | `template_ffznhgn` (same as Contact; subject is prefixed `[SELL]`) |

Service ID is `service_tgcfhw2`. The public key sits in `script.js`, which is normal for EmailJS (it is designed to be public). To change where enquiries go, or the email wording, edit the templates in the EmailJS dashboard, not this repo.

## Common tasks

**Add / edit / hide a property.** Easiest: use the admin page at `/admin/` (see `admin/README.md`). By hand: edit `data/properties.json` directly. Copy an existing entry (`p-003` is the most complete example) and give it a new unique `id`.
- `active: false` hides it. `soldOut: true` shows it but disables Enquire.
- `price` is a number in **lakhs** (325 = ₹3.25 Cr) used for filtering and sorting. `priceLabel` is the text shown.
- `location` and `type` must match keys in `LOCATION_LABELS` / `TYPE_LABELS`.
- `category` is `residential` or `commercial`. `isHotDeal: true` puts it in the Hot Deals tab.
- `media` is a list of `{type: "image" | "video", src}`. Images are currently hosted on i.ibb.co (ImgBB), not in this repo.
- `unitTypes` (optional) renders the "Unit Configurations" block in the drawer.
- `attributes.mapLink` is a plain address string used for a Google Maps search link.

**Change phone, email, address, hours or social links.** Edit `data/contact.json`. Then also check the hard-coded copies listed under "Known issues".

**Change a section's wording or layout.** Edit `index.html` and `css/style.css`. Search the CSS for the section's class prefix (`about-`, `ep-` for explore properties, `enq-` for the enquiry modal, `sell-` for the sell form, `why-`, `partner-`, `footer-rera-`).

## Note on the old Excel workflow

Earlier versions used `generate_json.py` to build `properties.json` from an Excel sheet. Both were removed in Nov 2026 (the Excel file was already gone and the script had drifted from the live JSON). `properties.json` is now edited directly. The script is still in git history (commit `7044ca5`) if ever needed.

## SEO

What is in place (Nov 2026):
- `index.html` head: keyword-focused `<title>` (≤ 65 chars) and meta description (≤ 155 chars), canonical URL, Open Graph and Twitter tags using the 1200×630 share image `images/og-image.jpg`.
- **One JSON-LD graph** (`WebSite` + `RealEstateAgent`) with the real phone, street address (Sidco Global Tower, Salt Lake Sector V, 700091), opening hours, areas served and social profiles. **When the phone, address or hours change, update both `data/contact.json` and this JSON-LD in `index.html`.** The map coordinates there are an approximation of Sector V; correct them from Google Maps if you want.
- Footer shows the full name / address / phone as plain text (search engines match this with your Google Business Profile), a working `mailto:` link, and a self-updating © year.
- `sitemap.xml` lists the homepage only (anchors like `#services` are not separate pages and are ignored by Google). Update its `lastmod` when the site changes materially.
- `robots.txt` allows everything except `/admin/`. The admin page is also `noindex`.
- Counters in the "Trusted by" band ship the real numbers in the HTML (crawlers / no-JS) and animate up from 0 in the browser.
- Third-party partner logos are lazy-loaded.

**Known SEO limits and next steps**
- **Listings are drawn by JavaScript on a single URL.** Google can read them but weakly, and each property cannot rank on its own. The real fix is crawlable pages per property and per area ("Flats in New Town, Kolkata"), generated automatically from `data/properties.json`. Not built yet.
- Rankings for "real estate broker in Kolkata" depend mostly on things outside this repo: a verified **Google Business Profile** (same name / address / phone as the site), genuine Google reviews, listings on 99acres / MagicBricks / Housing / Justdial with the same details, and links from other sites. Also add the site to **Google Search Console** and submit `sitemap.xml`.
- Claims in the copy ("15+ years", "1000+ transactions", "₹500 Cr+") should be accurate and provable. They are not in the search snippet or structured data, but they are on the page.

## Known issues and loose ends

- **ImgBB is still used.** Three listing photos (Marina's Edge, DTC Still Waters, Eden Devprayag) and the About-section photo are hosted on ImgBB. New photos added through the admin app are stored in the repo, so re-uploading these once through the admin app (or supplying the founder photo) removes the dependency completely.
- **`data/legal.json` is unused and out of date:** nothing loads it and there are no Terms or Privacy links on the page. Its phone (`+91 98300 12345`) and email (`contact@civiumestate.com`) differ from the real contact details. Either build a Terms/Privacy page from it (recommended, since three forms collect personal data) or delete it.
- **Hot Deals tab:** the site filters on `isHotDeal`; it is empty unless a listing is flagged.
- **Badge colours:** `badgeClass` in `properties.json` selects a colour: `hot`, `urgent`, `investment`, `ready`, `luxury` (others, including `featured`, use the default gold). These CSS rules are kept on purpose because the class comes from data, not from the HTML or JS. The admin app currently always writes `featured`.
- **Partner logos** are hot-linked favicons from each company's own site (24 external requests). If a site changes its icon the logo changes or falls back to 🏦.
- **Claims in copy:** testimonials, "1000+ transactions", partner interest rates ("Home Loans from 8.4%") and the RERA number `WBRERA/A/NOR/2025/000826` are hard-coded in `index.html`. Keep them accurate and current.
- **No spam protection** on the forms; EmailJS has a monthly quota on the free plan, so heavy traffic or bots could use it up.

## Local preview

Because the site `fetch()`es JSON files, opening `index.html` by double-click won't load the listings. Use a local server from the repo folder:

```
python -m http.server 8000
```

then open <http://localhost:8000>.
