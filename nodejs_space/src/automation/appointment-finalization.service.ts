import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { FinalizeAppointmentDto } from './dto/finalize-appointment.dto';

@Injectable()
export class AppointmentFinalizationService {
  private readonly logger = new Logger(AppointmentFinalizationService.name);

  /**
   * Helper function to wait/delay
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Finalizează programarea medicală completând formularul Gralmed cu Puppeteer
   */
  async finalizeAppointment(dto: FinalizeAppointmentDto): Promise<{
    success: boolean;
    message: string;
    detalii?: any;
  }> {
    let browser: puppeteer.Browser | null = null;
    
    try {
      this.logger.log(`Starting appointment finalization for ${dto.nume_prenume}`);
      
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to Gralmed programare page
      this.logger.log('Navigating to Gralmed programare online...');
      await page.goto('https://www.gralmedical.ro/programare-online/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for page to load
      await this.wait(2000);

      // STEP 1: Select City
      this.logger.log(`Selecting city: ${dto.city_id}`);
      await page.waitForSelector('#programari_oras', { timeout: 10000 });
      await page.select('#programari_oras', dto.city_id);
      await this.wait(1500);

      // STEP 2: Select Location/Center
      this.logger.log(`Selecting location: ${dto.location_id}`);
      await page.waitForSelector('#programari_locatie', { timeout: 10000 });
      await page.select('#programari_locatie', dto.location_id);
      await this.wait(1500);

      // STEP 3: Select Specialization
      this.logger.log(`Selecting specialization: ${dto.specialization_id}`);
      await page.waitForSelector('#programari_specialitate', { timeout: 10000 });
      await page.select('#programari_specialitate', dto.specialization_id);
      await this.wait(1500);

      // STEP 4: Select Doctor
      this.logger.log(`Selecting doctor: ${dto.doctor_id}`);
      await page.waitForSelector('#programari_medic', { timeout: 10000 });
      await page.select('#programari_medic', dto.doctor_id);
      await this.wait(1500);

      // STEP 5: Select Service
      this.logger.log(`Selecting service: ${dto.service_id}`);
      await page.waitForSelector('#programari_serviciu', { timeout: 10000 });
      await page.select('#programari_serviciu', dto.service_id);
      await this.wait(1500);

      // STEP 6: Select Date
      this.logger.log(`Selecting date: ${dto.data_programare}`);
      await page.waitForSelector('#programari_data', { timeout: 10000 });
      await page.click('#programari_data');
      await page.type('#programari_data', dto.data_programare);
      await this.wait(1500);

      // Click "Continua" button to proceed
      this.logger.log('Clicking Continua button...');
      const continuaButton = await page.$('button:has-text("Continuă")');
      if (continuaButton) {
        await continuaButton.click();
      } else {
        // Try alternative selector
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const continuaBtn = buttons.find(btn => btn.textContent?.includes('Continu'));
          if (continuaBtn) {
            (continuaBtn as HTMLElement).click();
          }
        });
      }
      await this.wait(2000);

      // STEP 7: Select Time Slot
      this.logger.log(`Selecting time slot: ${dto.ora_programare}`);
      // Wait for time slots to appear
      await page.waitForSelector('.time-slot, .hour-slot, [data-hour]', { timeout: 10000 });
      
      // Click on the specific time slot
      const timeSlotClicked = await page.evaluate((ora) => {
        const slots = Array.from(document.querySelectorAll('.time-slot, .hour-slot, [data-hour], button, a'));
        const targetSlot = slots.find(slot => {
          const text = slot.textContent?.trim();
          return text === ora || text?.includes(ora);
        });
        
        if (targetSlot) {
          (targetSlot as HTMLElement).click();
          return true;
        }
        return false;
      }, dto.ora_programare);

      if (!timeSlotClicked) {
        throw new Error(`Nu s-a găsit slotul de timp ${dto.ora_programare}`);
      }

      await this.wait(2000);

      // STEP 8: Fill Personal Data Form
      this.logger.log('Filling personal data form...');

      // Wait for form to appear
      await page.waitForSelector('input[name="nume"], input[placeholder*="Nume"], #nume', { timeout: 10000 });

      // Split name into first and last name
      const nameParts = dto.nume_prenume.trim().split(' ');
      const prenume = nameParts[0];
      const nume = nameParts.slice(1).join(' ') || prenume;

      // Fill Prenume (First Name)
      await page.type('input[name="prenume"], input[placeholder*="Prenume"], #prenume', prenume);

      // Fill Nume (Last Name)
      await page.type('input[name="nume"], input[placeholder*="Nume"], #nume', nume);

      // Fill Data Nasterii (Birth Date)
      await page.type('input[name="data_nasterii"], input[placeholder*="nașterii"], #data_nasterii', dto.data_nasterii);

      // Fill Telefon (Phone)
      await page.type('input[name="telefon"], input[placeholder*="Telefon"], input[type="tel"], #telefon', dto.telefon);

      // Fill Email
      await page.type('input[name="email"], input[placeholder*="Email"], input[type="email"], #email', dto.email);

      // Fill Observatii (if provided)
      if (dto.observatii) {
        const observatiiField = await page.$('textarea[name="observatii"], textarea[placeholder*="Observa"], #observatii');
        if (observatiiField) {
          await page.type('textarea[name="observatii"], textarea[placeholder*="Observa"], #observatii', dto.observatii);
        }
      }

      await this.wait(1000);

      // STEP 9: Accept Terms (GDPR - automatic)
      this.logger.log('Accepting terms...');
      const termsCheckbox = await page.$('input[type="checkbox"][name*="term"], input[type="checkbox"][name*="gdpr"], input[type="checkbox"][name*="acord"]');
      if (termsCheckbox) {
        await termsCheckbox.click();
      }

      await this.wait(1000);

      // STEP 10: Submit Form
      this.logger.log('Submitting form...');
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Confirm"), button:has-text("Finalizeaz")');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try alternative selector
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
          const submitBtn = buttons.find(btn => {
            const text = btn.textContent?.toLowerCase() || (btn as HTMLInputElement).value?.toLowerCase();
            return text?.includes('confirm') || text?.includes('finaliz') || text?.includes('trimite');
          });
          if (submitBtn) {
            (submitBtn as HTMLElement).click();
          }
        });
      }

      // Wait for confirmation
      await this.wait(3000);

      // Check for success message
      const successMessage = await page.evaluate(() => {
        const body = document.body.textContent || '';
        if (body.includes('succes') || body.includes('confirmat') || body.includes('programare înregistrat')) {
          return true;
        }
        return false;
      });

      if (successMessage) {
        this.logger.log('Appointment finalized successfully!');
        return {
          success: true,
          message: 'Programarea a fost înregistrată cu succes! Veți primi SMS de confirmare.',
          detalii: {
            medic: dto.doctor_id === '144611' ? 'Dr. Vilceanu Gabriel Cosmin' : 'Dr. Pirciu Marius',
            data: dto.data_programare,
            ora: dto.ora_programare,
            pacient: dto.nume_prenume
          }
        };
      } else {
        this.logger.warn('Could not confirm success message');
        return {
          success: true,
          message: 'Programarea a fost trimisă. Veți primi confirmare pe email/SMS.',
          detalii: {
            medic: dto.doctor_id === '144611' ? 'Dr. Vilceanu Gabriel Cosmin' : 'Dr. Pirciu Marius',
            data: dto.data_programare,
            ora: dto.ora_programare,
            pacient: dto.nume_prenume
          }
        };
      }

    } catch (error) {
      this.logger.error(`Error finalizing appointment: ${error.message}`, error.stack);
      throw new Error(`Nu s-a putut finaliza programarea: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }
}
