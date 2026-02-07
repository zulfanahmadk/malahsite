# MaLah Project - Setup Guide

## Quick Start

```bash
# 1. Install dependencies
composer install && npm install

# 2. Setup environment
cp .env.example .env
php artisan key:generate

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE malah_project;"

# 4. Update .env with MySQL credentials
# Edit .env and set:
# DB_HOST=127.0.0.1
# DB_DATABASE=malah_project
# DB_USERNAME=root
# DB_PASSWORD=your_password

# 5. Run migrations
php artisan migrate --seed

# 6. Start development
npm run dev
```

Visit `http://localhost:8000` - Done! ✅

For detailed setup, see below.

---

## Overview

MaLah Project is a SaaS platform for creating digital wedding invitations and photobooth services. This is a Laravel 12 + React + Inertia.js application with Midtrans payment integration using **MySQL database**.

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php              # Multi-credential authentication
│   │   ├── TemplateController.php          # Template management
│   │   ├── SubscriptionController.php      # Subscription/orders
│   │   ├── TransactionController.php       # Payment transactions
│   │   ├── InvitationController.php        # Invitation content CMS
│   │   ├── AdminController.php             # Admin dashboard API
│   │   ├── PaymentController.php           # Midtrans payment
│   │   ├── SubdomainController.php         # Wildcard subdomain routing
│   │   ├── PageController.php              # Frontend pages
│   │   ├── AdminPageController.php         # Admin pages
│   │   └── OrderController.php             # Order creation
│   └── Middleware/
│       └── HandleInertiaRequests.php       # Inertia middleware
├── Models/
│   ├── User.php
│   ├── Template.php
│   ├── Subscription.php
│   ├── Transaction.php
│   └── InvitationData.php
└── Services/
    └── MidtransService.php                 # Midtrans integration

resources/
├── js/
│   ├── app.jsx                             # React entry point
│   ├── Components/                         # Shared components
│   ├── Layouts/                            # Layout components
│   └── Pages/                              # Page components
│       ├── Welcome.jsx                     # Landing page
│       ├── Login.jsx                       # User login
│       ├── Register.jsx                    # User registration
│       ├── Dashboard/                      # User dashboard
│       ├── Order/                          # Order/purchase flow
│       ├── Payment/                        # Payment pages
│       └── Admin/                          # Admin pages
├── views/
│   ├── app.blade.php                       # Main Inertia view
│   └── invitations/
│       └── template.blade.php              # Invitation template

routes/
├── web.php                                 # Web routes (including subdomain)
├── api.php                                 # API routes
└── subdomains.php                          # Subdomain routes

database/
├── migrations/
│   ├── 0001_01_01_000000_create_users_table.php
│   ├── 2026_02_06_000003_create_templates_table.php
│   ├── 2026_02_06_000004_create_subscriptions_table.php
│   ├── 2026_02_06_000005_create_transactions_table.php
│   └── 2026_02_06_000006_create_invitation_data_table.php
└── seeders/
    ├── TemplateSeeder.php
    └── AdminUserSeeder.php
```

## Installation & Setup

### Prerequisites

- PHP 8.2+ with MySQL PDO extension
- MySQL 8.0+ server running
- Composer
- Node.js 18+ and npm

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy env file
cp .env.example .env

# Generate app key
php artisan key:generate
```

### 3. MySQL Database Setup

**Prerequisites**: Make sure MySQL server is running and accessible

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE malah_project;"

# Update .env file with your MySQL credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=malah_project
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

**Run migrations and seeders**:

```bash
# Run migrations
php artisan migrate

# Seed sample data (templates and admin users)
php artisan db:seed --class=TemplateSeeder
php artisan db:seed --class=AdminUserSeeder

# Or seed everything at once
php artisan migrate:fresh --seed
```

### 4. Midtrans Configuration

1. Create account at https://dashboard.midtrans.com
2. Get your Server Key and Client Key from the dashboard
3. Update `.env` file:

```env
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
MIDTRANS_IS_PRODUCTION=false  # Set to true for production
```

### 5. Start Development Server

```bash
# Using npm script (runs both Laravel and Vite)
npm run dev

# Or manually:
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server
npm run dev
```

The application will be available at `http://localhost:8000`

## Key Features Implemented

### ✅ Authentication System
- **Multi-credential Login**: Users can login with email, username, or phone number
- **User Registration**: Full registration with validation
- **Admin Login**: Email/Username only (no phone)
- **Sanctum Tokens**: API token-based authentication

### ✅ Template Management
- Browse and filter templates by category (Floral, Minimalis, Adat, Luxury)
- Template demo viewing
- Template pricing and details

### ✅ Purchase Flow
- Template selection
- Unique subdomain configuration
- Subdomain availability checking
- Order creation and management

### ✅ Payment Integration
- Midtrans Snap popup integration
- Payment status tracking (pending, paid, failed)
- Automatic subscription activation on successful payment
- Webhook handling for payment notifications

### ✅ User Dashboard
- View all subscriptions
- Manage invitation content (CMS):
  - Groom/bride names
  - Parents' names
  - Event date and time
  - Ceremony and reception locations
  - Love story text
  - Photo gallery
  - Custom wedding info

### ✅ Wildcard Subdomain Routing
- Dynamic invitation sites via subdomains
- Support for `.malahproject.com`, `.malahproject.test`, `.malahproject.local`
- Template rendering based on subscription data

### ✅ Admin Dashboard
- Dashboard statistics (users, income, subscriptions)
- User management
- User suspension
- Template management
- Transaction logs
- Real-time data

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/username/phone
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Templates
- `GET /api/templates` - Get all templates with filters
- `GET /api/templates/{id}` - Get single template
- `GET /api/templates/{id}/demo` - Get template demo URL

### Subscriptions
- `GET /api/subscriptions` - Get user's subscriptions (requires auth)
- `POST /api/subscriptions` - Create new subscription (requires auth)
- `GET /api/subscriptions/{id}` - Get subscription details (requires auth)
- `POST /api/subscriptions/check-subdomain` - Check subdomain availability
- `GET /api/subscriptions/{subdomain}` - Get subscription by subdomain (public)

### Invitations
- `GET /api/subscriptions/{id}/invitation` - Get invitation data (requires auth)
- `PUT /api/subscriptions/{id}/invitation` - Update invitation data (requires auth)
- `GET /api/invitations/{subdomain}` - Get invitation public preview

### Transactions/Payments
- `GET /api/transactions` - Get user's transactions (requires auth)
- `POST /api/transactions/initiate` - Initiate payment (requires auth)
- `GET /api/transactions/{id}` - Get transaction details (requires auth)
- `POST /api/webhooks/midtrans` - Midtrans webhook (public, signature verified)

### Admin (requires admin auth)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/{id}` - Get user details
- `POST /api/admin/users/{id}/suspend` - Suspend user
- `GET /api/admin/templates` - Get all templates
- `POST /api/admin/templates` - Create template
- `GET /api/admin/transactions` - Get all transactions

## Database Schema

### users
- id, name, email (unique), username (unique), phone (unique), password, user_type (user/admin), timestamps

### templates
- id, name, description, file_path, thumbnail_path, price, type (wedding/booth), category, demo_url, is_active, timestamps

### subscriptions
- id, user_id (FK), template_id (FK), subdomain (unique), status (pending/active/expired/suspended), activated_at, expired_at, timestamps

### transactions
- id, subscription_id (FK), midtrans_order_id (unique), amount, status (pending/paid/failed/cancelled), payload (JSON), payment_method, paid_at, timestamps

### invitation_data
- id, subscription_id (FK), bride_name, groom_name, bride_father_name, bride_mother_name, groom_father_name, groom_mother_name, event_date, ceremony_time, ceremony_location, reception_location, reception_google_maps_link, love_story, photo_gallery (JSON), wedding_info (JSON), timestamps

## Default Admin Credentials

After running seeders, you can login with:

**Email/Username:** `admin` or `admin@malahproject.com`
**Password:** `Admin@12345`

**Test Admin:**
**Email/Username:** `testadmin` or `test@malahproject.com`
**Password:** `Test@12345`

⚠️ **Important**: Change these credentials in production!

## Subdomain Setup (Local Development)

To test subdomain functionality locally, add entries to your hosts file:

```
127.0.0.1 malahproject.local
127.0.0.1 romeojuliet.malahproject.local
127.0.0.1 johnjane.malahproject.local
```

Then access invitations at: `http://romeojuliet.malahproject.local:8000`

## Subdomain Setup (Production)

1. Add wildcard DNS record: `*.malahproject.com A your.server.ip`
2. Configure SSL certificate for `*.malahproject.com`
3. Update `.env` with production Midtrans keys
4. Set `MIDTRANS_IS_PRODUCTION=true`

## Testing Midtrans Payment

Use Midtrans test credentials for testing. Test card details:

- **Card Number:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits

## File Upload

Currently, the application uses placeholder paths for images. To implement file uploads:

1. Configure storage in `config/filesystems.php`
2. Create storage link: `php artisan storage:link`
3. Modify controllers to handle file uploads
4. Store paths in database

## Next Steps for Production

1. **Security**:
   - Change default admin credentials
   - Enable HTTPS/SSL
   - Configure CORS for API
   - Implement rate limiting
   - Add input sanitization

2. **Performance**:
   - Enable query caching
   - Configure Redis for sessions
   - Optimize images
   - Implement CDN

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Configure logging
   - Set up uptime monitoring

4. **Deployment**:
   - Configure production database (MySQL/PostgreSQL)
   - Set up automatic backups
   - Configure email sending
   - Set up CI/CD pipeline

5. **Features to Add**:
   - Email notifications
   - Customizable templates
   - File upload for photos
   - User password reset
   - Subscription expiry handling
   - Refund management system

## Troubleshooting

### Vite assets not loading
```bash
npm run build
```

### Database migrations failed

**Check MySQL connection**:
```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1;"
```

**Reset database** (Warning: This deletes all data):
```bash
php artisan migrate:fresh --seed
```

**Specific migration issues**:
```bash
# Rollback last migration
php artisan migrate:rollback

# Check migration status
php artisan migrate:status
```

### API calls returning 401
- Check if authentication token is stored in localStorage
- Verify Sanctum configuration in `.env`

### Subdomain not working
- Verify DNS configuration
- Check `/etc/hosts` file on local machine
- Ensure route domain configuration matches your domain

## Support & Documentation

- Laravel Documentation: https://laravel.com/docs
- Inertia.js Documentation: https://inertiajs.com
- Midtrans Documentation: https://docs.midtrans.com
- React Documentation: https://react.dev

## License

This project is proprietary software. Unauthorized copying or distribution is prohibited.
