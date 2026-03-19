/**
 * 博客管理员系统 - 路由配置
 */
import {
  DashboardIcon,
  FileIcon,
  FolderIcon,
  ChatIcon,
  UserCircleIcon,
} from 'tdesign-icons-vue';
import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/base',
    name: 'dashboard',
    meta: {
      title: '仪表盘',
      icon: DashboardIcon,
    },
    children: [
      {
        path: 'base',
        name: 'DashboardBase',
        component: () => import('@/pages/dashboard/base/index.vue'),
        meta: { title: '博客概览' },
      },
      {
        path: 'detail',
        name: 'DashboardDetail',
        component: () => import('@/pages/dashboard/detail/index.vue'),
        meta: { title: '数据统计' },
      },
    ],
  },
  {
    path: '/post',
    name: 'post',
    component: Layout,
    redirect: '/post/list',
    meta: { title: '帖子管理', icon: FileIcon },
    children: [
      {
        path: 'list',
        name: 'PostList',
        component: () => import('@/pages/post/list/index.vue'),
        meta: { title: '帖子列表' },
      },
      {
        path: 'pending',
        name: 'PostPending',
        component: () => import('@/pages/post/pending/index.vue'),
        meta: { title: '审核列表' },
      },
      {
        path: 'create',
        name: 'PostCreate',
        component: () => import('@/pages/post/edit/index.vue'),
        meta: { title: '发布文章' },
      },
      {
        path: 'detail/:id',
        name: 'PostDetail',
        component: () => import('@/pages/post/detail/index.vue'),
        meta: { title: '文章详情', hidden: true },
      },
    ],
  },
  {
    path: '/category',
    name: 'category',
    component: Layout,
    redirect: '/category/list',
    meta: { title: '分类管理', icon: FolderIcon },
    children: [
      {
        path: 'list',
        name: 'CategoryList',
        component: () => import('@/pages/category/list/index.vue'),
        meta: { title: '分区列表' },
      },
      {
        path: 'topic',
        name: 'TopicList',
        component: () => import('@/pages/topic/list/index.vue'),
        meta: { title: '话题列表' },
      },
    ],
  },
  {
    path: '/report',
    name: 'report',
    component: Layout,
    redirect: '/report/list',
    meta: { title: '举报管理', icon: ChatIcon },
    children: [
      {
        path: 'list',
        name: 'ReportList',
        component: () => import('@/pages/report/list/index.vue'),
        meta: { title: '举报列表' },
      },
      {
        path: 'sensitive-word',
        name: 'SensitiveWordList',
        component: () => import('@/pages/sensitive-word/list/index.vue'),
        meta: { title: '违禁词管理' },
      },
    ],
  },
  {
    path: '/admin-user',
    name: 'adminUser',
    component: Layout,
    redirect: '/admin-user/list',
    meta: { title: '用户管理', icon: UserCircleIcon },
    children: [
      {
        path: 'list',
        name: 'AdminUserList',
        component: () => import('@/pages/admin-user/list/index.vue'),
        meta: { title: '用户列表' },
      },
    ],
  },
  {
    path: '/user',
    name: 'user',
    component: Layout,
    redirect: '/user/index',
    // 管理后台左侧菜单不再显示个人中心
    meta: { title: '个人中心', icon: UserCircleIcon, hidden: true },
    children: [
      {
        path: 'index',
        name: 'UserIndex',
        component: () => import('@/pages/user/index.vue'),
        meta: { title: '个人设置' },
      },
    ],
  },
  {
    path: '/result',
    name: 'result',
    component: Layout,
    redirect: '/result/success',
    meta: { title: '结果页', icon: 'check-circle', hidden: true },
    children: [
      { path: 'success', name: 'ResultSuccess', component: () => import('@/pages/result/success/index.vue'), meta: { title: '成功页' } },
      { path: 'fail', name: 'ResultFail', component: () => import('@/pages/result/fail/index.vue'), meta: { title: '失败页' } },
      { path: '403', name: 'Result403', component: () => import('@/pages/result/403/index.vue'), meta: { title: '无权限' } },
      { path: '404', name: 'Result404', component: () => import('@/pages/result/404/index.vue'), meta: { title: '404' } },
    ],
  },
];
