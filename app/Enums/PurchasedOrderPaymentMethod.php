<?php

namespace App\Enums;

enum PurchasedOrderPaymentMethod: string
{
    case Cash = 'cash';
    case OnlinePayment = 'online_payment';
    case BankDeposit = 'bank_deposit';
    case PostDatedCheck = 'post_dated_check';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::OnlinePayment => 'Online Payment',
            self::BankDeposit => 'Bank Deposit',
            self::PostDatedCheck => 'Post Dated Check',
        };
    }
}
