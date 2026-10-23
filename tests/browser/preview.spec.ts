import { test, expect } from '@playwright/test';
for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]) {
  test(`render and operate visual controls at ${viewport.width}x${viewport.height}`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.setViewportSize(viewport);await page.goto('/?t=5.8&action=guard');
    await page.waitForFunction(()=>window.__VISUAL_READY__);
    await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#status')).toContainText('guard');
    for(const id of ['pause','proxy','reduced','composition','action','facing']) {
      const box=await page.locator(`#${id}`).boundingBox();expect(box!.height,`${id} touch height`).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
    }
    await page.selectOption('#facing','W');await page.selectOption('#action','light');
    await expect(page.locator('#status')).toContainText('view unavailable');
    const frames=await page.evaluate(()=>{
      const sprites=window.__IDLE_GAME__.scene.scenes[0].children.list.filter(o=>o.type==='Sprite') as import('phaser').GameObjects.Sprite[];
      return sprites.map(s=>({frame:s.frame.name,flipX:s.flipX,origin:[s.originX,s.originY],visible:s.visible}));
    });
    expect(frames.find(f=>String(f.frame).startsWith('adventurer__'))!.frame).toBe('adventurer__idle__W__00');expect(frames.every(f=>!f.flipX)).toBe(true);
    await page.selectOption('#composition','traversal');
    await expect.poll(async()=>page.evaluate(()=>{
      const sprites=window.__IDLE_GAME__.scene.scenes[0].children.list.filter(o=>o.type==='Sprite') as import('phaser').GameObjects.Sprite[];
      return sprites.filter(s=>s.visible).length;
    })).toBe(1);
    await page.selectOption('#action','guard');await page.locator('#proxy').click();
    await expect(page.locator('#proxy')).toHaveAttribute('aria-pressed','true');
    // Remove select focus, move with a real key, and check presentation feet.
    await page.locator('#facing').evaluate(el=>(el as HTMLElement).blur());
    const before=await page.evaluate(()=>JSON.stringify(window.__VISUAL_STATE__));
    await page.keyboard.down('ArrowRight');
    await expect.poll(async()=>page.evaluate(()=>JSON.stringify(window.__VISUAL_STATE__))).not.toEqual(before);
    await page.keyboard.up('ArrowRight');
    expect(errors).toEqual([]);
  });
}
test('calibration contains eight authored guard views and no missing frames',async({page})=>{
 await page.goto('/?scene=calibration');await page.waitForFunction(()=>window.__VISUAL_READY__);
 const rows=await page.evaluate(()=>{
  const sprites=window.__IDLE_GAME__.scene.scenes[0].children.list.filter(o=>o.type==='Sprite') as import('phaser').GameObjects.Sprite[];
  return sprites.map(s=>s.frame.name);
 });
 expect(rows).toHaveLength(32);expect(rows.some(f=>f==='__MISSING')).toBe(false);
 expect(rows.filter(f=>String(f).startsWith('adventurer__guard__'))).toHaveLength(8);
});
