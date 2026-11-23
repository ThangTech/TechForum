using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using TechForum.Api.Configuration;
using TechForum.Api.Data;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Filters;
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

builder.Services.AddControllers(options => options.Filters.Add<ValidationProblemMessageFilter>())
    .ConfigureApiBehaviorOptions(options =>
    {
        // Yêu cầu có body không hợp lệ (trước khi vào action) cũng trả lời bằng tiếng Việt.
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value != null && entry.Value.Errors.Count > 0)
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());
            var problem = new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Instance = context.HttpContext.Request.Path
            };
            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            ApiErrorMessages.Apply(problem);
            return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
        };

        foreach (var (status, title) in ApiErrorMessages.ClientErrorTitles)
        {
            if (options.ClientErrorMapping.TryGetValue(status, out var mapping)) mapping.Title = title;
        }
    });
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
builder.Services.AddHostingSettings(builder.Configuration);
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection(GoogleAuthOptions.SectionName));
builder.Services.AddSingleton<IGoogleTokenValidator, GoogleTokenValidator>();
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
// Từ cấm được nạp từ SQL Server vào IMemoryCache khi khởi động; [ProfanityFilter] đọc từ cache.
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IBannedWordRepository, BannedWordRepository>();
builder.Services.AddScoped<IBannedWordService, BannedWordService>();
builder.Services.AddScoped<IBannedWordSeeder, BannedWordSeeder>();
builder.Services.AddScoped<IContentCheckService, ContentCheckService>();
builder.Services.AddScoped<IVoteRepository, VoteRepository>();
builder.Services.Configure<VoteLimitOptions>(builder.Configuration.GetSection(VoteLimitOptions.SectionName));
builder.Services.AddSingleton<IVoteRateLimiter, VoteRateLimiter>();
builder.Services.Configure<PostingLimitOptions>(builder.Configuration.GetSection(PostingLimitOptions.SectionName));
builder.Services.AddSingleton<IPostingRateLimiter, PostingRateLimiter>();
builder.Services.Configure<ReportLimitOptions>(builder.Configuration.GetSection(ReportLimitOptions.SectionName));
builder.Services.AddScoped<IVoteService, VoteService>();
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

// Đặt đầu tiên để bắt cả lỗi của các middleware phía sau.
app.UseExceptionHandler();

// Sau proxy: lấy IP và giao thức thật từ header trước khi bất cứ thứ gì dùng tới.
var isBehindProxy = HostingRegistration.IsBehindProxy(app.Configuration);
if (isBehindProxy)
{
    app.UseForwardedHeaders();
}

app.UseMiddleware<RequestCancellationMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Môi trường phát triển luôn migrate và seed; container bật bằng Database:MigrateOnStartup / SeedDemoData.
await app.PrepareDatabaseAsync();

// Sau proxy thì HTTPS là việc của proxy (nó giữ chứng chỉ), nên API không chuyển hướng.
if (!app.Environment.IsDevelopment() && !isBehindProxy)
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
