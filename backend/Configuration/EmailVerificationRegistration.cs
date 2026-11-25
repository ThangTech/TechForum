using TechForum.Api.Data.Repositories;
using TechForum.Api.Services;

namespace TechForum.Api.Configuration;

public static class EmailVerificationRegistration
{
    public static IServiceCollection AddEmailVerification(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EmailVerificationOptions>(configuration.GetSection(EmailVerificationOptions.SectionName));
        services.AddScoped<IEmailVerificationService, EmailVerificationService>();
        services.AddScoped<IUnverifiedAccountRepository, UnverifiedAccountRepository>();
        services.AddHostedService<UnverifiedAccountCleanupBackgroundService>();
        return services;
    }
}
