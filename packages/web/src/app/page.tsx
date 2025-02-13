import { getCafes } from '../services/api'

// Disable static page generation
export const revalidate = 0

export default async function Home() {
  let data;
  let error;
  
  try {
    const response = await getCafes();
    data = response.data;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load cafes';
  }

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8">Berkeley Brew</h1>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600">Error: {error}</p>
          <p className="text-red-500 mt-2">Make sure the backend server is running on port 3001</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-8">Berkeley Brew</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.cafes.map(cafe => (
          <div key={cafe.id} className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{cafe.name}</h2>
            <p className="text-gray-600 mb-4">{cafe.address}</p>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">★</span>
              <span>{cafe.average_rating?.toFixed(1) || 'No ratings'}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
