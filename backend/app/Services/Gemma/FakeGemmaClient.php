<?php

namespace App\Services\Gemma;

use LogicException;

/**
 * Test double that replays queued answers or failures and records each call.
 */
class FakeGemmaClient implements GemmaClient
{
    /** @var array<int, array<string, mixed>|GemmaException> */
    private array $queue;

    /** @var array<int, array{system: string, user: string, schema: array<string, mixed>}> */
    public array $calls = [];

    /**
     * @param  array<int, array<string, mixed>|GemmaException>  $responses
     */
    public function __construct(array $responses = [])
    {
        $this->queue = $responses;
    }

    public function generateJson(string $systemInstruction, string $userText, array $responseSchema): array
    {
        $this->calls[] = ['system' => $systemInstruction, 'user' => $userText, 'schema' => $responseSchema];

        $next = array_shift($this->queue) ?? throw new LogicException('No fake Gemma response queued.');

        if ($next instanceof GemmaException) {
            throw $next;
        }

        return $next;
    }
}
