import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";
import AverageBuildDuration from "../components/dashboard/AverageBuildDuration";
import { api } from "../api/api";
import BuildStatusChart from "../components/dashboard/BuildStatusChart";
import { Card, Grid, Stack, Text } from "@mantine/core";
import ReportGenerator from "../components/ReportGenerator";
import QualityMetricsBarChart from "../components/dashboard/QualityMetricsBarChart";
import html2canvas from 'html2canvas';

export default function HomePage() {

  const [builds, setBuilds] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [donutChartImg, setDonutChartImg] = useState(null);
  const [barChartImg, setBarChartImg] = useState(null);

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
        setError(err.message || `Failed to fetch details for job ${jobName}.`);
        setBuilds([]);
      }
    };

    const loadDetails = async () => {
      try {
        // Fetch details using the API client
        const response = await api.getSonarQubeProjectDetails('website');
        // Backend returns { projectKey: '...', metrics: { bugs: '0', ... } }
        if (response.data && response.data.metrics) {
          setMetrics(response.data.metrics);
        } else {
          console.error("Unexpected API response format:", response.data);
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
        setMetrics(null);
      }
    };

    loadJobDetails();
    loadDetails();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto', marginLeft:'230px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>DevSecOps Security Monitor</h1>
          </div>
        </div>
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
  )
}
