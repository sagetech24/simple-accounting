<?php

namespace App\Enums;

enum RequestQuotationStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Pending => 'Pending',
            self::Approved => 'Approved',
        };
    }

    /**
     * Sort priority: pending first, then approved, then draft.
     */
    public function sortPriority(): int
    {
        return match ($this) {
            self::Pending => 0,
            self::Approved => 1,
            self::Draft => 2,
        };
    }
}
