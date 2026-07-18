<?php

namespace Database\Factories;

use App\Enums\SupplierStatus;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'contact_name' => fake()->name(),
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->numerify('+1-###-###-####'),
            'address' => fake()->address(),
            'notes' => fake()->optional(0.4)->sentence(),
            'status' => fake()->randomElement(SupplierStatus::cases()),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => SupplierStatus::Active,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => SupplierStatus::Inactive,
        ]);
    }
}
