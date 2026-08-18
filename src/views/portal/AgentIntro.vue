<template>
  <div class="agent-intro">
    <!-- 固定返回导航 -->
    <a class="back-nav" href="/portal">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
      返回平台门户
    </a>

    <!-- ═══ Hero ═══ -->
    <header class="hero">
      <h1>韧性AI助手<br /><em>一句话，把安全数据问出来</em></h1>
      <p class="sub">告警、隐患、设备、日报——不用学菜单，开口就能查。每个角色只看自己该看的，问完直接拿结果。</p>
      <div class="pills">
        <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg><b>问得出</b>　自然语言直查真实数据</span>
        <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg><b>看得准</b>　四方权限，系统守住</span>
        <span class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg><b>拿得到</b>　日报产物，下载即用</span>
      </div>
      <div class="video-wrap">
        <div class="video-bar">
          <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
          <span class="vt">完整演示 · 1 分 31 秒</span>
        </div>
        <video controls autoplay muted loop playsinline preload="metadata" poster="/agent-intro/demo-shots/幕1-监管问告警.png">
          <source src="/agent-intro/demo-video/韧性AI助手演示录屏.mp4" type="video/mp4" />
          <source src="/agent-intro/demo-video/韧性AI助手演示录屏.webm" type="video/webm" />
          您的浏览器不支持视频播放，请下载视频文件观看。
        </video>
      </div>
      <p class="video-caption">↑ 完整演示录屏：监管机构 → 社会单位 → 权限对比 → 日报产物 → 过程透明</p>
    </header>

    <!-- ═══ 幕 1 ═══ -->
    <section class="sec">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-no">01 · 问得出</div>
          <h2>一句人话，直接查到真实告警</h2>
          <p class="goal">AI 真的会查业务数据，不是只会聊天</p>
        </div>
        <div class="shot">
          <img src="/agent-intro/demo-shots/幕1-监管问告警.png" alt="监管机构提问告警" @click="openLb('/agent-intro/demo-shots/幕1-监管问告警.png', '监管机构提问告警')" />
          <div class="cap">监管机构 · 海港应急局 ｜ 登录后直接进入 AI 工作台，无需任何培训</div>
        </div>
        <div class="q">今天辖区有什么告警？</div>
        <div class="talk">
          我只说了一句话——"今天辖区有什么告警"。它自己理解了"辖区"是我的权限范围，"今天"是日期，然后去查了真实数据。注意看，4 条告警里有 2 条是<b>火警</b>，还都没处理——这就是值班员一上班最该先看到的东西。
        </div>
        <div class="stat3">
          <div class="stat"><div class="n n-red">4</div><div class="t">今日辖区告警</div></div>
          <div class="stat"><div class="n n-red">2</div><div class="t">紧急火警 · 未处理</div></div>
          <div class="stat"><div class="n n-blue">4</div><div class="t">覆盖辖区企业</div></div>
        </div>
      </div>
    </section>

    <!-- ═══ 幕 2 · 权限对比 ═══ -->
    <section class="sec">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-no">02 · 看得准</div>
          <h2>同一个问题，不同角色，答案不同</h2>
          <p class="goal">数据权限是系统守的，不是靠人自觉</p>
        </div>
        <div class="cmp">
          <div class="cmp-card">
            <div class="cmp-label l-reg"><span>监管机构 · 海港应急局</span><span class="cnt">4 条</span></div>
            <div class="shot shot-flat">
              <img src="/agent-intro/demo-shots/幕1-监管问告警.png" alt="监管视角4条告警" @click="openLb('/agent-intro/demo-shots/幕1-监管问告警.png', '监管视角4条告警')" />
            </div>
          </div>
          <div class="cmp-vs">
            <div>同一句</div>
            <div class="num">VS</div>
            <div>同一天</div>
          </div>
          <div class="cmp-card">
            <div class="cmp-label l-unit"><span>社会单位 · 新思维高级中学</span><span class="cnt">2 条</span></div>
            <div class="shot shot-flat">
              <img src="/agent-intro/demo-shots/幕2-学校问告警-权限对比.png" alt="单位视角2条告警" @click="openLb('/agent-intro/demo-shots/幕2-学校问告警-权限对比.png', '单位视角2条告警')" />
            </div>
          </div>
        </div>
        <div class="q">今天辖区有什么告警？　← 一字未改</div>
        <div class="talk">
          注意，我是<b>同一个问题</b>——但换个账号问，答案从 4 条变成了 2 条。不是我记错了，是<b>它知道这个人是谁</b>。刚才登录的是应急局，它看整个辖区；现在登录的是学校的王老师，它只给看学校自己的数据。在安全管理里，数据该让谁看、看多少，这条线是系统守住的，不是靠人自觉。
        </div>
        <div class="concl">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <div><b>权限隔离真实生效：</b>查询逻辑在后端按「企业关联 + 关系树」过滤，LLM 只负责翻译问题、不参与越权判断。想看的看不到，不该看的多一分都没有。</div>
        </div>
      </div>
    </section>

    <!-- ═══ 幕 3 ═══ -->
    <section class="sec">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-no">03 · 问得深</div>
          <h2>听得懂条件：未整改、离线，都能查</h2>
          <p class="goal">能听懂业务条件，还能揪出"没在看着"的设备</p>
        </div>
        <div class="grid2">
          <div>
            <div class="shot">
              <img src="/agent-intro/demo-shots/幕3a-学校隐患未整改.png" alt="隐患未整改查询" @click="openLb('/agent-intro/demo-shots/幕3a-学校隐患未整改.png', '隐患未整改查询')" />
              <div class="cap">"我们有哪些隐患还没整改？" → 2 条未整改，全部来自本企业</div>
            </div>
          </div>
          <div>
            <div class="shot">
              <img src="/agent-intro/demo-shots/幕3b-学校设备在线.png" alt="设备在线查询" @click="openLb('/agent-intro/demo-shots/幕3b-学校设备在线.png', '设备在线查询')" />
              <div class="cap">"我们的设备都在线吗？" → 3 台设备，宿舍楼烟感 C-207 离线被点名</div>
            </div>
          </div>
        </div>
        <div class="talk">
          它不只是把表列出来——"还没整改"、"在不在线"这种条件它都听得懂。注意宿舍楼那台烟感是<b>离线</b>的——这种设备你平时不会发现，但它会告诉你："这台没在看着"。
        </div>
      </div>
    </section>

    <!-- ═══ 幕 4 ═══ -->
    <section class="sec">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-no">04 · 拿得到</div>
          <h2>一句话，日报直接生成，下载就能交差</h2>
          <p class="goal">问完就能直接拿结果干活，不是只给你看屏幕</p>
        </div>
        <div class="shot">
          <img src="/agent-intro/demo-shots/幕4-监管告警日报.png" alt="聊天区生成日报表格" @click="openLb('/agent-intro/demo-shots/幕4-监管告警日报.png', '聊天区生成日报表格')" />
          <div class="cap">聊天区直接输出数据表格（不是只回一句"已生成"）</div>
        </div>
        <div class="q">出个今天的告警日报</div>
        <div class="shot shot-gap">
          <img src="/agent-intro/demo-shots/幕4-产物卡片.png" alt="右侧产物日报卡片" @click="openLb('/agent-intro/demo-shots/幕4-产物卡片.png', '右侧产物日报卡片')" />
          <div class="cap">右侧「产物」栏：统计卡 + 明细表 + 复制 / 新窗口 / 下载</div>
        </div>
        <div class="talk">
          光在屏幕上看还不够——<b>一句话，它把今天的告警日报直接生成出来了</b>。统计、明细都在，可以下载、可以发领导。以前值班员下班前要花一两个小时翻记录、归类、写日报；现在一句话，30 秒拿到一份能直接交差的。
        </div>
        <div class="stat3">
          <div class="stat"><div class="n n-blue">4</div><div class="t">告警总数</div></div>
          <div class="stat"><div class="n n-red">4</div><div class="t">未处理</div></div>
          <div class="stat"><div class="n n-green">0</div><div class="t">已处置</div></div>
        </div>
      </div>
    </section>

    <!-- ═══ 幕 5 ═══ -->
    <section class="sec">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-no">05 · 信得过</div>
          <h2>结论有据可查：每一步都在时间线里摊开</h2>
          <p class="goal">不是黑盒，结论可以追溯</p>
        </div>
        <div class="shot">
          <img src="/agent-intro/demo-shots/幕5-调用时间线.png" alt="调用时间线" @click="openLb('/agent-intro/demo-shots/幕5-调用时间线.png', '调用时间线')" />
          <div class="cap">识别产物意图 → 取数 → 产物生成 → 完成；点开节点可看原始入参</div>
        </div>
        <div class="talk">
          AI 说的准不准？它的每一步——识别了什么问题、查了哪张表、按什么范围过滤、最后怎么生成日报——<b>全部在这个时间线里摊开</b>。结论可以追溯，这在安全管理里很重要：报告可以给领导看，依据也能给领导看。
        </div>
      </div>
    </section>

    <!-- ═══ CTA ═══ -->
    <div class="cta">
      <h2>想亲手试试？点一下就能体验</h2>
      <p>监管机构、社会单位、运营管理、服务机构、平台管理五种身份，一键切换体验</p>
      <a class="cta-btn" href="/agent?exp=1" target="_blank">前往体验 →</a>
      <a class="cta-btn-ghost" href="/portal">← 返回平台门户</a>
    </div>

    <footer class="foot">商业街安全管理平台 · 韧性AI助手介绍资料 · 录屏与截图均为真实系统运行画面</footer>

    <!-- 图片放大弹层（常驻 DOM，opacity 显隐，与静态介绍页同机制） -->
    <div class="img-lightbox" :class="{ open: lbOpen }" @click.self="closeLb">
      <button class="img-lightbox-close" aria-label="关闭" @click="closeLb">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      <div class="img-lightbox-body">
        <img :src="lbSrc" :alt="lbTitle" />
        <p class="img-lightbox-title">{{ lbTitle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

// 图片放大弹层
const lbOpen = ref(false)
const lbSrc = ref('')
const lbTitle = ref('')

function openLb(src: string, title: string) {
  lbSrc.value = src
  lbTitle.value = title
  lbOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closeLb() {
  lbOpen.value = false
  document.body.style.overflow = ''
}
function onLbKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLb()
}
watch(lbOpen, (open) => {
  if (open) window.addEventListener('keydown', onLbKey)
  else window.removeEventListener('keydown', onLbKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onLbKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.agent-intro {
  --brand: #3678E3;
  --brand-soft: rgba(54,120,227,0.08);
  --ink: #101010;
  --ink-2: #5E5E5E;
  --line: rgba(0,0,0,0.08);
  --bg: #fafbfd;
  --card: #ffffff;
  --red: #B91C1C;
  --green: #1E7A45;
  box-sizing: border-box;
  font-family: 'Noto Sans SC', 'PingFang SC', -apple-system, sans-serif;
  background: var(--bg);
  color: var(--ink);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.agent-intro * { box-sizing: border-box; margin: 0; padding: 0; }
.agent-intro ::-webkit-scrollbar { display: none; }

/* ── Hero ── */
.hero {
  background: linear-gradient(180deg, #f4f8ff 0%, #eef3ff 60%, var(--bg) 100%);
  padding: 116px 24px 56px;
  text-align: center;
}
/* 固定返回导航 */
.back-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; gap: 8px;
  padding: 14px 28px; font-size: 15px; font-weight: 600; color: var(--ink);
  background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(54,120,227,0.10); text-decoration: none;
}
.back-nav svg { width: 17px; height: 17px; color: var(--brand); }
.back-nav:hover { color: var(--brand); }
.hero .tag {
  display: inline-block; font-size: 14px; font-weight: 600; color: var(--brand);
  background: rgba(54,120,227,0.10); border: 1px solid rgba(54,120,227,0.18);
  padding: 6px 16px; border-radius: 999px; letter-spacing: 1px; margin-bottom: 24px;
}
.hero h1 { font-size: 44px; font-weight: 800; letter-spacing: 1px; line-height: 1.3; }
.hero h1 em { font-style: normal; color: var(--brand); }
.hero .sub { font-size: 17px; color: var(--ink-2); margin-top: 16px; max-width: 640px; margin-inline: auto; }
.hero .pills { display: flex; justify-content: center; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.pill {
  font-size: 15px; font-weight: 600; color: var(--ink);
  background: var(--card); border: 1px solid var(--line); border-radius: 10px;
  padding: 10px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: inline-flex; align-items: center; gap: 8px;
}
.pill svg { width: 17px; height: 17px; color: var(--brand); flex-shrink: 0; }
.pill b { color: var(--brand); }
.hero .video-wrap {
  max-width: 1080px; margin: 40px auto 0; background: #0e1013; border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.12); overflow: hidden;
  box-shadow: 0 16px 48px rgba(20,40,90,0.18);
}
.video-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #16191f; }
.dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-r { background: #ff5f57; } .dot-y { background: #febc2e; } .dot-g { background: #28c840; }
.video-bar span.vt { margin-left: 10px; font-size: 13px; color: rgba(255,255,255,0.45); }
.video-wrap video { width: 100%; display: block; }
.video-caption { font-size: 14px; color: var(--ink-2); padding: 14px; text-align: center; }

/* ── 内容区 ── */
.wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

.sec { padding: 64px 0; }
.sec + .sec { border-top: 1px solid var(--line); }
.sec-head { margin-bottom: 36px; }
.sec-no { font-size: 18px; font-weight: 700; color: var(--brand); letter-spacing: 2px; }
.sec-head h2 { font-size: 28px; font-weight: 800; margin-top: 8px; }
.sec-head .goal { font-size: 16px; color: var(--ink-2); margin-top: 8px; }
.sec-head .goal b { color: var(--ink); }

.shot {
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.05);
}
.shot img { width: 100%; display: block; cursor: pointer; }
.shot .cap { padding: 14px 18px; font-size: 14px; color: var(--ink-2); border-top: 1px solid var(--line); }

/* 对比卡片内嵌截图：去掉圆角与阴影（顶部分离式标签） */
.shot-flat { border-radius: 0 0 14px 14px; }
.shot-gap { margin-top: 20px; }

/* ── 图片放大弹层（与门户视频弹窗样式一致）── */
.img-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(9, 14, 26, 0.82);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
  opacity: 0; pointer-events: none; transition: opacity .18s ease;
}
.img-lightbox.open { opacity: 1; pointer-events: auto; }
.img-lightbox-close {
  position: absolute; top: 20px; right: 20px;
  width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.08); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
}
.img-lightbox-close svg { width: 18px; height: 18px; }
.img-lightbox-close:hover { background: rgba(255,255,255,0.18); }
.img-lightbox-body { max-width: 92vw; }
.img-lightbox-body img {
  max-width: 92vw; max-height: 82vh; display: block; margin: 0 auto;
  border-radius: 12px; background: #000;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}
.img-lightbox-title { text-align: center; color: rgba(255,255,255,0.85); font-size: 14px; margin: 14px 0 0; }

.talk {
  margin-top: 20px; background: var(--brand-soft); border-left: 3px solid var(--brand);
  border-radius: 0 10px 10px 0; padding: 16px 20px; font-size: 16px; color: var(--ink);
}
.q {
  display: inline-block; margin-top: 14px; background: #0e1013; color: #eceef2;
  font-size: 15px; font-weight: 600; padding: 8px 16px; border-radius: 8px;
}
.q::before { content: 'Q '; color: #5b9bff; font-weight: 800; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 820px) { .grid2 { grid-template-columns: 1fr; } }

.cmp { display: flex; gap: 20px; align-items: stretch; }
@media (max-width: 820px) { .cmp { flex-direction: column; } }
.cmp-card { flex: 1; }
.cmp-vs {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 0 6px; font-size: 15px; font-weight: 800; color: var(--brand);
}
.cmp-vs .num { font-size: 34px; font-weight: 900; }
.cmp-label {
  font-size: 14px; font-weight: 700; padding: 8px 14px; border-radius: 8px 8px 0 0;
  display: flex; justify-content: space-between; align-items: center;
}
.cmp-label .ent { font-size: 13px; font-weight: 500; opacity: 0.8; }
.l-reg { background: #eef3ff; color: #1d4ed8; }
.l-unit { background: #e9f9f0; color: #1E7A45; }
.cmp-label .cnt { font-size: 22px; font-weight: 900; }

.concl { margin-top: 24px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px 22px; font-size: 16px; display: flex; gap: 12px; align-items: flex-start; }
.concl .ic { flex-shrink: 0; width: 22px; height: 22px; margin-top: 2px; color: var(--brand); }
.concl b { color: var(--brand); }

.stat3 { display: flex; gap: 14px; margin: 18px 0; flex-wrap: wrap; }
.stat {
  flex: 1; min-width: 130px; background: var(--card); border: 1px solid var(--line);
  border-radius: 12px; padding: 14px 16px; text-align: center;
}
.stat .n { font-size: 26px; font-weight: 900; }
.stat .t { font-size: 13px; color: var(--ink-2); margin-top: 2px; }
.n-blue { color: var(--brand); } .n-red { color: var(--red); } .n-green { color: var(--green); }

.cta {
  text-align: center; padding: 64px 24px 80px;
  background: linear-gradient(180deg, var(--bg) 0%, #eef3ff 100%);
}
.cta h2 { font-size: 26px; font-weight: 800; }
.cta p { font-size: 16px; color: var(--ink-2); margin: 12px auto 28px; max-width: 560px; }
.cta-btn {
  display: inline-block; background: var(--brand); color: #fff; font-size: 16px; font-weight: 700;
  padding: 14px 40px; border-radius: 10px; text-decoration: none;
  box-shadow: 0 8px 24px rgba(54,120,227,0.3);
}
.cta-btn-ghost {
  display: inline-block; background: transparent; color: var(--brand); font-size: 16px; font-weight: 600;
  padding: 14px 32px; border-radius: 10px; text-decoration: none;
  border: 1px solid rgba(54,120,227,0.35); margin-left: 12px;
}
.cta-btn-ghost:hover { background: rgba(54,120,227,0.06); }
@media (max-width: 560px) { .cta-btn-ghost { margin-left: 0; margin-top: 12px; } }
.foot { text-align: center; font-size: 13px; color: #9aa1ad; padding: 20px; border-top: 1px solid var(--line); }

@media (max-width: 640px) {
  .hero { padding: 104px 16px 40px; }
  .hero h1 { font-size: 32px; }
  .hero .sub { font-size: 15px; }
  .sec { padding: 48px 0; }
  .sec-head h2 { font-size: 22px; }
}
</style>
