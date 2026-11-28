using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveStarsIntoVotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sao hữu ích của bài và "hữu ích" của câu trả lời trở thành bình chọn tốt, để không mất lượt nào.
            // Ai đã bình chọn (tốt hoặc chưa tốt) thì giữ phiếu đó. Phiếu mới cộng điểm cho bài/câu trả lời
            // và danh tiếng cho tác giả, giống hệt khi bấm ▲.
            migrationBuilder.Sql(MoveIntoVotes("TopicStars", "TopicId", "Topics", 1, 5));
            migrationBuilder.Sql(MoveIntoVotes("AnswerHelpfulVotes", "AnswerId", "Answers", 2, 10));

            migrationBuilder.DropTable(
                name: "AnswerHelpfulVotes");

            migrationBuilder.DropTable(
                name: "TopicStars");
        }

        // Số điểm cố định như ReputationRules lúc viết migration (bài 5, câu trả lời 10); không dùng hằng số để
        // migration cũ không đổi kết quả khi quy tắc sau này đổi.
        private static string MoveIntoVotes(string table, string targetColumn, string targetTable, int targetType, int points)
        {
            return $"""
                DECLARE @moved TABLE (TargetId uniqueidentifier NOT NULL);

                INSERT INTO UserVotes (UserId, TargetType, TargetId, Value, CreatedAtUtc)
                OUTPUT inserted.TargetId INTO @moved
                SELECT source.UserId, {targetType}, source.{targetColumn}, 1, source.CreatedAtUtc
                FROM {table} AS source
                JOIN {targetTable} AS target ON target.Id = source.{targetColumn}
                WHERE source.UserId <> target.AuthorId
                  AND NOT EXISTS (
                      SELECT 1 FROM UserVotes AS vote
                      WHERE vote.UserId = source.UserId AND vote.TargetType = {targetType} AND vote.TargetId = source.{targetColumn});

                UPDATE target SET Score = target.Score + moved.Total
                FROM {targetTable} AS target
                JOIN (SELECT TargetId, COUNT(*) AS Total FROM @moved GROUP BY TargetId) AS moved ON moved.TargetId = target.Id;

                UPDATE author SET Reputation = author.Reputation + {points} * moved.Total
                FROM AspNetUsers AS author
                JOIN (
                    SELECT target.AuthorId, COUNT(*) AS Total
                    FROM @moved AS item JOIN {targetTable} AS target ON target.Id = item.TargetId
                    GROUP BY target.AuthorId
                ) AS moved ON moved.AuthorId = author.Id;
                """;
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnswerHelpfulVotes",
                columns: table => new
                {
                    AnswerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnswerHelpfulVotes", x => new { x.AnswerId, x.UserId });
                    table.ForeignKey(
                        name: "FK_AnswerHelpfulVotes_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AnswerHelpfulVotes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TopicStars",
                columns: table => new
                {
                    TopicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopicStars", x => new { x.TopicId, x.UserId });
                    table.ForeignKey(
                        name: "FK_TopicStars_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TopicStars_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnswerHelpfulVotes_UserId",
                table: "AnswerHelpfulVotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TopicStars_TopicId_CreatedAtUtc",
                table: "TopicStars",
                columns: new[] { "TopicId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TopicStars_UserId",
                table: "TopicStars",
                column: "UserId");
        }
    }
}
