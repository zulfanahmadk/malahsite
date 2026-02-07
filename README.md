# MaLah Project - Digital Wedding Invitation & Photobooth SaaS

A complete SaaS platform for creating beautiful digital wedding invitations with custom subdomains and integrated payment processing.

## 🎯 Features

### For Users
- 🎨 Browse and select from premium invitation templates
- 🏷️ Create custom subdomain for unique invitation URL
- 💳 Secure payment via Midtrans (QRIS, e-wallet, bank transfer)
- ✏️ Edit invitation content (names, dates, photos, stories)
- 🌐 Beautiful responsive invitation websites
- 📊 Manage all subscriptions in one dashboard

### For Admins
- 📈 Real-time dashboard with statistics
- 👥 User management and suspension capabilities
- 🎬 Template management (add, edit, delete templates)
- 💰 Transaction logs and revenue tracking
- 📱 Responsive admin panel

## 🛠 Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 18 with Inertia.js
- **Database**: MySQL 8.0+
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite
- **Payment**: Midtrans (QRIS, Virtual Account, E-wallet)
- **Authentication**: Laravel Sanctum (Token-based)

## 📋 Database Schema

```
users (id, name, email, username, phone, password, user_type)
├── subscriptions (id, user_id, template_id, subdomain, status)
│   ├── invitation_data (bride/groom names, dates, photos, story)
│   └── transactions (payment info, amount, status)
├── templates (name, price, category, demo_url)
```

## 🚀 Quick Start

### Requirements
- PHP 8.2+
- MySQL 8.0+
- Node.js 18+
- Composer

### Installation

```bash
# 1. Clone or download the project
cd malah-project

# 2. Install dependencies
composer install
npm install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Create MySQL database
mysql -u root -p -e "CREATE DATABASE malah_project;"

# 5. Configure database in .env
# DB_HOST=127.0.0.1
# DB_DATABASE=malah_project
# DB_USERNAME=root
# DB_PASSWORD=your_password

# 6. Run migrations and seeds
php artisan migrate --seed

# 7. Add Midtrans credentials to .env
# MIDTRANS_SERVER_KEY=your_key
# MIDTRANS_CLIENT_KEY=your_key

# 8. Start development servers
npm run dev
```

Visit `http://localhost:8000` 🎉

## 📝 Default Test Credentials

After running `php artisan migrate --seed`, use these accounts for testing:

### Admin Accounts
- **Admin Account**
  - Email: `admin@malahproject.com`
  - Username: `admin`
  - Password: `Admin@12345`

- **Test Admin**
  - Email: `test@malahproject.com`
  - Username: `testadmin`
  - Password: `Test@12345`

### User Accounts
- **John Doe** (Regular User)
  - Email: `user@malahproject.com`
  - Username: `johndoe`
  - Password: `User@12345`

- **Jane Smith** (Regular User)
  - Email: `jane@malahproject.com`
  - Username: `janesmith`
  - Password: `User@12345`

**Note:** You can also login with phone number `081234567890` (John) or `082234567891` (Jane)

⚠️ **Important**: Change all credentials in production!

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed installation and configuration guide
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide (landing page, auth, admin, payments)
- **[MYSQL_SETUP.md](./MYSQL_SETUP.md)** - Complete MySQL setup instructions
- **[API Routes](#api-endpoints)** - API endpoint documentation

## 🌐 Key Routes

### User Routes
- `/` - Landing page with template catalog
- `/login` - User login (email/username/phone)
- `/register` - User registration
- `/dashboard` - User dashboard with subscriptions
- `/dashboard/subscriptions/:id` - Edit invitation content
- `/order/create` - Create new order

### Admin Routes
- `/admin/login` - Admin login (email/username only)
- `/admin/dashboard` - Admin dashboard with statistics

### Public Routes
- `/:subdomain.malahproject.com` - Public invitation website

## 💻 API Endpoints

### Authentication
```
POST   /api/auth/login              # Login with email/username/phone
POST   /api/auth/register           # Register new user
POST   /api/auth/logout             # Logout (requires auth)
GET    /api/auth/me                 # Get current user (requires auth)
```

### Templates
```
GET    /api/templates               # Get all templates with filters
GET    /api/templates/{id}          # Get single template
GET    /api/templates/{id}/demo     # Get template demo URL
```

### Subscriptions & Orders
```
GET    /api/subscriptions           # Get user's subscriptions (requires auth)
POST   /api/subscriptions           # Create new subscription (requires auth)
GET    /api/subscriptions/{id}      # Get subscription details (requires auth)
POST   /api/subscriptions/check-subdomain  # Check subdomain availability
GET    /api/subscriptions/{subdomain}      # Get subscription by subdomain (public)
```

### Invitations (CMS)
```
GET    /api/subscriptions/{id}/invitation      # Get invitation data (requires auth)
PUT    /api/subscriptions/{id}/invitation      # Update invitation data (requires auth)
GET    /api/invitations/{subdomain}            # Get invitation preview (public)
```

### Payments
```
GET    /api/transactions            # Get user's transactions (requires auth)
POST   /api/transactions/initiate   # Initiate payment (requires auth)
GET    /api/transactions/{id}       # Get transaction details (requires auth)
POST   /api/webhooks/midtrans       # Midtrans webhook (public, signature verified)
```

### Admin (requires admin auth)
```
GET    /api/admin/stats             # Dashboard statistics
GET    /api/admin/users             # List all users
GET    /api/admin/users/{id}        # Get user details
POST   /api/admin/users/{id}/suspend # Suspend user
GET    /api/admin/templates         # List all templates
POST   /api/admin/templates         # Create template
GET    /api/admin/transactions      # List all transactions
```

## 🔐 Security Features

- ✅ Multi-credential authentication (email/username/phone)
- ✅ Token-based API authentication (Sanctum)
- ✅ Password hashing with bcrypt
- ✅ Authorization policies for role-based access
- ✅ Midtrans signature verification for payments
- ✅ CSRF protection
- ✅ SQL injection prevention via ORM

## 📱 Responsive Design

All pages are fully responsive:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)

## ⚙️ Configuration Management

The application uses a database-driven configuration system that allows dynamic settings without redeployment.

### AppConfig Features
- Logo and branding settings
- Color customization
- Contact information
- Social media links
- Application settings

### Update Configuration

**SQL Update:**
```sql
UPDATE app_config SET value = 'Your Logo URL' WHERE key = 'logo_url';
```

**PHP Code:**
```php
use App\Services\ConfigService;
ConfigService::set('logo_url', 'https://example.com/logo.png');
ConfigService::get('logo_url'); // Get value
```

For detailed configuration management, see [SETUP.md](./SETUP.md#database-configuration-system)

## 🌐 Subdomain Management

### Local Development
Add to `/etc/hosts` (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 malahproject.local
127.0.0.1 romeojuliet.malahproject.local
```

Access: `http://romeojuliet.malahproject.local:8000`

### Production
1. Add wildcard DNS: `*.malahproject.com A your.server.ip`
2. Configure SSL for `*.malahproject.com`
3. Update `.env` with production Midtrans keys

## 📊 Admin Dashboard

**Statistics Tab**
- Total active users
- Active subscriptions
- Pending orders
- Monthly transactions
- Monthly revenue
- Total templates

**User Management Tab**
- View all users with subscription counts
- Suspend users
- View user details and subscription history

## 🛠 Development

```bash
# Run tests (when configured)
php artisan test

# Build for production
npm run build

# Format code
php artisan pint

# Database commands
php artisan migrate              # Run migrations
php artisan migrate:rollback    # Rollback last migration
php artisan migrate:fresh --seed # Reset with seeds
php artisan db:seed             # Run all seeders
```

## 📦 Deployment

See [SETUP.md](./SETUP.md) "Next Steps for Production" section for:
- Security checklist
- Performance optimization
- Monitoring setup
- CI/CD configuration
- SSL/HTTPS setup
- Database backup strategy

## 🐛 Troubleshooting

### Common Issues

**Connection to MySQL failed**
```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check .env database credentials
cat .env | grep DB_
```

**Vite assets not loading**
```bash
npm run build
```

**Migrations fail**
```bash
php artisan migrate:fresh --seed
```

**Auth token not working**
- Verify token is stored in localStorage
- Check Sanctum configuration in `.env`
- Ensure `Authorization: Bearer {token}` header is sent

See [SETUP.md](./SETUP.md) for more troubleshooting tips.

## 📖 Documentation Links

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)
- [Midtrans Documentation](https://docs.midtrans.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📄 License

This project is proprietary software. Unauthorized copying or distribution is prohibited.

## 👨‍💻 Support

For issues, questions, or contributions, please contact the development team.

---

**Ready to launch your wedding invitation business?** Start with the [Quick Start](#-quick-start) section above! 🚀
