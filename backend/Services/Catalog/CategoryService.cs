using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryRepository categoryRepository;
    private readonly IAdminAuditService auditService;

    public CategoryService(ICategoryRepository categoryRepository, IAdminAuditService auditService)
    {
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var categories = await categoryRepository.GetAllAsync(cancellationToken);
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        return category is null ? null : MapToDto(category);
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.DisplayOrder);
    }

    public async Task<IReadOnlyList<AdminCategoryDto>> GetAdminAsync(CancellationToken cancellationToken)
    {
        return (await categoryRepository.GetAdminAsync(cancellationToken))
            .Select(item => MapAdminDto(item.Category, item.TopicCount))
            .ToList();
    }

    public async Task<Result<AdminCategoryDto>> CreateAsync(
        string administratorId,
        SaveCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null)
        {
            return validation;
        }

        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await categoryRepository.SlugExistsAsync(slug, null, cancellationToken))
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Conflict, "Đường dẫn bị trùng", "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        }

        var category = new Category
        {
            Name = request.Name!.Trim(),
            Slug = slug,
            Description = NormalizeDescription(request.Description),
            DisplayOrder = request.DisplayOrder,
            IsActive = true
        };
        if (!await categoryRepository.AddAsync(category, cancellationToken))
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Conflict, "Đường dẫn bị trùng", "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        }
        await auditService.RecordAsync(administratorId, "category-created", "Category", category.Id.ToString(), null,
            $"name={category.Name};slug={category.Slug};active=true", "Tạo chuyên mục.", cancellationToken);
        return Result<AdminCategoryDto>.Success(MapAdminDto(category, 0));
    }

    public async Task<Result<AdminCategoryDto>> UpdateAsync(
        string administratorId,
        Guid id,
        SaveCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null)
        {
            return validation;
        }
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.NotFound, "Không tìm thấy chuyên mục", "Không tìm thấy chuyên mục.");
        }

        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await categoryRepository.SlugExistsAsync(slug, id, cancellationToken))
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Conflict, "Đường dẫn bị trùng", "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        }
        var previous = $"name={category.Name};slug={category.Slug};order={category.DisplayOrder}";
        category.Name = request.Name!.Trim();
        category.Slug = slug;
        category.Description = NormalizeDescription(request.Description);
        category.DisplayOrder = request.DisplayOrder;
        if (!await categoryRepository.SaveChangesAsync(cancellationToken))
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Conflict, "Đường dẫn bị trùng", "Đường dẫn chuyên mục đã được sử dụng.", "slug");
        }
        await auditService.RecordAsync(administratorId, "category-updated", "Category", category.Id.ToString(), previous,
            $"name={category.Name};slug={category.Slug};order={category.DisplayOrder}", "Cập nhật chuyên mục.", cancellationToken);
        return Result<AdminCategoryDto>.Success(MapAdminDto(
            category,
            await categoryRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    public async Task<Result<AdminCategoryDto>> SetActiveAsync(
        string administratorId,
        Guid id,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.NotFound, "Không tìm thấy chuyên mục", "Không tìm thấy chuyên mục.");
        }
        var previous = category.IsActive;
        category.IsActive = isActive;
        await categoryRepository.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync(administratorId, isActive ? "category-activated" : "category-deactivated", "Category",
            category.Id.ToString(), $"active={previous}", $"active={isActive}",
            isActive ? "Kích hoạt chuyên mục." : "Ngừng sử dụng chuyên mục.", cancellationToken);
        return Result<AdminCategoryDto>.Success(MapAdminDto(
            category,
            await categoryRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    private static Result<AdminCategoryDto>? Validate(SaveCategoryRequest request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Validation, null, "Tên chuyên mục phải có từ 1 đến 100 ký tự.", "name");
        }
        var slug = request.Slug?.Trim();
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 100 ||
            slug.StartsWith('-') || slug.EndsWith('-') || slug.Contains("--", StringComparison.Ordinal) ||
            slug.Any(character => !((character >= 'a' && character <= 'z') || char.IsDigit(character) || character == '-')))
            return Result<AdminCategoryDto>.Fail(ErrorType.Validation, null, "Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.", "slug");
        if (request.Description?.Trim().Length > 500)
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Validation, null, "Mô tả không được vượt quá 500 ký tự.", "description");
        }
        if (request.DisplayOrder < 0 || request.DisplayOrder > 10_000)
        {
            return Result<AdminCategoryDto>.Fail(ErrorType.Validation, null, "Thứ tự hiển thị phải từ 0 đến 10.000.", "displayOrder");
        }
        return null;
    }

    private static string? NormalizeDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    private static AdminCategoryDto MapAdminDto(Category category, int topicCount)
    {
        return new(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.DisplayOrder,
            category.IsActive,
            topicCount);
    }
}
