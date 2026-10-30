<?php

namespace App\Enums;

enum MembershipStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Rejected = 'rejected';
    case Left = 'left';

    public function label(): string
    {
        return __("statuses.memberships.{$this->value}");
    }
}
