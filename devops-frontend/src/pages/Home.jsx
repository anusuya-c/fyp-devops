import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";
import AverageBuildDuration from "../components/dashboard/AverageBuildDuration";
import { api } from "../api/api";
import BuildStatusChart from "../components/dashboard/BuildStatusChart";
import { Grid } from "@mantine/core";
import QualityMetricsRadarChart from "../components/dashboard/QualityMetricsRadarChart";

export default function HomePage() {

  const [builds, setBuilds] = useState([]);
  const [metrics, setMetrics] = useState(null);

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

  const staticData = [{ metric: 'A', score: 50 }, { metric: 'B', score: 80 }];

  // ... later in the return

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
        <div>
          <h1>DevSecOps Security Monitor</h1>
          <p>-Secure -Automate -Monitor</p>
        </div>
        <div>
          <AverageBuildDuration builds={builds} />
        </div>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }} mt="md">
            <BuildStatusChart builds={builds} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 12 }} mt="md">
            <QualityMetricsRadarChart metrics={metrics} />
          </Grid.Col>

        </Grid>
      </main>
    </div>
  )
}
