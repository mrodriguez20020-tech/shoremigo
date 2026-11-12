import { describe,it,expect } from "vitest";
import { safeLaneX,safeCompactSpot,footprint,overlaps,type AvoidRect } from "@/components/migo/avoidance";
import { gaitAt,ANTICIPATION_MS,STRIDE_MS,CONTACT_FRACTION } from "@/components/migo/gait";
import { MIGO_RENDERER_CONTRACT } from "@/components/migo/rendererContract";
import { migoReducer,initialMigo } from "@/components/migo/machine";
import type { MigoEvent } from "@/components/migo/bus";

const viewport={width:1280,height:800};
describe("exact companion safe areas",()=>{
 it("finds a narrow legal interval without coarse 24-pixel sampling",()=>{
  const zones:AvoidRect[]=[{left:0,right:227,top:650,bottom:800},{left:492,right:1280,top:650,bottom:800}];
  const x=safeLaneX(280,124,viewport,zones);
  expect(x).not.toBeNull();expect(zones.some(z=>overlaps(footprint(x!,10,124,viewport),z))).toBe(false);
 });
 it("does not silently place a companion on a fully occupied lane",()=>{
  expect(safeLaneX(50,124,viewport,[{left:0,right:1280,top:640,bottom:800}])).toBeNull();
 });
 it("keeps tip-only subject zones out of the walking lane but still available to tips",()=>{
  expect(safeLaneX(50,124,viewport,[{left:0,right:1280,top:0,bottom:800,tipOnly:true}])).toBe(50);
 });
 it("moves a compact companion above controls or to the other side with full clearance",()=>{
  const v={width:390,height:844};const zones=[{left:250,right:390,top:680,bottom:844}];const spot=safeCompactSpot(84,v,zones);
  expect(spot).not.toBeNull();expect(zones.some(z=>overlaps(footprint(spot!.x,spot!.bottom,84,v),z))).toBe(false);
 });
 it("returns no spot if the entire usable viewport is protected",()=>{
  expect(safeCompactSpot(84,{width:320,height:700},[{left:0,right:320,top:0,bottom:700}])).toBeNull();
 });
});
describe("sprite cadence and non-financial renderer boundary",()=>{
 it("has zero travel in anticipation and holds root travel for each planted contact",()=>{
  expect(gaitAt(ANTICIPATION_MS-1).offset).toBe(0);
  const contact=ANTICIPATION_MS+STRIDE_MS*(CONTACT_FRACTION+.02);
  expect(gaitAt(contact).contact).toBe(true);expect(gaitAt(contact).offset).toBe(gaitAt(ANTICIPATION_MS+STRIDE_MS-1).offset);
 });
 it("can alternate the lead foot between odd-length bursts",()=>{
  const t=ANTICIPATION_MS+STRIDE_MS*.9;
  expect(gaitAt(t,124,0).frame).toBe(0);expect(gaitAt(t,124,1).frame).toBe(1);
  expect(gaitAt(t+STRIDE_MS,124,1).frame).toBe(0);
 });
 it("explicitly refuses to claim a rig or blinking in the sprite contract",()=>{
  expect(MIGO_RENDERER_CONTRACT.capabilities).toMatchObject({articulatedLimbs:false,blink:false,continuousTurns:false});
 });
 it("movement, contact, AI excitement and quotes never grant success celebration",()=>{
  const events:MigoEvent[]=[{type:"motion:contact",surface:"deck",foot:"left",source:"roam",step:0},{type:"motion:landed",surface:"deck"},{type:"concierge:replied",mood:"excited"},{type:"match:completed",count:3},{type:"suggest",key:"quote",text:"Prepared quote"}];
  for(const event of events)expect(migoReducer(initialMigo,event,1000).expression).not.toBe("celebrating");
  expect(migoReducer(initialMigo,{type:"booking:verified",ref:"SM-TEST"},1000).expression).toBe("celebrating");
  expect(migoReducer(initialMigo,{type:"rescue:resolved"},1000).expression).toBe("celebrating");
 });
});
