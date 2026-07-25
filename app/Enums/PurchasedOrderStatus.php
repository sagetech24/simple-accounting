<?php

namespace App\Enums;

enum PurchasedOrderStatus: string
{
    case Draft = 'draft';
    case Ordered = 'ordered';
    case Received = 'received';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Ordered => 'Ordered',
            self::Received => 'Received',
        };
    }

    /**
     * Sort priority: ordered first, then draft, then received.
     */
    public function sortPriority(): int
    {
        return match ($this) {
            self::Ordered => 0,
            self::Draft => 1,
            self::Received => 2,
        };
    }
}
