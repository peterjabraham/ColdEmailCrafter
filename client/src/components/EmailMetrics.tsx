import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, Zap, Brain, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface Metrics {
  readability: number;
  personalizationScore: number;
  valuePropositionClarity: number;
  ctaEffectiveness: number;
  estimatedResponseRate: number;
  keyStrengths: string[];
  improvementSuggestions: string[];
}

interface EmailMetricsProps {
  emailContent: string;
  onMetricsCalculated?: (metrics: Metrics) => void;
}

interface MetricRowProps {
  label: string;
  value: number;
  icon: React.ElementType;
}

const EmailMetrics: React.FC<EmailMetricsProps> = ({ emailContent, onMetricsCalculated }) => {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const analyzeEmail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/analyze-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emailContent }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze email');
        }

        const data = await response.json();

        // Ensure we have default values for all metrics
        const receivedMetrics: Metrics = {
          readability: data.metrics?.readability ?? 0,
          personalizationScore: data.metrics?.personalizationScore ?? 0,
          valuePropositionClarity: data.metrics?.valuePropositionClarity ?? 0,
          ctaEffectiveness: data.metrics?.ctaEffectiveness ?? 0,
          estimatedResponseRate: Math.min(data.metrics?.estimatedResponseRate ?? 0, 5),
          keyStrengths: Array.isArray(data.metrics?.keyStrengths) ? data.metrics.keyStrengths : [],
          improvementSuggestions: Array.isArray(data.metrics?.improvementSuggestions) ? data.metrics.improvementSuggestions : []
        };

        setMetrics(receivedMetrics);
        onMetricsCalculated?.(receivedMetrics);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to analyze email. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (emailContent) {
      analyzeEmail();
    }
  }, [emailContent]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Analyzing email performance...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return null;
  }

  const MetricRow: React.FC<MetricRowProps> = ({ label, value, icon: Icon }) => (
    <div className="flex items-center space-x-4 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{value}/10</span>
        </div>
        <Progress value={value * 10} className="h-2" />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <MetricRow
              label="Readability"
              value={metrics.readability}
              icon={Brain}
            />
            <MetricRow
              label="Personalization"
              value={metrics.personalizationScore}
              icon={Target}
            />
            <MetricRow
              label="Value Proposition"
              value={metrics.valuePropositionClarity}
              icon={Zap}
            />
            <MetricRow
              label="CTA Effectiveness"
              value={metrics.ctaEffectiveness}
              icon={MessageSquare}
            />
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-primary">
                {metrics.estimatedResponseRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated Response Rate
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Key Strengths</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {metrics.keyStrengths.map((strength, i) => (
                  <li key={i} className="text-green-600">{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">Quick Improvements</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {metrics.improvementSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-blue-600">{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmailMetrics;