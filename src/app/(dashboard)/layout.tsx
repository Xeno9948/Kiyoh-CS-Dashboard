/**
 * Dashboard Layout
 * Provides navigation and structure for dashboard pages
 */

'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CS Dashboard
          </Typography>
          <Button color="inherit" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => router.push('/settings')}>
            Settings
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        {children}
      </Container>
    </Box>
  );
}
