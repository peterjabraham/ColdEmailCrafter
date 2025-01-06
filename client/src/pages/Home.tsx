import ColdEmailForm from '@/components/ColdEmailForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">
          Cold Email Generator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Generate personalized cold emails powered by AI
        </p>
        <ColdEmailForm />
      </div>
    </main>
  );
}