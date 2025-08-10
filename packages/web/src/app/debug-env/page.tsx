'use client';

export default function DebugEnv() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'NOT SET'}</p>
        <p><strong>Default API URL being used:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Test API Call</h2>
        <button 
          onClick={async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
              const response = await fetch(`${apiUrl}/health`);
              const data = await response.json();
              alert(`API Response: ${JSON.stringify(data)}`);
            } catch (error) {
              alert(`API Error: ${error}`);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test API Health Endpoint
        </button>
      </div>
    </div>
  );
}
