<?php

namespace Database\Seeders;

use App\Enums\SupplierStatus;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Pacific Office Supply Co.',
                'contact_name' => 'Elena Vargas',
                'email' => 'elena.vargas@pacificoffice.example',
                'phone' => '+1-415-555-0142',
                'address' => "120 Market Street\nSan Francisco, CA 94105",
                'notes' => 'Preferred vendor for stationery and paper goods.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Northern Hardware Distributors',
                'contact_name' => 'Marcus Chen',
                'email' => 'marcus.chen@northernhardware.example',
                'phone' => '+1-206-555-0198',
                'address' => "880 Industrial Way\nSeattle, WA 98108",
                'notes' => 'Bulk discounts on wrench and bit sets.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Sunrise Kitchenware Ltd.',
                'contact_name' => 'Priya Nair',
                'email' => 'priya.nair@sunrisekitchen.example',
                'phone' => '+1-312-555-0174',
                'address' => "45 Lake Shore Drive\nChicago, IL 60611",
                'notes' => null,
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Beacon Electronics Wholesale',
                'contact_name' => 'Jordan Blake',
                'email' => 'jordan.blake@beaconelectronics.example',
                'phone' => '+1-617-555-0111',
                'address' => "210 Harbor Blvd\nBoston, MA 02210",
                'notes' => 'Lead time 5–7 business days for hubs and peripherals.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Green Leaf Cleaning Supplies',
                'contact_name' => 'Sofia Alvarez',
                'email' => 'sofia.alvarez@greenleafclean.example',
                'phone' => '+1-503-555-0166',
                'address' => "77 Hawthorne Ave\nPortland, OR 97214",
                'notes' => 'Plant-based cleaners; monthly standing order available.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Trail & Camp Outfitters',
                'contact_name' => 'Noah Bridger',
                'email' => 'noah.bridger@trailcamp.example',
                'phone' => '+1-720-555-0133',
                'address' => "1500 Blake Street\nDenver, CO 80202",
                'notes' => null,
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Metro Beverage Partners',
                'contact_name' => 'Aisha Rahman',
                'email' => 'aisha.rahman@metrobeverage.example',
                'phone' => '+1-212-555-0187',
                'address' => "900 11th Avenue\nNew York, NY 10019",
                'notes' => 'Sparkling water and cold brew concentrate.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Harbor Snack Imports',
                'contact_name' => 'Leo Kim',
                'email' => 'leo.kim@harborsnack.example',
                'phone' => '+1-310-555-0129',
                'address' => "6400 Pacific Ave\nLos Angeles, CA 90021",
                'notes' => 'Minimum order $250.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'CareFirst Personal Goods',
                'contact_name' => 'Maya Thompson',
                'email' => 'maya.thompson@carefirstgoods.example',
                'phone' => '+1-404-555-0155',
                'address' => "330 Peachtree St\nAtlanta, GA 30308",
                'notes' => null,
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Summit Print & Paper',
                'contact_name' => 'Daniel Ortiz',
                'email' => 'daniel.ortiz@summitprint.example',
                'phone' => '+1-602-555-0104',
                'address' => "18 Central Ave\nPhoenix, AZ 85004",
                'notes' => 'Fast turnaround on reams and notebooks.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Riverbend Tool & Fastener',
                'contact_name' => 'Hannah Brooks',
                'email' => 'hannah.brooks@riverbendtool.example',
                'phone' => '+1-513-555-0190',
                'address' => "400 Vine Street\nCincinnati, OH 45202",
                'notes' => null,
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Atlas Desk Solutions',
                'contact_name' => 'Chris Patel',
                'email' => 'chris.patel@atlasdesk.example',
                'phone' => '+1-215-555-0148',
                'address' => "55 Market Street\nPhiladelphia, PA 19106",
                'notes' => 'Desk organizers and office accessories.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Coastal Housewares Group',
                'contact_name' => 'Isabel Freitas',
                'email' => 'isabel.freitas@coastalhousewares.example',
                'phone' => '+1-305-555-0172',
                'address' => "1200 Biscayne Blvd\nMiami, FL 33132",
                'notes' => 'Seasonal promotions in Q4.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Legacy Components Depot',
                'contact_name' => 'Robert Hale',
                'email' => 'robert.hale@legacycomponents.example',
                'phone' => '+1-512-555-0119',
                'address' => "901 Congress Ave\nAustin, TX 78701",
                'notes' => 'Discontinued parts only — limited stock.',
                'status' => SupplierStatus::Inactive,
            ],
            [
                'name' => 'Midwest Cleaning Depot',
                'contact_name' => 'Grace Nguyen',
                'email' => 'grace.nguyen@midwestcleaning.example',
                'phone' => '+1-612-555-0161',
                'address' => "700 Nicollet Mall\nMinneapolis, MN 55402",
                'notes' => null,
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Evergreen Outdoor Gear',
                'contact_name' => 'Tyler Moss',
                'email' => 'tyler.moss@evergreenoutdoor.example',
                'phone' => '+1-801-555-0137',
                'address' => "50 Main Street\nSalt Lake City, UT 84101",
                'notes' => 'Camping stools and trail mix co-packs.',
                'status' => SupplierStatus::Active,
            ],
            [
                'name' => 'Silverline Tech Parts',
                'contact_name' => 'Nina Kowalski',
                'email' => 'nina.kowalski@silverlinetech.example',
                'phone' => '+1-919-555-0182',
                'address' => "301 Fayetteville St\nRaleigh, NC 27601",
                'notes' => 'On credit hold until Q3 invoices clear.',
                'status' => SupplierStatus::Inactive,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::query()->updateOrCreate(
                ['name' => $supplier['name']],
                $supplier,
            );
        }

        $trashed = [
            [
                'name' => 'Archive Ribbon Supply',
                'contact_name' => 'Frank Ellis',
                'email' => 'frank.ellis@archiveribbon.example',
                'phone' => '+1-702-555-0108',
                'address' => "100 Fremont St\nLas Vegas, NV 89101",
                'notes' => 'Former ribbon vendor — kept for historical POs.',
                'status' => SupplierStatus::Inactive,
            ],
            [
                'name' => 'Demo Display Fixtures Inc.',
                'contact_name' => 'Karen Shaw',
                'email' => 'karen.shaw@demodisplay.example',
                'phone' => '+1-314-555-0150',
                'address' => "600 Washington Ave\nSt. Louis, MO 63101",
                'notes' => 'Soft-deleted sample fixture supplier.',
                'status' => SupplierStatus::Inactive,
            ],
        ];

        foreach ($trashed as $supplier) {
            $record = Supplier::withTrashed()->updateOrCreate(
                ['name' => $supplier['name']],
                $supplier,
            );

            if (! $record->trashed()) {
                $record->delete();
            }
        }
    }
}
