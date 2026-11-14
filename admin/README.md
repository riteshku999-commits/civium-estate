# Listings Manager (admin app)

A phone-friendly page at **https://civiumestate.com/admin/** where the client can add, edit, hide, mark sold, reorder and delete property listings, with no coding.

## How it works

- It is a plain web page (`index.html`, `admin.css`, `admin.js`). No server.
- It signs in with a **GitHub access token** and edits `data/properties.json` directly in this repo. Every save is **one commit**: the listing data plus any new photos. GitHub Pages republishes the site in about a minute.
- Photos are shrunk on the phone (max 1600 px, JPEG) and stored in `images/properties/`. Photos removed from a listing, or belonging to a deleted listing, are deleted from the repo in the same commit.
- Every save is applied on top of the **latest** `properties.json`, so editing from two places will not overwrite each other.
- Nearby places (metro, railway, hospital, school, airport, mall, market, park, hotel, bank, fuel) come from **OpenStreetMap** (Nominatim for the address search, Overpass for places, OSRM for driving distance). Free, no keys. The set looked up depends on the property type (flats, offices, retail, warehouse). The client sees every result and can edit or remove it before saving.
- Extra details: the client can add any "label + value" pair. Whatever is saved shows up on the property page automatically (`js/script.js` renders unknown attributes generically).
- The page is `noindex` and listed in `robots.txt`, and it does nothing without a valid token.

## One-time setup: the client's token

1. Sign in to GitHub as the repo owner → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name: `Civium admin (client)`. Expiration: the longest allowed.
3. **Repository access → Only select repositories →** `civium-estate`.
4. **Permissions → Repository permissions → Contents: Read and write.** Leave everything else off.
5. Generate, copy the token (starts with `github_pat_`), send it privately to the client.
6. The client opens `/admin/`, pastes it once and taps **Sign in**. The phone remembers it.

Safety: the token can only change this one repo. To lock someone out, delete the token in GitHub. When it expires, make a new one. Anyone with the token can change the site, so treat it like a password. (Better: add the client as a collaborator and let them create their own token, so you can revoke it separately.)

## Optional: AI suggestions (Cloudflare Worker)

Adds a **"Ask AI for more suggestions"** button. The AI writes a short description from the facts entered and suggests extra details that suit the property type. It is told not to invent facts: anything it cannot know is offered as an empty field to ask the owner. It needs a small server because the Anthropic key must stay secret.

1. Create a free Cloudflare account → **Workers & Pages → Create → Worker**. Paste in `worker/worker.js` and deploy.
2. Worker → **Settings → Variables and Secrets**: add secret `ANTHROPIC_API_KEY` (from console.anthropic.com). Optionally set `MODEL` (default `claude-haiku-5-5`), `ALLOWED_ORIGIN`, `GITHUB_REPO`.
3. In the admin login screen → **Advanced settings → AI helper address**, paste the worker URL (e.g. `https://civium-ai.<you>.workers.dev`).

The worker only answers callers whose GitHub token can edit the repo. Cost is a few cents per month at this volume.

## Limits to know about

- Distances are approximate (OpenStreetMap data for India is good in Kolkata but not perfect). The client should glance at them.
- The site is republished by GitHub Pages about 1–2 minutes after each save. New photos may show a broken image for that minute.
- Videos are not uploaded (too large for the repo): add a web link instead.
- Property photo size is limited by the phone's memory; a huge number of photos in one save can be slow. 5–8 per listing is ideal.
- If a new area or property type is added, the site shows its name automatically (derived from the key).
