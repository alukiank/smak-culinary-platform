/**
 * Centralized API Error Parser and Localizer
 * Converts raw ofetch/HTTP errors and standard English NestJS responses into clear Ukrainian messages for UI.
 */

const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'invalid credentials': 'Невірний email або пароль.',
  'invalid old password': 'Невірний старий пароль.',
  'invalid token or user not found': 'Недійсний токен або користувача не знайдено.',
  'token is invalid or has expired': 'Токен недійсний або його термін дії закінчився.',
  'email is already verified': 'Email вже підтверджено.',
  'invalid email or email already verified': 'Email вже підтверджено або некоректний.',
  'user with this username already exists': 'Користувач із таким нікнеймом вже існує.',
  'user with this email already exists': 'Користувач із такою електронною поштою вже існує.',
  'your account has been banned': 'Ваш акаунт заблоковано. Зверніться до служби підтримки.',
  'throttlerexception: too many requests': 'Забагато спроб. Будь ласка, зачекайте кілька хвилин перед наступною спробою.',
  'too many requests': 'Забагато спроб. Будь ласка, зачекайте кілька хвилин перед наступною спробою.',
  'cannot rename system collection': 'Неможливо перейменувати системну колекцію.',
  'cannot delete system collection': 'Неможливо видалити системну колекцію.',
  'collection not found': 'Колекцію не знайдено.',
  'recipe not found': 'Рецепт не знайдено.',
  'comment not found': 'Коментар не знайдено.',
  'review not found': 'Відгук не знайдено.',
  'user not found': 'Користувача не знайдено.',
  'internal server error': 'Сталася внутрішня помилка сервера. Спробуйте пізніше.',
  'unauthorized': 'Необхідна авторизація.'
}

const VALIDATION_PATTERNS: Array<[RegExp, string]> = [
  [/email.*must be (an|a valid) email/i, 'Вкажіть коректну адресу електронної пошти.'],
  [/password.*(longer than or equal to 12|at least 12)/i, 'Пароль повинен містити щонайменше 12 символів.'],
  [/password.*shorter than or equal to 128/i, 'Пароль не повинен перевищувати 128 символів.'],
  [/password.*(letter|digit|special|strong|complexity)/i, 'Пароль повинен містити велику та малу літери, цифру та спецсимвол.'],
  [/username.*longer than or equal to 3/i, 'Нікнейм має містити щонайменше 3 символи.'],
  [/username.*shorter than or equal to 30/i, 'Нікнейм не повинен перевищувати 30 символів.'],
  [/username.*(unique|exists|already)/i, 'Користувач із таким нікнеймом вже існує.'],
  [/email.*(unique|exists|already)/i, 'Користувач із такою електронною поштою вже існує.'],
  [/displayname.*(longer|not empty|must be)/i, 'Вкажіть ваше ім’я та прізвище (щонайменше 2 символи).']
]

/**
 * Translates a single validation or system message into Ukrainian.
 */
function translateMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return ''

  const trimmed = msg.trim()
  if (/[а-яіїєґ]/i.test(trimmed)) {
    return trimmed
  }

  const normalizedKey = trimmed.toLowerCase().replace(/[.!\s]+$/, '')
  if (MESSAGE_TRANSLATIONS[normalizedKey]) {
    return MESSAGE_TRANSLATIONS[normalizedKey]
  }

  for (const [pattern, translation] of VALIDATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return translation
    }
  }

  return trimmed
}

/**
 * Checks if the error is caused by server unavailability or network loss.
 */
function isNetworkOrServerUnavailable(err: any): boolean {
  if (!err) return false

  const status = err.statusCode || err.status || err.response?.status
  if (status === 502 || status === 503 || status === 504) {
    return true
  }

  // If status is 0 or undefined and no response exists
  if (!err.response && (status === 0 || status === undefined)) {
    return true
  }

  const msg = (err.message || '').toLowerCase()
  const name = err.name || ''

  if (
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('failed to connect') ||
    (name === 'FetchError' && !err.response)
  ) {
    return true
  }

  return false
}

/**
 * Formats any caught API / ofetch error into a user-friendly Ukrainian string.
 *
 * @param err The caught error object
 * @param defaultFallback Contextual fallback message if error cannot be resolved
 */
export function formatApiError(err: any, defaultFallback: string = 'Сталася помилка. Спробуйте пізніше.'): string {
  if (!err) return defaultFallback

  // 1. Network / Server Down / Reverse Proxy 502, 503, 504
  if (isNetworkOrServerUnavailable(err)) {
    return 'Сервер тимчасово недоступний. Будь ласка, перевірте з’єднання з інтернетом або спробуйте пізніше.'
  }

  const status = err.statusCode || err.status || err.response?.status
  const data = err.data

  // 2. HTTP 500 (Internal Server Error)
  if (status === 500) {
    return 'Сталася внутрішня помилка сервера. Спробуйте пізніше.'
  }

  // 3. HTTP 429 (Rate Limit)
  if (status === 429) {
    return 'Забагато спроб. Будь ласка, зачекайте кілька хвилин перед наступною спробою.'
  }

  // 4. HTTP 401 (Unauthorized)
  if (status === 401) {
    const rawMsg = data?.message
    if (rawMsg && typeof rawMsg === 'string' && rawMsg !== 'Unauthorized' && rawMsg !== 'Invalid credentials') {
      return translateMessage(rawMsg)
    }
    return 'Невірний email або пароль.'
  }

  // 5. HTTP 403 (Forbidden)
  if (status === 403) {
    const rawMsg = (data?.message || '').toLowerCase()
    if (rawMsg.includes('banned') || rawMsg.includes('заблок')) {
      return 'Ваш акаунт заблоковано. Зверніться до служби підтримки.'
    }
    if (rawMsg.includes('verify') || rawMsg.includes('підтверд')) {
      return 'Будь ласка, підтвердіть вашу електронну пошту.'
    }
    return translateMessage(data?.message) || 'Доступ заборонено.'
  }

  // 6. HTTP 409 (Conflict)
  if (status === 409) {
    const rawMsg = (data?.message || '').toLowerCase()
    if (rawMsg.includes('username') || rawMsg.includes('нікнейм')) {
      return 'Користувач із таким нікнеймом вже існує.'
    }
    if (rawMsg.includes('email') || rawMsg.includes('пошт')) {
      return 'Користувач із такою електронною поштою вже існує.'
    }
    return translateMessage(data?.message) || 'Користувач із такими даними вже існує.'
  }

  // 7. HTTP 404 (Not Found)
  if (status === 404) {
    const rawMsg = (data?.message || '').toLowerCase()
    if (rawMsg.includes('user') || rawMsg.includes('користувач')) {
      return 'Користувача не знайдено.'
    }
    if (rawMsg.includes('recipe') || rawMsg.includes('рецепт')) {
      return 'Рецепт не знайдено.'
    }
    return translateMessage(data?.message) || 'Запитуваний ресурс не знайдено.'
  }

  // 8. HTTP 400 (Bad Request / Validation array or string)
  if (data?.message) {
    if (Array.isArray(data.message)) {
      const translatedList = data.message
        .map((m: any) => translateMessage(String(m)))
        .filter(Boolean)

      const uniqueList = Array.from(new Set(translatedList))
      if (uniqueList.length > 0) {
        return uniqueList.join('\n')
      }
    } else if (typeof data.message === 'string') {
      const translated = translateMessage(data.message)
      if (translated) return translated
    }
  }

  // 9. Fallback message if available and in Cyrillic, otherwise use defaultFallback
  if (typeof data?.error === 'string' && /[а-яіїєґ]/i.test(data.error)) {
    return data.error
  }

  return defaultFallback
}
