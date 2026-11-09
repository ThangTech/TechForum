namespace TechForum.Api.Dtos;

public sealed record BannedWordDto(int Id, string Word, DateTimeOffset CreatedAtUtc);

public sealed record SaveBannedWordRequest(string? Word);
