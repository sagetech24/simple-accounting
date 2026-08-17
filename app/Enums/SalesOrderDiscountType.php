<?php

namespace App\Enums;

enum SalesOrderDiscountType: string
{
    case None = 'none';
    case Percent = 'percent';
    case Amount = 'amount';

    public function label(): string
    {
        return match ($this) {
            self::None => 'None',
            self::Percent => 'Percent',
            self::Amount => 'Amount',
        };
    }
}
