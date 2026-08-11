import type { ReactNode } from 'react';

type StructuredContentProps = {
  content: string;
  className?: string;
};

type TextBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'unordered'; items: string[] }
  | { kind: 'ordered'; items: string[] };

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).filter(Boolean).map((part, index) => (
    part.startsWith('`') && part.endsWith('`')
      ? <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
      : <span key={`${part}-${index}`}>{part}</span>
  ));
}

function blocks(content: string): TextBlock[] {
  const result: TextBlock[] = [];
  let paragraph: string[] = [];
  let list: { kind: 'unordered' | 'ordered'; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) result.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) result.push(list);
    list = null;
  };

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      result.push({ kind: 'heading', text: line.slice(4) });
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const kind = unordered ? 'unordered' : 'ordered';
      if (list === null || (list as { kind: 'unordered' | 'ordered'; items: string[] }).kind !== kind) {
        flushList();
        list = { kind, items: [] };
      }
      (list as { kind: 'unordered' | 'ordered'; items: string[] }).items.push((unordered?.[1] ?? ordered?.[1] ?? '').replace(/;$/, ''));
      continue;
    }
    if (list) {
      list.items[list.items.length - 1] += ` ${line}`;
    } else {
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();
  return result;
}

export function StructuredContent({ content, className }: StructuredContentProps) {
  return (
    <div className={className}>
      {blocks(content).map((block, index) => {
        if (block.kind === 'heading') return <h3 key={`${block.text}-${index}`}>{inline(block.text)}</h3>;
        if (block.kind === 'paragraph') return <p key={`${block.text}-${index}`}>{inline(block.text)}</p>;
        const List = block.kind === 'ordered' ? 'ol' : 'ul';
        return (
          <List key={`${block.kind}-${index}`}>
            {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{inline(item)}</li>)}
          </List>
        );
      })}
    </div>
  );
}
