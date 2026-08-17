<script setup lang="ts">
useSeoMeta({
  title: 'SMAK | Умови використання',
  description: 'Офіційні правила, застереження щодо використання штучного інтелекту та умови користування демонстраційною платформою SMAK.',
  ogTitle: 'SMAK — Умови використання',
  ogDescription: 'Правила користування платформою, застереження щодо рекомендацій ШІ та демонстраційного статусу сервісу.'
})

const lastUpdated = '17 серпня 2026 року'

const navItems = [
  { id: 'demo-status', title: '1. Демонстраційний статус' },
  { id: 'ai-disclaimer', title: '2. Застереження щодо ШІ' },
  { id: 'accounts', title: '3. Облікові записи' },
  { id: 'ugc-moderation', title: '4. Користувацький контент' },
  { id: 'billing-demo', title: '5. Тарифи та підписки' },
  { id: 'intellectual-property', title: '6. Інтелектуальна власність' },
  { id: 'contact', title: '7. Контакти' }
]
</script>

<template>
  <div class="w-full space-y-8 sm:space-y-12">
    
    <!-- Top Hero Section -->
    <div class="bg-gradient-to-br from-coral-50/50 via-white to-orange-50/30 dark:from-smak-neutral-900 dark:via-smak-neutral-900 dark:to-coral-950/20 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl sm:rounded-4xl p-6 sm:p-10 lg:p-12 shadow-xs">
      <div class="max-w-3xl space-y-4 text-left">
        <h1 class="font-heading font-black text-3xl sm:text-5xl text-smak-neutral-900 dark:text-white tracking-tight">
          Умови <span class="text-coral-500">використання</span>
        </h1>

        <p class="text-sm sm:text-base text-smak-neutral-600 dark:text-smak-neutral-300 leading-relaxed">
          Ознайомтеся з правилами користування кулінарною платформою SMAK, застереженнями щодо роботи штучного інтелекту та демонстраційним статусом сервісу.
        </p>

        <div class="flex flex-wrap items-center gap-4 text-xs text-smak-neutral-500 dark:text-smak-neutral-400 pt-2 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80">
          <span>Останнє оновлення: <strong class="text-smak-neutral-800 dark:text-smak-neutral-200">{{ lastUpdated }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Main Grid: Sidebar + Content -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start text-left">
      
      <!-- Sticky Sidebar (Desktop) -->
      <aside class="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
        <div class="p-6 rounded-3xl bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 space-y-4 shadow-xs">
          <span class="font-heading font-bold text-xs uppercase tracking-wider text-smak-neutral-400 dark:text-smak-neutral-500 block">
            Зміст документа
          </span>
          <nav class="space-y-1">
            <a
              v-for="item in navItems"
              :key="item.id"
              :href="`#${item.id}`"
              class="block px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 transition-all"
            >
              {{ item.title }}
            </a>
          </nav>
        </div>
      </aside>

      <!-- Main Legal Articles Column -->
      <main class="lg:col-span-8 space-y-10 sm:space-y-12">
        
        <!-- Section 1 -->
        <section id="demo-status" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">1</span>
            <span>Демонстраційний статус платформи</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Платформа <strong>SMAK</strong> (smak.ai) створена як некомерційний інженерний та демонстраційний проєкт для демонстрації сучасного стеку веб-розробки та штучного інтелекту (портфоліо розробника). Сервіс надається на умовах <strong>«ЯК Є» («AS IS»)</strong> та <strong>«ЗА НАЯВНОСТІ» («AS AVAILABLE»)</strong> без будь-яких прямих чи непрямих гарантій щодо безперебійної роботи, збереження даних або придатності для комерційної експлуатації.
          </p>
        </section>

        <!-- Section 2: AI Disclaimer (Special Highlight Callout) -->
        <section id="ai-disclaimer" class="scroll-mt-24 space-y-4">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">2</span>
            <span>Застереження щодо порад штучного інтелекту (AI Disclaimer)</span>
          </h2>

          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Інтерактивний кулінарний асистент (на базі моделі Google Gemini), алгоритми семантичного векторного пошуку, автоматичні розрахунки індексу здоров'я та дієтичні фільтри (зокрема, щодо відсутності глютену, лактози, горіхів чи веганського складу) мають <strong>виключно ознайомчий, експериментальний та інформаційний характер</strong>.
          </p>

          <div 
            class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 text-sm sm:text-base text-smak-neutral-800 dark:text-smak-neutral-200 bg-coral-50/60 dark:bg-coral-950/20 border-2 border-coral-500 shadow-xs"
            style="border-color: #F05B5B;"
          >
            <div class="flex items-center gap-2 font-bold text-coral-600 dark:text-coral-400">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 shrink-0" />
              <span>Важливі правила харчової безпеки:</span>
            </div>
            <ul class="list-disc pl-5 space-y-2 leading-relaxed">
              <li>Рекомендації ШІ <strong>НЕ є медичними, дієтологічними, нутриціологічними або алергологічними висновками</strong>.</li>
              <li>Штучний інтелект може генерувати неточності в рецептурі, грамуванні, пропорціях або часі термічної обробки.</li>
              <li><strong>Користувач несе повну особисту відповідальність</strong> за перевірку куплених продуктів на наявність індивідуальних алергенів, дотримання технології приготування та термінів придатності продуктів.</li>
            </ul>
          </div>
        </section>

        <!-- Section 3 -->
        <section id="accounts" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">3</span>
            <span>Облікові записи та реєстрація</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Під час реєстрації користувач зобов'язується надавати коректну адресу електронної пошти та самостійно забезпечувати конфіденційність власного пароля. Адміністрація залишає за собою право в будь-який момент призупинити, обмежити або видалити тестовий обліковий запис у разі виявлення спаму, спроб зламу чи зловживання генерацією запитів.
          </p>
        </section>

        <!-- Section 4 -->
        <section id="ugc-moderation" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">4</span>
            <span>Користувацький контент та модерація (UGC)</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Усі рецепти, фотографії, коментарі та відгуки, опубліковані користувачами на платформі, проходять чергу автоматизованої модерації штучним інтелектом та ручну перевірку.
          </p>
          <ul class="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li>Заборонено публікувати небезпечні, шкідливі для здоров'я або неїстівні рецептури.</li>
            <li>Заборонено використовувати нецензурну лексику, мову ворожнечі, спам чи несанкціоновану комерційну рекламу.</li>
            <li>Заборонено завантажувати чужі матеріали з порушенням авторських прав.</li>
          </ul>
        </section>

        <!-- Section 5 -->
        <section id="billing-demo" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">5</span>
            <span>Тарифи, підписки та демонстраційні платежі</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Розділ тарифних планів (Free, Pro, Premium) та інтеграція платіжного шлюзу LiqPay реалізовані для демонстрації повнофункціональної білінгової архітектури платформи, управління лімітами AI-запитів та взаємодії з банківськими протоколами. Умови надання функціоналу не є публічною офертою комерційного підприємства з продажу товарів.
          </p>
        </section>

        <!-- Section 6 -->
        <section id="intellectual-property" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">6</span>
            <span>Інтелектуальна власність та ліцензія</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Сирцевий код платформи SMAK ліцензовано на умовах <strong>PolyForm Noncommercial License 1.0.0</strong> (відкритий сирцевий код для некомерційного, дослідницького та освітнього використання).
          </p>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Усі комерційні права, торговельна марка, логотипи, унікальні UI-макети та архітектура належать автору проєкту (<strong>Andrii Lukianenko</strong>). Будь-який несанкціонований публічний комерційний хостинг, розгортання платформи як комерційного сервісу чи перепродаж коду суворо заборонені.
          </p>
        </section>

        <!-- Section 7 -->
        <section id="contact" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-coral-500/10 text-coral-600 dark:text-coral-400 font-bold flex items-center justify-center text-sm shrink-0">7</span>
            <span>Контакти та зворотний зв’язок</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            З будь-яких питань, технічних зауважень або пропозицій щодо співпраці звертайтеся за адресою: <a href="mailto:a.lukiank@gmail.com" class="text-coral-500 hover:underline font-semibold">a.lukiank@gmail.com</a>.
          </p>
        </section>

        <!-- Bottom Return Link -->
        <div class="pt-8 border-t border-smak-neutral-100 dark:border-smak-neutral-800 flex items-center justify-between">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-smak-neutral-100 hover:bg-coral-500 hover:text-white dark:bg-smak-neutral-800 dark:hover:bg-coral-500 text-smak-neutral-800 dark:text-white transition-all shadow-xs"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
            <span>На головну</span>
          </NuxtLink>

          <NuxtLink
            to="/privacy"
            class="inline-flex items-center gap-2 font-bold text-sm text-coral-500 hover:underline"
          >
            <span>Політика конфіденційності</span>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

      </main>

    </div>

  </div>
</template>
