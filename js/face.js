// Mapa facial propio (line-art SVG, NO la imagen de Allergan). viewBox 0 0 400 500.
// Vista frontal: lo que queda a la IZQUIERDA del espectador es el lado DERECHO del paciente (convención clínica).
// Perfil "left": la nariz apunta a la izquierda del espectador = se ve el lado izquierdo del paciente.
// Perfil "right": el mismo dibujo en espejo.

export const VB = { w: 400, h: 500 };

const FRONT = `
  <path class="skin" d="M200,40 C120,40 78,105 80,190 C82,250 92,300 110,345 C130,395 165,440 200,445 C235,440 270,395 290,345 C308,300 318,250 320,190 C322,105 280,40 200,40 Z"/>
  <path class="soft" d="M108,150 C128,96 168,80 200,82 C232,80 272,96 292,150"/>
  <path d="M80,200 C68,198 63,222 69,245 C73,258 81,263 86,258"/>
  <path d="M320,200 C332,198 337,222 331,245 C327,258 319,263 314,258"/>
  <path d="M128,190 C145,178 170,176 188,184"/>
  <path d="M212,184 C230,176 255,178 272,190"/>
  <path d="M135,216 C148,205 172,205 185,216 C172,225 148,225 135,216 Z"/>
  <path d="M215,216 C228,205 252,205 265,216 C252,225 228,225 215,216 Z"/>
  <circle class="iris" cx="160" cy="215.5" r="6"/><circle class="iris" cx="240" cy="215.5" r="6"/>
  <path d="M194,206 C192,236 186,262 180,284"/>
  <path d="M178,288 C186,298 194,300 200,297 C206,300 214,298 222,288"/>
  <path class="lip" d="M162,343 C175,334 190,331 200,336 C210,331 225,334 238,343 C222,349 210,351 200,349 C190,351 178,349 162,343 Z"/>
  <path class="lip" d="M162,343 C178,368 222,368 238,343"/>
  <path d="M150,428 C152,450 152,472 150,498"/><path d="M250,428 C248,450 248,472 250,498"/>`;

const PROFILE = `
  <path class="skin" d="M268,46 C205,36 150,62 132,118 C124,142 124,168 130,190 C128,196 126,202 128,208 C120,228 108,248 98,266 C96,272 100,278 108,280 C114,281 118,284 118,290 C112,296 108,302 110,308 C112,314 118,316 118,318 C110,322 108,330 114,338 C118,344 120,350 118,356 C112,372 116,392 132,400 C160,412 200,414 228,404 C250,396 262,380 266,360 C268,330 290,320 300,340 C330,300 352,250 356,190 C362,115 330,56 268,46 Z"/>
  <path class="soft" d="M150,88 C175,66 215,58 250,62"/>
  <path d="M252,200 C238,196 230,214 233,238 C236,260 250,266 260,254 C268,238 266,206 252,200 Z"/>
  <path d="M244,214 C240,224 241,236 247,244"/>
  <path d="M140,214 C150,208 162,210 168,216 C160,220 150,220 140,214 Z"/>
  <path d="M132,197 C148,189 166,189 180,195"/>
  <path d="M266,360 C268,320 264,292 258,266"/>
  <path d="M150,405 C158,430 162,455 160,498"/><path d="M300,340 C296,380 296,440 300,498"/>
  <path class="lip" d="M112,318 L124,318"/>`;

export function viewSVG(view) {
  const body = view === 'front' ? FRONT : PROFILE;
  const flip = view === 'right' ? `transform="translate(400,0) scale(-1,1)"` : '';
  return `<g class="face-art" ${flip}>${body}</g>`;
}

// Zonas por servicio y vista: [key, x, y, r]. Nombres en ZONE_NAMES.
const Z = {
  front: {
    tox: [
      ['forehead', 200, 135, 62], ['glabella', 200, 194, 22],
      ['crowsR', 112, 220, 28], ['crowsL', 288, 220, 28],
      ['bunnyR', 180, 250, 16], ['bunnyL', 220, 250, 16],
      ['lipFlip', 200, 334, 30], ['daoR', 165, 384, 20], ['daoL', 235, 384, 20],
      ['mentalis', 200, 418, 22], ['masseterR', 104, 318, 30], ['masseterL', 296, 318, 30],
      ['platysma', 200, 472, 46],
    ],
    filler: [
      ['templeR', 94, 168, 24], ['templeL', 306, 168, 24],
      ['tearR', 160, 238, 18], ['tearL', 240, 238, 18],
      ['cheekR', 128, 270, 30], ['cheekL', 272, 270, 30],
      ['nlfR', 172, 308, 20], ['nlfL', 228, 308, 20],
      ['lips', 200, 344, 30], ['marionetteR', 166, 380, 18], ['marionetteL', 234, 380, 18],
      ['chin', 200, 420, 24], ['jawR', 118, 378, 30], ['jawL', 282, 378, 30],
    ],
  },
  profile: {
    tox: [
      ['forehead', 150, 120, 40], ['glabella', 132, 196, 16], ['crows', 192, 218, 24],
      ['lipFlip', 116, 312, 14], ['mentalis', 128, 386, 18], ['masseter', 232, 318, 34],
      ['platysma', 225, 462, 50],
    ],
    filler: [
      ['temple', 212, 165, 26], ['tear', 165, 238, 16], ['cheek', 188, 268, 30],
      ['nlf', 138, 300, 16], ['lips', 114, 322, 14], ['marionette', 146, 360, 16],
      ['chin', 128, 392, 18], ['jaw', 222, 386, 32],
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
  // Puntos de frente en zonas centrales tienen nombre sin lado.
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
