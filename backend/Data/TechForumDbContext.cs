using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Data;

public sealed class TechForumDbContext(DbContextOptions<TechForumDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Tag> Tags => Set<Tag>();

    public DbSet<Topic> Topics => Set<Topic>();

    public DbSet<TopicTag> TopicTags => Set<TopicTag>();

    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();

    public DbSet<Answer> Answers => Set<Answer>();

    public DbSet<TopicStar> TopicStars => Set<TopicStar>();

    public DbSet<TopicBookmark> TopicBookmarks => Set<TopicBookmark>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var category = modelBuilder.Entity<Category>();

        category.ToTable("Categories");
        category.HasKey(item => item.Id);
        category.Property(item => item.Name).HasMaxLength(100).IsRequired();
        category.Property(item => item.Slug).HasMaxLength(100).IsRequired();
        category.Property(item => item.Description).HasMaxLength(500);
        category.HasIndex(item => item.Slug).IsUnique();

        var tag = modelBuilder.Entity<Tag>();
        tag.ToTable("Tags");
        tag.HasKey(item => item.Id);
        tag.Property(item => item.Name).HasMaxLength(60).IsRequired();
        tag.Property(item => item.Slug).HasMaxLength(60).IsRequired();
        tag.Property(item => item.Description).HasMaxLength(300);
        tag.Property(item => item.IsActive).IsRequired();
        tag.HasIndex(item => item.Slug).IsUnique();

        var topic = modelBuilder.Entity<Topic>();
        topic.ToTable("Topics");
        topic.HasKey(item => item.Id);
        topic.Property(item => item.Title).HasMaxLength(200).IsRequired();
        topic.Property(item => item.Slug).HasMaxLength(220).IsRequired();
        topic.Property(item => item.Summary).HasMaxLength(500).IsRequired();
        topic.Property(item => item.BodyHtml).IsRequired();
        topic.Property(item => item.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        topic.Property(item => item.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        topic.Property(item => item.AuthorId).HasMaxLength(450).IsRequired();
        topic.HasIndex(item => item.Slug).IsUnique();
        topic.HasIndex(item => new
        {
            item.Status,
            item.IsDeleted,
            item.IsHiddenByModerator,
            item.IsPinned,
            item.PublishedAtUtc
        });
        topic.HasOne(item => item.Category)
            .WithMany()
            .HasForeignKey(item => item.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        topic.HasOne(item => item.Author)
            .WithMany()
            .HasForeignKey(item => item.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        var topicTag = modelBuilder.Entity<TopicTag>();
        topicTag.ToTable("TopicTags");
        topicTag.HasKey(item => new { item.TopicId, item.TagId });
        topicTag.HasOne(item => item.Topic)
            .WithMany(item => item.TopicTags)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Cascade);
        topicTag.HasOne(item => item.Tag)
            .WithMany()
            .HasForeignKey(item => item.TagId)
            .OnDelete(DeleteBehavior.Restrict);

        var mediaAsset = modelBuilder.Entity<MediaAsset>();
        mediaAsset.ToTable("MediaAssets");
        mediaAsset.HasKey(item => item.Id);
        mediaAsset.Property(item => item.UploaderId).HasMaxLength(450).IsRequired();
        mediaAsset.Property(item => item.RelativePath).HasMaxLength(300).IsRequired();
        mediaAsset.Property(item => item.PublicUrl).HasMaxLength(400).IsRequired();
        mediaAsset.Property(item => item.ContentType).HasMaxLength(100).IsRequired();
        mediaAsset.HasIndex(item => item.RelativePath).IsUnique();
        mediaAsset.HasIndex(item => item.PublicUrl).IsUnique();
        mediaAsset.HasIndex(item => new { item.TopicId, item.CreatedAtUtc });
        mediaAsset.HasIndex(item => new { item.UploaderId, item.TopicId });
        mediaAsset.HasOne(item => item.Uploader)
            .WithMany()
            .HasForeignKey(item => item.UploaderId)
            .OnDelete(DeleteBehavior.Restrict);
        mediaAsset.HasOne(item => item.Topic)
            .WithMany(item => item.MediaAssets)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Restrict);

        var answer = modelBuilder.Entity<Answer>();
        answer.ToTable("Answers");
        answer.HasKey(item => item.Id);
        answer.Property(item => item.AuthorId).HasMaxLength(450).IsRequired();
        answer.Property(item => item.BodyHtml).IsRequired();
        answer.HasIndex(item => new
        {
            item.TopicId,
            item.IsDeleted,
            item.IsHiddenByModerator,
            item.CreatedAtUtc
        });
        answer.HasOne(item => item.Topic)
            .WithMany(item => item.Answers)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
        answer.HasOne(item => item.Author)
            .WithMany()
            .HasForeignKey(item => item.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        topic.HasIndex(item => item.AcceptedAnswerId).IsUnique();
        topic.HasOne(item => item.AcceptedAnswer)
            .WithMany()
            .HasForeignKey(item => item.AcceptedAnswerId)
            .OnDelete(DeleteBehavior.Restrict);

        var topicStar = modelBuilder.Entity<TopicStar>();
        topicStar.ToTable("TopicStars");
        topicStar.HasKey(item => new { item.TopicId, item.UserId });
        topicStar.Property(item => item.UserId).HasMaxLength(450).IsRequired();
        topicStar.HasIndex(item => new { item.TopicId, item.CreatedAtUtc });
        topicStar.HasOne(item => item.Topic)
            .WithMany(item => item.Stars)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
        topicStar.HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        var bookmark = modelBuilder.Entity<TopicBookmark>();
        bookmark.ToTable("TopicBookmarks");
        bookmark.HasKey(item => new { item.TopicId, item.UserId });
        bookmark.Property(item => item.UserId).HasMaxLength(450).IsRequired();
        bookmark.HasIndex(item => new { item.UserId, item.CreatedAtUtc });
        bookmark.HasOne(item => item.Topic)
            .WithMany(item => item.Bookmarks)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Restrict);
        bookmark.HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ApplicationUser>(user =>
        {
            user.Property(item => item.DisplayName).HasMaxLength(80).IsRequired();
            user.Property(item => item.CreatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<IdentityRole>().HasData(
            new IdentityRole
            {
                Id = RoleNames.Member,
                Name = RoleNames.Member,
                NormalizedName = RoleNames.Member.ToUpperInvariant(),
                ConcurrencyStamp = "techforum-member-role-v1"
            },
            new IdentityRole
            {
                Id = RoleNames.Administrator,
                Name = RoleNames.Administrator,
                NormalizedName = RoleNames.Administrator.ToUpperInvariant(),
                ConcurrencyStamp = "techforum-administrator-role-v1"
            });
    }
}
