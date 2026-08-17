export const formatCurrency = (value: number) => {
  return value.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' })
}

export const formatTime = (minutes: number): string => {
  if (!minutes) return '0 хв'
  if (minutes < 60) return `${minutes} хв`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} год ${remainingMinutes} хв` : `${hours} год`
}

export const categoryTranslations: Record<string, string> = {
  "Breakfast & Brunch": "Сніданки та бранчі",
  "Appetizers & Starters": "Закуски та аперитиви",
  "Soups & Stews": "Супи та рагу",
  "Salads": "Салати",
  "Poultry": "Птиця",
  "Meat": "М'ясні страви",
  "Seafood": "Морепродукти",
  "Side Dishes": "Гарніри",
  "Snacks": "Снеки та перекуси",
  "Breads & Bakery": "Хліб та випічка",
  "Desserts": "Десерти",
  "Beverages": "Безалкогольні напої",
  "Sauces & Dressings": "Соуси та заправки",
  "Drinks": "Напої та коктейлі",
}

export const cuisineTranslations: Record<string, string> = {
  "american": "Американська",
  "british": "Британська",
  "chinese": "Китайська",
  "french": "Французька",
  "georgian": "Грузинська",
  "german": "Німецька",
  "greek": "Грецька",
  "indian": "Індійська",
  "italian": "Італійська",
  "japanese": "Японська",
  "korean": "Корейська",
  "mexican": "Мексиканська",
  "polish": "Польська",
  "spanish": "Іспанська",
  "thai": "Тайська",
  "turkish": "Турецька",
  "ukrainian": "Українська",
  "vietnamese": "В'єтнамська",
  "other": "Інша"
}

export const difficultyTranslations: Record<string, string> = {
  "easy": "Легко",
  "medium": "Середньо",
  "hard": "Складно"
}

export const cookSpeedTranslations: Record<string, string> = {
  "fast": "Швидко",
  "medium": "Помірно",
  "slow": "Повільно"
}

export const tasteTranslations: Record<string, string> = {
  "bitter": "Гірке",
  "neutral": "Нейтральне",
  "savory": "Пряне",
  "sour": "Кисне",
  "spicy": "Гостре",
  "sweet": "Солодке",
  "umami": "Умамі"
}

export const translateCategory = (category: string): string => {
  return categoryTranslations[category] || category
}

export const translateCuisine = (cuisine: string): string => {
  return cuisineTranslations[cuisine] || cuisine
}

export const translateDifficulty = (difficulty: string): string => {
  return difficultyTranslations[difficulty] || difficulty
}

export const translateCookSpeed = (speed: string): string => {
  return cookSpeedTranslations[speed] || speed
}

export const translateTaste = (taste: string): string => {
  return tasteTranslations[taste] || taste
}

export interface DietBadge {
  key: string
  label: string
  icon: string
  class: string
}

export const dietaryTranslations = {
  "isVegan": { label: "Веган", icon: "🌱", class: "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 border-emerald-100/15" },
  "isVegetarian": { label: "Вегетаріанське", icon: "🥦", class: "bg-green-50/50 dark:bg-green-950/15 text-green-600 dark:text-green-400 border-green-100/15" },
  "isGluten_free": { label: "Без глютену", icon: "🌾", class: "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 border-amber-100/15" },
  "isHalal": { label: "Халяль", icon: "🕌", class: "bg-sky-50/50 dark:bg-sky-950/15 text-sky-600 dark:text-sky-400 border-sky-100/15" },
  "isKosher": { label: "Кошерне", icon: "✡️", class: "bg-indigo-50/50 dark:bg-indigo-950/15 text-indigo-600 dark:text-indigo-400 border-indigo-100/15" },
  "isDairyFree": { label: "Без лактози", icon: "🥛", class: "bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 border-blue-100/15" },
  "isNutFree": { label: "Без горіхів", icon: "🥜", class: "bg-rose-50/50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-100/15" },

  "Vegan": { label: "Веган", icon: "🌱", class: "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 border-emerald-100/15" },
  "Vegetarian": { label: "Вегетаріанське", icon: "🥦", class: "bg-green-50/50 dark:bg-green-950/15 text-green-600 dark:text-green-400 border-green-100/15" },
  "Gluten-Free": { label: "Без глютену", icon: "🌾", class: "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 border-amber-100/15" },
  "Gluten_free": { label: "Без глютену", icon: "🌾", class: "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 border-amber-100/15" },
  "Halal": { label: "Халяль", icon: "🕌", class: "bg-sky-50/50 dark:bg-sky-950/15 text-sky-600 dark:text-sky-400 border-sky-100/15" },
  "Kosher": { label: "Кошерне", icon: "✡️", class: "bg-indigo-50/50 dark:bg-indigo-950/15 text-indigo-600 dark:text-indigo-400 border-indigo-100/15" },
  "Dairy-Free": { label: "Без лактози", icon: "🥛", class: "bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 border-blue-100/15" },
  "Dairy_free": { label: "Без лактози", icon: "🥛", class: "bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 border-blue-100/15" },
  "Nut-Free": { label: "Без горіхів", icon: "🥜", class: "bg-rose-50/50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-100/15" },
  "Nut_free": { label: "Без горіхів", icon: "🥜", class: "bg-rose-50/50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-100/15" },
  "Low-Carb": { label: "Низьковуглеводне", icon: "🥩", class: "bg-fuchsia-50/50 dark:bg-fuchsia-950/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-100/15" },
  "Keto": { label: "Кето", icon: "🥑", class: "bg-yellow-50/50 dark:bg-yellow-950/15 text-yellow-600 dark:text-yellow-400 border-yellow-100/15" }
} as const

export const translateDietary = (diet: string) => {
  return dietaryTranslations[diet as keyof typeof dietaryTranslations] || { label: diet, icon: '🍽️', class: 'bg-smak-neutral-50 dark:bg-smak-neutral-900 text-smak-neutral-600 dark:text-smak-neutral-400 border-smak-neutral-100 dark:border-smak-neutral-800' }
}

export const dietBadgesConfig: DietBadge[] = [
  { key: 'isVegan', ...dietaryTranslations['isVegan'] },
  { key: 'isVegetarian', ...dietaryTranslations['isVegetarian'] },
  { key: 'isGluten_free', ...dietaryTranslations['isGluten_free'] },
  { key: 'isHalal', ...dietaryTranslations['isHalal'] },
  { key: 'isKosher', ...dietaryTranslations['isKosher'] },
  { key: 'isDairyFree', ...dietaryTranslations['isDairyFree'] },
  { key: 'isNutFree', ...dietaryTranslations['isNutFree'] }
]

export const getActiveDiets = (recipe: Record<string, any>): DietBadge[] => {
  if (!recipe) return []
  return dietBadgesConfig.filter(badge => !!recipe[badge.key])
}

export const allergyTranslations = {
  "Shellfish": { label: "Морепродукти", icon: "🦐", class: "bg-red-50/50 dark:bg-red-950/15 text-red-600 dark:text-red-400 border-red-100/15" },
  "Nuts": { label: "Горіхи", icon: "🌰", class: "bg-rose-50/50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-100/15" },
  "Peanuts": { label: "Арахіс", icon: "🥜", class: "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 border-amber-100/15" },
  "Soy": { label: "Соя", icon: "🫘", class: "bg-yellow-50/50 dark:bg-yellow-950/15 text-yellow-600 dark:text-yellow-400 border-yellow-100/15" },
  "Wheat": { label: "Пшениця", icon: "🌾", class: "bg-orange-50/50 dark:bg-orange-950/15 text-orange-600 dark:text-orange-400 border-orange-100/15" },
  "Eggs": { label: "Яйця", icon: "🥚", class: "bg-yellow-100/50 dark:bg-yellow-950/10 text-yellow-700 dark:text-yellow-400 border-yellow-200/20" },
  "Milk": { label: "Молоко", icon: "🥛", class: "bg-blue-50/50 dark:bg-blue-950/15 text-blue-600 dark:text-blue-400 border-blue-100/15" },
  "Fish": { label: "Риба", icon: "🐟", class: "bg-sky-50/50 dark:bg-sky-950/15 text-sky-600 dark:text-sky-400 border-sky-100/15" },
  "Gluten": { label: "Глютен", icon: "🌾", class: "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400 border-amber-100/15" },
  "Sesame": { label: "Кунжут", icon: "🌱", class: "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 border-emerald-100/15" }
} as const

export const translateAllergy = (allergy: string) => {
  return allergyTranslations[allergy as keyof typeof allergyTranslations] || { label: allergy, icon: "⚠️", class: "bg-red-50/50 dark:bg-red-950/15 text-red-600 dark:text-red-400 border-red-100/15" }
}

export const statusTranslations: Record<string, string> = {
  "public": "Опубліковано",
  "draft": "Чернетка",
  "archived": "В архіві",
  "rejected": "Відхилено",
  "premoderation": "На перевірці",
  "moderation": "Модерація"
}

export const translateStatus = (status: string): string => {
  return statusTranslations[status] || status
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

export const subscriptionStatusTranslations: Record<string, string> = {
  "ACTIVE": "Активна",
  "PAST_DUE": "Прострочена",
  "EXPIRED": "Закінчилася",
  "CANCELED": "Скасована"
}

export const translateSubscriptionStatus = (status: string): string => {
  return subscriptionStatusTranslations[status] || status
}

export const paymentStatusTranslations: Record<string, string> = {
  "SUCCESS": "Успішно",
  "PENDING": "Очікує",
  "FAILURE": "Неуспішно",
  "ERROR": "Помилка",
  "REVERSED": "Повернено"
}

export const translatePaymentStatus = (status: string): string => {
  return paymentStatusTranslations[status] || status
}
