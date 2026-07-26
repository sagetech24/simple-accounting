<?php

namespace Database\Factories;

use App\Enums\BankAccountStatus;
use App\Models\BankAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankAccount>
 */
class BankAccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Bank',
            'account_name' => fake()->name(),
            'account_number' => fake()->numerify('##########'),
            'notes' => fake()->optional(0.3)->sentence(),
            'status' => fake()->randomElement(BankAccountStatus::cases()),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => BankAccountStatus::Active,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => BankAccountStatus::Inactive,
        ]);
    }
}
