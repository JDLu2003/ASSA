/* Agent as a Service survey: navigation, diagrams, charts, numbered references. */
(function () {
  "use strict";

  const SRC = {};
  (window.SOURCES || []).forEach((s) => { SRC[s.id] = s; });
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LG = window.LOGOS || {};

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

  /* ---------------- references: numbered in order of first citation ---------------- */
  const REFN = {};
  const refOrder = [];
  const cleanTitle = (t) => String(t).replace(/\$\\tau\$/g, "τ");
  function numberRefs() {
    $$(".page .ref").forEach((b) => {
      const id = b.dataset.r;
      if (!(id in REFN)) { refOrder.push(id); REFN[id] = refOrder.length; }
    });
  }
  function labelRefs(root) {
    $$(".ref", root).forEach((b) => {
      const s = SRC[b.dataset.r];
      const n = REFN[b.dataset.r];
      b.textContent = n ? String(n) : "?";
      b.type = "button";
      // a comma separates refs that sit directly next to each other
      let prev = b.previousSibling;
      if (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      b.classList.toggle("adj", !!(prev && prev.nodeType === 1 && prev.classList.contains("ref")));
      b.setAttribute("aria-label", `参考文献 ${n || ""}：${s ? cleanTitle(s.title) : b.dataset.r}`);
    });
  }
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
    if (s.kind === "paper") return [s.venue, (s.authors || []).slice(0, 3).join(", ") + ((s.authors || []).length > 3 ? " 等" : "")].filter(Boolean).join(" · ");
    return [s.vendor, s.product].filter(Boolean).join(" · ");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".ref");
    if (!b) { if (!e.target.closest(".pop")) pop.hidden = true; return; }
    const s = SRC[b.dataset.r];
    if (!s) return;
    pop.innerHTML = `<div class="t">[${REFN[b.dataset.r] || "?"}] ${esc(cleanTitle(s.title))}</div><div class="m">${esc(srcMeta(s))}</div><div class="l">${srcLinks(s)}</div>`;
    pop.hidden = false;
    const r = b.getBoundingClientRect();
    const x = Math.max(16, Math.min(r.left, window.innerWidth - pop.offsetWidth - 16));
    let y = r.bottom + 8;
    if (y + pop.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - pop.offsetHeight - 8);
    pop.style.left = x + "px";
    pop.style.top = y + "px";
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") pop.hidden = true; });

  /* ---------------- light-ground diagram kit ----------------
     Self-drawn diagrams sit in the light photo frame (also in dark mode), so they use a fixed palette. */
  const P = { ink: "#1f2328", sub: "#57606a", mute: "#868d94", line: "#c3c9ce", soft: "#f4f6f7", white: "#ffffff", session: "#2a78d6", model: "#df5f2a", env: "#14996a", tool: "#5a4abd" };
  let kitN = 0;
  function kit() {
    const id = ++kitN;
    const cols = { ink: P.mute, session: P.session, model: P.model, env: P.env, tool: P.tool };
    const defs = `<defs>${Object.entries(cols).map(([k, c]) => `<marker id="k${id}-${k}" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,1.2 L9,5 L0,8.8 z" fill="${c}"/></marker>`).join("")}</defs>`;
    return { defs, m: (k) => `url(#k${id}-${k})` };
  }
  const R = (x, y, w, h, o) => {
    o = o || {};
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx != null ? o.rx : 8}" fill="${o.fill || P.white}" stroke="${o.stroke || P.line}" stroke-width="${o.sw || 1.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  };
  const T = (x, y, s, o) => {
    o = o || {};
    const halo = o.halo ? ` paint-order="stroke" stroke="${o.halo}" stroke-width="4" stroke-linejoin="round"` : "";
    const fill = o.fill ? ` style="fill:${o.fill}"` : "";
    return `<text x="${x}" y="${y}" font-size="${o.size || 12}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.cls ? ` class="${o.cls}"` : ""}${fill}${halo}>${esc(s)}</text>`;
  };
  const L = (d, color, K, o) => {
    o = o || {};
    const mk = K.m(o.mk || "ink");
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.end === false ? "" : ` marker-end="${mk}"`}${o.start ? ` marker-start="${mk}"` : ""}/>`;
  };
  const img = (key, x, y, s) => (LG[key] ? `<image href="${LG[key]}" x="${x}" y="${y}" width="${s}" height="${s}"/>` : "");
  const num = (x, y, n, color, r) => `<g><circle cx="${x}" cy="${y}" r="${r || 11}" fill="${color}" stroke="${P.white}" stroke-width="3"/><text x="${x}" y="${y + 4.2}" text-anchor="middle" font-size="12" font-weight="700" style="fill:#ffffff">${n}</text></g>`;
  const ICON = {
    config: '<path d="M4.5 7h9M17.5 7h2M15.5 5v4M4.5 12h3M11.5 12h8M9.5 10v4M4.5 17h11M17.5 15v4"/>',
    vault: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12h8.6M17.2 12v3M20.2 12v2.2"/>',
    log: '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    memory: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  };
  const icon = (k, x, y, s, stroke) => `<g transform="translate(${x},${y}) scale(${s / 24})" fill="none" stroke="${stroke || P.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</g>`;

  /* ---------------- figure: the service structure ---------------- */
  function drawModel() {
    const K = kit();
    const W = 1200, H = 556;
    let g = `<svg class="dgm lt" viewBox="0 0 ${W} ${H}" role="img" aria-label="托管智能体服务的结构：应用经会话接口连接 harness 的上下文与会话；harness 调用模型、在执行环境中执行命令、调用搜索与 MCP，分别对应右侧三类外部资源；服务另外保存配置、会话日志、凭据与记忆">${K.defs}`;

    // service boundary
    g += R(300, 18, 520, 520, { fill: P.soft, stroke: P.mute, dash: "6 5", rx: 16 });
    g += T(322, 46, "托管智能体服务", { size: 14, weight: 700 }) + T(432, 46, "虚线框内由服务方运行", { size: 12, cls: "m" });

    // harness
    g += R(330, 62, 460, 318, { stroke: P.ink, sw: 1.5, rx: 12 });
    g += T(352, 92, "Agent harness", { size: 18, weight: 700 });
    g += T(352, 112, "以上下文为中心，循环调用模型与工具", { size: 12, cls: "s" });
    // context and session
    g += R(352, 126, 196, 188, { stroke: P.session, sw: 1.4, fill: P.soft, rx: 10 });
    g += T(366, 150, "上下文与会话", { size: 13, weight: 700 });
    ["系统提示与 skills", "对话与工具结果", "上下文压缩", "子 agent", "中断后恢复"].forEach((t, i) => { g += T(366, 176 + i * 24, t, { size: 11.5, cls: "s" }); });
    // steps, one per external interface
    const steps = [[144, "调用模型", P.model], [220, "执行命令、读写文件", P.env], [296, "调用搜索与 MCP", P.tool]];
    steps.forEach(([cy, t, c]) => {
      g += L(`M550,${cy} H596`, P.mute, K, { start: true, sw: 1.3 });
      g += R(598, cy - 18, 172, 36, { stroke: c, sw: 1.5, rx: 18 }) + T(684, cy + 4.5, t, { size: 12.5, anchor: "middle" });
    });
    // implementations
    const implRow = (y, label, items) => {
      let s = T(352, y + 13, label, { size: 11.5, cls: "m" }), x = 414;
      items.forEach(([k, n]) => { s += img(k, x, y, 18) + T(x + 24, y + 13.5, n, { size: 12 }); x += 24 + textW(n, 12) + 18; });
      return s;
    };
    g += implRow(324, "厂商托管", [["codex", "Codex"], ["claudecode", "Claude Code"], ["antigravity", "Antigravity"]]);
    g += implRow(350, "用户自带", [["langgraph", "LangGraph"], ["crewai", "CrewAI"], ["strands", "Strands"], ["langchain", "LangChain"]]);

    // state kept by the service
    g += T(330, 408, "服务保存的状态", { size: 12.5, weight: 700, fill: P.sub });
    const st = [["config", "Agent 配置", "模型、指令、工具"], ["log", "会话日志", "append-only 事件"], ["vault", "凭据 vault", "在沙箱之外保存"], ["memory", "记忆与观测", "记忆、追踪、评估"]];
    st.forEach(([k, t, s], i) => {
      const x = 330 + i * 117.7;
      g += R(x, 420, 107, 62) + icon(k, x + 10, 428, 18) + T(x + 34, 442, t, { size: 12.5, weight: 700 }) + T(x + 10, 470, s, { size: 11, cls: "s" });
    });
    g += T(330, 508, "OpenAI、Anthropic、Google Managed Agents 托管框内的全部部分；", { size: 11.5, cls: "m" });
    g += T(330, 526, "AgentCore、Foundry 等运行平台托管会话与状态，harness 由用户提供。", { size: 11.5, cls: "m" });

    // applications (left)
    g += R(16, 110, 210, 222, { rx: 10 });
    g += T(32, 136, "应用与用户", { size: 13.5, weight: 700 }) + T(32, 155, "经 API、网页或 IDE 调用", { size: 11, cls: "m" });
    [["openai", "ChatGPT"], ["claude", "claude.ai"], ["github", "GitHub"], ["notion", "Notion"], ["icon-server", "企业后端"], ["icon-clock", "定时任务"]].forEach(([k, n], i) => {
      const y = 182 + i * 25;
      g += img(k, 32, y - 13, 17) + T(58, y, n, { size: 12 });
    });
    g += L("M226,220 H350", P.session, K, { mk: "session", start: true, sw: 1.8 });
    g += T(262, 210, "提交任务", { size: 11, anchor: "middle", cls: "s" }) + T(262, 240, "事件流", { size: 11, anchor: "middle", cls: "s" });
    g += num(300, 220, "1", P.session);
    g += T(300, 196, "会话接口", { size: 11.5, weight: 700, anchor: "middle", fill: P.session, halo: P.soft });

    // external resources (right)
    const dock = (o) => {
      const rows = Math.ceil(o.items.length / 3);
      const h = 50 + rows * 25 + 4;
      let s = R(868, o.y, 316, h, { rx: 10, stroke: o.c, sw: 1.3 });
      s += num(890, o.y + 23, o.n, o.c, 10) + T(908, o.y + 28, o.t, { size: 13.5, weight: 700 }) + T(1170, o.y + 28, o.en, { size: 11, anchor: "end", cls: "m" });
      o.items.forEach(([k, n], i) => {
        const x = 884 + (i % 3) * 98, y = o.y + 62 + Math.floor(i / 3) * 25;
        s += img(k, x, y - 12.5, 16) + T(x + 22, y, n, { size: 11.5 });
      });
      return { svg: s, h };
    };
    const d2 = dock({ y: 18, n: "2", c: P.model, t: "模型推理", en: "Inference", items: [["openai", "OpenAI"], ["claude", "Claude"], ["gemini", "Gemini"], ["bedrock", "Bedrock"], ["azureai", "Foundry"], ["vllm", "vLLM"], ["sglang", "SGLang"]] });
    const d3 = dock({ y: 168, n: "3", c: P.env, t: "执行环境", en: "Sandbox", items: [["openai", "OpenAI"], ["anthropic", "Anthropic"], ["aws", "AgentCore"], ["azureai", "Foundry"], ["googlecloud", "Google"], ["e2b", "E2B"], ["daytona", "Daytona"], ["modal", "Modal"], ["cloudflare", "Cloudflare"], ["vercel", "Vercel"], ["icon-laptop", "自有机器"]] });
    const d4 = dock({ y: 344, n: "4", c: P.tool, t: "托管工具", en: "Hosted tools", items: [["google", "Google 搜索"], ["bing", "Bing 搜索"], ["exa", "Exa"], ["tavily", "Tavily"], ["chrome", "浏览器"], ["python", "代码执行"], ["mcp", "MCP 服务器"], ["icon-server", "网关"]] });
    g += d2.svg + d3.svg + d4.svg;
    const link = (y1, y2, c, mk, n) => L(`M772,${y1} H820 L866,${y2}`, c, K, { mk, start: true, sw: 1.8 }) + num(820, y1, n, c);
    g += link(144, 18 + d2.h / 2, P.model, "model", "2");
    g += link(220, 168 + d3.h / 2, P.env, "env", "3");
    g += link(296, 344 + d4.h / 2, P.tool, "tool", "4");
    g += `</svg>`;
    $("#model-dgm").innerHTML = g;
  }

  /* ---------------- figure: Anthropic brain / session / hands (drawn from the article text) ---------------- */
  function drawAnthropic() {
    const K = kit();
    let g = `<svg class="dgm lt" viewBox="0 0 600 316" role="img" aria-label="Anthropic Managed Agents：harness 与沙箱分别运行，由会话日志连接，凭据在 vault 中">${K.defs}`;
    const box = (x, logo, t, s, note, c) => R(x, 52, 196, 104, { stroke: c, sw: 1.4, rx: 10 }) + img(logo, x + 16, 68, 26) + T(x + 52, 80, t, { size: 14, weight: 700 }) + T(x + 52, 98, s, { size: 11.5, cls: "s" }) + T(x + 16, 140, note, { size: 11, cls: "m" });
    g += box(16, "claude", "Harness", "调用 Claude 的循环", "“brain”，Anthropic 托管", P.ink);
    g += box(388, "icon-terminal", "沙箱", "执行代码与工具", "“hands”，云沙箱或自托管", P.env);
    g += L("M214,92 H386", P.env, K, { mk: "env" }) + T(300, 84, "工具调用", { size: 11.5, anchor: "middle", cls: "s" });
    g += L("M386,116 H214", P.env, K, { mk: "env" }) + T(300, 134, "结果", { size: 11.5, anchor: "middle", cls: "s" });
    g += R(232, 6, 136, 30, { rx: 15 }) + icon("vault", 244, 11, 20) + T(270, 26, "Vault 与代理", { size: 12, weight: 700 });
    g += L("M368,21 C420,21 456,28 470,50", P.mute, K, { dash: "4 4", sw: 1.3 }) + T(446, 16, "按需取出凭据", { size: 11, cls: "m" });
    g += R(16, 196, 568, 104, { stroke: P.session, sw: 1.4, rx: 10 });
    g += icon("log", 30, 208, 20) + T(58, 223, "Session", { size: 14, weight: 700 }) + T(120, 223, "append-only 事件日志，存放在运行 agent 的进程之外", { size: 11.5, cls: "s" });
    const ev = [["用户消息", P.session], ["模型调用", P.model], ["工具调用", P.env], ["工具结果", P.env], ["模型调用", P.model], ["…", P.mute]];
    let ex = 30;
    g += `<line x1="30" y1="262" x2="570" y2="262" stroke="${P.line}" stroke-width="1.2"/>`;
    ev.forEach(([t, c]) => {
      const w = textW(t, 11) + 28;
      g += R(ex, 250, w, 24, { rx: 12 }) + `<circle cx="${ex + 12}" cy="262" r="4" fill="${c}"/>` + T(ex + 21, 266, t, { size: 11 });
      ex += w + 10;
    });
    g += T(30, 292, "空闲时容器打检查点；会话可在之后从原处恢复", { size: 11, cls: "m" });
    g += L("M84,158 V194", P.session, K, { mk: "session", dash: "4 4", sw: 1.3 }) + T(92, 181, "追加事件", { size: 11, cls: "m" });
    g += L("M170,194 V158", P.session, K, { mk: "session", dash: "4 4", sw: 1.3 }) + T(178, 181, "读取历史、恢复", { size: 11, cls: "m" });
    g += `</svg>`;
    $("#anthropic-dgm").innerHTML = g;
  }

  /* ---------------- table: names for the layer around the model ---------------- */
  function drawTmapHarness() {
    const ref = (r) => r.map((x) => `<button class="ref" data-r="${esc(x)}"></button>`).join("");
    const c = (t) => esc(t).replace(/`([^`]+)`/g, "<code>$1</code>");
    const groups = [
      ["评测论文", [
        [null, "AI Agents That Matter", ["ai-agents-that-matter"], "`LM Evaluation Harness`、`HELM`", "运行 LLM 评测的框架"],
        [null, "基准披露审计", ["benchmark-disclosure-audit"], "`harness specification`、`scaffold`", "模型外面的脚手架、工具、停止规则与环境镜像"],
        [null, "TheAgentCompany", ["the-agent-company"], "`agent harness`、`agent scaffolds`", "OpenHands 提供的网页浏览与编程执行框架"],
        [null, "Science sandboxes", ["science-sandboxes"], "`model-harness systems`", "各厂商的模型与其原生编程 agent 环境的组合"],
      ]],
      ["厂商文档", [
        ["openai", "OpenAI Agents API", ["openai/agents-api/architecture"], "`Harness`", "OpenAI 托管的 Codex 实例，运行模型与工具循环并维护会话"],
        ["anthropic", "Anthropic", ["anthropic/claude-managed-agents/product-blog"], "`harness`", "循环、工具执行、子 agent 与上下文管理"],
        ["gemini", "Google Managed Agents", ["google/managed-agents/overview"], "`Antigravity harness`", "驱动托管 agent 的程序，在沙箱中推理、规划、执行代码"],
        ["aws", "AWS Bedrock Managed Agents", ["aws/bedrock-managed-agents/overview"], "`OpenAI Harness`", "架构图的 Runtime 层：Agentic Loop、Inference、Memory、Skills"],
      ]],
      ["系统论文与综述", [
        [null, "DSec", ["deepseek-elastic-compute"], "`orchestration harnesses`、`scaffold`", "DeepSeek Harness、OpenCode 等编排程序；RL 训练时放在 agent 沙箱中运行"],
        [null, "YoloFS", ["agent-native-filesystems"], "`agent harnesses`", "调用模型并在执行动作前询问用户的 agent 程序"],
        [null, "Wang 等综述", ["autonomous-agents-survey"], "`LLM-based autonomous agent`", "由 profile、memory、planning、action 模块组成的 agent 程序"],
        [null, "Xi 等综述", ["rise-and-potential-survey"], "`LLM-based agent`", "由 brain、perception、action 组成，与环境交互"],
      ]],
    ];
    let h = `<table><thead><tr><th>出处</th><th>用词</th><th>原文含义</th></tr></thead><tbody>`;
    groups.forEach(([name, rows]) => {
      h += `<tr class="cat"><td colspan="3">${esc(name)}</td></tr>`;
      rows.forEach(([lg, src, r, term, mean]) => {
        h += `<tr><th><span class="src">${lg && LG[lg] ? `<img src="${LG[lg]}" alt="">` : ""}<span>${esc(src)}${ref(r)}</span></span></th><td>${c(term)}</td><td>${esc(mean)}</td></tr>`;
      });
    });
    $("#tmap-harness").innerHTML = h + `</tbody></table>`;
  }

  /* ---------------- table: vendor terminology ---------------- */
  function drawTmap() {
    const cols = [["openai", "OpenAI", "Agents API"], ["anthropic", "Anthropic", "Claude Managed Agents"], ["gemini", "Google", "Managed Agents API"], ["aws", "AWS", "Bedrock Managed Agents"], ["aws", "AWS", "AgentCore Runtime"], ["googlecloud", "Google", "Agent Runtime"], ["microsoft", "Microsoft", "Foundry Hosted agents"]];
    const c = (t) => t.replace(/`([^`]+)`/g, "<code>$1</code>");
    const rows = [
      ["Harness", "执行框架", "var(--c-harness)", ["`Codex harness`，OpenAI 托管", "`agent harness`，Anthropic 托管", "`Antigravity harness`", "`OpenAI Harness`（Runtime 层的 `Agentic Loop`）", "用户的 agent 代码（LangGraph、Strands 等）", "用户的 agent（ADK、LangGraph 等）", "用户的容器（Agent Framework、LangGraph 等）"]],
      ["Agent 配置", "模型、指令、工具", "var(--ink-3)", ["`Agent`", "`Agent`", "Agents API 保存的 agent config", "—", "`agent runtime` 与 runtime version", "`ReasoningEngine` 资源", "`agent version`"]],
      ["会话接口", "Session · Events", "var(--c-session)", ["`Session`、`Events and items`；流式事件或 webhook", "`Session`、`Events`；SSE", "`Interactions API`", "`Client`", "`InvokeAgentRuntime`、`runtimeSessionId`", "Sessions；双向流", "`Responses` / `Invocations` 协议；session ID、conversation ID"]],
      ["模型推理", "Inference", "var(--c-model)", ["OpenAI 模型", "Claude 模型", "Agent Platform 上的模型", "Latest OpenAI Models；Runtime 层的 `Inference`", "任意模型", "`Models (Gemini/3rd party)`", "Foundry 模型目录"]],
      ["执行环境", "Sandbox", "var(--c-env)", ["`Environment`：none / openai_hosted / self_hosted", "`Environment`：cloud / self-hosted sandbox", "`sandbox environment`，`env_id`", "`Environment`：Compute、Storage、Networking、Security", "microVM 或 Instances", "Agent Runtime + `Sandbox`", "按会话分配的 VM 隔离 `sandbox`"]],
      ["托管工具", "Hosted tools", "var(--c-tool)", ["web search、remote MCP、function tools", "Bash、file ops、web search / fetch、MCP tunnels", "bash、file_system、MCP、Skill Registry", "`Tools / MCP`", "Gateway、Browser、Code Interpreter、Web Search", "Agent Gateway、Code Execution、Computer Use", "Toolbox（MCP 服务）"]],
      ["凭据与身份", "Vault · Identity", "var(--ink-3)", ["vault", "Vaults", "范围受限的授权令牌", "agent 的 AWS identity", "AgentCore Identity", "Agent Identity（SPIFFE）", "Microsoft Entra agent identity"]],
      ["记忆与观测", "Memory · Observability", "var(--ink-3)", ["Observability and usage、Tracing", "memory stores、事件历史、观测控制台", "—", "`Memory`；Governance & Observability", "AgentCore Memory、Observability", "Memory Bank、AI Observability", "state store、Application Insights"]],
    ];
    let h = `<table><thead><tr><th>部件</th>${cols.map(([k, v, p]) => `<th><span class="lg">${LG[k] ? `<img src="${LG[k]}" alt="">` : ""}<span>${esc(v)}<small>${esc(p)}</small></span></span></th>`).join("")}</tr></thead><tbody>`;
    rows.forEach(([n, en, col, cells]) => {
      h += `<tr><th style="border-left-color:${col}">${esc(n)}<small>${esc(en)}</small></th>${cells.map((t) => (t === "—" ? `<td class="na">—</td>` : `<td>${c(esc(t))}</td>`)).join("")}</tr>`;
    });
    $("#tmap").innerHTML = h + `</tbody></table>`;
  }

  /* ---------------- diagram: three deployment forms ---------------- */
  function drawEvo() {
    const K = kit();
    let g = `<svg class="dgm lt" viewBox="0 0 1000 336" role="img" aria-label="三种部署形态：模型 API、harness 在沙箱内、harness 与沙箱分离">${K.defs}`;
    const panel = (x, w, t, s) => R(x, 8, w, 320, { fill: "none", stroke: P.line, rx: 12 }) + T(x + 18, 36, t, { size: 14, weight: 700 }) + T(x + 18, 56, s, { size: 11.5, cls: "m" });
    const box = (x, y, w, h, t, s, c, o) => R(x, y, w, h, Object.assign({ stroke: c || P.line, sw: c ? 1.4 : 1.2 }, o || {})) + T(x + w / 2, y + (s ? h / 2 - 3 : h / 2 + 4.5), t, { size: 12.5, weight: 700, anchor: "middle" }) + (s ? T(x + w / 2, y + h / 2 + 14, s, { size: 11, anchor: "middle", cls: "s" }) : "");
    // 1
    g += panel(8, 310, "① 模型 API", "开发者编写循环，自己运行工具");
    g += R(28, 78, 270, 112, { stroke: P.ink, sw: 1.4 }) + T(163, 112, "开发者的应用", { size: 12.5, weight: 700, anchor: "middle" });
    let px = 40;
    ["agent 循环", "工具执行", "状态与凭据"].forEach((t) => { const w = textW(t, 11.5) + 18; g += R(px, 138, w, 26, { rx: 13, fill: P.soft }) + T(px + w / 2, 155, t, { size: 11.5, anchor: "middle" }); px += w + 8; });
    g += L("M163,192 V244", P.model, K, { mk: "model" }) + T(171, 222, "tokens in / out", { size: 11, cls: "m" });
    g += box(88, 248, 150, 50, "模型 API", "", P.model);
    // 2
    g += panel(345, 310, "② harness 在沙箱内", "agent-in-a-sandbox");
    g += R(365, 78, 270, 148, { fill: P.soft, stroke: P.env, dash: "5 4", rx: 10 }) + T(379, 98, "容器", { size: 11.5, cls: "m" });
    g += box(379, 108, 118, 52, "harness", "Agent SDK", P.ink);
    g += box(505, 108, 118, 52, "文件 · 进程", "");
    g += box(379, 168, 244, 44, "凭据", "与模型生成的代码在同一容器");
    g += L("M500,228 V244", P.model, K, { mk: "model" });
    g += box(425, 248, 150, 50, "模型 API", "", P.model);
    // 3
    g += panel(682, 310, "③ harness 与沙箱分离", "agent-with-a-sandbox");
    g += box(700, 78, 128, 64, "harness", "厂商托管", P.ink);
    g += box(856, 78, 122, 64, "沙箱", "厂商或用户的机器", P.env);
    g += L("M830,110 H854", P.env, K, { mk: "env", start: true });
    g += box(700, 164, 278, 40, "会话日志（append-only）", "", P.session);
    g += L("M764,144 V162", P.session, K, { mk: "session", start: true });
    g += box(700, 248, 128, 50, "模型 API", "", P.model);
    g += L("M764,206 V246", P.model, K, { mk: "model" });
    g += box(856, 248, 122, 50, "vault 与代理", "");
    g += L("M917,246 V144", P.mute, K, { dash: "4 4" }) + T(925, 228, "注入凭据", { size: 11, cls: "m" });
    g += `</svg>`;
    $("#evo-dgm").innerHTML = g;
  }

  /* ---------------- diagram: session lifecycle (synthesis) ---------------- */
  function drawLife() {
    const K = kit();
    let g = `<svg class="dgm lt" viewBox="0 0 640 380" role="img" aria-label="汇总的会话生命周期：准备环境、运行、等待外部动作、空闲、删除">${K.defs}`;
    const st = (x, y, t, s, on, grey) => R(x, y, 150, 56, { rx: 28, stroke: on ? P.session : P.mute, sw: on ? 1.8 : 1.3, dash: on ? null : "5 4", fill: grey ? P.soft : P.white }) + T(x + 75, y + 24, t, { size: 13, weight: 700, anchor: "middle" }) + T(x + 75, y + 42, s, { size: 10.5, anchor: "middle", cls: "s" });
    g += st(20, 30, "准备环境", "pending · provisioning", true);
    g += st(245, 30, "运行", "running · Active", true);
    g += st(470, 30, "等待外部动作", "action_required", false);
    g += st(245, 190, "空闲", "idle · Idle", false);
    g += st(470, 190, "删除", "terminated · 过期", false, true);
    const ar = (d, lab, lx, ly, an) => L(d, P.mute, K) + (lab ? T(lx, ly, lab, { size: 11, anchor: an || "middle", cls: "s" }) : "");
    g += ar("M170,58 H243", "环境就绪", 206, 50);
    g += ar("M395,48 H468", "需要外部结果", 431, 40);
    g += ar("M468,68 H397", "结果返回", 431, 84);
    g += ar("M300,86 V188", "一轮结束", 292, 140, "end");
    g += ar("M340,188 V86", "新输入 · 恢复", 348, 140, "start");
    g += ar("M395,218 H468", "长期无活动", 431, 210);
    const notes = (x, y, lines) => lines.map((l, i) => T(x, y + i * 17, l, { size: 11, cls: "m" })).join("");
    g += notes(20, 112, ["OpenAI 自托管：发出 environment_", "connection 后最多等待 5 分钟"]);
    g += notes(20, 206, ["Anthropic：停止计运行时长，", "容器打检查点", "Microsoft：2–60 分钟后释放计算", "AgentCore：microVM 终止，", "/mnt 会话存储保留"]);
    g += notes(470, 266, ["Microsoft：30 天无活动", "AgentCore 存储：空闲 14 天", "Google 沙箱：TTL 7 天"]);
    g += R(20, 334, 44, 20, { rx: 10, stroke: P.session, sw: 1.8 }) + T(72, 349, "占用计算资源", { size: 11, cls: "s" });
    g += R(190, 334, 44, 20, { rx: 10, stroke: P.mute, dash: "5 4" }) + T(242, 349, "可以释放计算，保留会话日志与持久化文件", { size: 11, cls: "s" });
    g += `</svg>`;
    $("#life-dgm").innerHTML = g;
  }

  /* ---------------- diagram: isolation tiers ---------------- */
  function drawIso() {
    const rows = [
      { t: "共享宿主内核", s: "Linux 容器：用 namespaces 与 cgroups 隔离进程和资源", p: [["anthropic", "Anthropic 云沙箱（隔离 Linux 容器）"]] },
      { t: "用户态内核", s: "gVisor：在用户态实现内核，处理应用的系统调用", p: [["googlecloud", "GKE Agent Sandbox"]] },
      { t: "客户机内核", s: "microVM（Firecracker 等）与完整 VM（QEMU/KVM）", p: [["aws", "AgentCore Runtime microVM"], ["azureai", "Foundry 会话沙箱"], ["e2b", "E2B"]] },
    ];
    let g = `<svg class="dgm lt" viewBox="0 0 620 330" role="img" aria-label="隔离层级与产品">`;
    rows.forEach((r, i) => {
      const y = 10 + i * 100;
      g += R(10, y, 600, 88, { rx: 10, stroke: P.env, sw: 1 + i * 0.5 });
      g += `<rect x="10" y="${y}" width="6" height="88" rx="3" fill="${P.env}" fill-opacity="${0.35 + i * 0.3}"/>`;
      g += T(30, y + 26, r.t, { size: 14, weight: 700 }) + T(30, y + 46, r.s, { size: 11.5, cls: "s" });
      let x = 30;
      r.p.forEach(([k, p]) => {
        const w = textW(p, 11.5) + 38;
        g += R(x, y + 56, w, 24, { rx: 12, fill: P.soft }) + img(k, x + 8, y + 60, 16) + T(x + 30, y + 72, p, { size: 11.5 });
        x += w + 8;
      });
    });
    g += T(610, 324, "自上而下，与宿主机共享的部分减少", { size: 11, anchor: "end", cls: "m" });
    g += `</svg>`;
    $("#iso-dgm").innerHTML = g;
  }

  /* ---------------- bar chart ---------------- */
  // rows: [{label, sub, bars:[{v, lo, hi, color, label, tip} | {none: text}]}]
  function barChart(el, rows, o) {
    o = Object.assign({ w: 560, labelW: 150, barH: 14, gap: 4, rowGap: 14, max: null, log: false, min: null, fmt: (v) => String(v), ticks: null, unit: "" }, o || {});
    const plotX = o.labelW + 8, plotW = o.w - plotX - (o.valW || 70);
    const all = rows.flatMap((r) => r.bars.filter((b) => !b.none).map((b) => (b.hi != null ? b.hi : b.v)));
    const max = o.max != null ? o.max : Math.max(...all) * 1.05;
    const min = o.log ? (o.min || Math.min(...rows.flatMap((r) => r.bars.filter((b) => !b.none).map((b) => (b.lo != null ? b.lo : b.v))))) : 0;
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
        if (b.none) { body += `<text class="val" x="${plotX + 6}" y="${by + o.barH / 2 + 4}" style="fill:var(--ink-3)">${esc(b.none)}</text>`; return; }
        const x0 = b.lo != null ? sx(b.lo) : plotX;
        const x1 = sx(b.hi != null ? b.hi : b.v);
        const w = Math.max(2, x1 - x0);
        const t = b.tip || `${r.label}${b.name ? " · " + b.name : ""}：${b.lo != null ? o.fmt(b.lo) + "–" + o.fmt(b.hi) : o.fmt(b.v)}${o.unit}`;
        body += `<rect class="mark" x="${x0}" y="${by}" width="${w}" height="${o.barH}" rx="3" style="fill:${b.color}"/>`;
        body += `<text class="val" x="${x0 + w + 6}" y="${by + o.barH / 2 + 4}">${esc(b.label != null ? b.label : (b.lo != null ? o.fmt(b.lo) + "–" + o.fmt(b.hi) : o.fmt(b.v)))}</text>`;
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
  const msFmt = (t) => (t >= 1000 ? t / 1000 + " s" : t + " ms");

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
    ], { max: 100, unit: "%", fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], valW: 100, aria: "成本降低比例" });

    // limits (log hours)
    legend($("#lg-limits"), [[S1, "运行时长上限"], [S2, "空闲回收时间"], [INK, "状态保留期限"]]);
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
    ], { log: true, min: 0.02, max: 1000, w: 560, labelW: 158, valW: 110, tickFmt: (t) => (t < 1 ? Math.round(t * 60) + "分" : t < 24 ? t + "时" : Math.round(t / 24) + "天"), ticks: [1 / 30, 1, 8, 24, 168, 720], fmt: (v) => v.toFixed(2) + " h", aria: "时间上限" });

    // price
    legend($("#lg-price"), [[S1, "输入"], [S2, "输出"], [S3, "缓存读取"]]);
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
    ], { log: true, min: 0.2, max: 100, labelW: 120, valW: 90, ticks: [0.5, 1, 5, 10, 50], tickFmt: (t) => t + "s", fmt: (v) => v + " s", aria: "冷启动延迟" });

    // DeltaBox: literature ranges (Table 1)
    legend($("#lg-db-range"), [[S1, "检查点"], [S3, "恢复"]]);
    const rg = (label, sub, ck, rs, ckl, rsl) => ({ label, sub, bars: [Object.assign({ color: S1, label: ckl }, Array.isArray(ck) ? { lo: ck[0], hi: ck[1] } : { v: ck }), Object.assign({ color: S3, label: rsl }, Array.isArray(rs) ? { lo: rs[0], hi: rs[1] } : { v: rs })] });
    barChart($("#ch-db-range"), [
      rg("Git stash / branch", "仅文件", [100, 1000], [100, 1000], "100 ms–1 s", "100 ms–1 s"),
      rg("shutil.copytree", "仅文件", [100, 10000], [100, 10000], "100 ms–10 s", "100 ms–10 s"),
      rg("Docker commit + 重启", "仅文件", [50, 10000], [1000, 10000], "50 ms–10 s", "1–10 s"),
      rg("Btrfs / LVM 快照", "仅文件", [10, 100], [10, 1000], "10–100 ms", "10 ms–1 s"),
      rg("Firecracker VM 快照", "内存与设备", [200, 2000], [120, 700], "200 ms–2 s", "120–700 ms"),
      rg("CubeSandbox", "文件 + 进程", 49.8, 63.9, "49.8 ms", "63.9 ms"),
      rg("E2B", "文件 + 进程", 4000, 1000, "≈4 s / GiB", "≈1 s"),
      rg("DeltaBox", "文件 + 进程", 10.83, 1.86, "10.83 ms", "1.86 ms"),
    ], { log: true, min: 1, max: 12000, labelW: 140, valW: 96, barH: 10, gap: 3, rowGap: 10, ticks: [1, 10, 100, 1000, 10000], tickFmt: msFmt, fmt: (v) => v + " ms", aria: "检查点与恢复延迟范围" });

    // DeltaBox: measured per-event blocking (Table 2, weighted average)
    legend($("#lg-db-event"), [[S1, "检查点"], [S3, "恢复"]]);
    const ev = (label, sub, ck, rs) => ({ label, sub, bars: [{ v: ck, color: S1, label: ck + " ms" }, { v: rs, color: S3, label: rs >= 1000 ? (rs / 1000).toFixed(2) + " s" : rs + " ms" }] });
    barChart($("#ch-db-event"), [
      ev("replay+cp", "复制文件，重放命令", 347.0, 27694),
      ev("FC-Diff+dm", "VM 增量快照", 622.3, 3429),
      ev("CRIU+cp", "CRIU + 复制文件", 590.0, 811.4),
      ev("E2B（diff）", "自托管，增量快照", 524.4, 899.7),
      ev("DeltaBox", "增量 C/R", 10.83, 1.86),
    ], { log: true, min: 1, max: 40000, labelW: 130, valW: 80, barH: 12, gap: 3, ticks: [1, 10, 100, 1000, 10000], tickFmt: msFmt, fmt: (v) => v + " ms", aria: "每次事件的阻塞时间" });

    // search
    legend($("#lg-search"), [[S2, "模型厂商的服务端搜索"], [S4, "云平台与第三方搜索 API"]]);
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
    }), { max: 50, fmt: (v) => v.toFixed(0) + "%", ticks: [0, 10, 20, 30, 40, 50], labelW: 110, valW: 150, aria: "CPU 时间占比" });

    // image access
    barChart($("#ch-image"), [["C++", 8.7, 4.9], ["Go", 13.3, 4.1], ["Java", 9.2, 12.1], ["JavaScript", 4.2, 9.6], ["Python", 6.0, 6.0]].map(([n, p, gb]) => ({ label: n, sub: "镜像 " + gb + " GB", bars: [{ v: p, color: S3, label: p + "%", tip: `${n} 镜像 ${gb} GB，运行时读取 ${p}%` }] })), { max: 100, fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], labelW: 100, aria: "镜像读取比例" });

    // bill (stacked)
    legend($("#lg-bill"), [[S1, "未缓存输入"], [S3, "缓存读取"], [S2, "输出"], [INK, "会话运行时长"]]);
    (function () {
      const billRows = [
        { label: "无缓存", parts: [[0.25, S1, "输入 50K × $5/M"], [0.375, S2, "输出 15K × $25/M"], [0.08, INK, "运行 1 小时 × $0.08"]] },
        { label: "4 万 token 命中缓存", parts: [[0.05, S1, "未缓存输入 10K"], [0.02, S3, "缓存读取 40K × 10%"], [0.375, S2, "输出"], [0.08, INK, "运行 1 小时"]] },
      ];
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

    // disclosure audit by field (Table III means)
    legend($("#lg-audit"), [[S2, "8 篇 agent 基准"], [INK, "4 篇静态基准"]]);
    const au = (label, a, c) => ({ label, bars: [{ v: a, color: S2, label: a.toFixed(2) }, c == null ? { none: "不适用" } : { v: c, color: INK, label: c.toFixed(2) }] });
    barChart($("#ch-audit"), [au("基准身份", 0.56, 1.0), au("harness 规格", 0.44, null), au("推理设置", 0.56, 0.5), au("成本报告", 0.0, 0.5), au("失败分解", 0.31, 0.62), au("总分", 0.38, 0.66)],
      { max: 1, fmt: (v) => v.toFixed(2), ticks: [0, 0.25, 0.5, 0.75, 1], labelW: 100, barH: 11, gap: 3, aria: "各字段披露得分" });

    barChart($("#ch-rl"), [
      { label: "HetRL", sub: "异构 GPU 吞吐（平均 3.17×）", bars: [{ v: 9.17, color: S1 }] },
      { label: "RhymeRL", sub: "整体性能", bars: [{ v: 2.6, color: S1 }] },
      { label: "RLinf", sub: "训练吞吐 1.07–2.43×", bars: [{ lo: 1.07, hi: 2.43, color: S1 }] },
      { label: "RollArt", sub: "训练时间 1.31–2.05×", bars: [{ lo: 1.31, hi: 2.05, color: S1 }] },
      { label: "Seer", sub: "rollout 吞吐", bars: [{ v: 2.04, color: S1 }] },
      { label: "DynaRL", sub: "端到端吞吐", bars: [{ v: 1.98, color: S1 }] },
    ], { max: 10, fmt: (v) => v + "×", ticks: [0, 2, 4, 6, 8, 10], labelW: 170, valW: 90, aria: "RL 系统加速比" });
  }

  /* ---------------- vendor matrix ----------------
     Cell codes: h = run by the service, b = brought by the user, o = either (cell lists the options), n = not part of the product. */
  const M = [
    { g: "managed", name: "托管 harness 的服务" },
    { g: "managed", p: "OpenAI Agents API", v: "beta", r: ["openai/agents-api/overview", "openai/agents-api/architecture", "openai/agents-api/hosted-sandbox"],
      c: [["h", "OpenAI 托管的 Codex harness"], ["h", "Session、事件流与 webhook，运行中可插话引导"], ["h", "OpenAI 模型"], ["o", [["h", "OpenAI 托管 Linux 沙箱，可选容器规格"], ["b", "自托管执行器 codex exec-server"], ["n", "none：使用远程 MCP 与函数工具"]]], ["h", "web search、远程 MCP、子 agent；函数工具由应用执行"], "模型 token + 工具标准价 + 容器价"] },
    { g: "managed", p: "Claude Managed Agents", v: "beta", r: ["anthropic/claude-managed-agents/overview", "anthropic/claude-managed-agents/self-hosted-sandboxes", "anthropic/claude-api/pricing"],
      c: [["h", "Anthropic 托管 harness，内置缓存与 compaction"], ["h", "Session 与 SSE 事件，历史存于服务端"], ["h", "Claude 模型"], ["o", [["h", "Anthropic 云沙箱（Ubuntu 容器）"], ["b", "自托管 worker，可运行在 Cloudflare、Daytona、Modal、Vercel 等"]]], ["h", "Bash、文件操作、web search / fetch、MCP、MCP tunnels"], "token + $0.08/会话小时（仅 running）"] },
    { g: "managed", p: "Managed Agents API on Agent Platform", v: "Google · Pre-GA", r: ["google/managed-agents/overview", "google/managed-agents/sandbox-environment"],
      c: [["h", "Antigravity harness"], ["h", "Interactions API（数据面）；Agents API 管理配置"], ["h", "Agent Platform 模型，预览期按标准价"], ["h", "托管 Linux 沙箱，网络按域名白名单开启，TTL 7 天，可挂载 Cloud Storage"], ["h", "bash、file_system、MCP、Skill Registry、网页搜索"], "预览期按模型标准价"] },
    { g: "managed", p: "Bedrock Managed Agents, powered by OpenAI", v: "AWS", r: ["aws/bedrock-managed-agents/overview", "openai/agents-api/bedrock-managed-agents"],
      c: [["h", "OpenAI Codex harness，运行在 Bedrock 内"], ["h", "Bedrock 服务 API，IAM SigV4 认证"], ["h", "OpenAI 模型，经 Amazon Bedrock 推理"], ["o", [["h", "默认 AgentCore Runtime"], ["b", "自托管计算"]]], ["h", "AgentCore 的授权、发现、观测、评估等能力"], "见 AWS 页面"] },
    { g: "runtime", name: "运行平台" },
    { g: "runtime", p: "AgentCore Runtime", v: "AWS", r: ["aws/agentcore-runtime/runtime", "aws/agentcore-runtime/instances", "aws/agentcore/pricing"],
      c: [["b", "LangGraph、Strands、CrewAI、OpenAI Agents SDK、Claude Agent SDK 等"], ["h", "InvokeAgentRuntime，HTTP 或 WebSocket，按 runtimeSessionId 区分会话"], ["b", "由 agent 代码选择：Bedrock、Claude、Gemini、OpenAI 等"], ["h", "按会话分配 microVM（≤ 8 小时）或账户内 EC2 实例（≤ 14 天，支持 GPU）"], ["h", "Gateway、Browser、Code Interpreter、Web Search、Memory、Identity"], "活跃 vCPU 小时 + GB 小时，组件分别计价"] },
    { g: "runtime", p: "Agent Runtime（原 Agent Engine）", v: "Google", r: ["google/agent-runtime/overview", "google/agent-platform/runtime-scaling", "google/agent-platform-sandbox/overview"],
      c: [["b", "ADK（完全集成）、LangChain、LangGraph、AG2、LlamaIndex、CrewAI、任意容器"], ["h", "查询 API、双向流；Sessions 与 Memory Bank 为配套服务"], ["b", "由 agent 代码调用"], ["h", "托管运行时（min_instances、container_concurrency 可调）+ 沙箱（代码执行、Computer Use、自定义容器）"], ["h", "Agent Gateway、Code Execution、Computer Use"], "见 Agent Platform 价格页"] },
    { g: "runtime", p: "Foundry Hosted agents", v: "Microsoft · preview", r: ["microsoft/foundry-hosted-agents/hosted-agents", "microsoft/foundry-hosted-agents/runtime-contract"],
      c: [["b", "Agent Framework、LangGraph、Semantic Kernel、自定义代码（Python / C#）"], ["h", "Responses、Invocations、WebSocket、A2A、Activity 协议"], ["h", "Foundry 模型目录"], ["h", "按会话分配 VM 隔离沙箱，0.5–2 vCPU，$HOME 持久化，空闲 2–60 分钟后回收计算"], ["h", "Toolbox（MCP 服务）：Code Interpreter、Bing 搜索、AI Search、MCP、A2A"], "活跃会话的 CPU + 内存"] },
    { g: "sandbox", name: "沙箱服务" },
    { g: "sandbox", p: "E2B", v: "", r: ["e2b/sandbox/overview", "e2b/sandbox/persistence", "e2b/sandbox/pricing"],
      c: [["b", "外部 harness 通过 SDK 调用"], ["n", ""], ["n", ""], ["h", "按秒计费；Hobby 会话 ≤ 1 小时 / 20 并发，Pro ≤ 24 小时 / 100 并发"], ["n", ""], "$0.000014/vCPU·秒"] },
    { g: "sandbox", p: "Daytona", v: "", r: ["daytona/sandbox/overview", "daytona/sandbox/pricing"],
      c: [["b", "外部 harness 通过 SDK 调用"], ["n", ""], ["n", ""], ["h", "按秒计费，提供 GPU 与 Windows 规格"], ["n", ""], "vCPU $0.0504/时，内存 $0.0162/GiB·时"] },
    { g: "sandbox", p: "Cloud Run sandboxes", v: "Google · preview", r: ["google/cloud-run-sandboxes/announcement"],
      c: [["b", "运行在 Cloud Run 服务内的 agent"], ["n", ""], ["n", ""], ["h", "在服务实例内启动；文件系统只读挂载，写入落在内存覆盖层；出站网络默认关闭"], ["n", ""], "使用服务实例已分配的 CPU 与内存"] },
    { g: "sandbox", p: "GKE Agent Sandbox", v: "Google", r: ["google/gke-agent-sandbox/pod-snapshot-blog"],
      c: [["b", "部署在 GKE 上的 agent（如 ADK）"], ["n", ""], ["n", ""], ["h", "gVisor 隔离的 pod，Pod Snapshots 用于状态恢复"], ["n", ""], "GKE 资源计费"] },
    { g: "tool", name: "搜索 API" },
    { g: "tool", p: "Exa", v: "", r: ["exa/search/overview", "exa/search/pricing"], c: [["n", ""], ["n", ""], ["n", ""], ["n", ""], ["h", "搜索、Deep Search、Contents、Answer、Monitors"], "$4–15/千次请求"] },
    { g: "tool", p: "Tavily", v: "", r: ["tavily/search/overview", "tavily/search/pricing"], c: [["n", ""], ["n", ""], ["n", ""], ["n", ""], ["h", "Search、Extract、Map、Crawl、Research"], "$0.008/积分（按量）"] },
    { g: "app", name: "云端编程应用" },
    { g: "app", p: "Codex Cloud", v: "OpenAI", r: ["openai/codex-cloud/overview", "openai/codex-cloud/environments"],
      c: [["h", "Codex"], ["h", "ChatGPT 网页、桌面与手机，终端也可发起"], ["h", "OpenAI 模型"], ["h", "发布的云环境（仓库、依赖、工具），按任务分配工作区"], ["h", "network secret 经代理替换"], "—"] },
    { g: "app", p: "Claude Code 云会话", v: "Anthropic", r: ["anthropic/claude-code-web/overview"],
      c: [["h", "Claude Code"], ["h", "claude.ai/code、桌面、手机；CLI --cloud 与 --teleport"], ["h", "Claude 模型"], ["o", [["h", "Anthropic 托管环境"], ["b", "组织自托管环境"]]], ["h", "GitHub 代理在服务端附加凭据"], "随 Pro、Max、Team、Enterprise 方案提供"] },
    { g: "app", p: "Copilot cloud agent", v: "GitHub", r: ["github/copilot-cloud-agent/overview", "github/copilot-cloud-agent/api"],
      c: [["h", "Copilot cloud agent"], ["h", "GitHub.com 的 issue、PR、agents 面板与 API"], ["h", "可选模型，取决于方案"], ["h", "临时云开发环境，会话最长 59 分钟"], ["h", "GitHub MCP 服务器，可配置更多 MCP"], "按 Copilot 方案"] },
    { g: "app", p: "Jules", v: "Google", r: ["google/jules/overview"],
      c: [["h", "Jules"], ["h", "网页、CLI、API，或用 issue 标签分配"], ["h", "Gemini 3 Pro"], ["h", "在 Cloud VM 中克隆仓库并验证修改"], ["n", ""], "按方案"] },
    { g: "app", p: "Kiro Web", v: "AWS", r: ["aws/kiro-web/overview", "aws/kiro-web/sandbox"],
      c: [["h", "Kiro"], ["h", "网页，可从任意界面重新接入会话"], ["n", ""], ["h", "按任务分配隔离沙箱，内置 headless Chrome 与 Playwright MCP"], ["h", "浏览器自动化工具"], "—"] },
  ];
  const PL = { "OpenAI Agents API": "openai", "Claude Managed Agents": "anthropic", "Managed Agents API on Agent Platform": "gemini", "Bedrock Managed Agents, powered by OpenAI": "aws", "AgentCore Runtime": "aws", "Agent Runtime（原 Agent Engine）": "googlecloud", "Foundry Hosted agents": "azureai", "E2B": "e2b", "Daytona": "daytona", "Cloud Run sandboxes": "googlecloud", "GKE Agent Sandbox": "googlecloud", "Exa": "exa", "Tavily": "tavily", "Codex Cloud": "codex", "Claude Code 云会话": "claudecode", "Copilot cloud agent": "githubcopilot", "Jules": "google", "Kiro Web": "kiro" };
  const WHO = { h: "服务方运行", b: "用户提供", o: "两者可选", n: "空缺" };
  function drawMatrix(filter) {
    const cols = [["Harness", "var(--c-harness)"], ["会话接口", "var(--c-session)"], ["模型推理", "var(--c-model)"], ["执行环境", "var(--c-env)"], ["托管工具", "var(--c-tool)"], ["计费", "var(--rule)"]];
    let h = `<table><thead><tr><th>产品</th>${cols.map(([n, c]) => `<th><span class="bar" style="background:${c}"></span>${n}</th>`).join("")}</tr></thead><tbody>`;
    M.forEach((row) => {
      if (filter !== "all" && row.g !== filter) return;
      if (row.name) { h += `<tr class="grp"><td colspan="7">${esc(row.name)}</td></tr>`; return; }
      const refs = row.r.map((r) => `<button class="ref" data-r="${esc(r)}"></button>`).join("");
      const lgk = PL[row.p];
      h += `<tr><th>${lgk && LG[lgk] ? `<img class="mlogo" src="${LG[lgk]}" alt="">` : ""}${esc(row.p)}${refs}<small>${esc(row.v)}</small></th>`;
      row.c.forEach((cell) => {
        if (typeof cell === "string") { h += `<td>${esc(cell)}</td>`; return; }
        const [k, t] = cell;
        if (k === "n") { h += `<td class="na" title="${WHO.n}">—</td>`; return; }
        if (k === "o") { h += `<td class="o"><ul class="opts">${t.map(([kk, tt]) => `<li class="${kk}" title="${WHO[kk]}">${esc(tt)}</li>`).join("")}</ul></td>`; return; }
        h += `<td class="${k}" title="${WHO[k]}">${esc(t)}</td>`;
      });
      h += `</tr>`;
    });
    h += `</tbody></table>`;
    $("#matrix").innerHTML = h;
    labelRefs($("#matrix"));
  }
  $$(".matrix-tools button").forEach((b) => b.addEventListener("click", () => {
    $$(".matrix-tools button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    drawMatrix(b.dataset.f);
  }));

  /* ---------------- donuts: distribution of the products in the matrix ---------------- */
  function donut(title, parts) {
    const total = parts.reduce((a, p) => a + p[1], 0);
    const r = 48, cx = 66, cy = 66, sw = 20, C = 2 * Math.PI * r;
    let off = 0, arcs = "";
    parts.forEach(([name, v, color]) => {
      if (!v) return;
      const len = (v / total) * C;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"><title>${esc(name)}：${v}</title></circle>`;
      off += len;
    });
    const svg = `<svg viewBox="0 0 132 132" role="img" aria-label="${esc(title)}">${arcs}<text x="${cx}" y="${cy + 2}" text-anchor="middle" font-size="22" font-weight="600">${total}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="10" style="fill:var(--ink-3)">个产品</text></svg>`;
    const li = parts.filter((p) => p[1]).map(([name, v, color]) => `<li><i style="background:${color}"></i><span>${esc(name)}</span><b>${v}</b></li>`).join("");
    return `<div class="donut"><h4>${esc(title)}</h4>${svg}<ul>${li}</ul></div>`;
  }
  function drawDonuts() {
    const prods = M.filter((r) => r.p);
    const byG = (g) => prods.filter((r) => r.g === g).length;
    const count = (col, k) => prods.filter((r) => r.c[col][0] === k).length;
    const own = (col) => [["服务方运行", count(col, "h"), "var(--accent)"], ["用户提供", count(col, "b"), "#c49a52"], ["两者可选", count(col, "o"), "var(--c-model)"], ["空缺", count(col, "n"), "var(--rule)"]];
    $("#donuts").innerHTML =
      donut("产品类别", [["托管 harness 的服务", byG("managed"), "var(--ink)"], ["运行平台", byG("runtime"), "var(--c-session)"], ["沙箱服务", byG("sandbox"), "var(--c-env)"], ["搜索 API", byG("tool"), "var(--c-tool)"], ["云端编程应用", byG("app"), "var(--ink-3)"]]) +
      donut("Harness 由谁提供", own(0)) +
      donut("执行环境由谁提供", own(3));
  }

  /* ---------------- reference list ---------------- */
  function drawSources(q) {
    q = (q || "").trim().toLowerCase();
    const match = (s) => !q || (cleanTitle(s.title) + " " + s.id + " " + (s.vendor || "") + " " + (s.topic || "")).toLowerCase().includes(q);
    const items = refOrder.map((id) => SRC[id]).filter((s) => s && match(s));
    $("#src-list").innerHTML = items.map((s) => `<div class="src-item"><div class="t"><span class="n">[${REFN[s.id]}]</span>${esc(cleanTitle(s.title))}</div><div class="m">${esc(srcMeta(s))}</div><div class="l">${srcLinks(s)}</div></div>`).join("") || `<p class="note">没有匹配的条目。</p>`;
    $("#src-count").textContent = `${items.length} 条`;
  }
  $("#src-q").addEventListener("input", (e) => drawSources(e.target.value));

  /* ---------------- pager ---------------- */
  const pages = $$(".page");
  const sel = $("#toc-select");
  const toc = $("#toc");
  let lastPart = null;
  pages.forEach((p, i) => {
    const n = String(i + 1).padStart(2, "0");
    const o = document.createElement("option");
    o.value = p.dataset.id;
    o.textContent = `${n} ${p.dataset.title}`;
    sel.appendChild(o);
    if (i === 0) return;
    const part = p.dataset.part || "";
    if (part !== lastPart) {
      const h = document.createElement("div");
      h.className = "toc-part";
      h.textContent = part;
      toc.appendChild(h);
      lastPart = part;
    }
    const a = document.createElement("a");
    a.href = "#" + p.dataset.id;
    a.innerHTML = `<span>${n}</span><span>${esc(p.dataset.title)}</span>`;
    toc.appendChild(a);
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
    $$(".dgm-wrap[data-center]", pages[cur]).forEach((w) => { if (w.scrollWidth > w.clientWidth) w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2; });
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
    if (e.target.closest(".dgm-wrap, .matrix, .tmap, .frame")) { tx = null; return; }
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
  drawAnthropic();
  drawTmapHarness();
  drawTmap();
  drawEvo();
  drawLife();
  drawIso();
  drawCharts();
  drawMatrix("all");
  drawDonuts();
  numberRefs();
  labelRefs(document);
  drawSources("");

  /* ---------------- logos in text blocks ---------------- */
  $$(".vlogo[data-logo]").forEach((el) => { const u = LG[el.dataset.logo]; if (u) el.innerHTML = `<img src="${u}" alt="">`; });

  /* ---------------- figure / table numbers and cross references ---------------- */
  const numMap = {};
  (function () {
    const n = { 图: 0, 表: 0 };
    $$(".page .figure").forEach((el) => {
      const kind = el.dataset.num === "tab" ? "表" : "图";
      const label = `${kind} ${++n[kind]}`;
      if (!el.id) el.id = `num-${kind === "表" ? "t" : "f"}${n[kind]}`;
      numMap[el.id] = label;
      const target = el.querySelector(":scope > .chart-title") || el.querySelector(":scope > figcaption");
      if (target) target.insertAdjacentHTML("afterbegin", `<span class="fignum">${label}</span>`);
    });
  })();
  function goTo(el) {
    const i = pages.indexOf(el.closest(".page"));
    if (i < 0) return;
    show(i, true);
    requestAnimationFrame(() => el.scrollIntoView({ block: "center" }));
  }
  $$(".xref").forEach((x) => {
    const el = document.getElementById(x.dataset.x);
    x.textContent = numMap[x.dataset.x] || "";
    x.setAttribute("role", "link");
    x.tabIndex = 0;
    x.addEventListener("click", () => el && goTo(el));
    x.addEventListener("keydown", (e) => { if (e.key === "Enter" && el) goTo(el); });
  });
  $$(".pref").forEach((a) => {
    const i = pages.findIndex((p) => p.dataset.id === a.dataset.p);
    a.textContent = `第 ${i + 1} 页`;
    a.href = "#" + a.dataset.p;
    a.addEventListener("click", (e) => { e.preventDefault(); show(i, true); });
  });

  show(fromHash(), false);
})();
