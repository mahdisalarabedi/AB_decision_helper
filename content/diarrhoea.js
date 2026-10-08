/* =====================================================================
   FOUNDATION — acute infectious diarrhoea / gastroenteritis, adults >= 18
   Source: WHO AWaRe antibiotic book (2022), ch. 14, pp. 169-183.
   Routing targets: ch. 15 enteric fever (p. 185), ch. 33 C. difficile (p. 464).
   Status: PROTOTYPE, NOT VALIDATED.
   Team decisions in this file:
     - "Significant bloody diarrhoea" and "severely immunocompromised" are
       left to the prescriber's judgement, as AWaRe defines neither.
     - Cholera, enteric fever and C. difficile are DETECTED AND ROUTED here,
       each with its own ending; full flows come later.
     - The cholera ending rehydrates, refers and notifies; Table 14.7 is shown
       for reference, because AWaRe's cholera indications assume a treatment
       centre (hospitalized, 4-hour rehydration course), not a GP office.
     - Cholera first line = azithromycin or doxycycline (Table 14.7, p. 183).
     - Dehydration severity uses Table 14.4 as written, although that table
       comes from the paediatric pocket book.
   PENDING SUPERVISOR (D4 / N3): local fluoroquinolone resistance.
     Change ONE line -- setting.fqResistance -- to switch the first choice.
       'low'  -> ciprofloxacin first (AWaRe default, currently active)
       'high' -> azithromycin first (AWaRe footnote c, p. 183)
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  const FQ_WARNING = {
    t: '⚠ فلوروکینولون‌ها (مانند سیپروفلوکساسین) عوارض مهمی دارند: اختلالات روانی مانند گیجی، بی‌قراری، اختلال حافظه و دلیریوم؛ اختلال شدید قند خون تا کمای هیپوگلیسمیک؛ افزایش خطر تاندینیت و پارگی تاندون؛ تشدید میاستنی گراویس؛ و نوروپاتی بالقوه برگشت‌ناپذیر.',
    src: { page: '182', type: 'guideline' },
  };
  const AZITHRO_QT = {
    t: '⚠ آزیترومایسین می‌تواند فعالیت الکتریکی قلب را مختل کند و آریتمی کشنده ایجاد کند، به‌ویژه در بیماران با QT طولانی یا سابقه آریتمی.',
    src: { page: '183', type: 'guideline' },
  };
  const REHYDRATION = {
    title: 'آبرسانی — درمان اصلی',
    items: [
      { t: 'در بزرگسال معمولاً ORS لازم نیست؛ نوشیدن مایعات کافی برای جایگزینی دفع، به‌علاوه ادامه تغذیه معمول کافی است.', src: { page: '180', type: 'guideline' } },
      { t: 'در دهیدراتاسیون شدید، ORS یا مایع وریدی لازم است.', src: { page: '180', type: 'guideline' } },
    ],
  };
  const NO_ANTIMOTILITY = {
    t: 'داروهای ضداسهال و ضدتهوع به‌طور معمول لازم نیستند؛ نه از دهیدراتاسیون جلوگیری می‌کنند و نه وضعیت تغذیه را بهتر می‌کنند.',
    src: { page: '172, 180', type: 'guideline' },
  };
  const METRO_STEPUP = {
    t: 'اگر علائم ظرف ۲۴ تا ۴۸ ساعت پس از شروع آنتی‌بیوتیک برطرف نشد، به Entamoeba histolytica یا Giardia فکر کنید و افزودن مترونیدازول را در نظر بگیرید.',
    src: { page: '172, 180', type: 'guideline' },
  };

  ABX.flows.diarrhoea = {
    id: 'diarrhoea',
    title: 'اسهال حاد در بزرگسال',

    // Team setting. See the header note (D4 / N3).
    setting: { fqResistance: 'low' },

    // ---------- PAGES ----------
    pages: [
      {
        id: 'history',
        title: 'شرح حال',
        fields: [
          { id: 'age', type: 'number', label: 'سن بیمار', unit: 'سال' },
          { id: 'duration_days', type: 'number', label: 'مدت اسهال', unit: 'روز' },
          {
            id: 'stool', type: 'chips', label: 'شکل مدفوع',
            options: [{ v: 'watery', l: 'آبکی' }, { v: 'bloody', l: 'خونی' }],
          },
          {
            id: 'bloody_severe', type: 'chips',
            label: 'اگر خونی است: به قضاوت شما اسهال خونی قابل‌توجه یا شدید است؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
        ],
      },
      {
        id: 'context',
        title: 'زمینه و مواجهه',
        fields: [
          {
            id: 'recent_abx', type: 'chips', label: 'مصرف آنتی‌بیوتیک در ۳ ماه گذشته',
            options: [{ v: 'no', l: 'نداشته' }, { v: 'yes', l: 'داشته' }],
          },
          {
            id: 'immuno', type: 'chips', label: 'به قضاوت شما بیمار به‌شدت دچار نقص ایمنی است؟',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          {
            id: 'cholera_setting', type: 'chips', label: 'منطقه اندمیک وبا یا طغیان فعلی وبا',
            options: [{ v: 'no', l: 'خیر' }, { v: 'yes', l: 'بله' }],
          },
          {
            id: 'cholera_risk', type: 'search', label: 'شرایط همراه مهم در وبا', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'pregnancy', l: 'بارداری' },
              { v: 'malnutrition', l: 'سوءتغذیه شدید' },
              { v: 'hiv', l: 'عفونت HIV' },
              { v: 'high_purging', l: 'دفع بسیار زیاد یا شکست آبرسانی ۴ ساعت اول' },
            ],
          },
        ],
      },
      {
        id: 'exam',
        title: 'تب، دهیدراتاسیون و علائم هشدار',
        hint: 'هر موردی را که بررسی نکرده‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'دمای بدن', unit: '°C', step: 'decimal' },
          { id: 'fever_days', type: 'number', label: 'مدت تب ۳۸ درجه یا بالاتر', unit: 'روز' },
          { id: 'sbp', type: 'number', label: 'فشار سیستولیک', unit: 'mmHg' },
          {
            id: 'dehydration_signs', type: 'search', label: 'نشانه‌های دهیدراتاسیون', placeholder: 'هر مورد موجود را انتخاب کنید',
            options: [
              { v: 'lethargy', l: 'بی‌حالی یا کاهش هوشیاری' },
              { v: 'sunken_eyes', l: 'گودافتادگی چشم‌ها' },
              { v: 'cannot_drink', l: 'ناتوانی در نوشیدن' },
              { v: 'skin_pinch', l: 'برگشت چین پوست ۲ ثانیه یا بیشتر' },
            ],
          },
          {
            id: 'alarm', type: 'search', label: 'یافته‌های هشدار دیگر', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'peritonitis', l: 'درد شدید شکم با تندرنس ریباند یا سفتی شکم' },
              { v: 'encephalopathy', l: 'انسفالوپاتی' },
            ],
          },
        ],
      },
    ],

    // ---------- GATE 0 ----------
    redFlags: [
      { id: 'R1', label: 'دهیدراتاسیون شدید', when: { score: 'dehydration', band: 'severe' },
        src: { page: '171, 178', type: 'expert', note: 'Table 14.4 severe dehydration = 2 or more signs; needs IV rehydration, not an antibiotic' } },
      { id: 'R2', label: 'علائم پریتونیت یا پرفوراسیون', when: { field: 'alarm', op: 'includes', value: 'peritonitis' },
        src: { page: '186', type: 'guideline', note: 'ch. 15 severe enteric fever: perforation/peritonitis' } },
      { id: 'R3', label: 'انسفالوپاتی', when: { field: 'alarm', op: 'includes', value: 'encephalopathy' },
        src: { page: '186', type: 'guideline', note: 'ch. 15: encephalopathy occurs in severe cases' } },
      { id: 'R4', label: 'افت فشار خون', when: { field: 'sbp', op: '<', value: 90 },
        src: { page: '297', type: 'expert', note: 'Same threshold as the other flows' } },
    ],
    redFlagRule: { src: { page: '178, 186', type: 'expert', note: 'Any single flag means this is not an uncomplicated outpatient case' } },

    // ---------- SCORES ----------
    scores: {
      dehydration: {
        label: 'شدت دهیدراتاسیون',
        src: { page: '171, 178', type: 'guideline', note: 'Table 14.4; severe = 2 or more of the four signs' },
        items: [
          { label: 'بی‌حالی یا کاهش هوشیاری', record: 'نشانه‌های دهیدراتاسیون', fixPage: 'exam', needs: 'dehydration_signs', when: { field: 'dehydration_signs', op: 'includes', value: 'lethargy' } },
          { label: 'گودافتادگی چشم‌ها', record: 'نشانه‌های دهیدراتاسیون', fixPage: 'exam', needs: 'dehydration_signs', when: { field: 'dehydration_signs', op: 'includes', value: 'sunken_eyes' } },
          { label: 'ناتوانی در نوشیدن', record: 'نشانه‌های دهیدراتاسیون', fixPage: 'exam', needs: 'dehydration_signs', when: { field: 'dehydration_signs', op: 'includes', value: 'cannot_drink' } },
          { label: 'برگشت چین پوست ۲ ثانیه یا بیشتر', record: 'نشانه‌های دهیدراتاسیون', fixPage: 'exam', needs: 'dehydration_signs', when: { field: 'dehydration_signs', op: 'includes', value: 'skin_pinch' } },
        ],
        bands: [
          { id: 'none', min: 0, max: 1, text: 'دهیدراتاسیون شدید نیست' },
          { id: 'severe', min: 2, max: 4, text: 'دهیدراتاسیون شدید' },
        ],
      },
    },

    // ---------- FINDINGS ----------
    findings: [
      { id: 'F1', label: 'اسهال خونی', record: 'شکل مدفوع', fixPage: 'history',
        when: { field: 'stool', op: '==', value: 'bloody' },
        src: { page: '171', type: 'guideline' } },
      { id: 'F2', label: 'اسهال خونی قابل‌توجه (قضاوت پزشک)', record: 'شدت اسهال خونی', fixPage: 'history',
        when: { field: 'bloody_severe', op: '==', value: 'yes' },
        src: { page: '172, 180, 181', type: 'guideline', note: 'AWaRe says "significant"/"severe" bloody diarrhoea but defines no threshold; team decision = leave it to the prescriber' } },
      { id: 'F3', label: 'نقص ایمنی شدید (قضاوت پزشک)', record: 'وضعیت ایمنی', fixPage: 'context',
        when: { field: 'immuno', op: '==', value: 'yes' },
        src: { page: '172, 180, 181', type: 'guideline', note: 'AWaRe gives no criteria; team decision = leave it to the prescriber' } },
      { id: 'F4', label: 'مصرف آنتی‌بیوتیک در ۳ ماه گذشته', record: 'سابقه آنتی‌بیوتیک', fixPage: 'context',
        when: { field: 'recent_abx', op: '==', value: 'yes' },
        src: { page: '177, 179, 464', type: 'guideline' } },
      { id: 'F5', label: 'تب ۳۸ درجه یا بالاتر بیش از ۳ روز', record: 'مدت تب', fixPage: 'exam',
        when: { field: 'fever_days', op: '>', value: 3 },
        src: { page: '186', type: 'guideline', note: 'ch. 15 clinical presentation: protracted fever >= 38.0 for > 3 days' } },
      { id: 'F6', label: 'زمینه اندمیک یا طغیان وبا', record: 'زمینه وبا', fixPage: 'context',
        when: { field: 'cholera_setting', op: '==', value: 'yes' },
        src: { page: '169, 171', type: 'guideline' } },
    ],

    // ---------- RULES: first match wins ----------
    rules: [
      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '—', type: 'expert', note: 'Prototype scope: adults only' } },

      { id: 'RULE_PERSISTENT', outcome: 'persistent',
        when: { field: 'duration_days', op: '>=', value: 14 },
        src: { page: '170', type: 'guideline', note: 'Acute diarrhoea is onset within the previous 14 days' } },

      { id: 'RULE_CDIFF', outcome: 'route_cdiff',
        when: { finding: 'F4', is: true },
        src: { page: '177, 179, 464', type: 'guideline', note: 'Most C. difficile infection occurs with current or recent antibiotic use' } },

      { id: 'RULE_ENTERIC', outcome: 'route_enteric',
        when: { finding: 'F5', is: true },
        src: { page: '186', type: 'guideline', note: 'Protracted fever > 3 days is the enteric fever signal; fever alone is NOT an antibiotic indication in diarrhoea' } },

      { id: 'RULE_CHOLERA', outcome: 'cholera',
        when: { all: [{ finding: 'F6', is: true }, { finding: 'F1', is: false }] },
        src: { page: '169, 171, 181', type: 'guideline', note: 'Cholera is watery; bloody diarrhoea routes to the dysentery rules instead' } },

      { id: 'RULE_BLOODY', outcome: 'antibiotic_indicated',
        when: { finding: 'F2', is: true },
        src: { page: '172, 180, 181', type: 'guideline' } },

      { id: 'RULE_IMMUNO', outcome: 'antibiotic_indicated',
        when: { finding: 'F3', is: true },
        src: { page: '172, 180, 181', type: 'guideline' } },

      { id: 'RULE_NO_ANTIBIOTIC', outcome: 'no_antibiotic',
        when: { all: [
          { finding: 'F2', is: false },
          { finding: 'F3', is: false },
        ] },
        src: { page: '169, 172, 180', type: 'guideline', note: 'Antibiotics are not needed in the great majority of cases, with or without fever' } },

      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert', note: 'Reached when the two judgement questions are unanswered' } },
    ],

    // ---------- TRAPS ----------
    traps: [
      { id: 'T1', title: 'تب دلیل تجویز آنتی‌بیوتیک نیست',
        text: 'در اکثریت قاطع موارد اسهال آبکی، با تب یا بدون تب، آنتی‌بیوتیک لازم نیست. بیشتر موارد ویروسی و خودمحدودشونده‌اند.',
        when: { any: [
          { field: 'temp', op: '>=', value: 38 },
          { field: 'fever_days', op: '>=', value: 1 },
        ] },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '169, 172, 180', type: 'guideline' } },

      { id: 'T2', title: 'دهیدراتاسیون شدید اندیکاسیون آنتی‌بیوتیک نیست',
        text: 'حتی در دهیدراتاسیون شدید هم آنتی‌بیوتیک لازم نیست؛ آنچه لازم است آبرسانی است. دهیدراتاسیون محور شدت بیماری است، نه محور تصمیم آنتی‌بیوتیک.',
        when: { always: true },
        showFor: ['refer', 'no_antibiotic'],
        src: { page: '172, 180', type: 'guideline' } },

      { id: 'T3', title: 'داروهای ضداسهال',
        text: 'داروهای ضداسهال و ضدتهوع به‌طور معمول لازم نیستند و از دهیدراتاسیون جلوگیری نمی‌کنند.',
        when: { always: true },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '172, 180', type: 'guideline' } },

      { id: 'T4', title: 'نگرانی از سندرم همولیتیک اورمیک',
        text: 'اسهال خونی ممکن است ناشی از STEC باشد و از نظر تئوری آنتی‌بیوتیک خطر HUS را بالا می‌برد؛ با این حال AWaRe می‌گوید آنتی‌بیوتیک را دریغ نکنید، چون سود آن در شیگلوز روشن است.',
        when: { finding: 'F1', is: true },
        showFor: ['antibiotic_indicated'],
        src: { page: '180', type: 'guideline' } },

      { id: 'T5', title: 'کشت مدفوع برای همه لازم نیست',
        text: 'آزمایش مدفوع فقط در اسهال خونی، نقص ایمنی، شک به طغیان وبا، یا اسهال پس از مصرف آنتی‌بیوتیک (C. difficile) توصیه می‌شود.',
        when: { always: true },
        showFor: ['no_antibiotic'],
        src: { page: '179', type: 'guideline' } },
    ],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارجاع یا بستری',
        summary: 'یافته هشداردهنده وجود دارد. این بیمار با این ابزار سرپایی مدیریت نمی‌شود.',
        showTraps: true,
        sections: [
          { title: 'اقدام', items: [
            { t: 'دهیدراتاسیون شدید نیازمند ORS یا مایع وریدی فوری است. این وضعیت به‌خودی‌خود اندیکاسیون آنتی‌بیوتیک نیست.', src: { page: '172, 180', type: 'guideline' } },
            { t: 'پریتونیت، پرفوراسیون یا انسفالوپاتی مطرح‌کننده تب روده‌ای شدید است؛ بیمار را بستری کنید و پیش از شروع آنتی‌بیوتیک کشت خون بگیرید.', src: { page: '186, 187', type: 'guideline' } },
          ] },
          REHYDRATION,
        ],
      },

      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر است. در کودکان دوزها بر پایه وزن است و روی و ORS نقش محوری دارند.',
        sections: [],
      },

      persistent: {
        tone: 'neutral',
        verdict: 'اسهال پایدار — خارج از تعریف اسهال حاد',
        summary: 'AWaRe اسهال حاد را شروع در ۱۴ روز گذشته تعریف می‌کند. با علائم ۱۴ روز یا بیشتر، این الگوریتم کاربرد ندارد.',
        summarySrc: { page: '170', type: 'guideline' },
        sections: [
          { title: 'به چه چیزی فکر کنید', items: [
            { t: 'انگل‌ها (Giardia، Entamoeba histolytica)، بیماری التهابی روده، سوءجذب، و علل غیرعفونی.', src: { page: '—', type: 'expert' } },
            { t: 'آزمایش مدفوع بفرستید و بر اساس نتیجه تصمیم بگیرید.', src: { page: '179', type: 'guideline' } },
          ] },
        ],
      },

      route_cdiff: {
        tone: 'caution',
        verdict: 'به عفونت Clostridioides difficile فکر کنید',
        summary: 'بیمار در ۳ ماه گذشته آنتی‌بیوتیک گرفته است. بیشتر موارد عفونت C. difficile در بیماران با مصرف فعلی یا اخیر آنتی‌بیوتیک رخ می‌دهد.',
        summarySrc: { page: '464', type: 'guideline' },
        showTraps: false,
        sections: [
          { title: 'اقدام در مطب', items: [
            { t: 'اگر عفونت C. difficile مشکوک یا تأیید شد، همه آنتی‌بیوتیک‌هایی را که لازم نیستند قطع کنید.', src: { page: '464', type: 'guideline' } },
            { t: 'آزمایش مدفوع برای C. difficile بفرستید.', src: { page: '179', type: 'guideline' } },
            { t: 'درمان اختصاصی در فصل ۳۳ کتاب AWaRe (صفحه ۴۶۴) آمده است؛ آن فصل در بخش بیمارستانی است و در این نسخه پیاده‌سازی نشده.', src: { page: '464', type: 'expert' } },
            { t: 'بدتر شدن بیمار با وجود درمان مناسب یعنی نیاز به تشدید درمان و مشاوره جراحی.', src: { page: '464', type: 'guideline' } },
          ] },
          REHYDRATION,
          { title: 'توجه', items: [
            { t: 'اگر سابقه آنتی‌بیوتیک ارتباطی با این اسهال ندارد، پاسخ آن سؤال را اصلاح کنید تا مسیر تصمیم تغییر کند.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      route_enteric: {
        tone: 'caution',
        verdict: 'به تب روده‌ای (انتریک فیور) فکر کنید',
        summary: 'تب ۳۸ درجه یا بالاتر بیش از ۳ روز، الگوی تب روده‌ای است نه گاستروانتریت ساده. اسهال در تب روده‌ای شایع است.',
        summarySrc: { page: '186, 187', type: 'guideline' },
        showTraps: false,
        sections: [
          { title: 'اقدام در مطب', items: [
            { t: 'تمایز تب روده‌ای از سایر بیماری‌های تب‌دار اغلب دشوار است؛ شرح حال سفر، آب و غذای آلوده و درد شکم را بپرسید.', src: { page: '185, 186', type: 'guideline' } },
            { t: 'به محض شک به تشخیص، درمان آنتی‌بیوتیکی باید شروع شود؛ تأخیر خطر عوارض و بیماری شدید را بالا می‌برد.', src: { page: '186', type: 'guideline' } },
            { t: 'سرولوژی ویدال روش قابل اعتمادی برای تشخیص بیماری حاد نیست؛ نتیجه مثبت ممکن است از عفونت قبلی باشد.', src: { page: '186, 187', type: 'guideline' } },
            { t: 'در موارد شدید (بیمار بدحال، شک به پرفوراسیون، پریتونیت، سپسیس یا شوک سپتیک) پیش از شروع آنتی‌بیوتیک کشت خون بگیرید و بیمار را بستری کنید.', src: { page: '186', type: 'guideline' } },
            { t: 'انتخاب آنتی‌بیوتیک به شدت بیماری و میزان مقاومت محلی به فلوروکینولون‌ها بستگی دارد و در فصل ۱۵ (صفحه ۱۸۵) آمده است؛ در این نسخه پیاده‌سازی نشده.', src: { page: '185, 186', type: 'expert' } },
          ] },
          REHYDRATION,
        ],
      },

      cholera: {
        tone: 'caution',
        verdict: 'به وبا فکر کنید — آبرسانی، ارجاع و گزارش',
        summary: 'اسهال آبکی در زمینه اندمیک یا طغیان وبا. مهم‌ترین اقدام آبرسانی است؛ آنتی‌بیوتیک فقط در زمینه طغیان و برای کاهش انتقال داده می‌شود.',
        summarySrc: { page: '169', type: 'guideline' },
        showTraps: false,
        sections: [
          { title: 'اقدام در مطب', items: [
            { t: 'آبرسانی تهاجمی را شروع کنید و بیمار را به مرکز درمان وبا ارجاع دهید. مورد مشکوک را طبق مقررات کشوری گزارش کنید.', src: { page: '—', type: 'expert' } },
            { t: 'اندیکاسیون‌های آنتی‌بیوتیک در وبا در متن AWaRe برای مرکز درمانی نوشته شده است (بستری با دهیدراتاسیون شدید، شکست آبرسانی ۴ ساعت اول)؛ در مطب معمولاً قابل ارزیابی نیستند. جدول زیر برای ارجاع و اطلاع آورده شده است، نه به‌عنوان نسخه.', src: { page: '181, 183', type: 'expert' } },
          ] },
          { title: 'اندیکاسیون‌های آنتی‌بیوتیک در وبا (AWaRe صفحه ۱۸۱)', items: [
            { t: 'شک به وبا در بیمار بستری با دهیدراتاسیون شدید.', src: { page: '181', type: 'guideline' } },
            { t: 'بدون توجه به شدت دهیدراتاسیون: دفع بسیار زیاد یا شکست دوره آبرسانی ۴ ساعت اول.', src: { page: '181', type: 'guideline' } },
            { t: 'بدون توجه به شدت دهیدراتاسیون: شرایط همراه مانند بارداری.', src: { page: '181', type: 'guideline' } },
            { t: 'بدون توجه به شدت دهیدراتاسیون: بیماری‌های زمینه‌ای پرخطر در وبا مانند سوءتغذیه شدید یا عفونت HIV.', src: { page: '181', type: 'guideline' } },
            { t: 'فهرست کامل اندیکاسیون‌ها در AWaRe نیامده و به سند فنی GTFCC ارجاع داده شده است.', src: { page: '183', type: 'guideline' } },
          ] },
          { title: 'رژیم‌های دارویی وبا در بزرگسال — جدول ۱۴.۷ (برای اطلاع)', items: [
            { rx: 'Azithromycin 1 g PO — تک‌دوز', t: 'انتخاب اول.', src: { page: '183', type: 'guideline' } },
            { rx: 'Doxycycline 300 mg PO — تک‌دوز', t: 'انتخاب اول. اگر تک‌دوز تحمل نشد: 100 mg هر ۱۲ ساعت به مدت ۳ روز.', src: { page: '183', type: 'guideline' } },
            { rx: 'Ciprofloxacin 1 g PO — تک‌دوز', t: 'انتخاب دوم.', src: { page: '183', type: 'guideline' } },
            AZITHRO_QT,
            FQ_WARNING,
          ] },
          REHYDRATION,
        ],
      },

      antibiotic_indicated: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'فقط بخشی از موارد اسهال از آنتی‌بیوتیک سود می‌برند: اسهال خونی قابل‌توجه و بیماران با نقص ایمنی شدید.',
        summarySrc: { page: '181', type: 'guideline' },
        showTraps: true,
        rx: {
          title: 'درمان آنتی‌بیوتیکی',
          src: { page: '181, 182', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول — ۳ روز', drugs: [
              { name: 'Ciprofloxacin', dose: '500 mg', route: 'PO', freq: 'q12h', aware: 'Watch' },
            ] },
            { label: 'انتخاب دوم — خوراکی', drugs: [
              { name: 'Azithromycin (500 mg d1, then 250 mg d2–4)', dose: '500 / 250 mg', route: 'PO', freq: 'q24h', aware: 'Watch' },
              { name: 'Cefixime — 3 روز', dose: '400 mg', route: 'PO', freq: 'q24h', aware: 'Watch' },
              { name: 'Sulfamethoxazole + trimethoprim — 5 روز', dose: '800 + 160 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
            { label: 'انتخاب دوم — تزریقی، ۳ روز', drugs: [
              { name: 'Ceftriaxone', dose: '1 g', route: 'IV/IM', freq: 'q24h', aware: 'Watch' },
            ] },
          ],
          adverse: {
            src: { page: '182, 183', type: 'guideline' },
            items: [
              { name: 'Ciprofloxacin', common: 'تهوع، اسهال، سردرد', serious: 'اختلالات روانی و دلیریوم، اختلال شدید قند خون، تاندینیت و پارگی تاندون، تشدید میاستنی گراویس، نوروپاتی بالقوه برگشت‌ناپذیر' },
              { name: 'Azithromycin', common: 'تهوع، درد شکم، اسهال', serious: 'طولانی شدن QT و آریتمی کشنده، به‌ویژه با QT طولانی یا سابقه آریتمی' },
              { name: 'Cefixime', common: 'اسهال، راش', serious: 'کولیت C. difficile، آنافیلاکسی' },
              { name: 'Sulfamethoxazole + trimethoprim', common: 'راش، تهوع', serious: 'سندرم استیونس-جانسون و TEN، سرکوب مغز استخوان، هیپرکالمی، آسیب حاد کلیه' },
              { name: 'Ceftriaxone', common: 'درد محل تزریق، اسهال', serious: 'کولیت C. difficile، آنافیلاکسی، سلادج صفراوی' },
            ],
          },
        },
        sections: [
          { title: 'نکات انتخاب دارو', items: [
            { t: 'اگر مقاومت به سیپروفلوکساسین در Shigella و Salmonella غیرتیفوئیدی در منطقه شما بالاست، آزیترومایسین ارجح است. این تنظیم در فایل محتوا با یک خط تغییر می‌کند و هنوز توسط استاد راهنما تأیید نشده است.', src: { page: '183', type: 'guideline' } },
            { t: 'سفیکسیم، سفتریاکسون و کوتریموکسازول روی Campylobacter مؤثر نیستند.', src: { page: '183', type: 'guideline' } },
            { t: 'کوتریموکسازول را فقط در صورتی بدهید که داده‌های محلی حساسیت را نشان دهند؛ طبق راهنمای WHO 2005 نباید در شک به شیگلوز به‌صورت تجربی استفاده شود.', src: { page: '183', type: 'guideline' } },
            FQ_WARNING,
            AZITHRO_QT,
          ] },
          { title: 'اگر بهبود نیافت', items: [METRO_STEPUP] },
          { title: 'آزمایش', items: [
            { t: 'در اسهال خونی و در بیماران با نقص ایمنی، کشت مدفوع و تست حساسیت توصیه می‌شود.', src: { page: '179', type: 'guideline' } },
          ] },
          REHYDRATION,
        ],
      },

      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'در اکثریت قاطع موارد اسهال حاد، با تب یا بدون تب، آنتی‌بیوتیک لازم نیست. بیشتر موارد ویروسی و خودمحدودشونده‌اند.',
        summarySrc: { page: '169, 172, 180', type: 'guideline' },
        diagnosis: 'گاستروانتریت حاد، به احتمال زیاد ویروسی.',
        diagnosisSrc: { page: '169, 180', type: 'guideline' },
        showTraps: true,
        sections: [
          REHYDRATION,
          { title: 'آنچه لازم نیست', items: [NO_ANTIMOTILITY] },
          { title: 'به بیمار بگویید', items: [
            { t: 'اگر مدفوع خونی شد، تب طولانی شد، نتوانست مایعات بنوشد، یا علائم دهیدراتاسیون پیدا کرد، باید برگردد.', src: { page: '—', type: 'expert' } },
            { t: 'اگر اسهال بیش از ۱۴ روز طول کشید، دوباره ارزیابی لازم است.', src: { page: '170', type: 'guideline' } },
          ] },
        ],
      },

      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'دو پرسش کلیدی بی‌پاسخ مانده است: آیا اسهال خونی قابل‌توجه است، و آیا بیمار نقص ایمنی شدید دارد. این دو تنها اندیکاسیون‌های آنتی‌بیوتیک در اسهال حاد هستند و قضاوت آنها با شماست.',
        summarySrc: { page: '181', type: 'guideline' },
        showMissing: false,
        showTraps: true,
        sections: [
          { title: 'چه چیزی لازم است', items: [
            { t: 'به دو پرسش صفحه شرح حال و زمینه پاسخ دهید: «اسهال خونی قابل‌توجه است؟» و «نقص ایمنی شدید دارد؟». تا وقتی این دو بی‌پاسخ بمانند، نمی‌توان گفت آنتی‌بیوتیک لازم است یا نه.', src: { page: '181', type: 'guideline' } },
          ] },
        ],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
