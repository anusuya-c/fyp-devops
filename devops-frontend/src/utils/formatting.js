// src/utils/formatting.js

/**
 * Formats duration in milliseconds to a human-readable string (e.g., 1m 30s 500ms).
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration string.
 */
export const formatDuration = (ms) => {
  if (ms === null || ms === undefined || ms < 0) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  const msPart = ms % 1000;
  seconds = seconds % 60;
  minutes = minutes % 60;

  let parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }
  // Only show ms if duration is less than a minute or if it's non-zero
  if (ms < 60000 && msPart > 0) {
    parts.push(`${msPart}ms`);
  }
  // Handle case where duration is exactly 0
  if (parts.length === 0 && ms === 0) {
    return "0ms";
  }

  return parts.join(' ') || '-'; // Return '-' if calculation somehow results in empty
};

/**
 * Formats a timestamp in milliseconds to a locale-specific date and time string.
 * @param {number} ms - Timestamp in milliseconds.
 * @returns {string} Formatted date/time string.
 */
export const formatTimestamp = (ms) => {
  if (ms === null || ms === undefined) {
    return '-';
  }
  try {
    const date = new Date(ms);
    // Options for formatting, adjust as needed
    const options = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', /* second: '2-digit', */ hour12: true
    };
    return date.toLocaleString(undefined, options); // Uses browser's default locale
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return 'Invalid Date';
  }
};

/**
 * Determines Mantine badge color based on Jenkins build result.
 * @param {string | null} result - Build result string (e.g., "SUCCESS", "FAILURE", "ABORTED").
 * @param {boolean} building - Whether the build is currently running.
 * @returns {string} Mantine color name (e.g., "green", "red", "gray", "blue").
 */
export const getResultColor = (result, building) => {
  if (building) {
    return 'blue'; // Indicate running builds
  }
  if (!result) {
    return 'gray'; // Unknown or missing result
  }
  switch (result.toUpperCase()) {
    case 'SUCCESS':
      return 'green';
    case 'FAILURE':
      return 'red';
    case 'UNSTABLE':
      return 'yellow';
    case 'ABORTED':
      return 'gray';
    case 'NOT_BUILT':
      return 'dark';
    default:
      return 'gray';
  }
};

/**
 * Returns a display string for the result.
 * @param {string | null} result - Build result string.
 * @param {boolean} building - Whether the build is currently running.
 * @returns {string} Display string (e.g., "Running", "Success", "Failed").
 */
export const getResultText = (result, building) => {
  if (building) return 'Running';
  if (!result) return 'Unknown';
  switch (result.toUpperCase()) {
    case 'SUCCESS': return 'Success';
    case 'FAILURE': return 'Failed';
    case 'UNSTABLE': return 'Unstable';
    case 'ABORTED': return 'Aborted';
    case 'NOT_BUILT': return 'Not Built';
    default: return result; // Show original string if unknown
  }
}

/**
* Formats SonarQube technical debt (in minutes) to days/hours/minutes.
* @param {string | number | null} minutesStr - Technical debt in minutes (often returned as string).
* @returns {string} Formatted duration string (e.g., "5d 4h 30min").
*/
export const formatSqDebt = (minutesStr) => {
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(minutes) || minutes === null || minutes < 0) {
    return '-';
  }
  if (minutes === 0) return "0min";

  const hoursInDay = 8;
  const minsInHour = 60;
  const minsInDay = hoursInDay * minsInHour;

  const days = Math.floor(minutes / minsInDay);
  const remainingMinutesAfterDays = minutes % minsInDay;
  const hours = Math.floor(remainingMinutesAfterDays / minsInHour);
  const remainingMinutes = remainingMinutesAfterDays % minsInHour;

  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}min`);

  return parts.join(' ') || '0min';
};

/**
* Formats a numeric string or number as a percentage string.
* @param {string | number | null} value - The value to format.
* @param {number} decimalPlaces - Number of decimal places to show.
* @returns {string} Formatted percentage string (e.g., "85.3%") or '-'.
*/
export const formatSqPercentage = (value, decimalPlaces = 1) => {
  const number = parseFloat(value);
  if (isNaN(number) || value === null) {
    return '-';
  }
  return `${number.toFixed(decimalPlaces)}%`;
};

/**
* Gets display properties (label, color, icon) for SonarQube ratings (A-E).
* @param {string | null} ratingLetter - The rating letter (e.g., "A", "B", "E").
* @returns {{label: string, color: string}} Mantine color name.
*/
export const getSqRatingProps = (ratingLetter) => {
  const letter = ratingLetter?.toUpperCase();
  switch (letter) {
    case 'A': return { label: 'A', color: 'green' };
    case 'B': return { label: 'B', color: 'lime' };
    case 'C': return { label: 'C', color: 'yellow' };
    case 'D': return { label: 'D', color: 'orange' };
    case 'E': return { label: 'E', color: 'red' };
    default: return { label: ratingLetter || '-', color: 'gray' };
  }
};

/**
* Gets display properties for SonarQube Quality Gate status.
* @param {string | null} status - The status string (e.g., "OK", "ERROR").
* @returns {{label: string, color: string}} Mantine color name.
*/
export const getSqQualityGateProps = (status) => {
  const gateStatus = status?.toUpperCase();
  switch (gateStatus) {
    case 'OK': return { label: 'Passed', color: 'green' };
    case 'ERROR': return { label: 'Failed', color: 'red' };
    case 'WARN': return { label: 'Warning', color: 'yellow' }; // Older versions might have WARN
    default: return { label: status || 'Unknown', color: 'gray' };
  }
};

/**
* Provides user-friendly labels for common SonarQube metric keys.
* @param {string} metricKey - The metric key (e.g., "ncloc", "sqale_index").
* @returns {string} User-friendly label.
*/
export const getSqMetricLabel = (metricKey) => {
  const labels = {
    bugs: 'Bugs',
    vulnerabilities: 'Vulnerabilities',
    security_hotspots: 'Security Hotspots',
    code_smells: 'Code Smells',
    coverage: 'Coverage',
    duplicated_lines_density: 'Duplication Density',
    ncloc: 'Lines of Code',
    sqale_rating: 'Maintainability Rating',
    security_rating: 'Security Rating',
    reliability_rating: 'Reliability Rating',
    alert_status: 'Quality Gate',
    sqale_index: 'Technical Debt',
  };
  return labels[metricKey] || metricKey;
};