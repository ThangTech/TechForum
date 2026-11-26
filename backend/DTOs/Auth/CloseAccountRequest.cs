namespace TechForum.Api.Dtos.Auth;

// Password: bắt buộc khi tài khoản có mật khẩu. Confirmation: phải gõ đúng "XÓA" để tránh bấm nhầm.
public sealed record CloseAccountRequest(string? Password, string? Confirmation);
