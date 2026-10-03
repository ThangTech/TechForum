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
