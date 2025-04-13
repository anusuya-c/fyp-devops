import React from 'react';
import { Card, Text, Stack, Center, Loader } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import { formatDuration } from '../../utils/formatting';

const AverageBuildDuration = ({ builds }) => { 

  const successfulBuilds = builds?.filter(
    (build) => build.result === 'SUCCESS' && typeof build.duration_ms === 'number'
  ) || []; 
  let averageDurationMs = 0;
  let displayValue = 'N/A';
  let supportingText = 'No successful builds found.';

  if (successfulBuilds.length > 0) {
    const totalDurationMs = successfulBuilds.reduce(
      (sum, build) => sum + build.duration_ms,
      0
    );
    averageDurationMs = totalDurationMs / successfulBuilds.length;

    try {
        displayValue = formatDuration(averageDurationMs);
    } catch (error) {
        console.error("Error formatting duration:", error);
        displayValue = "Error"; // Or handle error appropriately
    }

    supportingText = `Based on ${successfulBuilds.length} successful build(s).`;
  }

  if (!builds) {
      return (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center>
                  <Loader size="sm" />
                  <Text ml="xs" size="sm" c="dimmed">Loading build data...</Text>
              </Center>
          </Card>
      );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" spacing="xs">
        {/* Title */}
        <Text size="sm" c="dimmed" ta="center">
          Avg. Successful Build Duration
        </Text>

        {/* Value */}
        <Text size="xl" fw={700} ta="center">
           <IconClockHour4 size={22} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
           {/* Display the value formatted by your function */}
           {displayValue}
        </Text>

        {/* Supporting Info */}
        <Text size="xs" c="dimmed" ta="center">
          {supportingText}
        </Text>
      </Stack>
    </Card>
  );
};

export default AverageBuildDuration;