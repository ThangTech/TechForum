using System.Linq.Expressions;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

// The one place that says which topics the public can see. Every query that lists, counts or
// checks public topics uses this rule, so a draft, a deleted topic or a topic hidden by a
// moderator is left out in the same way everywhere (lists, profiles, bookmarks, statistics...).
public static class TopicVisibility
{
    // A topic is public when it is published (it has a publish date), not deleted and not hidden
    // by a moderator.
    //
    // It is an expression (not a method) so EF Core can turn it into SQL. Use it as
    // `dbContext.Topics.Where(TopicVisibility.IsPublic)`. To apply it to the topic that another
    // entity points to, use `WhereTopicIsPublic`.
    public static readonly Expression<Func<Topic, bool>> IsPublic = topic =>
        topic.Status == TopicStatus.Published &&
        topic.PublishedAtUtc != null &&
        !topic.IsDeleted &&
        !topic.IsHiddenByModerator;

    private static readonly Func<Topic, bool> IsPublicInMemory = IsPublic.Compile();

    // The same rule for a topic that is already loaded in memory. A missing topic is not public.
    public static bool IsPublicTopic(Topic? topic) => topic is not null && IsPublicInMemory(topic);

    // Keeps the rows whose topic is public, for example the answers of public topics:
    // `answers.WhereTopicIsPublic(answer => answer.Topic)`. EF Core turns it into the same SQL as
    // writing the topic conditions by hand on `answer.Topic`.
    public static IQueryable<T> WhereTopicIsPublic<T>(
        this IQueryable<T> source,
        Expression<Func<T, Topic>> topicOf)
    {
        // Put the topic expression (answer.Topic) in place of the topic parameter of the rule,
        // and keep the row parameter (answer) of `topicOf` as the parameter of the new filter.
        var body = new ReplaceParameter(IsPublic.Parameters[0], topicOf.Body).Visit(IsPublic.Body);
        return source.Where(Expression.Lambda<Func<T, bool>>(body, topicOf.Parameters));
    }

    private sealed class ReplaceParameter(ParameterExpression parameter, Expression replacement) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node) =>
            node == parameter ? replacement : base.VisitParameter(node);
    }
}
