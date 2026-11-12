"use client";

import { useLayoutEffect, useRef } from "react";
import type { AvoidRect } from "./avoidance";

interface ZoneCache {
  read: () => AvoidRect[];
  scans: number;
  modalOpen: boolean;
  subscribe: (listener: () => void) => () => void;
}
/** One bounded geometry reader. Walk frames consume its cache; they never query all controls. */
export function useAvoidanceZones(pathname: string): ZoneCache {
  const cache = useRef<ZoneCache>({read:()=>[],scans:0,modalOpen:false,subscribe:()=>()=>{}});
  useLayoutEffect(()=>{
    const holder=cache.current;
    const selector = "[data-migo-avoid], [data-migo-tip-avoid]";
    let elements: HTMLElement[] = [], rects: AvoidRect[] = [], dirty=true, needQuery=true, raf=0, lastRead=-Infinity, settleUntil=0;
    const listeners = new Set<()=>void>();
    const resize = new ResizeObserver(()=>invalidate());
    const read = () => {
      const now=performance.now();
      if(!dirty && now>=settleUntil) return rects;
      if(now-lastRead<80) return rects; // at most 12.5 batched reads/s during a short reveal
      if(needQuery){resize.disconnect();elements=Array.from(document.querySelectorAll<HTMLElement>(selector));elements.forEach(el=>resize.observe(el));needQuery=false;}
      rects=elements.filter(el=>el.isConnected && !el.closest('[data-migo-stage]')).map(el=>{
        const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,tipOnly:!el.hasAttribute('data-migo-avoid')};
      }).filter(r=>r.right>r.left && r.bottom>r.top && r.bottom>-16 && r.top<innerHeight+16);
      holder.scans++;holder.modalOpen=Boolean(document.querySelector('dialog[open]'));
      lastRead=now;dirty=false;
      return rects;
    };
    const frame = () => {
      const old=holder.scans;read();
      if(holder.scans!==old)listeners.forEach(fn=>fn());
      if(dirty || performance.now()<settleUntil)raf=requestAnimationFrame(frame);
    };
    function invalidate(query=false){dirty=true;needQuery||=query;settleUntil=performance.now()+900;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
    const scroll=()=>invalidate();const refresh=()=>invalidate(true);
    holder.read=read;holder.subscribe=(fn)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
    read();
    window.addEventListener('scroll',scroll,{passive:true,capture:true});window.addEventListener('resize',refresh);
    const mutation=new MutationObserver(entries=>{
      if(entries.some(e=>!(e.target instanceof Element) || !e.target.closest('[data-migo-stage]')))invalidate(true);
    });
    mutation.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','data-migo-avoid','data-migo-tip-avoid']});
    const visible=()=>{if(document.hidden)cancelAnimationFrame(raf);else invalidate(true);};document.addEventListener('visibilitychange',visible);
    return()=>{cancelAnimationFrame(raf);resize.disconnect();mutation.disconnect();listeners.clear();window.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',refresh);document.removeEventListener('visibilitychange',visible);holder.read=()=>[];};
  },[pathname]);
  return cache.current;
}
