import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";
import AverageBuildDuration from "../components/dashboard/AverageBuildDuration";
import { api } from "../api/api";
import BuildStatusChart from "../components/dashboard/BuildStatusChart";
import { Card, Grid, Stack, Text, Button, Alert, Modal, Badge, Group, ActionIcon, Box, Collapse } from "@mantine/core";
import ReportGenerator from "../components/ReportGenerator";
import QualityMetricsBarChart from "../components/dashboard/QualityMetricsBarChart";
import html2canvas from 'html2canvas';
import { IconBell, IconAlertCircle, IconX, IconChevronDown } from "@tabler/icons-react";

export default function HomePage() {
  const [builds, setBuilds] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [donutChartImg, setDonutChartImg] = useState(null);
  const [barChartImg, setBarChartImg] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [historyOpened, setHistoryOpened] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.getNotifications();
        if (response.data) {
          setNotifications(response.data);
          const unseen = response.data.filter(n => !n.is_seen).length;
          setUnseenCount(unseen);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsSeen = async (notificationId) => {
    try {
      await api.markNotificationAsSeen(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_seen: true } : n
        )
      );
      setUnseenCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as seen:", err);
    }
  };

  useEffect(() => {
    const captureCharts = async () => {
      const donutChartElement = document.getElementById('build-status-chart');
      const barChartElement = document.getElementById('quality-metrics-chart');

      if (donutChartElement) {
        try {
          const canvas = await html2canvas(donutChartElement);
          setDonutChartImg(canvas.toDataURL());
        } catch (error) {
          console.error("Error capturing build status chart:", error);
        }
      }

      if (barChartElement) {
        try {
          const canvas = await html2canvas(barChartElement);
          setBarChartImg(canvas.toDataURL());
        } catch (error) {
          console.error("Error capturing quality metrics chart:", error);
        }
      }
    };

    captureCharts();
  }, [builds, metrics]);

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        const data = await api.getJenkinsJobDetails('pipeline');
        if (data.data && Array.isArray(data.data.builds)) {
          setBuilds(data.data.builds.sort((a, b) => b.number - a.number));
        } else {
          console.error("Unexpected API response format:", data);
          setError("Received invalid data format from the server.");
          setBuilds([]);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch Jenkins job details.");
        setBuilds([]);
      }
    };

    const loadDetails = async () => {
      try {
        const response = await api.getSonarQubeProjectDetails('website');
        if (response.data && response.data.metrics) {
          setMetrics(response.data.metrics);
        } else {
          console.error("Unexpected API response format:", response.data);
          setMetrics(null);
        }
      } catch (err) {
        console.error("Error fetching SonarQube details:", err);
        if (err.response) {
          if (err.response.status === 404) {
            setError("SonarQube project not found or access denied.");
          } else {
            setError(`Failed to fetch SonarQube details. Status: ${err.response.status}`);
          }
        } else {
          setError("Failed to fetch SonarQube details.");
        }
        setMetrics(null);
      }
    };

    loadJobDetails();
    loadDetails();
  }, []);

  // Split notifications into unseen and seen
  const unseenNotifications = notifications.filter(n => !n.is_seen);
  const seenNotifications = notifications.filter(n => n.is_seen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto', marginLeft:'230px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>DevSecOps Security Monitor</h1>
          </div>
          <div>
            <Box pos="relative" style={{ display: 'inline-block' }}>
              <ActionIcon 
                variant="subtle" 
                size="xl" 
                onClick={() => setIsNotificationModalOpen(true)}
              >
                <IconBell size="2rem" />
              </ActionIcon>
              {unseenCount > 0 && (
                <Badge 
                  size="sm" 
                  variant="filled" 
                  color="red" 
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    minWidth: '1.2rem',
                    height: '1.2rem',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '1rem',
                    pointerEvents: 'none',
                    transform: 'translate(25%, -25%)',
                  }}
                >
                  {unseenCount}
                </Badge>
              )}
            </Box>
          </div>
        </div>
        
        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Error" 
            color="red" 
            mb="md"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Modal
          opened={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          title="Notifications"
          size="xl"
        >
          <Stack spacing="md">
            {/* Current Notifications */}
            {unseenNotifications.length === 0 && seenNotifications.length === 0 ? (
              <Text c="dimmed" ta="center">No notifications</Text>
            ) : (
              <>
                {unseenNotifications.length > 0 && (
                  <div>
                    <Text fw={500} mb="sm">New Notifications</Text>
                    <Grid>
                      {unseenNotifications.map(notification => (
                        <Grid.Col key={notification.id} span={12}>
                          <Card withBorder>
                            <Box pos="relative">
                              <ActionIcon 
                                variant="subtle" 
                                color="blue" 
                                onClick={() => handleMarkAsSeen(notification.id)}
                                pos="absolute"
                                top={0}
                                right={0}
                                style={{ zIndex: 1 }}
                              >
                                <IconX size="1rem" />
                              </ActionIcon>
                              <div>
                                <Group position="apart" align="center">
                                  <div>
                                    <Text fw={500}>Build #{notification.build_number}</Text>
                                    <Text size="sm" c="dimmed">{notification.job_name}</Text>
                                  </div>
                                  <Badge 
                                    color={notification.build_status === 'SUCCESS' ? 'green' : 
                                           notification.build_status === 'FAILURE' ? 'red' : 'yellow'}
                                  >
                                    {notification.build_status}
                                  </Badge>
                                </Group>
                                <Text size="xs" c="dimmed" mt="xs">
                                  {new Date(notification.created_at).toLocaleString()}
                                </Text>
                              </div>
                            </Box>
                          </Card>
                        </Grid.Col>
                      ))}
                    </Grid>
                  </div>
                )}

                {/* History Section */}
                {seenNotifications.length > 0 && (
                  <div>
                    <Button 
                      variant="subtle" 
                      onClick={() => setHistoryOpened(o => !o)}
                      rightIcon={<IconChevronDown 
                        size="1rem" 
                        style={{ 
                          transform: historyOpened ? 'rotate(180deg)' : 'none',
                          transition: 'transform 200ms ease',
                        }} 
                      />}
                      fullWidth
                    >
                      History ({seenNotifications.length})
                    </Button>
                    
                    <Collapse in={historyOpened}>
                      <Grid mt="xs">
                        {seenNotifications.map(notification => (
                          <Grid.Col key={notification.id} span={12}>
                            <Card withBorder>
                              <Group position="apart" align="center">
                                <div>
                                  <Text fw={500}>Build #{notification.build_number}</Text>
                                  <Text size="sm" c="dimmed">{notification.job_name}</Text>
                                </div>
                                <Badge 
                                  color={notification.build_status === 'SUCCESS' ? 'green' : 
                                         notification.build_status === 'FAILURE' ? 'red' : 'yellow'}
                                >
                                  {notification.build_status}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed" mt="xs">
                                {new Date(notification.created_at).toLocaleString()}
                              </Text>
                            </Card>
                          </Grid.Col>
                        ))}
                      </Grid>
                    </Collapse>
                  </div>
                )}
              </>
            )}
          </Stack>
        </Modal>

        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} mt="md">
            <AverageBuildDuration builds={builds} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }} mt="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder h={"100%"}>
              <Stack spacing="md">
                <Text fw={500} size="md" mb={20}>Generate Report</Text>
                <ReportGenerator donutChartImg={donutChartImg} barChartImg={barChartImg} />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }} mt="md">
            <div id="quality-metrics-chart">
              <QualityMetricsBarChart metrics={metrics} />
            </div>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }} mt="md">
            <div id="build-status-chart">
              <BuildStatusChart builds={builds} />
            </div>
          </Grid.Col>
        </Grid>
      </main>
    </div>
  );
}
