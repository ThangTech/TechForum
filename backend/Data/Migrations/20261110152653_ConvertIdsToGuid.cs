using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechForum.Api.Data.Migrations
{
    // Every id of a table (posts, answers, categories, tags, banners, banned words, reports, notifications, the audit log and
    // the refresh tokens) was a number (int or bigint, counting up by one). They become GUIDs, so an address such as
    // /topics/5 cannot be guessed by counting.
    //
    // EF Core cannot do this with AlterColumn (a key, a foreign key and an identity column cannot be changed in place), so
    // the script works in steps and keeps the old data:
    //   1. It saves the definition of every primary key, index, foreign key and check constraint that touches an id, then drops them.
    //   2. Every table that has a number as id gets a new column GuidId with a new sequential GUID for each row.
    //   3. Every column that points to such an id (TopicId, AnswerId, CategoryId, TagId, ParentAnswerId, AcceptedAnswerId, the
    //      target of a vote) gets a GUID column that is filled from the table it points to.
    //   4. Ids that are saved inside text are rewritten too: the target of the audit log, the link and the key of the
    //      notifications, and the tags of the drafts (a list in JSON).
    //   5. The old columns are dropped, the new ones take their names, and the saved constraints are created again.
    // The script only runs once; there is no way back (the numbers are not kept), so Down refuses.
    public partial class ConvertIdsToGuid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. The columns that change, and the definition of every constraint that touches them.
            migrationBuilder.Sql(@"
CREATE TABLE #Parents (TableName sysname NOT NULL);
INSERT #Parents VALUES
    ('Categories'), ('Tags'), ('Topics'), ('Answers'), ('Banners'), ('BannedWords'),
    ('ContentReports'), ('Notifications'), ('AdminAuditLogs'), ('RefreshTokens');

-- A column that points to the id of a parent table. UserVotes.TargetId points to a post or to an answer, so it has its own steps.
CREATE TABLE #Children (TableName sysname NOT NULL, ColumnName sysname NOT NULL, ParentTable sysname NULL, IsNullable bit NOT NULL);
INSERT #Children VALUES
    ('Topics', 'CategoryId', 'Categories', 0), ('Topics', 'AcceptedAnswerId', 'Answers', 1),
    ('Drafts', 'CategoryId', 'Categories', 1), ('Drafts', 'TopicId', 'Topics', 1),
    ('TopicTags', 'TopicId', 'Topics', 0), ('TopicTags', 'TagId', 'Tags', 0),
    ('UserSkills', 'TagId', 'Tags', 0), ('MediaAssets', 'TopicId', 'Topics', 1),
    ('Answers', 'TopicId', 'Topics', 0), ('Answers', 'ParentAnswerId', 'Answers', 1),
    ('AnswerHelpfulVotes', 'AnswerId', 'Answers', 0), ('TopicStars', 'TopicId', 'Topics', 0),
    ('TopicBookmarks', 'TopicId', 'Topics', 0), ('TopicViews', 'TopicId', 'Topics', 0),
    ('ContentReports', 'TopicId', 'Topics', 1), ('ContentReports', 'AnswerId', 'Answers', 1),
    ('UserVotes', 'TargetId', NULL, 0);

CREATE TABLE #Cols (TableName sysname NOT NULL, ColumnName sysname NOT NULL);
INSERT #Cols SELECT TableName, 'Id' FROM #Parents;
INSERT #Cols SELECT TableName, ColumnName FROM #Children;

-- Kind: 1 primary key, 2 index, 3 foreign key, 4 check constraint.
CREATE TABLE #Defs (Kind int NOT NULL, Name sysname NOT NULL, TableName sysname NOT NULL, Ddl nvarchar(max) NOT NULL);

INSERT #Defs
SELECT 3, fk.name, OBJECT_NAME(fk.parent_object_id),
    'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + ' ADD CONSTRAINT ' + QUOTENAME(fk.name)
    + ' FOREIGN KEY (' + x.ChildColumns + ') REFERENCES ' + QUOTENAME(OBJECT_NAME(fk.referenced_object_id)) + ' (' + x.ParentColumns + ')'
    + ' ON DELETE ' + CASE fk.delete_referential_action WHEN 0 THEN 'NO ACTION' WHEN 1 THEN 'CASCADE' WHEN 2 THEN 'SET NULL' ELSE 'SET DEFAULT' END
FROM sys.foreign_keys fk
CROSS APPLY (
    SELECT STRING_AGG(CAST(QUOTENAME(pc.name) AS nvarchar(max)), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS ChildColumns,
           STRING_AGG(CAST(QUOTENAME(rc.name) AS nvarchar(max)), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS ParentColumns
    FROM sys.foreign_key_columns fkc
    JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
    JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
    WHERE fkc.constraint_object_id = fk.object_id) x
WHERE EXISTS (
        SELECT 1 FROM sys.foreign_key_columns fkc
        JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
        JOIN #Cols c ON c.TableName = OBJECT_NAME(fkc.parent_object_id) AND c.ColumnName = pc.name
        WHERE fkc.constraint_object_id = fk.object_id)
   OR EXISTS (
        SELECT 1 FROM sys.foreign_key_columns fkc
        JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
        JOIN #Cols c ON c.TableName = OBJECT_NAME(fkc.referenced_object_id) AND c.ColumnName = rc.name
        WHERE fkc.constraint_object_id = fk.object_id);

INSERT #Defs
SELECT CASE WHEN i.is_primary_key = 1 THEN 1 ELSE 2 END, i.name, t.name,
    CASE WHEN i.is_primary_key = 1
        THEN 'ALTER TABLE ' + QUOTENAME(t.name) + ' ADD CONSTRAINT ' + QUOTENAME(i.name) + ' PRIMARY KEY '
            + CASE WHEN i.type = 1 THEN 'CLUSTERED' ELSE 'NONCLUSTERED' END + ' (' + k.KeyColumns + ')'
        ELSE 'CREATE ' + CASE WHEN i.is_unique = 1 THEN 'UNIQUE ' ELSE '' END + CASE WHEN i.type = 1 THEN 'CLUSTERED ' ELSE 'NONCLUSTERED ' END
            + 'INDEX ' + QUOTENAME(i.name) + ' ON ' + QUOTENAME(t.name) + ' (' + k.KeyColumns + ')'
            + CASE WHEN i.has_filter = 1 THEN ' WHERE ' + i.filter_definition ELSE '' END
    END
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
CROSS APPLY (
    SELECT STRING_AGG(CAST(QUOTENAME(c.name) + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END AS nvarchar(max)), ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS KeyColumns
    FROM sys.index_columns ic
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0) k
WHERE i.type IN (1, 2) AND i.is_hypothetical = 0
  AND EXISTS (
        SELECT 1 FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        JOIN #Cols x ON x.TableName = t.name AND x.ColumnName = c.name
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id);

INSERT #Defs
SELECT 4, cc.name, t.name, 'ALTER TABLE ' + QUOTENAME(t.name) + ' ADD CONSTRAINT ' + QUOTENAME(cc.name) + ' CHECK ' + cc.definition
FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id = cc.parent_object_id
WHERE EXISTS (SELECT 1 FROM #Cols c WHERE c.TableName = t.name AND cc.definition LIKE '%[[]' + c.ColumnName + ']%');

-- Drop them: foreign keys, then check constraints, then indexes, then primary keys.
DECLARE @drop nvarchar(max) = (
    SELECT STRING_AGG(CAST(
        CASE WHEN Kind = 2 THEN 'DROP INDEX ' + QUOTENAME(Name) + ' ON ' + QUOTENAME(TableName) + ';'
             ELSE 'ALTER TABLE ' + QUOTENAME(TableName) + ' DROP CONSTRAINT ' + QUOTENAME(Name) + ';' END AS nvarchar(max)), ' ')
        WITHIN GROUP (ORDER BY CASE Kind WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 2 THEN 3 ELSE 4 END)
    FROM #Defs);
EXEC (@drop);
");

            // 2. A new GUID for every row of the tables that have a number as id.
            migrationBuilder.Sql(@"
DECLARE @add nvarchar(max) = (
    SELECT STRING_AGG(CAST('ALTER TABLE ' + QUOTENAME(TableName) + ' ADD [GuidId] uniqueidentifier NOT NULL CONSTRAINT '
        + QUOTENAME('DF_' + TableName + '_GuidId') + ' DEFAULT NEWSEQUENTIALID();' AS nvarchar(max)), ' ')
    FROM #Parents);
EXEC (@add);

DECLARE @addChild nvarchar(max) = (
    SELECT STRING_AGG(CAST('ALTER TABLE ' + QUOTENAME(TableName) + ' ADD ' + QUOTENAME(ColumnName + '_g') + ' uniqueidentifier NULL;' AS nvarchar(max)), ' ')
    FROM #Children);
EXEC (@addChild);
");

            // 3. Every column that points to an id takes the new id of the row it pointed to.
            migrationBuilder.Sql(@"
DECLARE @fill nvarchar(max) = (
    SELECT STRING_AGG(CAST('UPDATE c SET c.' + QUOTENAME(ColumnName + '_g') + ' = p.[GuidId] FROM ' + QUOTENAME(TableName) + ' c JOIN '
        + QUOTENAME(ParentTable) + ' p ON p.[Id] = c.' + QUOTENAME(ColumnName) + ';' AS nvarchar(max)), ' ')
    FROM #Children WHERE ParentTable IS NOT NULL);
EXEC (@fill);

-- A vote points to a post (TargetType 1) or to an answer (TargetType 2). A vote whose target does not exist any more is dropped.
UPDATE v SET v.[TargetId_g] = t.[GuidId] FROM UserVotes v JOIN Topics t ON t.[Id] = v.[TargetId] WHERE v.[TargetType] = 1;
UPDATE v SET v.[TargetId_g] = a.[GuidId] FROM UserVotes v JOIN Answers a ON a.[Id] = v.[TargetId] WHERE v.[TargetType] = 2;
DELETE FROM UserVotes WHERE [TargetId_g] IS NULL;
");

            // 4. Ids that are written inside text.
            migrationBuilder.Sql(@"
-- The target of the audit log is text: the number of the row, or the id of an account (that one is already a GUID).
UPDATE a SET a.[TargetId] = LOWER(CONVERT(nvarchar(36), p.[GuidId]))
FROM AdminAuditLogs a
JOIN (
    SELECT 'topic' AS TargetType, [Id], [GuidId] FROM Topics
    UNION ALL SELECT 'answer', [Id], [GuidId] FROM Answers
    UNION ALL SELECT 'category', [Id], [GuidId] FROM Categories
    UNION ALL SELECT 'tag', [Id], [GuidId] FROM Tags
    UNION ALL SELECT 'banner', [Id], [GuidId] FROM Banners
    UNION ALL SELECT 'bannedword', [Id], [GuidId] FROM BannedWords
    UNION ALL SELECT 'report', [Id], [GuidId] FROM ContentReports
) p ON LOWER(a.[TargetType]) = p.TargetType AND a.[TargetId] = CONVERT(nvarchar(20), p.[Id]);

-- A notification about an answer: link /topics/{topic}#answer-{answer} and key new-answer:{topic}:{answer} (or accepted-answer:...).
UPDATE n SET
    n.[Link] = '/topics/' + LOWER(CONVERT(nvarchar(36), t.[GuidId])) + '#answer-' + LOWER(CONVERT(nvarchar(36), a.[GuidId])),
    n.[SourceKey] = LEFT(n.[SourceKey], CHARINDEX(':', n.[SourceKey])) + LOWER(CONVERT(nvarchar(36), t.[GuidId])) + ':' + LOWER(CONVERT(nvarchar(36), a.[GuidId]))
FROM Notifications n
CROSS APPLY (SELECT CHARINDEX('#answer-', n.[Link]) AS HashPosition) h
JOIN Topics t ON h.HashPosition > 9 AND CONVERT(nvarchar(20), t.[Id]) = CASE WHEN h.HashPosition > 9 THEN SUBSTRING(n.[Link], 9, h.HashPosition - 9) END
JOIN Answers a ON h.HashPosition > 9 AND CONVERT(nvarchar(20), a.[Id]) = CASE WHEN h.HashPosition > 9 THEN SUBSTRING(n.[Link], h.HashPosition + 8, 20) END
WHERE n.[Link] LIKE '/topics/%#answer-%' AND (n.[SourceKey] LIKE 'new-answer:%' OR n.[SourceKey] LIKE 'accepted-answer:%');

-- A notification about a report: key report-resolved:{report}.
UPDATE n SET n.[SourceKey] = 'report-resolved:' + LOWER(CONVERT(nvarchar(36), r.[GuidId]))
FROM Notifications n
JOIN ContentReports r ON n.[SourceKey] = 'report-resolved:' + CONVERT(nvarchar(20), r.[Id]);

-- The tags of a draft are a list in JSON: [1,2] becomes [""guid"",""guid""].
UPDATE d SET d.[TagIds] = ISNULL((
    SELECT '[' + STRING_AGG('""' + LOWER(CONVERT(nvarchar(36), t.[GuidId])) + '""', ',') + ']'
    FROM OPENJSON(d.[TagIds]) j
    JOIN Tags t ON t.[Id] = TRY_CAST(j.[value] AS int)), '[]')
FROM Drafts d
WHERE d.[TagIds] IS NOT NULL;
");

            // 5. The old columns go away and the new ones take their names.
            migrationBuilder.Sql(@"
DECLARE @dropDefaults nvarchar(max) = (
    SELECT STRING_AGG(CAST('ALTER TABLE ' + QUOTENAME(TableName) + ' DROP CONSTRAINT ' + QUOTENAME('DF_' + TableName + '_GuidId') + ';' AS nvarchar(max)), ' ')
    FROM #Parents);
EXEC (@dropDefaults);

DECLARE @dropOld nvarchar(max) = (
    SELECT STRING_AGG(CAST('ALTER TABLE ' + QUOTENAME(TableName) + ' DROP COLUMN ' + QUOTENAME(ColumnName) + ';' AS nvarchar(max)), ' ')
    FROM #Cols);
EXEC (@dropOld);
");

            migrationBuilder.Sql(@"
DECLARE @rename nvarchar(max) = (
    SELECT STRING_AGG(CAST('EXEC sp_rename N''' + QUOTENAME(TableName) + '.' + QUOTENAME(OldName) + ''', N''' + NewName + ''', N''COLUMN'';' AS nvarchar(max)), ' ')
    FROM (
        SELECT TableName, CAST('GuidId' AS sysname) AS OldName, CAST('Id' AS sysname) AS NewName FROM #Parents
        UNION ALL
        SELECT TableName, ColumnName + '_g', ColumnName FROM #Children) renames);
EXEC (@rename);

DECLARE @notNull nvarchar(max) = (
    SELECT STRING_AGG(CAST('ALTER TABLE ' + QUOTENAME(TableName) + ' ALTER COLUMN ' + QUOTENAME(ColumnName) + ' uniqueidentifier NOT NULL;' AS nvarchar(max)), ' ')
    FROM #Children WHERE IsNullable = 0);
EXEC (@notNull);

-- The constraints come back: primary keys, indexes, foreign keys, check constraints.
DECLARE @create nvarchar(max) = (
    SELECT STRING_AGG(CAST(Ddl + ';' AS nvarchar(max)), ' ') WITHIN GROUP (ORDER BY Kind)
    FROM #Defs);
EXEC (@create);

DROP TABLE #Defs;
DROP TABLE #Cols;
DROP TABLE #Children;
DROP TABLE #Parents;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException(
                "The numbers that were the ids before this migration are not kept, so it cannot be undone. Restore a backup of the database instead.");
        }
    }
}
