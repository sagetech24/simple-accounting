<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        StockMovement::query()->delete();

        $startMonth = now()->startOfMonth()->subMonths(5);
        $products = Product::query()
            ->orderBy('id')
            ->get();

        foreach ($products as $index => $product) {
            $runningQuantity = 0;

            foreach (range(0, 5) as $monthOffset) {
                $monthDate = $startMonth->copy()->addMonths($monthOffset);
                $received = 12 + (($index * 3 + $monthOffset * 5) % 18);

                $runningQuantity += $received;

                StockMovement::query()->create([
                    'product_id' => $product->id,
                    'type' => StockMovementType::Receipt->value,
                    'quantity_delta' => $received,
                    'quantity_after' => $runningQuantity,
                    'unit_cost' => $product->purchase_price,
                    'reference_type' => null,
                    'reference_id' => null,
                    'notes' => 'Seeded monthly receipt',
                    'created_by' => 'DatabaseSeeder',
                    'created_at' => $monthDate->copy()->day(8)->setTime(10, 15),
                    'updated_at' => $monthDate->copy()->day(8)->setTime(10, 15),
                ]);

                $adjustment = 0;

                if (($index + $monthOffset) % 4 === 0) {
                    $adjustment = -1 * (1 + (($index + $monthOffset) % 3));
                } elseif (($index + $monthOffset) % 5 === 0) {
                    $adjustment = 2;
                }

                if ($adjustment !== 0 && $runningQuantity + $adjustment >= 0) {
                    $runningQuantity += $adjustment;

                    StockMovement::query()->create([
                        'product_id' => $product->id,
                        'type' => StockMovementType::Adjustment->value,
                        'quantity_delta' => $adjustment,
                        'quantity_after' => $runningQuantity,
                        'unit_cost' => null,
                        'reference_type' => null,
                        'reference_id' => null,
                        'notes' => 'Seeded cycle-count adjustment',
                        'created_by' => 'DatabaseSeeder',
                        'created_at' => $monthDate->copy()->day(20)->setTime(15, 30),
                        'updated_at' => $monthDate->copy()->day(20)->setTime(15, 30),
                    ]);
                }
            }

            $product->update([
                'quantity' => $runningQuantity,
            ]);
        }
    }
}
