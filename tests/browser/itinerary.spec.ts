import {expect,test,type Page} from '@playwright/test';
const reef='Palancar Reef Morning Snorkel';
async function visit(page:Page,path='/trip/plan'){
 await page.addInitScript(()=>{sessionStorage.setItem('sm.intro','1');sessionStorage.setItem('sm_prefs',JSON.stringify({lang:'en',country:null,remember:false,welcomed:true}));localStorage.setItem('sm.migo.v1',JSON.stringify({prefs:{proactive:false,motionPaused:false},hidden:false}));});
 await page.goto(path);await expect(page.getByRole('heading',{name:/Your Cozumel plan/})).toBeVisible();
}
async function add(page:Page,name:string){await page.getByRole('button',{name:'Add '+name,exact:true}).click();}
test('two experiences form a reviewed day with server prices and explicit separate checkout',async({page})=>{
 await visit(page);await add(page,reef);await add(page,'Afternoon Reef & Sandbar');
 const review=page.getByRole('region',{name:'Your Cozumel plan'});
 await expect(review).toContainText('Your selected plan fits');await expect(review).toContainText('10 minutes connection margin');
 await expect(review.locator('.planner-total')).toContainText('$336.00');
 await expect(review).toContainText('no seats held');await expect(review.getByRole('link',{name:/Review & reserve/})).toHaveCount(2);
 await review.getByRole('link',{name:'Review & reserve '+reef+' →',exact:true}).click();await expect(page).toHaveURL(/excursions\/coz-palancar-snorkel\?guests=2/);
 await expect(page.getByRole('button',{name:'Continue to secure checkout'})).toBeVisible();
});
test('confirmed overlap blocks the review links until an item is removed',async({page})=>{
 await visit(page);await add(page,reef);await add(page,'Mayan Cacao Ceremony & Chocolate Workshop');
 const review=page.getByRole('region',{name:'Your Cozumel plan'});await expect(review.getByRole('list',{name:'Plan conflicts'})).toContainText('Overlapping experiences');
 await expect(review.getByRole('link',{name:/Review & reserve/}).first()).toHaveAttribute('aria-disabled','true');
 await page.getByRole('button',{name:'Remove Mayan Cacao Ceremony & Chocolate Workshop'}).click();await expect(review).toContainText('Your selected plan fits');
 await expect(review.getByRole('link',{name:/Review & reserve/})).toHaveAttribute('aria-disabled','false');
});
test('port plans and party size persist for the session; device storage requires opt in',async({page})=>{
 await visit(page);await add(page,reef);await page.getByRole('spinbutton',{name:'Guests',exact:true}).fill('3');
 await expect(page.locator('.planner-total')).toContainText('$267.00');
 expect(await page.evaluate(()=>localStorage.getItem('sm.itinerary.v1'))).toBeNull();
 await page.getByRole('combobox',{name:'Port day'}).selectOption('roatan');await expect(page.getByRole('heading',{name:'Your Roatán plan'})).toBeVisible();
 await page.getByRole('combobox',{name:'Port day'}).selectOption('cozumel');await expect(page.getByRole('button',{name:'Remove '+reef})).toBeVisible();
 await page.reload();await expect(page.getByRole('spinbutton',{name:'Guests',exact:true})).toHaveValue('3');
 await page.getByRole('checkbox',{name:'Remember this plan on this device'}).check();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sm.itinerary.v1')??'{}').remember)).toBe(true);
 await page.getByRole('checkbox',{name:'Remember this plan on this device'}).uncheck();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('sm.itinerary.v1'))).toBeNull();
});
test('quote errors offer a working retry without creating a booking',async({page})=>{
 let calls=0;await page.route('**/api/itinerary',route=>{calls++;return calls===1?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Local test outage'})}):route.continue();});
 await visit(page);await expect(page.locator('.planner-review').getByRole('alert')).toContainText('Local test outage');await page.getByRole('button',{name:'Retry timing check'}).click();
 await expect(page.locator('.planner-review').getByRole('alert')).toHaveCount(0);await add(page,reef);await expect(page.locator('.planner-review')).toContainText('Your selected plan fits');
 expect(calls).toBeGreaterThanOrEqual(2);
});
test('deep link adds the actual catalog excursion only once',async({page})=>{
 await visit(page,'/trip/plan?add=coz-cacao');await expect(page.getByRole('button',{name:'Remove Mayan Cacao Ceremony & Chocolate Workshop'})).toBeVisible();await page.reload();
 await expect(page.locator('.planner-items > li')).toHaveCount(1);
});
test('concurrent HTTP quotes are read-only; reject invented selections and forged prices',async({request})=>{
 const before=await (await request.get('/api/availability')).json();
 const responses=await Promise.all(Array.from({length:12},()=>request.post('/api/itinerary',{data:{portId:'cozumel',guests:2,items:[{excursionId:'coz-palancar-snorkel',unitPriceCents:1}],totalCents:1}})));
 for(const r of responses){expect(r.ok()).toBe(true);const body=await r.json();expect(body.quote.estimatedTotalCents).toBe(17800);expect(body.quote.inventoryHeld).toBe(false);}
 const after=await (await request.get('/api/availability')).json();expect(after).toEqual(before);
 for(const data of [{portId:'cozumel',guests:9,items:[]},{portId:'cozumel',guests:2,items:[{excursionId:'coz-palancar-snorkel',departureId:'invented'}]}])expect((await request.post('/api/itinerary',{data})).status()).toBe(400);
});
for(const [width,height]of[[320,700],[390,844],[820,1180],[1440,1000]])test(`planner controls and review are accessible at ${width}×${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});await visit(page);await add(page,reef);
 await expect(page.locator('.planner-review')).toContainText('Your selected plan fits');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 const link=page.getByRole('link',{name:/Review & reserve/});await link.focus();await expect(link).toBeFocused();
 expect(await page.locator('main h1').count()).toBe(1);
 for(const input of await page.locator('.planner-controls input,.planner-controls select').all())expect(await input.evaluate(el=>!!(el as HTMLInputElement).labels?.length)).toBe(true);
});
