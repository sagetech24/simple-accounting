<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'brand_name',
    'tagline',
    'default_currency',
])]
class Setting extends Model
{
    /**
     * Return the singleton application settings row, creating defaults when missing.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'brand_name' => 'JMC Pundasyon',
            'tagline' => 'Sign in to manage accounting business process from products, suppliers, customers, inventory, and more.',
            'default_currency' => 'PHP',
        ]);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function currencyOptions(): array
    {
        return collect(config('currencies'))
            ->map(fn (array $meta, string $code): array => [
                'value' => $code,
                'label' => $meta['label'],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function toSharedPayload(): array
    {
        $currency = $this->default_currency;
        $meta = config("currencies.{$currency}", config('currencies.USD'));

        return [
            'brand_name' => $this->brand_name,
            'tagline' => $this->tagline,
            'default_currency' => $currency,
            'currency_locale' => $meta['locale'],
        ];
    }
}
