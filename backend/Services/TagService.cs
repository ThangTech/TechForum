using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class TagService(ITagRepository tagRepository, IAdminAuditService auditService) : ITagService
{
    public async Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken)
    {
        var tags = await tagRepository.GetActiveAsync(cancellationToken);
        return tags.Select(MapToDto).ToList();
    }

    public async Task<TagDto?> GetActiveByIdAsync(int id, CancellationToken cancellationToken)
    {
        var tag = await tagRepository.GetActiveByIdAsync(id, cancellationToken);
        return tag is null ? null : MapToDto(tag);
    }

    private static TagDto MapToDto(Tag tag) => new(
        tag.Id,
        tag.Name,
        tag.Slug,
        tag.Description);

    public async Task<IReadOnlyList<AdminTagDto>> GetAdminAsync(CancellationToken cancellationToken) =>
        (await tagRepository.GetAdminAsync(cancellationToken))
            .Select(item => MapAdminDto(item.Tag, item.TopicCount))
            .ToList();

    public async Task<TagWriteResult> CreateAsync(string administratorId, SaveTagRequest request, CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return validation;
        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await tagRepository.SlugExistsAsync(slug, null, cancellationToken))
            return TagWriteResult.Failed(TagWriteFailure.DuplicateSlug, "Đường dẫn thẻ đã được sử dụng.", "slug");

        var tag = new Tag
        {
            Name = request.Name!.Trim(),
            Slug = slug,
            Description = NormalizeDescription(request.Description),
            IsActive = true
        };
        if (!await tagRepository.AddAsync(tag, cancellationToken))
            return TagWriteResult.Failed(TagWriteFailure.DuplicateSlug, "Đường dẫn thẻ đã được sử dụng.", "slug");
        await auditService.RecordAsync(administratorId, "tag-created", "Tag", tag.Id.ToString(), null,
            $"name={tag.Name};slug={tag.Slug};active=true", "Tạo thẻ.", cancellationToken);
        return TagWriteResult.Success(MapAdminDto(tag, 0));
    }

    public async Task<TagWriteResult> UpdateAsync(
        string administratorId,
        int id,
        SaveTagRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null) return validation;
        var tag = await tagRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (tag is null) return TagWriteResult.Failed(TagWriteFailure.NotFound, "Không tìm thấy thẻ.");

        var slug = request.Slug!.Trim().ToLowerInvariant();
        if (await tagRepository.SlugExistsAsync(slug, id, cancellationToken))
            return TagWriteResult.Failed(TagWriteFailure.DuplicateSlug, "Đường dẫn thẻ đã được sử dụng.", "slug");
        var previous = $"name={tag.Name};slug={tag.Slug}";
        tag.Name = request.Name!.Trim();
        tag.Slug = slug;
        tag.Description = NormalizeDescription(request.Description);
        if (!await tagRepository.SaveChangesAsync(cancellationToken))
            return TagWriteResult.Failed(TagWriteFailure.DuplicateSlug, "Đường dẫn thẻ đã được sử dụng.", "slug");
        await auditService.RecordAsync(administratorId, "tag-updated", "Tag", tag.Id.ToString(), previous,
            $"name={tag.Name};slug={tag.Slug}", "Cập nhật thẻ.", cancellationToken);
        return TagWriteResult.Success(MapAdminDto(tag, await tagRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    public async Task<TagWriteResult> SetActiveAsync(
        string administratorId,
        int id,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var tag = await tagRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (tag is null) return TagWriteResult.Failed(TagWriteFailure.NotFound, "Không tìm thấy thẻ.");
        var previous = tag.IsActive;
        tag.IsActive = isActive;
        await tagRepository.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync(administratorId, isActive ? "tag-activated" : "tag-deactivated", "Tag",
            tag.Id.ToString(), $"active={previous}", $"active={isActive}",
            isActive ? "Kích hoạt thẻ." : "Ngừng sử dụng thẻ.", cancellationToken);
        return TagWriteResult.Success(MapAdminDto(tag, await tagRepository.GetTopicCountAsync(id, cancellationToken)));
    }

    private static TagWriteResult? Validate(SaveTagRequest request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 60)
            return TagWriteResult.Failed(TagWriteFailure.Validation, "Tên thẻ phải có từ 1 đến 60 ký tự.", "name");
        var slug = request.Slug?.Trim();
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 60 ||
            slug.StartsWith('-') || slug.EndsWith('-') || slug.Contains("--", StringComparison.Ordinal) ||
            slug.Any(character => !((character >= 'a' && character <= 'z') || char.IsDigit(character) || character == '-')))
            return TagWriteResult.Failed(TagWriteFailure.Validation, "Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.", "slug");
        if (request.Description?.Trim().Length > 300)
            return TagWriteResult.Failed(TagWriteFailure.Validation, "Mô tả không được vượt quá 300 ký tự.", "description");
        return null;
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    private static AdminTagDto MapAdminDto(Tag tag, int topicCount) => new(
        tag.Id,
        tag.Name,
        tag.Slug,
        tag.Description,
        tag.IsActive,
        topicCount);
}
