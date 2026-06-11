import React, { useEffect, useState } from 'react';

export default function VoiceAlertHistory({ monitorId }) {
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
      color: "rgba(148, 163, 184, 0.8)"
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
          color: "white",
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
                background: filter === f ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.05)",
                border: filter === f ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                color: filter === f ? "#38bdf8" : "rgba(148, 163, 184, 0.7)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = filter === f ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = filter === f ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.05)";
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
          color: "rgba(148, 163, 184, 0.5)" 
        }}>
          Loading alerts...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          color: "rgba(148, 163, 184, 0.5)" 
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
                background: "rgba(3, 7, 18, 0.6)",
                border: `1px solid ${getStatusBorderColor(alert.status)}`,
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
                    background: getStatusBackgroundColor(alert.status),
                    border: `1px solid ${getStatusBorderColor(alert.status)}`,
                    color: getStatusTextColor(alert.status),
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.04em"
                  }}>
                    {formatStatus(alert.status)}
                  </span>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: getSeverityBackgroundColor(alert.severity),
                    border: `1px solid ${getSeverityBorderColor(alert.severity)}`,
                    color: getSeverityTextColor(alert.severity),
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.04em"
                  }}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <p style={{ marginBottom: "4px" }}>
                  <strong style={{ color: "rgba(148, 163, 184, 0.9)" }}>Recipient:</strong> {alert.recipientName || 'N/A'} ({alert.recipientPhone})
                </p>
                <p style={{ marginBottom: "4px" }}>
                  <strong style={{ color: "rgba(148, 163, 184, 0.9)" }}>Message:</strong> {alert.alertMessage}
                </p>
                <p>
                  <strong style={{ color: "rgba(148, 163, 184, 0.9)" }}>Type:</strong> {alert.alertType}
                </p>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "24px",
                marginBottom: "12px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: "rgba(148, 163, 184, 0.5)",
                    marginBottom: "2px"
                  }}>
                    Duration
                  </label>
                  <value style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.8)" }}>
                    {alert.callDuration || '—'}s
                  </value>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: "rgba(148, 163, 184, 0.5)",
                    marginBottom: "2px"
                  }}>
                    Attempts
                  </label>
                  <value style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.8)" }}>
                    {alert.attemptCount}/{alert.maxRetries}
                  </value>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "9px", 
                    color: "rgba(148, 163, 184, 0.5)",
                    marginBottom: "2px"
                  }}>
                    Called
                  </label>
                  <value style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.8)" }}>
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
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      color: "#38bdf8",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)";
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
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(148, 163, 184, 0.7)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
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

function getStatusBackgroundColor(status) {
  const colors = {
    queued: 'rgba(148, 163, 184, 0.1)',
    dialing: 'rgba(56, 189, 248, 0.1)',
    ringing: 'rgba(56, 189, 248, 0.1)',
    answered: 'rgba(52, 211, 153, 0.1)',
    completed: 'rgba(52, 211, 153, 0.1)',
    failed: 'rgba(248, 113, 113, 0.1)',
    missed: 'rgba(248, 113, 113, 0.1)'
  };
  return colors[status] || 'rgba(148, 163, 184, 0.1)';
}

function getStatusBorderColor(status) {
  const colors = {
    queued: 'rgba(148, 163, 184, 0.2)',
    dialing: 'rgba(56, 189, 248, 0.2)',
    ringing: 'rgba(56, 189, 248, 0.2)',
    answered: 'rgba(52, 211, 153, 0.2)',
    completed: 'rgba(52, 211, 153, 0.2)',
    failed: 'rgba(248, 113, 113, 0.2)',
    missed: 'rgba(248, 113, 113, 0.2)'
  };
  return colors[status] || 'rgba(148, 163, 184, 0.2)';
}

function getStatusTextColor(status) {
  const colors = {
    queued: 'rgba(148, 163, 184, 0.8)',
    dialing: '#38bdf8',
    ringing: '#38bdf8',
    answered: '#34d399',
    completed: '#34d399',
    failed: '#f87171',
    missed: '#f87171'
  };
  return colors[status] || 'rgba(148, 163, 184, 0.8)';
}

function getSeverityBackgroundColor(severity) {
  const colors = {
    critical: 'rgba(248, 113, 113, 0.1)',
    warning: 'rgba(251, 191, 36, 0.1)',
    info: 'rgba(56, 189, 248, 0.1)'
  };
  return colors[severity] || 'rgba(148, 163, 184, 0.1)';
}

function getSeverityBorderColor(severity) {
  const colors = {
    critical: 'rgba(248, 113, 113, 0.2)',
    warning: 'rgba(251, 191, 36, 0.2)',
    info: 'rgba(56, 189, 248, 0.2)'
  };
  return colors[severity] || 'rgba(148, 163, 184, 0.2)';
}

function getSeverityTextColor(severity) {
  const colors = {
    critical: '#f87171',
    warning: '#fbbf24',
    info: '#38bdf8'
  };
  return colors[severity] || 'rgba(148, 163, 184, 0.8)';
}
