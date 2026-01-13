# Supabase Debugging Guide

## What to Check in Supabase Dashboard

### 1. Connection String (Most Important)

**Location:** Settings → Database → Connection String

**What to copy:**
- Make sure "Use connection pooling" is checked
- Select "Transaction mode" 
- Copy the full connection string

**Should look like:**
```
postgresql://postgres.pphgyszfvzlsjoaukqsn:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Verify:**
- Port is `6543` (not 5432)
- Host contains `.pooler.supabase.com`
- Username format is `postgres.[PROJECT_REF]`

### 2. Connection Pooling Settings

**Location:** Settings → Database → Connection Pooling

**What to check:**
- **Pool Size:** Should show available connections (free tier: 15)
- **Max Client Connections:** Free tier: 200
- **Current Connections:** Check if it's at the limit

**If at limit:**
- Wait for connections to close
- Circuit breaker will reset automatically after a few minutes

### 3. Network Restrictions

**Location:** Settings → Database → Network Restrictions

**What to check:**
- Should say: "Your database can be accessed by all IP addresses"
- If there are restrictions, Vercel IPs might be blocked

**If restricted:**
- Click "Add restriction" 
- Or remove restrictions to allow all IPs

### 4. Database Password

**Location:** Settings → Database → Database Password

**What to check:**
- Make sure the password matches what's in your connection string
- If unsure, click "Reset database password" and update Vercel

### 5. SSL Configuration

**Location:** Settings → Database → SSL Configuration

**What to check:**
- "Enforce SSL on incoming connections" - can be ON or OFF
- If ON, make sure connection string has `sslmode=require` (our code adds this automatically)

### 6. Connection Pooler Status

**Location:** Settings → Database → Connection Pooling (or Database → Overview)

**What to look for:**
- Active connections count
- Connection errors
- Pool utilization

**If circuit breaker is open:**
- Wait 5-10 minutes
- Check connection count - should decrease over time
- Circuit breaker resets automatically

## What to Copy/Share

If you want help debugging, copy and share:

1. **Connection String** (with password redacted):
   ```
   postgresql://postgres.pphgyszfvzlsjoaukqsn:***@aws-1-us-east-1.pooler.supabase.com:6543/postgres
   ```

2. **Connection Pooling Settings:**
   - Pool Size: ?
   - Max Client Connections: ?
   - Current Active Connections: ?

3. **Network Restrictions:**
   - Are there any IP restrictions? (Yes/No)

4. **Any error messages** from Supabase dashboard

## Quick Fixes

### If Circuit Breaker is Open:
1. Wait 5-10 minutes
2. Check connection count in dashboard
3. Try again after connections close

### If Connection Limit Reached:
1. Check for hanging connections
2. Wait for connections to timeout
3. Consider upgrading Supabase plan

### If Network Issues:
1. Remove IP restrictions
2. Verify connection string uses pooler (port 6543)
3. Check SSL settings match

## Current Configuration

Your connection string should be:
```
postgresql://postgres.pphgyszfvzlsjoaukqsn:RnFU9vnn2dPpQNWb@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

And our code automatically adds:
- `?pgbouncer=true` (disables prepared statements)
- `&sslmode=require` (secure connection)
- `&connection_limit=1` (prevents pool exhaustion)
- `&connect_timeout=10` (connection timeout)
- `&pool_timeout=10` (pool timeout)

So the final connection string used is:
```
postgresql://postgres.pphgyszfvzlsjoaukqsn:RnFU9vnn2dPpQNWb@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1&connect_timeout=10&pool_timeout=10
```
