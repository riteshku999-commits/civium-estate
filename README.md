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
| `css/style.css` | All styling (~3,000 lines, one file, organised by section comments) |
| `js/script.js` | All behaviour (~1,300 lines, one file, organised by numbered/boxed section comments) |
| `data/properties.json` | Property listings shown in the "Explore Properties" grid. **This is the file you edit to add or change listings** |
| `data/contact.json` | Phone, email, address, hours and social links shown in the Contact section |
| `admin/` | **Listings Manager**: phone-friendly admin page at `/admin/` for adding/editing/removing properties (see `admin/README.md`) |
| `worker/worker.js` | Optional Cloudflare Worker for the admin page's AI suggestions (setup in `admin/README.md`) |
| `images/properties/` | Photos uploaded through the admin page (created on first upload) |
| `data/legal.json` | Terms of Service and Privacy Policy text. **Not currently used by the site** (see "Known issues") |
| `images/logo.png`, `images/logo-icon.png` | Header logo and favicon / fallback icon |
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

`index.html` carries the title, description, keywords, canonical URL, Open Graph and Twitter tags, plus two JSON-LD blocks (`RealEstateAgent`, `LocalBusiness`). `sitemap.xml` lists the home page and section anchors. `robots.txt` allows everything and points to the sitemap.

## Known issues and loose ends (found while reviewing, not yet fixed)

- **Placeholder phone in SEO data:** both JSON-LD blocks in `index.html` have `"telephone": "+91-XXXXXXXXXX"`. Replace with the real number (`+91-6290781373`).
- **Opening hours disagree:** JSON-LD says Mo–Sa 09:00–18:00; `contact.json` says Mon–Sat 10–7 and Sun 10–4.
- **Broken footer email link:** the footer email is a leftover Cloudflare `/cdn-cgi/l/email-protection#…` link. That only works behind Cloudflare's proxy, so on GitHub Pages it is likely a dead link. Replace with a normal `mailto:sales@civiumestate.com`.
- **`data/legal.json` is unused and out of date:** nothing loads it and there are no Terms or Privacy links on the page. Its phone (`+91 98300 12345`) and email (`contact@civiumestate.com`) differ from the real contact details. Either build a Terms/Privacy page from it and fix those values, or delete it. The page does collect personal data through three forms, so a privacy policy link would be worthwhile.
- **Stale dates:** footer says "© 2025"; every `lastmod` in `sitemap.xml` is 2025-03-01.
- **Hot Deals tab:** the site filters on `isHotDeal`, but no current property has it set, so that tab is empty. The "Sold Out" and "Hot Deal" styles exist in CSS but the current data only uses the `featured` badge.
- **Dead CSS:** about 57 class selectors in `style.css` are no longer used anywhere in the HTML or JS (old "deals" slider, old RERA section, old filter buttons, etc.). Harmless; safe to prune whenever you want to tidy up.
- **Third-party image dependencies:** property photos (ImgBB), the founder photo (ImgBB), and bank / Magicbricks logos (hot-linked favicons from each company's own site) are all external. If any of those URLs change or go down, images disappear. Bank logos have an emoji fallback.
- **Claims in copy:** testimonials, "1000+ transactions", partner interest rates ("Home Loans from 8.4%") and the RERA number `WBRERA/A/NOR/2025/000826` are hard-coded in `index.html`. Keep them accurate and current.
- **No spam protection** on the forms; EmailJS has a monthly quota on the free plan, so heavy traffic or bots could use it up.

## Local preview

Because the site `fetch()`es JSON files, opening `index.html` by double-click won't load the listings. Use a local server from the repo folder:

```
python -m http.server 8000
```

then open <http://localhost:8000>.
