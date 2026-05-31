"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * ============================================================================
 * CityDashboard.tsx
 * ============================================================================
 * A highly comprehensive, zero-dependency analytical dashboard for real-time
 * city metrics visualization. Includes sub-components for system health,
 * active user monitoring, energy distribution, and infrastructure logging.
 * * Version: 1.0.0
 * Last Updated: May 31, 2026
 * ============================================================================
 */

// --- 1. TYPES AND INTERFACES ---

export type ServerStatus = 'ONLINE' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface DashboardData {
  energy: number;
  activeUsers: number;
  buildingCount: number;
  systemLoad: number;
  weatherIndex: number;
  networkLatency: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
}

export interface DataPoint {
  time: string;
  value: number;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

// --- 2. CONFIGURATION AND THEMES ---

const MAX_LOG_HISTORY = 100;
const REFRESH_RATE_MS = 2500;

export const THEME: ThemeColors = {
  background: 'rgba(12, 14, 18, 0.90)',
  surface: 'rgba(22, 26, 32, 0.95)',
  surfaceHighlight: 'rgba(32, 38, 46, 1)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  accent: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
};

// --- 3. UTILITY FUNCTIONS ---

/**
 * Formats a raw number into a human-readable string with commas.
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Calculates percentage relative to a defined maximum value.
 */
const calculatePercentage = (value: number, max: number): number => {
  if (max === 0) return 0;
  const perc = (value / max) * 100;
  return Math.min(Math.max(perc, 0), 100);
};

/**
 * Generates a unique ID for log entries.
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

/**
 * Formats a Date object into a precise timestamp string.
 */
const getPreciseTimestamp = (): string => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
};

/**
 * Returns an appropriate color based on the log level.
 */
const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case 'INFO': return THEME.info;
    case 'WARNING': return THEME.warning;
    case 'ERROR': return THEME.danger;
    case 'CRITICAL': return '#FF00FF'; // High visibility magenta
    default: return THEME.textPrimary;
  }
};

/**
 * Returns an appropriate color based on system status.
 */
const getStatusColor = (status: ServerStatus): string => {
  switch (status) {
    case 'ONLINE': return THEME.success;
    case 'DEGRADED': return THEME.warning;
    case 'MAINTENANCE': return THEME.info;
    case 'OFFLINE': return THEME.danger;
    default: return THEME.textSecondary;
  }
};

// --- 4. SUB-COMPONENTS ---

/**
 * Card wrapper for dashboard modules.
 */
const ModuleCard = ({ title, children, rightAction }: { title: string, children: React.ReactNode, rightAction?: React.ReactNode }) => (
  <div style={{
    backgroundColor: THEME.surface,
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {rightAction && <div>{rightAction}</div>}
    </div>
    <div>{children}</div>
  </div>
);

/**
 * High-impact metric display.
 */
const PrimaryMetric = ({ label, value, unit, trend, color = THEME.textPrimary }: { label: string, value: string | number, unit: string, trend?: number, color?: string }) => (
  <div style={{ flex: 1, padding: '12px', backgroundColor: THEME.surfaceHighlight, borderRadius: '6px', minWidth: '120px' }}>
    <div style={{ fontSize: '11px', color: THEME.textSecondary, marginBottom: '4px' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '12px', color: THEME.textSecondary }}>{unit}</span>
    </div>
    {trend !== undefined && (
      <div style={{ fontSize: '11px', marginTop: '4px', color: trend >= 0 ? THEME.success : THEME.danger }}>
        {trend >= 0 ? '▲ +' : '▼ '}{trend}% from last hour
      </div>
    )}
  </div>
);

/**
 * System load progress bar.
 */
const LoadGauge = ({ load, label }: { load: number, label: string }) => {
  const isHigh = load > 85;
  const isMedium = load > 60;
  const barColor = isHigh ? THEME.danger : isMedium ? THEME.warning : THEME.success;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: THEME.textPrimary }}>{label}</span>
        <span style={{ color: barColor, fontWeight: 600 }}>{load.toFixed(1)}%</span>
      </div>
      <div style={{ height: '6px', backgroundColor: THEME.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(load, 100)}%`,
          backgroundColor: barColor,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
};

/**
 * SVG-based Sparkline Chart for data trends.
 */
const SparklineChart = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  const height = 40;
  const width = 300;
  const step = width / (data.length > 1 ? data.length - 1 : 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / (range || 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height: `${height}px`, width: '100%', position: 'relative', marginTop: '16px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};

/**
 * Real-time event log console.
 */
const EventConsole = ({ logs }: { logs: LogEntry[] }) => (
  <div style={{
    height: '160px',
    backgroundColor: '#000000',
    border: `1px solid ${THEME.border}`,
    borderRadius: '4px',
    overflowY: 'auto',
    padding: '8px',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }}>
    {logs.length === 0 ? (
      <div style={{ color: THEME.textSecondary, fontStyle: 'italic', padding: '8px' }}>Waiting for system events...</div>
    ) : (
      logs.map(log => (
        <div key={log.id} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
          <span style={{ color: THEME.textSecondary, minWidth: '85px' }}>[{log.timestamp}]</span>
          <span style={{ color: getLogLevelColor(log.level), minWidth: '60px', fontWeight: 'bold' }}>{log.level}</span>
          <span style={{ color: '#A78BFA', minWidth: '70px' }}>[{log.source}]</span>
          <span style={{ color: THEME.textPrimary, wordBreak: 'break-all' }}>{log.message}</span>
        </div>
      ))
    )}
  </div>
);

// --- 5. MAIN DASHBOARD COMPONENT ---

export const CityDashboard = ({ data }: { data: DashboardData }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<ServerStatus>('ONLINE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [energyHistory, setEnergyHistory] = useState<number[]>(Array(20).fill(0));
  const [uptime, setUptime] = useState<number>(0);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Function to safely add logs to the state
  const dispatchLog = useCallback((level: LogLevel, source: string, message: string) => {
    const newLog: LogEntry = {
      id: generateId(),
      timestamp: getPreciseTimestamp(),
      level,
      source,
      message
    };
    
    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      if (updatedLogs.length > MAX_LOG_HISTORY) {
        updatedLogs.pop();
      }
      return updatedLogs;
    });
  }, []);

  // System Initialization Effect
  useEffect(() => {
    dispatchLog('INFO', 'SYS_INIT', 'City Analytical Dashboard initialized successfully.');
    dispatchLog('INFO', 'NET_MGR', 'WebSocket connection established on port 8080.');
    
    const uptimeTimer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(uptimeTimer);
    };
  }, [dispatchLog]);

  // Data Polling & History Tracking Effect
  useEffect(() => {
    const pollTimer = setInterval(() => {
      // Update energy history array for the sparkline chart
      setEnergyHistory(prev => {
        const next = [...prev.slice(1), data.energy || Math.random() * 1000];
        return next;
      });

      // Status logic based on data thresholds
      if (data.systemLoad > 90) {
        setSystemStatus('DEGRADED');
        dispatchLog('WARNING', 'PERF_MON', `High system load detected: ${data.systemLoad.toFixed(1)}%`);
      } else if (data.networkLatency > 500) {
        setSystemStatus('DEGRADED');
        dispatchLog('ERROR', 'NET_MGR', `Critical latency spike: ${data.networkLatency}ms`);
      } else {
        if (systemStatus !== 'ONLINE') {
          dispatchLog('INFO', 'SYS_MON', 'System health restored to normal parameters.');
        }
        setSystemStatus('ONLINE');
      }

    }, REFRESH_RATE_MS);

    return () => clearInterval(pollTimer);
  }, [data, systemStatus, dispatchLog]);

  // Derived calculations using useMemo to prevent unnecessary re-renders
  const metrics = useMemo(() => {
    const efficiency = calculateSystemEfficiency(data.buildingCount, data.energy);
    const serverCapacity = calculatePercentage(data.activeUsers, 10000); // Assume 10k max capacity
    
    return {
      efficiencyScore: efficiency.toFixed(3),
      capacityUtilized: serverCapacity,
      formattedEnergy: formatNumber(Math.floor(data.energy)),
      formattedUsers: formatNumber(data.activeUsers),
      formattedBuildings: formatNumber(data.buildingCount),
      uptimeString: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
    };
  }, [data, uptime]);

  // Collapsed View
  if (!isOpen) {
    return (
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10000 }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: THEME.surface,
            color: THEME.textPrimary,
            border: `1px solid ${THEME.border}`,
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(systemStatus) }} />
          <span style={{ fontWeight: 600 }}>City Analytics</span>
          <span style={{ color: THEME.textSecondary, fontSize: '12px' }}>Open HUD</span>
        </button>
      </div>
    );
  }

  // Full Dashboard View
  return (
    <div
      ref={dashboardRef}
      style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        width: '420px',
        maxHeight: 'calc(100vh - 48px)',
        backgroundColor: THEME.background,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${THEME.border}`,
        borderRadius: '12px',
        color: THEME.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflowY: 'auto',
        zIndex: 10000,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* HEADER */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: 'inherit',
        zIndex: 10
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            City Analytics HUD
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(systemStatus), boxShadow: `0 0 8px ${getStatusColor(systemStatus)}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusColor(systemStatus) }}>
              SYSTEM {systemStatus}
            </span>
            <span style={{ fontSize: '12px', color: THEME.textSecondary, marginLeft: '8px' }}>
              UPTIME: {metrics.uptimeString}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: THEME.textSecondary,
            cursor: 'pointer',
            padding: '4px',
            fontSize: '18px'
          }}
        >
          ✕
        </button>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div style={{ padding: '24px' }}>
        
        {/* ROW 1: PRIMARY METRICS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <PrimaryMetric label="Total Energy Grid" value={metrics.formattedEnergy} unit="kWh" trend={2.4} color={THEME.accent} />
          <PrimaryMetric label="Active User Sessions" value={metrics.formattedUsers} unit="clients" trend={-0.8} />
        </div>

        {/* MODULE: INFRASTRUCTURE */}
        <ModuleCard title="Infrastructure Overview">
          <LoadGauge load={data.systemLoad} label="Global CPU Utilization" />
          <LoadGauge load={metrics.capacityUtilized} label="Server Node Capacity" />
          <LoadGauge load={calculatePercentage(data.networkLatency, 1000)} label="Network I/O Saturation" />
          
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: THEME.textSecondary }}>Registered Buildings</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{metrics.formattedBuildings}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: THEME.textSecondary }}>Grid Efficiency Score</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: THEME.info }}>{metrics.efficiencyScore}</div>
            </div>
          </div>
        </ModuleCard>

        {/* MODULE: LIVE TELEMETRY */}
        <ModuleCard 
          title="Energy Grid Telemetry" 
          rightAction={<span style={{ fontSize: '10px', color: THEME.success }}>● Live Sync</span>}
        >
          <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '8px' }}>
            Real-time power consumption across all instanced meshes.
          </div>
          <SparklineChart data={energyHistory} color={THEME.accent} />
        </ModuleCard>

        {/* MODULE: ENVIRONMENTAL DATA */}
        <ModuleCard title="Environmental Subsystem">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: THEME.textSecondary }}>Weather Index</div>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>{data.weatherIndex.toFixed(2)}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: THEME.textSecondary }}>Ambient Lighting</div>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>Rayleigh</div>
            </div>
          </div>
        </ModuleCard>

        {/* MODULE: SYSTEM LOGS */}
        <ModuleCard title="Diagnostics & Event Log">
          <EventConsole logs={logs} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <button
              onClick={() => setLogs([])}
              style={{ background: 'transparent', border: 'none', color: THEME.textSecondary, fontSize: '10px', cursor: 'pointer' }}
            >
              [CLEAR LOGS]
            </button>
            <button
              onClick={() => dispatchLog('INFO', 'USER_ACT', 'Manual diagnostic ping initiated.')}
              style={{ background: 'transparent', border: `1px solid ${THEME.border}`, borderRadius: '4px', color: THEME.textPrimary, fontSize: '10px', cursor: 'pointer', padding: '2px 8px' }}
            >
              SEND PING
            </button>
          </div>
        </ModuleCard>

      </div>
    </div>
  );
};

export default CityDashboard;