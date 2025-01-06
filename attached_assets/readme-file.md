# Cold Email Generator

A Next.js application that generates personalized cold sales emails using AI. The app helps craft effective emails based on prospect information and proven cold email principles.

## 🚀 Quick Setup in Replit

1. Create a new Replit project:
   - Select "Next.js" as your template
   - Name your project (e.g., "cold-email-generator")

2. Install required dependencies:
   ```bash
   npm install @/components/ui openai lucide-react
   ```

3. Set up your environment variables:
   - Click on "Secrets" in the Tools panel
   - Add a new secret with key `OPENAI_API_KEY` and your OpenAI API key as the value

4. Configure project structure:
   ```
   /app
     /api
       /generate-email/route.js    # API endpoint for OpenAI
     /page.js                      # Main application page
   /components
     /ui                          # shadcn/ui components
   ```

5. Install required shadcn/ui components:
   ```bash
   npx shadcn-ui@latest add card input label textarea button radio-group alert
   ```

## 📁 File Setup

1. Create `/app/api/generate-email/route.js`:
   ```javascript
   import OpenAI from 'openai';
   import { NextResponse } from 'next/server';

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   export async function POST(req) {
     try {
       const { prompt } = await req.json();
       
       const completion = await openai.chat.completions.create({
         model: "gpt-4",
         messages: [
           {
             role: "system",
             content: "You are an expert cold email writer who creates highly effective, personalized sales emails."
           },
           {
             role: "user",
             content: prompt
           }
         ],
         temperature: 0.7,
         max_tokens: 1000,
       });

       return NextResponse.json(completion);
     } catch (error) {
       console.error('OpenAI API error:', error);
       return NextResponse.json(
         { error: 'Failed to generate email' },
         { status: 500 }
       );
     }
   }
   ```

2. Update `/app/page.js`:
   ```javascript
   import ColdEmailForm from '../components/ColdEmailForm';

   export default function Home() {
     return (
       <main className="min-h-screen bg-gray-50 py-8">
         <div className="container mx-auto">
           <h1 className="text-3xl font-bold text-center mb-8">
             Cold Email Generator
           </h1>
           <ColdEmailForm />
         </div>
       </main>
     );
   }
   ```

3. Create the main component file `/components/ColdEmailForm.js` with the provided component code.

## 🎯 Usage

1. Fill in the prospect information:
   - Prospect's name, company, and role
   - Brief product description
   - Main pain point the prospect faces
   - Your solution to their pain point
   - Choose CTA style (direct or soft)

2. Click "Generate Emails" to:
   - Get AI-suggested improvements for your pain points/solutions
   - Receive two variants of personalized cold emails
   - View the generated content in a clean, mobile-friendly format

## ⚙️ Features

- Form-based data collection for prospect and product information
- AI-powered email generation using GPT-4
- Suggests improvements to your pain points and solutions
- Generates two distinct email variants
- Mobile-responsive design
- Clean, modern UI using shadcn/ui components

## 🔍 Important Notes

- Ensure your OpenAI API key has access to GPT-4
- The app generates two different approaches to the same pitch
- Suggested improvements are provided when AI identifies better angles
- Each email follows proven cold email principles:
  - 5-8 sentences long
  - Mobile-optimized
  - Focus on pain points over features
  - Personalized to prospect's context

## 🚧 Known Limitations

- API rate limits based on your OpenAI plan
- Generation can take 15-30 seconds
- Maximum of 1000 tokens per response

## 🆘 Troubleshooting

If you encounter issues:
1. Verify your OpenAI API key is correctly set in Secrets
2. Check browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify component imports and file paths

## 🛠️ Development

To run the development server:
```bash
npm run dev
```

The application will be available at your Replit URL.
