<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Seed the application's singleton settings row.
     */
    public function run(): void
    {
        Setting::query()->updateOrCreate(
            ['id' => 1],
            [
                'brand_name' => 'JMC Pundasyon',
                'tagline' => 'Sign in to manage accounting business process from products, suppliers, customers, inventory, and more.',
                'default_currency' => 'PHP',
            ],
        );
    }
}
