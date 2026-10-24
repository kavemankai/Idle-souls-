import { test, expect } from '@playwright/test';

/** These tests exercise the built production player (never the developer-only save harness). */
test('a damaged IndexedDB primary is never silently replaced; a verified backup can be exported and restored', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#durable-status')).toHaveCount(0, { timeout: 10000 });
  // Seed the failure by copying the genuine newly-created V3 primary to backup,
  // then corrupting the primary in a real readwrite IndexedDB transaction.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('idle-souls-durable');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const docs = tx.objectStore('documents');
      const get = docs.get('main');
      get.onsuccess = () => {
        if (!get.result?.raw) { tx.abort(); return; }
        docs.put({ name: 'backup', raw: get.result.raw });
        docs.put({ name: 'main', raw: '{"format":"idle-souls-save","checksum":"bad","data":{}}' });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('No primary save to copy'));
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('#save-recovery')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#durable-status')).toBeVisible();
  await page.locator('#inspect-backup').click();
  const exportLink = page.locator('#export-backup');
  await expect(exportLink).toBeVisible();
  await expect(exportLink).toHaveAttribute('download', 'idle-souls-recovery-backup.json');
  page.once('dialog', dialog => { void dialog.accept(); });
  await page.locator('#restore-backup').click();
  await expect(page.locator('#save-recovery')).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('#durable-status')).toHaveCount(0);
  await expect(page.locator('#camp-card')).toContainText('Verified backup restored');
  // The broken primary is quarantined rather than lost.
  const quarantined = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('idle-souls-durable');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const raw = await new Promise<string | undefined>((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const req = tx.objectStore('documents').get('quarantine');
      req.onsuccess = () => resolve(req.result?.raw);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return raw;
  });
  expect(quarantined).toContain('"checksum":"bad"');
});

test('an unfinished production-player expedition is visible and can resume after page process reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#durable-status')).toHaveCount(0, { timeout: 10000 });
  await page.locator('#guide-skip').click();
  await page.locator('[data-preset=first]').click();
  await page.locator('#launch').click();
  await expect(page.locator('#xp-pause')).toBeVisible({ timeout: 10000 });
  await page.locator('#xp-pause').click();
  await page.reload();
  await expect(page.locator('#resume-saved')).toBeVisible({ timeout: 10000 });
  await page.locator('#resume-saved').click();
  await expect(page.locator('#xp-pause')).toHaveText('Resume expedition');
  await expect(page.locator('#xstatus')).toContainText('Restored exact checkpoint state.');
});
