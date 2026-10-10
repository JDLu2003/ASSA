// Export every figure that the page draws itself (diagrams, charts, tables) as PNG, and the
// SVG-based ones also as standalone SVG with computed styles inlined.
//
// Usage (from the repository root):
//   node survey/tools/export_figures.js [path/to/playwright]
// Writes survey/figures/*.png and survey/figures/*.svg.
const fs = require("fs");
const os = require("os");
const path = require("path");
const pw = require(process.argv[2] || "playwright");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "site");
const OUT = path.join(ROOT, "figures");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // The page is a fragment without a doctype; wrap it so it renders in standards mode.
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  const wrapper = path.join(SITE, `.export-${process.pid}.html`);
  fs.writeFileSync(wrapper, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n${html}\n</html>`);
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2, colorScheme: "light" });
    await page.goto("file://" + wrapper);
    await page.waitForTimeout(800);
    const figs = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".page .figure").forEach((el) => {
        if (el.querySelector(".frame img")) return; // archived original figures live in site/assets
        const num = (el.querySelector(".fignum") || {}).textContent || "";
        const page = el.closest(".page").dataset.id;
        out.push({ id: el.id, num: num.trim(), page });
      });
      return out;
    });
    const manifest = [];
    for (const f of figs) {
      const idx = await page.evaluate((id) => {
        const el = document.getElementById(id);
        const pages = Array.from(document.querySelectorAll(".page"));
        return pages.indexOf(el.closest(".page"));
      }, f.id);
      await page.evaluate((i) => { document.querySelectorAll(".page").forEach((p, k) => { p.hidden = k !== i; }); }, idx);
      await page.waitForTimeout(150);
      const kind = f.num.startsWith("表") ? "tab" : "fig";
      const n = (f.num.match(/\d+/) || ["0"])[0].padStart(2, "0");
      const base = `${kind}-${n}-${f.page}-${f.id.replace(/^num-/, "")}`;
      const el = await page.$("#" + f.id);
      await el.screenshot({ path: path.join(OUT, base + ".png") });
      const svg = await page.evaluate((id) => {
        const fig = document.getElementById(id);
        const src = fig.querySelector("svg");
        if (!src || fig.querySelectorAll("svg").length !== 1) return null;
        const clone = src.cloneNode(true);
        const props = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity", "opacity", "font-size", "font-family", "font-weight", "text-anchor", "paint-order"];
        const a = src.querySelectorAll("*"), b = clone.querySelectorAll("*");
        a.forEach((node, i) => {
          const cs = getComputedStyle(node);
          const style = props.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";");
          b[i].setAttribute("style", style);
          b[i].removeAttribute("class");
        });
        clone.removeAttribute("class");
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        const bg = getComputedStyle(fig.querySelector(".frame") || document.body).backgroundColor;
        clone.insertAdjacentHTML("afterbegin", `<rect width="100%" height="100%" fill="${bg}"/>`);
        return new XMLSerializer().serializeToString(clone);
      }, f.id);
      if (svg) fs.writeFileSync(path.join(OUT, base + ".svg"), svg);
      manifest.push({ file: base, figure: f.num, page: f.page, svg: !!svg });
    }
    fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(manifest.length, "figures exported");
  } finally {
    await browser.close();
    fs.unlinkSync(wrapper);
  }
})();
