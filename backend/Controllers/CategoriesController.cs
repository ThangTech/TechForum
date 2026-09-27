using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<CategoryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll(CancellationToken cancellationToken)
    {
        var categories = await categoryService.GetAllAsync(cancellationToken);
        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<CategoryDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var category = await categoryService.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy chuyên mục",
                Detail = $"Không có chuyên mục với mã {id}."
            });
        }

        return Ok(category);
    }
}
