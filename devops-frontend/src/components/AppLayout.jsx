// src/components/AppLayout.jsx
import { AppShell, useMantineTheme } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  const theme = useMantineTheme();

  return (
    <AppShell
      navbar={
        <AppShell.Navbar p={0}>
           <AppSidebar />
        </AppShell.Navbar>
      }
    >
      <Outlet />
    </AppShell>
  );
}