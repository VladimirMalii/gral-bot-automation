import traceback
import logging
import os
import re
from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gral-bot")

def normalize_text(text):
    """Elimina diacriticele si spatiile extra pentru comparatie robusta."""
    if not text: return ""
    import unicodedata
    text = str(text)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return text.lower().strip()

def select_robust_option(page, dropdown_index, target_text):
    """Selecteaza o optiune in Select2 folosind logica de potrivire text flexibila."""
    logger.info(f"[STEP] Incerc selectie pentru: {target_text} (index {dropdown_index})")
    
    # 1. Click pe dropdown-ul vizibil
    dropdowns = page.locator("span.select2-selection--single")
    if dropdowns.count() <= dropdown_index:
        raise Exception(f"Nu am gasit dropdown-ul cu indexul {dropdown_index}")
    
    dropdowns.nth(dropdown_index).click()
    page.wait_for_timeout(500) # Asteptam sa se deschida lista animata

    # 2. Cautam optiunea in lista generata (care apare de obicei la finalul <body>)
    options = page.locator("li.select2-results__option")
    page.wait_for_selector("li.select2-results__option", timeout=5000)
    
    all_options_texts = options.all_inner_texts()
    target_norm = normalize_text(target_text)
    
    found = False
    for i, opt_text in enumerate(all_options_texts):
        if target_norm in normalize_text(opt_text):
            logger.info(f"[DEBUG] Am gasit potrivire: '{opt_text}' pentru '{target_text}'")
            options.nth(i).click()
            found = True
            break
    
    if not found:
        # Fallback: apasam tasta Escape sa inchidem dropdown-ul daca nu am gasit nimic
        page.keyboard.press("Escape")
        raise Exception(f"Optiunea '{target_text}' nu a fost gasita in lista: {all_options_texts[:5]}...")

def run_automation(data):
    with sync_playwright() as p:
        logger.info("[DEBUG] Lansare Chromium...")
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = browser.new_context(viewport={'width': 1280, 'height': 1000})
        page = context.new_page()

        try:
            logger.info("[DEBUG] Navigare la Gral...")
            page.goto("https://www.gralmedical.ro/Programari-online", wait_until="networkidle", timeout=60000)

            # Inchide Cookies
            try:
                page.locator("button:has-text('Accept'), button:has-text('Sunt de acord')").first.click(timeout=3000)
            except: pass

            # PAS 1: Selectii principale
            # Oras (index 0), Centru (index 1), Specialitate (index 2)
            select_robust_option(page, 0, data.get("oras", "Bucuresti"))
            page.wait_for_timeout(800)
            
            select_robust_option(page, 1, data.get("centru"))
            page.wait_for_timeout(800)
            
            select_robust_option(page, 2, data.get("specialitate"))
            page.wait_for_timeout(800)

            # Bifeaza "Primul loc disponibil"
            try:
                page.locator("input[type='checkbox']").first.check(timeout=2000)
            except: pass

            # Click Continua
            page.locator("button:has-text('Continuă'), button:has-text('Continua')").first.click()
            
            # PAS 2: Date Personale
            logger.info("[DEBUG] Asteptare formular date personale...")
            page.wait_for_selector("input[name*='nume'], input[type='text']", timeout=15000)

            # Completare Nume
            page.locator("input[type='text']").nth(0).fill(data.get("nume", "Pacient Test"))

            # Data Nasterii (An, Luna, Zi) - Gral foloseste select-uri native aici de obicei
            try:
                page.locator("select").nth(0).select_option(label=str(data.get("an_nastere", "1990")))
                page.locator("select").nth(1).select_option(label=data.get("luna_nastere", "Ianuarie"))
                page.locator("select").nth(2).select_option(label=str(data.get("zi_nastere", "1")))
            except Exception as e:
                logger.warning(f"[WARN] Eroare la data nasterii: {e}")

            # Telefon si Email
            inputs = page.locator("input[type='text'], input[type='tel'], input[type='email']")
            # Cautam dupa placeholder sau ordine
            page.get_by_placeholder(re.compile("telefon", re.I)).fill(data.get("telefon", "0722000000"))
            page.get_by_placeholder(re.compile("email", re.I)).fill(data.get("email", "test@test.ro"))

            # Mesaj/Informatii
            try:
                page.locator("textarea").first.fill(data.get("informatii", "Programare prin asistent vocal AI"))
            except: pass

            # Bifeaza Termeni si Conditii (ultimul checkbox)
            page.locator("input[type='checkbox']").last.check()

            # FINALIZARE
            logger.info("[DEBUG] Click Finalizeaza...")
            page.locator("button:has-text('Finalizează'), button:has-text('Finalizeaza')").first.click()
            
            # Asteptam sa vedem mesajul de succes
            page.wait_for_timeout(5000)
            page.screenshot(path="result.png")
            
            return "Cerere trimisa cu succes la Gral Medical"

        except Exception as e:
            logger.error(f"[ERROR] A esuat la pasul: {str(e)}")
            page.screenshot(path="error.png")
            raise e
        finally:
            browser.close()

@app.route("/book", methods=["POST"])
def book():
    try:
        data = request.json or {}
        logger.info(f"--- START AUTOMATIZARE PENTRU: {data.get('nume')} ---")
        result = run_automation(data)
        return jsonify({"status": "success", "message": result}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
