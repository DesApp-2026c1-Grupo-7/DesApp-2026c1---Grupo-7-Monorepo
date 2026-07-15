import type { ReactNode } from "react";
import "../styles/ConfirmModal.css";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="confirm-modal-overlay" onClick={loading ? undefined : onCancel}>
      <div className="confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <div className="confirm-modal-message">{message}</div>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-btn cancel" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn ${danger ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
