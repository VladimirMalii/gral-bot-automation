import asyncio
from playwright.async_api import async_playwright
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

async def run_automation(data):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto("https://www.gralmedical.ro/Programari-online", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # ===== PASUL 1: Selectii =====
        
        # Selecteaza Oras
        await page.locator("select").nth(0).select_option(label=data.get("oras"))
        await page.wait_for_timeout(1000)

        # Selecteaza Centru Gral Medical
        await page.locator("select").nth(1).select_option(label=data.get("centru"))
        await page.wait_for_timeout(1000)

        # Selecteaza Specialitate
        await page.locator("select").nth(2).select_option(label=data.get("specialitate"))
        await page.wait_for_timeout(1000)

        # Selecteaza Medic (optional)
        if data.get("medic"):
            await page.locator("select").nth(3).select_option(label=data.get("medic"))
            await page.wait_for_timeout(1000)

        # Bifeaza "Primul loc disponibil"
        primul_loc = page.locator("input[type='checkbox']").nth(0)
        if not await primul_loc.is_checked():
            await primul_loc.check()

        # Apasa Continua
        await page.locator("button:has-text('Continuă')").click()
        await page.wait_for_timeout(3000)

        # ===== PASUL 2: Date Personale =====

        # Nume si Prenume
        await page.locator("input[type='text']").nth(0).fill(data.get("nume"))
        await page.wait_for_timeout(500)

        # Data Nasterii - An
        await page.locator("select").nth(0).select_option(label=data.get("an_nastere"))
        await page.wait_for_timeout(500)

        # Data Nasterii - Luna
        await page.locator("select").nth(1).select_option(label=data.get("luna_nastere"))
        await page.wait_for_timeout(500)

        # Data Nasterii - Zi
        await page.locator("select").nth(2).select_option(label=data.get("zi_nastere"))
        await page.wait_for_timeout(500)

        # Telefon
        await page.locator("input[type='text']").nth(1).fill(data.get("telefon"))
        await page.wait_for_timeout(500)

        # Email
        await page.locator("input[type='text']").nth(2).fill(data.get("email"))
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
        await page.wait_for_timeout(4000)

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
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Gral Bot este activ"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
