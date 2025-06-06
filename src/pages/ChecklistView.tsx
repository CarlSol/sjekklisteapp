import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { PhotoCamera, Download as DownloadIcon, Delete as DeleteIcon, LocationOn as LocationIcon, Save as SaveIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { generatePDF } from '../services/emailService';
import type { Checklist, ChecklistItem } from '../types/Checklist';

const ChecklistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedStatus, setEditedStatus] = useState<'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null>(null);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    const loadChecklist = async () => {
      if (id) {
        const loadedChecklist = await storageService.getChecklistById(id);
        if (loadedChecklist) {
          setChecklist(loadedChecklist);
        }
      }
    };
    loadChecklist();
  }, [id]);

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item);
    setEditedNotes(item.notes || '');
    setEditedStatus(item.status as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null);
    setIsDialogOpen(true);
  };

  const getCurrentLocation = (): Promise<{latitude: number, longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation ikke tilgjengelig'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleSaveItem = async () => {
    if (!checklist || !selectedItem) return;

    try {
      const location = await getCurrentLocation();
      const updatedChecklist = { ...checklist };
      const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
      
      if (itemIndex !== -1 && updatedChecklist.items) {
        updatedChecklist.items[itemIndex] = {
          ...updatedChecklist.items[itemIndex],
          notes: editedNotes,
          status: editedStatus as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null,
          timestamp: new Date().toISOString(),
          location: location,
          completed: editedStatus !== null
        };

        await storageService.saveChecklist(updatedChecklist);
        setChecklist(updatedChecklist);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Feil ved lagring:', error);
      // Lagre uten koordinater hvis GPS feiler
      const updatedChecklist = { ...checklist };
      const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
      
      if (itemIndex !== -1 && updatedChecklist.items) {
        updatedChecklist.items[itemIndex] = {
          ...updatedChecklist.items[itemIndex],
          notes: editedNotes,
          status: editedStatus as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | null,
          timestamp: new Date().toISOString(),
          completed: editedStatus !== null
        };

        await storageService.saveChecklist(updatedChecklist);
        setChecklist(updatedChecklist);
        setIsDialogOpen(false);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!checklist || !selectedItem) return;
    
    try {
      const location = await getCurrentLocation();
      const imageData = await storageService.uploadImage(file);
      const updatedChecklist = { ...checklist };
      const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
      
      if (itemIndex !== -1 && updatedChecklist.items) {
        const imageWithLocation = {
          data: imageData,
          location: location,
          timestamp: new Date().toISOString()
        };

        updatedChecklist.items[itemIndex].images = [
          ...(updatedChecklist.items[itemIndex].images || []),
          JSON.stringify(imageWithLocation)
        ];
        
        await storageService.saveChecklist(updatedChecklist);
        setChecklist(updatedChecklist);
        setSelectedItem(updatedChecklist.items[itemIndex]);
      }
    } catch (error) {
      console.error('Feil ved opplasting av bilde:', error);
      // Last opp uten koordinater hvis GPS feiler
      try {
        const imageData = await storageService.uploadImage(file);
        const updatedChecklist = { ...checklist };
        const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
        
        if (itemIndex !== -1 && updatedChecklist.items) {
          updatedChecklist.items[itemIndex].images = [
            ...(updatedChecklist.items[itemIndex].images || []),
            imageData
          ];
          
          await storageService.saveChecklist(updatedChecklist);
          setChecklist(updatedChecklist);
          setSelectedItem(updatedChecklist.items[itemIndex]);
        }
      } catch (secondError) {
        console.error('Feil ved opplasting av bilde uten GPS:', secondError);
        alert('Kunne ikke laste opp bildet. Vennligst prøv igjen.');
      }
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (!checklist || !selectedItem) return;
    
    try {
      const updatedChecklist = { ...checklist };
      const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
      
      if (itemIndex !== -1 && updatedChecklist.items) {
        updatedChecklist.items[itemIndex].images = updatedChecklist.items[itemIndex].images?.filter((_, index) => index !== imageIndex) || [];
        await storageService.saveChecklist(updatedChecklist);
        setChecklist(updatedChecklist);
        setSelectedItem(updatedChecklist.items[itemIndex]);
      }
    } catch (error) {
      console.error('Feil ved sletting av bilde:', error);
      alert('Kunne ikke slette bildet. Vennligst prøv igjen.');
    }
  };

  const parseImageData = (imageRef: string) => {
    try {
      const parsed = JSON.parse(imageRef);
      return {
        data: parsed.data,
        location: parsed.location,
        timestamp: parsed.timestamp
      };
    } catch {
      return { data: imageRef, location: null, timestamp: null };
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'OK': return 'success';
      case 'Avvik': return 'error';
      case 'Anbefalt tiltak': return 'warning';
      case 'Ikke aktuelt': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  const handleExportRawData = () => {
    try {
      if (!checklist) return;
      
      // Opprett en komplett kopi av sjekklista med all data
      const exportData = {
        ...checklist,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Konverter til JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Opprett fil for nedlasting
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `sjekkliste_rådata_${checklist.solparkName}_${checklist.areaNumber}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Rådata eksportert successfully');

    } catch (error) {
      console.error('Feil ved eksport av rådata:', error);
      alert('Kunne ikke eksportere rådata. Vennligst prøv igjen.');
    }
  };

  if (!checklist) {
    return (
      <Container>
        <Typography>Laster sjekkliste...</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          {checklist.solparkName} - Område {checklist.areaNumber}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Inspeksjonsdato: {formatDate(checklist.inspectionDate)}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Inspektører: {checklist.inspectors?.join(', ') || ''}
        </Typography>

        <Box sx={{ mt: 2, mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleExportRawData}
            sx={{ mr: 2 }}
          >
            Eksporter rådata
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              if (checklist) {
                const pdfBlob = await generatePDF(checklist);
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sjekkliste_${checklist.solparkName}_${checklist.areaNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
          >
            Last ned PDF
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          <List>
            {checklist.items?.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem button onClick={() => handleItemClick(item)}>
                  <ListItemText
                    primary={item.checkPoint}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.category}
                        </Typography>
                        <br />
                        {item.status && (
                          <Chip 
                            label={item.status} 
                            color={getStatusColor(item.status) as any}
                            size="small"
                            sx={{ mr: 1, mt: 0.5 }}
                          />
                        )}
                        {item.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notat: {item.notes}
                          </Typography>
                        )}
                        {item.images && item.images.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Bilder: {item.images.length}
                          </Typography>
                        )}
                        {item.location && (
                          <Typography variant="body2" color="text.secondary">
                            <LocationIcon fontSize="small" /> 
                            GPS: {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem?.checkPoint}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Kategori: {selectedItem.category}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Frekvens: {selectedItem.frequency}
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedStatus || ''}
                  onChange={(e) => setEditedStatus(e.target.value as any)}
                  label="Status"
                >
                  <MenuItem value="">Ikke valgt</MenuItem>
                  <MenuItem value="OK">OK</MenuItem>
                  <MenuItem value="Avvik">Avvik</MenuItem>
                  <MenuItem value="Anbefalt tiltak">Anbefalt tiltak</MenuItem>
                  <MenuItem value="Ikke aktuelt">Ikke aktuelt</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Kommentarer/Notater"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                margin="normal"
              />

              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  Ta bilde
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
              </Box>

              {selectedItem.location && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <LocationIcon fontSize="small" /> 
                  Sist oppdatert: {selectedItem.location.latitude.toFixed(6)}, {selectedItem.location.longitude.toFixed(6)}
                </Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Bilder ({selectedItem.images?.length || 0})
              </Typography>
              <Grid container spacing={2}>
                {selectedItem.images?.map((imageRef, index) => {
                  const imageData = parseImageData(imageRef);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="200"
                          image={imageData.data}
                          alt="Sjekkpunkt bilde"
                        />
                        <Box sx={{ p: 1 }}>
                          {imageData.location && (
                            <Typography variant="caption" display="block">
                              <LocationIcon fontSize="small" /> 
                              {imageData.location.latitude.toFixed(6)}, {imageData.location.longitude.toFixed(6)}
                            </Typography>
                          )}
                          {imageData.timestamp && (
                            <Typography variant="caption" display="block">
                              {new Date(imageData.timestamp).toLocaleString('nb-NO')}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteImage(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
          <Button onClick={handleSaveItem} variant="contained">
            Lagre
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChecklistView; 