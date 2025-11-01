<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElTag,
  ElLink,
  ElButton,
  // ElIcon
} from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import apiService from '@/services/api'
import type { ApiResponse, Link, ListLinksResponse, ListLinksParams } from '@/services/api-types'
import { formatTime } from '@/utils/time' // (稍后我们会创建这个文件)

// --- 状态定义 ---

// 存储从 API 获取的链接列表
const linksList = ref<Link[]>([])
// 存储总条目数（用于分页）
const totalLinks = ref(0)
// 页面是否在加载数据
const isLoading = ref(true)

// (关键) 分页和过滤的状态
// reactive 适用于管理一个“对象”，ref 适用于管理“单个值”
const listState = reactive<ListLinksParams>({
  page: 1,
  pageSize: 10,
  status: 'active' // 默认只看“有效”的链接
})

// --- 生命周期 ---

// onMounted 钩子：当组件第一次被渲染到屏幕上时，自动执行
onMounted(() => {
  fetchLinks()
})

// --- API 调用 ---

// 定义获取链接列表的函数
const fetchLinks = async () => {
  isLoading.value = true
  try {
    // 1. 调用 /links 接口
    const response = await apiService.get<ApiResponse<ListLinksResponse>>('/links', {
      // 2. (关键) 将我们的分页状态 (listState) 作为 'params' (URL query) 发送
      //    请求会变成: /api/v1/links?page=1&pageSize=10&status=active
      params: listState
    })

    // 3. (关键) 使用类型断言获取数据
    const data = response as unknown as ListLinksResponse

    // 4. 更新我们的 ref 状态
    linksList.value = data.links
    totalLinks.value = data.total
  } catch (error) {
    // api.ts 拦截器会自动弹窗
    console.error('获取链接列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

// --- 事件处理 ---

// (分页) 处理“页码改变”事件
const handlePageChange = (newPage: number) => {
  listState.page = newPage
  fetchLinks() // 重新获取新一页的数据
}

// (分页) 处理“每页条数改变”事件
const handleSizeChange = (newSize: number) => {
  listState.pageSize = newSize
  listState.page = 1 // (重要) 改变每页条数时，重置回第 1 页
  fetchLinks()
}
</script>

<template>
  <el-card shadow="never" v-loading="isLoading">
    <div class="filter-bar">
      <span>链接状态: {{ listState.status }}</span>
    </div>

    <el-table :data="linksList" style="width: 100%" empty-text="没有找到链接">
      <el-table-column prop="shortCode" label="短链接" width="220">
        <template #default="scope">
          <el-link :href="scope.row.originalUrl" target="_blank" type="primary">
            {{ scope.row.shortCode.replace('http://', '').replace('https://', '') }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column prop="originalUrl" label="原始链接" show-overflow-tooltip>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.isActive" type="success">有效</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="180" align="center">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default>
          <el-button link type="primary" :icon="Edit" disabled>
            编辑
          </el-button>
          <el-button link type="danger" :icon="Delete" disabled>
            删除
          </el-button>
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
}
.pagination-bar {
  display: flex; /* 让分页器默认右对齐 (flex 布局的默认效果) */
  justify-content: flex-end; /* 右对齐 */
  margin-top: 20px;
}
</style>
