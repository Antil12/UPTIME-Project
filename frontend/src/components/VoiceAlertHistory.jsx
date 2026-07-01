import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function VoiceAlertHistory({ monitorId }) {
  const { currentTheme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [monitorId, filter]);

  async function fetchAlerts() {
    try {
      const response = await fetch(`/api/voice-alerts/monitor/${monitorId}`);
      const data = await response.json();
      setAlerts(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setLoading(false);
    }
  }

  async function retryAlert(alertId) {
    try {
      const response = await fetch(`/api/voice-alerts/${alertId}/retry`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Alert queued for retry');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to retry alert:', err);
    }
  }

  const filtered = filter === 'all' 
    ? alerts 
    : alerts.filter(a => 
        filter === 'answered' ? a.status === 'answered' : a.status === 'missed'
      );

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "12px",
      color: currentTheme.textSecondary
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "16px" 
      }}>
        <h2 style={{ 
          fontSize: "14px", 
          fontWeight: 600, 
          color: currentTheme.text,
          letterSpacing: "0.02em"
        }}>
          Voice Alert History
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {['all', 'answered', 'missed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: filter === f ? currentTheme.accentGlow : currentTheme.bgInput,
                border: filter === f ? `1px solid ${currentTheme.accent}40` : `1px solid ${currentTheme.borderLight}`,
                color: filter === f ? currentTheme.accent : currentTheme.textMuted,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = filter === f ? `${currentTheme.accent}25` : currentTheme.bgInput;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = filter === f ? currentTheme.accentGlow : currentTheme.bgInput;
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          color: currentTheme.textDim 
        }}>
          Loading alerts...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          color: currentTheme.textDim 
        }}>
          No voice alerts
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map(alert => (
            <div 
              key={alert._id} 
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: currentTheme.bgCard,
                border: `1px solid ${getStatusBorderColor(alert.status, currentTheme)}`,
                backdropFilter: "blur(8px)"
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start", 
                marginBottom: "12px" 
              }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: getStatusBackgroundColor(alert.status, currentTheme),
                    border: `1px solid ${getStatusBorderColor(alert.status, currentTheme)}`,
                    color: getStatusTextColor(alert.status, currentTheme),
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.04em"
                  }}>
                    {formatStatus(alert.status)}
                  </span>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: getSeverityBackgroundColor(alert.severity, currentTheme),
                    border: `1px solid ${getSeverityBorderColor(alert.severity, currentTheme)}`,
                    color: getSeverityTextColor(alert.severity, currentTheme),
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.04em"
                  }}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <p style={{ marginBottom: "4px", color: currentTheme.textSecondary }}>
                  <strong style={{ color: currentTheme.text, fontWeight: 600 }}>Recipient:</strong> {alert.recipientName || 'N/A'} ({alert.recipientPhone})
                </p>
                <p style={{ marginBottom: "4px", color: currentTheme.textSecondary }}>
                  <strong style={{ color: currentTheme.text, fontWeight: 600 }}>Message:</strong> {alert.alertMessage}
                </p>
                <p style={{ color: currentTheme.textSecondary }}>
                  <strong style={{ color: currentTheme.text, fontWeight: 600 }}>Type:</strong> {alert.alertType}
                </p>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "24px",
                marginBottom: "12px",
                padding: "12px",
                borderRadius: "8px",
                background: currentTheme.bgInput,
                border: `1px solid ${currentTheme.borderLight}`
              }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: currentTheme.textDim,
                    marginBottom: "2px"
                  }}>
                    Duration
                  </label>
                  <value style={{ fontSize: "11px", color: currentTheme.textSecondary }}>
                    {alert.callDuration || '—'}s
                  </value>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: currentTheme.textDim,
                    marginBottom: "2px"
                  }}>
                    Attempts
                  </label>
                  <value style={{ fontSize: "11px", color: currentTheme.textSecondary }}>
                    {alert.attemptCount}/{alert.maxRetries}
                  </value>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: currentTheme.textDim,
                    marginBottom: "2px"
                  }}>
                    Called
                  </label>
                  <value style={{ fontSize: "11px", color: currentTheme.textSecondary }}>
                    {alert.callStartedAt ? new Date(alert.callStartedAt).toLocaleString() : '—'}
                  </value>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {alert.status === 'failed' && alert.attemptCount < alert.maxRetries && (
                  <button 
                    onClick={() => retryAlert(alert._id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: currentTheme.accentGlow,
                      border: `1px solid ${currentTheme.accent}30`,
                      color: currentTheme.accent,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${currentTheme.accent}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = currentTheme.accentGlow;
                    }}
                  >
                    Retry
                  </button>
                )}
                <button 
                  onClick={() => console.log(alert)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.borderLight}`,
                    color: currentTheme.textMuted,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = currentTheme.bgInput;
                    e.currentTarget.style.color = currentTheme.textSecondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentTheme.bgInput;
                    e.currentTarget.style.color = currentTheme.textMuted;
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatStatus(status) {
  const map = {
    queued: '⏳ Queued',
    dialing: '📞 Dialing',
    ringing: '🔔 Ringing',
    answered: '✅ Answered',
    completed: '✓ Completed',
    failed: '❌ Failed',
    missed: '⊘ Missed'
  };
  return map[status] || status;
}

function getStatusBackgroundColor(status, currentTheme) {
  const colors = {
    queued: currentTheme.textDim,
    dialing: currentTheme.accentGlow,
    ringing: currentTheme.accentGlow,
    answered: currentTheme.successBg,
    completed: currentTheme.successBg,
    failed: currentTheme.errorBg,
    missed: currentTheme.errorBg
  };
  return colors[status] || currentTheme.textDim;
}

function getStatusBorderColor(status, currentTheme) {
  const colors = {
    queued: currentTheme.border,
    dialing: `${currentTheme.accent}30`,
    ringing: `${currentTheme.accent}30`,
    answered: `${currentTheme.success}30`,
    completed: `${currentTheme.success}30`,
    failed: `${currentTheme.error}30`,
    missed: `${currentTheme.error}30`
  };
  return colors[status] || currentTheme.border;
}

function getStatusTextColor(status, currentTheme) {
  const colors = {
    queued: currentTheme.textSecondary,
    dialing: currentTheme.accent,
    ringing: currentTheme.accent,
    answered: currentTheme.success,
    completed: currentTheme.success,
    failed: currentTheme.error,
    missed: currentTheme.error
  };
  return colors[status] || currentTheme.textSecondary;
}

function getSeverityBackgroundColor(severity, currentTheme) {
  const colors = {
    critical: currentTheme.errorBg,
    warning: `${currentTheme.warning}12`,
    info: currentTheme.accentGlow
  };
  return colors[severity] || currentTheme.textDim;
}

function getSeverityBorderColor(severity, currentTheme) {
  const colors = {
    critical: `${currentTheme.error}30`,
    warning: `${currentTheme.warning}30`,
    info: `${currentTheme.accent}30`
  };
  return colors[severity] || currentTheme.border;
}

function getSeverityTextColor(severity, currentTheme) {
  const colors = {
    critical: currentTheme.error,
    warning: currentTheme.warning,
    info: currentTheme.accent
  };
  return colors[severity] || currentTheme.textSecondary;
}
