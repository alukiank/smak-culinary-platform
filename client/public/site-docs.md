# Culinary Platform SMAK — Site Structure & Features Documentation

This document is automatically generated based on the source code of the site pages. It contains a complete list of routes (links), page descriptions, and lists of available features. The AI assistant can use this description as a knowledge base to help users.

## List of All Available Links (Routes)

| Route (URL) | Page Name | Access / Restrictions |
| :--- | :--- | :--- |
| `/` | **Відкрийте світ смаку разом з нами!** | 🌐 Public |
| `/admin/billing` | **Billing Panel (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/moderation` | **Content Moderation (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/recipes` | **Recipe Management (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/recipes/:id` | **Recipe Details (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/recipes/edit/:id` | **Recipe Editing (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/users` | **User Management (Admin)** | 🔐 Authorized (auth, admin) |
| `/admin/users/:id` | **User Details (Admin)** | 🔐 Authorized (auth, admin) |
| `/auth/forgot-password` | **Відновлення пароля** | 🌐 Public |
| `/auth/login` | **Вхід** | 🌐 Public |
| `/auth/register` | **Реєстрація** | 🌐 Public |
| `/auth/reset-password` | **Створення нового пароля** | 🌐 Public |
| `/auth/verify` | **Підтвердження пошти** | 🌐 Public |
| `/billing/plans` | **Plans and subscriptions** | 🌐 Public |
| `/chats/:id?` | **Interactive AI assistant (Chat)** | 🔐 Authorized (auth) |
| `/profile` | **<Profile Settings>** | 🔐 Authorized (auth) |
| `/profile/collections` | **My Collections** | 🔐 Authorized (auth) |
| `/profile/collections/:id` | **Detailed Collection view** | 🔐 Authorized (auth) |
| `/profile/recipes` | **My Recipes** | 🔐 Authorized (auth) |
| `/recipes` | **Recipe search and catalog** | 🌐 Public |
| `/recipes/:id` | **Detailed recipe view** | 🌐 Public |
| `/recipes/cook/:id` | **Step-by-Step Cook Mode** | 🔐 Authorized (auth) |
| `/recipes/create` | **New Recipe creation** | 🔐 Authorized (verified) |
| `/recipes/edit/:id` | **Edit Recipe** | 🔐 Authorized (auth, verified, owner) |
| `/users/:id` | **Public Chef Profile** | 🌐 Public |

---

## Detailed Description of Pages and Features

### 📍 Page: Відкрийте світ смаку разом з нами!

* **Route (URL):** `/`
* **File Path:** `app/pages/index.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
SMAK — кулінарна платформа, де ви знайдете тисячі автентичних рецептів та отримаєте допомогу розумного ШІ-асистента.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Billing Panel (Admin)

* **Route (URL):** `/admin/billing`
* **File Path:** `app/pages/admin/billing/index.vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Admin panel section for managing user subscriptions and tracking payments on the SMAK platform.

#### Available Features (what can be done on this page):
- View list of all user subscriptions (active, past due, expired, canceled).
- Search/filter subscriptions by user, plan type, and status.
- Manually edit user subscriptions (change plan type, update status, set expiration date).
- View payment transactions history (amount, status, date).
- Paginated navigation and refresh functionality for financial data.

---

### 📍 Page: Content Moderation (Admin)

* **Route (URL):** `/admin/moderation`
* **File Path:** `app/pages/admin/moderation/index.vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Admin panel section for moderation of recipes and user reviews on the SMAK platform.

#### Available Features (what can be done on this page):
- Moderate pending recipes and pre-moderated AI generated submissions.
- Approve or reject user reviews with mandatory moderation comments on rejection.
- Search recipes by name and filter by status (moderation, public, rejected).
- Filter reviews by publishing status (published, unpublished).
- View full logs and timeline history of moderation actions for recipes and reviews.
- Delete reviews with confirmation dialogs.

---

### 📍 Page: Recipe Management (Admin)

* **Route (URL):** `/admin/recipes`
* **File Path:** `app/pages/admin/recipes/index.vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Admin panel section for managing all recipes on the SMAK platform.

#### Available Features (what can be done on this page):
- View all recipes on the platform with paginated table display.
- Search recipes by title and filter by status or category.
- View details of a specific recipe or open it in edit mode.
- Change status of a recipe manually (draft, premoderation, moderation, public, rejected, archived).
- Delete any recipe with confirmation dialog.
- Filter recipes by specific author/user ID.

---

### 📍 Page: Recipe Details (Admin)

* **Route (URL):** `/admin/recipes/:id`
* **File Path:** `app/pages/admin/recipes/[id].vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Detailed view of a single recipe for administrators on the SMAK platform.

#### Available Features (what can be done on this page):
- View detailed recipe information (category, complexity, times, health score, taste profile, ingredients, directions).
- View recipe media files (cover image, gallery images, YouTube video).
- Review author public profile details (verification, ban status).
- Perform moderation actions on the recipe (approve, request changes, reject, archive).
- Read and manage user reviews/comments for this recipe, with individual review moderation and review logs history.
- Inspect the full moderation timeline history of the recipe.

---

### 📍 Page: Recipe Editing (Admin)

* **Route (URL):** `/admin/recipes/edit/:id`
* **File Path:** `app/pages/admin/recipes/edit/[id].vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Page for editing details and metadata of an existing recipe by administrators on the SMAK platform.

#### Available Features (what can be done on this page):
- Edit recipe title, description, category, and world cuisines.
- Dynamically add, modify, or remove recipe ingredients and step-by-step directions.
- Configure preparation time, cooking time, difficulty level, cooking speed, and tastes.
- Set a health score percentage using an interactive visual slider.
- Set dietary flags (vegan, vegetarian, gluten free, dairy free, nut free, halal, kosher).
- Add or update cover/gallery images and YouTube video URLs.
- Choose post-saving recipe status (keep as is or change to draft).

---

### 📍 Page: User Management (Admin)

* **Route (URL):** `/admin/users`
* **File Path:** `app/pages/admin/users/index.vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Admin panel section for managing users on the SMAK platform.

#### Available Features (what can be done on this page):
- View list of all registered users with paginated tables.
- Search users by name or email and filter by role, verification, or ban status.
- Open public chef profile or edit user details (change display name, change role to admin or user, ban/unban user).
- Delete user accounts permanently with username confirmation check.

---

### 📍 Page: User Details (Admin)

* **Route (URL):** `/admin/users/:id`
* **File Path:** `app/pages/admin/users/[id].vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth, admin`)

#### Page Description:
Detailed user profile view for administrators on the SMAK platform.

#### Available Features (what can be done on this page):
- View core user profile info (name, username, email, ID, roles, verification status).
- View user dietary preferences and allergies/allergens.
- View the list of recent recipes published by this user.
- Perform administrative actions (ban/unban user account, change user role to admin or user, permanently delete user account).
- Confirmation checkpoints requiring typing the user's nickname for safety.

---

### 📍 Page: Відновлення пароля

* **Route (URL):** `/auth/forgot-password`
* **File Path:** `app/pages/auth/forgot-password.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Інструкції для скидання пароля надіслано на вашу пошту.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Вхід

* **Route (URL):** `/auth/login`
* **File Path:** `app/pages/auth/login.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Вітаємо на платформі SMAK!

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Реєстрація

* **Route (URL):** `/auth/register`
* **File Path:** `app/pages/auth/register.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш акаунт створено. Перевірте пошту для підтвердження email!

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Створення нового пароля

* **Route (URL):** `/auth/reset-password`
* **File Path:** `app/pages/auth/reset-password.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш новий пароль встановлено успішно. Тепер ви можете увійти в кабінет.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Підтвердження пошти

* **Route (URL):** `/auth/verify`
* **File Path:** `app/pages/auth/verify.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Ваш обліковий запис тепер успішно активовано.

#### Available Features:
- View the informational content of the page.

---

### 📍 Page: Plans and subscriptions

* **Route (URL):** `/billing/plans`
* **File Path:** `app/pages/billing/plans.vue`
* **Accessibility:** 🌐 Public page (accessible to guests)

#### Page Description:
Page for selecting a tariff plan for users of the SMAK platform. Allows the user to compare the features of FREE, PRO and PREMIUM plans, purchase a paid plan through LiqPay and manage the current subscription.

#### Available Features (what can be done on this page):
- Plan comparison: FREE (1 collection, 10 AI queries/day), PRO (10 collections, 50 AI queries/day, allergen filter, no ads) and PREMIUM (unlimited collections and AI queries, priority support).
- Subscription payment: secure payment of PRO or PREMIUM tariff by card through integration with LiqPay payment system (redirect to LiqPay).
- Subscription management: view status of active subscription (next billing date), save paid features until the end of the period when cancelled and ability to cancel subscription through confirmation modal window.

---

### 📍 Page: Interactive AI assistant (Chat)

* **Route (URL):** `/chats/:id?`
* **File Path:** `app/pages/chats/[[id]].vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

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

### 📍 Page: <Profile Settings>

* **Route (URL):** `/profile`
* **File Path:** `app/pages/profile/index.vue`
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

* **Route (URL):** `/profile/collections`
* **File Path:** `app/pages/profile/collections/index.vue`
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

* **Route (URL):** `/profile/collections/:id`
* **File Path:** `app/pages/profile/collections/[id].vue`
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

* **Route (URL):** `/profile/recipes`
* **File Path:** `app/pages/profile/recipes.vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
User's personal recipe library page. Allows managing published recipes, drafts, archived items, and items awaiting moderation.

#### Available Features (what can be done on this page):
- Filter recipes: tabs for viewing all, public, drafts, pre-moderation, rejected, or archived recipes.
- Search: search recipes by name using a search bar.
- Recipe management: delete recipes with confirmation modal, edit drafts, move recipes to drafts, publish (submit to moderation), archive and unarchive recipes.

---

### 📍 Page: Recipe search and catalog

* **Route (URL):** `/recipes`
* **File Path:** `app/pages/recipes/index.vue`
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

* **Route (URL):** `/recipes/:id`
* **File Path:** `app/pages/recipes/[id]/index.vue`
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

### 📍 Page: Step-by-Step Cook Mode

* **Route (URL):** `/recipes/cook/:id`
* **File Path:** `app/pages/recipes/cook/[id].vue`
* **Accessibility:** 🔐 Requires authorization (middleware: `auth`)

#### Page Description:
Interactive step-by-step cooking interface that guides the user through cooking a selected recipe, with timer integrations and a dedicated real-time culinary AI assistant.

#### Available Features (what can be done on this page):
- Ingredient checklist: inspect and verify available and missing ingredients, with automated AI replacement suggestions.
- Step wizard: view one step at a time with clean bold typography and swipe navigation.
- Smart step timers: automatically detects time mentions in directions and provides interactive count-down timers.
- Interactive cooking timeline: list of all preparation steps that are clickable to skip or backtrack.
- Guided AI assistant: dedicated sliding panel with chat to ask questions specifically matching the current cooking step.

---

### 📍 Page: New Recipe creation

* **Route (URL):** `/recipes/create`
* **File Path:** `app/pages/recipes/create.vue`
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

* **Route (URL):** `/recipes/edit/:id`
* **File Path:** `app/pages/recipes/edit/[id].vue`
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

### 📍 Page: Public Chef Profile

* **Route (URL):** `/users/:id`
* **File Path:** `app/pages/users/[id].vue`
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

1. **Navigation Assistance:** When a user asks where to find a specific feature (e.g., change allergies or pay for a plan), direct them to the corresponding URL route from the table above (e.g., `/profile` or `/billing/plans`).
2. **Step-by-Step Explanations:** Use the page feature lists to tell the user exactly what they can do in each section of the site.
3. **Access Conditions:** Warn the user if a feature requires logging in (Middleware: `auth`), email confirmation (`verified`), or an administrator role (`admin`).
