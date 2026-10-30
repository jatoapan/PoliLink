<?php

namespace App\Models;

use App\Enums\MembershipStatus;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['first_name', 'last_name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CommunityMembership::class);
    }

    public function communityCreationRequests(): HasMany
    {
        return $this->hasMany(CommunityCreationRequest::class, 'requested_by');
    }

    public function managedMemberships(): HasMany
    {
        return $this->memberships()
            ->whereHas('role', fn ($query) => $query->where('code', 'organizer'))
            ->whereHas('community', fn ($query) => $query->where('is_active', true))
            ->where('status', MembershipStatus::Active->value);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function isActiveOrganizerOf(int $communityId): bool
    {
        return $this->memberships()
            ->where('community_id', $communityId)
            ->whereHas('role', fn ($query) => $query->where('code', 'organizer'))
            ->whereHas('community', fn ($query) => $query->where('is_active', true))
            ->where('status', MembershipStatus::Active->value)
            ->exists();
    }

    public function isAdmin(): bool
    {
        return $this->is_admin;
    }
}
