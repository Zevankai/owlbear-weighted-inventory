import { useState, useEffect, useRef } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { MonthView } from '../calendar/MonthView';
import { NoteList } from '../calendar/NoteList';
import { NoteEditor } from '../calendar/NoteEditor';
import { CalendarSettings } from '../calendar/CalendarSettings';
import { CompactHeader } from '../calendar/CompactHeader';
import type { DateTimeState, EventCategory } from '../../types/calendar';
import { getMoonPhase } from '../../utils/calendar/calendarMath';
import { getThemeColors, applyTheme, clearTheme } from '../../utils/calendar/theme';
import '../../styles/calendar.css';

interface CalendarTabProps {
  // playerRole prop is received for API consistency but the calendar uses 
  // its own role detection via useCalendar hook for better integration
  playerRole: 'GM' | 'PLAYER';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CalendarTab({ playerRole: _playerRole }: CalendarTabProps) {
  const { ready, config, logs, actions, isGM, waitingForGM, currentMonthMeta } = useCalendar();
  
  // View state - initialize with null, will be set when config loads
  const [viewDate, setViewDate] = useState<DateTimeState | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref to the calendar container for scoped theme application
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize viewDate when config loads (one-time initialization)
  useEffect(() => {
    if (config && !viewDate) {
      setViewDate(config.currentDate);
    }
  }, [config, viewDate]);

  // Load month metadata when viewDate changes
  useEffect(() => {
    if (viewDate && config) {
      actions.loadMonthMetadata(viewDate.year, viewDate.monthIndex);
    }
    // Note: actions is stable from the hook, but we intentionally limit dependencies
    // to only year/monthIndex to prevent unnecessary re-fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate?.year, viewDate?.monthIndex, config]);

  // Apply seasonal/biome theme to the calendar container (scoped, not global)
  useEffect(() => {
    const container = containerRef.current;
    if (config && container) {
      const season = config.months[config.currentDate.monthIndex]?.season || 'Spring';
      const biome = config.activeBiome || 'Temperate';
      const themeColors = getThemeColors(biome, season);
      applyTheme(themeColors, container);
    }
    
    // Cleanup: remove theme variables when unmounting
    return () => {
      if (container) {
        clearTheme(container);
      }
    };
    // Re-apply theme when activeBiome or current month's season changes
  }, [config, config?.activeBiome, config?.currentDate?.monthIndex]);

  // --- HANDLERS ---
  const handleAdvanceTime = (minutes: number) => {
    actions.updateTime(minutes);
  };

  const handleSelectDay = (day: number) => {
    if (viewDate) {
      setViewDate({ ...viewDate, day });
    }
  };

  const handleNavigateMonth = (direction: -1 | 1) => {
    if (!viewDate || !config) return;
    
    let newMonth = viewDate.monthIndex + direction;
    let newYear = viewDate.year;

    if (newMonth < 0) {
      newMonth = config.months.length - 1;
      newYear--;
    } else if (newMonth >= config.months.length) {
      newMonth = 0;
      newYear++;
    }

    setViewDate({ ...viewDate, year: newYear, monthIndex: newMonth, day: 1 });
  };

  const handleSaveNote = (title: string, content: string, category: EventCategory, isGmOnly: boolean) => {
    if (viewDate) {
      actions.addLog(title, content, category, viewDate, isGmOnly);
      setIsCreatingNote(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    actions.deleteLog(id);
  };

  const handleWeatherClick = () => {
    if (!isGM) return;
    const newCondition = window.prompt('Enter new weather condition:', config?.currentWeather.currentCondition);
    if (newCondition) {
      const newTemp = window.prompt('Enter temperature:', String(config?.currentWeather.temperature));
      if (newTemp !== null) {
        const parsedTemp = parseInt(newTemp, 10);
        // Use parsed temperature if valid, otherwise keep current temperature
        const finalTemp = !isNaN(parsedTemp) ? parsedTemp : config?.currentWeather.temperature;
        actions.updateWeather(newCondition, finalTemp);
      }
    }
  };

  const handleConfigSave = (newConfig: typeof config) => {
    if (newConfig) {
      actions.updateConfig(newConfig);
      setShowSettings(false);
    }
  };

  // --- RENDER ---
  if (!ready) {
    return (
      <div className="calendar-container calendar-loading">
        <span className="calendar-loading-text">Loading Calendar...</span>
      </div>
    );
  }

  if (waitingForGM) {
    return (
      <div className="calendar-container calendar-loading" ref={containerRef}>
        <span className="calendar-loading-icon">📅</span>
        <span className="calendar-loading-text">Waiting for GM to initialize the calendar...</span>
        <span className="calendar-loading-subtext">The GM needs to open the calendar first to set it up.</span>
      </div>
    );
  }

  if (!config || !viewDate) {
    return (
      <div className="calendar-container calendar-loading">
        <span className="calendar-loading-text">Loading Calendar...</span>
      </div>
    );
  }

  // Calculate moon phase
  const moonPhase = getMoonPhase(config, viewDate.year, viewDate.monthIndex, viewDate.day);

  return (
    <div 
      className="calendar-container" 
      ref={containerRef}
      style={{
        background: `linear-gradient(135deg, var(--theme-bg-start, transparent) 0%, var(--theme-bg-mid, transparent) 50%, var(--theme-bg-end, transparent) 100%)`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {showSettings ? (
        <CalendarSettings
          config={config}
          logs={logs}
          viewDate={viewDate}
          currentMonthMeta={currentMonthMeta}
          onSave={handleConfigSave}
          onUpdateMonthMetadata={actions.updateMonthMetadata}
          onCancel={() => setShowSettings(false)}
        />
      ) : (
        <>
          <CompactHeader
            date={config.currentDate}
            weather={config.currentWeather}
            moon={moonPhase}
            yearName={config.yearName}
            isGM={isGM}
            onAdvanceTime={handleAdvanceTime}
            onWeatherClick={handleWeatherClick}
            onConfigClick={() => setShowSettings(true)}
          />

          <div className="calendar-scroll-area">
            <MonthView
              config={config}
              viewDate={viewDate}
              logs={logs}
              monthMetadata={currentMonthMeta}
              onSelectDay={handleSelectDay}
              onNavigateMonth={handleNavigateMonth}
            />

            <div style={{ padding: '0 8px 8px 8px' }}>
              {isCreatingNote ? (
                <NoteEditor
                  selectedDate={viewDate}
                  onSave={handleSaveNote}
                  onCancel={() => setIsCreatingNote(false)}
                />
              ) : (
                <>
                  {isGM && (
                    <button
                      onClick={() => setIsCreatingNote(true)}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ddd',
                        padding: '12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginBottom: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#ddd';
                      }}
                    >
                      + Add Event
                    </button>
                  )}
                  <NoteList
                    logs={logs}
                    selectedDate={viewDate}
                    isGM={isGM}
                    onDelete={handleDeleteNote}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
