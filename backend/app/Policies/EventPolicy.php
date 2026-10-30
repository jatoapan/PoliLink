<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function create(User $user, Community $community): bool
    {
        return $user->isActiveOrganizerOf($community->id);
    }

    public function update(User $user, Event $event): bool
    {
        return $user->isActiveOrganizerOf($event->community_id);
    }

    public function cancel(User $user, Event $event): bool
    {
        return $this->update($user, $event);
    }
}
