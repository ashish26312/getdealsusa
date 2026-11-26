// Black Friday ads by store: a hub page (/black-friday-ads/), one page per store, and a strip on the home page.
// Data lives in data/ads.json. Highlight prices are advertised prices, not checked on product pages.
// Called from build-seo.mjs.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';

const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const md=t=>{const [,m,d]=String(t).slice(0,10).split('-').map(Number);return `${MON[m-1]} ${d}`}; // the store's own calendar date, as written in ads.json
const range=m=>{const a=md(m.start),b=md(m.end);return a===b?a:a.slice(0,3)===b.slice(0,3)?`${a}–${b.slice(4)}`:`${a}–${b}`};
export function statusOf(m,now=Date.now()){
  const s=Date.parse(m.start),e=Date.parse(m.end);
  if(now>e)return {k:'ended',t:'Ended'};
  if(now>=s)return {k:'live',t:'Live now'};
  return {k:'soon',t:`Starts ${md(m.start)}`};
}
// Recomputes the badges in the visitor's browser, so they stay right between builds.
const liveJs=`<script>(function(){var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],n=Date.now();document.querySelectorAll('[data-s]').forEach(function(el){var s=Date.parse(el.dataset.s),e=Date.parse(el.dataset.e),p=el.dataset.s.slice(5,10).split('-'),k=n>e?'ended':n>=s?'live':'soon';el.className='bd '+k;el.textContent=k==='ended'?'Ended':k==='live'?'Live now':'Starts '+M[+p[0]-1]+' '+(+p[1])})})()</script>`;

export const ADS_CSS=`.bd{display:inline-block;font:700 12px/1 system-ui,sans-serif;padding:5px 9px;border-radius:999px;white-space:nowrap}
.bd.live{background:#DDF3E4;color:#14532D}.bd.soon{background:#FFF1DC;color:#7A3E00}.bd.ended{background:#ECEEEA;color:#58665C}
@media(prefers-color-scheme:dark){.bd.live{background:#1B3A27;color:#9BE3B5}.bd.soon{background:#3A2A12;color:#FFC98A}.bd.ended{background:#26332B;color:#9AA99F}}
.mono{flex:none;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font:800 16px/1 system-ui,sans-serif;color:#fff}
.ag{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin:20px 0;padding:0;list-style:none}
.ac{background:var(--s);border:1px solid var(--ln);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0}
.ah{display:flex;gap:12px;align-items:center}.ah h2,.ah h3{margin:0;font-size:18px;line-height:1.2}.ah p{margin:2px 0 0;font-size:13px;color:var(--mu)}
.hl{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:14px}.hl li{display:flex;justify-content:space-between;gap:10px;border-top:1px dashed var(--ln);padding-top:6px}
.hl b{color:var(--deal);white-space:nowrap;text-align:right}.hl s{color:var(--mu);font-size:12px;display:block;text-align:right}
.ac .lk{margin-top:auto;display:flex;gap:14px;flex-wrap:wrap;font-weight:700;font-size:14px}
table.gl{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0 24px;background:var(--s);border-radius:12px;overflow:hidden}
table.gl th,table.gl td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--ln);vertical-align:top}table.gl th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mu)}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ev{list-style:none;padding:0;margin:12px 0;display:grid;gap:8px}.ev li{background:var(--s);border:1px solid var(--ln);border-radius:12px;padding:10px 12px}.ev b{display:block}.ev span{color:var(--mu);font-size:14px}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.facts span{background:var(--s);border:1px solid var(--ln);border-radius:999px;padding:6px 12px;font-size:14px}
.note{background:var(--s);border-left:4px solid var(--br);padding:10px 14px;border-radius:8px;font-size:14px}`;

const PALETTE=['#1E4D38','#B71C3C','#2F4FA8','#7A3E00','#6B2F8A','#0F6E73','#9A2A6B','#3D5A1E'];
const color=s=>PALETTE[[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%PALETTE.length];
const initials=s=>s.replace(/[^A-Za-z0-9 &']/g,'').split(/\s+/).filter(w=>w&&w!=='&').slice(0,2).map(w=>w[0]).join('').toUpperCase();

export async function buildAds({root,pub,site,esc,css,icon,footerLinks,robots,year}){
  let data;
  try{data=JSON.parse(await readFile(path.join(root,'data/ads.json'),'utf8'))}catch{return {pages:[],strip:''}}
  const now=Date.now(),stores=data.stores.slice();
  const order={live:0,soon:1,ended:2};
  stores.sort((a,b)=>order[statusOf(a.main,now).k]-order[statusOf(b.main,now).k]||Date.parse(a.main.end)-Date.parse(b.main.end));
  const checked=new Date(data.checked+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const out='rel="nofollow noopener" target="_blank"';
  const badge=m=>{const s=statusOf(m,now);return `<span class="bd ${s.k}" data-s="${esc(m.start)}" data-e="${esc(m.end)}">${esc(s.t)}</span>`};
  const mono=s=>`<span class="mono" style="background:${color(s.store)}" aria-hidden="true">${esc(initials(s.store))}</span>`;
  const hlList=(h,n)=>h.length?`<ul class="hl">${h.slice(0,n).map(x=>`<li><span>${esc(x.item)}</span><span><b>${esc(x.price)}</b>${x.was?`<s>${/^\$/.test(x.was)?'was ':''}${esc(x.was)}</s>`:''}</span></li>`).join('')}</ul>`:'<p class="m">No item prices published yet.</p>';
  const disclaimer=`Prices shown are what each store advertised or what deal-news outlets reported from the store's ad, checked ${esc(checked)}. We have not checked these on product pages like our <a href="/">price-checked deals</a>. Quantities can be limited, and prices can change, so confirm at the store.`;
  const head=(p,title,desc,ld)=>`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${site.url}${p}"><meta name="robots" content="${robots}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${site.url}${p}"><meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#1E4D38"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script><style>${css}${ADS_CSS}</style></head>`;
  const foot=`<nav class="ft" aria-label="Site"><a href="/">All deals</a> <a href="/black-friday-ads/">Black Friday ads</a> ${footerLinks(site)}</nav></div>${liveJs}</body></html>\n`;
  const hub='/black-friday-ads/',pages=[];
  await rm(path.join(pub,'black-friday-ads'),{recursive:true,force:true});

  // Hub
  {
    const title=`Black Friday Ads ${year}: ${stores.length} Stores' Sale Dates & Doorbusters | ${site.name}`;
    const desc=`Black Friday ${year} ads from ${stores.slice(0,6).map(s=>s.store).join(', ')} and more: sale dates, Thanksgiving hours and headline doorbusters, in one place.`;
    const ld=[{'@context':'https://schema.org','@type':'CollectionPage',name:`Black Friday ads ${year}`,url:site.url+hub,description:desc},
      {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.url+'/'},{'@type':'ListItem',position:2,name:'Black Friday ads',item:site.url+hub}]}];
    const live=stores.filter(s=>statusOf(s.main,now).k==='live').length;
    const table=`<div class="tw"><table class="gl"><thead><tr><th>Store</th><th>Main sale</th><th>Dates</th><th>Thanksgiving</th><th>Black Friday hours</th></tr></thead><tbody>${stores.map(s=>`<tr><td><a href="${hub}${s.slug}/">${esc(s.store)}</a></td><td>${esc(s.main.name)} ${badge(s.main)}</td><td>${esc(range(s.main))}</td><td>${esc(s.thanksgiving||'Not announced')}</td><td>${esc(s.bf_hours||'Not announced')}</td></tr>`).join('')}</tbody></table></div>`;
    const cards=`<ul class="ag">${stores.map(s=>`<li class="ac"><div class="ah">${mono(s)}<div><h2>${esc(s.store)}</h2><p>${esc(s.main.name)} &middot; ${esc(range(s.main))}</p></div></div><div>${badge(s.main)}</div>${hlList(s.highlights,4)}<div class="lk"><a href="${hub}${s.slug}/">Full ${esc(s.store)} ad</a><a href="${esc(s.url)}" ${out}>${esc(s.link_label)} &#8599;</a></div></li>`).join('')}</ul>`;
    const html=`${head(hub,title,desc,ld)}
<body><div class="w"><nav class="c" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Black Friday ads</nav>
<h1>Black Friday ads ${year}</h1>
<p>Every big store's Black Friday plan in one place: when each sale starts, whether stores open on Thanksgiving (Nov 26), Black Friday (Nov 27) hours, and the headline doorbusters from each ad. ${live} of ${stores.length} sales are live now.</p>
<p class="note">${disclaimer}</p>
<h2>At a glance</h2>${table}
<h2>Doorbusters by store</h2>${cards}
<p class="m">${esc(site.name)} may earn a commission when you buy through links on this site, at no extra cost to you.</p>
${foot}`;
    await mkdir(path.join(pub,hub),{recursive:true});await writeFile(path.join(pub,hub,'index.html'),html);pages.push(hub);
  }

  // One page per store
  for(const s of stores){
    const p=`${hub}${s.slug}/`;
    const title=`${s.store} Black Friday Ad ${year}: Dates, Hours & Deals | ${site.name}`;
    const desc=`${s.store} Black Friday ${year}: ${s.main.name} runs ${range(s.main)}. Thanksgiving: ${s.thanksgiving||'not announced'}. See the advertised doorbusters.`;
    const ld=[{'@context':'https://schema.org','@type':'WebPage',name:`${s.store} Black Friday ad ${year}`,url:site.url+p,description:desc},
      {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.url+'/'},{'@type':'ListItem',position:2,name:'Black Friday ads',item:site.url+hub},{'@type':'ListItem',position:3,name:s.store,item:site.url+p}]}];
    const others=stores.filter(o=>o!==s).map(o=>`<a href="${hub}${o.slug}/">${esc(o.store)}</a>`).join(' &middot; ');
    const html=`${head(p,title,desc,ld)}
<body><div class="w"><nav class="c" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="${hub}">Black Friday ads</a> &rsaquo; ${esc(s.store)}</nav>
<div class="ah" style="margin-top:14px">${mono(s)}<div><h1 style="margin:0">${esc(s.store)} Black Friday ad ${year}</h1></div></div>
<div class="facts"><span>${badge(s.main)} ${esc(s.main.name)}: ${esc(range(s.main))}</span><span>Thanksgiving: ${esc(s.thanksgiving||'Not announced')}</span><span>Black Friday hours: ${esc(s.bf_hours||'Not announced')}</span></div>
<p><a class="go" href="${esc(s.url)}" ${out}>Go to ${esc(s.link_label)} &#8599;</a></p>
<h2>Sale dates</h2><ul class="ev">${s.events.map(e=>`<li><b>${esc(e.name)}: ${esc(e.dates)}</b>${e.note?`<span>${esc(e.note)}</span>`:''}</li>`).join('')}</ul>
<h2>Advertised doorbusters</h2><div class="ac">${hlList(s.highlights,20)}</div>
<p class="note">${disclaimer}</p>
<p class="m">Sources: ${s.sources.map(([n,u])=>`<a href="${esc(u)}" ${out}>${esc(n)}</a>`).join(', ')}</p>
<p><strong>More Black Friday ads:</strong> ${others}</p>
${foot}`;
    await mkdir(path.join(pub,p),{recursive:true});await writeFile(path.join(pub,p,'index.html'),html);pages.push(p);
  }

  // Home page strip
  const strip=`<style>.adstrip{margin:18px 0 6px}.adstrip .hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}.adstrip h2{font:700 clamp(20px,3vw,26px)/1.1 var(--f-display);margin:0}.adstrip .hd a{font-weight:700;color:var(--brand)}
.adstrip p.s{margin:4px 0 12px;color:var(--muted,#58665C);font-size:14px}
.adrail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(220px,250px);gap:12px;overflow-x:auto;padding:2px 2px 10px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.adc{scroll-snap-align:start;display:flex;flex-direction:column;gap:8px;background:var(--surface,#fff);border:1px solid var(--line,#DDE3DA);border-radius:16px;padding:14px;color:inherit;text-decoration:none;min-width:0}
.adc:hover{border-color:var(--brand)}.adc .t{display:flex;gap:10px;align-items:center}.adc .t b{font-size:16px;line-height:1.2}.adc .t small{display:block;font-size:12px;opacity:.7}
.adc .mono{width:38px;height:38px;border-radius:10px;font-size:14px;flex:none;display:grid;place-items:center;font-weight:800;color:#fff}
.adc .db{font-size:13px;line-height:1.35;border-top:1px dashed var(--line,#DDE3DA);padding-top:8px}.adc .db em{font-style:normal;font-weight:800;color:var(--deal)}
${ADS_CSS.split('\n').filter(l=>l.startsWith('.bd')||l.startsWith('@media')).join('\n')}</style>
<section class="adstrip" aria-label="Black Friday ads by store"><div class="hd"><h2>Black Friday ads from ${stores.length} stores</h2><a href="${hub}">See every ad &rarr;</a></div>
<p class="s">Sale dates, Thanksgiving hours and each store's headline doorbusters.</p>
<div class="adrail">${stores.map(s=>{const h=s.highlights[0];return `<a class="adc" href="${hub}${s.slug}/"><span class="t"><span class="mono" style="background:${color(s.store)}" aria-hidden="true">${esc(initials(s.store))}</span><span><b>${esc(s.store)}</b><small>${esc(range(s.main))}</small></span></span><span>${badge(s.main)}</span>${h?`<span class="db">${esc(h.item)} <em>${esc(h.price)}</em></span>`:`<span class="db">${esc(s.main.name)}</span>`}</a>`}).join('')}</div></section>
${liveJs}`;
  return {pages,strip};
}
