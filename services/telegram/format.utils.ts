// services/telegram/format.utils.ts
// Format converter for Telegram Bot API messages (converts Markdown to Telegram HTML).

/**
 * Safely converts Markdown formatted text (such as AI model output with **bold**,
 * bullet lists, inline code, and links) into Telegram-supported HTML.
 *
 * Supported Telegram HTML tags:
 * <b>bold</b>, <strong>bold</strong>
 * <i>italic</i>, <em>italic</em>
 * <code>inline code</code>
 * <pre>code block</pre>
 * <a href="url">link</a>
 * <s>strikethrough</s>
 */
export function markdownToTelegramHtml(text: string): string {
  if (!text) return "";

  // 1. Normalize line endings
  let out = text.replace(/\r\n/g, "\n");

  // 2. Protect and extract code blocks (```lang\ncode\n```)
  const codeBlocks: string[] = [];
  out = out.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return `@@@TELEGRAM_CODE_BLOCK_${idx}@@@`;
  });

  // 3. Protect and extract inline code (`code`)
  const inlineCodes: string[] = [];
  out = out.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `@@@TELEGRAM_INLINE_CODE_${idx}@@@`;
  });

  // 4. Escape raw HTML special characters (&, <, >) to avoid broken entities
  out = escapeHtml(out);

  // 5. Convert Markdown links: [text](https://example.com) -> <a href="https://example.com">text</a>
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  // 6. Convert bullet lists (* item or - item at line start) -> • item
  out = out.replace(/^[\t ]*[\*\-][\t ]+/gm, "• ");

  // 7. Convert Markdown headings (# Title, ## Title) -> <b>Title</b>
  out = out.replace(/^#{1,6}[\t ]+(.+)$/gm, "<b>$1</b>");

  // 8. Convert Bold: **text** or __text__ -> <b>text</b>
  out = out.replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>");
  out = out.replace(/__([\s\S]+?)__/g, "<b>$1</b>");

  // 9. Convert single-asterisk bold (*text*) when used for emphasis
  // E.g. *Telegram Connected Successfully!* or *Due:* or *PRO*
  // Only match when not part of an identifier or word boundary
  out = out.replace(/(?<![\w*])\*([^\*\n]+?)\*(?![\w*])/g, "<b>$1</b>");

  // 10. Convert italic: _text_ -> <i>text</i>
  // Only match when not part of an identifier like snake_case_variable
  out = out.replace(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, "<i>$1</i>");

  // 11. Strikethrough: ~~text~~ -> <s>text</s>
  out = out.replace(/~~([^~]+?)~~/g, "<s>$1</s>");

  // 12. Restore code blocks & inline code
  out = out.replace(/@@@TELEGRAM_CODE_BLOCK_(\d+)@@@/g, (_, idx) => codeBlocks[Number(idx)]);
  out = out.replace(/@@@TELEGRAM_INLINE_CODE_(\d+)@@@/g, (_, idx) => inlineCodes[Number(idx)]);

  return out;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Strips markdown symbols for a clean plain-text fallback if HTML parsing fails.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<![\w*])\*([^\*\n]+?)\*(?![\w*])/g, "$1")
    .replace(/(?<![\w_])_([^_\n]+?)_(?![\w_])/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[\t ]*[\*\-][\t ]+/gm, "• ");
}
