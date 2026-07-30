<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard/index', [
            'kpis' => [
                'pending_rfqs' => 0,
                'draft_pos' => 0,
                'ordered_pos' => 0,
                'ap_balance_due' => '0.00',
                'low_stock' => 0,
            ],
            'attention' => [],
        ]);
    }
}
