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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->string('midtrans_order_id')->unique();
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
            $table->json('payload')->nullable(); // Store Midtrans response
            $table->string('payment_method')->nullable(); // QRIS, Transfer, etc
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
