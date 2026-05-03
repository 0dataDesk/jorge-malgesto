/* ============================================================
   shared.js — Utilidades comunes jorge-malgesto
   ============================================================ */

/**
 * Formatea segundos a mm:ss
 */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Genera un UUID v4 simple
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Convierte texto con *palabra* a <em class="accent-text">palabra</em>
 */
function parseAccentText(text) {
  return text.replace(/\*(.*?)\*/g, '<em class="accent-text">$1</em>');
}

/**
 * Formatea timestamp relativo (hace X tiempo)
 */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  const week = Math.floor(day / 7);

  if (min < 2)   return 'ahora mismo';
  if (min < 60)  return `hace ${min} minutos`;
  if (hr < 24)   return `hace ${hr} hora${hr > 1 ? 's' : ''}`;
  if (day < 7)   return `hace ${day} día${day > 1 ? 's' : ''}`;
  if (week < 5)  return `hace ${week} semana${week > 1 ? 's' : ''}`;
  return new Date(timestamp).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
}

/**
 * Detecta si el dispositivo es táctil
 */
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/**
 * Clamp numérico
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export { formatTime, generateId, parseAccentText, timeAgo, isTouch, clamp };
