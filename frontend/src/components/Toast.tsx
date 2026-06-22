import type { CSSProperties } from "react";
import type { ToastState } from "../hooks/useToast";
import "../styles/Toast.css";

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

// Sincroniza la barra de progreso con el auto-cierre del hook.
const DURACION_CSS: Record<ToastState["type"], string> = {
  success: "4s",
  error: "5s",
};

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      className={`profile-alert ${toast.type}`}
      role={toast.type === "success" ? "status" : "alert"}
      style={{ "--toast-duration": DURACION_CSS[toast.type] } as CSSProperties}
    >
      <span className="profile-alert__icon" aria-hidden="true">
        {toast.type === "success" ? "✓" : "!"}
      </span>
      <span className="profile-alert__message">{toast.text}</span>
      <button className="profile-alert__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}
