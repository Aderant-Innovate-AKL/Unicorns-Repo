import { useState } from 'react';

import { PlatformPageTitleBar } from '@aderant/stridyn-foundation';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import mockNames from '../../data/mockNames';
import { performNameCheck, NameCheckResponse } from '../../services/nameCheckService';

// Tier labels and colors
const tierConfig = {
  1: { label: 'Exact Match', color: '#d32f2f', bgColor: '#ffebee' },
  2: { label: 'Very Close Match', color: '#f57c00', bgColor: '#fff3e0' },
  3: { label: 'Possible Match', color: '#fbc02d', bgColor: '#fffde7' },
  4: { label: 'Distant Similarity', color: '#7b1fa2', bgColor: '#f3e5f5' },
};

export default function NameCheck() {
  const [searchName, setSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NameCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError('Please enter a name to search');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await performNameCheck(searchName, mockNames);
      setResults(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred during the search',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div data-testid="name-check-page">
      <PlatformPageTitleBar title="Name Check" />
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          p: 4,
        }}
        data-testid="name-check-container"
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Client Name Recognition
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter a name to check for potential matches against existing clients and
            parties. The system will identify exact matches, similar names, and potential
            conflicts.
          </Typography>
        </Box>

        {/* Search Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Enter name to check"
                placeholder="e.g., Johnson & Partners Ltd, Sarah Mitchell"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                error={!!error}
                helperText={error}
              />
              <Button
                variant="contained"
                size="large"
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                onClick={handleSearch}
                disabled={isLoading}
                sx={{ minWidth: 120, height: 56 }}
              >
                {isLoading ? 'Checking...' : 'Check'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Results for "{results.searchedName}"
              </Typography>

              {results.matches.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No potential matches found. This appears to be a new, unique name.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {results.matches.map((match, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: `1px solid ${tierConfig[match.tier].color}`,
                        bgcolor: tierConfig[match.tier].bgColor,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {match.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: tierConfig[match.tier].color,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {tierConfig[match.tier].label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {match.justification}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              How it works
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This tool uses AI to identify potential name matches, including:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, '& li': { mb: 0.5 } }}>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Exact matches</strong> - Identical names in the system
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Typos & misspellings</strong> - e.g., "Srah" vs "Sarah"
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Abbreviations</strong> - e.g., "Ltd" vs "Limited", "Co" vs
                "Company"
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Homophones</strong> - e.g., "Through" vs "Thru"
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
