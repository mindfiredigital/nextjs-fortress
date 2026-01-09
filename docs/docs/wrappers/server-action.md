# Server Actions Wrapper

## Overview

The Server Actions wrapper (`secureServerAction`) protects Next.js Server Actions from prototype pollution, injection attacks, and validates all input arguments automatically.

## Why Use the Wrapper

Server Actions are particularly vulnerable because:
- Data comes directly from forms
- No URL-based routing protection
- Arguments passed directly to functions
- Easy to forget validation

The wrapper provides:
- **Automatic argument validation**
- **Input sanitization**
- **CSRF protection**
- **Prototype pollution prevention**
- **Injection detection**

## Implementation

```typescript
/**
 * Create a secure server action wrapper
 */
export function createSecureServerAction(config: FortressConfig) {
  const logger = new FortressLogger(config.logging);
  const deserializationValidator = createDeserializationValidator(
    config.modules.deserialization
  );
  const injectionValidator = createInjectionValidator(config.modules.injection);
  const csrfValidator = config.modules.csrf.enabled
    ? createCSRFValidator(config.modules.csrf)
    : null;

  return function secureServerAction<TArgs extends unknown[], TReturn>(
    action: (...args: TArgs) => Promise<TReturn>,
    options: SecureActionOptions = {}
  ) {
    return async function securedAction(...args: TArgs): Promise<TReturn> {
      // 1. Validate deserialization
      if (config.modules.deserialization.enabled) {
        for (const arg of args) {
          const result = deserializationValidator.validate(arg);
          if (!result.valid) {
            logger.warn(`Server action blocked: ${result.message}`);
            throw new SecurityError(
              result.message || 'Invalid input detected',
              result.rule || 'deserialization'
            );
          }
        }
      }

      // 2. Validate injection
      if (config.modules.injection.enabled) {
        for (const arg of args) {
          const result = injectionValidator.validate(arg);
          if (!result.valid) {
            logger.warn(
              `Injection attempt in server action: ${result.message}`
            );
            throw new SecurityError(
              result.message || 'Injection detected',
              result.rule || 'injection'
            );
          }
        }
      }

      // 3. CSRF validation (if required)
      if (options.requireCSRF && csrfValidator) {
        const csrfToken = extractCSRFToken(args);
        const sessionId = extractSessionId(args);

        const result = await csrfValidator.validate(
          csrfToken,
          sessionId,
          'POST'
        );
        if (!result.valid) {
          logger.warn(`CSRF validation failed: ${result.message}`);
          throw new SecurityError(
            result.message || 'CSRF validation failed',
            result.rule || 'csrf'
          );
        }
      }

      // 4. Sanitize inputs if requested
      let sanitizedArgs = args;
      if (options.sanitizeInputs) {
        sanitizedArgs = sanitizeInputs(args) as TArgs;
      }

      // Execute the original action with sanitized inputs
      return await action(...sanitizedArgs);
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
import { createSecureServerAction } from '@mindfiredigital/nextjs-fortress';
import { fortressConfig } from '../fortress.config';

export const secureServerAction = createSecureServerAction(fortressConfig);
```

### Simple Protection

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const updateProfile = secureServerAction(
  async (userId: string, profile: ProfileData) => {
    // All arguments validated:
    // ✓ No prototype pollution
    // ✓ No SQL injection
    // ✓ No XSS
    
    await db.profiles.update(userId, profile);
    return { success: true };
  }
);
```

## Advanced Configuration

### With Input Sanitization

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const createPost = secureServerAction(
  async (title: string, content: string) => {
    // Inputs sanitized:
    // - __proto__ removed
    // - constructor removed
    // - prototype removed
    
    const post = await db.posts.create({ title, content });
    return { success: true, post };
  },
  {
    sanitizeInputs: true, // Remove dangerous keys
  }
);
```

### With CSRF Protection

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const deleteAccount = secureServerAction(
  async (userId: string, metadata: ActionMetadata) => {
    // CSRF token validated from metadata._csrf
    await db.users.delete(userId);
    return { success: true };
  },
  {
    requireCSRF: true, // Validate CSRF token
  }
);

// Client usage:
interface ActionMetadata {
  _csrf: string;
  sessionId: string;
}

await deleteAccount(userId, {
  _csrf: getCsrfToken(),
  sessionId: getSessionId(),
});
```

### With Input Restrictions

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const updateSettings = secureServerAction(
  async (settings: Settings) => {
    await db.settings.update(settings);
    return { success: true };
  },
  {
    sanitizeInputs: true,
    allowedInputs: ['theme', 'language', 'notifications'], // Only these keys
  }
);
```

### With Depth Limiting

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const processComplexData = secureServerAction(
  async (data: ComplexData) => {
    const result = await processData(data);
    return { success: true, result };
  },
  {
    maxDepth: 5, // Limit nesting to 5 levels
    sanitizeInputs: true,
  }
);
```

## Options Reference

```typescript
interface SecureActionOptions {
  // Require CSRF token validation
  requireCSRF?: boolean;
  
  // Sanitize inputs (remove dangerous keys)
  sanitizeInputs?: boolean;
  
  // Maximum nesting depth
  maxDepth?: number;
  
  // Allowed input keys (whitelist)
  allowedInputs?: string[];
  
  // Rate limit key for this action
  rateLimitKey?: string;
}
```

## Real-World Examples

### Form Submission

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';
import { revalidatePath } from 'next/cache';

export const submitContactForm = secureServerAction(
  async (formData: ContactForm) => {
    // Validated: no injection, no prototype pollution
    await db.contacts.create(formData);
    await sendEmail(formData.email, 'Thank you');
    
    revalidatePath('/contact');
    return { success: true };
  },
  {
    sanitizeInputs: true, // Clean the input
  }
);

// Component usage:
// app/contact/page.tsx
'use client';

export default function ContactPage() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const result = await submitContactForm({
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    });
    
    if (result.success) {
      alert('Form submitted!');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### User Authentication

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const login = secureServerAction(
  async (username: string, password: string) => {
    // Validated: no SQL injection in username
    const user = await authenticateUser(username, password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    await createSession(user.id);
    return { success: true, user };
  },
  {
    sanitizeInputs: true,
  }
);
```

### Data Update

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const updateUser = secureServerAction(
  async (userId: string, updates: UserUpdates) => {
    // Dangerous keys removed automatically
    // No __proto__, constructor, prototype
    
    await db.users.update(userId, updates);
    return { success: true };
  },
  {
    sanitizeInputs: true,
    allowedInputs: ['name', 'email', 'bio'], // Only these fields
  }
);
```

### File Upload Processing

```typescript
// app/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const processUpload = secureServerAction(
  async (fileMetadata: FileMetadata) => {
    // Metadata validated for injection
    const result = await processFile(fileMetadata);
    return { success: true, result };
  },
  {
    sanitizeInputs: true,
    maxDepth: 3, // Shallow metadata only
  }
);
```

### Admin Operations

```typescript
// app/admin/actions.ts
'use server';

import { secureServerAction } from '@/lib/fortress';

export const promoteUser = secureServerAction(
  async (userId: string, role: string, metadata: ActionMetadata) => {
    // CSRF validated
    // Inputs sanitized
    
    await db.users.update(userId, { role });
    return { success: true };
  },
  {
    requireCSRF: true,
    sanitizeInputs: true,
  }
);
```

## Input Sanitization

The wrapper automatically removes dangerous keys:

```typescript
// Input:
{
  name: "John",
  email: "john@example.com",
  __proto__: { isAdmin: true },
  constructor: { prototype: { hacked: true } }
}

// After sanitization:
{
  name: "John",
  email: "john@example.com"
}
// __proto__ and constructor removed!
```

### Nested Sanitization

```typescript
// Input:
{
  user: {
    profile: {
      name: "John",
      __proto__: { admin: true }
    }
  }
}

// After sanitization:
{
  user: {
    profile: {
      name: "John"
    }
  }
}
// Dangerous keys removed at all levels
```

## Error Handling

### Validation Error

```typescript
// Client code:
try {
  await updateProfile(userId, {
    __proto__: { isAdmin: true }
  });
} catch (error) {
  if (error instanceof SecurityError) {
    console.error('Security validation failed:', error.message);
    // Error: "Dangerous key detected: __proto__"
  }
}
```

### Injection Detected

```typescript
try {
  await createPost(
    "Title",
    "Content with <script>alert(1)</script>"
  );
} catch (error) {
  // Error: "XSS injection detected: <script>"
}
```

### CSRF Validation Failed

```typescript
try {
  await deleteAccount(userId, {
    _csrf: 'invalid-token'
  });
} catch (error) {
  // Error: "CSRF validation failed"
}
```

## Client-Side Usage

### With Form

```typescript
// app/profile/page.tsx
'use client';

import { updateProfile } from '@/app/actions';

export default function ProfilePage() {
  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await updateProfile(
        userId,
        {
          name: formData.get('name'),
          bio: formData.get('bio'),
        }
      );
      
      if (result.success) {
        toast.success('Profile updated!');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };
  
  return <form action={handleSubmit}>...</form>;
}
```

### With State Management

```typescript
// app/posts/page.tsx
'use client';

import { useState } from 'react';
import { createPost } from '@/app/actions';

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async (title: string, content: string) => {
    setLoading(true);
    
    try {
      const result = await createPost(title, content);
      
      if (result.success) {
        router.push('/posts');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return <PostForm onSubmit={handleCreate} />;
}
```

## Summary

**secureServerAction wrapper provides:**
- Automatic argument validation
- Input sanitization
- CSRF protection
- Injection detection
- Prototype pollution prevention

**How to use:**
```typescript
export const action = secureServerAction(
  async (data: Data) => {
    // Your logic here
  },
  {
    sanitizeInputs: true,
    requireCSRF: false,
  }
);
```

---

**Related Documentation:**
- [API Routes Wrapper](./api-routes-wrapper.md)
- [Middleware Usage](./middleware.md)
- [CSRF Protection](../modules/csrf/overview.md)