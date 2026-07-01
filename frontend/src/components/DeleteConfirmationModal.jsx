import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X, Globe } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Delete Item", message = "Are you sure you want to delete this item? This action cannot be undone.", itemName = "", loading = false }) => {
  const { currentTheme } = useTheme();
  const theme = currentTheme || {
    bg: "rgba(0, 0, 0, 0.75)",
    bgCard: "rgba(3, 7, 18, 0.97)",
    bgInput: "rgba(255, 255, 255, 0.04)",
    borderAccent: "rgba(248, 113, 113, 0.18)",
    borderLight: "rgba(255, 255, 255, 0.08)",
    text: "white",
    textMuted: "rgba(148, 163, 184, 0.75)",
    textDim: "rgba(148, 163, 184, 0.5)",
    error: "#f87171",
    errorBg: "rgba(248, 113, 113, 0.06)",
    accent: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.06)",
    shadow: "0 20px 60px rgba(0, 0, 0, 0.55), 0 0 32px rgba(248, 113, 113, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
  };
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "90%",
            maxWidth: "420px",
            background: theme.bgCard,
            border: `1px solid ${theme.borderAccent}`,
            borderRadius: "16px",
            backdropFilter: "blur(24px)",
            boxShadow: theme.shadow,
            overflow: "hidden",
          }}
        >
          {/* Top gradient border */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent 0%, ${theme.error}80 20%, ${theme.error}4d 80%, transparent 100%)`,
            }}
          />

            {/* Content */}
            <div style={{ padding: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 15 }}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${theme.error}26 0%, ${theme.error}14 100%)`,
                      border: `1px solid ${theme.error}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${theme.error}26`,
                    }}
                  >
                    <AlertTriangle size={22} style={{ color: theme.error }} />
                  </motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: theme.text,
                        marginBottom: "4px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {title}
                    </h2>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    background: theme.bgInput,
                    border: `1px solid ${theme.borderLight}`,
                    borderRadius: "10px",
                    padding: "8px",
                    color: theme.textDim,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = theme.bgInput;
                      e.currentTarget.style.borderColor = theme.borderAccent;
                      e.currentTarget.style.color = theme.textMuted;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.bgInput;
                    e.currentTarget.style.borderColor = theme.borderLight;
                    e.currentTarget.style.color = theme.textDim;
                  }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Item name display */}
              {itemName && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: theme.accentGlow,
                    border: `1px solid ${theme.accent}26`,
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Globe size={16} style={{ color: theme.accent, opacity: 0.6, flexShrink: 0 }} />
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: theme.accent,
                        opacity: 0.8,
                        letterSpacing: "0.01em",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {itemName}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Message */}
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: theme.textMuted,
                  lineHeight: 1.6,
                  marginBottom: "22px",
                  letterSpacing: "0.01em",
                }}
              >
                {message}
              </p>

              {/* Warning indicator */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: theme.errorBg,
                  border: `1px solid ${theme.error}1e`,
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: theme.error,
                      boxShadow: `0 0 8px ${theme.error}80`,
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      color: theme.error,
                      opacity: 0.75,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "11px 18px",
                    borderRadius: "10px",
                    background: theme.bgInput,
                    border: `1px solid ${theme.borderLight}`,
                    color: theme.textMuted,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = theme.bgInput;
                      e.currentTarget.style.borderColor = theme.borderAccent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.bgInput;
                    e.currentTarget.style.borderColor = theme.borderLight;
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onConfirm}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "11px 18px",
                    borderRadius: "10px",
                    background: loading ? `${theme.error}2e` : `linear-gradient(135deg, ${theme.error}26 0%, ${theme.error}1a 100%)`,
                    border: loading ? `1px solid ${theme.error}40` : `1px solid ${theme.error}4d`,
                    color: loading ? `${theme.error}80` : theme.error,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: `0 2px 8px ${theme.error}1a`,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${theme.error}38 0%, ${theme.error}26 100%)`;
                      e.currentTarget.style.borderColor = `${theme.error}66`;
                      e.currentTarget.style.boxShadow = `0 4px 12px ${theme.error}33`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${theme.error}26 0%, ${theme.error}1a 100%)`;
                    e.currentTarget.style.borderColor = `${theme.error}4d`;
                    e.currentTarget.style.boxShadow = `0 2px 8px ${theme.error}1a`;
                  }}
                >
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ fontSize: "13px" }}>
                        ⟳
                      </motion.span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </div>

          {/* Bottom gradient border */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${theme.error}33, transparent)`,
            }}
          />
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
};

export default DeleteConfirmationModal;
