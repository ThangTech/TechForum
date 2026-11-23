using System.Linq.Expressions;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

// Nơi duy nhất quy định câu trả lời nào được công khai, để số câu trả lời ở trang bài, danh sách, hồ sơ
// và bảng điều khiển luôn khớp nhau.
public static class AnswerVisibility
{
    // Công khai khi chưa xóa, chưa bị ẩn, và là câu trả lời gốc hoặc phản hồi của một câu trả lời gốc cùng bài cũng
    // chưa xóa, chưa bị ẩn (ẩn câu gốc thì các phản hồi cũng ẩn theo). Viết dạng biểu thức để EF Core dịch được sang SQL.
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
