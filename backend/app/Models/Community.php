<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'description', 'is_active', 'image_path'])]
class Community extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CommunityMembership::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function creationRequests(): HasMany
    {
        return $this->hasMany(CommunityCreationRequest::class);
    }

    /**
     * Matches communities whose name or description contains any of the
     * keywords, with the same literal matching as Event::scopeMatchingKeywords.
     *
     * @param  array<int, mixed>  $keywords
     */
    public function scopeMatchingKeywords(Builder $query, array $keywords): void
    {
        $patterns = Event::keywordLikePatterns($keywords);

        if ($patterns->isEmpty()) {
            return;
        }

        $query->where(function (Builder $query) use ($patterns) {
            foreach ($patterns as $pattern) {
                $query->orWhereRaw($query->qualifyColumn('name')." like ? escape '!'", [$pattern])
                    ->orWhereRaw($query->qualifyColumn('description')." like ? escape '!'", [$pattern]);
            }
        });
    }
}
