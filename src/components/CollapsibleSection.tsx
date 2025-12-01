import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ 
  title, 
  defaultExpanded = false, 
  children 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginTop: '12px' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          border: '1px solid var(--glass-border)',
          marginBottom: isExpanded ? '12px' : '0',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-bright)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        <span style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {title}
        </span>
        <span style={{ 
          color: 'var(--accent-gold)', 
          fontSize: '12px',
          transition: 'transform 0.2s ease',
        }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      {isExpanded && children}
    </div>
  );
}
