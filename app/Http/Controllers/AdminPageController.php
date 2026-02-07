<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminPageController extends Controller
{
    public function login()
    {
        return Inertia::render('Admin/Login');
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            return redirect('/');
        }

        return Inertia::render('Admin/Dashboard');
    }
}
