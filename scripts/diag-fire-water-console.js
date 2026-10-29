/**
 * 消防水系统监测页 · 卡顿诊断脚本（浏览器控制台粘贴执行）
 *
 * 用法：在「卡住」的那个普通窗口里打开消防水监测页 → F12 控制台 → 粘贴本脚本全文 → 回车
 * 脚本会跑 3 轮各 25 秒，分别测量：现状 / 隐藏报警表 / 隐藏组态图。
 *
 * 读数怎么看：
 *   - 「新代码已生效: false」→ 页面跑的是旧包，不是代码问题
 *   - 「主线程卡顿」数字大 → 阻塞确实在这台机器上复现了
 *   - 对比三轮的最差阻塞：差在哪一轮，根因就在哪一块
 *
 * 最后会给出一条 localStorage 清空测试（无痕窗口正常 ⇒ 怀疑本地存储）。
 */
(async () => {
  const P = (s) => console.log(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  P('\n===== 消防水监测页 · 卡顿诊断 =====');
  P('URL：' + location.href);
  P('新代码已生效：' + !!document.querySelector('.sm-scene__svg--base') + '　(false = 页面跑的是旧包)');
  P('组态流动边数：' + document.querySelectorAll('.sm-scene__svg--flow .sm-edge__flow').length);
  P('底图层位图数：' + document.querySelectorAll('.sm-scene__svg--base image').length);
  P('DOM 节点数：' + document.getElementsByTagName('*').length);

  // ---- localStorage 体积（无痕窗口正常 ⇒ 优先怀疑这里）----
  const sizes = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    sizes.push([k, (localStorage.getItem(k) || '').length]);
  }
  sizes.sort((a, b) => b[1] - a[1]);
  P('localStorage TOP8（KB）：' + (sizes.slice(0, 8).map(([k, v]) => k + '=' + (v / 1024).toFixed(1)).join('  ') || '（空）'));

  /**
   * 主线程阻塞测量
   *
   * rAF 间隔 = 主线程被占住的时间。CSS stroke-dashoffset 动画跑在主线程，
   * 间隔一长流动动画就顿住；同一段时间里点击事件排队，菜单就点不动。
   * 所以「rAF 最差间隔」就是「动画卡住 + 菜单点不动」的共同度量。
   */
  async function measure(label, ms) {
    let prev = performance.now();
    let worst = 0, worstAt = 0, over = 0;
    let ticks = 0;
    const stamp = document.querySelector('.sm__stamp');
    let last = stamp ? stamp.textContent : '';
    const mo = new MutationObserver(() => {
      const el = document.querySelector('.sm__stamp');
      if (el && el.textContent !== last) { last = el.textContent; ticks++; }
    });
    if (stamp) mo.observe(stamp, { childList: true, subtree: true, characterData: true });

    const t0 = performance.now();
    await new Promise((resolve) => {
      (function loop(now) {
        const d = now - prev;
        prev = now;
        if (d > worst) { worst = d; worstAt = now - t0; }
        if (d > 100) over++;
        if (now - t0 < ms) requestAnimationFrame(loop);
        else resolve();
      })(performance.now());
    });
    mo.disconnect();
    const total = Math.round((performance.now() - t0) / 1000);
    P(`\n[${label}] ${total}s / 刷新 ${ticks} 次`);
    P(`  主线程卡顿(>100ms)：${over} 次，最差单次 ${Math.round(worst)}ms（出现在第 ${Math.round(worstAt / 1000)}s）`);
    P(`  每刷新轮次均摊阻塞：${ticks ? Math.round(worst / ticks) : 0}ms（最差单次 ÷ 轮次）`);
    return { worst, over, ticks };
  }

  await measure('A 现状', 25000);

  const fwat = document.querySelector('.sm-at');
  if (fwat) { fwat.style.display = 'none'; await sleep(300); }
  await measure('B 隐藏报警表', 25000);
  if (fwat) fwat.style.display = '';

  const canvas = document.querySelector('.sm-scene__canvas');
  if (canvas) { canvas.style.display = 'none'; await sleep(300); }
  await measure('C 隐藏组态图', 25000);
  if (canvas) canvas.style.display = '';

  P('\n===== 判读 =====');
  P('· A 最差阻塞 < 100ms → 这台机器当前没复现，问题已不在页面本身');
  P('· B 比 A 明显小 → 成本在报警表（DOM 规模随时间增长）');
  P('· C 比 A 明显小 → 成本在组态图（图元位图 / 流动动画）');
  P('· 三轮都大 → 成本在页面之外（浏览器扩展 / 本地存储 / 标签页 / 机器负载）');
  P('');
  P('下一步（无痕正常 ⇒ 优先做这条，30 秒出结果）：');
  P('  localStorage.clear(); location.reload();');
  P('  登录后重测：还卡 = 与本地存储无关（查扩展）；不卡 = 根因在本地存储，我按 key 逐个二分。');
})();
