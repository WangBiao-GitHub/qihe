/**
 * 轻量 Markdown 渲染器 — 匹配合同排版
 * 支持：标题 # ## ###、**粗体**、--- 分割线、无序/有序列表、段落 <br> 换行
 * 【占位提示】自动转为浅灰斜体
 */

let keyCounter = 0;
function nextKey() {
  return `md-${Date.now()}-${keyCounter++}`;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(【[^】]*】)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={nextKey()}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <span key={nextKey()} className="text-slate-300 italic">
          {match[3]}
        </span>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function Markdown({ content }: { content: string }) {
  keyCounter = 0;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // 分割线
    if (/^[-*_]{3,}\s*$/.test(line)) {
      elements.push(<hr key={nextKey()} className="my-4 border-slate-200" />);
      i++;
      continue;
    }

    // # 一级标题（合同主标题，居中）
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      elements.push(
        <h1
          key={nextKey()}
          className="mb-4 text-center text-xl font-bold text-slate-900"
        >
          {parseInline(h1[1])}
        </h1>,
      );
      i++;
      continue;
    }

    // ## / ### 条款标题
    const h23 = line.match(/^#{2,3}\s+(.+)/);
    if (h23) {
      elements.push(
        <h3
          key={nextKey()}
          className="mb-1 mt-4 text-[15px] font-semibold text-slate-800"
        >
          {parseInline(h23[1])}
        </h3>,
      );
      i++;
      continue;
    }

    // 有序列表
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      elements.push(
        <ol
          key={nextKey()}
          className="list-decimal space-y-1 pl-5 text-[15px] leading-6"
        >
          {items.map((item) => (
            <li key={nextKey()}>{parseInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // 无序列表
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul
          key={nextKey()}
          className="list-disc space-y-1 pl-5 text-[15px] leading-6"
        >
          {items.map((item) => (
            <li key={nextKey()}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // 段落（多行用 <br> 分隔）
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^[-*_]{3,}\s*$/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={nextKey()} className="text-[15px] leading-6">
          {paraLines.map((pl, idx) => (
            <span key={idx}>
              {idx > 0 && <br />}
              {parseInline(pl)}
            </span>
          ))}
        </p>,
      );
    }
  }

  return <>{elements}</>;
}
