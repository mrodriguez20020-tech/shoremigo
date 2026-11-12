import type { Metadata } from "next";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { ItineraryPlanner } from "@/components/itinerary/ItineraryPlanner";
import "./planner.css";
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Plan your port day · ShoreMigo'};
export default async function PlanPage({searchParams}:{searchParams:Promise<{add?:string}>}){
 const [snapshot,params]=await Promise.all([availabilitySnapshot(),searchParams]);
 return <div className="planner-shell"><SceneRoute scene="shade"/><ItineraryPlanner initialAdd={typeof params.add==='string'?params.add:null} availability={snapshot.map(s=>({excursionId:s.excursionId,seatsLeft:s.seatsLeft,onSale:s.onSale}))}/></div>;
}
