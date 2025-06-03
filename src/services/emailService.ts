import type { Checklist } from '../types/Checklist';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Buffer } from 'buffer';

// Last inn miljøvariabler i utviklingsmiljø
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }

  public async generateReportPDF(checklist: Checklist): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Sjekkliste Rapport - Område ${checklist.areaNumber}`,
            Author: 'Solcellespesialisten',
            Subject: 'Sjekkliste Rapport'
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('Sjekkliste Rapport', { align: 'center' })
           .moveDown();

        // Informasjon
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Område: ${checklist.areaNumber}`)
           .text(`Dato: ${format(new Date(checklist.inspectionDate), 'dd. MMMM yyyy', { locale: nb })}`)
           .text(`Inspektør: ${checklist.inspectors.join(', ')}`)
           .text(`Værforhold: ${checklist.weatherConditions}`)
           .text(`Generell tilstand: ${checklist.generalCondition}`)
           .moveDown();

        // Sjekkliste-elementer
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Sjekkliste-elementer')
           .moveDown();

        checklist.items.forEach((item, index) => {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(`${index + 1}. ${item.checkPoint}`)
             .font('Helvetica')
             .text(`Kategori: ${item.category}`)
             .text(`Frekvens: ${item.frequency}`)
             .text(`Status: ${item.status || 'Ikke satt'}`)
             .text(`Kommentar: ${item.notes || 'Ingen kommentar'}`)
             .moveDown();

          // Vis bilde hvis det finnes
          if (item.imageRefs && item.imageRefs.length > 0) {
            item.imageRefs.forEach(imageRef => {
              doc.image(imageRef, {
                fit: [400, 300],
                align: 'center'
              });
              doc.moveDown();
            });
          }

          // Vis koordinater hvis de finnes
          if (item.coordinates) {
            doc.text(`Koordinater: ${item.coordinates.latitude}, ${item.coordinates.longitude}`)
               .moveDown();
          }
        });

        // Footer
        const footerText = `Generert ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: nb })}`;
        doc.fontSize(10)
           .text(footerText, {
             align: 'center'
           });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  public async sendChecklistReport(checklist: Checklist): Promise<boolean> {
    try {
      const pdfBuffer = await this.generateReportPDF(checklist);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: `Sjekkliste Rapport - ${checklist.solparkName} Område ${checklist.areaNumber}`,
        text: `Vedlagt finner du sjekkliste rapport for ${checklist.solparkName} Område ${checklist.areaNumber}.`,
        attachments: [
          {
            filename: `sjekkliste_${checklist.areaNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Feil ved sending av e-post:', error);
      return false;
    }
  }
}

// Opprett en singleton-instans
const emailService = new EmailService();

// Eksporter funksjoner
export async function sendChecklistReport(checklist: Checklist): Promise<boolean> {
  return emailService.sendChecklistReport(checklist);
}

export async function generateReportPDF(checklist: Checklist): Promise<Buffer> {
  return emailService.generateReportPDF(checklist);
} 