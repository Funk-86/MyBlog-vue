<template>
  <div>
    <t-card class="list-card-container" :bordered="false">
      <t-row justify="space-between" align="middle" class="list-operation-row">
        <div class="left-operation-container">
          <t-button @click="handleCreate">写文章</t-button>
          <t-button variant="base" theme="default" :disabled="!selectedRowKeys.length" @click="handleExport">导出文章</t-button>
          <t-select
            v-model="filterCategory"
            placeholder="按分类筛选"
            clearable
            class="category-select"
            @change="onSearch"
          >
            <t-option v-for="c in categoryOptions" :key="c.id" :value="c.id" :label="c.name" />
          </t-select>
          <p v-if="selectedRowKeys.length" class="selected-count">已选{{ selectedRowKeys.length }}项</p>
        </div>
        <t-input
          v-model="searchValue"
          class="search-input"
          placeholder="请输入你需要搜索的内容"
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
          :vertical-align="verticalAlign"
          :hover="hover"
          :pagination="pagination"
          :selected-row-keys="selectedRowKeys"
          :loading="dataLoading"
          @page-change="onPageChange"
          @select-change="onSelectChange"
          :header-affixed-top="true"
          :header-affix-props="{ offsetTop: offsetTop, container: getContainer }"
        >
          <template #type="{ row }">
            <t-tag v-if="row.type === 0" theme="primary" variant="light">文字</t-tag>
            <t-tag v-else-if="row.type === 1" theme="success" variant="light">图文</t-tag>
            <t-tag v-else-if="row.type === 2" theme="warning" variant="light">视频</t-tag>
          </template>
          <template #status="{ row }">
            <t-tag v-if="row.status === 0" theme="success" variant="light">正常</t-tag>
            <t-tag v-else-if="row.status === 1" theme="warning" variant="light">审核中</t-tag>
            <t-tag v-else-if="row.status === 2" theme="danger" variant="light">已删除</t-tag>
            <t-tag v-else-if="row.status === 3" theme="default" variant="light">已屏蔽</t-tag>
          </template>
          <template #createdAt="{ row }">
            {{ formatPublishTimeBeijing(row.createdAt) }}
          </template>
          <template #op="slotProps">
            <a class="t-button-link" @click="handleViewDetail(slotProps.row)">详情</a>
            <a class="t-button-link" @click="handleClickDelete(slotProps)">删除</a>
          </template>
        </t-table>
      </div>
    </t-card>
    <t-dialog
      header="确认删除当前所选文章？"
      :body="confirmBody"
      :visible.sync="confirmVisible"
      :confirm-btn="{ content: '删除', theme: 'danger', loading: deleteSubmitting }"
      @confirm="onConfirmDelete"
      :onCancel="onCancel"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SearchIcon } from 'tdesign-icons-vue';
import { getPostList, getCategoryList, deletePostAdmin } from '@/service/service-blog';
import { formatPublishTimeBeijing } from '@/utils/date';
import { prefix } from '@/config/global';

export default Vue.extend({
  name: 'PostList',
  components: { SearchIcon },
  data() {
    return {
      dataLoading: false,
      data: [],
      searchValue: '',
      filterCategory: undefined,
      categoryOptions: [],
      selectedRowKeys: [] as (string | number)[],
      deleteRow: null as { id: number; title?: string } | null,
      confirmVisible: false,
      verticalAlign: 'top' as const,
      hover: true,
      deleteSubmitting: false,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        {
          title: '文章标题',
          colKey: 'title',
          align: 'left',
          ellipsis: true,
          width: 140,
          fixed: 'left',
        },
        { title: '文章分类', colKey: 'categoryName1', width: 100 },
        { title: '类型', colKey: 'type', width: 100, cell: { col: 'type' } },
        { title: '文章状态', colKey: 'status', width: 100, cell: { col: 'status' } },
        { title: '作者', colKey: 'nickname', width: 120 },
        { title: '点赞', colKey: 'likeCount', width: 80 },
        { title: '评论数', colKey: 'commentCount', width: 80 },
        { title: '阅读量', colKey: 'viewCount', width: 80 },
        { title: '发布时间', colKey: 'createdAt', width: 200, cell: { col: 'createdAt' } },
        { title: '操作', colKey: 'op', width: 120, align: 'left', fixed: 'right', cell: { col: 'op' } },
      ],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
    };
  },
  computed: {
    confirmBody(): string {
      if (!this.deleteRow) return '';
      return `删除后，${this.deleteRow.title || '该文章'}的所有信息将被清空，且无法恢复`;
    },
    offsetTop() {
      return this.$store.state.setting?.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.loadCategories();
    this.loadData();
  },
  methods: {
    formatPublishTimeBeijing,
    getContainer() {
      return document.querySelector(`.${prefix}-layout`) || document.body;
    },
    loadCategories() {
      getCategoryList().then((res: any) => {
        this.categoryOptions = Array.isArray(res) ? res : (res?.list || []);
      });
    },
    loadData() {
      this.dataLoading = true;
      getPostList({
        page: this.pagination.current,
        size: this.pagination.pageSize,
        categoryId: this.filterCategory,
      })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
          this.data = list;
          const total = typeof res?.total === 'number' ? res.total : list.length;
          this.pagination.total = total;
        })
        .catch((e) => {
          this.$message.error('加载失败：' + (e?.message || '请检查后端服务'));
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
    onSelectChange(selectedRowKeys: (string | number)[]) {
      this.selectedRowKeys = selectedRowKeys;
    },
    onSearch() {
      this.pagination.current = 1;
      this.loadData();
    },
    handleCreate() {
      this.$router.push('/post/create');
    },
    handleViewDetail(row: { id: number }) {
      this.$router.push('/post/detail/' + row.id);
    },
    handleEdit(row: { id: number }) {
      this.$router.push('/post/edit/' + row.id);
    },
    handleExport() {
      const list = this.selectedRowKeys.length
        ? this.data.filter((r: any) => this.selectedRowKeys.includes(r.id))
        : this.data;
      if (!list.length) {
        this.$message.warning('请先选择要导出的文章');
        return;
      }
      const headers = ['文章标题', '分类', '状态', '作者', '评论数', '阅读量', '发布时间'];
      const rows = list.map((r: any) => [
        r.title, r.categoryName1 || '',
        r.status === 0 ? '正常' : r.status === 1 ? '审核中' : r.status === 2 ? '已删除' : '已屏蔽',
        r.nickname || '', r.commentCount ?? 0, r.viewCount ?? 0, formatPublishTimeBeijing(r.createdAt) || '',
      ]);
      const csv = [headers.join(','), ...rows.map((row: any[]) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `文章列表_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message.success('导出成功');
    },
    handleClickDelete(slotProps: { row: { id: number; title?: string } }) {
      this.deleteRow = slotProps.row;
      this.confirmVisible = true;
    },
    onConfirmDelete() {
      if (!this.deleteRow || this.deleteSubmitting) return;
      this.deleteSubmitting = true;
      deletePostAdmin(this.deleteRow.id)
        .then(() => {
          this.$message.success('删除成功');
          this.confirmVisible = false;
          this.resetDelete();
          this.loadData();
        })
        .catch((e: any) => {
          this.$message.error('删除失败：' + (e?.message || e?.msg || '请检查网络或后端'));
        })
        .finally(() => {
          this.deleteSubmitting = false;
        });
    },
    onCancel() {
      this.deleteSubmitting = false;
      this.resetDelete();
    },
    resetDelete() {
      this.deleteRow = null;
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

  .t-button + .t-button {
    margin-left: var(--td-comp-margin-s);
  }

  .category-select {
    width: 160px;
    margin-left: var(--td-comp-margin-s);
  }

  .selected-count {
    display: inline-block;
    margin-left: var(--td-comp-margin-s);
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }
}

.search-input {
  width: 360px;
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
}
</style>
