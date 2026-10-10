/* =====================================================================
   FOUNDATION — acute sinusitis, ADULTS (18+)
   Source: WHO AWaRe antibiotic book (2022), ch. 7, pp. 61-63.
   Status: PROTOTYPE, NOT VALIDATED.
   Team decisions in this file:
     - Scope: adults 18+. Under 18 -> out of scope (ch. 7 has a children's
       page, pp. 64-66, not built yet). A blank age is never read as adult.
     - Red flags (refer): the five signs AWaRe lists on p. 63 (systemic
       toxicity, persistent fever >=39, periorbital redness/swelling, severe
       headache, altered mental status). AWaRe gives no measurable criteria;
       each is a prescriber judgement tick.
     - Duration over 28 days is NOT acute sinusitis (p. 61: symptoms last up
       to 4 weeks). The 28-day cut-off is a team decision.
     - "Severe onset" = fever >=39.0 AND (purulent discharge OR facial pain)
       for >=3 consecutive days. AWaRe says "3-4 days"; the lower bound is
       used (team decision).
     - Antibiotic INDICATED (considered): severe onset.
       Antibiotic MAY BE CONSIDERED: high-risk comorbidity (prescriber
       judgement, case by case, p. 63), or >=10 days without improvement, or
       worsening after an initial mild phase (p. 62). For the last group AWaRe
       itself says benefit is minimal, so the result says "prescriber's choice".
     - <10 days and improving: watchful waiting, symptomatic care.
     - Penicillin allergy: ch. 7 offers no alternative; a visible note
       stands in (same approach as the ear-pain flow).
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  const ALARM = (v) => ({ field: 'alarm', op: 'includes', value: v });
  const C_SEVERE_ONSET = { all: [
    { field: 'temp', op: '>=', value: 39 },
    { field: 'purulent_pain', op: '==', value: 'yes' },
    { field: 'severe_days', op: '>=', value: 3 },
  ] };
  const C_COMORB = { field: 'comorbid', op: '==', value: 'yes' };
  const C_PERSIST = { any: [
    { field: 'course', op: '==', value: 'worsening' },
    { all: [
      { field: 'days', op: '>=', value: 10 },
      { field: 'course', op: '==', value: 'not_improving' },
    ] },
  ] };

  const SRC_CLIN = { page: '62', type: 'guideline' };
  const SRC_TX = { page: '63', type: 'guideline' };

  const ANALGESIA = {
    title: 'درمان علامتی',
    items: [
      { rx: 'Ibuprofen 200–400 mg PO q6–8h', t: 'حداکثر ۲.۴ گرم در روز.', src: SRC_TX },
      { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد یا سیروز حداکثر ۲ گرم.', src: SRC_TX },
      { t: 'شست‌وشوی بینی با محلول نمکی، و کورتیکواستروئید داخل بینی یا دکونژستانت موضعی.', src: SRC_TX },
    ],
  };

  const ALLERGY = {
    t: '⚠ پیش از تجویز درباره آلرژی به پنی‌سیلین‌ها بپرسید. فصل ۷ AWaRe جایگزین غیرپنی‌سیلینی برای این بیماری ندارد. در صورت آلرژی، داروی جایگزین را از فصل ۳ (حساسیت به آنتی‌بیوتیک‌ها، صفحه ۲۰) یا از متخصص عفونی بگیرید.',
    src: { page: '20', type: 'expert', note: 'Stand-in note until an agreed alternative is added; ch. 7 gives none' },
  };

  const ADVERSE = {
    src: { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' },
    items: [
      { name: 'Amoxicillin', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile، سندرم استیونس-جانسون' },
      { name: 'Amoxicillin + clavulanic acid', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile، هپاتیت کلستاتیک' },
    ],
  };

  const RX = {
    title: 'درمان آنتی‌بیوتیکی — ۵ روز',
    src: { page: '63', type: 'guideline' },
    groups: [
      { label: 'دو گزینه هم‌ارز (به ترتیب الفبا)', drugs: [
        { name: 'Amoxicillin', dose: '1 g', route: 'PO', freq: 'q8h', aware: 'Access' },
        { name: 'Amoxicillin + clavulanic acid', dose: '500 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
      ] },
    ],
    adverse: ADVERSE,
  };

  const SAFETY_NET = {
    title: 'پیگیری',
    items: [
      { t: 'اگر علائم بدتر شد، تب بالا رفت، یا تورم و قرمزی دور چشم، سردرد شدید یا تغییر سطح هوشیاری ایجاد شد، بیمار باید فوراً برگردد.', src: { page: '63', type: 'guideline' } },
      { t: 'اگر بعد از ۱۰ روز بهبودی نداشت، دوباره ارزیابی شود.', src: { page: '62', type: 'guideline' } },
    ],
  };

  ABX.flows.sinusitis = {
    id: 'sinusitis',
    title: 'سینوزیت حاد (بالغین)',

    // ---------- PAGES ----------
    pages: [
      {
        id: 'history',
        title: 'سن و مدت علائم',
        hint: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر است.',
        fields: [
          { id: 'age', type: 'number', label: 'سن بیمار', unit: 'سال' },
          { id: 'days', type: 'number', label: 'مدت علائم', unit: 'روز' },
        ],
      },
      {
        id: 'symptoms',
        title: 'علائم و سیر بیماری',
        hint: 'علائمی را که وجود دارد انتخاب کنید. انتخاب‌نشده یعنی وجود ندارد.',
        fields: [
          {
            id: 'main', type: 'search', label: 'علائم اصلی', placeholder: 'مثلاً: گرفتگی بینی',
            options: [
              { v: 'drainage', l: 'ترشح بینی' },
              { v: 'obstruction', l: 'گرفتگی یا احتقان بینی' },
              { v: 'facial_pain', l: 'درد یک‌طرفه دندان یا صورت' },
              { v: 'fullness', l: 'احساس پری یا فشار در صورت' },
            ],
          },
          {
            id: 'course', type: 'chips', label: 'سیر علائم',
            options: [
              { v: 'improving', l: 'رو به بهبود' },
              { v: 'not_improving', l: 'بدون بهبودی' },
              { v: 'worsening', l: 'بدتر شدن چشمگیر بعد از دوره اولیه خفیف' },
            ],
          },
        ],
      },
      {
        id: 'severity',
        title: 'شدت و علائم هشدار',
        hint: 'هر موردی را که بررسی نکرده‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'بالاترین دمای بدن', unit: '°C', step: 'decimal' },
          {
            id: 'purulent_pain', type: 'chips', label: 'ترشح چرکی بینی یا درد صورت وجود دارد؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          { id: 'severe_days', type: 'number', label: 'چند روز پیاپی تب ۳۹ یا بیشتر همراه ترشح چرکی یا درد صورت بوده است؟', unit: 'روز' },
          {
            id: 'alarm', type: 'search', label: 'علائم هشدار (به قضاوت شما)', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'toxic', l: 'تابلوی مسمومیت سیستمیک' },
              { v: 'persistent_fever', l: 'تب پایدار ۳۹ یا بیشتر' },
              { v: 'periorbital', l: 'قرمزی و تورم دور چشم' },
              { v: 'headache', l: 'سردرد شدید' },
              { v: 'mental', l: 'تغییر سطح هوشیاری' },
            ],
          },
        ],
      },
      {
        id: 'background',
        title: 'زمینه بیمار',
        fields: [
          {
            id: 'comorbid', type: 'chips', label: 'به قضاوت شما بیمار بیماری زمینه‌ای مزمن یا نقص ایمنی (مثلاً بدخیمی) دارد که خطر عارضه را بالا می‌برد؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
        ],
      },
    ],

    // ---------- GATE 0: red flags ----------
    redFlags: [
      { id: 'R1', label: 'تابلوی مسمومیت سیستمیک', when: ALARM('toxic'), src: { page: '63', type: 'guideline' } },
      { id: 'R2', label: 'تب پایدار ۳۹ یا بیشتر', when: ALARM('persistent_fever'), src: { page: '63', type: 'guideline' } },
      { id: 'R3', label: 'قرمزی و تورم دور چشم', when: ALARM('periorbital'), src: { page: '63', type: 'guideline' } },
      { id: 'R4', label: 'سردرد شدید', when: ALARM('headache'), src: { page: '63', type: 'guideline' } },
      { id: 'R5', label: 'تغییر سطح هوشیاری', when: ALARM('mental'), src: { page: '63', type: 'guideline' } },
    ],
    redFlagRule: { src: { page: '63', type: 'expert', note: 'AWaRe lists these as signs of complicated infection; single flag triggers referral; no measurable criteria given' } },

    // ---------- FINDINGS ----------
    findings: [
      { id: 'AG', label: 'سن ثبت شده', record: 'سن', fixPage: 'history',
        when: { field: 'age', op: '>', value: 0 },
        src: { page: '—', type: 'expert', note: 'A blank age is never read as adult' } },
      { id: 'DU', label: 'مدت علائم ثبت شده', record: 'مدت علائم', fixPage: 'history',
        when: { field: 'days', op: '>=', value: 0 },
        src: { page: '61, 62', type: 'guideline' } },
      { id: 'MS', label: 'حداقل یک علامت اصلی سینوزیت', informativeOnly: true, fixPage: 'symptoms',
        when: { any: [
          { field: 'main', op: 'includes', value: 'drainage' },
          { field: 'main', op: 'includes', value: 'obstruction' },
          { field: 'main', op: 'includes', value: 'facial_pain' },
          { field: 'main', op: 'includes', value: 'fullness' },
        ] },
        src: { page: '62', type: 'guideline' } },
      { id: 'CS', label: 'سیر علائم ثبت شده', record: 'سیر علائم', fixPage: 'symptoms',
        when: { field: 'course', op: 'in', value: ['improving', 'not_improving', 'worsening'] },
        src: { page: '62, 63', type: 'guideline' } },
      { id: 'SEV', label: 'شروع شدید (تب ۳۹ یا بیشتر + ترشح چرکی یا درد صورت، حداقل ۳ روز پیاپی)', record: 'شدت شروع بیماری', fixPage: 'severity',
        when: C_SEVERE_ONSET,
        src: { page: '63', type: 'guideline', note: 'AWaRe says "at least 3-4 consecutive days"; team uses 3 (lower bound)' } },
      { id: 'CM', label: 'بیماری زمینه‌ای پرخطر', record: 'بیماری زمینه‌ای', fixPage: 'background',
        when: C_COMORB,
        src: { page: '63', type: 'guideline', note: 'AWaRe: case-by-case; no criteria, left to the prescriber' } },
      { id: 'PE', label: 'علائم مطرح‌کننده سینوزیت باکتریایی (≥۱۰ روز بدون بهبودی، یا بدتر شدن)', record: 'سیر بیماری', fixPage: 'symptoms',
        when: C_PERSIST,
        src: { page: '62', type: 'guideline' } },
    ],

    // ---------- RULES: first match wins ----------
    rules: [
      { id: 'RULE_AGE_UNKNOWN', outcome: 'incomplete',
        when: { any: [{ finding: 'AG', is: null }, { finding: 'AG', is: false }] },
        src: { page: '—', type: 'expert', note: 'A blank age is never read as adult' } },

      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '64–66', type: 'expert', note: 'Children have their own page in ch. 7; not built in this version' } },

      { id: 'RULE_NEED_DAYS', outcome: 'incomplete',
        when: { any: [{ finding: 'DU', is: null }, { finding: 'DU', is: false }] },
        src: { page: '—', type: 'expert', note: 'Duration decides acute vs not acute' } },

      { id: 'RULE_NOT_ACUTE', outcome: 'not_acute',
        when: { field: 'days', op: '>', value: 28 },
        src: { page: '61', type: 'expert', note: 'AWaRe: symptoms last up to 4 weeks; 28-day cut-off is a team decision' } },

      { id: 'RULE_NO_MAIN', outcome: 'no_sinusitis',
        when: { finding: 'MS', is: false },
        src: { page: '62', type: 'guideline', note: 'No main symptom ticked: sinusitis diagnosis not supported' } },

      { id: 'RULE_SEVERE', outcome: 'abx_indicated',
        when: { finding: 'SEV', is: true },
        src: { page: '63', type: 'guideline' } },

      { id: 'RULE_COMORB', outcome: 'abx_comorbid',
        when: { finding: 'CM', is: true },
        src: { page: '63', type: 'guideline' } },

      { id: 'RULE_NEED_MORE', outcome: 'incomplete',
        when: { any: [{ finding: 'SEV', is: null }, { finding: 'CM', is: null }, { finding: 'PE', is: null }] },
        src: { page: '—', type: 'expert', note: 'A deciding item is still unknown; unknown is never read as absent' } },

      { id: 'RULE_PERSIST', outcome: 'abx_persistent',
        when: { finding: 'PE', is: true },
        src: { page: '62, 63', type: 'guideline' } },

      { id: 'RULE_WATCH', outcome: 'watchful',
        when: { finding: 'PE', is: false },
        src: { page: '63', type: 'guideline' } },

      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert' } },
    ],

    // ---------- TRAPS ----------
    traps: [
      { id: 'T1', title: 'ترشح زرد یا سبز',
        text: 'رنگ زرد یا سبز ترشح بینی به‌تنهایی نشانه عفونت باکتریایی نیست و اندیکاسیون آنتی‌بیوتیک نیست.',
        when: { always: true },
        showFor: ['watchful', 'no_sinusitis'],
        src: { page: '61', type: 'guideline' } },

      { id: 'T2', title: 'آزمایش و تصویربرداری',
        text: 'در سینوزیت بدون عارضه کشت، آزمایش خون و تصویربرداری لازم نیست؛ فقط اگر عارضه یا تشخیص دیگری مطرح باشد.',
        when: { always: true },
        showFor: ['watchful', 'no_sinusitis'],
        src: { page: '62', type: 'guideline' } },

      { id: 'T3', title: 'اثر آنتی‌بیوتیک کم است',
        text: 'در بیشتر موارد آنتی‌بیوتیک اثر اندکی بر طول علائم دارد؛ برای ۱۰ تا ۱۴ روز علائم معمولاً خودبه‌خود برطرف می‌شود.',
        when: { always: true },
        showFor: ['watchful'],
        src: { page: '62, 63', type: 'guideline' } },
    ],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارجاع فوری — مشکوک به عارضه',
        summary: 'نشانه‌ای از سینوزیت عارضه‌دار وجود دارد (مسمومیت سیستمیک، تب پایدار، درگیری دور چشم، سردرد شدید یا تغییر هوشیاری).',
        sections: [
          { title: 'اقدام', items: [
            { t: 'بیمار را برای ارزیابی فوری ارجاع دهید.', src: { page: '63', type: 'guideline' } },
            { t: 'تصویربرداری فقط در شک به عارضه یا تشخیص دیگر اندیکاسیون دارد.', src: { page: '62', type: 'guideline' } },
          ] },
        ],
      },

      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر است. سینوزیت کودکان در AWaRe صفحه جدا دارد (صفحات ۶۴ تا ۶۶).',
        sections: [],
      },

      not_acute: {
        tone: 'caution',
        verdict: 'علائم بیش از ۴ هفته — سینوزیت حاد نیست',
        summary: 'مدت علائم بیش از ۲۸ روز است. سینوزیت حاد تا ۴ هفته طول می‌کشد؛ این مسیر برای آن طراحی نشده است.',
        summarySrc: { page: '61', type: 'expert' },
        sections: [
          { title: 'اقدام', items: [
            { t: 'علل دیگر مانند سینوزیت مزمن، آلرژی، پولیپ یا مشکلات دندانی را در نظر بگیرید و در صورت نیاز ارجاع دهید.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      no_sinusitis: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست — تابلو با سینوزیت نمی‌خواند',
        summary: 'هیچ‌یک از علائم اصلی (ترشح یا گرفتگی بینی، درد یک‌طرفه صورت یا دندان، پری یا فشار صورت) ثبت نشده است. تشخیص سینوزیت پشتیبانی نمی‌شود.',
        summarySrc: { page: '62', type: 'guideline' },
        showTraps: true,
        sections: [
          { title: 'اقدام', items: [
            { t: 'علت دیگر را بررسی کنید. اگر علائم اصلی را فراموش کرده‌اید، در صفحه علائم ثبت کنید.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      watchful: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست — درمان علامتی و پیگیری',
        summary: 'بیماری خفیف تا متوسط است (کمتر از ۱۰ روز و رو به بهبود، یا بدون مشخصه باکتریایی). در بیشتر موارد سینوزیت خودبه‌خود برطرف می‌شود.',
        summarySrc: { page: '63', type: 'guideline' },
        showTraps: true,
        sections: [ANALGESIA, SAFETY_NET],
      },

      abx_indicated: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک در نظر گرفته می‌شود — شروع شدید',
        summary: 'تب ۳۹ یا بیشتر همراه ترشح چرکی یا درد صورت برای حداقل ۳ روز پیاپی، نشانه شروع شدید است و AWaRe در این وضعیت آنتی‌بیوتیک را توصیه می‌کند.',
        summarySrc: { page: '63', type: 'guideline' },
        rx: RX,
        sections: [
          { title: 'پیش از تجویز', items: [ALLERGY,
            { t: 'رنگ زرد یا سبز ترشح به‌تنهایی نشانه باکتریایی بودن نیست؛ کشت، آزمایش خون و تصویربرداری هم لازم نیست مگر عارضه یا تشخیص دیگری مطرح باشد.', src: { page: '61, 62', type: 'guideline' } },] },
          ANALGESIA,
          SAFETY_NET,
        ],
      },

      abx_comorbid: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک قابل‌تأمل است — خطر عارضه بالا',
        summary: 'بیمار بیماری زمینه‌ای دارد که خطر عارضه را بالا می‌برد. AWaRe می‌گوید در این بیماران آنتی‌بیوتیک مورد‌به‌مورد در نظر گرفته شود.',
        summarySrc: { page: '63', type: 'guideline', note: 'Case-by-case; decision rests with the prescriber' },
        rx: RX,
        sections: [
          { title: 'پیش از تجویز', items: [
            { t: 'تصمیم نهایی با پزشک است؛ اگر علائم خفیف و رو به بهبود است، پیگیری دقیق هم گزینه معقولی است.', src: { page: '63', type: 'guideline' } },
            ALLERGY,
            { t: 'رنگ زرد یا سبز ترشح به‌تنهایی نشانه باکتریایی بودن نیست؛ کشت، آزمایش خون و تصویربرداری هم لازم نیست مگر عارضه یا تشخیص دیگری مطرح باشد.', src: { page: '61, 62', type: 'guideline' } },
          ] },
          ANALGESIA,
          SAFETY_NET,
        ],
      },

      abx_persistent: {
        tone: 'caution',
        verdict: 'سینوزیت باکتریایی مطرح است — آنتی‌بیوتیک با قضاوت پزشک',
        summary: 'علائم ≥۱۰ روز بدون بهبودی دارد یا پس از دوره خفیف اولیه به‌طور چشمگیر بدتر شده است. با این حال AWaRe تأکید می‌کند که آنتی‌بیوتیک در بیشتر موارد اثر اندکی بر مدت علائم دارد؛ ادامه درمان علامتی و پیگیری هم قابل‌قبول است.',
        summarySrc: { page: '62, 63', type: 'guideline', note: 'AWaRe: bacterial sinusitis suspected; antibiotics have minimal impact on symptom duration in most cases' },
        rx: RX,
        sections: [
          { title: 'پیش از تجویز', items: [ALLERGY,
            { t: 'رنگ زرد یا سبز ترشح به‌تنهایی نشانه باکتریایی بودن نیست؛ کشت، آزمایش خون و تصویربرداری هم لازم نیست مگر عارضه یا تشخیص دیگری مطرح باشد.', src: { page: '61, 62', type: 'guideline' } },] },
          ANALGESIA,
          SAFETY_NET,
        ],
      },

      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'برای تصمیم‌گیری، موارد زیر را ثبت کنید.',
        showMissing: true,
        sections: [],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
