namespace TechForum.Api.Data.Repositories;

// Điểm thật của câu trả lời và phiếu của người đang xem (1, -1 hoặc 0).
public sealed record AnswerVoteState(Guid AnswerId, int Score, int MyVote);
