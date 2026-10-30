<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_tables_and_user_fields_use_the_new_membership_model(): void
    {
        $this->assertTrue(Schema::hasColumns('users', ['first_name', 'last_name', 'is_admin']));
        $this->assertTrue(Schema::hasColumns('event_categories', ['is_active']));
        $this->assertTrue(Schema::hasColumns('event_modalities', ['is_active']));
        $this->assertTrue(Schema::hasColumns('locations', ['is_active']));
        $this->assertTrue(Schema::hasColumns('communities', ['slug', 'is_active', 'image_path']));
        $this->assertTrue(Schema::hasColumns('events', ['community_id', 'image_path', 'status']));
        $this->assertTrue(Schema::hasColumns('registrations', ['user_id', 'status']));
        $this->assertTrue(Schema::hasColumns('community_memberships', ['status']));
        $this->assertTrue(Schema::hasColumns('community_creation_requests', ['slug', 'status']));

        foreach ([
            'communities',
            'community_roles',
            'community_memberships',
            'community_creation_requests',
            'event_categories',
            'event_modalities',
            'locations',
            'events',
            'registrations',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table));
        }

        foreach ([
            'roles',
            'role_user',
            'community_organizers',
            'event_statuses',
            'registration_statuses',
            'membership_statuses',
            'community_creation_request_statuses',
        ] as $removedTable) {
            $this->assertFalse(Schema::hasTable($removedTable));
        }
    }

    public function test_membership_is_unique_per_user_and_community(): void
    {
        $userId = $this->createUser();
        $communityId = DB::table('communities')->insertGetId([
            'name' => 'TAWS',
            'slug' => 'taws',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $roleId = $this->createReference('community_roles', 'member', 'Miembro');

        DB::table('community_memberships')->insert([
            'community_id' => $communityId,
            'user_id' => $userId,
            'community_role_id' => $roleId,
            'status' => 'active',
            'requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('community_memberships')->insert([
            'community_id' => $communityId,
            'user_id' => $userId,
            'community_role_id' => $roleId,
            'status' => 'active',
            'requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_community_slugs_are_unique(): void
    {
        DB::table('communities')->insert([
            'name' => 'Comunidad uno',
            'slug' => 'comunidad',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('communities')->insert([
            'name' => 'Comunidad dos',
            'slug' => 'comunidad',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_pending_community_creation_request_slugs_are_unique(): void
    {
        $userId = $this->createUser();
        $attributes = [
            'name' => 'Comunidad pendiente única',
            'slug' => 'comunidad-pendiente-unica',
            'description' => null,
            'image_path' => null,
            'requested_by' => $userId,
            'status' => 'pending',
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => null,
            'community_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('community_creation_requests')->insert($attributes);

        $this->expectException(QueryException::class);

        DB::table('community_creation_requests')->insert($attributes);
    }

    public function test_rejected_community_creation_request_names_can_be_reused(): void
    {
        $userId = $this->createUser();
        $attributes = [
            'name' => 'Comunidad reutilizable',
            'slug' => 'comunidad-reutilizable',
            'description' => null,
            'image_path' => null,
            'requested_by' => $userId,
            'status' => 'rejected',
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => 'Prueba',
            'community_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('community_creation_requests')->insert($attributes);
        $attributes['status'] = 'pending';
        DB::table('community_creation_requests')->insert($attributes);

        $this->assertDatabaseCount('community_creation_requests', 2);
    }

    public function test_registration_is_unique_per_event_and_user(): void
    {
        $userId = $this->createUser('member@espol.edu.ec');
        $communityId = DB::table('communities')->insertGetId([
            'name' => 'TAWS',
            'slug' => 'taws',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $categoryId = $this->createReference('event_categories', 'hackathon', 'Hackatón');
        $modalityId = $this->createReference('event_modalities', 'in_person', 'Presencial');
        $locationId = DB::table('locations')->insertGetId([
            'name' => 'Campus Gustavo Galindo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $eventId = DB::table('events')->insertGetId([
            'community_id' => $communityId,
            'event_category_id' => $categoryId,
            'event_modality_id' => $modalityId,
            'location_id' => $locationId,
            'status' => 'published',
            'title' => 'Hackathon TAWS',
            'description' => 'Evento de prueba.',
            'starts_at' => now()->addWeek(),
            'capacity' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('registrations')->insert([
            'event_id' => $eventId,
            'user_id' => $userId,
            'status' => 'active',
            'registered_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('registrations')->insert([
            'event_id' => $eventId,
            'user_id' => $userId,
            'status' => 'active',
            'registered_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_foreign_keys_reject_unknown_membership_references(): void
    {
        $this->expectException(QueryException::class);

        DB::table('community_memberships')->insert([
            'community_id' => 999,
            'user_id' => 999,
            'community_role_id' => 999,
            'status' => 'active',
            'requested_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_status_columns_reject_values_outside_their_enums(): void
    {
        $this->seed();

        foreach ([
            ['table' => 'events', 'id' => DB::table('events')->value('id')],
            ['table' => 'registrations', 'id' => DB::table('registrations')->value('id')],
            ['table' => 'community_memberships', 'id' => DB::table('community_memberships')->value('id')],
            ['table' => 'community_creation_requests', 'id' => DB::table('community_creation_requests')->value('id')],
        ] as $target) {
            try {
                DB::table($target['table'])->where('id', $target['id'])->update(['status' => 'invalid']);
                $this->fail("{$target['table']} accepted an invalid status.");
            } catch (QueryException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    private function createUser(string $email = 'user@espol.edu.ec'): int
    {
        return DB::table('users')->insertGetId([
            'first_name' => 'Usuario',
            'last_name' => 'Prueba',
            'email' => $email,
            'password' => 'password',
            'is_admin' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createReference(string $table, string $code, string $name): int
    {
        return DB::table($table)->insertGetId([
            'code' => $code,
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
