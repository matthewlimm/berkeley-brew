'use client';

import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-amber-700">Terms of Service</h1>
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
              Welcome to Berkeley Brew. Please read these Terms of Service ("Terms") carefully as they contain 
              important information about your legal rights, remedies, and obligations. By accessing or using 
              the Berkeley Brew platform, you agree to comply with and be bound by these Terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using our platform, you agree to be bound by these Terms and our Privacy Policy. 
              If you do not agree to these Terms, please do not use our platform.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may modify these Terms at any time. We will provide notice of any material changes by updating 
              the "Last Updated" date at the top of these Terms. Your continued use of Berkeley Brew after such 
              modifications constitutes your acceptance of the modified Terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Account Registration</h2>
            <p className="text-gray-600 mb-4">
              To access certain features of our platform, you may need to register for an account. You agree to 
              provide accurate, current, and complete information during the registration process and to update 
              such information to keep it accurate, current, and complete.
            </p>
            <p className="text-gray-600 mb-4">
              You are responsible for safeguarding your password and for all activities that occur under your account. 
              You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. User Content</h2>
            <p className="text-gray-600 mb-4">
              Our platform allows you to post, link, store, share, and otherwise make available certain information, 
              text, graphics, videos, or other material ("User Content"). You are responsible for the User Content 
              that you post, including its legality, reliability, and appropriateness.
            </p>
            <p className="text-gray-600 mb-4">
              By posting User Content, you grant us the right to use, modify, publicly perform, publicly display, 
              reproduce, and distribute such content on and through our platform. You retain any and all of your 
              rights to any User Content you submit, post, or display on or through our platform.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Prohibited Activities</h2>
            <p className="text-gray-600 mb-4">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Using the platform for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Posting false or misleading information about cafes or other users</li>
              <li>Harassing, abusing, or harming another person</li>
              <li>Impersonating another user or person</li>
              <li>Attempting to gain unauthorized access to our platform or other users' accounts</li>
              <li>Using our platform in a manner that could disable, overburden, damage, or impair the site</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Berkeley Brew platform and its original content, features, and functionality are owned by 
              Berkeley Brew and are protected by international copyright, trademark, patent, trade secret, 
              and other intellectual property or proprietary rights laws.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              In no event shall Berkeley Brew, its directors, employees, partners, agents, suppliers, or affiliates, 
              be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access 
              to or use of or inability to access or use the platform.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account and bar access to our platform immediately, without prior 
              notice or liability, under our sole discretion, for any reason whatsoever and without limitation, 
              including but not limited to a breach of the Terms.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms, please contact us at matthewlim@berkeley.edu.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
