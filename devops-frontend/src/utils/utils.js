export function setLastLoginTime() {
    const currentTime = new Date().getTime();
    localStorage.setItem("login_time", currentTime.toString());
  }
  
  export function hasTokenExpired(){
    const lastLoginTimeString = localStorage.getItem("login_time");
    if (!lastLoginTimeString) return true;
  
    const lastLoginTime = parseInt(lastLoginTimeString);
    const currentTime = new Date().getTime();
  
    if (isNaN(lastLoginTime)) return true;
  
    const timeDifference = currentTime - lastLoginTime;
    //24 hrs in ms
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
  
    return timeDifference >= twentyFourHoursInMs;
  }

// src/utils/argoUtils.js

/**
 * Returns a Mantine color name based on Argo CD sync status.
 * @param {string | undefined} status - The sync status string (e.g., 'Synced', 'OutOfSync').
 * @returns {string} Mantine color name.
 */
export const getSyncStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'synced':
      return 'green';
    case 'outofsync':
      return 'orange';
    default:
      return 'gray'; // For Unknown, Progressing, etc.
  }
};

/**
 * Returns a Mantine color name based on Argo CD health status.
 * @param {string | undefined} status - The health status string (e.g., 'Healthy', 'Progressing', 'Degraded').
 * @returns {string} Mantine color name.
 */
export const getHealthStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'healthy':
      return 'green';
    case 'progressing':
      return 'blue';
    case 'degraded':
      return 'red';
    case 'suspended':
      return 'grape'; // Or purple
    case 'missing':
    case 'unknown':
    default:
      return 'gray';
  }
};

  