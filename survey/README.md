# Agent as a Service 调研

- `site/`：网页本体。`index.html` 是页面，`app.js` 绘制图表与导航，`sources.js`、`logos.js` 由脚本生成；
  `assets/` 中是厂商原图（`vendor/`）、论文原图（`papers/`）与 logo（`logos/`），各目录的 README 记录来源。
- `figures/`：页面自绘的图、图表与表格的导出，PNG 与独立 SVG，对应关系见 `figures/manifest.json`。
- `tools/`：`build_sources.py` 由 `sources/**/metadata.json` 生成 `site/sources.js`；
  `build_logos.py` 生成 logo；`export_figures.js` 导出 `figures/`。三者都在仓库根目录运行。
- `docs/WRITING_CHECKLIST.md`：写作检查表。

图片（png、jpg、svg 等）以 Git LFS 保存，文本以普通 Git 保存。
