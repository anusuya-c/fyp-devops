import React from 'react';
import {
    Card,
    Text,
    Badge,
    Group,
    Stack,
    Divider,
    Accordion,
    Code,
    Anchor,
    List,
    ThemeIcon,
    useMantineTheme,
    Box,
} from '@mantine/core';
import {
    IconGitBranch,
    IconGitCommit,
    IconWorldWww,
    IconBox,
    IconClock,
    IconHistory,
    IconServer,
    IconCheck,
    IconHeart,
    IconAlertTriangle,
    IconX,
} from '@tabler/icons-react';

// --- Helper functions (formatDateTime, getStatusColor, getStatusIcon) remain the same ---
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
         return new Intl.DateTimeFormat('en-NP', {
             year: 'numeric',
             month: 'short',
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit',
             timeZone: 'Asia/Kathmandu',
             hour12: true,
         }).format(date);
    } catch (e) {
        console.error("Error formatting date:", e);
        return isoString;
    }
}

function getStatusColor(status, theme) {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
        case 'synced':
        case 'healthy':
        case 'succeeded':
            return theme.colors.green[6];
        case 'progressing':
        case 'suspended':
            return theme.colors.yellow[6];
        case 'outofsync':
        case 'degraded':
            return theme.colors.orange[6];
        case 'failed':
            return theme.colors.red[6];
        case 'unknown':
        default:
            return theme.colors.gray[6];
    }
}

function getStatusIcon(status) {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
        case 'synced':
        case 'healthy':
        case 'succeeded':
            return <IconCheck size={14} />;
        case 'progressing':
        case 'suspended':
        case 'degraded':
        case 'outofsync':
             return <IconAlertTriangle size={14} />;
         case 'failed':
             return <IconX size={14} />;
        case 'unknown':
        default:
            return null;
    }
}


// --- Main Component ---
// Changed function signature to accept 'app' prop
function ArgoAppCard({ app }) {
    // Log the received app object for debugging
    // console.log('ArgoAppCard received app:', app);

    const theme = useMantineTheme();

    // Check if the 'app' object itself is valid
    // Checking for metadata is a good indicator
    if (!app || !app.metadata) {
        // You might want a more specific message or different handling
        // return <Card shadow="sm" padding="lg" radius="md" withBorder>Invalid application data passed.</Card>;
         // Or return null if you prefer to just not render the card
         return null;
    }

    // 'app' is now directly the application object we need
    // Removed: const app = data.items[0];

    // Safely access nested properties using the 'app' prop
    const metadata = app.metadata || {};
    const spec = app.spec || {};
    const status = app.status || {};
    const syncStatus = status.sync || {};
    const healthStatus = status.health || {};
    const source = spec.source || {};
    const destination = spec.destination || {};
    const operationState = status.operationState || {};
    const history = status.history || [];
    const lastSyncOperation = operationState;


    // Sort history from newest to oldest
    const sortedHistory = [...history].sort((a, b) => (b.id ?? -1) - (a.id ?? -1)); // Added nullish coalescing for safety

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%"> {/* Added h="100%" for consistent height in grid */}
            {/* Header: App Name, Project, Statuses */}
            <Card.Section withBorder inheritPadding py="xs">
                <Group position="apart">
                    <Stack spacing={0}>
                        <Text weight={500} size="lg">{metadata.name || 'N/A'}</Text> {/* Removed "Application:" prefix */}
                        <Group spacing="xs">
                            <IconBox size={16} color={theme.colors.gray[6]} />
                            <Text size="xs" color="dimmed">Project: {spec.project || 'N/A'}</Text>
                        </Group>
                    </Stack>
                    <Group>
                        <Badge
                            variant="light"
                            color={getStatusColor(syncStatus.status, theme)}
                            leftSection={getStatusIcon(syncStatus.status)}
                        >
                            {syncStatus.status || 'Unknown'} {/* Simplified Badge Text */}
                        </Badge>
                        <Badge
                            variant="light"
                            color={getStatusColor(healthStatus.status, theme)}
                            leftSection={<IconHeart size={14} />}
                        >
                             {healthStatus.status || 'Unknown'} {/* Simplified Badge Text */}
                        </Badge>
                    </Group>
                </Group>
            </Card.Section>

            {/* Using flex column layout to push accordion down */}
            <Stack justify="space-between" style={{ flexGrow: 1 }} mt="md" spacing="md">
                 {/* Top Section with details */}
                 <Stack spacing="md">
                    {/* Source Details */}
                    <Box>
                        <Text size="sm" weight={500} mb={3}>Source</Text>
                        <Group spacing="xs" mb={2}>
                            <ThemeIcon variant="light" size="sm" color="gray">
                                <IconWorldWww size={14}/>
                            </ThemeIcon>
                            {/* <Text size="sm">Repo:</Text> */}
                            <Anchor href={source.repoURL} target="_blank" size="sm" truncate>
                                {source.repoURL?.replace(/https?:\/\//, '') || 'N/A'}
                            </Anchor>
                        </Group>
                        <Group spacing="xs" mb={2}>
                             <ThemeIcon variant="light" size="sm" color="gray">
                                <IconGitCommit size={14} />
                             </ThemeIcon>
                            <Code color="blue">{syncStatus.revision?.substring(0, 8) || 'N/A'}</Code>
                            <Text size="xs" color="dimmed">(Target: {source.targetRevision || 'N/A'})</Text>
                        </Group>
                        <Group spacing="xs">
                            <ThemeIcon variant="light" size="sm" color="gray">
                                <IconBox size={14} />
                             </ThemeIcon>
                            <Text size="sm">Path: {source.path || './'}</Text> {/* Default to ./ */}
                        </Group>
                    </Box>

                    <Divider />

                    {/* Destination Details */}
                    <Box>
                        <Text size="sm" weight={500} mb={3}>Destination</Text>
                        <Group spacing="xs" mb={2}>
                             <ThemeIcon variant="light" size="sm" color="gray">
                                <IconServer size={14}/>
                             </ThemeIcon>
                            <Text size="sm" truncate>{destination.server?.replace(/https?:\/\//, '') || 'N/A'}</Text>
                        </Group>
                        <Group spacing="xs">
                            <ThemeIcon variant="light" size="sm" color="gray">
                                <IconBox size={14}/>
                            </ThemeIcon>
                            <Text size="sm">Namespace: {destination.namespace || 'N/A'}</Text>
                        </Group>
                    </Box>

                    <Divider />

                    {/* Last Sync Info */}
                    <Box>
                        {/* <Text size="sm" weight={500} mb={3}>Last Sync</Text> */}
                        <Group spacing="xs">
                            <ThemeIcon variant="light" size="sm" color="gray">
                                <IconClock size={14}/>
                             </ThemeIcon>
                            <Text size="xs">Synced:</Text> {/* Changed label */}
                            <Text size="xs">
                                {formatDateTime(status.reconciledAt || lastSyncOperation.finishedAt)}
                            </Text>
                            {lastSyncOperation.phase && (
                                <Badge
                                    size="xs" // Made smaller
                                    variant="outline"
                                    color={getStatusColor(lastSyncOperation.phase, theme)}
                                >
                                    {lastSyncOperation.phase}
                                </Badge>
                            )}
                        </Group>
                        {/* Conditionally render message only if it exists and phase wasn't successful? */}
                        {lastSyncOperation.message && lastSyncOperation.phase !== 'Succeeded' && (
                             <Text size="xs" color="dimmed" mt={2} lineClamp={2}> {/* Added line clamp */}
                                Message: {lastSyncOperation.message}
                             </Text>
                         )}
                    </Box>
                 </Stack>

                {/* Bottom Section with History Accordion */}
                <Accordion variant="separated" defaultValue={null} > {/* Default collapsed */}
                    <Accordion.Item value="history">
                        <Accordion.Control icon={<IconHistory size={16} />}>
                            History ({sortedHistory.length})
                        </Accordion.Control>
                        <Accordion.Panel>
                            {sortedHistory.length > 0 ? (
                                <List spacing="xs" size="sm" withPadding>
                                    {sortedHistory.slice(0, 5).map((hist) => ( // Show only latest 5 history items
                                        <List.Item
                                            key={hist.id}
                                            icon={
                                                <ThemeIcon color="blue" size={20} radius="xl">
                                                    <IconGitCommit size={12} />
                                                </ThemeIcon>
                                            }
                                        >
                                            <Group position="apart" spacing="sm">
                                                <Code>{hist.revision?.substring(0, 8) || 'N/A'}</Code>
                                                <Text size="xs" color="dimmed" >{formatDateTime(hist.deployedAt)}</Text> {/* Simplified date */}
                                                {/* <Text color="dimmed" >By: {hist.initiatedBy?.username || 'System'}</Text> */}
                                            </Group>
                                        </List.Item>
                                    ))}
                                </List>
                            ) : (
                                <Text size="sm" color="dimmed">No deployment history available.</Text>
                            )}
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Stack>
        </Card>
    );
}

export default ArgoAppCard;