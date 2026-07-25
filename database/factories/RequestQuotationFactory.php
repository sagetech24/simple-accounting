<?php

namespace Database\Factories;

use App\Enums\RequestQuotationStatus;
use App\Models\RequestQuotation;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<RequestQuotation>
 */
class RequestQuotationFactory extends Factory
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
            'status' => RequestQuotationStatus::Draft,
            'grand_total' => 0,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => RequestQuotationStatus::Draft,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => RequestQuotationStatus::Pending,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => RequestQuotationStatus::Approved,
        ]);
    }
}
