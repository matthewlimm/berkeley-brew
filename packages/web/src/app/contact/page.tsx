'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-amber-700">Contact Us</h1>
            <Link href="/" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to Homepage
            </Link>
          </div>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get In Touch</h2>
            <p className="text-gray-600 mb-6">
              For all inquiries, questions, suggestions, or to recommend a cafe for us to add, 
              please email us directly at the address below. We'd love to hear from you!
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-medium text-amber-800 mb-2">Email Us</h3>
                  <p className="text-lg font-medium text-amber-700 mb-1">matthewlim@berkeley.edu</p>
                  <p className="text-gray-600">
                    Please include as much detail as possible in your email. For cafe recommendations, 
                    include the cafe name, address, and why you think it should be added to Berkeley Brew.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
