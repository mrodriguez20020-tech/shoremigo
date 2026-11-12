import { checkFeasibility } from "@/lib/domain/feasibility";
import { fmtMin } from "@/lib/domain/time";
import type { Excursion,Policy,PortCall,Disruption,Feasibility } from "@/lib/domain/types";

export interface PlanSelection { excursionId:string;departureId?:string }
export interface PlanRequest {portId:string;guests:number;items:PlanSelection[]}
export interface PlanCandidate {excursion:Excursion;departureId?:string;seatsLeft:number;onSale:boolean;disruption?:Pick<Disruption,'delayMin'|'allAboardExtensionMin'>|null}
export interface PlanConflict {kind:'overlap'|'transfer'|'port-window'|'availability';itemIds:string[];message:string}
export interface QuotedPlanItem {
 id:string;excursionId:string;departureId:string;title:string;guests:number;unitPriceCents:number;totalCents:number;seatsLeft:number;onSale:boolean;feasibility:Feasibility;
 /** Earliest meeting-point arrival after the previous excursion returns to the pier. */
 readyAfterPrevious:number|null;connectionMarginMin:number|null;
}
export interface PlanQuote {portId:string;guests:number;items:QuotedPlanItem[];conflicts:PlanConflict[];estimatedTotalCents:number;currency:'USD';feasible:boolean;inventoryHeld:false;requiresSeparateCheckout:true;transferPolicy:'return-to-pier';}
export class PlanInputError extends Error {constructor(message:string,public code='invalid_plan'){super(message)}}
export function parsePlan(input:unknown,policy:Policy):PlanRequest {
 if(!input||typeof input!=='object')throw new PlanInputError('Send a port, party size and planned excursions.');
 const v=input as Record<string,unknown>;
 if(typeof v.portId!=='string'||!v.portId||!Number.isInteger(v.guests)||Number(v.guests)<1||Number(v.guests)>policy.maxGuests)throw new PlanInputError(`Choose a port and 1–${policy.maxGuests} guests.`);
 if(!Array.isArray(v.items)||v.items.length>6)throw new PlanInputError('Plan up to six experiences per port day.');
 const items=v.items.map((raw:unknown):PlanSelection=>{
  if(!raw||typeof raw!=='object')throw new PlanInputError('Each planned item needs an excursion.');
  const r=raw as Record<string,unknown>;
  if(typeof r.excursionId!=='string'||r.excursionId.length>100||!r.excursionId || (r.departureId!==undefined&&(typeof r.departureId!=='string'||r.departureId.length>80)))throw new PlanInputError('Invalid excursion or departure selection.');
  return {excursionId:r.excursionId,...(r.departureId===undefined?{}:{departureId:r.departureId as string})};
 });
 const keys=items.map(i=>i.excursionId+':'+(i.departureId??'default'));if(new Set(keys).size!==keys.length)throw new PlanInputError('That departure is already in your plan.');
 return {portId:v.portId,guests:Number(v.guests),items};
}
/** Deterministic planning only. Prices/seats come from server candidates; a quote never holds inventory. */
export function quotePlan(request:PlanRequest,port:PortCall,candidates:PlanCandidate[],policy:Policy):PlanQuote {
 if(request.portId!==port.id)throw new PlanInputError('Unknown port.');
 const conflicts:PlanConflict[]=[];
 const items=request.items.map((s):QuotedPlanItem=>{
  const c=candidates.find(c=>c.excursion.id===s.excursionId&&(c.departureId??'default')===(s.departureId??'default'));
  if(!c||c.excursion.portId!==port.id)throw new PlanInputError('An excursion or departure is not available for this port.');
  const e=c.excursion;const feasibility=checkFeasibility(port,e,policy,{delayMin:c.disruption?.delayMin??0,allAboardExtensionMin:c.disruption?.allAboardExtensionMin??0});
  const id=e.id+':'+(c.departureId??'default');
  if(feasibility.status==='infeasible')conflicts.push({kind:'port-window',itemIds:[id],message:`${e.title}: ${feasibility.reasons.join(' ')}`});
  if(!c.onSale||c.seatsLeft<request.guests)conflicts.push({kind:'availability',itemIds:[id],message:`${e.title}: ${c.onSale?`only ${c.seatsLeft} seats are currently available`:'not on sale'}. Nothing has been reserved.`});
  return {id,excursionId:e.id,departureId:c.departureId??'default',title:e.title,guests:request.guests,unitPriceCents:e.priceCents,totalCents:e.priceCents*request.guests,seatsLeft:c.seatsLeft,onSale:c.onSale,feasibility,readyAfterPrevious:null,connectionMarginMin:null};
 }).sort((a,b)=>a.feasibility.timeline.departs-b.feasibility.timeline.departs||a.id.localeCompare(b.id));
 for(let i=1;i<items.length;i++){
  const current=items[i];
  // Check every earlier segment, not just the previous row: a long excursion can contain several shorter ones.
  for(let j=0;j<i;j++){
   const previous=items[j];const e=candidates.find(c=>c.excursion.id===current.excursionId&&(c.departureId??'default')===current.departureId)!.excursion;
   const ready=previous.feasibility.timeline.backAtPier+e.transferMin;
   const margin=current.feasibility.timeline.departs-ready;
   if(current.readyAfterPrevious===null||ready>current.readyAfterPrevious){current.readyAfterPrevious=ready;current.connectionMarginMin=margin;}
   if(margin<0)conflicts.push({kind:previous.feasibility.timeline.ends>current.feasibility.timeline.departs?'overlap':'transfer',itemIds:[previous.id,current.id],message:`${previous.title} → ${current.title}: return to the pier and transfer would get you ready at ${fmtMin(ready)}, after the ${fmtMin(current.feasibility.timeline.departs)} departure. Remove an item or choose another time.`});
  }
 }
 return {portId:port.id,guests:request.guests,items,conflicts,estimatedTotalCents:items.reduce((sum,i)=>sum+i.totalCents,0),currency:'USD',feasible:conflicts.length===0,inventoryHeld:false,requiresSeparateCheckout:true,transferPolicy:'return-to-pier'};
}
