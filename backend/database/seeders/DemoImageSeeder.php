<?php

namespace Database\Seeders;

use App\Models\Community;
use App\Models\Event;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Fills missing demo images without replacing images uploaded by users.
 */
class DemoImageSeeder extends Seeder
{
    public function run(): void
    {
        Community::query()
            ->whereNull('image_path')
            ->each(fn (Community $community) => $this->seedCommunityImage($community));

        Event::query()
            ->whereNull('image_path')
            ->each(fn (Event $event) => $this->seedEventImage($event));
    }

    private function seedCommunityImage(Community $community): void
    {
        $filename = match (true) {
            $this->contains($community, ['robot', 'autonom']) => 'robota.webp',
            $this->contains($community, ['ciberseguridad', 'seguridad', 'privacy']) => 'security.webp',
            $this->contains($community, ['startup', 'emprend', 'innov']) => 'startups.webp',
            $this->contains($community, ['teatro', 'coro', 'danza', 'ballet', 'cultural']) => 'theatre.webp',
            $this->contains($community, ['deport', 'futbol', 'yoga']) => 'sports.webp',
            $this->contains($community, ['sostenib', 'ambient', 'recicl']) => 'sustainability.webp',
            default => 'ai.webp',
        };

        $this->storeIfAvailable($community, "communities/{$filename}");
    }

    private function seedEventImage(Event $event): void
    {
        $filename = match (true) {
            $this->contains($event, ['ciberseguridad', 'seguridad', 'ctf', 'privacidad']) => 'cybersecurity.webp',
            $this->contains($event, ['robot', 'ros ', 'f1tenth', 'sensor']) => 'robotics.webp',
            $this->contains($event, ['startup', 'emprend', 'negocio', 'pitch']) => 'entrepreneurship.webp',
            $this->contains($event, ['teatro', 'coro', 'danza', 'ballet', 'cultural']) => 'culture.webp',
            $this->contains($event, ['deport', 'futbol', 'yoga', 'torneo']) => 'sports.webp',
            $this->contains($event, ['sostenib', 'ambient', 'recicl', 'ecomercado', 'alimentación']) => 'sustainability.webp',
            default => 'technology.webp',
        };

        $this->storeIfAvailable($event, "events/{$filename}");
    }

    private function contains(Community|Event $model, array $terms): bool
    {
        $subject = $model instanceof Community ? $model->name : $model->title;
        $text = mb_strtolower($subject.' '.($model->description ?? ''));

        return collect($terms)->contains(fn (string $term) => str_contains($text, $term));
    }

    private function storeIfAvailable(Community|Event $model, string $path): void
    {
        $source = __DIR__."/assets/{$path}";

        if (! is_file($source)) {
            return;
        }

        Storage::disk('public')->put($path, file_get_contents($source));
        $model->update(['image_path' => $path]);
    }
}
