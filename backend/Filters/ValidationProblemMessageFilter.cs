using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TechForum.Api.Configuration;

namespace TechForum.Api.Filters;

// Runs for every answer of a controller. When the answer is a validation problem (a controller made it with
// `new ValidationProblemDetails(...)`), it gets a Vietnamese title and detail, so the page never shows
// "One or more validation errors occurred.".
public sealed class ValidationProblemMessageFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult { Value: ValidationProblemDetails problem })
        {
            ApiErrorMessages.Apply(problem);
        }
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }
}
