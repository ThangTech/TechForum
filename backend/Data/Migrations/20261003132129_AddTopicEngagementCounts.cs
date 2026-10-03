using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTopicEngagementCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShareCount",
                table: "Topics",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Topics",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "TopicViews",
                columns: table => new
                {
                    TopicId = table.Column<int>(type: "int", nullable: false),
                    VisitorKeyHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ViewedOnUtc = table.Column<DateOnly>(type: "date", nullable: false),
                    FirstViewedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopicViews", x => new { x.TopicId, x.VisitorKeyHash, x.ViewedOnUtc });
                    table.ForeignKey(
                        name: "FK_TopicViews_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TopicViews_TopicId_FirstViewedAtUtc",
                table: "TopicViews",
                columns: new[] { "TopicId", "FirstViewedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TopicViews");

            migrationBuilder.DropColumn(
                name: "ShareCount",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Topics");
        }
    }
}
