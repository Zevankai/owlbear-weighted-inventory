/**
 * Markdown formatting hint component
 * Shows supported markdown syntax for text fields
 */
export const MarkdownHint = () => (
  <span style={{fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic'}}>
    Supports: **bold**, *italic*, __underline__, ~~strikethrough~~, [links](url)
  </span>
);
