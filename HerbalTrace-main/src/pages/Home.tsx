// src/pages/Home.tsx
import React, { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'aggregator':
        return '/aggregator';
      case 'consumer':
        return '/consumer';
      case 'lab':
        return '/lab';
      case 'factory':
        return '/factory';
      case 'farmer':
      case 'wild_collector':
        return '/collector';
      case 'admin':
        return '/admin';
      default:
        return '/consumer';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProfile(false);
  };

  if (user && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">HerbalTrace</h1>
              <p className="text-gray-600">Welcome back, {profile.full_name}!</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Profile Modal */}
          {showProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg">{profile.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <Badge variant="secondary" className="ml-2">
                      {profile.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {profile.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-lg">{profile.phone}</p>
                    </div>
                  )}
                  {profile.organization && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Organization</label>
                      <p className="text-lg">{profile.organization}</p>
                    </div>
                  )}
                  {(profile.address || profile.location) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-lg">{profile.address || profile.location}</p>
                    </div>
                  )}
                  <Button
                    onClick={() => setShowProfile(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard Access */}
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Access Your Dashboard</h2>
            <p className="text-gray-600">Click below to go to your role-specific dashboard</p>
            
            <Button
              onClick={() => navigate(getDashboardRoute(profile.role))}
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Go to {profile.role.replace('_', ' ').toUpperCase()} Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      {!showAuth ? (
        <div className="text-center space-y-8 max-w-2xl mx-4">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">HerbalTrace</h1>
            <p className="text-xl text-gray-600 mb-2">Track the journey of herbal products from source to consumer</p>
            <p className="text-gray-500">Ensuring transparency, quality, and authenticity in the herbal supply chain</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 text-center">
              <CardTitle className="text-lg mb-2">Farmers & Collectors</CardTitle>
              <CardDescription>Register your harvest and track your products</CardDescription>
            </Card>
            <Card className="p-6 text-center">
              <CardTitle className="text-lg mb-2">Labs & Factories</CardTitle>
              <CardDescription>Process and test herbal products with full traceability</CardDescription>
            </Card>
            <Card className="p-6 text-center">
              <CardTitle className="text-lg mb-2">Consumers</CardTitle>
              <CardDescription>Verify authenticity and trace product origins</CardDescription>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Get Started - Sign In / Sign Up
            </Button>
            <Button
              onClick={() => navigate('/consumer')}
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg"
            >
              Customer Portal
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to HerbalTrace</h2>
            <p className="text-gray-600">Sign in to your account or create a new one</p>
          </div>
          <AuthForm />
          <Button
            variant="outline"
            onClick={() => setShowAuth(false)}
            className="w-full mt-4"
          >
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
};

export default Home;
