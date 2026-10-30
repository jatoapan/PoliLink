<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX_NAME = 'community_creation_requests_pending_slug_unique';

    public function up(): void
    {
        match (DB::getDriverName()) {
            'mysql', 'mariadb' => $this->addMysqlConstraint(),
            'sqlite', 'pgsql' => $this->addPartialIndex(),
            default => throw new RuntimeException(
                'La unicidad de slugs pendientes no está implementada para este motor de base de datos.',
            ),
        };
    }

    public function down(): void
    {
        match (DB::getDriverName()) {
            'mysql', 'mariadb' => $this->removeMysqlConstraint(),
            'sqlite', 'pgsql' => DB::statement(
                'DROP INDEX IF EXISTS "'.self::INDEX_NAME.'"',
            ),
            default => throw new RuntimeException(
                'La unicidad de slugs pendientes no está implementada para este motor de base de datos.',
            ),
        };
    }

    private function addMysqlConstraint(): void
    {
        DB::statement(
            'ALTER TABLE community_creation_requests '
            .'ADD pending_slug VARCHAR(255) '
            ."GENERATED ALWAYS AS (IF(status = 'pending', slug, NULL)) STORED",
        );
        DB::statement(
            'CREATE UNIQUE INDEX '.self::INDEX_NAME
            .' ON community_creation_requests (pending_slug)',
        );
    }

    private function addPartialIndex(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX "'.self::INDEX_NAME.'" '
            .'ON "community_creation_requests" ("slug") '
            .'WHERE "status" = \'pending\'',
        );
    }

    private function removeMysqlConstraint(): void
    {
        DB::statement(
            'DROP INDEX '.self::INDEX_NAME.' ON community_creation_requests',
        );
        DB::statement(
            'ALTER TABLE community_creation_requests DROP COLUMN pending_slug',
        );
    }
};
