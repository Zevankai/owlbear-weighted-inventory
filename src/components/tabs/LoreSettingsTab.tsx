import type { CharacterData, LoreType, LoreTabConfig } from '../../types';
import { LORE_TAB_DEFINITIONS, LORE_PRESETS, LORE_TYPE_LABELS, generateLoreSettingsFromPreset } from '../../constants/lore';

interface LoreSettingsTabProps {
  characterData: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

export function LoreSettingsTab({ characterData, updateData }: LoreSettingsTabProps) {
  const loreSettings = characterData.loreSettings;

  if (!loreSettings) {
    return (
      <div className="section" style={{ padding: '12px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted, #888)' }}>
          Lore settings not initialized. This shouldn't happen.
        </p>
      </div>
    );
  }

  // Sort tabs by order for display
  const sortedTabs = [...loreSettings.tabs].sort((a, b) => a.order - b.order);

  const handleLoreTypeChange = (newType: LoreType) => {
    // When changing lore type, preserve existing entries but update enabled tabs
    const presetTabs = LORE_PRESETS[newType];
    const updatedTabs = loreSettings.tabs.map((tab, index) => ({
      ...tab,
      enabled: presetTabs.includes(tab.tabId),
      order: presetTabs.includes(tab.tabId) ? presetTabs.indexOf(tab.tabId) : index + 100,
    }));

    updateData({
      loreSettings: {
        ...loreSettings,
        loreType: newType,
        tabs: updatedTabs,
      },
    });
  };

  const handleApplyPreset = (presetType: LoreType) => {
    // Apply preset but preserve existing entries
    const newTabs = generateLoreSettingsFromPreset(presetType);
    
    // Merge existing entries into new tabs
    const mergedTabs = newTabs.map(newTab => {
      const existingTab = loreSettings.tabs.find(t => t.tabId === newTab.tabId);
      return {
        ...newTab,
        entries: existingTab?.entries || [],
      };
    });

    updateData({
      loreSettings: {
        loreType: presetType,
        tabs: mergedTabs,
      },
    });
  };

  const handleToggleEnabled = (tabId: string) => {
    // Don't allow disabling overview
    if (tabId === 'overview') return;

    const updatedTabs = loreSettings.tabs.map(tab =>
      tab.tabId === tabId ? { ...tab, enabled: !tab.enabled } : tab
    );

    updateData({
      loreSettings: {
        ...loreSettings,
        tabs: updatedTabs,
      },
    });
  };

  const handleToggleVisibility = (tabId: string) => {
    const updatedTabs = loreSettings.tabs.map(tab =>
      tab.tabId === tabId ? { ...tab, visibleToPlayers: !tab.visibleToPlayers } : tab
    );

    updateData({
      loreSettings: {
        ...loreSettings,
        tabs: updatedTabs,
      },
    });
  };

  const handleOrderChange = (tabId: string, newOrder: number) => {
    const updatedTabs = loreSettings.tabs.map(tab =>
      tab.tabId === tabId ? { ...tab, order: newOrder } : tab
    );

    updateData({
      loreSettings: {
        ...loreSettings,
        tabs: updatedTabs,
      },
    });
  };

  return (
    <div className="section" style={{ padding: '12px' }}>
      <h2 style={{ marginTop: 0 }}>Lore Settings</h2>

      {/* Lore Type Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-muted, #888)',
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}>
          Lore Type
        </label>
        <select
          value={loreSettings.loreType}
          onChange={(e) => handleLoreTypeChange(e.target.value as LoreType)}
          className="search-input"
          style={{ width: '100%', fontWeight: 'bold' }}
        >
          {Object.keys(LORE_TYPE_LABELS).map((type) => (
            <option key={type} value={type}>
              {LORE_TYPE_LABELS[type as LoreType]}
            </option>
          ))}
        </select>
      </div>

      {/* Preset Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-muted, #888)',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          Quick Presets
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {(Object.keys(LORE_PRESETS) as LoreType[]).map((presetType) => (
            <button
              key={presetType}
              onClick={() => handleApplyPreset(presetType)}
              style={{
                background: loreSettings.loreType === presetType 
                  ? 'var(--accent-gold, #f0e130)' 
                  : '#333',
                border: 'none',
                color: loreSettings.loreType === presetType ? 'black' : '#888',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: loreSettings.loreType === presetType ? 'bold' : 'normal',
              }}
            >
              {LORE_TYPE_LABELS[presetType]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Configuration Table */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: 'var(--text-muted, #888)',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          Tab Configuration
        </label>
        
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 80px 80px',
          gap: '8px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px 4px 0 0',
          borderBottom: '1px solid var(--border, #333)',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'var(--accent-gold, #f0e130)',
          textTransform: 'uppercase',
        }}>
          <div>Order</div>
          <div>Tab</div>
          <div style={{ textAlign: 'center' }}>Enabled</div>
          <div style={{ textAlign: 'center' }}>Players</div>
        </div>

        {/* Table Rows */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 4px 4px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {sortedTabs.map((tab: LoreTabConfig) => (
            <div
              key={tab.tabId}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 80px 80px',
                gap: '8px',
                padding: '8px',
                borderBottom: '1px solid var(--border, #333)',
                alignItems: 'center',
                opacity: tab.enabled ? 1 : 0.5,
              }}
            >
              {/* Order Input */}
              <input
                type="number"
                value={tab.order}
                onChange={(e) => handleOrderChange(tab.tabId, parseInt(e.target.value) || 0)}
                style={{
                  width: '50px',
                  background: '#222',
                  border: '1px solid #444',
                  color: 'white',
                  textAlign: 'center',
                  padding: '4px',
                  borderRadius: '3px',
                  fontSize: '11px',
                }}
              />

              {/* Tab Name */}
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: tab.enabled ? 'var(--text-main, #fff)' : '#666',
                }}>
                  {LORE_TAB_DEFINITIONS[tab.tabId]?.label || tab.tabId}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted, #888)',
                }}>
                  {tab.entries.length} {tab.entries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>

              {/* Enabled Checkbox */}
              <div style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={tab.enabled}
                  onChange={() => handleToggleEnabled(tab.tabId)}
                  disabled={tab.tabId === 'overview'}
                  style={{
                    cursor: tab.tabId === 'overview' ? 'not-allowed' : 'pointer',
                  }}
                />
              </div>

              {/* Visible to Players Checkbox */}
              <div style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={tab.visibleToPlayers}
                  onChange={() => handleToggleVisibility(tab.tabId)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted, #888)',
        marginTop: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '4px',
      }}>
        <p style={{ margin: '0 0 4px 0' }}>
          <strong>Order:</strong> Lower numbers appear first in the tab bar.
        </p>
        <p style={{ margin: '0 0 4px 0' }}>
          <strong>Enabled:</strong> Whether the tab appears at all. Overview is always enabled.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Players:</strong> Whether players can see this tab. You can still hide individual entries within visible tabs.
        </p>
      </div>
    </div>
  );
}
