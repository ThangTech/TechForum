namespace TechForum.Api.Tests;

// Id của bài, câu trả lời, thẻ... là GUID; test gọi bằng số nhỏ (Id(1), Id(2)) cho dễ đọc.
public static class TestIds
{
    public static Guid Id(int number) => new(number, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
}
