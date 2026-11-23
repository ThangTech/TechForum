using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace TechForum.Api.Configuration;

// Các lỗi do ASP.NET tự viết (body sai, thiếu trường, 404 trống) mặc định là tiếng Anh;
// thành viên luôn phải đọc được tiếng Việt nên chúng được đổi ở đây.
public static partial class ApiErrorMessages
{
    public const string ValidationTitle = "Dữ liệu chưa hợp lệ";

    public const string DefaultValidationTitle = "One or more validation errors occurred.";

    public const string GenericDetail = "Vui lòng kiểm tra lại các thông tin đã nhập.";

    private const string RequiredMessage = "Vui lòng nhập đủ các thông tin bắt buộc.";
    private const string InvalidValueMessage = "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.";

    // Tiêu đề cho các câu trả lời không có nội dung (404, 401, 403 trống), theo mã trạng thái.
    public static readonly IReadOnlyDictionary<int, string> ClientErrorTitles = new Dictionary<int, string>
    {
        [400] = "Yêu cầu không hợp lệ",
        [401] = "Bạn cần đăng nhập để thực hiện thao tác này",
        [403] = "Bạn không có quyền thực hiện thao tác này",
        [404] = "Không tìm thấy nội dung",
        [405] = "Thao tác này không được hỗ trợ",
        [406] = "Định dạng trả lời không được hỗ trợ",
        [409] = "Dữ liệu bị xung đột",
        [415] = "Định dạng dữ liệu gửi lên không được hỗ trợ",
        [422] = ValidationTitle,
        [429] = "Bạn gửi quá nhiều yêu cầu"
    };

    // Câu đã là tiếng Việt (có chữ ngoài ASCII) giữ nguyên; câu tiếng Anh của framework được thay bằng tiếng Việt.
    public static string? Localize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message)) return null;
        if (message.Any(character => character > 127)) return message;
        return RequiredFieldPattern().IsMatch(message) ? RequiredMessage : InvalidValueMessage;
    }

    public static string? FirstMessage(IDictionary<string, string[]> errors)
    {
        return errors.Values.SelectMany(messages => messages).Select(Localize).FirstOrDefault(message => message is not null);
    }

    public static void Apply(ValidationProblemDetails problem)
    {
        if (string.IsNullOrWhiteSpace(problem.Title) || problem.Title == DefaultValidationTitle)
        {
            problem.Title = ValidationTitle;
        }

        foreach (var key in problem.Errors.Keys.ToList())
        {
            problem.Errors[key] = problem.Errors[key].Select(message => Localize(message) ?? string.Empty).Where(message => message.Length > 0).ToArray();
        }

        if (string.IsNullOrWhiteSpace(problem.Detail))
        {
            problem.Detail = FirstMessage(problem.Errors) ?? GenericDetail;
        }
    }

    [GeneratedRegex(@"^The .+ field is required\.?$", RegexOptions.CultureInvariant)]
    private static partial Regex RequiredFieldPattern();
}
