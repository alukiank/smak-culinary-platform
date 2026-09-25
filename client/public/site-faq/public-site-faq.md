# Culinary Platform SMAK — Site Structure & Features Documentation

This document is automatically generated based on the source code of the site pages. It contains a complete list of routes, full URLs, page descriptions, and lists of available features. The AI assistant should use this description as a knowledge base to help users and provide direct clickable links to site pages.

## List of All Available Links (Routes)

| Page Name | Full URL (Link) | Route (Path) | Access / Restrictions |
| :--- | :--- | :--- | :--- |
| **SMAK — Відкрийте світ смаку разом з нами!** | [{{BASE_URL}}]({{BASE_URL}}) | `/` | 🌐 Public |
| **Відновлення пароля** | [{{BASE_URL}}/auth/forgot-password]({{BASE_URL}}/auth/forgot-password) | `/auth/forgot-password` | 🌐 Public |
| **Вхід** | [{{BASE_URL}}/auth/login]({{BASE_URL}}/auth/login) | `/auth/login` | 🌐 Public |
| **Реєстрація** | [{{BASE_URL}}/auth/register]({{BASE_URL}}/auth/register) | `/auth/register` | 🌐 Public |
| **Створення нового пароля** | [{{BASE_URL}}/auth/reset-password]({{BASE_URL}}/auth/reset-password) | `/auth/reset-password` | 🌐 Public |
| **Підтвердження пошти** | [{{BASE_URL}}/auth/verify]({{BASE_URL}}/auth/verify) | `/auth/verify` | 🌐 Public |
| **Plans and subscriptions** | [{{BASE_URL}}/billing/plans]({{BASE_URL}}/billing/plans) | `/billing/plans` | 🌐 Public |
| **Interactive AI assistant (Chat)** | [{{BASE_URL}}/chats/:id?]({{BASE_URL}}/chats/:id?) | `/chats/:id?` | 🌐 Public |
| **Політика конфіденційності** | [{{BASE_URL}}/privacy]({{BASE_URL}}/privacy) | `/privacy` | 🌐 Public |
| **<Profile Settings>** | [{{BASE_URL}}/profile]({{BASE_URL}}/profile) | `/profile` | 🔐 Authorized (auth) |
| **My Collections** | [{{BASE_URL}}/profile/collections]({{BASE_URL}}/profile/collections) | `/profile/collections` | 🔐 Authorized (auth) |
| **Detailed Collection view** | [{{BASE_URL}}/profile/collections/:id]({{BASE_URL}}/profile/collections/:id) | `/profile/collections/:id` | 🔐 Authorized (auth) |
| **My Recipes** | [{{BASE_URL}}/profile/recipes]({{BASE_URL}}/profile/recipes) | `/profile/recipes` | 🔐 Authorized (auth) |
| **Recipe search and catalog** | [{{BASE_URL}}/recipes]({{BASE_URL}}/recipes) | `/recipes` | 🌐 Public |
| **Detailed recipe view** | [{{BASE_URL}}/recipes/:id]({{BASE_URL}}/recipes/:id) | `/recipes/:id` | 🌐 Public |
| **New Recipe creation** | [{{BASE_URL}}/recipes/create]({{BASE_URL}}/recipes/create) | `/recipes/create` | 🔐 Authorized (verified) |
| **Edit Recipe** | [{{BASE_URL}}/recipes/edit/:id]({{BASE_URL}}/recipes/edit/:id) | `/recipes/edit/:id` | 🔐 Authorized (auth, verified, owner) |
| **Умови використання** | [{{BASE_URL}}/terms]({{BASE_URL}}/terms) | `/terms` | 🌐 Public |
| **Public Chef Profile** | [{{BASE_URL}}/users/:id]({{BASE_URL}}/users/:id) | `/users/:id` | 🌐 Public |

---

## Detailed Description of Pages and Features

### 📍 Page: SMAK — Відкрийте світ смаку разом з нами!

* **Full URL:** [{{BASE_URL}}]({{BASE_URL}})
* **Route (Path):** `/`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Розумний ШІ-помічник у світі кулінарії. Підбір рецептів, персональне меню та спільнота.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Відновлення пароля

* **Full URL:** [{{BASE_URL}}/auth/forgot-password]({{BASE_URL}}/auth/forgot-password)
* **Route (Path):** `/auth/forgot-password`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Інструкції для скидання пароля надіслано на вашу пошту.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Вхід

* **Full URL:** [{{BASE_URL}}/auth/login]({{BASE_URL}}/auth/login)
* **Route (Path):** `/auth/login`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Вітаємо на платформі SMAK!

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Реєстрація

* **Full URL:** [{{BASE_URL}}/auth/register]({{BASE_URL}}/auth/register)
* **Route (Path):** `/auth/register`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш акаунт створено. Перевірте пошту для підтвердження email!

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Створення нового пароля

* **Full URL:** [{{BASE_URL}}/auth/reset-password]({{BASE_URL}}/auth/reset-password)
* **Route (Path):** `/auth/reset-password`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш новий пароль встановлено успішно. Тепер ви можете увійти в кабінет.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Підтвердження пошти

* **Full URL:** [{{BASE_URL}}/auth/verify]({{BASE_URL}}/auth/verify)
* **Route (Path):** `/auth/verify`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш обліковий запис тепер успішно активовано.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Plans and subscriptions

* **Full URL:** [{{BASE_URL}}/billing/plans]({{BASE_URL}}/billing/plans)
* **Route (Path):** `/billing/plans`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Page for selecting a tariff plan for users of the SMAK platform. Allows the user to compare the features of FREE, PRO and PREMIUM plans, purchase a paid plan through LiqPay and manage the current subscription.

#### Available Features (what can be done on this page):
- Plan comparison: FREE (1 collection, 10 AI queries/day), PRO (10 collections, 50 AI queries/day, allergen filter, no ads) and PREMIUM (unlimited collections and AI queries, priority support).
- Subscription payment: secure payment of PRO or PREMIUM tariff by card through integration with LiqPay payment system (redirect to LiqPay).
- Subscription management: view status of active subscription (next billing date), save paid features until the end of the period when cancelled and ability to cancel subscription through confirmation modal window.

---

### 📍 Page: Interactive AI assistant (Chat)

* **Full URL:** [{{BASE_URL}}/chats/:id?]({{BASE_URL}}/chats/:id?)
* **Route (Path):** `/chats/:id?`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Page for communicating with the smart culinary AI assistant of the SMAK platform. Allows the user to receive advice, adapt recipes to their own products or diet, and quickly switch to cooking dishes.

#### Available Features (what can be done on this page):
- Real-time AI communication: receiving culinary advice, cooking instructions, automatic ingredient replacement.
- Chat sidebar: history of all user dialogues, creation of new chats, quick switching between existing sessions.
- Chat management: ability to rename dialogue, archive outdated chats or delete them completely.
- Integration with recipes: if the chat is linked to a specific recipe, quick buttons are available to go to the recipe details page (/recipes/:id) or start the step-by-step cooking mode (Cook Mode: /recipes/cook/:id).
- Quick tips: a set of popular clickable queries ("What to cook for dinner?", "Borscht recipe", etc.) for a quick start to the dialogue.
- Archive mode: a warning that the chat is archived (sending new messages is blocked, read-only mode available).

---

### 📍 Page: Політика конфіденційності

* **Full URL:** [{{BASE_URL}}/privacy]({{BASE_URL}}/privacy)
* **Route (Path):** `/privacy`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Повний перелік зібраних даних, порядок їх використання, заходи безпеки та права користувача на кулінарній платформі SMAK.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: <Profile Settings>

* **Full URL:** [{{BASE_URL}}/profile]({{BASE_URL}}/profile)
* **Route (Path):** `/profile`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
Personal account of the kulinar. Allows you to edit personal data, configure food restrictions (allergies, diets), manage security (passwords) and delete your account.

#### Available Features (what can be done on this page):
- <Editing profile>: <change username, public display name and email.>
- <Email verification>: <display status of email confirmation and ability to resend request to activate your account.>
- <Food restrictions and diets> (available for PRO-users): <setting up a list of allergies (e.g., nuts, lactose, gluten, etc.) and diets (e.g., vegetarianism, veganism, keto), which the AI automatically uses to adapt recipes.>
- <Account security>: <changing the current password to a new one with an interactive password strength indicator (requires at least 12 characters, uppercase/lowercase letters, numbers and special characters).>
- <Risk zone>: <possibility of irreversible deletion of the user's account with confirmation by entering a unique username.>

---

### 📍 Page: My Collections

* **Full URL:** [{{BASE_URL}}/profile/collections]({{BASE_URL}}/profile/collections)
* **Route (Path):** `/profile/collections`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
Page for managing the user's custom recipe collections. Allows grouping favorited recipes. Free tier allows up to 1 collection, while premium plans unlock more.

#### Available Features (what can be done on this page):
- Create collection: modal form to create a new collection with name and description (billing tier checks apply).
- Edit collection: rename and update the description of an existing collection.
- Delete collection: delete custom collections with confirmation modal (does not delete recipes, only the collection folder).
- View collections: list of collections linking to detailed collection pages (/profile/collections/:id).

---

### 📍 Page: Detailed Collection view

* **Full URL:** [{{BASE_URL}}/profile/collections/:id]({{BASE_URL}}/profile/collections/:id)
* **Route (Path):** `/profile/collections/:id`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
View details of a specific recipe collection created by the user. Displays all grouped recipes in that folder.

#### Available Features (what can be done on this page):
- Edit collection: rename or edit description of this collection.
- Delete collection: delete the entire collection folder (recipes are kept).
- Remove recipe: remove a specific recipe from this collection with confirmation modal.
- Navigation: link to go back to all collections (/profile/collections) or start exploring recipes catalog (/recipes).

---

### 📍 Page: My Recipes

* **Full URL:** [{{BASE_URL}}/profile/recipes]({{BASE_URL}}/profile/recipes)
* **Route (Path):** `/profile/recipes`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
User's personal recipe library page. Allows managing published recipes, drafts, archived items, and items awaiting moderation.

#### Available Features (what can be done on this page):
- Filter recipes: tabs for viewing all, public, drafts, pre-moderation, rejected, or archived recipes.
- Search: search recipes by name using a search bar.
- Recipe management: delete recipes with confirmation modal, edit drafts, move recipes to drafts, publish (submit to moderation), archive and unarchive recipes.

---

### 📍 Page: Recipe search and catalog

* **Full URL:** [{{BASE_URL}}/recipes]({{BASE_URL}}/recipes)
* **Route (Path):** `/recipes`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
The main catalog of dishes of the SMAK platform. Allows you to search for recipes in natural language (semantic vector search pgvector) and apply advanced culinary and dietary filters.

#### Available Features (what can be done on this page):
- Intelligent semantic search: AI analyzes the semantic content of the search query instead of simple word search. Results are sorted by semantic similarity or novelty.
- Advanced filtering: filtering by dish category, cuisine country, difficulty level, cooking time, health score, minimum rating from reviews.
- Dietary restrictions and allergens: quick filters for vegan, vegetarian, gluten-free, lactose-free, nut-free, halal and kosher dishes.
- Visual badges of active filters: quick removal of any filter with one click.
- Pagination of search results with an indicator of the total number of found dishes.

---

### 📍 Page: Detailed recipe view

* **Full URL:** [{{BASE_URL}}/recipes/:id]({{BASE_URL}}/recipes/:id)
* **Route (Path):** `/recipes/:id`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Page for viewing a specific dish on the SMAK platform. Displays detailed information about the dish, its ingredients, cooking steps, health indicators, YouTube video, comments/reviews, and suggests similar recipes selected by AI.

#### Available Features (what can be done on this page):
- Recipe Hero card: photos, title, description, rating, author, button to start step-by-step cooking (Cook Mode: /recipes/cook/:id).
- Recipe Passport: total cooking time, difficulty level, number of servings, health score, calories, BJU (proteins, fats, carbohydrates), and dietary badges.
- List of ingredients and step-by-step instructions.
- YouTube Video recipe: built-in video player (if added by author).
- Review and rating section: ability to add reviews, rate the dish from 1 to 5 stars and comment.
- AI recommendations block: selection of similar recipes based on semantic analysis of ingredients and dish category.

---

### 📍 Page: New Recipe creation

* **Full URL:** [{{BASE_URL}}/recipes/create]({{BASE_URL}}/recipes/create)
* **Route (Path):** `/recipes/create`
* **Accessibility:** 🔐 Requires authorization (middleware: `verified`)

#### Page Description:
Page for adding a culinary recipe to the SMAK platform. Available for verified users. Contains a form for filling in steps, ingredients, photo gallery, dietary labels, and integration with YouTube video.

#### Available Features (what can be done on this page):
- Form for adding: filling in the name, description, selection of category and cuisines of the world.
- Ingredient and cooking step management: dynamic addition or removal of fields for ingredients and step-by-step instructions.
- Cooking metadata: entering preparation and cooking time, selecting difficulty level (easy, medium, hard) and cooking speed.
- Health Score indicator: interactive slider for evaluating the healthiness of the dish in percentages with a visual scale (Fast Food / Balanced / Healthy).
- Taste profile: selection of taste notes of the dish (sweet, spicy, sour, etc.).
- Dietary labels: checkboxes for indicating vegan, vegetarian, gluten-free, lactose-free, nut-free dishes, as well as halal and kosher food.
- Video recipe: field for adding a link to a YouTube video.
- Media gallery: uploading a cover image and additional photos through an image slider.
- Saving: ability to publish the recipe (sent for pre-moderation) or save it as a draft in the personal account.

---

### 📍 Page: Edit Recipe

* **Full URL:** [{{BASE_URL}}/recipes/edit/:id]({{BASE_URL}}/recipes/edit/:id)
* **Route (Path):** `/recipes/edit/:id`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, verified, owner`)

#### Page Description:
Page for editing an existing recipe on the SMAK platform. Available to the recipe owner or administrative accounts.

#### Available Features (what can be done on this page):
- Form editing: modify title, description, category, and cuisines of the world.
- Cooking details: adjust prep/cook time, difficulty, and speed of preparation.
- Ingredient and step updates: dynamically append or delete recipe ingredient entries and direction steps.
- Healthy indicators: update health score (percentage rating).
- Dietary updates: modify checkboxes for vegan, vegetarian, gluten-free, dairy-free, nut-free, halal, or kosher tags.
- Video integrations: edit link to a YouTube video.
- Gallery controls: modify cover images and additional gallery images in a slider.
- Submit changes: save as a draft or submit for pre-moderation to publish.

---

### 📍 Page: Умови використання

* **Full URL:** [{{BASE_URL}}/terms]({{BASE_URL}}/terms)
* **Route (Path):** `/terms`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Офіційні правила, застереження щодо використання штучного інтелекту та умови користування демонстраційною платформою SMAK.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Public Chef Profile

* **Full URL:** [{{BASE_URL}}/users/:id]({{BASE_URL}}/users/:id)
* **Route (Path):** `/users/:id`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Public profile page of a culinary chef/author on the SMAK platform. Displays their bio, stats, published recipes, and community reviews.

#### Available Features (what can be done on this page):
- View chef details: display name, username, bio, and awards.
- View chef stats: total number of recipes, average recipe rating, and total number of reviews received.
- Browse recipes: paginated grid of all public recipes published by this chef.
- Browse reviews: community reviews and feedback left by other users on this chef's recipes.

---

## 💡 Instructions for the AI Assistant:

1. **Navigation Assistance & Links:** When a user asks where to find a specific feature (e.g., change allergies, view recipes, pay for a subscription, or edit profile), direct them using direct clickable markdown links with Full URLs (for example: [Тарифи та підписки]({{BASE_URL}}/billing/plans) or [Мій профіль]({{BASE_URL}}/profile)).
2. **Step-by-Step Explanations:** Use the page feature lists to tell the user exactly what they can do in each section of the site.
3. **Access Conditions:** Warn the user if a feature requires logging in (Middleware: `auth`), email confirmation (`verified`), or an administrator role (`admin`).
