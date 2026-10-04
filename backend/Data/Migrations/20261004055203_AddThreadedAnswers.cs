using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddThreadedAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentAnswerId",
                table: "Answers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Answers_ParentAnswerId",
                table: "Answers",
                column: "ParentAnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_TopicId_ParentAnswerId_CreatedAtUtc",
                table: "Answers",
                columns: new[] { "TopicId", "ParentAnswerId", "CreatedAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_Answers_Answers_ParentAnswerId",
                table: "Answers",
                column: "ParentAnswerId",
                principalTable: "Answers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Answers_Answers_ParentAnswerId",
                table: "Answers");

            migrationBuilder.DropIndex(
                name: "IX_Answers_ParentAnswerId",
                table: "Answers");

            migrationBuilder.DropIndex(
                name: "IX_Answers_TopicId_ParentAnswerId_CreatedAtUtc",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "ParentAnswerId",
                table: "Answers");
        }
    }
}
