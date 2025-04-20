// src/components/pdf/DevOpsReportDocument.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Import your formatting functions - ensure they don't rely on browser/DOM APIs
import {
    formatDuration, formatTimestamp, getResultColor, getResultText, // Assuming getResultColor is adapted or not used for PDF color directly
    formatSqDebt, formatSqPercentage, getSqRatingProps, getSqQualityGateProps, getSqMetricLabel
} from '../../utils/formatting'; // Adjust path as needed

// --- Register Fonts (Optional but Recommended) ---
// Font.register({ family: 'YourFontFamily', src: '/path/to/font.ttf' });

// --- Styles ---
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontSize: 9, // Smaller base font size for PDF
        fontFamily: 'Helvetica', // Default fallback font
    },
    section: {
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    header: {
        fontSize: 16,
        marginBottom: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#111111',
    },
    subHeader: {
        fontSize: 12,
        marginBottom: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
    },
    text: {
        marginBottom: 4,
        lineHeight: 1.3,
    },
    boldText: {
        fontFamily: 'Helvetica-Bold',
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 0.5, // Thinner border for PDF
        borderColor: '#cccccc',
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#cccccc',
        borderBottomWidth: 0.5,
        alignItems: 'stretch', // Stretch items to fill height
        minHeight: 18,
    },
    tableHeaderRow: {
        backgroundColor: '#f0f0f0',
        fontFamily: 'Helvetica-Bold',
        minHeight: 20,
    },
    tableColHeader: {
        borderRightColor: '#cccccc',
        borderRightWidth: 0.5,
        padding: 4,
        flexGrow: 1,
        flexBasis: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
         alignItems: 'center', // Vertically center header text
         justifyContent: 'center',
    },
    tableCol: {
        borderRightColor: '#cccccc',
        borderRightWidth: 0.5,
        padding: 4,
        flexGrow: 1,
        flexBasis: 0,
         justifyContent: 'center', // Vertically center content
    },
    // Jenkins Column Flex Weights
    jenkinsBuildCol: { flex: 1 },
    jenkinsResultCol: { flex: 1.5, textAlign: 'center' },
    jenkinsStartCol: { flex: 2.5 },
    jenkinsDurationCol: { flex: 1.5 },
    jenkinsEndCol: { flex: 2.5 },
    // Argo Column Flex Weights
    argoAppCol: { flex: 2.5 },
    argoStatusCol: { flex: 1, textAlign: 'center' },
    argoSourceCol: { flex: 3.5 },
    argoDestCol: { flex: 2.5 },
    // SQ Column Flex Weights
    sqMetricCol: { flex: 3 },
    sqValueCol: { flex: 2 },
    // Last column styling
    lastCol: {
        borderRightWidth: 0,
    },
    code: {
        fontFamily: 'Courier', // Use a monospace font if available/registered
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 2,
        fontSize: 8,
    },
    // --- Status Colors for PDF ---
     statusOk: { color: '#28a745' }, // Green
     statusWarn: { color: '#fd7e14' }, // Orange
     statusFail: { color: '#dc3545' }, // Red
     statusUnknown: { color: '#6c757d' }, // Gray
     statusProgress: { color: '#0d6efd' }, // Blue
});

// --- PDF Status Style Helper (Simplified for common statuses) ---
const getPdfStatusStyle = (status, building = false) => {
    if (building) return styles.statusProgress;
    const lower = status?.toLowerCase() || 'unknown';
    // Combine common OK/WARN/FAIL states
    if (['synced', 'healthy', 'succeeded', 'ok', 'passed', 'stable', 'a'].includes(lower)) return styles.statusOk;
    if (['progressing', 'degraded', 'unstable', 'outofsync', 'b', 'c', 'warn'].includes(lower)) return styles.statusWarn;
    if (['failed', 'error', 'aborted', 'd', 'e'].includes(lower)) return styles.statusFail;
    return styles.statusUnknown;
};

// --- The PDF Document Component ---
// Use props: { argoData, jenkinsData, sonarqubeData }
const DevOpsReportDocument = ({ argoData, jenkinsData, sonarqubeData }) => (
    <Document title="DevOps Report">
        <Page size="A4" style={styles.page} orientation="landscape"> {/* Landscape might fit tables better */}

            {/* --- Report Header --- */}
            <View style={styles.section}>
                <Text style={styles.header}>DevOps Dashboard Report</Text>
                <Text style={styles.text}>
                    Generated: {formatTimestamp ? formatTimestamp(Date.now()) : new Date().toLocaleString()}
                </Text>
            </View>

            {/* --- Argo CD Section --- */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.subHeader}>Argo CD Applications</Text>
                {(argoData?.items && argoData.items.length > 0) ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                            <Text style={[styles.tableColHeader, styles.argoAppCol]}>Application / Project</Text>
                            <Text style={[styles.tableColHeader, styles.argoStatusCol]}>Sync</Text>
                            <Text style={[styles.tableColHeader, styles.argoStatusCol]}>Health</Text>
                            <Text style={[styles.tableColHeader, styles.argoSourceCol]}>Source</Text>
                            <Text style={[styles.tableColHeader, styles.argoDestCol, styles.lastCol]}>Destination</Text>
                        </View>
                        {argoData.items.map(app => {
                            const md = app.metadata || {}; const sp = app.spec || {}; const st = app.status || {};
                            const sync = st.sync || {}; const health = st.health || {};
                            const src = sp.source || {}; const dst = sp.destination || {};
                            return (
                                <View key={md.uid || md.name} style={styles.tableRow} wrap={false}>
                                    <View style={[styles.tableCol, styles.argoAppCol]}>
                                        <Text style={styles.boldText}>{md.name || 'N/A'}</Text>
                                        <Text>Proj: {sp.project || 'default'}</Text>
                                    </View>
                                    <Text style={[styles.tableCol, styles.argoStatusCol, getPdfStatusStyle(sync.status)]}>{sync.status || '-'}</Text>
                                    <Text style={[styles.tableCol, styles.argoStatusCol, getPdfStatusStyle(health.status)]}>{health.status || '-'}</Text>
                                    <View style={[styles.tableCol, styles.argoSourceCol]}>
                                        <Text>Repo: {src.repoURL?.split('/').slice(-2).join('/') || '-'}</Text> {/* Shorten URL */}
                                        <Text>Target: {src.targetRevision || 'HEAD'} (<Text style={styles.code}>{sync.revision?.substring(0, 7) || '-'}</Text>)</Text>
                                        <Text>Path: {src.path || '.'}</Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.argoDestCol, styles.lastCol]}>
                                        <Text>Srv: {dst.server?.replace(/https?:\/\//, '') || '-'}</Text>
                                        <Text>NS: {dst.namespace || '-'}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No Argo CD application data available.</Text>)}
            </View>

            {/* --- Jenkins Section --- */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.subHeader}>Jenkins Build History: {jenkinsData?.jobName || 'pipeline'}</Text>
                {(jenkinsData?.builds && jenkinsData.builds.length > 0) ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                            <Text style={[styles.tableColHeader, styles.jenkinsBuildCol]}>Build</Text>
                            <Text style={[styles.tableColHeader, styles.jenkinsResultCol]}>Result</Text>
                            <Text style={[styles.tableColHeader, styles.jenkinsStartCol]}>Started</Text>
                            <Text style={[styles.tableColHeader, styles.jenkinsDurationCol]}>Duration</Text>
                            <Text style={[styles.tableColHeader, styles.jenkinsEndCol, styles.lastCol]}>Finished</Text>
                        </View>
                        {jenkinsData.builds.slice(0, 10).map(build => { // Display latest 10
                            const resultText = getResultText(build.result, build.building);
                            const resultStyle = getPdfStatusStyle(build.result, build.building);
                            return (
                                <View key={build.number} style={styles.tableRow} wrap={false}>
                                    <Text style={[styles.tableCol, styles.jenkinsBuildCol]}>#{build.number}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsResultCol, resultStyle]}>{resultText}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsStartCol]}>{formatTimestamp(build.start_time_ms)}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsDurationCol]}>{formatDuration(build.duration_ms)}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsEndCol, styles.lastCol]}>{formatTimestamp(build.end_time_ms)}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No Jenkins build data available for '{jenkinsData?.jobName || 'pipeline'}'.</Text>)}
            </View>

            {/* --- SonarQube Section --- */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.subHeader}>SonarQube Metrics: {sonarqubeData?.projectKey || 'website'}</Text>
                {(sonarqubeData?.metrics && Object.keys(sonarqubeData.metrics).length > 0) ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                            <Text style={[styles.tableColHeader, styles.sqMetricCol]}>Metric</Text>
                            <Text style={[styles.tableColHeader, styles.sqValueCol, styles.lastCol]}>Value</Text>
                        </View>
                        {Object.entries(sonarqubeData.metrics)
                            .filter(([key, value]) => value !== null && value !== undefined && getSqMetricLabel(key)) // Only show metrics with labels
                            .sort(([keyA], [keyB]) => { // Sort for consistent order
                                const order = ['alert_status', 'bugs', 'vulnerabilities', 'security_hotspots', 'code_smells', 'coverage', 'duplicated_lines_density', 'ncloc', 'sqale_index', 'reliability_rating', 'security_rating', 'sqale_rating'];
                                return (order.indexOf(keyA) === -1 ? 99 : order.indexOf(keyA)) - (order.indexOf(keyB) === -1 ? 99 : order.indexOf(keyB));
                            })
                            .map(([key, value]) => {
                                const label = getSqMetricLabel(key);
                                let displayValue = value ?? '-';
                                let valueStyle = {};

                                // Apply specific formatting/styling
                                try { // Wrap formatting in try/catch
                                    switch (key) {
                                        case 'ncloc': displayValue = value ? parseInt(value, 10).toLocaleString() : '-'; break;
                                        case 'coverage': case 'duplicated_lines_density': displayValue = formatSqPercentage(value); break;
                                        case 'sqale_index': displayValue = formatSqDebt(value); break;
                                        case 'alert_status':
                                        case 'sqale_rating': case 'security_rating': case 'reliability_rating': {
                                            const props = key === 'alert_status' ? getSqQualityGateProps(value) : getSqRatingProps(value);
                                            displayValue = props.label;
                                            valueStyle = getPdfStatusStyle(props.label); // Use label/rating for style
                                            break;
                                        }
                                        case 'bugs': case 'vulnerabilities':
                                            valueStyle = parseInt(value, 10) > 0 ? styles.statusFail : styles.statusOk; break;
                                        case 'security_hotspots':
                                            valueStyle = parseInt(value, 10) > 0 ? styles.statusWarn : styles.statusOk; break;
                                    }
                                } catch (formatError) {
                                    console.error("PDF Formatting Error:", formatError);
                                    displayValue = value ?? '-'; // Fallback to raw value
                                }

                                return (
                                    <View key={key} style={styles.tableRow} wrap={false}>
                                        <Text style={[styles.tableCol, styles.sqMetricCol]}>{label}</Text>
                                        <Text style={[styles.tableCol, styles.sqValueCol, styles.lastCol, valueStyle]}>{displayValue}</Text>
                                    </View>
                                );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No SonarQube metrics data available for '{sonarqubeData?.projectKey || 'website'}'.</Text>)}
            </View>

             {/* --- Footer (Optional) --- */}
            <Text style={{ position: 'absolute', bottom: 15, left: 30, right: 30, textAlign: 'center', color: 'grey', fontSize: 8 }} fixed render={({ pageNumber, totalPages }) => (
               `Page ${pageNumber} / ${totalPages}`
             )} />

        </Page>
    </Document>
);

export default DevOpsReportDocument;