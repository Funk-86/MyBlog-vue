<template>
  <t-card class="list-card-container" :bordered="false">
    <t-row justify="space-between" align="middle" class="list-operation-row">
      <div class="left-operation-container">
        <t-button theme="primary" @click="showAddDialog">添加违禁词</t-button>
        <t-button variant="base" theme="default" :disabled="!selectedRowKeys.length" @click="handleBatchDelete">
          删除
        </t-button>
        <t-button variant="outline" @click="loadData">刷新</t-button>
        <span v-if="selectedRowKeys.length" class="selected-count">已选{{ selectedRowKeys.length }}项</span>
      </div>
    </t-row>

    <div class="table-container">
      <t-table
        :columns="columns"
        :data="data"
        row-key="id"
        :loading="dataLoading"
        :selected-row-keys="selectedRowKeys"
        @select-change="onSelectChange"
        :vertical-align="verticalAlign"
        :hover="hover"
      >
        <template #level="{ row }">
          <span v-if="row.level === 1">提示</span>
          <span v-else-if="row.level === 2">拦截</span>
          <span v-else-if="row.level === 3">人工审核</span>
          <span v-else>-</span>
        </template>
        <template #status="{ row }">
          <t-tag v-if="row.status === 0" theme="success" variant="light">启用</t-tag>
          <t-tag v-else theme="default" variant="light">禁用</t-tag>
        </template>
        <template #op="{ row }">
          <a class="t-button-link t-link-danger" @click="handleDelete(row)">删除</a>
        </template>
      </t-table>
    </div>

    <t-dialog
      header="添加违禁词"
      :visible.sync="addVisible"
      :confirm-btn="{ content: '确定', loading: addLoading }"
      @confirm="onConfirmAdd"
      :on-cancel="() => (addVisible = false)"
    >
      <t-form ref="addForm" :data="addForm" :rules="formRules" label-width="80">
        <t-form-item label="违禁词" name="word">
          <t-input v-model="addForm.word" placeholder="请输入违禁词" clearable />
        </t-form-item>
        <t-form-item label="级别" name="level">
          <t-select v-model="addForm.level" placeholder="请选择级别">
            <t-option :value="1" label="提示" />
            <t-option :value="2" label="拦截" />
            <t-option :value="3" label="人工审核" />
          </t-select>
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-switch v-model="addForm.enabled" :label="['启用', '禁用']" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      :header="deleteConfirmHeader"
      :body="deleteConfirmBody"
      :visible.sync="deleteVisible"
      @confirm="onConfirmDelete"
      :on-cancel="resetDelete"
    />
  </t-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { getSensitiveWordList, createSensitiveWord, deleteSensitiveWord } from '@/service/service-blog';

export default Vue.extend({
  name: 'SensitiveWordList',
  data() {
    return {
      verticalAlign: 'top' as const,
      hover: true,
      dataLoading: false,
      data: [] as any[],
      addVisible: false,
      addLoading: false,
      addForm: { word: '', level: 2, enabled: true },
      formRules: {
        word: [{ required: true, message: '请输入违禁词', type: 'error' }],
      },
      selectedRowKeys: [] as (string | number)[],
      deleteVisible: false,
      deleteRows: null as { id: number; word?: string }[] | null,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
        { title: 'ID', colKey: 'id', width: 80, align: 'left' },
        { title: '违禁词', colKey: 'word', minWidth: 200, align: 'left', ellipsis: true },
        { title: '级别', colKey: 'level', width: 120, align: 'left', cell: { col: 'level' } },
        { title: '状态', colKey: 'status', width: 120, align: 'left', cell: { col: 'status' } },
        { title: '创建时间', colKey: 'createdAt', width: 180, align: 'left' },
        { title: '更新时间', colKey: 'updatedAt', width: 180, align: 'left' },
        { title: '操作', colKey: 'op', width: 120, align: 'left', fixed: 'right', cell: { col: 'op' } },
      ],
    };
  },
  computed: {
    deleteConfirmHeader(): string {
      if (this.deleteRows && this.deleteRows.length > 1) return '确认删除所选违禁词？';
      return '确认删除违禁词？';
    },
    deleteConfirmBody(): string {
      if (this.deleteRows && this.deleteRows.length > 0) {
        const names = this.deleteRows.map((r) => r.word || '').join('、');
        return `删除后，${names} 将无法恢复。`;
      }
      return '';
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.dataLoading = true;
      getSensitiveWordList()
        .then((res: any) => {
          this.data = Array.isArray(res) ? res : (res?.records || res?.list || []);
        })
        .catch(() => {
          this.$message.error('加载失败');
          this.data = [];
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    showAddDialog() {
      this.addForm = { word: '', level: 2, enabled: true };
      this.addVisible = true;
    },
    onSelectChange(keys: (string | number)[]) {
      this.selectedRowKeys = keys;
    },
    onConfirmAdd() {
      const word = (this.addForm.word || '').trim();
      if (!word) {
        this.$message.warning('请输入违禁词');
        return;
      }
      this.addLoading = true;
      const level = this.addForm.level || 2;
      const status = this.addForm.enabled ? 0 : 1;
      createSensitiveWord({ word, level, status })
        .then(() => {
          this.$message.success('添加成功');
          this.addVisible = false;
          this.loadData();
        })
        .catch((e: any) => {
          this.$message.error(e?.response?.data?.message || e?.message || '添加失败');
        })
        .finally(() => {
          this.addLoading = false;
        });
    },
    handleDelete(row: { id: number; word?: string }) {
      this.deleteRows = [row];
      this.deleteVisible = true;
    },
    handleBatchDelete() {
      if (!this.selectedRowKeys.length) return;
      const rows = this.data.filter((r: any) => this.selectedRowKeys.includes(r.id));
      this.deleteRows = rows;
      this.deleteVisible = true;
    },
    onConfirmDelete() {
      if (!this.deleteRows || !this.deleteRows.length) return;
      const ids = this.deleteRows.map((r) => r.id);
      const promises = ids.map((id) => deleteSensitiveWord(id));
      Promise.all(promises)
        .then(() => {
          this.$message.success('删除成功');
          this.deleteVisible = false;
          this.selectedRowKeys = [];
          this.loadData();
        })
        .catch((e: any) => {
          this.$message.error(e?.response?.data?.message || e?.message || '删除失败');
        })
        .finally(() => {
          this.resetDelete();
        });
    },
    resetDelete() {
      this.deleteRows = null;
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.list-operation-row {
  padding: 10px 0;
  margin-bottom: 8px;
}

.left-operation-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.left-operation-container .t-button + .t-button,
.left-operation-container .t-button + .selected-count,
.left-operation-container .selected-count + .t-button {
  margin-left: var(--td-comp-margin-s);
}

.selected-count {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.table-container {
  margin-top: 8px;
}

.t-link-danger {
  color: var(--td-error-color);
}
</style>

