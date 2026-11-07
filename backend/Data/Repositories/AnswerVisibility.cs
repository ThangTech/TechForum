using System.Linq.Expressions;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

// The one place that says which answers the public can see. Every query that counts, lists or
// checks public answers uses this rule, so the number of answers on a topic page, in the lists,
// in a profile and on the dashboard can never disagree.
public static class AnswerVisibility
{
    // An answer is public when it is not deleted and not hidden by a moderator, and
    //  - it is a top-level answer, or
    //  - it is a reply and its parent is a top-level answer of the same topic that is
    //    itself not deleted and not hidden.
    // So when a top-level answer is deleted or hidden, its replies stop being public too.
    // This rule is only about the answer. Whether the topic is public is a separate check.
    //
    // It is an expression (not a method) so EF Core can turn it into SQL. Use it as
    // `answers.Where(AnswerVisibility.IsPublic)`, or `topic.Answers.AsQueryable().Count(AnswerVisibility.IsPublic)`.
    public static readonly Expression<Func<Answer, bool>> IsPublic = answer =>
        !answer.IsDeleted &&
        !answer.IsHiddenByModerator &&
        (answer.ParentAnswerId == null ||
            (answer.ParentAnswer != null &&
             answer.ParentAnswer.TopicId == answer.TopicId &&
             answer.ParentAnswer.ParentAnswerId == null &&
             !answer.ParentAnswer.IsDeleted &&
             !answer.ParentAnswer.IsHiddenByModerator));
}
