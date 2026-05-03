/* ============================================================
   pitch-detection.js — Algoritmo YIN para detección de tono
   Basado en: de Cheveigné & Kawahara (2002)
   ============================================================ */

/**
 * Detecta la frecuencia fundamental de un buffer de audio.
 * @param {Float32Array} buffer - Datos de dominio temporal
 * @param {number} sampleRate - Frecuencia de muestreo (ej. 44100)
 * @param {number} [threshold=0.12] - Umbral de confianza YIN
 * @returns {number} Frecuencia en Hz, o -1 si no detecta
 */
function detectPitchYIN(buffer, sampleRate, threshold = 0.12) {
  const bufferSize = buffer.length;
  const halfBuffer = Math.floor(bufferSize / 2);

  // Rango de búsqueda: 30 Hz a 1200 Hz (cubre bajo 4 cuerdas con margen)
  const tauMin = Math.floor(sampleRate / 1200);
  const tauMax = Math.floor(sampleRate / 30);

  const yinBuffer = new Float32Array(halfBuffer);

  // Paso 1: Función de diferencia
  yinBuffer[0] = 1.0;
  let runningSum = 0;

  for (let tau = 1; tau < halfBuffer; tau++) {
    let delta = 0;
    for (let j = 0; j < halfBuffer; j++) {
      const diff = buffer[j] - buffer[j + tau];
      delta += diff * diff;
    }
    yinBuffer[tau] = delta;

    // Paso 2: Media acumulada normalizada
    runningSum += yinBuffer[tau];
    if (runningSum === 0) {
      yinBuffer[tau] = 1;
    } else {
      yinBuffer[tau] *= tau / runningSum;
    }
  }

  // Paso 3: Buscar primer mínimo bajo el threshold
  let tau = tauMin;
  while (tau < tauMax) {
    if (yinBuffer[tau] < threshold) {
      // Buscar el mínimo real en esta zona
      while (tau + 1 < tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      // Paso 4: Interpolación parabólica para mayor precisión
      const betterTau = parabolicInterpolation(yinBuffer, tau);
      return sampleRate / betterTau;
    }
    tau++;
  }

  return -1; // No detectado
}

/**
 * Refina el tau con interpolación parabólica.
 */
function parabolicInterpolation(array, tau) {
  const x0 = tau < 1 ? tau : tau - 1;
  const x2 = tau + 1 < array.length ? tau + 1 : tau;

  if (x0 === tau) return x2 === tau ? tau : (array[tau] <= array[x2] ? tau : x2);
  if (x2 === tau) return array[tau] <= array[x0] ? tau : x0;

  const s0 = array[x0];
  const s1 = array[tau];
  const s2 = array[x2];

  return tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
}

/**
 * Notas cromáticas (A4 = 440 Hz)
 */
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

/**
 * Convierte frecuencia a nombre de nota, octava y cents de desviación.
 * @param {number} freq - Frecuencia en Hz
 * @returns {{ noteName: string, octave: number, cents: number, freq: number, midi: number }}
 */
function freqToNote(freq) {
  const semitones = 12 * Math.log2(freq / A4_FREQ);
  const midi      = Math.round(A4_MIDI + semitones);
  const cents     = Math.round((semitones - (midi - A4_MIDI)) * 100);
  const noteName  = NOTES[((midi % 12) + 12) % 12];
  const octave    = Math.floor(midi / 12) - 1;
  return { noteName, octave, cents, freq, midi };
}

/**
 * Cuerdas estándar de bajo 4 cuerdas (en Hz)
 */
const BASS_STRINGS_STANDARD = [
  { name: 'E', octave: 1, freq: 41.20 },
  { name: 'A', octave: 1, freq: 55.00 },
  { name: 'D', octave: 2, freq: 73.42 },
  { name: 'G', octave: 2, freq: 98.00 },
];

const BASS_STRINGS_DROP_D = [
  { name: 'D', octave: 1, freq: 36.71 },
  { name: 'A', octave: 1, freq: 55.00 },
  { name: 'D', octave: 2, freq: 73.42 },
  { name: 'G', octave: 2, freq: 98.00 },
];

/**
 * Devuelve la cuerda más cercana a la frecuencia dada.
 * @param {number} freq
 * @param {boolean} dropD
 * @returns {{ name: string, octave: number, freq: number }}
 */
function nearestString(freq, dropD = false) {
  const strings = dropD ? BASS_STRINGS_DROP_D : BASS_STRINGS_STANDARD;
  return strings.reduce((closest, str) => {
    return Math.abs(str.freq - freq) < Math.abs(closest.freq - freq) ? str : closest;
  }, strings[0]);
}

export { detectPitchYIN, freqToNote, nearestString, BASS_STRINGS_STANDARD, BASS_STRINGS_DROP_D };
