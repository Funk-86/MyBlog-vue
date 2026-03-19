<template>
  <t-form
    ref="form"
    class="item-container register-email"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    @submit="onSubmit"
  >
    <t-form-item name="email">
      <t-input v-model="formData.email" type="text" size="large" placeholder="请输入您的邮箱">
        <template #prefix-icon>
          <mail-icon />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item class="verification-code" name="verifyCode">
      <t-input v-model="formData.verifyCode" size="large" placeholder="请输入邮箱验证码" maxlength="6" />
      <t-button
        variant="outline"
        :disabled="countDown > 0 || !formData.email"
        @click="handleSendCode"
      >
        {{ countDown > 0 ? `${countDown}秒后重发` : '发送验证码' }}
      </t-button>
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
          <browse-icon v-if="showPsw" key="browse" @click="showPsw = !showPsw" />
          <browse-off-icon v-else key="browse-off" @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item class="check-container" name="checked">
      <t-checkbox v-model="formData.checked">我已阅读并同意 </t-checkbox> <span>TDesign服务协议</span> 和
      <span>TDesign 隐私声明</span>
    </t-form-item>

    <t-form-item>
      <t-button block size="large" type="submit" :loading="submitting"> 注册 </t-button>
    </t-form-item>
  </t-form>
</template>
<script lang="ts">
import Vue from 'vue';
import { MailIcon, BrowseIcon, BrowseOffIcon, LockOnIcon } from 'tdesign-icons-vue';
import { sendRegisterCode, register } from '@/service/service-blog';

const INITIAL_DATA = {
  email: '',
  password: '',
  verifyCode: '',
  checked: false,
};

const FORM_RULES = {
  email: [
    { required: true, message: '邮箱必填', type: 'error' },
    { email: true, message: '请输入正确邮箱格式', type: 'error' },
  ],
  verifyCode: [{ required: true, message: '验证码必填', type: 'error' }],
  password: [{ required: true, message: '密码必填', type: 'error' }],
};

export default Vue.extend({
  name: 'Register',
  components: {
    MailIcon,
    BrowseIcon,
    BrowseOffIcon,
    LockOnIcon,
  },
  data() {
    return {
      FORM_RULES,
      formData: { ...INITIAL_DATA },
      showPsw: false,
      countDown: 0,
      intervalTimer: null as ReturnType<typeof setInterval> | null,
      submitting: false,
    };
  },
  beforeDestroy() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  },
  methods: {
    handleSendCode() {
      const email = this.formData.email?.trim();
      if (!email) {
        this.$message.warning('请先输入邮箱');
        return;
      }
      sendRegisterCode(email)
        .then(() => {
          this.$message.success('验证码已发送，请查收邮件');
          this.countDown = 60;
          this.intervalTimer = setInterval(() => {
            this.countDown -= 1;
            if (this.countDown <= 0 && this.intervalTimer) {
              clearInterval(this.intervalTimer);
              this.intervalTimer = null;
            }
          }, 1000);
        })
        .catch((e: any) => {
          this.$message.error(e?.response?.data?.message || e?.message || '发送验证码失败');
        });
    },
    onSubmit({ validateResult }: { validateResult: boolean }) {
      if (validateResult !== true) return;
      if (!this.formData.checked) {
        this.$message.error('请同意TDesign服务协议和TDesign 隐私声明');
        return;
      }
      this.submitting = true;
      register(this.formData.email.trim(), this.formData.password, this.formData.verifyCode.trim())
        .then(() => {
          this.$message.success('注册成功，请登录');
          this.$emit('register-success');
        })
        .catch((e: any) => {
          const msg = e?.response?.data?.message || e?.message || '注册失败';
          this.$message.error(msg);
        })
        .finally(() => {
          this.submitting = false;
        });
    },
  },
});
</script>
