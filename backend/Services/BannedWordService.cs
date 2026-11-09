using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class BannedWordService(
    IBannedWordRepository repository,
    IProfanityFilter profanityFilter,
    IAdminAuditService auditService,
    TimeProvider timeProvider) : IBannedWordService
{
    public async Task<IReadOnlyList<BannedWordDto>> GetAllAsync(CancellationToken cancellationToken) =>
        (await repository.GetAllAsync(cancellationToken)).Select(Map).ToList();

    public async Task<BannedWordWriteResult> AddAsync(
        string administratorId,
        SaveBannedWordRequest request,
        CancellationToken cancellationToken)
    {
        if (!BannedWordRules.TryNormalize(request.Word, out var text))
        {
            return BannedWordWriteResult.Failed(BannedWordFailure.Validation, BannedWordRules.InvalidMessage);
        }

        var word = new BannedWord { Word = text, CreatedAtUtc = timeProvider.GetUtcNow() };
        if (!await repository.AddAsync(word, cancellationToken))
        {
            return BannedWordWriteResult.Failed(BannedWordFailure.Duplicate, "Từ này đã có trong danh sách.");
        }

        await auditService.RecordAsync(administratorId, "banned-word-added", "BannedWord", word.Id.ToString(),
            null, $"word={word.Word}", "Thêm từ cấm.", cancellationToken);
        // The next post is already filtered with the new list.
        await profanityFilter.WarmUpAsync(cancellationToken);
        return BannedWordWriteResult.Success(Map(word));
    }

    public async Task<BannedWordWriteResult> RemoveAsync(
        string administratorId,
        int id,
        CancellationToken cancellationToken)
    {
        var word = await repository.GetByIdAsync(id, cancellationToken);
        if (word is null)
        {
            return BannedWordWriteResult.Failed(BannedWordFailure.NotFound, "Không tìm thấy từ cấm.");
        }

        var removed = Map(word);
        await repository.RemoveAsync(word, cancellationToken);
        await auditService.RecordAsync(administratorId, "banned-word-removed", "BannedWord", id.ToString(),
            $"word={removed.Word}", null, "Xóa từ cấm.", cancellationToken);
        await profanityFilter.WarmUpAsync(cancellationToken);
        return BannedWordWriteResult.Success(removed);
    }

    private static BannedWordDto Map(BannedWord word) => new(word.Id, word.Word, word.CreatedAtUtc);
}
