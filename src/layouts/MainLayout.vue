<script setup lang="ts">
import { RouterView } from 'vue-router'
// 稍后我们会在这里添加 Element Plus 布局组件和登出逻辑
</script>

<template>
  <div style="border: 2px solid blue; padding: 10px">
    <header>
      <h1>主布局 (需要登录)</h1>
      <p>这里将是顶部导航栏和侧边栏。</p>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
