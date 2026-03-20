/**
 * 博客管理员系统 - API 服务
 */
import request from '@/utils/request';
import proxy from '@/config/host';

const API_PREFIX = '';
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || 'development';
const API_BASE = (proxy as any)[env]?.API || 'https://myblog-tree.zeabur.app';

/** 文章封面/图片上传接口 URL */
export const UPLOAD_IMAGE_URL = `${API_BASE}/post/uploadImage`;

// 文章
export function getPostList(params?: { page?: number; size?: number; categoryId?: number }) {
  const p: Record<string, unknown> = { ...params };
  if (p.categoryId == null || p.categoryId === '') delete p.categoryId;
  // 管理端列表使用专门的接口，返回 { list, total }
  return request.get(`${API_PREFIX}/post/admin/list`, { params: p });
}

export function getPostDetail(id: number) {
  return request.get(`${API_PREFIX}/post/detail`, { params: { id } });
}

// 管理端：待审核帖子列表
export function getPostPendingList(params?: { page?: number; size?: number }) {
  return request.get(`${API_PREFIX}/post/admin/pending`, { params: params || {} });
}

// 管理端：审核通过帖子
export function approvePost(postId: number) {
  return request.post(`${API_PREFIX}/post/admin/approve`, null, {
    params: { postId },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// 管理端：审核拒绝帖子
export function rejectPost(postId: number) {
  return request.post(`${API_PREFIX}/post/admin/reject`, null, {
    params: { postId },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export function createPost(data: Record<string, unknown>) {
  return request.post(`${API_PREFIX}/post/create`, data);
}

export function getRandomPosts(size = 10) {
  return request.get(`${API_PREFIX}/post/random`, { params: { size } });
}

export function getUserPosts(userId: number, page = 1, size = 20) {
  return request.get(`${API_PREFIX}/post/user`, { params: { userId, page, size } });
}

// 分类（仅启用，发帖用）
export function getCategoryList() {
  return request.get(`${API_PREFIX}/category/list`);
}

// 管理端：全部分区列表（含禁用）
export function getCategoryListForAdmin() {
  return request.get(`${API_PREFIX}/category/admin/list`);
}

// 管理端：新增分区
export function createCategory(data: { name: string; code?: string; sortOrder?: number; status?: number }) {
  return request.post(`${API_PREFIX}/category/add`, data);
}

// 管理端：更新分区
export function updateCategory(data: { id: number; name: string; code?: string; sortOrder?: number; status?: number }) {
  return request.put(`${API_PREFIX}/category/update`, data);
}

// 管理端：删除分区
export function deleteCategory(id: number) {
  return request.delete(`${API_PREFIX}/category/delete`, { params: { id } });
}

// 管理端：话题列表
export function getTopicListForAdmin() {
  return request.get(`${API_PREFIX}/topic/admin/list`);
}

// 管理端：新增话题
export function createTopic(data: { name: string; slug?: string }) {
  return request.post(`${API_PREFIX}/topic/add`, data);
}

// 管理端：更新话题
export function updateTopic(data: { id: number; name: string; slug?: string }) {
  return request.put(`${API_PREFIX}/topic/update`, data);
}

// 管理端：删除话题
export function deleteTopic(id: number) {
  return request.delete(`${API_PREFIX}/topic/delete`, { params: { id } });
}

// 管理端：违禁词列表（分页）
export function getSensitiveWordList(params?: { page?: number; size?: number }) {
  return request.get(`${API_PREFIX}/sensitive-word/admin/list`, { params: params || {} });
}

// 管理端：新增违禁词
export function createSensitiveWord(data: { word: string; level?: number; status?: number }) {
  return request.post(`${API_PREFIX}/sensitive-word/add`, data);
}

// 管理端：删除违禁词
export function deleteSensitiveWord(id: number) {
  return request.delete(`${API_PREFIX}/sensitive-word/delete`, { params: { id } });
}

// 管理端：举报列表
export function getReportList(params?: { page?: number; size?: number }) {
  return request.get(`${API_PREFIX}/report/admin/list`, { params: params || {} });
}

// 管理端：下架（删除帖子 + 通知举报人 + 通知被举报人）
export function takeDownReport(id: number, handlerId?: number) {
  const params: Record<string, number> = { id };
  if (handlerId != null) params.handlerId = handlerId;
  return request.post(`${API_PREFIX}/report/admin/takeDown`, null, {
    params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// 管理端：驳回（不下架帖子，仅通知举报人举报未成立）
export function rejectReport(id: number, handlerId?: number) {
  const params: Record<string, number> = { id };
  if (handlerId != null) params.handlerId = handlerId;
  return request.post(`${API_PREFIX}/report/admin/reject`, null, {
    params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// 评论
export function getCommentList(postId: number) {
  return request.get(`${API_PREFIX}/comment/list`, { params: { postId } });
}

// 仪表盘统计
export function getDashboardStats() {
  return request.get(`${API_PREFIX}/dashboard/stats`);
}

// 近 N 天文章发布趋势
export function getPostTrend(days = 7) {
  return request.get(`${API_PREFIX}/dashboard/postTrend`, { params: { days } });
}

// 文章分类占比
export function getCategoryStats() {
  return request.get(`${API_PREFIX}/dashboard/categoryStats`);
}

// 热门文章 Top N
export function getTopPosts(limit = 5) {
  return request.get(`${API_PREFIX}/dashboard/topPosts`, { params: { limit } });
}

// 近 N 天评论趋势
export function getCommentTrend(days = 7) {
  return request.get(`${API_PREFIX}/dashboard/commentTrend`, { params: { days } });
}

// 管理端：用户列表
export interface GetUserListParams {
  page?: number;
  size?: number;
  keyword?: string;
}
export function getUserList(params?: GetUserListParams) {
  return request.get(`${API_PREFIX}/user/admin/list`, { params: params || {} });
}

/** 封禁时长：value + unit（day|month|year|permanent） */
export interface BanDuration {
  value: number;
  unit: 'day' | 'month' | 'year' | 'permanent';
}

/** 管理端：更新用户状态 0=正常 1=封禁 2=注销（软删除）；封禁时可传 duration */
export function updateUserStatus(ids: number[], status: number, duration?: BanDuration | null) {
  const body: { ids: number[]; status: number; duration?: BanDuration } = { ids, status };
  if (status === 1 && duration) body.duration = duration;
  return request.put(`${API_PREFIX}/user/admin/status`, body);
}

/** 管理端：添加用户；role: 0=普通用户 1=管理员 */
export function createUser(params: {
  username: string;
  email: string;
  password: string;
  role?: number;
}) {
  return request.post(`${API_PREFIX}/user/admin/add`, params);
}

// 用户：登录（账号=username 或 邮箱=email）
export function login(account: string, password: string) {
  return request.post(`${API_PREFIX}/user/login`, null, {
    params: { account, password },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// 用户：发送注册验证码
export function sendRegisterCode(email: string) {
  return request.post(`${API_PREFIX}/user/sendRegisterCode`, null, {
    params: { email },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// 用户：邮箱注册
export function register(email: string, password: string, code: string) {
  return request.post(`${API_PREFIX}/user/register`, null, {
    params: { email, password, code },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}
