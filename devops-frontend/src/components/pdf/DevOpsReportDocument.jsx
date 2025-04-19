// src/components/pdf/DevOpsReportDocument.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Import your formatting functions (ensure they are compatible)
import {
    formatDuration, formatTimestamp, getResultColor, getResultText,
    formatSqDebt, formatSqPercentage, getSqRatingProps, getSqQualityGateProps, getSqMetricLabel
} from '../../utils/formatting'; // Adjust path

// --- Font Registration (Update paths as needed) ---
// Make sure these TTF files exist in your /public folder or accessible path
try {
    Font.register({
        family: 'Lato',
        fonts: [
            { src: '/fonts/Lato-Regular.ttf' }, // path relative to public folder
            { src: '/fonts/Lato-Bold.ttf', fontWeight: 'bold' },
            // { src: '/fonts/Lato-Italic.ttf', fontStyle: 'italic' },
        ]
    });
    Font.register({
        family: 'Roboto Mono', // Example monospace font
        fonts: [
            { src: '/fonts/RobotoMono-Regular.ttf' },
        ]
    });
} catch (e) {
    console.warn("Could not register custom fonts for PDF. Using default.", e);
    // Fallback fonts (Helvetica, Courier) will be used if registration fails
}
// --- ---

// --- Color Palette ---
const colors = {
    primary: '#0d47a1', // Darker Blue
    secondary: '#1565c0', // Medium Blue
    accent: '#42a5f5', // Lighter Blue
    textPrimary: '#212121', // Dark Gray
    textSecondary: '#616161', // Medium Gray
    border: '#e0e0e0', // Light Gray Border
    backgroundLight: '#f5f5f5', // Very Light Gray Background
    statusOk: '#2e7d32',    // Darker Green
    statusWarn: '#ed6c02',   // Darker Orange
    statusFail: '#c62828',   // Darker Red
    statusUnknown: '#757575', // Darker Gray
    statusProgress: '#0288d1', // Darker Info Blue
};

// --- Styles ---
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 35, // Increased padding
        fontSize: 9, // Base font size
        fontFamily: 'Lato', // Use registered font
        color: colors.textPrimary,
        lineHeight: 1.4,
    },
    section: {
        marginBottom: 20, // Increased spacing
        paddingBottom: 10,
    },
     sectionWithBorder: {
         borderBottomWidth: 1,
         borderBottomColor: colors.border,
     },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    logo: {
        width: 80, // Adjust as needed
        height: 40, // Adjust as needed
        opacity: 0.8,
    },
    reportTitle: {
        fontSize: 20,
        fontFamily: 'Lato', // Use regular weight for title, bold below
        fontWeight: 'bold', // Explicitly set bold
        color: colors.primary,
        textAlign: 'right',
    },
    generatedDate: {
        fontSize: 9,
        color: colors.textSecondary,
        textAlign: 'right',
    },
    subHeader: {
        fontSize: 13,
        fontFamily: 'Lato',
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.secondary,
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: colors.accent,
    },
    text: {
        marginBottom: 4,
    },
    boldText: {
        fontFamily: 'Lato',
        fontWeight: 'bold', // Ensure bold font is used
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%', // Use full width
        borderStyle: 'solid',
        borderWidth: 0.5,
        borderColor: colors.border,
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 20,
    },
    tableRowZebra: {
        backgroundColor: colors.backgroundLight,
    },
    tableHeaderRow: {
        backgroundColor: colors.secondary, // Use secondary color
        color: '#FFFFFF', // White text
        fontFamily: 'Lato',
        fontWeight: 'bold',
        minHeight: 22,
    },
    tableColHeader: {
        borderRightColor: colors.border,
        borderRightWidth: 0.5,
        padding: 5, // Slightly more padding
        flexGrow: 1,
        flexBasis: 0,
        textAlign: 'center',
        fontFamily: 'Lato', // Ensure header uses the font
        fontWeight: 'bold',
        color: '#FFFFFF', // Ensure header text is white
         alignItems: 'center',
         justifyContent: 'center',
    },
    tableCol: {
        borderRightColor: colors.border,
        borderRightWidth: 0.5,
        padding: 5,
        flexGrow: 1,
        flexBasis: 0,
        justifyContent: 'center', // Better vertical align
        overflow: 'hidden', // Prevent text overflow issues (experimental)
    },
    // --- Column Flex Weights (Adjust as needed) ---
    // Jenkins
    jenkinsBuildCol: { flex: 1 },
    jenkinsResultCol: { flex: 1.5, textAlign: 'center' },
    jenkinsStartCol: { flex: 2.5 },
    jenkinsDurationCol: { flex: 1.5 },
    jenkinsEndCol: { flex: 2.5 },
    // Argo
    argoAppCol: { flex: 2.5 },
    argoStatusCol: { flex: 1, textAlign: 'center' },
    argoSourceCol: { flex: 3.5 },
    argoDestCol: { flex: 2.5 },
    // SQ
    sqMetricCol: { flex: 3 },
    sqValueCol: { flex: 2 },
    // --- ---
    lastCol: {
        borderRightWidth: 0,
    },
    code: {
        fontFamily: 'Roboto Mono', // Use registered monospace font
        backgroundColor: '#e0e0e0', // Slightly darker background
        paddingHorizontal: 3,
        paddingVertical: 1,
        fontSize: 8,
        borderRadius: 2,
        color: colors.textPrimary,
    },
    // --- Status Colors ---
    statusTextBase: {
        fontFamily: 'Lato', // Ensure status uses the font
        fontWeight: 'bold', // Make status text bold
        textTransform: 'uppercase', // Uppercase for status
        fontSize: 8, // Slightly smaller status text
    },
    statusOk: { color: colors.statusOk },
    statusWarn: { color: colors.statusWarn },
    statusFail: { color: colors.statusFail },
    statusUnknown: { color: colors.statusUnknown },
    statusProgress: { color: colors.statusProgress },
    // --- Footer ---
    pageNumber: {
        position: 'absolute',
        fontSize: 8,
        bottom: 15,
        left: 0,
        right: 40, // Adjust to align right
        textAlign: 'right',
        color: colors.textSecondary,
        fontFamily: 'Lato',
    },
});

// --- PDF Status Style Helper ---
const getPdfStatusStyle = (status, building = false) => {
    if (building) return styles.statusProgress;
    const lower = status?.toLowerCase() || 'unknown';
    if (['synced', 'healthy', 'succeeded', 'ok', 'passed', 'stable', 'a'].includes(lower)) return styles.statusOk;
    if (['progressing', 'degraded', 'unstable', 'outofsync', 'b', 'c', 'warn'].includes(lower)) return styles.statusWarn;
    if (['failed', 'error', 'aborted', 'd', 'e'].includes(lower)) return styles.statusFail;
    return styles.statusUnknown;
};

// --- Helper to safely format timestamps ---
const safeFormatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
        // Use a simpler, reliable format if Intl fails or isn't needed
        return formatTimestamp ? formatTimestamp(timestamp) : new Date(timestamp).toLocaleString('en-US');
    } catch {
        return String(timestamp); // Fallback
    }
};
const safeFormatDuration = (duration) => {
    if (duration === null || duration === undefined) return '-';
     try {
        return formatDuration ? formatDuration(duration) : `${(duration / 1000).toFixed(1)}s`;
    } catch {
        return String(duration);
    }
};


// --- The PDF Document Component ---
const DevOpsReportDocument = ({ argoData, jenkinsData, sonarqubeData }) => (
    <Document title="DevOps Report">
        <Page size="A4" style={styles.page} orientation="landscape">

            {/* --- Header --- */}
             <View style={styles.headerContainer} fixed>
                {/* Add Logo - Replace with your actual logo path */}
                {/* <Image src="/images/your_logo.png" style={styles.logo} /> */}
                <View style={{ textAlign: 'right' }}>
                    <Text style={styles.reportTitle}>DevOps Dashboard Report</Text>
                    <Text style={styles.generatedDate}>
                        Generated: {safeFormatTimestamp(Date.now())}
                    </Text>
                 </View>
             </View>

            {/* --- Argo CD Section --- */}
            <View style={[styles.section, styles.sectionWithBorder]} wrap={false}>
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
                        {argoData.items.map((app, index) => { // Added index for zebra striping
                            const md = app.metadata || {}; const sp = app.spec || {}; const st = app.status || {};
                            const sync = st.sync || {}; const health = st.health || {};
                            const src = sp.source || {}; const dst = sp.destination || {};
                            const rowStyle = index % 2 === 1 ? [styles.tableRow, styles.tableRowZebra] : styles.tableRow; // Zebra style
                            return (
                                <View key={md.uid || md.name} style={rowStyle} wrap={false}>
                                    <View style={[styles.tableCol, styles.argoAppCol]}>
                                        <Text style={styles.boldText}>{md.name || 'N/A'}</Text>
                                        <Text style={{ fontSize: 8, color: colors.textSecondary }}>Proj: {sp.project || 'default'}</Text>
                                    </View>
                                    <Text style={[styles.tableCol, styles.argoStatusCol, styles.statusTextBase, getPdfStatusStyle(sync.status)]}>{sync.status || '-'}</Text>
                                    <Text style={[styles.tableCol, styles.argoStatusCol, styles.statusTextBase, getPdfStatusStyle(health.status)]}>{health.status || '-'}</Text>
                                    <View style={[styles.tableCol, styles.argoSourceCol]}>
                                        <Text style={{ fontSize: 8 }}>Repo: {src.repoURL?.split('/').slice(-2).join('/') || '-'}</Text>
                                        <Text style={{ fontSize: 8 }}>Target: {src.targetRevision || 'HEAD'} (<Text style={styles.code}>{sync.revision?.substring(0, 7) || '-'}</Text>)</Text>
                                        <Text style={{ fontSize: 8 }}>Path: {src.path || '.'}</Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.argoDestCol, styles.lastCol]}>
                                        <Text style={{ fontSize: 8 }}>Srv: {dst.server?.replace(/https?:\/\//, '') || '-'}</Text>
                                        <Text style={{ fontSize: 8 }}>NS: {dst.namespace || '-'}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No Argo CD application data available.</Text>)}
            </View>

            {/* --- Jenkins Section --- */}
            <View style={[styles.section, styles.sectionWithBorder]} wrap={false}>
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
                        {jenkinsData.builds.slice(0, 10).map((build, index) => { // Latest 10 builds
                            const resultText = getResultText(build.result, build.building);
                            const resultStyle = getPdfStatusStyle(build.result, build.building);
                            const rowStyle = index % 2 === 1 ? [styles.tableRow, styles.tableRowZebra] : styles.tableRow;
                            return (
                                <View key={build.number} style={rowStyle} wrap={false}>
                                    <Text style={[styles.tableCol, styles.jenkinsBuildCol]}><Text style={styles.boldText}>#{build.number}</Text></Text>
                                    <Text style={[styles.tableCol, styles.jenkinsResultCol, styles.statusTextBase, resultStyle]}>{resultText}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsStartCol]}>{safeFormatTimestamp(build.start_time_ms)}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsDurationCol]}>{safeFormatDuration(build.duration_ms)}</Text>
                                    <Text style={[styles.tableCol, styles.jenkinsEndCol, styles.lastCol]}>{safeFormatTimestamp(build.end_time_ms)}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No Jenkins build data available for '{jenkinsData?.jobName || 'pipeline'}'.</Text>)}
            </View>

            {/* --- SonarQube Section --- */}
            <View style={styles.section} wrap={false}> {/* Removed border from last section */}
                <Text style={styles.subHeader}>SonarQube Metrics: {sonarqubeData?.projectKey || 'website'}</Text>
                {(sonarqubeData?.metrics && Object.keys(sonarqubeData.metrics).length > 0) ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                            <Text style={[styles.tableColHeader, styles.sqMetricCol]}>Metric</Text>
                            <Text style={[styles.tableColHeader, styles.sqValueCol, styles.lastCol]}>Value</Text>
                        </View>
                        {Object.entries(sonarqubeData.metrics)
                            .filter(([key, value]) => value !== null && value !== undefined && getSqMetricLabel(key))
                            .sort(([keyA], [keyB]) => {
                                const order = ['alert_status', 'bugs', 'vulnerabilities', 'security_hotspots', 'code_smells', 'coverage', 'duplicated_lines_density', 'ncloc', 'sqale_index', 'reliability_rating', 'security_rating', 'sqale_rating'];
                                return (order.indexOf(keyA) === -1 ? 99 : order.indexOf(keyA)) - (order.indexOf(keyB) === -1 ? 99 : order.indexOf(keyB));
                            })
                            .map(([key, value], index) => { // Added index
                                const label = getSqMetricLabel(key);
                                let displayValue = value ?? '-';
                                let valueStyle = {};
                                const rowStyle = index % 2 === 1 ? [styles.tableRow, styles.tableRowZebra] : styles.tableRow;

                                try {
                                    switch (key) {
                                        case 'ncloc': displayValue = value ? parseInt(value, 10).toLocaleString() : '-'; break;
                                        case 'coverage': case 'duplicated_lines_density': displayValue = formatSqPercentage(value); break;
                                        case 'sqale_index': displayValue = formatSqDebt(value); break;
                                        case 'alert_status': case 'sqale_rating': case 'security_rating': case 'reliability_rating': {
                                            const props = key === 'alert_status' ? getSqQualityGateProps(value) : getSqRatingProps(value);
                                            displayValue = props.label;
                                            valueStyle = getPdfStatusStyle(props.label); break;
                                        }
                                        case 'bugs': case 'vulnerabilities': valueStyle = parseInt(value, 10) > 0 ? styles.statusFail : styles.statusOk; break;
                                        case 'security_hotspots': valueStyle = parseInt(value, 10) > 0 ? styles.statusWarn : styles.statusOk; break;
                                        default: valueStyle = {}; // Default style if no specific status applies
                                    }
                                } catch (formatError) { displayValue = value ?? '-'; valueStyle={}; } // Fallback

                                return (
                                    <View key={key} style={rowStyle} wrap={false}>
                                        <Text style={[styles.tableCol, styles.sqMetricCol]}>{label}</Text>
                                        <Text style={[styles.tableCol, styles.sqValueCol, styles.lastCol, styles.boldText, valueStyle]}>{displayValue}</Text>
                                    </View>
                                );
                        })}
                    </View>
                ) : (<Text style={styles.text}>No SonarQube metrics data available for '{sonarqubeData?.projectKey || 'website'}'.</Text>)}
            </View>

            {/* --- Footer --- */}
            <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => (
               `Page ${pageNumber} / ${totalPages}`
             )} />

        </Page>
    </Document>
);

export default DevOpsReportDocument;