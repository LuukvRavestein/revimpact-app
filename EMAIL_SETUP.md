# Email Setup voor RevImpact

## Environment Variabelen

Voeg de volgende environment variabelen toe aan je `.env.local` bestand:

```bash
# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here

# Email Configuration (optioneel)
RESEND_FROM_EMAIL=RevImpact <noreply@revimpact.nl>
SUPPORT_EMAIL=support@revimpact.nl
```

## Resend Setup

1. **Ga naar [Resend.com](https://resend.com)** en maak een account aan
2. **Verifieer je domein** `revimpact.nl` in Resend
3. **Genereer een API key** in je dashboard
4. **Voeg de API key toe** aan je environment variabelen

## Email Adressen

### Standaard Email Adressen:
- **From:** `noreply@revimpact.nl` (uitnodigingen)
- **Support:** `support@revimpact.nl` (klantenservice)

### Aangepaste Email Adressen:
Je kunt de email adressen aanpassen via environment variabelen:
- `RESEND_FROM_EMAIL` - Email adres voor uitnodigingen
- `SUPPORT_EMAIL` - Support email adres

## Email Template

De uitnodiging emails bevatten:
- **RevImpact branding** met gradient header
- **Persoonlijke begroeting** met naam
- **Workspace informatie** (naam, rol)
- **Call-to-action knop** voor uitnodiging accepteren
- **Vervaldatum** informatie (7 dagen)
- **Contact informatie** en footer
- **Responsive design** voor alle apparaten

## Testen

1. **Stel environment variabelen in**
2. **Verifieer domein** in Resend
3. **Test uitnodiging** via workspace beheer
4. **Controleer** of email wordt ontvangen

## Troubleshooting

### Email wordt niet verstuurd:
- Controleer of `RESEND_API_KEY` correct is ingesteld
- Verificeer of domein `revimpact.nl` is geverifieerd in Resend
- Controleer Resend dashboard voor error logs

### Email komt in spam:
- Verificeer SPF, DKIM en DMARC records voor `revimpact.nl`
- Gebruik een geverifieerd domein in Resend
- Voeg `revimpact.nl` toe aan whitelist
