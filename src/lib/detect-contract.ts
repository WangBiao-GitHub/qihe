/**
 * 检测 Markdown 文本中是否包含合同内容
 */
export function hasContractContent(text: string): boolean {
  const hasMainTitle = /^#\s+.+合同/m.test(text);
  const hasClauses = /^#{1,3}\s+第[一二三四五六七八九十百\d]+条/m.test(text);
  return hasMainTitle || (hasClauses && text.includes("#"));
}

/** 拆分为对话 + 合同两部分 */
export function splitContractAndChat(text: string): {
  chatText: string;
  contractText: string;
} {
  const sep = text.match(/\n---\n/);
  if (sep && sep.index != null) {
    const before = text.slice(0, sep.index).trim();
    const after = text.slice(sep.index + sep[0].length).trim();
    if (after.startsWith("#")) {
      return { chatText: before, contractText: after };
    }
  }

  const idx = text.indexOf("\n# ");
  if (idx !== -1) {
    return {
      chatText: text.slice(0, idx).trim(),
      contractText: text.slice(idx + 1).trim(),
    };
  }

  return { chatText: text, contractText: "" };
}
