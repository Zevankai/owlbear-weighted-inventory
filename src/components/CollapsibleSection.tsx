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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ marginTop: '12px' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`${title} section, ${isExpanded ? 'click to collapse' : 'click to expand'}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          border: `1px solid ${isHovered ? 'var(--border-bright)' : 'var(--glass-border)'}`,
          marginBottom: isExpanded ? '12px' : '0',
          transition: 'all 0.2s ease',
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
        <span 
          style={{ 
            color: 'var(--accent-gold)', 
            fontSize: '12px',
            transition: 'transform 0.2s ease',
          }}
          aria-hidden="true"
        >
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      {isExpanded && children}
    </div>
  );
}
