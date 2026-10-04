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

    public DbSet<ContentReport> ContentReports => Set<ContentReport>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();
    public DbSet<TopicView> TopicViews => Set<TopicView>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.Bio)
            .HasMaxLength(500);

        var category = modelBuilder.Entity<Category>();

        category.ToTable("Categories");
        category.HasKey(item => item.Id);
        category.Property(item => item.Name).HasMaxLength(100).IsRequired();
        category.Property(item => item.Slug).HasMaxLength(100).IsRequired();
        category.Property(item => item.Description).HasMaxLength(500);
        category.Property(item => item.IsActive).HasDefaultValue(true).IsRequired();
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

        var topicView = modelBuilder.Entity<TopicView>();
        topicView.ToTable("TopicViews");
        topicView.HasKey(item => new { item.TopicId, item.VisitorKeyHash, item.ViewedOnUtc });
        topicView.Property(item => item.VisitorKeyHash).HasMaxLength(64).IsRequired();
        topicView.Property(item => item.ViewedOnUtc).HasColumnType("date");
        topicView.HasIndex(item => new { item.TopicId, item.FirstViewedAtUtc });
        topicView.HasOne(item => item.Topic)
            .WithMany(item => item.Views)
            .HasForeignKey(item => item.TopicId)
            .OnDelete(DeleteBehavior.Restrict);

        var report = modelBuilder.Entity<ContentReport>();
        report.ToTable("ContentReports", table => table.HasCheckConstraint(
            "CK_ContentReports_OneTarget",
            "([TopicId] IS NOT NULL AND [AnswerId] IS NULL) OR ([TopicId] IS NULL AND [AnswerId] IS NOT NULL)"));
        report.HasKey(item => item.Id);
        report.Property(item => item.ReporterId).HasMaxLength(450).IsRequired();
        report.Property(item => item.ResolvedById).HasMaxLength(450);
        report.Property(item => item.Reason).HasMaxLength(40).IsRequired();
        report.Property(item => item.Details).HasMaxLength(1000);
        report.Property(item => item.ResolutionNote).HasMaxLength(1000);
        report.Property(item => item.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        report.HasIndex(item => new { item.Status, item.CreatedAtUtc });
        report.HasIndex(item => new { item.ReporterId, item.TopicId }).IsUnique()
            .HasFilter("[Status] = 'Pending' AND [TopicId] IS NOT NULL");
        report.HasIndex(item => new { item.ReporterId, item.AnswerId }).IsUnique()
            .HasFilter("[Status] = 'Pending' AND [AnswerId] IS NOT NULL");
        report.HasOne(item => item.Topic).WithMany().HasForeignKey(item => item.TopicId).OnDelete(DeleteBehavior.Restrict);
        report.HasOne(item => item.Answer).WithMany().HasForeignKey(item => item.AnswerId).OnDelete(DeleteBehavior.Restrict);
        report.HasOne(item => item.Reporter).WithMany().HasForeignKey(item => item.ReporterId).OnDelete(DeleteBehavior.Restrict);
        report.HasOne(item => item.ResolvedBy).WithMany().HasForeignKey(item => item.ResolvedById).OnDelete(DeleteBehavior.Restrict);

        var auditLog = modelBuilder.Entity<AdminAuditLog>();
        auditLog.ToTable("AdminAuditLogs");
        auditLog.HasKey(item => item.Id);
        auditLog.Property(item => item.AdministratorId).HasMaxLength(450).IsRequired();
        auditLog.Property(item => item.Action).HasMaxLength(60).IsRequired();
        auditLog.Property(item => item.TargetType).HasMaxLength(40).IsRequired();
        auditLog.Property(item => item.TargetId).HasMaxLength(100).IsRequired();
        auditLog.Property(item => item.PreviousValue).HasMaxLength(1000);
        auditLog.Property(item => item.NewValue).HasMaxLength(1000);
        auditLog.Property(item => item.Reason).HasMaxLength(1000).IsRequired();
        auditLog.HasIndex(item => new { item.TargetType, item.TargetId, item.CreatedAtUtc });
        auditLog.HasIndex(item => new { item.AdministratorId, item.CreatedAtUtc });
        auditLog.HasOne(item => item.Administrator).WithMany().HasForeignKey(item => item.AdministratorId).OnDelete(DeleteBehavior.Restrict);

        var notification = modelBuilder.Entity<Notification>();
        notification.ToTable("Notifications");
        notification.HasKey(item => item.Id);
        notification.Property(item => item.UserId).HasMaxLength(450).IsRequired();
        notification.Property(item => item.Type).HasMaxLength(40).IsRequired();
        notification.Property(item => item.Title).HasMaxLength(160).IsRequired();
        notification.Property(item => item.Message).HasMaxLength(500).IsRequired();
        notification.Property(item => item.Link).HasMaxLength(300).IsRequired();
        notification.Property(item => item.SourceKey).HasMaxLength(160).IsRequired();
        notification.HasIndex(item => new { item.UserId, item.SourceKey }).IsUnique();
        notification.HasIndex(item => new { item.UserId, item.ReadAtUtc, item.CreatedAtUtc });
        notification.HasOne(item => item.User).WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Restrict);

        var userFollow = modelBuilder.Entity<UserFollow>();
        userFollow.ToTable("UserFollows", table => table.HasCheckConstraint(
            "CK_UserFollows_NotSelf",
            "[FollowerId] <> [FollowingId]"));
        userFollow.HasKey(item => new { item.FollowerId, item.FollowingId });
        userFollow.Property(item => item.FollowerId).HasMaxLength(450).IsRequired();
        userFollow.Property(item => item.FollowingId).HasMaxLength(450).IsRequired();
        userFollow.HasIndex(item => new { item.FollowingId, item.CreatedAtUtc });
        userFollow.HasOne(item => item.Follower).WithMany().HasForeignKey(item => item.FollowerId).OnDelete(DeleteBehavior.Restrict);
        userFollow.HasOne(item => item.Following).WithMany().HasForeignKey(item => item.FollowingId).OnDelete(DeleteBehavior.Restrict);

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
