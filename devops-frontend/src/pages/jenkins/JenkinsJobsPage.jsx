import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Loader, Alert, Paper, Stack, UnstyledButton, Group, ThemeIcon, rem } from '@mantine/core';
import { IconAlertCircle, IconChevronRight, IconCode } from '@tabler/icons-react';
import { api } from '../../api/api';
import { AppSidebar } from '../../components/AppSidebar';
import { useNavigate } from 'react-router';

export default function JenkinsJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ... your data fetching logic ...
    const loadJobs = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await api.getJenkinsJobs();
          console.log(data)
          if (data.data && Array.isArray(data.data.jobs)) {
             setJobs(data.data.jobs);
          } else {
              console.error("Unexpected API response format:", data);
              setError("Received invalid data format from the server.");
              setJobs([]);
          }
        } catch (err) {
          setError(err.message || 'Failed to fetch Jenkins jobs.');
          setJobs([]);
        } finally {
          setLoading(false);
        }
      };
      loadJobs();
  }, []);

  const handleJobClick = (job) => {
    navigate(`/jenkins-jobs/${job.name}/details`)
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure full height */}
      <AppSidebar />
      <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
        <Container size="lg"> {/* Optional container for content constraints */}
          <Title order={2} mb="lg">Jenkins Jobs</Title>

          {loading && (
            <Group justify="center" mt="xl">
              <Loader variant="bars" />
              <Text>Loading Jenkins Jobs...</Text>
            </Group>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Stack spacing="md" mt="lg">
              {jobs.length === 0 ? (
                <Paper p="lg" withBorder>
                    <Group justify='center'>
                        <ThemeIcon size="lg" variant="light" color="gray"><IconCode size={rem(24)}/></ThemeIcon>
                        <Text c="dimmed">No Jenkins jobs found.</Text>
                    </Group>
                </Paper>
              ) : (
                jobs.map((job) => (
                  <Paper key={job.name} p="xs" shadow="xs" withBorder sx={(theme) => ({ /* styles */ })} >
                        <Group onClick={() => handleJobClick(job)} justify="space-between" align='middle' noWrap>
                            <Group noWrap>
                                <ThemeIcon color="blue" variant="light" size="sm" radius="md"><IconCode size={rem(22)} /></ThemeIcon>
                                <div> <Text fw={500}>{job.name}</Text> <Text size="xs" c="dimmed" lineClamp={1}>{job.url}</Text> </div>
                            </Group> 
                              <IconChevronRight/>
                        </Group>
                  </Paper>
                ))
              )}
            </Stack>
          )}
        </Container>
      </main>

    </div> 
  );
}