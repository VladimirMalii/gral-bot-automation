const puppeteer = require('puppeteer');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('🚀 Quick ID Extractor - Gralmed');
  console.log('================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('📍 Loading page...');
  await page.goto('https://www.gralmedical.ro/Programari-online', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.waitForSelector('select', { timeout: 10000 });

  // Extract ALL dropdowns at once
  const allDropdowns = await page.evaluate(() => {
    const extractOptions = (selectIndex) => {
      const select = document.querySelectorAll('select')[selectIndex];
      if (!select) return [];
      return Array.from(select.options)
        .filter(opt => opt.value && opt.value !== '0')
        .map(opt => ({
          name: opt.textContent.trim(),
          id: opt.value
        }));
    };
  
    return {
      cities: extractOptions(0),
      initialLocations: extractOptions(1),
      initialSpecializations: extractOptions(2),
      initialDoctors: extractOptions(3),
      initialServices: extractOptions(4)
    };
  });

  console.log('\n=== AVAILABLE OPTIONS ===\n');

  console.log('🏙️  CITIES:');
  allDropdowns.cities.forEach(city => {
    console.log(`   ${city.name} => ID: ${city.id}`);
  });

  console.log('\n🏥 LOCATIONS (initial view):');
  allDropdowns.initialLocations.forEach(loc => {
    console.log(`   ${loc.name} => ID: ${loc.id}`);
  });

  console.log('\n👨‍⚕️  SPECIALIZATIONS (initial view):');
  allDropdowns.initialSpecializations.forEach(spec => {
    console.log(`   ${spec.name} => ID: ${spec.id}`);
  });

  // Let's do a detailed extraction for a specific city (e.g., Craiova)
  console.log('\n\n=== DETAILED EXTRACTION FOR CRAIOVA ===\n');

  // Select Craiova
  await page.evaluate(() => {
    const select = document.querySelectorAll('select')[0];
    const option = Array.from(select.options).find(opt => 
      opt.textContent.toLowerCase().includes('craiova')
    );
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(2000);

  const craiovaData = await page.evaluate(() => {
    const extractOptions = (selectIndex) => {
      const select = document.querySelectorAll('select')[selectIndex];
      if (!select) return [];
      return Array.from(select.options)
        .filter(opt => opt.value && opt.value !== '0')
        .map(opt => ({
          name: opt.textContent.trim(),
          id: opt.value
        }));
    };
  
    return {
      locations: extractOptions(1),
      specializations: extractOptions(2)
    };
  });

  console.log('🏥 LOCATIONS in Craiova:');
  craiovaData.locations.forEach(loc => {
    console.log(`   ${loc.name} => ID: ${loc.id}`);
  });

  console.log('\n👨‍⚕️  SPECIALIZATIONS available:');
  craiovaData.specializations.forEach(spec => {
    console.log(`   ${spec.name} => ID: ${spec.id}`);
  });

  // Select OncoFort Craiova
  const oncofort = craiovaData.locations.find(l => l.name.toLowerCase().includes('oncofort'));
  if (oncofort) {
    console.log('\n\n=== DETAILED EXTRACTION FOR ONCOFORT CRAIOVA ===\n');
  
    await page.evaluate((locId) => {
      const select = document.querySelectorAll('select')[1];
      select.value = locId;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }, oncofort.id);
    await sleep(2000);
  
    const oncofortSpecs = await page.evaluate(() => {
      const select = document.querySelectorAll('select')[2];
      if (!select) return [];
      return Array.from(select.options)
        .filter(opt => opt.value && opt.value !== '0')
        .map(opt => ({
          name: opt.textContent.trim(),
          id: opt.value
        }));
    });
  
    console.log('👨‍⚕️  SPECIALIZATIONS at OncoFort Craiova:');
    oncofortSpecs.forEach(spec => {
      console.log(`   ${spec.name} => ID: ${spec.id}`);
    });
  
    // Select CHIRURGIE GENERALA
    const chirurgie = oncofortSpecs.find(s => s.name.toLowerCase().includes('chirurgie'));
    if (chirurgie) {
      console.log('\n\n=== DOCTORS & SERVICES FOR CHIRURGIE GENERALA ===\n');
    
      await page.evaluate((specId) => {
        const select = document.querySelectorAll('select')[2];
        select.value = specId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, chirurgie.id);
      await sleep(2000);
    
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
    
      console.log('👨‍⚕️  DOCTORS:');
      doctors.forEach(doc => {
        console.log(`   ${doc.name} => ID: ${doc.id}`);
      });
    
      // Get services for first doctor
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
      
        console.log(`\n💼 SERVICES for ${doctors[0].name}:`);
        services.forEach(svc => {
          console.log(`   ${svc.name} => ID: ${svc.id}`);
        });
      }
    }
  }

  // Save structured data
  const output = {
    extracted_at: new Date().toISOString(),
    all_cities: allDropdowns.cities,
    craiova: {
      city_id: '6',
      locations: craiovaData.locations,
      oncofort_craiova: oncofort ? {
        location_id: oncofort.id,
        specializations: oncofortSpecs
      } : null
    }
  };

  fs.writeFileSync('gralmed-ids.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Full data saved to gralmed-ids.json');

  await browser.close();
  console.log('\n🎉 Extraction complete!');
})();
