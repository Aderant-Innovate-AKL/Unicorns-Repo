import { useState } from 'react';

import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import {
  NameEntity,
  ReconciliationRequest,
  ReconciliationResponse,
  ReconciliationResult,
  NameMatch,
} from 'src/types/nameReconciliation';

export default function NameReconciliation() {
  const [entities, setEntities] = useState<NameEntity[]>([
    { name: '', entityType: 'client' },
  ]);
  const [threshold, setThreshold] = useState(70);
  const [results, setResults] = useState<ReconciliationResponse | null>(null);

  const reconcileMutation = useMutation({
    mutationFn: async (request: ReconciliationRequest) => {
      // For now, use mock data. Replace with actual API call when backend is ready
      // const { data } = await apiClient.post<ReconciliationResponse>('/api/reconcile', request);
      // return data;

      // Mock response for development
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return mockReconciliation(request);
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const addEntity = () => {
    setEntities([...entities, { name: '', entityType: 'client' }]);
  };

  const updateEntity = (index: number, field: keyof NameEntity, value: string) => {
    const updated = [...entities];
    if (field === 'entityType') {
      updated[index][field] = value as NameEntity['entityType'];
    } else {
      updated[index][field] = value as never;
    }
    setEntities(updated);
  };

  const removeEntity = (index: number) => {
    setEntities(entities.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validEntities = entities.filter((e) => e.name.trim() !== '');
    if (validEntities.length === 0) return;

    reconcileMutation.mutate({
      entities: validEntities,
      threshold,
      includeConflictsCheck: true,
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered Name Reconciliation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Enter client names, matter parties, or contacts to check for existing matches
        using AI-powered fuzzy matching. This replaces traditional soundex queries with
        intelligent ML models.
      </Typography>

      <Stack spacing={3}>
        {/* Input Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Enter Names to Reconcile
            </Typography>

            <Stack spacing={2}>
              {entities.map((entity, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Name"
                    value={entity.name}
                    onChange={(e) => updateEntity(index, 'name', e.target.value)}
                    fullWidth
                    placeholder="e.g., John Smith, ABC Corporation"
                  />
                  <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={entity.entityType}
                      onChange={(e) => updateEntity(index, 'entityType', e.target.value)}
                      label="Entity Type"
                    >
                      <MenuItem value="client">Client</MenuItem>
                      <MenuItem value="matter_party">Matter Party</MenuItem>
                      <MenuItem value="contact">Contact</MenuItem>
                      <MenuItem value="opposing_counsel">Opposing Counsel</MenuItem>
                    </Select>
                  </FormControl>
                  {entities.length > 1 && (
                    <Button onClick={() => removeEntity(index)} color="error">
                      Remove
                    </Button>
                  )}
                </Stack>
              ))}

              <Box>
                <Button
                  startIcon={<PersonAddIcon />}
                  onClick={addEntity}
                  variant="outlined"
                >
                  Add Another Name
                </Button>
              </Box>

              <Divider />

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Match Threshold (%)"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 200 }}
                  helperText="Minimum confidence score to show matches"
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    reconcileMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  onClick={handleSubmit}
                  disabled={
                    reconcileMutation.isPending || entities.every((e) => !e.name.trim())
                  }
                >
                  {reconcileMutation.isPending ? 'Analyzing...' : 'Find Matches'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Results Section */}
        {reconcileMutation.isError && (
          <Alert severity="error">
            Failed to reconcile names. Please try again or contact support.
          </Alert>
        )}

        {results && (
          <>
            {/* Conflicts Check Results */}
            {results.conflictsReport && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conflicts Check Report
                  </Typography>
                  <Alert
                    severity={
                      results.conflictsReport.riskLevel === 'high' ||
                      results.conflictsReport.riskLevel === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                    icon={
                      results.conflictsReport.hasConflicts ? (
                        <WarningIcon />
                      ) : (
                        <CheckCircleIcon />
                      )
                    }
                  >
                    {results.conflictsReport.hasConflicts
                      ? `${results.conflictsReport.conflicts.length} potential conflict(s) detected - Risk Level: ${results.conflictsReport.riskLevel.toUpperCase()}`
                      : 'No conflicts detected'}
                  </Alert>

                  {results.conflictsReport.conflicts.length > 0 && (
                    <List>
                      {results.conflictsReport.conflicts.map((conflict, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={conflict.description}
                            secondary={`Type: ${conflict.conflictType} | Severity: ${conflict.severity} | Action: ${conflict.recommendedAction}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Name Reconciliation Results */}
            <Typography variant="h6" gutterBottom>
              Reconciliation Results ({results.results.length})
            </Typography>

            {results.results.map((result, idx) => (
              <ReconciliationResultCard key={idx} result={result} />
            ))}

            <Typography variant="caption" color="text.secondary">
              Processing completed in {results.processingTime}ms
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}

function ReconciliationResultCard({ result }: { result: ReconciliationResult }) {
  const [selectedMatch, setSelectedMatch] = useState<NameMatch | null>(
    result.selectedMatch || null,
  );

  const getRecommendationColor = () => {
    switch (result.recommendation) {
      case 'use_existing':
        return 'success';
      case 'create_new':
        return 'info';
      case 'needs_review':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRecommendationIcon = () => {
    switch (result.recommendation) {
      case 'use_existing':
        return <CheckCircleIcon />;
      case 'create_new':
        return <PersonAddIcon />;
      case 'needs_review':
        return <WarningIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">{result.inputEntity.name}</Typography>
              <Chip
                label={result.inputEntity.entityType.replace('_', ' ')}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Chip
              icon={getRecommendationIcon()}
              label={result.recommendation.replace('_', ' ').toUpperCase()}
              color={getRecommendationColor()}
            />
          </Stack>

          {result.matches.length === 0 ? (
            <Alert severity="info">
              No existing matches found. Recommended action: Create new{' '}
              {result.inputEntity.entityType}
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                Found {result.matches.length} potential match(es):
              </Typography>

              <Stack spacing={1}>
                {result.matches.map((match, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: 2,
                      borderColor:
                        selectedMatch?.existingId === match.existingId
                          ? 'primary.main'
                          : 'transparent',
                    }}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">{match.existingName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {match.matchReason}
                        </Typography>
                        {match.additionalData && (
                          <Typography variant="caption" color="text.secondary">
                            {match.additionalData.email &&
                              `Email: ${match.additionalData.email}`}
                          </Typography>
                        )}
                      </Box>
                      <Stack alignItems="flex-end" spacing={1}>
                        <Chip
                          label={`${match.matchScore}% match`}
                          color={
                            match.matchScore >= 90
                              ? 'success'
                              : match.matchScore >= 70
                                ? 'warning'
                                : 'default'
                          }
                          size="small"
                        />
                        <Chip
                          label={match.suggestedAction.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// Mock function for development - replace with actual API call
function mockReconciliation(request: ReconciliationRequest): ReconciliationResponse {
  const results: ReconciliationResult[] = request.entities.map((entity) => {
    // Simulate AI matching
    const matches: NameMatch[] = [];

    if (entity.name.toLowerCase().includes('smith')) {
      matches.push({
        existingId: 'CLI-001',
        existingName: 'John E. Smith',
        entityType: 'client',
        matchScore: 92,
        matchReason:
          'High confidence match - similar name structure and phonetic similarity',
        suggestedAction: 'merge',
        additionalData: {
          email: 'jsmith@example.com',
          lastModified: '2024-11-15',
        },
      });
      matches.push({
        existingId: 'CLI-045',
        existingName: 'Jane Smith LLC',
        entityType: 'client',
        matchScore: 75,
        matchReason: 'Moderate match - shared surname, different first name',
        suggestedAction: 'review',
      });
    }

    const recommendation =
      matches.length === 0
        ? 'create_new'
        : matches[0].matchScore >= 90
          ? 'use_existing'
          : 'needs_review';

    return {
      inputEntity: entity,
      matches: matches.filter((m) => m.matchScore >= request.threshold!),
      recommendation,
      selectedMatch: matches[0]?.matchScore >= 90 ? matches[0] : undefined,
    };
  });

  return {
    results,
    conflictsReport: {
      hasConflicts: false,
      conflicts: [],
      riskLevel: 'none',
      generatedAt: new Date().toISOString(),
    },
    processingTime: 1247,
  };
}
