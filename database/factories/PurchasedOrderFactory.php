<?php

namespace Database\Factories;

use App\Enums\PurchasedOrderStatus;
use App\Models\PurchasedOrder;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PurchasedOrder>
 */
class PurchasedOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reference' => (string) Str::uuid(),
            'supplier_id' => Supplier::factory()->active(),
            'request_quotation_id' => null,
            'status' => PurchasedOrderStatus::Draft,
            'grand_total' => 0,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => PurchasedOrderStatus::Draft,
        ]);
    }

    public function ordered(): static
    {
        return $this->state(fn () => [
            'status' => PurchasedOrderStatus::Ordered,
        ]);
    }

    public function received(): static
    {
        return $this->state(fn () => [
            'status' => PurchasedOrderStatus::Received,
        ]);
    }
}
