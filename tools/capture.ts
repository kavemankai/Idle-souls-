/** Real Chromium/Phaser captures. No generated or reconstructed gameplay images. */
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from './browser';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const output='docs/visual_proof/screenshots';mkdirSync(output,{recursive:true});
const base=process.env.PREVIEW_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch(browserLaunchOptions);
const records:unknown[]=[];
const shots:[string,number,number,string,boolean?,('protanopia'|'deuteranopia')?][]=[
 ['S01-old-road',1280,720,'?composition=traversal&action=walk&facing=E&t=.95'],
 ['S02-mireling-coil',1280,720,'?composition=mireling&action=leap&t=.35'],
 ['S02-mireling-leap',1280,720,'?composition=mireling&action=leap&t=.95'],
 ['S03-sentry-guard',1280,720,'?composition=sentry&action=guard&t=.95'],
 ['S04-light-windup',1280,720,'?composition=sentry&action=light&facing=NE&t=.35'],
 ['S04-light-active',1280,720,'?composition=sentry&action=light&facing=NE&t=.95'],
 ['S04-light-recovery',1280,720,'?composition=sentry&action=light&facing=NE&t=1.95'],
 ['S04-heavy-windup',1280,720,'?composition=sentry&action=heavy&facing=S&t=.35'],
 ['S04-heavy-active',1280,720,'?composition=sentry&action=heavy&facing=S&t=.95'],
 ['S04-heavy-recovery',1280,720,'?composition=sentry&action=heavy&facing=S&t=1.95'],
 ['S04-sentry-bash',1280,720,'?composition=sentry&action=heavy&t=.95'],
 ['S05-protanopia',1280,720,'?composition=mixed&action=heavy&t=.95',false,'protanopia'],
 ['S05-deuteranopia',1280,720,'?composition=mixed&action=heavy&t=.95',false,'deuteranopia'],
 ['S05-mixed',1280,720,'?composition=mixed&action=sequence&t=5.8'],
 ['S06-portrait',390,844,'?t=5.8'],['S06-landscape',844,390,'?t=5.8'],
 ['S07-pivots-proxies',1280,720,'?debug&action=guard&t=.95'],
 ['S08-compass',1280,720,'?scene=calibration&t=.95'],
 ['S09-recognition-grayscale',1280,720,'?scene=silhouette&t=.95',true],
 ['S10-dark-floor',1280,720,'?floor=dark&action=guard&t=.95'],
 ['S11-1920-desktop',1920,1080,'?t=5.8'],
 ['S12-light-directions',1280,720,'?scene=attacks&actor=adventurer&clip=light'],
 ['S12-heavy-directions',1280,720,'?scene=attacks&actor=adventurer&clip=heavy'],
 ['S12-bash-directions',1280,720,'?scene=attacks&actor=sentry&clip=bash'],
 ['S12-leap-directions',1280,720,'?scene=attacks&actor=mireling&clip=leap'],
];
for(const [name,width,height,query,gray,cvd] of shots){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base+'/'+query);await page.waitForFunction(()=>window.__VISUAL_READY__);await page.waitForTimeout(200);
 if(gray)await page.addStyleTag({content:'canvas{filter:grayscale(1)}'});
 if(cvd){
   const matrix=cvd==='protanopia'?'0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0':'0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0';
   await page.evaluate(m=>{const div=document.createElement('div');div.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute"><filter id="cvd" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m}"/></filter></svg>`;document.body.append(div);},matrix);
   await page.addStyleTag({content:'canvas{filter:url(#cvd)}'});
 }
 await page.screenshot({path:`${output}/${name}.png`});
 const state=await page.evaluate(()=>window.__VISUAL_STATE__??null);
 records.push({file:`screenshots/${name}.png`,viewport:[width,height],deviceScaleFactor:1,url:query,grayscale:Boolean(gray),colourVisionSimulation:cvd??null,state,errors});await page.close();
}
// This is a cloud software renderer sample, explicitly not a physical phone benchmark.
const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto(base);await page.waitForFunction(()=>window.__VISUAL_READY__);await page.waitForTimeout(1000);
const timings=await page.evaluate(async()=>{
 const times:number[]=[];let last=performance.now();
 await new Promise<void>(resolve=>{function frame(now:number){times.push(now-last);last=now;if(times.length===120)resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);});
 times.shift();times.sort((a,b)=>a-b);
 return {samples:times.length,medianFrameMs:times[Math.floor(times.length*.5)],p95FrameMs:times[Math.floor(times.length*.95)],resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').slice(-3).join('/'),transferSize:(r as PerformanceResourceTiming).transferSize,decodedBodySize:(r as PerformanceResourceTiming).decodedBodySize}))};
});
writeFileSync('docs/visual_proof/capture-manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),captureTool:'Chromium / Playwright, real Phaser runtime, CSS grayscale for recognition shot',checkoutSHA:execSync('git rev-parse HEAD').toString().trim(),base,shots:records,cloudPerformance:{renderer:'headless Chromium ANGLE SwiftShader in cloud container',physicalPhone:'NOT TESTED',...timings}},null,2)+'\n');
await browser.close();console.log(`Captured ${records.length} real preview images with build/viewport metadata`);
