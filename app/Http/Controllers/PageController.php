<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function welcome()
    {
        return Inertia::render('Welcome', [
            'templates' => [],
        ]);
    }

    public function login()
    {
        return Inertia::render('Login');
    }

    public function register()
    {
        return Inertia::render('Register');
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->user_type === 'admin') {
            return redirect('/');
        }
        return Inertia::render('Dashboard/Index');
    }

    public function subscriptionDetail(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->user_type === 'admin') {
            return redirect('/');
        }
        return Inertia::render('Dashboard/Subscription', [
            'subscriptionId' => $id,
        ]);
    }
}
