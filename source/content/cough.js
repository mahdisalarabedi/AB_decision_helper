/* =====================================================================
   FOUNDATION — clinical content (data only, no logic)
   Source: WHO AWaRe antibiotic book (2022). Status: PROTOTYPE, NOT VALIDATED.
   Every rule carries src: { page, type }  type = 'guideline' | 'expert'
   'expert' = gap in AWaRe, decided by the team, pending supervisor sign-off.
   To change clinical behaviour, edit THIS file only.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});

  ABX.meta = {
    version: '0.1-prototype',
    guideline: 'WHO AWaRe antibiotic book, 2022',
    population: 'Adults ≥ 18',
    validated: false,
  };

  // ---------- DOOR: the triggers shown on the entry screen ----------
  ABX.triggers = [
    { id: 'cough', label: 'سرفه', active: true },
    { id: 'sore_throat', label: 'گلودرد', active: true },
    { id: 'rhinorrhea', label: 'آبریزش طولانی بینی', active: false },
    { id: 'uti', label: 'سوزش ادرار', active: true },
    { id: 'otitis_media', label: 'گوش‌درد', active: true },
    { id: 'diarrhoea', label: 'اسهال', active: true },
  ];

  ABX.flows = ABX.flows || {};

  ABX.flows.cough = {
    id: 'cough',
    title: 'سرفه در بزرگسال',

    // ---------- PAGES (the stepper rooms) ----------
    pages: [
      {
        id: 'history',
        title: 'شرح حال و سیر بیماری',
        fields: [
          { id: 'age', type: 'number', label: 'سن بیمار', unit: 'سال' },
          { id: 'duration_days', type: 'number', label: 'مدت سرفه', unit: 'روز' },
          {
            id: 'course', type: 'chips', label: 'سیر علائم',
            options: [
              { v: 'improving', l: 'رو به بهبود' },
              { v: 'stable', l: 'ثابت' },
              { v: 'worsening', l: 'رو به بدتر شدن' },
            ],
          },
          {
            id: 'sputum', type: 'chips', label: 'خلط',
            options: [
              { v: 'none', l: 'ندارد' },
              { v: 'clear', l: 'شفاف یا سفید' },
              { v: 'yellow_green', l: 'زرد یا سبز' },
              { v: 'bloody', l: 'خونی' },
            ],
          },
        ],
      },
      {
        id: 'symptoms',
        title: 'علائم همراه',
        hint: 'علائم را جست‌وجو و انتخاب کنید. هر علامتی که انتخاب نشود، یعنی بیمار آن را ندارد.',
        fields: [
          {
            id: 'symptoms', type: 'search', label: 'علائم همراه',
            placeholder: 'مثلاً: تنگی نفس',
            options: [
              { v: 'dyspnea', l: 'تنگی نفس' },
              { v: 'chest_pain', l: 'درد قفسه سینه' },
              { v: 'rhinorrhea', l: 'آبریزش بینی' },
              { v: 'sore_throat', l: 'گلودرد' },
              { v: 'wheeze_felt', l: 'احساس خس‌خس سینه' },
              { v: 'myalgia', l: 'بدن‌درد' },
              { v: 'chills', l: 'لرز' },
              { v: 'night_sweats', l: 'تعریق شبانه' },
              { v: 'weight_loss', l: 'کاهش وزن' },
            ],
          },
        ],
      },
      {
        id: 'signs',
        title: 'علائم حیاتی و معاینه',
        hint: 'هر موردی را که اندازه نگرفته‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'دمای بدن', unit: '°C', step: 'decimal' },
          { id: 'hr', type: 'number', label: 'ضربان قلب', unit: 'در دقیقه' },
          { id: 'rr', type: 'number', label: 'تعداد تنفس', unit: 'در دقیقه' },
          { id: 'sbp', type: 'number', label: 'فشار سیستولیک', unit: 'mmHg' },
          { id: 'dbp', type: 'number', label: 'فشار دیاستولیک', unit: 'mmHg' },
          { id: 'spo2', type: 'number', label: 'اشباع اکسیژن', unit: '٪' },
          {
            id: 'confusion', type: 'chips', label: 'گیجی یا اختلال هوشیاری تازه',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }],
          },
          {
            id: 'chest', type: 'chips', label: 'سمع ریه',
            options: [
              { v: 'normal', l: 'طبیعی' },
              { v: 'diffuse_wheeze', l: 'ویز یا رونکای منتشر' },
              { v: 'focal_crackles', l: 'کراکل موضعی' },
              { v: 'bronchial', l: 'صدای برونشیال یا ماتیته موضعی' },
              { v: 'not_examined', l: 'معاینه نشده' },
            ],
          },
        ],
      },
      {
        id: 'labs',
        title: 'آزمایش',
        skippable: true,
        skipLabel: 'آزمایشی انجام نشده',
        fields: [
          { id: 'crp', type: 'number', label: 'CRP', unit: 'mg/L' },
          { id: 'wbc', type: 'number', label: 'WBC', unit: '×10³/µL', step: 'decimal' },
        ],
      },
      {
        id: 'imaging',
        title: 'تصویربرداری',
        skippable: true,
        skipLabel: 'تصویربرداری انجام نشده',
        fields: [
          {
            id: 'cxr', type: 'chips', label: 'رادیوگرافی قفسه سینه',
            options: [
              { v: 'normal', l: 'طبیعی' },
              { v: 'new_infiltrate', l: 'ارتشاح جدید' },
              { v: 'other', l: 'یافته دیگر' },
            ],
          },
        ],
      },
    ],

    // ---------- GATE 0: red flags (any one fires the interrupt) ----------
    redFlags: [
      { id: 'R1', label: 'گیجی یا اختلال هوشیاری تازه',
        when: { field: 'confusion', op: '==', value: 'yes' },
        src: { page: '157', type: 'guideline', note: 'CRB-65' } },
      { id: 'R2', label: 'تعداد تنفس بیش از ۳۰ در دقیقه',
        when: { field: 'rr', op: '>', value: 30 },
        src: { page: '157', type: 'guideline', note: 'CRB-65' } },
      { id: 'R3', label: 'افت فشار خون (سیستولیک < ۹۰ یا دیاستولیک ≤ ۶۰)',
        when: { any: [
          { field: 'sbp', op: '<', value: 90 },
          { field: 'dbp', op: '<=', value: 60 },
        ] },
        src: { page: '157', type: 'guideline', note: 'CRB-65' } },
      { id: 'R4', label: 'اشباع اکسیژن کمتر از ۹۲٪',
        when: { field: 'spo2', op: '<', value: 92 },
        src: { page: '155', type: 'expert', note: 'AWaRe: "reduced SpO₂", no number — Gap 1' } },
    ],
    redFlagRule: { src: { page: '157', type: 'expert', note: 'Single flag triggers (stricter than CRB-65 ≥2) — Gap 2' } },

    // ---------- GATE 1: discriminators (tri-state: true / false / unknown) ----------
    findings: [
      { id: 'D1', label: 'تب ۳۸ درجه یا بیشتر', record: 'دمای بدن', fixPage: 'signs',
        when: { field: 'temp', op: '>=', value: 38 },
        src: { page: '30, 155', type: 'guideline' } },
      { id: 'D2', label: 'ضربان قلب بیش از ۹۰', record: 'ضربان قلب', fixPage: 'signs',
        when: { field: 'hr', op: '>', value: 90 },
        src: { page: '297', type: 'expert', note: 'AWaRe says "increased HR"; number borrowed from sepsis box' } },
      { id: 'D3', label: 'تعداد تنفس ۲۰ یا بیشتر', record: 'تعداد تنفس', fixPage: 'signs',
        when: { field: 'rr', op: '>=', value: 20 },
        src: { page: '297', type: 'expert', note: 'AWaRe says "increased RR"; number borrowed from sepsis box' } },
      { id: 'D4', label: 'تنگی نفس', record: 'علائم همراه', fixPage: 'symptoms',
        when: { field: 'symptoms', op: 'includes', value: 'dyspnea' },
        src: { page: '33, 155', type: 'guideline' } },
      { id: 'D5', label: 'یافته موضعی در سمع ریه', record: 'سمع ریه', fixPage: 'signs',
        when: { field: 'chest', op: 'in', value: ['focal_crackles', 'bronchial'], unknownIf: ['not_examined'] },
        src: { page: '33, 155', type: 'guideline' } },
      { id: 'X1', label: 'ارتشاح جدید در رادیوگرافی', fixPage: 'imaging', informativeOnly: true,
        when: { field: 'cxr', op: '==', value: 'new_infiltrate' },
        src: { page: '149', type: 'guideline', note: 'CAP definition' } },
    ],

    // ---------- RULES: evaluated top to bottom, first match wins ----------
    rules: [
      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '—', type: 'expert', note: 'Prototype scope: adults only' } },
      { id: 'RULE_CHRONIC', outcome: 'chronic',
        when: { field: 'duration_days', op: '>=', value: 21 },
        src: { page: '158', type: 'expert', note: '≥3 weeks cut-off is a team decision; AWaRe: consider TB in subacute LRTI' } },
      { id: 'RULE_CXR', outcome: 'pneumonia',
        when: { finding: 'X1', is: true },
        src: { page: '149', type: 'guideline' } },
      { id: 'RULE_PNEUMONIA', outcome: 'pneumonia',
        when: { all: [
          { finding: 'D5', is: true },
          { any: [
            { finding: 'D1', is: true }, { finding: 'D2', is: true },
            { finding: 'D3', is: true }, { finding: 'D4', is: true },
          ] },
        ] },
        src: { page: '33, 155', type: 'expert', note: 'AWaRe says "combination"; focal + ≥1 systemic is a team decision — Gap 3' } },
      { id: 'RULE_NO_ANTIBIOTIC', outcome: 'no_antibiotic',
        when: { all: [
          { finding: 'D1', is: false }, { finding: 'D2', is: false }, { finding: 'D3', is: false },
          { finding: 'D4', is: false }, { finding: 'D5', is: false },
        ] },
        src: { page: '32–33', type: 'guideline' } },
      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { all: [
          { none: [
            { finding: 'D1', is: true }, { finding: 'D2', is: true }, { finding: 'D3', is: true },
            { finding: 'D4', is: true }, { finding: 'D5', is: true },
          ] },
          { any: [
            { finding: 'D1', is: null }, { finding: 'D2', is: null }, { finding: 'D3', is: null },
            { finding: 'D4', is: null }, { finding: 'D5', is: null },
          ] },
        ] },
        src: { page: '—', type: 'expert', note: 'Missing data is never assumed normal' } },
      { id: 'RULE_UNCERTAIN', outcome: 'uncertain',
        when: { always: true },
        src: { page: '156', type: 'expert' } },
    ],

    // ---------- SCORES ----------
    scores: {
      crb65: {
        label: 'CRB-65',
        items: [
          { label: 'گیجی تازه', when: { field: 'confusion', op: '==', value: 'yes' }, needs: 'confusion' },
          { label: 'تنفس > ۳۰', when: { field: 'rr', op: '>', value: 30 }, needs: 'rr' },
          { label: 'افت فشار', when: { any: [{ field: 'sbp', op: '<', value: 90 }, { field: 'dbp', op: '<=', value: 60 }] }, needs: 'sbp' },
          { label: 'سن ≥ ۶۵', when: { field: 'age', op: '>=', value: 65 }, needs: 'age' },
        ],
        bands: [
          { id: 'outpatient', min: 0, max: 1, text: 'کاندید درمان سرپایی (خطر مرگ ۳۰ روزه < ۱.۵٪)' },
          { id: 'consider_admit', min: 2, max: 2, text: 'بستری را در نظر بگیرید' },
          { id: 'admit', min: 3, max: 4, text: 'بستری (بررسی نیاز به ICU)' },
        ],
        src: { page: '157', type: 'guideline' },
      },
    },

    // ---------- TRAPS: misleading triggers, refuted on the result screen ----------
    traps: [
      { id: 'T1', title: 'خلط زرد یا سبز',
        text: 'رنگ خلط نشانه عفونت باکتریایی نیست و به‌تنهایی دلیل تجویز آنتی‌بیوتیک نیست.',
        when: { field: 'sputum', op: '==', value: 'yellow_green' },
        showFor: ['no_antibiotic', 'uncertain', 'incomplete'],
        src: { page: '29, 32', type: 'guideline' } },
      { id: 'T2', title: 'ویز یا رونکای منتشر',
        text: 'یافته‌های منتشر راه هوایی با برونشیت سازگارند؛ پنومونی معمولاً با یافته موضعی مثل کراکل همراه است. در صورت ویز می‌توان برونکودیلاتور را در نظر گرفت.',
        when: { any: [
          { field: 'chest', op: '==', value: 'diffuse_wheeze' },
          { field: 'symptoms', op: 'includes', value: 'wheeze_felt' },
        ] },
        showFor: ['no_antibiotic', 'uncertain', 'incomplete'],
        src: { page: '30, 33', type: 'guideline' } },
      { id: 'T3', title: 'تب خفیف',
        text: 'آستانه تب در این راهنما ۳۸ درجه است. برونشیت هم ممکن است با تب خفیف همراه باشد.',
        when: { all: [
          { field: 'temp', op: '>=', value: 37.3 },
          { field: 'temp', op: '<', value: 38 },
        ] },
        showFor: ['no_antibiotic', 'uncertain', 'incomplete'],
        src: { page: '30', type: 'guideline' } },
      { id: 'T4', title: 'سرفه چندروزه',
        text: 'سرفه برونشیت معمولاً ۱۰ تا ۲۰ روز طول می‌کشد. طول کشیدن سرفه به‌تنهایی نشانه عفونت باکتریایی نیست.',
        when: { field: 'duration_days', op: '>=', value: 5 },
        showFor: ['no_antibiotic', 'uncertain', 'incomplete'],
        src: { page: '33', type: 'guideline' } },
      { id: 'T5', title: 'CRP یا WBC',
        text: 'در برونشیت معمولاً آزمایش لازم نیست. این نشانگرها حساسیت و ویژگی محدودی دارند و خودشان ممکن است به تجویز نابجا منجر شوند.',
        when: { any: [
          { field: 'crp', op: '>=', value: 0 },
          { field: 'wbc', op: '>=', value: 0 },
        ] },
        showFor: ['no_antibiotic'],
        src: { page: '33', type: 'guideline' } },
    ],

    // ---------- WINDOWS: the endings ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارزیابی فوری یا ارجاع',
        summary: 'یافته هشداردهنده وجود دارد. این بیمار را با این ابزار سرپایی مدیریت نکنید.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'بیمار را از نظر پنومونی شدید فوراً ارزیابی کنید و در صورت امکان به مرکز درمانی ارجاع دهید.', src: { page: '157', type: 'guideline' } },
          ] },
        ],
      },
      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر طراحی شده است.',
        sections: [],
      },
      chronic: {
        tone: 'caution',
        verdict: 'خارج از محدوده سرفه حاد',
        summary: 'سرفه سه هفته یا بیشتر علت‌های دیگری را مطرح می‌کند و در این ابزار پوشش داده نمی‌شود.',
        sections: [
          { title: 'در نظر داشته باشید', items: [
            { t: 'سل یکی از علل عفونت تحت‌حاد دستگاه تنفس تحتانی است و باید در نظر گرفته شود.', src: { page: '158', type: 'guideline' } },
          ] },
        ],
      },
      pneumonia: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'یافته‌ها با پنومونی خفیف اکتسابی از جامعه سازگار است.',
        showScore: 'crb65',
        rx: {
          title: 'درمان — ۵ روز',
          src: { page: '150', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول', drugs: [
              { name: 'Amoxicillin', dose: '1 g', route: 'PO', freq: 'q8h', aware: 'Access' },
              { name: 'Phenoxymethylpenicillin', dose: '500 mg', route: 'PO', freq: 'q6h', aware: 'Access' },
            ] },
            { label: 'انتخاب دوم', drugs: [
              { name: 'Amoxicillin + clavulanic acid', dose: '875 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
              { name: 'Doxycycline', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: {
            src: { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' },
            items: [
              { name: 'Amoxicillin / Penicillin', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile، سندرم استیونس-جانسون' },
              { name: 'Doxycycline', common: 'تهوع، حساسیت به نور', serious: 'ازوفاژیت (با آب فراوان و در حالت نشسته مصرف شود)، ممنوع در بارداری' },
            ],
          },
        },
        sections: [
          { title: 'پیگیری', items: [
            { t: 'اگر ظرف ۴۸ تا ۷۲ ساعت بهبود نیافت، بیمار دوباره ارزیابی شود.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },
      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'معیارهای شروع آنتی‌بیوتیک برآورده نشده است. درمان حمایتی کافی است.',
        diagnosis: 'تصویر بالینی با برونشیت حاد سازگار است؛ تقریباً همه موارد ویروسی و خودمحدودند.', // optional — delete this line if the guideline names no alternative
        diagnosisSrc: { page: '29', type: 'guideline' },
        showTraps: true,
        sections: [
          { title: 'درمان علامتی', items: [
            { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد ۲ گرم', src: { page: '35', type: 'guideline' } },
            { rx: 'Ibuprofen 200–400 mg PO q6–8h', t: 'حداکثر ۲.۴ گرم در روز', src: { page: '35', type: 'guideline' } },
            { t: 'در صورت ویز، برونکودیلاتور را می‌توان در نظر گرفت (شواهد قوی ندارد).', src: { page: '34', type: 'guideline' } },
          ] },
          { title: 'به بیمار بگویید', items: [
            { t: 'بیشتر موارد ویروسی است و خودبه‌خود بهبود می‌یابد.', src: { page: '34', type: 'guideline' } },
            { t: 'سرفه ممکن است چند هفته، اغلب شب‌ها، ادامه پیدا کند.', src: { page: '34', type: 'guideline' } },
            { t: 'آنتی‌بیوتیک در این بیماری فایده‌ای ندارد و عوارض دارد.', src: { page: '35', type: 'guideline' } },
          ] },
          { title: 'چه زمانی برگردد', items: [
            { t: 'تنگی نفس، تب ۳۸ درجه یا بیشتر بیش از ۳ روز، بدتر شدن حال عمومی، درد قفسه سینه یا خلط خونی.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },
      uncertain: {
        tone: 'caution',
        verdict: 'تصمیم قطعی ممکن نیست',
        summary: 'یافته‌ها بین برونشیت و پنومونی قرار دارند.',
        showTraps: true,
        sections: [
          { title: 'قدم بعدی', items: [
            { t: 'اگر CRP در دسترس است: CRP منفی به رد پنومونی باکتریایی کمک می‌کند، مگر احتمال بالینی بالا یا تظاهر شدید باشد.', src: { page: '156', type: 'guideline' } },
            { t: 'در موارد خفیف معمولاً رادیوگرافی لازم نیست.', src: { page: '156', type: 'guideline' } },
            { t: 'در غیر این صورت، بیمار را ظرف ۴۸ ساعت دوباره ارزیابی کنید.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },
      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'برای رد یا تأیید پنومونی، این موارد باید ثبت شوند:',
        showMissing: true,
        showTraps: true,
        sections: [],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
