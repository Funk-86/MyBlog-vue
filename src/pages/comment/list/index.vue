<template>
  <t-card class="list-card-container" :bordered="false">
    <t-alert theme="info" message="评论管理：请传入文章ID查看该文章下的评论。如需后台统一管理评论，需后端提供 /comment/admin 等接口。" />
    <t-form layout="inline" style="margin: 16px 0">
      <t-form-item label="文章ID">
        <t-input v-model="postId" placeholder="请输入文章ID" type="number" style="width: 120px" />
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" @click="loadComments">查询评论</t-button>
      </t-form-item>
    </t-form>
    <t-table
      :columns="columns"
      :data="data"
      row-key="id"
      :loading="dataLoading"
    />
  </t-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { getCommentList } from '@/service/service-blog';

export default Vue.extend({
  name: 'CommentList',
  data() {
    return {
      postId: '',
      dataLoading: false,
      data: [],
      columns: [
        { title: 'ID', colKey: 'id', width: 80 },
        { title: '内容', colKey: 'content', ellipsis: true, minWidth: 200 },
        { title: '评论者', colKey: 'nickname', width: 120 },
        { title: '点赞数', colKey: 'likeCount', width: 90 },
        { title: '评论时间', colKey: 'createdAt', width: 180 },
      ],
    };
  },
  methods: {
    loadComments() {
      const id = Number(this.postId);
      if (!id) {
        this.$message.warning('请输入文章ID');
        return;
      }
      this.dataLoading = true;
      getCommentList(id)
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
  },
});
</script>

<style lang="less" scoped>
@import '@/style/variables.less';
</style>
