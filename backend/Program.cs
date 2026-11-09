using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using TechForum.Api.Configuration;
using TechForum.Api.Data;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Middleware;
using TechForum.Api.Models;
using TechForum.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured. " +
        "Set ConnectionStrings__DefaultConnection or add it to a local settings file.");
}

builder.Services.AddControllers();
// Unexpected errors answer with problem details JSON and a trace id (see ServerErrorResponse).
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = ServerErrorResponse.Customize);
builder.Services.AddOpenApi();
var mediaOptions = builder.Configuration
    .GetSection(MediaOptions.SectionName)
    .Get<MediaOptions>() ?? new MediaOptions();
builder.Services.Configure<MediaOptions>(
    builder.Configuration.GetSection(MediaOptions.SectionName));
builder.Services.Configure<FormOptions>(options =>
    options.MultipartBodyLengthLimit = Math.Max(
        mediaOptions.MaxImageBytes,
        mediaOptions.MaxVideoBytes) + 1024 * 1024);
builder.Services.AddDbContext<TechForumDbContext>(options =>
    options.UseSqlServer(connectionString));
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
var jwtConfigurationError = jwtOptions.GetConfigurationError();
if (jwtConfigurationError is not null)
{
    throw new InvalidOperationException(jwtConfigurationError);
}

builder.Services.Configure<JwtOptions>(jwtSection);
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<TechForumDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = jwtOptions.CreateValidationParameters();
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Bạn cần đăng nhập"
                });
            },
            OnForbidden = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Bạn không có quyền thực hiện thao tác này"
                });
            }
        };
    });
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddPasswordRecovery(builder.Configuration);
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAvatarService, AvatarService>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IQuestionHighlightRepository, QuestionHighlightRepository>();
builder.Services.AddScoped<IQuestionHighlightService, QuestionHighlightService>();
builder.Services.AddScoped<IPublicStatisticsRepository, PublicStatisticsRepository>();
builder.Services.AddScoped<IPublicStatisticsService, PublicStatisticsService>();
builder.Services.AddScoped<IAdminAccountRepository, AdminAccountRepository>();
builder.Services.AddScoped<IAdminAccountService, AdminAccountService>();
builder.Services.AddScoped<IAdminTopicRepository, AdminTopicRepository>();
builder.Services.AddScoped<IAdminTopicService, AdminTopicService>();
builder.Services.AddScoped<IAdminOverviewRepository, AdminOverviewRepository>();
builder.Services.AddScoped<IAdminOverviewService, AdminOverviewService>();
builder.Services.AddScoped<IAdminAuditRepository, AdminAuditRepository>();
builder.Services.AddScoped<IAdminAuditService, AdminAuditService>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<ISkillCommunityRepository, SkillCommunityRepository>();
builder.Services.AddScoped<ISkillCommunityService, SkillCommunityService>();
builder.Services.AddScoped<ITopicRepository, TopicRepository>();
builder.Services.AddScoped<ITopicService, TopicService>();
builder.Services.AddScoped<IRelatedTopicRepository, RelatedTopicRepository>();
builder.Services.AddScoped<IRelatedTopicService, RelatedTopicService>();
builder.Services.AddScoped<ITopicEngagementRepository, TopicEngagementRepository>();
builder.Services.AddScoped<ITopicEngagementService, TopicEngagementService>();
builder.Services.AddScoped<IAnswerRepository, AnswerRepository>();
builder.Services.AddScoped<IAnswerService, AnswerService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITopicStarRepository, TopicStarRepository>();
builder.Services.AddScoped<ITopicStarService, TopicStarService>();
builder.Services.AddScoped<ITopicBookmarkRepository, TopicBookmarkRepository>();
builder.Services.AddScoped<ITopicBookmarkService, TopicBookmarkService>();
builder.Services.AddScoped<IContentReportRepository, ContentReportRepository>();
builder.Services.AddScoped<IContentReportService, ContentReportService>();
builder.Services.AddScoped<IPublicProfileRepository, PublicProfileRepository>();
builder.Services.AddScoped<IPublicProfileService, PublicProfileService>();
builder.Services.AddScoped<IUserFollowRepository, UserFollowRepository>();
builder.Services.AddScoped<IUserFollowService, UserFollowService>();
builder.Services.AddScoped<IUserSkillRepository, UserSkillRepository>();
builder.Services.AddScoped<IUserSkillService, UserSkillService>();
// Banned words: read from SQL Server into IMemoryCache when the application starts; [ProfanityFilter] uses the cache.
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IBannedWordRepository, BannedWordRepository>();
builder.Services.AddScoped<IBannedWordService, BannedWordService>();
builder.Services.AddScoped<IBannedWordSeeder, BannedWordSeeder>();
builder.Services.AddSingleton<IBannedWordLoader, BannedWordLoader>();
builder.Services.AddSingleton<IProfanityFilter, ProfanityFilter>();
builder.Services.AddHostedService<BannedWordWarmupService>();
builder.Services.AddScoped<IMediaAssetRepository, MediaAssetRepository>();
builder.Services.Configure<CloudinaryOptions>(
    builder.Configuration.GetSection(CloudinaryOptions.SectionName));
builder.Services.AddSingleton<MediaUrlRules>();
builder.Services.AddSingleton<ICloudMediaClient, CloudinaryMediaClient>();
builder.Services.AddSingleton<IContentSanitizer, ContentSanitizer>();
builder.Services.AddScoped<IMediaStorageService, MediaStorageService>();
builder.Services.AddHostedService<MediaCleanupBackgroundService>();
builder.Services.AddScoped<IRefreshTokenCleanupService, RefreshTokenCleanupService>();
builder.Services.AddScoped<IBannerRepository, BannerRepository>();
builder.Services.AddScoped<IDraftRepository, DraftRepository>();
builder.Services.AddScoped<IDraftService, DraftService>();
builder.Services.AddSingleton<IBannerImageStorage, BannerImageStorage>();
builder.Services.AddScoped<IBannerService, BannerService>();
builder.Services.AddHostedService<RefreshTokenCleanupBackgroundService>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

var app = builder.Build();

// First in the pipeline, so it also catches errors thrown by the middleware below.
// The framework writes the exception and its stack trace to the log before this answers.
app.UseExceptionHandler();

app.UseMiddleware<RequestCancellationMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<TechForumDbContext>();
    await dbContext.Database.MigrateAsync();
    await DevelopmentDataSeeder.SeedAsync(dbContext);
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

var contentRoot = Path.GetFullPath(app.Environment.ContentRootPath);
var mediaStorageRoot = Path.GetFullPath(Path.Combine(contentRoot, mediaOptions.StoragePath));
if (Path.IsPathRooted(mediaOptions.StoragePath) ||
    !mediaStorageRoot.StartsWith(contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("Media:StoragePath phải nằm trong thư mục backend.");
}

Directory.CreateDirectory(mediaStorageRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(mediaStorageRoot),
    RequestPath = mediaOptions.RequestPath,
    OnPrepareResponse = context =>
    {
        context.Context.Response.Headers.XContentTypeOptions = "nosniff";
        context.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
    }
});

app.UseCors("Frontend");

app.UseAuthentication();

app.UseRateLimiter();

app.UseMiddleware<ActiveAccountMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
