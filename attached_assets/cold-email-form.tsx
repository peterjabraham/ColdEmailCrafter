import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Email Generator Component
const EmailDisplay = ({ formData }) => {
  const [emails, setEmails] = useState({ variant1: '', variant2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLD_EMAIL_PRINCIPLES = `
    1. Keep it 5-8 sentences (optimized for mobile viewing)
    2. Break up lines after every 2 sentences maximum
    3. Focus on customer pain points, not product features
    4. Emphasize prospect's company and their specific problems
    5. Use appropriate call-to-action based on strategy
  `;

  const generateEmails = async () => {
    setLoading(true);
    setError(null);

    const prompt = `
      Write two different versions of a cold sales email using these principles:
      ${COLD_EMAIL_PRINCIPLES}

      Use this information:
      - Prospect Name: ${formData.prospect.name}
      - Prospect Company: ${formData.prospect.company}
      - Prospect Role: ${formData.prospect.role}
      - Product Description: ${formData.product.description}
      - Main Pain Point: ${formData.product.painPoint}
      - Solution: ${formData.product.solution}
      - CTA Style: ${formData.strategy.ctaType === 'direct' ? 'Direct (ask for a call)' : 'Soft (offer to share more information)'}

      Before writing the emails, analyze if there are any additional relevant pain points or solutions that might resonate better with this prospect based on their role and industry. If you find better alternatives, include a brief section titled "SUGGESTED IMPROVEMENTS:" before the emails, listing:
      1. Any additional or more impactful pain points that might resonate better
      2. More effective ways to position the solution
      3. Brief explanation of why these might work better

      Then provide two email versions labeled "Version 1:" and "Version 2:". 
      Keep each email concise and mobile-friendly.
      Make the versions distinctly different in approach while maintaining effectiveness.
      Consider incorporating any of your suggested improvements in one of the versions if they're significantly stronger than the provided pain points/solutions.
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
        throw new Error('Failed to generate emails');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Check if there are suggested improvements
      let variant1, variant2, improvements = '';
      if (content.includes('SUGGESTED IMPROVEMENTS:')) {
        const [improvementSection, ...emailVersions] = content.split('Version 1:');
        improvements = improvementSection.replace('SUGGESTED IMPROVEMENTS:', '').trim();
        [variant1, variant2] = emailVersions.join('Version 1:').split('Version 2:');
      } else {
        [variant1, variant2] = content.split('Version 2:');
      }
      
      setEmails({
        improvements: improvements,
        variant1: variant1.replace('Version 1:', '').trim(),
        variant2: variant2.trim(),
      });
    } catch (err) {
      setError('Failed to generate emails. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger email generation when component mounts
  React.useEffect(() => {
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
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Generating emails...</span>
        </div>
      ) : (
        <>
          {emails.improvements && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm space-y-2">
                  {emails.improvements}
                </div>
              </CardContent>
            </Card>
          )}
          
          {emails.variant1 && (
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
          )}
          
          {emails.variant2 && (
            <Card>
              <CardHeader>
                <CardTitle>Email Version 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {emails.variant2}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Main Form Component
const ColdEmailForm = () => {
  const [formData, setFormData] = useState({
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
      ctaType: 'direct' // 'direct' or 'soft'
    }
  });

  const [showEmails, setShowEmails] = useState(false);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
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
              onValueChange={(value) => handleInputChange('strategy', 'ctaType', value)}
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

        <Button type="submit" className="w-full">Generate Emails</Button>
      </form>
      
      {showEmails && <EmailDisplay formData={formData} />}
    </div>
  );
};

export default ColdEmailForm;