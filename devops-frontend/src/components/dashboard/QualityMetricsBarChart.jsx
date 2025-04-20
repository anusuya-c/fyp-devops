import React, { useState, useEffect } from 'react';
import { Card, Text, Center, Loader, useMantineTheme, Stack, Alert, Box } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconAlertTriangle, IconChartBar } from '@tabler/icons-react';

const QualityMetricsBarChart = ({ metrics }) => {
  const theme = useMantineTheme();
  const [chartData, setChartData] = useState([]);
  const [processingError, setProcessingError] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (metrics) {
      setProcessingError(false);
      try {
        const metricsToShow = [
          { key: 'coverage', label: 'Coverage' },
          { key: 'bugs', label: 'Bugs' },
          { key: 'duplicated_lines_density', label: 'Dupl. Density (%)' },
          { key: 'code_smells', label: 'Code Smells' },
          { key: 'vulnerabilities', label: 'Vulnerabilities' },
          { key: 'security_hotspots', label: 'Sec. Hotspots' },
        ];

        const row = { name: 'Metrics' };
        const columnDefs = [];

        for (const metric of metricsToShow) {
          const rawValue = metrics[metric.key];
          const parsedValue = parseFloat(rawValue);
          if (!isNaN(parsedValue)) {
            row[metric.label] = parsedValue;
            columnDefs.push({ name: metric.label, color: theme.colors.blue[6] });
          } else {
            console.warn(`Non-numeric metric skipped: ${metric.label}`);
          }
        }

        setChartData([row]);  // Single row object
        setColumns(columnDefs);

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
    <Card shadow="sm" padding="lg" radius="md" withBorder>
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

        {chartData.length > 0 && columns.length > 0 ? (
          <Box style={{ width: '100%', height: 300 }}>
            <BarChart
              data={chartData}
              dataKey="name"
              series={columns}
              withXAxis
              withYAxis
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        ) : (
          <Center style={{ height: 300 }}>
            <IconChartBar size={30} color={theme.colors.gray[5]} />
            <Text ml="xs" size="sm" c="dimmed">No valid numeric metrics data to display in chart.</Text>
            {processingError && <Text ml="xs" size="xs" c="dimmed">(Some metrics might have non-numeric values)</Text>}
          </Center>
        )}
      </Stack>
    </Card>
  );
};

export default QualityMetricsBarChart;
