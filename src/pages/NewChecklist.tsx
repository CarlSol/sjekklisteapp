import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Autocomplete,
  Chip
} from '@mui/material';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';
import { CHECKLIST_ITEMS } from '../constants/checklistItems';

// LocalStorage nøkler for caching
const INSPECTORS_CACHE_KEY = 'sjekklisteapp_inspectors';

export default function NewChecklist() {
  const navigate = useNavigate();
  const [solparkName, setSolparkName] = useState('');
  const [areaNumber, setAreaNumber] = useState('');
  const [inspectors, setInspectors] = useState<string[]>([]);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableInspectors, setAvailableInspectors] = useState<string[]>([]);

  // Last inn tidligere brukte inspektører fra localStorage
  useEffect(() => {
    const cachedInspectors = localStorage.getItem(INSPECTORS_CACHE_KEY);
    if (cachedInspectors) {
      try {
        const parsed = JSON.parse(cachedInspectors);
        setAvailableInspectors(parsed);
      } catch (error) {
        console.error('Feil ved lasting av cached inspektører:', error);
      }
    }
  }, []);

  // Lagre inspektører til localStorage
  const saveInspectorToCache = (inspector: string) => {
    if (!inspector.trim()) return;
    
    const current = availableInspectors;
    if (!current.includes(inspector)) {
      const updated = [...current, inspector];
      setAvailableInspectors(updated);
      localStorage.setItem(INSPECTORS_CACHE_KEY, JSON.stringify(updated));
    }
  };

  const handleInspectorChange = (event: any, newValue: string[]) => {
    setInspectors(newValue);
    // Lagre nye inspektører til cache
    newValue.forEach(inspector => saveInspectorToCache(inspector));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!solparkName || !areaNumber || inspectors.length === 0) {
      alert('Vennligst fyll ut alle felt og legg til minst én inspektør');
      return;
    }

    try {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        title: `${solparkName} - Område ${areaNumber}`,
        solparkName,
        areaNumber,
        inspectionDate: new Date(inspectionDate).toISOString(),
        inspectors,
        items: CHECKLIST_ITEMS.map(item => ({
          ...item,
          status: null,
          notes: '',
          images: [],
          timestamp: '',
          inspectors: [],
          completed: false
        })),
        timestamp: new Date().toISOString(),
        status: 'draft'
      };

      await storageService.saveChecklist(newChecklist);
      navigate(`/checklist/${newChecklist.id}`);
    } catch (error) {
      console.error('Feil ved opprettelse av sjekkliste:', error);
      alert('Kunne ikke opprette sjekkliste. Vennligst prøv igjen.');
    }
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
            value={areaNumber}
            onChange={(e) => setAreaNumber(e.target.value)}
            margin="normal"
            required
          />
          
          <Autocomplete
            multiple
            freeSolo
            options={availableInspectors}
            value={inspectors}
            onChange={handleInspectorChange}
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Inspektører"
                placeholder="Skriv navn og trykk Enter"
                margin="normal"
                required={inspectors.length === 0}
                helperText="Du kan legge til flere inspektører. Tidligere brukte navn foreslås automatisk."
              />
            )}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Inspeksjonsdato"
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            margin="normal"
            required
            InputLabelProps={{
              shrink: true,
            }}
            helperText="Dato for når inspeksjonen skal/ble utført"
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