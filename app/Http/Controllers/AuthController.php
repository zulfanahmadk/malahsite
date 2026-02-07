<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
                'identifier' => ['The provided credentials are invalid.'],
            ]);
        }

        // Check if user is admin trying to login
        if ($request->wantsJson() && $request->header('X-Admin-Login')) {
            if (!$user->isAdmin()) {
                throw ValidationException::withMessages([
                    'identifier' => ['You do not have admin access.'],
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
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
