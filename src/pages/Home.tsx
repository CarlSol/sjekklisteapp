import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { storageService } from '../services/storageService';
import type { Checklist, ChecklistItem } from '../types/Checklist';

// Standard sjekkpunkter
const CHECKLIST_ITEMS: ChecklistItem[] = [
  // 1. Gjerder og Porter
  {
    id: '1.1',
    category: '1. Gjerder og Porter',
    checkPoint: 'Visuell inspeksjon av gjerder (skader, integritet, festepunkter)',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '1.2',
    category: '1. Gjerder og Porter',
    checkPoint: 'Visuell inspeksjon av gjerdestolper (stabilitet, skader)',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // ... Legg til flere sjekkpunkter her
];

export default function Home() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newChecklist, setNewChecklist] = useState({
    solparkName: 'Furuseth Solpark',
    areaNumber: 0,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectors: [''],
  });

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const loadedChecklists = await storageService.getAllChecklists();
        setChecklists(loadedChecklists);
      } catch (error) {
        console.error('Feil ved lasting av sjekklister:', error);
      }
    };
    loadChecklists();
  }, []);

  const handleNewChecklist = () => {
    setOpenDialog(true);
  };

  const handleCreateChecklist = async () => {
    const checklist: Checklist = {
      id: Date.now().toString(),
      ...newChecklist,
      items: CHECKLIST_ITEMS.map(item => ({
        ...item,
        timestamp: new Date().toISOString(),
        status: null,
        notes: '',
        imageRefs: [],
        inspector: ''
      })),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weatherConditions: '',
      generalCondition: ''
    };

    try {
      await storageService.saveChecklist(checklist);
      navigate(`/checklist/${checklist.id}`);
    } catch (error) {
      console.error('Feil ved opprettelse av sjekkliste:', error);
    }
  };

  const handleInspectorChange = (index: number, value: string) => {
    const newInspectors = [...newChecklist.inspectors];
    newInspectors[index] = value;
    setNewChecklist({ ...newChecklist, inspectors: newInspectors });
  };

  const handleAddInspector = () => {
    setNewChecklist({
      ...newChecklist,
      inspectors: [...newChecklist.inspectors, ''],
    });
  };

  const handleRemoveInspector = (index: number) => {
    const newInspectors = newChecklist.inspectors.filter((_, i) => i !== index);
    setNewChecklist({ ...newChecklist, inspectors: newInspectors });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Sjekklister - Furuseth Solpark
      </Typography>

      <Paper sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Aktive sjekklister
        </Typography>
        {checklists.length === 0 ? (
          <Typography color="text.secondary">
            Ingen aktive sjekklister. Opprett en ny for å begynne.
          </Typography>
        ) : (
          <List>
            {checklists.map((checklist) => (
              <ListItem
                key={checklist.id}
                button
                onClick={() => navigate(`/checklist/${checklist.id}`)}
              >
                <ListItemText
                  primary={`Område ${checklist.areaNumber} - ${new Date(checklist.inspectionDate).toLocaleDateString('nb-NO')}`}
                  secondary={`Status: ${checklist.status}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab
          color="primary"
          aria-label="Ny sjekkliste"
          onClick={handleNewChecklist}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Opprett ny sjekkliste</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Solpark"
            value={newChecklist.solparkName}
            onChange={(e) =>
              setNewChecklist({ ...newChecklist, solparkName: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Områdenummer"
            type="number"
            value={newChecklist.areaNumber}
            onChange={(e) =>
              setNewChecklist({
                ...newChecklist,
                areaNumber: parseInt(e.target.value) || 0,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Inspeksjonsdato"
            type="date"
            value={newChecklist.inspectionDate}
            onChange={(e) =>
              setNewChecklist({ ...newChecklist, inspectionDate: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Inspektører
          </Typography>
          {newChecklist.inspectors.map((inspector, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label={`Inspektør ${index + 1}`}
                value={inspector}
                onChange={(e) => handleInspectorChange(index, e.target.value)}
              />
              {index > 0 && (
                <Button
                  color="error"
                  onClick={() => handleRemoveInspector(index)}
                >
                  Fjern
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={handleAddInspector}
            sx={{ mt: 1 }}
          >
            Legg til inspektør
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Avbryt</Button>
          <Button onClick={handleCreateChecklist} variant="contained">
            Opprett
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 