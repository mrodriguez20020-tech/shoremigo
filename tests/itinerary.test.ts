import {beforeEach,describe,expect,it} from 'vitest';
import {EXCURSIONS,POLICY,getExcursion,getPort} from '@/lib/domain/catalog';
import {parsePlan,quotePlan,type PlanCandidate} from '@/lib/itinerary/model';
import {evaluatePlan} from '@/lib/itinerary/service';
import {__resetStoreForTests,read} from '@/lib/server/store';
import {createBooking,updateInventory} from '@/lib/server/bookings';
const port=getPort('cozumel')!;
const candidates=():PlanCandidate[]=>EXCURSIONS.map(excursion=>({excursion,seatsLeft:excursion.capacity,onSale:true}));
const request=(ids:string[],guests=2)=>({portId:port.id,guests,items:ids.map(excursionId=>({excursionId}))});
const reef='coz-palancar-snorkel',afternoon='coz-afternoon-reef',cacao='coz-cacao';
beforeEach(()=>__resetStoreForTests());
describe('deterministic multi-excursion LastBoard planning',()=>{
 it('uses chronological order and pier transfers for a valid two-tour day',()=>{
  const q=quotePlan(request([afternoon,reef]),port,candidates(),POLICY);
  expect(q.feasible).toBe(true);expect(q.items.map(i=>i.excursionId)).toEqual([reef,afternoon]);
  expect(q.items[1].readyAfterPrevious).toBe(12*60+50);expect(q.items[1].connectionMarginMin).toBe(10);
  expect(q.estimatedTotalCents).toBe((getExcursion(reef)!.priceCents+getExcursion(afternoon)!.priceCents)*2);
  expect(q).toMatchObject({inventoryHeld:false,requiresSeparateCheckout:true,transferPolicy:'return-to-pier'});
 });
 it('rejects a true overlap and reports its two items',()=>{
  const q=quotePlan(request([reef,cacao]),port,candidates(),POLICY);expect(q.feasible).toBe(false);
  expect(q.conflicts).toContainEqual(expect.objectContaining({kind:'overlap',itemIds:[reef+':default',cacao+':default']}));
 });
 it('rejects a missing transfer even when the excursion activities do not overlap',()=>{
  const list=candidates();list.find(c=>c.excursion.id===cacao)!.excursion={...getExcursion(cacao)!,start:'12:40'};
  const q=quotePlan(request([reef,cacao]),port,list,POLICY);expect(q.conflicts.some(c=>c.kind==='transfer')).toBe(true);
 });
 it('checks every earlier segment, including a long enclosing tour',()=>{
  const list=candidates();list.find(c=>c.excursion.id===reef)!.excursion={...getExcursion(reef)!,durationMin:360};
  const q=quotePlan(request([afternoon,cacao,reef]),port,list,POLICY);
  expect(q.conflicts.some(c=>c.itemIds.join('|')===reef+':default|'+afternoon+':default')).toBe(true);
 });
 it('never drops the per-segment ship-delay and return-cutoff checks',()=>{
  const list=candidates().map(c=>({...c,disruption:{delayMin:120,allAboardExtensionMin:0}}));
  const q=quotePlan(request([reef,afternoon]),port,list,POLICY);expect(q.conflicts.some(c=>c.kind==='port-window'&&c.itemIds.includes(reef+':default'))).toBe(true);
  const late=candidates();late.find(c=>c.excursion.id===afternoon)!.excursion={...getExcursion(afternoon)!,start:'17:00'};
  expect(quotePlan(request([afternoon]),port,late,POLICY).conflicts.some(c=>c.kind==='port-window')).toBe(true);
 });
 it('uses the tender allowance on every item and retains the flexible-window bound',()=>{
  const p=getPort('grand-cayman')!;const c=candidates().filter(c=>c.excursion.portId===p.id).map(c=>({...c,disruption:{delayMin:240}}));
  const q=quotePlan({portId:p.id,guests:1,items:[{excursionId:'gcm-seven-mile'}]},p,c,POLICY);
  expect(q.items[0].feasibility.timeline.readyAtMeetingPoint).toBeGreaterThan(q.items[0].feasibility.timeline.shipArrive+POLICY.disembarkMin);
  expect(q.conflicts.some(c=>c.kind==='port-window')).toBe(true);
 });
 it('rejects duplicate, unknown, mixed-port and invalid party input',()=>{
  expect(()=>parsePlan(request([reef,reef]),POLICY)).toThrow(/already/);
  for(const guests of [0,9,1.2,NaN])expect(()=>parsePlan(request([reef],guests),POLICY)).toThrow();
  for(const id of ['unknown','roa-canopy'])expect(()=>quotePlan(request([id]),port,candidates(),POLICY)).toThrow();
  expect(()=>quotePlan({...request([reef]),items:[{excursionId:reef,departureId:'invented'}]},port,candidates(),POLICY)).toThrow();
 });
 it('treats prices as server-owned and current inventory as a separate gate',()=>{
  const input={...request([reef]),totalCents:1,items:[{excursionId:reef,unitPriceCents:1}]};
  const c=candidates();c.find(c=>c.excursion.id===reef)!.seatsLeft=1;
  const q=quotePlan(parsePlan(input,POLICY),port,c,POLICY);expect(q.items[0].unitPriceCents).toBe(8900);expect(q.feasible).toBe(false);
  expect(q.conflicts[0].kind).toBe('availability');
 });
 it('returns identical quotes under input permutation and supports an empty plan',()=>{
  expect(quotePlan(request([reef,afternoon]),port,candidates(),POLICY)).toEqual(quotePlan(request([afternoon,reef]),port,candidates(),POLICY));
  expect(quotePlan(request([]),port,candidates(),POLICY)).toMatchObject({feasible:true,items:[],estimatedTotalCents:0});
 });
});
describe('read-only planner service with actual local inventory',()=>{
 it('reads operator closure and held seats without reserving or charging',async()=>{
  await createBooking({excursionId:reef,guests:3,firstName:'Local',lastName:'Test',email:'local@example.com'});
  await updateInventory({excursionId:afternoon,open:false});
  const before=await read(db=>JSON.stringify(db));
  const results=await Promise.all(Array.from({length:20},()=>evaluatePlan(request([reef,afternoon]))));
  expect(results.every(q=>!q.feasible&&q.items[0].seatsLeft===getExcursion(reef)!.capacity-3)).toBe(true);
  expect(await read(db=>JSON.stringify(db))).toBe(before);
 });
});
