import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper
} from '@mui/material';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';
import { CHECKLIST_ITEMS } from '../constants/checklistItems';

export default function NewChecklist() {
  const navigate = useNavigate();
  const [solparkName, setSolparkName] = useState('');
  const [areaNumber, setAreaNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!solparkName || !areaNumber) {
      alert('Vennligst fyll ut alle felt');
      return;
    }

    try {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        title: `${solparkName} - Område ${areaNumber}`,
        solparkName,
        areaNumber,
        inspectionDate: new Date().toISOString(),
        inspectors: [],
        items: CHECKLIST_ITEMS.map(item => ({
          ...item,
          status: null,
          notes: '',
          images: [],
          timestamp: '',
          inspectors: [],
          completed: false
        })),
        timestamp: new Date().toISOString()
      };

      await storageService.saveChecklist(newChecklist);
      navigate(`/checklist/${newChecklist.id}`);
    } catch (error) {
      console.error('Feil ved opprettelse av sjekkliste:', error);
      alert('Kunne ikke opprette sjekkliste. Vennligst prøv igjen.');
    }
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
              required
            />
            <TextField
              fullWidth
              label="Område Nummer"
              value={areaNumber}
              onChange={(e) => setAreaNumber(e.target.value)}
              margin="normal"
              required
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