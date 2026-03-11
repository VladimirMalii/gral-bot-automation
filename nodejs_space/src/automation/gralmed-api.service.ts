import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as querystring from 'querystring';

@Injectable()
export class GralmedApiService {
  private readonly logger = new Logger(GralmedApiService.name);

  // Simple in-memory cache for ID mappings
  private cache = new Map<string, any>();

  /**
   * Call the internal Gralmed API directly to get available time slots
   * This is MUCH faster than using Puppeteer (0.5-2 seconds vs 40-60 seconds)
   */
  async getAvailableHours(params: {
    city_id: string;
    location_id: string;
    specialization_id: string;
    service_id: string;
    doctor_id: string;
    date: string; // Format: M/D/YYYY (e.g., "3/23/2026")
  }): Promise<string[]> {
    // Calculate ref_month from date (YYYY-MM-01 format)
    const dateParts = params.date.split('/'); // M/D/YYYY
    const month = dateParts[0].padStart(2, '0');
    const year = dateParts[2];
    const refMonth = `${year}-${month}-01`;

    const formData = {
      'form_data[city_id]': params.city_id,
      'form_data[location_id]': params.location_id,
      'form_data[specialization_id]': params.specialization_id,
      'form_data[service_id]': params.service_id,
      'form_data[doctor_id]': params.doctor_id,
      'form_data[date]': params.date,
      'form_data[ref_month]': refMonth,
      'form_data[cnas]': '0'
    };

    this.logger.log(`Calling Gralmed API with: ${JSON.stringify(formData)}`);

    return new Promise((resolve, reject) => {
      const postData = querystring.stringify(formData);

      const options = {
        hostname: 'www.gralmedical.ro',
        path: '/Programari-online/get-hours',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.gralmedical.ro/Programari-online'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const hours = JSON.parse(data);
            if (Array.isArray(hours)) {
              this.logger.log(`API returned ${hours.length} time slots`);
              resolve(hours);
            } else {
              this.logger.warn('API response is not an array');
              resolve([]);
            }
          } catch (error) {
            this.logger.error(`Failed to parse API response: ${error.message}`);
            reject(new Error('Invalid API response'));
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`API request failed: ${error.message}`);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Format date from DD.MM.YYYY to M/D/YYYY (Gralmed API format)
   */
  formatDateForApi(date: string): string {
    // If already in M/D/YYYY format, return as is
    if (date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return date;
    }

    // Convert from DD.MM.YYYY or DD/MM/YYYY
    const parts = date.split(/[\.\-\/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${parseInt(month)}/${parseInt(day)}/${year}`;
    }

    throw new Error(`Invalid date format: ${date}. Expected DD.MM.YYYY or M/D/YYYY`);
  }

  /**
   * Cache methods
   */
  getCachedId(key: string): any {
    return this.cache.get(key);
  }

  setCachedId(key: string, value: any): void {
    this.cache.set(key, value);
    this.logger.log(`Cached: ${key} => ${JSON.stringify(value)}`);
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }
}
