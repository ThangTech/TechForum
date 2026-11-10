namespace TechForum.Api.Tests;

// Ids of posts, answers, tags... are GUIDs. A test names them with a small number (Id(1), Id(2)), so it stays easy to read.
public static class TestIds
{
    public static Guid Id(int number) => new(number, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
}
