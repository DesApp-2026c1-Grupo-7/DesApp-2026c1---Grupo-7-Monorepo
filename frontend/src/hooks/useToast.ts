import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export type ToastType = "success" | "error";
export interface ToastState {
  text: string;
  type: ToastType;
}

// Duracion del auto-cierre segun el tipo (los errores quedan un poco mas).
const DURACION_MS: Record<ToastType, number> = {
  success: 4000,
  error: 5000,
};

/**
 * Maneja el estado de un toast: mostrarlo, cerrarlo y auto-cerrarlo.
 * Ademas levanta el toast que pueda llegar desde otra pantalla via
 * navigate(path, { state: { toast } }) — util para acciones que navegan
 * al terminar (ej. crear/editar -> volver a la lista).
 */
export function useToast() {
  const location = useLocation();

  // Toast que viaja con la navegacion (otra pantalla -> esta): lo levantamos en
  // el inicializador para no llamar setState dentro de un effect.
  const incoming = (location.state as { toast?: ToastState } | null)?.toast ?? null;
  const [toast, setToast] = useState<ToastState | null>(incoming);

  const showToast = useCallback((text: string, type: ToastType) => {
    setToast({ text, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  // Limpiamos el state de navegacion para que el toast no reaparezca al refrescar.
  useEffect(() => {
    if (incoming) {
      window.history.replaceState({}, "");
    }
  }, [incoming]);

  // Auto-cierre.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), DURACION_MS[toast.type]);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, showToast, hideToast };
}
