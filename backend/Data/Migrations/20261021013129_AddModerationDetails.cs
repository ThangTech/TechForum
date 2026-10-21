using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Notifications",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "LockReason",
                table: "AspNetUsers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LockReason",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);
        }
    }
}
