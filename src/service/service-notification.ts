import request from '@/utils/request';

// 管理端：获取顶部通知列表（未读）
export function getAdminNotifications() {
  return request.get('/dashboard/notifications');
}

