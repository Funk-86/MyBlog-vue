<template>
  <div class="dashboard-detail">
    <t-card title="博客内容统计" class="dashboard-detail-card" :bordered="false">
      <t-row :gutter="[16, 16]">
        <t-col v-for="(item, index) in paneListData" :key="index" :xs="6" :xl="3">
          <t-card :class="['dashboard-list-card']" :description="item.title">
            <div class="dashboard-list-card__number">{{ item.number }}</div>
            <div class="dashboard-list-card__text">
              <div class="dashboard-list-card__text-left">
                环比
                <trend class="icon" :type="item.upTrend ? 'up' : 'down'" :describe="item.upTrend || item.downTrend" />
              </div>
              <chevron-right-icon />
            </div>
          </t-card>
        </t-col>
      </t-row>
    </t-card>
    <t-row :gutter="[16, 16]" class="row-margin">
      <t-col :xs="12" :xl="9">
        <t-card class="dashboard-detail-card" title="近7天内容趋势" subtitle="(篇/条)" :bordered="false">
          <template #actions>
            <t-date-range-picker
              style="width: 250px"
              :default-value="LAST_7_DAYS"
              theme="primary"
              mode="date"
              @change="onTrendChange"
            />
          </template>
          <div id="lineContainer" ref="lineContainer" style="width: 100%; height: 410px" />
        </t-card>
      </t-col>
      <t-col :xs="12" :xl="3">
        <t-card title="热门分类" :bordered="false" class="row-margin dashboard-detail-card">
          <div
            v-if="categoryStats.length"
            id="categoryPieContainer"
            ref="categoryPieContainer"
            style="width: 100%; height: 410px"
          />
          <t-empty v-else description="暂无分类数据" />
        </t-card>
      </t-col>
    </t-row>
    <t-card class="dashboard-detail-card row-margin" title="内容发布与互动对比" :bordered="false">
      <div id="scatterContainer" style="width: 100%; height: 374px" />
    </t-card>
  </div>
</template>
<script>
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { mapState } from 'vuex';
import { ChevronRightIcon } from 'tdesign-icons-vue';
import dayjs from 'dayjs';

import Trend from '@/components/trend/index.vue';
import { LAST_7_DAYS } from '@/utils/date';
import { getChartListColor, changeChartsTheme } from '@/utils/color';
import { getDashboardStats, getPostTrend, getCommentTrend, getCategoryStats } from '@/service/service-blog';

echarts.use([GridComponent, LegendComponent, TooltipComponent, LineChart, PieChart, BarChart, CanvasRenderer]);

export default {
  name: 'DashboardDetail',
  components: { Trend, ChevronRightIcon },
  data() {
    return {
      paneListData: [
        { title: '文章总数', number: '-', upTrend: '0%' },
        { title: '评论总数', number: '-', downTrend: '0%' },
        { title: '总浏览量', number: '-', upTrend: '0%' },
        { title: '近7天发布', number: '-', upTrend: '0%' },
      ],
      categoryStats: [],
      LAST_7_DAYS,
      lineChart: null,
      scatterChart: null,
      categoryPieChart: null,
      lineContainer: null,
      scatterContainer: null,
    };
  },
  computed: {
    ...mapState('setting', ['brandTheme', 'mode']),
  },
  watch: {
    brandTheme() {
      changeChartsTheme([this.lineChart, this.scatterChart, this.categoryPieChart]);
    },
    mode() {
      this.renderCharts();
      this.renderCategoryPie();
    },
  },
  mounted() {
    this.loadStats();
    this.loadCategoryStats();
    this.$nextTick(() => {
      this.renderCharts();
      this.renderCategoryPie();
    });
  },
  methods: {
    loadStats() {
      getDashboardStats().then((res) => {
        if (res && typeof res === 'object') {
          this.paneListData[0].number = res.postCount ?? '-';
          this.paneListData[1].number = res.commentCount ?? '-';
          this.paneListData[2].number = res.totalViewCount ?? '-';
        }
      });
      getPostTrend(7).then((res) => {
        const arr = Array.isArray(res) ? res : [];
        const total = arr.reduce((s, d) => s + (Number(d.cnt) || 0), 0);
        this.paneListData[3].number = total;
      });
    },
    loadCategoryStats() {
      getCategoryStats().then((res) => {
        this.categoryStats = Array.isArray(res) ? res : [];
        this.$nextTick(() => this.renderCategoryPie());
      });
    },
    renderCategoryPie() {
      if (!this.categoryStats.length) return;
      const container = document.getElementById('categoryPieContainer');
      if (!container) return;
      const colors = getChartListColor();
      const pieData = this.categoryStats.map((d) => ({
        name: (d.name || d.categoryName || '未命名') + ` (${d.value || d.postCount || 0}篇)`,
        value: Number(d.value ?? d.postCount ?? 0),
      }));
      if (!this.categoryPieChart) this.categoryPieChart = echarts.init(container);
      this.categoryPieChart.setOption({
        color: colors,
        tooltip: { trigger: 'item', formatter: '{b}: {c}篇 ({d}%)' },
        legend: { orient: 'vertical', right: 8, top: 'center', type: 'scroll', textStyle: { fontSize: 12 } },
        series: [
          {
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: pieData,
          },
        ],
      });
    },
    onTrendChange() {
      this.renderCharts();
    },
    renderCharts() {
      const { chartColors } = this.$store.state.setting || {};
      const placeholderColor = chartColors?.placeholderColor || '#999';
      const borderColor = chartColors?.borderColor || '#eee';

      Promise.all([getPostTrend(7), getCommentTrend(7)]).then(([postRes, commentRes]) => {
        const postArr = Array.isArray(postRes) ? postRes : [];
        const commentArr = Array.isArray(commentRes) ? commentRes : [];
        const dates = postArr.map((d) => dayjs(d.statDate).format('MM-DD'));
        const postData = postArr.map((d) => Number(d.cnt) || 0);
        const commentMap = {};
        commentArr.forEach((d) => {
          commentMap[dayjs(d.statDate).format('MM-DD')] = Number(d.cnt) || 0;
        });
        const commentData = dates.map((d) => commentMap[d] ?? 0);
        if (dates.length === 0) {
          for (let i = 6; i >= 0; i--) {
            dates.push(dayjs().subtract(i, 'day').format('MM-DD'));
            postData.push(0);
            commentData.push(0);
          }
        }

        this.lineContainer = document.getElementById('lineContainer');
        if (this.lineContainer) {
          if (!this.lineChart) this.lineChart = echarts.init(this.lineContainer);
          this.lineChart.setOption({
            color: getChartListColor(),
            tooltip: { trigger: 'axis' },
            legend: { left: 'center', bottom: 0, data: ['文章发布', '评论数'] },
            grid: { top: '5%', right: '10px', left: '30px', bottom: '60px', containLabel: true },
            xAxis: { type: 'category', data: dates, boundaryGap: false },
            yAxis: { type: 'value', minInterval: 1 },
            series: [
              { name: '文章发布', type: 'line', smooth: true, data: postData, showSymbol: true, symbolSize: 8 },
              { name: '评论数', type: 'line', smooth: true, data: commentData, showSymbol: true, symbolSize: 8 },
            ],
          });
        }

        this.scatterContainer = document.getElementById('scatterContainer');
        if (this.scatterContainer) {
          if (!this.scatterChart) this.scatterChart = echarts.init(this.scatterContainer);
          this.scatterChart.setOption({
            color: getChartListColor(),
            tooltip: { trigger: 'axis' },
            legend: { left: 'center', bottom: 0, data: ['文章发布', '评论数'] },
            grid: { top: '5%', left: '25px', right: '5px', bottom: '60px', containLabel: true },
            xAxis: { type: 'category', data: dates, axisLabel: { color: placeholderColor } },
            yAxis: { type: 'value', minInterval: 1 },
            series: [
              { name: '文章发布', type: 'bar', data: postData, barWidth: '30%' },
              { name: '评论数', type: 'line', smooth: true, data: commentData, yAxisIndex: 0 },
            ],
          });
        }
      });
    },
  },
};
</script>
<style lang="less" scoped>
@import '@/style/variables.less';

.row-margin { margin-top: 16px; }

.dashboard-detail-card {
  padding: 8px;
  /deep/ .t-card__title { font-size: 20px; font-weight: 500; }
  /deep/ .t-card__actions { display: flex; align-items: center; }
}

.dashboard-list-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 170px;
  padding: 8px;
  /deep/ .t-card__header { padding-bottom: 8px; }
  /deep/ .t-card__body {
    flex: 1;
    display: flex;
    padding-top: 0;
    flex-direction: column;
    justify-content: space-between;
  }
  &__number { font-size: 36px; line-height: 44px; color: var(--td-text-color-primary); }
  &__text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: var(--td-text-color-placeholder);
    &-left { display: flex; .icon { margin: 0 8px; } }
  }
}
</style>
