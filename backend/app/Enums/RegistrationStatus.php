<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case Active = 'active';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return __("statuses.registrations.{$this->value}");
    }
}
