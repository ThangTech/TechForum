namespace TechForum.Api.Data.Repositories;

// Score and MyVote are the vote score of the answer and the vote of the member who asks (0 = none).
public sealed record AnswerHelpfulState(Guid AnswerId, int HelpfulCount, bool IsHelpful, int Score = 0, int MyVote = 0);
