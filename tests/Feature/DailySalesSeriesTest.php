<?php

namespace Tests\Feature;

use App\Models\SalesOrder;
use App\Services\DailySalesSeries;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DailySalesSeriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_build_returns_90_zero_filled_days_excluding_voided(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-10 12:00:00', config('app.timezone')));

        try {
            SalesOrder::factory()->create([
                'grand_total' => '100.00',
                'created_at' => Carbon::parse('2026-08-10 09:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 09:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '50.00',
                'created_at' => Carbon::parse('2026-08-10 15:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 15:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '25.00',
                'created_at' => Carbon::parse('2026-08-08 10:00:00'),
                'updated_at' => Carbon::parse('2026-08-08 10:00:00'),
            ]);
            $voided = SalesOrder::factory()->create([
                'grand_total' => '999.00',
                'created_at' => Carbon::parse('2026-08-10 11:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 11:00:00'),
            ]);
            $voided->delete();

            $series = (new DailySalesSeries)->build();

            $this->assertCount(90, $series['labels']);
            $this->assertCount(90, $series['totals']);
            $this->assertSame('2026-05-13', $series['labels'][0]);
            $this->assertSame('2026-08-10', $series['labels'][89]);
            $this->assertSame(150.0, $series['totals'][89]);
            $this->assertSame(25.0, $series['totals'][87]);
            $this->assertSame(0.0, $series['totals'][88]);
        } finally {
            Carbon::setTestNow();
        }
    }
}
