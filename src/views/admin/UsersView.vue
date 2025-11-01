<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElPagination, ElTag } from 'element-plus'
import apiService from '@/services/api'
import type { ApiResponse, ListUsersResponse, ListUsersParams } from '@/services/api-types'
import type { UserInfo } from '@/services/api-types'
import { formatTime } from '@/utils/time'

// --- 状态定义 ---
const usersList = ref<UserInfo[]>([])
const totalUsers = ref(0)
const isLoading = ref(true)

// (关键) 分页状态
const listState = reactive<ListUsersParams>({
  page: 1,
  pageSize: 10,
})

// --- 生命周期 ---
onMounted(() => {
  fetchUsers()
})

// --- API 调用 ---
const fetchUsers = async () => {
  isLoading.value = true
  try {
    // 1. 调用 /admin/users 接口
    //    (api.ts 拦截器 会自动附加 admin 的 token)
    const response = await apiService.get<ApiResponse<ListUsersResponse>>('/admin/users', {
      // 2. 发送分页参数
      params: listState,
    })

    // 3. 断言并更新状态
    const data = response as unknown as ListUsersResponse
    usersList.value = data.users
    totalUsers.value = data.total
  } catch (error) {
    // api.ts 拦截器 会自动弹窗
    // (如果是非 admin 用户调用，后端 Casbin 会返回 403 Forbidden)
    console.error('获取用户列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

// --- 事件处理 ---

// (分页) 处理“页码改变”事件
const handlePageChange = (newPage: number) => {
  listState.page = newPage
  fetchUsers() // 重新获取新一页的数据
}

// (分页) 处理“每页条数改变”事件
const handleSizeChange = (newSize: number) => {
  listState.pageSize = newSize
  listState.page = 1 // 重置回第 1 页
  fetchUsers()
}
</script>

<template>
  <el-card shadow="never" v-loading="isLoading">
    <el-table :data="usersList" style="width: 100%" empty-text="没有找到用户">
      <el-table-column prop="id" label="用户 ID" width="100" />

      <el-table-column prop="username" label="用户名" width="180" />

      <el-table-column prop="email" label="邮箱" show-overflow-tooltip />

      <el-table-column prop="role" label="角色" width="120" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.role === 'admin'" type="danger">管理员</el-tag>
          <el-tag v-else type="info">用户</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="注册时间" width="180" align="center">
        <template #default="scope">
          {{ formatTime(scope.row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default>
          <el-button link type="primary" disabled>编辑角色</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="totalUsers > 0"
      class="pagination-bar"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalUsers"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="listState.pageSize"
      :current-page="listState.page"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </el-card>
</template>

<style scoped>
/* (复用 LinksView.vue 的样式) */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
