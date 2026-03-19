<template>
  <div class="form-page">
    <t-card :bordered="false" class="form-card">
      <div class="form-basic-container-title">文章发布</div>
      <t-steps :current="currentStep" layout="vertical" readonly>
      <t-step-item title="基础信息" content="标题、摘要、封面、分类" />
      <t-step-item title="内容编辑" content="正文（Markdown）" />
      <t-step-item title="发布设置" content="可见性、定时发布等" />
    </t-steps>

    <t-form
      ref="form"
      :data="formData"
      :rules="formRules"
      label-align="top"
      :label-width="100"
      class="post-form"
      @reset="onReset"
      @submit="onSubmit"
    >
      <!-- Step 1: 基础信息 -->
      <div v-show="currentStep === 0" class="form-step">
        <t-row :gutter="[16, 24]">
          <t-col :span="12">
            <t-form-item label="文章标题" name="title">
              <t-input
                v-model="formData.title"
                placeholder="请输入文章标题"
                :disabled="isViewMode"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="摘要" name="summary">
              <t-textarea
                v-model="formData.summary"
                placeholder="选填，用于列表/卡片展示"
                :autosize="{ minRows: 2 }"
                :disabled="isViewMode"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="封面图" name="cover">
              <t-upload
                v-if="!isViewMode"
                v-model="coverFiles"
                :action="uploadImageUrl"
                name="file"
                theme="image"
                :max="1"
                accept="image/*"
                :format-response="formatUploadResponse"
                tips="支持 jpg/png，单张 2MB 以内"
                :size-limit="{ size: 2, unit: 'MB' }"
              />
              <div v-else v-show="formData.cover" class="cover-preview">
                <img :src="coverDisplayUrl" alt="封面" />
              </div>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="主分区" name="categoryId1">
              <t-select
                v-model="formData.categoryId1"
                placeholder="请选择主分区"
                clearable
                :disabled="isViewMode"
              >
                <t-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :value="item.id"
                  :label="item.name"
                />
              </t-select>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="副分区" name="categoryId2">
              <t-select
                v-model="formData.categoryId2"
                placeholder="选填"
                clearable
                :disabled="isViewMode"
              >
                <t-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :value="item.id"
                  :label="item.name"
                />
              </t-select>
            </t-form-item>
          </t-col>
        </t-row>
      </div>

      <!-- Step 2: 内容编辑 -->
      <div v-show="currentStep === 1" class="form-step form-step-content">
        <t-form-item label="文章内容（Markdown）" name="content">
          <div class="md-editor">
            <t-tabs v-model="contentTab">
              <t-tab-panel value="edit" label="编辑">
                <t-textarea
                  v-model="formData.content"
                  placeholder="支持 Markdown 语法"
                  :autosize="{ minRows: 12 }"
                  :disabled="isViewMode"
                  class="md-textarea"
                />
              </t-tab-panel>
              <t-tab-panel value="preview" label="预览">
                <div class="md-preview" v-html="contentPreview"></div>
              </t-tab-panel>
            </t-tabs>
          </div>
        </t-form-item>
      </div>

      <!-- Step 3: 发布设置 -->
      <div v-show="currentStep === 2" class="form-step">
        <t-row :gutter="[16, 24]">
          <t-col :span="12">
            <t-form-item label="可见性" name="visibility">
              <t-radio-group v-model="formData.visibility" :disabled="isViewMode">
                <t-radio :value="0">公开</t-radio>
                <t-radio :value="1">仅自己</t-radio>
              </t-radio-group>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="允许评论">
              <t-switch v-model="formData.allowComment" :disabled="isViewMode" />
            </t-form-item>
          </t-col>
        </t-row>
      </div>

      <div class="form-submit-container">
        <template v-if="!isViewMode">
          <t-button v-if="currentStep > 0" variant="outline" @click="currentStep--">上一步</t-button>
          <t-button v-if="currentStep < 2" theme="primary" @click="goNextStep">下一步</t-button>
          <t-button v-else theme="primary" type="submit">发布</t-button>
          <t-button theme="default" type="reset" variant="base">重置</t-button>
        </template>
        <t-button v-else theme="default" @click="$router.back()">返回</t-button>
      </div>
    </t-form>
    </t-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import request from '@/utils/request';
import { getCategoryList, createPost, getPostDetail, UPLOAD_IMAGE_URL } from '@/service/service-blog';

const INITIAL_DATA = {
  userId: 1,
  title: '',
  summary: '',
  cover: '',
  content: '',
  categoryId1: undefined as number | undefined,
  categoryId2: undefined as number | undefined,
  images: [] as string[],
  visibility: 0,
  allowComment: true,
};

export default Vue.extend({
  name: 'PostEdit',
  data() {
    return {
      currentStep: 0,
      contentTab: 'edit',
      formData: { ...INITIAL_DATA },
      coverFiles: [] as any[],
      categoryOptions: [] as { id: number; name: string }[],
      formRules: {
        title: [{ required: true, message: '请输入文章标题', type: 'error' }],
        content: [{ required: true, message: '请输入文章内容', type: 'error' }],
      },
      postId: null as number | null,
      isViewMode: false,
      uploadImageUrl: UPLOAD_IMAGE_URL,
    };
  },
  computed: {
    coverDisplayUrl(): string {
      const c = this.formData.cover || '';
      if (!c) return '';
      return c.startsWith('http') ? c : `${(this as any).uploadImageUrl.replace(/\/post\/uploadImage$/, '')}${c.startsWith('/') ? c : '/' + c}`;
    },
    contentPreview(): string {
      const raw = this.formData.content || '';
      if (!raw.trim()) return '<p class="empty-tip">暂无内容</p>';
      try {
        return marked(raw, { gfm: true });
      } catch {
        return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    },
  },
  watch: {
    coverFiles: {
      handler(val: any[]) {
        const url = val?.length && val[0]?.url ? val[0].url : '';
        this.formData.cover = url;
      },
      deep: true,
    },
  },
  mounted() {
    this.loadCategories();
    const id = this.$route.params.id;
    if (id) {
      this.postId = Number(id);
      this.isViewMode = this.$route.query.mode === 'view';
      this.loadPost();
    } else {
      const user = this.$store.state?.user?.userInfo;
      if (user?.id) this.formData.userId = user.id;
    }
  },
  methods: {
    formatUploadResponse(res: any) {
      const path = typeof res === 'string' ? res : (res?.url || res?.data || '');
      const base = (this as any).uploadImageUrl.replace(/\/post\/uploadImage$/, '');
      const full = path && !path.startsWith('http') ? `${base}${path.startsWith('/') ? path : '/' + path}` : path;
      return { url: full || '' };
    },
    loadCategories() {
      getCategoryList()
        .then((res: any) => {
          this.categoryOptions = Array.isArray(res) ? res : (res?.list || []);
        })
        .catch(() => {
          this.categoryOptions = [];
        });
    },
    loadPost() {
      if (!this.postId) return;
      getPostDetail(this.postId)
        .then((res: any) => {
          if (res) {
            this.formData.title = res.title || '';
            this.formData.summary = (res as any).summary || '';
            this.formData.cover = (res as any).cover || res.firstImageUrl || '';
            this.formData.content = res.content || '';
            this.formData.categoryId1 = res.categoryId1;
            this.formData.categoryId2 = res.categoryId2;
            this.formData.visibility = res.visibility ?? 0;
            if (this.formData.cover) {
              const base = (request.defaults as any)?.baseURL || '';
              const full = this.formData.cover.startsWith('http') ? this.formData.cover : `${base}${this.formData.cover.startsWith('/') ? '' : '/'}${this.formData.cover}`;
              this.coverFiles = [{ url: full }];
            }
          }
        })
        .catch(() => {
          this.$message.error('加载文章失败');
        });
    },
    goNextStep() {
      const rules = this.currentStep === 0 ? ['title'] : ['content'];
      (this.$refs.form as any)?.validate?.({ fields: rules }).then((r: any) => {
        if (r === true) this.currentStep++;
      });
    },
    onReset() {
      this.formData = { ...INITIAL_DATA };
      this.coverFiles = [];
      this.currentStep = 0;
    },
    onSubmit({ validateResult }: { validateResult: boolean }) {
      if (validateResult !== true) return;
      if (this.postId) {
        this.$message.info('编辑功能需后端提供 /post/update 接口');
        return;
      }
      const coverPath = this.formData.cover
        ? (this.formData.cover.startsWith('http') ? new URL(this.formData.cover).pathname : this.formData.cover)
        : '';
      const images = coverPath ? [coverPath] : [];
      const payload: any = {
        userId: this.formData.userId,
        title: this.formData.title,
        content: this.formData.content,
        categoryId1: this.formData.categoryId1 || null,
        categoryId2: this.formData.categoryId2 || null,
        images,
        visibility: this.formData.visibility,
      };
      if (this.formData.summary) payload.summary = this.formData.summary;
      createPost(payload)
        .then(() => {
          this.$message.success('发布成功');
          this.$router.push('/post/list');
        })
        .catch((e) => {
          this.$message.error('发布失败：' + (e?.message || '请检查后端服务'));
        });
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.form-page {
  background-color: var(--td-bg-color-container);
  padding: 0 32px var(--td-comp-size-xxxl);
}

.form-card {
  /deep/ .t-card__body {
    padding-top: 0;
  }
}

.form-basic-container-title {
  font-size: 20px;
  line-height: 24px;
  color: var(--td-text-color-primary);
  margin: var(--td-comp-size-xxxl) 0 24px;
}

.post-form {
  margin-top: 16px;
}

.form-step {
  min-height: 240px;
  padding: 0 0 24px 0;
}

.form-step-content :deep(.t-form__controls) {
  width: 100%;
}

.md-editor {
  width: 100%;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.md-editor :deep(.t-tabs),
.md-editor :deep(.t-tabs__content),
.md-editor :deep(.t-tab-panel) {
  width: 100%;
}

.md-editor :deep(.t-textarea) {
  width: 100% !important;
}

.md-textarea {
  width: 100% !important;
  border: none !important;
  min-height: 320px;
  font-size: 14px;
  font-family: inherit;
}

.md-preview {
  padding: 16px;
  min-height: 320px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--td-text-color-primary);

  &::v-deep img {
    max-width: 100%;
  }
  &::v-deep pre {
    overflow-x: auto;
  }
  &::v-deep p {
    margin: 0 0 12px;
  }
}

.empty-tip {
  color: var(--td-text-color-placeholder);
}

.cover-preview img {
  max-width: 200px;
  max-height: 120px;
  border-radius: var(--td-radius-default);
}

.form-submit-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--td-component-border);

  .t-button + .t-button {
    margin-left: var(--td-comp-margin-s);
  }
}
</style>
