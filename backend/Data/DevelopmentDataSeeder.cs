using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Constants;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data;

public static class DevelopmentDataSeeder
{
    public static async Task SeedAsync(
        TechForumDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        if (!await dbContext.Categories.AnyAsync(cancellationToken))
        {
            dbContext.Categories.AddRange(
                new Category
                {
                    Name = "Lập trình",
                    Slug = "lap-trinh",
                    Description = "Trao đổi về ngôn ngữ, thuật toán và kỹ thuật phát triển phần mềm.",
                    DisplayOrder = 10
                },
                new Category
                {
                    Name = "Web & Mobile",
                    Slug = "web-mobile",
                    Description = "Kiến thức và kinh nghiệm xây dựng ứng dụng web, di động.",
                    DisplayOrder = 20
                },
                new Category
                {
                    Name = "Dữ liệu & AI",
                    Slug = "du-lieu-ai",
                    Description = "Thảo luận về dữ liệu, học máy và trí tuệ nhân tạo.",
                    DisplayOrder = 30
                });
        }

        if (!await dbContext.Tags.AnyAsync(cancellationToken))
        {
            dbContext.Tags.AddRange(
                new Tag { Name = "ASP.NET Core", Slug = "aspnet-core", IsActive = true },
                new Tag { Name = "React", Slug = "react", IsActive = true },
                new Tag { Name = "SQL Server", Slug = "sql-server", IsActive = true },
                new Tag { Name = "TypeScript", Slug = "typescript", IsActive = true });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        const string demoAuthorId = "techforum-development-author";
        if (!await dbContext.Users.AnyAsync(user => user.Id == demoAuthorId, cancellationToken))
        {
            dbContext.Users.Add(new ApplicationUser
            {
                Id = demoAuthorId,
                UserName = "demo-author@techforum.local",
                NormalizedUserName = "DEMO-AUTHOR@TECHFORUM.LOCAL",
                Email = "demo-author@techforum.local",
                NormalizedEmail = "DEMO-AUTHOR@TECHFORUM.LOCAL",
                EmailConfirmed = true,
                DisplayName = "Ban biên tập TechForum",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                SecurityStamp = "techforum-development-author-security",
                ConcurrencyStamp = "techforum-development-author-v1"
            });
            dbContext.UserRoles.Add(new IdentityUserRole<string>
            {
                UserId = demoAuthorId,
                RoleId = RoleNames.Member
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await dbContext.Topics.AnyAsync(cancellationToken))
        {
            var webCategory = await dbContext.Categories.SingleAsync(
                category => category.Slug == "web-mobile",
                cancellationToken);
            var programmingCategory = await dbContext.Categories.SingleAsync(
                category => category.Slug == "lap-trinh",
                cancellationToken);
            var reactTag = await dbContext.Tags.SingleAsync(tag => tag.Slug == "react", cancellationToken);
            var aspNetTag = await dbContext.Tags.SingleAsync(
                tag => tag.Slug == "aspnet-core",
                cancellationToken);
            var typeScriptTag = await dbContext.Tags.SingleAsync(
                tag => tag.Slug == "typescript",
                cancellationToken);
            var now = DateTimeOffset.UtcNow;

            dbContext.Topics.AddRange(
                new Topic
                {
                    Title = "Bắt đầu xây dựng ứng dụng React với TypeScript",
                    Slug = "bat-dau-react-voi-typescript",
                    Summary = "Những nguyên tắc cơ bản để tổ chức một ứng dụng React có kiểu dữ liệu rõ ràng.",
                    BodyHtml = "<p>React và TypeScript giúp phát hiện nhiều lỗi ngay trong quá trình phát triển.</p><p>Hãy bắt đầu bằng component nhỏ, contract API rõ ràng và kiểm tra từng luồng dữ liệu.</p>",
                    Type = TopicType.Article,
                    Status = TopicStatus.Published,
                    Category = webCategory,
                    AuthorId = demoAuthorId,
                    CreatedAtUtc = now.AddDays(-4),
                    PublishedAtUtc = now.AddDays(-4),
                    IsPinned = true,
                    TopicTags =
                    [
                        new TopicTag { Tag = reactTag },
                        new TopicTag { Tag = typeScriptTag }
                    ]
                },
                new Topic
                {
                    Title = "Khi nào nên dùng Service và Repository trong ASP.NET Core?",
                    Slug = "service-repository-trong-aspnet-core",
                    Summary = "Cách phân chia trách nhiệm vừa đủ cho một Web API quy mô đồ án.",
                    BodyHtml = "<p>Mình đang xây dựng Web API theo luồng Controller → Service → Repository → DbContext.</p><p>Đâu là ranh giới trách nhiệm hợp lý giữa Service và Repository?</p>",
                    Type = TopicType.Question,
                    Status = TopicStatus.Published,
                    Category = programmingCategory,
                    AuthorId = demoAuthorId,
                    CreatedAtUtc = now.AddDays(-2),
                    PublishedAtUtc = now.AddDays(-2),
                    TopicTags = [new TopicTag { Tag = aspNetTag }]
                });

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
