using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Data;

namespace TechForum.Api.Configuration;

// Các cấu hình thay đổi theo nơi chạy API (máy lập trình, Docker, Render), để cùng một bản build chạy được mọi nơi:
// - Database:MigrateOnStartup, Database:SeedDemoData: cập nhật DB và thêm dữ liệu mẫu khi khởi động.
// - ReverseProxy:Enabled: đọc IP thật của người dùng từ X-Forwarded-For, nếu không mọi người dùng chung
//   một giới hạn gửi email khôi phục.
// - ReverseProxy:ForwardLimit: số proxy đứng trước API (Docker: 1 là nginx; Render sau Vercel: 2).
public static class HostingRegistration
{
    public static IServiceCollection AddHostingSettings(this IServiceCollection services, IConfiguration configuration)
    {
        // Khóa ký link trong email (xác minh 24 giờ, đặt lại mật khẩu 30 phút) lưu trong DB, không lưu trên ổ đĩa:
        // Render miễn phí xóa ổ đĩa mỗi lần dịch vụ ngủ dậy, khi đó mọi link đã gửi sẽ không mở được nữa.
        services.AddDataProtection()
            .SetApplicationName("TechForum")
            .PersistKeysToDbContext<TechForumDbContext>();

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
        if (migrate)
        {
            await MigrateWhenDatabaseIsReadyAsync(dbContext, app.Logger);
        }
        if (seed)
        {
            await DevelopmentDataSeeder.SeedAsync(dbContext);
        }
    }

    // Database chưa nhận kết nối ngay khi API khởi động, nên chờ rồi thử lại thay vì dừng API:
    // - 1801: SQL Server trong Docker vừa bật, database còn đang phục hồi; EF Core tưởng nó chưa có, thử CREATE DATABASE
    //   và gặp lỗi "đã tồn tại".
    // - 40613: Azure SQL bản miễn phí tự ngủ khi không ai dùng và cần khoảng một phút để thức dậy.
    // - 40197, 40501: Azure SQL đang bận hoặc đang chuyển máy chủ, Microsoft khuyên thử lại sau vài giây.
    private static readonly int[] DatabaseStartingErrors = [1801, 40613, 40197, 40501];

    public static bool IsDatabaseStartingError(int errorNumber)
    {
        return DatabaseStartingErrors.Contains(errorNumber);
    }

    private static async Task MigrateWhenDatabaseIsReadyAsync(TechForumDbContext dbContext, ILogger logger)
    {
        // Tối đa khoảng 3 phút, đủ cho Azure SQL thức dậy.
        const int maxAttempts = 36;
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await dbContext.Database.MigrateAsync();
                return;
            }
            catch (Exception exception) when (attempt < maxAttempts && IsDatabaseStarting(exception))
            {
                logger.LogInformation("Database chưa sẵn sàng (lần {Attempt}), thử lại sau 5 giây.", attempt);
                await Task.Delay(TimeSpan.FromSeconds(5));
            }
        }
    }

    // EF Core có thể bọc lỗi SQL trong InvalidOperationException ("transient failure"), nên tìm cả ở lỗi bên trong.
    private static bool IsDatabaseStarting(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException && IsDatabaseStartingError(sqlException.Number))
            {
                return true;
            }
        }

        return false;
    }
}
