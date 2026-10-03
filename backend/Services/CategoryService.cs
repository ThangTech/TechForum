using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var categories = await categoryRepository.GetAllAsync(cancellationToken);
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        return category is null ? null : MapToDto(category);
    }

    private static CategoryDto MapToDto(Category category) => new(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.DisplayOrder);

    public async Task<IReadOnlyList<AdminCategoryDto>> GetAdminAsync(CancellationToken cancellationToken) =>
        (await categoryRepository.GetAdminAsync(cancellationToken))
            .Select(item => MapAdminDto(item.Category, item.TopicCount))
            .ToList();

    public async Task<CategoryWriteResult> CreateAsync(
        SaveCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return validation;

        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await categoryRepository.SlugExistsAsync(slug, null, cancellationToken))
            return CategoryWriteResult.Failed(CategoryWriteFailure.DuplicateSlug, "Đường dẫn chuyên mục đã được sử dụng.", "slug");

        var category = new Category
        {
            Name = request.Name!.Trim(),
            Slug = slug,
            Description = NormalizeDescription(request.Description),
            DisplayOrder = request.DisplayOrder,
            IsActive = true
        };
        if (!await categoryRepository.AddAsync(category, cancellationToken))
            return CategoryWriteResult.Failed(CategoryWriteFailure.DuplicateSlug, "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        return CategoryWriteResult.Success(MapAdminDto(category, 0));
    }

    public async Task<CategoryWriteResult> UpdateAsync(
        int id,
        SaveCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return validation;
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (category is null)
            return CategoryWriteResult.Failed(CategoryWriteFailure.NotFound, "Không tìm thấy chuyên mục.");

        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await categoryRepository.SlugExistsAsync(slug, id, cancellationToken))
            return CategoryWriteResult.Failed(CategoryWriteFailure.DuplicateSlug, "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        category.Name = request.Name!.Trim();
        category.Slug = slug;
        category.Description = NormalizeDescription(request.Description);
        category.DisplayOrder = request.DisplayOrder;
        if (!await categoryRepository.SaveChangesAsync(cancellationToken))
            return CategoryWriteResult.Failed(CategoryWriteFailure.DuplicateSlug, "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        return CategoryWriteResult.Success(MapAdminDto(
            category,
            await categoryRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    public async Task<CategoryWriteResult> SetActiveAsync(
        int id,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (category is null)
            return CategoryWriteResult.Failed(CategoryWriteFailure.NotFound, "Không tìm thấy chuyên mục.");
        category.IsActive = isActive;
        await categoryRepository.SaveChangesAsync(cancellationToken);
        return CategoryWriteResult.Success(MapAdminDto(
            category,
            await categoryRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    private static CategoryWriteResult? Validate(SaveCategoryRequest request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return CategoryWriteResult.Failed(CategoryWriteFailure.Validation, "Tên chuyên mục phải có từ 1 đến 100 ký tự.", "name");
        var slug = request.Slug?.Trim();
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100 ||
            slug.StartsWith('-') || slug.EndsWith('-') || slug.Contains("--", StringComparison.Ordinal) ||
            slug.Any(character => !((character >= 'a' && character <= 'z') || char.IsDigit(character) || character == '-')))
            return CategoryWriteResult.Failed(CategoryWriteFailure.Validation, "Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.", "slug");
        if (request.Description?.Trim().Length > 500)
            return CategoryWriteResult.Failed(CategoryWriteFailure.Validation, "Mô tả không được vượt quá 500 ký tự.", "description");
        if (request.DisplayOrder < 0 || request.DisplayOrder > 10_000)
            return CategoryWriteResult.Failed(CategoryWriteFailure.Validation, "Thứ tự hiển thị phải từ 0 đến 10.000.", "displayOrder");
        return null;
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    private static AdminCategoryDto MapAdminDto(Category category, int topicCount) => new(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.DisplayOrder,
        category.IsActive,
        topicCount);
}
