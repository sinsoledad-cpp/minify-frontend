<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { ArrowDown, House, Link, User, Menu } from '@element-plus/icons-vue' // (新增) 导入图标
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

// (新增) 计算属性，用于高亮显示当前菜单项
const activeMenu = computed(() => {
  return router.currentRoute.value.path
})

// (新增) 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout()
  }
}

// (新增) 登出逻辑
const handleLogout = () => {
  // 1. 调用 user store 中的 logout action
  //    (它会清除 token 和 userInfo，并自动跳转到 /login)
  userStore.logout()

  // 2. 你的后端 /logout 接口 只是返回 OK，
  //    我们甚至可以不调用它，但调用一下更完整
  //    (api.ts 拦截器会自动处理 200 OK)
  //    我们“触发即忘记”，不关心它的返回
  ElMessage.success('已登出')

  // (可选) 如果你的后端需要显式调用
  // import apiService from '@/services/api'
  // try {
  //   await apiService.post('/user/logout')
  // } finally {
  //   userStore.logout()
  //   ElMessage.success('已登出')
  // }
}
</script>

<template>
  <el-container class="main-layout-container">
    <el-header class="main-header">
      <div class="logo">Minify 短链接</div>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            你好, {{ userStore.userInfo?.username }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"> 登出 </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px" class="main-aside">
        <el-menu :default-active="activeMenu" class="main-menu" router>
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/links">
            <el-icon><Link /></el-icon>
            <span>链接管理</span>
          </el-menu-item>

          <el-menu-item v-if="userStore.isAdmin" index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

          <el-menu-item v-if="userStore.isAdmin" index="/admin/links">
            <el-icon><Menu /></el-icon>
            <span>全站链接 (Admin)</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
/* 整个布局容器占满全屏 */
.main-layout-container {
  height: 100%;
}

/* 顶部 Header 样式 */
.main-header {
  display: flex;
  justify-content: space-between; /* 子元素两端对齐 */
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.logo {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.user-info {
  display: flex;
  align-items: center;
}
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--el-color-primary);
}

/* 侧边栏样式 */
.main-aside {
  background-color: #fff;
  /* 确保侧边栏在垂直方向上撑满 (calc(100vh - 60px) -> 100% 视窗高度 减去 60px 的 header 高度) */
  height: calc(100vh - 60px);
  border-right: 1px solid #dcdfe6;
}
/* 侧边栏菜单样式 */
.main-menu {
  height: 100%;
  border-right: none; /* 移除 el-menu 自带的右边框，因为我们在 aside 上加了 */
}

/* 主内容区域样式 */
.main-content {
  background-color: #f4f7fa; /* 浅灰色背景，突出内容区 */
  padding: 20px;
}
</style>
