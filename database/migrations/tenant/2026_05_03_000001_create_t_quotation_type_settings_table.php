<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_quotation_type_settings', function (Blueprint $table) {
            $table->id();
            $table->string('polluter_type', 20);
            $table->longText('product_ids');
            $table->timestamps();

            $table->unique('polluter_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_quotation_type_settings');
    }
};
