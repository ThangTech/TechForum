namespace TechForum.Api.Filters;

// Đánh dấu văn bản mà [ProfanityFilter] phải làm sạch. Trên record viết [property: FilterProfanity].
[AttributeUsage(AttributeTargets.Property)]
public sealed class FilterProfanityAttribute : Attribute
{
    // Văn bản HTML: chỉ thay chữ trong nội dung, không đụng tới thẻ và thuộc tính.
    public bool IsHtml { get; init; }
}
