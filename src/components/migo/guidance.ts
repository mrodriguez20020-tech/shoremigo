import type { MigoEvent } from "./bus";
type Suggestion=Extract<MigoEvent,{type:"suggest"}>;
/** Help is contextual and optional; it never asserts stock, a charge, or a booking outcome. */
export function guidanceForRoute(path:string):Suggestion|null {
 if(path==='/taste')return {type:'suggest',key:'culinary-guide-v1',text:'A dish caught your eye? I can explain the local flavours and keep sample menus separate from bookable food tours.',prompt:'Use the dining guide to explain local dishes and sample-menu status. Help me find food excursions that fit my port schedule.',cta:'Talk food with Migo'};
 if(path.startsWith('/excursions/'))return {type:'suggest',key:'excursion-timing-guide-v1',text:'Before you reserve, look at the LastBoard timeline. I can help explain the port window and your options.',prompt:'Explain the LastBoard timing for the excursion I am viewing. Use the catalog and port schedule; do not assume I have booked or paid.',cta:'Explain the timing'};
 if(path==='/trip'||path==='/bookings')return {type:'suggest',key:'verified-trip-guide-v1',text:'Have a booking? Verify it with your reference and last name to see its recorded payment and Trip Rescue options.',prompt:'Help me understand my booking and payment status. Request verification before showing personal details.',cta:'Help with my trip'};
 return null;
}
