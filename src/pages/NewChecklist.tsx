import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

export default function NewChecklist() {
  const navigate = useNavigate();
  const [solparkName, setSolparkName] = useState('Furuseth Solpark');
  const [areaNumber, setAreaNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newChecklist: Checklist = {
      id: uuidv4(),
      title: `${solparkName} - Område ${areaNumber}`,
      solparkName,
      areaNumber,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectors: [],
      items: [],
      status: 'draft',
      timestamp: new Date().toISOString(),
      inspector: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveChecklist(newChecklist);
    navigate(`/checklist/${newChecklist.id}`);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ny Sjekkliste
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Solpark Navn"
              value={solparkName}
              onChange={(e) => setSolparkName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Område Nummer"
              value={areaNumber}
              onChange={(e) => setAreaNumber(e.target.value)}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Opprett Sjekkliste
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 