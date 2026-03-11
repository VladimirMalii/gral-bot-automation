import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { CheckAvailabilityDto, SlotDisponibil } from './dto/check-availability.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private browser: Browser | null = null;

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Browser closed on module destroy');
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.logger.log('Launching new browser instance...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
          '--single-process',
          '--no-zygote'
        ],
        timeout: 60000
      });
      this.logger.log('Browser launched successfully');
    }
    return this.browser;
  }

  async checkAvailability(dto: CheckAvailabilityDto): Promise<{ success: boolean; sloturi_disponibile: SlotDisponibil[]; message?: string }> {
    const { oras, centru, specialitate, medic, serviciu, data } = dto;
    
    this.logger.log(`Starting availability check for: ${JSON.stringify(dto)}`);
    
    let page: Page | null = null;
    
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.logger.log('Navigating to booking page...');
      await page.goto('https://www.gralmedical.ro/Programari-online', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      this.logger.log('Page loaded successfully');
      
      // Wait for form to be visible
      await page.waitForSelector('select, input, button', { timeout: 30000 });
      
      this.logger.log('Selecting Oraș...');
      await this.selectDropdownByText(page, oras, 'oraș');
      await this.sleep(1000);
      
      this.logger.log('Selecting Centru...');
      await this.selectDropdownByText(page, centru, 'centru');
      await this.sleep(1000);
      
      this.logger.log('Selecting Specialitate...');
      await this.selectDropdownByText(page, specialitate, 'specialitate');
      await this.sleep(1000);
      
      this.logger.log('Selecting Medic...');
      await this.selectDropdownByText(page, medic, 'medic');
      await this.sleep(1000);
      
      this.logger.log('Selecting Serviciu...');
      await this.selectDropdownByText(page, serviciu, 'serviciu');
      await this.sleep(1000);
      
      // Handle date selection
      if (data.toLowerCase() === 'primul_loc_disponibil') {
        this.logger.log('Selecting "Primul loc disponibil" option...');
        await this.selectFirstAvailableSlot(page);
      } else {
        this.logger.log(`Selecting specific date: ${data}`);
        await this.selectSpecificDate(page, data);
      }
      
      await this.sleep(1000);
      
      // Click Continuă button
      this.logger.log('Clicking "Continuă" button...');
      await this.clickContinueButton(page);
      
      // Wait for next page with time slots
      this.logger.log('Waiting for time slots to load...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
        this.logger.warn('Navigation timeout, checking if page changed...');
      });
      
      await this.sleep(2000);
      
      // Log current URL for debugging
      const currentUrl = page.url();
      this.logger.log(`Current page URL: ${currentUrl}`);
      
      // Extract available time slots
      this.logger.log('Extracting available time slots...');
      const sloturi = await this.extractTimeSlots(page);
      
      this.logger.log(`Found ${sloturi.length} available slots`);
      
      return {
        success: true,
        sloturi_disponibile: sloturi,
        message: sloturi.length > 0 ? 'Sloturi disponibile găsite' : 'Nu există sloturi disponibile'
      };
      
    } catch (error) {
      this.logger.error(`Error during availability check: ${error.message}`, error.stack);
      throw new Error(`Failed to check availability: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
        this.logger.log('Page closed');
      }
    }
  }

  private async selectDropdownByText(page: Page, text: string, fieldName: string): Promise<void> {
    try {
      // Normalize text for comparison (handle Romanian diacritics)
      const normalizeText = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/ț/g, 't').replace(/ș/g, 's')
          .replace(/ă/g, 'a').replace(/î/g, 'i').replace(/â/g, 'a')
          .trim();
      };
      
      const normalizedSearchText = normalizeText(text);
      
      // First, try to find the select element containing the option
      const selectElements = await page.$$('select');
      
      this.logger.log(`Found ${selectElements.length} select elements on page`);
      
      for (let i = 0; i < selectElements.length; i++) {
        const selectElement = selectElements[i];
        const options = await selectElement.$$('option');
        
        // Log all options for debugging
        const allOptions: string[] = [];
        for (const option of options) {
          const optionText = await page.evaluate(el => el.textContent?.trim() || '', option);
          const optionValue = await page.evaluate(el => el.value, option);
          allOptions.push(`"${optionText}" (value: ${optionValue})`);
        }
        
        this.logger.log(`Select ${i + 1} options: ${allOptions.slice(0, 10).join(', ')}${allOptions.length > 10 ? '...' : ''}`);
        
        // Try to match options
        for (const option of options) {
          const optionText = await page.evaluate(el => el.textContent?.trim() || '', option);
          const optionValue = await page.evaluate(el => el.value, option);
          const normalizedOptionText = normalizeText(optionText);
          const normalizedOptionValue = normalizeText(optionValue);
          
          // More flexible matching
          if (normalizedOptionText.includes(normalizedSearchText) || 
              normalizedSearchText.includes(normalizedOptionText) ||
              normalizedOptionValue.includes(normalizedSearchText)) {
            const value = await page.evaluate(el => el.value, option);
            
            // Skip empty values
            if (!value || value === '0' || value === '') {
              continue;
            }
            
            await selectElement.select(value);
            this.logger.log(`Selected ${fieldName}: ${optionText} (value: ${value})`);
            
            // Trigger change event
            await page.evaluate((el) => {
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, selectElement);
            
            return;
          }
        }
      }
      
      throw new Error(`Could not find option containing "${text}" in any dropdown for ${fieldName}`);
      
    } catch (error) {
      this.logger.error(`Error selecting ${fieldName}: ${error.message}`);
      throw error;
    }
  }

  private async selectFirstAvailableSlot(page: Page): Promise<void> {
    try {
      // Look for checkbox with text "Primul loc disponibil"
      const checkboxes = await page.$$('input[type="checkbox"]');
      
      for (const checkbox of checkboxes) {
        const label = await page.evaluate((el) => {
          const parent = el.parentElement;
          return parent?.textContent?.trim() || '';
        }, checkbox);
        
        if (label.includes('Primul loc disponibil') || label.includes('primul loc')) {
          await checkbox.click();
          this.logger.log('"Primul loc disponibil" checkbox clicked');
          return;
        }
      }
      
      this.logger.warn('Could not find "Primul loc disponibil" checkbox, will try to proceed anyway');
      
    } catch (error) {
      this.logger.error(`Error selecting first available slot: ${error.message}`);
      throw error;
    }
  }

  private async selectSpecificDate(page: Page, date: string): Promise<void> {
    try {
      // Look for date input or calendar
      const dateInputs = await page.$$('input[type="text"], input[type="date"]');
      
      for (const input of dateInputs) {
        const placeholder = await page.evaluate(el => el.placeholder || '', input);
        const name = await page.evaluate(el => el.name || '', input);
        
        if (placeholder.toLowerCase().includes('data') || name.toLowerCase().includes('data') || name.toLowerCase().includes('date')) {
          await input.click();
          await input.type(date);
          this.logger.log(`Date ${date} entered in date field`);
          return;
        }
      }
      
      // If no date input found, try to find and click calendar elements
      this.logger.log('No date input found, trying to interact with calendar...');
      
      // This is site-specific and may need adjustment
      const [day, month, year] = date.split('/');
      
      // Look for calendar date cells
      const dateCells = await page.$$('[data-date], .day, .calendar-day, td');
      
      for (const cell of dateCells) {
        const cellText = await page.evaluate(el => el.textContent?.trim() || '', cell);
        const dataDate = await page.evaluate(el => el.getAttribute('data-date'), cell);
        
        if (cellText === day || dataDate === date || dataDate === `${year}-${month}-${day}`) {
          await cell.click();
          this.logger.log(`Clicked on date cell: ${cellText}`);
          return;
        }
      }
      
      this.logger.warn(`Could not find date ${date} in calendar`);
      
    } catch (error) {
      this.logger.error(`Error selecting specific date: ${error.message}`);
      throw error;
    }
  }

  private async clickContinueButton(page: Page): Promise<void> {
    try {
      // Look for "Continuă" button
      const buttons = await page.$$('button, input[type="submit"], a.btn');
      
      for (const button of buttons) {
        const buttonText = await page.evaluate(el => {
          const text = el.textContent?.trim() || '';
          const value = (el as HTMLInputElement).value || '';
          return text || value;
        }, button);
        
        if (buttonText.toLowerCase().includes('continuă') || buttonText.toLowerCase().includes('continua')) {
          await button.click();
          this.logger.log('"Continuă" button clicked');
          return;
        }
      }
      
      throw new Error('Could not find "Continuă" button');
      
    } catch (error) {
      this.logger.error(`Error clicking continue button: ${error.message}`);
      throw error;
    }
  }

  private async extractTimeSlots(page: Page): Promise<SlotDisponibil[]> {
    try {
      const slots: SlotDisponibil[] = [];
      
      // First, check if there's an error message or "no slots available" message
      const bodyText = await page.evaluate(() => document.body.innerText);
      this.logger.log(`Page body text preview: ${bodyText.substring(0, 500)}`);
      
      if (bodyText.toLowerCase().includes('nu există') || bodyText.toLowerCase().includes('nu exista') || 
          bodyText.toLowerCase().includes('indisponibil') || bodyText.toLowerCase().includes('no slots')) {
        this.logger.warn('Page indicates no slots available');
        return [];
      }
      
      // Method 1: Try to extract using a comprehensive evaluation
      const extractedSlots = await page.evaluate(() => {
        const results: Array<{data: string, ora: string}> = [];
        const timeRegex = /(\d{1,2}):(\d{2})/g;
        
        // Look for clickable time elements (buttons, links, divs with onclick)
        const clickableElements = document.querySelectorAll('button, a, [onclick], .btn, .time, .hour, .slot');
        
        clickableElements.forEach(el => {
          const text = el.textContent?.trim() || '';
          const match = text.match(timeRegex);
          
          if (match) {
            // Try to find associated date
            let dateStr = '';
            
            // Check element attributes
            const dataDate = el.getAttribute('data-date') || el.getAttribute('data-day');
            if (dataDate) {
              dateStr = dataDate;
            } else {
              // Look for date in parent elements
              let parent = el.parentElement;
              for (let i = 0; i < 5 && parent; i++) {
                const parentText = parent.textContent || '';
                const dateMatch = parentText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                  dateStr = dateMatch[0];
                  break;
                }
                parent = parent.parentElement;
              }
            }
            
            results.push({
              data: dateStr || new Date().toLocaleDateString('ro-RO'),
              ora: match[0]
            });
          }
        });
        
        return results;
      });
      
      this.logger.log(`Extracted ${extractedSlots.length} slots using Method 1`);
      slots.push(...extractedSlots);
      
      // Method 2: If no slots found, try a broader text extraction
      if (slots.length === 0) {
        this.logger.log('Method 1 found no slots, trying Method 2: broader text extraction');
        
        const textBasedSlots = await page.evaluate(() => {
          const results: Array<{data: string, ora: string}> = [];
          const timeRegex = /\b(\d{1,2}):(\d{2})\b/g;
          const bodyText = document.body.innerText;
          
          const matches = [...bodyText.matchAll(timeRegex)];
          
          matches.forEach(match => {
            // Filter out obvious non-time matches (like years, etc.)
            const hour = parseInt(match[1]);
            const minute = parseInt(match[2]);
            
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
              results.push({
                data: new Date().toLocaleDateString('ro-RO'),
                ora: `${match[1].padStart(2, '0')}:${match[2]}`
              });
            }
          });
          
          return results;
        });
        
        this.logger.log(`Extracted ${textBasedSlots.length} potential time slots using Method 2`);
        slots.push(...textBasedSlots);
      }
      
      // Remove duplicates
      const uniqueSlots = slots.filter((slot, index, self) =>
        index === self.findIndex(s => s.data === slot.data && s.ora === slot.ora)
      );
      
      return uniqueSlots.slice(0, 50); // Limit to 50 slots to avoid overwhelming responses
      
    } catch (error) {
      this.logger.error(`Error extracting time slots: ${error.message}`, error.stack);
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
