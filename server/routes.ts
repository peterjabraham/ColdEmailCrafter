import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function stripMarkdown(content: string | null): string {
  if (!content) return "";
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
      res.status(500).json({
        error: 'Failed to generate email',
        details: error.message
      });
    }
  });

  // Email performance prediction endpoint
  app.post('/api/analyze-email', async (req, res) => {
    try {
      const { emailContent } = req.body;

      if (!emailContent) {
        return res.status(400).json({
          error: 'Missing email content in request body'
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
              "estimatedResponseRate": number (percentage),
              "keyStrengths": string[] (array of 3 strengths),
              "improvementSuggestions": string[] (array of 3 suggestions)
            }

            Focus on these aspects:
            1. Readability: How easy is it to read and understand?
            2. Personalization Score: How well is it tailored to the recipient?
            3. Value Proposition Clarity: How clearly is the value communicated?
            4. Call-to-Action Effectiveness: How compelling is the CTA?
            5. Estimated Response Rate: Predicted response rate based on email quality (as a number)
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
      res.status(500).json({
        error: 'Failed to analyze email',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}