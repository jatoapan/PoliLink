<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'community_id',
    'event_category_id',
    'event_modality_id',
    'location_id',
    'status',
    'title',
    'description',
    'image_path',
    'starts_at',
    'capacity',
])]
class Event extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'capacity' => 'integer',
            'status' => EventStatus::class,
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'event_category_id');
    }

    public function modality(): BelongsTo
    {
        return $this->belongsTo(EventModality::class, 'event_modality_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function activeRegistrations(): HasMany
    {
        return $this->hasMany(Registration::class)
            ->where('status', RegistrationStatus::Active->value);
    }

    public function scopeUpcoming(Builder $query): void
    {
        $query->where('starts_at', '>', now());
    }

    public function scopePubliclyListed(Builder $query): void
    {
        $query->where('status', EventStatus::Published->value)
            ->upcoming()
            ->whereHas('community', fn (Builder $query) => $query->where('is_active', true));
    }

    /**
     * @param  array<int, string>  $codes
     */
    public function scopeInCategories(Builder $query, array $codes): void
    {
        $query->whereHas('category', fn (Builder $query) => $query->whereIn('code', $codes));
    }

    /**
     * @param  array<int, string>  $codes
     */
    public function scopeInModalities(Builder $query, array $codes): void
    {
        $query->whereHas('modality', fn (Builder $query) => $query->whereIn('code', $codes));
    }

    public function getAvailableCapacityAttribute(): int
    {
        $activeRegistrationsCount = array_key_exists('active_registrations_count', $this->attributes)
            ? (int) $this->attributes['active_registrations_count']
            : $this->activeRegistrations()->count();

        return max(0, $this->capacity - $activeRegistrationsCount);
    }
}
