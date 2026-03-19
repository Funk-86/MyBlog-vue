<template>
  <div>
    <t-card class="list-card-container" :bordered="false">
      <t-row justify="space-between" align="middle" class="list-operation-row">
        <div class="left-operation-container">
          <t-button variant="outline" @click="loadData">刷新</t-button>
          <t-button variant="base" theme="warning" :disabled="!selectedRowKeys.length || actionLoading" @click="handleBatchBan">封禁</t-button>
          <t-button variant="base" theme="danger" :disabled="!selectedRowKeys.length || actionLoading" @click="handleBatchDelete">删除</t-button>
          <span v-if="selectedRowKeys.length" class="selected-count">已选{{ selectedRowKeys.length }}项</span>
        </div>
        <t-input
          v-model="searchValue"
          class="search-input"
          placeholder="请输入用户名、昵称或邮箱搜索"
          clearable
          @enter="onSearch"
          @change="onSearch"
        >
          <template #suffix-icon>
            <search-icon size="20px" />
          </template>
        </t-input>
      </t-row>

      <div class="table-container">
        <t-table
          :columns="columns"
          :data="data"
          row-key="id"
          :loading="dataLoading"
          :pagination="pagination"
          :selected-row-keys="selectedRowKeys"
          :vertical-align="verticalAlign"
          :hover="hover"
          @page-change="onPageChange"
          @select-change="onSelectChange"
        >
          <template #role="{ row }">
            <t-tag v-if="row.role === 1" theme="primary" variant="light" size="small">管理员</t-tag>
            <t-tag v-else theme="default" variant="light" size="small">普通用户</t-tag>
          </template>
          <template #status="{ row }">
            <t-tag v-if="row.status === 0" theme="success" variant="light" size="small">正常</t-tag>
            <t-tag v-else-if="row.status === 1" theme="warning" variant="light" size="small">
              {{ row.bannedUntil ? `封禁至 ${String(row.bannedUntil).replace('T', ' ').slice(0, 16)}` : '永久封禁' }}
            </t-tag>
            <t-tag v-else theme="default" variant="light" size="small">注销</t-tag>
          </template>
          <template #op="{ row }">
            <template v-if="row.status === 0">
              <a class="t-button-link t-link-warning" @click="handleBan(row)">封禁</a>
            </template>
            <template v-else-if="row.status === 1">
              <a class="t-button-link" @click="handleUnban(row)">解封</a>
            </template>
            <a v-if="row.status !== 2" class="t-button-link t-link-danger" @click="handleDelete(row)">删除</a>
          </template>
        </t-table>
      </div>

      <t-dialog
        header="封禁用户"
        :visible.sync="banDialogVisible"
        :confirm-btn="{ content: '确定封禁' }"
        @confirm="onConfirmBan"
        @close="banDialogVisible = false"
      >
        <p class="ban-dialog-tip">选择封禁时长，到期后自动解封；选「永久」则需管理员手动解封。</p>
        <t-radio-group v-model="banDurationOption" class="ban-duration-group">
          <t-radio value="3_day">3 天</t-radio>
          <t-radio value="7_day">7 天</t-radio>
          <t-radio value="1_month">1 个月</t-radio>
          <t-radio value="3_month">3 个月</t-radio>
          <t-radio value="1_year">1 年</t-radio>
          <t-radio value="permanent">永久</t-radio>
        </t-radio-group>
      </t-dialog>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { DialogPlugin } from 'tdesign-vue';
import { SearchIcon } from 'tdesign-icons-vue';
import { getUserList, updateUserStatus, type BanDuration } from '@/service/service-blog';

export default Vue.extend({
  name: 'AdminUserList',
  components: { SearchIcon },
  data() {
    return {
      dataLoading: false,
      actionLoading: false,
      data: [] as any[],
      searchValue: '',
      selectedRowKeys: [] as (string | number)[],
      verticalAlign: 'top' as const,
      hover: true,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        { title: '用户名', colKey: 'username', width: 120, ellipsis: true },
        { title: '昵称', colKey: 'nickname', width: 120, ellipsis: true },
        { title: '邮箱', colKey: 'email', ellipsis: true, minWidth: 180 },
        { title: '角色', colKey: 'role', width: 90, cell: { col: 'role' } },
        { title: '状态', colKey: 'status', width: 180, ellipsis: true, cell: { col: 'status' } },
        { title: '简介', colKey: 'bio', ellipsis: true, minWidth: 150 },
        { title: '注册时间', colKey: 'createdAt', width: 180 },
        { title: '操作', colKey: 'op', width: 140, fixed: 'right', cell: { col: 'op' } },
      ],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      banDialogVisible: false,
      banDurationOption: '7_day' as string,
      pendingBanIds: [] as number[],
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.dataLoading = true;
      const keyword = (this.searchValue || '').trim() || undefined;
      getUserList({
        page: this.pagination.current,
        size: this.pagination.pageSize,
        keyword,
      })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || []);
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
    onSelectChange(keys: (string | number)[]) {
      this.selectedRowKeys = keys;
    },
    onSearch() {
      this.pagination.current = 1;
      this.loadData();
    },
    getSelectedIds(): number[] {
      return this.selectedRowKeys.map((k) => Number(k));
    },
    doUpdateStatus(ids: number[], status: number, successTip: string, duration?: BanDuration | null) {
      this.actionLoading = true;
      updateUserStatus(ids, status, duration)
        .then(() => {
          this.$message.success(successTip);
          this.selectedRowKeys = [];
          this.loadData();
        })
        .catch(() => this.$message.error('操作失败'))
        .finally(() => {
          this.actionLoading = false;
        });
    },
    getBanDurationFromOption(): BanDuration | null {
      const opt = this.banDurationOption;
      if (opt === 'permanent') return { value: 0, unit: 'permanent' };
      if (opt === '3_day') return { value: 3, unit: 'day' };
      if (opt === '7_day') return { value: 7, unit: 'day' };
      if (opt === '1_month') return { value: 1, unit: 'month' };
      if (opt === '3_month') return { value: 3, unit: 'month' };
      if (opt === '1_year') return { value: 1, unit: 'year' };
      return { value: 7, unit: 'day' };
    },
    onConfirmBan() {
      const ids = this.pendingBanIds;
      this.banDialogVisible = false;
      if (!ids.length) return;
      const duration = this.getBanDurationFromOption();
      this.doUpdateStatus(ids, 1, '封禁成功', duration);
    },
    handleBatchBan() {
      const ids = this.getSelectedIds();
      if (!ids.length) return;
      this.pendingBanIds = ids;
      this.banDialogVisible = true;
    },
    handleBatchDelete() {
      const ids = this.getSelectedIds();
      if (!ids.length) return;
      DialogPlugin.confirm({
        header: '删除用户',
        body: `确定删除（注销）选中的 ${ids.length} 个用户？删除后账号将无法恢复。`,
        onConfirm: () => this.doUpdateStatus(ids, 2, '删除成功'),
      });
    },
    handleBan(row: any) {
      this.pendingBanIds = [Number(row.id)];
      this.banDialogVisible = true;
    },
    handleUnban(row: any) {
      DialogPlugin.confirm({
        header: '解封用户',
        body: `确定解封用户「${row.nickname || row.username}」？`,
        onConfirm: () => this.doUpdateStatus([Number(row.id)], 0, '解封成功'),
      });
    },
    handleDelete(row: any) {
      DialogPlugin.confirm({
        header: '删除用户',
        body: `确定删除（注销）用户「${row.nickname || row.username}」？删除后账号将无法恢复。`,
        onConfirm: () => this.doUpdateStatus([Number(row.id)], 2, '删除成功'),
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

.left-operation-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-count {
  display: inline-block;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.search-input {
  width: 360px;
}

.t-link-warning {
  color: var(--td-warning-color);
}
.t-link-warning:hover {
  color: var(--td-warning-color-hover);
}

.ban-dialog-tip {
  color: var(--td-text-color-secondary);
  margin-bottom: 16px;
  font-size: 14px;
}
.ban-duration-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
