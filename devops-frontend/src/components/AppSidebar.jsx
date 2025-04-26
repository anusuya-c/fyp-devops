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
  IconGauge,       
  IconCode,        
  IconRadar2,
  IconDashboard,
  IconWebhook
} from '@tabler/icons-react';
import { Code, Group, Image } from '@mantine/core';
// Import NavLink from react-router-dom for navigation
import { NavLink } from 'react-router-dom';
// Import useAuth hook to access logout function
import { useAuth } from '../auth/AuthContext';

// Import the CSS module
import classes from './AppSidebar.module.css'; // Make sure the path is correct


const data = [
  {path: '/home', label: 'Dashboard', icon: IconDashboard},
  { path: '/jenkins-jobs', label: 'Jenkins Jobs', icon: IconCode }, 
  { path: '/sonarqube-projects', label: 'SonarQube projects', icon: IconRadar2 },
  { path: '/argocd', label: 'Argocd', icon: IconWebhook }, 
];

export function AppSidebar() {
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
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between" >
          {/* Replace MantineLogo with your app logo/name if desired */}
          {/* <MantineLogo size={28} /> */}
          
            <Image src="/logo.png" alt="DevSecOps Monitor Logo"/>
          
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