<?php

namespace Database\Factories;

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
            'grand_total' => 0,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    public function withCustomer(): static
    {
        return $this->state(fn () => [
            'customer_id' => Customer::factory()->active(),
        ]);
    }
}
