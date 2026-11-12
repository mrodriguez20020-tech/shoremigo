import {expect,test,type Page} from '@playwright/test';
const src='https://videos.pexels.com/video-files/11273418/11273418-hd_1280_720_25fps.mp4';
async function enter(p:Page,paused=false){await p.addInitScript(paused=>{sessionStorage.setItem('sm.intro','1');sessionStorage.setItem('sm_prefs',JSON.stringify({lang:'en',country:null,remember:false,welcomed:true}));localStorage.setItem('sm.migo.v1',JSON.stringify({prefs:{proactive:false,motionPaused:paused},hidden:false}));},paused);await p.goto('/discover/reef');}
test('licensed reef introduction plays muted native HD then yields to the illustrated hotspots',async({page})=>{
 await enter(page);const v=page.locator('[data-discovery-film] video');await expect(v).toBeVisible();await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.2);expect(await v.evaluate((v:HTMLVideoElement)=>v.muted)).toBe(true);await expect(page.getByText(/Generic reef mood footage/)).toBeVisible();
 const handle=await v.elementHandle();await page.locator('[data-discovery]').evaluate(el=>scrollTo({top:(el as HTMLElement).offsetTop+(el as HTMLElement).offsetHeight-innerHeight,behavior:'instant'}));await expect(v).toHaveCount(0);expect(await handle!.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(true);
 await page.getByRole('button',{name:/Green sea turtle:/}).click();await expect(page.getByRole('dialog')).toContainText('Afternoon Reef & Sandbar');
});
for(const mode of ['os','manual','save-data'] as const)test(`${mode} avoids all stock video and poster transfers`,async({page})=>{
 let requests=0;await page.route('https://**.pexels.com/**',route=>{requests++;return route.abort();});if(mode==='os')await page.emulateMedia({reducedMotion:'reduce'});if(mode==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));await enter(page,mode==='manual');await page.waitForTimeout(800);await expect(page.locator('[data-discovery-film]')).toHaveCount(0);expect(requests).toBe(0);
});
test('failed stock request retains illustrated guide and navigation',async({page})=>{
 let attempted=false;await page.route(src,route=>{attempted=true;return route.abort();});await enter(page);await expect.poll(()=>attempted).toBe(true);await expect(page.locator('[data-discovery-film]')).toHaveCount(0);await page.getByRole('button',{name:/Skip the descent/}).click();await expect(page.locator('[data-discovery]')).toHaveAttribute('data-progress','1.00');await page.getByRole('button',{name:/Elkhorn coral garden/}).click();await expect(page.getByRole('dialog')).toContainText('Palancar Reef Morning Snorkel');
});
test('autoplay refusal exposes a keyboard retry, while global pause removes the film',async({page})=>{
 await page.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;let blocked=true;HTMLMediaElement.prototype.play=function(){if(blocked){blocked=false;return Promise.reject(new DOMException('QA autoplay refusal','NotAllowedError'));}return play.call(this);};});await enter(page);const retry=page.getByRole('button',{name:'Play reef film',exact:true});await expect(retry).toBeVisible();await retry.focus();await page.keyboard.press('Enter');await expect(retry).toHaveCount(0);await expect.poll(()=>page.locator('[data-discovery-film] video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.2);
 await page.getByRole('button',{name:/Sound and experience settings/}).click();const pause=page.getByRole('switch',{name:/Pause animations/});await pause.focus();await page.keyboard.press('Space');await expect(pause).toBeChecked();await expect(page.locator('[data-discovery-film]')).toHaveCount(0);
});

test('hidden document pauses the native movie and resumes only when visible',async({page})=>{
 await enter(page);const v=page.locator('[data-discovery-film] video');await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.2);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
});
