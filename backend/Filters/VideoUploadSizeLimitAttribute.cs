using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Filters;

// Kestrel takes a request of at most about 30 MB, but a video can be up to Media:MaxVideoBytes (50 MB). Put on the action
// that receives a video: before the file is read, it raises the limit of this request only to the size of a video plus
// 1 MB for the rest of the form (the same margin as the multipart limit in Program.cs). Other requests keep 30 MB.
[AttributeUsage(AttributeTargets.Method)]
public sealed class VideoUploadSizeLimitAttribute : Attribute, IResourceFilter
{
    public const long FormMargin = 1024 * 1024;

    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var feature = context.HttpContext.Features.Get<IHttpMaxRequestBodySizeFeature>();
        // The feature is missing in tests without a server, and read-only once the body has been read.
        if (feature is null || feature.IsReadOnly) return;

        var options = context.HttpContext.RequestServices.GetRequiredService<IOptions<MediaOptions>>().Value;
        feature.MaxRequestBodySize = options.MaxVideoBytes + FormMargin;
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}
