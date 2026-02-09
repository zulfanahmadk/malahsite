# 📋 Panduan Testing MaLah Project

## Penjelasan Singkat Sistem

MaLah adalah platform digital wedding invitation. Sistem memiliki 2 tipe pengguna:
- **User** (Pengguna biasa) - Membuat dan mengelola undangan
- **Admin** (Administrator) - Mengelola templates, users, dan konfigurasi sistem

---

## 🔐 Akun Testing yang Tersedia

### Admin Accounts (Sudah dibuat otomatis)

| Username | Email | Password | Role |
|----------|-------|----------|------|
| `admin` | admin@malahproject.com | Admin@12345 | Admin |
| `testadmin` | test@malahproject.com | Test@12345 | Admin |

### User Account (Buat Manual)

Anda bisa registrasi user baru dengan mengklik **"Buat Undangan Sekarang"** atau pergi ke `/register`

**Contoh data user:**
- Nama: Budi Santoso
- Username: budisantoso
- Email: budi@example.com
- No. Telepon: 081234567890
- Password: Budi@123456 (minimal 8 karakter)

---

## 🚀 Cara Testing

### A. Testing User (Pengguna Biasa)

#### Step 1: Register User Baru
1. Buka halaman http://127.0.0.1:8000/
2. Klik tombol **"Buat Undangan Sekarang"** atau akses `/register`
3. Isi form dengan data:
   ```
   Nama: Budi Santoso
   Username: budisantoso
   Email: budi@example.com
   Telepon: 081234567890
   Password: Budi@123456
   Konfirmasi Password: Budi@123456
   ```
4. Klik **Register**
5. Anda akan otomatis login dan diarahkan ke `/dashboard`

#### Step 2: Explore User Dashboard
- Setelah login, Anda akan berada di halaman `/dashboard`
- Di sini user bisa:
  - Melihat template yang tersedia
  - Membeli/berlangganan template
  - Melihat invoice dan riwayat pembayaran
  - Mengelola undangan mereka

#### Step 3: Logout
- Klik menu di atas (biasanya ada dropdown user)
- Pilih **Logout**
- Akan diarahkan ke `/login`

---

### B. Testing Admin

#### Step 1: Login sebagai Admin
1. Buka halaman http://127.0.0.1:8000/
2. Klik tombol **"Login"** atau akses `/login`
3. Login dengan menggunakan salah satu akun admin:
   ```
   Identifier: admin (atau email: admin@malahproject.com)
   Password: Admin@12345
   ```
4. Klik **Login**
5. Anda akan diarahkan ke `/admin/dashboard`

#### Step 2: Explore Admin Dashboard
- Di Admin Dashboard, admin bisa:
  - Melihat statistik platform (users, templates, pendapatan)
  - Mengelola users
  - Mengelola templates
  - Melihat transactions & payments
  - Konfigurasi sistem (branding, warna, logo, dll)

#### Step 3: Test Admin Features
Fitur-fitur yang bisa ditest:
- **User Management**: Lihat, edit, hapus user
- **Template Management**: Tambah, edit, hapus template
- **Subscription Management**: Lihat riwayat berlangganan user
- **Payment Management**: Lihat dan kelola pembayaran
- **System Config**: Ubah branding, warna, logo aplikasi

---

## 🔄 Cara Login Manual (API Testing)

Jika ingin test via API atau form manual:

### Login User/Admin
```
POST /login
Content-Type: application/x-www-form-urlencoded

identifier=budisantoso&password=Budi@123456
```

**Response (jika berhasil):**
```json
{
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "user_type": "user"
  },
  "token": "xxx",
  "message": "Login berhasil",
  "redirect": "/dashboard"
}
```

### Register User Baru
```
POST /register
Content-Type: application/x-www-form-urlencoded

name=Budi Santoso&username=budisantoso&email=budi@example.com&phone=081234567890&password=Budi@123456&password_confirmation=Budi@123456
```

### Logout
```
POST /logout
Authorization: Bearer {token}
```

---

## 📝 Identifikasi Login

Sistem login bisa menggunakan 3 cara:
1. **Email**: `budi@example.com`
2. **Username**: `budisantoso`
3. **Nomor Telepon**: `081234567890` (dengan format 0 atau 62)

Contoh:
```
Semua ini valid untuk login:
- admin (username)
- admin@malahproject.com (email)
- tidak ada phone untuk admin di contoh
```

---

## 🛡️ Perbedaan User vs Admin

| Fitur | User | Admin |
|-------|------|-------|
| Login | ✅ Bisa | ✅ Bisa |
| Lihat Templates | ✅ Bisa | ✅ Bisa |
| Beli Template | ✅ Bisa | ❌ Tidak |
| Dashboard User | ✅ Punya | ❌ Tidak |
| Dashboard Admin | ❌ Tidak | ✅ Punya |
| Kelola Users | ❌ Tidak | ✅ Punya |
| Kelola Templates | ❌ Tidak | ✅ Punya |
| Lihat Laporan | ❌ Tidak | ✅ Punya |

---

## 🧪 Testing Checklist

### User Flow
- [ ] Registrasi user baru
- [ ] Login dengan username
- [ ] Login dengan email
- [ ] Login dengan nomor telepon
- [ ] Akses dashboard
- [ ] Lihat templates
- [ ] Logout

### Admin Flow
- [ ] Login admin dengan username
- [ ] Login admin dengan email
- [ ] Akses admin dashboard
- [ ] Cek statistik
- [ ] Lihat daftar users
- [ ] Lihat daftar templates
- [ ] Lihat transaksi/pembayaran
- [ ] Logout

### Edge Cases
- [ ] Login dengan password salah
- [ ] Login dengan email yang belum registrasi
- [ ] Klik logout dan cek session hilang
- [ ] Admin tidak bisa login ke user dashboard
- [ ] User tidak bisa akses /admin/dashboard

---

## 🔗 Route Testing

| URL | Akses | Keterangan |
|-----|-------|-----------|
| `/` | Public | Halaman utama & templates |
| `/login` | Public | Login user/admin |
| `/register` | Public | Registrasi user baru |
| `/dashboard` | Auth User | Dashboard pengguna |
| `/admin/login` | Public | Login admin (opsional) |
| `/admin/dashboard` | Auth Admin | Dashboard admin |
| `/logout` | Auth | Logout |
| `/auth/me` | Auth | Get current user data |

---

## 💡 Tips Testing

1. **Gunakan Email yang Berbeda** - Jangan register dengan email yang sudah digunakan
2. **Password Minimal 8 Karakter** - Pastikan password minimal 8 karakter saat registrasi
3. **Format Telepon** - Mulai dengan 0 atau 62, contoh: 081234567890 atau 6281234567890
4. **Admin Check** - Jika login admin tapi diarahkan ke user dashboard, ada bug
5. **Session Timeout** - Default session 120 menit, setelah itu harus login ulang

---

## 🐛 Troubleshooting

### Login Tidak Bisa
- Cek apakah email/username ada di database
- Cek password benar
- Cek format nomor telepon jika menggunakan phone

### Admin Tidak Bisa Akses `/admin/dashboard`
- Pastikan user memiliki `user_type = 'admin'`
- Cek di database: `SELECT * FROM users WHERE user_type = 'admin';`

### Session Tidak Tersimpan
- Cek `.env` session driver: `SESSION_DRIVER=file`
- Cek folder `storage/framework/sessions` punya permission write
- Clear browser cookies dan coba lagi

---

**Dibuat untuk:** MaLah Project (Digital Wedding Invitation Platform)  
**Terakhir Update:** 2024
