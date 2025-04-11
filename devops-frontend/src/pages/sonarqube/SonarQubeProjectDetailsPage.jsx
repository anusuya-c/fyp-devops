import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Alert, Anchor, Badge, Breadcrumbs, Container, Group, Loader, Paper, SimpleGrid, Text, Title, Tooltip, Box
} from '@mantine/core';
import {
    IconAlertCircle, IconBug, IconShieldLock, IconFlame, IconDropletHalf2Filled, IconPercentage,
    IconCode, IconScale, IconShieldCheck, IconHeartRateMonitor, IconCircleCheck, IconCircleX, IconClockHour8, IconInfoCircle
} from '@tabler/icons-react';
import { api } from '../../api/api';
import { AppSidebar } from '../../components/AppSidebar';
import { formatSqDebt, formatSqPercentage, getSqRatingProps, getSqQualityGateProps, getSqMetricLabel } from '../../utils/formatting'

// Helper component to display a single metric
function MetricDisplay({ metricKey, value }) {
    const label = getSqMetricLabel(metricKey);
    let displayValue = value ?? '-';
    let valueColor = undefined;
    let ValueIcon = IconInfoCircle; // Default icon

    // Custom formatting and icons based on metric key
    switch (metricKey) {
        case 'ncloc':
            displayValue = value ? parseInt(value, 10).toLocaleString() : '-'; // Format large numbers
            ValueIcon = IconCode;
            break;
        case 'bugs':
             ValueIcon = IconBug;
             valueColor = parseInt(value, 10) > 0 ? 'red' : 'green';
             break;
        case 'vulnerabilities':
             ValueIcon = IconShieldLock;
             valueColor = parseInt(value, 10) > 0 ? 'red' : 'green';
             break;
        case 'security_hotspots':
             ValueIcon = IconFlame;
             valueColor = parseInt(value, 10) > 0 ? 'orange' : undefined;
             break;
        case 'code_smells':
             ValueIcon = IconDropletHalf2Filled; // Example icon
             break;
        case 'coverage':
            displayValue = formatSqPercentage(value);
            ValueIcon = IconPercentage;
            valueColor = parseFloat(value) < 80 ? 'orange' : 'green'; // Example threshold
            break;
        case 'duplicated_lines_density':
            displayValue = formatSqPercentage(value);
            ValueIcon = IconPercentage; // Or a specific duplication icon
            valueColor = parseFloat(value) > 5 ? 'orange' : undefined; // Example threshold
            break;
        case 'sqale_index': // Technical Debt
            displayValue = formatSqDebt(value);
            ValueIcon = IconClockHour8;
            break;
        case 'sqale_rating': // Maintainability Rating
        case 'security_rating':
        case 'reliability_rating': {
            const { label: ratingLabel, color: ratingColor } = getSqRatingProps(value);
            displayValue = ratingLabel;
            valueColor = ratingColor; // Use badge color directly?
            ValueIcon = metricKey === 'sqale_rating' ? IconScale : (metricKey === 'security_rating' ? IconShieldCheck : IconHeartRateMonitor);
            // Display as Badge instead of Text
             return (
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                        <ValueIcon size="1.2rem" stroke={1.5} />
                    </Group>
                    <Badge color={valueColor || 'gray'} size="xl" mt="sm" variant='light'>{displayValue}</Badge>
                </Paper>
            );
        }
        case 'alert_status': { // Quality Gate
            const { label: gateLabel, color: gateColor } = getSqQualityGateProps(value);
            displayValue = gateLabel;
            valueColor = gateColor;
            ValueIcon = value === 'OK' ? IconCircleCheck : IconCircleX;
            // Display as Badge instead of Text
             return (
                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                        <ValueIcon size="1.2rem" stroke={1.5} />
                    </Group>
                     <Badge color={valueColor || 'gray'} size="xl" mt="sm" variant='light'>{displayValue}</Badge>
                </Paper>
            );
        }
        default:
            // Default display for unformatted metrics
            break;
    }

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                 <ValueIcon size="1.2rem" stroke={1.5} />
            </Group>
            <Text size="xl" fw={700} c={valueColor} mt="sm">
                {displayValue}
            </Text>
        </Paper>
    );
}


export default function SonarQubeProjectDetailsPage() {
    const { projectKey } = useParams(); // Get project key from URL
    const [metrics, setMetrics] = useState(null); // Store metrics as an object
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectKey) {
            setError("Project key not found in URL.");
            setLoading(false);
            return;
        }

        const loadDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch details using the API client
                const response = await api.getSonarQubeProjectDetails(projectKey);
                 // Backend returns { projectKey: '...', metrics: { bugs: '0', ... } }
                if (response.data && response.data.metrics) {
                    setMetrics(response.data.metrics);
                } else {
                    console.error("Unexpected API response format:", response.data);
                    setError("Received invalid metric data format from the server.");
                    setMetrics(null);
                }
            } catch (err) {
                console.error(`Error fetching SonarQube details for ${projectKey}:`, err);
                let message = `Failed to fetch details for project ${projectKey}.`;
                 if (err.response) {
                    message += ` Status: ${err.response.status} - ${err.response.data?.error || err.message}`;
                    // Specific message for 404
                    if (err.response.status === 404) {
                         message = `SonarQube project '${projectKey}' not found or access denied.`
                    }
                } else {
                    message += ` ${err.message}`;
                }
                setError(message);
                setMetrics(null);
            } finally {
                setLoading(false);
            }
        };

        loadDetails();
    }, [projectKey]); // Reload if projectKey changes

    // Breadcrumbs
    const breadcrumbItems = [
        { title: 'SonarQube Projects', href: '/sonarqube-projects' },
        { title: projectKey || 'Details', href: `/sonarqube-projects/${projectKey}/details` }, // Current page
    ].map((item, index) => (
        <Anchor component={RouterLink} to={item.href} key={index}>
            {item.title}
        </Anchor>
    ));

    // Filter and sort metrics for display (optional)
    const displayMetrics = metrics
        ? Object.entries(metrics).filter(([key, value]) => value !== null && value !== undefined) // Filter out nulls
        // You could add sorting logic here if needed
        : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AppSidebar />
            <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
                <Container size="xl">
                    <Breadcrumbs mb="lg">{breadcrumbItems}</Breadcrumbs>

                    <Title order={2} mb="lg">
                        SonarQube Details: {projectKey}
                    </Title>

                    {loading && (
                        <Group justify="center" mt="xl">
                            <Loader />
                            <Text>Loading SonarQube project details...</Text>
                        </Group>
                    )}

                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg" withCloseButton onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && metrics && (
                        <SimpleGrid
                           cols={{ base: 1, xs: 2, md: 3, lg: 4 }} // Responsive grid columns
                           spacing="md"
                           mt="lg"
                        >
                           {displayMetrics.length > 0 ? (
                                displayMetrics.map(([key, value]) => (
                                    <MetricDisplay key={key} metricKey={key} value={value} />
                                ))
                           ) : (
                                 <Group justify='center' p="lg" style={{ gridColumn: '1 / -1' }}> {/* Span full width */}
                                    <IconInfoCircle size="1.5rem" stroke={1.5} />
                                    <Text c="dimmed">No metrics data found for this project.</Text>
                                 </Group>
                           )}
                        </SimpleGrid>
                    )}
                     {/* Handle case where loading is done, no error, but metrics is still null */}
                     {!loading && !error && !metrics && (
                         <Group justify='center' p="lg" mt="lg">
                             <IconInfoCircle size="1.5rem" stroke={1.5} />
                             <Text c="dimmed">No metrics data available.</Text>
                         </Group>
                     )}
                </Container>
            </main>
        </div>
    );
}