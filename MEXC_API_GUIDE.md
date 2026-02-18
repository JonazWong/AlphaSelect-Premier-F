# MEXC API Setup Guide

## Overview

This guide will help you set up MEXC API credentials for the AlphaSelect Premier F platform.

## Getting MEXC API Credentials

### 1. Create MEXC Account

1. Visit [MEXC Exchange](https://www.mexc.com/)
2. Sign up for an account
3. Complete KYC verification (if required)

### 2. Generate API Keys

1. Log in to your MEXC account
2. Go to **Account** → **API Management**
3. Click **Create API**
4. Set API permissions:
   - ✅ Enable **Read** permissions (required)
   - ❌ Disable **Trade** permissions (not needed for this platform)
   - ❌ Disable **Withdraw** permissions (not needed)
5. Complete 2FA verification
6. Save your **API Key** and **Secret Key** securely

## Configuration

### For Docker Setup

1. Edit `backend/.env`:
```env
MEXC_API_KEY=your-api-key-here
MEXC_SECRET_KEY=your-secret-key-here
```

2. Restart Docker containers:
```bash
docker-compose restart
```

### For Manual Setup

1. Edit `backend/.env`:
```env
MEXC_API_KEY=your-api-key-here
MEXC_SECRET_KEY=your-secret-key-here
```

2. Restart the backend server

## API Endpoints Used

The platform uses the following MEXC Contract API endpoints:

### Market Data (No Authentication Required)
- `GET /api/v1/contract/ticker` - Get contract ticker data
- `GET /api/v1/contract/kline/{symbol}` - Get K-line data
- `GET /api/v1/contract/depth/{symbol}` - Get order book depth
- `GET /api/v1/contract/funding_rate/{symbol}` - Get funding rate
- `GET /api/v1/contract/open_interest/{symbol}` - Get open interest
- `GET /api/v1/contract/index_price/{symbol}` - Get index price
- `GET /api/v1/contract/fair_price/{symbol}` - Get fair/mark price

## Rate Limits

MEXC has the following rate limits:
- **100 requests per 10 seconds** for market data endpoints

The platform implements:
- **Rate Limiter**: Automatically manages request rates
- **Circuit Breaker**: Protects against API failures

## Testing Your Setup

### Using the API

1. Start the backend server
2. Visit http://localhost:8000/docs
3. Try the `/api/v1/contract/ticker/BTC_USDT` endpoint
4. You should receive market data for BTC_USDT

### Using the Frontend

1. Start the frontend
2. Visit http://localhost:3000/crypto-radar
3. Select a trading pair (e.g., BTC, ETH)
4. Market data should load automatically

## Troubleshooting

### Issue: "API Error" or "Rate Limit Exceeded"
**Solution**: 
- Check if your API keys are correct
- Ensure you're not making too many requests
- Wait 60 seconds for the circuit breaker to reset

### Issue: "Invalid API Key"
**Solution**:
- Verify your API key and secret in `.env`
- Ensure there are no extra spaces or quotes
- Regenerate API keys if needed

### Issue: "Permission Denied"
**Solution**:
- Check API permissions in MEXC dashboard
- Ensure **Read** permission is enabled
- Regenerate API keys with correct permissions

## Security Best Practices

1. **Never commit API keys to Git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables

2. **Use Read-Only API Keys**
   - Only enable Read permissions
   - Never enable Trade or Withdraw

3. **Rotate API Keys Regularly**
   - Change API keys every 3-6 months
   - Immediately rotate if compromised

4. **Use IP Whitelist (Optional)**
   - Add your server IP to MEXC API whitelist
   - Provides extra security layer

## API Documentation

For complete MEXC API documentation, visit:
- [MEXC Contract API Docs](https://mxcdevelop.github.io/apidocs/contract_v1_en/)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review MEXC API documentation
3. Open an issue on GitHub
