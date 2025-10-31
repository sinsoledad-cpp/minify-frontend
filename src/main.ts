// 导入 Vue 的 createApp
import { createApp } from 'vue'

// 导入 Pinia
import { createPinia } from 'pinia'

// (新增) 导入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 导入 Element Plus (UI 库)
import ElementPlus from 'element-plus'
// (关键) 导入 Element Plus 的 CSS 样式文件
import 'element-plus/dist/index.css'

// 导入我们的根组件和路由
import App from './App.vue'
import router from './router'

// (新增) 创建 Pinia 实例
const pinia = createPinia() //调用 createPinia() 来创建 Pinia 的实例，然后 app.use() 把它安装到 Vue 应用中
// (新增) 使用持久化插件
pinia.use(piniaPluginPersistedstate)

// 创建 Vue 应用实例
const app = createApp(App) //用 App.vue 作为我这个应用的根组件

// --- 注册所有插件 ---
// 1. 注册 Pinia (状态管理)
app.use(pinia)
// 2. 注册 Vue Router (路由)
app.use(router) //把从 router/index.ts 导入的 router 实例安装到 Vue 应用中
// 3. 注册 Element Plus (UI 库)
app.use(ElementPlus)

// --- 挂载应用 ---
app.mount('#app') //把我的 Vue 应用挂载（注入）到 HTML 页面上， '#app' 是一个 CSS 选择器，它指向你项目根目录下 index.html 文件中的 <div id="app"></div>
