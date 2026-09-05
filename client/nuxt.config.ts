import { generateSiteDocs } from './scripts/generate-sitemap-docs'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  app: {
    head: {
      title: 'SMAK — Кулінарна платформа',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'SMAK' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#F05B5B' },
        { name: 'description', content: 'Розумний ШІ-помічник у світі кулінарії. Підбір рецептів, персональне меню та спільнота.' },
        // Open Graph / Facebook / LinkedIn / Telegram
        { property: 'og:title', content: 'SMAK — Відкрийте світ смаку разом з нами!' },
        { property: 'og:description', content: 'Розумний ШІ-помічник у світі кулінарії. Підбір рецептів, персональне меню та спільнота.' },
        { property: 'og:image', content: 'https://smak-app.pp.ua/images/og-image.png' },
        { property: 'og:image:secure_url', content: 'https://smak-app.pp.ua/images/og-image.png' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '900' },
        { property: 'og:image:alt', content: 'SMAK — Кулінарна платформа' },
        { property: 'og:url', content: 'https://smak-app.pp.ua/' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'SMAK' },
        { property: 'og:locale', content: 'uk_UA' },
        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'SMAK — Відкрийте світ смаку разом з нами!' },
        { name: 'twitter:description', content: 'Розумний ШІ-помічник у світі кулінарії. Підбір рецептів, персональне меню та спільнота.' },
        { name: 'twitter:image', content: 'https://smak-app.pp.ua/images/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/images/logo.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },

  modules: [
    '@nuxt/ui'
  ],

  css: [
    '~/assets/main.css'
  ],

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '',
      liqpayPublicKey: process.env.NUXT_PUBLIC_LIQPAY_PUBLIC_KEY || '',
      cloudinaryCloudName: process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
    }
  },

  ui: {
    theme: {
      colors: [
        'primary',
        'neutral',
        'success',
        'warning',
        'error',
        'coral',
        'orange',
        'yellow',
        'ai-indigo',
        'smak-neutral'
      ]
    }
  },

  routeRules: {
    '/profile/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/chats/**': { ssr: false },
    '/billing/**': { ssr: false }
  },

  hooks: {
    async ready(nuxt) {
      await generateSiteDocs(nuxt.options.rootDir)
    }
  }
})
