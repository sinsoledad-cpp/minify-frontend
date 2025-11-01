<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElRow, ElCol, ElCard, ElStatistic } from 'element-plus'
import apiService from '@/services/api'
import type { ApiResponse, DashboardData } from '@/services/api-types'

// 1. 创建一个 ref 来存储从后端获取的仪表盘数据
//    初始值为 null，表示“尚未加载”
const dashboardData = ref<DashboardData | null>(null)
const isLoading = ref(true)

// 2. (关键) onMounted 是一个 "生命周期钩子"
//    它会在组件被“挂载”到页面上之后立即执行
onMounted(() => {
  fetchDashboardData()
})

// 3. 定义获取数据的函数
const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    // 4. 调用后端的 /analytics/dashboard 接口
    //    (api.ts 拦截器会自动附加 token)
    const response = await apiService.get<ApiResponse<DashboardData>>(
      '/analytics/dashboard' // 对应 shortener.api
    )

    // 5. (关键) 使用类型断言来获取拦截器剥离后的数据
    //    并将其存入我们的 ref
    dashboardData.value = response as unknown as DashboardData
  } catch (error) {
    // api.ts 拦截器会自动弹出错误
    console.error('获取仪表盘数据失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-card shadow="hover">
        <el-statistic
          title="总链接数 (Total Links)"
          :value="dashboardData?.totalLinks"
          v-loading="isLoading"
        />
      </el-card>
    </el-col>

    <el-col :span="8">
      <el-card shadow="hover">
        <el-statistic
          title="总点击数 (Total Clicks)"
          :value="dashboardData?.totalClicks"
          v-loading="isLoading"
        />
      </el-card>
    </el-col>

    <el-col :span="8">
      <el-card shadow="hover" v-loading="isLoading">
        <div v-if="dashboardData?.topLink">
          <div class="el-statistic__title">
            热门链接 (Top Link)
          </div>
          <div class="el-statistic__value">
            {{ dashboardData.topLink.shortCode }}
          </div>
        </div>
        <div v-else>
          <div class="el-statistic__title">
            热门链接 (Top Link)
          </div>
          <div class="el-statistic__value">
            (暂无数据)
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
/* el-statistic 默认没有最小高度
  当 v-loading 时，卡片会“塌陷”，不好看
  我们给卡片一个最小高度
*/
.el-card {
  min-height: 120px;
}

/* 我们手动模拟 el-statistic__value 的样式
  (因为 el-statistic 不支持显示字符串)
*/
.el-statistic__title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.el-statistic__value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  /* 防止长链接换行 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
