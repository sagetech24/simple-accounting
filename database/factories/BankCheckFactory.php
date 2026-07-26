<?php

namespace Database\Factories;

use App\Models\BankAccount;
use App\Models\BankCheck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankCheck>
 */
class BankCheckFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'bank_account_id' => BankAccount::factory()->active(),
            'check_number' => fake()->numerify('CHK-######'),
            'amount' => fake()->randomFloat(2, 100, 50000),
            'due_date' => fake()->dateTimeBetween('+1 day', '+60 days')->format('Y-m-d'),
            'issued_by' => fake()->name(),
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
