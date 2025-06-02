import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import type { Checklist } from '../types/Checklist';
import { saveChecklist } from '../services/storageService';

export default function NewChecklist() {
  const navigate = useNavigate();
  const [solparkName, setSolparkName] = useState('Furuseth Solpark');
  const [areaNumber, setAreaNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newChecklist: Checklist = {
      id: uuidv4(),
      solparkName,
      areaNumber: parseInt(areaNumber),
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectors: [],
      weatherConditions: '',
      generalCondition: '',
      items: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveChecklist(newChecklist);
    navigate(`/checklist/${newChecklist.id}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ny sjekkliste
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Solpark"
            value={solparkName}
            onChange={(e) => setSolparkName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Områdenummer"
            type="number"
            value={areaNumber}
            onChange={(e) => setAreaNumber(e.target.value)}
            margin="normal"
            required
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              fullWidth
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
            >
              Opprett
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
} 