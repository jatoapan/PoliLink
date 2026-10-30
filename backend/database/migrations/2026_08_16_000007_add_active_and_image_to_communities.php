<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communities', function (Blueprint $table): void {
            $table->boolean('is_active')->default(true)->after('description');
            $table->string('image_path')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('communities', function (Blueprint $table): void {
            $table->dropColumn(['is_active', 'image_path']);
        });
    }
};
