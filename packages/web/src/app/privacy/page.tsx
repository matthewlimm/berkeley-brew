'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-amber-700">Privacy Policy</h1>
            <Link href="/" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to Homepage
            </Link>
          </div>
          
          <section className="mb-8">
            <p className="text-gray-600 mb-4">
              Last Updated: July 4, 2025
            </p>
            <p className="text-gray-600 mb-4">
              Berkeley Brew ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our application 
              and services. Please read this Privacy Policy carefully.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">
              We may collect several types of information from and about users of our application, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><span className="font-medium">Personal Information:</span> Email address, name, and profile information when you register for an account.</li>
              <li><span className="font-medium">User Content:</span> Information you provide when writing reviews, rating cafes, or interacting with the platform.</li>
              <li><span className="font-medium">Usage Information:</span> How you interact with our application, including your browsing actions, search queries, and viewing preferences.</li>
              <li><span className="font-medium">Device Information:</span> Information about your mobile device or computer, including device type, operating system, unique device identifiers, and IP address.</li>
              <li><span className="font-medium">Location Data:</span> With your consent, we may collect and process information about your actual location to provide location-based services.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">
              We use the information we collect about you for various purposes, including to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Personalize your experience and deliver content relevant to your interests</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Sharing Your Information</h2>
            <p className="text-gray-600 mb-4">
              We may share information about you as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
              <li>In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process</li>
              <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of Berkeley Brew or others</li>
              <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
              <li>With your consent or at your direction</li>
            </ul>
            <p className="text-gray-600 mb-4">
              We may also share aggregated or de-identified information that cannot reasonably be used to identify you.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized 
              access, disclosure, alteration, and destruction. However, no internet or electronic communications service 
              is ever completely secure or error-free.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Your Choices</h2>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">Account Information:</span> You may update, correct, or delete your account information at any time by logging into your account. 
              If you wish to delete your account, please email us at matthewlim@berkeley.edu.
            </p>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">Location Information:</span> You can prevent us from collecting location information by changing the settings on your device, 
              although this may limit your ability to use certain features of our services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Changes to This Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date at the top of this page. You are advised 
              to review this Privacy Policy periodically for any changes.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at matthewlim@berkeley.edu.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
