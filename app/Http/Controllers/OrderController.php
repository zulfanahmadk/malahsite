<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function create(Request $request)
    {
        return Inertia::render('Order/Create');
    }
}
