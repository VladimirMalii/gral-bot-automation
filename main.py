import asyncio
import traceback
from playwright.async_api import async_playwright
from flask import Flask, request, jsonify

app = Flask(__name__)

async def run_automation(data):
    async with async_playwright() as p:
        # Pornire browser cu setari de siguranta pentru server
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        
        try:
            # 1. Navigare
            await page.goto("https://www.gralmedical.ro/Programari-online", wait_until="networkidle", timeout=60000)
            
            # 2. Inchide Cookies (Daca apare)
            try:
                cookie_btn = page.locator("button:has-text('Accept'), button:has-text('Sunt de acord'), #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
                if await cookie_btn.count() > 0:
                    await cookie_btn.first.click(timeout=3000)
            except: pass

            # 3. Selectii Pas 1 (Oras, Centru, Specialitate)
            # Folosim selectoare mai precise
            await page.locator("select").nth(0).select_option(label=data.get("oras", "Bucuresti"))
            await page.wait_for_timeout(1000)
            
            await page.locator("select").nth(1).select_option(label=data.get("centru"))
            await page.wait_for_timeout(1000)
            
            await page.locator("select").nth(2).select_option(label=data.get("specialitate"))
            await page.wait_for_timeout(1000)

            # Bifeaza Primul loc disponibil
            await page.locator("input[type='checkbox']").first.check()
            
            # Click Continua
            await page.locator("button:has-text('Continuă')").click()
            
            # 4. Asteapta Pasul 2 (Date Personale)
            # Asteptam sa apara campul de Nume (primul input text)
            await page.wait_for_selector("input[type='text']", timeout=15000)

            # Completare Date
            inputs = page.locator("input[type='text']")
            await inputs.nth(0).fill(data.get("nume", "Test Automatizare"))
            
            # Data Nasterii
            await page.locator("select").nth(0).select_option(label=str(data.get("an_nastere", "1990")))
            await page.locator("select").nth(1).select_option(label=data.get("luna_nastere", "Ianuarie"))
            await page.locator("select").nth(2).select_option(label=str(data.get("zi_nastere", "1")))

            await inputs.nth(1).fill(data.get("telefon", "0722000000"))
            await inputs.nth(2).fill(data.get("email", "test@test.ro"))
            
            await page.locator("textarea").first.fill(data.get("informatii", "Programare AI"))

            # Bifeaza Termeni
            await page.locator("input[type='checkbox']").last.check()
            
            # FINALIZARE
            await page.locator("button:has-text('Finalizează programarea')").click()
            await page.wait_for_timeout(5000) # Asteptam sa se trimita cererea
            
            return "Programare trimisa cu succes"

        except Exception as e:
            print(f"Eroare in timpul automatizarii: {str(e)}")
            traceback.print_exc()
            raise e
        finally:
            await browser.close()

@app.route("/book", methods=["POST"])
def book():
    try:
        data = request.json
        # Rulam automatizarea
        result = asyncio.run(run_automation(data))
        return jsonify({"status": "success", "message": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/health")
def health():
    return "OK", 200
