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

  /* ---------------- shared figure kit ---------------- */
  const LG = window.LOGOS || {};
  const CHC = { session: "var(--c-session)", model: "var(--c-model)", env: "var(--c-env)", tool: "var(--c-tool)" };
  let kitN = 0;
  function kit() {
    const id = ++kitN;
    const markers = Object.entries(Object.assign({ ink: "var(--ink-3)", paper: "var(--paper)" }, CHC)).map(([k, c]) =>
      `<marker id="m${id}-${k}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" style="fill:${c}"/></marker>`).join("");
    return {
      defs: `<defs><filter id="sh${id}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.6" flood-color="#0b1a1d" flood-opacity="0.10"/></filter>${markers}</defs>`,
      sh: `url(#sh${id})`,
      m: (k) => `url(#m${id}-${k})`,
    };
  }
  function tile(K, x, y, s, key, cap, capStyle) {
    let g = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${(s * 0.26).toFixed(1)}" style="fill:var(--tile);stroke:var(--tile-line)" filter="${K.sh}"/>`;
    if (LG[key]) { const p = s * 0.2; g += `<image href="${LG[key]}" x="${x + p}" y="${y + p}" width="${s - 2 * p}" height="${s - 2 * p}"/>`; }
    if (cap) g += `<text x="${x + s / 2}" y="${y + s + 14}" text-anchor="middle" font-size="10.5" style="${capStyle || "fill:var(--ink-2)"}">${esc(cap)}</text>`;
    return `<g>${g}</g>`;
  }
  const ICON = {
    session: '<path d="M5 5.5h14a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6h-8.4L6.2 19.6v-3.3H5a1.6 1.6 0 0 1-1.6-1.6V7.1A1.6 1.6 0 0 1 5 5.5z"/><path d="M8 10.9h.01M12 10.9h.01M16 10.9h.01"/>',
    model: '<rect x="7" y="7" width="10" height="10" rx="1.6"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/><path d="M10.2 12h3.6"/>',
    env: '<rect x="3" y="4.5" width="18" height="15" rx="2.2"/><path d="M7 9.6l3 2.4-3 2.4M12.6 14.8H17"/>',
    tool: '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.6 2.4 3.8 5.3 3.8 8.4s-1.2 6-3.8 8.4c-2.6-2.4-3.8-5.3-3.8-8.4s1.2-6 3.8-8.4z"/>',
    config: '<path d="M4.5 7h9M17.5 7h2M15.5 5v4M4.5 12h3M11.5 12h8M9.5 10v4M4.5 17h11M19.5 17h0M17.5 15v4"/>',
    vault: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12h8.6M17.2 12v3M20.2 12v2.2"/>',
    log: '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    memory: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  };
  const icon = (k, x, y, s, stroke, w) => `<g transform="translate(${x},${y}) scale(${s / 24})" fill="none" style="stroke:${stroke}" stroke-width="${w || 1.7}" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</g>`;

  /* ---------------- figure: the service model ---------------- */
  function drawModel() {
    const K = kit();
    const W = 1240, H = 826;
    const B = { x: 262, y: 176, w: 716, h: 472 };
    let g = `<svg class="dgm" id="model-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="托管智能体服务的结构：中心为 agent harness，四角为配置、凭据、会话日志与记忆观测，四个接口分别连接应用与用户、模型服务、执行环境和托管工具">${K.defs}`;

    // service area
    g += `<rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="28" style="fill:var(--accent-soft);fill-opacity:.55;stroke:var(--ink-3)" stroke-width="1.4" stroke-dasharray="7 6"/>`;
    const pill = "托管智能体服务 · Managed Agent Service";
    const pw = textW(pill, 12) + 30;
    g += `<rect x="292" y="164" width="${pw}" height="25" rx="12.5" style="fill:var(--ink)"/><text x="${292 + pw / 2}" y="181" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--paper)">${pill}</text>`;

    // state cards in the four corners
    const card = (x, y, k, t, sub) => `<g><rect x="${x}" y="${y}" width="158" height="74" rx="13" style="fill:var(--panel);stroke:var(--rule)" filter="${K.sh}"/>${icon(k, x + 14, y + 13, 20, "var(--ink)")}<text x="${x + 42}" y="${y + 28}" font-size="12.5" font-weight="700">${t}</text><text x="${x + 14}" y="${y + 56}" font-size="10.5" class="sub">${sub}</text></g>`;
    g += card(282, 200, "config", "Agent 配置", "模型、指令、工具、skills");
    g += card(800, 200, "vault", "凭据 Vault", "沙箱外保存，代理注入");
    g += card(282, 554, "log", "会话事件日志", "append-only，可重建运行");
    g += card(800, 554, "memory", "记忆 · 观测", "Memory、Tracing、Eval");

    // channels: two lines per interface (request and response), labels
    const chan = (ch, lines, labels) => {
      let s = `<g class="ch ch-${ch}" data-ch="${ch}">`;
      lines.forEach(([x1, y1, x2, y2]) => { s += `<line class="flowline" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="2.2" style="stroke:${CHC[ch]}" marker-end="${K.m(ch)}"/>`; });
      labels.forEach(([x, y, t, cls, anchor]) => { s += `<text x="${x}" y="${y}" text-anchor="${anchor || "middle"}" class="${cls}" font-size="${cls === "chl" ? 13 : 10.5}"${cls === "chl" ? ' font-weight="700"' : ' font-family="var(--f-mono)"'}>${t}</text>`; });
      return s + `</g>`;
    };
    g += chan("session", [[285, 405, 436, 405], [438, 419, 287, 419]], [[361, 388, "会话接口", "chl"], [361, 441, "Session · Events", "muted"]]);
    g += chan("env", [[804, 405, 955, 405], [953, 419, 802, 419]], [[879, 388, "执行环境", "chl"], [879, 441, "tool calls · results", "muted"]]);
    g += chan("model", [[614, 284, 614, 199], [626, 201, 626, 282]], [[640, 232, "模型推理", "chl", "start"], [640, 249, "Inference", "muted", "start"]]);
    g += chan("tool", [[614, 542, 614, 625], [626, 623, 626, 544]], [[640, 584, "托管工具", "chl", "start"], [640, 601, "Hosted tools", "muted", "start"]]);

    // harness core
    const C = { x: 440, y: 286, w: 360, h: 256 };
    g += `<rect x="${C.x}" y="${C.y}" width="${C.w}" height="${C.h}" rx="20" style="fill:var(--ink)" filter="${K.sh}"/>`;
    g += `<text x="620" y="318" text-anchor="middle" font-size="19" font-weight="700" style="fill:var(--paper)">Agent Harness</text>`;
    g += `<text x="620" y="337" text-anchor="middle" font-size="11.5" style="fill:var(--paper);fill-opacity:.72">智能体执行框架 · 狭义 agent</text>`;
    // loop
    const lc = { x: 620, y: 402, r: 32 };
    const pt = (deg) => [lc.x + lc.r * Math.cos((deg * Math.PI) / 180), lc.y + lc.r * Math.sin((deg * Math.PI) / 180)];
    [[-90, 30], [30, 150], [150, 270]].forEach(([a, b]) => {
      const [x1, y1] = pt(a + 16), [x2, y2] = pt(b - 16);
      g += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${lc.r},${lc.r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" style="stroke:var(--paper);stroke-opacity:.75" stroke-width="1.6" marker-end="${K.m("paper")}"/>`;
    });
    const nodes = [[-90, CHC.model, "调用模型", 0, -12, "middle"], [30, CHC.env, "执行工具", 12, 14, "start"], [150, "var(--paper)", "写回上下文", -12, 14, "end"]];
    nodes.forEach(([a, c, t, dx, dy, an]) => {
      const [x, y] = pt(a);
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" style="fill:${c};stroke:var(--ink)" stroke-width="2"/>`;
      g += `<text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${an}" font-size="11" style="fill:var(--paper)">${t}</text>`;
    });
    g += `<text x="620" y="406" text-anchor="middle" font-size="10" font-family="var(--f-mono)" style="fill:var(--paper);fill-opacity:.6">loop</text>`;
    // harness implementations
    g += `<line x1="462" y1="452" x2="778" y2="452" style="stroke:var(--paper);stroke-opacity:.18"/>`;
    const impl = [["codex", "Codex"], ["claudecode", "Claude Code"], ["antigravity", "Antigravity"], ["langgraph", "LangGraph"], ["crewai", "CrewAI"], ["strands", "Strands"]];
    impl.forEach(([k, n], i) => { g += tile(K, 455 + i * 62, 464, 28, k, n, "fill:var(--paper);fill-opacity:.82;font-size:9.5px"); });

    // ports on the boundary
    const port = (ch, x, y) => `<g class="ch ch-${ch}" data-ch="${ch}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="21" style="fill:${CHC[ch]};stroke:var(--panel)" stroke-width="4"/>${icon(ch, x - 10.5, y - 10.5, 21, "#ffffff", 1.9)}</g>`;
    g += port("session", B.x, 412) + port("model", 620, B.y) + port("env", B.x + B.w, 412) + port("tool", 620, B.y + B.h);

    // docks outside the boundary
    const dock = (o) => {
      let s = `<g class="ch ch-${o.ch}" data-ch="${o.ch}">`;
      s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="16" style="fill:var(--panel);stroke:${CHC[o.ch]};stroke-opacity:.5" stroke-width="1.4" filter="${K.sh}"/>`;
      s += `<circle cx="${o.x + 18}" cy="${o.y + 21}" r="4.5" style="fill:${CHC[o.ch]}"/><text x="${o.x + 30}" y="${o.y + 25.5}" font-size="12.5" font-weight="700">${o.title}</text>`;
      s += `<text x="${o.x + o.w - 14}" y="${o.y + 25.5}" text-anchor="end" font-size="10" font-family="var(--f-mono)" class="muted">${o.en}</text>`;
      const rows = [];
      for (let i = 0; i < o.items.length; i += o.cols) rows.push(o.items.slice(i, i + o.cols));
      rows.forEach((row, r) => {
        const rw = row.length * o.t + (row.length - 1) * o.gx;
        const x0 = o.x + (o.w - rw) / 2;
        row.forEach(([k, n], i) => { s += tile(K, x0 + i * (o.t + o.gx), o.y + 40 + r * o.rh, o.t, k, n); });
      });
      if (o.link) { const [x1, y1, x2, y2] = o.link; s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="2" style="stroke:${CHC[o.ch]}" marker-start="${K.m(o.ch)}" marker-end="${K.m(o.ch)}"/>`; }
      return s + `</g>`;
    };
    g += dock({ ch: "model", x: 352, y: 8, w: 536, h: 128, title: "模型服务", en: "LLM APIs", cols: 7, t: 42, gx: 30, rh: 72, link: [620, 137, 620, 152],
      items: [["openai", "OpenAI"], ["claude", "Claude"], ["gemini", "Gemini"], ["bedrock", "Bedrock"], ["azureai", "Foundry"], ["vllm", "vLLM"], ["sglang", "SGLang"]] });
    g += dock({ ch: "session", x: 20, y: 314, w: 204, h: 196, title: "应用与用户", en: "Clients", cols: 3, t: 42, gx: 20, rh: 74, link: [225, 412, 239, 412],
      items: [["openai", "ChatGPT"], ["claude", "claude.ai"], ["github", "GitHub"], ["notion", "Notion"], ["icon-server", "企业后端"], ["icon-clock", "定时任务"]] });
    g += dock({ ch: "env", x: 1016, y: 246, w: 208, h: 332, title: "执行环境", en: "Sandboxes", cols: 3, t: 40, gx: 22, rh: 72, link: [1015, 412, 1001, 412],
      items: [["openai", "OpenAI"], ["anthropic", "Anthropic"], ["aws", "AgentCore"], ["azureai", "Foundry"], ["googlecloud", "Google"], ["e2b", "E2B"], ["daytona", "Daytona"], ["modal", "Modal"], ["cloudflare", "Cloudflare"], ["vercel", "Vercel"], ["icon-laptop", "自有机器"]] });
    g += dock({ ch: "tool", x: 322, y: 688, w: 596, h: 128, title: "托管工具与云服务", en: "Search · Browser · Code · MCP", cols: 8, t: 42, gx: 28, rh: 72, link: [620, 671, 620, 686],
      items: [["google", "Google 搜索"], ["bing", "Bing 搜索"], ["exa", "Exa"], ["tavily", "Tavily"], ["chrome", "浏览器"], ["python", "代码执行"], ["mcp", "MCP 服务器"], ["icon-server", "网关"]] });

    g += `</svg>`;
    $("#model-dgm").innerHTML = g;

    // highlight one interface on hover or legend click
    const svg = $("#model-svg");
    const lg = $("#model-legend");
    const names = [["session", "会话接口", "Session"], ["model", "模型推理", "Inference"], ["env", "执行环境", "Sandbox"], ["tool", "托管工具", "Hosted tools"]];
    lg.innerHTML = names.map(([k, t, e]) => `<button type="button" data-ch="${k}" aria-pressed="false"><i style="background:${CHC[k]}"></i>${t}<small>${e}</small></button>`).join("");
    let pinned = null;
    const setHl = (k) => { if (k) svg.setAttribute("data-hl", k); else svg.removeAttribute("data-hl"); };
    svg.addEventListener("mouseover", (e) => { const t = e.target.closest("[data-ch]"); setHl(t ? t.dataset.ch : pinned); });
    svg.addEventListener("mouseleave", () => setHl(pinned));
    lg.addEventListener("mouseover", (e) => { const b = e.target.closest("button"); if (b) setHl(b.dataset.ch); });
    lg.addEventListener("mouseleave", () => setHl(pinned));
    lg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      pinned = pinned === b.dataset.ch ? null : b.dataset.ch;
      $$("button", lg).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.ch === pinned)));
      setHl(pinned);
    });
  }

  /* ---------------- figure: Anthropic brain / session / hands ---------------- */
  function drawAnthropic() {
    const K = kit();
    let g = `<svg class="dgm" viewBox="0 0 600 310" role="img" aria-label="Anthropic Managed Agents：harness 与沙箱分别运行，由会话日志连接，凭据在 vault 中">${K.defs}`;
    const box = (x, y, w, h, lg, t, sub, note, stroke) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" style="fill:var(--panel);stroke:${stroke}" stroke-width="1.5" filter="${K.sh}"/>${lg}<text x="${x + 62}" y="${y + 33}" font-size="14" font-weight="700">${t}</text><text x="${x + 62}" y="${y + 51}" font-size="11" class="sub">${sub}</text><text x="${x + 16}" y="${y + h - 16}" font-size="10.5" class="muted">${note}</text></g>`;
    g += box(16, 48, 182, 112, tile(K, 30, 62, 36, "claude"), "Harness", "调用 Claude 的循环", "brain · Anthropic 托管", "var(--ink)");
    const sb = `<g>${tile(K, 416, 62, 36, "icon-terminal")}</g>`;
    g += box(402, 48, 182, 112, sb, "沙箱", "执行代码与工具", "hands · 云沙箱或自托管", "var(--c-env)");
    g += `<line x1="200" y1="96" x2="398" y2="96" stroke-width="2" style="stroke:var(--c-env)" marker-end="${K.m("env")}"/><text x="299" y="88" text-anchor="middle" font-size="11" class="sub">工具调用</text>`;
    g += `<line x1="400" y1="114" x2="202" y2="114" stroke-width="2" style="stroke:var(--c-env)" marker-end="${K.m("env")}"/><text x="299" y="132" text-anchor="middle" font-size="11" class="sub">结果</text>`;
    // vault
    g += `<g><rect x="230" y="4" width="140" height="34" rx="17" style="fill:var(--panel);stroke:var(--rule)" filter="${K.sh}"/>${icon("vault", 244, 11, 20, "var(--ink)")}<text x="270" y="25.5" font-size="11.5" font-weight="700">Vault · 代理</text></g>`;
    g += `<path d="M370 21 C 420 21, 452 26, 470 46" fill="none" stroke-width="1.5" stroke-dasharray="4 4" style="stroke:var(--ink-3)" marker-end="${K.m("ink")}"/><text x="440" y="18" font-size="10" class="muted">按需注入凭据</text>`;
    // session log
    g += `<rect x="16" y="196" width="568" height="100" rx="14" style="fill:var(--panel);stroke:var(--c-session)" stroke-width="1.5" filter="${K.sh}"/>`;
    g += `${icon("log", 30, 208, 20, "var(--ink)")}<text x="58" y="223" font-size="13.5" font-weight="700">Session</text><text x="118" y="223" font-size="11" class="sub">append-only 日志，存放在 harness 进程之外</text>`;
    const ev = [["用户消息", CHC.session], ["模型调用", CHC.model], ["工具调用", CHC.env], ["工具结果", CHC.env], ["模型调用", CHC.model], ["…", "var(--ink-3)"]];
    let ex = 30;
    g += `<line x1="30" y1="262" x2="570" y2="262" style="stroke:var(--rule)" stroke-width="1.5"/>`;
    ev.forEach(([t, c]) => {
      const w = textW(t, 11) + 26;
      g += `<rect x="${ex}" y="250" width="${w}" height="24" rx="12" style="fill:var(--paper);stroke:var(--rule)"/><circle cx="${ex + 11}" cy="262" r="4" style="fill:${c}"/><text x="${ex + 19}" y="266" font-size="11">${t}</text>`;
      ex += w + 10;
    });
    g += `<line x1="107" y1="162" x2="107" y2="194" stroke-width="1.6" stroke-dasharray="4 4" style="stroke:var(--c-session)" marker-end="${K.m("session")}"/><text x="115" y="183" font-size="10.5" class="muted">追加事件</text>`;
    g += `<line x1="493" y1="194" x2="493" y2="162" stroke-width="1.6" stroke-dasharray="4 4" style="stroke:var(--c-session)" marker-end="${K.m("session")}"/><text x="485" y="183" text-anchor="end" font-size="10.5" class="muted">从日志恢复</text>`;
    g += `</svg>`;
    $("#anthropic-dgm").innerHTML = g;
  }

  /* ---------------- table: vendor terminology ---------------- */
  function drawTmap() {
    const cols = [["openai", "OpenAI", "Agents API"], ["anthropic", "Anthropic", "Claude Managed Agents"], ["gemini", "Google", "Managed Agents API"], ["aws", "AWS", "Bedrock Managed Agents"], ["aws", "AWS", "AgentCore Runtime"], ["googlecloud", "Google", "Agent Runtime"], ["microsoft", "Microsoft", "Foundry Hosted agents"]];
    const c = (t) => t.replace(/`([^`]+)`/g, "<code>$1</code>");
    const rows = [
      ["Harness", "智能体执行框架", "var(--c-harness)", ["`Codex harness`，OpenAI 托管", "`agent harness`，Anthropic 托管", "`Antigravity harness`", "`OpenAI Harness`（Runtime 层的 `Agentic Loop`）", "用户的 agent 代码（LangGraph、Strands 等）", "用户的 agent（ADK、LangGraph 等）", "用户的容器（Agent Framework、LangGraph 等）"]],
      ["Agent 配置", "模型、指令、工具", "var(--ink-3)", ["`Agent`", "`Agent`", "Agents API 保存的 agent config", "—", "`agent runtime` 与 runtime version", "`ReasoningEngine` 资源", "`agent version`"]],
      ["会话接口", "Session · Events", "var(--c-session)", ["`Session`、`Events and items`；流式事件或 webhook", "`Session`、`Events`；SSE", "`Interactions API`", "`Client`", "`InvokeAgentRuntime`、`runtimeSessionId`", "Sessions；双向流", "`Responses` / `Invocations` 协议；session ID、conversation ID"]],
      ["模型推理", "Inference", "var(--c-model)", ["OpenAI 模型", "Claude 模型", "Agent Platform 上的模型", "Latest OpenAI Models；Runtime 层的 `Inference`", "任意模型", "`Models (Gemini/3rd party)`", "Foundry 模型目录"]],
      ["执行环境", "Sandbox", "var(--c-env)", ["`Environment`：none / openai_hosted / self_hosted", "`Environment`：cloud / self-hosted sandbox", "`sandbox environment`，`env_id`", "`Environment`：Compute、Storage、Networking、Security", "microVM 或 Instances", "Agent Runtime + `Sandbox`", "按会话分配的 VM 隔离 `sandbox`"]],
      ["托管工具", "Hosted tools", "var(--c-tool)", ["web search、remote MCP、function tools", "Bash、file ops、web search / fetch、MCP tunnels", "bash、file_system、MCP、Skill Registry", "`Tools / MCP`", "Gateway、Browser、Code Interpreter、Web Search", "Agent Gateway、Code Execution、Computer Use", "Toolbox MCP 端点"]],
      ["凭据与身份", "Vault · Identity", "var(--ink-3)", ["vault", "Vaults", "范围受限的授权令牌", "agent 的 AWS identity", "AgentCore Identity", "Agent Identity（SPIFFE）", "Microsoft Entra agent identity"]],
      ["记忆与观测", "Memory · Observability", "var(--ink-3)", ["Observability and usage、Tracing", "memory stores、事件历史、观测控制台", "—", "`Memory`；Governance & Observability", "AgentCore Memory、Observability", "Memory Bank、AI Observability", "state store、Application Insights"]],
    ];
    let h = `<table><thead><tr><th>部件</th>${cols.map(([k, v, p]) => `<th><span class="lg">${LG[k] ? `<img src="${LG[k]}" alt="">` : ""}<span>${esc(v)}<small>${esc(p)}</small></span></span></th>`).join("")}</tr></thead><tbody>`;
    rows.forEach(([n, en, col, cells]) => {
      h += `<tr><th style="border-left-color:${col}">${esc(n)}<small>${esc(en)}</small></th>${cells.map((t) => (t === "—" ? `<td class="na">—</td>` : `<td>${c(esc(t))}</td>`)).join("")}</tr>`;
    });
    $("#tmap").innerHTML = h + `</tbody></table>`;
  }

  /* ---------------- diagram: evolution ---------------- */
  function drawEvo() {
    const W = 1000;
    let g = `<svg class="dgm" viewBox="0 0 ${W} 330" role="img" aria-label="三种部署形态对比">${arrowDefs()}`;
    const panel = (x, title, sub) => `<text x="${x}" y="22" font-size="14" font-weight="700">${title}</text><text x="${x}" y="40" font-size="11.5" class="muted">${sub}</text>`;
    const box = (x, y, w, h, t, s, cls, col) => `<rect class="${cls || "boxline"}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"${col ? ` style="stroke:${col}"` : ""}/><text x="${x + w / 2}" y="${y + (s ? h / 2 - 2 : h / 2 + 4)}" text-anchor="middle" font-size="12.5" font-weight="700">${t}</text>${s ? `<text x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle" font-size="11" class="sub">${s}</text>` : ""}`;
    const arrow = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="flow"${col ? ` style="stroke:${col}"` : ""} marker-end="${AH()}"/>`;
    // panel 1
    g += panel(10, "① 模型 API", "请求–响应；agent 循环由开发者编写");
    g += `<rect x="10" y="60" width="290" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += box(30, 90, 250, 92, "开发者的应用", "agent 循环 · 工具执行 · 状态管理", "boxline");
    g += box(80, 232, 150, 50, "模型 API", "tokens in / out", "boxline", "var(--c-model)");
    g += arrow(155, 182, 155, 230, "var(--c-model)");
    // panel 2
    g += panel(350, "② harness 运行在沙箱内", "agent-in-a-sandbox");
    g += `<rect x="350" y="60" width="290" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += `<rect x="368" y="74" width="254" height="150" rx="8" fill="none" style="stroke:var(--c-env)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    g += `<text x="380" y="92" font-size="11" class="muted">容器</text>`;
    g += box(380, 102, 110, 52, "harness", "Agent SDK", "harness");
    g += box(500, 102, 110, 52, "文件 · 进程", "", "boxline");
    g += box(380, 162, 230, 46, "凭据", "", "boxline");
    g += box(420, 252, 150, 46, "模型 API", "", "boxline", "var(--c-model)");
    g += arrow(495, 224, 495, 250, "var(--c-model)");
    // panel 3
    g += panel(690, "③ harness 与沙箱分离", "agent-with-a-sandbox");
    g += `<rect x="690" y="60" width="300" height="250" rx="10" fill="none" style="stroke:var(--rule)"/>`;
    g += box(706, 78, 128, 66, "harness", "厂商托管", "harness");
    g += box(852, 78, 124, 66, "沙箱", "厂商或用户的机器", "boxline", "var(--c-env)");
    g += box(706, 168, 270, 40, "会话事件日志（append-only）", "", "boxline", "var(--c-session)");
    g += box(706, 232, 128, 54, "模型 API", "", "boxline", "var(--c-model)");
    g += box(852, 232, 124, 54, "Vault + 出站代理", "", "boxline");
    g += arrow(834, 104, 850, 104, "var(--c-env)");
    g += arrow(770, 144, 770, 166);
    g += arrow(770, 208, 770, 230, "var(--c-model)");
    g += arrow(958, 230, 958, 146);
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
    g += `<text x="20" y="268" font-size="11" class="sub">Anthropic：按 running 时长计费；idle 时容器打检查点。</text>`;
    g += `<text x="20" y="286" font-size="11" class="sub">Microsoft：空闲 2–60 分钟释放计算，恢复时还原 $HOME；30 天未活动删除。</text>`;
    g += `<text x="20" y="304" font-size="11" class="sub">OpenAI：自托管时 environment_connection 事件触发执行器启动，等待上限 5 分钟。</text>`;
    g += `<text x="20" y="322" font-size="11" class="sub">AgentCore：stop 后 microVM 终止，挂载在 /mnt 的会话存储保留 14 天。</text>`;
    g += `</svg>`;
    $("#life-dgm").innerHTML = g;
  }

  /* ---------------- diagram: isolation tiers ---------------- */
  function drawIso() {
    const rows = [
      { t: "共享宿主内核", s: "Linux 容器 · namespaces/cgroups · Landlock · macOS Seatbelt", p: [["anthropic", "Anthropic 云沙箱（隔离 Linux 容器）"]] },
      { t: "用户态应用内核", s: "gVisor：用户态实现的内核处理应用的系统调用", p: [["googlecloud", "GKE Agent Sandbox"]] },
      { t: "客户机内核", s: "microVM（Firecracker）· 完整 VM（QEMU/KVM）", p: [["aws", "AgentCore Runtime microVM"], ["azureai", "Foundry 会话沙箱（VM 隔离）"], ["e2b", "E2B（基于 Firecracker）"]] },
    ];
    let g = `<svg class="dgm" viewBox="0 0 620 330" role="img" aria-label="隔离层级与产品">`;
    rows.forEach((r, i) => {
      const y = 14 + i * 96;
      const shade = ["0.10", "0.20", "0.34"][i];
      g += `<rect x="10" y="${y}" width="600" height="84" rx="8" style="fill:var(--c-env);fill-opacity:${shade};stroke:var(--c-env)"/>`;
      g += `<text x="24" y="${y + 24}" font-size="13.5" font-weight="700">${r.t}</text>`;
      g += `<text x="24" y="${y + 43}" font-size="11" class="sub">${r.s}</text>`;
      let x = 24;
      r.p.forEach(([k, p]) => {
        const w = textW(p, 11) + 40;
        g += `<rect x="${x}" y="${y + 51}" width="${w}" height="24" rx="7" style="fill:var(--tile);stroke:var(--tile-line)"/>`;
        if (LG[k]) g += `<image href="${LG[k]}" x="${x + 7}" y="${y + 55}" width="16" height="16"/>`;
        g += `<text x="${x + 30}" y="${y + 67}" font-size="11" style="fill:#1f2328">${esc(p)}</text>`;
        x += w + 8;
      });
    });
    g += `<text x="610" y="324" text-anchor="end" font-size="10.5" class="muted">隔离强度自上而下增加</text>`;
    g += `</svg>`;
    $("#iso-dgm").innerHTML = g;
  }

  /* ---------------- diagram: credential proxy ---------------- */
  function drawCred() {
    let g = `<svg class="dgm" viewBox="0 0 620 200" role="img" aria-label="沙箱内的程序使用占位符，出站代理替换为真实凭据">${arrowDefs()}`;
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
    g += `<text x="10" y="188" font-size="10.5" class="muted">真实凭据保存在代理一侧；自托管环境中的代理由用户部署（OpenAI 文档）。</text>`;
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
    g += `<text x="300" y="24" font-size="13" font-weight="700">厂商文档：服务的资源边界</text>`;
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
      { label: "恢复对话历史", bars: [{ v: 6, color: S1 }, { v: 28, color: S2 }] },
    ], { max: 100, fmt: (v) => v + "%", ticks: [0, 25, 50, 75, 100], labelW: 130, aria: "恢复成功率" });

    // deltabox
    barChart($("#ch-delta"), [
      { label: "E2B（diff）", bars: [{ lo: 23, hi: 48, color: S2 }] },
      { label: "DeltaBox", bars: [{ lo: 1, hi: 2, color: S3 }] },
    ], { max: 50, fmt: (v) => v + "%", ticks: [0, 10, 20, 30, 40, 50], labelW: 100, barH: 18, aria: "状态管理时间占比" });

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
    { g: "managed", name: "托管 harness 的服务" },
    { g: "managed", p: "OpenAI Agents API", v: "beta", r: ["openai/agents-api/overview", "openai/agents-api/architecture", "openai/agents-api/hosted-sandbox"],
      c: [["h", "OpenAI 托管的 Codex harness"], ["h", "Session、事件流与 webhook，运行中可插话引导"], ["h", "OpenAI 模型"], ["o", "none / OpenAI 托管 Linux 沙箱（可选容器规格）/ 自托管执行器 codex exec-server"], ["h", "web search、远程 MCP、子 agent；函数工具由应用执行"], "模型 token + 工具标准价 + 容器价"] },
    { g: "managed", p: "Claude Managed Agents", v: "beta", r: ["anthropic/claude-managed-agents/overview", "anthropic/claude-managed-agents/self-hosted-sandboxes", "anthropic/claude-api/pricing"],
      c: [["h", "Anthropic 托管 harness，内置缓存与 compaction"], ["h", "Session 与 SSE 事件，历史存于服务端"], ["h", "Claude 模型"], ["o", "Anthropic 云沙箱（Ubuntu 容器）或自托管 worker（Cloudflare、Daytona、Modal、Vercel）"], ["h", "Bash、文件操作、web search / fetch、MCP、MCP tunnels"], "token + $0.08/会话小时（仅 running）"] },
    { g: "managed", p: "Managed Agents API on Agent Platform", v: "Google · Pre-GA", r: ["google/managed-agents/overview", "google/managed-agents/sandbox-environment"],
      c: [["h", "Antigravity harness"], ["h", "Interactions API（数据面）；Agents API 管理配置"], ["h", "Agent Platform 模型，预览期按标准价"], ["h", "托管 Linux 沙箱，网络按域名白名单开启，TTL 7 天，可挂载 Cloud Storage"], ["h", "bash、file_system、MCP、Skill Registry、网页搜索"], "预览期按模型标准价"] },
    { g: "managed", p: "Bedrock Managed Agents, powered by OpenAI", v: "AWS", r: ["aws/bedrock-managed-agents/overview", "openai/agents-api/bedrock-managed-agents"],
      c: [["h", "OpenAI Codex harness，运行在 Bedrock 内"], ["h", "Bedrock 服务端点，IAM SigV4 认证"], ["h", "OpenAI 模型，经 Amazon Bedrock 推理"], ["o", "默认 AgentCore Runtime，或自托管计算"], ["h", "AgentCore 的授权、发现、观测、评估等能力"], "见 AWS 页面"] },
    { g: "runtime", name: "运行平台" },
    { g: "runtime", p: "AgentCore Runtime", v: "AWS", r: ["aws/agentcore-runtime/runtime", "aws/agentcore-runtime/instances", "aws/agentcore/pricing"],
      c: [["b", "LangGraph、Strands、CrewAI、OpenAI Agents SDK、Claude Agent SDK 等"], ["h", "InvokeAgentRuntime，HTTP 或 WebSocket，按 runtimeSessionId 区分会话"], ["b", "任意模型：Bedrock、Claude、Gemini、OpenAI"], ["h", "按会话分配 microVM（≤ 8 小时）或账户内 EC2 实例（≤ 14 天，支持 GPU）"], ["h", "Gateway、Browser、Code Interpreter、Web Search、Memory、Identity"], "活跃 vCPU 小时 + GB 小时，组件分别计价"] },
    { g: "runtime", p: "Agent Runtime（原 Agent Engine）", v: "Google", r: ["google/agent-runtime/overview", "google/agent-platform/runtime-scaling", "google/agent-platform-sandbox/overview"],
      c: [["b", "ADK（完全集成）、LangChain、LangGraph、AG2、LlamaIndex、CrewAI、任意容器"], ["h", "查询 API、双向流；Sessions 与 Memory Bank 为配套服务"], ["b", "由 agent 代码调用"], ["h", "托管运行时（min_instances、container_concurrency 可调）+ 独立沙箱（代码执行、Computer Use、自定义容器）"], ["h", "Agent Gateway、Code Execution、Computer Use"], "见 Agent Platform 价格页"] },
    { g: "runtime", p: "Foundry Hosted agents", v: "Microsoft · preview", r: ["microsoft/foundry-hosted-agents/hosted-agents", "microsoft/foundry-hosted-agents/runtime-contract"],
      c: [["b", "Agent Framework、LangGraph、Semantic Kernel、自定义代码（Python / C#）"], ["h", "Responses、Invocations、WebSocket、A2A、Activity 协议"], ["h", "Foundry 模型目录"], ["h", "按会话分配 VM 隔离沙箱，0.5–2 vCPU，$HOME 持久化，空闲 2–60 分钟后回收计算"], ["h", "Toolbox MCP 端点：Code Interpreter、Bing 搜索、AI Search、MCP、A2A"], "活跃会话的 CPU + 内存"] },
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
    { g: "app", name: "面向开发者的云端编程 agent" },
    { g: "app", p: "Codex Cloud", v: "OpenAI", r: ["openai/codex-cloud/overview", "openai/codex-cloud/environments"],
      c: [["h", "Codex"], ["h", "ChatGPT 网页、桌面与手机，终端也可发起"], ["h", "OpenAI 模型"], ["h", "发布的云环境（仓库、依赖、工具），按任务分配工作区"], ["h", "network secret 经代理替换"], "—"] },
    { g: "app", p: "Claude Code 云会话", v: "Anthropic", r: ["anthropic/claude-code-web/overview"],
      c: [["h", "Claude Code"], ["h", "claude.ai/code、桌面、手机；CLI --cloud 与 --teleport"], ["h", "Claude 模型"], ["o", "Anthropic 托管或组织自托管环境"], ["h", "GitHub 代理在服务端附加凭据"], "随 Pro、Max、Team、Enterprise 方案提供"] },
    { g: "app", p: "Copilot cloud agent", v: "GitHub", r: ["github/copilot-cloud-agent/overview", "github/copilot-cloud-agent/api"],
      c: [["h", "Copilot cloud agent"], ["h", "GitHub.com 的 issue、PR、agents 面板与 API"], ["h", "可选模型，取决于方案"], ["h", "临时云开发环境，会话最长 59 分钟"], ["h", "GitHub MCP 服务器，可配置更多 MCP"], "按 Copilot 方案"] },
    { g: "app", p: "Jules", v: "Google", r: ["google/jules/overview"],
      c: [["h", "Jules"], ["h", "网页、CLI、API，或用 issue 标签分配"], ["h", "Gemini 3 Pro"], ["h", "在 Cloud VM 中克隆仓库并验证修改"], ["n", ""], "按方案"] },
    { g: "app", p: "Kiro Web", v: "AWS", r: ["aws/kiro-web/overview", "aws/kiro-web/sandbox"],
      c: [["h", "Kiro"], ["h", "网页，可从任意界面重新接入会话"], ["n", ""], ["h", "按任务分配隔离沙箱，内置 headless Chrome 与 Playwright MCP"], ["h", "浏览器自动化工具"], "—"] },
  ];
  const PL = { "OpenAI Agents API": "openai", "Claude Managed Agents": "anthropic", "Managed Agents API on Agent Platform": "gemini", "Bedrock Managed Agents, powered by OpenAI": "aws", "AgentCore Runtime": "aws", "Agent Runtime（原 Agent Engine）": "googlecloud", "Foundry Hosted agents": "azureai", "E2B": "e2b", "Daytona": "daytona", "Cloud Run sandboxes": "googlecloud", "GKE Agent Sandbox": "googlecloud", "Exa": "exa", "Tavily": "tavily", "Codex Cloud": "codex", "Claude Code 云会话": "claudecode", "Copilot cloud agent": "githubcopilot", "Jules": "google", "Kiro Web": "kiro" };
  const OWN = { h: ["h", "托管"], b: ["b", "自带"], o: ["o", "可选"], n: ["n", "无"] };
  function drawMatrix(filter) {
    const cols = [["Harness", "var(--c-harness)"], ["会话接口", "var(--c-session)"], ["模型推理", "var(--c-model)"], ["执行环境", "var(--c-env)"], ["托管工具", "var(--c-tool)"], ["计费", "var(--rule)"]];
    let h = `<table><thead><tr><th>产品</th>${cols.map(([n, c]) => `<th><span class="bar" style="background:${c}"></span>${n}</th>`).join("")}</tr></thead><tbody>`;
    M.forEach((row) => {
      if (filter !== "all" && row.g !== filter) return;
      if (row.name) { h += `<tr class="grp"><td colspan="7">${esc(row.name)}</td></tr>`; return; }
      const refs = row.r.map((r) => `<button class="ref" data-r="${esc(r)}"></button>`).join("");
      const lgk = PL[row.p];
      h += `<tr><th>${lgk && LG[lgk] ? `<img class="mlogo" src="${LG[lgk]}" alt="">` : ""}${esc(row.p)}<small>${esc(row.v)}</small><span class="mrefs">来源 ${refs}</span></th>`;
      row.c.forEach((cell) => {
        if (typeof cell === "string") { h += `<td>${esc(cell)}</td>`; return; }
        const [k, t] = cell;
        if (k === "n") { h += `<td class="na">—</td>`; return; }
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
  drawAnthropic();
  drawTmap();
  drawEvo();
  drawLife();
  drawIso();
  drawCred();
  drawLens();
  drawCharts();
  drawMatrix("all");
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
  });
  $$(".pref").forEach((a) => {
    const i = pages.findIndex((p) => p.dataset.id === a.dataset.p);
    a.textContent = `第 ${i + 1} 页`;
    a.href = "#" + a.dataset.p;
    a.addEventListener("click", (e) => { e.preventDefault(); show(i, true); });
  });

  show(fromHash(), false);
})();
