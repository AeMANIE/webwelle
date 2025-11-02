import { NextResponse } from 'next/server';
import { getRedisClient, isRedisEnabled } from '@/lib/redis';

export async function GET() {
  try {
    const client = getRedisClient();
    
    if (!client) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Redis Client nicht initialisiert',
        fallback: 'In-Memory Store wird verwendet'
      }, { status: 503 });
    }
    
    // Warte auf Verbindung (max. 5 Sekunden)
    if (client.status === 'connecting' || client.status === 'ready') {
      // Versuche Ping (wenn ready, sollte sofort funktionieren)
      try {
        await Promise.race([
          client.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
      } catch (error) {
        // Wenn nicht verbunden, versuche connect
        if (client.status !== 'ready') {
          try {
            await Promise.race([
              client.connect(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
          } catch (connectError) {
            return NextResponse.json({ 
              status: 'warning', 
              message: 'Redis Verbindung konnte nicht hergestellt werden',
              error: connectError instanceof Error ? connectError.message : String(connectError),
              fallback: 'In-Memory Store wird verwendet',
              clientStatus: client.status
            }, { status: 200 });
          }
        }
      }
    }
    
    const enabled = isRedisEnabled();
    
    if (!enabled || client.status !== 'ready') {
      return NextResponse.json({ 
        status: 'warning', 
        message: 'Redis nicht aktiviert oder nicht verbunden',
        fallback: 'In-Memory Store wird verwendet',
        clientStatus: client.status
      }, { status: 200 });
    }
    
    // Test: Ping Redis
    const pingResult = await client.ping();
    
    // Test: Set/Get Operation
    const testKey = 'webwelle:test:connection';
    const testValue = `Test-${Date.now()}`;
    
    await client.setex(testKey, 60, testValue); // 60 Sekunden TTL
    const retrievedValue = await client.get(testKey);
    
    // Test: Rate Limit Key (simuliert)
    const rateLimitKey = 'rate_limit:test-ip';
    await client.setex(rateLimitKey, 60, JSON.stringify({ count: 1, resetTime: Date.now() + 60000 }));
    const rateLimitData = await client.get(rateLimitKey);
    
    // Test: TAN Key (simuliert)
    const tanKey = 'tan:test@example.com';
    const tanData = { tan: '123456', expiresAt: Date.now() + 600000 };
    await client.setex(tanKey, 600, JSON.stringify(tanData));
    const retrievedTan = await client.get(tanKey);
    
    // Cleanup Test Keys
    await client.del(testKey);
    
    return NextResponse.json({ 
      status: 'success',
      message: '✅ Redis funktioniert korrekt!',
      tests: {
        ping: pingResult === 'PONG' ? '✅ Erfolg' : '❌ Fehler',
        setGet: retrievedValue === testValue ? '✅ Erfolg' : '❌ Fehler',
        rateLimit: rateLimitData ? '✅ Erfolg' : '❌ Fehler',
        tanStore: retrievedTan ? '✅ Erfolg' : '❌ Fehler'
      },
      clientStatus: client.status,
      details: {
        retrievedValue,
        rateLimitParsed: rateLimitData ? JSON.parse(rateLimitData) : null,
        tanParsed: retrievedTan ? JSON.parse(retrievedTan) : null
      }
    });
    
  } catch (error) {
    console.error('Redis Test Fehler:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis Test fehlgeschlagen',
      error: error instanceof Error ? error.message : String(error),
      fallback: 'In-Memory Store wird verwendet'
    }, { status: 500 });
  }
}

