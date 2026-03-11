#!/usr/bin/env node

/**
 * Interactive ID Extractor for Gralmed
 * 
 * Usage:
 *   node extract-ids-interactive.js --city="Bucuresti" --clinic="Clinica Gral"
 *   node extract-ids-interactive.js --city="Craiova" --spec="CARDIOLOGIE"
 */

const puppeteer = require('puppeteer');
const args = process.argv.slice(2);

const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1].replace(/"/g, '') : null;
};

const cityFilter = getArg('city');
const clinicFilter = getArg('clinic');
const specFilter = getArg('spec');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('\n🔍 Gralmed ID Extractor');
  console.log('========================\n');

  if (cityFilter) console.log(`Filtering by city: ${cityFilter}`);
  if (clinicFilter) console.log(`Filtering by clinic: ${clinicFilter}`);
  if (specFilter) console.log(`Filtering by specialization: ${specFilter}`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto('https://www.gralmedical.ro/Programari-online', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.waitForSelector('select', { timeout: 10000 });

  // Select city if specified
  if (cityFilter) {
    const citySelected = await page.evaluate((filter) => {
      const select = document.querySelectorAll('select')[0];
      const option = Array.from(select.options).find(opt => 
        opt.textContent.toLowerCase().includes(filter.toLowerCase())
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return { name: option.textContent.trim(), id: option.value };
      }
      return null;
    }, cityFilter);
  
    if (citySelected) {
      console.log(`✅ Selected city: ${citySelected.name} (ID: ${citySelected.id})\n`);
      await sleep(2000);
    }
  }

  // Extract available clinics
  const clinics = await page.evaluate(() => {
    const select = document.querySelectorAll('select')[1];
    if (!select) return [];
    return Array.from(select.options)
      .filter(opt => opt.value && opt.value !== '0')
      .map(opt => ({
        name: opt.textContent.trim(),
        id: opt.value
      }));
  });

  console.log('🏥 AVAILABLE CLINICS:\n');
  clinics.forEach(clinic => {
    console.log(`   ${clinic.name} => ID: ${clinic.id}`);
  });

  // Select clinic if specified
  if (clinicFilter) {
    const clinicSelected = await page.evaluate((filter) => {
      const select = document.querySelectorAll('select')[1];
      const option = Array.from(select.options).find(opt => 
        opt.textContent.toLowerCase().includes(filter.toLowerCase())
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return { name: option.textContent.trim(), id: option.value };
      }
      return null;
    }, clinicFilter);
  
    if (clinicSelected) {
      console.log(`\n✅ Selected clinic: ${clinicSelected.name} (ID: ${clinicSelected.id})\n`);
      await sleep(2000);
    
      // Extract specializations
      const specs = await page.evaluate(() => {
        const select = document.querySelectorAll('select')[2];
        if (!select) return [];
        return Array.from(select.options)
          .filter(opt => opt.value && opt.value !== '0')
          .map(opt => ({
            name: opt.textContent.trim(),
            id: opt.value
          }));
      });
    
      console.log('👨‍⚕️  AVAILABLE SPECIALIZATIONS:\n');
      specs.forEach(spec => {
        console.log(`   ${spec.name} => ID: ${spec.id}`);
      });
    
      // Select specialization if specified
      if (specFilter) {
        const specSelected = await page.evaluate((filter) => {
          const select = document.querySelectorAll('select')[2];
          const option = Array.from(select.options).find(opt => 
            opt.textContent.toLowerCase().includes(filter.toLowerCase())
          );
          if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return { name: option.textContent.trim(), id: option.value };
          }
          return null;
        }, specFilter);
      
        if (specSelected) {
          console.log(`\n✅ Selected specialization: ${specSelected.name} (ID: ${specSelected.id})\n`);
          await sleep(2000);
        
          // Extract doctors
          const doctors = await page.evaluate(() => {
            const select = document.querySelectorAll('select')[3];
            if (!select) return [];
            return Array.from(select.options)
              .filter(opt => opt.value && opt.value !== '0')
              .map(opt => ({
                name: opt.textContent.trim(),
                id: opt.value
              }));
          });
        
          console.log('👨‍⚕️  AVAILABLE DOCTORS:\n');
          doctors.forEach(doc => {
            console.log(`   ${doc.name} => ID: ${doc.id}`);
          });
        
          if (doctors.length > 0) {
            await page.evaluate((docId) => {
              const select = document.querySelectorAll('select')[3];
              select.value = docId;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }, doctors[0].id);
            await sleep(2000);
          
            const services = await page.evaluate(() => {
              const select = document.querySelectorAll('select')[4];
              if (!select) return [];
              return Array.from(select.options)
                .filter(opt => opt.value && opt.value !== '0')
                .map(opt => ({
                  name: opt.textContent.trim(),
                  id: opt.value
                }));
            });
          
            console.log(`\n💼 SERVICES for ${doctors[0].name}:\n`);
            services.forEach(svc => {
              console.log(`   ${svc.name} => ID: ${svc.id}`);
            });
          }
        }
      }
    }
  }

  await browser.close();
  console.log('\n✅ Done!\n');
})();
