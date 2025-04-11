import React from 'react'; // No need for useState if NavLink handles active state
import {
  IconBellRinging,
  IconDatabaseImport,
  IconFingerprint,
  IconKey,
  IconLogout,
  IconReceipt2,
  IconSettings,
  IconSwitchHorizontal,
  // Import icons relevant to your actual app routes
  IconGauge,       // Example: Dashboard
  IconCode,        // Example: Jenkins Jobs
  IconNotes,        // Example: Other section
  IconRadar2
} from '@tabler/icons-react';
import { Code, Group } from '@mantine/core';
// Import NavLink from react-router-dom for navigation
import { NavLink } from 'react-router-dom';
// Import useAuth hook to access logout function
import { useAuth } from '../auth/AuthContext';

// Import the CSS module
import classes from './AppSidebar.module.css'; // Make sure the path is correct

// --- UPDATE data with your actual routes ---
const data = [
  // { path: '/', label: 'Dashboard', icon: IconGauge }, // Example
  { path: '/jenkins-jobs', label: 'Jenkins Jobs', icon: IconCode }, // Match paths in App.jsx
  // { path: '/billing', label: 'Billing', icon: IconReceipt2 }, // Keep/remove based on your app
  // { path: '/security', label: 'Security', icon: IconFingerprint },
  { path: '/sonarqube-projects', label: 'SonarQube projects', icon: IconRadar2 }, // Match paths in App.jsx
  { path: '/other', label: 'Other Section', icon: IconNotes }, // Match paths in App.jsx
];

export function AppSidebar() {
  // No need for local 'active' state, NavLink handles it via URL matching
  const { logout } = useAuth(); // Get logout function from context

  const handleLogout = (event) => {
    event.preventDefault();
    console.log("Logging out...");
    logout(); // Call the actual logout function
  };

  const links = data.map((item) => (
    <NavLink
      // Use NavLink for routing
      to={item.path}
      key={item.label}
      // Apply className, use function to check isActive for data-attribute
      className={({ isActive }) => classes.link} // Base class
      data-active={({ isActive }) => isActive ? 'true' : undefined} // Set data-active based on NavLink's state
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </NavLink>
  ));

  return (
    // Use 'aside' or 'div' if preferred over 'nav' for semantic reasons
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          {/* Replace MantineLogo with your app logo/name if desired */}
          {/* <MantineLogo size={28} /> */}
          <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>DevOps UI</span> {/* Example App Name */}
          {/* Optional: Version code */}
          {/* <Code fw={700}>v1.0.0</Code> */}
        </Group>
        {/* Render the NavLink elements */}
        {links}
      </div>

      <div className={classes.footer}>
        {/* Logout link now triggers the logout function */}
        <a href="#" className={classes.link} onClick={handleLogout}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </nav>
  );
}