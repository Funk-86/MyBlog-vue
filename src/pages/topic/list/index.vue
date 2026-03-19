<template>
  <t-card class="list-card-container" :bordered="false">
    <t-row justify="space-between" align="middle" class="list-operation-row">
      <div class="left-operation-container">
        <t-button theme="primary" @click="showAddDialog">添加话题</t-button>
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
        <template #op="{ row }">
          <a class="t-button-link" @click="showEditDialog(row)">编辑</a>
          <a class="t-button-link t-link-danger" @click="handleDelete(row)">删除</a>
        </template>
      </t-table>
    </div>

    <t-dialog
      header="添加话题"
      :visible.sync="addVisible"
      :confirm-btn="{ content: '确定', loading: addLoading }"
      @confirm="onConfirmAdd"
      :on-cancel="() => (addVisible = false)"
    >
      <t-form ref="addForm" :data="addForm" :rules="formRules" label-width="80">
        <t-form-item label="话题名称" name="name">
          <t-input v-model="addForm.name" placeholder="请输入话题名称" clearable />
        </t-form-item>
        <t-form-item label="Slug" name="slug">
          <t-input v-model="addForm.slug" placeholder="英文/拼音，用于链接（选填）" clearable />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      header="编辑话题"
      :visible.sync="editVisible"
      :confirm-btn="{ content: '确定', loading: editLoading }"
      @confirm="onConfirmEdit"
      :on-cancel="() => (editVisible = false)"
    >
      <t-form ref="editForm" :data="editForm" :rules="formRules" label-width="80">
        <t-form-item label="话题名称" name="name">
          <t-input v-model="editForm.name" placeholder="请输入话题名称" clearable />
        </t-form-item>
        <t-form-item label="Slug" name="slug">
          <t-input v-model="editForm.slug" placeholder="英文/拼音，用于链接（选填）" clearable />
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
  getTopicListForAdmin,
  createTopic,
  updateTopic,
  deleteTopic,
} from '@/service/service-blog';

export default Vue.extend({
  name: 'TopicList',
  data() {
    return {
      verticalAlign: 'top' as const,
      hover: true,
      dataLoading: false,
      data: [] as any[],
      addVisible: false,
      addLoading: false,
      addForm: { name: '', slug: '' },
      editVisible: false,
      editLoading: false,
      editForm: { id: 0, name: '', slug: '' },
      formRules: {
        name: [{ required: true, message: '请输入话题名称', type: 'error' }],
      },
      selectedRowKeys: [] as (string | number)[],
      deleteVisible: false,
      deleteRows: null as { id: number; name?: string }[] | null,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
        { title: 'ID', colKey: 'id', width: 80, align: 'left' },
        { title: '话题名称', colKey: 'name', width: 200, align: 'left', ellipsis: true },
        { title: 'Slug', colKey: 'slug', width: 200, align: 'left', ellipsis: true },
        { title: '帖子数', colKey: 'postCount', width: 100, align: 'left' },
        { title: '创建时间', colKey: 'createdAt', width: 180, align: 'left' },
        { title: '更新时间', colKey: 'updatedAt', width: 180, align: 'left' },
        { title: '操作', colKey: 'op', width: 120, align: 'left', fixed: 'right', cell: { col: 'op' } },
      ],
    };
  },
  computed: {
    deleteConfirmHeader(): string {
      if (this.deleteRows && this.deleteRows.length > 1) return '确认删除所选话题？';
      return '确认删除话题？';
    },
    deleteConfirmBody(): string {
      if (this.deleteRows && this.deleteRows.length > 0) {
        const names = this.deleteRows.map((r) => r.name || '').join('、');
        return `删除后，${names} 将无法恢复，该话题下的帖子依然保留。`;
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
      getTopicListForAdmin()
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
      this.addForm = { name: '', slug: '' };
      this.addVisible = true;
    },
    showEditDialog(row: any) {
      this.editForm = {
        id: row.id,
        name: row.name || '',
        slug: row.slug || '',
      };
      this.editVisible = true;
    },
    onSelectChange(keys: (string | number)[]) {
      this.selectedRowKeys = keys;
    },
    onConfirmAdd() {
      const name = (this.addForm.name || '').trim();
      if (!name) {
        this.$message.warning('请输入话题名称');
        return;
      }
      this.addLoading = true;
      const slug = (this.addForm.slug || '').trim() || undefined;
      createTopic({ name, slug })
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
        this.$message.warning('请输入话题名称');
        return;
      }
      this.editLoading = true;
      const id = this.editForm.id;
      const slug = (this.editForm.slug || '').trim() || undefined;
      updateTopic({ id, name, slug })
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
      const promises = ids.map((id) => deleteTopic(id));
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
  display: inline-block;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
}
</style>

