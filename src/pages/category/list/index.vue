<template>
  <t-card class="list-card-container" :bordered="false">
    <t-row justify="space-between" align="middle" class="list-operation-row">
      <div class="left-operation-container">
        <t-button theme="primary" @click="showAddDialog">添加分区</t-button>
        <t-button variant="base" theme="default" :disabled="!selectedRowKeys.length" @click="handleBatchDelete">删除</t-button>
        <t-button variant="outline" @click="loadData">刷新</t-button>
        <span v-if="selectedRowKeys.length" class="selected-count">已选{{ selectedRowKeys.length }}项</span>
      </div>
    </t-row>

    <div class="table-container category-table-align">
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
      <template #status="{ row }">
        <t-tag v-if="row.status === 1" theme="success" variant="light">启用</t-tag>
        <t-tag v-else theme="default" variant="light">关闭</t-tag>
      </template>
      <template #op="{ row }">
        <a class="t-button-link" @click="showEditDialog(row)">编辑</a>
        <a class="t-button-link t-link-danger" @click="handleDelete(row)">删除</a>
      </template>
    </t-table>
    </div>

    <t-dialog
      header="添加分区"
      :visible.sync="addVisible"
      :confirm-btn="{ content: '确定', loading: addLoading }"
      @confirm="onConfirmAdd"
      :on-cancel="() => (addVisible = false)"
    >
      <t-form ref="addForm" :data="addForm" :rules="addRules" label-width="80">
        <t-form-item label="分区名称" name="name">
          <t-input v-model="addForm.name" placeholder="请输入分区名称" clearable />
        </t-form-item>
        <t-form-item label="编码" name="code">
          <t-input v-model="addForm.code" placeholder="请输入编码（选填）" clearable />
        </t-form-item>
        <t-form-item label="排序" name="sortOrder">
          <t-input-number v-model="addForm.sortOrder" :min="0" placeholder="数字越小越靠前" style="width: 100%" />
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-radio-group v-model="addForm.status">
            <t-radio :value="1">启用</t-radio>
            <t-radio :value="0">关闭</t-radio>
          </t-radio-group>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      header="编辑分区"
      :visible.sync="editVisible"
      :confirm-btn="{ content: '确定', loading: editLoading }"
      @confirm="onConfirmEdit"
      :on-cancel="() => (editVisible = false)"
    >
      <t-form ref="editForm" :data="editForm" :rules="addRules" label-width="80">
        <t-form-item label="分区名称" name="name">
          <t-input v-model="editForm.name" placeholder="请输入分区名称" clearable />
        </t-form-item>
        <t-form-item label="编码" name="code">
          <t-input v-model="editForm.code" placeholder="请输入编码（选填）" clearable />
        </t-form-item>
        <t-form-item label="排序" name="sortOrder">
          <t-input-number v-model="editForm.sortOrder" :min="0" placeholder="数字越小越靠前" style="width: 100%" />
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-radio-group v-model="editForm.status">
            <t-radio :value="1">启用</t-radio>
            <t-radio :value="0">关闭</t-radio>
          </t-radio-group>
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
  getCategoryListForAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/service/service-blog';

export default Vue.extend({
  name: 'CategoryList',
  data() {
    return {
      verticalAlign: 'top' as const,
      hover: true,
      dataLoading: false,
      data: [],
      addVisible: false,
      addLoading: false,
      addForm: { name: '', code: '', sortOrder: 0, status: 1 },
      editVisible: false,
      editLoading: false,
      editForm: { id: 0, name: '', code: '', sortOrder: 0, status: 1 },
      addRules: {
        name: [{ required: true, message: '请输入分区名称', type: 'error' }],
      },
      selectedRowKeys: [] as (string | number)[],
      deleteVisible: false,
      deleteRow: null as { id: number; name?: string } | null,
      deleteRows: null as { id: number; name?: string }[] | null,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
        { title: '分区名称', colKey: 'name', width: 160, align: 'left', ellipsis: true },
        { title: '编码', colKey: 'code', width: 120, align: 'left', ellipsis: true },
        { title: '排序', colKey: 'sortOrder', width: 80, align: 'left' },
        { title: '状态', colKey: 'status', width: 90, align: 'left', cell: { col: 'status' } },
        { title: '创建时间', colKey: 'createdAt', width: 180, align: 'left' },
        { title: '更新时间', colKey: 'updatedAt', width: 180, align: 'left' },
        { title: '操作', colKey: 'op', width: 120, align: 'left', fixed: 'right', cell: { col: 'op' } },
      ],
    };
  },
  computed: {
    deleteConfirmHeader(): string {
      if (this.deleteRows && this.deleteRows.length > 1) return '确认删除所选分区？';
      return '确认删除分区？';
    },
    deleteConfirmBody(): string {
      if (this.deleteRows && this.deleteRows.length > 0) {
        const names = this.deleteRows.map((r) => r.name || '').join('、');
        return `删除后，${names} 将无法恢复，该分区下的文章可能受影响。`;
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
      getCategoryListForAdmin()
        .then((res: any) => {
          this.data = Array.isArray(res) ? res : (res?.list || []);
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
      this.addForm = { name: '', code: '', sortOrder: 0, status: 1 };
      this.addVisible = true;
    },
    showEditDialog(row: any) {
      this.editForm = {
        id: row.id,
        name: row.name || '',
        code: row.code || '',
        sortOrder: row.sortOrder ?? 0,
        status: row.status ?? 1,
      };
      this.editVisible = true;
    },
    onSelectChange(keys: (string | number)[]) {
      this.selectedRowKeys = keys;
    },
    onConfirmAdd() {
      const name = (this.addForm.name || '').trim();
      if (!name) {
        this.$message.warning('请输入分区名称');
        return;
      }
      this.addLoading = true;
      const code = (this.addForm.code || '').trim() || undefined;
      const sortOrder = Number(this.addForm.sortOrder) || 0;
      const status = Number(this.addForm.status);
      createCategory({ name, code, sortOrder, status })
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
    onConfirmEdit() {
      const name = (this.editForm.name || '').trim();
      if (!name) {
        this.$message.warning('请输入分区名称');
        return;
      }
      this.editLoading = true;
      const id = this.editForm.id;
      const code = (this.editForm.code || '').trim() || undefined;
      const sortOrder = Number(this.editForm.sortOrder) || 0;
      const status = Number(this.editForm.status);
      updateCategory({ id, name, code, sortOrder, status })
        .then(() => {
          this.$message.success('修改成功');
          this.editVisible = false;
          this.loadData();
        })
        .catch((e: any) => {
          this.$message.error(e?.response?.data?.message || e?.message || '修改失败');
        })
        .finally(() => {
          this.editLoading = false;
        });
    },
    handleDelete(row: { id: number; name?: string }) {
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
      const promises = ids.map((id) => deleteCategory(id));
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
      this.deleteRow = null;
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
  display: inline-block;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
}

/* 表格左移，使勾选框对齐「添加分区」、分区名称对齐「删除」 */
.category-table-align :deep(.t-table) {
  margin-left: -48px;
}

/* 限制勾选框 label 宽度，避免占用过多横向空间 */
.category-table-align :deep(label.t-checkbox) {
  width: auto;
  min-width: unset;
  max-width: 20px;
}

/* 缩小行选择列（勾选框列）的列宽 */
.category-table-align :deep(th.t-table_cell--fixed-left.t-table_cell-check.t-table_th-row-select),
.category-table-align :deep(td.t-table_cell--fixed-left.t-table_cell-check) {
  min-width: 48px;
  width: 48px;
}

</style>
