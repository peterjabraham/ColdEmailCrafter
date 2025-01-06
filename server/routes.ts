import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function stripMarkdown(content: string | null): string {
  if (!content) return "";
  // Remove markdown code block markers and any language specifiers
  return content.replace(/```(?:json)?\n?/g, '').trim();
}

export function registerRoutes(app: Express): Server {
  // Email generation endpoint
  app.post('/api/generate-email', async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Missing prompt in request body'
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert cold email writer who creates highly effective, personalized sales emails. Format your response as JSON with improvements as a formatted string. Structure the response like this:

{
  "improvements": "1. Pain Points:\\n   Original: [current]\\n   Enhanced: [better]\\n   Example: [specific example]\\n\\n2. Solution Positioning:\\n   Original: [current]\\n   Better: [improved]\\n   Example: [specific example]\\n\\n3. Industry-Specific Context:\\n   Current: [current]\\n   Tailored: [better]\\n   Example: [specific example]",
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

      // Get the content and ensure it's proper JSON
      const content = completion.choices[0].message.content || '';

      // Strip any markdown formatting if present
      const cleanContent = stripMarkdown(content);

      try {
        // Parse the content to verify it's valid JSON
        const parsedContent = JSON.parse(cleanContent);

        // Send back in the expected format
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
      res.status(500).json({
        error: 'Failed to generate email',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}