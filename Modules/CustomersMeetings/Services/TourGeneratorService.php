<?php

namespace Modules\CustomersMeetings\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Customer\Entities\CustomerAddress;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use Modules\CustomersMeetings\Entities\TourGenerator;
use Modules\CustomersMeetings\Entities\TourGeneratorAssignment;
use Modules\CustomersMeetings\Entities\TourGeneratorDistanceMatrix;
use Modules\CustomersMeetings\Entities\TourGeneratorGroup;

/**
 * Tour Generator Service - Main clustering algorithm.
 *
 * Ported from Symfony CustomerMeetingsTourGeneratorManager.
 *
 * Generates geographic tours by:
 * 1. Fetching active meetings for a date
 * 2. Geocoding addresses without coordinates
 * 3. Computing NxN distance/duration matrix (ORS or Haversine fallback)
 * 4. DBSCAN-like geographic clustering
 * 5. Adjusting cluster count to match requested salespeople
 * 6. Optimizing travel order (nearest-neighbor TSP)
 * 7. Persisting groups and assignments
 */
class TourGeneratorService
{
    protected MeetingSettingsService $settings;
    protected GeocodingService $geocoding;
    protected OpenRouteApiService $openRoute;

    /**
     * Global NxN distance matrix for all meetings.
     *
     * @var array{distances: float[][], durations: float[][]}|null
     */
    protected ?array $globalDistanceMatrix = null;

    /**
     * Map of meeting_id => matrix index.
     *
     * @var array<int, int>
     */
    protected array $meetingToMatrixIndex = [];

    /**
     * Meeting coordinate data indexed by meeting ID.
     * Each entry: ['meeting' => CustomerMeeting, 'lat' => float, 'lng' => float, 'matrixIndex' => int]
     *
     * @var array<int, array>
     */
    protected array $meetingData = [];

    /** @var array Clusters excluded during merge (for messages) */
    protected array $excludedClusters = [];

    /** @var array Groups reduced for distance (for messages) */
    protected array $reducedGroupsForDistance = [];

    /** @var array Meetings unassigned after reduction (for messages) */
    protected array $unassignedMeetings = [];

    public function __construct(
        MeetingSettingsService $settings,
        GeocodingService $geocoding,
        OpenRouteApiService $openRoute
    ) {
        $this->settings = $settings;
        $this->geocoding = $geocoding;
        $this->openRoute = $openRoute;
    }

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

    /**
     * Generate a complete tour for a given date.
     *
     * @param  string  $date  Date in Y-m-d format
     * @param  int|null  $numberOfSalespeople  Target number of groups (null = auto)
     * @param  array  $selectedStates  Filter by state IDs
     * @return array{success: bool, tour?: TourGenerator, groups?: array, messages?: array, message?: string}
     */
    public function generateTour(string $date, ?int $numberOfSalespeople = null, array $selectedStates = []): array
    {
        // Reset state
        $this->globalDistanceMatrix = null;
        $this->meetingToMatrixIndex = [];
        $this->meetingData = [];
        $this->excludedClusters = [];
        $this->reducedGroupsForDistance = [];
        $this->unassignedMeetings = [];

        try {
            // Check for existing tour
            $existingTour = TourGenerator::where('date', $date)->first();
            if ($existingTour) {
                return ['success' => false, 'message' => __('A tour already exists for this date')];
            }

            // Create draft tour
            $tour = TourGenerator::create(['date' => $date, 'status' => 'DRAFT']);

            // Fetch meetings
            $meetings = $this->getMeetingsForDate($date, $selectedStates);
            if ($meetings->isEmpty()) {
                $tour->delete();
                return ['success' => false, 'message' => __('No meetings found for the selected date and status')];
            }
            if ($meetings->count() > 50) {
                $tour->delete();
                return [
                    'success' => false,
                    'message' => sprintf(
                        __('Too many meetings found (%d). Maximum is 50.'),
                        $meetings->count()
                    ),
                ];
            }
            if ($numberOfSalespeople && $meetings->count() < $numberOfSalespeople) {
                $tour->delete();
                return [
                    'success' => false,
                    'message' => sprintf(
                        __('Cannot create groups with only %d meetings. Minimum 1 per salesperson. (%d groups requested)'),
                        $meetings->count(),
                        $numberOfSalespeople
                    ),
                ];
            }

            // Prepare meeting data: separate with/without coordinates, geocode missing
            $prepared = $this->prepareMeetingData($meetings);
            $meetingsWithCoordinates = $prepared['withCoordinates'];
            $meetingsWithoutCoordinates = $prepared['withoutCoordinates'];

            if (empty($meetingsWithCoordinates)) {
                $tour->delete();
                return ['success' => false, 'message' => __('No meetings with valid coordinates found. Please check addresses.')];
            }
            if ($numberOfSalespeople && count($meetingsWithCoordinates) < $numberOfSalespeople) {
                $tour->delete();
                return [
                    'success' => false,
                    'message' => sprintf(
                        __('Cannot create %d groups with only %d meetings with valid coordinates.'),
                        $numberOfSalespeople,
                        count($meetingsWithCoordinates)
                    ),
                ];
            }

            // Calculate global distance matrix
            $this->calculateGlobalDistanceMatrix($meetingsWithCoordinates);

            // Create geographic clusters
            try {
                $groups = $this->createGroupsWithSalespeopleCount($meetingsWithCoordinates, $numberOfSalespeople);
            } catch (\Throwable $e) {
                $tour->delete();
                return ['success' => false, 'message' => $e->getMessage()];
            }

            // Persist groups and assignments
            try {
                $savedGroups = $this->saveEssentialData($tour, $groups, $meetingsWithCoordinates);
            } catch (\Throwable $e) {
                $tour->delete();
                return [
                    'success' => false,
                    'message' => __('Tour generation failed') . ': ' . $e->getMessage(),
                ];
            }

            // Collect API warnings
            $apiWarnings = $this->openRoute->getWarnings();

            // Activate tour
            $tour->setActive();

            // Build result messages
            $resultMessages = $this->generateResultMessages(
                $meetings,
                $meetingsWithCoordinates,
                $meetingsWithoutCoordinates,
                count($savedGroups)
            );

            if (!empty($apiWarnings)) {
                $resultMessages = array_merge($apiWarnings, $resultMessages);
            }

            return [
                'success' => true,
                'tour' => $tour->fresh(),
                'groups' => $savedGroups,
                'messages' => $resultMessages,
            ];
        } catch (\Throwable $e) {
            Log::error('Tour generation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Assign a salesperson to a group and update all meetings in that group.
     *
     * @return array{success: bool, message: string, updated_meetings?: int}
     */
    public function assignSalespersonToGroup(int $groupId, int $salespersonId): array
    {
        try {
            $group = TourGeneratorGroup::find($groupId);
            if (!$group) {
                return ['success' => false, 'message' => __('Group not found')];
            }

            // Update group
            $group->update(['sale_id' => $salespersonId]);

            // Update all meetings in this group
            $assignments = TourGeneratorAssignment::where('group_id', $groupId)->get();
            $updatedMeetings = 0;

            foreach ($assignments as $assignment) {
                $meeting = CustomerMeeting::find($assignment->meeting_id);
                if ($meeting) {
                    $meeting->update(['sales_id' => $salespersonId]);
                    $updatedMeetings++;
                }
            }

            return [
                'success' => true,
                'message' => sprintf(__('Salesperson assigned successfully (%d meetings updated)'), $updatedMeetings),
                'updated_meetings' => $updatedMeetings,
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // =========================================================================
    // PRIVATE METHODS - Data Preparation
    // =========================================================================

    /**
     * Query ACTIVE meetings for a given date with optional state filtering.
     */
    private function getMeetingsForDate(string $date, array $states = []): Collection
    {
        $query = CustomerMeeting::active()
            ->whereDate('in_at', $date)
            ->whereNotNull('in_at')
            ->with(['customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE')]);

        if (!empty($states)) {
            $query->whereIn('state_id', $states);
        }

        return $query->orderBy('in_at')->get();
    }

    /**
     * Separate meetings into those with/without coordinates, geocode missing ones.
     *
     * @return array{withCoordinates: array, withoutCoordinates: array}
     */
    private function prepareMeetingData(Collection $meetings): array
    {
        $withCoordinates = [];
        $withoutCoordinates = [];
        $needingGeocode = [];
        $addressesToGeocode = [];

        foreach ($meetings as $meeting) {
            $address = $meeting->customer?->addresses?->first();

            if (!$address) {
                $withoutCoordinates[] = $meeting;
                continue;
            }

            $lat = $address->lat;
            $lng = $address->lng;

            if ($lat && $lng) {
                $withCoordinates[] = [
                    'meeting' => $meeting,
                    'lat' => (float) $lat,
                    'lng' => (float) $lng,
                    'matrixIndex' => -1, // set later
                ];
            } elseif (trim($address->address1 ?? '') && trim($address->city ?? '')) {
                $needingGeocode[] = ['meeting' => $meeting, 'address' => $address];
                $addressesToGeocode[] = GeocodingService::buildFullAddress($address);
            } else {
                $withoutCoordinates[] = $meeting;
            }
        }

        // Batch geocode missing addresses
        if (!empty($addressesToGeocode)) {
            $geocodedResults = $this->geocoding->batchGeocode($addressesToGeocode);

            foreach ($needingGeocode as $i => $item) {
                $addressString = $addressesToGeocode[$i];
                if (isset($geocodedResults[$addressString])) {
                    $coords = $geocodedResults[$addressString];
                    $withCoordinates[] = [
                        'meeting' => $item['meeting'],
                        'lat' => $coords['lat'],
                        'lng' => $coords['lng'],
                        'matrixIndex' => -1,
                    ];
                    // Save geocoded coordinates back to the address
                    $item['address']->update([
                        'lat' => $coords['lat'],
                        'lng' => $coords['lng'],
                    ]);
                } else {
                    $withoutCoordinates[] = $item['meeting'];
                }
            }
        }

        // Assign matrix indices
        foreach ($withCoordinates as $i => &$data) {
            $data['matrixIndex'] = $i;
        }
        unset($data);

        return [
            'withCoordinates' => $withCoordinates,
            'withoutCoordinates' => $withoutCoordinates,
        ];
    }

    // =========================================================================
    // PRIVATE METHODS - Distance Matrix
    // =========================================================================

    /**
     * Call OpenRouteService for NxN matrix of all meetings.
     *
     * @param  array  $meetingData  Array of ['meeting' => ..., 'lat' => ..., 'lng' => ..., 'matrixIndex' => ...]
     */
    private function calculateGlobalDistanceMatrix(array $meetingData): void
    {
        if (count($meetingData) > 150) {
            $this->globalDistanceMatrix = null;
            return;
        }

        $allCoordinates = [];
        $this->meetingToMatrixIndex = [];

        foreach ($meetingData as $index => $data) {
            $allCoordinates[] = ['lat' => $data['lat'], 'lng' => $data['lng']];
            $this->meetingToMatrixIndex[$data['meeting']->id] = $index;
        }

        try {
            $this->globalDistanceMatrix = $this->openRoute->calculateMatrix($allCoordinates);
        } catch (\Throwable $e) {
            Log::warning('Global distance matrix calculation failed', ['error' => $e->getMessage()]);
            $this->globalDistanceMatrix = null;
        }
    }

    /**
     * Get distance between two meeting data entries from global matrix or Haversine fallback.
     */
    private function getDistanceBetween(array $dataA, array $dataB): float
    {
        if ($this->globalDistanceMatrix === null) {
            return OpenRouteApiService::calculateHaversineDistance($dataA['lat'], $dataA['lng'], $dataB['lat'], $dataB['lng']);
        }

        $indexA = $this->meetingToMatrixIndex[$dataA['meeting']->id] ?? null;
        $indexB = $this->meetingToMatrixIndex[$dataB['meeting']->id] ?? null;

        if ($indexA !== null && $indexB !== null && isset($this->globalDistanceMatrix['distances'][$indexA][$indexB])) {
            return $this->globalDistanceMatrix['distances'][$indexA][$indexB];
        }

        return OpenRouteApiService::calculateHaversineDistance($dataA['lat'], $dataA['lng'], $dataB['lat'], $dataB['lng']);
    }

    /**
     * Get duration between two meeting data entries from global matrix or estimate.
     */
    private function getDurationBetween(array $dataA, array $dataB): int
    {
        if ($this->globalDistanceMatrix !== null) {
            $indexA = $this->meetingToMatrixIndex[$dataA['meeting']->id] ?? null;
            $indexB = $this->meetingToMatrixIndex[$dataB['meeting']->id] ?? null;

            if ($indexA !== null && $indexB !== null && isset($this->globalDistanceMatrix['durations'][$indexA][$indexB])) {
                return (int) $this->globalDistanceMatrix['durations'][$indexA][$indexB];
            }
        }

        $distance = OpenRouteApiService::calculateHaversineDistance($dataA['lat'], $dataA['lng'], $dataB['lat'], $dataB['lng']);
        $speedKmh = $this->settings->getTourAverageSpeedKmh();

        return (int) round(($distance / max($speedKmh, 1)) * 3600);
    }

    /**
     * Extract a sub-matrix from the global matrix for a subset of meetings.
     *
     * @param  array  $meetingDataSubset
     * @return array{distances: float[][], durations: float[][]}
     */
    private function extractSubMatrixFromGlobal(array $meetingDataSubset): array
    {
        $n = count($meetingDataSubset);
        $distances = array_fill(0, $n, array_fill(0, $n, 0));
        $durations = array_fill(0, $n, array_fill(0, $n, 0));

        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                if ($i === $j) {
                    continue;
                }
                $distances[$i][$j] = $this->getDistanceBetween($meetingDataSubset[$i], $meetingDataSubset[$j]);
                $durations[$i][$j] = $this->getDurationBetween($meetingDataSubset[$i], $meetingDataSubset[$j]);
            }
        }

        return ['distances' => $distances, 'durations' => $durations];
    }

    /**
     * Calculate combined distance/duration matrices for a subset of meetings.
     *
     * @param  array  $meetingDataSubset
     * @return array{distances: float[][], durations: float[][]}
     */
    private function calculateCombinedMatrices(array $meetingDataSubset): array
    {
        if ($this->globalDistanceMatrix !== null && !empty($this->meetingToMatrixIndex)) {
            return $this->extractSubMatrixFromGlobal($meetingDataSubset);
        }

        $coords = array_map(fn ($d) => ['lat' => $d['lat'], 'lng' => $d['lng']], $meetingDataSubset);

        $unique = array_unique(array_map(fn ($c) => $c['lat'] . ',' . $c['lng'], $coords));
        if (count($unique) <= 1) {
            $size = count($coords);
            return [
                'distances' => array_fill(0, $size, array_fill(0, $size, 0)),
                'durations' => array_fill(0, $size, array_fill(0, $size, 0)),
            ];
        }

        try {
            $result = $this->openRoute->calculateMatrix($coords);
            return ['distances' => $result['distances'], 'durations' => $result['durations']];
        } catch (\Throwable $e) {
            return $this->createApproximateMatrix($coords);
        }
    }

    /**
     * Create an approximate matrix using simple Euclidean-like distance.
     *
     * @param  array<array{lat: float, lng: float}>  $coords
     * @return array{distances: float[][], durations: float[][]}
     */
    private function createApproximateMatrix(array $coords): array
    {
        $n = count($coords);
        $distances = [];
        $durations = [];
        $speedKmh = $this->settings->getTourAverageSpeedKmh();

        for ($i = 0; $i < $n; $i++) {
            for ($j = 0; $j < $n; $j++) {
                if ($i === $j) {
                    $distances[$i][$j] = 0;
                    $durations[$i][$j] = 0;
                } else {
                    $distances[$i][$j] = sqrt(
                        pow($coords[$i]['lat'] - $coords[$j]['lat'], 2)
                        + pow($coords[$i]['lng'] - $coords[$j]['lng'], 2)
                    ) * 111;
                    $durations[$i][$j] = ($distances[$i][$j] / max($speedKmh, 1)) * 3600;
                }
            }
        }

        return ['distances' => $distances, 'durations' => $durations];
    }

    // =========================================================================
    // PRIVATE METHODS - Clustering
    // =========================================================================

    /**
     * Main clustering entry point.
     *
     * @param  array  $meetingData
     * @param  int|null  $n  Target number of groups
     * @return array Array of clusters (each cluster is an array of meeting data)
     */
    private function createGroupsWithSalespeopleCount(array $meetingData, ?int $n): array
    {
        if (!$n || $n <= 0) {
            return $this->createIntelligentGroups($meetingData);
        }

        return $this->createFixedNumberGroups($meetingData, $n);
    }

    /**
     * Create intelligent groups using DBSCAN + TSP optimization.
     *
     * @param  array  $meetingData
     * @return array Array of optimized clusters
     */
    private function createIntelligentGroups(array $meetingData): array
    {
        $clusters = $this->createStrictDistanceGeographicClusters($meetingData);
        $optimized = [];

        foreach ($clusters as $cluster) {
            if (count($cluster) > 1) {
                $matrices = $this->calculateCombinedMatrices($cluster);
                $optimized[] = $this->optimizeTravelOrder($cluster, $matrices['distances']);
            } else {
                $optimized[] = $cluster;
            }
        }

        return $optimized;
    }

    /**
     * Create a fixed number of groups by adjusting natural clusters.
     */
    private function createFixedNumberGroups(array $meetingData, int $numberOfGroups): array
    {
        $clusters = $this->createStrictDistanceGeographicClusters($meetingData);

        return $this->adjustClustersToTargetCount($clusters, $numberOfGroups, $meetingData);
    }

    /**
     * DBSCAN-like geographic clustering.
     *
     * Algorithm:
     * 1. Sort meetings by in_at time
     * 2. Iterate unprocessed meetings
     * 3. For each, find candidates within 1.5x maxEps distance
     * 4. Greedily add if cluster remains valid (distance + duration constraints)
     *
     * @param  array  $meetingData
     * @return array Array of clusters
     */
    private function createStrictDistanceGeographicClusters(array $meetingData): array
    {
        // Sort by in_at time
        usort($meetingData, function ($a, $b) {
            return strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at);
        });

        $clusters = [];
        $processed = [];
        $maxDistance = $this->settings->getTourMaxEpsKm();

        foreach ($meetingData as $current) {
            $currentId = $current['meeting']->id;
            if (in_array($currentId, $processed)) {
                continue;
            }

            $cluster = [$current];
            $processed[] = $currentId;

            // Find near candidates within 1.5x maxEps
            $nearCandidates = [];
            foreach ($meetingData as $candidate) {
                if (in_array($candidate['meeting']->id, $processed)) {
                    continue;
                }
                $approxDist = OpenRouteApiService::calculateHaversineDistance(
                    $current['lat'],
                    $current['lng'],
                    $candidate['lat'],
                    $candidate['lng']
                );
                if ($approxDist <= $maxDistance * 1.5) {
                    $nearCandidates[] = ['data' => $candidate, 'distance' => $approxDist];
                }
            }

            // Sort candidates by distance
            usort($nearCandidates, fn ($a, $b) => $a['distance'] <=> $b['distance']);

            // Greedily add valid candidates
            $validationCount = 0;
            foreach ($nearCandidates as $candidateInfo) {
                if ($validationCount >= 20) {
                    break;
                }

                $testCluster = $cluster;
                $testCluster[] = $candidateInfo['data'];

                // Sort test cluster by time
                usort($testCluster, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

                if ($this->validateCluster($testCluster)) {
                    $cluster[] = $candidateInfo['data'];
                    $processed[] = $candidateInfo['data']['meeting']->id;
                }

                $validationCount++;
            }

            // Sort final cluster by time
            usort($cluster, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));
            $clusters[] = $cluster;
        }

        return array_filter($clusters);
    }

    /**
     * Validate a cluster: check max distance + max duration constraints.
     */
    private function validateCluster(array $cluster): bool
    {
        if (count($cluster) <= 1) {
            return true;
        }

        $maxDistance = $this->settings->getTourMaxEpsKm();
        $maxDurationSeconds = $this->settings->getTourMaxDurationSeconds();

        // Sort by time
        usort($cluster, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

        $totalDistance = $this->calculateClusterTotalDistance($cluster);
        $totalDuration = $this->calculateClusterTotalDuration($cluster);

        return $totalDistance <= $maxDistance && $totalDuration <= $maxDurationSeconds;
    }

    /**
     * Calculate total sequential distance for a cluster.
     */
    private function calculateClusterTotalDistance(array $cluster): float
    {
        if (count($cluster) <= 1) {
            return 0;
        }

        usort($cluster, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

        $total = 0;
        for ($i = 0; $i < count($cluster) - 1; $i++) {
            $total += OpenRouteApiService::calculateHaversineDistance(
                $cluster[$i]['lat'],
                $cluster[$i]['lng'],
                $cluster[$i + 1]['lat'],
                $cluster[$i + 1]['lng']
            );
        }

        return $total;
    }

    /**
     * Calculate total sequential duration for a cluster using global matrix or estimate.
     */
    private function calculateClusterTotalDuration(array $cluster): int
    {
        if (count($cluster) <= 1) {
            return 0;
        }

        usort($cluster, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

        $total = 0;
        for ($i = 0; $i < count($cluster) - 1; $i++) {
            $total += $this->getDurationBetween($cluster[$i], $cluster[$i + 1]);
        }

        return $total;
    }

    // =========================================================================
    // PRIVATE METHODS - Cluster Adjustment
    // =========================================================================

    /**
     * Adjust cluster count to match target.
     */
    private function adjustClustersToTargetCount(array $clusters, int $target, array $allMeetingData): array
    {
        $count = count($clusters);

        if ($count === $target) {
            return $clusters;
        }

        if ($count < $target) {
            return $this->splitLargestClusters($clusters, $target);
        }

        return $this->mergeClosestClusters($clusters, $target);
    }

    /**
     * Split the largest clusters to increase group count.
     */
    private function splitLargestClusters(array $clusters, int $target): array
    {
        $needed = $target - count($clusters);

        // Sort by size descending
        usort($clusters, fn ($a, $b) => count($b) - count($a));

        $result = [];
        $used = 0;

        foreach ($clusters as $c) {
            if ($used < $needed && count($c) >= 2) {
                $result = array_merge($result, $this->intelligentClusterSplit($c));
                $used++;
            } else {
                $result[] = $c;
            }
        }

        // Keep splitting if we still need more groups
        while (count($result) < $target) {
            $idx = -1;
            $size = 1;
            foreach ($result as $i => $c) {
                if (count($c) > $size) {
                    $size = count($c);
                    $idx = $i;
                }
            }
            if ($idx === -1) {
                break;
            }
            $split = $this->intelligentClusterSplit($result[$idx]);
            array_splice($result, $idx, 1, $split);
        }

        return $result;
    }

    /**
     * Intelligently split a cluster into two.
     *
     * Algorithm: find the 2 most distant points as seeds, assign rest to nearest seed.
     * Also considers time distance for assignment.
     */
    private function intelligentClusterSplit(array $cluster): array
    {
        if (count($cluster) < 2) {
            return [$cluster];
        }

        // Find 2 most distant points
        $max = 0;
        $seed1 = null;
        $seed2 = null;

        for ($i = 0; $i < count($cluster); $i++) {
            for ($j = $i + 1; $j < count($cluster); $j++) {
                $d = OpenRouteApiService::calculateHaversineDistance(
                    $cluster[$i]['lat'],
                    $cluster[$i]['lng'],
                    $cluster[$j]['lat'],
                    $cluster[$j]['lng']
                );
                if ($d > $max) {
                    $max = $d;
                    $seed1 = $cluster[$i];
                    $seed2 = $cluster[$j];
                }
            }
        }

        if (!$seed1 || !$seed2) {
            $half = (int) (count($cluster) / 2);
            return [array_slice($cluster, 0, $half), array_slice($cluster, $half)];
        }

        $c1 = [$seed1];
        $c2 = [$seed2];

        foreach ($cluster as $m) {
            if ($m === $seed1 || $m === $seed2) {
                continue;
            }

            // Distance + time component for assignment
            $s1 = OpenRouteApiService::calculateHaversineDistance($m['lat'], $m['lng'], $seed1['lat'], $seed1['lng'])
                + abs(strtotime($m['meeting']->in_at) - strtotime($seed1['meeting']->in_at)) / 3600;
            $s2 = OpenRouteApiService::calculateHaversineDistance($m['lat'], $m['lng'], $seed2['lat'], $seed2['lng'])
                + abs(strtotime($m['meeting']->in_at) - strtotime($seed2['meeting']->in_at)) / 3600;

            if ($s1 <= $s2) {
                $c1[] = $m;
            } else {
                $c2[] = $m;
            }
        }

        // Sort by time
        usort($c1, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));
        usort($c2, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

        // Force reduce if clusters exceed limits
        if (!$this->validateCluster($c1)) {
            $c1 = $this->forceReduceClusterToLimit($c1);
        }
        if (!$this->validateCluster($c2)) {
            $c2 = $this->forceReduceClusterToLimit($c2);
        }

        return [$c1, $c2];
    }

    /**
     * Merge closest clusters to decrease group count.
     *
     * Finds 2 closest clusters by average inter-cluster distance, validates merged cluster.
     * If merged cluster exceeds limits, excludes the smaller cluster.
     */
    private function mergeClosestClusters(array $clusters, int $target): array
    {
        $excluded = [];

        while (count($clusters) > $target) {
            $best = PHP_FLOAT_MAX;
            $iBest = -1;
            $jBest = -1;

            for ($i = 0; $i < count($clusters); $i++) {
                for ($j = $i + 1; $j < count($clusters); $j++) {
                    $d = $this->calculateInterClusterDistance($clusters[$i], $clusters[$j]);
                    if ($d < $best) {
                        $best = $d;
                        $iBest = $i;
                        $jBest = $j;
                    }
                }
            }

            if ($iBest !== -1 && $jBest !== -1) {
                $merged = array_merge($clusters[$iBest], $clusters[$jBest]);
                usort($merged, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

                if ($this->validateCluster($merged)) {
                    $clusters[$iBest] = $merged;
                    array_splice($clusters, $jBest, 1);
                } else {
                    // Exclude the smaller cluster
                    $smallest = count($clusters[$iBest]) <= count($clusters[$jBest]) ? $iBest : $jBest;
                    $excluded[] = $clusters[$smallest];
                    array_splice($clusters, $smallest, 1);
                    // Adjust indices after splice
                    if ($smallest < $jBest) {
                        $jBest--;
                    }
                    if ($smallest !== $iBest) {
                        array_splice($clusters, min($jBest, count($clusters)), 1);
                    }
                }
            } else {
                // No pair found, remove smallest
                $idx = $this->findSmallestClusterIndex($clusters);
                $excluded[] = $clusters[$idx];
                array_splice($clusters, $idx, 1);
            }
        }

        if (!empty($excluded)) {
            $this->excludedClusters = $excluded;
        }

        return $clusters;
    }

    /**
     * Calculate average inter-cluster distance.
     */
    private function calculateInterClusterDistance(array $c1, array $c2): float
    {
        $total = 0;
        $count = 0;

        foreach ($c1 as $m1) {
            foreach ($c2 as $m2) {
                $total += OpenRouteApiService::calculateHaversineDistance($m1['lat'], $m1['lng'], $m2['lat'], $m2['lng']);
                $count++;
            }
        }

        return $count > 0 ? $total / $count : PHP_FLOAT_MAX;
    }

    /**
     * Find the index of the smallest cluster.
     */
    private function findSmallestClusterIndex(array $clusters): int
    {
        $idx = 0;
        $min = count($clusters[0]);

        for ($i = 1; $i < count($clusters); $i++) {
            if (count($clusters[$i]) < $min) {
                $min = count($clusters[$i]);
                $idx = $i;
            }
        }

        return $idx;
    }

    /**
     * Force reduce a cluster to within limits.
     */
    private function forceReduceClusterToLimit(array $cluster): array
    {
        $maxKm = $this->settings->getTourMaxEpsKm();
        $reduced = $this->reduceGroupToMaxDistance($cluster, $maxKm);

        return $reduced['meetings'];
    }

    // =========================================================================
    // PRIVATE METHODS - TSP Optimization
    // =========================================================================

    /**
     * Optimize travel order using nearest-neighbor TSP with time weighting.
     *
     * Algorithm:
     * 1. Start with first meeting (by time)
     * 2. Find nearest unvisited meeting
     * 3. Apply time offset weighting: 2-4h gap = 0.8x score (favorable)
     *
     * @param  array  $meetingData
     * @param  array  $distanceMatrix
     * @return array Reordered meeting data
     */
    private function optimizeTravelOrder(array $meetingData, array $distanceMatrix): array
    {
        if (count($meetingData) <= 2) {
            return $meetingData;
        }

        $order = [];
        $remaining = $meetingData;
        $current = array_shift($remaining);
        $order[] = $current;

        while (!empty($remaining)) {
            $bestScore = PHP_FLOAT_MAX;
            $bestIdx = -1;

            foreach ($remaining as $i => $candidate) {
                // Get distance from matrix
                $currentMatrixIdx = array_search($current, $meetingData, true);
                $candidateMatrixIdx = array_search($candidate, $meetingData, true);

                $d = 0;
                if ($currentMatrixIdx !== false && $candidateMatrixIdx !== false) {
                    $d = $distanceMatrix[$currentMatrixIdx][$candidateMatrixIdx] ?? 0;
                }

                $score = $d;

                // Time weighting: 2-4 hour gap is favorable (0.8x multiplier)
                $gap = (strtotime($candidate['meeting']->in_at) - strtotime($current['meeting']->in_at)) / 3600;
                if ($gap >= 2 && $gap <= 4) {
                    $score *= 0.8;
                }

                if ($score < $bestScore) {
                    $bestScore = $score;
                    $bestIdx = $i;
                }
            }

            if ($bestIdx !== -1) {
                $current = $remaining[$bestIdx];
                $order[] = $current;
                array_splice($remaining, $bestIdx, 1);
            } else {
                $current = array_shift($remaining);
                $order[] = $current;
            }
        }

        return $order;
    }

    // =========================================================================
    // PRIVATE METHODS - Group Reduction
    // =========================================================================

    /**
     * Reduce a group to within max distance and duration limits.
     *
     * @return array{meetings: array, was_reduced: bool, removed_meetings: array, original_distance: float, original_duration: int}
     */
    private function reduceGroupToMaxDistance(array $meetingData, float $maxKm): array
    {
        $origDistance = $this->calculateClusterTotalDistance($meetingData);
        $origDuration = $this->calculateClusterTotalDuration($meetingData);
        $maxDurationSeconds = $this->settings->getTourMaxDurationSeconds();

        if ($origDistance <= $maxKm && $origDuration <= $maxDurationSeconds) {
            return [
                'meetings' => $meetingData,
                'was_reduced' => false,
                'removed_meetings' => [],
                'original_distance' => $origDistance,
                'original_duration' => $origDuration,
            ];
        }

        usort($meetingData, fn ($a, $b) => strtotime($a['meeting']->in_at) - strtotime($b['meeting']->in_at));

        $current = $meetingData;
        $removed = [];

        while (
            count($current) > 1 &&
            ($this->calculateClusterTotalDistance($current) > $maxKm || $this->calculateClusterTotalDuration($current) > $maxDurationSeconds)
        ) {
            $toRemove = $this->findMeetingToRemoveForMinimalDistance($current);
            if ($toRemove !== null) {
                $removed[] = $toRemove;
                $removeId = $toRemove['meeting']->id;
                $current = array_values(array_filter($current, fn ($m) => $m['meeting']->id !== $removeId));
            } else {
                break;
            }
        }

        return [
            'meetings' => $current,
            'was_reduced' => !empty($removed),
            'removed_meetings' => $removed,
            'original_distance' => $origDistance,
            'original_duration' => $origDuration,
        ];
    }

    /**
     * Find the meeting whose removal reduces total distance the most.
     */
    private function findMeetingToRemoveForMinimalDistance(array $meetingData): ?array
    {
        if (count($meetingData) <= 1) {
            return null;
        }

        $best = null;
        $bestGain = 0;
        $orig = $this->calculateClusterTotalDistance($meetingData);

        for ($i = 1; $i < count($meetingData) - 1; $i++) {
            $tmp = $meetingData;
            array_splice($tmp, $i, 1);
            $gain = $orig - $this->calculateClusterTotalDistance($tmp);
            if ($gain > $bestGain) {
                $bestGain = $gain;
                $best = $meetingData[$i];
            }
        }

        // Fallback: remove middle element
        if ($best === null && count($meetingData) > 2) {
            return $meetingData[(int) (count($meetingData) / 2)];
        }

        return $best;
    }

    // =========================================================================
    // PRIVATE METHODS - Persistence
    // =========================================================================

    /**
     * Persist tour groups, assignments, and distance matrices to DB.
     *
     * @param  TourGenerator  $tour
     * @param  array  $groups  Array of clusters
     * @param  array  $allMeetingData  All meeting data
     * @return array Array of saved group data
     */
    private function saveEssentialData(TourGenerator $tour, array $groups, array $allMeetingData): array
    {
        $saved = [];
        $reduced = [];
        $removedAll = [];

        foreach ($groups as $groupMeetings) {
            // Reduce group to respect max distance
            $adjusted = $this->reduceGroupToMaxDistance($groupMeetings, $this->settings->getTourMaxEpsKm());

            if (!empty($adjusted['meetings'])) {
                $mat = $this->calculateCombinedMatrices($adjusted['meetings']);

                // Calculate total distance and duration
                $totalKm = 0;
                $totalSec = 0;
                for ($i = 0; $i < count($adjusted['meetings']) - 1; $i++) {
                    $totalKm += $mat['distances'][$i][$i + 1];
                    $totalSec += $mat['durations'][$i][$i + 1];
                }

                // Create group
                $group = TourGeneratorGroup::create([
                    'tour_id' => $tour->id,
                    'sale_id' => null,
                    'total_distance' => $totalKm,
                    'total_duration' => $totalSec,
                ]);

                // Save distance matrix
                $this->saveDistanceMatrix($tour->id, $adjusted['meetings'], $mat);

                // Create assignments
                foreach ($adjusted['meetings'] as $order => $data) {
                    TourGeneratorAssignment::create([
                        'tour_id' => $tour->id,
                        'meeting_id' => $data['meeting']->id,
                        'group_id' => $group->id,
                        'order_in_group' => $order,
                    ]);
                }

                // Extract essential meeting info for response
                $essentialMeetings = array_map(fn ($d) => $this->extractEssentialMeetingData($d), $adjusted['meetings']);

                $saved[] = [
                    'group' => $group,
                    'meetings' => $essentialMeetings,
                    'total_distance' => $totalKm,
                    'total_duration' => $totalSec,
                    'matrices' => $mat,
                ];

                if ($adjusted['was_reduced']) {
                    $removedAll = array_merge($removedAll, $adjusted['removed_meetings']);

                    $essentialRemovedMeetings = array_map(fn ($d) => $this->extractEssentialMeetingData($d), $adjusted['removed_meetings']);

                    $reduced[] = [
                        'original_count' => count($groupMeetings),
                        'final_count' => count($adjusted['meetings']),
                        'removed_meetings' => $essentialRemovedMeetings,
                        'original_distance' => $adjusted['original_distance'],
                        'original_duration' => $adjusted['original_duration'],
                        'final_distance' => $totalKm,
                        'final_duration' => $totalSec,
                    ];
                }
            }
        }

        // Create individual groups for removed meetings
        if (!empty($removedAll)) {
            $this->unassignedMeetings = $removedAll;

            foreach ($removedAll as $data) {
                $g = TourGeneratorGroup::create([
                    'tour_id' => $tour->id,
                    'sale_id' => null,
                    'total_distance' => 0,
                    'total_duration' => 0,
                ]);

                TourGeneratorAssignment::create([
                    'tour_id' => $tour->id,
                    'meeting_id' => $data['meeting']->id,
                    'group_id' => $g->id,
                    'order_in_group' => 0,
                ]);

                $saved[] = [
                    'group' => $g,
                    'meetings' => [$this->extractEssentialMeetingData($data)],
                    'total_distance' => 0,
                    'total_duration' => 0,
                    'matrices' => ['distances' => [[0]], 'durations' => [[0]]],
                ];
            }
        }

        if (!empty($reduced)) {
            $this->reducedGroupsForDistance = $reduced;
        }

        return $saved;
    }

    /**
     * Save distance matrix entries to DB.
     */
    private function saveDistanceMatrix(int $tourId, array $meetingData, array $matrices): void
    {
        $rows = [];
        $now = now();

        for ($i = 0; $i < count($meetingData); $i++) {
            for ($j = 0; $j < count($meetingData); $j++) {
                if ($i !== $j) {
                    $rows[] = [
                        'tour_id' => $tourId,
                        'meeting_id_from' => $meetingData[$i]['meeting']->id,
                        'meeting_id_to' => $meetingData[$j]['meeting']->id,
                        'distance' => $matrices['distances'][$i][$j],
                        'duration' => $matrices['durations'][$i][$j],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        // Bulk insert for performance
        if (!empty($rows)) {
            foreach (array_chunk($rows, 100) as $chunk) {
                TourGeneratorDistanceMatrix::insert($chunk);
            }
        }
    }

    /**
     * Extract essential meeting data for API response (not full Eloquent model).
     */
    private function extractEssentialMeetingData(array $meetingDataItem): array
    {
        $meeting = $meetingDataItem['meeting'];
        $customer = $meeting->customer;
        $address = $customer?->addresses?->first();

        return [
            'id' => $meeting->id,
            'firstname' => $customer?->firstname ?? '',
            'lastname' => $customer?->lastname ?? '',
            'address1' => $address?->address1 ?? '',
            'postcode' => $address?->postcode ?? '',
            'time' => $meeting->in_at?->toDateTimeString(),
        ];
    }

    // =========================================================================
    // PRIVATE METHODS - Result Messages
    // =========================================================================

    /**
     * Build info/warning messages for the generation result.
     */
    private function generateResultMessages(
        Collection $allMeetings,
        array $processedMeetings,
        array $excludedMeetings,
        int $groupsCount
    ): array {
        $messages = [];

        // Success message
        $messages[] = [
            'type' => 'info',
            'text' => sprintf(
                __('Tour generated successfully with %d groups for %d meetings'),
                $groupsCount,
                count($processedMeetings)
            ),
        ];

        // Excluded due to missing addresses
        if (!empty($excludedMeetings)) {
            $meetingDetails = array_map(function ($m) {
                $customer = $m->customer;
                return '#' . $m->id . ' ' . ($customer?->firstname ?? '') . ' ' . ($customer?->lastname ?? '');
            }, $excludedMeetings);

            $messages[] = [
                'type' => 'warning',
                'text' => sprintf(__('%d meeting(s) excluded due to missing/invalid addresses.'), count($excludedMeetings)),
                'meetings' => array_map(function ($m) {
                    $customer = $m->customer;
                    return [
                        'id' => $m->id,
                        'firstname' => $customer?->firstname ?? '',
                        'lastname' => $customer?->lastname ?? '',
                        'time' => $m->in_at?->toDateTimeString(),
                        'address' => __('Invalid/Missing address'),
                    ];
                }, $excludedMeetings),
            ];
        }

        // Excluded clusters (from merge)
        if (!empty($this->excludedClusters)) {
            $messages[] = [
                'type' => 'warning',
                'text' => __('Groups excluded to respect the requested number of salespeople'),
            ];

            foreach ($this->excludedClusters as $i => $c) {
                $meetingDetails = array_map(function ($d) {
                    $customer = $d['meeting']->customer;
                    return '#' . $d['meeting']->id . ' ' . ($customer?->firstname ?? '') . ' ' . ($customer?->lastname ?? '');
                }, $c);

                $messages[] = [
                    'type' => 'warning',
                    'text' => sprintf(__('Excluded group %d: %d meeting(s) (%s)'), $i + 1, count($c), implode(', ', $meetingDetails)),
                    'meetings' => array_map(function ($d) {
                        $customer = $d['meeting']->customer;
                        return [
                            'id' => $d['meeting']->id,
                            'firstname' => $customer?->firstname ?? '',
                            'lastname' => $customer?->lastname ?? '',
                            'time' => $d['meeting']->in_at?->toDateTimeString(),
                        ];
                    }, $c),
                ];
            }

            $messages[] = [
                'type' => 'info',
                'text' => __('Geographic clustering created more natural groups than requested. Small isolated groups were excluded.'),
            ];
        }

        // Reduced groups for distance/duration
        if (!empty($this->reducedGroupsForDistance)) {
            $maxEps = $this->settings->getTourMaxEpsKm();
            $maxDuration = $this->settings->getTourMaxDurationSeconds() / 3600;

            $messages[] = [
                'type' => 'info',
                'text' => sprintf(
                    __('%d group(s) reduced to respect max distance of %s km and max duration of %s hours:'),
                    count($this->reducedGroupsForDistance),
                    $maxEps,
                    number_format($maxDuration, 1)
                ),
            ];

            foreach ($this->reducedGroupsForDistance as $i => $g) {
                $meetingDetails = array_map(function ($m) {
                    return '#' . $m['id'] . ' ' . $m['firstname'] . ' ' . $m['lastname'];
                }, $g['removed_meetings']);

                $messages[] = [
                    'type' => 'info',
                    'text' => sprintf(
                        __('Group %d: %d meeting(s) removed (%s). Distance: %s → %s km, Duration: %s → %s h'),
                        ($i + 1),
                        count($g['removed_meetings']),
                        implode(', ', $meetingDetails),
                        number_format($g['original_distance'], 1),
                        number_format($g['final_distance'], 1),
                        number_format($g['original_duration'] / 3600, 1),
                        number_format($g['final_duration'] / 3600, 1)
                    ),
                    'meetings' => array_map(function ($m) {
                        return [
                            'id' => $m['id'],
                            'firstname' => $m['firstname'],
                            'lastname' => $m['lastname'],
                            'time' => $m['time'] ?? null,
                        ];
                    }, $g['removed_meetings']),
                ];
            }

            $totalRemovedMeetings = array_sum(array_map(fn ($g) => count($g['removed_meetings']), $this->reducedGroupsForDistance));
            $messages[] = [
                'type' => 'info',
                'text' => sprintf(
                    __('Total meetings removed: %d. Assigned individually.'),
                    $totalRemovedMeetings
                ),
            ];
        }

        // Unassigned meetings (individual groups)
        if (!empty($this->unassignedMeetings)) {
            $meetingDetails = array_map(function ($d) {
                $customer = $d['meeting']->customer;
                return '#' . $d['meeting']->id . ' ' . ($customer?->firstname ?? '') . ' ' . ($customer?->lastname ?? '');
            }, $this->unassignedMeetings);

            $messages[] = [
                'type' => 'info',
                'text' => sprintf(
                    __('%d meeting(s) assigned individually (%s)'),
                    count($this->unassignedMeetings),
                    implode(', ', $meetingDetails)
                ),
                'meetings' => array_map(function ($d) {
                    $customer = $d['meeting']->customer;
                    return [
                        'id' => $d['meeting']->id,
                        'firstname' => $customer?->firstname ?? '',
                        'lastname' => $customer?->lastname ?? '',
                        'time' => $d['meeting']->in_at?->toDateTimeString(),
                    ];
                }, $this->unassignedMeetings),
            ];
        }

        return $messages;
    }
}
