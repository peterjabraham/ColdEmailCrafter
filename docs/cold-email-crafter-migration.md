# ColdEmailCrafter Migration Guide

## Overview

Migrating from Replit to:
- **Frontend**: Cloudflare Pages (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Database**: Not needed (app is stateless)

**Estimated time**: 45-60 minutes

---

## Pre-Migration Checklist

- [ ] GitHub repo is public (or you have Railway/Cloudflare connected)
- [ ] You have your `OPENAI_API_KEY` ready
- [ ] Node.js 20+ installed locally (for testing)

---

## Phase 1: Clean Up Replit Files (5 mins)

### Delete These Files/Folders

```bash
# In your project root
rm -rf .replit
rm -rf replit.nix
rm -rf .upm
rm -rf .cache
rm -rf .config
rm -rf .local
rm -rf .breakpoints
rm -rf attached_assets  # Replit-specific folder
```

### Update .gitignore

Add these entries:

```gitignore
# Replit
.replit
replit.nix
.upm/
.cache/
.config/
.local/
.breakpoints
attached_assets/
```

---

## Phase 2: Update package.json (10 mins)

### Remove Replit-Specific Packages

```bash
npm uninstall @replit/vite-plugin-shadcn-theme-json @replit/vite-plugin-runtime-error-modal
```

### Remove Unused Packages

Your routes don't use the database or auth, so these can go:

```bash
npm uninstall drizzle-orm drizzle-zod drizzle-kit passport passport-local express-session memorystore ws
npm uninstall @types/passport @types/passport-local @types/express-session @types/ws
```

### Add Security Packages

```bash
npm install helmet cors express-rate-limit
npm install -D @types/cors
```

### Updated package.json

Replace your current package.json with:

```json
{
  "name": "cold-email-crafter",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@tanstack/react-query": "^5.60.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "cors": "^2.8.5",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "express": "^4.21.2",
    "express-rate-limit": "^7.4.1",
    "framer-motion": "^11.13.1",
    "helmet": "^8.0.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.453.0",
    "openai": "^4.77.3",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.4",
    "recharts": "^2.13.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.0",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.15",
    "@types/cors": "^2.8.17",
    "@types/express": "4.17.21",
    "@types/node": "20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "esbuild": "^0.24.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.9"
  }
}
```

---

## Phase 3: Update Server Code (15 mins)

### Replace server/index.ts

```typescript
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly for production
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.trim()))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window (generous for email generation)
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
      }
    });

    next();
  });
}

// Health check endpoint (Railway uses this)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

(async () => {
  const server = registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
  });

  // Setup Vite in development, static serving in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment (Railway provides this)
  const PORT = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();
```

### Update server/routes.ts

Add input validation and better error handling:

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function stripMarkdown(content: string | null): string {
  if (!content) return "";
  return content.replace(/```(?:json)?\n?/g, '').trim();
}

// Validate OpenAI API key is present
function validateApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
}

export function registerRoutes(app: Express): Server {
  // Validate API key on startup
  validateApiKey();

  // Email generation endpoint
  app.post('/api/generate-email', async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid prompt in request body'
        });
      }

      if (prompt.length > 5000) {
        return res.status(400).json({
          error: 'Prompt too long (max 5000 characters)'
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert cold email writer who creates highly effective, personalized sales emails. Format your response as JSON with improvements as a formatted string with detailed examples. Structure the response like this:

{
  "improvements": "1. Pain Points:\\n   Original: [current]\\n   Enhanced: [better]\\n   Example: 'Many marketing teams, like yours at Agency One, lose over 10 hours weekly on manual content creation, risking brand inconsistency.'\\n\\n2. Solution Positioning:\\n   Original: [current]\\n   Better: [improved]\\n   Example: 'Our AI-powered calendar slashes content creation time by 80%, ensuring a unified brand voice and higher engagement.'\\n\\n3. Industry-Specific Context:\\n   Current: [current]\\n   Tailored: [better]\\n   Example: 'As a Marketing Manager, you understand the challenge of maintaining a consistent brand voice across platforms. Our solution could be a game-changer for your team.'",
  "variant1": "First email content here",
  "variant2": "Second email content here"
}`
          },
          {
            role: "user",
            content: `${prompt}\n\nProvide your response as JSON with improvements formatted as a string with line breaks indicated by \\n`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content || '';
      const cleanContent = stripMarkdown(content);

      try {
        const parsedContent = JSON.parse(cleanContent);
        res.json({
          choices: [{
            message: {
              content: JSON.stringify(parsedContent)
            }
          }]
        });
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Content:', cleanContent);
        res.status(500).json({
          error: 'Failed to parse email response',
          details: 'Invalid JSON format in response'
        });
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI errors
      if (error.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again in a moment.'
        });
      }
      
      if (error.status === 401) {
        return res.status(500).json({
          error: 'API configuration error'
        });
      }

      res.status(500).json({
        error: 'Failed to generate email',
        details: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  });

  // Email performance prediction endpoint
  app.post('/api/analyze-email', async (req, res) => {
    try {
      const { emailContent } = req.body;

      if (!emailContent || typeof emailContent !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid email content in request body'
        });
      }

      if (emailContent.length > 10000) {
        return res.status(400).json({
          error: 'Email content too long (max 10000 characters)'
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert email analyst. Analyze the cold email and provide performance metrics. Return a JSON object with these exact keys:
            {
              "readability": number (1-10),
              "personalizationScore": number (1-10),
              "valuePropositionClarity": number (1-10),
              "ctaEffectiveness": number (1-10),
              "estimatedResponseRate": number (percentage between 0.1 and 5.0 - remember cold emails typically have very low response rates),
              "keyStrengths": string[] (array of 3 strengths),
              "improvementSuggestions": string[] (array of 3 suggestions)
            }

            Focus on these aspects:
            1. Readability: How easy is it to read and understand?
            2. Personalization Score: How well is it tailored to the recipient?
            3. Value Proposition Clarity: How clearly is the value communicated?
            4. Call-to-Action Effectiveness: How compelling is the CTA?
            5. Estimated Response Rate: Predicted response rate based on email quality (as a number between 0.1% and 5.0% - be conservative and realistic)
            6. Key Strengths: List exactly 3 key strengths as simple strings
            7. Improvement Suggestions: List exactly 3 quick improvements as simple strings`
          },
          {
            role: "user",
            content: `Analyze this cold email:\n${emailContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content || '';
      const cleanContent = stripMarkdown(content);

      try {
        const parsedContent = JSON.parse(cleanContent);
        // Ensure response rate is capped at 5%
        if (parsedContent.estimatedResponseRate > 5) {
          parsedContent.estimatedResponseRate = 5;
        }
        // Ensure all arrays exist
        if (!Array.isArray(parsedContent.keyStrengths)) {
          parsedContent.keyStrengths = [];
        }
        if (!Array.isArray(parsedContent.improvementSuggestions)) {
          parsedContent.improvementSuggestions = [];
        }
        res.json({
          metrics: parsedContent
        });
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Content:', cleanContent);
        res.status(500).json({
          error: 'Failed to parse analysis response',
          details: 'Invalid JSON format in response'
        });
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      if (error.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again in a moment.'
        });
      }

      res.status(500).json({
        error: 'Failed to analyze email',
        details: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
```

---

## Phase 4: Update Vite Config (5 mins)

Replace `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Phase 5: Remove Database Files (2 mins)

Since your routes don't use the database:

```bash
rm -rf db/
rm -rf drizzle.config.ts
rm -rf migrations/
```

Also remove the `@db` alias from `tsconfig.json` if present.

---

## Phase 6: Create Deployment Files (10 mins)

### Create Dockerfile (for Railway)

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### Create .dockerignore

```
node_modules
.git
.gitignore
*.md
.env*
.replit
replit.nix
.upm
.cache
.config
.local
attached_assets
dist
```

### Create Environment Templates

Create `.env.example`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-key-here

# CORS Origins (comma-separated, set after frontend deployment)
CORS_ORIGINS=https://your-app.pages.dev

# Server port (Railway injects this automatically)
PORT=3000

# Environment
NODE_ENV=production
```

---

## Phase 7: Deploy to Railway (10 mins)

### Option A: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set OPENAI_API_KEY="sk-your-key"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

### Option B: Via GitHub (Recommended)

1. Push your updated code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Select your repository
5. Railway auto-detects Dockerfile
6. Add environment variables:
   - `OPENAI_API_KEY` = your key
   - `NODE_ENV` = production
7. Deploy

### Note Your Backend URL

After deployment, Railway gives you a URL like:
`https://cold-email-crafter-production.up.railway.app`

---

## Phase 8: Deploy Frontend to Cloudflare Pages (10 mins)

Since your app is a monorepo that serves frontend from the backend, you have two options:

### Option A: Keep Monorepo (Simpler)

Your current setup serves the frontend from Express in production. The Railway deployment already handles this. You don't need Cloudflare Pages separately.

Just update CORS:
```bash
railway variables set CORS_ORIGINS="https://cold-email-crafter-production.up.railway.app"
railway up
```

### Option B: Split Frontend (Better Performance)

If you want the frontend on Cloudflare's edge:

1. Create a new Cloudflare Pages project
2. Connect your GitHub repo
3. Configure:
   - Root directory: `/client`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your Railway backend URL

Then update `client/src/lib/queryClient.ts` or wherever API calls are made to use `import.meta.env.VITE_API_URL`.

**For simplicity, I recommend Option A for now.** You can split later if needed.

---

## Phase 9: Update Railway CORS (2 mins)

Once deployed:

```bash
railway variables set CORS_ORIGINS="https://cold-email-crafter-production.up.railway.app"
railway up
```

---

## Phase 10: Verification Checklist

- [ ] App loads at Railway URL
- [ ] Can generate cold emails
- [ ] Can analyze emails
- [ ] No console errors
- [ ] Health endpoint works: `curl https://your-app.up.railway.app/health`
- [ ] Rate limiting works (try rapid requests)

---

## Rollback Plan

Your Replit app is still running. Don't delete it until:
- [ ] New deployment tested for 1+ week
- [ ] All functionality verified
- [ ] Custom domain migrated (if applicable)

---

## Cost Summary

| Service | Expected Cost |
|---------|---------------|
| Railway | ~$5/mo (with $5 free credit) |
| Cloudflare Pages | Free (if you split later) |
| **Total** | ~$5/mo or less |

---

## Optional: Custom Domain

### On Railway

1. Railway Dashboard → Your project → Settings → Domains
2. Add custom domain
3. Add CNAME record at your DNS provider

Remember to update `CORS_ORIGINS` with your custom domain!
