<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Response;

class AccountsController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'tab' => ['nullable', 'string', Rule::in(['accounts-payable'])],
        ]);

        return app(AccountsPayableController::class)->index($request);
    }
}
