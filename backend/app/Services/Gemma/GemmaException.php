<?php

namespace App\Services\Gemma;

use RuntimeException;
use Throwable;

class GemmaException extends RuntimeException
{
    public function __construct(
        public readonly GemmaFailure $failure,
        public readonly ?int $status = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct("Gemma request failed: {$failure->value}", 0, $previous);
    }
}
