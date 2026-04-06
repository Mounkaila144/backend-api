<?php

namespace Modules\CustomersMeetings\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OpenRouteService API wrapper for distance/duration matrix calculations.
 *
 * Ported from Symfony CustomerMeetingsTourGeneratorUtilOpenrouteApi.
 */
class OpenRouteApiService
{
    protected MeetingSettingsService $settings;

    /** @var array<string> */
    protected array $errors = [];

    /** @var float Timestamp of last API call (rate limiting) */
    protected static float $lastCallTime = 0;

    public function __construct(MeetingSettingsService $settings)
    {
        $this->settings = $settings;
    }

    /**
     * Calculate an NxN distance/duration matrix via OpenRouteService.
     *
     * @param  array<array{lat: float, lng: float}>  $coordinates
     * @return array{distances: float[][], durations: float[][], success: bool, error: ?string, source: string}
     */
    public function calculateMatrix(array $coordinates): array
    {
        $this->errors = [];

        if (count($coordinates) < 2) {
            return $this->createZeroMatrix(count($coordinates));
        }

        // Check for all-identical coordinates
        $unique = array_unique(array_map(fn ($c) => $c['lat'] . ',' . $c['lng'], $coordinates));
        if (count($unique) <= 1) {
            return $this->createZeroMatrix(count($coordinates));
        }

        try {
            // Convert to ORS format: [longitude, latitude] (lon first!)
            $locations = array_map(function ($c) {
                return [(float) $c['lng'], (float) $c['lat']];
            }, $coordinates);

            $payload = [
                'locations' => $locations,
                'profile' => 'driving-car',
                'metrics' => ['distance', 'duration'],
                'units' => 'km',
            ];

            $url = $this->settings->getTourOpenRouteUrl();
            $timeout = $this->settings->getTourOpenRouteTimeout();
            $apiKey = $this->settings->getTourOpenRouteApiKey();

            // Rate limiting: wait at least 2 seconds between calls
            $now = microtime(true);
            $diff = $now - static::$lastCallTime;
            if ($diff < 2.0) {
                usleep((int) ((2.0 - $diff) * 1000000));
            }
            static::$lastCallTime = microtime(true);

            $request = Http::timeout(max($timeout * 2, 30))
                ->withUserAgent('CustomerMeetingsTourGenerator/1.0')
                ->withOptions(['verify' => false])
                ->acceptJson()
                ->contentType('application/json');

            if ($apiKey) {
                $request = $request->withHeaders(['Authorization' => $apiKey]);
            }

            $response = $request->post(rtrim($url, '/') . '/v2/matrix/driving-car', $payload);

            if (!$response->successful()) {
                $code = $response->status();
                $errorMsg = "HTTP error: {$code}";
                if ($code === 429) {
                    $errorMsg .= ' - Too many requests, API rate limit exceeded.';
                    $this->errors[] = 'API rate limited (429), using fallback calculation';
                }
                $this->errors[] = $errorMsg;
                $this->errors[] = 'WARNING: Using approximate distance calculation instead of real routing data';

                return $this->fallbackHaversineMatrix($coordinates);
            }

            $data = $response->json();

            if (!$data || !isset($data['distances'], $data['durations'])) {
                $this->errors[] = 'Invalid matrix format from API';
                $this->errors[] = 'WARNING: Using approximate distance calculation instead of real routing data';

                return $this->fallbackHaversineMatrix($coordinates);
            }

            // Check for null values in the matrix
            if ($this->matrixHasNullValues($data['distances'], $data['durations'])) {
                $this->errors[] = 'Some routes could not be calculated, fixing with fallback';
                $this->errors[] = 'WARNING: Some distances calculated approximately due to routing API limitations';

                return $this->fixNullValuesInMatrix($data['distances'], $data['durations'], $coordinates);
            }

            return [
                'distances' => $data['distances'],
                'durations' => $data['durations'],
                'success' => true,
                'error' => null,
                'source' => 'openroute_matrix',
            ];
        } catch (\Throwable $e) {
            $this->errors[] = $e->getMessage();
            $this->errors[] = 'WARNING: Using approximate distance calculation due to API error';
            Log::warning('OpenRouteService matrix calculation failed', ['error' => $e->getMessage()]);

            return $this->fallbackHaversineMatrix($coordinates);
        }
    }

    /**
     * Fallback: calculate NxN matrix using Haversine formula.
     *
     * @param  array<array{lat: float, lng: float}>  $coordinates
     * @return array{distances: float[][], durations: float[][], success: bool, error: ?string, source: string}
     */
    private function fallbackHaversineMatrix(array $coordinates): array
    {
        $n = count($coordinates);
        $distances = [];
        $durations = [];

        for ($i = 0; $i < $n; $i++) {
            $distances[$i] = [];
            $durations[$i] = [];
            for ($j = 0; $j < $n; $j++) {
                if ($i === $j) {
                    $distances[$i][$j] = 0;
                    $durations[$i][$j] = 0;
                } else {
                    $distances[$i][$j] = self::calculateHaversineDistance(
                        $coordinates[$i]['lat'],
                        $coordinates[$i]['lng'],
                        $coordinates[$j]['lat'],
                        $coordinates[$j]['lng']
                    );
                    $durations[$i][$j] = $this->estimateDuration($distances[$i][$j]);
                }
            }
        }

        return [
            'distances' => $distances,
            'durations' => $durations,
            'success' => true,
            'error' => null,
            'source' => 'haversine_matrix',
        ];
    }

    /**
     * Calculate the Haversine distance between two points.
     *
     * @return float Distance in kilometers
     */
    public static function calculateHaversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371; // Earth's radius in km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) * sin($dLng / 2);

        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Estimate travel duration from distance using average speed.
     *
     * @param  float  $distanceKm
     * @return int Estimated duration in seconds
     */
    private function estimateDuration(float $distanceKm): int
    {
        $speedKmh = $this->settings->getTourAverageSpeedKmh();
        if ($speedKmh <= 0) {
            $speedKmh = 45;
        }
        $hours = $distanceKm / $speedKmh;

        return (int) round($hours * 3600);
    }

    /**
     * Check if a matrix has null values.
     */
    private function matrixHasNullValues(array $distances, array $durations): bool
    {
        for ($i = 0; $i < count($distances); $i++) {
            for ($j = 0; $j < count($distances[$i] ?? []); $j++) {
                if (($distances[$i][$j] ?? null) === null || ($durations[$i][$j] ?? null) === null) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Fix null values in a matrix by replacing them with Haversine estimates.
     *
     * @param  array<array<float|null>>  $distances
     * @param  array<array<float|null>>  $durations
     * @param  array<array{lat: float, lng: float}>  $coordinates
     * @return array{distances: float[][], durations: float[][], success: bool, error: ?string, source: string}
     */
    private function fixNullValuesInMatrix(array $distances, array $durations, array $coordinates): array
    {
        $n = count($coordinates);
        $fd = $distances;
        $ft = $durations;

        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                if (($fd[$i][$j] ?? null) === null || ($ft[$i][$j] ?? null) === null) {
                    if ($i === $j) {
                        $fd[$i][$j] = 0;
                        $ft[$i][$j] = 0;
                    } else {
                        $fd[$i][$j] = self::calculateHaversineDistance(
                            $coordinates[$i]['lat'],
                            $coordinates[$i]['lng'],
                            $coordinates[$j]['lat'],
                            $coordinates[$j]['lng']
                        );
                        $ft[$i][$j] = $this->estimateDuration($fd[$i][$j]);
                    }
                }
            }
        }

        return [
            'distances' => $fd,
            'durations' => $ft,
            'success' => true,
            'error' => null,
            'source' => 'openroute_with_haversine_fixes',
        ];
    }

    /**
     * Create a zero-filled matrix (for single-coordinate or identical-coordinate sets).
     *
     * @return array{distances: float[][], durations: float[][], success: bool, error: ?string, source: string}
     */
    private function createZeroMatrix(int $size): array
    {
        return [
            'distances' => array_fill(0, max($size, 1), array_fill(0, max($size, 1), 0)),
            'durations' => array_fill(0, max($size, 1), array_fill(0, max($size, 1), 0)),
            'success' => true,
            'error' => null,
            'source' => 'zero_matrix',
        ];
    }

    /**
     * Get accumulated errors from the last operation.
     *
     * @return string[]
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Check if there were errors in the last operation.
     */
    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    /**
     * Get only WARNING-type errors.
     *
     * @return array<array{type: string, text: string}>
     */
    public function getWarnings(): array
    {
        $warnings = [];
        foreach ($this->errors as $error) {
            if (str_contains($error, 'WARNING:')) {
                $warnings[] = ['type' => 'warning', 'text' => $error];
            }
        }

        return $warnings;
    }
}
