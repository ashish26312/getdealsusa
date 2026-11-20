#!/usr/bin/env node
// Builds public/deals.json from any number of store feeds (CSV, TSV or JSON) plus a manual sheet,
// and keeps a daily price history so the site can tell a real deal from a fake markdown.
// Usage: node scripts/build-deals.mjs [--config data/feeds.config.json] [--out public/deals.json]
//        [--history data/history.json] [--now 2026-11-21T09:00:00Z]   (--now is for testing)
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>-1?process.argv[i+1]:d};
const cfgPath=path.resolve(root,arg('config','data/feeds.config.json'));
const outPath=path.resolve(root,arg('out','public/deals.json'));
const histPath=path.resolve(root,arg('history','data/history.json'));
const now=new Date(arg('now',new Date().toISOString()));
const iso=now.toISOString(),today=iso.slice(0,10);

const CATS=['tech','kitchen','home','fashion','toys','beauty','outdoors','hosting'];
const RULES=[
 ['hosting',/turkey|thanksgiving|cranberr|napkin|table ?linen|gravy|serving|platter|carving|centerpiece/i],
 ['kitchen',/air fryer|blender|mixer|cookware|skillet|\bpan\b|knife|dutch oven|coffee|espresso|kettle|toaster|slow cooker|instant pot|kitchen|bakeware/i],
 ['tech',/\btv\b|television|laptop|tablet|headphone|earbud|speaker|monitor|camera|console|phone|router|smart plug|streaming|charger|drone|gaming|keyboard|\bssd\b|\busb\b|soundbar|smartwatch/i],
 ['beauty',/skincare|makeup|perfume|fragrance|hair dryer|toothbrush|shampoo|serum|lotion|beauty/i],
 ['toys',/\btoys?\b|lego|building block|board game|puzzle|plush|doll|remote control|\bkids?\b/i],
 ['fashion',/jacket|coat|parka|sweater|jeans|dress|shirt|hoodie|leggings|sneaker|shoes|boots|handbag/i],
 ['outdoors',/tent|camping|hiking|backpack|cooler|bike|grill|fishing|kayak|sleeping bag|water bottle/i],
 ['home',/vacuum|sheet|pillow|blanket|mattress|furniture|lamp|rug|curtain|drill|tool|storage|decor|bedding/i]];
const categorize=(col,title)=>{
  const c=String(col||'').trim().toLowerCase();if(CATS.includes(c))return c;
  const t=`${col||''} ${title}`;for(const [k,re] of RULES)if(re.test(t))return k;
  return 'home';
};

function parseDelimited(text,d=','){
  const rows=[];let row=[],f='',q=false;
  const endRow=()=>{row.push(f);f='';if(row.some(x=>x!==''))rows.push(row);row=[]};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===d){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;endRow()}
    else f+=c;
  }
  if(f!==''||row.length)endRow();
  const [head,...body]=rows;if(!head)return [];
  const keys=head.map(k=>k.replace(/^﻿/,'').trim());
  return body.map(r=>Object.fromEntries(keys.map((k,i)=>[k,(r[i]??'').trim()])));
}
const get=(o,p)=>String(p).split('.').reduce((a,k)=>a==null?a:a[k],o);
const num=s=>{const n=parseFloat(String(s??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0};
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
const isoOrNull=s=>{const t=Date.parse(s);return s&&Number.isFinite(t)?new Date(t).toISOString():null};
const expand=s=>String(s).replace(/\$\{(\w+)\}/g,(m,k)=>process.env[k]??'');

// Feed URLs often carry access tokens, so they are never printed.
async function load(source){
  const s=expand(source);
  if(/^https:\/\//.test(s)){
    const r=await fetch(s,{headers:{'user-agent':'getdealsusa-feed/1.0'}});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.text();
  }
  if(!s)throw new Error('source is empty (is the environment variable set?)');
  return readFile(path.resolve(root,s),'utf8');
}

function toProduct(raw,feed,cfg){
  const m=feed.map||{},g=k=>m[k]?get(raw,m[k]):undefined;
  const store=feed.store||(feed.storeColumn?raw[feed.storeColumn]:'');
  const title=String(g('title')||'').trim(),price=num(g('price')),was=num(g('was'));
  const url=String(g('url')||'').trim(),image=String(g('image')||'').trim();
  if(!store||!title)return {skip:'missing store or title'};
  if(price<=0||was<=price)return {skip:'no markdown'};
  if(Math.round((1-price/was)*100)<cfg.minDiscountPct)return {skip:'discount under minimum'};
  if(!/^https:\/\//.test(url)&&!cfg.demo)return {skip:'no https store link'};
  return {id:slug(store)+'-'+slug(g('id')||title),title,cat:categorize(g('category'),title),store,price,was,
    image:/^https:\/\//.test(image)?image:'',url:/^https:\/\//.test(url)?url:'',ends:isoOrNull(g('ends')),
    rating:num(g('rating')),tags:String(g('tags')||'').toLowerCase(),checked:isoOrNull(g('checked'))};
}

const cfg={minDiscountPct:10,maxPerStore:60,maxTotal:300,demo:false,feeds:[],...JSON.parse(await readFile(cfgPath,'utf8'))};
const hist=existsSync(histPath)?JSON.parse(await readFile(histPath,'utf8')):{};
const all=new Map(),report=[];
let failed=0;

for(const feed of cfg.feeds.filter(f=>f.enabled!==false)){
  const name=feed.name||feed.store||'feed',skipped={};let rows=[],kept=0;
  try{
    const text=await load(feed.source),fmt=feed.format||'csv';
    if(fmt==='json'){const j=JSON.parse(text),a=feed.itemsPath?get(j,feed.itemsPath):j;rows=Array.isArray(a)?a:[]}
    else rows=parseDelimited(text,fmt==='tsv'?'\t':',');
  }catch(e){failed++;report.push(`${name}: FAILED (${e.message})`);continue}
  for(const raw of rows){
    const p=toProduct(raw,feed,cfg);
    if(p.skip){skipped[p.skip]=(skipped[p.skip]||0)+1;continue}
    if(!all.has(p.id)){all.set(p.id,p);kept++}
  }
  const why=Object.entries(skipped).map(([k,v])=>`${v} ${k}`).join(', ');
  report.push(`${name}: ${rows.length} rows, ${kept} kept${why?' (skipped: '+why+')':''}`);
}
console.log(report.join('\n'));
if(!all.size){console.error('No usable products found; deals.json was not changed.');process.exit(1)}

// Daily history: each past day keeps its lowest price; today keeps the current price.
for(const p of all.values()){
  const h=(hist[p.id]??={days:{}}),d=(h.days[today]??={lo:p.price,last:p.price});
  d.lo=Math.min(d.lo,p.price);d.last=p.price;h.seen=today;
}
const cutoff=new Date(now.getTime()-120*864e5).toISOString().slice(0,10);
const stale=new Date(now.getTime()-30*864e5).toISOString().slice(0,10);
for(const [id,h] of Object.entries(hist)){
  for(const k of Object.keys(h.days))if(k<cutoff)delete h.days[k];
  if(h.seen<stale)delete hist[id];
}
const series=h=>Object.keys(h.days).sort().slice(-90).map(k=>[k,k===today?h.days[k].last:h.days[k].lo]);

const byDiscount=(a,b)=>(1-b.price/b.was)-(1-a.price/a.was);
const perStore={};
for(const p of [...all.values()].sort(byDiscount))(perStore[p.store]??=[]).push(p);
const list=Object.values(perStore).flatMap(a=>a.slice(0,cfg.maxPerStore)).sort(byDiscount).slice(0,cfg.maxTotal);

const deals=list.map(p=>({id:p.id,title:p.title,cat:p.cat,store:p.store,price:p.price,was:p.was,image:p.image,url:p.url,
  ends:p.ends,rating:p.rating,tags:p.tags,checked:p.checked||iso,history:series(hist[p.id])}));
const staleChecks=deals.filter(d=>now-Date.parse(d.checked)>864e5).length;
if(staleChecks)console.warn(`Warning: ${staleChecks} deal(s) have a "checked" time older than 24 hours. Re-check those prices.`);
const latest=deals.map(d=>d.checked).sort().pop()||iso;
await mkdir(path.dirname(outPath),{recursive:true});
await mkdir(path.dirname(histPath),{recursive:true});
await writeFile(outPath,'{"updated":"'+latest+'","demo":'+!!cfg.demo+',"deals":[\n'+deals.map(d=>JSON.stringify(d)).join(',\n')+'\n]}\n');
await writeFile(histPath,JSON.stringify(hist));
console.log(`Wrote ${deals.length} deals from ${new Set(deals.map(d=>d.store)).size} stores${failed?` (${failed} feed(s) failed)`:''}.`);
