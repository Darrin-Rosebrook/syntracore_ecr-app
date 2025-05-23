import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from './page'; // Assuming default export
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth'; // Import User type

// --- Mocks ---
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
  })),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })), // For MainHeader if it's part of layout
  usePathname: jest.fn(() => '/'), // For MainHeader if it's part of layout
}));

const mockUseAuth = useAuth as jest.Mock;
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock LoginForm as it's part of the public content and might have its own dependencies
jest.mock('@/components/login-form', () => ({
  LoginForm: () => <div data-testid="login-form-mock">LoginFormMock</div>,
}));


// --- Test Suite ---
describe('HomePage Redirection and Public View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserBase: User = {
    uid: 'test-uid',
    email: 'test@example.com',
    // Add other required User properties if your useAuth().currentUser expects them
    // For this test, only uid and email might be implicitly checked by console logs in HomePage
  } as User;

  // Test cases for redirection based on userType
  const testCases = [
    { userType: 'PHA', expectedPath: '/admin' },
    { userType: 'HCO', expectedPath: '/provider-portal' },
    { userType: 'EHR_VENDOR', expectedPath: '/vendor-portal' },
    { userType: 'HEALTH_SYSTEM', expectedPath: '/health-system-portal' },
  ];

  testCases.forEach(({ userType, expectedPath }) => {
    it(`redirects ${userType} user to ${expectedPath}`, async () => {
      mockUseAuth.mockReturnValue({
        currentUser: { ...mockUserBase, userType }, // Attach userType to mock user if HomePage logic uses it directly
        userType: userType,
        loading: false,
        userProfile: { userType } // Ensure userProfile also reflects the type if HomePage relies on it
      });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(expectedPath);
      });
    });
  });

  it('shows public content (registration options) when no user is logged in', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      userType: null,
      loading: false,
      userProfile: null
    });

    render(<HomePage />);

    // Wait for any initial loading/effects to settle
    await waitFor(() => {
      expect(screen.getByText(/New User\? Register Here/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/HCO & Lab Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/EHR\/LIMS Vendor Registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Health System Registration/i)).toBeInTheDocument();
    expect(screen.getByTestId("login-form-mock")).toBeInTheDocument(); // Check for LoginForm
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
  
  it('shows loading state initially when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      userType: null,
      loading: true,
      userProfile: null
    });
    render(<HomePage />);
    expect(screen.getByText(/Loading your experience.../i)).toBeInTheDocument();
  });

  it('shows loading state if user is present but userType is not yet determined', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { ...mockUserBase },
      userType: null, // userType not yet determined
      loading: false, 
      userProfile: null
    });
    render(<HomePage />);
    // The loading condition is: authLoading || (currentUser && !userType) || (currentUser && userType && redirectingTypes.includes(userType))
    // So, currentUser && !userType should show loader
    expect(screen.getByText(/Loading your experience.../i)).toBeInTheDocument();
  });

  it('does not redirect and shows public content if userType is unknown', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: { ...mockUserBase },
      userType: 'UNKNOWN_TYPE' as any, // Simulate an unknown type
      loading: false,
      userProfile: { userType: 'UNKNOWN_TYPE' }
    });

    render(<HomePage />);
    
    // Should not redirect, and after loading phase (which should pass quickly), show public content
    await waitFor(() => {
        expect(screen.getByText(/New User\? Register Here/i)).toBeInTheDocument();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
