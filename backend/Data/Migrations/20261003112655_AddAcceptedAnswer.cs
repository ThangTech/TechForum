using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAcceptedAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcceptedAnswerId",
                table: "Topics",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Topics_AcceptedAnswerId",
                table: "Topics",
                column: "AcceptedAnswerId",
                unique: true,
                filter: "[AcceptedAnswerId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Topics_Answers_AcceptedAnswerId",
                table: "Topics",
                column: "AcceptedAnswerId",
                principalTable: "Answers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Topics_Answers_AcceptedAnswerId",
                table: "Topics");

            migrationBuilder.DropIndex(
                name: "IX_Topics_AcceptedAnswerId",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AcceptedAnswerId",
                table: "Topics");
        }
    }
}
