<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with email, username, or phone
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'identifier' => 'required|string', // email, username, or phone
            'password' => 'required|string',
        ]);

        // Detect identifier type and find user
        $user = $this->findUserByIdentifier($validated['identifier']);

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['Kredensial yang Anda berikan tidak cocok dengan data kami.'],
            ]);
        }

        // Logic check untuk Admin Login (Jika request datang dari form admin)
        if ($request->header('X-Admin-Login') || $request->is('admin/*')) {
            if (!$user->isAdmin()) {
                throw ValidationException::withMessages([
                    'identifier' => ['Anda tidak memiliki akses administrator.'],
                ]);
            }
        }

        // PENTING: Lakukan login secara Stateful (Session)
        Auth::login($user, $request->boolean('remember'));

        // PENTING: Regenerate session ID untuk keamanan (Cegah Session Fixation)
        $request->session()->regenerate();

        // Tetap buat token untuk fallback API jika dibutuhkan di frontend
        $token = $user->createToken('auth_token')->plainTextToken;

        // Jika request dari Inertia, biasanya akan otomatis redirect. 
        // Jika dari manual axios, kita beri json response.
        if ($request->wantsJson()) {
            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login berhasil',
                'redirect' => $user->isAdmin() ? route('admin.dashboard') : route('dashboard')
            ]);
        }

        return redirect()->intended($user->isAdmin() ? '/admin/dashboard' : '/dashboard');
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|unique:users',
            'phone' => 'required|string|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'user_type' => 'user',
        ]);

        // Langsung login-kan user setelah register
        Auth::login($user);
        $request->session()->regenerate();

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($request->wantsJson()) {
            return response()->json([
                'user' => $user,
                'token' => $token,
            ], 201);
        }

        return redirect('/dashboard');
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // 1. Hapus Token Sanctum (jika ada)
        if ($request->user()) {
            $request->user()->tokens()->delete();
        }

        // 2. Logout Session Web
        Auth::logout();

        // 3. Hancurkan Session
        $request->session()->invalidate();

        // 4. Generate token CSRF baru
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Successfully logged out',
            ]);
        }

        return redirect('/login');
    }

    /**
     * Get current user
     */
    public function currentUser(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Find user by email, username, or phone
     */
    private function findUserByIdentifier(string $identifier): ?User
    {
        // Check if it's an email
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $identifier)->first();
        }

        // Check if it's a phone number (starts with 0 or 62)
        if (preg_match('/^(0|62)\d{7,}$/', $identifier)) {
            return User::where('phone', $identifier)->first();
        }

        // Otherwise treat as username
        return User::where('username', $identifier)->first();
    }
}