import { useEffect, useRef } from "react";

function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  isLoading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
}) {
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const modalContentRef = useRef(null);
  const triggerElementRef = useRef(null);
  const prevIsOpenRef = useRef(false);

  // Capture trigger element on open and restore focus on close
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      triggerElementRef.current = document.activeElement;
    } else if (!isOpen && prevIsOpenRef.current) {
      const el = triggerElementRef.current;
      if (el && document.contains(el) && typeof el.focus === "function") {
        el.focus();
      } else {
        const fallback = document.querySelector('main') || document.body;
        fallback?.focus?.();
      }
      triggerElementRef.current = null;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      const el = triggerElementRef.current;
      if (el && document.contains(el) && typeof el.focus === "function") {
        el.focus();
      } else {
        const fallback = document.querySelector('main') || document.body;
        fallback?.focus?.();
      }
    };
  }, []);

  // Keyboard navigation: Escape key to close & Tab trap within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalContentRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // If focus escaped the modal dialog container, redirect back into dialog
        if (!modalContentRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (isDanger) {
      cancelBtnRef.current?.focus();
    } else {
      confirmBtnRef.current?.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDanger, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cpms-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalContentRef}
        className="cpms-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cpms-modal-header">
          <h3
            id="confirm-modal-title"
            style={{
              margin: 0,
              fontSize: "18px",
              color: isDanger ? "#b91c1c" : "#1e3a8a",
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            className="cpms-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div
          className="cpms-modal-body"
          style={{
            padding: "16px 0",
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: 1.6,
          }}
        >
          {message}
        </div>

        <div
          className="cpms-modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            paddingTop: "14px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            style={{
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",
              background: isDanger ? "#dc2626" : "#1e5795",
              color: "#ffffff",
              fontWeight: 600,
              cursor: isLoading ? "wait" : confirmDisabled ? "not-allowed" : "pointer",
              opacity: confirmDisabled ? 0.6 : 1,
            }}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
