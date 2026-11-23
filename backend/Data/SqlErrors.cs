using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace TechForum.Api.Data;

public static class SqlErrors
{
    // 2601 và 2627 là lỗi "trùng khóa" của SQL Server (chỉ mục unique hoặc khóa chính).
    public static bool IsDuplicateKey(DbUpdateException exception)
    {
        if (exception.InnerException is not SqlException sqlException)
        {
            return false;
        }

        return sqlException.Number == 2601 || sqlException.Number == 2627;
    }
}
