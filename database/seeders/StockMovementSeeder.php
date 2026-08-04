<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    /**
     * Explicit monthly ladders so the dashboard chart has clear up/down steps.
     *
     * @var list<int>
     */
    private const RECEIPT_LADDER = [320, 860, 480, 1120, 540, 940];

    /**
     * Net adjustments large enough to plot as a second ladder series.
     *
     * @var list<int>
     */
    private const ADJUSTMENT_LADDER = [-180, 120, -240, 160, -90, 200];

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

        if ($products->isEmpty()) {
            return;
        }

        $productCount = $products->count();

        foreach ($products as $index => $product) {
            $runningQuantity = max(20, (int) $product->quantity);
            $share = 1 / $productCount;

            foreach (range(0, 5) as $monthOffset) {
                $monthDate = $startMonth->copy()->addMonths($monthOffset);
                $monthlyReceiptTarget = (int) round(self::RECEIPT_LADDER[$monthOffset] * $share);
                $monthlyReceiptTarget = max(8, $monthlyReceiptTarget + (($index % 5) - 2));

                // Split receipts into 2–3 ladder rungs within the month.
                $receiptChunks = $this->splitIntoChunks($monthlyReceiptTarget, 2 + ($index % 2));

                foreach ($receiptChunks as $chunkIndex => $chunkQty) {
                    if ($chunkQty <= 0) {
                        continue;
                    }

                    $runningQuantity += $chunkQty;
                    $day = min(4 + ($chunkIndex * 5), 16);

                    StockMovement::query()->create([
                        'product_id' => $product->id,
                        'type' => StockMovementType::Receipt->value,
                        'quantity_delta' => $chunkQty,
                        'quantity_after' => $runningQuantity,
                        'unit_cost' => $product->purchase_price,
                        'reference_type' => null,
                        'reference_id' => null,
                        'notes' => 'Seeded ladder receipt',
                        'created_by' => 'DatabaseSeeder',
                        'created_at' => $monthDate->copy()->day($day)->setTime(9 + $chunkIndex, 15),
                        'updated_at' => $monthDate->copy()->day($day)->setTime(9 + $chunkIndex, 15),
                    ]);
                }

                $monthlyAdjustmentTarget = (int) round(self::ADJUSTMENT_LADDER[$monthOffset] * $share);
                $monthlyAdjustmentTarget += (($index % 3) - 1) * 2;

                if ($monthlyAdjustmentTarget === 0) {
                    $monthlyAdjustmentTarget = $monthOffset % 2 === 0 ? -4 : 4;
                }

                $adjustmentChunks = $this->splitSignedIntoChunks(
                    $monthlyAdjustmentTarget,
                    2 + (($index + $monthOffset) % 2),
                );

                foreach ($adjustmentChunks as $chunkIndex => $chunkQty) {
                    if ($chunkQty === 0) {
                        continue;
                    }

                    if ($runningQuantity + $chunkQty < 0) {
                        $chunkQty = -$runningQuantity;

                        if ($chunkQty === 0) {
                            continue;
                        }
                    }

                    $runningQuantity += $chunkQty;
                    $day = min(18 + ($chunkIndex * 3), 27);

                    StockMovement::query()->create([
                        'product_id' => $product->id,
                        'type' => StockMovementType::Adjustment->value,
                        'quantity_delta' => $chunkQty,
                        'quantity_after' => $runningQuantity,
                        'unit_cost' => null,
                        'reference_type' => null,
                        'reference_id' => null,
                        'notes' => 'Seeded ladder adjustment',
                        'created_by' => 'DatabaseSeeder',
                        'created_at' => $monthDate->copy()->day($day)->setTime(14 + $chunkIndex, 30),
                        'updated_at' => $monthDate->copy()->day($day)->setTime(14 + $chunkIndex, 30),
                    ]);
                }
            }

            $product->update([
                'quantity' => $runningQuantity,
            ]);
        }
    }

    /**
     * @return list<int>
     */
    private function splitIntoChunks(int $total, int $parts): array
    {
        $parts = max(1, $parts);
        $base = intdiv($total, $parts);
        $remainder = $total % $parts;
        $chunks = [];

        for ($i = 0; $i < $parts; $i++) {
            $chunks[] = $base + ($i < $remainder ? 1 : 0);
        }

        return $chunks;
    }

    /**
     * @return list<int>
     */
    private function splitSignedIntoChunks(int $total, int $parts): array
    {
        $sign = $total < 0 ? -1 : 1;
        $chunks = $this->splitIntoChunks(abs($total), $parts);

        return array_map(fn (int $chunk): int => $chunk * $sign, $chunks);
    }
}
