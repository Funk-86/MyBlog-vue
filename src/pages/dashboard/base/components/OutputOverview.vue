<template>
  <t-card :bordered="false">
    <t-row>
      <t-col :xs="12" :xl="9">
        <t-card
          :bordered="false"
          title="近7天每日发布文章数"
          class="dashboard-overview-card overview-panel"
        >
          <div id="publishBarContainer" ref="publishBarContainer" style="width: 100%; height: 351px" />
        </t-card>
      </t-col>
      <t-col :xs="12" :xl="3">
        <t-card :bordered="false" class="dashboard-overview-card export-panel">
          <div class="inner-card">
            <div class="inner-card__title">本月发布</div>
            <div class="inner-card__value">{{ monthPublishCount }}</div>
            <div class="inner-card__footer">较上月</div>
          </div>
          <div class="inner-card">
            <div class="inner-card__title">近7天发布</div>
            <div class="inner-card__value">{{ weekPublishCount }}</div>
            <div class="inner-card__footer">篇</div>
          </div>
        </t-card>
      </t-col>
    </t-row>
  </t-card>
</template>
<script>
import { BarChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { mapState } from 'vuex';
import dayjs from 'dayjs';

import { getPostTrend } from '@/service/service-blog';
import { getChartListColor, changeChartsTheme } from '@/utils/color';

echarts.use([TooltipComponent, GridComponent, BarChart, CanvasRenderer]);

export default {
  name: 'OutputOverview',
  data() {
    return {
      publishChart: null,
      postTrendData: [],
      weekPublishCount: 0,
      monthPublishCount: 0,
    };
  },
  computed: {
    ...mapState('setting', ['brandTheme', 'mode']),
  },
  watch: {
    brandTheme() {
      changeChartsTheme([this.publishChart]);
    },
    mode() {
      this.publishChart?.dispose?.();
      this.$nextTick(() => this.renderChart());
    },
  },
  mounted() {
    this.loadData();
    window.addEventListener('resize', () => this.publishChart?.resize?.());
  },
  beforeDestroy() {
    window.removeEventListener('resize', () => {});
    this.publishChart?.dispose?.();
  },
  methods: {
    loadData() {
      getPostTrend(30)
        .then((res) => {
          const arr = Array.isArray(res) ? res : [];
          this.postTrendData = arr;
          const now = dayjs();
          this.weekPublishCount = arr
            .filter((d) => dayjs(d.statDate).isAfter(now.subtract(7, 'day')))
            .reduce((s, d) => s + (Number(d.cnt) || 0), 0);
          this.monthPublishCount = arr
            .filter((d) => dayjs(d.statDate).isAfter(now.subtract(30, 'day')))
            .reduce((s, d) => s + (Number(d.cnt) || 0), 0);
          this.renderChart();
        })
        .catch(() => {
          this.renderChart();
        });
    },
    renderChart() {
      const el = document.getElementById('publishBarContainer');
      if (!el) return;
      if (!this.publishChart) this.publishChart = echarts.init(el);
      const last7 = this.postTrendData.slice(-7);
      const dates = last7.length ? last7.map((d) => dayjs(d.statDate).format('MM-DD')) : [];
      const counts = last7.length ? last7.map((d) => Number(d.cnt) || 0) : [];
      if (dates.length === 0) {
        for (let i = 6; i >= 0; i--) {
          dates.push(dayjs().subtract(i, 'day').format('MM-DD'));
          counts.push(0);
        }
      }
      this.publishChart.setOption({
        color: getChartListColor(),
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '5%', containLabel: true },
        xAxis: { type: 'category', data: dates, axisTick: { alignWithLabel: true } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '发布数',
          type: 'bar',
          barWidth: '40%',
          data: counts,
        }],
      });
    },
  },
};
</script>
<style lang="less" scoped>
@import '@/style/variables.less';

.dashboard-overview-card {
  /deep/ .t-card__header { padding-bottom: 24px; }
  /deep/ .t-card__title { font-size: 20px; font-weight: 500; }
  &.overview-panel { border-right: none; }
  &.export-panel { border-left: none; }
}

.inner-card {
  padding: 24px 0;
  text-align: center;
  &__title { font-size: 14px; color: var(--td-text-color-placeholder); }
  &__value { font-size: 32px; font-weight: 600; margin: 8px 0; }
  &__footer { font-size: 12px; color: var(--td-text-color-placeholder); }
}
</style>
