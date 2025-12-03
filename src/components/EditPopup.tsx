interface EditField {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

interface EditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: EditField[];
  position: { top: number; left: number };
}

export function EditPopup({ isOpen, onClose, title, fields, position }: EditPopupProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 999,
          background: 'rgba(0, 0, 0, 0.3)'
        }} 
      />
      {/* Popup */}
      <div style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        background: 'var(--bg-dark)',
        border: '1px solid var(--accent-gold)',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 1000,
        minWidth: '150px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}>
        <h4 style={{
          margin: '0 0 12px 0',
          fontSize: '12px',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {title}
        </h4>
        {fields.map((field, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginBottom: '4px'
            }}>
              {field.label}
            </label>
            <input
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              min={field.min}
              max={field.max}
              className="search-input"
              style={{
                width: '100%',
                margin: 0,
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            />
          </div>
        ))}
        <button 
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--accent-gold)',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            marginTop: '4px'
          }}
        >
          Done
        </button>
      </div>
    </>
  );
}
