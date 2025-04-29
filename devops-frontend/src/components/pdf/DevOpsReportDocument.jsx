import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import {
    formatDuration, formatTimestamp, getResultColor, getResultText, 
    formatSqDebt, formatSqPercentage, getSqRatingProps, getSqQualityGateProps, getSqMetricLabel
} from '../../utils/formatting'; 

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 25, 
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    centeredPage: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontSize: 9,
        fontFamily: 'Helvetica',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartPage: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    chartImage: {
        maxWidth: '95%',
        maxHeight: '80%',
        objectFit: 'contain',
        marginVertical: 10,
    },
    section: {
        marginBottom: 15,
        paddingBottom: 5, 
    },
    mainTitle: {
        fontSize: 24,
        marginBottom: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#111111',
        textAlign: 'center',
    },
    titleDate: {
        fontSize: 14,
        marginBottom: 50,
        color: '#333333',
        textAlign: 'center',
    },
    header: {
        fontSize: 16,
        marginBottom: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#111111',
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 13, 
        marginBottom: 10, 
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
        borderBottomWidth: 1.5, 
        borderBottomColor: '#EEEEEE',
        paddingBottom: 3,
    },
    text: {
        marginBottom: 4,
        lineHeight: 1.3,
        fontSize: 9, 
    },
    introParagraph: {
        marginBottom: 10,
        lineHeight: 1.4,
        fontSize: 10,
    },
    listItem: {
        marginLeft: 15,
        marginBottom: 3,
        fontSize: 10,
    },
    boldText: {
        fontFamily: 'Helvetica-Bold',
    },
    code: {
        fontFamily: 'Courier',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 3,
        paddingVertical: 1,
        fontSize: 8,
        borderRadius: 2, 
        wordBreak: 'break-all',
    },
    card: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 3,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#FFFFFF', 
        flexDirection: 'column', 
    },
    cardHeader: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 6,
        color: '#111111',
    },
    cardRow: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center',
    },
    cardLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        color: '#444444',
        marginRight: 5, 
    },
    cardValue: {
        fontSize: 9,
        color: '#333333',
        flexShrink: 1, 
    },
    statusText: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
        textAlign: 'center', 
    },
    statusIndicator: { 
      width: 10,
      height: 10,
      borderRadius: 2,
      marginRight: 5,
    },
    statusOk: { color: '#28a745' }, 
    statusWarn: { color: '#fd7e14' }, 
    statusFail: { color: '#dc3545' }, 
    statusUnknown: { color: '#6c757d' }, 
    statusProgress: { color: '#0d6efd' }, 

    statusOkBg: { backgroundColor: '#28a745' }, 
    statusWarnBg: { backgroundColor: '#fd7e14' }, 
    statusFailBg: { backgroundColor: '#dc3545' }, 
    statusUnknownBg: { backgroundColor: '#6c757d' }, 
    statusProgressBg: { backgroundColor: '#0d6efd' }, 

    argoStatusContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start', 
        marginBottom: 6,
        gap: 15, 
    },
    sqRatingContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 5,
    },
    sqRatingBox: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        color: '#FFFFFF', 
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        marginRight: 8,
        minWidth: 20, 
        textAlign: 'center',
    },
    sqMetricCard: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 3,
        padding: 8,
        marginBottom: 8,
        backgroundColor: '#F9F9F9', 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sqMetricLabel: {
        fontSize: 9,
        color: '#444444',
    },
    sqMetricValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
    },
    jenkinsBuildCard: {
        borderLeftWidth: 4, 
        paddingLeft: 8, 
    },
    jenkinsBuildHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    // --- Footer Style ---
     footer: {
        position: 'absolute',
        bottom: 10, // Raise footer slightly
        left: 25,
        right: 25,
        textAlign: 'center',
        color: 'grey',
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
});

const getPdfStatusStyles = (status, type = 'text', building = false) => {
    if (building) {
        return type === 'text' ? styles.statusProgress : styles.statusProgressBg;
    }
    const lower = status?.toLowerCase() || 'unknown';

    if (['synced', 'healthy', 'succeeded', 'ok', 'passed', 'stable', 'a'].includes(lower)) {
        return type === 'text' ? styles.statusOk : styles.statusOkBg;
    }
    if (['progressing', 'degraded', 'unstable', 'outofsync', 'b', 'c', 'warn'].includes(lower)) {
        return type === 'text' ? styles.statusWarn : styles.statusWarnBg;
    }
    if (['failed', 'error', 'aborted', 'd', 'e'].includes(lower)) {
        return type === 'text' ? styles.statusFail : styles.statusFailBg;
    }
    return type === 'text' ? styles.statusUnknown : styles.statusUnknownBg;
};

const PageFooter = () => (
    <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} / ${totalPages}`
    )} />
);


const DevOpsReportDocument = ({ argoData, jenkinsData, sonarqubeData, barChartImg, donutChartImg }) => {
    const todayDate = new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const renderSqRating = (key, value) => {
        const props = key === 'alert_status'
            ? (getSqQualityGateProps ? getSqQualityGateProps(value) : {label: value, severity: 'unknown'})
            : (getSqRatingProps ? getSqRatingProps(value) : {label: value, severity: 'unknown'});

        const statusLabel = props.label?.toLowerCase() || props.severity?.toLowerCase() || value?.toLowerCase();
        const bgStyle = getPdfStatusStyles(statusLabel, 'bg');

        return (
            <View style={styles.sqRatingContainer}>
                 <View style={[styles.sqRatingBox, bgStyle]}>
                     <Text>{props.label || value}</Text>
                 </View>
                 <Text style={styles.cardValue}>{getSqMetricLabel(key)}</Text>
            </View>
        );
    };

     const renderSqMetric = (key, value) => {
        const label = getSqMetricLabel(key);
        let displayValue = value ?? '-';
        let valueStyle = styles.sqMetricValue; // Default style

        try {
            switch (key) {
                case 'ncloc': displayValue = value ? parseInt(value, 10).toLocaleString() : '-'; break;
                case 'coverage': case 'duplicated_lines_density': displayValue = formatSqPercentage ? formatSqPercentage(value) : `${value}%`; break;
                case 'sqale_index': displayValue = formatSqDebt ? formatSqDebt(value) : `${value}d`; break;
                case 'bugs': case 'vulnerabilities':
                    valueStyle = [valueStyle, parseInt(value, 10) > 0 ? styles.statusFail : styles.statusOk];
                    displayValue = parseInt(value, 10).toLocaleString();
                    break;
                case 'security_hotspots':
                     valueStyle = [valueStyle, parseInt(value, 10) > 0 ? styles.statusWarn : styles.statusOk];
                    displayValue = parseInt(value, 10).toLocaleString();
                    break;
                case 'code_smells':
                     displayValue = parseInt(value, 10).toLocaleString();
                    break;
                default:
                     if (!isNaN(parseFloat(value))) {
                       displayValue = parseFloat(value).toLocaleString();
                     }
                     break;
            }
        } catch (formatError) {
            console.error(`PDF Formatting Error for key ${key}:`, formatError);
            displayValue = value ?? '-';
        }

        if (['alert_status', 'sqale_rating', 'security_rating', 'reliability_rating'].includes(key)) {
            return null;
        }

        return (
           <View key={key} style={styles.sqMetricCard} wrap={false}>
               <Text style={styles.sqMetricLabel}>{label}</Text>
               <Text style={valueStyle}>{displayValue}</Text>
           </View>
        );
     };

    return (
    <Document title="DevOps Report">

        {/* Page 1: Title */}
        <Page size="A4" style={styles.centeredPage} orientation="portrait">
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.mainTitle}>DevOps Dashboard Report</Text>
                <Text style={styles.titleDate}>{todayDate}</Text>
            </View>
            <PageFooter />
        </Page>

        {/* Page 2: Introduction */}
        <Page size="A4" style={styles.page} orientation="portrait">
             <View style={{ paddingTop: 20 }}>
                 <Text style={[styles.subHeader, { marginBottom: 15, textAlign: 'center'}]}>Report Overview</Text>
                 {/* ... intro text ... */}
                 <Text style={styles.introParagraph}>
                    This document provides a snapshot of the current DevOps status, consolidating key information
                    from various tools within the CI/CD pipeline. It aims to offer a quick overview of application health,
                    build performance, and code quality.
                </Text>
                <Text style={styles.introParagraph}>
                    The report includes the following sections:
                </Text>
                <Text style={styles.listItem}>
                    • <Text style={styles.boldText}>Build Status Overview:</Text> A visual summary (bar chart) of recent build outcomes from Jenkins.
                </Text>
                <Text style={styles.listItem}>
                    • <Text style={styles.boldText}>Application Health Overview:</Text> A visual summary (donut chart) of application health and sync status from Argo CD.
                </Text>
                 <Text style={styles.listItem}>
                    • <Text style={styles.boldText}>Argo CD Applications:</Text> Details for each application including status, source, and destination.
                 </Text>
                 <Text style={styles.listItem}>
                    • <Text style={styles.boldText}>SonarQube Analysis:</Text> Key code quality, reliability, and security metrics and ratings.
                 </Text>
                <Text style={styles.listItem}>
                    • <Text style={styles.boldText}>Jenkins Build History:</Text> Details for recent pipeline builds including status and duration.
                </Text>
                 <Text style={[styles.introParagraph, { marginTop: 20 }]}>
                    Please review the following pages for the visual charts and detailed data views.
                 </Text>
            </View>
            <PageFooter />
        </Page>

        {/* Page 3: Bar Chart (if exists) */}
        {barChartImg && (
            <Page size="A4" style={styles.chartPage} orientation="portrait">
                <Text style={styles.subHeader}>Build Status Overview</Text>
                <Image style={styles.chartImage} src={barChartImg} />
                <PageFooter />
            </Page>
        )}

        {/* Page 4: Donut Chart (if exists) */}
        {donutChartImg && (
            <Page size="A4" style={styles.chartPage} orientation="portrait">
                 <Text style={styles.subHeader}>Application Health Overview</Text>
                 <Image style={styles.chartImage} src={donutChartImg}/>
                 <PageFooter />
            </Page>
        )}

        {/* --- Page 5 onwards: Details --- */}
        <Page size="A4" style={styles.page} orientation="portrait">

            {/* --- Report Details Header --- */}
             <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 5 }]}>
                 <Text style={styles.header}>DevOps Dashboard - Details</Text>
                 <Text style={{ textAlign: 'center', fontSize: 9, color: 'grey', marginBottom: 10 }}>
                     Generated: {formatTimestamp ? formatTimestamp(Date.now()) : new Date().toLocaleString()}
                 </Text>
             </View>

            {/* --- Argo CD Section --- */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.subHeader}>Argo CD Applications</Text>
                {(argoData?.items && argoData.items.length > 0) ? (
                    argoData.items.map(app => {
                        const md = app.metadata || {}; const sp = app.spec || {}; const st = app.status || {};
                        const sync = st.sync || {}; const health = st.health || {};
                        const src = sp.source || {}; const dst = sp.destination || {};

                        const syncStatus = sync.status || '-';
                        const healthStatus = health.status || '-';
                        const syncStyle = getPdfStatusStyles(syncStatus, 'text');
                        const healthStyle = getPdfStatusStyles(healthStatus, 'text');

                        return (
                            <View key={md.uid || md.name} style={styles.card} wrap={false}>
                                <Text style={styles.cardHeader}>{md.name || 'N/A'}</Text>

                                {/* Status Row */}
                                <View style={styles.argoStatusContainer}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={styles.cardLabel}>Sync:</Text>
                                        <Text style={[styles.statusText, syncStyle]}>{syncStatus}</Text>
                                     </View>
                                     <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={styles.cardLabel}>Health:</Text>
                                        <Text style={[styles.statusText, healthStyle]}>{healthStatus}</Text>
                                     </View>
                                </View>

                                {/* Details in Rows */}
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Project:</Text>
                                    <Text style={styles.cardValue}>{sp.project || 'default'}</Text>
                                </View>
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Repo:</Text>
                                    <Text style={styles.cardValue}>{src.repoURL?.split('/').slice(-2).join('/') || '-'}</Text>
                                </View>
                                <View style={styles.cardRow}>
                                     <Text style={styles.cardLabel}>Target:</Text>
                                     <Text style={styles.cardValue}>
                                        {src.targetRevision || 'HEAD'} (<Text style={styles.code}>{sync.revision?.substring(0, 7) || '-'}</Text>)
                                     </Text>
                                </View>
                                {src.path && src.path !== '.' && ( // Only show path if not default '.'
                                     <View style={styles.cardRow}>
                                        <Text style={styles.cardLabel}>Path:</Text>
                                        <Text style={styles.cardValue}>{src.path}</Text>
                                    </View>
                                )}
                                 <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Destination:</Text>
                                    <Text style={styles.cardValue}>
                                        {dst.server?.replace(/^https?:\/\//, '') || '-'}/{dst.namespace || '-'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                ) : (<Text style={styles.text}>No Argo CD application data available.</Text>)}
            </View>

            {/* --- SonarQube Section --- */}
            <View style={styles.section} wrap={false}>
                 <Text style={styles.subHeader}>SonarQube Analysis: {sonarqubeData?.projectKey || 'website'}</Text>
                 {(sonarqubeData?.metrics && Object.keys(sonarqubeData.metrics).length > 0) ? (
                    <View style={styles.card} wrap={false}>
                         {/* Quality Gate and Ratings First */}
                         {sonarqubeData.metrics['alert_status'] !== undefined && renderSqRating('alert_status', sonarqubeData.metrics['alert_status'])}
                         {sonarqubeData.metrics['reliability_rating'] !== undefined && renderSqRating('reliability_rating', sonarqubeData.metrics['reliability_rating'])}
                         {sonarqubeData.metrics['security_rating'] !== undefined && renderSqRating('security_rating', sonarqubeData.metrics['security_rating'])}
                         {sonarqubeData.metrics['sqale_rating'] !== undefined && renderSqRating('sqale_rating', sonarqubeData.metrics['sqale_rating'])}

                         {/* Separator */}
                         <View style={{ height: 1, backgroundColor: '#EEEEEE', marginVertical: 8 }} />

                         {/* Other Metrics */}
                         {Object.entries(sonarqubeData.metrics)
                            .sort(([keyA], [keyB]) => { // Sort ensures consistent order but ratings are handled above
                                const order = ['bugs', 'vulnerabilities', 'security_hotspots', 'code_smells', 'coverage', 'duplicated_lines_density', 'ncloc', 'sqale_index'];
                                return (order.indexOf(keyA) === -1 ? 99 : order.indexOf(keyA)) - (order.indexOf(keyB) === -1 ? 99 : order.indexOf(keyB));
                            })
                            .map(([key, value]) => {
                                // Render metric if it's not null/undefined and has a label
                                if (value !== null && value !== undefined && getSqMetricLabel(key)) {
                                     return renderSqMetric(key, value); // Use helper function
                                }
                                return null;
                            })}
                    </View>
                 ) : (<Text style={styles.text}>No SonarQube metrics data available for '{sonarqubeData?.projectKey || 'website'}'.</Text>)}
            </View>


            {/* --- Jenkins Section --- */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.subHeader}>Jenkins Build History: {jenkinsData?.jobName || 'pipeline'}</Text>
                 {(jenkinsData?.builds && jenkinsData.builds.length > 0) ? (
                     jenkinsData.builds.slice(0, 5).map(build => { // Display latest 5 builds as cards
                         const resultText = getResultText(build.result, build.building);
                         const statusStyle = getPdfStatusStyles(build.result, 'text', build.building);
                         const borderStyle = getPdfStatusStyles(build.result, 'bg', build.building); // Use background style for border

                         return (
                            <View key={build.number} style={[styles.card, styles.jenkinsBuildCard, { borderLeftColor: borderStyle.backgroundColor }]} wrap={false}>
                                <View style={styles.jenkinsBuildHeader}>
                                    <Text style={styles.cardHeader}>Build #{build.number}</Text>
                                    <Text style={[styles.statusText, statusStyle]}>{resultText}</Text>
                                </View>
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Duration:</Text>
                                    <Text style={styles.cardValue}>{formatDuration ? formatDuration(build.duration_ms) : (build.duration_ms || '-')}</Text>
                                </View>
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Started:</Text>
                                    <Text style={styles.cardValue}>{formatTimestamp ? formatTimestamp(build.start_time_ms) : (build.start_time_ms || '-')}</Text>
                                </View>
                                 {/* Only show Finished time if not building */}
                                 {!build.building && build.end_time_ms && (
                                    <View style={styles.cardRow}>
                                        <Text style={styles.cardLabel}>Finished:</Text>
                                        <Text style={styles.cardValue}>{formatTimestamp ? formatTimestamp(build.end_time_ms) : (build.end_time_ms || '-')}</Text>
                                    </View>
                                 )}
                            </View>
                         );
                     })
                 ) : (<Text style={styles.text}>No Jenkins build data available for '{jenkinsData?.jobName || 'pipeline'}'.</Text>)}
            </View>

            {/* Footer */}
            <PageFooter />
        </Page>
    </Document>
    );
};

export default DevOpsReportDocument;