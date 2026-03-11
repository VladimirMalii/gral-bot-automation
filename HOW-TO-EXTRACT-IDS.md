# 🔍 How to Extract Gralmed IDs

## Quick Reference - Known IDs

### Cities
- București: `1`
- Constanța: `5`
- **Craiova: `6`**
- Ploiești: `9`
- Pitești: `13`
- Bacău: `15`
- Râmnicu Vâlcea: `21`
- Focșani: `27`
- Slatina: `31`

### Craiova - OncoFort Clinic (ID: 21)
- CARDIOLOGIE: `3`
- **CHIRURGIE GENERALA: `25`**
- ENDOCRINOLOGIE: `6`
- MEDICINA INTERNA: `13`
- OBSTETRICA-GINECOLOGIE: `29`
- ONCOLOGIE MEDICALA: `18`
- PEDIATRIE: `19`
- UROLOGIE: `33`

### Dr. Barbu Laurentiu (ID: 142388) - Services
- Consult - Medic primar 250 RON: `CC002`
- Consultatie de control - chirurgie 250 RON: `CC6221`
- Biopsie mamara cu ghidaj ecografic 600 RON: `BP1946`
- Excizie lipom 600 RON: `0000041a-0050`
- Incizie furuncul 550 RON: `00000421-0073`
- Interpretare rezultat punctie 200 RON: `CC5822`
- Pansament 100 RON: `00000f1c-00c8`

### București - Clinica de Diagnostic Gral (ID: 7)
- **BOLI INFECTIOASE: `2`**
- CARDIOLOGIE: `3`
- CHIRURGIE GENERALA: `25`
- ENDOCRINOLOGIE: `6`
- MEDICINA INTERNA: `13`
- OBSTETRICA-GINECOLOGIE: `29`
- ONCOLOGIE MEDICALA: `18`

### Dr. Stangaciu Andrei (ID: 144487) - Services
- Consult - Medic specialist 335 RON: `CC001`

---

## Extract IDs for Any City/Clinic/Specialty

### 1. Extract all cities and general info
```bash
cd nodejs_space
node extract-ids-fast.js
```

### 2. Extract for specific city
```bash
node extract-ids-interactive.js --city="Bucuresti"
```

### 3. Extract for city + clinic
```bash
node extract-ids-interactive.js --city="Bucuresti" --clinic="Stefan"
```

### 4. Extract everything (city + clinic + specialty)
```bash
node extract-ids-interactive.js --city="Bucuresti" --clinic="Stefan" --spec="CARDIOLOGIE"
```

---

## Examples

### Constanța - Gral Constanța - Pediatrie
```bash
node extract-ids-interactive.js --city="Constanta" --clinic="Constanta" --spec="PEDIATRIE"
```

### Pitești - OncoFort - Oncologie
```bash
node extract-ids-interactive.js --city="Pitesti" --clinic="OncoFort" --spec="ONCOLOGIE"
```

---

## Use the IDs in API

Once you have the IDs, use them with the fast endpoint:

```bash
curl -X POST https://gral-bot-automation.onrender.com/check-availability-fast \
  -H "Content-Type: application/json" \
  -d '{
    "city_id": "6",
    "location_id": "21",
    "specialization_id": "25",
    "service_id": "CC002",
    "doctor_id": "142388",
    "date": "15.04.2026"
  }'
```

Response time: **~1 second** ⚡

---

## API Endpoints

- **Health Check:** `GET /health`
- **Fast Availability:** `POST /check-availability-fast` (0.5-2s)
- **Standard Availability:** `POST /check-availability` (40-60s, Puppeteer fallback)
- **Swagger Docs:** `GET /api-docs`
EOF
# 🔍 How to Extract Gralmed IDs

## Quick Reference - Known IDs

### Cities
- București: `1`
- Constanța: `5`
- **Craiova: `6`**
- Ploiești: `9`
- Pitești: `13`
- Bacău: `15`
- Râmnicu Vâlcea: `21`
- Focșani: `27`
- Slatina: `31`

### Craiova - OncoFort Clinic (ID: 21)
- CARDIOLOGIE: `3`
- **CHIRURGIE GENERALA: `25`**
- ENDOCRINOLOGIE: `6`
- MEDICINA INTERNA: `13`
- OBSTETRICA-GINECOLOGIE: `29`
- ONCOLOGIE MEDICALA: `18`
- PEDIATRIE: `19`
- UROLOGIE: `33`

### Dr. Barbu Laurentiu (ID: 142388) - Services
- Consult - Medic primar 250 RON: `CC002`
- Consultatie de control - chirurgie 250 RON: `CC6221`
- Biopsie mamara cu ghidaj ecografic 600 RON: `BP1946`
- Excizie lipom 600 RON: `0000041a-0050`
- Incizie furuncul 550 RON: `00000421-0073`
- Interpretare rezultat punctie 200 RON: `CC5822`
- Pansament 100 RON: `00000f1c-00c8`

---

## Extract IDs for Any City/Clinic/Specialty

### 1. Extract all cities and general info
```bash
cd /home/ubuntu/gralmed_automation_api/nodejs_space
node extract-ids-fast.js
```

### 2. Extract for specific city
```bash
node extract-ids-interactive.js --city="Bucuresti"
```

### 3. Extract for city + clinic
```bash
node extract-ids-interactive.js --city="Bucuresti" --clinic="Stefan"
```

### 4. Extract everything (city + clinic + specialty)
```bash
node extract-ids-interactive.js --city="Bucuresti" --clinic="Stefan" --spec="CARDIOLOGIE"
```

---

## Examples

### Constanța - Gral Constanța - Pediatrie
```bash
node extract-ids-interactive.js --city="Constanta" --clinic="Constanta" --spec="PEDIATRIE"
```

### Pitești - OncoFort - Oncologie
```bash
node extract-ids-interactive.js --city="Pitesti" --clinic="OncoFort" --spec="ONCOLOGIE"
```

---

## Use the IDs in API

Once you have the IDs, use them with the fast endpoint:

```bash
curl -X POST https://gral-bot-automation.onrender.com/check-availability-fast \
  -H "Content-Type: application/json" \
  -d '{
    "city_id": "6",
    "location_id": "21",
    "specialization_id": "25",
    "service_id": "CC002",
    "doctor_id": "142388",
    "date": "15.04.2026"
  }'
```

Response time: **~1 second** ⚡
