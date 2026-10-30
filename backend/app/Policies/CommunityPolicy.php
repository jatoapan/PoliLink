<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;

class CommunityPolicy
{
    public function manageImage(User $user, Community $community): bool
    {
        return $community->is_active && $user->isActiveOrganizerOf($community->id);
    }

    public function manageMemberships(User $user, Community $community): bool
    {
        return $community->is_active && $user->isActiveOrganizerOf($community->id);
    }
}
