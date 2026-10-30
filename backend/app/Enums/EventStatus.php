<?php

namespace App\Enums;

enum EventStatus: string
{
    case Published = 'published';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return __("statuses.events.{$this->value}");
    }
}
