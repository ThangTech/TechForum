using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RememberRefreshTokenChoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Các phiên có từ trước đều lưu cookie lâu dài, nên được coi là đã chọn "Duy trì đăng nhập".
            migrationBuilder.AddColumn<bool>(
                name: "IsPersistent",
                table: "RefreshTokens",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPersistent",
                table: "RefreshTokens");
        }
    }
}
