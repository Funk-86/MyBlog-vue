<template>
  <t-row :gutter="[16, 16]">
    <t-col :xs="12" :xl="6">
      <t-card title="文章排行" class="dashboard-rank-card" :bordered="false">
        <template #actions>
          <t-button variant="text" size="small" @click="loadTopPosts">刷新</t-button>
        </template>
        <t-table :data="postRankList" :columns="postColumns" row-key="id" :loading="loading">
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">{{ rowIndex + 1 }}</span>
          </template>
          <template #title="{ row }">
            <span class="ellipsis" :title="row.title">{{ row.title || '-' }}</span>
          </template>
          <template #commentCount="{ row }">{{ row.commentCount ?? 0 }}</template>
          <template #viewCount="{ row }">{{ row.viewCount ?? 0 }}</template>
          <template #operation="{ row }">
            <a class="link" @click="goPost(row.id)">查看</a>
          </template>
        </t-table>
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="6">
      <t-card title="内容发布概览" class="dashboard-rank-card" :bordered="false">
        <div class="overview-panel">
          <div class="overview-item">
            <span class="overview-label">近7天发布</span>
            <span class="overview-value">{{ weekPublishCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">总文章数</span>
            <span class="overview-value">{{ stats.postCount ?? '-' }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">总评论数</span>
            <span class="overview-value">{{ stats.commentCount ?? '-' }}</span>
          </div>
        </div>
      </t-card>
    </t-col>
  </t-row>
</template>
<script>
import { getTopPosts, getDashboardStats, getPostTrend } from '@/service/service-blog';

export default {
  name: 'RankList',
  data() {
    return {
      loading: false,
      postRankList: [],
      stats: {},
      weekPublishCount: 0,
      postColumns: [
        { title: '排名', colKey: 'index', width: 70, cell: { col: 'index' } },
        { title: '文章标题', colKey: 'title', ellipsis: true, cell: { col: 'title' } },
        { title: '分类', colKey: 'categoryName1', width: 90 },
        { title: '评论', colKey: 'commentCount', width: 80, cell: { col: 'commentCount' } },
        { title: '阅读', colKey: 'viewCount', width: 80, cell: { col: 'viewCount' } },
        { title: '操作', colKey: 'operation', width: 80, cell: { col: 'operation' } },
      ],
    };
  },
  mounted() {
    this.loadTopPosts();
    this.loadStats();
  },
  methods: {
    getRankClass(index) {
      return ['dashboard-rank__cell', { 'dashboard-rank__cell--top': index < 3 }];
    },
    loadTopPosts() {
      this.loading = true;
      getTopPosts(5)
        .then((res) => {
          this.postRankList = Array.isArray(res) ? res : [];
        })
        .catch(() => {
          this.postRankList = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadStats() {
      getDashboardStats().then((res) => {
        if (res && typeof res === 'object') this.stats = res;
      });
      getPostTrend(7).then((res) => {
        const arr = Array.isArray(res) ? res : [];
        this.weekPublishCount = arr.reduce((s, d) => s + (Number(d.cnt) || 0), 0);
      });
    },
    goPost(id) {
      if (id) this.$router.push(`/post/edit/${id}?mode=view`);
    },
  },
};
</script>
<style lang="less" scoped>
@import '@/style/variables.less';

.dashboard-rank-card {
  padding: 8px;
  /deep/ .t-card__header { padding-bottom: 24px; }
  /deep/ .t-card__title { font-size: 20px; font-weight: 500; }
}

.ellipsis {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.link {
  color: var(--td-brand-color);
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.dashboard-rank__cell {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  background-color: var(--td-gray-color-5);
  align-items: center;
  justify-content: center;
  font-weight: 700;
  &--top { background: var(--td-brand-color); }
}

.overview-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px 0;
}
.overview-item {
  flex: 1;
  min-width: 100px;
  text-align: center;
  .overview-label { display: block; color: var(--td-text-color-placeholder); font-size: 14px; }
  .overview-value { font-size: 24px; font-weight: 600; color: var(--td-text-color-primary); }
}
</style>
