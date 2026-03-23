<template>
  <div class="detail-base post-detail">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <template v-else>
      <template v-if="post">
        <t-card title="文章信息" :bordered="false" class="detail-card">
          <div class="info-row">
            <span class="label">标题：</span>
            <span class="value">{{ post.title }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态：</span>
            <t-tag v-if="post.status === 0" theme="success" variant="light">正常</t-tag>
            <t-tag v-else-if="post.status === 1" theme="warning" variant="light">审核中</t-tag>
            <t-tag v-else-if="post.status === 2" theme="danger" variant="light">已删除</t-tag>
            <t-tag v-else theme="default" variant="light">已屏蔽</t-tag>
          </div>
          <div class="info-row">
            <span class="label">分类：</span>
            <span class="value">{{ post.categoryName1 || '-' }} / {{ post.categoryName2 || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">作者：</span>
            <span class="value">{{ post.nickname || post.username || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">发布时间：</span>
            <span class="value">{{ publishTimeDisplay }}</span>
          </div>
          <div v-if="post && post.topicNames" class="info-row">
            <span class="label">话题：</span>
            <span class="value">
              <t-tag
                v-for="t in postTopics"
                :key="t"
                theme="default"
                variant="light"
                size="small"
                class="topic-tag"
              >
                {{ t }}
              </t-tag>
            </span>
          </div>
          <div class="info-row">
            <span class="label">可见范围：</span>
            <span class="value">{{ post.visibility === 1 ? '仅自己' : '所有人' }}</span>
          </div>
          <div class="info-actions">
            <t-button
              v-if="post.status === 1"
              theme="success"
              variant="outline"
              size="small"
              @click="handleApprove"
            >
              通过
            </t-button>
            <t-button
              v-if="post.status === 1"
              theme="danger"
              variant="outline"
              size="small"
              @click="handleReject"
            >
              拒绝
            </t-button>
            <t-button theme="danger" variant="outline" size="small" @click="handleDelete">删除</t-button>
          </div>
        </t-card>

        <t-card title="内容预览" :bordered="false" class="detail-card">
          <div class="content-preview" v-html="contentHtml"></div>
        </t-card>

        <t-card title="媒体内容" :bordered="false" class="detail-card">
          <div v-if="post.type === 1" class="media-block">
            <div v-if="postImages.length" class="media-grid">
              <div
                v-for="(img, idx) in postImages.slice(0, 9)"
                :key="idx"
                class="media-item"
              >
                <img class="media-img" :src="resolveMediaUrl(img)" />
              </div>
            </div>
            <div v-else class="empty-tip">暂无图片</div>
          </div>
          <div v-else-if="post.type === 2" class="media-block">
            <div v-if="post.firstVideoCoverUrl" class="video-cover">
              <img class="video-cover-img" :src="resolveMediaUrl(post.firstVideoCoverUrl)" />
              <div class="video-mask">▶</div>
              <div class="video-duration">时长：{{ post.firstVideoDuration || 0 }}s</div>
            </div>
            <div v-else class="empty-tip">暂无视频封面</div>
          </div>
          <div v-else class="empty-tip">无媒体</div>
        </t-card>

        <t-card title="数据统计" :bordered="false" class="detail-card">
          <t-row :gutter="24">
            <t-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ post.viewCount ?? 0 }}</div>
                <div class="stat-label">阅读量</div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ post.likeCount ?? 0 }}</div>
                <div class="stat-label">点赞数</div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ post.commentCount ?? 0 }}</div>
                <div class="stat-label">评论数</div>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ post.favoriteCount ?? 0 }}</div>
                <div class="stat-label">收藏数</div>
              </div>
            </t-col>
          </t-row>
          <p class="stat-tip">数据趋势图需后端提供按天统计接口</p>
        </t-card>

        <t-card title="评论管理" :bordered="false" class="detail-card">
          <t-table
            :columns="commentColumns"
            :data="comments"
            row-key="id"
            :loading="commentLoading"
            :max-height="320"
          >
            <template #createdAt="{ row }">
              {{ formatPublishTimeBeijing(row.createdAt) }}
            </template>
            <template #content="{ row }">
              <span class="comment-content">{{ row.content }}</span>
            </template>
            <template #status="{ row }">
              <t-tag v-if="row.status === 0" theme="success" variant="light" size="small">正常</t-tag>
              <t-tag v-else-if="row.status === 1" theme="danger" variant="light" size="small">已删除</t-tag>
              <t-tag v-else theme="default" variant="light" size="small">已屏蔽</t-tag>
            </template>
            <template #op="{ row }">
              <a class="t-button-link" @click="handleReply(row)">回复</a>
              <a class="t-button-link" @click="handleAudit(row)">审核</a>
              <a class="t-button-link t-link-danger" @click="handleCommentDelete(row)">删除</a>
            </template>
          </t-table>
          <p v-if="comments.length === 0 && !commentLoading" class="empty-tip">暂无评论</p>
        </t-card>
      </template>
      <template v-else-if="!loading && !error">
        <t-alert theme="warning" message="未找到该帖子或接口返回为空" />
      </template>
      <template v-else-if="!loading && error">
        <t-alert theme="error" :message="error" />
      </template>
    </template>
    <!-- 调试信息已移除（保持页面纯展示） -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { DialogPlugin } from 'tdesign-vue';
import { marked } from 'marked';
import request from '@/utils/request';
import { getPostDetailAdmin, getCommentList, deletePostAdmin, approvePost, rejectPost } from '@/service/service-blog';
import { formatPublishTimeBeijing } from '@/utils/date';

export default Vue.extend({
  name: 'PostDetail',
  data() {
    return {
      loading: true,
      error: '',
      post: null as any,
      comments: [] as any[],
      commentLoading: false,
      commentColumns: [
        { title: 'ID', colKey: 'id', width: 70 },
        { title: '内容', colKey: 'content', ellipsis: true, minWidth: 180, cell: { col: 'content' } },
        { title: '评论者', colKey: 'nickname', width: 100 },
        { title: '点赞', colKey: 'likeCount', width: 70 },
        { title: '状态', colKey: 'status', width: 80, cell: { col: 'status' } },
        { title: '时间', colKey: 'createdAt', width: 160 },
        { title: '操作', colKey: 'op', width: 150, cell: { col: 'op' } },
      ],
    };
  },
  // 捕获渲染/计算阶段的运行时错误，避免“白屏但没有任何提示”
  errorCaptured(err: any) {
    this.loading = false;
    this.error = '渲染失败：' + (err?.message || err);
    return false;
  },
  computed: {
    publishTimeDisplay(): string {
      return formatPublishTimeBeijing(this.post?.createdAt);
    },
    postImages(): string[] {
      const s = this.post?.imageUrls;
      if (!s) return [];
      if (Array.isArray(s)) return s.filter(Boolean);
      return String(s)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    },
    postTopics(): string[] {
      const s = this.post?.topicNames;
      if (!s) return [];
      if (Array.isArray(s)) return s.filter(Boolean);
      return String(s)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 10);
    },
    contentHtml(): string {
      const c = this.post?.content || '';
      if (!c.trim()) return '<p class="empty-tip">暂无内容</p>';
      try {
        return marked.parse(c, { gfm: true }) as string;
      } catch {
        return c.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    },
  },
  watch: {
    '$route.params.id'() {
      this.loadPost();
    },
  },
  mounted() {
    this.loadPost();
  },
  methods: {
    formatPublishTimeBeijing,
    resolveMediaUrl(raw: string) {
      if (!raw) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
      const base = (request.defaults as any)?.baseURL || '';
      if (!base) return raw;
      if (raw.startsWith('/')) return `${base}${raw}`;
      return `${base}/${raw}`;
    },
    loadPost() {
      const id = Number(this.$route.params.id);
      if (!id) {
        this.loading = false;
        this.error = '缺少文章ID';
        return;
      }
      this.loading = true;
      this.error = '';
      getPostDetailAdmin(id)
        .then((res: any) => {
          if (!res || (!res.id && res.id !== 0)) {
            this.post = null;
            this.error = '未找到该帖子';
            return;
          }
          this.post = res;
          this.loadComments();
        })
        .catch(() => {
          this.error = '加载文章失败';
          this.post = null;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadComments() {
      const id = this.post?.id;
      if (!id) return;
      this.commentLoading = true;
      getCommentList(id)
        .then((res: any) => {
          this.comments = Array.isArray(res) ? res : (res?.list || []);
        })
        .catch(() => {
          this.comments = [];
        })
        .finally(() => {
          this.commentLoading = false;
        });
    },
    handleDelete() {
      const id = this.post?.id;
      if (!id) return;
      DialogPlugin.confirm({
        header: '删除文章',
        body: '确定删除该文章？删除后前台将不再展示（软删除）。',
        onConfirm: () =>
          new Promise<void>((resolve, reject) => {
            deletePostAdmin(id)
              .then(() => {
                this.$message.success('已删除');
                this.$router.replace('/post/list');
                resolve();
              })
              .catch((e: any) => {
                this.$message.error('删除失败：' + (e?.message || e?.msg || ''));
                reject(e);
              });
          }),
      });
    },
    handleApprove() {
      const id = this.post?.id;
      if (!id) return;
      if (this.post?.status !== 1) {
        this.$message.warning('只有审核中（status=1）的帖子可以通过');
        return;
      }
      DialogPlugin.confirm({
        header: '通过审核',
        body: '确认将该帖子通过审核并发布？',
        onConfirm: () =>
          new Promise<void>((resolve, reject) => {
            approvePost(id)
              .then(() => {
                this.$message.success('已通过审核');
                this.$router.replace('/post/pending');
                resolve();
              })
              .catch((e: any) => {
                this.$message.error('操作失败：' + (e?.message || '请检查后端服务'));
                reject(e);
              });
          }),
      });
    },
    handleReject() {
      const id = this.post?.id;
      if (!id) return;
      if (this.post?.status !== 1) {
        this.$message.warning('只有审核中（status=1）的帖子可以拒绝');
        return;
      }
      DialogPlugin.confirm({
        header: '拒绝审核',
        body: '确认拒绝该帖子？',
        onConfirm: () =>
          new Promise<void>((resolve, reject) => {
            rejectPost(id)
              .then(() => {
                this.$message.success('已拒绝该帖子');
                this.$router.replace('/post/pending');
                resolve();
              })
              .catch((e: any) => {
                this.$message.error('操作失败：' + (e?.message || '请检查后端服务'));
                reject(e);
              });
          }),
      });
    },
    handleReply(row: any) {
      this.$message.info('回复功能可在此处接入评论创建接口');
    },
    handleAudit(row: any) {
      this.$message.info('审核功能需后端提供 /comment/audit 接口');
    },
    handleCommentDelete(row: any) {
      DialogPlugin.confirm({
        header: '删除评论',
        body: '确定删除该条评论？',
        onConfirm: () => {
          this.$message.info('删除功能需后端提供 /comment/delete 接口');
        },
      });
    },
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';

.detail-base {
  /deep/ .t-card {
    padding: 8px;
    background: var(--td-bg-color-container, #fff) !important;
    border: 1px solid var(--td-component-border, rgba(0, 0, 0, 0.06)) !important;
    box-sizing: border-box;
  }
  /deep/ .t-card__title {
    font-size: 20px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }
}

.post-detail {
  padding: 0;
}

.detail-card {
  margin-bottom: 16px;
}

.info-row {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 22px;

  .label {
    color: var(--td-text-color-secondary);
    margin-right: 8px;
  }
  .value {
    color: var(--td-text-color-primary);
  }
}

.info-actions {
  margin-top: 20px;
  .t-button + .t-button {
    margin-left: var(--td-comp-margin-s);
  }
}
.topic-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.content-preview {
  font-size: 14px;
  line-height: 1.6;
  color: var(--td-text-color-primary);

  &::v-deep img {
    max-width: 100%;
  }
  &::v-deep pre {
    overflow-x: auto;
  }
}

.stat-item {
  text-align: center;
  padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m);
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-default);

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--td-brand-color);
    font-family: inherit;
  }
  .stat-label {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    margin-top: 4px;
  }
}

.stat-tip,
.empty-tip {
  margin-top: 12px;
  font-size: 14px;
  color: var(--td-text-color-placeholder);
}

.media-block {
  min-height: 120px;
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.media-item {
  width: 160px;
  height: 100px;
  border-radius: var(--td-radius-default);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-cover {
  position: relative;
  width: 320px;
  max-width: 100%;
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.video-cover-img {
  width: 100%;
  height: auto;
  display: block;
}

.video-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  backdrop-filter: blur(3px);
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border-radius: 999px;
  font-size: 12px;
}

.comment-content {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.t-button-link {
  margin-right: var(--td-comp-margin-s);
}

.debug-state {
  padding: 8px 12px;
  font-size: 12px;
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.05);
  border: 1px dashed rgba(255, 77, 79, 0.4);
  border-radius: 6px;
  margin: 12px 0;
}

.plain-fallback {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f6ffed;
  border: 1px solid rgba(82, 196, 26, 0.35);
  border-radius: 6px;
  color: #000;
  font-size: 14px;
  word-break: break-all;
  white-space: pre-wrap;
}

.loading-placeholder {
  padding: 20px 12px;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.card-test {
  margin: 12px 0;
  padding: 8px 12px;
  background: #fff7e6;
  border: 1px solid rgba(250, 173, 20, 0.35);
  border-radius: 6px;
  font-size: 14px;
}
</style>
