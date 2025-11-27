interface ToggleButtonsProps {
  textMode: 'dark' | 'light';
  isWideMode: boolean;
  onTextModeToggle: () => void;
  onWidthToggle: () => void;
}

export function ToggleButtons({
  textMode,
  isWideMode,
  onTextModeToggle,
  onWidthToggle
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
      {/* Width Toggle Button */}
      <button
        onClick={onWidthToggle}
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
        title={isWideMode ? 'Shrink Width' : 'Expand Width'}
      >
        {isWideMode ? '←' : '→'}
      </button>
    </div>
  );
}
