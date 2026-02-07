# Testing Guide - MaLah Wedding Platform

## Ringkasan Perbaikan yang Telah Dilakukan

### 1. **User Model (app/Models/User.php)**
**Masalah:** Trait `HasApiTokens` hilang dan `casts` didefinisikan sebagai method
**Perbaikan:** 
- Menambahkan import `use Laravel\Sanctum\HasApiTokens;`
- Mengubah `protected function casts()` menjadi `protected $casts` (property)
- Menambahkan trait ke User model

**Testing Point:** 
```
✓ Token creation saat login berhasil: $user->createToken('auth_token')->plainTextToken
✓ Password hashing otomatis bekerja saat create user baru
✓ email_verified_at casting sebagai datetime bekerja
```

---

### 2. **InvitationData Model (app/Models/InvitationData.php)**
**Masalah:** Table name tidak sesuai - Laravel mengharapkan `invitation_datas` (plural) tapi migration membuat `invitation_data` (singular)
**Perbaikan:** 
- Menambahkan `protected $table = 'invitation_data';` di model

**Testing Point:**
```
✓ Query ke table invitation_data berhasil (tidak mencari invitation_datas)
✓ Relationship $subscription->invitationData() bekerja tanpa SQL error
✓ Casting untuk photo_gallery dan wedding_info sebagai JSON berfungsi
```

---

### 3. **AppConfig Model & Middleware (app/Models/AppConfig.php, app/Http/Middleware/HandleInertiaRequests.php)**
**Masalah:** Middleware memanggil `AppConfig::get()` tapi model hanya punya method `getValue()`
**Perbaikan:** 
- Mengubah semua `AppConfig::get()` menjadi `AppConfig::getValue()` di middleware

**Testing Point:**
```
✓ Branding config dari database berhasil diload
✓ Middleware tidak throw "undefined method" error
✓ Fallback ke config('branding', []) bekerja jika database tidak accessible
✓ Props Inertia menerima branding data dengan benar
```

---

### 4. **Database Config (config/database.php)**
**Masalah:** `migrations` key didefinisikan sebagai array, Laravel mengharapkan string
**Perbaikan:** 
- Mengubah dari `'migrations' => ['table' => 'migrations', ...]` menjadi `'migrations' => 'migrations'`

**Testing Point:**
```
✓ Command 'php artisan migrate' berjalan tanpa config error
✓ Migration table (migrations) terbuat dengan benar di database
✓ Tracking migration history bekerja normal
```

---

### 5. **Composer.json Dependencies**
**Masalah:** Missing laravel/sanctum dan midtrans/midtrans; Laravel version tidak valid
**Perbaikan:** 
- Mengubah `laravel/framework: ^12.0` → `^11.0` (versi yang real)
- Menambahkan `"laravel/sanctum": "^4.0"`
- Menambahkan `"midtrans/midtrans": "^1.2"`

**Testing Point:**
```
✓ Sanctum middleware 'auth:sanctum' tersedia di routes
✓ Token creation dan verification bekerja
✓ Midtrans Snap API tersedia untuk payment gateway
✓ composer install berhasil tanpa error
```

---

### 6. **Package.json Frontend Dependencies**
**Masalah:** React ^19.x dan Tailwind ^4.0 tidak ada / belum release stable
**Perbaikan:** 
- Mengubah `react: ^19.2.4` → `^18.2.0`
- Mengubah `tailwindcss: ^4.0.0` → `^3.4.0`
- Menghapus duplikasi Vite React plugin (hapus @vitejs/plugin-react-swc)
- Menambahkan `postcss` untuk Tailwind
- Update react-router-dom ke ^6.26.0

**Testing Point:**
```
✓ npm install berhasil tanpa version conflict
✓ React components render dengan benar
✓ Tailwind CSS classes diterapkan dengan baik
✓ Vite dev server berjalan normal
```

---

## Testing Checklist

### A. Unit Testing - Database & Models

#### Test User Model
```bash
php artisan test --filter=UserTest
```

**Test cases yang harus dijalankan:**
- ✓ User dapat membuat token dengan createToken()
- ✓ Password hashing otomatis saat save
- ✓ email_verified_at dicasting sebagai Carbon datetime
- ✓ User dapat mempunyai banyak subscriptions

**Verifikasi manual:**
```php
// Di tinker (php artisan tinker)
$user = User::create([
    'name' => 'Test User',
    'email' => 'test@example.com',
    'username' => 'testuser',
    'password' => 'plaintext123',
]);

// Cek token creation
$token = $user->createToken('auth_token')->plainTextToken;
// Harus output: token string (tidak error)

// Cek password hashing
echo $user->password; // Harus hashed (bcrypt), bukan plaintext
```

---

#### Test InvitationData Model
```bash
php artisan test --filter=InvitationDataTest
```

**Test cases yang harus dijalankan:**
- ✓ Query ke invitation_data table berhasil
- ✓ Relationship dengan Subscription bekerja
- ✓ JSON casting untuk photo_gallery dan wedding_info

**Verifikasi manual:**
```php
// Di tinker
$invitation = InvitationData::first();
// Harus return data, bukan "table not found" error

$subscription = $invitation->subscription;
// Harus load subscription dengan benar

// Test JSON casting
echo gettype($invitation->photo_gallery); // Harus array, bukan string
```

---

#### Test AppConfig Model
```bash
php artisan test --filter=AppConfigTest
```

**Test cases yang harus dijalankan:**
- ✓ AppConfig::getValue('key') mengembalikan nilai atau default
- ✓ AppConfig::setValue() menyimpan/update config ke database
- ✓ getAllConfig() mengembalikan array semua config

**Verifikasi manual:**
```php
// Di tinker
AppConfig::setValue('test_key', 'test_value');
echo AppConfig::getValue('test_key'); // Harus output: test_value

echo AppConfig::getValue('non_existent', 'default_value'); // Harus: default_value
```

---

### B. Feature Testing - Authentication & API

#### Test User Registration
```bash
php artisan test --filter=AuthenticationTest::register
```

**Manual testing:**
1. Buka `/register` di browser
2. Isi form dengan data valid:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Username: "johndoe"
   - Phone: "+6281234567890"
   - Password: "password123"
3. Klik Register
4. Verifikasi:
   - ✓ User berhasil terdaftar
   - ✓ Redirect ke dashboard/home
   - ✓ Session user terisi dengan data yang benar

---

#### Test User Login & Token

**Test Case 1: Regular User Login**

Manual testing:
1. Buka `http://localhost:8000/login`
2. Login dengan kredensial:
   - **Option A - Email**: `user@malahproject.com` / Password: `User@12345`
   - **Option B - Username**: `johndoe` / Password: `User@12345`
   - **Option C - Phone**: `081234567890` / Password: `User@12345`
3. Verifikasi:
   - ✓ Login berhasil
   - ✓ Token Sanctum dibuat dan disimpan di localStorage
   - ✓ Redirect ke dashboard atau home page
   - ✓ Navigation menampilkan username "John Doe"
   - ✓ User dapat akses protected routes (/dashboard, /subscriptions, dll)

**Test Case 2: Admin Login**

Manual testing:
1. Buka `http://localhost:8000/login`
2. Login dengan kredensial admin:
   - **Email**: `admin@malahproject.com` / Password: `Admin@12345`
   - **Username**: `admin` / Password: `Admin@12345`
   - (Note: Admin cannot login with phone number)
3. Verifikasi:
   - ✓ Admin login berhasil
   - ✓ Token dibuat dengan proper admin privileges
   - ✓ Redirect ke admin dashboard
   - ✓ Navigation menampilkan "Admin MaLah"
   - ✓ Admin dapat akses `/admin` routes
   - ✓ Admin dapat view user management, templates, transactions

**API Testing with cURL**:
```bash
# Test regular user login with email
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@malahproject.com",
    "password": "User@12345"
  }'

# Test regular user login with username
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "johndoe",
    "password": "User@12345"
  }'

# Test regular user login with phone
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "081234567890",
    "password": "User@12345"
  }'

# Test admin login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@malahproject.com",
    "password": "Admin@12345"
  }'

# Expected response for all:
# {
#   "token": "plain_text_token_here",
#   "user": {
#     "id": 1,
#     "name": "John Doe",
#     "email": "user@malahproject.com",
#     "username": "johndoe",
#     "user_type": "user",
#     ...
#   }
# }
```

**Test Case 3: Invalid Credentials**

1. Try logging in dengan:
   - Wrong password
   - Non-existent email/username
   - Empty fields
2. Verifikasi:
   - ✓ Error message muncul: "The provided credentials are invalid"
   - ✓ Tidak ada token dibuat
   - ✓ User tetap di login page

**Bash testing**:
```bash
php artisan test --filter=AuthenticationTest::login
```

---

#### Test API Authentication
```bash
php artisan test --filter=ApiAuthenticationTest
```

**cURL test untuk API:**
```bash
# Test POST login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Expected response:
# {"token":"plain_text_token_here","user":{...}}
```

---

### C. Feature Testing - Subscriptions & Payment

#### Test Subscription Creation
```bash
php artisan test --filter=SubscriptionTest
```

**Manual testing:**
1. Login sebagai user yang sudah terdaftar
2. Buat subscription/template baru
3. Verifikasi:
   - ✓ Subscription terbuat dengan status 'active'
   - ✓ expired_at date dihitung dengan benar
   - ✓ isActive() method return true untuk active subscription

**Verifikasi di database:**
```php
// Di tinker
$subscription = Subscription::latest()->first();
echo $subscription->isActive(); // Harus: true
echo $subscription->expired_at; // Harus: future date
```

---

#### Test Payment Gateway (Midtrans)
```bash
php artisan test --filter=PaymentTest
```

**Manual testing:**
1. Pastikan Midtrans credentials sudah di-set di .env:
   ```
   MIDTRANS_SERVER_KEY=your_server_key
   MIDTRANS_CLIENT_KEY=your_client_key
   ```

2. Initiate payment flow:
   ```bash
   curl -X POST http://localhost:8000/api/payments \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"subscription_id":1,"amount":500000}'
   ```

3. Verifikasi:
   - ✓ Response berisi snap_token
   - ✓ Transaction terbuat di database dengan status pending
   - ✓ Snap token dapat digunakan untuk Midtrans popup

---

#### Test Webhook Payment
```bash
# Simulate webhook dari Midtrans (harus signed dengan server key)
curl -X POST http://localhost:8000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id":"123456",
    "order_id":"ORDER-1",
    "payment_type":"credit_card",
    "transaction_status":"settlement",
    "transaction_time":"2024-02-06 10:00:00",
    "gross_amount":"500000"
  }'
```

**Verifikasi:**
- ✓ Webhook signature diverifikasi
- ✓ Transaction status diupdate ke 'paid'
- ✓ Subscription status berubah menjadi 'active'

---

### D. Feature Testing - Invitations & Rendering

#### Test Invitation Data
```bash
php artisan test --filter=InvitationDataTest
```

**Manual testing:**
1. Login sebagai user dengan subscription
2. Lengkapi InvitationData:
   - Bride & Groom names
   - Event date dan ceremony time
   - Locations
   - Love story
   - Photo gallery (JSON)
3. Save
4. Verifikasi:
   - ✓ Data tersimpan dengan benar
   - ✓ JSON fields terdecode dengan baik

---

#### Test Invitation Rendering via Subdomain
```bash
# Asumsikan user membuat sub-domain "john-jane.malah.local"
curl http://john-jane.malah.local
```

**Manual testing:**
1. Buka `https://customdomain.malah.local` (sesuai dengan subdomain yang dibuat)
2. Verifikasi:
   - ✓ Invitation page render dengan benar
   - ✓ Bride/groom names tampil
   - ✓ Event date dan ceremony time tampil
   - ✓ Photo gallery load dengan benar
   - ✓ Styling Tailwind diterapkan

**Verifikasi di code:**
```php
// Di SubdomainController
$invitationData = $subscription->invitationData; // Harus load
// Pastikan tidak ada N+1 query problem
```

---

### E. Feature Testing - Admin & Configuration

#### Test Admin Panel
```bash
# Login sebagai admin
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Manual testing:**
1. Login sebagai admin user
2. Akses `/admin` path
3. Verifikasi:
   - ✓ Admin dashboard tampil
   - ✓ Dapat view/manage users
   - ✓ Dapat view/manage subscriptions
   - ✓ Dapat manage configuration (branding, colors, contact)

---

#### Test App Configuration
```bash
# Verify branding config passed ke Inertia
curl http://localhost:8000 \
  -H "Accept: application/json"
```

**Verifikasi:**
```php
// Di tinker
// Cek bahwa branding config tersedia
AppConfig::setValue('logo_url', 'https://example.com/logo.png');
AppConfig::setValue('logo_text', 'MaLah');
AppConfig::setValue('primary_color', '#9333ea');

// Reload halaman dan verifikasi Inertia props
```

---

### F. Database Testing

#### Test Migrations
```bash
# Fresh migration
php artisan migrate:fresh

# Verifikasi semua tables terbuat
php artisan migrate:status

# Expected output:
# Batch | Migration | Batch Time
# ...
# 1     | create_users_table | timestamp
# 1     | create_templates_table | timestamp
# 1     | create_subscriptions_table | timestamp
# 1     | create_invitation_data_table | timestamp
# 1     | create_app_config_table | timestamp
```

---

#### Test Seeding
```bash
php artisan migrate:fresh --seed

# Verifikasi data terseed dengan benar
php artisan tinker
```

```php
// Verifikasi admin user
$admin = User::where('user_type', 'admin')->first();
echo $admin->email; // Harus: admin@example.com

// Verifikasi app config
$logo = AppConfig::getValue('logo_url');
echo $logo; // Harus punya nilai

// Verifikasi templates
$templates = Template::count();
echo $templates; // Harus > 0
```

---

### G. Frontend Testing

#### Test React Components
```bash
npm run dev
```

**Manual testing:**
1. Buka http://localhost:5173 (atau port yang ditunjukkan)
2. Verifikasi:
   - ✓ Navigation component render
   - ✓ Login/Register pages load dengan benar
   - ✓ Form validation bekerja
   - ✓ Error messages tampil dengan baik
   - ✓ Inertia props tersedia di components

---

#### Test Tailwind CSS
```bash
# Check jika CSS file generate dengan benar
npm run build
```

**Verifikasi:**
- ✓ Semua Tailwind classes diterapkan dengan benar
- ✓ Responsive design bekerja (coba resize browser)
- ✓ Dark mode (jika ada) berfungsi dengan baik

---

### H. Security Testing

#### Test Authorization Gates
```bash
php artisan test --filter=AuthorizationTest
```

**Manual testing:**
1. Login sebagai non-admin user
2. Coba akses `/admin`
3. Verifikasi:
   - ✓ Mendapat 403 Forbidden
   - ✓ Tidak dapat modify subscriptions milik user lain

---

#### Test CSRF Protection
```bash
# Attempt request tanpa CSRF token
curl -X POST http://localhost:8000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

**Verifikasi:**
- ✓ Request ditolak (419 Token Mismatch)
- ✓ CSRF token di-validate dengan benar

---

## Running All Tests

```bash
# Run semua test
php artisan test

# Run dengan coverage report
php artisan test --coverage

# Run hanya unit tests
php artisan test --filter=UnitTest

# Run hanya feature tests
php artisan test --filter=FeatureTest
```

---

## Post-Fix Verification Checklist

Setelah melakukan perbaikan, pastikan hal-hal berikut terverifikasi:

### Installation & Setup
- [ ] `composer install` berjalan tanpa error
- [ ] `npm install` berjalan tanpa error
- [ ] `php artisan migrate` berjalan tanpa error
- [ ] `php artisan db:seed` berjalan tanpa error

### Models & Database
- [ ] User model punya trait HasApiTokens
- [ ] User model casts property-based
- [ ] InvitationData model punya protected $table = 'invitation_data'
- [ ] AppConfig::getValue() dipanggil di middleware (bukan get())
- [ ] Database config migrations adalah string, bukan array

### Authentication & API
- [ ] User dapat register dan login
- [ ] Token creation dengan Sanctum bekerja
- [ ] API endpoints auth:sanctum protected bekerja
- [ ] Login redirect ke correct page

### Payment & Subscriptions
- [ ] Midtrans SDK available (tidak "class not found" error)
- [ ] Payment token generation bekerja
- [ ] Webhook verification berfungsi
- [ ] Transaction status update pada settlement

### Frontend
- [ ] React 18 components render dengan benar
- [ ] Tailwind CSS ^3.4.0 style applied properly
- [ ] Inertia props tersedia di semua pages
- [ ] Forms validation bekerja

### Config & Branding
- [ ] AppConfig branding values loaded dari database
- [ ] Fallback ke config bekerja jika database down
- [ ] Logo, colors, contact info tampil di frontend

---

## Common Issues & Solutions

### Issue: "Class not found Midtrans\Config"
**Solution:** Jalankan `composer install` dan verifikasi `midtrans/midtrans` di vendor folder

### Issue: "Call to undefined method AppConfig::get()"
**Solution:** Pastikan middleware menggunakan `AppConfig::getValue()` bukan `get()`

### Issue: "Table 'invitation_datas' not found"
**Solution:** Verifikasi InvitationData model punya `protected $table = 'invitation_data';`

### Issue: "Migration configuration expects string"
**Solution:** Verifikasi `config/database.php` migrations key adalah string, bukan array

### Issue: "npm install failed due to React/Tailwind version"
**Solution:** Gunakan React ^18.2.0 dan Tailwind ^3.4.0 (bukan ^19 dan ^4)

---

## Conclusion

Semua error telah diperbaiki. Aplikasi sekarang siap untuk:
1. ✅ Development dengan Laravel 11
2. ✅ API authentication dengan Sanctum
3. ✅ Payment processing dengan Midtrans
4. ✅ Invitation rendering via subdomain
5. ✅ Admin management features
6. ✅ Frontend dengan React 18 + Tailwind CSS 3

Jalankan testing checklist di atas untuk memverifikasi semua sistem berfungsi dengan benar.
