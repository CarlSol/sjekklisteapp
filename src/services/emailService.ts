import type { Checklist } from '../types/Checklist';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

// Last inn miljøvariabler i utviklingsmiljø
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
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

  async sendChecklistReport(checklist: Checklist): Promise<boolean> {
    try {
      if (!process.env.EMAIL_FROM || !process.env.EMAIL_TO) {
        throw new Error('Manglende e-postkonfigurasjon. Sjekk miljøvariablene EMAIL_FROM og EMAIL_TO.');
      }

      // Generer PDF-rapport
      const pdfBuffer = await this.generateReportPDF(checklist);

      // E-postinnstillinger
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        cc: ['carl@solcellespesialisten.no'],
        subject: `Sjekkliste Rapport - Område ${checklist.areaNumber} - ${checklist.inspectionDate}`,
        text: `Vedlagt finner du sjekkliste-rapporten for Område ${checklist.areaNumber} fra ${checklist.inspectionDate}.`,
        attachments: [
          {
            filename: `sjekkliste_omrade_${checklist.areaNumber}_${checklist.inspectionDate}.pdf`,
            content: pdfBuffer
          }
        ]
      };

      // Send e-post
      console.log('Sender e-post med følgende konfigurasjon:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        from: process.env.EMAIL_FROM,
        to: mailOptions.to,
        cc: mailOptions.cc.join(', ')
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('E-post sendt:', info.messageId);
      
      return true;
    } catch (error) {
      console.error('Feil ved sending av e-post:', error);
      return false;
    }
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
        doc.on('data', chunk => chunks.push(chunk));
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
           .text(`Inspektør: ${checklist.inspector}`)
           .moveDown();

        // Sjekkliste-elementer
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Sjekkliste-elementer')
           .moveDown();

        checklist.items.forEach((item, index) => {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(`${index + 1}. ${item.description}`)
             .font('Helvetica')
             .text(`Status: ${item.completed ? 'Fullført' : 'Ikke fullført'}`)
             .text(`Kommentar: ${item.comment || 'Ingen kommentar'}`)
             .moveDown();

          // Vis bilde hvis det finnes
          if (item.image) {
            doc.image(item.image, {
              fit: [400, 300],
              align: 'center'
            });
            doc.moveDown();
          }
        });

        // Koordinater
        if (checklist.coordinates) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Koordinater')
             .moveDown()
             .fontSize(12)
             .font('Helvetica')
             .text(`Latitude: ${checklist.coordinates.lat}`)
             .text(`Longitude: ${checklist.coordinates.lng}`)
             .moveDown();
        }

        // Footer
        const footerText = `Generert ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: nb })}`;
        doc.fontSize(10)
           .text(footerText, {
             align: 'center',
             valign: 'bottom'
           });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Opprett en singleton-instans
const emailService = new EmailService();

export async function sendChecklistReport(checklist: Checklist): Promise<boolean> {
  return emailService.sendChecklistReport(checklist);
}

export async function generateReportPDF(checklist: Checklist): Promise<Buffer> {
  return emailService.generateReportPDF(checklist);
} 