import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export function registerRoutes(app: Express): Server {
  // Email generation endpoint
  app.post('/api/generate-email', async (req, res) => {
    try {
      const { prompt } = req.body;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert cold email writer who creates highly effective, personalized sales emails. Format your response as a JSON object with the following structure: { 'improvements'?: string, 'variant1': string, 'variant2': string }"
          },
          {
            role: "user",
            content: `${prompt}\n\nRespond with a JSON object containing two email variants and any suggested improvements. Format as: { "improvements": "any improvement suggestions (optional)", "variant1": "first email version", "variant2": "second email version" }`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      // Parse the content as JSON before sending
      const content = completion.choices[0].message.content;
      const parsedContent = JSON.parse(content);

      res.json({
        choices: [{
          message: {
            content: JSON.stringify(parsedContent)
          }
        }]
      });
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