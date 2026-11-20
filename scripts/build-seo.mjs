#!/usr/bin/env node
// Writes crawlable category and store pages, sitemap.xml, robots.txt and the home page's SEO tags and
// browse links, all from public/deals.json. Sample (demo) data is always marked noindex.
// Run after build-deals.mjs:  node scripts/build-seo.mjs
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),pub=path.join(root,'public');
const site={name:'GetDealsUSA',url:'https://getdealsusa.com',minDealsPerPage:3,...JSON.parse(await readFile(path.join(root,'data/site.json'),'utf8'))};

// Reuse the page's own logic so the verdicts on these pages match the app exactly.
const homePath=path.join(pub,'index.html'),home=await readFile(homePath,'utf8');
const core=home.slice(home.indexOf('/*CORE*/'),home.indexOf('/*END CORE*/')+12);
const ctx={Date,Math,JSON,Set,Number,String,Object,Array,parseInt,isFinite,RegExp};
vm.createContext(ctx);vm.runInContext(core+';globalThis.X={fromFeed,makeDeals,CATS,money,esc,fmtTime}',ctx);
const {fromFeed,makeDeals,CATS,money,esc,fmtTime}=ctx.X;

const feed=JSON.parse(await readFile(path.join(pub,'deals.json'),'utf8'));
const demo=feed.demo!==false,updated=new Date(feed.updated||Date.now()),year=updated.getUTCFullYear();
const deals=makeDeals(fromFeed(feed)).filter(d=>!d.end||d.end>Date.now());
const dateStr=updated.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'});
const robots=demo?'noindex,nofollow':'index,follow,max-image-preview:large';
const slug=s=>String(s).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const rank={great:0,good:1,typical:2,new:3,wait:4,skip:5};
const best=(a,b)=>rank[a.v.tier]-rank[b.v.tier]||b.pct-a.pct;
const json=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const outbound='rel="sponsored nofollow noopener" target="_blank"';

const css=`:root{--bg:#F4F6F2;--s:#fff;--ink:#14201A;--mu:#58665C;--ln:#DDE3DA;--br:#1E4D38;--deal:#B71C3C}
@media(prefers-color-scheme:dark){:root{--bg:#0E1511;--s:#16201A;--ink:#E8EFE9;--mu:#9AA99F;--ln:#26332B;--br:#6FCB98;--deal:#FF7F96}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif;padding:0 max(16px,env(safe-area-inset-left,0px))}
.w{max-width:960px;margin:0 auto;padding:16px 0 40px}a{color:var(--br)}nav.c{font-size:14px;color:var(--mu)}h1{font-size:clamp(26px,5vw,38px);line-height:1.1;margin:.6em 0 .3em}
ul.l{list-style:none;margin:20px 0;padding:0;display:grid;gap:12px}.d{display:flex;gap:14px;background:var(--s);border:1px solid var(--ln);border-radius:14px;padding:12px}
.im{flex:none;width:96px;height:96px;display:block;background:#fff;border-radius:10px;overflow:hidden}.im img{width:100%;height:100%;object-fit:contain}
.d h3{margin:0 0 2px;font-size:17px;line-height:1.3}.d p{margin:2px 0;font-size:14px}.st{color:var(--mu)}.pr{font-size:22px;color:var(--deal)}.d s{color:var(--mu)}
.go{display:inline-block;margin-top:6px;font-weight:700}.m{color:var(--mu);font-size:14px}`;

function shell({p,title,desc,h1,intro,list,crumbs,more}){
  const url=site.url+p;
  const ld=[{'@context':'https://schema.org','@type':'CollectionPage',name:h1,url,description:desc,isPartOf:{'@type':'WebSite',name:site.name,url:site.url+'/'}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c[0],item:site.url+c[1]}))}];
  const li=d=>`<li class="d">${d.url?`<a class="im" href="${esc(d.url)}" ${outbound}>`:'<span class="im">'}${d.image?`<img src="${esc(d.image)}" alt="${esc(d.title)}" loading="lazy" width="96" height="96">`:''}${d.url?'</a>':'</span>'}
<div><h3>${esc(d.title)}</h3><p class="st">${esc(d.store)}</p><p><b class="pr">${money(d.price)}</b> <s>${money(d.orig)}</s> ${d.pct}% off</p>
<p><b>${esc(d.v.badge)}.</b> ${esc(d.v.reason)}</p>${d.url?`<a class="go" href="${esc(d.url)}" ${outbound}>See deal at ${esc(d.store)}</a>`:''}</div></li>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}"><meta name="robots" content="${robots}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary">
<script type="application/ld+json">${json(ld)}</script><style>${css}</style></head>
<body><div class="w"><nav class="c" aria-label="Breadcrumb">${crumbs.map((c,i)=>i<crumbs.length-1?`<a href="${c[1]}">${esc(c[0])}</a>`:esc(c[0])).join(' &rsaquo; ')}</nav>
<h1>${esc(h1)}</h1><p>${esc(intro)}</p><p class="m">Prices checked ${esc(fmtTime(updated.getTime()))} on ${esc(dateStr)}. Prices and availability change quickly, so confirm at the store. The % off compares with each store's listed regular or comparison price, which is not always what the item recently sold for.</p>
<ul class="l">${list.map(li).join('\n')}</ul>
<p>${more}</p>
<p class="m">${esc(site.name)} may earn a commission when you buy through links on this page, at no extra cost to you.</p></div></body></html>
`;
}

const intro=(label,list)=>{
  const real=list.filter(d=>d.v.tier==='great'||d.v.tier==='good').length;
  return `${list.length} ${label} deals, with the best-priced first. We check each price against the store page and track it daily to flag real deals${real?`; ${real} of these are priced well below their usual price right now`:''}.`;
};
const stores=[...new Set(deals.map(d=>d.store))].sort();
const catKeys=Object.keys(CATS).filter(k=>deals.filter(d=>d.cat===k).length>=site.minDealsPerPage);
const storeKeys=stores.filter(s=>deals.filter(d=>d.store===s).length>=site.minDealsPerPage);
const catLinks=catKeys.map(k=>`<a href="/deals/${k}/">${esc(CATS[k].n)}</a>`).join(' &middot; ');
const storeLinks=storeKeys.map(s=>`<a href="/stores/${slug(s)}/">${esc(s)}</a>`).join(' &middot; ');
const more=`<strong>More deals:</strong> ${catLinks}${storeKeys.length?'<br><strong>By store:</strong> '+storeLinks:''}<br><a href="/">All Thanksgiving deals</a>`;

await rm(path.join(pub,'deals'),{recursive:true,force:true});
await rm(path.join(pub,'stores'),{recursive:true,force:true});
const pages=[];
async function write(p,opts){await mkdir(path.join(pub,p),{recursive:true});await writeFile(path.join(pub,p,'index.html'),shell({p,more,...opts}));pages.push(p)}
for(const k of catKeys){
  const list=deals.filter(d=>d.cat===k).sort(best),n=CATS[k].n,nm=n.toLowerCase();
  await write(`/deals/${k}/`,{title:`${n} Deals for Thanksgiving ${year} | ${site.name}`,h1:`${n} deals for Thanksgiving ${year}`,
    desc:`${list.length} ${nm} deals from ${new Set(list.map(d=>d.store)).size} stores, updated ${dateStr}. Prices are checked against store pages and tracked daily.`,
    intro:intro(nm,list),list,crumbs:[['Home','/'],[`${n} deals`,`/deals/${k}/`]]});
}
for(const s of storeKeys){
  const list=deals.filter(d=>d.store===s).sort(best);
  await write(`/stores/${slug(s)}/`,{title:`${s} Thanksgiving Deals ${year} | ${site.name}`,h1:`${s} Thanksgiving deals ${year}`,
    desc:`${list.length} ${s} deals, updated ${dateStr}. Prices are checked against the store page and tracked daily.`,
    intro:intro(s,list),list,crumbs:[['Home','/'],[`${s} deals`,`/stores/${slug(s)}/`]]});
}

// Home page: SEO tags in the head, plain links to every page in the footer
const homeUrl=site.url+'/',hTitle=`Thanksgiving & Black Friday Deals ${year} | ${site.name}`;
const hDesc='Search Thanksgiving, Black Friday and Cyber Monday deals. Prices from Best Buy, Walmart, Target and more are checked against the store page and tracked daily, so you can spot a real deal.';
const icon="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231E4D38'/%3E%3Cpath d='M6 12V6h6l7 7-6 6z' fill='none' stroke='%23F3F8F4' stroke-width='1.6' stroke-linejoin='round'/%3E%3C/svg%3E";
const head=`<title>${esc(hTitle)}</title><meta name="description" content="${esc(hDesc)}"><link rel="canonical" href="${homeUrl}"><meta name="robots" content="${robots}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(hTitle)}"><meta property="og:description" content="${esc(hDesc)}"><meta property="og:url" content="${homeUrl}"><meta name="twitter:card" content="summary">
<link rel="icon" href="${icon}"><script type="application/ld+json">${json({'@context':'https://schema.org','@type':'WebSite',name:site.name,url:homeUrl})}</script>`;
const browse=`<style>.browse{margin:0 0 18px;line-height:1.9}.browse h2{font:700 18px var(--f-display);margin:0 0 4px}.browse a{color:var(--brand);font-weight:600}</style>
<nav class="browse" aria-label="Browse deals"><h2>Browse deals</h2>${catKeys.length?`<div>By category: ${catKeys.map(k=>`<a href="/deals/${k}/">${esc(CATS[k].n)} (${deals.filter(d=>d.cat===k).length})</a>`).join(' &middot; ')}</div>`:''}${storeKeys.length?`<div>By store: ${storeKeys.map(s=>`<a href="/stores/${slug(s)}/">${esc(s)}</a>`).join(' &middot; ')}</div>`:''}</nav>`;
const swap=(h,tag,body)=>{const re=new RegExp(`<!--SEO:${tag}-->[\\s\\S]*?<!--/SEO:${tag}-->`);if(!re.test(h)){console.warn(`Marker SEO:${tag} not found in public/index.html`);return h}return h.replace(re,()=>`<!--SEO:${tag}-->\n${body}\n<!--/SEO:${tag}-->`)};
await writeFile(homePath,swap(swap(home,'HEAD',head),'BROWSE',browse));

// sitemap and robots (sample data is never submitted)
if(demo){
  await rm(path.join(pub,'sitemap.xml'),{force:true});
  await writeFile(path.join(pub,'robots.txt'),'User-agent: *\nDisallow: /\n');
}else{
  const day=updated.toISOString().slice(0,10),urls=['/',...pages];
  await writeFile(path.join(pub,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${site.url}${u}</loc><lastmod>${day}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(path.join(pub,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
}
console.log(`${demo?'DEMO DATA (noindex, robots blocks crawling): ':''}wrote ${pages.length} pages (${catKeys.length} categories, ${storeKeys.length} stores)${demo?'':' + sitemap.xml'}.`);
