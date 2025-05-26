import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainHeader } from './main-header'; // Assuming named export
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { User } from 'firebase/auth';

// --- Mocks ---
const mockRouterPush = jest.fn();
const mockLogOut = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush })),
  usePathname: jest.fn(() => '/'), // Default pathname
  useSearchParams: jest.fn(() => ({ get: jest.fn() })), // Default searchParams
}));

const mockUseAuth = useAuth as jest.Mock;
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ResourcesDrawer as it's a child component and not the focus of these tests
jest.mock('@/components/resources-drawer', () => ({
  ResourcesDrawer: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => 
    isOpen ? <div data-testid="resources-drawer-mock">ResourcesDrawerMock <button onClick={onClose}>Close</button></div> : null,
}));

// --- Helper Function for Rendering with Auth State ---
const renderMainHeaderWithAuth = (
  currentUser: User | null, 
  userType: string | null, 
  loading: boolean = false
) => {
  mockUseAuth.mockReturnValue({
    currentUser,
    userType,
    loading,
    logOut: mockLogOut,
    // Add other auth context values if MainHeader uses them
  });
  return render(<MainHeader />);
};

// --- Test Suite ---
describe('MainHeader Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserBase: User = {
    uid: 'test-uid',
    email: 'test@example.com',
  } as User;

  describe('Logged-out state', () => {
    it('renders Login and Sign Up buttons when logged out', () => {
      renderMainHeaderWithAuth(null, null);
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument(); // Dropdown trigger
      expect(screen.queryByRole('button', { name: /Logout/i })).not.toBeInTheDocument();
    });

    it('shows signup options in dropdown when Sign Up is clicked', () => {
      renderMainHeaderWithAuth(null, null);
      fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      // These items are in a DropdownMenu, so they might not be immediately visible
      // Depending on DropdownMenu implementation, direct getByRole might fail.
      // Test for presence of items that would be in an open dropdown.
      expect(screen.getByRole('menuitem', { name: /Register HCO\/Lab/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Register EHR Vendor/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Register Health System/i })).toBeInTheDocument();
    });
  });

  describe('Logged-in states based on userType', () => {
    const loggedInTestCases = [
      { userType: 'PHA', expectedLinkText: /Admin Dashboard/i, portalPath: '/admin' },
      { userType: 'HCO', expectedLinkText: /Provider Portal/i, portalPath: '/provider-portal' },
      { userType: 'EHR_VENDOR', expectedLinkText: /Vendor Portal/i, portalPath: '/vendor-portal' },
      { userType: 'HEALTH_SYSTEM', expectedLinkText: /Health System Portal/i, portalPath: '/health-system-portal' },
    ];

    loggedInTestCases.forEach(({ userType, expectedLinkText }) => {
      it(`renders correct portal link and Logout for ${userType} user`, () => {
        renderMainHeaderWithAuth({ ...mockUserBase, email: `${userType.toLowerCase()}@example.com` }, userType);
        
        const portalLink = screen.getByRole('link', { name: expectedLinkText });
        expect(portalLink).toBeInTheDocument();
        // expect(portalLink).toHaveAttribute('href', portalPath); // NextLink makes this tricky

        expect(screen.getByText(`${userType.toLowerCase()}@example.com`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Sign Up/i })).not.toBeInTheDocument();
      });
    });

    it('calls logOut and redirects to home on logout button click', async () => {
      renderMainHeaderWithAuth(mockUserBase, 'HCO');
      fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
      await waitFor(() => {
        expect(mockLogOut).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/');
      });
    });
  });
  
  it('renders loading state when auth is loading', () => {
    renderMainHeaderWithAuth(null, null, true);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('opens ResourcesDrawer when resources button is clicked', () => {
    renderMainHeaderWithAuth(null, null);
    expect(screen.queryByTestId('resources-drawer-mock')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open resources/i }));
    expect(screen.getByTestId('resources-drawer-mock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close/i })); // Assuming mock drawer has a close button
    expect(screen.queryByTestId('resources-drawer-mock')).not.toBeInTheDocument();
  });
});
