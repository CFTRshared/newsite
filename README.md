# reviewsforsale.com

Static site. No build step, no dependencies, no framework. Upload the contents of this directory to the repo and Vercel serves it as-is.

An awareness and deterrence initiative of the [Coalition for Trusted Reviews](https://www.coalitionfortrustedreviews.com). No reviews are sold, no payments are accepted, and every call to action opens an interstitial explaining that buying fake reviews is unlawful.

---

## What's here

```
index.html          Storefront. Simulated review seller. Every CTA opens the interstitial.
answers/            Warning layer — sourced, honest, Coalition-branded.
  index.html          Hub
  is-it-illegal-to-buy-reviews.html
  can-you-get-caught-buying-reviews.html
  what-happens-if-you-buy-fake-reviews.html
  scammed-buying-reviews.html
  answers.css         Shared stylesheet (deliberately unlike the storefront)
  track.js            Fires `answers_read` at 30s dwell or 75% scroll
robots.txt          Explains the honeypot to human reviewers; points at the sitemap
sitemap.xml         All 6 pages
vercel.json         cleanUrls off, /answers → /answers/ redirect, cache headers
```

Two layers, two jobs:

| | Storefront (`/`) | Warning layer (`/answers/`) |
|---|---|---|
| Job | Intercept buyers at the point of purchase | Get found, get linked, warn people mid-decision |
| Interstitial | Capped to the viewport: pinned red header, pinned footer, body scrolls internally only if it must | — |
| Found via | "buy tripadvisor reviews" | "is it illegal to buy reviews" |
| Linkable by a member's legal team? | No | Yes |

Most `/answers/` traffic arrives straight from search and never touches the storefront. The interstitial links into it as a second path.

---

## How the two layers connect

**Storefront → warning layer** (already wired):

- A full-width **"Learn more →"** button in the interstitial's pinned footer, pointing at `/answers/`. Always on screen, at any viewport height.
- **"Already paid a seller? →"** next to it, pointing straight at `scammed-buying-reviews.html` — a distinct and urgent need that shouldn't need two clicks.
- 2 crawlable footer links on the storefront.

The hub at `/answers/` carries the four topic cards, so one prominent door beats four competing ones. Link equity flows storefront → hub → topic pages.

**Warning layer → storefront:** deliberately none. A page that says "buying reviews is illegal, here's where to buy them" is indefensible. The links run one direction only.

---

## Deploy

Assumes the repo is already connected to Vercel.

### Before you upload — three checks

1. **Vercel → Settings → Build and Deployment → Root Directory.** Empty means files go at repo top level. If it names a folder (`public`, `dist`), everything except `vercel.json` goes inside that folder. `vercel.json` always sits at the repo root.
2. **Any existing `vercel.json` — check `cleanUrls`.** If it's `true`, **stop**: Vercel would strip `.html` and 308-redirect every page, leaving all canonicals pointing at URLs that redirect. The pages need regenerating with extensionless links first. If the key is absent or `false`, merge my `redirects` and `headers` into your existing file rather than overwriting it.
3. **Vercel → Settings → Deployment Protection.** Vercel Authentication must be **off for Production**, or Googlebot hits a login wall while the site looks fine to you. Leave it on for previews.

### Upload

GitHub web UI: **Add file → Upload files**, drag the whole contents of this directory in, tick **Create a new branch and start a pull request**. Vercel comments a preview URL on the PR within a minute or two.

### Check the preview

- [ ] `/` loads, styled; click any button → interstitial appears
- [ ] **Red header and "Learn more" button both visible without scrolling** — check at a few window heights, and try dragging the window short
- [ ] "Learn more →" goes to `/answers/`; "Already paid a seller?" goes to `scammed-buying-reviews.html`
- [ ] `Esc` closes the interstitial; so does clicking the backdrop
- [ ] `/answers/` loads; navy disclosure banner visible without scrolling on all five pages
- [ ] `/answers` (no trailing slash) redirects to `/answers/`
- [ ] `/robots.txt` and `/sitemap.xml` render
- [ ] Open on a phone
- [ ] View source on `/answers/is-it-illegal-to-buy-reviews.html` — canonical points at `reviewsforsale.com`, not the preview URL (expected and correct)

`/_vercel/insights/script.js` will 404 until Web Analytics is enabled. Harmless.

### Merge, then

1. Search Console → **Sitemaps** → submit `sitemap.xml`
2. Search Console → **URL Inspection** → Request Indexing on all six URLs, one at a time. Don't wait for discovery on a low-authority domain.
3. Repeat at [Bing Webmaster Tools](https://www.bing.com/webmasters)
4. Search `site:reviewsforsale.com`. Nothing back means the domain has never been indexed — that's the real traffic problem, not content.
5. Vercel → **Settings → Domains** → confirm `reviewsforsale.com` is primary and the `.vercel.app` hostname redirects to it. Unlike preview URLs, the production `.vercel.app` domain *is* indexable.

**Rollback:** Vercel → Deployments → previous production deployment → **⋯ → Promote to Production**. Seconds.

---

## Legacy pages

`index.html` now covers services, pricing, FAQ and contact in one page, so `services.html`, `pricing.html` and `contact.html` are both redundant and visually mismatched against the new design.

**Recommended — delete them** and add these redirects to `vercel.json`:

```json
{ "source": "/services.html", "destination": "/#platforms", "permanent": true },
{ "source": "/pricing.html",  "destination": "/#pricing",   "permanent": true },
{ "source": "/contact.html",  "destination": "/",           "permanent": true }
```

**If you keep them:** uncomment the legacy nav block in `index.html`'s footer (search `LEGACY PAGES`) so they don't become orphaned, add them back to `sitemap.xml`, and restyle them to match — otherwise clicking "Services" lands a visitor on a page that looks like a different website, which is the fastest way to break the illusion.

---

## Analytics

The page heads carry the Vercel Web Analytics snippet. Enable it at Vercel → Analytics.

Two events, and they matter more than sessions:

| Event | Fires when |
|---|---|
| `warning_shown` | Interstitial opens. Carries which CTA triggered it. |
| `answers_read` | 30s dwell or 75% scroll on an `/answers/` page |

**Custom events need a Vercel Pro plan** — Hobby collects capped basic events and pauses at the ceiling. If this project is on Hobby, swap the two snippet lines in each page head for GA4 or Plausible; `track.js` and the interstitial handler already fire into `window.va`, `window.gtag` and `window.plausible` alike, so nothing else changes.

UTM every inbound link you control so member links and sponsored placements are attributable:

```
?utm_source=tripadvisor&utm_medium=helpcenter&utm_campaign=warning_layer
```

Don't UTM internal links.

---

## Protecting against a deceptive-content flag

The storefront imitates an unlawful service. Built-in protections — **don't remove these**:

- The full interstitial text is **server-rendered and unconditional** in `index.html`. Identical content goes to crawlers and humans. No cloaking, no user-agent branching.
- A `NOTICE FOR REVIEWERS` block at the top of `index.html` source explains the project to any human reviewer who views source.
- A matching explanation in `robots.txt`.
- Disclosure banner above the fold on every `/answers/` page, with `Organization` schema naming the Coalition.
- No schema.org markup on the storefront, deliberately. Product/FAQPage/AggregateRating would push fabricated claims and a fake 4.9 rating into rich results.

**Two things still to do:**

1. **Contact Google Trust & Safety pre-emptively**, via Tripadvisor's existing relationship. One paragraph: a Coalition anti-fraud initiative runs a simulated storefront on this domain, no transactions occur, `/answers/` documents the intent. Reversing a Safe Browsing interstitial takes weeks and kills every channel; pre-empting one costs an email.
2. **Decide on the visible footer disclosure.** `index.html` contains a ready-to-enable one-line disclosure (search `OPTIONAL VISIBLE DISCLOSURE`), currently commented out. It strengthens your position against a manual action, at the cost of tipping off anyone who reads footers. The storefront footer already links to `/answers/`, where full disclosure appears above the fold — that's a defensible middle position, but make it a conscious choice.

**Never** serve different content to crawlers than to users. Everything above depends on not doing that.

---

## Maintenance

The FTC penalty ceiling is inflation-adjusted each January. It appears in `index.html` and across `answers/`:

```bash
grep -rn '53,088' .
```

It rose from $51,744 to $53,088 effective 17 January 2025 and was not adjusted for 2026. A stale figure loses credibility with exactly the audience that checks.

---

## Contact

Coalition for Trusted Reviews — Secretariat: DGA Group
coalitionfortrustedreviewspauk@dgagroup.com
