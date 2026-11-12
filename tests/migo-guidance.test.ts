import { it,expect } from "vitest";
import { guidanceForRoute } from "@/components/migo/guidance";
it('never puts proactive financial or operator guidance in checkout/protected operations',()=>{
 expect(guidanceForRoute('/checkout/booking-id')).toBeNull();expect(guidanceForRoute('/operator')).toBeNull();
 expect(guidanceForRoute('/trip')?.text).toMatch(/Verify/);
 expect(guidanceForRoute('/taste')?.text).toMatch(/sample menus/);
 expect(guidanceForRoute('/excursions/coz-cacao')?.prompt).toMatch(/do not assume I have booked or paid/);
});
