<?php

namespace App\Services\Gemma;

enum GemmaFailure: string
{
    case NotConfigured = 'not_configured';
    case RateLimited = 'rate_limited';
    case Timeout = 'timeout';
    case ServerError = 'server_error';
    case RequestRejected = 'request_rejected';
    case InvalidResponse = 'invalid_response';

    /**
     * Only transient provider errors and malformed output are worth one more attempt.
     */
    public function isRetryable(): bool
    {
        return in_array($this, [self::ServerError, self::InvalidResponse], true);
    }
}
