// src/components/ReportGenerator.jsx
import React, { useState } from 'react';
import { Button, Group, Alert, Box, Text } from '@mantine/core';
import { IconAlertCircle, IconDownload, IconFileAnalytics } from '@tabler/icons-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { notifications } from '@mantine/notifications';

import { api } from '../api/api'; // Adjust path
import DevOpsReportDocument from './pdf/DevOpsReportDocument'; // Adjust path

function ReportGenerator() {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // --- Configuration ---
    const jenkinsJobName = 'pipeline';
    const sonarqubeProjectKey = 'website';
    // --- ---

    const generateReport = async () => {
        setStatus('loading');
        setError(null);
        setReportData(null);
        notifications.show({
             id: 'report-loading',
             loading: true,
             title: 'Generating Report',
             message: 'Fetching data from Argo CD, Jenkins, and SonarQube...',
             autoClose: false,
             withCloseButton: false,
         });

        try {
            const results = await Promise.allSettled([
                api.getArgocdApplications(), // Assumes returns { data: { items: [...] } }
                api.getJenkinsJobDetails(jenkinsJobName), // Expects { data: { builds: [...] } } based on user info
                api.getSonarQubeProjectDetails(sonarqubeProjectKey) // Expects { data: { projectKey: '..', metrics: {...} } } based on user info
            ]);

            // Extract data, checking actual structures
            const argoResponse = results[0];
            const jenkinsResponse = results[1];
            const sonarqubeResponse = results[2];

            let fetchedArgoData = null;
            let fetchedJenkinsData = null;
            let fetchedSonarqubeData = null;
            let errors = [];

            // Process Argo CD
            if (argoResponse.status === 'fulfilled' && argoResponse.value?.data?.items && Array.isArray(argoResponse.value.data.items)) {
                fetchedArgoData = argoResponse.value.data; // Contains { items: [...] }
                console.log("Argo CD Data OK");
            } else {
                errors.push(`Argo CD: ${argoResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("Argo CD fetch error/format:", argoResponse);
            }

            // --- CORRECTED Jenkins Data Handling ---
            // Check if the response has 'data' and 'data.builds' is an array
            if (jenkinsResponse.status === 'fulfilled' && jenkinsResponse.value?.data?.builds && Array.isArray(jenkinsResponse.value.data.builds)) {
                 // Directly access response.data.builds
                 fetchedJenkinsData = {
                     jobName: jenkinsJobName,
                     builds: jenkinsResponse.value.data.builds.sort((a, b) => b.number - a.number),
                 };
                 console.log("Jenkins Data OK");
             } else {
                 errors.push(`Jenkins (${jenkinsJobName}): ${jenkinsResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("Jenkins fetch error/format:", jenkinsResponse);
             }

            // --- CORRECTED SonarQube Data Handling ---
             // Check if the response has 'data' and 'data.metrics' exists
            if (sonarqubeResponse.status === 'fulfilled' && sonarqubeResponse.value?.data?.metrics) {
                 // Directly access response.data.metrics and response.data.projectKey
                 fetchedSonarqubeData = {
                     // Use projectKey from response if available, fallback to config
                     projectKey: sonarqubeResponse.value.data.projectKey || sonarqubeProjectKey,
                     metrics: sonarqubeResponse.value.data.metrics,
                 };
                 console.log("SonarQube Data OK");
             } else {
                 errors.push(`SonarQube (${sonarqubeProjectKey}): ${sonarqubeResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("SonarQube fetch error/format:", sonarqubeResponse);
             }

            // --- End of Corrected Handling ---


            // Aggregate results
            const aggregatedData = {
                argoData: fetchedArgoData,
                jenkinsData: fetchedJenkinsData,
                sonarqubeData: fetchedSonarqubeData,
            };

            // Update notification based on errors
            if (errors.length > 0) {
                const errorMessage = `Failed to fetch some data: ${errors.join('; ')}`;
                setError(errorMessage); // Set error state for Alert display
                notifications.update({
                    id: 'report-loading',
                    color: 'orange',
                    title: errors.length < 3 ? 'Partial Report Data' : 'Report Failed', // Adjust title based on severity
                    message: errorMessage,
                    icon: <IconAlertCircle size="1rem" />,
                    loading: false,
                    autoClose: 7000, // Longer display for errors
                    withCloseButton: true,
                });
                // Allow download if *any* data was fetched
                if (fetchedArgoData || fetchedJenkinsData || fetchedSonarqubeData) {
                    setReportData(aggregatedData);
                    setStatus('success'); // Allow downloading partial report
                } else {
                    setStatus('error'); // No useful data fetched
                }
            } else {
                // All successful
                setReportData(aggregatedData);
                setStatus('success');
                notifications.update({
                    id: 'report-loading',
                    color: 'green',
                    title: 'Report Ready',
                    message: 'Click Download to get the PDF.',
                    icon: <IconDownload size="1rem" />,
                    loading: false,
                    autoClose: 4000,
                    withCloseButton: true,
                 });
            }

        } catch (err) { // Catch unexpected errors
            console.error("Unexpected error generating report:", err);
            const message = err.message || 'An unknown error occurred.';
            setError(message);
            setStatus('error');
            notifications.update({
                id: 'report-loading',
                color: 'red',
                title: 'Report Generation Failed',
                message: message,
                icon: <IconAlertCircle size="1rem" />,
                loading: false,
                autoClose: 7000,
                withCloseButton: true,
            });
        }
    };

    const resetState = () => {
        setStatus('idle');
        setReportData(null);
        setError(null);
    };

    return (
        <Box>
            <Group >
                {/* Initial Generate Button or Reset Button */}
                {(status === 'idle' || status === 'error') && (
                    <Button
                        leftSection={<IconFileAnalytics size={18} />}
                        onClick={generateReport}
                        loading={status === 'loading'}
                        disabled={status === 'loading'}
                    >
                        Generate DevOps Report
                    </Button>
                )}

                {/* Download Button/Link */}
                {status === 'success' && reportData && (
                    <PDFDownloadLink
                        document={
                            <DevOpsReportDocument
                                argoData={reportData.argoData} // Pass null if fetch failed
                                jenkinsData={reportData.jenkinsData} // Pass null if fetch failed
                                sonarqubeData={reportData.sonarqubeData} // Pass null if fetch failed
                            />
                        }
                        fileName={`devops_report_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_')}.pdf`}
                    >
                        {({ blob, url, loading, error: pdfError }) => (
                            <Button
                                leftSection={<IconDownload size={18} />}
                                loading={loading}
                                color={pdfError ? 'red' : (error ? 'orange' : 'green')} // Orange if partial data, green if full
                                title={pdfError ? 'Error generating PDF' : (error ? 'Download Partial Report' : 'Download Full Report')}
                            >
                                {loading ? 'Preparing PDF...' : (pdfError ? 'PDF Error' : 'Download Report')}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}

                {/* Show Generate New button after success or partial success */}
                {status === 'success' && (
                    <Button variant="default" onClick={resetState} size="sm">
                        Generate New
                    </Button>
                )}
            </Group>

            {/* Display Fetching Error near the button */}
            {status === 'error' && error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Data Fetching Error" color="red" mt="sm" radius="xs" withCloseButton onClose={resetState}>
                    {error}
                </Alert>
            )}
        </Box>
    );
}

export default ReportGenerator;