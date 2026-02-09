# Payment Flow Debug Guide

## 🔴 Known Issues & Solutions

### 1. CORS Error dengan Midtrans Snap.js
**Error:** 
```
Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://app.sandbox.midtrans.com') does not match the recipient window's origin ('http://127.0.0.1:8000').
```

**Penyebab:** Midtrans sandbox menggunakan HTTPS, sementara localhost development menggunakan HTTP.

**Solusi:**
- ✅ Tetap gunakan http://127.0.0.1:8000 (tidak perlu SSL untuk dev)
- ✅ Midtrans akan handle cross-origin issue secara otomatis dalam sandbox
- ✅ Snap.js akan tetap membuka popup pembayaran meski ada warning ini
- ✅ Flow akan continue ke `/payment/finish` untuk check status

### 2. Auto-Redirect Lambat
**Penyebab:** Polling interval terlalu lama atau webhook delay.

**Solusi yang sudah diterapkan:**
- ✅ Reduced initial check delay dari 800ms → 300ms
- ✅ Faster polling intervals: 500ms, 1000ms, 1500ms (bukan 2000ms, 3000ms)
- ✅ Max 30 attempts (~30-45 detik sebelum timeout)
- ✅ Better logging untuk track status check

### 3. Status Tidak Terupdate
**Penyebab:** 
- Webhook dari Midtrans belum diterima
- Frontend polling tidak detect status update
- Database transaction/subscription belum sync

**Solusi yang sudah diterapkan:**
- ✅ Endpoint akan query Midtrans API langsung jika transaction masih pending
- ✅ Auto-update transaction + subscription status ke 'active'
- ✅ Refresh data dari database setelah update
- ✅ Better error handling dan retry logic

## 🧪 Cara Testing Payment Flow

### Offline Test (Tanpa Midtrans)

Untuk test tanpa actual payment:

```bash
# Buka Laravel Tinker
php artisan tinker

# Cari subscription yang pending
$sub = App\Models\Subscription::find(1);
$sub->status; // Should be 'pending'

# Cari transaction-nya
$trans = $sub->transactions->first();
$trans->status; // Should be 'pending'

# Simulate payment success
$trans->update(['status' => 'paid', 'paid_at' => now()]);
$sub->update(['status' => 'active', 'activated_at' => now()]);

# Check
$sub->fresh()->status; // Should be 'active'
```

### Midtrans Sandbox Test

1. **Setup Midtrans Credentials** (di `.env`):
   ```
   MIDTRANS_SERVER_KEY=your_server_key
   MIDTRANS_CLIENT_KEY=your_client_key
   MIDTRANS_IS_PRODUCTION=false
   ```

2. **Test Card Numbers** (di Midtrans Dashboard):
   - Visa: 4011 1111 1111 1112
   - Mastercard: 5555 5555 5555 4444
   - Digunakan dengan tanggal/CVV apapun di sandbox

3. **Payment Flow**:
   - Create order → pilih template → cek subdomain
   - Proceed to payment → masuk Snap
   - Gunakan card sandbox → complete payment
   - Observe polling status check (lihat console)
   - Should redirect ke config page setelah ~2-5 detik

## 📊 Debugging Steps

### 1. Check Laravel Logs
```bash
# Real-time logs
tail -f storage/logs/laravel.log

# Filter payment-related logs
tail -f storage/logs/laravel.log | grep -i payment
```

### 2. Check Browser Console
- Open DevTools (F12)
- Console tab untuk lihat `[Payment]` logs
- Network tab untuk check API calls ke `/api/subscriptions/{id}/status`

### 3. Check Database Status

```bash
# Laravel Tinker
php artisan tinker

# Check subscription
$sub = App\Models\Subscription::find(1);
echo "Status: {$sub->status}, Activated: {$sub->activated_at}";

# Check transaction
$trans = $sub->transactions->first();
echo "Status: {$trans->status}, Paid: {$trans->paid_at}";

# Check invitation data
$inv = $sub->invitationData;
echo "Has invitation data: " . ($inv ? 'Yes' : 'No');
```

### 4. Check Webhook Logs

Buka file: `storage/logs/laravel.log`

Cari pattern:
```
[Midtrans Webhook RECEIVED]
[Midtrans Webhook signature VALID]
[Transaction marked as PAID via webhook]
```

Jika tidak ada, webhook belum diterima dari Midtrans.

## 🔧 Configuration Checklist

- [ ] `.env` memiliki MIDTRANS_SERVER_KEY
- [ ] `.env` memiliki MIDTRANS_CLIENT_KEY  
- [ ] `.env` MIDTRANS_IS_PRODUCTION=false (untuk testing)
- [ ] App URL di `.env` App correct: `APP_URL=http://127.0.0.1:8000`
- [ ] Webhook endpoint registered di Midtrans Dashboard
- [ ] Database sudah di-migrate

## 📱 Expected Behavior

### Happy Path (Semua berjalan normal):
```
1. User bayar di Snap popup
   ↓
2. Snap popup tertutup (berhasil/gagal/pending)
   ↓
3. Redirect ke /payment/finish
   ↓
4. Start polling status check (setiap 500ms-1500ms)
   ↓
5. Dalam 2-15 detik, status update ke 'active'
   ↓
6. Auto-redirect ke /dashboard/subscriptions/{id}
   ↓
7. User bisa langsung setup konfigurasi
```

### Fallback Path (Jika webhook delayed):
```
1. Polling tidak detect status active di webhook-updated DB
   ↓
2. Endpoint query Midtrans API langsung
   ↓
3. Midtrans API respond dengan status 'settlement'/'capture'
   ↓
4. Endpoint update DB + refresh
   ↓
5. Next polling cycle detect status active
   ↓
6. Auto-redirect
```

### Manual Check:
```
1. User stuck di payment checking page
   ↓
2. Click "Refresh Halaman" atau "Ke Dashboard"
   ↓
3. Manual check subscription status di dashboard
   ↓
4. Klik "Kelola" untuk masuk config page
   ↓
5. Setup konfigurasi
```

## 🚀 Performance Expectations

| Scenario | Expected Time |
|----------|----------------|
| Payment sukses (normal) | 2-5 detik |
| Payment sukses (webhook delay) | 10-15 detik |
| Network slow | 20-30 detik |
| Max timeout | ~45 detik |

Jika lebih dari 45 detik, akan redirect ke dashboard dengan notif error.

## 💡 Tips

1. **Development**: Selalu buka DevTools Console untuk debug logs
2. **Testing**: Gunakan card sandbox Midtrans, jangan card real
3. **Logs**: Check `storage/logs/laravel.log` untuk backend logs
4. **Database**: Use Tinker untuk quick check subscription status
5. **Refresh**: Jika stuck, klik "Refresh Halaman" dulu sebelum "Ke Dashboard"

---

**Last Updated:** 2026-02-08
