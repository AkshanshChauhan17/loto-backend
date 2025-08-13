# Lotto Games 888 – Express + MySQL API

## Quick Start
```bash
cp .env.example .env
# edit DB_... values
npm install
# Import schema
# mysql -u<user> -p -h <host> < lotto_db < sql/schema.sql
npm run start
```

### Default endpoints
- GET /health
- POST /api/auth/login
- POST /api/auth/register
- ... see /routes/*

> NOTE: Many advanced functions (prize calculation, draw ingestion, bonus/partial matches, PDF/Telegram export) are scaffolded as stubs. Fill them per business rules.
