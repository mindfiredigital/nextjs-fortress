# API Routes Wrapper

## Overview

The API Routes wrapper (`withFortress`) provides route-level security validation for Next.js API Routes with custom configuration per endpoint.

## Why Use the Wrapper

While middleware protects all routes globally, the wrapper allows:

- **Custom rate limits** per endpoint
- **CSRF validation** for specific routes
- **Custom payload limits** per endpoint
- **Method restrictions** per route
- **Encoding validation toggle** per endpoint

## Implementation

```typescript
/**
 * Create a secure API route wrapper
 */
export function createWithFortress(config: FortressConfig) {
  const logger = new FortressLogger(config.logging);
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  );
  const injectionValidator = createInjectionValidator(config.modules.injection);
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null;
  const encodingValidator = createEncodingValidator(config.modules.encoding);

  return function withFortress(
    handler: (request: NextRequest) => Promise<Response>,
    options: SecureRouteOptions = {}
  ) {
    return async function securedHandler(
      request: NextRequest
    ): Promise<Response> {
      // 1. Check allowed methods
      if (options.allowedMethods) {
        if (!options.allowedMethods.includes(request.method)) {
          return new NextResponse('Method Not Allowed', { status: 405 });
        }
      }

      // 2. Rate limiting (if specified)
      if (options.rateLimit) {
        const rateLimitResult = checkRateLimit(request, options.rateLimit);
        if (!rateLimitResult.allowed) {
          return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
              'Retry-After': String(
                Math.ceil(rateLimitResult.retryAfter / 1000)
              ),
            },
          });
        }
      }

      // 3. Payload size check
      const contentLength = request.headers.get('content-length');
      const maxSize =
        options.maxPayloadSize || config.modules.content.maxPayloadSize;

      if (contentLength && parseInt(contentLength) > maxSize) {
        return new NextResponse('Payload Too Large', { status: 413 });
      }

      // 4. Encoding validation
      if (
        options.validateEncoding !== false &&
        config.modules.encoding.enabled
      ) {
        const contentType = request.headers.get('content-type');
        const body = await request.clone().arrayBuffer();

        const encodingResult = await encodingValidator.validate(
          contentType,
          body
        );
        if (!encodingResult.valid) {
          return new NextResponse('Bad Request: Invalid Encoding', {
            status: 400,
          });
        }
      }

      // 5. Parse and validate request body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const validationResult = await validateRequestBody(
          request,
          deserializationValidator,
          injectionValidator,
          config
        );

        if (!validationResult.valid) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }

      // 6. CSRF validation (if required)
      if (options.requireCSRF && csrfValidator) {
        const csrfToken =
          request.headers.get(csrfValidator.getHeaderName()) ||
          request.cookies.get(csrfValidator.getCookieName())?.value;

        const sessionId = request.cookies.get('session')?.value || 'default';

        const csrfResult = await csrfValidator.validate(
          csrfToken,
          sessionId,
          request.method
        );
        if (!csrfResult.valid) {
          return new NextResponse('Forbidden: Invalid CSRF Token', {
            status: 403,
          });
        }
      }

      // Execute the original handler
      return await handler(request);
    };
  };
}
```

## Basic Usage

### Setup

```typescript
// fortress.config.ts
import { FortressConfig } from '@mindfiredigital/nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: 'development',
  // ... your config
};

// lib/fortress.ts
import { createWithFortress } from '@mindfiredigital/nextjs-fortress';
import { fortressConfig } from '../fortress.config';

export const withFortress = createWithFortress(fortressConfig);
```

### Simple Protection

```typescript
// app/api/user/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(async (request) => {
  const data = await request.json();
  
  // Data already validated:
  // ✓ No prototype pollution
  // ✓ No SQL injection
  // ✓ No XSS
  // ✓ Valid encoding
  
  await updateUser(data);
  return Response.json({ success: true });
});
```

## Advanced Configuration

### Custom Rate Limit

```typescript
// app/api/auth/login/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const { username, password } = await request.json();
    const user = await authenticateUser(username, password);
    return Response.json({ success: true, user });
  },
  {
    rateLimit: {
      requests: 5,       // Only 5 attempts
      window: 300000,    // Per 5 minutes
    },
  }
);
```

### Method Restrictions

```typescript
// app/api/data/route.ts
import { withFortress } from '@/lib/fortress';

export const handler = withFortress(
  async (request) => {
    if (request.method === 'GET') {
      return Response.json(await getData());
    }
    
    if (request.method === 'POST') {
      const data = await request.json();
      return Response.json(await createData(data));
    }
  },
  {
    allowedMethods: ['GET', 'POST'], // Only these methods
  }
);

export { handler as GET, handler as POST };
```

### Custom Payload Size

```typescript
// app/api/upload/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const formData = await request.formData();
    const file = formData.get('file');
    return Response.json({ success: true });
  },
  {
    maxPayloadSize: 10 * 1024 * 1024, // 10MB for file uploads
  }
);
```

### CSRF Protection

```typescript
// app/api/account/delete/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const { userId } = await request.json();
    await deleteAccount(userId);
    return Response.json({ success: true });
  },
  {
    requireCSRF: true, // Require valid CSRF token
  }
);
```

### Disable Encoding Validation

```typescript
// app/api/webhook/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    // Handle webhook from third-party
    const data = await request.text();
    return Response.json({ received: true });
  },
  {
    validateEncoding: false, // Skip encoding check for webhooks
  }
);
```

### Combined Options

```typescript
// app/api/admin/users/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const data = await request.json();
    await createUser(data);
    return Response.json({ success: true });
  },
  {
    requireCSRF: true,
    allowedMethods: ['POST'],
    rateLimit: {
      requests: 10,
      window: 60000,
    },
    maxPayloadSize: 50 * 1024, // 50KB
  }
);
```

## Options Reference

```typescript
interface SecureRouteOptions {
  // Require CSRF token validation
  requireCSRF?: boolean;
  
  // Custom rate limit for this endpoint
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
  
  // Maximum payload size
  maxPayloadSize?: number;
  
  // Allowed HTTP methods
  allowedMethods?: string[];
  
  // Enable/disable encoding validation
  validateEncoding?: boolean;
}
```

## Real-World Examples

### E-Commerce Checkout

```typescript
// app/api/checkout/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const order = await request.json();
    
    // Validated data - safe to process
    const result = await processPayment(order);
    
    return Response.json(result);
  },
  {
    requireCSRF: true,           // Prevent CSRF
    maxPayloadSize: 100 * 1024,  // 100KB max
    rateLimit: {
      requests: 3,               // 3 checkouts
      window: 60000,             // per minute
    },
  }
);
```

### User Registration

```typescript
// app/api/auth/register/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const userData = await request.json();
    
    // Already validated:
    // - No prototype pollution
    // - No SQL injection in fields
    // - No XSS in inputs
    
    const user = await createUser(userData);
    return Response.json({ success: true, user });
  },
  {
    rateLimit: {
      requests: 5,      // 5 registrations
      window: 3600000,  // per hour
    },
    maxPayloadSize: 10 * 1024, // Small registration data
  }
);
```

### Admin API

```typescript
// app/api/admin/settings/route.ts
import { withFortress } from '@/lib/fortress';

export const POST = withFortress(
  async (request) => {
    const settings = await request.json();
    await updateSettings(settings);
    return Response.json({ success: true });
  },
  {
    requireCSRF: true,           // Critical - require CSRF
    allowedMethods: ['POST'],    // Only POST
    rateLimit: {
      requests: 20,
      window: 60000,
    },
  }
);
```

## Error Responses

### Method Not Allowed

```typescript
// Request: DELETE /api/user
// Response:
Status: 405 Method Not Allowed
```

### Rate Limit Exceeded

```typescript
// Response:
Status: 429 Too Many Requests
Retry-After: 45

// Headers indicate when to retry
```

### Payload Too Large

```typescript
// Response:
Status: 413 Payload Too Large
```

### Invalid Encoding

```typescript
// Response:
Status: 400 Bad Request
Body: "Bad Request: Invalid Encoding"
```

### Validation Failed

```typescript
// Response:
Status: 403 Forbidden
```

### CSRF Invalid

```typescript
// Response:
Status: 403 Forbidden
Body: "Forbidden: Invalid CSRF Token"
```

## Summary

**withFortress wrapper provides:**
- Route-level protection
- Custom rate limits
- CSRF validation
- Method restrictions
- Payload size limits
- Encoding validation

**How to use:**
```typescript
export const POST = withFortress(
  async (request) => {
    // Your handler
  },
  {
    requireCSRF: true,
    rateLimit: { requests: 10, window: 60000 },
  }
);
```

---

**Related Documentation:**
- [Server Actions Wrapper](./server-actions-wrapper.md)
- [Middleware Usage](./middleware.md)
- [Rate Limiting](../modules/rate-limit/overview.md)