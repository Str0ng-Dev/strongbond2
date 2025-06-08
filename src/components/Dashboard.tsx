import React from 'react';
import { useAppContext } from '../contexts';
import IndividualDashboard from './IndividualDashboard';
import OrgDashboard from './OrgDashboard';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { 
    user, 
    organization, 
    isOrgUser, 
    isIndividualUser, 
    isLoading, 
    error 
  } = useAppContext();

  // Show loading state while context is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Dashboard...</h2>
          <p className="text-gray-600 mt-2">Determining your context...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an issue with context
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Show fallback if user context is unclear
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load your user profile. Please try logging in again.</p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on context
  if (isOrgUser && organization) {
    return <OrgDashboard onLogout={onLogout} />;
  }

  if (isIndividualUser) {
    return <IndividualDashboard onLogout={onLogout} />;
  }

  // Fallback for edge cases
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-50 to-yellow-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Context Unclear</h2>
        <p className="text-gray-600 mb-6">
          We're having trouble determining your account type. Please contact support or try logging in again.
        </p>
        <div className="space-y-3">
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p><strong>User:</strong> {user.first_name} ({user.user_role})</p>
            <p><strong>Organization:</strong> {organization ? organization.name : 'None'}</p>
            <p><strong>Context:</strong> {isOrgUser ? 'Organization' : isIndividualUser ? 'Individual' : 'Unknown'}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;