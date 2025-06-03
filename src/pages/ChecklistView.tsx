import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardMedia,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { PhotoCamera, Email as EmailIcon } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Checklist, ChecklistItem } from '../types/Checklist';
import { storageService } from '../services/storageService';
import { sendChecklistEmail, generateEmailContent } from '../services/emailService';

export default function ChecklistView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const initializePermissions = async () => {
    // Be om geolokasjonstillatelse
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          });
        });
        
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Kunne ikke få tilgang til posisjon. Vennligst tillat posisjonstilgang i nettleserinnstillingene.');
      }
    }

    // Be om kameratillatelse
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      // Stopp strømmen umiddelbart - vi vil starte den igjen når vi trenger den
      stream.getTracks().forEach(track => track.stop());
      setCameraError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Kunne ikke få tilgang til kamera. Vennligst tillat kameratilgang i nettleserinnstillingene.');
    }
  };

  useEffect(() => {
    initializePermissions();
  }, []);

  useEffect(() => {
    if (id) {
      const loadedChecklist = storageService.getChecklistById(id);
      if (loadedChecklist) {
        // Legg til sjekklistepunkter hvis listen er tom
        if (loadedChecklist.items.length === 0) {
          loadedChecklist.items = [
            {
              id: '1',
              category: 'Generelt',
              checkPoint: 'Sjekk generell tilstand',
              frequency: 'Daglig',
              status: null,
              notes: '',
              imageRefs: [],
              timestamp: new Date().toISOString(),
              inspector: ''
            }
          ];
        }
        setChecklist(loadedChecklist);
      } else {
        // Hvis ingen sjekkliste finnes, opprett en ny
        const newChecklist: Checklist = {
          id,
          solparkName: '',
          areaNumber: 0,
          inspectionDate: new Date().toISOString(),
          inspectors: [],
          weatherConditions: '',
          generalCondition: '',
          items: [
            {
              id: '1',
              category: 'Generelt',
              checkPoint: 'Sjekk generell tilstand',
              frequency: 'Daglig',
              status: null,
              notes: '',
              imageRefs: [],
              timestamp: new Date().toISOString(),
              inspector: ''
            }
          ],
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setChecklist(newChecklist);
      }
    }
  }, [id, navigate]);

  const handleItemClick = async (item: ChecklistItem) => {
    setSelectedItem(item);
    setOpenDialog(true);
    
    // Oppdater koordinater når dialog åpnes
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          });
        });
        
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Kunne ikke oppdatere posisjon. Vennligst sjekk nettleserinnstillingene.');
      }
    }
  };

  const handleStatusChange = (status: 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt') => {
    if (selectedItem && checklist) {
      const updatedItem = {
        ...selectedItem,
        status,
        timestamp: new Date().toISOString(),
        inspector: checklist.inspectors[0] || 'Ukjent',
        coordinates: currentLocation
          ? {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }
          : undefined,
      };

      setSelectedItem(updatedItem);

      const updatedItems = checklist.items.map((item) =>
        item.id === selectedItem.id ? updatedItem : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      setChecklist(updatedChecklist);
    }
  };

  const handleNotesChange = (notes: string) => {
    if (selectedItem && checklist) {
      const updatedItem = {
        ...selectedItem,
        notes,
      };

      const updatedItems = checklist.items.map((item) =>
        item.id === selectedItem.id ? updatedItem : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      setChecklist(updatedChecklist);
    }
  };

  const handleAddItem = (item: ChecklistItem) => {
    if (checklist) {
      const newItem = {
        ...item,
        id: `${item.id}-${Date.now()}`,
        status: null,
        notes: '',
        imageRefs: [],
        timestamp: '',
        inspector: '',
      };

      const updatedItems = [...checklist.items, newItem];
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      setChecklist(updatedChecklist);
    }
  };

  const handleImageCapture = async () => {
    try {
      // Be om tilgang til kameraet
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });

      // Opprett et input element av type file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Bruk bakkameraet

      // Håndter når brukeren har valgt et bilde
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && selectedItem && checklist) {
          // Konverter bildet til base64
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target?.result as string;
            
            const updatedItem = {
              ...selectedItem,
              imageRefs: [...selectedItem.imageRefs, imageData],
            };

            setSelectedItem(updatedItem);

            const updatedItems = checklist.items.map((item) =>
              item.id === selectedItem.id ? updatedItem : item
            );

            const updatedChecklist = {
              ...checklist,
              items: updatedItems,
              updatedAt: new Date().toISOString(),
            };

            setChecklist(updatedChecklist);
            setShowCamera(false);
          };
          reader.readAsDataURL(file);
        }
      };

      // Åpne kameraet
      input.click();

      // Stopp strømmen etter at brukeren har valgt et bilde
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Kunne ikke få tilgang til kamera. Vennligst tillat kameratilgang i nettleserinnstillingene.');
    }
  };

  // Oppdater useEffect for kamera
  useEffect(() => {
    if (showCamera) {
      handleImageCapture();
    }
  }, [showCamera]);

  const handleDeleteImage = (imageIndex: number) => {
    if (selectedItem && checklist) {
      const updatedItem = {
        ...selectedItem,
        imageRefs: selectedItem.imageRefs.filter((_, index) => index !== imageIndex),
      };

      const updatedItems = checklist.items.map((item) =>
        item.id === selectedItem.id ? updatedItem : item
      );

      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      setChecklist(updatedChecklist);
    }
  };

  const handleSave = () => {
    if (checklist) {
      storageService.saveChecklist(checklist);
      setSnackbar({
        open: true,
        message: 'Sjekkliste lagret',
        severity: 'success'
      });
    }
  };

  const handleSendEmail = async () => {
    if (!checklist) return;

    try {
      setIsSendingEmail(true);
      const { text, html } = generateEmailContent(checklist.items);
      await sendChecklistEmail({
        to: '',
        subject: `Sjekkliste - ${checklist.solparkName} Område ${checklist.areaNumber}`,
        text,
        html,
        checklistItems: checklist.items
      });
      alert('E-post sendt!');
    } catch (error) {
      console.error('Feil ved sending av e-post:', error);
      alert('Kunne ikke sende e-post. Vennligst prøv igjen senere.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const allItemsAnswered = checklist?.items.every(item => item.status !== null);

  if (!checklist) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Sjekkliste - Område {checklist.areaNumber}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSave}
          >
            Lagre
          </Button>
          {allItemsAnswered && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? 'Sender...' : 'Send E-post'}
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generell informasjon
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Solpark"
              value={checklist.solparkName}
              disabled
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dato"
              value={checklist.inspectionDate}
              disabled
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Værforhold"
              value={checklist.weatherConditions}
              onChange={(e) =>
                setChecklist({ ...checklist, weatherConditions: e.target.value })
              }
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Generell tilstand"
              value={checklist.generalCondition}
              onChange={(e) =>
                setChecklist({ ...checklist, generalCondition: e.target.value })
              }
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sjekkpunkter
        </Typography>
        <List>
          {checklist.items.map((item) => (
            <ListItem
              key={item.id}
              button
              onClick={() => handleItemClick(item)}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" color="primary">
                      {item.category}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body1">{item.checkPoint}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Frekvens: {item.frequency}
                      </Typography>
                      {item.status && (
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'OK'
                              ? 'success'
                              : item.status === 'Avvik'
                              ? 'error'
                              : item.status === 'Ikke aktuelt'
                              ? 'default'
                              : 'warning'
                          }
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <Box>
                  <Tooltip title="Legg til ny">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddItem(item);
                      }}
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setShowCamera(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem?.category} - {selectedItem?.checkPoint}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {locationError ? (
              <Typography color="error" sx={{ mb: 2 }}>
                {locationError}
              </Typography>
            ) : currentLocation ? (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Koordinater: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Henter koordinater...
              </Typography>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedItem?.status || ''}
                label="Status"
                onChange={(e) =>
                  handleStatusChange(e.target.value as 'OK' | 'Avvik' | 'Anbefalt tiltak' | 'Ikke aktuelt')
                }
              >
                <MenuItem value="OK">OK</MenuItem>
                <MenuItem value="Avvik">Avvik</MenuItem>
                <MenuItem value="Anbefalt tiltak">Anbefalt tiltak</MenuItem>
                <MenuItem value="Ikke aktuelt">Ikke aktuelt</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notater"
              value={selectedItem?.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              sx={{ mb: 2 }}
            />

            {selectedItem?.status !== 'Ikke aktuelt' && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => setShowCamera(true)}
                  disabled={!selectedItem?.status}
                >
                  Ta bilde
                </Button>
              </Box>
            )}

            {showCamera && cameraError && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error" sx={{ mb: 2 }}>
                  {cameraError}
                </Typography>
              </Box>
            )}

            {selectedItem?.imageRefs && selectedItem.imageRefs.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Bilder
                </Typography>
                <Grid container spacing={1}>
                  {selectedItem.imageRefs.map((image, index) => (
                    <Grid item key={index}>
                      <Card sx={{ width: 150, height: 150 }}>
                        <CardMedia
                          component="img"
                          image={image}
                          alt={`Bilde ${index + 1}`}
                          sx={{ height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.7)',
                            },
                          }}
                          onClick={() => handleDeleteImage(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setShowCamera(false);
          }}>
            Lukk
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as 'success' | 'error'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 