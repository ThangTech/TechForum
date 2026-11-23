using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class BannedWordService : IBannedWordService
{
    private readonly IBannedWordRepository repository;
    private readonly IProfanityFilter profanityFilter;
    private readonly IAdminAuditService auditService;
    private readonly TimeProvider timeProvider;

    public BannedWordService(
        IBannedWordRepository repository,
        IProfanityFilter profanityFilter,
        IAdminAuditService auditService,
        TimeProvider timeProvider)
    {
        this.repository = repository;
        this.profanityFilter = profanityFilter;
        this.auditService = auditService;
        this.timeProvider = timeProvider;
    }

    public async Task<IReadOnlyList<BannedWordDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        return (await repository.GetAllAsync(cancellationToken)).Select(Map).ToList();
    }

    public async Task<Result<BannedWordDto>> AddAsync(
        string administratorId,
        SaveBannedWordRequest request,
        CancellationToken cancellationToken)
    {
        if (!BannedWordRules.TryNormalize(request.Word, out var text))
        {
            return Result<BannedWordDto>.Fail(ErrorType.Validation, null, BannedWordRules.InvalidMessage, "word");
        }

        var word = new BannedWord { Word = text, CreatedAtUtc = timeProvider.GetUtcNow() };
        if (!await repository.AddAsync(word, cancellationToken))
        {
            return Result<BannedWordDto>.Fail(ErrorType.Conflict, "Từ cấm bị trùng", "Từ này đã có trong danh sách.");
        }

        await auditService.RecordAsync(administratorId, "banned-word-added", "BannedWord", word.Id.ToString(),
            null, $"word={word.Word}", "Thêm từ cấm.", cancellationToken);
        // The next post is already filtered with the new list.
        await profanityFilter.WarmUpAsync(cancellationToken);
        return Result<BannedWordDto>.Success(Map(word));
    }

    public async Task<Result> RemoveAsync(
        string administratorId,
        Guid id,
        CancellationToken cancellationToken)
    {
        var word = await repository.GetByIdAsync(id, cancellationToken);
        if (word is null)
        {
            return Result.Fail(ErrorType.NotFound, "Không tìm thấy từ cấm", "Không tìm thấy từ cấm.");
        }

        var removed = Map(word);
        await repository.RemoveAsync(word, cancellationToken);
        await auditService.RecordAsync(administratorId, "banned-word-removed", "BannedWord", id.ToString(),
            $"word={removed.Word}", null, "Xóa từ cấm.", cancellationToken);
        await profanityFilter.WarmUpAsync(cancellationToken);
        return Result.Success();
    }

    private static BannedWordDto Map(BannedWord word) => new(word.Id, word.Word, word.CreatedAtUtc);
}
