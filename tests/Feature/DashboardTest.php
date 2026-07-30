<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_dashboard(): void
    {
        $this->get(route('home'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_see_zero_kpis_when_empty(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->where('kpis.pending_rfqs', 0)
                ->where('kpis.draft_pos', 0)
                ->where('kpis.ordered_pos', 0)
                ->where('kpis.ap_balance_due', '0.00')
                ->where('kpis.low_stock', 0)
                ->where('attention', [])
            );
    }
}
