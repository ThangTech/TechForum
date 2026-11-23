using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IDraftRepository
{
    Task<Draft?> GetForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken);

    Task<bool> OwnsTopicAsync(string userId, Guid topicId, CancellationToken cancellationToken);

    // False khi yêu cầu khác vừa lưu bản nháp đầu tiên của cùng đích (DB chỉ cho một bản nháp mỗi người mỗi đích);
    // lúc đó nơi gọi đọc bản nháp đó rồi cập nhật.
    Task<bool> TryAddAsync(Draft draft, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task DeleteForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken);
}
