namespace TechForum.Api.Data.Repositories;

public sealed record AnswerHelpfulState(int AnswerId, int HelpfulCount, bool IsHelpful);
