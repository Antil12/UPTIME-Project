import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X, Globe } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Delete Item", message = "Are you sure you want to delete this item? This action cannot be undone.", itemName = "", loading = false }) => {
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
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
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
            background: "rgba(3, 7, 18, 0.97)",
            border: "1px solid rgba(248, 113, 113, 0.18)",
            borderRadius: "16px",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.55), 0 0 32px rgba(248, 113, 113, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
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
              background: "linear-gradient(90deg, transparent 0%, rgba(248, 113, 113, 0.5) 20%, rgba(248, 113, 113, 0.3) 80%, transparent 100%)",
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
                      background: "linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.08) 100%)",
                      border: "1px solid rgba(248, 113, 113, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(248, 113, 113, 0.15)",
                    }}
                  >
                    <AlertTriangle size={22} style={{ color: "#f87171" }} />
                  </motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "white",
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
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "8px",
                    color: "rgba(148, 163, 184, 0.5)",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.color = "rgba(148, 163, 184, 0.8)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "rgba(148, 163, 184, 0.5)";
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
                    background: "rgba(56, 189, 248, 0.06)",
                    border: "1px solid rgba(56, 189, 248, 0.15)",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Globe size={16} style={{ color: "rgba(56, 189, 248, 0.6)", flexShrink: 0 }} />
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: "rgba(56, 189, 248, 0.8)",
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
                  color: "rgba(148, 163, 184, 0.65)",
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
                  background: "rgba(248, 113, 113, 0.06)",
                  border: "1px solid rgba(248, 113, 113, 0.12)",
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
                      background: "#f87171",
                      boxShadow: "0 0 8px rgba(248, 113, 113, 0.5)",
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      color: "rgba(248, 113, 113, 0.75)",
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
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(148, 163, 184, 0.75)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
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
                    background: loading ? "rgba(248, 113, 113, 0.18)" : "linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.1) 100%)",
                    border: loading ? "1px solid rgba(248, 113, 113, 0.25)" : "1px solid rgba(248, 113, 113, 0.3)",
                    color: loading ? "rgba(248, 113, 113, 0.5)" : "#f87171",
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
                    boxShadow: "0 2px 8px rgba(248, 113, 113, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(248, 113, 113, 0.22) 0%, rgba(248, 113, 113, 0.15) 100%)";
                      e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.4)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(248, 113, 113, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.1) 100%)";
                    e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.3)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(248, 113, 113, 0.1)";
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
              background: "linear-gradient(90deg, transparent, rgba(248, 113, 113, 0.2), transparent)",
            }}
          />
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
};

export default DeleteConfirmationModal;
