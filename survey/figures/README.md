# 页面自绘图的导出

由 `node survey/tools/export_figures.js <playwright 路径>` 生成。文件名为 `图或表-编号-页面-元素 id`，
编号与网页中的图号、表号一致。PNG 为 2 倍分辨率截图；SVG 内联了计算后的样式，可脱离网页单独打开。
含多张小图的图（如环形图）与 HTML 表格只导出 PNG。
