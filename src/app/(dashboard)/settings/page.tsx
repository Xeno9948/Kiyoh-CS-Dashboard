/**
 * Settings Page
 * Configure performance thresholds
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    goodPerformerRating: 4.5,
    badPerformerRating: 3.0,
    minimumReviewsRequired: 5,
    needsAttentionDays: 30,
    lowResponseRateThreshold: 0.5,
    topPerformersCount: 3,
    bottomPerformersCount: 3,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure performance thresholds and dashboard preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Thresholds
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Good Performer Rating"
                type="number"
                fullWidth
                value={settings.goodPerformerRating}
                onChange={(e) =>
                  setSettings({ ...settings, goodPerformerRating: parseFloat(e.target.value) })
                }
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText="Minimum rating for best performers"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Bad Performer Rating"
                type="number"
                fullWidth
                value={settings.badPerformerRating}
                onChange={(e) =>
                  setSettings({ ...settings, badPerformerRating: parseFloat(e.target.value) })
                }
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText="Maximum rating for worst performers"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Minimum Reviews Required"
                type="number"
                fullWidth
                value={settings.minimumReviewsRequired}
                onChange={(e) =>
                  setSettings({ ...settings, minimumReviewsRequired: parseInt(e.target.value) })
                }
                inputProps={{ min: 1 }}
                helperText="Minimum reviews to classify client"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Needs Attention Days"
                type="number"
                fullWidth
                value={settings.needsAttentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, needsAttentionDays: parseInt(e.target.value) })
                }
                inputProps={{ min: 1 }}
                helperText="Days without review to flag client"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Low Response Rate Threshold"
                type="number"
                fullWidth
                value={settings.lowResponseRateThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, lowResponseRateThreshold: parseFloat(e.target.value) })
                }
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                helperText="Response rate threshold (0-1)"
              />
            </Grid>
          </Grid>

          <Box mt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
