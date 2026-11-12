import "server-only";
import { EXCURSIONS,POLICY,getPort } from "@/lib/domain/catalog";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { parsePlan,quotePlan,PlanInputError } from "./model";

export async function evaluatePlan(input:unknown){
 const request=parsePlan(input,POLICY);const port=getPort(request.portId);if(!port)throw new PlanInputError('Choose a known port.');
 const snapshot=await availabilitySnapshot();
 return quotePlan(request,port,EXCURSIONS.map(excursion=>{
  const s=snapshot.find(s=>s.excursionId===excursion.id)!;
  return {excursion,seatsLeft:s.seatsLeft,onSale:s.onSale,disruption:s.disruption};
 }),POLICY);
}
