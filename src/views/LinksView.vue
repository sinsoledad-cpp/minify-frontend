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
  // ElIcon,
  ElMessageBox, // (新增) 导入“消息弹框”
  ElMessage, // (新增) 导入“消息提示”
} from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import apiService from '@/services/api'
import type { ApiResponse, Link, ListLinksResponse, ListLinksParams } from '@/services/api-types'
import { formatTime } from '@/utils/time'

// --- 状态定义 (无变化) ---
const linksList = ref<Link[]>([])
const totalLinks = ref(0)
const isLoading = ref(true)
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
    const response = await apiService.get<ApiResponse<ListLinksResponse>>('/links', {
      params: listState
    })
    const data = response as unknown as ListLinksResponse
    linksList.value = data.links
    totalLinks.value = data.total
  } catch (error) {
    console.error('获取链接列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

// --- 事件处理 (有新增) ---

// (分页) (无变化)
const handlePageChange = (newPage: number) => {
  listState.page = newPage
  fetchLinks()
}
const handleSizeChange = (newSize: number) => {
  listState.pageSize = newSize
  listState.page = 1
  fetchLinks()
}

// (新增) --------------------------------------------
// 处理删除按钮点击事件
const handleDelete = async (link: Link) => {
  try {
    // 1. (关键) 弹出确认框，等待用户确认
    await ElMessageBox.confirm(
      `确定要删除短链接 ${link.shortCode.replace('http://', '').replace('https://', '')} 吗？
       此操作将进行软删除，但链接将无法访问。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning' // 显示一个警告图标
      }
    )

    // 2. (如果用户点击了“确定”) - 调用后端的 DELETE 接口
    //    后端 API 是: delete /links/:code
    //    我们需要从 link.shortCode (e.g., "http://127.0.0.1:8887/abc") 中提取 'abc'
    const code = link.shortCode.split('/').pop() || ''

    // (可选) 你可以在删除时也显示加载状态
    isLoading.value = true

    // 3. (关键) apiService.delete()。拦截器会自动处理 200 OK
    //    (后端软删除成功会返回 200 OK)
    await apiService.delete(`/links/${code}`)

    // 4. (关键) 删除成功，给用户提示
    ElMessage({
      type: 'success',
      message: '删除成功'
    })

    // 5. (关键) 重新获取链接列表，表格将自动更新
    //    (如果当前页是最后一页且数据已空，可能需要调整页码，这里先做简单刷新)
    fetchLinks() // fetchLinks 内部会设置 isLoading.value = false
  } catch (error) {
    // 1. 如果 error 是 'cancel'，说明用户点击了“取消”
    if (error === 'cancel') {
      ElMessage({
        type: 'info',
        message: '已取消删除'
      })
      return
    }
    // 2. 如果是其他错误 (比如 API 500)，api.ts 拦截器 会自动弹窗
    console.error('删除失败:', error)
    isLoading.value = false // 确保 API 失败时也停止加载
  }
}
// (新增结束) -----------------------------------------
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
        <template #default="scope">
          <el-button link type="primary" :icon="Edit" disabled>
            编辑
          </el-button>

          <el-button
            link
            type="danger"
            :icon="Delete"
            @click="handleDelete(scope.row)"
          >
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
