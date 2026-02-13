/**
 * Dashboard Page
 * Main overview with performance cards and client table
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SyncIcon from '@mui/icons-material/Sync';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [overviewRes, clientsRes] = await Promise.all([
        fetch('/api/dashboard/overview'),
        fetch('/api/clients'),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');

    try {
      const res = await fetch('/api/sync/all', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        await fetchData();
        alert(`Sync complete! ${data.clientsProcessed} clients, ${data.reviewsProcessed} reviews`);
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Client', width: 250 },
    {
      field: 'source',
      headerName: 'Source',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'KIYOH' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'averageRating',
      headerName: 'Rating',
      width: 100,
      renderCell: (params) => `⭐ ${params.value?.toFixed(1) || 'N/A'}`,
    },
    { field: 'totalReviews', headerName: 'Reviews', width: 100 },
    {
      field: 'responseRate',
      headerName: 'Response Rate',
      width: 130,
      renderCell: (params) => `${((params.value || 0) * 100).toFixed(0)}%`,
    },
    {
      field: 'daysSinceLastReview',
      headerName: 'Last Review',
      width: 150,
      renderCell: (params) => {
        const days = params.value;
        if (days === Infinity) return 'Never';
        if (days === 0) return 'Today';
        return `${days} days ago`;
      },
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {overview && (
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Best Performers
                </Typography>
                {overview.bestPerformers.map((client: any) => (
                  <Box key={client.id} mb={1}>
                    <Typography variant="body2">
                      {client.name} - ⭐ {client.averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Worst Performers
                </Typography>
                {overview.worstPerformers.map((client: any) => (
                  <Box key={client.id} mb={1}>
                    <Typography variant="body2">
                      {client.name} - ⭐ {client.averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Needs Attention
                </Typography>
                {overview.needsAttention.map((client: any) => (
                  <Box key={client.id} mb={1}>
                    <Typography variant="body2">
                      {client.name} ({client.daysSinceLastReview} days)
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Clients
          </Typography>
          <DataGrid
            rows={clients}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[25, 50, 100]}
            autoHeight
            disableRowSelectionOnClick
          />
        </CardContent>
      </Card>
    </Box>
  );
}
