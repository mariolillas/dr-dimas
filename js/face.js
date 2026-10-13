// Mapa facial (ilustración propia generada en Flow, NO la imagen de Allergan). viewBox 0 0 400 500.
// Vista frontal: lo que queda a la IZQUIERDA del espectador es el lado DERECHO del paciente (convención clínica).
// Perfil "left": la nariz apunta a la izquierda del espectador = se ve el lado izquierdo del paciente.
// Perfil "right": el mismo dibujo en espejo.

export const VB = { w: 400, h: 500 };

// Ilustración (Flow, 2026-10-13, a partir de una referencia de Magnific): frente y perfil izquierdo.
// Se recortaron a 800x1000 (= viewBox x2) con la cabeza a la misma escala. El perfil derecho es el izquierdo en espejo.
const ART = { front: 'icons/face-front.jpg', profile: 'icons/face-profile.jpg' };

export function viewSVG(view) {
  const href = view === 'front' ? ART.front : ART.profile;
  const flip = view === 'right' ? 'transform="translate(400,0) scale(-1,1)"' : '';
  return `<g class="face-art" ${flip}><image href="${href}" x="0" y="0" width="400" height="500" preserveAspectRatio="none"/></g>`;
}

// Zonas por servicio y vista: [key, x, y, r]. Nombres en ZONE_NAMES.
const Z = {
  front: {
    tox: [
      ['forehead', 200, 110, 55], ['glabella', 200, 180, 26],
      ['crowsR', 92, 215, 22], ['crowsL', 308, 215, 22],
      ['bunnyR', 183, 232, 13], ['bunnyL', 217, 232, 13],
      ['lipFlip', 200, 297, 22], ['daoR', 155, 338, 16], ['daoL', 245, 338, 16],
      ['mentalis', 200, 368, 20], ['masseterR', 102, 300, 26], ['masseterL', 298, 300, 26],
      ['platysma', 200, 440, 50],
    ],
    filler: [
      ['templeR', 78, 165, 18], ['templeL', 322, 165, 18],
      ['tearR', 140, 232, 16], ['tearL', 260, 232, 16],
      ['cheekR', 115, 262, 26], ['cheekL', 285, 262, 26],
      ['nlfR', 165, 285, 16], ['nlfL', 235, 285, 16],
      ['lips', 200, 313, 26], ['marionetteR', 150, 345, 16], ['marionetteL', 250, 345, 16],
      ['chin', 200, 375, 20], ['jawR', 118, 345, 24], ['jawL', 282, 345, 24],
    ],
  },
  // Perfil izquierdo (nariz hacia la izquierda). El derecho se calcula en espejo.
  profile: {
    tox: [
      ['forehead', 115, 125, 45], ['glabella', 70, 190, 15], ['crows', 170, 222, 22],
      ['lipFlip', 63, 311, 16], ['mentalis', 72, 369, 20], ['masseter', 208, 328, 34],
      ['platysma', 175, 445, 40],
    ],
    filler: [
      ['temple', 190, 175, 26], ['tear', 111, 247, 18], ['cheek', 144, 270, 30],
      ['nlf', 84, 290, 16], ['lips', 55, 324, 16], ['marionette', 86, 355, 16],
      ['chin', 72, 380, 20], ['jaw', 184, 355, 32],
    ],
  },
};

export const ZONE_NAMES = {
  forehead: ['Forehead', 'Frente'], glabella: ['Glabella', 'Entrecejo'],
  crows: ["Crow's feet", 'Patas de gallo'], bunny: ['Bunny lines', 'Líneas de conejo'],
  lipFlip: ['Lip flip', 'Lip flip'], dao: ['DAO', 'DAO (comisuras)'], mentalis: ['Chin (mentalis)', 'Mentón (mentalis)'],
  masseter: ['Masseter', 'Masetero'], platysma: ['Neck (platysma)', 'Cuello (platisma)'],
  temple: ['Temple', 'Sien'], tear: ['Tear trough', 'Ojera'], cheek: ['Cheek', 'Pómulo'],
  nlf: ['Nasolabial fold', 'Surco nasogeniano'], lips: ['Lips', 'Labios'], marionette: ['Marionette', 'Marioneta'],
  chin: ['Chin', 'Mentón'], jaw: ['Jawline', 'Mandíbula'], other: ['Other', 'Otra zona'],
};

const SERVICE_ZONES = { tox: 'tox', filler: 'filler', sculptra: 'filler' };

export function zonesFor(view, service) {
  const set = SERVICE_ZONES[service] || 'tox';
  if (view === 'front') return Z.front[set].map(([k, x, y, r]) => ({ k, x, y, r }));
  const side = view === 'left' ? 'L' : 'R';
  return Z.profile[set].map(([k, x, y, r]) => ({
    k: k + side, x: view === 'right' ? 400 - x : x, y, r,
  }));
}

// Zona más cercana al punto tocado (en unidades del viewBox).
export function zoneAt(view, service, x, y) {
  let best = null, bd = Infinity;
  for (const z of zonesFor(view, service)) {
    const d = Math.hypot(z.x - x, z.y - y) / z.r;
    if (d < bd) { bd = d; best = z; }
  }
  if (!best || bd > 2.4) {
    if (view === 'front') return 'other';
    return 'other' + (view === 'left' ? 'L' : 'R');
  }
  return best.k;
}

// Nombre legible: "Crow's feet (R)".
export function zoneLabel(key, lang = 'en') {
  const m = /^(.*?)([LR])$/.exec(key);
  const base = m && ZONE_NAMES[m[1]] ? m[1] : key;
  const side = m && ZONE_NAMES[m[1]] ? m[2] : '';
  const nm = (ZONE_NAMES[base] || [key, key])[lang === 'es' ? 1 : 0];
  if (!side) return nm;
  return `${nm} (${lang === 'es' ? (side === 'L' ? 'izq' : 'der') : side})`;
}
