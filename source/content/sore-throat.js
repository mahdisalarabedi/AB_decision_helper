/* =====================================================================
   FOUNDATION — sore throat (pharyngitis), adults ≥ 18
   Source: WHO AWaRe antibiotic book (2022), ch. 6, pp. 46–58.
   Status: PROTOTYPE, NOT VALIDATED.
   Setting decision: Iran = HIGH rheumatic fever risk (team decision).
   Antibiotic agent/dose intentionally NOT included yet.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  ABX.flows = ABX.flows || {};

  ABX.flows.sore_throat = {
    id: 'sore_throat',
    title: 'گلودرد در بزرگسال',

    // Set once by the team, not asked of the doctor. Change to 'low' to flip the setting.
    setting: { rfRisk: 'high', src: { page: '54, 57', type: 'expert', note: 'AWaRe leaves RF prevalence to local data; Iran classed as high risk — team decision' } },

    pages: [
      {
        id: 'history',
        title: 'شرح حال',
        fields: [
          { id: 'age', type: 'number', label: 'سن بیمار', unit: 'سال' },
          { id: 'duration_days', type: 'number', label: 'مدت گلودرد', unit: 'روز' },
          { id: 'cough_present', type: 'chips', label: 'سرفه',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }] },
        ],
      },
      {
        id: 'symptoms',
        title: 'علائم همراه',
        hint: 'هر علامتی که انتخاب نشود، یعنی بیمار آن را ندارد.',
        fields: [
          { id: 'symptoms', type: 'search', label: 'علائم همراه', placeholder: 'مثلاً: آبریزش بینی',
            options: [
              { v: 'rhinorrhea', l: 'آبریزش بینی' },
              { v: 'hoarseness', l: 'گرفتگی صدا' },
              { v: 'conjunctivitis', l: 'قرمزی چشم' },
              { v: 'oral_ulcers', l: 'زخم دهان' },
              { v: 'headache', l: 'سردرد' },
              { v: 'myalgia', l: 'بدن‌درد' },
              { v: 'rash', l: 'راش پوستی' },
            ] },
        ],
      },
      {
        id: 'signs',
        title: 'معاینه',
        hint: 'هر موردی را که بررسی نکرده‌اید خالی بگذارید.',
        checkRedFlagsOnLeave: true,
        fields: [
          { id: 'temp', type: 'number', label: 'دمای بدن', unit: '°C', step: 'decimal' },
          { id: 'nodes', type: 'chips', label: 'لنفادنیت قدامی گردن با تندرنس',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }] },
          { id: 'exudates', type: 'chips', label: 'اگزودای لوزه',
            options: [{ v: 'no', l: 'ندارد' }, { v: 'yes', l: 'دارد' }] },
          { id: 'alarm', type: 'search', label: 'یافته‌های هشدار', placeholder: 'در صورت وجود انتخاب کنید',
            options: [
              { v: 'trismus', l: 'تریسموس (ناتوانی در باز کردن دهان)' },
              { v: 'drooling', l: 'ریزش بزاق یا ناتوانی در بلع بزاق' },
              { v: 'uvular_deviation', l: 'انحراف زبان کوچک یا تورم یک‌طرفه لوزه' },
              { v: 'stridor', l: 'استریدور یا دیسترس تنفسی' },
              { v: 'neck_swelling', l: 'تورم یا سفتی گردن' },
            ] },
        ],
      },
      {
        id: 'labs',
        title: 'تست سریع یا کشت',
        skippable: true,
        skipLabel: 'تستی انجام نشده',
        fields: [
          { id: 'gas_test', type: 'chips', label: 'تست آنتی‌ژن سریع GAS یا کشت گلو',
            options: [{ v: 'negative', l: 'منفی' }, { v: 'positive', l: 'مثبت' }] },
        ],
      },
    ],

    // ---------- GATE 0: red flags (any one fires) ----------
    redFlags: [
      { id: 'R1', label: 'تریسموس', when: { field: 'alarm', op: 'includes', value: 'trismus' },
        src: { page: '55', type: 'expert', note: 'AWaRe: imaging/tests only "if a complication is suspected"; the specific signs are a team decision' } },
      { id: 'R2', label: 'ریزش بزاق یا ناتوانی در بلع بزاق', when: { field: 'alarm', op: 'includes', value: 'drooling' },
        src: { page: '55', type: 'expert' } },
      { id: 'R3', label: 'انحراف زبان کوچک یا تورم یک‌طرفه لوزه', when: { field: 'alarm', op: 'includes', value: 'uvular_deviation' },
        src: { page: '55', type: 'expert' } },
      { id: 'R4', label: 'استریدور یا دیسترس تنفسی', when: { field: 'alarm', op: 'includes', value: 'stridor' },
        src: { page: '55', type: 'expert' } },
      { id: 'R5', label: 'تورم یا سفتی گردن', when: { field: 'alarm', op: 'includes', value: 'neck_swelling' },
        src: { page: '55', type: 'expert' } },
    ],
    redFlagRule: { src: { page: '55', type: 'expert', note: 'Any single alarm finding triggers referral' } },

    // ---------- SCORE ----------
    scores: {
      centor: {
        label: 'Centor',
        items: [
          { label: 'تب بالاتر از ۳۸ درجه', record: 'دمای بدن', fixPage: 'signs',
            when: { field: 'temp', op: '>', value: 38 }, needs: 'temp' },
          { label: 'نبود سرفه', record: 'سرفه', fixPage: 'history',
            when: { field: 'cough_present', op: '==', value: 'no' }, needs: 'cough_present' },
          { label: 'لنفادنیت قدامی گردن با تندرنس', record: 'لنفادنیت قدامی گردن', fixPage: 'signs',
            when: { field: 'nodes', op: '==', value: 'yes' }, needs: 'nodes' },
          { label: 'اگزودای لوزه', record: 'اگزودای لوزه', fixPage: 'signs',
            when: { field: 'exudates', op: '==', value: 'yes' }, needs: 'exudates' },
        ],
        bands: [
          { id: 'low', min: 0, max: 2, text: 'احتمال استرپتوکوک گروه A پایین است' },
          { id: 'high', min: 3, max: 4, text: 'مطرح‌کننده استرپتوکوک گروه A (حتی با نمره ۴، احتمال حدود ۵۰٪ است)' },
        ],
        src: { page: '53', type: 'guideline' },
      },
    },

    // ---------- RULES: top to bottom, first match wins ----------
    rules: [
      { id: 'RULE_AGE', outcome: 'not_adult',
        when: { field: 'age', op: '<', value: 18 },
        src: { page: '—', type: 'expert', note: 'Prototype scope: adults only' } },
      { id: 'RULE_TEST_NEG', outcome: 'no_antibiotic',
        when: { field: 'gas_test', op: '==', value: 'negative' },
        src: { page: '55', type: 'expert', note: 'AWaRe does not state outright that a negative test closes the question in adults' } },
      { id: 'RULE_TEST_POS', outcome: 'antibiotic_indicated',
        when: { field: 'gas_test', op: '==', value: 'positive' },
        src: { page: '47', type: 'guideline', note: 'Test only if treatment would follow a positive result' } },
      { id: 'RULE_CENTOR_LOW', outcome: 'no_antibiotic',
        when: { score: 'centor', band: 'low' },
        src: { page: '54', type: 'guideline' } },
      { id: 'RULE_CENTOR_HIGH', outcome: 'antibiotic_indicated',
        when: { score: 'centor', band: 'high' },
        src: { page: '54, 57', type: 'guideline', note: 'Applies because the setting is high RF risk' } },
      { id: 'RULE_INCOMPLETE', outcome: 'incomplete',
        when: { always: true },
        src: { page: '—', type: 'expert', note: 'Score range spans both bands; missing items are never assumed absent' } },
    ],

    // ---------- TRAPS ----------
    traps: [
      { id: 'T1', title: 'قرمزی حلق',
        text: 'قرمزی حلق جزو معیارهای Centor نیست و به‌تنهایی دلیل تجویز آنتی‌بیوتیک نیست.',
        when: { always: true },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '53', type: 'expert' } },
      { id: 'T2', title: 'علائم ویروسی همراه',
        text: 'سرفه، آبریزش بینی، سردرد و بدن‌درد با عفونت ویروسی دستگاه تنفس فوقانی سازگارند. بیش از ۸۰٪ موارد گلودرد ویروسی است.',
        when: { any: [
          { field: 'cough_present', op: '==', value: 'yes' },
          { field: 'symptoms', op: 'includes', value: 'rhinorrhea' },
          { field: 'symptoms', op: 'includes', value: 'hoarseness' },
          { field: 'symptoms', op: 'includes', value: 'headache' },
          { field: 'symptoms', op: 'includes', value: 'myalgia' },
        ] },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '47, 52', type: 'guideline' } },
      { id: 'T3', title: 'انتظار تسکین سریع‌تر با آنتی‌بیوتیک',
        text: 'در گلودرد باکتریایی، آنتی‌بیوتیک درد را تنها حدود یک روز کوتاه‌تر می‌کند. مسکن منظم همان کار را می‌کند.',
        when: { always: true },
        showFor: ['no_antibiotic'],
        src: { page: '46, 57', type: 'guideline' } },
      { id: 'T4', title: 'پیشگیری از عوارض چرکی',
        text: 'پیشگیری از عوارض چرکی اندیکاسیون آنتی‌بیوتیک نیست؛ این عوارض نادر، قابل تشخیص و قابل درمان‌اند.',
        when: { always: true },
        showFor: ['no_antibiotic'],
        src: { page: '52', type: 'guideline' } },
      { id: 'T5', title: 'آزمایش خون',
        text: 'در گلودرد، آزمایش خون معمولاً لازم نیست مگر عارضه‌ای مطرح باشد.',
        when: { always: true },
        showFor: ['no_antibiotic', 'incomplete'],
        src: { page: '55', type: 'guideline' } },
    ],

    // ---------- OUTCOMES ----------
    outcomes: {
      refer: {
        tone: 'alert',
        verdict: 'ارزیابی فوری یا ارجاع',
        summary: 'یافته هشداردهنده وجود دارد و عارضه مطرح است. این بیمار را با این ابزار سرپایی مدیریت نکنید.',
        sections: [
          { title: 'اقدام', items: [
            { t: 'بیمار را از نظر عوارضی مانند آبسه پری‌تونسیلار یا تهدید راه هوایی فوراً ارزیابی و ارجاع دهید.', src: { page: '55', type: 'expert' } },
          ] },
        ],
      },
      not_adult: {
        tone: 'neutral',
        verdict: 'خارج از محدوده این نسخه',
        summary: 'این نسخه فقط برای بیماران ۱۸ سال و بالاتر طراحی شده است.',
        sections: [],
      },
      no_antibiotic: {
        tone: 'calm',
        verdict: 'آنتی‌بیوتیک لازم نیست',
        summary: 'معیارهای شروع آنتی‌بیوتیک برآورده نشده است. درمان حمایتی کافی است.',
        diagnosis: 'نمره Centor پایین است؛ فارنژیت استرپتوکوکی بعید است و بیش از ۸۰٪ موارد ویروسی‌اند.',
        diagnosisSrc: { page: '52, 54', type: 'guideline' },
        showScore: 'centor',
        showTraps: true,
        sections: [
          { title: 'درمان علامتی', items: [
            { rx: 'Paracetamol 500 mg – 1 g PO q4–6h', t: 'حداکثر ۴ گرم در روز؛ در نارسایی کبد ۲ گرم', src: { page: '56', type: 'guideline' } },
            { rx: 'Ibuprofen 200–400 mg PO q6–8h', t: 'حداکثر ۲.۴ گرم در روز', src: { page: '56', type: 'guideline' } },
          ] },
          { title: 'به بیمار بگویید', items: [
            { t: 'بیشتر موارد، حتی موارد باکتریایی، ظرف یک هفته خودبه‌خود بهبود می‌یابند.', src: { page: '56', type: 'guideline' } },
            { t: 'آنتی‌بیوتیک در این شرایط فایده‌ای ندارد و عوارض دارد.', src: { page: '57', type: 'guideline' } },
          ] },
          { title: 'چه زمانی برگردد', items: [
            { t: 'ناتوانی در بلع بزاق، تریسموس، تورم یک‌طرفه گردن یا لوزه، دیسترس تنفسی، یا نبود بهبود پس از یک هفته.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },
      antibiotic_indicated: {
        tone: 'indicated',
        verdict: 'آنتی‌بیوتیک اندیکاسیون دارد',
        summary: 'نمره Centor بالاست و ایران منطقه پرخطر تب روماتیسمی در نظر گرفته شده است؛ درمان برای کاهش احتمال تب روماتیسمی توصیه می‌شود.',
        summarySrc: { page: '54, 57', type: 'guideline' },
        showScore: 'centor',
        // Agent, dose and duration deliberately not shown yet — pending the team's review.
        sections: [
          { title: 'قدم بعدی', items: [
            { t: 'در صورت دسترسی، تست آنتی‌ژن سریع یا کشت گلو را در نظر بگیرید؛ فقط اگر قرار است بر اساس نتیجه مثبت درمان شروع شود.', src: { page: '47, 55', type: 'guideline' } },
            { t: 'انتخاب دارو، دوز و مدت درمان در این نسخه هنوز اضافه نشده است.', src: { page: '—', type: 'expert' } },
          ] },
        ],
      },
      incomplete: {
        tone: 'caution',
        verdict: 'اطلاعات کافی نیست',
        summary: 'با موارد ثبت‌نشده، نمره Centor هم می‌تواند پایین و هم بالا باشد. این موارد را ثبت کنید:',
        showScore: 'centor',
        showMissing: true,
        showTraps: true,
        sections: [],
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
