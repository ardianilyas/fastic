<?php

namespace Database\Factories;

use App\Models\CannedResponse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CannedResponse>
 */
class CannedResponseFactory extends Factory
{
    protected $model = CannedResponse::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->unique()->sentence(3),
            'shortcut' => '/'.$this->faker->unique()->word(),
            'body' => $this->faker->paragraph(3),
        ];
    }
}
