namespace TechForum.Api.Middleware;

public sealed class RequestCancellationMiddleware
{
    private const int ClientClosedRequestStatusCode = 499;

    private readonly RequestDelegate next;
    private readonly ILogger<RequestCancellationMiddleware> logger;

    public RequestCancellationMiddleware(RequestDelegate next, ILogger<RequestCancellationMiddleware> logger)
    {
        this.next = next;
        this.logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            logger.LogDebug("Client đã ngắt request {Method} {Path}.", context.Request.Method, context.Request.Path);
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = ClientClosedRequestStatusCode;
            }
        }
    }
}
