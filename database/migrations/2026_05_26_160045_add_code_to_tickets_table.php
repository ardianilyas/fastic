<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('code')->unique()->nullable()->after('id');
        });

        // Backfill existing tickets with codes
        $tickets = DB::table('tickets')->orderBy('created_at')->get(['id']);
        foreach ($tickets as $i => $ticket) {
            DB::table('tickets')
                ->where('id', $ticket->id)
                ->update(['code' => 'TIC-'.str_pad($i + 1, 4, '0', STR_PAD_LEFT)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
