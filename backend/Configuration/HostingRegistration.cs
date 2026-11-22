using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Data;

namespace TechForum.Api.Configuration;

// The settings that change with the place where the API runs (the machine of a developer, or the Docker containers).
// They come from configuration, so the same build runs everywhere:
// - Database:MigrateOnStartup and Database:SeedDemoData: bring the database up to date and add the demo data when the
//   API starts. Development always does both.
// - DataProtection:KeysPath: the folder of the keys of ASP.NET Core Data Protection (they sign the links of the password
//   reset emails). In a container it must be a volume, or the links stop working each time the container is made again.
// - ReverseProxy:Enabled: the API sits behind a proxy (nginx) that writes the address of the visitor in the header
//   X-Forwarded-For. Without it every visitor would have the address of the proxy, and they would all share one limit
//   of password reset emails.
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
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                // The proxy is another container and its address is not known in advance. Only the proxy can reach the
                // API (the port of the API is not opened to the outside), so the headers it writes are trusted.
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });
        }

        return services;
    }

    public static bool IsBehindProxy(IConfiguration configuration) =>
        configuration.GetValue<bool>("ReverseProxy:Enabled");

    // Brings the database up to date and adds the demo data (categories, tags and a few posts) when it is asked for.
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
