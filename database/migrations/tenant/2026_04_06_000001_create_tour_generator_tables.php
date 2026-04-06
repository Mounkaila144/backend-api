<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_customers_meetings_tour_generator', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('status', ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'])->default('DRAFT');
            $table->timestamps();
            $table->unique('date');
        });

        Schema::create('t_customers_meetings_tour_generator_group', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tour_id');
            $table->unsignedBigInteger('sale_id')->nullable();
            $table->decimal('total_distance', 10, 2)->default(0);
            $table->integer('total_duration')->default(0);
            $table->timestamps();
            $table->foreign('tour_id')->references('id')->on('t_customers_meetings_tour_generator')->cascadeOnDelete();
        });

        Schema::create('t_customers_meetings_tour_generator_assignment', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tour_id');
            $table->unsignedBigInteger('meeting_id');
            $table->unsignedBigInteger('group_id');
            $table->integer('order_in_group')->default(0);
            $table->timestamps();
            $table->foreign('tour_id')->references('id')->on('t_customers_meetings_tour_generator')->cascadeOnDelete();
            $table->foreign('meeting_id')->references('id')->on('t_customers_meeting')->cascadeOnDelete();
            $table->foreign('group_id')->references('id')->on('t_customers_meetings_tour_generator_group')->cascadeOnDelete();
        });

        Schema::create('t_customers_meetings_tour_generator_distance_matrix', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tour_id');
            $table->unsignedBigInteger('meeting_id_from');
            $table->unsignedBigInteger('meeting_id_to');
            $table->decimal('distance', 10, 2)->default(0);
            $table->integer('duration')->default(0);
            $table->timestamps();
            $table->foreign('tour_id')->references('id')->on('t_customers_meetings_tour_generator')->cascadeOnDelete();
            $table->foreign('meeting_id_from')->references('id')->on('t_customers_meeting')->cascadeOnDelete();
            $table->foreign('meeting_id_to')->references('id')->on('t_customers_meeting')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_customers_meetings_tour_generator_distance_matrix');
        Schema::dropIfExists('t_customers_meetings_tour_generator_assignment');
        Schema::dropIfExists('t_customers_meetings_tour_generator_group');
        Schema::dropIfExists('t_customers_meetings_tour_generator');
    }
};
