import traceback
import logging
from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright

app = Flask(__name__)

# Configurare log-uri sa apara in Railway
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_automation(data):
    # Folosim varianta SYNC pentru stabilitate maxima
    with sync_playwright() as p:
        logger.info("[DEBUG] Pornesc browserul Chromium...")
        browser = p.chromium.launch(
            headless=True, 
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        try:
            logger.info("[DEBUG] Navighez la Gral Medical...")
            page.goto("https://www.gralmedical.ro/Programari-online", wait_until="networkidle", timeout=60000)
            
            # Inchide Cookies daca apar
            try:
                cookie_btn = page.locator("button:has-text('Accept'), button:has-text('Sunt de acord')")
                if cookie_btn.count() > 0:
                    cookie_btn.first.click(timeout=3000)
                    logger.info("[DEBUG] Cookies acceptate.")
            except: pass

            # Selectii Pas 1
            logger.info(f"[DEBUG] Selectez Oras: {data.get('oras')}")
            page.locator("select").nth(0).select_option(label=data.get("oras", "Bucuresti"))
            page.wait_for_timeout(1000)
            
            logger.info(f"[DEBUG] Selectez Centru: {data.get('centru')}")
            page.locator("select").nth(1).select_option(label=data.get("centru"))
            page.wait_for_timeout(1000)
            
            logger.info(f"[DEBUG] Selectez Specialitate: {data.get('specialitate')}")
            page.locator("select").nth(2).select_option(label=data.get("specialitate"))
            page.wait_for_timeout(1000)

            # Bifeaza Primul loc disponibil
            page.locator("input[type='checkbox']").first.check()
            
            logger.info("[DEBUG] Click pe Continua...")
            page.locator("button:has-text('Continuă')").click()
            
            # Asteapta Pasul 2
            page.wait_for_selector("input[type='text']", timeout=15000)

            # Completare Date Personale
            inputs = page.locator("input[type='text']")
            logger.info(f"[DEBUG] Completez Nume: {data.get('nume')}")
            inputs.nth(0).fill(data.get("nume", "Pacient AI"))
            
            # Data Nasterii
            page.locator("select").nth(0).select_option(label=str(data.get("an_nastere", "1990")))
            page.locator("select").nth(1).select_option(label=data.get("luna_nastere", "Ianuarie"))
            page.locator("select").nth(2).select_option(label=str(data.get("zi_nastere", "1")))

            logger.info(f"[DEBUG] Telefon: {data.get('telefon')}")
            inputs.nth(1).fill(data.get("telefon", "0722000000"))
            inputs.nth(2).fill(data.get("email", "test@test.ro"))
            
            page.locator("textarea").first.fill(data.get("informatii", "Programare automata prin asistent vocal."))

            # Bifeaza Termeni
            page.locator("input[type='checkbox']").last.check()
            
            logger.info("[DEBUG] Finalizez programarea...")
            page.locator("button:has-text('Finalizează programarea')").click()
            
            # Asteptam confirmarea vizuala (5 secunde)
            page.wait_for_timeout(5000)
            
            logger.info("[DEBUG] SUCCES: Programare trimisa.")
            return "Programare trimisa cu succes"

        except Exception as e:
            logger.error(f"[ERROR] Automatizarea a esuat: {str(e)}")
            raise e
        finally:
            browser.close()

@app.route("/book", methods=["POST"])
def book():
    try:
        data = request.json or {}
        logger.info(f"--- CERERE NOUA: {data.get('nume')} ---")
        result = run_automation(data)
        return jsonify({"status": "success", "message": result}), 200
    except Exception as e:
        # Printeaza eroarea completa in Deploy Logs
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/health")
def health():
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
