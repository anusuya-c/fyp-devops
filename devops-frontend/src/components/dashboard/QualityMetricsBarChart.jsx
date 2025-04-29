import React, { useState, useEffect } from 'react';
import { Card, Text, Center, Loader, useMantineTheme, Stack, Alert, Box } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconAlertTriangle, IconChartBar } from '@tabler/icons-react';

const QualityMetricsBarChart = ({ metrics }) => {
  const theme = useMantineTheme();
  const [chartData, setChartData] = useState([]);
  const [processingError, setProcessingError] = useState(false);
  const chartSeries = [{ name: 'value', color: theme.colors.blue[6] }];

  useEffect(() => {
    if (metrics) {
      setProcessingError(false);
      try {
        const metricsToShow = [
          { key: 'coverage', label: 'Coverage (%)' },
          { key: 'bugs', label: 'Bugs' },
          { key: 'duplicated_lines_density', label: 'Dupl. Density (%)' },
          { key: 'code_smells', label: 'Code Smells' }, 
          { key: 'vulnerabilities', label: 'Vulnerabilities' }, 
          { key: 'security_hotspots', label: 'Sec. Hotspots' },
        ];

        const processedData = [];

        for (const metric of metricsToShow) {
          const rawValue = metrics[metric.key];
          const parsedValue = parseFloat(rawValue);

          if (!isNaN(parsedValue)) {
            processedData.push({
              metric: metric.label,
              value: parsedValue,
            });
          } else {
            console.warn(`Non-numeric metric skipped (won't be plotted): ${metric.label}`);
          }
        }

        setChartData(processedData);

      } catch (error) {
        console.error("Error processing chart data:", error);
        setProcessingError(true);
        setChartData([]);
      }
    } else {
      setChartData([]);
      setProcessingError(false);
    }
  }, [metrics, theme.colors.blue]);

  if (!metrics) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Center style={{ height: 300 }}>
          <Loader size="sm" />
          <Text ml="xs" size="sm" c="dimmed">Loading metrics data...</Text>
        </Center>
      </Card>
    );
  }

  if (processingError) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Center style={{ height: 300 }}>
          <IconAlertTriangle size={30} color={theme.colors.red[6]} />
          <Text ml="xs" size="sm" c="dimmed">Error processing metrics.</Text>
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={560}>
      <Stack>
        <Text size="sm" fw={500} ta="center">
          Code Quality Overview
        </Text>

        {metrics?.alert_status && metrics.alert_status !== 'OK' && (
          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            title="Quality Gate Status"
            color={metrics.alert_status === 'ERROR' ? 'red' : 'yellow'}
            radius="xs"
            variant="light"
          >
            {metrics.alert_status}
          </Alert>
        )}

        {chartData.length > 0 ? (
          // Increased height slightly more to accommodate angled labels
          <Box style={{ width: '100%', height: 380 }}>
            <BarChart
              data={chartData}
              dataKey="metric"
              series={chartSeries}
              tickLine="none" // Clean look: remove tick lines
              gridAxis="y"
              withXAxis
              withYAxis
              xAxisProps={{
                // --- Settings for labels ---
                tick: { fill: theme.black, fontSize: 12 }, // Smaller font size (adjust 10 as needed)
                interval: 0,         // Force display of all labels
                // angle: -45,          // Angle labels to prevent overlap
                // textAnchor: 'end',   // Anchor angled text to the end point for better alignment
                // dy: 5,            // Optional: Adjust vertical position if needed after angling
                // dx: -5           // Optional: Adjust horizontal position if needed after angling
              }}
              yAxisProps={{
                 tick: { fill: theme.black, fontSize: 10 }, // Smaller font size for Y-axis too
                 // domain: [0, 'auto'] // Ensure Y axis starts at 0 if needed
              }}
              style={{ width: '100%', height: '100%' }}
              // Optional: Adjust margins if angled labels get cut off
              // margin={{ bottom: 30 }}
            />
          </Box>
        ) : (
          <Center style={{ height: 300 }}>
            <IconChartBar size={30} color={theme.colors.gray[5]} />
            <Text ml="xs" size="sm" c="dimmed">No valid numeric metrics data to display in chart.</Text>
          </Center>
        )}
      </Stack>
    </Card>
  );
};

export default QualityMetricsBarChart;