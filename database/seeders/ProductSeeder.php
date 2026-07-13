<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::query()->get()->keyBy('slug');

        $catalog = [
            [
                'name' => 'Wireless Mouse Pro',
                'description' => 'Ergonomic wireless mouse with silent clicks and USB-C charging.',
                'quantity' => 42,
                'purchase_price' => 18.50,
                'selling_price' => 34.99,
                'status' => ProductStatus::Available,
                'categories' => ['electronics', 'office-supplies'],
            ],
            [
                'name' => 'Mechanical Keyboard 87',
                'description' => 'Compact tenkeyless keyboard with hot-swappable switches.',
                'quantity' => 18,
                'purchase_price' => 45.00,
                'selling_price' => 79.99,
                'status' => ProductStatus::Available,
                'categories' => ['electronics', 'office-supplies'],
            ],
            [
                'name' => 'USB-C Hub 7-in-1',
                'description' => 'HDMI, Ethernet, SD, and dual USB-A ports for modern laptops.',
                'quantity' => 0,
                'purchase_price' => 22.00,
                'selling_price' => 39.50,
                'status' => ProductStatus::Unavailable,
                'categories' => ['electronics'],
            ],
            [
                'name' => 'A4 Copy Paper Ream',
                'description' => '500 sheets of 80gsm bright white office paper.',
                'quantity' => 120,
                'purchase_price' => 3.25,
                'selling_price' => 5.99,
                'status' => ProductStatus::Available,
                'categories' => ['office-supplies', 'stationery'],
            ],
            [
                'name' => 'Ballpoint Pen Pack',
                'description' => 'Box of 12 smooth-writing black ink pens.',
                'quantity' => 85,
                'purchase_price' => 1.80,
                'selling_price' => 3.49,
                'status' => ProductStatus::Available,
                'categories' => ['stationery', 'office-supplies'],
            ],
            [
                'name' => 'Stainless Steel Bottle 750ml',
                'description' => 'Insulated bottle that keeps drinks cold for 24 hours.',
                'quantity' => 56,
                'purchase_price' => 8.40,
                'selling_price' => 16.99,
                'status' => ProductStatus::Available,
                'categories' => ['kitchenware', 'outdoor', 'beverages'],
            ],
            [
                'name' => 'Ceramic Mug Set',
                'description' => 'Set of four 350ml mugs in matte finish.',
                'quantity' => 24,
                'purchase_price' => 9.00,
                'selling_price' => 18.50,
                'status' => ProductStatus::Available,
                'categories' => ['kitchenware'],
            ],
            [
                'name' => 'Non-Stick Frying Pan 28cm',
                'description' => 'Induction-compatible pan with heat-resistant handle.',
                'quantity' => 11,
                'purchase_price' => 14.75,
                'selling_price' => 27.99,
                'status' => ProductStatus::Available,
                'categories' => ['kitchenware'],
            ],
            [
                'name' => 'Adjustable Wrench 10"',
                'description' => 'Chrome vanadium wrench with metric scale markings.',
                'quantity' => 33,
                'purchase_price' => 6.20,
                'selling_price' => 12.49,
                'status' => ProductStatus::Available,
                'categories' => ['hardware'],
            ],
            [
                'name' => 'Screwdriver Bit Set',
                'description' => '46-piece magnetic bit set for common fasteners.',
                'quantity' => 2,
                'purchase_price' => 7.10,
                'selling_price' => 14.99,
                'status' => ProductStatus::Available,
                'categories' => ['hardware'],
            ],
            [
                'name' => 'LED Work Light',
                'description' => 'Rechargeable clip-on light for workshops and camping.',
                'quantity' => 0,
                'purchase_price' => 11.00,
                'selling_price' => 21.99,
                'status' => ProductStatus::Unavailable,
                'categories' => ['hardware', 'outdoor'],
            ],
            [
                'name' => 'Hand Soap Refill 1L',
                'description' => 'Fragrance-free liquid soap for high-traffic washrooms.',
                'quantity' => 64,
                'purchase_price' => 2.40,
                'selling_price' => 4.75,
                'status' => ProductStatus::Available,
                'categories' => ['personal-care', 'cleaning'],
            ],
            [
                'name' => 'Toothbrush Twin Pack',
                'description' => 'Soft-bristle brushes with angled heads.',
                'quantity' => 90,
                'purchase_price' => 1.15,
                'selling_price' => 2.99,
                'status' => ProductStatus::Available,
                'categories' => ['personal-care'],
            ],
            [
                'name' => 'Sparkling Water 12-Pack',
                'description' => 'Unflavored sparkling water cans, 330ml each.',
                'quantity' => 48,
                'purchase_price' => 4.80,
                'selling_price' => 8.49,
                'status' => ProductStatus::Available,
                'categories' => ['beverages'],
            ],
            [
                'name' => 'Cold Brew Concentrate',
                'description' => '1L bottle — dilute 1:2 for iced coffee.',
                'quantity' => 15,
                'purchase_price' => 6.50,
                'selling_price' => 12.99,
                'status' => ProductStatus::Available,
                'categories' => ['beverages'],
            ],
            [
                'name' => 'Trail Mix Family Size',
                'description' => 'Nuts, raisins, and dark chocolate pieces — 500g bag.',
                'quantity' => 37,
                'purchase_price' => 3.90,
                'selling_price' => 7.25,
                'status' => ProductStatus::Available,
                'categories' => ['snacks', 'outdoor'],
            ],
            [
                'name' => 'Sea Salt Potato Chips',
                'description' => 'Kettle-cooked chips in a 150g share bag.',
                'quantity' => 72,
                'purchase_price' => 0.95,
                'selling_price' => 2.49,
                'status' => ProductStatus::Available,
                'categories' => ['snacks'],
            ],
            [
                'name' => 'All-Purpose Cleaner',
                'description' => 'Plant-based spray for counters and glass — 750ml.',
                'quantity' => 41,
                'purchase_price' => 2.10,
                'selling_price' => 4.99,
                'status' => ProductStatus::Available,
                'categories' => ['cleaning'],
            ],
            [
                'name' => 'Microfiber Cloth Pack',
                'description' => 'Pack of 6 lint-free cloths for dusting and polishing.',
                'quantity' => 55,
                'purchase_price' => 3.00,
                'selling_price' => 6.49,
                'status' => ProductStatus::Available,
                'categories' => ['cleaning'],
            ],
            [
                'name' => 'Spiral Notebook A5',
                'description' => 'Ruled pages with perforated tear-out sheets.',
                'quantity' => 100,
                'purchase_price' => 1.25,
                'selling_price' => 2.99,
                'status' => ProductStatus::Available,
                'categories' => ['stationery'],
            ],
            [
                'name' => 'Highlighter Assortment',
                'description' => 'Four fluorescent colors for marking documents.',
                'quantity' => 60,
                'purchase_price' => 1.60,
                'selling_price' => 3.79,
                'status' => ProductStatus::Available,
                'categories' => ['stationery', 'office-supplies'],
            ],
            [
                'name' => 'Camping Folding Stool',
                'description' => 'Lightweight aluminum frame with carrying strap.',
                'quantity' => 8,
                'purchase_price' => 9.50,
                'selling_price' => 19.99,
                'status' => ProductStatus::Available,
                'categories' => ['outdoor'],
            ],
            [
                'name' => 'Legacy Dot Matrix Ribbon',
                'description' => 'Compatible ribbon cartridge for retired printers.',
                'quantity' => 3,
                'purchase_price' => 4.00,
                'selling_price' => 9.99,
                'status' => ProductStatus::Discontinued,
                'categories' => ['office-supplies', 'electronics'],
            ],
            [
                'name' => 'CRT Monitor Cleaning Kit',
                'description' => 'Antistatic wipes for older display glass.',
                'quantity' => 0,
                'purchase_price' => 2.50,
                'selling_price' => 5.99,
                'status' => ProductStatus::Discontinued,
                'categories' => ['electronics', 'cleaning'],
            ],
            [
                'name' => 'Desk Organizer Tray',
                'description' => 'Bamboo tray with compartments for pens and cards.',
                'quantity' => 27,
                'purchase_price' => 5.60,
                'selling_price' => 11.99,
                'status' => ProductStatus::Available,
                'categories' => ['office-supplies'],
            ],
            [
                'name' => 'Insulated Lunch Box',
                'description' => 'Leak-resistant compartment box with ice pack sleeve.',
                'quantity' => 19,
                'purchase_price' => 7.80,
                'selling_price' => 15.49,
                'status' => ProductStatus::Available,
                'categories' => ['kitchenware', 'outdoor'],
            ],
        ];

        foreach ($catalog as $item) {
            $categorySlugs = $item['categories'];
            unset($item['categories']);

            $product = Product::query()->updateOrCreate(
                ['name' => $item['name']],
                $item,
            );

            $ids = collect($categorySlugs)
                ->map(fn (string $slug) => $categories->get($slug)?->id)
                ->filter()
                ->values()
                ->all();

            $product->categories()->sync($ids);
        }

        // Soft-deleted products for admin restore testing (hidden from guests).
        $trashed = [
            [
                'name' => 'Seasonal Gift Wrap Roll',
                'description' => 'Holiday wrap from last season — archived from the public catalog.',
                'quantity' => 0,
                'purchase_price' => 1.50,
                'selling_price' => 3.99,
                'status' => ProductStatus::Unavailable,
                'categories' => ['stationery'],
            ],
            [
                'name' => 'Demo Display Tablet Stand',
                'description' => 'Floor sample stand removed from active inventory.',
                'quantity' => 1,
                'purchase_price' => 20.00,
                'selling_price' => 45.00,
                'status' => ProductStatus::Discontinued,
                'categories' => ['electronics', 'office-supplies'],
            ],
        ];

        foreach ($trashed as $item) {
            $categorySlugs = $item['categories'];
            unset($item['categories']);

            $product = Product::withTrashed()->updateOrCreate(
                ['name' => $item['name']],
                $item,
            );

            if (! $product->trashed()) {
                $product->delete();
            }

            $ids = collect($categorySlugs)
                ->map(fn (string $slug) => $categories->get($slug)?->id)
                ->filter()
                ->values()
                ->all();

            $product->categories()->sync($ids);
        }
    }
}
