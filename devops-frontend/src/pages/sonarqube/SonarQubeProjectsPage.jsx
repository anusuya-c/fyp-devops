import React, { useEffect, useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router';
import {
    Alert, Anchor, Badge, Breadcrumbs, Container, Group, Loader, Paper, Table, Text, Title
} from '@mantine/core';
import { IconAlertCircle, IconLock, IconWorld, IconListDetails } from '@tabler/icons-react';
import { api } from '../../api/api';
import { AppSidebar } from '../../components/AppSidebar';

export default function SonarQubeProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.getSonarQubeProjects();
                // Backend returns { projects: [...] }
                if (response.data && Array.isArray(response.data.projects)) {
                    setProjects(response.data.projects);
                } else {
                    console.error("Unexpected API response format:", response.data);
                    setError("Received invalid data format from the server.");
                    setProjects([]);
                }
            } catch (err) {
                console.error("Error fetching SonarQube projects:", err);
                let message = 'Failed to fetch SonarQube projects.';
                if (err.response) {
                    // Include backend error if available
                    message += ` Status: ${err.response.status} - ${err.response.data?.error || err.message}`;
                } else {
                    message += ` ${err.message}`;
                }
                setError(message);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []); // Runs once on component mount

    // Breadcrumbs
    const breadcrumbItems = [
        // Add link to home/dashboard if you have one
        // { title: 'Dashboard', href: '/' },
        { title: 'SonarQube Projects', href: '/sonarqube-projects' }, // Current page
    ].map((item, index) => (
        // Use Anchor with RouterLink for correct breadcrumb navigation
        <Anchor component={RouterLink} to={item.href} key={index}>
            {item.title}
        </Anchor>
    ));

    // Table rows rendering
    const rows = projects.map((project) => (
        <Table.Tr key={project.key}>
            <Table.Td>
                {/* Link to future details page */}
                <Anchor component={RouterLink} to={`/sonarqube-projects/${project.key}/details`} fw={500}>
                    {project.name}
                </Anchor>
            </Table.Td>
            <Table.Td>
                <Text size="sm" c="dimmed">{project.key}</Text>
            </Table.Td>
            <Table.Td>
                {project.visibility === 'public' ? (
                    <Badge color="green" variant="light" size="sm" leftSection={<IconWorld size={14} />}>
                        Public
                    </Badge>
                ) : (
                    <Badge color="gray" variant="light" size="sm" leftSection={<IconLock size={14} />}>
                        {project.visibility || 'Private'} {/* Display 'Private' if visibility is other than public */}
                    </Badge>
                )}
            </Table.Td>
            {/* Add more columns if needed, e.g., Last Analysis Date */}
            {/* <Table.Td>
                {project.lastAnalysisDate ? formatTimestamp(Date.parse(project.lastAnalysisDate)) : '-'}
            </Table.Td> */}
        </Table.Tr>
    ));

    return (
        // Layout wrapper (Flexbox) including the sidebar
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AppSidebar  />

            {/* Main Content Area */}
            <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
                <Container size="xl">
                    <Breadcrumbs mb="lg">{breadcrumbItems}</Breadcrumbs>

                    <Title order={2} mb="lg">
                        SonarQube Projects
                    </Title>

                    {loading && (
                        <Group justify="center" mt="xl">
                            <Loader />
                            <Text>Loading SonarQube projects...</Text>
                        </Group>
                    )}

                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg" withCloseButton onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && (
                        <Paper shadow="sm" p="md" withBorder mt="lg">
                            {projects.length === 0 ? (
                                <Group justify='center' p="lg">
                                    <IconListDetails size="1.5rem" stroke={1.5} />
                                    <Text c="dimmed">No SonarQube projects found or accessible.</Text>
                                </Group>
                            ) : (
                                <Table striped highlightOnHover verticalSpacing="sm" fontSize="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Project Name</Table.Th>
                                            <Table.Th>Project Key</Table.Th>
                                            <Table.Th>Visibility</Table.Th>
                                            {/* <Table.Th>Last Analysis</Table.Th> */}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{rows}</Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    )}
                </Container>
            </main>
        </div>
    );
}