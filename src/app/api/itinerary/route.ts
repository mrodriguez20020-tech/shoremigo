import { evaluatePlan } from "@/lib/itinerary/service";
import { PlanInputError } from "@/lib/itinerary/model";
import { fail,ok } from "@/lib/server/http";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{return ok({quote:await evaluatePlan(await req.json()),quotedAt:new Date().toISOString(),demo:true},{headers:{'Cache-Control':'no-store'}});}
 catch(e){if(e instanceof PlanInputError||e instanceof SyntaxError)return ok({error:e.message,code:e instanceof PlanInputError?e.code:'invalid_json'},{status:400});return fail(e);}
}
