# Image của trang web TechForum: bản build React được nginx phục vụ, và nginx chuyển /api, /media sang API.
# Build từ thư mục frontend:
#   docker build -t techforum-web ./frontend

# ---------- Giai đoạn 1: build bằng Node ----------
FROM node:22-alpine AS build
WORKDIR /app

# Chép riêng package.json và package-lock.json rồi cài trước, để Docker dùng lại lớp này khi chỉ sửa code.
COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Biến VITE_* được ghi thẳng vào JavaScript lúc build, nên phải truyền lúc build (không phải lúc chạy).
# "/" nghĩa là gọi API cùng địa chỉ với trang (nginx bên dưới chuyển /api sang API).
ARG VITE_API_BASE_URL=/
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ---------- Giai đoạn 2: phục vụ bằng nginx ----------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
