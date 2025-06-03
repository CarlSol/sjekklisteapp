import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Grid } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { storageService } from '../services/storageService';
import type { Checklist } from '../types/Checklist';

export default function Home() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<Checklist[]>([]);

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

  const handleCreateNew = () => {
    navigate('/checklist/new');
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Sjekklister
      </Typography>

      <Grid container spacing={3}>
        {checklists.map((checklist) => (
          <Grid item xs={12} sm={6} md={4} key={checklist.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  Område {checklist.areaNumber}
                </Typography>
                <Typography color="textSecondary">
                  {new Date(checklist.inspectionDate).toLocaleDateString('nb-NO')}
                </Typography>
                <Typography variant="body2">
                  Status: {checklist.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleCreateNew}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          minWidth: '56px',
          padding: 0
        }}
      >
        <AddIcon />
      </Button>
    </div>
  );
} 