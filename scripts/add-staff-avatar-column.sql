/*
  Adds an optional avatar URL column for staff profile images.
  Safe to run multiple times.
*/

IF COL_LENGTH('People.Staff', 'AvatarUrl') IS NULL
BEGIN
  ALTER TABLE People.Staff
  ADD AvatarUrl NVARCHAR(MAX) NULL;
END
ELSE
BEGIN
  ALTER TABLE People.Staff
  ALTER COLUMN AvatarUrl NVARCHAR(MAX) NULL;
END
GO

-- Optional index if you plan to query by AvatarUrl presence often.
-- CREATE INDEX IX_Staff_AvatarUrl ON People.Staff(AvatarUrl);
