interface ToggleButtonsProps {
  textMode: 'dark' | 'light';
  onTextModeToggle: () => void;
  onWidthToggle: () => void;
  canExpand?: boolean;
  expandDisabledReason?: string;
}

export function ToggleButtons({
  textMode,
  onTextModeToggle,
  onWidthToggle,
  canExpand = true,
  expandDisabledReason = 'Cannot expand'
}: ToggleButtonsProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '8px',
      right: '8px',
      display: 'flex',
      gap: '4px',
      zIndex: 100
    }}>
      {/* Text Mode Toggle (Light/Dark) */}
      <button
        onClick={onTextModeToggle}
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid var(--glass-border)',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        title={textMode === 'dark' ? 'Switch to Light Text Mode' : 'Switch to Dark Text Mode'}
      >
        {textMode === 'dark' ? '☀️' : '🌙'}
      </button>
      {/* Expand Window Button */}
      <button
        onClick={canExpand ? onWidthToggle : undefined}
        disabled={!canExpand}
        style={{
          background: canExpand ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: canExpand ? 'pointer' : 'not-allowed',
          color: canExpand ? 'var(--text-main)' : '#666',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          opacity: canExpand ? 1 : 0.6
        }}
        title={canExpand ? 'Open Expanded Inventory Window' : expandDisabledReason}
      >
        ⛶
      </button>
    </div>
  );
}
