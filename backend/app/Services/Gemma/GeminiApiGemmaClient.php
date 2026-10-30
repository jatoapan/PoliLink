<?php

namespace App\Services\Gemma;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use JsonException;

/**
 * Calls a Gemma model through the Gemini API `generateContent` endpoint.
 * The API key travels only in the `x-goog-api-key` header.
 */
class GeminiApiGemmaClient implements GemmaClient
{
    private const MAX_JSON_DEPTH = 8;

    public function __construct(
        private readonly ?string $apiKey,
        private readonly string $model,
        private readonly string $baseUrl,
        private readonly int $timeout,
        private readonly int $maxOutputTokens,
    ) {}

    public static function fromConfig(): self
    {
        $config = config('services.gemma');

        return new self(
            apiKey: $config['api_key'] ?? null,
            model: $config['model'],
            baseUrl: $config['base_url'],
            timeout: $config['timeout'],
            maxOutputTokens: $config['max_output_tokens'],
        );
    }

    public function generateJson(string $systemInstruction, string $userText, array $responseSchema): array
    {
        if (blank($this->apiKey)) {
            throw new GemmaException(GemmaFailure::NotConfigured);
        }

        try {
            $response = Http::baseUrl($this->baseUrl)
                ->withHeaders(['x-goog-api-key' => $this->apiKey])
                ->acceptJson()
                ->timeout($this->timeout)
                ->connectTimeout(min($this->timeout, 5))
                ->post("models/{$this->model}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
                    'contents' => [['role' => 'user', 'parts' => [['text' => $userText]]]],
                    'generationConfig' => [
                        'thinkingConfig' => ['thinkingLevel' => 'minimal'],
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $responseSchema,
                        'temperature' => 0,
                        'maxOutputTokens' => $this->maxOutputTokens,
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new GemmaException(GemmaFailure::Timeout, previous: $exception);
        }

        $this->ensureSuccessful($response);

        return $this->decodeObject($this->answerText($response));
    }

    private function ensureSuccessful(Response $response): void
    {
        $status = $response->status();

        if ($response->successful()) {
            return;
        }

        throw new GemmaException(match (true) {
            $status === 429 => GemmaFailure::RateLimited,
            $status === 408 || $status === 504 => GemmaFailure::Timeout,
            $status >= 500 => GemmaFailure::ServerError,
            default => GemmaFailure::RequestRejected,
        }, $status);
    }

    /**
     * Joins the visible text parts of the first candidate, skipping `thought` parts.
     */
    private function answerText(Response $response): string
    {
        $candidate = $response->json('candidates.0');

        if (! is_array($candidate) || ($candidate['finishReason'] ?? null) !== 'STOP') {
            throw new GemmaException(GemmaFailure::InvalidResponse, $response->status());
        }

        $parts = $candidate['content']['parts'] ?? null;

        if (! is_array($parts)) {
            throw new GemmaException(GemmaFailure::InvalidResponse, $response->status());
        }

        return collect($parts)
            ->filter(fn (mixed $part) => is_array($part) && ($part['thought'] ?? false) !== true)
            ->map(fn (array $part) => is_string($part['text'] ?? null) ? $part['text'] : '')
            ->implode('');
    }

    /**
     * Accepts only a bare JSON object, or a list holding exactly one object,
     * which is the alternative shape the model returned without a schema.
     *
     * @return array<string, mixed>
     */
    private function decodeObject(string $text): array
    {
        $text = trim($text);

        if ($text === '' || ! in_array($text[0], ['{', '['], true)) {
            throw new GemmaException(GemmaFailure::InvalidResponse);
        }

        try {
            $decoded = json_decode($text, true, self::MAX_JSON_DEPTH, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new GemmaException(GemmaFailure::InvalidResponse, previous: $exception);
        }

        if (is_array($decoded) && array_is_list($decoded) && count($decoded) === 1) {
            $decoded = $decoded[0];
        }

        if (! is_array($decoded) || $decoded === [] || array_is_list($decoded)) {
            throw new GemmaException(GemmaFailure::InvalidResponse);
        }

        return $decoded;
    }
}
