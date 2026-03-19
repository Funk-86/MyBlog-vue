# 博客管理员系统 (MyBlog Admin)

基于 TDesign Vue Starter 改造的博客后台管理界面，对接 MyBlog-Java 后端。

## 功能模块

- **仪表盘**：博客概览、数据统计
- **文章管理**：文章列表、发布文章、查看/编辑文章
- **分类管理**：分区列表
- **评论管理**：按文章ID查询评论
- **个人中心**：个人设置

## 开发说明

### 启动

```bash
cd MyBlog-vue
npm install
npm run dev
```

### 接口配置

开发环境 API 已配置为 `http://localhost:8080`（`src/config/host.ts`），请确保 MyBlog-Java 后端已启动。

若前后端跨域，需在 MyBlog-Java 中配置 CORS 或使用代理。

### 后端接口说明

当前已对接接口：

- `GET /post/hot` - 热门文章列表（文章管理列表使用）
- `GET /post/detail?id=` - 文章详情
- `POST /post/create` - 发布文章
- `GET /category/list` - 分类列表
- `GET /comment/list?postId=` - 评论列表

如需完整管理能力，建议后端扩展：

- `GET /post/admin/list` - 管理员文章列表（支持分页、筛选、搜索）
- `PUT /post/update` - 更新文章
- `DELETE /post/delete` - 删除/屏蔽文章
- `GET /dashboard/stats` - 仪表盘统计数据
