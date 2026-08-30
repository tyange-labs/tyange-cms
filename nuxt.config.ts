import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/fonts',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/eslint',
    '@nuxt/ui',
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-05-15',
  vite: { plugins: [tailwindcss()] },
  eslint: {
    config: {
      standalone: false,
    },
  },
  runtimeConfig: {
    tyangeCmsApiKey: '',
    public: {
      tyangeCmsApiBase: '',
      tyangeCmsApiBaseProd: '',
    },
  },
  devServer: {
    port: 3000,
  },
})
