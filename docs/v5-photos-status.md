# Update v5 — Real photography: status and next steps

## Part A — done (commit 70a0475, live)

Every image slot still shows the illustrated gradient tile, as before. The build session could not reach Wikimedia Commons, Unsplash, Pexels or Flickr: the environment's network policy refused the connections. So the infrastructure was built, but no slot was filled with a photo that could not be opened and checked. A wrong image is worse than none.

**What's in place**
- **Inventory** (`npm run images:inventory` → `reports/image-inventory.json`): 143 image slots, needing 123 distinct photos, each with its card title, description and a "must show" shot brief.
  - Two shop cards (Lucknow's Hazratganj, Ayodhya's sweets) were sharing a photo with another card on the same page. Each now has its own image path.
- **Manifest** (`src/data/photos.json`, typed in `src/data/images.ts`): credit, licence, focal point, blur placeholder, AI-check note, relevance note and alternates for every photo.
  - A photo only appears once it's approved there. Anything else shows the gradient tile, so an unvetted or uncredited file can't slip in.
- **Credits:**
  - a small "ⓘ" credit on card images;
  - a credit line on city heroes and blog covers;
  - a `/credits` page (linked as "Photo credits" in the footer);
  - `IMAGE_CREDITS.md`, now generated from the manifest.
- **`npm run images:verify`**, which runs before every build. It fails on:
  - a wrong licence (NC, ND or fair use);
  - missing credit details;
  - a photo too small for its slot;
  - missing alt text;
  - a missing file;
  - the same photo twice on one page;
  - AI flags;
  - any AI image tool in `package.json`.
- **Sourcing pipeline,** tested offline:
  - `images:source` searches Commons, Unsplash and Pexels and auto-rejects bad licences, small, portrait, AI-tagged and watermarked images, and duplicates (22 tests: `npm run test:images`).
  - `images:process` uses `sharp` to resize only: no AI, no cropping, metadata including GPS stripped.
  - `images:report` builds `reports/image-review.html` and `reports/missing-images.md`.
- **Checks:** build, lint and typecheck pass; 25/25 end-to-end tests pass.
- **"Before" screenshots** of 9 pages at 1280px and 375px are in `reports/screenshots/before/`.

## Part B — waiting for network access

The environment's network policy blocks the photo sources:
- `commons.wikimedia.org`
- `upload.wikimedia.org`
- `api.unsplash.com`
- `api.pexels.com`

**To unblock it**
1. Open the cloud environment menu in the session's title bar → **Edit** → **Network access**.
2. Choose **Full**, or under **Limited** add these to **Allowed domains** (leave "Allow package managers" ticked):
   - `commons.wikimedia.org`, `upload.wikimedia.org`
   - `api.unsplash.com`, `images.unsplash.com`
   - `api.pexels.com`, `images.pexels.com`
3. Optionally add `UNSPLASH_ACCESS_KEY` and `PEXELS_API_KEY` as environment secrets. Wikimedia Commons needs no key.
4. Start a **new session** (the change doesn't apply to a running one) and ask it to "do v5 Part B".

Steps: https://code.claude.com/docs/en/cloud-environments#network-access

**Part B will:**
- search candidates and look at every one, scoring relevance, quality and fit;
- download and credit the approved photos;
- produce the "after" screenshots and run Lighthouse;
- add the Navaratri post's cover and inline photos (pending since v4).

**Alternative without changing settings:** send photos the team has rights to as a zip, like the team portraits.
- Name each file after its image path (see `reports/missing-images.md`).
- Include the source link, photographer and licence for each, or say it's the team's own photo.
- Each photo is checked against its card before it's added with full credits.

## Open question

The **Campus, Weather, Accommodation and Nearby "circuit"** cards currently have no space for a photo, so adding images there would change their layout. Should Part B add photos to those cards, or keep them text-only?
