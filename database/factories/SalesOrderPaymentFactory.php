<?php

namespace Database\Factories;

use App\Enums\SalesOrderPaymentMethod;
use App\Models\SalesOrder;
use App\Models\SalesOrderPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesOrderPayment>
 */
class SalesOrderPaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sales_order_id' => SalesOrder::factory(),
            'method' => SalesOrderPaymentMethod::Cash,
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
            'method' => SalesOrderPaymentMethod::Cash,
            'platform' => null,
            'reference_number' => null,
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function onlinePayment(): static
    {
        return $this->state(fn () => [
            'method' => SalesOrderPaymentMethod::OnlinePayment,
            'platform' => 'GCash',
            'reference_number' => fake()->numerify('REF########'),
            'bank_name' => null,
            'bank_check_id' => null,
        ]);
    }

    public function bankTransfer(): static
    {
        return $this->state(fn () => [
            'method' => SalesOrderPaymentMethod::BankTransfer,
            'platform' => null,
            'bank_name' => 'BDO',
            'reference_number' => fake()->numerify('TRN########'),
            'bank_check_id' => null,
        ]);
    }
}
