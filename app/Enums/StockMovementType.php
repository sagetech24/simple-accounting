<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Receipt = 'receipt';
    case Adjustment = 'adjustment';
    case Sale = 'sale';

    public function label(): string
    {
        return match ($this) {
            self::Receipt => 'Receipt',
            self::Adjustment => 'Adjustment',
            self::Sale => 'Sale',
        };
    }
}
