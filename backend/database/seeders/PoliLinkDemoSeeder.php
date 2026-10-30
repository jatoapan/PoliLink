<?php

namespace Database\Seeders;

use App\Enums\CommunityCreationRequestStatus;
use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Enums\RegistrationStatus;
use App\Models\Community;
use App\Models\CommunityCreationRequest;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Location;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PoliLinkDemoSeeder extends Seeder
{
    public function run(): void
    {
        $organizer = User::query()->updateOrCreate(
            ['email' => 'organizer@espol.edu.ec'],
            [
                'first_name' => 'Organizador',
                'last_name' => 'PoliLink',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ],
        );
        $student = User::query()->updateOrCreate(
            ['email' => 'student@espol.edu.ec'],
            [
                'first_name' => 'Estudiante',
                'last_name' => 'PoliLink',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ],
        );

        $community = Community::query()->updateOrCreate(
            ['name' => 'TAWS'],
            [
                'slug' => Str::slug('TAWS'),
                'description' => 'Comunidad estudiantil de tecnología y desarrollo de software.',
                'is_active' => true,
            ],
        );

        $this->seedCommunityImage($community, 'taws.webp');

        CommunityCreationRequest::query()->firstOrCreate(
            [
                'name' => 'Club de Robótica',
                'requested_by' => $student->id,
            ],
            [
                'description' => 'Comunidad estudiantil de robótica de ESPOL.',
                'slug' => Str::slug('Club de Robótica'),
                'status' => CommunityCreationRequestStatus::Pending->value,
            ],
        );

        $organizerRoleId = CommunityRole::query()->where('code', 'organizer')->sole()->id;
        $memberRoleId = CommunityRole::query()->where('code', 'member')->sole()->id;

        CommunityMembership::query()->updateOrCreate(
            [
                'community_id' => $community->id,
                'user_id' => $organizer->id,
            ],
            [
                'community_role_id' => $organizerRoleId,
                'status' => MembershipStatus::Active->value,
                'requested_at' => now(),
                'reviewed_at' => null,
                'reviewed_by' => null,
            ],
        );
        CommunityMembership::query()->updateOrCreate(
            [
                'community_id' => $community->id,
                'user_id' => $student->id,
            ],
            [
                'community_role_id' => $memberRoleId,
                'status' => MembershipStatus::Active->value,
                'requested_at' => now(),
                'reviewed_at' => now(),
                'reviewed_by' => $organizer->id,
            ],
        );

        $event = Event::query()->updateOrCreate(
            [
                'community_id' => $community->id,
                'title' => 'Hackathon TAWS',
            ],
            [
                'event_category_id' => EventCategory::query()->where('code', 'hackathon')->sole()->id,
                'event_modality_id' => EventModality::query()->where('code', 'in_person')->sole()->id,
                'location_id' => Location::query()->where('name', 'Campus Gustavo Galindo')->sole()->id,
                'status' => EventStatus::Published->value,
                'description' => 'Hackathon de demostración para el avance de PoliLink.',
                'starts_at' => Carbon::create(2026, 8, 20, 9),
                'capacity' => 50,
            ],
        );

        Registration::query()->updateOrCreate(
            [
                'event_id' => $event->id,
                'user_id' => $student->id,
            ],
            [
                'status' => RegistrationStatus::Active->value,
                'registered_at' => now(),
                'cancelled_at' => null,
            ],
        );
    }

    private function seedCommunityImage(Community $community, string $filename): void
    {
        if ($community->image_path !== null) {
            return;
        }

        $source = __DIR__."/assets/communities/{$filename}";

        if (! is_file($source)) {
            return;
        }

        $path = "communities/{$filename}";
        Storage::disk('public')->put($path, file_get_contents($source));
        $community->update(['image_path' => $path]);
    }
}
