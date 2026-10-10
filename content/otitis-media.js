/* =====================================================================
   FOUNDATION — acute otitis media, adults AND children
   Source: WHO AWaRe antibiotic book (2022), ch. 5, pp. 36-45.
   Status: PROTOTYPE, NOT VALIDATED.
   First flow with a child branch. Team decisions in this file:
     - Age groups: neonate (<28 d) / 28 d to <3 mo / 3 mo to <2 y /
       2 to <18 y / adult (>=18). Anyone under 18 needs a weight.
     - Children's doses come from AWaRe's weight bands (pp. 39, 43-45).
       The band is chosen by the engine from weight_kg; nothing is guessed.
     - The three "no clear consensus" situations of p. 44 (non-severe and
       recurrent, with otorrhoea, or in a neonate) are REFERRED to an
       infectious disease specialist. Applied to adults as well, because
       the AWaRe paragraph does not restrict it to children.
     - "Recurrent" is a prescriber judgement chip, using the p. 44 definition
       (p. 41 says "more than four a year"; the two pages differ).
     - "Severe" = fever >= 39.0 OR "very unwell" OR "pain despite analgesics".
       The last two are prescriber judgement (AWaRe gives no numbers).
     - Immunocompromised and bilateral-under-2 criteria are children-only,
       as written; adults are judged on severity alone.
     - Red flags (suspected complication) are an expert list: AWaRe names
       mastoiditis and brain abscess but no signs.
     - Penicillin allergy: ch. 5 offers no alternative. A visible note
       stands in until an agreed alternative is added.
     - A normal otoscopy is recorded and shown in the trace but does NOT
       stop the flow (open question for the team).
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  const GROUPS = ['neonate', 'lt3m', 'm3_2y', 'y2_18', 'adult'];
  const CHILD = ['neonate', 'lt3m', 'm3_2y', 'y2_18'];
  const UNDER2 = ['neonate', 'lt3m', 'm3_2y'];

  // Shared conditions (used by more than one finding)
  const C_SEVERE = { any: [
    { field: 'temp', op: '>=', value: 39 },
    { field: 'very_unwell', op: '==', value: 'yes' },
    { field: 'pain_despite', op: '==', value: 'yes' },
  ] };
  const C_IMMUNO = { field: 'immuno', op: '==', value: 'yes' };
  const C_BILATERAL = { all: [
    { field: 'age_group', op: 'in', value: UNDER2 },
    { field: 'laterality', op: '==', value: 'both' },
  ] };

  // ---- AWaRe weight bands (min <= kg < max; max null = open-ended) ----
  const AMOX_BANDS = [
    { min: 3, max: 6, dose: '250 mg', freq: 'q12h' },
    { min: 6, max: 10, dose: '375 mg', freq: 'q12h' },
    { min: 10, max: 15, dose: '500 mg', freq: 'q12h' },
    { min: 15, max: 20, dose: '750 mg', freq: 'q12h' },
    { min: 20, max: null, dose: '500 mg', freq: 'q8h (or 1 g q12h)' },
  ];
  const PARACETAMOL_BANDS = [
    { min: 3, max: 6, dose: '60 mg', freq: 'q6h' },
    { min: 6, max: 10, dose: '100 mg', freq: 'q6h' },
    { min: 10, max: 15, dose: '150 mg', freq: 'q6h' },
    { min: 15, max: 20, dose: '200 mg', freq: 'q6h' },
    { min: 20, max: 30, dose: '300 mg', freq: 'q6h' },
    { min: 30, max: null, dose: '500 mg – 1 g', freq: 'q4–6h' },
  ];
  const IBUPROFEN_BANDS = [
    { min: 6, max: 10, dose: '50 mg', freq: 'q8h' },
    { min: 10, max: 15, dose: '100 mg', freq: 'q8h' },
    { min: 15, max: 20, dose: '150 mg', freq: 'q8h' },
    { min: 20, max: 30, dose: '200 mg', freq: 'q8h' },
    { min: 30, max: null, dose: '200–400 mg', freq: 'q6–8h' },
  ];

  const ANALGESIA_ADULT = {
    title: 'کنترل درد و تب',
    items: [
      { rx: 'Ibuprofen 200–400 mg PO q6–8h', t: 'حداکثر ۲.۴ گرم در روز.', src: { page: '37, 43', type: 'guideline' } },
      { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد یا سیروز حداکثر ۲ گرم.', src: { page: '37, 43', type: 'guideline' } },
    ],
  };
  const ANALGESIA_CHILD = {
    title: 'کنترل درد و تب (دوز بر اساس وزن)',
    items: [
      { rx: 'Paracetamol PO', bands: PARACETAMOL_BANDS,
        t: '۱۰ تا ۱۵ mg/kg هر ۶ ساعت. حداکثر ۴ گرم در روز (۲ گرم در نارسایی کبد).',
        src: { page: '39, 43', type: 'guideline' } },
      { rx: 'Ibuprofen PO', bands: IBUPROFEN_BANDS, notForAge: ['neonate', 'lt3m'],
        t: '۵ تا ۱۰ mg/kg هر ۶ تا ۸ ساعت. در کودک زیر ۳ ماه نباید استفاده شود. حداکثر ۲.۴ گرم در روز.',
        src: { page: '39, 43', type: 'guideline' } },
    ],
  };

  const ALLERGY = {
    t: '⚠ پیش از تجویز درباره آلرژی به پنی‌سیلین‌ها بپرسید. فصل ۵ AWaRe جایگزین غیرپنی‌سیلینی برای این بیماری ندارد. در صورت آلرژی، داروی جایگزین را از فصل ۳ (حساسیت به آنتی‌بیوتیک‌ها، صفحه ۲۰) یا از متخصص عفونی بگیرید.',
    src: { page: '20', type: 'expert', note: 'Stand-in note until an agreed alternative is added; ch. 5 gives none' },
  };
  const RESISTANCE = {
    t: 'اگر در ۳ ماه گذشته آموکسی‌سیلین مصرف شده یا اوتیت مکرر دارد، احتمال مقاومت پنوموکوک بیشتر است؛ با این حال آموکسی‌سیلین با دوز بالا همچنان داروی انتخابی است.',
    src: { page: '41', type: 'guideline' },
  };
  const ADVERSE = {
    src: { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' },
    items: [
      { name: 'Amoxicillin', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile، سندرم استیونس-جانسون' },
      { name: 'Amoxicillin + clavulanic acid', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile، هپاتیت کلستاتیک' },
    ],
  };
  const SAFETY_NET = {
    title: 'پیگیری',
    items: [
      { t: 'اگر علائم بدتر شد یا ظرف ۳ روز بهتر نشد، بیمار باید برگردد و دوباره ارزیابی شود.', src: { page: '42', type: 'expert', note: 'p. 42 states this for watchful waiting; applied here to every outcome' } },
      { t: 'تورم یا قرمزی پشت گوش، جلو آمدن لاله گوش، ضعف صورت یا سفتی گردن یعنی ارجاع فوری.', src: { page: '—', type: 'expert' } },
    ],
  };

  ABX.flows.otitis_media = {
    id: 'otitis_media',
    title: 'اوتیت میانی حاد',

    // ---------- PAGES ----------
    pages: [
      {
        id: 'history',
        title: 'سن و وزن',
        hint: 'برای بیمار زیر ۱۸ سال وزن لازم است؛ دوز دارو از روی آن انتخاب می‌شود.',
        fields: [
          {
            id: 'age_group', type: 'chips', label: 'گروه سنی',
            options: [
              { v: 'neonate', l: 'نوزاد (کمتر از ۲۸ روز)' },
              { v: 'lt3m', l: '۲۸ روز تا کمتر از ۳ ماه' },
              { v: 'm3_2y', l: '۳ ماه تا کمتر از ۲ سال' },
              { v: 'y2_18', l: '۲ تا کمتر از ۱۸ سال' },
              { v: 'adult', l: '۱۸ سال و بالاتر' },
            ],
          },
          { id: 'weight_kg', type: 'number', label: 'وزن (فقط برای زیر ۱۸ سال)', unit: 'kg', step: 'decimal' },
        ],
      },
      {
        id: 'ear',
        title: 'علائم گوش و معاینه',
        hint: 'اتوسکوپی اگر انجام نشده، خالی بماند.',
        fields: [
          {
            id: 'symptoms', type: 'search', label: 'علائم', placeholder: 'مثلاً: ترشح از گوش',
            options: [
              { v: 'ear_pain', l: 'گوش‌درد حاد' },
              { v: 'otorrhoea', l: 'ترشح از گوش' },
            ],
          },
          {
            id: 'laterality', type: 'chips', label: 'درگیری گوش',
            options: [{ v: 'one', l: 'یک‌طرفه' }, { v: 'both', l: 'دوطرفه' }],
          },
          {
            id: 'otoscopy', type: 'chips', label: 'اتوسکوپی',
            options: [
              { v: 'aom', l: 'پرده گوش برجسته و قرمز (مطابق AOM)' },
              { v: 'normal', l: 'پرده گوش طبیعی' },
            ],
          },
        ],
      },
      {
        id: 'severity',
        title: 'شدت بیماری و علائم هشدار',
        hint: 'هر موردی را که بررسی نکرده‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'دمای بدن', unit: '°C', step: 'decimal' },
          {
            id: 'very_unwell', type: 'chips', label: 'به قضاوت شما بیمار از نظر عمومی بسیار بدحال است؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          {
            id: 'pain_despite', type: 'chips', label: 'درد گوش با وجود مسکن ادامه دارد؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          {
            id: 'alarm', type: 'search', label: 'علائم هشدار (عارضه مشکوک)', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'mastoid', l: 'تورم، تندرنس یا قرمزی پشت گوش' },
              { v: 'protruding_ear', l: 'جلو آمدن لاله گوش' },
              { v: 'facial_palsy', l: 'ضعف عضلات صورت' },
              { v: 'neck_stiffness', l: 'سفتی گردن' },
            ],
          },
        ],
      },
      {
        id: 'background',
        title: 'سابقه و زمینه',
        fields: [
          {
            id: 'recurrent', type: 'chips', label: 'اوتیت مکرر: ۳ بار یا بیشتر در ۶ ماه، یا ۴ بار یا بیشتر در یک سال',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          {
            id: 'immuno', type: 'chips', label: 'به قضاوت شما بیمار نقص ایمنی دارد؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
        ],
      },
    ],

    // ---------- GATE 0: suspected complication ----------
    redFlags: [
      { id: 'R1', label: 'تورم، تندرنس یا قرمزی پشت گوش (مشکوک به ماستوئیدیت)', when: { field: 'alarm', op: 'includes', value: 'mastoid' },
        src: { page: '41, 42', type: 'expert', note: 'AWaRe names mastoiditis as a complication but no signs' } },
      { id: 'R2', label: 'جلو آمدن لاله گوش', when: { field: 'alarm', op: 'includes', value: 'protruding_ear' },
        src: { page: '41, 42', type: 'expert' } },
      { id: 'R3', label: 'ضعف عضلات صورت', when: { field: 'alarm', op: 'includes', value: 'facial_palsy' },
        src: { page: '41, 42', type: 'expert' } },
      { id: 'R4', label: 'سفتی گردن (مشکوک به عارضه داخل جمجمه)', when: { field: 'alarm', op: 'includes', value: 'neck_stiffness' },
        src: { page: '41, 42', type: 'expert', note: 'AWaRe names brain abscess as a complication' } },
    ],
    redFlagRule: { src: { page: '41, 42', type: 'expert', note: 'Any single sign of a complication: refer for urgent assessment' } },

    // ---------- FINDINGS ----------
    findings: [
      { id: 'AG', label: 'گروه سنی ثبت شده', record: 'گروه سنی', fixPage: 'history',
        when: { field: 'age_group', op: 'in', value: GROUPS },
        src: { page: '—', type: 'expert' } },
      { id: 'CH', label: 'کودک (زیر ۱۸ سال)', informativeOnly: true, fixPage: 'history',
        when: { field: 'age_group', op: 'in', value: CHILD },
        src: { page: '—', type: 'expert' } },
      { id: 'W1', label: 'وزن ثبت شده (لازم برای کودک)', record: 'وزن کودک', fixPage: 'history',
        when: { any: [
          { field: 'age_group', op: '==', value: 'adult' },
          { field: 'weight_kg', op: '>', value: 0 },
        ] },
        src: { page: '39, 43, 44', type: 'guideline', note: 'Children\'s doses are weight-banded' } },
      { id: 'P1', label: 'تابلوی AOM (گوش‌درد حاد یا ترشح)', informativeOnly: true, fixPage: 'ear',
        when: { any: [
          { field: 'symptoms', op: 'includes', value: 'ear_pain' },
          { field: 'symptoms', op: 'includes', value: 'otorrhoea' },
        ] },
        src: { page: '37, 41', type: 'guideline' } },
      { id: 'O1', label: 'اتوسکوپی مطابق AOM', informativeOnly: true, fixPage: 'ear',
        when: { field: 'otoscopy', op: '==', value: 'aom' },
        src: { page: '41', type: 'guideline', note: 'Otoscopy gives the definitive diagnosis but may be unavailable; unknown is never read as normal' } },
      { id: 'SEV', label: 'بیماری شدید (تب ۳۹ یا بیشتر، بسیار بدحال، یا درد با وجود مسکن)', record: 'شدت بیماری', fixPage: 'severity',
        when: C_SEVERE,
        src: { page: '37, 39, 44', type: 'guideline', note: 'Fever 39.0 is AWaRe\'s number; "very unwell" and "pain despite analgesics" are prescriber judgement' } },
      { id: 'IMM', label: 'بیمار با نقص ایمنی', record: 'وضعیت ایمنی', fixPage: 'background',
        when: C_IMMUNO,
        src: { page: '39, 44', type: 'expert', note: 'AWaRe says "immunocompromised children" (higher risk of complications); extended to adults by team decision; no criteria given, left to the prescriber' } },
      { id: 'BIL2', label: 'اوتیت دوطرفه در کودک زیر ۲ سال', record: 'یک‌طرفه یا دوطرفه', fixPage: 'ear',
        when: C_BILATERAL,
        src: { page: '39, 44', type: 'guideline' } },
      { id: 'G7', label: 'وضعیت بدون اجماع (عود مکرر، ترشح از گوش، یا نوزاد)', record: 'سابقه اوتیت مکرر', fixPage: 'background',
        when: { any: [
          { field: 'recurrent', op: '==', value: 'yes' },
          { field: 'symptoms', op: 'includes', value: 'otorrhoea' },
          { field: 'age_group', op: '==', value: 'neonate' },
        ] },
        src: { page: '44', type: 'guideline', note: 'AWaRe: no clear consensus for these non-severe cases; team decision = refer' } },
      { id: 'ABX', label: 'اندیکاسیون آنتی‌بیوتیک (شدید، یا نقص ایمنی، یا دوطرفه زیر ۲ سال)', informativeOnly: true, fixPage: 'severity',
        when: { any: [C_SEVERE, C_IMMUNO, C_BILATERAL] },
        src: { page: '37, 39, 44', type: 'guideline' } },
    ],

    // ---------- RULES: first match wins ----------
    rules: [
      { id: 'RULE_AGE_UNKNOWN', outcome: 'incomplete',
        when: { finding: 'AG', is: null },
        src: { page: '—', type: 'expert', note: 'Age group decides the branch and the doses' } },

      { id: 'RULE_NEED_SEVERITY', outcome: 'incomplete',
        when: { all: [{ finding: 'SEV', is: null }, { finding: 'G7', is: true }] },
        src: { page: '44', type: 'expert', note: 'The no-consensus rule applies only to non-severe cases, so severity must be known' } },

      { id: 'RULE_NO_CONSENSUS', outcome: 'refer_specialist',
        when: { all: [{ finding: 'SEV', is: false }, { finding: 'G7', is: true }, { finding: 'IMM', is: false }] },
        src: { page: '44', type: 'expert', note: 'AWaRe: no clear consensus; team decision = refer to an infectious disease specialist' } },

      { id: 'RULE_NEED_WEIGHT', outcome: 'incomplete',
        when: { any: [{ finding: 'W1', is: null }, { finding: 'W1', is: false }] },
        src: { page: '39, 43, 44', type: 'guideline', note: 'No weight, no children\'s dose' } },

      { id: 'RULE_ABX_CHILD', outcome: 'abx_child',
        when: { all: [{ finding: 'ABX', is: true }, { finding: 'CH', is: true }] },
        src: { page: '39, 44', type: 'guideline' } },

      { id: 'RULE_ABX_ADULT', outcome: 'abx_adult',
        when: { finding: 'ABX', is: true },
        src: { page: '37, 44', type: 'guideline' } },

      { id: 'RULE_NO_ABX_CHILD', outcome: 'no_antibiotic_child',
        when: { all: [{ finding: 'ABX', is: false }, { finding: 'G7', is: false }, { finding: 'CH', is: true }] },
        src: { page: '39, 42', type: 'guideline' } },

      { id: 'RULE_NO_ABX_ADULT', outcome: 'no_antibiotic',
        when: { all: [{ finding: 'ABX', is: false }, { finding: 'G7', is: false }] },
        src: { page: '37, 42', type: 'guideline' } },

      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert', note: 'Reached while a deciding item is still unknown' } },
    ],

    // ---------- TRAPS ----------
    traps: [
      { id: 'T1', title: 'تب ۳۸ تا ۳۹ درجه',
        text: 'تب ۳۸ یا بیشتر جزو تابلوی تشخیصی اوتیت است، نه معیار شدت. آستانه شدت در AWaRe ۳۹ درجه است؛ تب مختصری که با تب‌بر پایین می‌آید در بیماری غیرشدید دیده می‌شود.',
        when: { all: [{ field: 'temp', op: '>=', value: 38 }, { field: 'temp', op: '<', value: 39 }] },
        showFor: ['no_antibiotic', 'no_antibiotic_child'],
        src: { page: '42', type: 'guideline' } },

      { id: 'T2', title: 'کودک بالای ۲ سال',
        text: 'در کودک بالای ۲ سال با بیماری غیرشدید، درمان علامتی و پیگیری دقیق ارجح است و بیشتر موارد خودبه‌خود بهبود می‌یابند.',
        when: { field: 'age_group', op: '==', value: 'y2_18' },
        showFor: ['no_antibiotic_child'],
        src: { page: '39, 42', type: 'guideline' } },

      { id: 'T3', title: 'آزمایش و تصویربرداری',
        text: 'در اوتیت بدون عارضه کشت، آزمایش خون و تصویربرداری لازم نیست؛ کشت ترشح گوش سوراخ‌شده هم نباید راهنمای درمان باشد.',
        when: { always: true },
        showFor: ['no_antibiotic', 'no_antibiotic_child'],
        src: { page: '37, 41, 42', type: 'guideline' } },
    ],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارجاع فوری — مشکوک به عارضه',
        summary: 'نشانه‌ای از عارضه اوتیت (ماستوئیدیت یا عارضه داخل جمجمه) وجود دارد. این بیمار با این ابزار سرپایی مدیریت نمی‌شود.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'بیمار را برای ارزیابی فوری ارجاع دهید.', src: { page: '41, 42', type: 'expert' } },
            { t: 'آزمایش خون و تصویربرداری (مانند CT) فقط در شک به عارضه اندیکاسیون دارند.', src: { page: '41, 42', type: 'guideline' } },
          ] },
        ],
      },

      refer_specialist: {
        tone: 'caution',
        verdict: 'ارجاع به متخصص عفونی',
        summary: 'AWaRe برای این وضعیت اجماع روشنی ندارد؛ تصمیم تیم این است که بیمار برای نظر تخصصی ارجاع شود.',
        summarySrc: { page: '44', type: 'expert', note: 'AWaRe: no clear consensus; team decision = refer' },
        sections: [
          { title: 'چرا ارجاع', items: [
            { t: 'اوتیت مکرر غیرشدید (۳ بار یا بیشتر در ۶ ماه، یا ۴ بار یا بیشتر در یک سال).', src: { page: '44', type: 'guideline' } },
            { t: 'اوتیت غیرشدید همراه با ترشح از گوش.', src: { page: '44', type: 'guideline' } },
            { t: 'اوتیت غیرشدید در نوزاد (کمتر از ۲۸ روز).', src: { page: '44', type: 'guideline' } },
          ] },
          { title: 'اگر وضعیت بدتر شد', items: [
            { t: 'تب ۳۹ یا بیشتر، حال عمومی بسیار بد، یا درد با وجود مسکن یعنی بیماری شدید است؛ در این صورت آنتی‌بیوتیک مطرح می‌شود. پاسخ‌ها را در صفحه شدت اصلاح کنید.', src: { page: '37, 39, 44', type: 'guideline' } },
          ] },
        ],
      },

      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'بیشتر موارد غیرشدید با درمان علامتی و پیگیری بدون آنتی‌بیوتیک بهبود می‌یابند.',
        summarySrc: { page: '37, 39, 42', type: 'guideline' },
        showTraps: true,
        sections: [
          ANALGESIA_ADULT,
          { title: 'به بیمار بگویید', items: [
            { t: 'علائم را زیر نظر بگیرد و اگر بدتر شد یا چند روز ادامه یافت برگردد.', src: { page: '37, 42', type: 'guideline' } },
          ] },
          SAFETY_NET,
        ],
      },

      no_antibiotic_child: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'بیشتر موارد غیرشدید با درمان علامتی و پیگیری بدون آنتی‌بیوتیک بهبود می‌یابند، به‌ویژه در کودک بالای ۲ سال.',
        summarySrc: { page: '39, 42', type: 'guideline' },
        showTraps: true,
        sections: [
          ANALGESIA_CHILD,
          { title: 'به مراقبین بگویید', items: [
            { t: 'کودک را زیر نظر بگیرند و اگر تب، درد یا علائم بدتر شد یا ادامه یافت برگردند.', src: { page: '39, 42', type: 'guideline' } },
          ] },
          SAFETY_NET,
        ],
      },

      abx_adult: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'بیماری شدید است یا بیمار نقص ایمنی دارد؛ در این حالت‌ها آنتی‌بیوتیک در نظر گرفته می‌شود.',
        summarySrc: { page: '37, 44', type: 'guideline' },
        rx: {
          title: 'درمان آنتی‌بیوتیکی — ۵ روز',
          src: { page: '44, 45', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول', drugs: [
              { name: 'Amoxicillin', dose: '500 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
            ] },
            { label: 'انتخاب دوم', drugs: [
              { name: 'Amoxicillin + clavulanic acid', dose: '500 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
            ] },
          ],
          adverse: ADVERSE,
        },
        sections: [
          { title: 'پیش از تجویز', items: [ALLERGY, RESISTANCE] },
          ANALGESIA_ADULT,
          SAFETY_NET,
        ],
      },

      abx_child: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'یکی از معیارهای AWaRe برای آنتی‌بیوتیک در کودک وجود دارد: بیماری شدید، کودک مبتلا به نقص ایمنی، یا اوتیت دوطرفه زیر ۲ سال.',
        summarySrc: { page: '39, 44', type: 'guideline' },
        rx: {
          title: 'درمان آنتی‌بیوتیکی — ۵ روز (دوز بر اساس وزن)',
          src: { page: '44, 45', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول — آموکسی‌سیلین ۸۰ تا ۹۰ mg/kg/day', drugs: [
              { name: 'Amoxicillin', bands: AMOX_BANDS, route: 'PO', aware: 'Access' },
            ] },
            { label: 'انتخاب دوم — دوز بر پایه جزء آموکسی‌سیلین', drugs: [
              { name: 'Amoxicillin + clavulanic acid', bands: AMOX_BANDS, route: 'PO', aware: 'Access' },
            ] },
          ],
          adverse: ADVERSE,
        },
        sections: [
          { title: 'پیش از تجویز', items: [
            ALLERGY,
            RESISTANCE,
            { t: 'سوسپانسیون آموکسی‌سیلین-کلاوولانیک پس از آماده‌سازی باید در یخچال نگهداری شود.', src: { page: '45', type: 'guideline' } },
          ] },
          ANALGESIA_CHILD,
          SAFETY_NET,
        ],
      },

      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'برای تصمیم‌گیری، موارد زیر را ثبت کنید. در کودک، وزن برای محاسبه دوز لازم است.',
        showMissing: true,
        sections: [],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
