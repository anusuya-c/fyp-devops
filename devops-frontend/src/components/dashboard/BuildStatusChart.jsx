import React from 'react';
import { Card, Text, Center, Loader, useMantineTheme, Stack } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconChartDonut3, IconCircleCheck, IconCircleX, IconCircleMinus } from '@tabler/icons-react'; 

const BuildStatusChart = ({ builds }) => {
  const theme = useMantineTheme(); // Hook to access theme colors\
  const statusCounts = builds?.reduce(
    (acc, build) => {
      const result = build?.result; // Handle potentially missing result
      if (result === 'SUCCESS') {
        acc.success += 1;
      } else if (result === 'FAILURE') {
        acc.failure += 1;
      } else if (result === 'ABORTED') {
        acc.aborted += 1;
      }
      return acc;
    },
    { success: 0, failure: 0, aborted: 0 } // Initial counts
  ) || { success: 0, failure: 0, aborted: 0 }; // Default if builds is null/undefined

  const totalBuildsCounted = statusCounts.success + statusCounts.failure + statusCounts.aborted;

  const chartData = [
    { name: 'Success', value: statusCounts.success, color: theme.colors.green[6] }, // Use theme colors
    { name: 'Failure', value: statusCounts.failure, color: theme.colors.red[6] },
    { name: 'Aborted', value: statusCounts.aborted, color: theme.colors.gray[6] }, // Or orange, etc.
  ].filter(segment => segment.value > 0); 

  if (!builds) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Center style={{ height: 300 }}> {/* Give card a height during loading */}
          <Loader size="sm" />
          <Text ml="xs" size="sm" c="dimmed">Loading build data...</Text>
        </Center>
      </Card>
    );
  }

  if (totalBuildsCounted === 0) {
     return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
         <Stack align="center" justify="center" style={{ height: 300 }}>
            <IconChartDonut3 size={40} stroke={1.5} color={theme.colors.gray[5]}/>
            <Text size="sm" c="dimmed">No build status data available.</Text>
         </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack>
         <Text size="sm" fw={500} ta="center" mb="xs">
           Build Status Overview
         </Text>
         <Center>
             <DonutChart
                data={chartData}
                size={300} // Adjust size as needed
                thickness={50} // Adjust thickness as needed
                withTooltip
                tooltipDataSource="segment" // Show tooltip based on the segment hovered
             />
         </Center>
         <Stack spacing={4} mt="md" align="center">
            {chartData.map((item) => (
                 <Center key={item.name}>
                    <div style={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: '50%', marginRight: 8 }}></div>
                    <Text size="md">{item.name}: {item.value}</Text>
                 </Center>
            ))}
         </Stack>
      </Stack>
    </Card>
  );
};



export default BuildStatusChart;