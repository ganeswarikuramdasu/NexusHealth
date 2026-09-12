-- Flyway V2: remove the dead multilingual 'preferred_language' column(s)
-- that were left over after the i18n/voice revert (NOT NULL, no default) --
-- they broke patient registration (INSERT omits them -> 500).
SET @proc_schema = 'nexushealth';
SET @col_name   = 'preferred_language';

SET @sql := NULL;
SELECT GROUP_CONCAT(CONCAT('ALTER TABLE ', table_schema, '.', table_name, ' DROP COLUMN ', column_name, '') SEPARATOR ';')
  INTO @sql
  FROM information_schema.columns
 WHERE table_schema = @proc_schema AND column_name = @col_name;

SET @sql := IFNULL(@sql, 'SELECT 1');   -- nothing to drop = no-op, idempotent
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
