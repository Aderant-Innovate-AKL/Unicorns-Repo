import { useState } from 'react';

import { PlatformPageTitleBar } from '@aderant/stridyn-foundation';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import mockClientsAndParties from '../../data/mockClientsAndParties';
import {
  performNameCheck,
  NameCheckResponse,
  SearchCriteria,
  DatabaseRecord,
} from '../../services/nameCheckService';

// Tier labels and colors
const tierConfig = {
  1: { label: 'Exact Match', color: '#d32f2f', bgColor: '#ffebee' },
  2: { label: 'Very Close Match', color: '#f57c00', bgColor: '#fff3e0' },
  3: { label: 'Possible Match', color: '#fbc02d', bgColor: '#fffde7' },
  4: { label: 'Distant Similarity', color: '#7b1fa2', bgColor: '#f3e5f5' },
};

// Form state interface
interface SearchFormData {
  nameType: 'P' | 'O';
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  internetAddr: string;
  address: string;
}

const initialFormData: SearchFormData = {
  nameType: 'P',
  firstName: '',
  middleName: '',
  lastName: '',
  name: '',
  phoneNumber: '',
  internetAddr: '',
  address: '',
};

export default function NameCheck() {
  const [formData, setFormData] = useState<SearchFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NameCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert mock data to the database record format
  const database: DatabaseRecord[] = mockClientsAndParties.map((item) => ({
    Name: item.Name,
    Phone_Number: item.Phone_Number || undefined,
    Internet_Addr: item.Internet_Addr || undefined,
    Address1: item.Address1 || undefined,
  }));

  const isPerson = formData.nameType === 'P';

  const handleInputChange =
    (field: keyof SearchFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleNameTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'P' | 'O';
    setFormData((prev) => ({
      ...prev,
      nameType: newType,
      // Clear person-specific fields when switching to Organization
      ...(newType === 'O' && {
        firstName: '',
        middleName: '',
        lastName: '',
      }),
    }));
  };

  // Build the full name from components for Person
  const buildFullName = (): string => {
    const parts = [
      formData.firstName.trim(),
      formData.middleName.trim(),
      formData.lastName.trim(),
    ].filter(Boolean);
    return parts.join(' ');
  };

  // Get the search name (auto-generated for Person, manual for Organization)
  const getSearchName = (): string => {
    if (formData.nameType === 'P') {
      return buildFullName();
    }
    return formData.name.trim();
  };

  // The displayed full name for Person (auto-generated)
  const displayedFullName = isPerson ? buildFullName() : formData.name;

  const handleSearch = async () => {
    const searchName = getSearchName();

    if (!searchName) {
      setError(
        isPerson
          ? 'Please enter at least a first or last name'
          : 'Please enter an organization name',
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Build search criteria with all available details
      const searchCriteria: SearchCriteria = {
        name: searchName,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        email: formData.internetAddr.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      const response = await performNameCheck(searchCriteria, database);
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

  const handleClear = () => {
    setFormData(initialFormData);
    setResults(null);
    setError(null);
  };

  return (
    <div data-testid="name-check-page" style={{ height: '100%', overflow: 'auto' }}>
      <PlatformPageTitleBar title="Name Check" />
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          p: 4,
          pb: 8, // Extra padding at bottom for scroll
        }}
        data-testid="name-check-container"
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Client Name Recognition
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter client or party details to check for potential matches against existing
            records. The system will identify exact matches, similar names, and potential
            conflicts.
          </Typography>
        </Box>

        {/* Search Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Search Details
            </Typography>

            {/* Entity Type Selection */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Entity Type
              </Typography>
              <RadioGroup row value={formData.nameType} onChange={handleNameTypeChange}>
                <FormControlLabel value="P" control={<Radio />} label="Person" />
                <FormControlLabel value="O" control={<Radio />} label="Organization" />
              </RadioGroup>
            </FormControl>

            {/* Person-specific fields */}
            {isPerson && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                  placeholder="e.g., Sarah"
                />
                <TextField
                  label="Middle Name"
                  value={formData.middleName}
                  onChange={handleInputChange('middleName')}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                  placeholder="Optional"
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                  placeholder="e.g., Mitchell"
                />
              </Box>
            )}

            {/* Full Name / Organization Name field */}
            <TextField
              fullWidth
              label={isPerson ? 'Full Name' : 'Organization Name'}
              value={isPerson ? displayedFullName : formData.name}
              onChange={isPerson ? undefined : handleInputChange('name')}
              onKeyPress={isPerson ? undefined : handleKeyPress}
              disabled={isLoading}
              error={!!error}
              helperText={
                error ||
                (isPerson
                  ? 'Automatically generated from name fields above'
                  : 'Enter the organization name')
              }
              placeholder={isPerson ? '' : 'e.g., Johnson & Partners LLP'}
              slotProps={{
                input: {
                  readOnly: isPerson,
                },
              }}
              sx={{
                mb: 3,
                ...(isPerson && {
                  '& .MuiInputBase-input': {
                    backgroundColor: 'action.hover',
                  },
                }),
              }}
            />

            {/* Optional fields */}
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 500, color: 'text.secondary' }}
            >
              Optional Details
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                sx={{ flex: 1 }}
                placeholder="e.g., (555) 123-4567"
              />
              <TextField
                label="Email / Website"
                value={formData.internetAddr}
                onChange={handleInputChange('internetAddr')}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                sx={{ flex: 1 }}
                placeholder="e.g., contact@company.com"
              />
            </Box>

            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={handleInputChange('address')}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="e.g., 123 Main Street, New York, NY 10001"
              sx={{ mb: 3 }}
            />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleClear} disabled={isLoading}>
                Clear
              </Button>
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
                sx={{ minWidth: 150 }}
              >
                {isLoading ? 'Checking...' : 'Check for Matches'}
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
              This tool uses AI to identify potential matches, including:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, '& li': { mb: 0.5 } }}>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Contact details</strong> - Matching phone number, email, or
                address triggers an automatic exact match
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Exact name matches</strong> - Identical names in the system
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
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Acronyms</strong> - e.g., "NASA" vs "National Aeronautics Space
                Administration"
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
