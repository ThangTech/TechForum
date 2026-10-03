using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class TagService(ITagRepository tagRepository) : ITagService
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
}
