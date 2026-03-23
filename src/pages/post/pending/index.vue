<template>
  <div>
    <t-card class="list-card-container" :bordered="false">
      <t-row justify="space-between" align="middle" class="list-operation-row">
        <div class="left-operation-container">
          <t-button variant="base" @click="loadData">刷新</t-button>
        </div>
      </t-row>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          row-key="id"
          :vertical-align="verticalAlign"
          :hover="hover"
          :pagination="pagination"
          :loading="dataLoading"
          @page-change="onPageChange"
        >
          <template #createdAt="{ row }">
            {{ formatPublishTimeBeijing(row.createdAt) }}
          </template>
          <template #status="{ row }">
            <t-tag v-if="row.status === 1" theme="warning" variant="light">审核中</t-tag>
            <t-tag v-else-if="row.status === 3" theme="danger" variant="light">AI已拦截</t-tag>
            <t-tag v-else-if="row.status === 0" theme="success" variant="light">已通过</t-tag>
            <t-tag v-else theme="default" variant="light">其他</t-tag>
          </template>
          <template #op="{ row }">
            <a class="t-button-link" @click="handleViewDetail(row)">详情</a>
            <!-- 只有未处理（审核中）的帖子可以操作；已通过(0) 和 AI拦截(3) 只允许查看详情 -->
            <template v-if="row.status === 1">
              <a class="t-button-link" @click="handleApprove(row)">通过</a>
              <a class="t-button-link" @click="handleReject(row)">拒绝</a>
            </template>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getPostPendingList, approvePost, rejectPost } from '@/service/service-blog';
import { formatPublishTimeBeijing } from '@/utils/date';

export default Vue.extend({
  name: 'PostPending',
  data() {
    return {
      dataLoading: false,
      data: [],
      verticalAlign: 'top' as const,
      hover: true,
      columns: [
        {
          title: '帖子标题',
          colKey: 'title',
          align: 'left',
          ellipsis: true,
          width: 200,
        },
        { title: '分类', colKey: 'categoryName1', width: 100 },
        { title: '类型', colKey: 'type', width: 80 },
        { title: '状态', colKey: 'status', width: 90, cell: { col: 'status' } },
        { title: '作者', colKey: 'nickname', width: 120 },
        { title: '点赞', colKey: 'likeCount', width: 70 },
        { title: '评论数', colKey: 'commentCount', width: 80 },
        { title: '阅读量', colKey: 'viewCount', width: 80 },
        { title: '发布时间', colKey: 'createdAt', width: 200, cell: { col: 'createdAt' } },
        { title: '操作', colKey: 'op', width: 160, cell: { col: 'op' } },
      ],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    formatPublishTimeBeijing,
    loadData() {
      this.dataLoading = true;
      // 使用专门的待审接口，由后端返回 status=1 或 3 的帖子
      getPostPendingList({
        page: this.pagination.current,
        size: this.pagination.pageSize,
      })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
          this.data = list;
          this.pagination.total = list.length;
        })
        .catch(() => {
          this.$message.error('加载失败');
          this.data = [];
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    onPageChange(pageInfo: { current: number; pageSize: number }) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.loadData();
    },
    handleViewDetail(row: { id: number }) {
      this.$router.push('/post/detail/' + row.id);
    },
    handleApprove(row: { id: number }) {
      if ((row as any).status === 3) {
        this.$message.warning('该帖子已被 AI 拦截，不能再次操作');
        return;
      }
      approvePost(row.id)
        .then(() => {
          this.$message.success('已通过审核');
          this.loadData();
        })
        .catch((e) => {
          this.$message.error('操作失败：' + (e?.message || '请检查后端服务'));
        });
    },
    handleReject(row: { id: number }) {
      if ((row as any).status === 3) {
        this.$message.warning('该帖子已被 AI 拦截，不能再次操作');
        return;
      }
      rejectPost(row.id)
        .then(() => {
          this.$message.success('已拒绝该帖子');
          this.loadData();
        })
        .catch((e) => {
          this.$message.error('操作失败：' + (e?.message || '请检查后端服务'));
        });
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.list-operation-row {
  padding: 10px 0;
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
}
</style>
