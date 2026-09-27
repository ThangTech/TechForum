using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data;

public static class DevelopmentDataSeeder
{
    public static async Task SeedAsync(
        TechForumDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Categories.AnyAsync(cancellationToken))
        {
            return;
        }

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

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
