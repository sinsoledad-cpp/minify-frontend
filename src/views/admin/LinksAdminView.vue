<script setup lang="ts">
// (这是一个新文件)
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElTag,
  ElLink,
  ElButton,
  ElSelect,
  ElOption,
  ElMessage,
} from 'element-plus'
import apiService from '@/services/api'
import type { ApiResponse, Link, ListLinksResponse, ListAllLinksParams } from '@/services/api-types'
import { formatTime } from '@/utils/time'
import { DataLine } from '@element-plus/icons-vue'

const router = useRouter()
// --- 状态定义 ---
const linksList = ref<Link[]>([])
const totalLinks = ref(0)
const isLoading = ref(true)

// (关键修改) 使用新的 ListAllLinksParams 接口
const listState = reactive<ListAllLinksParams>({
  page: 1,
  pageSize: 10,
  status: 'active',
  userId: undefined, // 暂不实现 UI，但保留字段
})

const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'inactive', label: '禁用' },
  { value: 'expired', label: '已过期' },
  { value: 'all', label: '全部' },
]

// --- 生命周期 ---
onMounted(() => {
  fetchAdminLinks()
})

// --- API 调用 ---
// (关键修改) 这是一个新函数，调用 admin 接口
const fetchAdminLinks = async () => {
  isLoading.value = true
  try {
    // 1. (关键) 调用 /admin/links 接口
    const response = await apiService.get<ApiResponse<ListLinksResponse>>('/admin/links', {
      params: listState,
    })
    const data = response as unknown as ListLinksResponse
    linksList.value = data.links
    totalLinks.value = data.total
  } catch (error) {
    console.error('获取全站链接列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

// --- 事件处理 ---

const handlePageChange = (newPage: number) => {
  listState.page = newPage
  fetchAdminLinks() // 调用 admin 接口
}

const handleSizeChange = (newSize: number) => {
  listState.pageSize = newSize
  listState.page = 1
  fetchAdminLinks() // 调用 admin 接口
}

const handleStatusChange = () => {
  listState.page = 1
  fetchAdminLinks() // 调用 admin 接口
}

const goToAnalytics = (code: string) => {
  // 1. 提取 code
  const shortCode = code.split('/').pop() || ''
  if (!shortCode) {
    ElMessage.error('无法解析短链接代码')
    return
  }
  // 2. (关键) 跳转到 *管理员* 的路由
  router.push(`/admin/analytics/${shortCode}`)
}
</script>

<template>
  <el-card shadow="never" v-loading="isLoading">
    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-select
          v-model="listState.status"
          placeholder="筛选状态"
          style="width: 120px"
          @change="handleStatusChange"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <el-table :data="linksList" style="width: 100%" empty-text="没有找到链接">
      <el-table-column prop="id" label="链接 ID" width="80" />

      <el-table-column prop="shortCode" label="短链接" width="220">
        <template #default="scope">
          <el-link :href="scope.row.originalUrl" target="_blank" type="primary">
            {{ scope.row.shortCode.replace('http://', '').replace('https://', '') }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column prop="originalUrl" label="原始链接" show-overflow-tooltip />

      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="!scope.row.isActive" type="info">禁用</el-tag>
          <el-tag
            v-else-if="scope.row.expirationTime && new Date(scope.row.expirationTime) < new Date()"
            type="warning"
          >
            已过期
          </el-tag>
          <el-tag v-else type="success">有效</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="180" align="center">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            :icon="DataLine"
            @click="goToAnalytics(scope.row.shortCode)"
          >
            统计
          </el-button>
          <el-button link type="primary" disabled>编辑</el-button>
          <el-button link type="danger" disabled>删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="totalLinks > 0"
      class="pagination-bar"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalLinks"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="listState.pageSize"
      :current-page="listState.page"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </el-card>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-bar-left {
  display: flex;
  align-items: center;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
