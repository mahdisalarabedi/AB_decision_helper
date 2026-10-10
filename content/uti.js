/* =====================================================================
   FOUNDATION — lower urinary tract infection (acute cystitis), adults ≥ 18
   Source: WHO AWaRe antibiotic book (2022), ch. 23, pp. 278–292.
   Upper-UTI red-flag wording from ch. 34, p. 476; sepsis numbers from p. 297.
   Status: PROTOTYPE, NOT VALIDATED.
   Team decisions in this file (all marked type: 'expert'):
     - Red flags = findings that make admission or referral necessary.
     - Box 23.1 factors change testing only, never agent or duration (p. 279).
     - Men = 7 days (footnote d, p. 291) overrides the 5-day cell in Table 23.5.
     - Pyuria threshold = 5 WBC/HPF (AWaRe states > 10 leucocytes/uL, p. 286).
     - G6PD shown as a caution on the nitrofurantoin box, not as a rule.
     - Vaginal source assumed already excluded by the prescriber.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  // Reused blocks, so the three antibiotic outcomes stay identical except duration.
  const ADVERSE = {
    src: { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' },
    items: [
      { name: 'Nitrofurantoin', common: 'تهوع، سردرد، تیره شدن ادرار', serious: 'واکنش ریوی حاد یا مزمن، نوروپاتی محیطی، هپاتوتوکسیسیته، همولیز در کمبود G6PD' },
      { name: 'Amoxicillin + clavulanic acid', common: 'اسهال، تهوع، راش', serious: 'کولیت C. difficile، هپاتیت کلستاتیک، آنافیلاکسی' },
      { name: 'Sulfamethoxazole + trimethoprim', common: 'راش، تهوع', serious: 'سندرم استیونس-جانسون و TEN، سرکوب مغز استخوان، هیپرکالمی، آسیب حاد کلیه' },
      { name: 'Trimethoprim', common: 'راش، تهوع، هیپرکالمی', serious: 'سرکوب مغز استخوان، سندرم استیونس-جانسون' },
    ],
  };
  const NITRO_CAUTION = {
    t: '⚠ پیش از تجویز، درباره کمبود G6PD بپرسید. در نارسایی کلیه و در هفته‌های پایانی بارداری نیز با احتیاط.',
    src: { page: '—', type: 'expert' },
  };
  const ANALGESIA = {
    title: 'کنترل درد (مکمل درمان، نه جایگزین آن)',
    items: [
      { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد یا سیروز حداکثر ۲ گرم.', src: { page: '288', type: 'guideline' } },
      { rx: 'Ibuprofen 200–400 mg PO q6–8h', t: 'حداکثر ۲.۴ گرم در روز.', src: { page: '288', type: 'guideline' } },
    ],
  };
  const CULTURE_ADVICE = {
    t: 'اگر عفونت عودکننده است یا بیمار عامل خطر دارد (انسداد، سنگ، سوند، تخلیه ناکامل، دستکاری اخیر، ریفلاکس، دیابت، نقص ایمنی)، کشت ادرار بفرستید تا تشخیص تأیید و درمان تجربی در صورت نیاز اصلاح شود. این عوامل به‌خودی‌خود دارو یا مدت درمان را تغییر نمی‌دهند.',
    src: { page: '279, 280', type: 'guideline' },
  };
  const FOLLOWUP = {
    title: 'پیگیری و بازگشت',
    items: [
      { t: 'بهبود بالینی باید ظرف ۴۸ تا ۷۲ ساعت دیده شود.', src: { page: '281, 289', type: 'guideline' } },
      { t: 'در صورت تب، لرز، درد پهلو، تهوع و استفراغ، یا نبود بهبود پس از ۷۲ ساعت بیمار باید برگردد.', src: { page: '—', type: 'expert' } },
    ],
  };

  ABX.flows.uti = {
    id: 'uti',
    title: 'عفونت ادراری تحتانی در بزرگسال',

    // ---------- PAGES ----------
    pages: [
      {
        id: 'history',
        title: 'شرح حال',
        fields: [
          { id: 'age', type: 'number', label: 'سن بیمار', unit: 'سال' },
          {
            id: 'group', type: 'chips', label: 'گروه بیمار',
            options: [
              { v: 'male', l: 'مرد' },
              { v: 'female', l: 'زن غیرباردار' },
              { v: 'pregnant', l: 'زن باردار' },
            ],
          },
          { id: 'duration_days', type: 'number', label: 'مدت علائم ادراری', unit: 'روز' },
        ],
      },
      {
       id: 'symptoms',
       title: 'علائم ادراری',
       hint: 'سوزش ادرار همیشه در نظر گرفته می‌شود. هر علامت اضافی که انتخاب نشود، یعنی بیمار آن را ندارد.',
        fields: [
          {
            id: 'symptoms', type: 'search', label: 'علائم', placeholder: 'مثلاً: فوریت ادراری',
            fixed: [{ v: 'dysuria', l: 'سوزش ادرار' }],   // always selected, not removable
            options: [
              { v: 'dysuria', l: 'سوزش ادرار' },
              { v: 'urgency', l: 'فوریت ادراری' },
              { v: 'frequency', l: 'تکرر ادرار' },
              { v: 'suprapubic_pain', l: 'درد یا ناراحتی زیر شکم' },
              { v: 'gross_hematuria', l: 'هماچوری ماکروسکوپیک' },
              { v: 'cloudy_urine', l: 'ادرار کدر' },
              { v: 'smelly_urine', l: 'ادرار بدبو' },
            ],
          },
        ],
      },
      {
        id: 'signs',
        title: 'علائم هشدار و علائم حیاتی',
        hint: 'هر موردی را که بررسی نکرده‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'دمای بدن', unit: '°C', step: 'decimal' },
          { id: 'sbp', type: 'number', label: 'فشار سیستولیک', unit: 'mmHg' },
          { id: 'dbp', type: 'number', label: 'فشار دیاستولیک', unit: 'mmHg' },
          { id: 'rr', type: 'number', label: 'تعداد تنفس', unit: 'در دقیقه' },
          {
            id: 'flank', type: 'chips', label: 'درد پهلو یا تندرنس زاویه دنده‌ای-مهره‌ای',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }],
          },
          {
            id: 'alarm', type: 'search', label: 'یافته‌های هشدار', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'rigors', l: 'لرز شدید' },
              { v: 'vomiting', l: 'تهوع یا استفراغ' },
              { v: 'confusion', l: 'اختلال هوشیاری یا گیجی جدید' },
              { v: 'no_oral', l: 'ناتوانی در تحمل مایعات یا داروی خوراکی' },
            ],
          },
        ],
      },
      {
        id: 'risks',
        title: 'عوامل مستعدکننده',
        hint: 'این موارد انتخاب دارو و مدت درمان را تغییر نمی‌دهند؛ فقط لزوم کشت ادرار را مطرح می‌کنند.',
        fields: [
          {
            id: 'recurrent', type: 'chips', label: 'عفونت ادراری عودکننده',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }],
          },
          {
            id: 'risks', type: 'search', label: 'عوامل خطر', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'obstruction', l: 'انسداد مجاری ادراری یا سنگ' },
              { v: 'catheter', l: 'سوند یا استنت ادراری' },
              { v: 'incomplete_voiding', l: 'تخلیه ناکامل مثانه' },
              { v: 'instrumentation', l: 'دستکاری اخیر مجاری ادراری' },
              { v: 'reflux', l: 'ریفلاکس وزیکویورترال' },
              { v: 'diabetes', l: 'دیابت' },
              { v: 'immunosuppression', l: 'نقص ایمنی' },
              { v: 'healthcare', l: 'عفونت مرتبط با مراکز درمانی' },
            ],
          },
        ],
      },
      {
        id: 'labs',
        title: 'آزمایش ادرار',
        skippable: true,
        skipLabel: 'آزمایشی انجام نشده',
        hint: 'اگر آزمایش نشده یا جواب نیامده، خالی بگذارید؛ در این صورت تصمیم بر پایه شرح حال گرفته می‌شود.',
        fields: [
          { id: 'wbc_hpf', type: 'number', label: 'گلبول سفید ادرار', unit: 'در هر HPF' },
          {
            id: 'nitrite', type: 'chips', label: 'نیتریت',
            options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }],
          },
          {
            id: 'culture', type: 'chips', label: 'کشت ادرار',
            options: [
              { v: 'negative', l: 'منفی' },
              { v: 'positive', l: 'مثبت' },
              { v: 'pending', l: 'جواب نیامده' },
            ],
          },
        ],
      },
    ],

    // ---------- GATE 0: red flags (any one fires) ----------
    redFlags: [
      { id: 'R1', label: 'تب ۳۸ درجه یا بیشتر', when: { field: 'temp', op: '>=', value: 38 },
        src: { page: '476', type: 'expert', note: 'Cystitis is afebrile; fever with systemic illness is upper UTI' } },
      { id: 'R2', label: 'درد پهلو یا تندرنس زاویه دنده‌ای-مهره‌ای', when: { field: 'flank', op: '==', value: 'yes' },
        src: { page: '476', type: 'guideline', note: 'Presenting feature of upper UTI' } },
      { id: 'R3', label: 'لرز شدید', when: { field: 'alarm', op: 'includes', value: 'rigors' },
        src: { page: '—', type: 'expert' } },
      { id: 'R4', label: 'تهوع یا استفراغ', when: { field: 'alarm', op: 'includes', value: 'vomiting' },
        src: { page: '476', type: 'guideline', note: 'AWaRe separates mild upper UTI (no vomiting) from severe' } },
      { id: 'R5', label: 'اختلال هوشیاری یا گیجی جدید', when: { field: 'alarm', op: 'includes', value: 'confusion' },
        src: { page: '297', type: 'expert', note: 'Sepsis box; same flag as the cough flow' } },
      { id: 'R6', label: 'افت فشار خون', when: { any: [
          { field: 'sbp', op: '<', value: 90 },
          { field: 'dbp', op: '<=', value: 60 },
        ] },
        src: { page: '297', type: 'expert', note: 'Same thresholds as the cough flow' } },
      { id: 'R7', label: 'تعداد تنفس بیش از ۳۰', when: { field: 'rr', op: '>', value: 30 },
        src: { page: '297', type: 'expert', note: 'Same threshold as the cough flow' } },
      { id: 'R8', label: 'ناتوانی در تحمل مایعات یا داروی خوراکی', when: { field: 'alarm', op: 'includes', value: 'no_oral' },
        src: { page: '—', type: 'expert', note: 'Oral therapy is the premise of ch. 23' } },
    ],
    redFlagRule: { src: { page: '476, 297', type: 'expert', note: 'Any single flag means this is not simple cystitis: refer or admit' } },

    // ---------- FINDINGS ----------
    findings: [
      { id: 'S1', label: 'تابلوی بالینی سازگار با سیستیت', record: 'علائم ادراری', fixPage: 'symptoms',
        when: { any: [
          { field: 'symptoms', op: 'includes', value: 'dysuria' },
          { field: 'symptoms', op: 'includes', value: 'urgency' },
          { field: 'symptoms', op: 'includes', value: 'frequency' },
        ] },
        src: { page: '280, 285', type: 'expert', note: 'AWaRe lists the symptoms but sets no threshold; team decision = any one of dysuria, urgency, frequency' } },
      { id: 'L1', label: 'پیوری (۵ یا بیشتر WBC در HPF)', record: 'گلبول سفید ادرار', fixPage: 'labs',
        when: { field: 'wbc_hpf', op: '>=', value: 5 },
        src: { page: '286', type: 'expert', note: 'AWaRe states > 10 leucocytes/uL; 5 WBC/HPF is the team conversion for Iranian lab reporting' } },
      { id: 'L2', label: 'کشت ادرار مثبت', record: 'کشت ادرار', fixPage: 'labs',
        when: { field: 'culture', op: '==', value: 'positive', unknownIf: ['pending'] },
        src: { page: '281', type: 'guideline' } },
      { id: 'N1', label: 'نیتریت مثبت', informativeOnly: true, fixPage: 'labs',
        when: { field: 'nitrite', op: '==', value: 'positive' },
        src: { page: '286', type: 'guideline', note: 'Indirect sign only; never decisive in this flow' } },
    ],

    // ---------- RULES: top to bottom, first match wins ----------
    rules: [
      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '—', type: 'expert', note: 'Prototype scope: adults only' } },

      { id: 'RULE_NOT_ACUTE', outcome: 'not_acute',
        when: { field: 'duration_days', op: '>=', value: 7 },
        src: { page: '280, 285', type: 'guideline', note: 'AWaRe defines cystitis as acute, less than 1 week' } },

      { id: 'RULE_NOT_COMPATIBLE', outcome: 'no_antibiotic',
        when: { finding: 'S1', is: false },
        src: { page: '281, 289', type: 'guideline', note: 'Treatment requires a compatible clinical presentation' } },

      { id: 'RULE_TEST_NEG', outcome: 'no_antibiotic',
        when: { all: [
          { finding: 'L1', is: false },
          { none: [{ finding: 'L2', is: true }] },
        ] },
        src: { page: '280, 286', type: 'guideline', note: 'Absence of urine leucocytes has good negative predictive value' } },

      { id: 'RULE_PREGNANT', outcome: 'abx_pregnant',
        when: { field: 'group', op: '==', value: 'pregnant' },
        src: { page: '281, 291', type: 'guideline', note: 'Pregnant women usually 5 days' } },

      { id: 'RULE_MALE', outcome: 'abx_male',
        when: { field: 'group', op: '==', value: 'male' },
        src: { page: '281, 291', type: 'guideline', note: 'Men usually 7 days (footnote d), overriding the 5-day cell of Table 23.5' } },

      { id: 'RULE_FEMALE', outcome: 'abx_female',
        when: { field: 'group', op: '==', value: 'female' },
        src: { page: '290, 291', type: 'guideline' } },

      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert', note: 'Reached when the patient group is not recorded' } },
    ],

    // ---------- TRAPS ----------
    traps: [
      { id: 'T1', title: 'ادرار کدر یا بدبو',
        text: 'ادرار کدر و ادرار بدبو به‌تنهایی نشانه قابل اعتماد عفونت ادراری نیستند و دلیل تجویز آنتی‌بیوتیک نیستند.',
        when: { any: [
          { field: 'symptoms', op: 'includes', value: 'cloudy_urine' },
          { field: 'symptoms', op: 'includes', value: 'smelly_urine' },
        ] },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '285', type: 'guideline' } },

      { id: 'T2', title: 'باکتریوری بدون علامت',
        text: 'کشت ادرار مثبت در بیمار بدون علامت یعنی کلونیزاسیون، نه عفونت، و درمان نمی‌خواهد؛ تنها استثناها بارداری و اعمال اورولوژیک با احتمال خونریزی است.',
        when: { all: [
          { finding: 'L2', is: true },
          { finding: 'S1', is: false },
        ] },
        showFor: ['no_antibiotic'],
        src: { page: '280, 286', type: 'guideline' } },

      { id: 'T3', title: 'لکوسیتوری به‌تنهایی',
        text: 'ارزش اخباری مثبت لکوسیتوری پایین است؛ لکوسیتوری بدون علامت اندیکاسیون آنتی‌بیوتیک نیست.',
        when: { all: [
          { finding: 'L1', is: true },
          { finding: 'S1', is: false },
        ] },
        showFor: ['no_antibiotic'],
        src: { page: '280, 286', type: 'guideline' } },

      { id: 'T4', title: 'انتظار تسکین سریع با آنتی‌بیوتیک',
        text: 'آنتی‌بیوتیک مدت علائم را تنها حدود ۲ روز کوتاه می‌کند.',
        when: { always: true },
        showFor: ['no_antibiotic'],
        src: { page: '289', type: 'guideline' } },

      { id: 'T5', title: 'علائم غیراختصاصی در سالمند',
        text: 'افتادن و تغییر وضعیت هوشیاری در سالمند شواهد قابل اعتمادی برای عفونت ادراری نیستند؛ تنها تغییر حاد علائم ادراری نسبت به وضعیت پایه قابل اتکاست. (این به معنای بی‌اهمیت بودن گیجی نیست؛ گیجی جدید باید جداگانه بررسی شود.)',
        when: { field: 'age', op: '>=', value: 65 },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '280, 285', type: 'guideline' } },
    ],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارجاع یا بستری',
        summary: 'یافته هشداردهنده وجود دارد. این تابلو سیستیت ساده نیست و با این ابزار سرپایی مدیریت نمی‌شود.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'تب، درد پهلو، لرز یا استفراغ مطرح‌کننده پیلونفریت است؛ بیمار را ارزیابی و ارجاع دهید.', src: { page: '476', type: 'guideline' } },
            { t: 'گیجی، افت فشار، تاکی‌پنه یا ناتوانی در تحمل خوراکی مطرح‌کننده سپسیس یا نیاز به درمان وریدی است؛ بستری لازم است.', src: { page: '297, 477', type: 'expert' } },
            { t: 'در زن باردار، پیلونفریت همیشه نیازمند بستری است.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر طراحی شده است. دوز کودکان بر پایه وزن است و در این نسخه وارد نشده.',
        sections: [],
      },

      not_acute: {
        tone: 'neutral',
        verdict: 'خارج از تعریف سیستیت حاد',
        summary: 'AWaRe سیستیت را علائم حاد با طول کمتر از یک هفته تعریف می‌کند. با علائم یک هفته یا بیشتر، تشخیص را دوباره بررسی کنید.',
        summarySrc: { page: '280, 285', type: 'guideline' },
        sections: [
          { title: 'به چه چیزی فکر کنید', items: [
            { t: 'عفونت درمان‌نشده یا مقاوم، پیلونفریت، پروستاتیت در مرد، سندرم مثانه دردناک، واژینیت یا اورتریت، و علل غیرعفونی.', src: { page: '—', type: 'expert' } },
            { t: 'کشت ادرار بفرستید و بر اساس نتیجه تصمیم بگیرید.', src: { page: '280', type: 'guideline' } },
          ] },
        ],
      },

      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'معیارهای شروع آنتی‌بیوتیک برآورده نشده است. درمان حمایتی کافی است.',
        summarySrc: { page: '281, 289', type: 'guideline' },
        showTraps: true,
        sections: [
          ANALGESIA,
          { title: 'به بیمار بگویید', items: [
            { t: 'اگر علائم ادراری واضح شد یا بدتر شد، باید دوباره ویزیت شود.', src: { page: '—', type: 'expert' } },
            { t: 'خوددرمانی با آنتی‌بیوتیک باقی‌مانده از نسخه‌های قبلی خطرناک است و باید از آن پرهیز کند.', src: { page: '289', type: 'guideline' } },
          ] },
          FOLLOWUP,
        ],
      },

      abx_female: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'تابلوی بالینی سازگار با سیستیت حاد در زن غیرباردار. درمان خوراکی سرپایی.',
        summarySrc: { page: '281, 289', type: 'guideline' },
        rx: {
          title: 'درمان آنتی‌بیوتیکی',
          src: { page: '290, 291', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول — ۵ روز', drugs: [
              { name: 'Nitrofurantoin (modified release)', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
              { name: 'Nitrofurantoin (immediate release)', dose: '50 mg', route: 'PO', freq: 'q6h', aware: 'Access' },
            ] },
            { label: 'جایگزین — ۳ تا ۵ روز', drugs: [
              { name: 'Amoxicillin + clavulanic acid', dose: '500 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
            ] },
            { label: 'جایگزین — ۳ روز', drugs: [
              { name: 'Sulfamethoxazole + trimethoprim', dose: '800 + 160 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
              { name: 'Trimethoprim', dose: '200 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: ADVERSE,
        },
        sections: [
          { title: 'پیش از تجویز نیتروفورانتوئین', items: [NITRO_CAUTION] },
          { title: 'نکته انتخاب دارو', items: [
            { t: 'نیتروفورانتوئین داروی ارجح سیستیت حاد است و روی اغلب ایزوله‌های مولد ESBL هم مؤثر است. مقاومت به کوتریموکسازول و تری‌متوپریم در بسیاری از مناطق بالاست.', src: { page: '289, 291', type: 'guideline' } },
          ] },
          ANALGESIA,
          { title: 'گزینه تأخیر در شروع آنتی‌بیوتیک', items: [
            { t: 'در زن جوان غیرباردار که حال عمومی خوبی دارد، عفونت خفیف است و خودش می‌خواهد آنتی‌بیوتیک نگیرد یا به تأخیر بیندازد، می‌توان فقط درمان علامتی داد و نسخه آنتی‌بیوتیک را به‌صورت پشتیبان در اختیار او گذاشت تا در صورت نبود بهبود شروع کند.', src: { page: '287', type: 'guideline' } },
            { t: 'AWaRe «جوان» و «خفیف» را تعریف نکرده است؛ قضاوت با پزشک است.', src: { page: '—', type: 'expert' } },
          ] },
          { title: 'کشت ادرار', items: [CULTURE_ADVICE] },
          FOLLOWUP,
        ],
      },

      abx_male: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'تابلوی بالینی سازگار با سیستیت حاد در مرد. مدت درمان در مرد طولانی‌تر است.',
        summarySrc: { page: '281, 291', type: 'guideline' },
        rx: {
          title: 'درمان آنتی‌بیوتیکی',
          src: { page: '290, 291', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول — ۷ روز', drugs: [
              { name: 'Nitrofurantoin (modified release)', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
              { name: 'Nitrofurantoin (immediate release)', dose: '50 mg', route: 'PO', freq: 'q6h', aware: 'Access' },
            ] },
            { label: 'جایگزین — ۷ روز', drugs: [
              { name: 'Amoxicillin + clavulanic acid', dose: '500 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
              { name: 'Sulfamethoxazole + trimethoprim', dose: '800 + 160 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
              { name: 'Trimethoprim', dose: '200 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: ADVERSE,
        },
        sections: [
          { title: 'چرا ۷ روز', items: [
            { t: 'جدول ۲۳.۵ برای نیتروفورانتوئین ۵ روز می‌گوید، اما پانویس d همان جدول برای مردان معمولاً ۷ روز می‌گوید. تصمیم تیم: در مرد همه گزینه‌ها ۷ روز.', src: { page: '291', type: 'expert' } },
          ] },
          { title: 'پیش از تجویز نیتروفورانتوئین', items: [NITRO_CAUTION] },
          { title: 'نکته‌ای که AWaRe نگفته است', items: [
            { t: 'مرد بودن خودش در فهرست عوامل خطر عفونت پیچیده است (کادر ۲۳.۱). اگر تب، درد پرینه یا علائم پروستاتیت دارد، این تابلو سیستیت ساده نیست.', src: { page: '279', type: 'expert' } },
          ] },
          ANALGESIA,
          { title: 'کشت ادرار', items: [CULTURE_ADVICE] },
          FOLLOWUP,
        ],
      },

      abx_pregnant: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'تابلوی بالینی سازگار با سیستیت حاد در بارداری. درمان لازم است و انتخاب دارو محدودتر است.',
        summarySrc: { page: '281, 291', type: 'guideline' },
        rx: {
          title: 'درمان آنتی‌بیوتیکی — ۵ روز',
          src: { page: '281, 290, 291', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول', drugs: [
              { name: 'Nitrofurantoin (modified release)', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
              { name: 'Nitrofurantoin (immediate release)', dose: '50 mg', route: 'PO', freq: 'q6h', aware: 'Access' },
            ] },
            { label: 'جایگزین', drugs: [
              { name: 'Amoxicillin + clavulanic acid', dose: '500 + 125 mg', route: 'PO', freq: 'q8h', aware: 'Access' },
            ] },
          ],
          adverse: {
            src: { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' },
            items: [
              { name: 'Nitrofurantoin', common: 'تهوع، سردرد، تیره شدن ادرار', serious: 'واکنش ریوی حاد یا مزمن، نوروپاتی محیطی، هپاتوتوکسیسیته، همولیز در کمبود G6PD' },
              { name: 'Amoxicillin + clavulanic acid', common: 'اسهال، تهوع، راش', serious: 'کولیت C. difficile، هپاتیت کلستاتیک، آنافیلاکسی' },
            ],
          },
        },
        sections: [
          { title: 'پیش از تجویز نیتروفورانتوئین', items: [NITRO_CAUTION] },
          { title: 'آنچه در بارداری توصیه نمی‌شود', items: [
            { t: 'Sulfamethoxazole + trimethoprim در سه‌ماهه اول توصیه نمی‌شود.', src: { page: '291', type: 'guideline' } },
            { t: 'Trimethoprim هم آنتاگونیست فولات است؛ تیم آن را در سه‌ماهه اول کنار می‌گذارد، هرچند AWaRe این را صریح نگفته است.', src: { page: '—', type: 'expert' } },
            { t: 'Ibuprofen و سایر NSAIDها در بارداری، به‌ویژه سه‌ماهه سوم، توصیه نمی‌شوند؛ برای درد فقط Paracetamol بدهید.', src: { page: '—', type: 'expert' } },
          ] },
          { title: 'کنترل درد', items: [
            { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد یا سیروز حداکثر ۲ گرم.', src: { page: '288', type: 'guideline' } },
          ] },
          { title: 'کشت ادرار', items: [
            { t: 'در بارداری کشت ادرار بفرستید؛ بارداری در فهرست عوامل خطر عفونت پیچیده است و باکتریوری بدون علامت هم در بارداری باید درمان شود.', src: { page: '279, 286', type: 'guideline' } },
          ] },
          FOLLOWUP,
        ],
      },

      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'برای تعیین مدت درمان، گروه بیمار لازم است. در صفحه شرح حال مشخص کنید بیمار مرد است، زن غیرباردار، یا زن باردار.',
        showMissing: false,
        showTraps: true,
        sections: [],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
