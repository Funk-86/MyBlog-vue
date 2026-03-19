/**
 * 博客管理员系统 - 常量定义
 */

// 文章类型：0文字 1图文 2视频
export const POST_TYPE = {
  TEXT: 0,
  IMAGE: 1,
  VIDEO: 2,
};

export const POST_TYPE_OPTIONS = [
  { label: '纯文字', value: POST_TYPE.TEXT },
  { label: '图文', value: POST_TYPE.IMAGE },
  { label: '视频', value: POST_TYPE.VIDEO },
];

// 文章状态：0正常 1审核中 2删除 3屏蔽
export const POST_STATUS = {
  NORMAL: 0,
  PENDING: 1,
  DELETED: 2,
  BANNED: 3,
};

export const POST_STATUS_OPTIONS = [
  { label: '正常', value: POST_STATUS.NORMAL },
  { label: '审核中', value: POST_STATUS.PENDING },
  { label: '已删除', value: POST_STATUS.DELETED },
  { label: '已屏蔽', value: POST_STATUS.BANNED },
];

// 可见性：0所有人看 1仅个人
export const POST_VISIBILITY = {
  PUBLIC: 0,
  PRIVATE: 1,
};

export const POST_VISIBILITY_OPTIONS = [
  { label: '公开', value: POST_VISIBILITY.PUBLIC },
  { label: '仅自己', value: POST_VISIBILITY.PRIVATE },
];
