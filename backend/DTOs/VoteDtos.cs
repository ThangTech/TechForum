namespace TechForum.Api.Dtos;

// value: 1 = upvote, -1 = downvote, 0 = take the vote back.
public sealed record SetVoteRequest(int Value);

// Score: the sum of all votes. MyVote: the vote of the member who asks (0 for a guest or no vote).
// ScoreHidden: the post is new (see ReputationRules.ScoreHiddenHours); Score is 0 then and MyVote still shows the vote.
public sealed record VoteDto(int Score, int MyVote, bool ScoreHidden = false);
