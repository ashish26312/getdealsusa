# getdealsusa.com

A static deals site plus a small job that keeps it current.

```
public/index.html          the site (no build step)
public/deals.json          what the site shows; rewritten by the job
scripts/build-deals.mjs    reads store feeds, tracks price history, writes deals.json
scripts/build-seo.mjs      writes category and store pages, sitemap.xml, robots.txt, home page SEO tags
data/feeds.config.json     which feeds to read and how their columns map
data/products.csv          your hand-picked deals (any store)
data/history.json          created by the job; daily price history per product
.github/workflows/update-deals.yml   runs the job every hour
```

## Put it online

1. Create a GitHub repo and push this folder.
2. Connect the repo to Cloudflare Pages or Netlify. No build command. Publish directory: `public`.
3. Add `getdealsusa.com` as a custom domain in that host.
4. In GitHub, Actions runs hourly. Each run commits a fresh `deals.json` and your host redeploys.

To test locally: `node scripts/build-deals.mjs`, then `npx serve public`.

## Add stores (this is the main job)

Most big retailers publish product feeds (title, sale price, regular price, tracked link, image URL)
through affiliate networks such as Impact, CJ, Rakuten Advertising and Awin, or through their own
programs (eBay Partner Network, Amazon Associates). Apply to each store's program, then:

1. Download or copy the feed URL (CSV, TSV or JSON).
2. Add it as a GitHub secret, for example `WALMART_FEED_URL`, and list it under `env:` in the workflow.
3. Copy the "Example store feed" block in `data/feeds.config.json`, set the store name, `"source": "${WALMART_FEED_URL}"`,
   and map the feed's column names to ours. Set `"enabled": true`.
4. Run the job once and read its report: rows read, rows kept, and why rows were skipped.

One feed per store takes about ten minutes once you have the file. For a one-off deal, add a row to
`data/products.csv` instead.

Rows are skipped if they have no real markdown, a discount under `minDiscountPct`, or no https store link.
Categories are guessed from the title when the feed's category is not one of ours; check the report.

## How the "real deal" verdict works

The job records each product's price every run and keeps the lowest price per day for 90 days.
The page compares today's price to that history (`verdict()` in `public/index.html`):

| Verdict | Rule |
| --- | --- |
| Price tracking started | fewer than 7 days of history |
| Great deal / Buy | within 3% of the lowest tracked price and at least 15% under the usual (median) price |
| Good deal / Buy | at least 10% under the usual price |
| Typical price / Okay | within 2% above or up to 10% under the usual price |
| Wait | the price was at least 10% lower recently |
| Not a deal / Skip | above the usual price |

The "was" price in a feed is shown as the discount badge but is never used for the verdict.
History starts the day the job first runs, so verdicts get sharper over the week.

## Photos

Use the image URLs that come with each feed. Do not download and re-host product photos or copy them
from retailer pages. Each program's terms say how long image links and prices may be cached and what
must be shown beside a price (Amazon, for example, requires a time stamp on prices refreshed less than
hourly and limits caching to 24 hours). The hourly job keeps you inside windows like that, but read
each program's terms.

## Get found on Google

`scripts/build-seo.mjs` runs after every update. It writes a page for each category and each store with at
least 3 live deals (`/deals/kitchen/`, `/stores/<store>/`), plus `sitemap.xml` and `robots.txt`, and fills in the
home page's title, description, canonical and social tags. Sample data is always `noindex` and robots.txt blocks
crawling, so nothing fake reaches Google.

1. Go live with real deals (`"demo": false`) and check that `https://getdealsusa.com/sitemap.xml` loads.
2. Verify the domain in Google Search Console (DNS TXT record), submit the sitemap, and request indexing of the home page.
3. Do the same in Bing Webmaster Tools.
4. Share the site where people look for deals (deal communities that allow it, social media, your email list).
   Links from other sites are how a new domain gets discovered faster.
5. Add an `og:image` (1200x630) once you have one.

A brand-new domain usually takes days to weeks to show up, and "Thanksgiving deals" is very competitive.
Expect long searches first, such as "<store> Thanksgiving deals" or "<product> Black Friday deal".

## Status at hand-off

- `"demo": false` is already set and the sample feed is removed. The site ships with 37 deals
  from Best Buy, Walmart, Target, Kohl's, Home Depot, Macy's and Nordstrom Rack in `data/products.csv`
  (checked Nov 20, 2026). The 8 Nordstrom Rack beauty rows came from the store's deals listing page and were not
  re-checked on their own product pages, so spot-check those first.
- Each row has a `checked` time. The page shows the newest one ("Prices checked ..."), and the data job warns
  when any row is more than 24 hours old. Re-check prices before you announce and daily after that.
- The "% off" compares with each store's listed regular or comparison price (Best Buy "Comp. Value", Macy's
  "original", and so on), which is not always what the item recently sold for. The site says so in the footer
  and on every deal. "Real deal" badges only appear after 7 days of tracked prices for an item.
- Product photos: 30 of the 37 deals have a photo linked from the store's own site (hot-linked, not copied).
  If a store changes or blocks an image, the card falls back to a category icon. When you join affiliate
  programs, switch to the image URLs their feeds supply. Add or fix photos in the `image` column.

## Before you announce it

- Spot-check 5 to 10 prices against the store pages again. Sales change fast.
- Keep the affiliate disclosure in the footer.
- Connect the email box in `public/index.html` (`#nf` form) to your email service.
- An Amazon adapter is not included. Amazon's Creators API needs your Associates credentials; add it
  as another feed source once you have them.
