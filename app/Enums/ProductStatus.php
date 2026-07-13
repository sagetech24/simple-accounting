<?php

namespace App\Enums;

enum ProductStatus: string
{
    case Available = 'available';
    case Unavailable = 'unavailable';
    case Discontinued = 'discontinued';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Unavailable => 'Unavailable',
            self::Discontinued => 'Discontinued',
        };
    }
}
