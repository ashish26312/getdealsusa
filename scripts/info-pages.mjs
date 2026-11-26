// Site information pages: About, Contact, Privacy, Terms, Affiliate disclosure.
// Plain-language starting points, not legal advice. Have them reviewed before you rely on them.
// Edit the text here, then run `node scripts/build-seo.mjs` to rebuild.

export const EFFECTIVE = 'November 20, 2026';

export const INFO_PAGES = (site) => [
  {
    p: '/about/',
    nav: 'About',
    title: `About ${site.name}`,
    desc: `${site.name} finds Thanksgiving, Black Friday and holiday deals from major US stores and checks each price against the store's own page.`,
    body: `
<p>${site.name} collects holiday deals from major US stores such as Best Buy, Walmart, Target, Kohl's, Home Depot, Macy's and Nordstrom Rack, and puts them in one place you can search and filter.</p>
<h2>How we pick deals</h2>
<ul>
<li>We check each deal on the store's own product page: the current price, the store's listed regular or comparison price, and whether it is in stock.</li>
<li>We only list items sold by the store itself (or the brand's official store) and at least 10% below the store's listed price.</li>
<li>We re-check prices every other day and remove deals that sell out, end, or are no longer discounted.</li>
</ul>
<h2>What "% off" and our verdicts mean</h2>
<p>The % off compares with each store's listed regular or comparison price, which is not always what the item recently sold for. As we collect daily prices, we compare today's price with the item's own price history and label it (for example "Great price" or "Wait"). Until we have about a week of our own history, the label shows how deep the cut is against the store's listed price ("Big discount" is 40% or more, "Solid discount" 20 to 39%, "Modest discount" under 20%), with a rule-of-thumb take: "Buy now" for big cuts, "Good buy" for solid ones, and "Maybe wait" for modest ones, since small holiday cuts often get deeper by Black Friday or Cyber Monday. These takes are guidance, not a promise about future prices. Where we found dated public price reports from before the sale, we use them as estimated history, so a deal can get a full verdict sooner.</p>
<h2>Prices change</h2>
<p>Stores change prices and stock quickly. Always confirm the price on the store's page before you buy.</p>
<p>Questions or a deal we got wrong? <a href="/contact/">Contact us</a>.</p>`,
  },
  {
    p: '/contact/',
    nav: 'Contact',
    title: `Contact ${site.name}`,
    desc: `Send ${site.name} a question, a correction or a deal tip.`,
    body: `
<p>Found a wrong price, have a deal tip, or a question about your data? Email us and we'll reply.</p>
<div class="em"><a href="mailto:getdealsusa.help@gmail.com?subject=GetDealsUSA%20question">getdealsusa.help@gmail.com</a>
<button type="button" onclick="var b=this;navigator.clipboard.writeText('getdealsusa.help@gmail.com').then(function(){b.textContent='Copied'},function(){b.textContent='Select the address to copy'})">Copy</button></div>
<p>Helpful to include: the deal link, what looks wrong, and for privacy requests, the email address you signed up with.</p>
<p class="m">We use what you send only to reply to you. See our <a href="/privacy/">Privacy Policy</a>.</p>`,
  },
  {
    p: '/privacy/',
    nav: 'Privacy',
    title: `Privacy Policy | ${site.name}`,
    desc: `How ${site.name} collects, uses and protects your information.`,
    body: `
<p class="m">Effective ${EFFECTIVE}</p>
<p>This policy explains what information ${site.name} (${site.url.replace('https://', '')}, "we") collects and how we use it.</p>
<h2>What we collect</h2>
<ul>
<li><b>Email address</b>, if you sign up for deal alerts.</li>
<li><b>Your email and message</b>, if you email us.</li>
<li><b>Technical data</b> that our hosting provider records automatically when you visit, such as IP address, browser type and pages requested. It is used to run and secure the site.</li>
<li><b>Saved deals and recently viewed items</b> are stored only in your own browser (local storage). They are not sent to us. You can clear them by clearing your browser's site data.</li>
</ul>
<h2>How we use it</h2>
<ul>
<li>To send the deal alerts you asked for. Every email includes a way to unsubscribe.</li>
<li>To answer your messages.</li>
<li>To keep the site working and secure, and to understand which pages are useful.</li>
</ul>
<p>We do not sell your personal information, and we do not share it for cross-context behavioral advertising.</p>
<h2>Who we share it with</h2>
<p>Only service providers that help us run the site, under their own privacy terms: our host (Netlify) and, when we send alerts, our email provider. We may disclose information if required by law.</p>
<h2>Links to stores and cookies</h2>
<p>Deals link to store websites, which have their own privacy policies. Some links may be affiliate links; when you click one, the store or an affiliate network may set cookies to record that you came from us. We do not currently use advertising cookies or analytics; if we add them, we will update this policy first.</p>
<h2>How long we keep it</h2>
<p>We keep your email address until you unsubscribe or ask us to delete it, and contact messages for as long as needed to handle your request.</p>
<h2>Your choices and rights</h2>
<p>You can unsubscribe at any time. Depending on where you live (for example California and other US states), you may have the right to know, access, correct or delete your personal information. To make a request, email us at <a href="mailto:getdealsusa.help@gmail.com">getdealsusa.help@gmail.com</a> with the subject "Privacy request". We will not treat you differently for using these rights.</p>
<h2>Children</h2>
<p>This site is not directed to children under 13, and we do not knowingly collect their information.</p>
<h2>Changes</h2>
<p>If we change this policy, we will update the date above. Questions? <a href="/contact/">Contact us</a>.</p>`,
  },
  {
    p: '/terms/',
    nav: 'Terms',
    title: `Terms of Use | ${site.name}`,
    desc: `The terms for using ${site.name}.`,
    body: `
<p class="m">Effective ${EFFECTIVE}</p>
<p>By using ${site.name} you agree to these terms.</p>
<h2>Information only</h2>
<p>We list deals offered by other stores. We are not a store: we do not sell, ship or handle returns for any product. Purchases are between you and the store, under the store's terms.</p>
<h2>Prices and accuracy</h2>
<p>We check prices, but stores change prices and stock without notice, and mistakes happen. The store's page at checkout is the final price. Our verdicts and "% off" figures are opinions based on the information we have, not guarantees or financial advice.</p>
<h2>Affiliate links</h2>
<p>Some links may earn us a commission at no extra cost to you. See our <a href="/affiliate-disclosure/">Affiliate Disclosure</a>.</p>
<h2>Content</h2>
<p>Product names, images and trademarks belong to their owners and are shown to identify the products. The site's own text and design belong to ${site.name}. Do not copy the site in bulk or scrape it.</p>
<h2>No warranty and limit of liability</h2>
<p>The site is provided "as is", without warranties of any kind. To the fullest extent the law allows, ${site.name} is not liable for losses arising from your use of the site or from purchases made at other stores.</p>
<h2>Changes</h2>
<p>We may update these terms; the date above shows the latest version. Questions? <a href="/contact/">Contact us</a>.</p>`,
  },
  {
    p: '/affiliate-disclosure/',
    nav: 'Affiliate disclosure',
    title: `Affiliate Disclosure | ${site.name}`,
    desc: `How ${site.name} may earn money from links to stores.`,
    body: `
<p>${site.name} is free to use. To keep it that way, some links to stores may be affiliate links: if you click one and buy something, we may earn a small commission from the store, at no extra cost to you.</p>
<p>Commissions never decide which deals we list or the verdicts we show. We list deals because they pass our price checks, whether or not a link earns anything.</p>
<p>Questions? <a href="/contact/">Contact us</a>.</p>`,
  },
];

export const INFO_CSS = `.em{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0;font-size:20px;font-weight:700}.em a{word-break:break-all}.em button{font:inherit;font-size:14px;padding:6px 14px;border:1px solid var(--ln);border-radius:999px;background:var(--s);color:var(--ink);cursor:pointer}
.cf{display:grid;gap:12px;max-width:520px;margin:16px 0}.cf label{display:grid;gap:4px;font-weight:600}
.cf input,.cf select,.cf textarea{font:inherit;padding:10px 12px;border:1px solid var(--ln);border-radius:10px;background:var(--s);color:var(--ink)}
.cf button{justify-self:start;font:inherit;font-weight:700;padding:10px 18px;border:0;border-radius:999px;background:var(--br);color:#fff;cursor:pointer}
.w h2{font-size:19px;margin:22px 0 6px}.w ul{padding-left:20px}.w li{margin:4px 0}.ft{margin-top:28px;padding-top:14px;border-top:1px solid var(--ln);font-size:14px}.ft a{margin-right:14px}`;

export const footerLinks = (site) =>
  INFO_PAGES(site).filter((x) => x.nav).map((x) => `<a href="${x.p}">${x.nav}</a>`).join(' ');
