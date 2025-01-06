import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Mail, Send, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Prospect {
  name: string;
  company: string;
  role: string;
}

interface Product {
  description: string;
  painPoint: string;
  solution: string;
}

interface Strategy {
  ctaType: 'direct' | 'soft';
}

interface FormData {
  prospect: Prospect;
  product: Product;
  strategy: Strategy;
}

interface EmailResponse {
  improvements?: string;
  variant1: string;
  variant2: string;
}

const GenerationProgress: React.FC = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { icon: Sparkles, text: "Analyzing input..." },
    { icon: Mail, text: "Crafting emails..." },
    { icon: Send, text: "Finalizing content..." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-3"
        >
          {React.createElement(stages[stage].icon, {
            className: "h-8 w-8 animate-bounce text-primary"
          })}
          <p className="text-sm font-medium text-muted-foreground">
            {stages[stage].text}
          </p>
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="w-48 h-2 bg-muted rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    </div>
  );
};

const EmailDisplay: React.FC<{ formData: FormData }> = ({ formData }) => {
  const [emails, setEmails] = useState<EmailResponse>({ variant1: '', variant2: '' });
  const [loading, setLoading] = useState(false);
  const [regeneratingV2, setRegeneratingV2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmails = async (useImprovements: boolean = false) => {
    if (useImprovements && !emails.improvements) {
      setError('No improvements available for regeneration');
      return;
    }

    setLoading(true);
    setError(null);

    const prompt = `
      Write ${useImprovements ? 'a new version of the second cold sales email' : 'two different versions of a cold sales email'} using these principles:
      1. Keep it 5-8 sentences (optimized for mobile viewing)
      2. Break up lines after every 2 sentences maximum
      3. Focus on customer pain points, not product features
      4. Emphasize prospect's company and their specific problems
      5. Use appropriate call-to-action based on strategy

      Use this information:
      - Prospect Name: ${formData.prospect.name}
      - Prospect Company: ${formData.prospect.company}
      - Prospect Role: ${formData.prospect.role}
      - Product Description: ${formData.product.description}
      - Main Pain Point: ${formData.product.painPoint}
      - Solution: ${formData.product.solution}
      - CTA Style: ${formData.strategy.ctaType === 'direct' ? 'Direct (ask for a call)' : 'Soft (offer to share more information)'}
      ${useImprovements ? `\nIncorporate these improvements:\n${emails.improvements}` : ''}
    `;

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from server');
      }

      const contentObj = JSON.parse(data.choices[0].message.content);

      if (useImprovements) {
        // Only update variant2 when regenerating
        setEmails(prev => ({
          ...prev,
          variant2: contentObj.variant2 || 'Failed to regenerate second email variant',
        }));
      } else {
        setEmails({
          improvements: contentObj.improvements,
          variant1: contentObj.variant1 || 'Failed to generate first email variant',
          variant2: contentObj.variant2 || 'Failed to generate second email variant',
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate emails. Please try again.');
    } finally {
      setLoading(false);
      setRegeneratingV2(false);
    }
  };

  const handleRegenerateV2 = async () => {
    setRegeneratingV2(true);
    await generateEmails(true);
  };

  useEffect(() => {
    generateEmails();
  }, []);

  return (
    <div className="space-y-6 mt-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <GenerationProgress />
          </CardContent>
        </Card>
      ) : (
        <>
          {emails.improvements && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {emails.improvements}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {emails.variant1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Email Version 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap font-mono text-sm">
                    {emails.variant1}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {emails.variant2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Email Version 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="whitespace-pre-wrap font-mono text-sm">
                    {emails.variant2}
                  </div>
                  <Button
                    onClick={handleRegenerateV2}
                    disabled={regeneratingV2 || !emails.improvements}
                    className="w-full bg-green-500 hover:bg-green-600 active:bg-gray-500 disabled:bg-gray-200"
                  >
                    {regeneratingV2 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Using Improvements
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

const ColdEmailForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    prospect: {
      name: '',
      company: '',
      role: ''
    },
    product: {
      description: '',
      painPoint: '',
      solution: ''
    },
    strategy: {
      ctaType: 'direct'
    }
  });

  const [showEmails, setShowEmails] = useState(false);

  const handleInputChange = (section: keyof FormData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEmails(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prospect Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prospectName">Prospect's Name</Label>
              <Input
                id="prospectName"
                value={formData.prospect.name}
                onChange={(e) => handleInputChange('prospect', 'name', e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospectCompany">Prospect's Company</Label>
              <Input
                id="prospectCompany"
                value={formData.prospect.company}
                onChange={(e) => handleInputChange('prospect', 'company', e.target.value)}
                placeholder="Target Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospectRole">Prospect's Role</Label>
              <Input
                id="prospectRole"
                value={formData.prospect.role}
                onChange={(e) => handleInputChange('prospect', 'role', e.target.value)}
                placeholder="Marketing Manager"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product & Pain Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productDescription">Brief Product Description</Label>
              <Textarea
                id="productDescription"
                value={formData.product.description}
                onChange={(e) => handleInputChange('product', 'description', e.target.value)}
                placeholder="One sentence description of what your product does"
                className="h-20"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Example: "An AI-powered content calendar that automatically generates social media posts based on your brand voice."
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="painPoint">Main Pain Point</Label>
              <Textarea
                id="painPoint"
                value={formData.product.painPoint}
                onChange={(e) => handleInputChange('product', 'painPoint', e.target.value)}
                placeholder="What problem does your prospect face?"
                className="h-20"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Example: "Marketing teams spend 10+ hours per week manually planning and creating social media content, leading to inconsistent posting and brand messaging."
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">Your Solution</Label>
              <Textarea
                id="solution"
                value={formData.product.solution}
                onChange={(e) => handleInputChange('product', 'solution', e.target.value)}
                placeholder="How does your product solve their pain point?"
                className="h-20"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Example: "Our AI reduces content creation time by 80% while ensuring consistent brand voice and increased engagement through optimized posting schedules."
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Call-to-Action Style</Label>
            <RadioGroup
              value={formData.strategy.ctaType}
              onValueChange={(value: 'direct' | 'soft') => handleInputChange('strategy', 'ctaType', value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct">Direct (Request a call immediately)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="soft" id="soft" />
                <Label htmlFor="soft">Soft (Offer to share more information)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 active:bg-gray-500">Generate Emails</Button>
      </form>

      {showEmails && <EmailDisplay formData={formData} />}
    </div>
  );
};

export default ColdEmailForm;