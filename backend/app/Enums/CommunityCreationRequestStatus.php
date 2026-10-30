<?php

namespace App\Enums;

enum CommunityCreationRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return __("statuses.community_creation_requests.{$this->value}");
    }
}
