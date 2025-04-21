import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { api } from "../../api/api";
import { Alert, Anchor, Badge, Breadcrumbs, Container, Group, Loader, Paper, Table, Text, Title, Tooltip } from "@mantine/core";
import { AppSidebar } from "../../components/AppSidebar";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { formatDuration, formatTimestamp, getResultColor, getResultText } from "../../utils/formatting";

export default function JenkinsJobDetailsPage() {
  // Get the jobName parameter from the URL
  const { jobName } = useParams();

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobName) {
      setError("Job name not found in URL.");
      setLoading(false);
      return;
    }

    const loadJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getJenkinsJobDetails(jobName);
        // Check if the expected 'builds' array exists
        if (data.data && Array.isArray(data.data.builds)) {
          // Sort builds by number descending (most recent first)
          setBuilds(data.data.builds.sort((a, b) => b.number - a.number));
        } else {
          console.error("Unexpected API response format:", data);
          setError("Received invalid data format from the server.");
          setBuilds([]);
        }
      } catch (err) {
        setError(err.message || `Failed to fetch details for job ${jobName}.`);
        setBuilds([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
    // Reload if the jobName parameter changes (might happen with complex navigation)
  }, [jobName]);

  // Breadcrumbs for navigation
  const breadcrumbItems = [
    { title: 'Jenkins Jobs', href: '/jenkins-jobs' },
    { title: jobName, href: `/jenkins-jobs/${jobName}/details` }, // Current page
  ].map((item, index) => (

    <Navigate to={item.href} key={index}>
        {item.title}
    </Navigate>
  ));

  // Table rows rendering
  const rows = builds.map((build) => (
    <Table.Tr key={build.number}>
      <Table.Td>
        <Anchor href={build.url} target="_blank" rel="noopener noreferrer">
          #{build.number}
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Badge color={getResultColor(build.result, build.building)} variant="light" size="sm">
          {getResultText(build.result, build.building)}
        </Badge>
      </Table.Td>
      <Table.Td>
          <Tooltip label={`Started: ${formatTimestamp(build.start_time_ms)}`} withArrow position="top">
              <Text size="sm">{formatTimestamp(build.start_time_ms)}</Text>
          </Tooltip>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDuration(build.duration_ms)}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatTimestamp(build.end_time_ms)}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    // Layout wrapper (Flexbox) including the sidebar
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto', marginLeft: '230px' }}>
        <Container size="xl"> {/* Use a wider container if needed */}

          <Title order={2} mb="lg">
            Build History: {jobName}
          </Title>

          {loading && (
            <Group justify="center" mt="xl">
              <Loader />
              <Text>Loading build history...</Text>
            </Group>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Paper shadow="sm" p="md" withBorder mt="lg">
              {builds.length === 0 ? (
                 <Group justify='center' p="lg">
                    <IconInfoCircle size="1.5rem" stroke={1.5} />
                    <Text c="dimmed">No build history found for this job.</Text>
                 </Group>
              ) : (
                <Table striped highlightOnHover verticalSpacing="sm" fontSize="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Build #</Table.Th>
                      <Table.Th>Result</Table.Th>
                      <Table.Th>Start Time</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>End Time</Table.Th>
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