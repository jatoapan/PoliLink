<?php

namespace App\Services\Gemma;

interface GemmaClient
{
    /**
     * Sends a single generation request and returns the decoded JSON object.
     *
     * @param  array<string, mixed>  $responseSchema
     * @return array<string, mixed>
     *
     * @throws GemmaException
     */
    public function generateJson(string $systemInstruction, string $userText, array $responseSchema): array;
}
