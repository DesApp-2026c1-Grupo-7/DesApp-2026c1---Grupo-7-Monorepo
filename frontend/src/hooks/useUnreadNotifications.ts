import { useEffect, useState } from "react";
import api from "../services/api";

// Contador de notificaciones sin leer, compartido entre componentes (Navbar y
// Sidebar) mediante un unico poller a nivel de modulo, para no consultar la API
// por duplicado. Cada componente que use el hook se suscribe al valor.
const POLL_MS = 15000;

let currentCount = 0;
const listeners = new Set<(n: number) => void>();
let timer: number | null = null;

async function fetchCount(): Promise<void> {
  try {
    const res = await api.get("/notificaciones");
    const list: { leida: boolean }[] = res.data || [];
    const next = list.filter((n) => !n.leida).length;
    if (next !== currentCount) {
      currentCount = next;
      listeners.forEach((notify) => notify(next));
    }
  } catch {
    // Si falla la consulta dejamos el contador como estaba.
  }
}

// Refresca el contador al instante (ej. tras marcar notificaciones como leidas).
export function refreshUnread(): void {
  void fetchCount();
}

export function useUnreadNotifications(enabled: boolean): number {
  const [count, setCount] = useState(currentCount);

  useEffect(() => {
    if (!enabled) return;

    listeners.add(setCount);
    if (timer === null) {
      // Primer suscriptor: arranca el poller.
      void fetchCount();
      timer = window.setInterval(fetchCount, POLL_MS);
    } else {
      // Ya hay poller activo: pedimos un refresco para sincronizar este suscriptor.
      void fetchCount();
    }

    return () => {
      listeners.delete(setCount);
      if (listeners.size === 0 && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
  }, [enabled]);

  return count;
}
