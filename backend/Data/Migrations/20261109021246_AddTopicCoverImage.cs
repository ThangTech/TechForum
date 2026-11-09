using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTopicCoverImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Topics",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            // Topics written before this column existed get the first picture of their body as the cover.
            // The sanitizer writes every site picture as src="/media/images/..." with double quotes.
            migrationBuilder.Sql(
                """
                UPDATE Topics
                SET CoverImageUrl = SUBSTRING(BodyHtml, p.StartPosition, CHARINDEX('"', BodyHtml, p.StartPosition) - p.StartPosition)
                FROM Topics
                CROSS APPLY (SELECT CHARINDEX('src="/media/images/', BodyHtml) + 5 AS StartPosition) AS p
                WHERE p.StartPosition > 5
                  AND CHARINDEX('"', BodyHtml, p.StartPosition) - p.StartPosition BETWEEN 1 AND 300;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Topics");
        }
    }
}
