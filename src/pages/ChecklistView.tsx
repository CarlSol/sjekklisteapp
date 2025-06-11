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
import { PhotoCamera, Download as DownloadIcon, Delete as DeleteIcon, LocationOn as LocationIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { generatePDF } from '../services/emailService';
import type { Checklist, ChecklistItem } from '../types/Checklist';

const ChecklistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedStatus, setEditedStatus] = useState<'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | 'Ja' | 'Nei' | 'Behov ikke funnet' | null>(null);
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
    setEditedStatus(item.status as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | 'Ja' | 'Nei' | 'Behov ikke funnet' | null);
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
      // Hent fersk sjekkliste-data for å sikre at vi har siste versjon
      const currentChecklist = await storageService.getChecklistById(checklist.id);
      if (!currentChecklist) return;

      const location = await getCurrentLocation();
      const updatedChecklist = { ...currentChecklist };
      const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
      
      if (itemIndex !== -1 && updatedChecklist.items) {
        updatedChecklist.items[itemIndex] = {
          ...updatedChecklist.items[itemIndex],
          notes: editedNotes,
          status: editedStatus as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | 'Ja' | 'Nei' | 'Behov ikke funnet' | null,
          timestamp: new Date().toISOString(),
          location: location,
          completed: editedStatus !== null
        };

        await storageService.saveChecklist(updatedChecklist);
        setChecklist(updatedChecklist);
        setIsDialogOpen(false);
      } else {
        console.error('Kunne ikke finne punkt å oppdatere:', selectedItem.id);
        alert('Kunne ikke lagre endringer. Punktet ble ikke funnet.');
      }
    } catch (error) {
      console.error('Feil ved lagring:', error);
      // Lagre uten koordinater hvis GPS feiler
      try {
        const currentChecklist = await storageService.getChecklistById(checklist.id);
        if (!currentChecklist) return;

        const updatedChecklist = { ...currentChecklist };
        const itemIndex = updatedChecklist.items?.findIndex(item => item.id === selectedItem.id) ?? -1;
        
        if (itemIndex !== -1 && updatedChecklist.items) {
          updatedChecklist.items[itemIndex] = {
            ...updatedChecklist.items[itemIndex],
            notes: editedNotes,
            status: editedStatus as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt' | 'Ja' | 'Nei' | 'Behov ikke funnet' | null,
            timestamp: new Date().toISOString(),
            completed: editedStatus !== null
          };

          await storageService.saveChecklist(updatedChecklist);
          setChecklist(updatedChecklist);
          setIsDialogOpen(false);
        } else {
          console.error('Kunne ikke finne punkt å oppdatere (uten GPS):', selectedItem.id);
          alert('Kunne ikke lagre endringer. Punktet ble ikke funnet.');
        }
      } catch (secondError) {
        console.error('Kritisk feil ved lagring:', secondError);
        alert('Kunne ikke lagre endringer. Vennligst prøv igjen.');
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!checklist || !selectedItem) return;
    
    try {
      // Hent fersk sjekkliste-data
      const currentChecklist = await storageService.getChecklistById(checklist.id);
      if (!currentChecklist) return;

      const location = await getCurrentLocation();
      const imageData = await storageService.uploadImage(file);
      const updatedChecklist = { ...currentChecklist };
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
        const currentChecklist = await storageService.getChecklistById(checklist.id);
        if (!currentChecklist) return;

        const imageData = await storageService.uploadImage(file);
        const updatedChecklist = { ...currentChecklist };
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
      // Hent fersk sjekkliste-data
      const currentChecklist = await storageService.getChecklistById(checklist.id);
      if (!currentChecklist) return;

      const updatedChecklist = { ...currentChecklist };
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
      case 'Ja': return 'success';
      case 'Avvik': return 'error';
      case 'Nei': return 'error';
      case 'Anbefalt tiltak': return 'warning';
      case 'Behov ikke funnet': return 'info';
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

  // Funksjon for å finne neste underpunkt-nummer
  const getNextSubItemNumber = (parentId: string): string => {
    if (!checklist?.items) return `${parentId}.1`;
    
    // Finn alle underpunkter til dette hovedpunktet
    const subItems = checklist.items.filter(item => 
      item.id.startsWith(parentId + '.') && 
      item.id.split('.').length === parentId.split('.').length + 1
    );
    
    if (subItems.length === 0) {
      // Første underpunkt - konverter hovedpunkt til .1 og opprett .2
      return `${parentId}.2`;
    } else {
      // Finn høyeste underpunkt-nummer og legg til 1
      const numbers = subItems
        .map(item => {
          const parts = item.id.split('.');
          return parseInt(parts[parts.length - 1]) || 0;
        })
        .sort((a, b) => b - a);
      
      const nextNumber = numbers[0] + 1;
      return `${parentId}.${nextNumber}`;
    }
  };

  // Funksjon for å konvertere hovedpunkt til underpunkt når første underpunkt opprettes
  const convertToSubItem = async (originalItem: ChecklistItem) => {
    if (!checklist) return;

    const updatedChecklist = { ...checklist };
    const itemIndex = updatedChecklist.items?.findIndex(item => item.id === originalItem.id) ?? -1;
    
    if (itemIndex !== -1 && updatedChecklist.items) {
      // Endre ID til .1
      updatedChecklist.items[itemIndex] = {
        ...updatedChecklist.items[itemIndex],
        id: `${originalItem.id}.1`
      };
      
      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
    }
  };

  // Funksjon for å legge til underpunkt
  const handleAddSubItem = async (parentItem: ChecklistItem) => {
    if (!checklist) return;

    try {
      // Sjekk om dette er første underpunkt
      const hasSubItems = checklist.items?.some(item => 
        item.id.startsWith(parentItem.id + '.') && 
        item.id.split('.').length === parentItem.id.split('.').length + 1
      );

      let newId: string;
      
      if (!hasSubItems) {
        // Første underpunkt - konverter hovedpunkt til .1 først
        await convertToSubItem(parentItem);
        newId = `${parentItem.id}.2`;
      } else {
        // Finn neste underpunkt-nummer
        newId = getNextSubItemNumber(parentItem.id);
      }

      const newItem: ChecklistItem = {
        id: newId,
        category: parentItem.category,
        checkPoint: `${parentItem.checkPoint} (tilleggspunkt)`,
        frequency: parentItem.frequency,
        status: null,
        notes: '',
        images: [],
        timestamp: '',
        inspectors: [],
        text: `${parentItem.checkPoint} (tilleggspunkt)`,
        completed: false
      };

      // Hent oppdatert sjekkliste (i tilfelle hovedpunktet ble konvertert)
      const currentChecklist = await storageService.getChecklistById(checklist.id);
      if (!currentChecklist) return;

      const updatedChecklist = {
        ...currentChecklist,
        items: [...(currentChecklist.items || []), newItem]
      };

      await storageService.saveChecklist(updatedChecklist);
      setChecklist(updatedChecklist);
      
      // Finn det nyopprettede punktet i den oppdaterte sjekklisten for riktig referanse
      const savedNewItem = updatedChecklist.items?.find(item => item.id === newId);
      if (savedNewItem) {
        setSelectedItem(savedNewItem);
        setEditedNotes(savedNewItem.notes || '');
        setEditedStatus(savedNewItem.status);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('Feil ved tillegging av underpunkt:', error);
      alert('Kunne ikke legge til underpunkt. Vennligst prøv igjen.');
    }
  };

  // Sorter punkter etter ID for riktig rekkefølge
  const sortedItems = React.useMemo(() => {
    if (!checklist?.items) return [];
    
    return [...checklist.items].sort((a, b) => {
      const aParts = a.id.split('.').map(Number);
      const bParts = b.id.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) return aNum - bNum;
      }
      return 0;
    });
  }, [checklist?.items]);

  // Grupper sorterte punkter etter kategori
  const groupedItems = React.useMemo(() => {
    return sortedItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);
  }, [sortedItems]);

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
          {Object.entries(groupedItems).map(([category, items]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {category}
              </Typography>
              <List>
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem button onClick={() => handleItemClick(item)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={item.id} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                minWidth: item.id.includes('.') && item.id.split('.').length > 2 ? '65px' : '50px', 
                                fontWeight: 'bold' 
                              }}
                            />
                            <Typography variant="body1" sx={{ flexGrow: 1 }}>
                              {item.checkPoint}
                            </Typography>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSubItem(item);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Frekvens: {item.frequency}
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
            </Box>
          ))}
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
                  <MenuItem value="Ja">Ja</MenuItem>
                  <MenuItem value="Avvik">Avvik</MenuItem>
                  <MenuItem value="Nei">Nei</MenuItem>
                  <MenuItem value="Anbefalt tiltak">Anbefalt tiltak</MenuItem>
                  <MenuItem value="Behov ikke funnet">Behov ikke funnet</MenuItem>
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