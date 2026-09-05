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
  </div>
</template>
