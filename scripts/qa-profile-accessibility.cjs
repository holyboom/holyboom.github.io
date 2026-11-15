/* Focus, reading context, and short-viewport cases not covered by the main profile QA.
   TEST_URL defaults to the built preview. SKIP_BOOT_PREVIEW=1 is only for source
   iteration before profile_living.py has rebuilt the inline boot condition. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4174/';
const engine = process.env.ENGINE || 'chromium';
const out = path.resolve(process.env.QA_DIR || '/tmp/profile-accessibility-' + engine);
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [], skipped = [];
function check(name, pass, data) {
  checks.push({ name, pass: !!pass, data });
  if (!pass) console.error('FAIL', name, JSON.stringify(data));
}

(async () => {
  const browser = await ({ chromium, firefox, webkit }[engine]).launch({ headless: true });
  async function open(viewport, options = {}) {
    const page = await browser.newPage({ viewport, ...options });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + 'profile/');
    if (options.javaScriptEnabled !== false) {
      await page.waitForFunction(() => window.ProfileExperience);
      await page.evaluate(() => document.fonts.ready);
    }
    return page;
  }
  async function settle(page) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  async function focusState(page) {
    return page.evaluate(() => {
      const el = document.activeElement, r = el.getBoundingClientRect();
      let blockedTop = document.querySelector('.site-header').getBoundingClientRect().bottom;
      const stage = document.querySelector('.stage'), s = stage.getBoundingClientRect();
      if (getComputedStyle(stage).display !== 'none' && s.top < innerHeight && r.right > s.left && r.left < s.right) blockedTop = Math.max(blockedTop, s.bottom);
      const style = getComputedStyle(el);
      return { label: (el.innerText || el.id).slice(0, 90), tag: el.tagName, top: r.top, bottom: r.bottom, blockedTop, viewportHeight: innerHeight, outline: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth), clear: r.top >= blockedTop + 7 && r.bottom <= innerHeight - 7 };
    });
  }
  async function headingState(page, id = 'craft') {
    return page.evaluate(id => {
      const r = document.querySelector('#' + id + ' h2').getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const s = document.querySelector('.stage').getBoundingClientRect();
      const live = document.documentElement.classList.contains('profile-enhanced');
      const top = live && innerWidth < 768 ? Math.max(header.bottom, s.bottom) : header.bottom;
      return { top: r.top, bottom: r.bottom, visible: r.top >= top && r.top < innerHeight, live, scroll: scrollY, overflow: document.documentElement.scrollWidth > innerWidth };
    }, id);
  }
  try {
    for (const width of [390, 320]) {
      const page = await open({ width, height: width === 390 ? 844 : 740 });
      await page.keyboard.press('Tab');
      check('skip-link-first-' + width, await page.locator('.skip').evaluate(el => el === document.activeElement && el.getBoundingClientRect().top >= 0));
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      check('skip-link-bypasses-navigation-' + width, await page.evaluate(() => document.activeElement.matches('main .primary')));
      await page.locator('#work-heading .proof-links a').last().focus();
      const reverse = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+Tab'); await settle(page); reverse.push(await focusState(page));
      }
      check('reverse-tab-clears-sticky-stage-' + width, reverse.every(r => r.clear), reverse);
      check('keyboard-focus-visible-' + width, reverse.every(r => r.outline !== 'none' && r.outlineWidth >= 2));
      await page.locator('#beneath summary').focus();
      await page.keyboard.press('Enter'); await settle(page);
      check('keyboard-disclosure-opens-' + width, await page.locator('#beneath').evaluate(el => el.open) && (await focusState(page)).clear);
      check('expanded-content-reflows-' + width, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.keyboard.press('Space'); await settle(page);
      check('keyboard-disclosure-closes-' + width, !await page.locator('#beneath').evaluate(el => el.open) && (await focusState(page)).clear);
      await page.locator('#craft .story-bridge').focus(); await page.keyboard.press('Enter'); await settle(page);
      await page.waitForFunction(() => { const el = document.querySelector('#ai-experiences'); return Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)) < 2; });
      const anchor = await page.evaluate(() => { const el = document.querySelector('#ai-experiences'); return { hash: location.hash, error: Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)) }; });
      check('native-keyboard-bridge-offset-' + width, anchor.hash === '#ai-experiences' && anchor.error < 2, anchor);
      await page.close();
    }

    const page = await open({ width: 390, height: 844 });
    await page.locator('#craft').evaluate(el => el.scrollIntoView({ behavior: 'instant' })); await settle(page);
    const portrait = await headingState(page);
    await page.emulateMedia({reducedMotion:'reduce'}); await settle(page);
    const full = await headingState(page);
    check('owner-full-policy-retains-reading-heading', full.visible && full.live && await page.locator('#motion').count()===0 && await page.evaluate(()=>ProfileExperience.snapshot().mode==='full'), { portrait, full });
    await page.locator('#ai-experiences').evaluate(el => el.scrollIntoView({ behavior: 'instant' })); await settle(page);
    await page.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001);
    const resume = await page.evaluate(async () => { const rows = []; for (let i = 0; i < 6; i++) { const s = ProfileExperience.snapshot(); rows.push({ current: s.current, target: s.target, shot: s.shot }); await new Promise(requestAnimationFrame); } return rows; });
    check('full-scroll-settles-without-backlog', resume.every(s => Math.abs(s.current - s.target) < .0001) && (await headingState(page, 'ai-experiences')).visible, resume);
    await page.locator('#craft').evaluate(el => el.scrollIntoView({ behavior: 'instant' })); await settle(page);
    const beforeRotation = await headingState(page);
    await page.setViewportSize({ width: 844, height: 390 }); await settle(page);
    const landscape = await headingState(page);
    check('landscape-retains-readable-full-motion', landscape.live && landscape.visible && !landscape.overflow && await page.locator('#architecture').isVisible(), landscape);
    await page.screenshot({ path: path.join(out, 'landscape.png') });
    await page.setViewportSize({ width: 390, height: 844 }); await settle(page);
    const restored = await headingState(page);
    check('rotation-restores-reading-position', restored.live && restored.visible && Math.abs(restored.top - beforeRotation.top) < 3, { beforeRotation, restored });
    await page.setViewportSize({ width: 390, height: 600 }); await settle(page);
    const short = await headingState(page);
    check('short-screen-retains-full-motion-and-context', short.visible && short.live, short);
    await page.setViewportSize({ width: 390, height: 844 }); await settle(page);
    check('height-only-return-retains-context', (await headingState(page)).visible && (await headingState(page)).live);
    await page.close();

    // A 1280x960 desktop at 200% has this 640x480 CSS layout viewport. This is
    // reflow emulation, not a claim to automate the browser chrome's zoom UI.
    const zoom = await open({ width: 640, height: 480 }, { deviceScaleFactor: 2 });
    const zoomRows = [];
    for (const selector of ['#origins .story-bridge', '#beneath summary', '#work-heading .proof-links a', '#contact .primary']) {
      await zoom.locator(selector).first().focus(); await zoom.keyboard.press('Tab'); await zoom.keyboard.press('Shift+Tab'); await settle(zoom);
      zoomRows.push(await focusState(zoom));
    }
    check('two-hundred-percent-reflow-controls-clear', zoomRows.every(r => r.clear) && await zoom.evaluate(() => document.documentElement.scrollWidth <= innerWidth), zoomRows);
    await zoom.screenshot({ path: path.join(out, 'zoom-reflow.png') }); await zoom.close();

    const noJS = await open({ width: 320, height: 740 }, { javaScriptEnabled: false });
    await noJS.keyboard.press('Tab'); await noJS.keyboard.press('Enter');
    await noJS.keyboard.press('Tab');
    check('no-js-keyboard-skip', await noJS.evaluate(() => document.activeElement.matches('main .primary')));
    await noJS.locator('#beneath summary').focus(); await noJS.keyboard.press('Enter');
    check('no-js-keyboard-disclosure-clear', await noJS.locator('#beneath').evaluate(el => el.open) && (await focusState(noJS)).clear && await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await noJS.close();

    if (process.env.SKIP_BOOT_PREVIEW === '1') skipped.push('short-landscape-inline-boot-preview');
    else {
      const boot = await browser.newPage({ viewport: { width: 844, height: 390 } });
      let release;
      const held = new Promise(resolve => { release = resolve; });
      await boot.route('**/living.js*', async route => { await held; await route.continue(); });
      try {
        await boot.goto(base + 'profile/', { waitUntil: 'commit' });
        await boot.locator('main').waitFor({ state: 'attached' });
        await boot.waitForFunction(() => [...document.styleSheets].some(sheet => sheet.href?.includes('/living.css')));
        check('short-landscape-inline-boot-preview', await boot.locator('.stage').isVisible() && await boot.locator('.stage-poster').isVisible() && await boot.locator('#motion').count()===0);
      } finally { release(); await boot.waitForFunction(() => window.ProfileExperience); await boot.close(); }
    }
    check('runtime-errors', errors.length === 0, errors);
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), engine, base, checks, skipped, errors, physicalDevice: false, zoom: '200% layout reflow emulation; browser chrome zoom and physical devices were not tested.' }, null, 2));
  const failed = checks.filter(c => !c.pass);
  console.log(JSON.stringify({ engine, checks: checks.length, failed, skipped, output: out }, null, 2));
  if (failed.length || errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
