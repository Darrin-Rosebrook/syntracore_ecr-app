import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from './page'; // Adjust if default export is SignupForm
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { EULA_TEXT } from '@/lib/constants'; // Actual EULA_TEXT

// --- Mocks ---
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    // Add other router methods if used by the component
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param: string) => 'hco'), // Default mock for ?type=hco
  })),
}));

const mockSignUp = jest.fn();
const mockUseAuth = useAuth as jest.Mock; // Keep actual useAuth structure
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    signUp: mockSignUp,
    loading: false,
    currentUser: null,
  })),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock EULA_TEXT if it's very large or causes issues in test logs
jest.mock('@/lib/constants', () => ({
  EULA_TEXT: "This is a mock EULA text.",
}));


// --- Test Suite ---
describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset searchParams mock for each test if needed, or set specific mocks per test
    (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param: string) => 'hco') 
    });
  });

  it('displays the correct registration type description for HCO', () => {
    render(<SignupPage />);
    expect(screen.getByText(/Health Care Organization \/ Laboratory representative\./)).toBeInTheDocument();
  });

  it('displays the correct registration type description for EHR Vendor', () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn((param: string) => 'vendor') });
    render(<SignupPage />);
    expect(screen.getByText(/EHR\/LIMS Vendor representative\./)).toBeInTheDocument();
  });

  it('displays the correct registration type description for Health System', () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn((param: string) => 'healthsystem') });
    render(<SignupPage />);
    expect(screen.getByText(/Health System representative\./)).toBeInTheDocument();
  });
  
  it('calls signUp with correct parameters when EULA is accepted', async () => {
    const mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn((param: string) => 'vendor') }); // Test with 'vendor' type

    mockSignUp.mockResolvedValue({ uid: 'test-user-uid', email: 'test@example.com' }); // Simulate successful signup

    render(<SignupPage />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Vendor User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'vendor@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    
    // Submit form to open EULA
    fireEvent.click(screen.getByRole('button', { name: /Proceed to EULA & Create Account/i }));

    // Wait for EULA dialog and accept it
    // EULA dialog content might not be fully testable with simple queries if it's a complex component from a library
    // We assume the dialog opens and we can find the "I Agree" button.
    await waitFor(() => {
        expect(screen.getByText(/End-User License Agreement \(EULA\)/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Create Account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'vendor@example.com',
        'password123',
        'Vendor User',
        'vendor', // This should come from the mocked useSearchParams
        '1234567890'
      );
    });

    // Check for redirection after successful signup
    await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/vendor-registration');
    });
  });

  it('shows password mismatch error', async () => {
    const mockToast = jest.fn();
    (require('@/hooks/use-toast') as any).useToast = () => ({ toast: mockToast });

    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password différent' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Proceed to EULA & Create Account/i }));

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Password Mismatch",
        variant: "destructive"
    }));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
