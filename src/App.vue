<script setup lang="ts">
// (新增) 导入 Vue Router 的核心组件
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- “路由出口”或“占位符”* -->
  <RouterView />
</template>
<style>
/* (新增)
  我们移除 "scoped" 关键字，让这个样式成为“全局样式”。
  这能确保我们的应用占满整个屏幕高度，
  这对于 Element Plus 的 <el-container> 布局至关重要。
*/
html,
body,
#app {
  /* 强制让你的 html、body 和 #app 容器都占满浏览器的整个窗口高度和宽度 */
  height: 100%;
  width: 100%;
  /* 清除所有浏览器自带的默认边距，让你的应用能“严丝合缝”地贴满屏幕。 */
  margin: 0;
  padding: 0;
}
</style>
