<?php

namespace Database\Factories;

use App\Enums\SalesOrderDiscountType;
use App\Models\Customer;
use App\Models\SalesOrder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SalesOrder>
 */
class SalesOrderFactory extends Factory
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
            'customer_id' => null,
            'customer_name' => null,
            'subtotal' => 0,
            'discount_type' => SalesOrderDiscountType::None,
            'discount_value' => '0.00',
            'discount_amount' => '0.00',
            'grand_total' => 0,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (SalesOrder $order): void {
            if ((float) $order->discount_amount > 0) {
                return;
            }

            if ((float) $order->subtotal === 0.0 && (float) $order->grand_total > 0) {
                $order->subtotal = $order->grand_total;
            }
        });
    }

    public function withCustomer(): static
    {
        return $this->state(fn () => [
            'customer_id' => Customer::factory()->active(),
        ]);
    }
}
