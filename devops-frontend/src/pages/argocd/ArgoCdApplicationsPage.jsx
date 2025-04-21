import { useEffect, useState } from 'react';
import {
    Alert,
    Anchor,
    Breadcrumbs,
    Container,
    Group,
    Loader,
    Paper,
    Text,
    Title,
    SimpleGrid, // Import SimpleGrid for layout
} from '@mantine/core';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { AppSidebar } from '../../components/AppSidebar';
import { api } from '../../api/api';
import ArgoAppCard from '../../components/ArgoAppCard';

export default function ArgoCdApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.getArgocdApplications();
                const data = response.data;

                if (data && Array.isArray(data.items)) {
                     // Sort alphabetically by name for consistency
                    setApplications(data.items.sort((a, b) => (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? '')));
                } else {
                    console.error("Unexpected API response format:", data);
                    setError("Received invalid data format from the server.");
                    setApplications([]);
                }
            } catch (err) {
                console.error("Failed to fetch Argo CD applications:", err);
                // Improve error message display
                let errorMessage = "An unexpected error occurred.";
                if (err.response) {
                    // Extract details if it's an Axios error or similar
                     errorMessage = `Error ${err.response.status}: ${err.response.data?.message || err.response.statusText}`;
                } else if (err.request) {
                    errorMessage = "The server did not respond. Please check your network connection or the API endpoint.";
                 } else if (err.message) {
                    errorMessage = err.message;
                 }
                 setError(errorMessage);
                setApplications([]); // Clear data on error
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on component mount

    // Breadcrumbs for navigation
    const breadcrumbItems = [
        { title: 'Home', href: '/' }, // Link to your dashboard or home
        { title: 'Argo CD Applications', href: '/argocd-apps' }, // Current page
    ].map((item, index) => (
        // Consider using react-router-dom's Link if you use it for routing
        <Anchor href={item.href} key={index}>
            {item.title}
        </Anchor>
    ));

    return (
        // Layout wrapper (Flexbox) including the sidebar
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AppSidebar /> {/* Your existing sidebar */}

            {/* Main Content Area */}
            <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto', marginLeft: '230px' }}>
                <Container size="xl"> {/* Adjust size as needed */}
                    

                    <Title order={2} mb="lg">
                        Argo CD Applications
                    </Title>

                    {loading && (
                        <Group justify="center" mt="xl">
                            <Loader />
                            <Text>Loading Argo CD Applications...</Text>
                        </Group>
                    )}

                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error Fetching Applications" color="red" mt="lg" withCloseButton onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && (
                        <>
                            {applications.length === 0 ? (
                                <Paper shadow="sm" p="lg" withBorder mt="lg">
                                    <Group justify='center'>
                                        <IconInfoCircle size="1.5rem" stroke={1.5} color='gray'/>
                                        <Text c="dimmed">No Argo CD applications found.</Text>
                                     </Group>
                                </Paper>
                            ) : (
                                <SimpleGrid
                                    cols={1} // Responsive columns
                                    spacing="lg"
                                    verticalSpacing="lg"
                                    mt="lg"
                                >
                                    {applications.map((app) => (
                                        // Pass the individual application item to the card
                                        // Ensure 'app' contains the necessary structure expected by ArgoAppCard
                                        <ArgoAppCard key={app.metadata?.uid ?? app.metadata?.name} app={app} />
                                    ))}
                                </SimpleGrid>
                            )}
                        </>
                    )}
                </Container>
            </main>
        </div>
    );
}