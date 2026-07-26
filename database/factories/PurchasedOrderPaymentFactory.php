<?php

namespace Database\Factories;

use App\Enums\PurchasedOrderPaymentMethod;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchasedOrderPayment>
 */
class PurchasedOrderPaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchased_order_id' => PurchasedOrder::factory()->ordered(),
            'method' => PurchasedOrderPaymentMethod::Cash,
            'amount' => fake()->randomFloat(2, 50, 5000),
            'notes' => fake()->optional(0.3)->sentence(),
            'platform' => null,
            'reference_number' => null,
            'bank_name' => null,
            'bank_check_id' => null,
            'recorded_by' => fake()->name(),
            'paid_at' => now(),
        ];
    }

    public function cash(): static
    {
        return $this->state(fn () => [
            'method' => PurchasedOrderPaymentMethod::Cash,
            'platform' => null,
            'reference_number' => null,
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function onlinePayment(): static
    {
        return $this->state(fn () => [
            'method' => PurchasedOrderPaymentMethod::OnlinePayment,
            'platform' => 'GCash',
            'reference_number' => fake()->numerify('REF########'),
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function bankDeposit(): static
    {
        return $this->state(fn () => [
            'method' => PurchasedOrderPaymentMethod::BankDeposit,
            'platform' => null,
            'bank_name' => 'BDO',
            'reference_number' => fake()->numerify('DEP########'),
            'bank_check_id' => null,
        ]);
    }
}
