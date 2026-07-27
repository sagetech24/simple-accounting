<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_update_settings(): void
    {
        $this->put(route('settings.update'), [
            'brand_name' => 'Updated Brand',
            'tagline' => 'Updated tagline',
            'default_currency' => 'USD',
        ])->assertRedirect(route('login'));
    }

    public function test_login_page_shares_application_settings(): void
    {
        Setting::query()->create([
            'brand_name' => 'Acme Books',
            'tagline' => 'Manage your books with ease.',
            'default_currency' => 'USD',
        ]);

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/login')
                ->where('settings.brand_name', 'Acme Books')
                ->where('settings.tagline', 'Manage your books with ease.')
                ->where('settings.default_currency', 'USD')
                ->where('settings.currency_locale', 'en-US')
                ->has('currencyOptions')
            );
    }

    public function test_authenticated_users_can_update_settings(): void
    {
        $admin = User::factory()->create();
        Setting::query()->create([
            'brand_name' => 'JMC Pundasyon',
            'tagline' => 'Original tagline',
            'default_currency' => 'PHP',
        ]);

        $this->actingAs($admin)
            ->from(route('products'))
            ->put(route('settings.update'), [
                'brand_name' => 'New Brand',
                'tagline' => 'New tagline',
                'default_currency' => 'USD',
            ])
            ->assertRedirect(route('products'));

        $this->assertDatabaseHas('settings', [
            'brand_name' => 'New Brand',
            'tagline' => 'New tagline',
            'default_currency' => 'USD',
        ]);
    }

    public function test_settings_update_requires_valid_currency(): void
    {
        $admin = User::factory()->create();
        Setting::query()->create([
            'brand_name' => 'JMC Pundasyon',
            'tagline' => null,
            'default_currency' => 'PHP',
        ]);

        $this->actingAs($admin)
            ->from(route('products'))
            ->put(route('settings.update'), [
                'brand_name' => 'JMC Pundasyon',
                'tagline' => null,
                'default_currency' => 'ZZZ',
            ])
            ->assertSessionHasErrors('default_currency');
    }
}
