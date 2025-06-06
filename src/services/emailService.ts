import sgMail from '@sendgrid/mail';
import type { Checklist, ChecklistItem } from '../types/Checklist';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Konfigurasjon for SendGrid
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;
const EMAIL_TO = import.meta.env.VITE_EMAIL_TO;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  checklistItems: ChecklistItem[];
}

// Hjelpefunksjon for å laste inn bilder
const loadImage = (base64Image: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Sjekk EXIF-orientering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img);
        return;
      }

      // Standard bredde og høyde
      let width = img.width;
      let height = img.height;

      // Roter bildet basert på orientering
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Konverter tilbake til base64
      const rotatedBase64 = canvas.toDataURL('image/jpeg');
      const rotatedImg = new Image();
      rotatedImg.onload = () => resolve(rotatedImg);
      rotatedImg.onerror = reject;
      rotatedImg.src = rotatedBase64;
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};

export const generatePDF = async (checklist: Checklist): Promise<Blob> => {
  try {
    console.log('Starter PDF-generering for sjekkliste:', checklist.id);
    
    // Valider input
    if (!checklist || !checklist.items || checklist.items.length === 0) {
      throw new Error('Ugyldig sjekkliste: Mangler data eller sjekkpunkter');
    }

    // Opprett PDF-dokument
    const doc = new jsPDF();
    let currentY = 20;
    
    // Tittel
    doc.setFontSize(16);
    doc.text(`Sjekkliste - ${checklist.solparkName || 'Ukjent solpark'}`, 14, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.text(`Område ${checklist.areaNumber || 'Ukjent'}`, 14, currentY);
    currentY += 10;
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Dato: ${new Date().toLocaleDateString('nb-NO')}`, 14, currentY);
    currentY += 5;
    doc.text(`Inspektør: ${checklist.inspectors?.join(', ') || 'Ikke spesifisert'}`, 14, currentY);
    currentY += 15;
    
    // Grupper sjekkpunkter etter kategori
    const groupedItems = checklist.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);

    // Gå gjennom hver kategori
    for (const [category, items] of Object.entries(groupedItems)) {
      // Sjekk om vi trenger ny side
      if (currentY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        currentY = 20;
      }

      // Legg til kategoritittel
      doc.setFontSize(12);
      doc.text(category, 14, currentY);
      currentY += 10;

      // Legg til tabell for denne kategorien
      const tableData = items.map((item: ChecklistItem) => [
        item.id || '',
        item.checkPoint || '',
        item.status || 'Ikke sjekket',
        item.notes || '',
        item.timestamp ? new Date(item.timestamp).toLocaleString('nb-NO') : '',
        item.location ? 'Kart' : ''
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['ID', 'Sjekkpunkt', 'Status', 'Notater', 'Tidspunkt', 'GPS']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          5: { textColor: [0, 0, 255] }  // Blå tekst for GPS-lenke kolonnen
        },
        margin: { top: 10 },
        didDrawCell: (data) => {
          // Legg til klikkbare lenker for sjekkpunkter med GPS-koordinater
          if (data.column.index === 5 && data.cell.section === 'body') {
            const rowIndex = data.row.index;
            if (rowIndex < items.length) {
              const item = items[rowIndex];
              if (item && item.location) {
                const googleMapsUrl = `https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}&zoom=18`;
                
                doc.link(
                  data.cell.x,
                  data.cell.y,
                  data.cell.width,
                  data.cell.height,
                  { url: googleMapsUrl }
                );
              }
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Legg til bilder for hvert sjekkpunkt
      for (const item of items) {
        if (item.images && item.images.length > 0) {
          // Sjekk om vi trenger ny side
          if (currentY > doc.internal.pageSize.height - 100) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(10);
          doc.text(`Bilder for ${item.id}:`, 14, currentY);
          currentY += 10;

          // Behandle bilder (kan være med eller uten GPS-metadata)
          for (const imageRef of item.images) {
            try {
              let imageData = imageRef;
              let imageLocation = null;
              let imageTimestamp = null;

              // Prøv å parse JSON hvis bildet inneholder metadata
              try {
                const parsedData = JSON.parse(imageRef);
                imageData = parsedData.data;
                imageLocation = parsedData.location;
                imageTimestamp = parsedData.timestamp;
              } catch {
                // Hvis ikke JSON, bruk imageRef direkte
              }

              const img = await loadImage(imageData);
              const imgWidth = 100;
              const imgHeight = (img.height * imgWidth) / img.width;

              // Sjekk om vi trenger ny side
              if (currentY + imgHeight + 40 > doc.internal.pageSize.height - 20) {
                doc.addPage();
                currentY = 20;
              }

              // Legg til bildets tittel med koordinater og tid
              let titleText = 'Bilde';
              if (imageLocation && imageTimestamp) {
                titleText = `GPS: ${imageLocation.latitude.toFixed(6)}, ${imageLocation.longitude.toFixed(6)} - ${new Date(imageTimestamp).toLocaleString('nb-NO')}`;
              } else if (imageLocation) {
                titleText = `GPS: ${imageLocation.latitude.toFixed(6)}, ${imageLocation.longitude.toFixed(6)}`;
              } else if (imageTimestamp) {
                titleText = `Tidspunkt: ${new Date(imageTimestamp).toLocaleString('nb-NO')}`;
              }

              doc.setFontSize(9);
              doc.text(titleText, 14, currentY);
              currentY += 7;

              doc.addImage(img, 'JPEG', 14, currentY, imgWidth, imgHeight);
              currentY += imgHeight + 5;
              
              // Legg til Google Maps lenke rett under bildet
              if (imageLocation) {
                const imageGpsUrl = `https://www.google.com/maps?q=${imageLocation.latitude},${imageLocation.longitude}&zoom=20`;
                
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 255);
                doc.textWithLink('📍 Åpne i Google Maps', 14, currentY, { url: imageGpsUrl });
                doc.setTextColor(0, 0, 0);
                currentY += 10;
              } else {
                currentY += 5;
              }

            } catch (error) {
              console.error('Feil ved lasting av bilde:', error);
              doc.setFontSize(8);
              doc.text('Kunne ikke laste bilde', 14, currentY);
              currentY += 10;
            }
          }

          // Ekstra space etter bilder
          currentY += 5;
        }
      }

      // Legg til ekstra space mellom kategorier
      currentY += 10;
    }
    
    // Konverter til Blob
    const pdfOutput = doc.output('blob');
    console.log('PDF generert med størrelse:', pdfOutput.size);
    
    if (!pdfOutput || pdfOutput.size === 0) {
      throw new Error('PDF-generering feilet: Tomt dokument');
    }
    
    return pdfOutput;
  } catch (error) {
    console.error('Feil ved PDF-generering:', error);
    throw new Error(`Kunne ikke generere PDF: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
  }
};

export const generateEmailContent = (items: ChecklistItem[]): { text: string; html: string } => {
  const text = items
    .map((item) => `${item.id}: ${item.checkPoint} - Status: ${item.status || 'Ikke sjekket'}`)
    .join('\n');

  const html = `
    <h2>Sjekkliste Resultater</h2>
    <table border="1" cellpadding="5" style="border-collapse: collapse;">
      <tr>
        <th>ID</th>
        <th>Sjekkpunkt</th>
        <th>Status</th>
        <th>Notater</th>
        <th>Tidspunkt</th>
      </tr>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${item.id}</td>
          <td>${item.checkPoint}</td>
          <td>${item.status || 'Ikke sjekket'}</td>
          <td>${item.notes || ''}</td>
          <td>${item.timestamp ? new Date(item.timestamp).toLocaleString('nb-NO') : ''}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  `;

  return { text, html };
};

export const sendChecklistEmail = async (emailData: EmailData): Promise<void> => {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API-nøkkel mangler. Sjekk at VITE_SENDGRID_API_KEY er satt i .env-filen.');
      throw new Error('SendGrid API-nøkkel er ikke konfigurert. Vennligst kontakt administrator.');
    }

    if (!EMAIL_FROM) {
      console.error('Avsender-e-post mangler. Sjekk at VITE_EMAIL_FROM er satt i .env-filen.');
      throw new Error('Avsender-e-post er ikke konfigurert. Vennligst kontakt administrator.');
    }

    if (!EMAIL_TO) {
      console.error('Mottaker-e-post mangler. Sjekk at VITE_EMAIL_TO er satt i .env-filen.');
      throw new Error('Mottaker-e-post er ikke konfigurert. Vennligst kontakt administrator.');
    }

    const msg = {
      to: emailData.to || EMAIL_TO,
      from: EMAIL_FROM,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    console.log('Forsøker å sende e-post med følgende data:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
    });

    try {
      await sgMail.send(msg);
      console.log('E-post sendt vellykket');
    } catch (sendError: any) {
      console.error('SendGrid API feil:', {
        statusCode: sendError.code,
        message: sendError.message,
        response: sendError.response?.body
      });
      
      if (sendError.code === 401) {
        throw new Error('Ugyldig API-nøkkel. Vennligst sjekk SendGrid API-nøkkelen.');
      } else if (sendError.code === 403) {
        throw new Error('Ingen tilgang til SendGrid API. Vennligst sjekk API-nøkkelens tillatelser.');
      } else if (sendError.code === 429) {
        throw new Error('For mange forespørsler. Vennligst prøv igjen senere.');
      } else {
        throw new Error(`SendGrid API feil: ${sendError.message}`);
      }
    }
  } catch (error) {
    console.error('Detaljert feil ved sending av e-post:', error);
    if (error instanceof Error) {
      throw new Error(`Kunne ikke sende e-post: ${error.message}`);
    }
    throw new Error('Kunne ikke sende e-post. Vennligst prøv igjen senere.');
  }
}; 