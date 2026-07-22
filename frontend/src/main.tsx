import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light';

// Al submit, forzar checkValidity() en cada campo asi el handler invalid dispara
// una vez por cada campo invalido (por defecto el navegador solo dispara en el 1er
// campo hasta hacer submit real).
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement | null;
  if (!form || !('elements' in form)) return;
  let algunoInvalido = false;
  for (const el of Array.from(form.elements)) {
    const c = el as HTMLInputElement;
    if (typeof c.checkValidity === 'function' && !c.checkValidity()) {
      algunoInvalido = true;
    }
  }
  if (algunoInvalido) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

// Reemplaza el popup nativo de validacion HTML5 por un texto rojo debajo del campo.
document.addEventListener('invalid', (e) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!target || !('validationMessage' in target)) return;
  e.preventDefault();
  const parent = target.parentElement;
  if (!parent) return;
  const existing = target.nextElementSibling;
  if (existing && existing.classList.contains('native-invalid-msg')) existing.remove();
  const msg = document.createElement('div');
  msg.className = 'native-invalid-msg';
  msg.textContent = target.validationMessage;
  msg.setAttribute('style', 'color:#dc2626;font-size:12px;margin-top:4px;');
  target.insertAdjacentElement('afterend', msg);
  const cleanup = () => {
    msg.remove();
    target.removeEventListener('input', cleanup);
    target.removeEventListener('change', cleanup);
  };
  target.addEventListener('input', cleanup);
  target.addEventListener('change', cleanup);
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
