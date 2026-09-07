<template>
  <div class="flex min-h-screen flex-col">
    <DashBoardHeader />
    <UiMain data-testid="dashboard-main" class="flex flex-1 px-5 py-6">
      <div
        data-testid="dashboard-content-wrap"
        class="mx-auto flex w-full max-w-3xl flex-1 flex-col"
      >
        <slot />
      </div>
    </UiMain>

    <!-- reka-ui ToastPortal이 SSR에서 크래시(Cannot read properties of null 'ce')한다.
         토스트는 하이드레이션 후에만 필요하므로 ClientOnly로 감싼다. -->
    <ClientOnly>
      <UiToaster />
    </ClientOnly>
  </div>
</template>
