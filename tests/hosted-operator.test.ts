import {afterEach,describe,expect,it,vi} from 'vitest';
// No cookie access is needed when the passcode is missing; this guards the hosted-demo boundary.
import {isOperator} from '@/lib/server/session';
import {POST as login} from '@/app/api/operator/login/route';
afterEach(()=>vi.unstubAllEnvs());
describe('hosted operator authorization',()=>{
 it('fails closed on hosted previews with no operator passcode',async()=>{vi.stubEnv('OPERATOR_PASSCODE','');vi.stubEnv('VERCEL','1');expect(await isOperator()).toBe(false);});
 it('fails closed on production builds with no operator passcode',async()=>{vi.stubEnv('OPERATOR_PASSCODE','');vi.stubEnv('VERCEL','');vi.stubEnv('NODE_ENV','production');expect(await isOperator()).toBe(false);});
 it('preserves the explicitly local unprotected demo',async()=>{vi.stubEnv('OPERATOR_PASSCODE','');vi.stubEnv('VERCEL','');vi.stubEnv('NODE_ENV','test');expect(await isOperator()).toBe(true);});
 it('does not report a successful demo login on an unconfigured hosted instance',async()=>{vi.stubEnv('OPERATOR_PASSCODE','');vi.stubEnv('VERCEL','1');const response=await login(new Request('http://localhost/api/operator/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}));expect(response.status).toBe(503);});
 it('preserves local demo login when no passcode is configured',async()=>{vi.stubEnv('OPERATOR_PASSCODE','');vi.stubEnv('VERCEL','');vi.stubEnv('NODE_ENV','test');const response=await login(new Request('http://localhost/api/operator/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}));expect(response.status).toBe(200);expect(await response.json()).toEqual({ok:true,demo:true});});

});
