import React, { useState, useEffect } from 'react';
import { Card, Text, Center, Loader, useMantineTheme, Stack, Alert, Box } from '@mantine/core';
import { RadarChart } from '@mantine/charts';
import { IconAlertTriangle, IconChartRadar } from '@tabler/icons-react';

// --- Normalization Logic (No longer used for the chart) ---
/* // Commented out or remove if not used elsewhere
const normalizeMetric = (metricName, valueStr) => {
    // ... (previous normalization code) ...
};
*/

// --- Component ---
const QualityMetricsRadarChart = ({ metrics }) => {
    const theme = useMantineTheme();

    // State for the chart data array (will hold raw values)
    const [chartData, setChartData] = useState([]);
    // State to track if an error occurred during parsing/preparation
    const [processingError, setProcessingError] = useState(false);

    // --- Effect for Data Processing (Using Raw Values) ---
    useEffect(() => {
        // Only run processing if metrics data is available
        if (metrics) {
            setProcessingError(false); // Reset error state before trying
            try {
                // Define the metrics we want to display
                const metricsToShow = [
                    { key: 'coverage', label: 'Coverage' },
                    { key: 'bugs', label: 'Bugs' },
                    { key: 'duplicated_lines_density', label: 'Dupl. Density (%)' }, // Assume density is %
                    { key: 'code_smells', label: 'Code Smells' },
                    // Security Rating is often A, B, C - cannot be directly plotted numerically
                    // { key: 'security_rating', label: 'Sec. Rating' },
                    { key: 'vulnerabilities', label: 'Vulnerabilities' },
                    { key: 'security_hotspots', label: 'Sec. Hotspots' },
                ];

                const calculatedData = metricsToShow
                    .map(metricInfo => {
                        const rawValue = metrics[metricInfo.key];
                        const parsedValue = parseFloat(rawValue); // Attempt to parse the value

                        // Return object only if parsing is successful (not NaN)
                        if (!isNaN(parsedValue)) {
                            return {
                                metric: metricInfo.label, // Use the user-friendly label
                                value: parsedValue        // Use the raw numeric value
                            };
                        }
                        // If parsing fails or value is missing, return null to filter out
                        console.warn(`Metric "${metricInfo.label}" (${metricInfo.key}) has non-numeric value:`, rawValue);
                        return null;
                    })
                    .filter(item => item !== null); // Remove entries that failed parsing

                 // console.log("Radar Chart Data (raw values):", calculatedData); // Debug log
                setChartData(calculatedData);

            } catch (error) {
                console.error("Error processing raw chart data in useEffect:", error);
                setProcessingError(true); // Set error state
                setChartData([]); // Clear potentially stale data on error
            }
        } else {
            // Handle case where metrics prop becomes null/undefined after initial render
            setChartData([]);
            setProcessingError(false);
        }
        // Dependency array: recalculate whenever 'metrics' prop changes
    }, [metrics]);

    // --- Render Logic ---

    // 1. Initial Loading State (before metrics arrive)
    if (!metrics) {
        // console.log("Radar Chart: No metrics prop (initial), showing loader."); // Debug log
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Center style={{ height: 300 }}>
                    <Loader size="sm" />
                    <Text ml="xs" size="sm" c="dimmed">Loading metrics data...</Text>
                </Center>
            </Card>
        );
    }

    // 2. Error State (from processing)
    if (processingError) {
         // console.log("Radar Chart: Processing error, showing error message."); // Debug log
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Center style={{ height: 300 }}>
                    <IconAlertTriangle size={30} color={theme.colors.red[6]}/>
                    <Text ml="xs" size="sm" c="dimmed">Error processing metrics.</Text>
                </Center>
            </Card>
        );
       }


    // 3. Main Render (using state for chartData with raw values)
    // console.log("Radar Chart: Rendering main content with raw data."); // Debug log
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack>
                <Text size="sm" fw={500} ta="center">
                    Code Quality Overview (Raw Values)
                </Text>
                {/* Optional: Alert for Quality Gate Status */}
                {metrics?.alert_status && metrics.alert_status !== 'OK' && (
                    <Alert icon={<IconAlertTriangle size="1rem" />} title="Quality Gate Status" color={metrics.alert_status === 'ERROR' ? 'red' : 'yellow'} radius="xs" variant="light">
                        {metrics.alert_status}
                    </Alert>
                )}

                {chartData && chartData.length > 0 ? (
                    <Box style={{ width: '100%', height: 300, minHeight: 300 }}>
                        <RadarChart
                            data={chartData}
                            dataKey="metric" // The label for each axis
                            withPolarAngleAxis
                            withPolarRadiusAxis // Shows the radial scale lines
                            // domain={[0, 'auto']} // Optional: Ensure scale starts at 0
                            series={[
                                // Series now uses 'value' which contains the raw number
                                { name: 'value', color: theme.colors.blue[6], opacity: 0.6 }
                            ]}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </Box>
                ) : (
                    <Center style={{ height: 300 }}>
                        <IconChartRadar size={30} color={theme.colors.gray[5]}/>
                        <Text ml="xs" size="sm" c="dimmed">No valid numeric metrics data to display in chart.</Text>
                         {/* Provide more context if some metrics were excluded */}
                         {processingError && <Text ml="xs" size="xs" c="dimmed">(Some metrics might have non-numeric values)</Text>}
                    </Center>
                )}
            </Stack>
        </Card>
    );
};

export default QualityMetricsRadarChart;