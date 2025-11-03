<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElRow, ElCol, ElCard, ElStatistic, ElDatePicker, ElEmpty } from 'element-plus'
import apiService from '@/services/api'
import type {
  ApiResponse,
  AnalyticsData,
  GetAnalyticsParams,
  StatItem,
  ClickPoint,
} from '@/services/api-types'

// (ECharts 核心)
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

//use 是 ECharts 中的一个全局注册函数 用于初始化图表并将其功能引入到项目中
use([
  CanvasRenderer, //基于 HTML <canvas> 元素的渲染器，它用于在浏览器中绘制图表
  PieChart, //饼图组件，用于展示数据的占比关系
  BarChart, //柱状图组件，用于展示数据的分布情况
  LineChart, //折线图组件，用于展示数据的趋势变化
  TitleComponent, //标题组件，用于添加图表的标题
  TooltipComponent, //提示组件，用于在图表上显示数据的详细信息
  GridComponent, //网格组件，用于添加图表的网格线
  LegendComponent, //图例组件，用于添加图表的图例
])

// --- 状态定义 ---
const route = useRoute()
const isLoading = ref(true)
const analyticsData = ref<AnalyticsData | null>(null)

const isAdminRoute = computed(() => route.path.startsWith('/admin/analytics'))
const linkCode = computed(() => route.params.code as string)
// (修改) 为 el-date-picker 提供一个默认值（过去 7 天），以避免 linter 报错
const sevenDaysAgo = new Date() //当前的日期和时间
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
const dateRange = ref<[Date, Date]>([sevenDaysAgo, new Date()]) // (修改) 默认查询过去7天

// --- 生命周期 ---
onMounted(() => {
  fetchAnalytics()
})

watch(dateRange, () => {
  fetchAnalytics()
})

// --- API 调用 ---
const fetchAnalytics = async () => {
  isLoading.value = true

  const apiUrl = isAdminRoute.value
    ? `/admin-shortener/analytics/${linkCode.value}`
    : `/shortener/analytics/${linkCode.value}`

  const params: GetAnalyticsParams = {}
  if (dateRange.value) {
    params.startDate = dateRange.value[0].toISOString().split('T')[0]
    params.endDate = dateRange.value[1].toISOString().split('T')[0]
  }

  try {
    const response = await apiService.get<ApiResponse<AnalyticsData>>(apiUrl, { params })
    analyticsData.value = response as unknown as AnalyticsData
  } catch (error) {
    console.error('获取分析数据失败:', error)
    analyticsData.value = null
  } finally {
    isLoading.value = false
  }
}

// --- (ECharts) 图表选项 (无变化) ---
//将 stats 数组（可能是一些统计数据）转换成适合饼图的数据格式
const mapStatsToPieData = (stats: StatItem[] | undefined) => {
  if (!stats) return []
  return stats.map((item) => ({ name: item.key || 'Unknown', value: item.value }))
}
//将 series 数组（时间序列数据）转换为折线图所需的格式
const mapTimeSeriesToLineData = (series: ClickPoint[] | undefined) => {
  if (!series) return { dates: [], values: [] }
  return {
    dates: series.map((item) => item.time),
    values: series.map((item) => item.value),
  }
}
//生成一个饼图的配置对象，用于展示 “Top 来源 (Referers)” 数据
const referersChartOption = computed(() => ({
  title: { text: 'Top 来源 (Referers)', left: 'center' },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left', top: 'center' },
  series: [
    {
      type: 'pie',
      radius: '70%',
      data: mapStatsToPieData(analyticsData.value?.topReferers),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))
const timeSeriesChartOption = computed(() => {
  const data = mapTimeSeriesToLineData(analyticsData.value?.timeSeries)
  return {
    title: { text: '点击量趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.dates },
    yAxis: { type: 'value' },
    series: [
      {
        name: '点击量',
        type: 'line',
        data: data.values,
        smooth: true,
      },
    ],
  }
})
const deviceChartOption = computed(() => ({
  title: { text: '设备 & 浏览器 & 系统' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: {},
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: ['设备(Device)', '浏览器(Browser)', '系统(OS)'],
  },
  series: [
    ...mapStatsToPieData(analyticsData.value?.topDevices).map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: 'Device',
      label: { show: index < 5, position: 'insideRight' },
      data: [item.value, 0, 0],
    })),
    ...mapStatsToPieData(analyticsData.value?.topBrowsers).map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: 'Browser',
      label: { show: index < 5, position: 'insideRight' },
      data: [0, item.value, 0],
    })),
    ...mapStatsToPieData(analyticsData.value?.topOS).map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: 'OS',
      label: { show: index < 5, position: 'insideRight' },
      data: [0, 0, item.value],
    })),
  ],
}))
</script>

<template>
  <el-card shadow="never" v-loading="isLoading">
    <template #header>
      <div class="card-header">
        <span>
          分析报表:
          <strong>{{ analyticsData?.shortCode || linkCode }}</strong>
        </span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          :start-placeholder="'开始日期'"
          :end-placeholder="'结束日期'"
          :clearable="false"
        />
      </div>
    </template>

    <div v-if="analyticsData">
      <el-row :gutter="20" class="stat-row">
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="总点击 (Total Clicks)" :value="analyticsData.totalClicks" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="el-statistic__title">Top 来源 (Top Referer)</div>
            <div class="el-statistic__value" :title="analyticsData.topReferers[0]?.key || 'N/A'">
              {{ analyticsData.topReferers[0]?.key || 'N/A' }}
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="el-statistic__title">Top 国家 (Top Country)</div>
            <div class="el-statistic__value" :title="analyticsData.topCountries[0]?.key || 'N/A'">
              {{ analyticsData.topCountries[0]?.key || 'N/A' }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <v-chart class="chart" :option="timeSeriesChartOption" autoresize />
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="10">
          <v-chart class="chart" :option="referersChartOption" autoresize />
        </el-col>
        <el-col :span="14">
          <v-chart class="chart" :option="deviceChartOption" autoresize />
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="暂无分析数据" />
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-row {
  margin-bottom: 20px;
}
.chart {
  height: 400px;
  width: 100%;
}

/* (新增) -------------------------------------------- */
/* 我们手动模拟 el-statistic__title 和 __value 的样式
  (从 DashboardView.vue 复制过来)
*/
.stat-card {
  min-height: 120px; /* 保持高度一致 */
}
.el-statistic__title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.el-statistic__value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  /* 防止长 Referer 字符串换行 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* (新增结束) ----------------------------------------- */
</style>
