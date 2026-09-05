import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/fonts', '@nuxt/test-utils', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-05-15',
  vite: { plugins: [tailwindcss()] },
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
  nitro: {
    externals: {
      inline: ['vue'],
    },
  },
})
