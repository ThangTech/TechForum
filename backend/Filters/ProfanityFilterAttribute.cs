using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Filters;

// Put on a controller. Before an action runs, it looks at the body of the request and replaces the banned words by "***"
// in every text marked with [FilterProfanity], so the clean text is what the action validates and saves.
// A request without marked texts, or without a body, passes untouched.
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class ProfanityFilterAttribute : ActionFilterAttribute
{
    private static readonly ConcurrentDictionary<Type, IReadOnlyList<MarkedText>> MarkedTexts = new();

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var profanityFilter = context.HttpContext.RequestServices.GetRequiredService<IProfanityFilter>();
        var cancellationToken = context.HttpContext.RequestAborted;

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null) continue;

            foreach (var marked in GetMarkedTexts(argument.GetType()))
            {
                if (marked.Property.GetValue(argument) is not string text) continue;
                var cleaned = await profanityFilter.FilterAsync(text, marked.IsHtml, cancellationToken);
                // A request is a record with init-only properties; reflection can still set them.
                if (!string.Equals(cleaned, text, StringComparison.Ordinal)) marked.Property.SetValue(argument, cleaned);
            }
        }

        await next();
    }

    private static IReadOnlyList<MarkedText> GetMarkedTexts(Type type)
    {
        // Ids, numbers and text such as a route value are not bodies: only classes that carry marked properties count.
        if (type.IsPrimitive || type.IsEnum || type == typeof(string)) return [];

        return MarkedTexts.GetOrAdd(type, static requestType => requestType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(property => property.PropertyType == typeof(string) && property.CanRead && property.SetMethod is not null)
            .Select(property => (Property: property, Mark: property.GetCustomAttribute<FilterProfanityAttribute>()))
            .Where(item => item.Mark is not null)
            .Select(item => new MarkedText(item.Property, item.Mark!.IsHtml))
            .ToList());
    }

    private sealed record MarkedText(PropertyInfo Property, bool IsHtml);
}
