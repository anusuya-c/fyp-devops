// src/components/ReportGenerator.jsx
import React, { useState } from 'react';
import { Button, Group, Alert, Box, Text } from '@mantine/core';
import { IconAlertCircle, IconDownload, IconFileAnalytics } from '@tabler/icons-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { notifications } from '@mantine/notifications';

import { api } from '../api/api'; // Adjust path
import DevOpsReportDocument from './pdf/DevOpsReportDocument'; // Adjust path

function ReportGenerator({barChartImg, donutChartImg}) {
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
                api.getArgocdApplications(),
                api.getJenkinsJobDetails(jenkinsJobName),
                api.getSonarQubeProjectDetails(sonarqubeProjectKey)
            ]);

            const argoResponse = results[0];
            const jenkinsResponse = results[1];
            const sonarqubeResponse = results[2];

            let fetchedArgoData = null;
            let fetchedJenkinsData = null;
            let fetchedSonarqubeData = null;
            let errors = [];

            if (argoResponse.status === 'fulfilled' && argoResponse.value?.data?.items && Array.isArray(argoResponse.value.data.items)) {
                fetchedArgoData = argoResponse.value.data;
                console.log("Argo CD Data OK");
            } else {
                errors.push(`Argo CD: ${argoResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("Argo CD fetch error/format:", argoResponse);
            }

            if (jenkinsResponse.status === 'fulfilled' && jenkinsResponse.value?.data?.builds && Array.isArray(jenkinsResponse.value.data.builds)) {
                 fetchedJenkinsData = {
                     jobName: jenkinsJobName,
                     builds: jenkinsResponse.value.data.builds.sort((a, b) => b.number - a.number),
                 };
                 console.log("Jenkins Data OK");
             } else {
                 errors.push(`Jenkins (${jenkinsJobName}): ${jenkinsResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("Jenkins fetch error/format:", jenkinsResponse);
             }

            if (sonarqubeResponse.status === 'fulfilled' && sonarqubeResponse.value?.data?.metrics) {
                 fetchedSonarqubeData = {
                     projectKey: sonarqubeResponse.value.data.projectKey || sonarqubeProjectKey,
                     metrics: sonarqubeResponse.value.data.metrics,
                 };
                 console.log("SonarQube Data OK");
             } else {
                 errors.push(`SonarQube (${sonarqubeProjectKey}): ${sonarqubeResponse.reason?.message || 'Fetch failed/Invalid format'}`);
                 console.error("SonarQube fetch error/format:", sonarqubeResponse);
             }

            const aggregatedData = {
                argoData: fetchedArgoData,
                jenkinsData: fetchedJenkinsData,
                sonarqubeData: fetchedSonarqubeData,
                barChartImg,
                donutChartImg,
            };

            if (errors.length > 0) {
                const errorMessage = `Failed to fetch some data: ${errors.join('; ')}`;
                setError(errorMessage);
                notifications.update({
                    id: 'report-loading',
                    color: 'orange',
                    title: errors.length < 3 ? 'Partial Report Data' : 'Report Failed',
                    message: errorMessage,
                    icon: <IconAlertCircle size="1rem" />,
                    loading: false,
                    autoClose: 7000,
                    withCloseButton: true,
                });
                if (fetchedArgoData || fetchedJenkinsData || fetchedSonarqubeData) {
                    setReportData(aggregatedData);
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } else {
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

        } catch (err) {
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
                                barChartImg={reportData.barChartImg}
                                donutChartImg={reportData.donutChartImg}
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