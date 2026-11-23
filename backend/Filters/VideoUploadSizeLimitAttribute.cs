using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Filters;

// Kestrel chỉ nhận yêu cầu khoảng 30 MB, nhưng video được tới Media:MaxVideoBytes (50 MB).
// Chỉ nâng giới hạn cho yêu cầu tải video (cộng 1 MB cho phần còn lại của form); yêu cầu khác giữ 30 MB.
[AttributeUsage(AttributeTargets.Method)]
public sealed class VideoUploadSizeLimitAttribute : Attribute, IResourceFilter
{
    public const long FormMargin = 1024 * 1024;

    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var feature = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
        // Test không có server thì không có feature này; khi body đã được đọc thì không đổi giới hạn được nữa.
        if (feature is null || feature.IsReadOnly) return;

        var options = context.HttpContext.RequestServices.GetRequiredService<IOptions<MediaOptions>>().Value;
        feature.MaxRequestBodySize = options.MaxVideoBytes + FormMargin;
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}
