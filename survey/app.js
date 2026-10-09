/* Agent as a Service survey: navigation, diagrams, charts, source popovers. */
(function () {
  "use strict";

  const SRC = {};
  (window.SOURCES || []).forEach((s) => { SRC[s.id] = s; });
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------------- text width estimate for SVG layout ---------------- */
  function textW(s, size) {
    let w = 0;
    for (const ch of String(s)) w += /[⺀-￿]/.test(ch) ? size * 1.0 : size * 0.56;
    return w;
  }

  /* ---------------- tooltip ---------------- */
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.hidden = true;
  document.body.appendChild(tip);
  document.addEventListener("mousemove", (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.getAttribute("data-tip");
    tip.hidden = false;
    const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    const y = Math.min(e.clientY + 14, window.innerHeight - tip.offsetHeight - 8);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  });

  /* ---------------- source references ---------------- */
  function shortLabel(s) {
    if (!s) return "?";
    if (s.kind === "paper") {
      let t = s.title.replace(/\$\\tau\$/g, "τ");
      const c = t.indexOf(":");
      if (c > 0 && c < 40) return t.slice(0, c);
      return t.split(" ").slice(0, 3).join(" ");
    }
    const v = { openai: "OpenAI", anthropic: "Anthropic", google: "Google", aws: "AWS", microsoft: "Microsoft", github: "GitHub", e2b: "E2B", daytona: "Daytona", exa: "Exa", tavily: "Tavily", vllm: "vLLM", sglang: "SGLang", ipads: "IPADS" }[s.vendor] || s.vendor;
    return v + "·" + s.id.split("/").slice(-1)[0];
  }
  $$(".ref").forEach((b) => {
    const s = SRC[b.dataset.r];
    b.textContent = "[" + shortLabel(s) + "]";
    b.type = "button";
    b.setAttribute("aria-label", "来源：" + (s ? s.title : b.dataset.r));
  });
  const pop = document.createElement("div");
  pop.className = "pop";
  pop.hidden = true;
  pop.setAttribute("role", "dialog");
  document.body.appendChild(pop);
  function srcLinks(s) {
    const l = [];
    if (s.url) l.push(`<a href="${esc(s.url)}" target="_blank" rel="noopener">原文</a>`);
    if (s.pdf) l.push(`<a href="${esc(s.pdf)}" target="_blank" rel="noopener">存档 PDF</a>`);
    if (s.txt) l.push(`<a href="${esc(s.txt)}" target="_blank" rel="noopener">提取全文</a>`);
    return l.join("");
  }
  function srcMeta(s) {
    if (s.kind === "paper") return [s.venue, s.date, (s.authors || []).slice(0, 3).join(", ") + ((s.authors || []).length > 3 ? " 等" : "")].filter(Boolean).join(" · ");
    return [s.vendor, s.product, "抓取 " + s.captured].join(" · ");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".ref");
    if (!b) { if (!e.target.closest(".pop")) pop.hidden = true; return; }
    const s = SRC[b.dataset.r];
    if (!s) return;
    pop.innerHTML = `<div class="t">${esc(s.title.replace(/\$\\tau\$/g, "τ"))}</div><div class="m">${esc(srcMeta(s))}</div><div class="l">${srcLinks(s)}</div>`;
    pop.hidden = false;
    const r = b.getBoundingClientRect();
    const x = Math.max(16, Math.min(r.left, window.innerWidth - pop.offsetWidth - 16));
    let y = r.bottom + 8;
    if (y + pop.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - pop.offsetHeight - 8);
    pop.style.left = x + "px";
    pop.style.top = y + "px";
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") pop.hidden = true; });

  /* ---------------- SVG helpers ---------------- */
  function chip(x, y, label, opts) {
    opts = opts || {};
    const size = opts.size || 12;
    const w = textW(label, size) + 16;
    const h = size + 12;
    const ax = opts.anchor === "end" ? x - w : opts.anchor === "middle" ? x - w / 2 : x;
    const stroke = opts.stroke ? ` style="stroke:${opts.stroke}"` : "";
    return { w, h, svg: `<g><rect class="chip" x="${ax}" y="${y}" width="${w}" height="${h}" rx="5"${stroke}/><text x="${ax + w / 2}" y="${y + h / 2 + size * 0.36}" text-anchor="middle" font-size="${size}">${esc(label)}</text></g>` };
  }
  function chipColumn(x, y, items, opts) {
    let out = "", yy = y;
    items.forEach((it) => { const c = chip(x, yy, it, opts); out += c.svg; yy += c.h + 7; });
    return out;
  }
  function chipRow(cx, y, items, opts) {
    const size = (opts && opts.size) || 12;
    const ws = items.map((it) => textW(it, size) + 16);
    const total = ws.reduce((a, b) => a + b, 0) + 8 * (items.length - 1);
    let x = cx - total / 2, out = "";
    items.forEach((it, i) => { out += chip(x, y, it, opts).svg; x += ws[i] + 8; });
    return out;
  }
  let arrowN = 0;
  const arrowDefs = () => { arrowN++; return `<defs>
    <marker id="ah${arrowN}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--ink-3)"/></marker>
  </defs>`; };
  const AH = () => `url(#ah${arrowN})`;

  /* ---------------- diagram: the model ---------------- */
  function drawModel() {
    const C = { s: "var(--c-session)", m: "var(--c-model)", e: "var(--c-env)", t: "var(--c-tool)" };
    let g = `<svg class="dgm" viewBox="0 0 1000 660" role="img" aria-label="托管智能体服务结构图：中心为 Agent Harness，四个接口分别连接应用、模型、执行环境和托管工具">${arrowDefs()}`;
    // service boundary
    g += `<rect class="svc" x="190" y="118" width="620" height="422" rx="18" stroke-width="1.5"/>`;
    g += `<text x="206" y="142" font-size="13" font-weight="700">托管智能体服务 · Managed Agent Service</text>`;
    g += `<text x="206" y="160" font-size="11.5" class="muted">厂商运行的部分（虚线框内）</text>`;
    // state components inside boundary
    g += chip(206, 172, "Agent 配置（模型 · 指令 · 工具）", { size: 11 }).svg;
    g += chip(794, 172, "凭据库 Vault", { size: 11, anchor: "end" }).svg;
    g += chip(206, 498, "会话事件日志（仅追加）", { size: 11 }).svg;
    g += chip(794, 498, "记忆 · 追踪 · 评估", { size: 11, anchor: "end" }).svg;
    // harness box
    g += `<rect class="harness" x="350" y="208" width="300" height="244" rx="12"/>`;
    g += `<text x="500" y="236" text-anchor="middle" font-size="17" font-weight="700">Agent Harness</text>`;
    g += `<text x="500" y="255" text-anchor="middle" font-size="12" class="sub">智能体执行框架（狭义 agent）</text>`;
    // loop
    const lx = 500, ly = 334, r = 34;
    g += `<circle cx="${lx}" cy="${ly}" r="${r}" fill="none" style="stroke:var(--ink-3)" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    g += `<path d="M ${lx + r} ${ly - 4} l 5 8 l 5 -8" fill="none" style="stroke:var(--ink-3)" stroke-width="1.4"/>`;
    g += `<text x="${lx}" y="${ly - r - 8}" text-anchor="middle" font-size="11.5">调用模型</text>`;
    g += `<text x="${lx + r + 14}" y="${ly + 22}" font-size="11.5">执行工具</text>`;
    g += `<text x="${lx - r - 14}" y="${ly + 22}" text-anchor="end" font-size="11.5">结果写回上下文</text>`;
    g += `<text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="11" class="muted">循环</text>`;
    g += chipRow(500, 394, ["Codex harness", "Claude Code / Agent SDK", "Antigravity"], { size: 10.5 });
    g += chipRow(500, 420, ["LangGraph", "ADK", "Strands", "Agent Framework"], { size: 10.5 });
    // links port -> harness
    g += `<line x1="212" y1="329" x2="350" y2="329" stroke-width="2" style="stroke:${C.s}"/>`;
    g += `<line x1="500" y1="140" x2="500" y2="208" stroke-width="2" style="stroke:${C.m}"/>`;
    g += `<line x1="650" y1="329" x2="788" y2="329" stroke-width="2" style="stroke:${C.e}"/>`;
    g += `<line x1="500" y1="452" x2="500" y2="518" stroke-width="2" style="stroke:${C.t}"/>`;
    // ports
    const port = (x, y, col, n, lab, lx2, ly2, anchor) =>
      `<g class="port"><rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="4" style="fill:${col}"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" style="fill:#fff">${n}</text><text x="${lx2}" y="${ly2}" text-anchor="${anchor}" font-size="12.5" font-weight="700" style="fill:${col}">${lab}</text></g>`;
    g += port(190, 329, C.s, "1", "会话接口", 205, 316, "start");
    g += port(500, 118, C.m, "2", "模型推理", 518, 112, "start");
    g += port(810, 329, C.e, "3", "执行环境", 795, 316, "end");
    g += port(500, 540, C.t, "4", "托管工具", 518, 562, "start");
    // outside: session (left)
    g += `<text x="12" y="210" font-size="12" font-weight="700">应用 / 用户</text>`;
    g += chipColumn(12, 222, ["ChatGPT / claude.ai", "企业后端服务", "Slack / Teams 机器人", "GitHub issue / PR", "定时任务"], { size: 11 });
    g += `<line x1="160" y1="329" x2="176" y2="329" stroke-width="1.4" style="stroke:${C.s}" marker-end="${AH()}"/>`;
    // outside: model (top)
    g += `<text x="500" y="22" text-anchor="middle" font-size="12" font-weight="700">模型服务</text>`;
    g += chipRow(500, 34, ["OpenAI GPT", "Claude", "Gemini", "Bedrock 模型", "Foundry 模型目录"], { size: 11 });
    g += chipRow(500, 64, ["自建推理：vLLM · SGLang"], { size: 11 });
    // outside: env (right)
    g += `<text x="988" y="190" text-anchor="end" font-size="12" font-weight="700">沙箱 / 机器</text>`;
    g += chipColumn(988, 202, ["OpenAI 托管沙箱", "Anthropic 云沙箱", "AgentCore microVM", "Foundry 会话沙箱", "E2B · Daytona", "Modal · Cloudflare · Vercel", "用户自己的机器"], { size: 11, anchor: "end" });
    g += `<line x1="840" y1="329" x2="824" y2="329" stroke-width="1.4" style="stroke:${C.e}" marker-end="${AH()}"/>`;
    // outside: tools (bottom)
    g += chipRow(500, 580, ["Google Search 接地", "Bing 搜索", "Exa · Tavily", "代码解释器", "浏览器", "MCP 服务器 / 网关"], { size: 11 });
    g += `<text x="500" y="636" text-anchor="middle" font-size="12" font-weight="700">其他云服务</text>`;
    g += `</svg>`;
    $("#model-dgm").innerHTML = g;
  }

  /* ---------------- diagram: evolution ---------------- */
  function drawEvo() {
    const W = 1000;
    let g = `<svg class="dgm" viewBox="0 0 ${W} 330" role="img" aria-label="三种部署形态对比">${arrowDefs()}`;
    const panel = (x, title, sub) => `<text x="${x}" y="22" font-size="14" font-weight="700">${title}</text><text x="${x}" y="40" font-size="11.5" class="muted">${sub}</text>`;
    const box = (x, y, w, h, t, s, cls, col) => `<rect class="${cls || "boxline"}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"${col ? ` style="stroke:${col}"` : ""}/><text x="${x + w / 2}" y="${y + (s ? h / 2 - 2 : h / 2 + 4)}" text-anchor="middle" font-size="12.5" font-weight="700">${t}</text>${s ? `<text x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle" font-size="11" class="sub">${s}</text>` : ""}`;
    const arrow = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="flow"${col ? ` style="stroke:${col}"` : ""} marker-end="${AH()}"/>`;
    // panel 1
    g += panel(10, "① 模型 API", "一次请求一轮；循环由开发者编写");
    g += `<rect x="10" y="60" width="290" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += box(30, 90, 250, 92, "开发者的应用", "自写循环 · 自己执行工具 · 自管状态", "boxline");
    g += box(80, 232, 150, 50, "模型 API", "tokens in / out", "boxline", "var(--c-model)");
    g += arrow(155, 182, 155, 230, "var(--c-model)");
    // panel 2
    g += panel(350, "② harness 与沙箱在同一容器", "agent-in-a-sandbox");
    g += `<rect x="350" y="60" width="290" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += `<rect x="368" y="74" width="254" height="150" rx="8" fill="none" style="stroke:var(--c-env)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    g += `<text x="380" y="92" font-size="11" class="muted">一个容器</text>`;
    g += box(380, 102, 110, 52, "harness", "Agent SDK", "harness");
    g += box(500, 102, 110, 52, "文件 · 进程", "", "boxline");
    g += box(380, 162, 230, 46, "凭据（与生成的代码同处）", "", "boxline");
    g += box(420, 252, 150, 46, "模型 API", "", "boxline", "var(--c-model)");
    g += arrow(495, 224, 495, 250, "var(--c-model)");
    // panel 3
    g += panel(690, "③ harness 与沙箱分离", "agent-with-a-sandbox");
    g += `<rect x="690" y="60" width="300" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += box(706, 78, 128, 66, "harness", "厂商托管", "harness");
    g += box(852, 78, 124, 66, "沙箱", "厂商或用户的机器", "boxline", "var(--c-env)");
    g += box(706, 168, 270, 40, "会话事件日志（进程外，仅追加）", "", "boxline", "var(--c-session)");
    g += box(706, 232, 128, 54, "模型 API", "", "boxline", "var(--c-model)");
    g += box(852, 232, 124, 54, "Vault + 出站代理", "", "boxline");
    g += arrow(834, 104, 850, 104, "var(--c-env)");
    g += arrow(770, 144, 770, 166);
    g += arrow(770, 208, 770, 230, "var(--c-model)");
    g += arrow(914, 230, 914, 146);
    g += `</svg>`;
    $("#evo-dgm").innerHTML = g;
  }

  /* ---------------- diagram: session lifecycle ---------------- */
  function drawLife() {
    let g = `<svg class="dgm" viewBox="0 0 620 330" role="img" aria-label="会话生命周期：准备、运行、等待动作、空闲、删除">${arrowDefs()}`;
    const st = (x, y, w, t, s, on) => `<rect x="${x}" y="${y}" width="${w}" height="54" rx="27" style="fill:${on ? "var(--c-session)" : "var(--paper)"};stroke:${on ? "var(--c-session)" : "var(--ink-3)"}"/><text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-size="13" font-weight="700" style="fill:${on ? "#fff" : "var(--ink)"}">${t}</text><text x="${x + w / 2}" y="${y + 41}" text-anchor="middle" font-size="10.5" style="fill:${on ? "#fff" : "var(--ink-3)"}">${s}</text>`;
    const ar = (d, lab, lx, ly, anchor) => `<path d="${d}" class="flow" marker-end="${AH()}"/>${lab ? `<text x="${lx}" y="${ly}" font-size="10.5" class="sub" text-anchor="${anchor || "middle"}">${lab}</text>` : ""}`;
    g += st(20, 30, 150, "准备环境", "pending / provisioning", false);
    g += st(235, 30, 150, "运行", "running · 计算在用", true);
    g += st(450, 30, 150, "等待动作", "函数结果 / 环境连接", true);
    g += st(235, 180, 150, "空闲", "idle · 计算可回收", false);
    g += st(450, 180, 150, "删除", "状态清除", false);
    g += ar("M170 57 L233 57", "环境就绪", 202, 50);
    g += ar("M385 50 L448 50", "需要外部结果", 417, 43);
    g += ar("M448 70 L387 70", "", 0, 0);
    g += ar("M290 84 L290 178", "一轮结束", 282, 135, "end");
    g += ar("M330 178 L330 86", "新输入 · 恢复", 338, 135, "start");
    g += ar("M385 207 L448 207", "长期闲置", 417, 200);
    g += `<text x="20" y="268" font-size="11" class="sub">Anthropic：运行时长只计 running；空闲时容器打检查点。</text>`;
    g += `<text x="20" y="286" font-size="11" class="sub">Microsoft：空闲 2–60 分钟释放计算，恢复时还原 $HOME；30 天未活动删除。</text>`;
    g += `<text x="20" y="304" font-size="11" class="sub">OpenAI：自托管时由 environment_connection 事件触发启动执行器，最多等 5 分钟。</text>`;
    g += `<text x="20" y="322" font-size="11" class="sub">AgentCore：stop 后 microVM 终止，挂载在 /mnt 的会话存储保留 14 天。</text>`;
    g += `</svg>`;
    $("#life-dgm").innerHTML = g;
  }

  /* ---------------- diagram: isolation tiers ---------------- */
  function drawIso() {
    const rows = [
      { t: "共享宿主内核", s: "Linux 容器 · namespaces/cgroups · Landlock · macOS Seatbelt", p: ["Anthropic 云沙箱（隔离 Linux 容器）"] },
      { t: "用户态应用内核", s: "gVisor：系统调用由独立内核实现拦截处理", p: ["GKE Agent Sandbox"] },
      { t: "独立客户机内核", s: "microVM（Firecracker）· 完整 VM（QEMU/KVM）", p: ["AgentCore Runtime microVM", "Foundry 会话沙箱（VM 隔离）", "E2B（基于 Firecracker）"] },
    ];
    let g = `<svg class="dgm" viewBox="0 0 620 330" role="img" aria-label="隔离层级与产品">`;
    rows.forEach((r, i) => {
      const y = 14 + i * 96;
      const shade = ["0.10", "0.20", "0.34"][i];
      g += `<rect x="10" y="${y}" width="600" height="84" rx="8" style="fill:var(--c-env);fill-opacity:${shade};stroke:var(--c-env)"/>`;
      g += `<text x="24" y="${y + 24}" font-size="13.5" font-weight="700">${r.t}</text>`;
      g += `<text x="24" y="${y + 43}" font-size="11" class="sub">${r.s}</text>`;
      let x = 24;
      r.p.forEach((p) => { const c = chip(x, y + 52, p, { size: 11 }); g += c.svg; x += c.w + 8; });
    });
    g += `<text x="610" y="324" text-anchor="end" font-size="10.5" class="muted">隔离强度自上而下增加 · OpenAI 托管沙箱与 Cloud Run sandboxes 的文档未写明隔离技术</text>`;
    g += `</svg>`;
    $("#iso-dgm").innerHTML = g;
  }

  /* ---------------- diagram: credential proxy ---------------- */
  function drawCred() {
    let g = `<svg class="dgm" viewBox="0 0 620 200" role="img" aria-label="沙箱内只有占位符，出站代理替换为真实凭据">${arrowDefs()}`;
    g += `<rect x="10" y="40" width="200" height="120" rx="8" style="fill:var(--paper);stroke:var(--c-env)" stroke-width="1.5"/>`;
    g += `<text x="24" y="62" font-size="13" font-weight="700">沙箱</text>`;
    g += `<text x="24" y="84" font-size="11" class="sub">agent 生成的代码</text>`;
    g += `<text x="24" y="112" font-size="10.5" font-family="var(--f-mono)">Authorization:</text>`;
    g += `<text x="24" y="128" font-size="10.5" font-family="var(--f-mono)">Bearer PLACEHOLDER</text>`;
    g += `<rect x="240" y="40" width="160" height="120" rx="8" class="boxline"/>`;
    g += `<text x="320" y="64" text-anchor="middle" font-size="13" font-weight="700">出站代理</text>`;
    g += `<text x="320" y="86" text-anchor="middle" font-size="11" class="sub">核对域名白名单</text>`;
    g += `<text x="320" y="104" text-anchor="middle" font-size="11" class="sub">从 vault 取出凭据</text>`;
    g += `<text x="320" y="122" text-anchor="middle" font-size="11" class="sub">替换占位符</text>`;
    g += `<rect x="430" y="40" width="180" height="120" rx="8" class="boxline"/>`;
    g += `<text x="520" y="64" text-anchor="middle" font-size="13" font-weight="700">外部服务</text>`;
    g += `<text x="520" y="86" text-anchor="middle" font-size="11" class="sub">api.github.com 等</text>`;
    g += `<text x="520" y="112" text-anchor="middle" font-size="10.5" font-family="var(--f-mono)">Bearer ghp_••••</text>`;
    g += `<line x1="210" y1="100" x2="238" y2="100" class="flow" marker-end="${AH()}"/>`;
    g += `<line x1="400" y1="100" x2="428" y2="100" class="flow" marker-end="${AH()}"/>`;
    g += `<text x="10" y="188" font-size="10.5" class="muted">沙箱内的进程读不到真实凭据；自托管环境需要用户自己提供这层代理（OpenAI 文档）。</text>`;
    g += `</svg>`;
    $("#cred-dgm").innerHTML = g;
  }

  /* ---------------- diagram: three lenses ---------------- */
  function drawLens() {
    let g = `<svg class="dgm" viewBox="0 0 560 440" role="img" aria-label="三种文献视角的范围">`;
    // survey view
    g += `<text x="20" y="24" font-size="13" font-weight="700">综述文献：harness 内部</text>`;
    g += `<rect x="20" y="36" width="240" height="110" rx="10" class="harness"/>`;
    ["profile", "memory", "planning", "action"].forEach((m, i) => { g += chip(34 + (i % 2) * 112, 50 + Math.floor(i / 2) * 40, m, { size: 11.5 }).svg; });
    // vendor view
    g += `<text x="300" y="24" font-size="13" font-weight="700">厂商文档：单个服务的资源边界</text>`;
    g += `<rect x="300" y="36" width="240" height="110" rx="10" class="svc"/>`;
    g += `<rect x="370" y="66" width="100" height="50" rx="8" class="harness"/><text x="420" y="96" text-anchor="middle" font-size="11.5" font-weight="700">harness</text>`;
    [["var(--c-session)", 300, 91], ["var(--c-model)", 420, 36], ["var(--c-env)", 540, 91], ["var(--c-tool)", 420, 146]].forEach(([c, x, y]) => { g += `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="3" style="fill:${c}"/>`; });
    // aaas view
    g += `<text x="20" y="196" font-size="13" font-weight="700">AaaS 论文：多个 agent 组成的服务网络</text>`;
    const nodes = [[90, 270], [200, 240], [310, 290], [420, 240], [480, 330], [150, 360], [300, 380]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 2], [1, 3], [6, 4]];
    edges.forEach(([a, b]) => { g += `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" style="stroke:var(--ink-3)" stroke-width="1.2"/>`; });
    nodes.forEach(([x, y], i) => { g += `<circle cx="${x}" cy="${y}" r="${i === 2 ? 22 : 16}" style="fill:var(--panel);stroke:var(--ink)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10.5">${i === 2 ? "调度器" : "agent"}</text>`; });
    g += `<text x="20" y="428" font-size="11" class="muted">AaaS-AN：服务注册、发现与执行图调度；OpenAaaS：主 agent 规划，子 agent 在数据处执行</text>`;
    g += `</svg>`;
    $("#lens-dgm").innerHTML = g;
  }

  /* ---------------- bar chart ---------------- */
  // rows: [{label, sub, bars:[{v, lo, hi, color, name, tip}]}]
  function barChart(el, rows, o) {
    o = Object.assign({ w: 560, labelW: 150, barH: 14, gap: 4, rowGap: 14, max: null, log: false, min: null, fmt: (v) => String(v), ticks: null, unit: "" }, o || {});
    const plotX = o.labelW + 8, plotW = o.w - plotX - 70;
    const all = rows.flatMap((r) => r.bars.map((b) => (b.hi != null ? b.hi : b.v)));
    const max = o.max != null ? o.max : Math.max(...all) * 1.05;
    const min = o.log ? (o.min || Math.min(...rows.flatMap((r) => r.bars.map((b) => (b.lo != null ? b.lo : b.v))))) : 0;
    const sx = (v) => {
      if (o.log) return plotX + ((Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * plotW;
      return plotX + (v / max) * plotW;
    };
    let y = 22, body = "";
    rows.forEach((r) => {
      const n = r.bars.length;
      const rowH = Math.max(n * o.barH + (n - 1) * o.gap, r.sub ? 30 : 0);
      body += `<g class="row">`;
      body += `<text x="${o.labelW}" y="${y + rowH / 2 + (r.sub ? -2 : 4)}" text-anchor="end" font-size="12" style="fill:var(--ink)">${esc(r.label)}</text>`;
      if (r.sub) body += `<text x="${o.labelW}" y="${y + rowH / 2 + 12}" text-anchor="end" font-size="10.5" style="fill:var(--ink-3)">${esc(r.sub)}</text>`;
      r.bars.forEach((b, i) => {
        const by = y + i * (o.barH + o.gap) + (r.sub && n === 1 ? (rowH - o.barH) / 2 : 0);
        const x0 = b.lo != null ? sx(b.lo) : (o.log ? plotX : plotX);
        const x1 = sx(b.hi != null ? b.hi : b.v);
        const w = Math.max(2, x1 - x0);
        const t = b.tip || `${r.label}${b.name ? " · " + b.name : ""}：${b.lo != null ? o.fmt(b.lo) + "–" + o.fmt(b.hi) : o.fmt(b.v)}${o.unit}`;
        body += `<rect class="mark" x="${x0}" y="${by}" width="${w}" height="${o.barH}" rx="3" style="fill:${b.color}"${b.dash ? ' fill-opacity="0.35"' : ""}/>`;
        body += `<text class="val" x="${x1 + 6}" y="${by + o.barH / 2 + 4}">${esc(b.label != null ? b.label : (b.lo != null ? o.fmt(b.lo) + "–" + o.fmt(b.hi) : o.fmt(b.v)))}</text>`;
        body += `<rect class="hit" x="${plotX}" y="${by - 2}" width="${plotW + 60}" height="${o.barH + 4}" data-tip="${esc(t)}"/>`;
      });
      body += `</g>`;
      y += rowH + o.rowGap;
    });
    const h = y + 18;
    let grid = "";
    const ticks = o.ticks || (o.log ? [] : niceTicks(max));
    ticks.forEach((t) => {
      const x = sx(t);
      grid += `<line class="grid" x1="${x}" y1="14" x2="${x}" y2="${h - 18}"/><text x="${x}" y="${h - 4}" text-anchor="middle" font-size="10.5" style="fill:var(--ink-3)">${esc(o.tickFmt ? o.tickFmt(t) : o.fmt(t))}</text>`;
    });
    grid += `<line class="axis" x1="${plotX}" y1="14" x2="${plotX}" y2="${h - 18}"/>`;
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${o.w} ${h}" role="img" aria-label="${esc(o.aria || "")}">${grid}${body}</svg>`;
  }
  function niceTicks(max) {
    const raw = max / 4;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
    const out = [];
    for (let t = 0; t <= max + 1e-9; t += step) out.push(+t.toFixed(6));
    return out;
  }
  function legend(el, items) {
    el.innerHTML = items.map(([c, n]) => `<span><i style="background:${c}"></i>${esc(n)}</span>`).join("");
  }

  const S1 = "var(--c-session)", S2 = "var(--c-model)", S3 = "var(--c-env)", S4 = "var(--c-tool)", INK = "var(--ink-3)";

  function drawCharts() {
    // harness cost
    barChart($("#ch-harness"), [
      { label: "AgentDiet", sub: "输入 token 减少", bars: [{ lo: 39.9, hi: 59.7, color: S1 }] },
      { label: "AgentDiet", sub: "总计算成本减少", bars: [{ lo: 21.1, hi: 35.9, color: S1 }] },
      { label: "BudgetMLAgent", sub: "每次运行成本减少", bars: [{ v: 94.2, color: S2 }] },
      { label: "Murakkab", sub: "成本（4.3×）", bars: [{ v: 76.7, color: S3, label: "−76.7%（4.3×）" }] },
      { label: "Murakkab", sub: "能耗（3.7×）", bars: [{ v: 73.0, color: S3, label: "−73.0%（3.7×）" }] },
      { label: "Murakkab", sub: "GPU 用量（2.8×）", bars: [{ v: 64.3, color: S3, label: "−64.3%（2.8×）" }] },
    ], { max: 100, unit: "%", fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], aria: "成本降低比例" });

    // limits (log hours)
    legend($("#lg-limits"), [[S1, "单次运行上限"], [S2, "空闲回收计算"], [INK, "状态保留期限"]]);
    barChart($("#ch-limits"), [
      { label: "Copilot cloud agent", bars: [{ v: 59 / 60, color: S1, label: "59 分钟" }] },
      { label: "E2B Hobby / Pro", bars: [{ v: 1, color: S1, label: "1 小时" }, { v: 24, color: S1, label: "24 小时" }] },
      { label: "AgentCore microVM", bars: [{ v: 8, color: S1, label: "8 小时" }] },
      { label: "AgentCore Instances", bars: [{ v: 336, color: S1, label: "14 天" }] },
      { label: "Foundry Hosted agents", bars: [{ lo: 2 / 60, hi: 1, color: S2, label: "2–60 分钟（默认 15）" }, { v: 720, color: INK, label: "30 天" }] },
      { label: "OpenAI 托管沙箱", bars: [{ v: 1, color: S2, label: "无活动 1 小时" }] },
      { label: "Google Managed Agents", bars: [{ v: 168, color: INK, label: "7 天（每次交互重置）" }] },
      { label: "Google 沙箱", bars: [{ lo: 168, hi: 336, color: INK, label: "7–14 天" }] },
      { label: "AgentCore 会话存储", bars: [{ v: 336, color: INK, label: "空闲 14 天" }] },
    ], { log: true, min: 0.02, max: 1000, w: 560, labelW: 158, tickFmt: (t) => (t < 1 ? Math.round(t * 60) + "分" : t < 24 ? t + "时" : Math.round(t / 24) + "天"), ticks: [1 / 30, 1, 8, 24, 168, 720], fmt: (v) => v.toFixed(2) + " h", aria: "时间上限" });

    // talaria
    legend($("#lg-talaria"), [[INK, "基线"], [S2, "Talaria"]]);
    barChart($("#ch-talaria"), [
      { label: "p50 完成时间", bars: [{ v: 1000, color: INK, label: "1000 s" }, { v: 189, color: S2, label: "189 s（5.3×）" }] },
      { label: "p95 完成时间", bars: [{ v: 2296, color: INK, label: "2296 s" }, { v: 867, color: S2, label: "867 s（2.6×）" }] },
    ], { max: 2600, unit: " s", fmt: (v) => v, labelW: 100, aria: "会话完成时间" });

    // price
    legend($("#lg-price"), [[S1, "输入"], [S2, "输出"], [S3, "缓存命中"]]);
    barChart($("#ch-price"), [
      { label: "Fable 5.1", bars: [{ v: 10, color: S1, label: "$10" }, { v: 50, color: S2, label: "$50" }, { v: 0.25, color: S3, label: "$0.25" }] },
      { label: "Opus 5.5", bars: [{ v: 4, color: S1, label: "$4" }, { v: 20, color: S2, label: "$20" }, { v: 0.2, color: S3, label: "$0.20" }] },
      { label: "Sonnet 5.5", bars: [{ v: 2, color: S1, label: "$2" }, { v: 10, color: S2, label: "$10" }, { v: 0.1, color: S3, label: "$0.10" }] },
      { label: "Haiku 5.5", bars: [{ v: 0.1, color: S1, label: "$0.10" }, { v: 0.5, color: S2, label: "$0.50" }, { v: 0.01, color: S3, label: "$0.01" }] },
    ], { max: 55, fmt: (v) => "$" + v, labelW: 90, barH: 11, gap: 3, ticks: [0, 10, 20, 30, 40, 50], aria: "模型价格" });

    // cold start
    barChart($("#ch-cold"), [
      { label: "冷启动", sub: "min_instances=1", bars: [{ v: 4.7, color: S2, label: "≈4.7 s 平均" }] },
      { label: "冷启动", sub: "min_instances=10", bars: [{ v: 1.4, color: S3, label: "≈1.4 s 平均" }] },
      { label: "持续 25 qps", sub: "min_instances=10", bars: [{ v: 1.6, color: S3, label: "≈1.6 s 平均" }] },
      { label: "热启动", sub: "紧接第二次运行", bars: [{ v: 0.4, color: S3, label: "≈0.4 s 平均" }] },
      { label: "并发 9", sub: "最大延迟", bars: [{ v: 60, color: S2, label: "60 s" }] },
      { label: "并发 36", sub: "最大延迟", bars: [{ v: 7, color: S3, label: "≈7 s" }] },
    ], { log: true, min: 0.2, max: 100, labelW: 120, ticks: [0.5, 1, 5, 10, 50], tickFmt: (t) => t + "s", fmt: (v) => v + " s", aria: "冷启动延迟" });

    // crab
    legend($("#lg-crab"), [[S1, "回放 LLM 轨迹"], [S2, "实时调用 LLM"]]);
    barChart($("#ch-crab"), [
      { label: "从头重跑", bars: [{ v: 100, color: S1 }, { v: 100, color: S2 }] },
      { label: "恢复对话 + 文件系统", bars: [{ v: 48, color: S1 }, { v: 34, color: S2 }] },
      { label: "只恢复对话", bars: [{ v: 6, color: S1 }, { v: 28, color: S2 }] },
    ], { max: 100, fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], labelW: 130, aria: "恢复成功率" });

    // deltabox
    barChart($("#ch-delta"), [
      { label: "E2B（diff）", bars: [{ lo: 23, hi: 48, color: S2 }] },
      { label: "DeltaBox", bars: [{ lo: 1, hi: 2, color: S3 }] },
    ], { max: 50, fmt: (v) => v + "%", ticks: [0, 10, 20, 30, 40, 50], labelW: 100, barH: 18, aria: "状态管理时间占比" });

    // search
    legend($("#lg-search"), [[S2, "模型厂商的内置搜索"], [S4, "云平台 / 第三方搜索 API"]]);
    barChart($("#ch-search"), [
      { label: "Google 搜索接地", sub: "每次查询，月免 5,000", bars: [{ v: 14, color: S2, label: "$14" }] },
      { label: "OpenAI web search", sub: "每次调用", bars: [{ v: 10, color: S2, label: "$10" }] },
      { label: "Anthropic web search", sub: "每次搜索", bars: [{ v: 10, color: S2, label: "$10" }] },
      { label: "Tavily advanced", sub: "2 积分", bars: [{ v: 16, color: S4, label: "$16" }] },
      { label: "Tavily basic", sub: "1 积分", bars: [{ v: 8, color: S4, label: "$8" }] },
      { label: "AgentCore Web Search", sub: "每次查询", bars: [{ v: 7, color: S4, label: "$7" }] },
      { label: "Exa search", sub: "fast / auto", bars: [{ v: 7, color: S4, label: "$7" }] },
      { label: "Exa search", sub: "instant", bars: [{ v: 4, color: S4, label: "$4" }] },
    ], { max: 18, fmt: (v) => "$" + v, ticks: [0, 5, 10, 15], labelW: 150, aria: "搜索价格" });

    // cpu share (TrEnv-X Table 2)
    const ag = [["Blackjack", "LangChain", 3.2, 0.411, 74], ["Bug fixer", "LangChain", 36.5, 0.809, 95], ["Map reduce", "LangChain", 56.5, 1.2, 199], ["Shop assistant", "Browser-Use", 140.7, 10.3, 1080], ["Game design", "OpenManus", 107.0, 7.5, 1389], ["Blog summary", "OWL", 193.1, 56.8, 1246]];
    barChart($("#ch-cpu"), ag.map(([n, f, e2e, cpu, mem]) => {
      const pct = (cpu / e2e) * 100;
      return { label: n, sub: f, bars: [{ v: pct, color: /Browser|OWL|OpenManus/.test(f) ? S4 : S3, label: `${pct.toFixed(1)}% · ${e2e} s · ${mem} MB`, tip: `${n}：CPU 时间 ${cpu} s / 端到端 ${e2e} s，内存 ${mem} MB` }] };
    }), { max: 50, fmt: (v) => v.toFixed(0) + "%", ticks: [0, 10, 20, 30, 40, 50], labelW: 110, aria: "CPU 时间占比" });

    // image access
    barChart($("#ch-image"), [["C++", 8.7, 4.9], ["Go", 13.3, 4.1], ["Java", 9.2, 12.1], ["JavaScript", 4.2, 9.6], ["Python", 6.0, 6.0]].map(([n, p, gb]) => ({ label: n, sub: "镜像 " + gb + " GB", bars: [{ v: p, color: S3, label: p + "%", tip: `${n} 镜像 ${gb} GB，运行时读取 ${p}%` }] })), { max: 100, fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], labelW: 100, aria: "镜像读取比例" });

    // bill
    legend($("#lg-bill"), [[S1, "未缓存输入"], [S3, "缓存读取"], [S2, "输出"], [INK, "会话运行时长"]]);
    const stack = (parts) => {
      let acc = 0;
      return parts.map(([v, c, n]) => { const b = { lo: acc + 0.0001, hi: acc + v, color: c, label: "", tip: `${n}：$${v.toFixed(3)}` }; acc += v; return b; });
    };
    const billRows = [
      { label: "无缓存", parts: [[0.25, S1, "输入 50K × $5/M"], [0.375, S2, "输出 15K × $25/M"], [0.08, INK, "运行 1 小时 × $0.08"]] },
      { label: "4 万 token 命中缓存", parts: [[0.05, S1, "未缓存输入 10K"], [0.02, S3, "缓存读取 40K × 10%"], [0.375, S2, "输出"], [0.08, INK, "运行 1 小时"]] },
    ];
    // custom stacked render on one line per row
    (function () {
      const el = $("#ch-bill"), w = 560, lw = 130, px = lw + 8, pw = w - px - 70, max = 0.75;
      let y = 18, body = "";
      billRows.forEach((r) => {
        let acc = 0;
        body += `<text x="${lw}" y="${y + 15}" text-anchor="end" font-size="12" style="fill:var(--ink)">${esc(r.label)}</text>`;
        r.parts.forEach(([v, c, n]) => {
          const x = px + (acc / max) * pw, ww = (v / max) * pw;
          body += `<rect class="mark" x="${x}" y="${y}" width="${Math.max(1, ww - 2)}" height="22" rx="2" style="fill:${c}" data-tip="${esc(n + "：$" + v.toFixed(3))}"/>`;
          acc += v;
        });
        body += `<text class="val" x="${px + (acc / max) * pw + 6}" y="${y + 15}">$${acc.toFixed(3)}</text>`;
        y += 40;
      });
      let grid = "";
      [0, 0.25, 0.5, 0.75].forEach((t) => { const x = px + (t / max) * pw; grid += `<line class="grid" x1="${x}" y1="10" x2="${x}" y2="${y - 6}"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="10.5" style="fill:var(--ink-3)">$${t}</text>`; });
      el.innerHTML = `<svg class="chart" viewBox="0 0 ${w} ${y + 14}" role="img" aria-label="会话费用构成">${grid}${body}</svg>`;
    })();

    // vcpu prices
    barChart($("#ch-vcpu"), [
      { label: "AgentCore microVM v2", sub: "按用量", bars: [{ v: 0.1276, color: S2 }] },
      { label: "AgentCore microVM v1", sub: "Browser 等同价", bars: [{ v: 0.0895, color: S2 }] },
      { label: "Daytona", sub: "按秒", bars: [{ v: 0.0504, color: S3 }] },
      { label: "E2B", sub: "$0.000014/秒", bars: [{ v: 0.0504, color: S3 }] },
    ], { max: 0.15, fmt: (v) => "$" + v.toFixed(4), ticks: [0, 0.05, 0.1, 0.15], tickFmt: (t) => "$" + t, labelW: 150, aria: "vCPU 单价" });

    // benchmarks
    legend($("#lg-bench"), [[INK, "人类"], [S1, "发布时最好的 agent"]]);
    barChart($("#ch-bench"), [
      { label: "WebArena", sub: "2023 · GPT-4", bars: [{ v: 78.24, color: INK }, { v: 14.41, color: S1 }] },
      { label: "OSWorld", sub: "2024", bars: [{ v: 72.36, color: INK }, { v: 12.24, color: S1 }] },
      { label: "TheAgentCompany", sub: "2024", bars: [{ v: 30, color: S1 }] },
      { label: "SWE-bench", sub: "2023 · Claude 2", bars: [{ v: 1.96, color: S1 }] },
    ], { max: 100, fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], labelW: 120, aria: "基准成绩" });

    barChart($("#ch-audit"), [
      { label: "8 篇 agent 基准", bars: [{ v: 0.38, color: S2 }] },
      { label: "4 篇静态基准", bars: [{ v: 0.66, color: INK }] },
    ], { max: 1, fmt: (v) => v.toFixed(2), ticks: [0, 0.25, 0.5, 0.75, 1], labelW: 110, barH: 18, aria: "披露得分" });

    barChart($("#ch-rl"), [
      { label: "HetRL", sub: "异构 GPU 吞吐（平均 3.17×）", bars: [{ v: 9.17, color: S1 }] },
      { label: "RhymeRL", sub: "整体性能", bars: [{ v: 2.6, color: S1 }] },
      { label: "RLinf", sub: "训练吞吐 1.07–2.43×", bars: [{ lo: 1.07, hi: 2.43, color: S1 }] },
      { label: "RollArt", sub: "训练时间 1.31–2.05×", bars: [{ lo: 1.31, hi: 2.05, color: S1 }] },
      { label: "Seer", sub: "rollout 吞吐", bars: [{ v: 2.04, color: S1 }] },
      { label: "DynaRL", sub: "端到端吞吐", bars: [{ v: 1.98, color: S1 }] },
    ], { max: 10, fmt: (v) => v + "×", ticks: [0, 2, 4, 6, 8, 10], labelW: 120, aria: "RL 系统加速比" });
  }

  /* ---------------- vendor matrix ---------------- */
  const M = [
    { g: "managed", name: "厂商提供 harness 的托管服务" },
    { g: "managed", p: "OpenAI Agents API", v: "beta", r: ["openai/agents-api/overview", "openai/agents-api/architecture", "openai/agents-api/hosted-sandbox"],
      c: [["h", "OpenAI 托管的 Codex harness"], ["h", "Session、事件流与 webhook，运行中可插话引导"], ["h", "OpenAI 模型"], ["o", "none / OpenAI 托管 Linux 沙箱（可选容器规格）/ 自托管执行器 codex exec-server"], ["h", "web search、远程 MCP、子 agent；函数工具由应用执行"], "模型 token + 工具标准价 + 容器价"] },
    { g: "managed", p: "Claude Managed Agents", v: "beta", r: ["anthropic/claude-managed-agents/overview", "anthropic/claude-managed-agents/self-hosted-sandboxes", "anthropic/claude-api/pricing"],
      c: [["h", "Anthropic 托管 harness，内置缓存与 compaction"], ["h", "Session 与 SSE 事件，历史存于服务端"], ["h", "Claude 模型"], ["o", "Anthropic 云沙箱（Ubuntu 容器）或自托管 worker（Cloudflare、Daytona、Modal、Vercel）"], ["h", "Bash、文件操作、web search / fetch、MCP、MCP tunnels"], "token + $0.08/会话小时（仅 running）"] },
    { g: "managed", p: "Managed Agents API on Agent Platform", v: "Google · Pre-GA", r: ["google/managed-agents/overview", "google/managed-agents/sandbox-environment"],
      c: [["h", "Antigravity harness"], ["h", "Interactions API（数据面）；Agents API 管理配置"], ["h", "Agent Platform 模型，预览期按标准价"], ["h", "托管 Linux 沙箱，默认无网络，TTL 7 天，可挂载 Cloud Storage"], ["h", "bash、file_system、MCP、Skill Registry、网页搜索"], "预览期按模型标准价"] },
    { g: "managed", p: "Bedrock Managed Agents, powered by OpenAI", v: "AWS", r: ["aws/bedrock-managed-agents/overview", "openai/agents-api/bedrock-managed-agents"],
      c: [["h", "OpenAI Codex harness，运行在 Bedrock 内"], ["h", "Bedrock 服务端点，IAM SigV4 认证"], ["h", "OpenAI 模型，经 Amazon Bedrock 推理"], ["o", "默认 AgentCore Runtime，或自托管计算"], ["h", "可接 AgentCore 的授权、发现、观测、评估等能力"], "见 AWS 页面"] },
    { g: "runtime", name: "运行平台：用户自带 harness" },
    { g: "runtime", p: "AgentCore Runtime", v: "AWS", r: ["aws/agentcore-runtime/runtime", "aws/agentcore-runtime/instances", "aws/agentcore/pricing"],
      c: [["b", "LangGraph、Strands、CrewAI、OpenAI Agents SDK、Claude Agent SDK 等"], ["h", "InvokeAgentRuntime，HTTP 或 WebSocket，按 runtimeSessionId 区分会话"], ["b", "任意模型：Bedrock、Claude、Gemini、OpenAI"], ["h", "每会话一个 microVM（≤ 8 小时），或账户内 EC2 实例（≤ 14 天，可用 GPU）"], ["h", "Gateway、Browser、Code Interpreter、Web Search、Memory、Identity"], "活跃 vCPU 小时 + GB 小时，组件分别计价"] },
    { g: "runtime", p: "Agent Runtime（原 Agent Engine）", v: "Google", r: ["google/agent-runtime/overview", "google/agent-platform/runtime-scaling", "google/agent-platform-sandbox/overview"],
      c: [["b", "ADK（完全集成）、LangChain、LangGraph、AG2、LlamaIndex、CrewAI、任意容器"], ["h", "查询 API、双向流；Sessions 与 Memory Bank 另行提供"], ["b", "agent 代码自行调用"], ["h", "托管运行时（min_instances、container_concurrency 可调）+ 独立沙箱（代码执行、Computer Use、自定义容器）"], ["h", "Agent Gateway、Code Execution、Computer Use"], "见 Agent Platform 价格页"] },
    { g: "runtime", p: "Foundry Hosted agents", v: "Microsoft · preview", r: ["microsoft/foundry-hosted-agents/hosted-agents", "microsoft/foundry-hosted-agents/runtime-contract"],
      c: [["b", "Agent Framework、LangGraph、Semantic Kernel、自定义代码（Python / C#）"], ["h", "Responses、Invocations、WebSocket、A2A、Activity 协议"], ["h", "Foundry 模型目录"], ["h", "每会话 VM 隔离沙箱，0.5–2 vCPU，$HOME 持久，空闲 2–60 分钟回收"], ["h", "Toolbox MCP 端点：Code Interpreter、Bing 搜索、AI Search、MCP、A2A"], "活跃会话的 CPU + 内存"] },
    { g: "sandbox", name: "沙箱：只提供执行环境" },
    { g: "sandbox", p: "E2B", v: "", r: ["e2b/sandbox/overview", "e2b/sandbox/persistence", "e2b/sandbox/pricing"],
      c: [["b", "外部 harness 调用 SDK"], ["n", ""], ["n", ""], ["h", "按秒计费；Hobby 会话 ≤ 1 小时 / 20 并发，Pro ≤ 24 小时 / 100 并发"], ["n", ""], "$0.000014/vCPU·秒"] },
    { g: "sandbox", p: "Daytona", v: "", r: ["daytona/sandbox/overview", "daytona/sandbox/pricing"],
      c: [["b", "外部 harness 调用 SDK"], ["n", ""], ["n", ""], ["h", "按秒计费，提供 GPU 与 Windows 规格"], ["n", ""], "vCPU $0.0504/时，内存 $0.0162/GiB·时"] },
    { g: "sandbox", p: "Cloud Run sandboxes", v: "Google · preview", r: ["google/cloud-run-sandboxes/announcement"],
      c: [["b", "运行在 Cloud Run 服务内的 agent"], ["n", ""], ["n", ""], ["h", "在服务实例内启动，只读文件系统 + 内存覆盖层，默认无出站网络"], ["n", ""], "用服务已分配的 CPU 与内存，无额外费用"] },
    { g: "sandbox", p: "GKE Agent Sandbox", v: "Google", r: ["google/gke-agent-sandbox/pod-snapshot-blog"],
      c: [["b", "部署在 GKE 上的 agent（如 ADK）"], ["n", ""], ["n", ""], ["h", "gVisor 隔离的 pod，Pod Snapshots 快速恢复"], ["n", ""], "GKE 资源计费"] },
    { g: "tool", name: "工具：搜索 API" },
    { g: "tool", p: "Exa", v: "", r: ["exa/search/overview", "exa/search/pricing"], c: [["n", ""], ["n", ""], ["n", ""], ["n", ""], ["h", "搜索、Deep Search、Contents、Answer、Monitors"], "$4–15/千次请求"] },
    { g: "tool", p: "Tavily", v: "", r: ["tavily/search/overview", "tavily/search/pricing"], c: [["n", ""], ["n", ""], ["n", ""], ["n", ""], ["h", "Search、Extract、Map、Crawl、Research"], "$0.008/积分（按量）"] },
    { g: "app", name: "面向开发者的云端编程 agent" },
    { g: "app", p: "Codex Cloud", v: "OpenAI", r: ["openai/codex-cloud/overview", "openai/codex-cloud/environments"],
      c: [["h", "Codex"], ["h", "ChatGPT 网页、桌面与手机，终端也可发起"], ["h", "OpenAI 模型"], ["h", "发布的云环境（仓库、依赖、工具），每个任务独立工作区"], ["h", "network secret 经代理替换"], "—"] },
    { g: "app", p: "Claude Code 云会话", v: "Anthropic", r: ["anthropic/claude-code-web/overview"],
      c: [["h", "Claude Code"], ["h", "claude.ai/code、桌面、手机；CLI --cloud 与 --teleport"], ["h", "Claude 模型"], ["o", "Anthropic 托管或组织自托管环境"], ["h", "GitHub 代理在服务端附加凭据"], "随 Pro、Max、Team、Enterprise 方案提供"] },
    { g: "app", p: "Copilot cloud agent", v: "GitHub", r: ["github/copilot-cloud-agent/overview", "github/copilot-cloud-agent/api"],
      c: [["h", "Copilot cloud agent"], ["h", "GitHub.com 的 issue、PR、agents 面板与 API"], ["h", "可选模型，取决于方案"], ["h", "临时云开发环境，单次 ≤ 59 分钟"], ["h", "GitHub MCP 服务器，可配置更多 MCP"], "按 Copilot 方案"] },
    { g: "app", p: "Jules", v: "Google", r: ["google/jules/overview"],
      c: [["h", "Jules"], ["h", "网页、CLI、API，或用 issue 标签分配"], ["h", "Gemini 3 Pro"], ["h", "在 Cloud VM 中克隆仓库并验证修改"], ["n", ""], "按方案"] },
    { g: "app", p: "Kiro Web", v: "AWS", r: ["aws/kiro-web/overview", "aws/kiro-web/sandbox"],
      c: [["h", "Kiro"], ["h", "网页，可从任意界面重新接入会话"], ["n", ""], ["h", "每个任务一个隔离沙箱，内置 headless Chrome 与 Playwright MCP"], ["h", "浏览器自动化工具"], "—"] },
  ];
  const OWN = { h: ["h", "托管"], b: ["b", "自带"], o: ["o", "可选"], n: ["n", "无"] };
  function drawMatrix(filter) {
    const cols = [["Harness", "var(--c-harness)"], ["会话接口", "var(--c-session)"], ["模型推理", "var(--c-model)"], ["执行环境", "var(--c-env)"], ["托管工具", "var(--c-tool)"], ["计费", "var(--rule)"]];
    let h = `<table><thead><tr><th>产品</th>${cols.map(([n, c]) => `<th><span class="bar" style="background:${c}"></span>${n}</th>`).join("")}</tr></thead><tbody>`;
    M.forEach((row) => {
      if (filter !== "all" && row.g !== filter) return;
      if (row.name) { h += `<tr class="grp"><td colspan="7">${esc(row.name)}</td></tr>`; return; }
      const refs = row.r.map((r) => `<button class="ref" data-r="${esc(r)}"></button>`).join("");
      h += `<tr><th>${esc(row.p)}<small>${esc(row.v)}</small><span class="mrefs">来源 ${refs}</span></th>`;
      row.c.forEach((cell) => {
        if (typeof cell === "string") { h += `<td>${esc(cell)}</td>`; return; }
        const [k, t] = cell;
        const [cls, lab] = OWN[k];
        h += `<td><span class="own ${cls}">${lab}</span>${esc(t)}</td>`;
      });
      h += `</tr>`;
    });
    h += `</tbody></table>`;
    $("#matrix").innerHTML = h;
    $$("#matrix tbody th").forEach((th) => { $$(".ref", th).forEach((b, i) => { b.textContent = String(i + 1); b.type = "button"; b.setAttribute("aria-label", "来源：" + ((SRC[b.dataset.r] || {}).title || "")); }); });
  }
  $$(".matrix-tools button").forEach((b) => b.addEventListener("click", () => {
    $$(".matrix-tools button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    drawMatrix(b.dataset.f);
  }));

  /* ---------------- source index ---------------- */
  function drawSources(q) {
    q = (q || "").trim().toLowerCase();
    const groups = {};
    (window.SOURCES || []).forEach((s) => {
      const key = s.kind === "paper" ? "论文 · " + s.topic : "厂商 · " + s.vendor;
      const hay = (s.title + " " + s.id + " " + key).toLowerCase();
      if (q && !hay.includes(q)) return;
      (groups[key] = groups[key] || []).push(s);
    });
    const keys = Object.keys(groups).sort((a, b) => (a.startsWith("厂商") === b.startsWith("厂商") ? a.localeCompare(b) : a.startsWith("厂商") ? -1 : 1));
    let n = 0, h = "";
    keys.forEach((k) => {
      h += `<div class="src-group">${esc(k)}</div>`;
      groups[k].forEach((s) => { n++; h += `<div class="src-item"><div class="t">${esc(s.title.replace(/\$\\tau\$/g, "τ"))}</div><div class="m">${esc(srcMeta(s))}</div><div class="l">${srcLinks(s)}</div></div>`; });
    });
    $("#src-list").innerHTML = h || `<p class="note">没有匹配的资料。</p>`;
    $("#src-count").textContent = `${n} 条`;
  }
  $("#src-q").addEventListener("input", (e) => drawSources(e.target.value));

  /* ---------------- pager ---------------- */
  const pages = $$(".page");
  const sel = $("#toc-select");
  const toc = $("#toc");
  pages.forEach((p, i) => {
    const num = String(i + 1).padStart(2, "0");
    const o = document.createElement("option");
    o.value = p.dataset.id;
    o.textContent = `${num} ${p.dataset.title}`;
    sel.appendChild(o);
    if (i > 0) {
      const a = document.createElement("a");
      a.href = "#" + p.dataset.id;
      a.innerHTML = `<span>${num}</span><span>${esc(p.dataset.title)}</span>`;
      toc.appendChild(a);
    }
  });
  let cur = 0;
  function show(i, push) {
    cur = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach((p, k) => { p.hidden = k !== cur; });
    sel.value = pages[cur].dataset.id;
    $("#counter").textContent = `${String(cur + 1).padStart(2, "0")} / ${pages.length}`;
    $("#bar").style.width = ((cur + 1) / pages.length) * 100 + "%";
    $("#prev").disabled = cur === 0;
    $("#next").disabled = cur === pages.length - 1;
    const fp = $("#foot-prev"), fn = $("#foot-next");
    fp.disabled = cur === 0;
    fn.disabled = cur === pages.length - 1;
    fp.textContent = cur > 0 ? "← " + pages[cur - 1].dataset.title : "";
    fn.textContent = cur < pages.length - 1 ? pages[cur + 1].dataset.title + " →" : "";
    pop.hidden = true;
    if (push) {
      try { history.replaceState(null, "", "#" + pages[cur].dataset.id); } catch (e) { /* ignore */ }
      window.scrollTo(0, 0);
    }
  }
  function fromHash() {
    const id = (location.hash || "").slice(1);
    const i = pages.findIndex((p) => p.dataset.id === id);
    return i >= 0 ? i : 0;
  }
  $("#prev").addEventListener("click", () => show(cur - 1, true));
  $("#next").addEventListener("click", () => show(cur + 1, true));
  $("#foot-prev").addEventListener("click", () => show(cur - 1, true));
  $("#foot-next").addEventListener("click", () => show(cur + 1, true));
  sel.addEventListener("change", () => show(pages.findIndex((p) => p.dataset.id === sel.value), true));
  toc.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    show(pages.findIndex((p) => "#" + p.dataset.id === a.getAttribute("href")), true);
  });
  window.addEventListener("hashchange", () => show(fromHash(), false));
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    if (e.key === "ArrowRight") show(cur + 1, true);
    if (e.key === "ArrowLeft") show(cur - 1, true);
  });
  let tx = null, ty = null;
  document.addEventListener("touchstart", (e) => {
    if (e.target.closest(".dgm-wrap, .matrix, .frame")) { tx = null; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) show(cur + (dx < 0 ? 1 : -1), true);
    tx = null;
  }, { passive: true });

  /* ---------------- init ---------------- */
  drawModel();
  drawEvo();
  drawLife();
  drawIso();
  drawCred();
  drawLens();
  drawCharts();
  drawMatrix("all");
  drawSources("");
  show(fromHash(), false);
})();
