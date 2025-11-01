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
  ElMessageBox,
  ElMessage,
  // (新增) -----------------
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElDatePicker,
  type FormInstance,
  // (新增结束) ---------------
} from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import apiService from '@/services/api'
import type {
  ApiResponse,
  Link,
  ListLinksResponse,
  ListLinksParams,
  UpdateLinkRequest, // (新增)
} from '@/services/api-types'
import { formatTime } from '@/utils/time'

// --- 状态定义 (无变化) ---
const linksList = ref<Link[]>([])
const totalLinks = ref(0)
const isLoading = ref(true)
const listState = reactive<ListLinksParams>({
  page: 1,
  pageSize: 10,
  status: 'active',
})

// (新增) --- 编辑表单状态 ---
const isEditDialogVisible = ref(false) // 控制“编辑”对话框是否显示
const editFormRef = ref<FormInstance>() // “编辑”表单的引用
const editForm = reactive({
  // 我们需要 shortCode 来知道要更新哪个链接 (e.g., /links/abc)
  shortCode: '',
  // 以下是 UpdateLinkRequest 中定义的字段
  originalUrl: '',
  isActive: true,
  expirationTime: null as Date | null, // (关键) ElDatePicker 需要 Date 对象，而不是字符串
})
// (新增结束) -----------------

// --- 生命周期 (无变化) ---
onMounted(() => {
  fetchLinks()
})

// --- API 调用 (无变化) ---
const fetchLinks = async () => {
  // ... (此函数内容保持不变) ...
  isLoading.value = true
  try {
    const response = await apiService.get<ApiResponse<ListLinksResponse>>('/links', {
      params: listState,
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
// 处理“编辑”按钮点击
const handleEdit = (link: Link) => {
  // 1. 把当前行(link)的数据“复制”到 editForm 中
  //    (注意：我们必须复制，而不是直接引用，否则会“污染”表格数据)
  editForm.shortCode = link.shortCode
  editForm.originalUrl = link.originalUrl
  editForm.isActive = link.isActive
  // 2. (关键) 将后端返回的 expirationTime 字符串 转换为 Date 对象
  if (link.expirationTime) {
    editForm.expirationTime = new Date(link.expirationTime)
  } else {
    editForm.expirationTime = null
  }

  // 3. 打开“编辑”对话框
  isEditDialogVisible.value = true
}

// (新增) 提交“编辑”表单
const submitEdit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  // 1. 校验表单
  await formEl.validate(async (valid) => {
    if (valid) {
      // 2. 准备要发送到后端的数据 (UpdateLinkRequest)
      const updateData: UpdateLinkRequest = {
        originalUrl: editForm.originalUrl,
        isActive: editForm.isActive,
        // (关键) 将 Date 对象 转换回 后端需要的 ISO 字符串
        // 如果用户清空了日期 (null)，就发送 null
        expirationTime: editForm.expirationTime ? editForm.expirationTime.toISOString() : null,
      }

      // 3. 从 shortCode (e.g., "http://.../abc") 中提取 code ("abc")
      const code = editForm.shortCode.split('/').pop() || ''
      if (!code) {
        ElMessage.error('无法获取链接代码')
        return
      }

      isLoading.value = true // (可选) 在保存时也显示加载状态

      try {
        // 4. (关键) 调用 PUT /links/:code 接口
        await apiService.put(`/links/${code}`, updateData)

        // 5. 成功后的收尾工作
        isEditDialogVisible.value = false // (a) 关闭对话框
        ElMessage.success('更新成功') // (b) 提示成功
        fetchLinks() // (c) 刷新表格！
      } catch (error) {
        // (api.ts 拦截器 会自动弹窗)
        console.error('更新失败:', error)
        isLoading.value = false // 确保失败时停止加载
      }
    }
  })
}

// (新增) 取消“编辑”
const handleCancelEdit = () => {
  isEditDialogVisible.value = false
  // (可选) 清理表单验证状态
  if (editFormRef.value) {
    editFormRef.value.clearValidate()
  }
}
// (新增结束) -----------------------------------------

// 处理“删除”按钮点击 (无变化)
const handleDelete = async (link: Link) => {
  // ... (此函数内容保持不变) ...
  try {
    await ElMessageBox.confirm(
      `确定要删除短链接 ${link.shortCode.replace('http://', '').replace('https://', '')} 吗？
       此操作将进行软删除，但链接将无法访问。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    const code = link.shortCode.split('/').pop() || ''
    isLoading.value = true
    await apiService.delete(`/links/${code}`)
    ElMessage({
      type: 'success',
      message: '删除成功',
    })
    fetchLinks()
  } catch (error) {
    if (error === 'cancel') {
      ElMessage({
        type: 'info',
        message: '已取消删除',
      })
      return
    }
    console.error('删除失败:', error)
    isLoading.value = false
  }
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
      <el-table-column prop="originalUrl" label="原始链接" show-overflow-tooltip />
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
          <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">
            编辑
          </el-button>

          <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)">
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

  <el-dialog
    v-model="isEditDialogVisible"
    title="编辑链接"
    width="600"
    :close-on-click-modal="false"
  >
    <el-form
      v-if="isEditDialogVisible"
      ref="editFormRef"
      :model="editForm"
      label-position="top"
      label-width="auto"
    >
      <el-form-item
        label="原始链接 (Original URL)"
        prop="originalUrl"
        :rules="[{ required: true, message: '请输入原始链接', trigger: 'blur' }]"
      >
        <el-input v-model="editForm.originalUrl" placeholder="https://..." />
      </el-form-item>

      <el-form-item label="过期时间 (Expiration Time)" prop="expirationTime">
        <el-date-picker
          v-model="editForm.expirationTime"
          type="datetime"
          placeholder="留空表示永不过期"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="是否激活 (Is Active)" prop="isActive">
        <el-switch v-model="editForm.isActive" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancelEdit">取 消</el-button>
        <el-button type="primary" @click="submitEdit(editFormRef)"> 保 存 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* (样式无变化) */
.filter-bar {
  margin-bottom: 20px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
