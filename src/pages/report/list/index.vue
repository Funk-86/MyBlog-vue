<template>
  <t-card class="list-card-container" :bordered="false">
    <t-row justify="space-between" align="middle" class="list-operation-row">
      <div class="left-operation-container">
        <t-button variant="outline" @click="loadData">刷新</t-button>
      </div>
    </t-row>
    <t-table
      :columns="columns"
      :data="data"
      row-key="id"
      :loading="dataLoading"
      :pagination="pagination"
      @page-change="onPageChange"
    >
      <template #targetType="{ row }">
        <t-tag v-if="row.targetType === 1" theme="primary" variant="light" size="small">用户</t-tag>
        <t-tag v-else-if="row.targetType === 2" theme="success" variant="light" size="small">帖子</t-tag>
        <t-tag v-else-if="row.targetType === 3" theme="warning" variant="light" size="small">评论</t-tag>
        <t-tag v-else theme="default" variant="light" size="small">未知</t-tag>
      </template>
      <template #reasonCode="{ row }">
        <span class="reason-text">
          {{
            row.reasonCode === 1 ? '发布社区无关内容'
              : row.reasonCode === 2 ? '发布违法违规内容'
              : row.reasonCode === 3 ? '发布色情低俗内容'
              : row.reasonCode === 4 ? '骚扰、引战、人身攻击'
              : row.reasonCode === 5 ? '侵权/隐私泄露'
              : row.reasonCode === 6 ? '诈骗或虚假信息'
              : row.reasonCode === 7 ? '未成年人不当内容'
              : row.reasonCode === 8 ? '其他问题'
              : row.reasonCode
          }}
        </span>
      </template>
      <template #description="{ row }">
        <span>{{ row.description || '暂无' }}</span>
      </template>
      <template #status="{ row }">
        <t-tag v-if="row.status === 0" theme="warning" variant="light" size="small">待处理</t-tag>
        <t-tag v-else-if="row.status === 1 || row.status === 2" theme="success" variant="light" size="small">已处理</t-tag>
        <t-tag v-else theme="default" variant="light" size="small">已忽略</t-tag>
      </template>
      <template #operation="{ row }">
        <template v-if="row.status === 0">
          <t-button
            v-if="row.targetType === 2 || row.targetType === 3"
            theme="danger"
            variant="outline"
            size="small"
            @click="onTakeDown(row)"
          >
            {{ row.targetType === 3 ? '删除' : '下架' }}
          </t-button>
          <t-button
            theme="default"
            variant="outline"
            size="small"
            :class="{ 'op-btn-reject': row.targetType === 2 }"
            @click="onReject(row)"
          >
            驳回
          </t-button>
        </template>
        <span v-else class="op-disabled">-</span>
      </template>
    </t-table>
  </t-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { DialogPlugin } from 'tdesign-vue';
import { getReportList, takeDownReport, rejectReport } from '@/service/service-blog';

export default Vue.extend({
  name: 'ReportList',
  data() {
    return {
      dataLoading: false,
      data: [],
      columns: [
        { title: '举报人', colKey: 'reporterName', width: 120, ellipsis: true },
        { title: '举报类型', colKey: 'targetType', width: 90, cell: { col: 'targetType' } },
        { title: '被举报ID', colKey: 'targetId', width: 90 },
        { title: '举报原因', colKey: 'reasonCode', width: 160, ellipsis: true, cell: { col: 'reasonCode' } },
        { title: '描述', colKey: 'description', ellipsis: true, minWidth: 220, cell: { col: 'description' } },
        { title: '状态', colKey: 'status', width: 90, cell: { col: 'status' } },
        { title: '举报时间', colKey: 'createdAt', width: 180 },
        { title: '操作', colKey: 'operation', width: 160, cell: { col: 'operation' } },
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
    loadData() {
      this.dataLoading = true;
      getReportList({ page: this.pagination.current, size: this.pagination.pageSize })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || []);
          this.data = list;
          this.pagination.total = list.length;
        })
        .catch(() => {
          this.$message.error('加载失败，请确保 report 表已创建');
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
    onTakeDown(row: { id: number }) {
      const dialog = DialogPlugin.confirm({
        header: '提示',
        body: row.targetType === 3
          ? '确定删除该评论？删除后将通知举报人和被举报人。'
          : '确定下架该帖子？下架后将删除帖子并通知举报人和被举报人。',
        onConfirm: () => {
          if (dialog && typeof dialog.hide === 'function') dialog.hide();
          takeDownReport(row.id)
            .then(() => {
              this.$message.success(row.targetType === 3 ? '删除成功' : '下架成功');
              this.loadData();
            })
            .catch(() => {
              this.$message.error(row.targetType === 3 ? '删除失败' : '下架失败');
            });
        },
      });
    },
    onReject(row: { id: number }) {
      const dialog = DialogPlugin.confirm({
        header: '提示',
        body: '确定驳回该举报？帖子将保留，会通知举报人。',
        onConfirm: () => {
          if (dialog && typeof dialog.hide === 'function') dialog.hide();
          rejectReport(row.id)
            .then(() => {
              this.$message.success('已驳回');
              this.loadData();
            })
            .catch(() => {
              this.$message.error('驳回失败');
            });
        },
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

.reason-text {
  white-space: nowrap;
}

.op-disabled {
  color: #999;
}

.op-btn-reject {
  margin-left: 8px;
}
</style>
