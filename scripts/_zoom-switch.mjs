import { chromium } from '@playwright/test'
const API='http://localhost:3201', BASE='http://localhost:3200'
const res = await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone:'13300001111',password:'admin123!@#'})})
const {data} = await res.json()
if (!data?.token) { console.error('登录失败'); process.exit(1) }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor: 3 })
const page = await ctx.newPage()
await page.goto(BASE)
await page.evaluate(({token,user})=>{localStorage.setItem('auth_token',token);localStorage.setItem('auth_user',JSON.stringify(user))},{token:data.token,user:data.user})
for (let i=0;i<3;i++){
  await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`,{waitUntil:'networkidle'})
  await page.waitForTimeout(1500)
  if (page.url().includes('ebike-v2') && await page.$('.v2-time__switch')) break
  console.log('重试', i, '当前 url:', page.url())
  await page.evaluate(({token,user})=>{localStorage.setItem('auth_token',token);localStorage.setItem('auth_user',JSON.stringify(user))},{token:data.token,user:data.user})
}
console.log('最终 url:', page.url())
await page.waitForFunction(()=>!document.querySelector('.campus-layer__loading'),null,{timeout:60000}).catch(()=>{})
await page.waitForTimeout(1500)
await page.screenshot({path:'screenshots/ebike-v2-overview/场景开关-3倍放大.png', clip:{x:1168,y:160,width:100,height:48}, timeout:90000})
await page.evaluate(()=>document.querySelector('.v2-time__switch')?.click())
await page.waitForTimeout(1200)
await page.screenshot({path:'screenshots/ebike-v2-overview/场景开关-3倍放大-白天.png', clip:{x:1168,y:160,width:100,height:48}, timeout:90000})
await b.close()
