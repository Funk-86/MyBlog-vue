<template>
  <t-form
    ref="form"
    class="item-container login-password"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    @submit="onSubmit"
  >
    <t-form-item name="account">
      <t-input v-model="formData.account" size="large" placeholder="请输入账号或邮箱">
        <template #prefix-icon>
          <user-icon />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item name="password">
      <t-input
        v-model="formData.password"
        size="large"
        :type="showPsw ? 'text' : 'password'"
        clearable
        placeholder="请输入登录密码"
      >
        <template #prefix-icon>
          <lock-on-icon />
        </template>
        <template #suffix-icon>
          <browse-icon v-if="showPsw" @click="showPsw = !showPsw" />
          <browse-off-icon v-else @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <div class="check-container remember-pwd">
      <t-checkbox v-model="formData.remember">记住我</t-checkbox>
      <a class="tip tip-link" href="javascript:;" @click.prevent="handleForgotPassword">忘记密码</a>
    </div>

    <t-form-item class="btn-container">
      <t-button block size="large" type="submit" :loading="submitting"> 登录 </t-button>
    </t-form-item>
  </t-form>
</template>
<script lang="ts">
import Vue from 'vue';
import { UserIcon, LockOnIcon, BrowseOffIcon, BrowseIcon } from 'tdesign-icons-vue';

const INITIAL_DATA = {
  account: '',
  password: '',
  remember: false,
};

const FORM_RULES = {
  account: [{ required: true, message: '账号或邮箱必填', type: 'error' }],
  password: [{ required: true, message: '密码必填', type: 'error' }],
};

export default Vue.extend({
  name: 'Login',
  components: {
    UserIcon,
    LockOnIcon,
    BrowseOffIcon,
    BrowseIcon,
  },
  data() {
    return {
      FORM_RULES,
      formData: { ...INITIAL_DATA },
      showPsw: false,
      submitting: false,
    };
  },
  mounted() {
    const saved = localStorage.getItem('myblog-admin-account');
    if (saved) {
      this.formData.account = saved;
      this.formData.remember = true;
    }
  },
  methods: {
    handleForgotPassword() {
      this.$message.info('忘记密码功能需后端提供找回接口');
    },
    async onSubmit({ validateResult }: { validateResult: boolean }) {
      if (validateResult !== true) return;
      this.submitting = true;
      try {
        await this.$store.dispatch('user/login', {
          account: this.formData.account.trim(),
          password: this.formData.password,
        });
        if (this.formData.remember) {
          localStorage.setItem('myblog-admin-account', this.formData.account.trim());
        } else {
          localStorage.removeItem('myblog-admin-account');
        }
        this.$message.success('登录成功');
        this.$router.replace('/').catch(() => '');
      } catch (e: any) {
        this.$message.error(e?.message || '登录失败');
      } finally {
        this.submitting = false;
      }
    },
  },
});
</script>
