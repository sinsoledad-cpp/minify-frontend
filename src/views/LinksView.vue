<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue' // (修改) 导入 nextTick
import { useRouter } from 'vue-router'
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
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElDatePicker,
  type FormInstance,
  ElSelect, // (新增)
  ElOption, // (新增)
} from 'element-plus'
import { Edit, Delete, Plus, DataLine } from '@element-plus/icons-vue'
import apiService from '@/services/api'
import type {
  ApiResponse,
  Link,
  ListLinksResponse,
  ListLinksParams,
  UpdateLinkRequest,
  CreateLinkRequest,
  CreateLinkResponse,
} from '@/services/api-types'
import { formatTime } from '@/utils/time'

const router = useRouter()
// --- 状态定义 (表格和分页) ---
const linksList = ref<Link[]>([])
const totalLinks = ref(0)
const isLoading = ref(true)
const listState = reactive<ListLinksParams>({
  page: 1,
  pageSize: 10,
  status: 'active',
})

// (新增) --- 筛选器选项 ---
const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'inactive', label: '禁用' },
  { value: 'expired', label: '已过期' },
  { value: 'all', label: '全部' },
]
// (新增结束) -----------------

// --- “编辑”表单状态 ---
const isEditDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive({
  shortCode: '',
  originalUrl: '',
  isActive: true,
  expirationTime: null as Date | null,
})

// --- “创建”表单状态 ---
const isCreateDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive<CreateLinkRequest>({
  originalUrl: '',
  customCode: '',
  expiresIn: '',
})

// --- 生命周期 ---
onMounted(() => {
  fetchLinks()
})

// --- API 调用 ---
const fetchLinks = async () => {
  isLoading.value = true
  try {
    const response = await apiService.get<ApiResponse<ListLinksResponse>>('/links', {
      params: listState, // (关键) listState 现在包含了 status
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

// --- 事件处理 ---

// (分页)
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
// 处理“状态筛选”改变
const handleStatusChange = () => {
  // 当状态改变时，我们总是重置回第 1 页
  listState.page = 1
  // 重新获取数据
  fetchLinks()
}
// (新增结束) -----------------------------------------

// --- “创建”相关 ---
const openCreateDialog = () => {
  createForm.originalUrl = ''
  createForm.customCode = ''
  createForm.expiresIn = ''
  isCreateDialogVisible.value = true
  nextTick(() => {
    if (createFormRef.value) {
      createFormRef.value.clearValidate()
    }
  })
}

const submitCreate = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      const createData: CreateLinkRequest = {
        originalUrl: createForm.originalUrl,
        customCode: createForm.customCode || undefined,
        expiresIn: createForm.expiresIn || undefined,
      }
      try {
        await apiService.post<ApiResponse<CreateLinkResponse>>('/links', createData)
        isCreateDialogVisible.value = false
        ElMessage.success('创建成功')
        listState.page = 1
        fetchLinks()
      } catch (error) {
        console.error('创建失败:', error)
        isLoading.value = false
      }
    }
  })
}

const handleCancelCreate = () => {
  isCreateDialogVisible.value = false
}

// --- “编辑”相关 ---
const handleEdit = (link: Link) => {
  editForm.shortCode = link.shortCode
  editForm.originalUrl = link.originalUrl
  editForm.isActive = link.isActive
  if (link.expirationTime) {
    editForm.expirationTime = new Date(link.expirationTime)
  } else {
    editForm.expirationTime = null
  }
  isEditDialogVisible.value = true
}

const submitEdit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      const updateData: UpdateLinkRequest = {
        originalUrl: editForm.originalUrl,
        isActive: editForm.isActive,
        expirationTime: editForm.expirationTime ? editForm.expirationTime.toISOString() : null,
      }
      const code = editForm.shortCode.split('/').pop() || ''
      if (!code) {
        ElMessage.error('无法获取链接代码')
        return
      }
      isLoading.value = true
      try {
        await apiService.put(`/links/${code}`, updateData)
        isEditDialogVisible.value = false
        ElMessage.success('更新成功')
        fetchLinks()
      } catch (error) {
        console.error('更新失败:', error)
        isLoading.value = false
      }
    }
  })
}

const handleCancelEdit = () => {
  isEditDialogVisible.value = false
  if (editFormRef.value) {
    editFormRef.value.clearValidate()
  }
}

// --- “删除”相关 ---
const handleDelete = async (link: Link) => {
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

const goToAnalytics = (code: string) => {
  // 1. 提取 code
  const shortCode = code.split('/').pop() || ''
  if (!shortCode) {
    ElMessage.error('无法解析短链接代码')
    return
  }
  // 2. (关键) 跳转到普通用户的路由
  router.push(`/analytics/${shortCode}`)
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
      <div class="filter-bar-right">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog"> 创建链接 </el-button>
      </div>
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

  <el-dialog
    v-model="isCreateDialogVisible"
    title="创建新链接"
    width="600"
    :close-on-click-modal="false"
  >
    <el-form
      v-if="isCreateDialogVisible"
      ref="createFormRef"
      :model="createForm"
      label-position="top"
      label-width="auto"
    >
      <el-form-item
        label="原始长链接 (Original URL)"
        prop="originalUrl"
        :rules="[{ required: true, message: '请输入原始链接', trigger: 'blur' }]"
      >
        <el-input v-model="createForm.originalUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="自定义短码 (Custom Code) - 可选" prop="customCode">
        <el-input v-model="createForm.customCode" placeholder="例如: mylink" />
      </el-form-item>
      <el-form-item label="过期时间 (Expires In) - 可选" prop="expiresIn">
        <el-input v-model="createForm.expiresIn" placeholder="例如: 7d (7天), 1h (1小时)" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancelCreate">取 消</el-button>
        <el-button type="primary" @click="submitCreate(createFormRef)"> 创 建 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* (样式无变化) */
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
