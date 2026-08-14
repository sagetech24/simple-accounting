<?php

namespace App\Enums;

enum SalesOrderPaymentMethod: string
{
    case Cash = 'cash';
    case OnlinePayment = 'online_payment';
    case BankTransfer = 'bank_transfer';
    case PostDatedCheck = 'post_dated_check';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::OnlinePayment => 'Online Payment',
            self::BankTransfer => 'Bank Transfer',
            self::PostDatedCheck => 'Post Dated Check',
        };
    }
}
