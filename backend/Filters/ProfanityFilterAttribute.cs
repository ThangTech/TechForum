using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Filters;

// Thay từ cấm bằng "***" trong các trường có [FilterProfanity] trước khi action chạy,
// để thứ được kiểm tra và lưu là văn bản đã sạch.
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
                // Request là record có thuộc tính init; reflection vẫn gán được.
                if (!string.Equals(cleaned, text, StringComparison.Ordinal)) marked.Property.SetValue(argument, cleaned);
            }
        }

        await next();
    }

    private static IReadOnlyList<MarkedText> GetMarkedTexts(Type type)
    {
        // Id, số hay chuỗi trên route không phải body: chỉ xét class có thuộc tính được đánh dấu.
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
