<template>
  <t-card class="list-card-container" :bordered="false">
    <t-row justify="space-between" align="middle" class="list-operation-row">
      <div class="left-operation-container">
        <t-button theme="primary" @click="showAddDialog">添加违禁词</t-button>
        <t-button variant="outline" theme="default" @click="showImportDialog">从 TXT 导入</t-button>
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
        :pagination="pagination"
        :selected-row-keys="selectedRowKeys"
        @select-change="onSelectChange"
        @page-change="onPageChange"
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
      header="从 TXT 导入违禁词"
      :visible.sync="importVisible"
      :confirm-btn="{ content: '开始导入', loading: importLoading }"
      @confirm="onConfirmImport"
      :on-cancel="closeImportDialog"
    >
      <p class="import-hint">
        请上传 UTF-8 编码的 .txt 文件。每行一个违禁词，或一行内用英文逗号、中文逗号、分号分隔多个词。以 # 开头的行为注释。单词最多 100
        字，单次最多处理约 10000 条。
      </p>
      <t-form :data="importForm" label-width="80">
        <t-form-item label="级别">
          <t-select v-model="importForm.level" placeholder="请选择级别">
            <t-option :value="1" label="提示" />
            <t-option :value="2" label="拦截" />
            <t-option :value="3" label="人工审核" />
          </t-select>
        </t-form-item>
        <t-form-item label="状态">
          <t-switch v-model="importForm.enabled" :label="['启用', '禁用']" />
        </t-form-item>
        <t-form-item label="文件">
          <t-button variant="outline" @click="triggerTxtFile">选择文件</t-button>
          <input
            ref="txtFileInput"
            type="file"
            accept=".txt,text/plain"
            class="import-file-input"
            @change="onImportFileChange"
          />
          <span v-if="importFileName" class="import-file-name">{{ importFileName }}</span>
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
import {
  getSensitiveWordList,
  createSensitiveWord,
  deleteSensitiveWord,
  importSensitiveWordsFromTxt,
} from '@/service/service-blog';

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
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      importVisible: false,
      importLoading: false,
      importForm: { level: 2, enabled: true },
      importFile: null as File | null,
      importFileName: '',
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
      getSensitiveWordList({ page: this.pagination.current, size: this.pagination.pageSize })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || res?.records || []);
          this.data = list;
          const total = res?.total;
          this.pagination.total = typeof total === 'number' ? total : list.length;
        })
        .catch(() => {
          this.$message.error('加载失败');
          this.data = [];
          this.pagination.total = 0;
        })
        .finally(() => {
          this.dataLoading = false;
        });
    },
    onPageChange(pageInfo: { current: number; pageSize: number }) {
      this.pagination.current = pageInfo.current;
      this.pagination.pageSize = pageInfo.pageSize;
      this.selectedRowKeys = [];
      this.loadData();
    },
    showAddDialog() {
      this.addForm = { word: '', level: 2, enabled: true };
      this.addVisible = true;
    },
    showImportDialog() {
      this.importForm = { level: 2, enabled: true };
      this.importFile = null;
      this.importFileName = '';
      this.importVisible = true;
      this.$nextTick(() => {
        const el = this.$refs.txtFileInput as HTMLInputElement | undefined;
        if (el) el.value = '';
      });
    },
    triggerTxtFile() {
      const el = this.$refs.txtFileInput as HTMLInputElement | undefined;
      el?.click();
    },
    onImportFileChange(e: Event) {
      const input = e.target as HTMLInputElement;
      const f = input.files && input.files[0];
      this.importFile = f || null;
      this.importFileName = f ? f.name : '';
    },
    closeImportDialog() {
      this.importVisible = false;
      this.importFile = null;
      this.importFileName = '';
      const el = this.$refs.txtFileInput as HTMLInputElement | undefined;
      if (el) el.value = '';
    },
    onConfirmImport() {
      if (!this.importFile) {
        this.$message.warning('请先选择 txt 文件');
        return;
      }
      const fd = new FormData();
      fd.append('file', this.importFile);
      fd.append('level', String(this.importForm.level || 2));
      fd.append('status', this.importForm.enabled ? '0' : '1');
      this.importLoading = true;
      importSensitiveWordsFromTxt(fd)
        .then((res: any) => {
          const imp = typeof res?.imported === 'number' ? res.imported : 0;
          const dup = typeof res?.duplicates === 'number' ? res.duplicates : 0;
          const inv = typeof res?.invalid === 'number' ? res.invalid : 0;
          this.$message.success(`导入完成：新增 ${imp} 条，重复跳过 ${dup} 条，无效 ${inv} 条`);
          this.closeImportDialog();
          this.loadData();
        })
        .catch((e: any) => {
          this.$message.error(e?.response?.data?.message || e?.message || '导入失败');
        })
        .finally(() => {
          this.importLoading = false;
        });
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

.import-hint {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
}

.import-file-input {
  display: none;
}

.import-file-name {
  margin-left: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
</style>

