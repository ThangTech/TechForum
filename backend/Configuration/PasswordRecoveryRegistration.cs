using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Services;

namespace TechForum.Api.Configuration;

public static class PasswordRecoveryRegistration
{
    public static IServiceCollection AddPasswordRecovery(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RecoveryEmailOptions>(configuration.GetSection(RecoveryEmailOptions.SectionName));
        services.Configure<DataProtectionTokenProviderOptions>(options => options.TokenLifespan = TimeSpan.FromMinutes(30));
        services.AddScoped<IPasswordRecoveryRepository, PasswordRecoveryRepository>();
        services.AddScoped<IRecoveryEmailSender, RecoveryEmailSender>();
        services.AddScoped<IPasswordRecoveryService, PasswordRecoveryService>();
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            foreach (var (policyName, limit) in new[] { ("forgot-password", 5), ("reset-password", 20) })
            {
                options.AddPolicy(policyName, context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = limit,
                        Window = TimeSpan.FromMinutes(15),
                        QueueLimit = 0
                    }));
            }
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = 429,
                    Title = "Bạn đã gửi quá nhiều yêu cầu",
                    Detail = "Vui lòng chờ 15 phút trước khi thử lại."
                }, cancellationToken);
            };
        });
        return services;
    }
}
