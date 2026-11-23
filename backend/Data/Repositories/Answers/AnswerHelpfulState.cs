namespace TechForum.Api.Data.Repositories;

public sealed record AnswerHelpfulState(Guid AnswerId, int HelpfulCount, bool IsHelpful, int Score = 0, int MyVote = 0);
