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
        Schema::create('invitation_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->string('bride_name')->nullable();
            $table->string('groom_name')->nullable();
            $table->string('bride_father_name')->nullable();
            $table->string('bride_mother_name')->nullable();
            $table->string('groom_father_name')->nullable();
            $table->string('groom_mother_name')->nullable();
            $table->date('event_date')->nullable();
            $table->time('ceremony_time')->nullable();
            $table->text('ceremony_location')->nullable();
            $table->text('reception_location')->nullable();
            $table->string('reception_google_maps_link')->nullable();
            $table->text('love_story')->nullable();
            $table->json('photo_gallery')->nullable(); // Array of photo URLs
            $table->json('wedding_info')->nullable(); // Additional wedding details as JSON
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitation_data');
    }
};
