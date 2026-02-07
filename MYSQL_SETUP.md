# MySQL Setup for MaLah Project

## Prerequisites

- MySQL Server 8.0 or higher installed
- MySQL command-line client or MySQL Workbench
- Access to MySQL root account

## Installation Steps

### 1. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Once logged in, create the database
CREATE DATABASE malah_project;

# Verify creation
SHOW DATABASES;

# Exit MySQL
EXIT;
```

Or use a single command:

```bash
mysql -u root -p -e "CREATE DATABASE malah_project;"
```

### 2. Create MySQL User (Recommended for Security)

While you can use the root account, it's better practice to create a dedicated user:

```bash
mysql -u root -p
```

Then execute:

```sql
-- Create user
CREATE USER 'malah_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON malah_project.* TO 'malah_user'@'localhost';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 3. Update .env File

Edit your `.env` file with the MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=malah_project
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

Or if using the dedicated user:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=malah_project
DB_USERNAME=malah_user
DB_PASSWORD=your_secure_password
```

### 4. Run Migrations and Seeders

```bash
# Navigate to project directory
cd /path/to/malah-project

# Run all migrations
php artisan migrate

# Seed with sample data
php artisan db:seed --class=TemplateSeeder
php artisan db:seed --class=AdminUserSeeder

# Or all at once (creates fresh database)
php artisan migrate:fresh --seed
```

### 5. Verify Database Setup

```bash
# Check MySQL connection
mysql -u malah_user -p -D malah_project -e "SHOW TABLES;"

# Should output tables like:
# users
# templates
# subscriptions
# transactions
# invitation_data
# password_reset_tokens
# sessions
# cache
# cache_locks
# jobs
```

## Common Issues

### Connection Refused

**Error**: `SQLSTATE[HY000] [2002] Connection refused`

**Solutions**:
1. Check if MySQL is running:
   ```bash
   sudo systemctl status mysql  # Linux
   brew services list          # macOS
   ```

2. Start MySQL if not running:
   ```bash
   sudo systemctl start mysql   # Linux
   brew services start mysql    # macOS
   ```

3. Verify credentials in `.env`

### Access Denied

**Error**: `SQLSTATE[HY000] [1045] Access denied for user`

**Solutions**:
1. Check username and password in `.env`
2. Verify user has privileges:
   ```bash
   mysql -u root -p -e "SHOW GRANTS FOR 'malah_user'@'localhost';"
   ```

3. Reset password if needed:
   ```bash
   mysql -u root -p
   ALTER USER 'malah_user'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   ```

### Database Does Not Exist

**Error**: `SQLSTATE[HY000] [1049] Unknown database`

**Solution**: Create the database first:
```bash
mysql -u root -p -e "CREATE DATABASE malah_project;"
```

## Development Tools

### MySQL Workbench (GUI)

Download from: https://www.mysql.com/products/workbench/

Steps:
1. Open MySQL Workbench
2. Create new connection with your credentials
3. Connect to database
4. View tables and data visually

### Command Line Tools

```bash
# Login to specific database
mysql -u malah_user -p -D malah_project

# Run SQL file
mysql -u malah_user -p -D malah_project < file.sql

# Export database
mysqldump -u malah_user -p malah_project > backup.sql

# Import database
mysql -u malah_user -p malah_project < backup.sql
```

## Database Backup & Restore

### Backup

```bash
# Full backup
mysqldump -u malah_user -p malah_project > malah_backup.sql

# Backup with date
mysqldump -u malah_user -p malah_project > malah_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
mysql -u malah_user -p malah_project < malah_backup.sql
```

## Production Considerations

### Remote MySQL Server

If using a remote MySQL server (e.g., AWS RDS, DigitalOcean), update `.env`:

```env
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=malah_project
DB_USERNAME=admin
DB_PASSWORD=your_secure_password
```

### Connection Pooling

For production, consider using connection pooling. Update `config/database.php`:

```php
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DATABASE_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', 3306),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => true,
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
```

### Character Set & Collation

The project uses `utf8mb4` (supports emojis and special characters):

```sql
-- Check current charset
SHOW CREATE DATABASE malah_project;

-- Alter if needed
ALTER DATABASE malah_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Performance Tips

### Indexing

The migrations include necessary indexes on:
- `users.email`, `users.username`, `users.phone` (unique)
- `subscriptions.subdomain` (unique)
- Foreign keys for relationships

### Query Optimization

Monitor slow queries:

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow query log
SHOW VARIABLES LIKE 'slow_query_log%';
```

### Database Statistics

```sql
-- Get database size
SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS size_mb
FROM information_schema.tables
WHERE table_schema = 'malah_project'
GROUP BY table_schema;

-- Count records in each table
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'malah_project';
```

## Useful Laravel Commands

```bash
# Check database connection
php artisan tinker
# Then: DB::connection()->getPdo();

# Rollback all migrations
php artisan migrate:reset

# Rollback and migrate
php artisan migrate:refresh

# Fresh install (drops all tables)
php artisan migrate:fresh

# Fresh with seeds
php artisan migrate:fresh --seed

# Check migration status
php artisan migrate:status

# Specific seeder
php artisan db:seed --class=TemplateSeeder
```

## Next Steps

1. Database is now ready
2. Run migrations: `php artisan migrate`
3. Seed sample data: `php artisan db:seed`
4. Start development: `npm run dev`

For more help, refer to Laravel's database documentation:
https://laravel.com/docs/database
