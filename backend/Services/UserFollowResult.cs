using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum FollowFailure { None, NotFound, SelfFollow }

public sealed record UserFollowResult(FollowStatusDto? Status, FollowFailure Failure)
{
    public static UserFollowResult Success(FollowStatusDto status) => new(status, FollowFailure.None);
    public static UserFollowResult Failed(FollowFailure failure) => new(null, failure);
}
