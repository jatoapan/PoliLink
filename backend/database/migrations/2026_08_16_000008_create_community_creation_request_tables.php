<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_creation_requests', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected']);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('community_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['requested_by', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_creation_requests');
    }
};
