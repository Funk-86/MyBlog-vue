<template>
  <div class="user-center user-page">
    <t-row :gutter="[16, 24]">
      <t-col :span="12">
        <t-card title="基本信息" :bordered="false" class="user-card user-info-card">
          <div class="profile user-intro-block">
            <t-avatar size="80px">{{ (userInfo.username || 'U').charAt(0).toUpperCase() }}</t-avatar>
            <div class="profile-name">{{ userInfo.username || '管理员' }}</div>
            <div class="profile-desc">{{ basicForm.nickname || userInfo.username || '未设置昵称' }}</div>
          </div>
          <t-form :data="basicForm" label-width="80" layout="vertical" class="basic-form">
            <t-form-item label="昵称" name="nickname">
              <t-input v-model="basicForm.nickname" placeholder="请输入昵称" />
            </t-form-item>
            <t-form-item label="简介" name="bio">
              <t-textarea v-model="basicForm.bio" placeholder="选填" :autosize="{ minRows: 2 }" />
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" size="small" @click="saveBasic">保存</t-button>
            </t-form-item>
          </t-form>
        </t-card>
      </t-col>
    </t-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';

const BASIC_INFO_KEY = 'myblog-admin-basic';

function loadBasicInfo() {
  try {
    const s = localStorage.getItem(BASIC_INFO_KEY);
    return s ? JSON.parse(s) : { nickname: '', bio: '' };
  } catch {
    return { nickname: '', bio: '' };
  }
}

export default Vue.extend({
  name: 'UserIndex',
  data() {
    return {
      basicForm: loadBasicInfo(),
    };
  },
  computed: {
    ...mapState('user', ['userInfo']),
  },
  methods: {
    saveBasic() {
      localStorage.setItem(BASIC_INFO_KEY, JSON.stringify(this.basicForm));
      this.$message.success('已保存');
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.user-center {
  padding: 0;
}

.user-page {
  /deep/ .t-card__title {
    font-size: 20px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }
}

.user-card {
  min-height: 320px;
}

.profile {
  text-align: center;
  padding: 24px 0 20px;
  border-bottom: 1px solid var(--td-component-border);
  margin-bottom: 20px;

  .profile-name {
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    margin-top: 16px;
    color: var(--td-text-color-primary);
  }
  .profile-desc {
    font-size: 14px;
    line-height: 22px;
    color: var(--td-text-color-secondary);
    margin-top: 8px;
  }
}

.user-intro-block {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-default);
}

.basic-form {
  font-size: 14px;

  :deep(.t-form__label) {
    font-size: 14px;
    color: var(--td-text-color-secondary);
  }
  :deep(.t-form__controls) {
    width: 100%;
  }
}
</style>
