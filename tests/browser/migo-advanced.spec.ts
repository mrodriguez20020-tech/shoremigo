import { expect,test,type Page } from "@playwright/test";

type Evidence={contacts:{foot:string;travel:number;t:number}[];sounds:{kind:string;t:number}[];motion:{phase:string;direction:string;t:number}[];holds:{start:number;end:number}[]};
async function returning(page:Page){
 await page.addInitScript(()=>{
  sessionStorage.setItem("sm.intro","1");sessionStorage.setItem("sm_prefs",JSON.stringify({lang:"en",country:null,remember:false,welcomed:true}));
  localStorage.setItem("sm.migo.v1",JSON.stringify({prefs:{proactive:false,motionPaused:false},hidden:false}));
  const e:Evidence={contacts:[],sounds:[],motion:[],holds:[]};(window as unknown as {e:Evidence}).e=e;
  window.addEventListener("sm:migo-contact",ev=>{
    const contact=(ev as CustomEvent).detail;e.contacts.push({...contact,t:performance.now()});
    setTimeout(()=>e.holds.push({start:contact.travel,end:Number(document.querySelector('[data-migo-stage]')?.getAttribute('data-travel'))}),60);
  });
  window.addEventListener("sm:contact-sound",ev=>e.sounds.push({...((ev as CustomEvent).detail),t:performance.now()}));
  window.addEventListener("sm:migo-motion",ev=>e.motion.push({...((ev as CustomEvent).detail),t:performance.now()}));
 });await page.goto("/");
 await expect(page.locator('[data-migo-stage]')).toHaveAttribute('data-placement-ready','true');
}
const evidence=(p:Page)=>p.evaluate(()=>(window as unknown as {e:Evidence}).e);
async function resumeWalk(page:Page){
 await page.getByRole('button',{name:'Open Migo, your AI concierge',exact:true}).click();
 await page.getByRole('button',{name:'Close concierge',exact:true}).click();
 await expect(page.locator('[data-migo-stage]')).toHaveAttribute('data-mode','roam');
}
test('contact feet alternate across bursts; travel holds at contact and no audio plays by default',async({page})=>{
 test.setTimeout(35000);await page.setViewportSize({width:1440,height:1000});await returning(page);await resumeWalk(page);
 await expect.poll(async()=>(await evidence(page)).contacts.length,{timeout:20000}).toBeGreaterThanOrEqual(6);
 const e=await evidence(page);expect(e.sounds).toHaveLength(0);
 for(let i=1;i<e.contacts.length;i++)expect(e.contacts[i].foot).not.toBe(e.contacts[i-1].foot);
 await expect.poll(async()=>(await evidence(page)).holds.length,{timeout:2000}).toBeGreaterThanOrEqual(6);
 for(const hold of (await evidence(page)).holds)expect(Math.abs(hold.end-hold.start)).toBeLessThan(.011);
});
test('chat hops are verified from start/landing events, not transient screenshots',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await returning(page);
 await page.getByRole('button',{name:'Open Migo, your AI concierge',exact:true}).click();
 await expect.poll(async()=>(await evidence(page)).motion.some(x=>x.phase==='landed'&&x.direction==='to-chat')).toBe(true);
 await page.getByRole('button',{name:'Close concierge',exact:true}).click();
 await expect.poll(async()=>(await evidence(page)).motion.some(x=>x.phase==='landed'&&x.direction==='to-lane')).toBe(true);
 expect((await evidence(page)).motion.filter(x=>x.phase==='hop-start').length).toBe(2);
});
test('obstacle geometry scans are bounded and do not run once per walking frame',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await returning(page);await resumeWalk(page);
 await expect.poll(async()=>(await evidence(page)).contacts.length,{timeout:15000}).toBeGreaterThanOrEqual(2);
 const stage=page.locator('[data-migo-stage]');const before=Number(await stage.getAttribute('data-avoidance-scans'));
 await page.waitForTimeout(1500);const after=Number(await stage.getAttribute('data-avoidance-scans'));
 expect(after-before).toBeLessThan(25);
});
test('keyboard movement remains available with reduced motion and respects full-height protected zones',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await returning(page);
 const stage=page.locator('[data-migo-stage]');const button=page.getByRole('button',{name:'Open Migo, your AI concierge',exact:true});
 await button.focus();await page.keyboard.press('Home');
 await expect.poll(async()=>(await stage.boundingBox())!.x).toBeLessThan(20);
 await page.evaluate(()=>{const el=document.createElement('div');el.dataset.migoAvoid='';el.id='review-obstacle';Object.assign(el.style,{position:'fixed',left:'500px',top:'0',bottom:'0',width:'400px'});document.body.append(el);});
 await page.keyboard.press('End');await expect.poll(async()=>(await stage.boundingBox())!.x).toBeGreaterThan(1000);
 const box=(await stage.boundingBox())!;expect(box.x>=912||box.x+box.width<=488).toBe(true);
 expect((await evidence(page)).contacts).toHaveLength(0);expect(await stage.getAttribute('data-hopping')).toBe('false');
});
test('compact placement avoids controls after scroll and dynamic layout changes',async({page})=>{
 await page.setViewportSize({width:390,height:844});await returning(page);
 await page.evaluate(()=>{const el=document.createElement('button');el.dataset.migoAvoid='';el.id='critical-cta';el.textContent='Critical action';Object.assign(el.style,{position:'fixed',right:'0',bottom:'0',width:'170px',height:'150px',zIndex:'20'});document.body.append(el);});
 const stage=page.locator('[data-migo-stage]');
 await expect.poll(async()=>{const a=await stage.boundingBox(),b=await page.locator('#critical-cta').boundingBox();return !a||!b||a.x+a.width<=b.x-11||a.x>=b.x+b.width+11||a.y+a.height<=b.y-11;}).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
test('docked operator mode and manual pause produce no foot contacts',async({page})=>{
 await returning(page);await page.goto('/operator');await expect(page.locator('[data-migo-stage]')).toHaveAttribute('data-mode','docked');
 const count=(await evidence(page)).contacts.length;await page.waitForTimeout(1500);expect((await evidence(page)).contacts.length).toBe(count);
});
for(const [width,height] of [[320,700],[820,1180],[900,390],[1440,1000]])test(`first placement and visible original renderer at ${width}×${height}`,async({page})=>{
 await page.setViewportSize({width,height});await returning(page);const stage=page.locator('[data-migo-stage]');await expect(stage).toHaveAttribute('data-renderer','sprite-2.5d');
 if(await stage.isVisible()){const box=(await stage.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
test('opt-in synthesized footsteps correspond to rendered contacts and stop on manual pause',async({page})=>{
 test.setTimeout(30000);await page.setViewportSize({width:1440,height:1000});await returning(page);
 await page.getByRole('button',{name:/Sound and experience settings/}).click();
 await page.getByRole('switch',{name:/Enable sound/}).focus();await page.keyboard.press('Space');await expect(page.getByRole('switch',{name:/Enable sound/})).toBeChecked();
 await page.getByRole('switch',{name:/Ocean ambience/}).focus();await page.keyboard.press('Space');await expect(page.getByRole('switch',{name:/Ocean ambience/})).not.toBeChecked();
 await page.getByRole('button',{name:/Sound and experience settings/}).click();
 await resumeWalk(page);
 await expect.poll(async()=>(await evidence(page)).sounds.filter(s=>s.kind==='motion:contact').length,{timeout:18000}).toBeGreaterThanOrEqual(2);
 const e=await evidence(page);for(const sound of e.sounds.filter(s=>s.kind==='motion:contact'))expect(e.contacts.some(c=>Math.abs(c.t-sound.t)<120)).toBe(true);
 await page.getByRole('button',{name:/Sound and experience settings/}).click();
 await page.getByRole('switch',{name:/Pause animations/}).focus();await page.keyboard.press('Space');await expect(page.getByRole('switch',{name:/Pause animations/})).toBeChecked();
 await expect(page.locator('[data-migo-stage]')).toHaveAttribute('data-gait','still');
 const before=(await evidence(page)).contacts.length;await page.waitForTimeout(1200);expect((await evidence(page)).contacts.length).toBe(before);
});

test('mobile hero copy and primary actions remain clear of the companion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await returning(page);
 const stage=page.locator('[data-migo-stage]');
 await expect.poll(async()=>{
  const a=await stage.boundingBox();if(!a||!await stage.isVisible())return true;
  return page.locator('.luxury-hero [data-migo-avoid]').evaluateAll((els,box)=>els.every(el=>{const b=el.getBoundingClientRect();return box.x+box.width<=b.left-11||box.x>=b.right+11||box.y+box.height<=b.top-11||box.y>=b.bottom+11;}),a);
 }).toBe(true);
 await page.getByRole('button',{name:'Explore tours',exact:true}).click();await expect(page).toHaveURL(/\/excursions/);
});
