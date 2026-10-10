/* =====================================================================
   FOUNDATION — sexually transmitted infections, adults >= 18
   Source: WHO AWaRe antibiotic book (2022), ch. 19 chlamydia (pp. 230-240),
   ch. 20 gonorrhoea (pp. 241-253), ch. 21 syphilis (pp. 254-270),
   ch. 22 trichomoniasis (pp. 271-277).
   Status: PROTOTYPE, NOT VALIDATED.
   Team decisions in this file (all marked type: 'expert'):
     - Discharge / urethritis is treated as suspected gonorrhoea + chlamydia
       WITHOUT waiting for tests (common practice in our setting).
       Ceftriaxone + azithromycin covers both; this combination is our
       inference from ch. 19 + ch. 20, not an AWaRe sentence.
     - Gonorrhoea: dual therapy by default (AWaRe's rule when local resistance
       data are missing). CHANGE ONE LINE -- setting.gonoTherapy -- to 'single'
       only when local data confirm susceptibility.
     - Chlamydia alone: azithromycin 1 g listed first (local practice);
       AWaRe lists doxycycline first (p. 239) and says it works better when
       adherence is not a concern. Both are shown.
     - Syphilis: the prescriber states the stage (early / late / unknown).
       Unknown stage gets the late regimen, as AWaRe says (p. 268).
       A negative serology never excludes primary syphilis (p. 256).
     - Red flags are an expert list; AWaRe defines none (see redFlags).
     - Several infections at once: one result lists each regimen as a summary;
       run the flow again, one infection at a time, for full detail.
     - Out of scope: neonates, congenital syphilis, ophthalmia neonatorum,
       children under 18 (AWaRe: specialist advice, consider abuse).
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  // ---- Team setting (see header) ----
  const setting = { gonoTherapy: 'dual' };   // 'dual' | 'single'

  // ---- Reusable conditions ----
  const POS = (f) => ({ field: f, op: '==', value: 'positive' });
  const NEG = (f) => ({ field: f, op: '==', value: 'negative' });
  const DISCHARGE = { field: 'presentation', op: '==', value: 'discharge' };
  const ULCER = { field: 'presentation', op: '==', value: 'ulcer' };
  const SYM = (v) => ({ field: 'symptoms', op: 'includes', value: v });

  // Gonorrhoea / chlamydia that must be treated: positive test, or discharge not excluded by a negative test
  const GC_TREAT = { any: [POS('gc'), { all: [DISCHARGE, { none: [NEG('gc')] }] }] };
  const CT_TREAT = { any: [POS('ct'), { all: [DISCHARGE, { none: [NEG('ct')] }] }] };
  const GCCT = { any: [GC_TREAT, CT_TREAT] };
  const SYPH = { any: [ULCER, POS('sy')] };
  const TV = { any: [POS('tv'), SYM('trich_suspected')] };
  const ANY_POSITIVE = { any: [POS('ct'), POS('gc'), POS('tv'), POS('sy')] };
  const PREGNANT = { field: 'group', op: '==', value: 'pregnant' };
  const EARLY = { field: 'syph_stage', op: '==', value: 'early' };

  // ---- Adverse-effect blocks (general pharmacology, not from AWaRe) ----
  const AE_SRC = { page: '—', type: 'expert', note: 'General pharmacology, not from AWaRe' };
  const AE = {
    ceftriaxone: { name: 'Ceftriaxone', common: 'درد محل تزریق، اسهال، راش', serious: 'آنافیلاکسی، کولیت C. difficile، سلادج و سنگ صفراوی، کم‌خونی همولیتیک' },
    cefixime: { name: 'Cefixime', common: 'اسهال، تهوع، راش', serious: 'آنافیلاکسی، کولیت C. difficile' },
    azithromycin: { name: 'Azithromycin', common: 'تهوع، درد شکم، اسهال', serious: 'طولانی شدن QT و آریتمی کشنده، هپاتوتوکسیسیته، آنافیلاکسی' },
    doxycycline: { name: 'Doxycycline', common: 'تهوع، حساسیت به نور، ازوفاژیت (با آب فراوان و در حالت نشسته مصرف شود)', serious: 'افزایش فشار داخل جمجمه، واکنش پوستی شدید، کولیت C. difficile؛ در بارداری ممنوع' },
    benzathine: { name: 'Benzathine benzylpenicillin', common: 'درد شدید محل تزریق، تب و بدن‌درد', serious: 'آنافیلاکسی، واکنش یاریش-هرکسهایمر (طی ۲۴ ساعت اول)، سندرم نیکولا در تزریق داخل رگی' },
    procaine: { name: 'Procaine benzylpenicillin', common: 'درد محل تزریق', serious: 'آنافیلاکسی، واکنش یاریش-هرکسهایمر، واکنش به پروکائین (اضطراب، توهم، تشنج)' },
    metronidazole: { name: 'Metronidazole', common: 'طعم فلزی، تهوع', serious: 'نوروپاتی محیطی، تشنج، واکنش شبه‌دیسولفیرام با الکل (تا ۴۸ ساعت پس از مصرف الکل مصرف نشود)' },
    erythromycin: { name: 'Erythromycin', common: 'تهوع، استفراغ، درد شکم', serious: 'طولانی شدن QT، هپاتیت کلستاتیک' },
  };
  const adverse = (...keys) => ({ src: AE_SRC, items: keys.map((k) => AE[k]) });

  // ---- Reused sections ----
  const OTHER_STI = {
    title: 'اقدامات همراه (برای همه عفونت‌های آمیزشی)',
    items: [
      { t: 'سایر عفونت‌های آمیزشی را بررسی کنید: HIV، سفلیس، هپاتیت B و C، و در صورت امکان گونوره، کلامیدیا و تریکوموناس.', src: { page: '231, 236, 242', type: 'guideline' } },
      { t: 'همسران جنسی باید مطلع و درمان شوند.', src: { page: '231, 243', type: 'guideline' } },
      { t: 'مشاوره درباره رابطه ایمن و کاندوم؛ در افراد پرخطر پیشگیری قبل از مواجهه با HIV (PrEP) را در نظر بگیرید.', src: { page: '231, 238', type: 'guideline' } },
      { t: 'گزارش به مراجع بهداشتی طبق مقررات محلی.', src: { page: '231, 238', type: 'guideline' } },
    ],
  };
  const NO_PREGNANCY_DOXY = {
    t: 'دوکسی‌سایکلین در بارداری ممنوع است.',
    src: { page: '232, 239', type: 'guideline' },
  };

  // ---- Gonorrhoea regimen (dual by default) ----
  const GC_RX = setting.gonoTherapy === 'single'
    ? {
        title: 'درمان گونوره — درمان تک‌دارویی (فقط چون داده مقاومت محلی حساسیت را تأیید کرده)',
        src: { page: '243, 251', type: 'guideline' },
        groups: [
          { label: 'یکی از گزینه‌ها — دوز واحد', drugs: [
            { name: 'Ceftriaxone', dose: '250 mg', route: 'IM', freq: 'single dose', aware: 'Watch' },
            { name: 'Cefixime', dose: '400 mg', route: 'PO', freq: 'single dose', aware: 'Watch' },
            { name: 'Spectinomycin (نه برای عفونت حلق)', dose: '2 g', route: 'IM', freq: 'single dose', aware: 'Access' },
          ] },
        ],
        adverse: adverse('ceftriaxone', 'cefixime'),
      }
    : {
        title: 'درمان دوگانه — دوز واحد (قاعده AWaRe وقتی داده مقاومت محلی در دسترس نیست)',
        src: { page: '243, 251', type: 'guideline' },
        groups: [
          { label: 'انتخاب اول', drugs: [
            { name: 'Ceftriaxone + Azithromycin', dose: '250 mg + 1 g', route: 'IM + PO', freq: 'single dose', aware: 'Watch' },
          ] },
          { label: 'انتخاب دوم', drugs: [
            { name: 'Cefixime + Azithromycin', dose: '400 mg + 1 g', route: 'PO', freq: 'single dose', aware: 'Watch' },
          ] },
        ],
        adverse: adverse('ceftriaxone', 'cefixime', 'azithromycin'),
      };

  ABX.flows.sti = {
    id: 'sti',
    title: 'عفونت‌های آمیزشی در بزرگسال',
    setting,

    // ---------- PAGES ----------
    pages: [
      {
        id: 'history',
        title: 'بیمار و شکل بالینی',
        hint: 'شکل بالینی اصلی را انتخاب کنید. اگر آزمایش مثبتی دارید، در صفحه آزمایش ثبت کنید.',
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
          {
            id: 'presentation', type: 'chips', label: 'شکل بالینی',
            options: [
              { v: 'discharge', l: 'ترشح پیشابراه یا واژن (اورتریت یا سرویسیت)، با یا بدون سوزش ادرار' },
              { v: 'ulcer', l: 'زخم بدون درد با لبه سفت روی تناسلی، دهان یا مقعد (مشکوک به سفلیس اولیه)' },
              { v: 'tested', l: 'بدون علامت، با آزمایش مثبت یا تماس شناخته‌شده' },
              { v: 'none', l: 'هیچ‌کدام — شواهدی از عفونت آمیزشی نیست' },
            ],
          },
        ],
      },
      {
        id: 'details',
        title: 'محل درگیری و علائم ویژه',
        hint: 'هر مورد انتخاب‌نشده یعنی بیمار آن را ندارد.',
        fields: [
          {
            id: 'symptoms', type: 'search', label: 'یافته‌ها', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'anorectal', l: 'درگیری مقعد (درد، خارش، ترشح یا خونریزی مقعدی)' },
              { v: 'throat', l: 'درگیری حلق' },
              { v: 'lgv', l: 'زخم یا پاپول تناسلی یا مقعدی همراه با لنفادنوپاتی کشاله ران (مشکوک به LGV)' },
              { v: 'trich_suspected', l: 'ترشح کف‌آلود و بدبو (مشکوک به تریکوموناس)' },
            ],
          },
        ],
      },
      {
        id: 'signs',
        title: 'علائم هشدار',
        hint: 'هر مورد انتخاب‌نشده یعنی بیمار آن را ندارد.',
        checkRedFlagsOnLeave: true,
        fields: [
          {
            id: 'alarm', type: 'search', label: 'یافته‌های هشدار', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'joint', l: 'درد یا تورم مفصل، یا ضایعات چرکی پوستی' },
              { v: 'pelvic', l: 'درد شدید لگن یا پایین شکم همراه با تب' },
              { v: 'testicular', l: 'درد یا تورم بیضه' },
              { v: 'neuro', l: 'علائم عصبی، چشمی یا شنوایی (مشکوک به درگیری عصبی سفلیس)' },
            ],
          },
        ],
      },
      {
        id: 'tests',
        title: 'نتیجه آزمایش',
        skippable: true,
        skipLabel: 'آزمایشی انجام نشده',
        hint: 'ترشح بدون آزمایش به‌صورت مشکوک به گونوره و کلامیدیا درمان می‌شود. آزمایش منفی هر کدام آن را کنار می‌گذارد.',
        fields: [
          { id: 'gc', type: 'chips', label: 'گونوره (NAAT یا گرم)', options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }] },
          { id: 'ct', type: 'chips', label: 'کلامیدیا (NAAT)', options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }] },
          { id: 'tv', type: 'chips', label: 'تریکوموناس (میکروسکوپی یا NAAT)', options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }] },
          { id: 'sy', type: 'chips', label: 'سفلیس (هر دو تست ترپونمال و غیرترپونمال مثبت)', options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }] },
        ],
      },
      {
        id: 'syphilis',
        title: 'سفلیس: مرحله بیماری',
        hint: 'فقط وقتی سفلیس مطرح است لازم می‌شود. مرحله زودرس یعنی عفونت ۲ سال یا کمتر. اگر زمان ابتلا را نمی‌دانید «نامشخص» را بزنید.',
        fields: [
          {
            id: 'syph_stage', type: 'chips', label: 'مرحله سفلیس',
            options: [
              { v: 'early', l: 'زودرس (۲ سال یا کمتر)' },
              { v: 'late', l: 'دیررس (بیش از ۲ سال)' },
              { v: 'unknown', l: 'نامشخص' },
            ],
          },
        ],
      },
    ],

    // ---------- GATE 0: red flags (any one fires) ----------
    redFlags: [
      { id: 'R1', label: 'درد یا تورم مفصل یا ضایعات چرکی پوستی (مشکوک به گونوکوک منتشر)',
        when: { field: 'alarm', op: 'includes', value: 'joint' },
        src: { page: '242', type: 'guideline', note: 'AWaRe: rarely the infection disseminates, typically to one or more joints' } },
      { id: 'R2', label: 'درد شدید لگن یا پایین شکم همراه با تب',
        when: { field: 'alarm', op: 'includes', value: 'pelvic' },
        src: { page: '—', type: 'expert', note: 'Possible PID; not covered by chapters 19-22' } },
      { id: 'R3', label: 'درد یا تورم بیضه',
        when: { field: 'alarm', op: 'includes', value: 'testicular' },
        src: { page: '242', type: 'expert', note: 'AWaRe lists testicular discomfort as a symptom only; possible epididymitis is a team flag' } },
      { id: 'R4', label: 'علائم عصبی، چشمی یا شنوایی',
        when: { field: 'alarm', op: 'includes', value: 'neuro' },
        src: { page: '256, 257', type: 'guideline', note: 'Possible neurosyphilis; AWaRe regimen is IV benzylpenicillin for 14 days' } },
    ],
    redFlagRule: { src: { page: '242, 256, 257', type: 'expert', note: 'Any single flag means this is not an uncomplicated outpatient case: refer' } },

    // ---------- FINDINGS ----------
    findings: [
      { id: 'AG', label: 'سن ثبت شده', record: 'سن', fixPage: 'history',
        when: { field: 'age', op: '>=', value: 0 },
        src: { page: '—', type: 'expert', note: 'Age decides scope; a blank age is never read as adult' } },
      { id: 'GR', label: 'گروه بیمار ثبت شده', record: 'گروه بیمار', fixPage: 'history',
        when: { field: 'group', op: 'in', value: ['male', 'female', 'pregnant'] },
        src: { page: '232, 239', type: 'guideline', note: 'Pregnancy changes the chlamydia drug (doxycycline contraindicated)' } },
      { id: 'PR', label: 'شکل بالینی ثبت شده', record: 'شکل بالینی', fixPage: 'history',
        when: { field: 'presentation', op: 'in', value: ['discharge', 'ulcer', 'tested', 'none'] },
        src: { page: '—', type: 'expert' } },
      { id: 'ST', label: 'مرحله سفلیس ثبت شده', informativeOnly: true, fixPage: 'syphilis',
        when: { field: 'syph_stage', op: 'in', value: ['early', 'late', 'unknown'] },
        src: { page: '255, 267, 268', type: 'guideline' } },
      { id: 'G1', label: 'گونوره مثبت', informativeOnly: true, fixPage: 'tests',
        when: POS('gc'), src: { page: '250, 251', type: 'guideline' } },
      { id: 'C1', label: 'کلامیدیا مثبت', informativeOnly: true, fixPage: 'tests',
        when: POS('ct'), src: { page: '235, 238', type: 'guideline' } },
      { id: 'T1', label: 'تریکوموناس مثبت', informativeOnly: true, fixPage: 'tests',
        when: POS('tv'), src: { page: '272, 277', type: 'guideline' } },
      { id: 'S1', label: 'سفلیس مثبت', informativeOnly: true, fixPage: 'tests',
        when: POS('sy'), src: { page: '256, 267', type: 'guideline' } },
    ],

    // ---------- RULES: top to bottom, first match wins ----------
    rules: [
      { id: 'RULE_AGE_UNKNOWN', outcome: 'incomplete',
        when: { finding: 'AG', is: null },
        src: { page: '—', type: 'expert', note: 'A blank age is never read as adult' } },

      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '230, 241', type: 'guideline', note: 'AWaRe: in children seek specialist advice and consider sexual abuse; prototype scope is adults' } },

      { id: 'RULE_NO_STI', outcome: 'no_antibiotic',
        when: { all: [
          { field: 'presentation', op: '==', value: 'none' },
          { none: [ANY_POSITIVE, SYM('trich_suspected')] },
        ] },
        src: { page: '—', type: 'expert', note: 'No suspected or confirmed STI: no antibiotic indication' } },

      { id: 'RULE_NEED_PRESENTATION', outcome: 'incomplete',
        when: { all: [{ finding: 'PR', is: null }, { none: [ANY_POSITIVE] }] },
        src: { page: '—', type: 'expert' } },

      { id: 'RULE_NEED_GROUP', outcome: 'incomplete',
        when: { finding: 'GR', is: null },
        src: { page: '232, 239', type: 'guideline', note: 'Group decides the chlamydia drug in pregnancy' } },

      { id: 'RULE_MULTI', outcome: 'multi',
        when: { any: [{ all: [GCCT, SYPH] }, { all: [GCCT, TV] }, { all: [SYPH, TV] }] },
        src: { page: '231, 242, 256', type: 'expert', note: 'Co-infection is common; one result summarises each regimen' } },

      { id: 'RULE_SYPH_NEED_STAGE', outcome: 'incomplete_stage',
        when: { all: [SYPH, { finding: 'ST', is: null }] },
        src: { page: '255, 267', type: 'guideline', note: 'Stage decides duration' } },

      { id: 'RULE_SYPH_EARLY_PREG', outcome: 'syph_early_preg',
        when: { all: [SYPH, EARLY, PREGNANT] },
        src: { page: '257, 269', type: 'guideline' } },
      { id: 'RULE_SYPH_EARLY', outcome: 'syph_early',
        when: { all: [SYPH, EARLY] },
        src: { page: '257, 267', type: 'guideline' } },
      { id: 'RULE_SYPH_LATE_PREG', outcome: 'syph_late_preg',
        when: { all: [SYPH, PREGNANT] },
        src: { page: '257, 269', type: 'guideline', note: 'Late or unknown stage' } },
      { id: 'RULE_SYPH_LATE', outcome: 'syph_late',
        when: SYPH,
        src: { page: '257, 268', type: 'guideline', note: 'Late or unknown stage: unknown is treated as late' } },

      { id: 'RULE_TRICH', outcome: 'trich',
        when: TV,
        src: { page: '272, 277', type: 'guideline', note: 'Treat when diagnosed; "suspected" tick is a prescriber judgement' } },

      { id: 'RULE_LGV', outcome: 'lgv',
        when: { all: [CT_TREAT, SYM('lgv')] },
        src: { page: '232, 239', type: 'guideline' } },

      { id: 'RULE_GCCT', outcome: 'gcct',
        when: GC_TREAT,
        src: { page: '232, 243, 251', type: 'expert', note: 'Discharge treated as suspected gonorrhoea + chlamydia without tests (local practice); ceftriaxone + azithromycin covers both' } },

      { id: 'RULE_CT_PREG', outcome: 'ct_pregnant',
        when: { all: [CT_TREAT, PREGNANT] },
        src: { page: '232, 239', type: 'guideline' } },
      { id: 'RULE_CT_ANORECTAL', outcome: 'ct_anorectal',
        when: { all: [CT_TREAT, SYM('anorectal')] },
        src: { page: '232, 239', type: 'guideline' } },
      { id: 'RULE_CT', outcome: 'ct_only',
        when: CT_TREAT,
        src: { page: '232, 239', type: 'expert', note: 'Azithromycin listed first (local practice); AWaRe lists doxycycline first' } },

      { id: 'RULE_NEG_TESTS', outcome: 'uncertain',
        when: { all: [DISCHARGE, NEG('gc'), NEG('ct')] },
        src: { page: '231, 238', type: 'guideline', note: 'Persistent discharge with negative tests: refer to a centre with laboratory capacity' } },

      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert', note: 'Reached when presentation "tested" has no positive result recorded' } },
    ],

    traps: [],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارزیابی فوری یا ارجاع',
        summary: 'یافته هشداردهنده وجود دارد. این بیمار با این ابزار سرپایی مدیریت نمی‌شود.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'درد یا تورم مفصل یا ضایعات چرکی پوستی مطرح‌کننده عفونت گونوکوکی منتشر است؛ بیمار را ارزیابی و ارجاع دهید.', src: { page: '242', type: 'guideline' } },
            { t: 'درد لگن همراه با تب (PID) و درد یا تورم بیضه (اپیدیدیمیت) نیازمند ارزیابی حضوری و درمان اختصاصی‌اند که در این نسخه نیست.', src: { page: '—', type: 'expert' } },
            { t: 'علائم عصبی، چشمی یا شنوایی مطرح‌کننده نوروسیفلیس است؛ درمان AWaRe بنزیل‌پنی‌سیلین وریدی ۱۴ روزه است و بستری لازم دارد.', src: { page: '257, 268', type: 'guideline' } },
          ] },
        ],
      },

      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر است. AWaRe در کودکان توصیه می‌کند در صورت امکان مشورت تخصصی گرفته شود و احتمال سوءاستفاده جنسی در نظر گرفته شود.',
        summarySrc: { page: '230, 241', type: 'guideline' },
        sections: [],
      },

      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'شواهدی از عفونت آمیزشی مطرح یا تأیید شده وجود ندارد.',
        sections: [
          { title: 'به بیمار بگویید', items: [
            { t: 'اگر ترشح، زخم یا علائم جدید ظاهر شد، دوباره مراجعه کند.', src: { page: '—', type: 'expert' } },
            { t: 'اگر تماس پرخطر داشته، آزمایش غربالگری HIV، سفلیس و هپاتیت و در صورت امکان NAAT گونوره و کلامیدیا را در نظر بگیرید.', src: { page: '231, 236', type: 'guideline' } },
            { t: 'سوزش ادرار بدون ترشح و بدون شک به عفونت آمیزشی را با مسیر «سوزش ادرار» بررسی کنید.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      uncertain: {
        tone: 'caution',
        verdict: 'آزمایش گونوره و کلامیدیا منفی است؛ علت دیگر یا ارجاع',
        summary: 'با ترشح و نتیجه منفی هر دو آزمایش، درمان تجربی گونوره و کلامیدیا اندیکاسیون ندارد.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'در ترشح راجعه یا پایدار پیشابراه، به مرکزی با امکان آزمایش گونوره، کلامیدیا، مایکوپلاسما جنیتالیوم و تریکوموناس ارجاع دهید و مقاومت دارویی را هم بسنجید.', src: { page: '238', type: 'guideline' } },
            { t: 'در میکروسکوپی گرم، نبود دیپلوکوک داخل‌سلولی همراه با بیش از ۵ لکوسیت در هر HPF مطرح‌کننده اورتریت غیرگونوکوکی است.', src: { page: '235', type: 'guideline' } },
          ] },
        ],
      },

      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'برای تعیین درمان این موارد لازم است:',
        showMissing: true,
        sections: [
          { title: 'توجه', items: [
            { t: 'اگر شکل بالینی «بدون علامت با آزمایش مثبت» است، نتیجه مثبت را در صفحه آزمایش ثبت کنید.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },

      incomplete_stage: {
        tone: 'caution',
        verdict: 'مرحله سفلیس لازم است',
        summary: 'برای انتخاب مدت درمان، مرحله را مشخص کنید: زودرس (۲ سال یا کمتر)، دیررس، یا نامشخص. اگر نامشخص بود درمان دیررس داده می‌شود.',
        summarySrc: { page: '255, 268', type: 'guideline' },
        sections: [],
      },

      multi: {
        tone: 'caution',
        verdict: 'بیش از یک عفونت مطرح است',
        summary: 'هر عفونت درمان جداگانه دارد. خلاصه درمان‌ها در پایین آمده است؛ برای جزئیات، فرم را برای هر عفونت جداگانه اجرا کنید (فقط همان یک عفونت را انتخاب کنید).',
        sections: [
          { title: 'گونوره و کلامیدیا (ترشح یا آزمایش مثبت)', items: [
            { rx: 'Ceftriaxone 250 mg IM + Azithromycin 1 g PO', t: 'دوز واحد.', src: { page: '243, 251', type: 'expert' } },
          ] },
          { title: 'سفلیس', items: [
            { rx: 'Benzathine benzylpenicillin 2.4 MU IM', t: 'زودرس: یک دوز. دیررس یا نامشخص: هفتگی، ۳ هفته.', src: { page: '257, 267, 268', type: 'guideline' } },
          ] },
          { title: 'تریکوموناس', items: [
            { rx: 'Metronidazole 2 g PO یا 500 mg PO q12h', t: 'دوز واحد یا ۷ روز.', src: { page: '277', type: 'guideline' } },
          ] },
          OTHER_STI,
        ],
      },

      gcct: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'ترشح یا آزمایش مثبت: گونوره و کلامیدیا با هم مطرح‌اند و بدون انتظار برای آزمایش درمان می‌شوند. درمان همیشه لازم است، حتی بدون علامت.',
        summarySrc: { page: '231, 243', type: 'expert' },
        rx: GC_RX,
        sections: [
          { title: 'نکات درمان', items: [
            { t: 'آزیترومایسین ۱ گرم هم گونوره (درمان دوگانه) و هم کلامیدیا را پوشش می‌دهد؛ این ترکیب استنباط تیم از فصل ۱۹ و ۲۰ است.', src: { page: '232, 243', type: 'expert' } },
            { t: 'اگر بیمار باردار است همین رژیم استفاده می‌شود؛ دوکسی‌سایکلین ممنوع است.', src: { page: '232, 251', type: 'guideline' } },
            { t: 'اگر درگیری مقعد دارد، AWaRe برای کلامیدیای مقعدی دوکسی‌سایکلین ۱۰۰ mg هر ۱۲ ساعت ۷ روز را ذکر می‌کند؛ افزودن آن به این رژیم تصمیم تیم است.', src: { page: '232, 239', type: 'expert' } },
            { t: 'در عفونت حلق، Spectinomycin استفاده نشود.', src: { page: '252, 253', type: 'guideline' } },
          ] },
          { title: 'عدم بهبودی', items: [
            { rx: 'Cefixime 800 mg PO + Azithromycin 2 g PO', t: 'اگر پس از حدود ۵ روز علائم برطرف نشد، مقاومت یا تشخیص دیگر را در نظر بگیرید. درمان مجدد (دوز واحد): یکی از ترکیب‌های زیر.', src: { page: '244, 252', type: 'guideline' } },
            { rx: 'Ceftriaxone 500 mg IM + Azithromycin 2 g PO', t: 'یا.', src: { page: '244, 252', type: 'guideline' } },
            { rx: 'Gentamicin 240 mg IM + Azithromycin 2 g PO', t: 'یا (آمینوگلیکوزید: عوارض کلیوی و شنوایی).', src: { page: '244, 252', type: 'guideline' } },
          ] },
          OTHER_STI,
        ],
      },

      ct_only: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'کلامیدیای ادراری‌تناسلی (گونوره رد شده یا مطرح نیست). درمان همیشه لازم است، حتی بدون علامت.',
        summarySrc: { page: '231, 232', type: 'guideline' },
        rx: {
          title: 'درمان کلامیدیا',
          src: { page: '232, 239', type: 'guideline' },
          groups: [
            { label: 'انتخاب اول — دوز واحد (عادت محلی، تصمیم تیم)', drugs: [
              { name: 'Azithromycin', dose: '1 g', route: 'PO', freq: 'single dose', aware: 'Watch' },
            ] },
            { label: 'جایگزین — ۷ روز', drugs: [
              { name: 'Doxycycline', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: adverse('azithromycin', 'doxycycline'),
        },
        sections: [
          { title: 'نکته انتخاب دارو', items: [
            { t: 'AWaRe می‌گوید دوکسی‌سایکلین مؤثرتر از آزیترومایسین است و اگر پایبندی به درمان مشکلی نیست می‌تواند در اولویت باشد. انتخاب اول آزیترومایسین بر پایه عادت محلی تیم است.', src: { page: '232, 239', type: 'expert' } },
          ] },
          { title: 'پیگیری', items: [
            { t: 'اگر علائم ادامه یافت: سابقه اطلاع‌رسانی و درمان همسر را بررسی کنید و در ترشح راجعه یا پایدار به مرکز دارای آزمایشگاه ارجاع دهید.', src: { page: '238', type: 'guideline' } },
          ] },
          OTHER_STI,
        ],
      },

      ct_pregnant: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'کلامیدیا در بارداری. تنها گزینه AWaRe آزیترومایسین دوز واحد است.',
        summarySrc: { page: '232, 239', type: 'guideline' },
        rx: {
          title: 'درمان کلامیدیا در بارداری',
          src: { page: '232, 239', type: 'guideline' },
          groups: [
            { label: 'تنها گزینه', drugs: [
              { name: 'Azithromycin', dose: '1 g', route: 'PO', freq: 'single dose', aware: 'Watch' },
            ] },
          ],
          adverse: adverse('azithromycin'),
        },
        sections: [
          { title: 'نکات', items: [
            NO_PREGNANCY_DOXY,
            { t: 'در درگیری مقعد در بارداری، AWaRe رژیم جداگانه‌ای نمی‌دهد؛ همین آزیترومایسین گزینه فهرست‌شده برای بارداری است.', src: { page: '239', type: 'expert' } },
            { t: 'جایگزین غیرفهرست EML در بارداری: اریترومایسین ۵۰۰ mg هر ۶ ساعت به مدت ۷ روز.', src: { page: '239', type: 'guideline' } },
          ] },
          OTHER_STI,
        ],
      },

      ct_anorectal: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'کلامیدیای مقعدی. AWaRe برای این محل دوکسی‌سایکلین را ذکر می‌کند.',
        summarySrc: { page: '232, 239', type: 'guideline' },
        rx: {
          title: 'درمان کلامیدیای مقعدی — ۷ روز',
          src: { page: '232, 239', type: 'guideline' },
          groups: [
            { label: 'تنها گزینه EML', drugs: [
              { name: 'Doxycycline', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: adverse('doxycycline'),
        },
        sections: [
          { title: 'نکات', items: [
            { t: 'جایگزین غیرفهرست EML: اریترومایسین ۵۰۰ mg هر ۶ ساعت به مدت ۱۴ روز.', src: { page: '239', type: 'guideline' } },
            { t: 'در مردانی که با مردان رابطه دارند، نمونه مقعدی را برای ژنوتایپ لنفوگرانولوم ونروم (LGV) آزمایش کنید.', src: { page: '231, 235', type: 'guideline' } },
          ] },
          OTHER_STI,
        ],
      },

      lgv: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'مشکوک به لنفوگرانولوم ونروم (LGV). درمان ۲۱ روزه است.',
        summarySrc: { page: '232, 239', type: 'guideline' },
        rx: {
          title: 'درمان LGV — ۲۱ روز',
          src: { page: '232, 239', type: 'guideline' },
          groups: [
            { label: 'تنها گزینه EML', drugs: [
              { name: 'Doxycycline', dose: '100 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: adverse('doxycycline'),
        },
        sections: [
          { title: 'نکات', items: [
            { t: 'در بارداری دوکسی‌سایکلین ممنوع است؛ جایگزین غیرفهرست EML: اریترومایسین ۵۰۰ mg هر ۶ ساعت به مدت ۲۱ روز.', src: { page: '232, 240', type: 'guideline' } },
            { t: 'اگر گونوره هم مطرح یا رد نشده است (مثلاً ترشح بدون آزمایش)، درمان گونوره جداگانه لازم است: Ceftriaxone 250 mg IM دوز واحد.', src: { page: '243', type: 'expert' } },
          ] },
          OTHER_STI,
        ],
      },

      trich: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'تریکوموناس. درمان همیشه لازم است، حتی بدون علامت، و همسر جنسی هم باید آزمایش و درمان شود.',
        summarySrc: { page: '272, 277', type: 'guideline' },
        rx: {
          title: 'درمان تریکوموناس',
          src: { page: '272, 277', type: 'guideline' },
          groups: [
            { label: 'یکی از دو گزینه', drugs: [
              { name: 'Metronidazole — دوز واحد', dose: '2 g', route: 'PO', freq: 'single dose', aware: 'Access' },
              { name: 'Metronidazole — ۷ روز', dose: '500 mg', route: 'PO', freq: 'q12h', aware: 'Access' },
            ] },
          ],
          adverse: adverse('metronidazole'),
        },
        sections: [
          { title: 'نکات', items: [
            { t: 'شواهد نشان می‌دهد دوره ۷ روزه درمان بیشتری دارد؛ اگر پایبندی مشکلی نیست ۷ روزه را در نظر بگیرید.', src: { page: '272, 277', type: 'guideline' } },
            { t: 'AWaRe محدودیت اختصاصی بارداری برای مترونیدازول ذکر نمی‌کند.', src: { page: '277', type: 'expert' } },
          ] },
          OTHER_STI,
        ],
      },
    },
  };

  // ---------- Syphilis outcomes (four variants built from one template) ----------
  function syphilis(early, pregnant) {
    const regimen = early
      ? [
          { label: 'انتخاب اول — دوز واحد', drugs: [{ name: 'Benzathine benzylpenicillin', dose: '2.4 MU (≈1.8 g)', route: 'IM', freq: 'single dose', aware: 'Access' }] },
          { label: 'انتخاب دوم — ۱۰ تا ۱۴ روز', drugs: [{ name: 'Procaine benzylpenicillin', dose: '1.2 MU (1.2 g)', route: 'IM', freq: 'q24h', aware: 'Access' }] },
        ]
      : [
          { label: 'انتخاب اول — هفتگی، ۳ هفته متوالی (روز ۱، ۸ و ۱۵؛ فاصله حداکثر ۱۴ روز)', drugs: [{ name: 'Benzathine benzylpenicillin', dose: '2.4 MU (≈1.8 g)', route: 'IM', freq: 'weekly x 3', aware: 'Access' }] },
          { label: 'انتخاب دوم — ۲۰ روز', drugs: [{ name: 'Procaine benzylpenicillin', dose: '1.2 MU (1.2 g)', route: 'IM', freq: 'q24h', aware: 'Access' }] },
        ];

    let allergy;
    if (pregnant) {
      allergy = early
        ? [
            { t: 'آلرژی به پنی‌سیلین (غیرفهرست EML): Ceftriaxone 1 g IM به مدت ۱۰ تا ۱۴ روز.', src: { page: '269', type: 'guideline' } },
            { t: 'آزیترومایسین ۲ g دوز واحد یا اریترومایسین ۵۰۰ mg هر ۶ ساعت ۱۴ روز فقط مادر را درمان می‌کنند، نه جنین را، چون کاملاً از جفت عبور نمی‌کنند.', src: { page: '269', type: 'guideline' } },
          ]
        : [
            { t: 'آلرژی به پنی‌سیلین (غیرفهرست EML): اریترومایسین ۵۰۰ mg هر ۶ ساعت به مدت ۳۰ روز؛ فقط مادر را درمان می‌کند، نه جنین.', src: { page: '269', type: 'guideline' } },
          ];
      allergy.push({ t: 'دوکسی‌سایکلین در بارداری ممنوع است.', src: { page: '269', type: 'guideline' } });
    } else {
      allergy = early
        ? [
            { t: 'آلرژی به پنی‌سیلین یا کمبود دارو (غیرفهرست EML): دوکسی‌سایکلین ۱۰۰ mg خوراکی هر ۱۲ ساعت به مدت ۱۴ روز، یا Ceftriaxone 1 g IM به مدت ۱۰ تا ۱۴ روز.', src: { page: '269', type: 'guideline' } },
            { t: 'اگر پنی‌سیلین قابل استفاده نیست، دوکسی‌سایکلین به‌دلیل هزینه کمتر و مصرف خوراکی ارجح است. آزیترومایسین ۲ g دوز واحد فقط در شرایط خاص (حساسیت محتمل بر پایه اپیدمیولوژی محلی).', src: { page: '269', type: 'guideline' } },
          ]
        : [
            { t: 'آلرژی به پنی‌سیلین یا کمبود دارو (غیرفهرست EML): دوکسی‌سایکلین ۱۰۰ mg خوراکی هر ۱۲ ساعت به مدت ۳۰ روز.', src: { page: '269', type: 'guideline' } },
          ];
    }

    const follow = [
      { t: 'پاسخ سرولوژیک را با تکرار تست غیرترپونمال بسنجید؛ کاهش ۴ برابری تیتر پاسخ مناسب را تأیید می‌کند (تکرار در ماه ۳، ۶ و ۱۲ پس از پایان درمان).', src: { page: '257', type: 'guideline' } },
      { t: 'واکنش یاریش-هرکسهایمر (تب، بدن‌درد طی ۲۴ ساعت اول) را به بیمار بگویید.', src: { page: '—', type: 'expert' } },
    ];
    if (early) follow.push({ t: 'در سفلیس زودرس، همسرانی که ظرف ۹۰ روز مواجهه داشته‌اند هم باید درمان شوند.', src: { page: '257', type: 'guideline' } });
    if (pregnant) follow.push({ t: 'همه زنان باردار باید از نظر سفلیس غربالگری شوند؛ درمان مناسب از سفلیس مادرزادی پیشگیری می‌کند و نوزاد باید پیگیری شود.', src: { page: '254, 257', type: 'guideline' } });

    return {
      tone: 'indicated',
      verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
      summary: (early ? 'سفلیس زودرس (۲ سال یا کمتر)' : 'سفلیس دیررس یا مرحله نامشخص') +
        (pregnant ? ' در بارداری' : '') + '. درمان همیشه لازم است، حتی بدون علامت. پنی‌سیلین هنوز داروی انتخاب است و مقاومتی گزارش نشده است.',
      summarySrc: { page: '257, 267, 268', type: 'guideline' },
      rx: {
        title: early ? 'درمان سفلیس زودرس' : 'درمان سفلیس دیررس یا نامشخص',
        src: { page: '257, 267, 268', type: 'guideline' },
        groups: regimen,
        adverse: adverse('benzathine', 'procaine'),
      },
      sections: [
        { title: 'نکات تشخیص', items: [
          { t: 'در سفلیس اولیه همه آزمایش‌ها ممکن است ابتدا منفی باشند؛ نتیجه منفی سفلیس اولیه را رد نمی‌کند. تشخیص قطعی نیاز به مثبت بودن هر دو تست ترپونمال و غیرترپونمال دارد.', src: { page: '256', type: 'guideline' } },
          { t: 'علل دیگر زخم تناسلی (مانند هرپس و شانکروئید) در فصل‌های ۱۹ تا ۲۲ AWaRe نیامده است.', src: { page: '—', type: 'expert' } },
        ] },
        { title: 'در صورت آلرژی به پنی‌سیلین', items: allergy },
        { title: 'پیگیری', items: follow },
        OTHER_STI,
      ],
    };
  }
  ABX.flows.sti.outcomes.syph_early = syphilis(true, false);
  ABX.flows.sti.outcomes.syph_late = syphilis(false, false);
  ABX.flows.sti.outcomes.syph_early_preg = syphilis(true, true);
  ABX.flows.sti.outcomes.syph_late_preg = syphilis(false, true);
})(typeof window !== 'undefined' ? window : globalThis);
