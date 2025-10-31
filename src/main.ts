import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App) //用 App.vue 作为我这个应用的根组件

app.use(createPinia()) //调用 createPinia() 来创建 Pinia 的实例，然后 app.use() 把它安装到 Vue 应用中
app.use(router) //把从 router/index.ts 导入的 router 实例安装到 Vue 应用中

app.mount('#app') //把我的 Vue 应用挂载（注入）到 HTML 页面上， '#app' 是一个 CSS 选择器，它指向你项目根目录下 index.html 文件中的 <div id="app"></div>
