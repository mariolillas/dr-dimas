// Textos de las formas de la clínica. Fuente: formas en papel de Vanessa (oct 2026).
// Solo se corrigieron typos y "Botox" → Dysport. TODO texto legal queda "pendiente de aprobación"
// hasta que la Dra. Dimas lo apruebe en Ajustes → Textos legales.

export const LEGAL_VERSION = '2026-10-13-draft1';

const INTRO = 'The purpose of this informed consent form is to provide written information regarding the risks, benefits and alternatives of the procedure named above. This material serves as a supplement to the discussion you have with your doctor/healthcare provider. It is important that you fully understand this information, so please read this document thoroughly. If you have any questions regarding the procedure, ask your doctor/healthcare professional prior to signing the consent form.';

const PROVIDER_ATTEST = 'I am the treating doctor/healthcare professional. I discussed the above risks, benefits, and alternatives with the patient. The patient had an opportunity to have all questions answered and was offered a copy of this informed consent. The patient has been told to contact my office should they have any questions or concerns after this treatment procedure.';

const RISKS_PREFACE = 'Before undergoing this procedure, understanding the risks is essential. No procedure is completely risk-free. The following risks may occur, but there may be unforeseen risks and risks that are not included on this list. Some of these risks, if they occur, may necessitate hospitalization, and/or extended outpatient therapy to permit adequate treatment. It has been explained to me that there are certain inherent and potential risks and side effects in any invasive procedure and in this specific instance such risks include but are not limited to: ';

// Sección nueva (NO venía en sus formas): autorización de fotos. Requiere aprobación.
export const PHOTO_RELEASE = {
  title: 'PHOTO AUTHORIZATION',
  isNew: true,
  text: 'I authorize Dr. Dimas Beauty Services to take clinical photographs of the treated areas for my medical record. Regarding any use of my photographs outside my medical record (for example, educational or social media posts), I choose the option below. I may change this choice at any time by notifying the office in writing.',
  options: [
    { v: 'social', en: 'You may use my photos, including my face', es: 'Pueden usar mis fotos, incluyendo mi cara' },
    { v: 'noface', en: 'Only without my face or identifying features', es: 'Solo sin mi cara ni rasgos que me identifiquen' },
    { v: 'clinical', en: 'Medical record only — do not use my photos', es: 'Solo para mi expediente — no usar mis fotos' },
  ],
};

export const CONSENTS = {
  tox: {
    title: 'Neurotoxin (Dysport) Informed Consent',
    titleEs: 'Consentimiento informado — Neurotoxina (Dysport)',
    intro: INTRO,
    sections: [
      { title: 'THE TREATMENT', initial: true, text: 'Botulinum toxin is a neurotoxin produced by the bacterium Clostridium A. Botulinum toxin can relax the muscles on areas of the face and neck which cause wrinkles associated with facial expressions or facial pain. Treatment with botulinum toxin can cause your facial expression lines or wrinkles to be less noticeable or essentially disappear. Areas most frequently treated are: a) glabellar area of frown lines, located between the eyes; b) crow\'s feet (lateral areas of the eyes); c) forehead wrinkles; d) radial lip lines (smokers lines); e) head and neck muscles. Dysport is diluted to a very controlled solution and when injected into the muscles with a very thin needle, it is almost painless. Patients may feel a slight burning sensation while the solution is being injected. The procedure takes about 15-20 minutes and the results can last up to 3 months. With repeated treatments, the results may tend to last longer.' },
      { title: 'RISKS AND COMPLICATIONS', initial: true, text: RISKS_PREFACE + '1. Post treatment discomfort, swelling, redness, and bruising; 2. Double vision; 3. A weakened tear duct; 4. Post treatment bacterial, and/or fungal infection requiring further treatment; 5. Allergic reaction; 6. Minor temporary droop of eyelid(s) in approximately 2% of injections, this usually lasts 2-3 weeks; 7. Occasional numbness of the forehead lasting up to 2-3 weeks; 8. Transient headache; and 9. Flu-like symptoms may occur.' },
      { title: 'PREGNANCY, ALLERGIES & NEUROLOGIC DISEASE', initial: true, text: 'I am not aware that I am pregnant and I am not trying to get pregnant, I am not lactating (nursing). I do not have any significant neurologic disease including but not limited to myasthenia gravis, multiple sclerosis, Lambert-Eaton syndrome, amyotrophic lateral sclerosis (ALS), and Parkinson\'s. I do not have any allergies to the toxin ingredients, or to human albumin.' },
      { title: 'ALTERNATIVE PROCEDURES', initial: true, text: 'Alternatives to the procedures and options that I have volunteered for have been fully explained to me.' },
      { title: 'PAYMENT', initial: true, text: 'I understand that this is an "elective" procedure and that payment is my responsibility and is expected at the time of treatment.' },
      { title: 'RIGHT TO DISCONTINUE TREATMENT', initial: true, text: 'I understand that I have the right to discontinue treatment at any time.' },
      { title: 'RESULTS', initial: true, text: 'I am aware that when small amounts of purified botulinum toxin are injected into a muscle it causes weakness or paralysis of that muscle. This appears in 2–10 days and usually lasts up to 3 months but can be shorter or longer. In a very small number of individuals, the injection does not work as satisfactorily or for as long as usual and there are some individuals who do not respond at all. I understand that I will not be able to use the muscles injected as before while the injection is effective but that this will reverse after a period of months at which time re-treatment is appropriate. I understand that I must stay in the erect posture and that I must not manipulate the area(s) of the injections for the 2 hours post-injection period.' },
    ],
    statement: 'I understand this is an elective procedure and I hereby voluntarily consent to treatment with botulinum toxin injections for facial dynamic wrinkles, TMJ dysfunction, bruxism and types of orofacial pain including headaches and migraines. The procedure has been fully explained to me. I also understand that any treatment performed is between me and the doctor/healthcare provider who is treating me and I will direct all post-operative questions or concerns to the treating clinician. I have read the above and understand it. My questions have been answered satisfactorily. I accept the risks and complications of the procedure and I understand that no guarantees are implied as to the outcome of the procedure. I also certify that if I have any changes in my medical history I will notify the doctor/healthcare professional who treated me immediately. I also state that I read and write in English.',
    provider: PROVIDER_ATTEST,
  },
  filler: {
    title: 'Dermal Filler Informed Consent',
    titleEs: 'Consentimiento informado — Relleno dérmico',
    intro: INTRO,
    sections: [
      { title: 'THE TREATMENT', initial: true, text: 'Treatment with dermal fillers (such as Juvederm, Restylane, Radiesse and others) can smooth out facial folds and wrinkles, add volume to the lips, and contour facial features that have lost their volume and fullness due to aging, sun exposure, illness, etc. Facial rejuvenation can be carried out with minimal complications. These dermal fillers are injected under the skin with a very fine needle. This produces natural appearing volume under wrinkles and folds which are lifted up and smoothed out. The results can often be seen immediately.' },
      { title: 'RISKS AND COMPLICATIONS', initial: true, text: RISKS_PREFACE + '1) Post treatment discomfort, swelling, redness, bruising, and discoloration; 2) Post treatment infection associated with any transcutaneous injection; 3) Allergic reaction; 4) Reactivation of herpes (cold sores); 5) Lumpiness, visible yellow or white patches; 6) Granuloma formation; 7) Localized necrosis and/or sloughing, with scab and/or without scab if blood vessel occlusion occurs.' },
      { title: 'PREGNANCY AND ALLERGIES', initial: false, text: 'I am not aware that I am pregnant. I am not trying to get pregnant. I am not lactating (nursing). I do not have or have not had any major illnesses which would prohibit me from receiving dermal fillers. I certify that I do not have multiple allergies or high sensitivity to medications, including but not limited to lidocaine.' },
      { title: 'ALTERNATIVE PROCEDURES', initial: true, text: 'Alternatives to the procedures and options that I have volunteered for have been fully explained to me.' },
      { title: 'PAYMENT', initial: true, text: 'I understand that this is an "elective" procedure and that payment is my responsibility and is expected at the time of treatment.' },
      { title: 'RIGHT TO DISCONTINUE TREATMENT', initial: true, text: 'I understand that I have the right to discontinue treatment at any time.' },
      { title: 'RESULTS', initial: true, text: 'Dermal fillers have been shown to be safe and effective when compared to collagen skin implants and related products to fill in wrinkles, lines and folds in the skin on the face. Its effect can last up to 6 months. Most patients are pleased with the results of dermal fillers use. However, like any esthetic procedure, there is no guarantee that you will be completely satisfied. There is no guarantee that wrinkles and folds will disappear completely, or that you will not require additional treatment to achieve the results you seek. The dermal filler procedure is temporary and additional treatments will be required periodically, generally within 4-6 months, involving additional injections for the effect to continue. I am aware that follow-up treatments will be needed to maintain the full effects. I am aware the duration of treatment is dependent on many factors including but not limited to: age, sex, tissue conditions, my general health and life style conditions, and sun exposure. The correction, depending on these factors, may last up to 6 months and in some cases shorter and some cases longer. I have been instructed in and understand the post-treatment instructions.' },
    ],
    statement: 'I understand this is an elective procedure and I hereby voluntarily consent to treatment with dermal fillers for facial rejuvenation, lip enhancement, establish proper lip and smile lines, and replacing facial volume. The procedure has been fully explained to me. I also understand that any treatment performed is between me and the doctor/healthcare provider who is treating me and I will direct all post-operative questions or concerns to the treating clinician. I have read the above and understand it. My questions have been answered satisfactorily. I accept the risks and complications of the procedure and I understand that no guarantees are implied as to the outcome of the procedure. I also certify that if I have any changes in my medical history I will notify the doctor/healthcare professional who treated me immediately. I also state that I read and write in English.',
    provider: PROVIDER_ATTEST,
  },
  sculptra: null, // [DATO PENDIENTE] Vanessa no ha mandado consentimiento de Sculptra
};

export const INSTRUCTIONS = {
  tox: {
    title: 'Dysport — Post Treatment Instructions',
    text: [
      'Try to exercise your treated muscles for 1-2 hours after treatment (e.g. practice frowning, raising your eyebrows or squinting). This helps to work the Dysport into your muscles. Although this is thought to help, it will NOT impact your treatment negatively if you forget to do this.',
      'Do NOT rub or massage the treated areas for 4 hours after your treatment. Do NOT do Yoga or any type of strenuous exercise for 4 hours after treatment. Also avoid facials or saunas for 4 hours after your treatment. This will minimize the risk of raising your blood pressure and therefore minimize the risk of temporary bruising. Feel free to shower and go about most other regular daily activities.',
      'Do NOT lie down for 4 hours after treatment. This is to avoid the risk of pressure on the treated areas (from your pillow) and to avoid the risk of having the area rubbed accidentally.',
      'Be assured that any tiny bumps or marks will go away within a few hours. If you need to apply make-up within 4 hours after your treatment, only use a GENTLE touch to avoid rubbing the treated area.',
      'Results of your treatment may take up to 14 days to take full effect. Please wait until the 14 days has passed before assessing if you are pleased with the result.',
      'Dysport is a temporary procedure and at first, you may find that your treatment results will last approximately 3 or 4 months. If you maintain your treatment appointments with the frequency recommended by your doctor the duration of each treatment result may last longer than 4 months.',
    ],
  },
  filler: {
    title: 'Pre/Post Dermal Fillers Treatment Instructions',
    text: [
      'Dermal fillers are popular injectable gels that are a safe and fast way to bring back the volume and fullness that your face has lost. These fillers restore the skin by rebuilding natural collagen that breaks down over time.',
      'PRE-TREATMENT: It is best to plan your injections at least 2 weeks before a big event. Like most treatments that involve an injectable it is best not to take any anti-inflammatory that may cause the blood to thin such as aspirin, Tylenol, Advil, Motrin, or Vitamin E as this could cause bruising. Avoid alcohol after treatment since it is a blood thinner. Also, decrease salt intake. Inform your physician if you have any egg allergies or open facial sores.',
      'DAY OF TREATMENT: A topical numbing cream will be offered to you to reduce the discomfort of the injections. When you come to your appointment, we will discuss with you the options for numbing. After injection of the dermal filler, it is very important that you do not move the treated areas for 2-3 hours. This helps the filler "settle" and may reduce swelling. We will apply ice to the treatment areas. The area may remain slightly swollen or red through the day. If you have a propensity for bruising, we strongly recommend Arnica Montana. It should be taken immediately after the treatment and continue as directed on the bottle. You should sleep with your head slightly elevated above your heart to help reduce swelling.',
      'DAY TWO: The treated areas will increase in swelling for 24 hours. When you wake up the day after treatment, the amount of swelling may come as a bit of a shock. But rest assured that over the next 48-72 hours, the swelling will reduce. We encourage icing the treated areas for 15 minutes every hour or so to help with the swelling. Continue taking Arnica Montana as instructed on the bottle.',
      'OVER THE NEXT WEEK: Redness and swelling in the treated area will continue to decrease. By 1 week, 90% of the swelling will have resolved. Infection is very rare but contact the office at 361-694-4444 if you find areas with persistent, severe redness, pain, blistering, or white bumps.',
    ],
  },
  sculptra: null,
};

// Lo que hay que revisar con Vanessa antes de usar los textos con pacientes reales.
export const LEGAL_REVIEW = {
  changed: [
    'Title "Botox consent form" → "Neurotoxin (Dysport) Informed Consent"; "Botox is diluted…" → "Dysport is diluted…".',
    'Spelling: myasthenis → myasthenia gravis; lambert-eaton → Lambert-Eaton; parkinson\'s → Parkinson\'s.',
    'Broken characters fixed: crow\'s feet, "elective", 2–10 days, re-treatment, area(s).',
    'Filler instructions: "the amount of swelling make come" → "may come".',
    'Patient history: Asprin → Aspirin; Ginko Biloba → Ginkgo biloba.',
    'NEW section written by us: Photo authorization (3 options) — added at the end of each consent.',
  ],
  flagged: [
    'Tox consent says "produced by the bacterium Clostridium A" — the organism is Clostridium botulinum.',
    'Tox consent says results last "up to 3 months"; the post-treatment sheet says 3–4 months.',
    'Filler instructions list Tylenol among blood-thinning anti-inflammatories (acetaminophen is neither).',
    'Filler consent says the effect lasts "up to 6 months"; many Restylane products are labeled for longer.',
    'Both consents say "I read and write in English" — Spanish-speaking patients need an approved Spanish version.',
    'Filler instructions phone 361-694-4444 — confirm it is the clinic number.',
    'The Dysport post-treatment sheet came from another practice\'s template (file metadata) — review wording.',
    'No Sculptra consent or instructions were provided yet.',
  ],
};

// ---- Historial del paciente (Patient History) ----
// tipos: text, date, tel, email, area, yn (sí/no), ynd (sí/no + fecha), ynt (sí/no + detalle)
export const INTAKE = [
  { group: 'contact', fields: [
    { k: 'name', t: 'text', req: true }, { k: 'dob', t: 'date', req: true },
    { k: 'phone', t: 'tel' }, { k: 'cell', t: 'tel' }, { k: 'email', t: 'email' },
    { k: 'address', t: 'text' }, { k: 'referredBy', t: 'text' },
  ] },
  { group: 'aesthetic', fields: [
    { k: 'prevTreatment', t: 'ynd' }, { k: 'complications', t: 'ynd' }, { k: 'fillerTypes', t: 'text' },
  ] },
  { group: 'allergies', fields: [
    { k: 'anaphylaxis', t: 'ynd' }, { k: 'allergies', t: 'ynt' },
  ] },
  { group: 'meds', fields: [
    { k: 'currentMeds', t: 'area' },
    { k: 'aspirin', t: 'yn' }, { k: 'antiInflammatories', t: 'yn' }, { k: 'anticoagulants', t: 'yn' },
    { k: 'steroids', t: 'yn' }, { k: 'nsaids', t: 'yn' },
  ] },
  { group: 'supplements', fields: [
    { k: 'ginkgo', t: 'yn' }, { k: 'vitA', t: 'yn' }, { k: 'vitE', t: 'yn' }, { k: 'garlic', t: 'yn' },
    { k: 'flax', t: 'yn' }, { k: 'otherSupplements', t: 'text' },
  ] },
  { group: 'history', fields: [
    { k: 'currentConditions', t: 'area' },
    { k: 'multiAllergies', t: 'yn' }, { k: 'herpes', t: 'yn' }, { k: 'immuno', t: 'yn' },
    { k: 'autoimmune', t: 'yn' }, { k: 'otherHistory', t: 'yn' }, { k: 'comments', t: 'area' },
  ] },
];

// Alertas que se derivan del historial.
export function alertsFor(p) {
  const i = p.intake || {};
  const out = [];
  if (i.allergies?.yn === 'yes') out.push({ c: 'red', k: 'allergy', d: i.allergies.detail });
  if (i.anaphylaxis?.yn === 'yes') out.push({ c: 'red', k: 'anaphylaxis' });
  const thinners = ['aspirin', 'anticoagulants', 'antiInflammatories', 'nsaids', 'ginkgo', 'vitE', 'garlic', 'flax']
    .filter((k) => i[k] === 'yes');
  if (thinners.length) out.push({ c: 'red', k: 'bloodThinner', d: thinners });
  if (i.herpes === 'yes') out.push({ c: 'amber', k: 'herpes' });
  if (i.immuno === 'yes' || i.autoimmune === 'yes') out.push({ c: 'amber', k: 'immune' });
  return out;
}

// ---- Plantillas de mensajes (la Dra. los envía desde su teléfono) ----
export const TEMPLATES = {
  check: {
    en: 'Hi {first}! It\'s Dr. Dimas Beauty Services. It has been two weeks since your {service} — how are you loving your results? Reply here with any questions or a quick photo. 💕',
    es: '¡Hola {first}! Te escribimos de Dr. Dimas Beauty Services. Ya pasaron dos semanas de tu {service}, ¿cómo te sientes con tus resultados? Respóndenos con cualquier duda o una foto. 💕',
  },
  touchup: {
    en: 'Hi {first}! It\'s Dr. Dimas Beauty Services. It has been about {months} months since your {service} — a great time for your touch-up.{booking}',
    es: '¡Hola {first}! Te escribimos de Dr. Dimas Beauty Services. Ya pasaron unos {months} meses desde tu {service}, buen momento para tu retoque.{booking}',
  },
  sculptra: {
    en: 'Hi {first}! It\'s Dr. Dimas Beauty Services. You are due for Sculptra session {next} of {of}.{booking}',
    es: '¡Hola {first}! Te escribimos de Dr. Dimas Beauty Services. Ya te toca tu sesión {next} de {of} de Sculptra.{booking}',
  },
  review: {
    en: 'Hi {first}! It\'s Dr. Dimas Beauty Services. It has been about {months} months since your {service}. Want us to check how it\'s holding up?{booking}',
    es: '¡Hola {first}! Te escribimos de Dr. Dimas Beauty Services. Ya pasaron unos {months} meses desde tu {service}. ¿Quieres que revisemos cómo va?{booking}',
  },
  bookingEn: ' Book anytime here: {url}',
  bookingEs: ' Agenda cuando quieras aquí: {url}',
};

export const FILLER_PRODUCTS = ['Restylane Kysse', 'Restylane Lyft', 'Restylane Defyne', 'Restylane Refyne',
  'Restylane Contour', 'Restylane Silk', 'Restylane-L', 'Juvederm', 'Radiesse', 'RHA'];
