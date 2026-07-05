/** 去掉 【...】 占位提示 */
function stripPlaceholders(text: string): string {
  return text.replace(/【[^】]*】/g, "");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToPrintHtml(md: string): string {
  let html = stripPlaceholders(md);
  const lines = html.split("\n");
  let result = "";
  let inList = false;
  let listTag = "";

  for (const line of lines) {
    const t = line.trim();
    if (t === "") {
      if (inList) { result += `</${listTag}>\n`; inList = false; }
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(t)) {
      if (inList) { result += `</${listTag}>\n`; inList = false; }
      result += '<hr style="border:none;border-top:1px solid #ccc;margin:16px 0">\n';
      continue;
    }
    const h1 = t.match(/^#\s+(.+)/);
    if (h1) {
      if (inList) { result += `</${listTag}>\n`; inList = false; }
      result += `<h1 style="text-align:center;font-size:22px;font-weight:bold;margin:24px 0 16px">${escapeHtml(h1[1])}</h1>\n`;
      continue;
    }
    const h23 = t.match(/^#{2,3}\s+(.+)/);
    if (h23) {
      if (inList) { result += `</${listTag}>\n`; inList = false; }
      result += `<h3 style="font-size:15px;font-weight:bold;margin:16px 0 4px">${escapeHtml(h23[1])}</h3>\n`;
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(t)) {
      if (!inList || listTag !== "ol") {
        if (inList) result += `</${listTag}>\n`;
        result += '<ol style="padding-left:24px;margin:4px 0;font-size:15px;line-height:1.6">\n';
        listTag = "ol"; inList = true;
      }
      result += `<li>${escapeHtml(t.replace(/^\s*\d+[.)]\s+/, ""))}</li>\n`;
      continue;
    }
    if (/^\s*[-*]\s+/.test(t)) {
      if (!inList || listTag !== "ul") {
        if (inList) result += `</${listTag}>\n`;
        result += '<ul style="padding-left:24px;margin:4px 0;font-size:15px;line-height:1.6">\n';
        listTag = "ul"; inList = true;
      }
      result += `<li>${escapeHtml(t.replace(/^\s*[-*]\s+/, ""))}</li>\n`;
      continue;
    }
    if (inList) { result += `</${listTag}>\n`; inList = false; }
    result += `<p style="font-size:15px;line-height:1.6;margin:0">${escapeHtml(t)}</p>\n`;
  }
  if (inList) result += `</${listTag}>\n`;
  return result;
}

/** 打开打印窗口，用户可保存为 PDF */
export function downloadContractAsPdf(markdown: string, title = "房屋租赁合同") {
  const bodyHtml = markdownToPrintHtml(markdown);
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","SimSun",serif;color:#1a1a1a;max-width:720px;margin:0 auto;padding:48px 40px;line-height:1.8}
  @media print{body{padding:30px 35px}@page{margin:20mm}}
</style>
</head>
<body>${bodyHtml}<script>window.onload=function(){window.print()}</script></body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=UTF-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onload = () => URL.revokeObjectURL(url);
}
