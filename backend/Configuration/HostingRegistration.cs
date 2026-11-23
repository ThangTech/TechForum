using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Data;

namespace TechForum.Api.Configuration;

// Các cấu hình thay đổi theo nơi chạy API (máy lập trình, Docker, Render), để cùng một bản build chạy được mọi nơi:
// - Database:MigrateOnStartup, Database:SeedDemoData: cập nhật DB và thêm dữ liệu mẫu khi khởi động.
// - DataProtection:KeysPath: thư mục khóa ký link đặt lại mật khẩu; trong container phải là volume,
//   nếu không link hết hiệu lực mỗi lần tạo lại container.
// - ReverseProxy:Enabled: đọc IP thật của người dùng từ X-Forwarded-For, nếu không mọi người dùng chung
//   một giới hạn gửi email khôi phục.
// - ReverseProxy:ForwardLimit: số proxy đứng trước API (Docker: 1 là nginx; Render sau Vercel: 2).
public static class HostingRegistration
{
    public static IServiceCollection AddHostingSettings(this IServiceCollection services, IConfiguration configuration)
    {
        var keysPath = configuration["DataProtection:KeysPath"];
        if (!string.IsNullOrWhiteSpace(keysPath))
        {
            services.AddDataProtection()
                .SetApplicationName("TechForum")
                .PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }

        if (IsBehindProxy(configuration))
        {
            // Đọc ở đây chứ không trong lambda, để giá trị sai làm API dừng ngay khi khởi động.
            var forwardLimit = GetForwardLimit(configuration);
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                options.ForwardLimit = forwardLimit;
                // Không biết trước địa chỉ của proxy nên tin header nó ghi. Trong Docker chỉ nginx gọi được API vì cổng API không mở ra ngoài.
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });
        }

        return services;
    }

    public static bool IsBehindProxy(IConfiguration configuration)
    {
        return configuration.GetValue<bool>("ReverseProxy:Enabled");
    }

    public static int GetForwardLimit(IConfiguration configuration)
    {
        var limit = configuration.GetValue<int?>("ReverseProxy:ForwardLimit") ?? 1;
        if (limit < 1)
        {
            throw new InvalidOperationException("ReverseProxy:ForwardLimit phải từ 1 trở lên.");
        }

        return limit;
    }

    public static async Task PrepareDatabaseAsync(this WebApplication app)
    {
        var isDevelopment = app.Environment.IsDevelopment();
        var migrate = isDevelopment || app.Configuration.GetValue<bool>("Database:MigrateOnStartup");
        var seed = isDevelopment || app.Configuration.GetValue<bool>("Database:SeedDemoData");
        if (!migrate && !seed) return;

        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TechForumDbContext>();
        if (migrate) await dbContext.Database.MigrateAsync();
        if (seed) await DevelopmentDataSeeder.SeedAsync(dbContext);
    }
}
