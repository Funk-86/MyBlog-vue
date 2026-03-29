<template>
  <div>
    <t-card class="list-card-container" :bordered="false">
      <t-row justify="space-between" align="middle" class="list-operation-row">
        <div class="left-operation-container">
          <t-button theme="primary" @click="showAddUserDialog">添加用户</t-button>
          <t-button variant="outline" @click="loadData">刷新</t-button>
          <t-select
            v-model="filterUserStatus"
            placeholder="按账号状态"
            clearable
            class="user-status-select"
            @change="onSearch"
          >
            <t-option :value="0" label="正常" />
            <t-option :value="1" label="封禁" />
            <t-option :value="2" label="注销" />
          </t-select>
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
          :header-affixed-top="true"
          :header-affix-props="{ offsetTop: offsetTop, container: getContainer }"
          @page-change="onPageChange"
          @select-change="onSelectChange"
        >
          <template #avatarUrl="{ row }">
            <t-avatar size="40px" :image="avatarFullUrl(row.avatarUrl)">
              {{ (row.nickname || row.username || '?').charAt(0) }}
            </t-avatar>
          </template>
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
            <a class="t-button-link" @click="handleEdit(row)">更改</a>
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
        header="添加用户"
        :visible.sync="addUserVisible"
        :confirm-btn="{ content: '确定', loading: addUserLoading }"
        @confirm="onConfirmAddUser"
        @close="addUserVisible = false"
      >
        <t-form ref="addUserForm" :data="addUserForm" :rules="addUserRules" label-width="80">
          <t-form-item label="用户名" name="username">
            <t-input v-model="addUserForm.username" placeholder="请输入用户名" clearable />
          </t-form-item>
          <t-form-item label="邮箱" name="email">
            <t-input v-model="addUserForm.email" placeholder="请输入邮箱" clearable type="text" />
          </t-form-item>
          <t-form-item label="密码" name="password">
            <t-input v-model="addUserForm.password" placeholder="请输入密码" clearable type="password" />
          </t-form-item>
          <t-form-item label="角色" name="role">
            <t-radio-group v-model="addUserForm.role">
              <t-radio :value="0">普通用户</t-radio>
              <t-radio :value="1">管理员</t-radio>
            </t-radio-group>
          </t-form-item>
        </t-form>
      </t-dialog>

      <t-dialog
        header="更改用户信息"
        :visible.sync="editUserVisible"
        width="520px"
        :confirm-btn="{ content: '保存', loading: editUserLoading }"
        @confirm="onConfirmEditUser"
        @close="editUserVisible = false"
      >
        <t-form ref="editUserForm" :data="editUserForm" :rules="editUserRules" label-width="80">
          <t-form-item label="头像" name="avatar">
            <div class="avatar-edit-row">
              <t-avatar size="56px" :image="avatarFullUrl(editUserForm.avatarUrl)">
                {{ (editUserForm.nickname || editUserForm.username || '?').charAt(0) }}
              </t-avatar>
              <div class="avatar-edit-actions">
                <input
                  ref="avatarFileInput"
                  type="file"
                  accept="image/*"
                  class="avatar-file-input"
                  @change="onAvatarFileChange"
                />
                <t-button size="small" variant="outline" @click="triggerAvatarPick">上传图片</t-button>
                <span class="avatar-tip">上传后保存时一并写入</span>
              </div>
            </div>
          </t-form-item>
          <t-form-item label="用户名" name="username">
            <t-input v-model="editUserForm.username" placeholder="请输入用户名" clearable />
          </t-form-item>
          <t-form-item label="邮箱" name="email">
            <t-input v-model="editUserForm.email" placeholder="请输入邮箱" clearable type="text" />
          </t-form-item>
          <t-form-item label="昵称" name="nickname">
            <t-input v-model="editUserForm.nickname" placeholder="选填" clearable />
          </t-form-item>
          <t-form-item label="简介" name="bio">
            <t-textarea v-model="editUserForm.bio" placeholder="选填" :autosize="{ minRows: 2, maxRows: 5 }" />
          </t-form-item>
          <t-form-item label="新密码" name="password">
            <t-input v-model="editUserForm.password" placeholder="留空则不修改密码" clearable type="password" />
          </t-form-item>
          <t-form-item label="角色" name="role">
            <t-radio-group v-model="editUserForm.role">
              <t-radio :value="0">普通用户</t-radio>
              <t-radio :value="1">管理员</t-radio>
            </t-radio-group>
          </t-form-item>
        </t-form>
      </t-dialog>

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
import request from '@/utils/request';
import proxy from '@/config/host';
import {
  getUserList,
  updateUserStatus,
  createUser,
  updateUserAdmin,
  type BanDuration,
} from '@/service/service-blog';
import { prefix } from '@/config/global';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || 'development';
const API_HOST = (proxy as any)[env]?.API || '';

export default Vue.extend({
  name: 'AdminUserList',
  components: { SearchIcon },
  data() {
    return {
      dataLoading: false,
      actionLoading: false,
      data: [] as any[],
      searchValue: '',
      filterUserStatus: undefined as number | undefined,
      selectedRowKeys: [] as (string | number)[],
      verticalAlign: 'top' as const,
      hover: true,
      columns: [
        { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
        { title: '头像', colKey: 'avatarUrl', width: 80, align: 'center', cell: { col: 'avatarUrl' } },
        { title: '用户名', colKey: 'username', width: 120, ellipsis: true },
        { title: '昵称', colKey: 'nickname', width: 120, ellipsis: true },
        { title: '邮箱', colKey: 'email', ellipsis: true, minWidth: 180 },
        { title: '角色', colKey: 'role', width: 90, cell: { col: 'role' } },
        { title: '状态', colKey: 'status', width: 180, ellipsis: true, cell: { col: 'status' } },
        { title: '简介', colKey: 'bio', ellipsis: true, minWidth: 150 },
        { title: '注册时间', colKey: 'createdAt', width: 180 },
        { title: '操作', colKey: 'op', width: 200, fixed: 'right', cell: { col: 'op' } },
      ],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      banDialogVisible: false,
      banDurationOption: '7_day' as string,
      pendingBanIds: [] as number[],
      addUserVisible: false,
      addUserLoading: false,
      addUserForm: { username: '', email: '', password: '', role: 0 },
      addUserRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      },
      editUserVisible: false,
      editUserLoading: false,
      editUserForm: {
        id: 0 as number,
        username: '',
        email: '',
        nickname: '',
        bio: '',
        password: '',
        role: 0,
        avatarUrl: '',
      },
      editUserRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
        ],
      },
    };
  },
  computed: {
    offsetTop() {
      return this.$store.state.setting?.isUseTabsRouter ? 48 : 0;
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    getContainer() {
      return document.querySelector(`.${prefix}-layout`) || document.body;
    },
    avatarFullUrl(path: string | null | undefined) {
      if (!path) return '';
      const s = String(path).trim();
      if (!s || s.startsWith('http://') || s.startsWith('https://')) return s;
      return API_HOST ? `${API_HOST.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}` : s;
    },
    triggerAvatarPick() {
      (this.$refs.avatarFileInput as HTMLInputElement)?.click?.();
    },
    onAvatarFileChange(ev: Event) {
      const input = ev.target as HTMLInputElement;
      const file = input.files && input.files[0];
      if (!file || !this.editUserForm.id) return;
      const fd = new FormData();
      fd.append('userId', String(this.editUserForm.id));
      fd.append('file', file);
      request
        .post('/user/uploadAvatar', fd)
        .then((data: unknown) => {
          const url = typeof data === 'string' ? data : '';
          if (url) {
            this.editUserForm.avatarUrl = url;
            this.$message.success('头像已上传，请点击保存');
          }
        })
        .catch(() => this.$message.error('头像上传失败'))
        .finally(() => {
          input.value = '';
        });
    },
    loadData() {
      this.dataLoading = true;
      const keyword = (this.searchValue || '').trim() || undefined;
      getUserList({
        page: this.pagination.current,
        size: this.pagination.pageSize,
        keyword,
        userStatus: this.filterUserStatus,
      })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
          this.data = list;
          const total = typeof res?.total === 'number' ? res.total : list.length;
          this.pagination.total = total;
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
    handleEdit(row: any) {
      this.editUserForm = {
        id: Number(row.id),
        username: row.username || '',
        email: row.email || '',
        nickname: row.nickname != null ? String(row.nickname) : '',
        bio: row.bio != null ? String(row.bio) : '',
        password: '',
        role: row.role === 1 ? 1 : 0,
        avatarUrl: row.avatarUrl != null ? String(row.avatarUrl) : '',
      };
      this.editUserVisible = true;
      this.$nextTick(() => {
        (this.$refs.editUserForm as any)?.clearValidate?.();
      });
    },
    onConfirmEditUser() {
      const form = this.$refs.editUserForm as any;
      if (form?.validate) {
        form
          .validate()
          .then(() => this.submitEditUser())
          .catch(() => {});
      } else {
        this.submitEditUser();
      }
    },
    submitEditUser() {
      const f = this.editUserForm;
      if (!f.id) return;
      this.editUserLoading = true;
      const payload: {
        id: number;
        username: string;
        email: string;
        role: number;
        nickname?: string;
        bio?: string;
        password?: string;
        avatarUrl?: string;
      } = {
        id: f.id,
        username: f.username.trim(),
        email: f.email.trim(),
        role: f.role,
        nickname: (f.nickname || '').trim() || undefined,
        bio: (f.bio || '').trim() || undefined,
      };
      const pwd = (f.password || '').trim();
      if (pwd) payload.password = pwd;
      const av = (f.avatarUrl || '').trim();
      if (av) payload.avatarUrl = av;
      updateUserAdmin(payload)
        .then((res: any) => {
          if (res?.success === false) {
            this.$message.error(res?.message || '保存失败');
            return;
          }
          this.$message.success('保存成功');
          this.editUserVisible = false;
          this.loadData();
        })
        .catch(() => this.$message.error('保存失败'))
        .finally(() => {
          this.editUserLoading = false;
        });
    },
    showAddUserDialog() {
      this.addUserForm = { username: '', email: '', password: '', role: 0 };
      this.addUserVisible = true;
      this.$nextTick(() => {
        (this.$refs.addUserForm as any)?.clearValidate?.();
      });
    },
    onConfirmAddUser() {
      const form = this.$refs.addUserForm as any;
      if (form?.validate) {
        form
          .validate()
          .then(() => this.submitAddUser())
          .catch(() => {});
      } else {
        this.submitAddUser();
      }
    },
    submitAddUser() {
      this.addUserLoading = true;
      createUser({
        username: this.addUserForm.username.trim(),
        email: this.addUserForm.email.trim(),
        password: this.addUserForm.password,
        role: this.addUserForm.role,
      })
        .then((res: any) => {
          if (res?.success === false) {
            this.$message.error(res?.message || '添加失败');
            return;
          }
          this.$message.success('添加成功');
          this.addUserVisible = false;
          this.loadData();
        })
        .catch(() => this.$message.error('添加失败'))
        .finally(() => {
          this.addUserLoading = false;
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

.user-status-select {
  width: 140px;
}

.avatar-edit-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-edit-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.avatar-file-input {
  display: none;
}

.avatar-tip {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
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
