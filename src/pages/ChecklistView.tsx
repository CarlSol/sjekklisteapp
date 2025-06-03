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

// Standard sjekkpunkter (kopiert fra branch eb04470)
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
  {
    id: '1.3',
    category: '1. Gjerder og Porter',
    checkPoint: 'Visuell inspeksjon av porter (funksjon, lås, skader)',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '1.4',
    category: '1. Gjerder og Porter',
    checkPoint: 'Kontroller at lovpålagte merker/låser er på plass (på gjerder/porter)',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '1.5',
    category: '1. Gjerder og Porter',
    checkPoint: 'Sjekk og vurder behov for erstatning av ødelagte/manglende skilt/advarsler',
    frequency: 'Årlig ($, foreslå)',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 2. Solcellepaneler (PV Moduler)
  {
    id: '2.1',
    category: '2. Solcellepaneler (PV Moduler)',
    checkPoint: 'Sjekk generell tilstand fra bakkenivå (glass, ramme, bakside, koblingsboks – se etter sprekker, misfarging, løse deler, fysiske skader)',
    frequency: 'Halvårlig',
    status: null,
    notes: 'Vurder også unormalt mye smuss, tegn til hot-spots (visuelt).',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '2.2',
    category: '2. Solcellepaneler (PV Moduler)',
    checkPoint: 'Vurder behov for rengjøring av moduloverflate',
    frequency: 'Ved behov ($, foreslå)',
    status: null,
    notes: 'Estimer tap pga. smuss, type smuss.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '2.3',
    category: '2. Solcellepaneler (PV Moduler)',
    checkPoint: 'Termisk analyse av moduler (100% av moduler i området)',
    frequency: 'Årlig',
    status: null,
    notes: 'Se etter hot-spots, ujevn temperaturfordeling.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '2.4',
    category: '2. Solcellepaneler (PV Moduler)',
    checkPoint: 'Måling av strengens åpen kretsspenning (hvis under-ytelse er påvist for strenger i området, 10% av disse)',
    frequency: 'Årlig ($, ved behov)',
    status: null,
    notes: 'Spesifiser hvilke strenger som måles.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 3. Montagestruktur/Stativ
  {
    id: '3.1',
    category: '3. Montagestruktur/Stativ',
    checkPoint: 'Kontroll av status og tiltrekking av muttere/bolter (stikkprøver) fra bakkenivå',
    frequency: 'Årlig',
    status: null,
    notes: 'Se etter løse fester, deformasjoner.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '3.2',
    category: '3. Montagestruktur/Stativ',
    checkPoint: 'Visuell inspeksjon av erosjon og korrosjon (representativt utvalg i området) fra bakkenivå',
    frequency: 'Halvårlig',
    status: null,
    notes: 'Se etter rust, galvanisk korrosjon, skader på overflatebehandling.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '3.3',
    category: '3. Montagestruktur/Stativ',
    checkPoint: 'Vurder behov for vedlikehold av montasjestruktur (iht. produsentens retningslinjer)',
    frequency: 'Halvårlig',
    status: null,
    notes: 'Noter eventuelle spesifikke tiltak.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '3.4',
    category: '3. Montagestruktur/Stativ',
    checkPoint: 'Kontinuitetssjekk av jordingssystem for stativer i området',
    frequency: 'Årlig ($, foreslå)',
    status: null,
    notes: 'Mål verdier, sjekk koblinger, korrosjon ved jordingspunkter.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 4. Invertere i Området
  {
    id: '4.1',
    category: '4. Invertere i Området',
    checkPoint: 'Visuell sjekk av enhetens status (display, LED-indikatorer, ytre tilstand)',
    frequency: 'Ved hvert besøk (ref. Daglig remote)',
    status: null,
    notes: 'Se etter feilkoder, unormale lyder, skader på kabinett.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '4.2',
    category: '4. Invertere i Området',
    checkPoint: 'Kontroll av beskyttelsesutstyr (visuelt, funksjonstest hvis relevant og sikkert)',
    frequency: 'Halvårlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '4.3',
    category: '4. Invertere i Området',
    checkPoint: 'Sjekk/bytt filtre (hvis aktuelt), sjekk trykkmålere (hvis aktuelt), MOVs (visuelt), DC vifter (funksjon, støy), tetningslister (tilstand), AC kontaktor (visuelt, tegn til slitasje)',
    frequency: 'Halvårlig (oftere ved behov)',
    status: null,
    notes: 'Vurder støvakkumulering, slitasje, skader.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '4.4',
    category: '4. Invertere i Området',
    checkPoint: 'Kontroll av tiltrekking skruer og muttere (eksternt, lett tilgjengelig på kabinett/fester)',
    frequency: 'Halvårlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '4.5',
    category: '4. Invertere i Området',
    checkPoint: 'Rengjør støv fra inverterens kjøleribber (eksternt)',
    frequency: 'Halvårlig',
    status: null,
    notes: 'Sikre god luftgjennomstrømning.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '4.6',
    category: '4. Invertere i Området',
    checkPoint: 'Kontroller at lovpålagte merker/låser er på plass på inverterkabinett',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 5. Kabler og Koblingsbokser
  {
    id: '5.1',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Generell status på kabelføring fra bakkenivå (skader, oppheng, beskyttelse, avisolering, strekkavlastning)',
    frequency: 'Årlig',
    status: null,
    notes: 'Se etter gnagerskader, klemskader, UV-skader, kabler på bakken.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '5.2',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Visuell inspeksjon av koblingsbokser (pakninger, skader på kabinett, tegn til inntrengning av fukt/støv)',
    frequency: 'Halvårlig (ref "Low voltage panels")',
    status: null,
    notes: 'Se etter korrosjon internt hvis inspeksjon åpner boksen.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '5.3',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Inspeksjon av hovedkabler for tiltrekking i koblingsbokser (visuelt, tegn til misfarging/varme)',
    frequency: 'Halvårlig (S) (ref "Low voltage panels")',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '5.4',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Termisk analyse av strengbokser (100% av bokser i området)',
    frequency: 'Årlig',
    status: null,
    notes: 'Se etter hot-spots som indikerer løse koblinger eller defekter.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '5.5',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Vurder behov for tiltrekkingskontroll av ledninger i koblingsbokser',
    frequency: 'Årlig ($, "Not applicable" - avklar)',
    status: null,
    notes: 'Foreslå/fakturer hvis relevant og avklart.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '5.6',
    category: '5. Kabler og Koblingsbokser',
    checkPoint: 'Kontroller at lovpålagte merker/låser er på plass på koblingsbokser',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 6. Sensorer og Måleutstyr
  {
    id: '6.1',
    category: '6. Sensorer og Måleutstyr',
    checkPoint: 'Pyranometer: Rengjøring av glasskuppel/sensorflate',
    frequency: 'Ved hvert besøk / Halvårlig',
    status: null,
    notes: 'Fjern smuss, fugleskitt, sjekk for skygge fra vegetasjon/objekter.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '6.2',
    category: '6. Sensorer og Måleutstyr',
    checkPoint: 'Pyranometer: Visuell sjekk av enhet, kabler, vater (hvis aktuelt), feste',
    frequency: 'Halvårlig',
    status: null,
    notes: 'Se etter skader, løse koblinger, korrekt montering.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '6.3',
    category: '6. Sensorer og Måleutstyr',
    checkPoint: 'Temperatursensorer (modul/omgivelse): Visuell sjekk, feste, kabler',
    frequency: 'Halvårlig (implisitt i re-kalibrering)',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '6.4',
    category: '6. Sensorer og Måleutstyr',
    checkPoint: 'Vurder behov for re-kalibrering av pyranometer og temperatursensorer',
    frequency: 'Hvert 2. år ($, foreslå)',
    status: null,
    notes: 'Planlegg iht. produsentens spesifikasjoner.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 7. Generelt for Området
  {
    id: '7.1',
    category: '7. Generelt for Området',
    checkPoint: 'Generell visuell inspeksjon av hele området (ryddighet, uønskede gjenstander, tegn til hærverk)',
    frequency: 'Årlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.2',
    category: '7. Generelt for Området',
    checkPoint: 'Inspeksjon av interne dreneringssystemer og vannkanaler i området',
    frequency: 'Ved hvert besøk',
    status: null,
    notes: 'Se etter blokkeringer, erosjon, skader, funksjonalitet.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.3',
    category: '7. Generelt for Området',
    checkPoint: 'Inspeksjon av adkomstveier/stier innenfor og til området (tilstand, fremkommelighet)',
    frequency: 'Ved hvert besøk / Ved behov ($, foreslå)',
    status: null,
    notes: 'Se etter hull, gjengroing, hindringer.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.4',
    category: '7. Generelt for Området',
    checkPoint: 'Vurdering av vegetasjon (gresshøyde, busker, trær – mtp. skygge på paneler, adkomst, brannfare, krav i reguleringsplan/LEMP)',
    frequency: 'Ved hvert besøk / Ved behov (S, $, foreslå)',
    status: null,
    notes: 'Noter behov for klipping, rydding, fjerning.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.5',
    category: '7. Generelt for Området',
    checkPoint: 'Sjekk for erosjon eller andre endringer i grunnforhold i området',
    frequency: 'Ved hvert besøk / Halvårlig',
    status: null,
    notes: 'Se etter utglidninger, setninger, sprekker i bakken.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.6',
    category: '7. Generelt for Området',
    checkPoint: '(Kun for Område 5) Inspeksjon av Gunnarsbekken dam',
    frequency: 'Halvårlig',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '7.7',
    category: '7. Generelt for Området',
    checkPoint: 'Kontroll og tilstand på eventuelt distribuert nødutstyr i området (f.eks. brannslukkere)',
    frequency: 'Årlig',
    status: null,
    notes: 'Sjekk trykk, serviceetikett, tilgjengelighet.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  // 8. HMS og Sikkerhet
  {
    id: '8.1',
    category: '8. HMS og Sikkerhet',
    checkPoint: 'Er anleggsregler/HMS-rutiner fulgt under inspeksjonen av området?',
    frequency: 'Ved hvert besøk',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '8.2',
    category: '8. HMS og Sikkerhet',
    checkPoint: 'Identifiserte nye farer eller HMS-risikoer i området?',
    frequency: 'Ved hvert besøk',
    status: null,
    notes: 'Rapporteres videre iht. interne rutiner.',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
  {
    id: '8.3',
    category: '8. HMS og Sikkerhet',
    checkPoint: 'Generell sikkerhetstilstand i området (snublerisiko, skarpe kanter, etc.)',
    frequency: 'Ved hvert besøk',
    status: null,
    notes: '',
    imageRefs: [],
    timestamp: '',
    inspector: '',
  },
];

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
        setChecklist(loadedChecklist);
      } else {
        // Hvis ingen sjekkliste finnes, opprett en ny med alle standardpunkter
        const newChecklist: Checklist = {
          id,
          solparkName: '',
          areaNumber: 0,
          inspectionDate: new Date().toISOString(),
          inspectors: [],
          weatherConditions: '',
          generalCondition: '',
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
          updatedAt: new Date().toISOString()
        };
        setChecklist(newChecklist);
        storageService.saveChecklist(newChecklist);
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