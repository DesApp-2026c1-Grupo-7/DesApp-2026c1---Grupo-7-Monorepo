import { useEffect, useRef, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../services/api";
import "../styles/NotificationToaster.css";

interface NotificationItem {
  _id: string;
  titulo: string;
  descripcion: string;
  createdAt: string;
  tipo: "success" | "info" | "warning" | "default";
  leida: boolean;
  link?: string;
}

// Cada cuanto consultamos por notificaciones nuevas, cuanto dura el pop-up en pantalla
// y cuanto tarda la animacion de salida (rapida para no molestar).
const POLL_MS = 15000;
const AUTO_DISMISS_MS = 6000;
const EXIT_MS = 220;

// Un unico AudioContext compartido para la campanita. Crear uno nuevo por
// notificacion arrancaba "suspendido" (politica de autoplay) y dejaba el sonido
// encolado, que despues saltaba con delay o sin notificacion visible; ademas el
// navegador limita la cantidad de contextos. Con uno solo, reusado, lo evitamos.
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AC =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new AC();
  return sharedAudioCtx;
}

/**
 * Muestra un pop-up flotante (arriba a la derecha, debajo del header) cuando le llega
 * una notificacion al estudiante: ya sea recibida mientras esta dentro de la pagina, o
 * una sin leer que habia llegado mientras estaba afuera (aparece apenas entra). Si
 * llegan varias entre dos consultas, solo aparece la ultima. Se autocierra a los pocos
 * segundos con una animacion de salida, suena una campanita sutil al llegar y tiene un
 * boton "Cerrar" para descartarla a mano antes de tiempo.
 */
export default function NotificationToaster() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState<NotificationItem | null>(null);
  const [closing, setClosing] = useState(false);
  // createdAt (en ms) de la notificacion mas nueva ya vista; null hasta la primera consulta.
  const baselineRef = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);

  const playBell = useCallback(async () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Si esta suspendido, intentamos reactivarlo (requiere algun gesto previo
      // del usuario, que ya ocurrio con el login/clicks).
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          return;
        }
      }
      // Si sigue bloqueado no programamos nada: evitamos encolar un sonido que
      // saltaria mas tarde, fuera de tiempo.
      if (ctx.state !== "running") return;

      const now = ctx.currentTime;
      // Dos tonos cortos y suaves que evocan una campanita.
      [880, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.06;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.07, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {
      // Si el navegador bloquea el audio (autoplay policy, etc.) lo ignoramos.
    }
  }, []);

  // Cierra el pop-up con la animacion de salida y recien despues lo saca del DOM.
  const dismiss = useCallback(() => {
    setClosing(true);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => {
      setCurrent(null);
      setClosing(false);
    }, EXIT_MS);
  }, []);

  // Muestra una notificacion (cancela cualquier salida en curso y suena la campana).
  const show = useCallback((n: NotificationItem) => {
    if (exitTimer.current) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    setClosing(false);
    setCurrent(n);
    void playBell();
  }, [playBell]);

  // Click en el area izquierda del pop-up: lleva a la pantalla de notificaciones.
  const openNotifications = useCallback(() => {
    if (exitTimer.current) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    setClosing(false);
    setCurrent(null);
    navigate("/student/notifications");
  }, [navigate]);

  // Polling: detecta la notificacion mas nueva y la muestra.
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await api.get("/notificaciones");
        const list: NotificationItem[] = res.data || [];
        if (!active || list.length === 0) return;

        // El backend devuelve ordenado por createdAt desc, asi que la primera es la mas nueva.
        const newest = list[0];
        const newestTime = new Date(newest.createdAt).getTime();

        if (baselineRef.current === null) {
          // Primera consulta (recien entras a la pagina): fijamos la base y, si la mas
          // reciente esta sin leer, la mostramos (llego mientras estabas afuera).
          baselineRef.current = newestTime;
          if (!newest.leida) show(newest);
          return;
        }

        if (newestTime > baselineRef.current) {
          baselineRef.current = newestTime;
          show(newest);
        }
      } catch {
        // Errores de red transitorios: reintentamos en el proximo intervalo.
      }
    };

    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [show]);

  // Auto-cierre del pop-up actual (usa la misma animacion de salida).
  useEffect(() => {
    if (!current || closing) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [current, closing, dismiss]);

  // Limpia el timer de salida al desmontar.
  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
  }, []);

  if (!current) return null;

  return (
    <div
      key={current._id}
      className={`notif-pop notif-${current.tipo}${closing ? " is-closing" : ""}`}
      role="status"
      aria-live="polite"
      style={{ "--notif-duration": `${AUTO_DISMISS_MS / 1000}s` } as CSSProperties}
    >
      <button
        type="button"
        className="notif-pop__main"
        onClick={openNotifications}
        aria-label="Ver notificaciones"
      >
        <span className="notif-pop__icon" aria-hidden="true">
          <Bell size={17} />
        </span>
        <span className="notif-pop__body">
          <span className="notif-pop__title">{current.titulo}</span>
          <span className="notif-pop__desc">{current.descripcion}</span>
        </span>
      </button>
      <button
        className="notif-pop__close"
        onClick={dismiss}
        aria-label="Cerrar notificación"
      >
        Cerrar
      </button>
    </div>
  );
}
