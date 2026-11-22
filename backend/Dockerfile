# Image của API TechForum (ASP.NET Core 9). Build từ thư mục backend:
#   docker build -t techforum-api ./backend
# Image được dựng qua hai giai đoạn (multi-stage): giai đoạn 1 có đủ công cụ để build, giai đoạn 2 chỉ chép kết quả
# sang một image nhỏ chỉ có runtime, nên image cuối không chứa mã nguồn hay SDK.

# ---------- Giai đoạn 1: build bằng .NET SDK ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Chép riêng file .csproj rồi restore trước: khi chỉ sửa code (không đổi thư viện), Docker dùng lại lớp restore đã có,
# lần build sau nhanh hơn nhiều.
COPY TechForum.Api.csproj ./
RUN dotnet restore TechForum.Api.csproj

COPY . ./
RUN dotnet publish TechForum.Api.csproj --configuration Release --no-restore --output /app/publish /p:UseAppHost=false

# ---------- Giai đoạn 2: chạy bằng ASP.NET runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish ./

# Các thư mục mà API ghi vào. Docker Compose gắn volume vào đây để dữ liệu còn khi container bị tạo lại:
# App_Data/uploads (ảnh, video, avatar, banner lưu tại chỗ) và App_Data/keys (khoá Data Protection).
# Data/Seed là chỗ đặt file từ cấm (gắn từ máy vào, chỉ đọc).
# Image chạy bằng người dùng "app" (không phải root), nên giao các thư mục này cho người dùng đó.
RUN mkdir -p App_Data/uploads App_Data/keys Data/Seed && chown -R app:app App_Data
USER app

# Từ .NET 8, image ASP.NET mặc định nghe cổng 8080.
EXPOSE 8080
ENTRYPOINT ["dotnet", "TechForum.Api.dll"]
