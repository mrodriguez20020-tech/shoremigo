"use client";

import { useEffect,useRef,useState } from "react";
import { EXCURSIONS,POLICY,PORTS,getExcursion,getPort } from "@/lib/domain/catalog";
import { fmtMin,fmtUsd } from "@/lib/domain/time";
import type { PlanQuote,PlanSelection } from "@/lib/itinerary/model";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { LastBoardTimeline } from "@/components/excursion/LastBoardTimeline";
import { TideLink } from "@/components/transition/TideTransition";

type Availability={excursionId:string;seatsLeft:number;onSale:boolean};
interface SavedPlan {version:1;portId:string;guests:number;remember:boolean;days:Record<string,PlanSelection[]>}
const KEY='sm.itinerary.v1';
const fresh:SavedPlan={version:1,portId:'cozumel',guests:2,remember:false,days:{}};
export function ItineraryPlanner({initialAdd,availability}:{initialAdd:string|null;availability:Availability[]}){
 const [plan,setPlan]=useState<SavedPlan>(fresh);const [ready,setReady]=useState(false);const [quote,setQuote]=useState<PlanQuote|null>(null);
 const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [quotedAt,setQuotedAt]=useState<string|null>(null);
 const [retry,setRetry]=useState(0);
 const generation=useRef(0);const items=plan.days[plan.portId]??[];const selectionKey=JSON.stringify(items);
 useEffect(()=>{
  let restored:SavedPlan=fresh;
  try{
   const raw=localStorage.getItem(KEY)??sessionStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed.version===1&&PORTS.some(p=>p.id===parsed.portId)&&Number.isInteger(parsed.guests)&&parsed.guests>=1&&parsed.guests<=POLICY.maxGuests&&parsed.days&&typeof parsed.days==='object'){
    const days:Record<string,PlanSelection[]>={};for(const p of PORTS){const source=parsed.days[p.id];if(Array.isArray(source))days[p.id]=source.filter(i=>i&&typeof i.excursionId==='string'&&getExcursion(i.excursionId)?.portId===p.id).slice(0,6).map(i=>({excursionId:i.excursionId,...(typeof i.departureId==='string'?{departureId:i.departureId}:{})}));}
    restored={version:1,portId:parsed.portId,guests:parsed.guests,days,remember:parsed.remember===true};
   }}
  }catch{/* A browser without storage still gets a fully usable planner. */}
  const add=initialAdd?getExcursion(initialAdd):null;
  if(add){const existing=restored.days[add.portId]??[];restored={...restored,portId:add.portId,days:{...restored.days,[add.portId]:existing.some(i=>i.excursionId===add.id)?existing:[...existing,{excursionId:add.id}].slice(0,6)}};}
  setPlan(restored);setReady(true);
 },[initialAdd]);
 useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(KEY,JSON.stringify(plan));if(plan.remember)localStorage.setItem(KEY,JSON.stringify(plan));else localStorage.removeItem(KEY);}catch{/* no persistence is required to plan or reserve */}},[plan,ready]);
 useEffect(()=>{
  if(!ready)return;const controller=new AbortController();const current=++generation.current;
  setBusy(true);setError(null);setQuote(null);
  const timer=setTimeout(()=>{
   fetch('/api/itinerary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({portId:plan.portId,guests:plan.guests,items:JSON.parse(selectionKey)}),signal:controller.signal})
    .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error??'Could not check this plan.');if(current===generation.current){setQuote(data.quote);setQuotedAt(data.quotedAt);}})
    .catch(e=>{if(e.name!=='AbortError'&&current===generation.current)setError(e.message);})
    .finally(()=>{if(current===generation.current&&!controller.signal.aborted)setBusy(false);});
  },120);return()=>{clearTimeout(timer);controller.abort();};
 },[plan.portId,plan.guests,selectionKey,ready,retry]);
 function updateItems(next:PlanSelection[]){setPlan(p=>({...p,days:{...p.days,[p.portId]:next}}));}
 const candidates=EXCURSIONS.filter(e=>e.portId===plan.portId);const port=getPort(plan.portId)!;
 return <section className="planner-page">
  <header className="planner-heading"><div><p className="eyebrow">My Trip / Port-day planner</p><h1>A little more adventure.<br /><em>Room to get back.</em></h1><p>Bring a few experiences together. LastBoard checks the whole day, including a return to the pier between tours. These are plans, not paid bookings. Flexible tours use their earliest checked departure; later starts must be offered explicitly before they can be booked.</p></div><TideLink href="/trip" className="planner-text-link">Open a verified booking →</TideLink></header>
  <div className="planner-controls" data-migo-avoid>
   <label>Port day<select value={plan.portId} onChange={e=>setPlan(p=>({...p,portId:e.target.value}))}>{PORTS.map(p=><option value={p.id} key={p.id}>{p.name} · {(plan.days[p.id]??[]).length} planned</option>)}</select></label>
   <label>Guests<input type="number" min={1} max={POLICY.maxGuests} value={plan.guests} onChange={e=>setPlan(p=>({...p,guests:Math.max(1,Math.min(POLICY.maxGuests,Number(e.target.value)||1))}))}/></label>
   <label className="planner-remember"><input type="checkbox" checked={plan.remember} onChange={e=>setPlan(p=>({...p,remember:e.target.checked}))}/>Remember this plan on this device</label>
  </div>
  <p className="planner-policy">{port.name} · {port.date} · scheduled {fmtMin(Number(port.arrive.slice(0,2))*60+Number(port.arrive.slice(3)))} arrival · all aboard {fmtMin(Number(port.allAboard.slice(0,2))*60+Number(port.allAboard.slice(3)))}. A 60-minute return buffer applies. Fictional sailing and excursions; no live tracking or return guarantee.</p>
  <div className="planner-columns">
   <section aria-labelledby="planner-discover"><p className="eyebrow">Discover</p><h2 id="planner-discover">Add to your port day</h2><div className="planner-candidates">{candidates.map(e=>{
    const stock=availability.find(s=>s.excursionId===e.id);const included=items.some(i=>i.excursionId===e.id);return <article className="planner-candidate" key={e.id}>
     <div className="planner-candidate-art"><ExcursionArt art={e.art}/></div><div><p className="eyebrow">{e.category} · demo excursion</p><h3>{e.title}</h3><p>{e.tagline}</p><p className="planner-candidate-price">{fmtUsd(e.priceCents)} / guest · catalog estimate</p><p>{stock?.onSale?`${stock.seatsLeft} seats available at page load`:'Not currently on sale'}</p><div className="planner-candidate-actions" data-migo-avoid><button type="button" disabled={!ready||included||items.length>=6||!stock?.onSale} onClick={()=>updateItems([...items,{excursionId:e.id}])}>{included?'In your plan':`Add ${e.title}`}</button><TideLink href={`/excursions/${e.id}?guests=${plan.guests}`}>Details →</TideLink></div></div>
    </article>;
   })}</div></section>
   <section className="planner-review" aria-labelledby="planner-review-title" data-migo-avoid><div className="planner-review-heading"><div><p className="eyebrow">Review</p><h2 id="planner-review-title">Your {port.name} plan</h2></div><span>{items.length} / 6</span></div>
    <p className="planner-disclosure">Planned only · no seats held · nothing charged. Each excursion has its own review and customer-approved PayPal sandbox checkout.</p>
    <div aria-live="polite" aria-atomic="true" className="planner-check-status">{busy?'Checking the whole day…':error?<p role="alert">{error}</p>:quote&&items.length>0?<p>{quote.feasible?'Your selected plan fits the checked timings.':`${quote.conflicts.length} timing or availability issue${quote.conflicts.length===1?'':'s'} to review.`}</p>:<p>Add an experience to begin. Each port keeps its own plan.</p>}</div>
    {error&&<button type="button" onClick={()=>setRetry(n=>n+1)}>Retry timing check</button>}
    {quote&&quote.conflicts.length>0&&<ul className="planner-conflicts" aria-label="Plan conflicts">{quote.conflicts.map((c,i)=><li key={i}><strong>{c.kind==='transfer'?'Transfer conflict':c.kind==='overlap'?'Overlapping experiences':c.kind==='availability'?'Availability changed':'Port window'}</strong><p>{c.message}</p></li>)}</ul>}
    <ol className="planner-items">{(quote?.items??items.map(i=>({id:i.excursionId,excursionId:i.excursionId,departureId:i.departureId??'default',title:getExcursion(i.excursionId)?.title??i.excursionId}))).map((item,i)=>{
      const detail=quote?.items.find(q=>q.id===item.id);
      return <li key={item.id}><div className="planner-item-heading"><span>{String(i+1).padStart(2,'0')}</span><h3>{item.title}</h3><button type="button" aria-label={`Remove ${item.title}`} onClick={()=>updateItems(items.filter(s=>!(s.excursionId===item.excursionId&&(s.departureId??'default')===item.departureId)))}>Remove</button></div>
       {detail&&<><p>{fmtUsd(detail.totalCents)} for {plan.guests} guests · {detail.seatsLeft} current seats</p><LastBoardTimeline f={detail.feasibility}/>{detail.connectionMarginMin!==null&&<p className="planner-connection">{detail.connectionMarginMin>=0?`${detail.connectionMarginMin} minutes connection margin via the pier`:'This connection does not fit'}</p>}
       <TideLink href={`/excursions/${item.excursionId}?guests=${plan.guests}${item.departureId==='default'?'':`&departure=${encodeURIComponent(item.departureId)}`}`} aria-disabled={!quote?.feasible} tabIndex={quote?.feasible?0:-1} onClick={e=>{if(!quote?.feasible)e.preventDefault();}} className="planner-reserve">Review &amp; reserve {item.title} →</TideLink></>}
      </li>;
    })}</ol>
    {quote&&<div className="planner-total"><span>Estimated port-day total<br/><small>{plan.guests} guests · USD · not a paid balance</small></span><strong>{fmtUsd(quote.estimatedTotalCents)}</strong></div>}
    {quotedAt&&<p className="planner-disclosure">Checked {new Date(quotedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Prices, timing and inventory are checked again before each booking. Existing verified bookings are shown separately in My Trip and are not automatically added here.</p>}
   </section>
  </div>
 </section>;
}
