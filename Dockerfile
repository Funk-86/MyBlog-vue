# MyBlog-vue 管理端（Vite 构建 + Nginx 托管静态资源）
# 不要使用：RUN npm update -g npm（易损坏全局 npm，报 promise-retry 等 MODULE_NOT_FOUND）
# 构建：docker build -t myblog-vue .
# 运行：docker run -p 8080:8080 myblog-vue（Nginx 同时监听 80 与 8080，适配 Zeabur 等平台）

FROM node:20-bookworm AS build
WORKDIR /app

# 避免 Docker 内执行 husky install 失败（无 .git）
ENV CI=true HUSKY=0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 8080
CMD ["nginx", "-g", "daemon off;"]
