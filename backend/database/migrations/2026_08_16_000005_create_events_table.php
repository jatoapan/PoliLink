<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('community_id')->constrained()->restrictOnDelete();
            $table->foreignId('event_category_id')->constrained()->restrictOnDelete();
            $table->foreignId('event_modality_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();
            $table->enum('status', ['published', 'cancelled']);
            $table->string('title');
            $table->text('description');
            $table->string('image_path')->nullable();
            $table->dateTime('starts_at');
            $table->unsignedInteger('capacity');
            $table->timestamps();

            $table->index(['status', 'starts_at']);
            $table->index(['event_category_id', 'starts_at']);
            $table->index(['event_modality_id', 'starts_at']);
            $table->index('location_id');
            $table->index('community_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
