<?php

namespace App\Models;

use Database\Factories\BankAccountAuditLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankAccountAuditLog extends Model
{
    /** @use HasFactory<BankAccountAuditLogFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'bank_account_id',
        'actor_user_id',
        'action',
        'subject_type',
        'subject_id',
        'summary',
        'before',
        'after',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'before' => 'array',
            'after' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<BankAccount, $this>
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class)->withTrashed();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        return [
            'id' => $this->id,
            'bank_account_id' => $this->bank_account_id,
            'actor_user_id' => $this->actor_user_id,
            'actor_name' => $this->actor?->name,
            'action' => $this->action,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'summary' => $this->summary,
            'before' => $this->before,
            'after' => $this->after,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
