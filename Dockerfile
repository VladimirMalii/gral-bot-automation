FROM mcr.microsoft.com/playwright/python:v1.50.0-jammy

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV PORT=8080
EXPOSE 8080

CMD ["gunicorn", "-b", "0.0.0.0:8080", "main:app", "--timeout", "180"]
