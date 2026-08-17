<script setup lang="ts">
useSeoMeta({
  title: 'SMAK | Політика конфіденційності',
  description: 'Повний перелік зібраних даних, порядок їх використання, заходи безпеки та права користувача на кулінарній платформі SMAK.',
  ogTitle: 'SMAK — Політика конфіденційності',
  ogDescription: 'Дізнайтеся, як SMAK захищає ваші дані, використовує технічні cookie, взаємодіє з ШІ та які права ви маєте.'
})

const lastUpdated = '17 серпня 2026 року'

const navItems = [
  { id: 'data-collected', title: '1. Які дані ми збираємо' },
  { id: 'data-usage', title: '2. Як використовуються дані' },
  { id: 'cookies', title: '3. Файли Cookie та сесії' },
  { id: 'third-party-services', title: '4. Сторонні сервіси' },
  { id: 'data-security', title: '5. Захист та безпека даних' },
  { id: 'user-rights', title: '6. Ваші права як користувача' },
  { id: 'data-retention', title: '7. Терміни зберігання' },
  { id: 'contact', title: '8. Контакти' }
]
</script>

<template>
  <div class="w-full space-y-8 sm:space-y-12">
    
    <!-- Top Hero Section -->
    <div class="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-smak-neutral-900 dark:via-smak-neutral-900 dark:to-emerald-950/20 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl sm:rounded-4xl p-6 sm:p-10 lg:p-12 shadow-xs">
      <div class="max-w-3xl space-y-4 text-left">
        <h1 class="font-heading font-black text-3xl sm:text-5xl text-smak-neutral-900 dark:text-white tracking-tight">
          Політика <span class="text-emerald-500">конфіденційності</span>
        </h1>

        <p class="text-sm sm:text-base text-smak-neutral-600 dark:text-smak-neutral-300 leading-relaxed">
          Ми поважаємо вашу приватність. Ознайомтеся з повним переліком даних, які збираються на платформі SMAK, цілями їх обробки, заходами криптографічного захисту та вашими правами.
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
              class="block px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
            >
              {{ item.title }}
            </a>
          </nav>
        </div>
      </aside>

      <!-- Main Legal Articles Column -->
      <main class="lg:col-span-8 space-y-10 sm:space-y-12">
        
        <!-- Section 1 -->
        <section id="data-collected" class="scroll-mt-24 space-y-4">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">1</span>
            <span>Які дані ми збираємо</span>
          </h2>
          
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Платформа SMAK здійснює обробку виключно тих категорій інформації, які є необхідними для надання повноцінного кулінарного сервісу та взаємодії з ШІ:
          </p>

          <ul class="list-disc pl-5 space-y-2.5 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><strong>Дані облікового запису та профілю:</strong> адреса електронної пошти (email), ім'я та прізвище користувача, публічний нікнейм, посилання на аватар, коротка біографія (Bio), дата створення акаунту та статус підтвердження email. Паролі зберігаються виключно у вигляді незворотного криптографічного хешу (Argon2id).</li>
            <li><strong>Кулінарні налаштування, дієти та алергії:</strong> обрані вами типи харчування (веганство, вегетаріанство, кето, палео, безлактозна чи безглютенова дієти) та перелік харчових алергенів (горіхи, морепродукти, соя, арахіс тощо), які використовуються для фільтрації рецептів.</li>
            <li><strong>Діалоги з кулінарним ШІ-асистентом:</strong> текст ваших запитів, назви створених чатів, історія відповідей асистента, параметри викликаних ШІ-інструментів (пошук страв, підбір інгредієнтів) та часові мітки повідомлень.</li>
            <li><strong>Користувацький контент (UGC):</strong> створені вами рецепти (назви, описи, інгредієнти, кроки приготування, харчова цінність, завантажені фотографії страв), персональні публічні чи приватні колекції, відгуки, текстові коментарі та виставлені оцінки (рейтинги від 1 до 5 зірок).</li>
            <li><strong>Платіжна та фінансова інформація:</strong> ідентифікатори транзакцій (Order ID, Payment ID), статус оплати (Pending, Success, Failure), сума та валюта (UAH), обраний тарифний план (Free, Pro, Premium), дата початку та завершення підписки. Платформа не збирає і не зберігає повні номери банківських карток чи CVV/CVC-коди — обробка платіжних реквізитів відбувається на захищеній стороні шлюзу LiqPay.</li>
            <li><strong>Технічні та системні логи:</strong> IP-адреса для захисту від DDoS-атак та брутфорсу (Rate Limiting), тип та версія веб-браузера (User-Agent), мова інтерфейсу, логи помилок та результати автоматичної модерації контенту.</li>
          </ul>
        </section>

        <!-- Section 2 -->
        <section id="data-usage" class="scroll-mt-24 space-y-4">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">2</span>
            <span>Як використовуються ваші дані</span>
          </h2>

          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Зібрана інформація використовується виключно для забезпечення стабільної роботи застосунку та надання функцій платформи:
          </p>

          <ul class="list-disc pl-5 space-y-2 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><strong>Аутентифікація та доступ:</strong> ідентифікація користувача, видача сесійних JWT-токенів, відновлення забутого пароля та керування профілем.</li>
            <li><strong>Персоналізація кулінарного каталогу:</strong> автоматичне виключення страв, які містять зазначені вами алергени, та пріоритезація рецептів за вашими дієтами.</li>
            <li><strong>Генерація відповідей у ШІ-чаті:</strong> передача контексту кулінарних запитів у Google Gemini API для надання індивідуальних порад, генерації таймерів та підбору замін інгредієнтів.</li>
            <li><strong>Семантичний векторний пошук:</strong> обчислення багатовимірних ембеддінгів для швидкого пошуку страв за природним описом у базі PostgreSQL (розширення <code class="text-xs bg-smak-neutral-100 dark:bg-smak-neutral-800 px-1.5 py-0.5 rounded font-mono">pgvector</code>).</li>
            <li><strong>Модерація безпеки:</strong> автоматична перевірка доданих рецептів, відгуків та зображень чергою BullMQ на відповідність нормам етики та безпеки.</li>
            <li><strong>Управління підписками:</strong> перевірка лімітів щоденних AI-запитів згідно з вашим тарифним планом.</li>
            <li><strong>Захист інфраструктури:</strong> відстеження пікових навантажень, блокування шкідливих ботів та обмеження частоти запитів через Redis.</li>
          </ul>

          <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Платформа SMAK не продає, не передає та не здає в оренду ваші персональні дані стороннім маркетинговим, брокерським чи рекламним компаніям.
          </div>
        </section>

        <!-- Section 3 -->
        <section id="cookies" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">3</span>
            <span>Файли Cookie та сесійне сховище</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Платформа використовує виключно <strong>технічні, суворо необхідні сесійні Cookie та локальне сховище (LocalStorage)</strong>:
          </p>
          <ul class="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><code class="text-xs bg-smak-neutral-100 dark:bg-smak-neutral-800 px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400">accessToken</code> — захищений токен авторизації для виконання API-запитів.</li>
            <li><code class="text-xs bg-smak-neutral-100 dark:bg-smak-neutral-800 px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400">refreshToken</code> — захищений HttpOnly cookie для автоматичного оновлення сесії без повторного введення пароля.</li>
            <li>Збереження стану теми оформлення (світла / темна тема).</li>
          </ul>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Ми <strong>не встановлюємо</strong> маркетингових cookies, пікселів відстеження соціальних мереж чи сторонніх аналітичних систем.
          </p>
        </section>

        <!-- Section 4 -->
        <section id="third-party-services" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">4</span>
            <span>Сторонні інженерні сервіси та провайдери</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Для виконання спеціалізованих обчислювальних та інфраструктурних завдань платформа взаємодіє з такими сервісами:
          </p>
          <ul class="list-disc pl-5 space-y-2 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><strong>Google GenAI (Gemini API):</strong> генерація кулінарних відповідей у реальному часі та розрахунок векторних ембеддінгів.</li>
            <li><strong>Cloudinary CDN:</strong> безпечне хмарне збереження, оптимізація та стиснення фотографій рецептів.</li>
            <li><strong>LiqPay:</strong> захищена обробка платежів за тарифи через захищені протоколи банківського еквайрингу.</li>
            <li><strong>Nodemailer / Поштовий шлюз:</strong> доставка транзакційних листів для підтвердження email та скидання пароля.</li>
          </ul>
        </section>

        <!-- Section 5: Security (Dedicated Section) -->
        <section id="data-security" class="scroll-mt-24 space-y-4">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">5</span>
            <span>Захист та безпека даних</span>
          </h2>

          <ul class="list-disc pl-5 space-y-2.5 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><strong>Хешування паролів:</strong> паролі захищено за допомогою сучасного криптографічного алгоритму <strong>Argon2id</strong> з випадковою сіллю (salt), що унеможливлює їхнє розшифрування.</li>
            <li><strong>Шифрування передачі даних:</strong> увесь трафік між вашим браузером та сервером шифрується протоколами <strong>HTTPS (TLS 1.3)</strong>, що унеможливлює перехоплення інформації.</li>
            <li><strong>Контроль доступу:</strong> доступ до серверної інфраструктури та баз даних суворо обмежений і захищений від несанкціонованого зовнішнього втручання.</li>
          </ul>
        </section>

        <!-- Section 6: User Rights (Dedicated Section) -->
        <section id="user-rights" class="scroll-mt-24 space-y-4">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">6</span>
            <span>Ваші права як користувача</span>
          </h2>

          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Ви володієте повним контролем над своїми персональними даними на платформі SMAK:
          </p>

          <ul class="list-disc pl-5 space-y-2 text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            <li><strong>Право на доступ та редагування (Right to Access & Rectification):</strong> ви можете в будь-який момент змінити свої персональні дані, пароль, аватар, перелік дієт або алергій безпосередньо у налаштуваннях свого кабінету.</li>
            <li><strong>Право на видалення («Право на забуття» / Right to Erasure):</strong> ви маєте повне право надіслати запит на безповоротне видалення свого облікового запису, історії повідомлень у чаті з ШІ, створених рецептів та колекцій.</li>
            <li><strong>Право на керування контентом:</strong> ви можете в будь-який момент редагувати чи видаляти створені вами рецепти, коментарі та відгуки.</li>
            <li><strong>Право на відкликання згоди:</strong> ви можете очистити дієтичні фільтри або припинити використання платформи в будь-який час.</li>
          </ul>
        </section>

        <!-- Section 7 -->
        <section id="data-retention" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">7</span>
            <span>Терміни зберігання інформації</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Персональні дані облікового запису та історія діалогів зберігаються протягом періоду активності вашого акаунту. У разі надходження запиту на видалення облікового запису, персональні ідентифікаційні дані видаляються з робочих баз даних протягом 30 календарних днів.
          </p>
        </section>

        <!-- Section 8 -->
        <section id="contact" class="scroll-mt-24 space-y-3">
          <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0">8</span>
            <span>Контакти з питань конфіденційності</span>
          </h2>
          <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed">
            Якщо у вас виникли запитання щодо політики конфіденційності або ви бажаєте реалізувати своє право на видалення персональних даних, зв'яжіться з автором за адресою: <a href="mailto:a.lukiank@gmail.com" class="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">a.lukiank@gmail.com</a>.
          </p>
        </section>

        <!-- Bottom Return Link -->
        <div class="pt-8 border-t border-smak-neutral-100 dark:border-smak-neutral-800 flex items-center justify-between">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-smak-neutral-100 hover:bg-emerald-500 hover:text-white dark:bg-smak-neutral-800 dark:hover:bg-emerald-500 text-smak-neutral-800 dark:text-white transition-all shadow-xs"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
            <span>На головну</span>
          </NuxtLink>

          <NuxtLink
            to="/terms"
            class="inline-flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Умови використання</span>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

      </main>

    </div>

  </div>
</template>
