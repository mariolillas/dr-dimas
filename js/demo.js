// Pacientes de PRUEBA (ficticios, teléfonos 555). Se marcan demo:true y se borran desde Ajustes.
import * as S from './store.js';
import { zoneAt } from './face.js';
import { todayISO, addDays, uid } from './util.js';

const T = todayISO();
const pts = (view, type, list) => list.map(([x, y, amount]) => ({ id: uid('p'), view, x, y, amount, zone: zoneAt(view, type, x, y) }));

const TOX_STD = [
  [160, 105, 4], [185, 100, 4], [215, 100, 4], [240, 105, 4],
  [200, 182, 4], [186, 178, 4], [214, 178, 4], [176, 172, 4], [224, 172, 4],
  [90, 205, 4], [86, 218, 4], [90, 231, 4], [310, 205, 4], [314, 218, 4], [310, 231, 4],
];
const LIPS = [[184, 307, 0.2], [200, 304, 0.2], [216, 307, 0.2], [190, 320, 0.2], [210, 320, 0.2]];
const SCULPTRA = [[115, 262, 1], [285, 262, 1], [78, 165, 1], [322, 165, 1]];

function session(pid, type, daysAgo, extra = {}) {
  const base = {
    id: uid('s'), pid, type, date: addDays(T, -daysAgo), demo: true,
    injector: daysAgo % 2 ? 'Jackie Escamilla, NP' : 'Dr. Vanessa Dimas, MD',
    products: [{ name: type === 'tox' ? 'Dysport' : type === 'sculptra' ? 'Sculptra' : 'Restylane Kysse',
      lot: 'DEMO' + String(1000 + daysAgo), exp: '2027-06', dilution: type === 'tox' ? '2.5' : '', qty: type === 'sculptra' ? 2 : 1, sticker: null }],
    pricing: type === 'tox' ? 'dysport' : type,
    points: type === 'tox' ? pts('front', 'tox', TOX_STD) : type === 'filler' ? pts('front', 'filler', LIPS) : pts('front', 'sculptra', SCULPTRA),
    photos: [], notes: '', fu: {},
    pay: { promo: '', discount: 0, override: '', method: 'card', paid: true },
    series: type === 'sculptra' ? { n: 1, of: 3 } : null,
  };
  return { ...base, ...extra };
}

export async function seedDemo() {
  const P = [
    { name: 'Ana Morales', dob: '1988-03-12', cell: '(361) 555-0142', email: 'ana.demo@example.com',
      intake: { allergies: { yn: 'yes', detail: 'lidocaine' }, anaphylaxis: { yn: 'no' }, aspirin: 'no', herpes: 'no' },
      sessions: [['tox', 110], ['tox', 220]], appt: ['09:30', 'tox'] },
    { name: 'Lucía Garza', dob: '1991-04-12', cell: '(361) 555-0184', email: 'lucia.demo@example.com',
      intake: { allergies: { yn: 'no' }, anaphylaxis: { yn: 'no' }, aspirin: 'yes', vitE: 'yes', herpes: 'yes', currentMeds: 'Aspirin 81 mg daily' },
      sessions: [['filler', 15], ['tox', 60]], appt: ['10:15', 'filler'] },
    { name: 'Sofía Treviño', dob: '1979-09-03', cell: '(361) 555-0117',
      intake: { allergies: { yn: 'no' }, anaphylaxis: { yn: 'no' } },
      sessions: [['sculptra', 45]], appt: ['11:00', 'sculptra'] },
    { name: 'Daniela Ríos', dob: '1995-01-22', cell: '(361) 555-0190',
      intake: { allergies: { yn: 'no' }, anaphylaxis: { yn: 'no' } },
      sessions: [['tox', 14]], appt: ['13:30', 'check'] },
    { name: 'Carmen Villarreal', dob: '1984-06-30', cell: '(361) 555-0163', email: 'carmen.demo@example.com',
      intake: { allergies: { yn: 'no' }, anaphylaxis: { yn: 'no' } },
      sessions: [['tox', 100]] },
  ];
  for (const x of P) {
    const p = await S.save('patient', { name: x.name, dob: x.dob, cell: x.cell, phone: '', email: x.email || '', address: 'Corpus Christi, TX',
      referredBy: '', intake: x.intake, status: 'active', demo: true });
    for (const [type, d] of x.sessions) await S.save('session', session(p.id, type, d));
    if (x.appt) await S.save('appt', { id: uid('a'), pid: p.id, name: p.name, date: T, time: x.appt[0], service: x.appt[1], note: '', demo: true });
  }
  await S.save('patient', { name: 'Patricia Salinas', dob: '', cell: '', phone: '', email: '', address: '', referredBy: '',
    intake: {}, status: 'paper', paperPhotos: [], demo: true });
  await S.save('appt', { id: uid('a'), pid: '', name: 'Mariana Cantú', date: T, time: '15:00', service: 'consult', note: 'New patient', demo: true });
}
