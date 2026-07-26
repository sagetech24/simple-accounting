<?php

namespace Database\Seeders;

use App\Enums\BankAccountStatus;
use App\Models\BankAccount;
use Illuminate\Database\Seeder;

class BankAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'BDO',
                'account_name' => 'Simple Accounting Ops',
                'account_number' => '001234567890',
                'notes' => 'Primary checking account.',
                'status' => BankAccountStatus::Active,
            ],
            [
                'name' => 'BPI',
                'account_name' => 'Simple Accounting Ops',
                'account_number' => '109876543210',
                'notes' => null,
                'status' => BankAccountStatus::Active,
            ],
            [
                'name' => 'Metrobank',
                'account_name' => 'Simple Accounting Ops',
                'account_number' => '550012345678',
                'notes' => null,
                'status' => BankAccountStatus::Active,
            ],
            [
                'name' => 'UnionBank',
                'account_name' => 'Simple Accounting Ops',
                'account_number' => '104455667788',
                'notes' => 'Used for supplier PDCs.',
                'status' => BankAccountStatus::Active,
            ],
            [
                'name' => 'Security Bank',
                'account_name' => 'Simple Accounting Ops',
                'account_number' => '000112233445',
                'notes' => 'Legacy account — rarely used.',
                'status' => BankAccountStatus::Inactive,
            ],
        ];

        foreach ($accounts as $account) {
            BankAccount::query()->updateOrCreate(
                ['name' => $account['name']],
                $account,
            );
        }
    }
}
