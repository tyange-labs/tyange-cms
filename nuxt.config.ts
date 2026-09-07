import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Tailscale로 가둔 인증 전용 관리 도구라 SSR 이득이 없다. SSR을 켜두면 하이드레이션
  // 불일치와 SSR 전용 크래시(예: reka-ui ToastPortal)만 계속 나서 앱 전체를 SPA로 돌린다.
  // Nitro 서버 라우트(/api/*)는 그대로 동작하고, 미들웨어/스토어도 클라이언트에서만 돈다.
  ssr: false,
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
