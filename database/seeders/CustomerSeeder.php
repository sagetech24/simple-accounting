<?php

namespace Database\Seeders;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Brightline Retail Group',
                'contact_name' => 'Carla Mendoza',
                'email' => 'carla.mendoza@brightlineretail.example',
                'phone' => '+1-415-555-0242',
                'address' => "500 Mission Street\nSan Francisco, CA 94105",
                'notes' => 'Monthly restock for stationery and snacks.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Northstar Clinics',
                'contact_name' => 'David Okonkwo',
                'email' => 'david.okonkwo@northstarclinics.example',
                'phone' => '+1-206-555-0298',
                'address' => "1200 Pike Street\nSeattle, WA 98101",
                'notes' => 'Prefers net-30 billing.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Lakeside Catering Co.',
                'contact_name' => 'Amelia Hart',
                'email' => 'amelia.hart@lakesidecatering.example',
                'phone' => '+1-312-555-0274',
                'address' => "200 N Michigan Ave\nChicago, IL 60601",
                'notes' => null,
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Harborview Hotels',
                'contact_name' => 'Kevin Tran',
                'email' => 'kevin.tran@harborviewhotels.example',
                'phone' => '+1-617-555-0211',
                'address' => "15 Atlantic Ave\nBoston, MA 02210",
                'notes' => 'Housekeeping supplies for three properties.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Cascade Design Studio',
                'contact_name' => 'Riley Quinn',
                'email' => 'riley.quinn@cascadedesign.example',
                'phone' => '+1-503-555-0266',
                'address' => "88 NW Couch St\nPortland, OR 97209",
                'notes' => 'Office supplies and kitchenware for studio kitchen.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Summit Peak Outfitters',
                'contact_name' => 'Blake Foster',
                'email' => 'blake.foster@summitpeak.example',
                'phone' => '+1-720-555-0233',
                'address' => "1600 Wynkoop Street\nDenver, CO 80202",
                'notes' => null,
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Metro Cafe Collective',
                'contact_name' => 'Nadia Hassan',
                'email' => 'nadia.hassan@metrocafecollective.example',
                'phone' => '+1-212-555-0287',
                'address' => "45 W 23rd Street\nNew York, NY 10010",
                'notes' => 'Weekly beverage and snack orders.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Pacific Rim Schools',
                'contact_name' => 'Owen Park',
                'email' => 'owen.park@pacificrimschools.example',
                'phone' => '+1-310-555-0229',
                'address' => "350 S Grand Ave\nLos Angeles, CA 90071",
                'notes' => 'Purchase orders required for all orders.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Peachtree Wellness Spa',
                'contact_name' => 'Lauren Brooks',
                'email' => 'lauren.brooks@peachtreewellness.example',
                'phone' => '+1-404-555-0255',
                'address' => "100 Peachtree St\nAtlanta, GA 30303",
                'notes' => null,
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Desert Bloom Florists',
                'contact_name' => 'Miguel Santos',
                'email' => 'miguel.santos@desertbloom.example',
                'phone' => '+1-602-555-0204',
                'address' => "40 N Central Ave\nPhoenix, AZ 85004",
                'notes' => 'Seasonal gift wrap and packaging needs.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'River City Architects',
                'contact_name' => 'Emily Walsh',
                'email' => 'emily.walsh@rivercityarch.example',
                'phone' => '+1-513-555-0290',
                'address' => "625 Vine Street\nCincinnati, OH 45202",
                'notes' => null,
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Liberty Office Suites',
                'contact_name' => 'James Patel',
                'email' => 'james.patel@libertyoffices.example',
                'phone' => '+1-215-555-0248',
                'address' => "30 S 17th Street\nPhiladelphia, PA 19103",
                'notes' => 'Multi-suite deliveries every other week.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Bayside Event Planners',
                'contact_name' => 'Sofia Reyes',
                'email' => 'sofia.reyes@baysideevents.example',
                'phone' => '+1-305-555-0272',
                'address' => "800 Brickell Ave\nMiami, FL 33131",
                'notes' => 'Rush orders common before weekends.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Lone Star Makerspace',
                'contact_name' => 'Aaron Scott',
                'email' => 'aaron.scott@lonestarmakers.example',
                'phone' => '+1-512-555-0219',
                'address' => "301 Congress Ave\nAustin, TX 78701",
                'notes' => 'Account on hold pending paperwork.',
                'status' => CustomerStatus::Inactive,
            ],
            [
                'name' => 'Twin Cities Bakery Co-op',
                'contact_name' => 'Hannah Lee',
                'email' => 'hannah.lee@twincitiesbakery.example',
                'phone' => '+1-612-555-0261',
                'address' => "800 Marquette Ave\nMinneapolis, MN 55402",
                'notes' => null,
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Wasatch Adventure Club',
                'contact_name' => 'Cody Bennett',
                'email' => 'cody.bennett@wasatchadventure.example',
                'phone' => '+1-801-555-0237',
                'address' => "150 S Main Street\nSalt Lake City, UT 84101",
                'notes' => 'Outdoor gear and trail snacks.',
                'status' => CustomerStatus::Active,
            ],
            [
                'name' => 'Capitol Tech Hub',
                'contact_name' => 'Priya Shah',
                'email' => 'priya.shah@capitoltechhub.example',
                'phone' => '+1-919-555-0282',
                'address' => "421 Fayetteville St\nRaleigh, NC 27601",
                'notes' => 'Inactive after lease ended.',
                'status' => CustomerStatus::Inactive,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::query()->updateOrCreate(
                ['name' => $customer['name']],
                $customer,
            );
        }

        $trashed = [
            [
                'name' => 'Archive Print Shop',
                'contact_name' => 'Tom Rivera',
                'email' => 'tom.rivera@archiveprint.example',
                'phone' => '+1-702-555-0208',
                'address' => "200 S Las Vegas Blvd\nLas Vegas, NV 89101",
                'notes' => 'Former walk-in customer — kept for history.',
                'status' => CustomerStatus::Inactive,
            ],
            [
                'name' => 'Demo Pop-Up Market LLC',
                'contact_name' => 'Jill Harper',
                'email' => 'jill.harper@demopopup.example',
                'phone' => '+1-314-555-0250',
                'address' => "700 Market Street\nSt. Louis, MO 63101",
                'notes' => 'Soft-deleted sample customer.',
                'status' => CustomerStatus::Inactive,
            ],
        ];

        foreach ($trashed as $customer) {
            $record = Customer::withTrashed()->updateOrCreate(
                ['name' => $customer['name']],
                $customer,
            );

            if (! $record->trashed()) {
                $record->delete();
            }
        }
    }
}
