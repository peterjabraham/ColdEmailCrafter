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
            content: `You are an expert cold email writer who creates highly effective, personalized sales emails. Format your response as JSON. Include 'improvements' (optional), 'variant1', and 'variant2' fields.

For the improvements field, provide concrete examples for each suggestion. Structure improvements as:

1. Pain Points:
   Original: [current pain point]
   Enhanced: [suggested pain point]
   Example: "Instead of 'manually managing inventory', try 'losing $50,000 annually due to stockouts and overstock situations'"

2. Solution Positioning:
   Original: [current positioning]
   Better: [improved positioning]
   Example: "Instead of 'AI-powered inventory management', try 'real-time inventory optimization that prevented $100,000 in losses for similar retailers'"

3. Industry-Specific Context:
   Current: [general approach]
   Tailored: [industry-specific approach]
   Example: "Instead of 'improve efficiency', try 'reduce seasonal inventory fluctuations common in fashion retail'"`
          },
          {
            role: "user",
            content: `${prompt}\n\nProvide your response in JSON format with the following structure: { "improvements": "optional suggestions with examples", "variant1": "first email", "variant2": "second email" }`
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