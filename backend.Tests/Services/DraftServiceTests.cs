using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class DraftServiceTests
{
    private const string Member = "member-a";

    [Fact]
    public async Task SaveAsync_FirstTime_CreatesTheDraftOfANewTopic()
    {
        var drafts = new FakeDraftRepository();

        var result = await CreateService(drafts).SaveAsync(Member, Request(title: "Tiêu đề viết dở"), default);

        Assert.Equal(DraftWriteFailure.None, result.Failure);
        var draft = Assert.Single(drafts.Drafts);
        Assert.Equal(Member, draft.UserId);
        Assert.Null(draft.TopicId);
        Assert.Equal("Tiêu đề viết dở", draft.Title);
        Assert.Equal(draft.Id, result.Draft!.Id);
    }

    [Fact]
    public async Task SaveAsync_SecondTime_ReplacesTheSameDraftInsteadOfAddingAnother()
    {
        var drafts = new FakeDraftRepository();
        var service = CreateService(drafts);
        var first = await service.SaveAsync(Member, Request(title: "Bản đầu"), default);

        var second = await service.SaveAsync(Member, Request(title: "Bản sửa", summary: "Tóm tắt mới"), default);

        var draft = Assert.Single(drafts.Drafts);
        Assert.Equal(first.Draft!.Id, second.Draft!.Id);
        Assert.Equal("Bản sửa", draft.Title);
        Assert.Equal("Tóm tắt mới", draft.Summary);
        Assert.Equal(1, drafts.SaveCount);
    }

    [Fact]
    public async Task SaveAsync_NewTopicAndEditedTopic_AreTwoDrafts()
    {
        var drafts = new FakeDraftRepository();
        drafts.OwnedTopics.Add((Member, 7));
        var service = CreateService(drafts);

        await service.SaveAsync(Member, Request(title: "Bài mới"), default);
        await service.SaveAsync(Member, Request(title: "Sửa bài 7", topicId: 7), default);

        Assert.Equal(2, drafts.Drafts.Count);
        Assert.Equal("Bài mới", (await service.GetAsync(Member, null, default))!.Title);
        Assert.Equal("Sửa bài 7", (await service.GetAsync(Member, 7, default))!.Title);
    }

    [Fact]
    public async Task SaveAsync_WhenAnotherRequestCreatedTheFirstDraftAtTheSameTime_UpdatesThatDraft()
    {
        var drafts = new FakeDraftRepository
        {
            DraftCreatedByAnotherRequest = new Draft
            {
                Id = Guid.NewGuid(), UserId = Member, TopicId = null, Title = "Do yêu cầu kia tạo", Summary = "", BodyHtml = "<p>x</p>"
            }
        };

        var result = await CreateService(drafts).SaveAsync(Member, Request(title: "Bản của yêu cầu này"), default);

        Assert.Equal(DraftWriteFailure.None, result.Failure);
        var draft = Assert.Single(drafts.Drafts);
        Assert.Equal("Bản của yêu cầu này", draft.Title);
        Assert.Equal(draft.Id, result.Draft!.Id);
        Assert.Equal(1, drafts.SaveCount);
    }

    [Fact]
    public async Task SaveAsync_AcceptsAnUnfinishedForm()
    {
        // A topic needs a title of 10 characters, a summary of 20 and a category. A draft needs none of them.
        var result = await CreateService().SaveAsync(Member, Request(title: "Ngắn"), default);

        Assert.Equal(DraftWriteFailure.None, result.Failure);
    }

    [Theory]
    [InlineData(null, null, null)]
    [InlineData("   ", "", "<p><br></p>")]
    [InlineData("", "  ", "<p>&nbsp;</p>")]
    public async Task SaveAsync_WithNothingTyped_IsRejected(string? title, string? summary, string? body)
    {
        var drafts = new FakeDraftRepository();

        var result = await CreateService(drafts).SaveAsync(Member, new SaveDraftRequest(null, title, summary, body, null, null, null, null), default);

        Assert.Equal(DraftWriteFailure.Validation, result.Failure);
        Assert.Empty(drafts.Drafts);
    }

    [Fact]
    public async Task SaveAsync_WithOnlyAPicture_IsSaved()
    {
        var result = await CreateService().SaveAsync(Member, Request(body: "<p><img src=\"/media/images/a.png\"></p>"), default);

        Assert.Equal(DraftWriteFailure.None, result.Failure);
    }

    [Fact]
    public async Task SaveAsync_WithTooLongFields_NamesTheField()
    {
        var service = CreateService();

        Assert.Equal("title", (await service.SaveAsync(Member, Request(title: new string('a', 201)), default)).Field);
        Assert.Equal("summary", (await service.SaveAsync(Member, Request(title: "x", summary: new string('a', 501)), default)).Field);
        Assert.Equal("bodyHtml", (await service.SaveAsync(Member, Request(body: new string('a', 100_001)), default)).Field);
    }

    [Fact]
    public async Task SaveAsync_WithBadTypeTagsOrMedia_NamesTheField()
    {
        var service = CreateService();

        var badType = await service.SaveAsync(Member, Request(title: "x", type: "blog"), default);
        var tooManyTags = await service.SaveAsync(Member, Request(title: "x", tagIds: [1, 2, 3, 4, 5, 6]), default);
        var badTag = await service.SaveAsync(Member, Request(title: "x", tagIds: [0]), default);
        var tooManyMedia = await service.SaveAsync(Member, Request(title: "x", mediaIds: Enumerable.Range(0, 21).Select(_ => Guid.NewGuid()).ToList()), default);

        Assert.Equal("type", badType.Field);
        Assert.Equal("tagIds", tooManyTags.Field);
        Assert.Equal("tagIds", badTag.Field);
        Assert.Equal("mediaIds", tooManyMedia.Field);
    }

    [Fact]
    public async Task SaveAsync_CleansTheHtmlLikeATopic()
    {
        var drafts = new FakeDraftRepository();

        await CreateService(drafts).SaveAsync(Member, Request(body: "<p onclick=\"x()\">Chữ</p><script>alert(1)</script>"), default);

        var body = Assert.Single(drafts.Drafts).BodyHtml;
        Assert.DoesNotContain("script", body);
        Assert.DoesNotContain("onclick", body);
        Assert.Contains("Chữ", body);
    }

    [Fact]
    public async Task SaveAsync_ForATopicOfAnotherMember_IsNotFoundAndSavesNothing()
    {
        var drafts = new FakeDraftRepository();
        drafts.OwnedTopics.Add(("member-b", 9));

        var result = await CreateService(drafts).SaveAsync(Member, Request(title: "Sửa bài người khác", topicId: 9), default);

        Assert.Equal(DraftWriteFailure.NotFound, result.Failure);
        Assert.Empty(drafts.Drafts);
    }

    [Fact]
    public async Task SaveAsync_KeepsOnlyTheMediaThatTheMemberCanUse()
    {
        var usable = new MediaAsset { Id = Guid.NewGuid(), UploaderId = Member, RelativePath = "images/a.png", PublicUrl = "/media/images/a.png", ContentType = "image/png" };
        var media = new FakeMediaRepository(usable);
        var drafts = new FakeDraftRepository();
        var strangerFileId = Guid.NewGuid();

        var result = await CreateService(drafts, media).SaveAsync(Member, Request(title: "Có ảnh", mediaIds: [usable.Id, strangerFileId]), default);

        Assert.Equal(DraftWriteFailure.None, result.Failure);
        Assert.Equal([usable.Id], Assert.Single(drafts.Drafts).MediaIds);
        Assert.Equal("/media/images/a.png", Assert.Single(result.Draft!.Media).Path);
    }

    [Fact]
    public async Task GetAsync_GivesNothingWhenThereIsNoDraft_AndNeverTheDraftOfAnotherMember()
    {
        var drafts = new FakeDraftRepository();
        var service = CreateService(drafts);
        await service.SaveAsync("member-b", Request(title: "Của người khác"), default);

        Assert.Null(await service.GetAsync(Member, null, default));
        Assert.NotNull(await service.GetAsync("member-b", null, default));
    }

    [Fact]
    public async Task DeleteAsync_RemovesOnlyThatTarget()
    {
        var drafts = new FakeDraftRepository();
        drafts.OwnedTopics.Add((Member, 7));
        var service = CreateService(drafts);
        await service.SaveAsync(Member, Request(title: "Bài mới"), default);
        await service.SaveAsync(Member, Request(title: "Sửa bài 7", topicId: 7), default);

        await service.DeleteAsync(Member, null, default);

        var left = Assert.Single(drafts.Drafts);
        Assert.Equal(7, left.TopicId);
    }

    private static DraftService CreateService(FakeDraftRepository? drafts = null, FakeMediaRepository? media = null) =>
        new(drafts ?? new FakeDraftRepository(), media ?? new FakeMediaRepository(), TestMediaRules.CreateSanitizer(), TimeProvider.System);

    private static SaveDraftRequest Request(
        string? title = null,
        string? summary = null,
        string? body = null,
        string? type = "article",
        int? topicId = null,
        IReadOnlyList<int>? tagIds = null,
        IReadOnlyList<Guid>? mediaIds = null) =>
        new(topicId, title, summary, body, type, null, tagIds, mediaIds);

    // Knows only the files that were given to it, all of them owned by the member and not used yet.
    private sealed class FakeMediaRepository(params MediaAsset[] assets) : IMediaAssetRepository
    {
        public Task AddAsync(MediaAsset mediaAsset, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task<MediaAsset?> GetOwnedAsync(Guid id, string uploaderId, CancellationToken cancellationToken) =>
            Task.FromResult(assets.SingleOrDefault(item => item.Id == id && item.UploaderId == uploaderId));

        public Task<IReadOnlyList<MediaAsset>> GetOwnedUnattachedByIdsAsync(
            IReadOnlyCollection<Guid> ids, string uploaderId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(
                assets.Where(item => ids.Contains(item.Id) && item.UploaderId == uploaderId && item.TopicId == null).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOwnedAvailableForTopicByIdsAsync(
            IReadOnlyCollection<Guid> ids, string uploaderId, int topicId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(
                assets.Where(item => ids.Contains(item.Id) && item.UploaderId == uploaderId &&
                    (item.TopicId == null || item.TopicId == topicId)).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOrphansOlderThanAsync(
            DateTimeOffset threshold, int take, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>([]);

        public Task DeleteAsync(MediaAsset mediaAsset, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
