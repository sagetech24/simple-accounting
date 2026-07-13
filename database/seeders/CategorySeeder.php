<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Electronics',
            'Office Supplies',
            'Kitchenware',
            'Hardware',
            'Personal Care',
            'Beverages',
            'Snacks',
            'Cleaning',
            'Stationery',
            'Outdoor',
        ];

        foreach ($categories as $name) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }
    }
}
