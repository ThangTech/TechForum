using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace TechForum.Api.Configuration;

// The texts of the errors that ASP.NET writes by itself (a wrong request body, a missing field, a plain 404). They are in
// English by default; a member must always read Vietnamese, so they are changed here.
public static partial class ApiErrorMessages
{
    public const string ValidationTitle = "Dữ liệu chưa hợp lệ";

    // The title that ASP.NET gives to every validation error when nobody sets another one.
    public const string DefaultValidationTitle = "One or more validation errors occurred.";

    public const string GenericDetail = "Vui lòng kiểm tra lại các thông tin đã nhập.";

    private const string RequiredMessage = "Vui lòng nhập đủ các thông tin bắt buộc.";
    private const string InvalidValueMessage = "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.";

    // The titles of the answers without a body (a plain 404, 401, 403...), by status code.
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

    // A message that is already Vietnamese (it has a letter that is not plain ASCII) stays as it is. A message of the
    // framework ("The Title field is required.", "The JSON value could not be converted...") is replaced by a Vietnamese one.
    public static string? Localize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message)) return null;
        if (message.Any(character => character > 127)) return message;
        return RequiredFieldPattern().IsMatch(message) ? RequiredMessage : InvalidValueMessage;
    }

    // The first message of the errors, to show a member one clear sentence.
    public static string? FirstMessage(IDictionary<string, string[]> errors) =>
        errors.Values.SelectMany(messages => messages).Select(Localize).FirstOrDefault(message => message is not null);

    // Gives a validation problem a Vietnamese title, Vietnamese messages and a detail with the first message.
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
