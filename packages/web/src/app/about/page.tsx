'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-amber-700">About Berkeley Brew</h1>
            <Link href="/" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to Homepage
            </Link>
          </div>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              Berkeley Brew is a hyperlocal coffee app designed specifically for the UC Berkeley community. 
              Our mission is to help students, faculty, and visitors discover the best cafes and coffee shops 
              around campus, with a focus on study-friendly environments, sustainability, and community values.
            </p>
            <p className="text-gray-600">
              We believe that great coffee fuels great ideas, and Berkeley is full of both. Our platform 
              helps connect coffee enthusiasts with local businesses while providing unique insights into 
              what makes each cafe special.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">What Makes Us Different</h2>
            <p className="text-gray-600 mb-4">
              Unlike generic review platforms, Berkeley Brew focuses on metrics that matter to our community:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><span className="font-medium">Grindability Score</span> - How suitable the cafe is for studying and productivity</li>
              <li><span className="font-medium">Radical Score</span> - Measures social justice and sustainability practices</li>
              <li><span className="font-medium">Vibe Score</span> - Evaluates the aesthetic and ambiance of the space</li>
              <li><span className="font-medium">Student Friendliness Score</span> - Evaluates the welcomeness of the cafe for students</li>
              <li><span className="font-medium">Golden Bear Score</span> - The overall rating that is calculated by combining all the subscores, specifically tailored to Berkeley community needs</li>
            </ul>
            <p className="text-gray-600">
              We also provide real-time information about open hours, crowd levels, and special events 
              to help you find the perfect spot at any time of day.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Berkeley Brew was founded in 2025 by UC Berkeley students who were frustrated 
              with the lack of specialized information about local coffee shops. What started as a 
              simple document of cafe ratings has evolved into a comprehensive platform serving 
              thousands of coffee lovers in the Berkeley area.
            </p>
            <p className="text-gray-600">
              Today, we're proud to be the go-to resource for finding the perfect study spot, meeting 
              location, or simply a great cup of coffee in Berkeley. Our community-driven approach 
              ensures that our reviews and ratings reflect the authentic experiences of real Berkeley 
              students and residents.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
