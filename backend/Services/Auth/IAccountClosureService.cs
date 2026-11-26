using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAccountClosureService
{
    Task<Result> SignOutEverywhereAsync(string userId, CancellationToken cancellationToken);
    Task<Result> CloseAsync(string userId, CloseAccountRequest request, CancellationToken cancellationToken);
}
