<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticket_timelines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained()->cascadeOnDelete()->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()->index();
            $table->string('event')->index();
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_timelines');
    }
};
