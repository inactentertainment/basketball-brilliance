const { chromium, devices } = require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const [name,config] of [
  ['desktop',{viewport:{width:1440,height:900}}],
  ['android-emulation',{...devices['Pixel 7']}],
  ['iphone-emulation',{...devices['iPhone 13']}]
 ]){
  const context=await browser.newContext(config),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/playbook-library-preview/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#catalog article').count(),6,name+' library count');
  await page.locator('#search').fill('zone');
  assert((await page.locator('#catalog article').count())>=1,name+' zone search');
  await page.locator('#search').fill('');
  await page.locator('#catalog article').first().getByRole('button',{name:'Edit animation'}).click();
  await page.waitForURL('**/playlab-preview/');
  assert(await page.locator('#court').count(),name+' editor court');
  assert(!errors.length,name+' browser errors: '+errors.join('; '));
  await page.goto('http://127.0.0.1:8765/player-learning-preview/');
  assert(!errors.length,name+' player preview errors: '+errors.join('; '));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  assert(await page.locator('#secureCoachPlayLab').count(),name+' integrated coach panel');
  assert(await page.locator('#securePlayerPlayLab').count(),name+' integrated player panel');
  console.log('PASS '+name+' library/editor/player/integration DOM smoke');
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
