<?php

namespace Modules\CustomersMeetings\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Customer\Entities\CustomerAddress;

/**
 * Geocoding service using data.gouv.fr API.
 *
 * Ported from Symfony CustomerMeetingsTourGeneratorUtils.
 */
class GeocodingService
{
    protected MeetingSettingsService $settings;

    public function __construct(MeetingSettingsService $settings)
    {
        $this->settings = $settings;
    }

    /**
     * Geocode a single address via data.gouv.fr /search/?q=
     *
     * @return array{lat: float, lng: float}|null
     */
    public function geocodeAddress(string $fullAddress): ?array
    {
        try {
            $endpoint = $this->settings->getTourGeocodingEndpoint();
            $timeout = $this->settings->getTourGeocodingTimeout();

            $response = Http::timeout($timeout)
                ->withUserAgent('CustomerMeetingsTourGenerator/1.0')
                ->get($endpoint . '/search/', [
                    'q' => $fullAddress,
                    'limit' => 1,
                ]);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $coords = $data['features'][0]['geometry']['coordinates'] ?? null;

            if ($coords) {
                // GeoJSON format: [longitude, latitude]
                return ['lat' => (float) $coords[1], 'lng' => (float) $coords[0]];
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning('Geocoding failed for address: ' . $fullAddress, ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Batch geocode multiple addresses via data.gouv.fr /search/csv/ POST.
     *
     * @param  string[]  $addresses
     * @return array<string, array{lat: float, lng: float}> Keyed by original address string
     */
    public function batchGeocode(array $addresses): array
    {
        if (empty($addresses)) {
            return [];
        }

        try {
            $endpoint = $this->settings->getTourGeocodingEndpoint();

            // Build CSV content
            $csv = "adresse\n" . implode("\n", array_map(function ($a) {
                return '"' . str_replace('"', '""', $a) . '"';
            }, $addresses));

            $response = Http::timeout(30)
                ->withUserAgent('CustomerMeetingsTourGenerator/1.0')
                ->attach('data', $csv, 'addresses.csv')
                ->post($endpoint . '/search/csv/', [
                    'columns' => 'adresse',
                ]);

            if (!$response->successful()) {
                return [];
            }

            return $this->parseBatchGeocodeResponse($response->body(), $addresses);
        } catch (\Throwable $e) {
            Log::warning('Batch geocoding failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Build a full address string from a CustomerAddress model.
     */
    public static function buildFullAddress(CustomerAddress $address): string
    {
        return implode(', ', array_filter([
            $address->address1,
            $address->address2,
            $address->postcode,
            $address->city,
            $address->country ?: 'France',
        ]));
    }

    /**
     * Parse the CSV response from the batch geocoding API.
     *
     * @param  string  $csvResponse
     * @param  string[]  $originalAddresses
     * @return array<string, array{lat: float, lng: float}>
     */
    private function parseBatchGeocodeResponse(string $csvResponse, array $originalAddresses): array
    {
        $results = [];
        $lines = explode("\n", trim($csvResponse));

        if (empty($lines)) {
            return $results;
        }

        // Skip header line
        array_shift($lines);

        foreach ($lines as $i => $line) {
            if (trim($line) === '' || !isset($originalAddresses[$i])) {
                continue;
            }

            $cols = str_getcsv($line);

            // CSV response has at least 3 columns: adresse, longitude, latitude
            if (count($cols) >= 3 && !empty($cols[1]) && !empty($cols[2])) {
                $lat = (float) $cols[2];
                $lng = (float) $cols[1];

                if ($lat != 0 && $lng != 0) {
                    $results[$originalAddresses[$i]] = ['lat' => $lat, 'lng' => $lng];
                }
            }
        }

        return $results;
    }
}
