using System.Linq.Expressions;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

// Nơi duy nhất quy định bài nào được công khai, để bản nháp, bài đã xóa hay bị ẩn bị loại giống nhau ở mọi nơi
// (danh sách, hồ sơ, bài đã lưu, thống kê...).
public static class TopicVisibility
{
    // Công khai khi đã xuất bản, chưa xóa và không bị ẩn. Viết dạng biểu thức để EF Core dịch được sang SQL.
    public static readonly Expression<Func<Topic, bool>> IsPublic = topic =>
        topic.Status == TopicStatus.Published &&
        topic.PublishedAtUtc != null &&
        !topic.IsDeleted &&
        !topic.IsHiddenByModerator;

    private static readonly Func<Topic, bool> IsPublicInMemory = IsPublic.Compile();

    public static bool IsPublicTopic(Topic? topic) => topic is not null && IsPublicInMemory(topic);

    // Lọc các dòng có bài công khai, ví dụ câu trả lời: answers.WhereTopicIsPublic(answer => answer.Topic).
    public static IQueryable<T> WhereTopicIsPublic<T>(
        this IQueryable<T> source,
        Expression<Func<T, Topic>> topicOf)
    {
        // Thay tham số bài của quy tắc bằng biểu thức answer.Topic, giữ tham số answer làm tham số của bộ lọc mới.
        var body = new ReplaceParameter(IsPublic.Parameters[0], topicOf.Body).Visit(IsPublic.Body);
        return source.Where(Expression.Lambda<Func<T, bool>>(body, topicOf.Parameters));
    }

    private sealed class ReplaceParameter : ExpressionVisitor
    {
        private readonly ParameterExpression parameter;
        private readonly Expression replacement;

        public ReplaceParameter(ParameterExpression parameter, Expression replacement)
        {
            this.parameter = parameter;
            this.replacement = replacement;
        }

        protected override Expression VisitParameter(ParameterExpression node)
        {
            return node == parameter ? replacement : base.VisitParameter(node);
        }
    }
}
