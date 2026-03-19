<template>
  <t-row :gutter="[16, 16]">
    <t-col :xs="12" :xl="9">
      <t-card title="近7天文章发布趋势" class="dashboard-chart-card" :bordered="false">
        <template #actions>
          <div class="dashboard-chart-title-container">
            <t-date-range-picker
              class="card-date-picker-container"
              theme="primary"
              mode="date"
              :default-value="LAST_7_DAYS"
              @change="onDateChange"
            />
          </div>
        </template>
        <div
          id="monitorContainer"
          ref="monitorContainer"
          :style="{ width: '100%', height: `${resizeTime * 326}px` }"
        />
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="3">
      <t-card title="文章分类占比" :subtitle="chartSubtitle" class="dashboard-chart-card" :bordered="false">
        <div
          id="countContainer"
          ref="countContainer"
          :style="{ width: `${resizeTime * 326}px`, height: `${resizeTime * 326}px`, margin: '0 auto' }"
        />
      </t-card>
    </t-col>
  </t-row>
</template>
<script>
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { PieChart, LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { mapState } from 'vuex';
import dayjs from 'dayjs';

import { LAST_7_DAYS } from '@/utils/date';
import { getPostTrend, getCategoryStats } from '@/service/service-blog';
import { getChartListColor, changeChartsTheme } from '@/utils/color';

echarts.use([TooltipComponent, LegendComponent, PieChart, GridComponent, LineChart, CanvasRenderer]);

export default {
  name: 'MiddleChart',
  data() {
    return {
      LAST_7_DAYS,
      resizeTime: 1,
      postTrendData: [],
      categoryData: [],
      dateRange: null,
    };
  },
  computed: {
    ...mapState('setting', ['brandTheme', 'mode']),
    chartSubtitle() {
      const total = this.categoryData.reduce((s, d) => s + (Number(d.value) || 0), 0);
      return total > 0 ? `共 ${total} 篇` : '';
    },
  },
  watch: {
    brandTheme() {
      changeChartsTheme([this.countChart, this.monitorChart]);
    },
    mode() {
      [this.countChart, this.monitorChart].forEach((c) => c && c.dispose && c.dispose());
      this.$nextTick(() => this.renderCharts());
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.updateContainer();
      this.loadData();
    });
    window.addEventListener('resize', this.updateContainer);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateContainer);
    [this.countChart, this.monitorChart].forEach((c) => c && c.dispose && c.dispose());
  },
  methods: {
    loadData() {
      getPostTrend(7)
        .then((res) => {
          this.postTrendData = Array.isArray(res) ? res : [];
        })
        .catch(() => { this.postTrendData = []; })
        .finally(() => this.$nextTick(() => this.renderLineChart()));
      getCategoryStats()
        .then((res) => {
          this.categoryData = Array.isArray(res) ? res : [];
        })
        .catch(() => { this.categoryData = []; })
        .finally(() => this.$nextTick(() => this.renderPieChart()));
    },
    onDateChange(val) {
      this.dateRange = val;
      getPostTrend(7)
        .then((res) => {
          this.postTrendData = Array.isArray(res) ? res : [];
          this.renderLineChart();
        })
        .catch(() => {});
    },
    updateContainer() {
      if (document.documentElement.clientWidth >= 1400 && document.documentElement.clientWidth < 1920) {
        this.resizeTime = (document.documentElement.clientWidth / 2080).toFixed(2);
      } else if (document.documentElement.clientWidth < 1080) {
        this.resizeTime = (document.documentElement.clientWidth / 1080).toFixed(2);
      } else {
        this.resizeTime = 1;
      }
      this.countChart?.resize?.({ width: this.resizeTime * 326, height: this.resizeTime * 326 });
      this.monitorChart?.resize?.({
        width: this.monitorContainer?.clientWidth,
        height: this.resizeTime * 326,
      });
    },
    renderCharts() {
      this.$nextTick(() => {
        this.monitorContainer = document.getElementById('monitorContainer');
        this.countContainer = document.getElementById('countContainer');
        this.renderLineChart();
        this.renderPieChart();
        this.updateContainer();
      });
    },
    renderLineChart() {
      if (!this.monitorContainer) this.monitorContainer = document.getElementById('monitorContainer');
      if (!this.monitorContainer) return;
      if (!this.monitorChart) this.monitorChart = echarts.init(this.monitorContainer);
      const dates = this.postTrendData.map((d) => dayjs(d.statDate).format('MM-DD'));
      const counts = this.postTrendData.map((d) => Number(d.cnt) || 0);
      if (dates.length === 0) {
        for (let i = 6; i >= 0; i--) {
          dates.push(dayjs().subtract(i, 'day').format('MM-DD'));
          counts.push(0);
        }
      }
      this.monitorChart.setOption({
        color: getChartListColor(),
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
        xAxis: { type: 'category', data: dates, boundaryGap: false },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '发布数',
          type: 'line',
          smooth: true,
          data: counts,
          showSymbol: true,
          symbolSize: 8,
          areaStyle: { opacity: 0.1 },
        }],
      });
    },
    renderPieChart() {
      if (!this.countContainer) this.countContainer = document.getElementById('countContainer');
      if (!this.countContainer) return;
      if (!this.countChart) this.countChart = echarts.init(this.countContainer);
      const data = this.categoryData.map((d) => ({ name: d.name || '未分类', value: Number(d.value) || 0 })).filter((d) => d.value > 0);
      if (data.length === 0) data.push({ name: '暂无数据', value: 1 });
      const { textColor, placeholderColor, containerColor } = this.$store.state.setting?.chartColors || {};
      this.countChart.setOption({
        color: getChartListColor(),
        tooltip: { trigger: 'item' },
        legend: { orient: 'horizontal', left: 'center', bottom: 0, textStyle: { color: placeholderColor } },
        series: [{
          name: '文章分类',
          type: 'pie',
          radius: ['48%', '60%'],
          center: ['50%', '45%'],
          data,
          label: {
            show: true,
            formatter: '{b}: {c} 篇',
          },
          labelLine: { show: true },
        }],
      });
    },
  },
};
</script>
<style lang="less" scoped>
.dashboard-chart-card {
  padding: 8px;
  /deep/ .t-card__header { padding-bottom: 24px; }
  /deep/ .t-card__title { font-size: 20px; font-weight: 500; }
}
</style>
