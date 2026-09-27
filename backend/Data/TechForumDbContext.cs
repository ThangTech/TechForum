using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data;

public sealed class TechForumDbContext(DbContextOptions<TechForumDbContext> options)
    : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var category = modelBuilder.Entity<Category>();

        category.ToTable("Categories");
        category.HasKey(item => item.Id);
        category.Property(item => item.Name).HasMaxLength(100).IsRequired();
        category.Property(item => item.Slug).HasMaxLength(100).IsRequired();
        category.Property(item => item.Description).HasMaxLength(500);
        category.HasIndex(item => item.Slug).IsUnique();
    }
}
