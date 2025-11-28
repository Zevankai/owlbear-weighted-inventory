/**
 * Simple markdown parser for lore content
 * Supports basic formatting: bold, italic, underline, strikethrough, and lists
 */

/**
 * Parse markdown text and return HTML string
 * @param text - The markdown text to parse
 * @returns HTML string with rendered markdown
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* -> <em>text</em>
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Underline: __text__ -> <u>text</u>
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');

  // Strikethrough: ~~text~~ -> <del>text</del>
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Process line by line for lists
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^- (.+)$/);
    const orderedMatch = line.match(/^\d+\. (.+)$/);

    if (unorderedMatch) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push('<ul>');
        inUnorderedList = true;
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        processedLines.push('<ol>');
        inOrderedList = true;
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`);
    } else {
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      // Convert newlines to <br> for non-list lines
      processedLines.push(line);
    }
  }

  // Close any remaining lists
  if (inUnorderedList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }

  // Join lines and convert remaining newlines to <br>
  html = processedLines.join('\n').replace(/\n/g, '<br>');

  return html;
}

/**
 * Strip markdown formatting from text (for preview/summary)
 * @param text - The markdown text to strip
 * @returns Plain text without markdown formatting
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  let result = text;

  // Remove bold markers
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');

  // Remove italic markers
  result = result.replace(/\*(.+?)\*/g, '$1');

  // Remove underline markers
  result = result.replace(/__(.+?)__/g, '$1');

  // Remove strikethrough markers
  result = result.replace(/~~(.+?)~~/g, '$1');

  // Remove list markers
  result = result.replace(/^- /gm, '');
  result = result.replace(/^\d+\. /gm, '');

  return result;
}
