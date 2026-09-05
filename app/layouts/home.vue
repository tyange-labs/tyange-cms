<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(50,115,220,0.2),_transparent_32%),linear-gradient(180deg,_#07152f_0%,_#030b18_100%)] text-white"
  >
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div
        class="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20"
      />
    </div>
    <UiMain class="relative flex min-h-screen items-center justify-center px-6 py-12">
      <slot />
    </UiMain>
  </div>
</template>
