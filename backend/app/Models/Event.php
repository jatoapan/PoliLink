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
use Illuminate\Support\Carbon;

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

    public const MAX_SEARCH_KEYWORDS = 8;

    public const LOCAL_TIMEZONE = 'America/Guayaquil';

    public const WEEKDAY_SEARCH_WINDOW_DAYS = 60;

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

    /**
     * Matches events whose title, description, or community name or description
     * contains any of the keywords. `%`, `_` and `!` are matched literally.
     *
     * @param  array<int, mixed>  $keywords
     */
    public function scopeMatchingKeywords(Builder $query, array $keywords): void
    {
        $patterns = collect($keywords)
            ->filter(fn (mixed $keyword) => is_string($keyword))
            ->map(fn (string $keyword) => trim($keyword))
            ->filter(fn (string $keyword) => $keyword !== '')
            ->unique()
            ->take(self::MAX_SEARCH_KEYWORDS)
            ->map(fn (string $keyword) => '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $keyword).'%')
            ->values();

        if ($patterns->isEmpty()) {
            return;
        }

        $query->where(function (Builder $query) use ($patterns) {
            foreach ($patterns as $pattern) {
                $query->orWhereRaw($query->qualifyColumn('title')." like ? escape '!'", [$pattern])
                    ->orWhereRaw($query->qualifyColumn('description')." like ? escape '!'", [$pattern])
                    ->orWhereHas('community', fn (Builder $query) => $query
                        ->whereRaw($query->qualifyColumn('name')." like ? escape '!'", [$pattern])
                        ->orWhereRaw($query->qualifyColumn('description')." like ? escape '!'", [$pattern]));
            }
        });
    }

    /**
     * Matches events that start on any of the ISO weekdays (1 = Monday, 7 = Sunday)
     * in Guayaquil time, from the start of today through the next 59 days.
     * Values that are not integers between 1 and 7 are ignored.
     *
     * @param  array<int, mixed>  $weekdays
     */
    public function scopeOnWeekdays(Builder $query, array $weekdays): void
    {
        $weekdays = collect($weekdays)
            ->filter(fn (mixed $weekday) => is_int($weekday) && $weekday >= 1 && $weekday <= 7)
            ->unique();

        if ($weekdays->isEmpty()) {
            return;
        }

        $today = now(self::LOCAL_TIMEZONE)->startOfDay();
        $ranges = collect(range(0, self::WEEKDAY_SEARCH_WINDOW_DAYS - 1))
            ->map(fn (int $offset) => $today->copy()->addDays($offset))
            ->filter(fn (Carbon $day) => $weekdays->contains($day->dayOfWeekIso))
            ->map(fn (Carbon $day) => [$day->copy()->utc(), $day->copy()->addDay()->utc()]);
        $column = $query->qualifyColumn('starts_at');

        $query->where(function (Builder $query) use ($ranges, $column) {
            foreach ($ranges as [$start, $end]) {
                $query->orWhere(fn (Builder $query) => $query
                    ->where($column, '>=', $start)
                    ->where($column, '<', $end));
            }
        });
    }

    public function getAvailableCapacityAttribute(): int
    {
        $activeRegistrationsCount = array_key_exists('active_registrations_count', $this->attributes)
            ? (int) $this->attributes['active_registrations_count']
            : $this->activeRegistrations()->count();

        return max(0, $this->capacity - $activeRegistrationsCount);
    }
}
