namespace TechForum.Api.Dtos;

// 1 = bình chọn tốt, -1 = chưa tốt, 0 = rút lại phiếu.
public sealed record SetVoteRequest(int Value);

// ScoreHidden: bài còn mới nên Score bằng 0, còn MyVote vẫn cho thấy phiếu của người hỏi.
public sealed record VoteDto(int Score, int MyVote, bool ScoreHidden = false);
