import { generateSiteDocs } from './scripts/generate-sitemap-docs'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    host: '0.0.0.0',
    port: 3000
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
