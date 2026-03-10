import asyncio
import traceback
from playwright.async_api import async_playwright
from flask import Flask, request, jsonify

app = Flask(__name__)

async def run_automation(data):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        page = await browser.new_page()
        
        await page.goto("https://www.gralmedical.ro/Programari-online", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # ===== PASUL 1: Selectii =====
        
        # Selecteaza Oras
        await page.locator("select").nth(0).select_option(label=data.get("oras"))
        await page.wait_for_timeout(1500)

        # Selecteaza Centru Gral Medical
        await page.locator("select").nth(1).select_option(label=data.get("centru"))
        await page.wait_for_timeout(1500)

        # Selecteaza Specialitate
        await page.locator("select").nth(2).select_option(label=data.get("specialitate"))
        await page.wait_for_timeout(1500)

        # Selecteaza Medic (optional)
        if data.get("medic"):
            await page.locator("select").nth(3).select_option(label=data.get("medic"))
            await page.wait_for_timeout(1000)

        # Bifeaza "Primul loc disponibil"
        primul_loc = page.locator("input[type='checkbox']").nth(0)
        if not await primul_loc.is_checked():
            await primul_loc.check()
        await page.wait_for_timeout(500)

        # Apasa Continua
        await page.locator("button:has-text('Continuă')").click()
        await page.wait_for_timeout(4000)

        # ===== PASUL 2: Date Personale =====

        # Nume si Prenume
        await page.locator("input[type='text']").nth(0).fill(data.get("nume", ""))
        await page.wait_for_timeout(500)

        # Data Nasterii - An
        await page.locator("select").nth(0).select_option(label=data.get("an_nastere", ""))
        await page.wait_for_timeout(500)

        # Data Nasterii - Luna
        await page.locator("select").nth(1).select_option(label=data.get("luna_nastere", ""))
        await page.wait_for_timeout(500)

        # Data Nasterii - Zi
        await page.locator("select").nth(2).select_option(label=data.get("zi_nastere", ""))
        await page.wait_for_timeout(500)

        # Telefon
        await page.locator("input[type='text']").nth(1).fill(data.get("telefon", ""))
        await page.wait_for_timeout(500)

        # Email
        await page.locator("input[type='text']").nth(2).fill(data.get("email", ""))
        await page.wait_for_timeout(500)

        # Informatii suplimentare
        await page.locator("textarea").nth(0).fill(data.get("informatii", "Programare prin asistent vocal Gral Medical"))
        await page.wait_for_timeout(500)

        # Bifeaza Termeni si Conditii
        termeni = page.locator("input[type='checkbox']").nth(0)
        if not await termeni.is_checked():
            await termeni.check()
        await page.wait_for_timeout(500)

        # Apasa Finalizeaza programarea
        await page.locator("button:has-text('Finalizează programarea')").click()
        await page.wait_for_timeout(5000)

        await browser.close()
        return "Programare trimisa cu succes"

@app.route("/book", methods=["POST"])
def book():
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "Nu am primit date"}), 400
        
        result = asyncio.run(run_automation(data))
        return jsonify({"status": "success", "message": result}), 200
    
    except Exception as e:
        print("ERROR /book:", str(e))
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Gral Bot este activ"}), 200
