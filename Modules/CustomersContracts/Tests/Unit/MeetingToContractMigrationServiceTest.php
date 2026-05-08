<?php

namespace Modules\CustomersContracts\Tests\Unit;

use Modules\CustomersContracts\Services\MeetingToContractMigrationService;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class MeetingToContractMigrationServiceTest extends TestCase
{
    public function test_it_refuses_to_transform_a_meeting_without_a_customer(): void
    {
        $meeting = new CustomerMeeting();
        $meeting->setRawAttributes([
            'id' => 1,
            'customer_id' => null,
            'polluter_id' => 5,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Meeting has no customer');

        (new MeetingToContractMigrationService())->transform($meeting);
    }

    public function test_it_refuses_to_transform_a_meeting_without_a_polluter(): void
    {
        $meeting = new CustomerMeeting();
        $meeting->setRawAttributes([
            'id' => 1,
            'customer_id' => 100,
            'polluter_id' => null,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Meeting has no polluter');

        (new MeetingToContractMigrationService())->transform($meeting);
    }
}
