import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { auth, db } from '@/lib/firebase'; // Will be mocked
import { UserProfile, UserType, PhaUser } from '@/types'; // Actual types
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

// --- Mocks ---
jest.mock('@/lib/firebase', () => ({
  auth: {
    // Mock methods used by onAuthStateChanged or other direct calls if any
  },
  db: {}, // Mock db object
}));

jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'), // Import and retain default exports
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(), // if used directly in context, though usually in actions
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/actions/user-actions', () => ({
  getPhaUserByUsernameAction: jest.fn(),
}));

// --- Helper Test Component ---
const TestConsumerComponent = () => {
  const authData = useAuth();
  return (
    <div>
      <div data-testid="loading">{JSON.stringify(authData.loading)}</div>
      <div data-testid="currentUser">{JSON.stringify(authData.currentUser?.email)}</div>
      <div data-testid="userProfile">{JSON.stringify(authData.userProfile)}</div>
      <div data-testid="userType">{authData.userType}</div>
      <div data-testid="isPhaUser">{JSON.stringify(authData.isPhaUser)}</div>
      <button onClick={() => authData.signUp('test@example.com', 'password123', 'Test User', 'hco', '1234567890')}>SignUp</button>
    </div>
  );
};

// --- Test Suite ---
describe('AuthContext', () => {
  let mockAuthUser: User;
  let mockPhaUserFirestoreData: Partial<PhaUser>; // For phaUsers collection

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      // Add other User properties if needed by the context
    } as User;

    mockPhaUserFirestoreData = {
        name: 'PHA Test User',
        email: 'pha@example.com', // Can be different from authUser.email if authUid matches
        authUid: 'test-uid', // Important for fallback
        role: 'Admin',
        program: 'Case Reporting',
        createdAt: Timestamp.now(), // Use the mocked Timestamp
    };

    // Default onAuthStateChanged to call back with null user
    (onAuthStateChanged as jest.Mock).mockImplementation((authParam, callback) => {
      // Simulate initial state or logged-out state
      Promise.resolve().then(() => callback(null)); 
      return jest.fn(); // Return a mock unsubscribe function
    });
  });

  describe('signUp functionality', () => {
    it('should create a Firebase Auth user and a UserProfile in Firestore', async () => {
      const mockUserCredential = { user: mockAuthUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (Timestamp.now as jest.Mock).mockReturnValue({ seconds: 12345, nanoseconds: 0 });


      const TestComponent = () => {
        const { signUp } = useAuth();
        return <button onClick={() => signUp('new@example.com', 'password123', 'New User', 'hco', '1234567890')}>SignUp</button>;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByText('SignUp').click();
      });
      
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'new@example.com', 'password123');
      });
      expect(updateProfile).toHaveBeenCalledWith(mockAuthUser, { displayName: 'New User' });
      
      const expectedUserProfileData: UserProfile = {
        uid: 'test-uid',
        email: 'new@example.com', // or mockAuthUser.email if it's updated by auth
        displayName: 'New User',
        userType: 'HCO',
        createdAt: { seconds: 12345, nanoseconds: 0 } as Timestamp,
        phone: '1234567890',
      };
      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'userProfiles', 'test-uid'), // doc needs to be mocked to return a ref path
        expectedUserProfileData
      );
    });
  });

  describe('onAuthStateChanged functionality', () => {
    it('should fetch UserProfile and set userType if profile exists in userProfiles', async () => {
        const userProfileData: UserProfile = {
            uid: 'test-uid', email: 'test@example.com', displayName: 'Test User', 
            userType: 'EHR_VENDOR', createdAt: Timestamp.now()
        };
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => userProfileData });

        (onAuthStateChanged as jest.Mock).mockImplementation((authParam, callback) => {
            callback(mockAuthUser); // Simulate user login
            return jest.fn(); // unsubscribe
        });
        
        const { findByTestId } = render(<AuthProvider><TestConsumerComponent /></AuthProvider>);

        expect(await findByTestId('userType')).toHaveTextContent('EHR_VENDOR');
        expect(await findByTestId('userProfile')).toHaveTextContent(JSON.stringify(userProfileData));
        expect(await findByTestId('isPhaUser')).toHaveTextContent('false');
    });

    it('should fall back to phaUsers and set userType to PHA if UserProfile not found but phaUser exists', async () => {
        (getDoc as jest.Mock).mockResolvedValue({ exists: () => false }); // No UserProfile
        (getDocs as jest.Mock).mockResolvedValue({ // Mock for phaUsers query
            empty: false,
            docs: [{ data: () => mockPhaUserFirestoreData }]
        });

        (onAuthStateChanged as jest.Mock).mockImplementation((authParam, callback) => {
            callback(mockAuthUser);
            return jest.fn();
        });

        const { findByTestId } = render(<AuthProvider><TestConsumerComponent /></AuthProvider>);

        expect(await findByTestId('userType')).toHaveTextContent('PHA');
        expect(await findByTestId('isPhaUser')).toHaveTextContent('true');
        // Check that a UserProfile-like object was constructed
        const userProfileText = (await findByTestId('userProfile')).textContent;
        expect(userProfileText).toContain('"userType":"PHA"');
        expect(userProfileText).toContain(`"uid":"${mockAuthUser.uid}"`);
    });


    it('should reset states on logout (onAuthStateChanged with null)', async () => {
       // Initial setup with a logged-in user
        const userProfileData: UserProfile = {
            uid: 'test-uid', email: 'test@example.com', displayName: 'Test User', 
            userType: 'HCO', createdAt: Timestamp.now()
        };
        (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => userProfileData });
        
        let authCallback: (user: User | null) => void = () => {};
        (onAuthStateChanged as jest.Mock).mockImplementation((authParam, callback) => {
            authCallback = callback;
            callback(mockAuthUser); // Initial login
            return jest.fn(); // unsubscribe
        });

        const { findByTestId, queryByText } = render(<AuthProvider><TestConsumerComponent /></AuthProvider>);
        expect(await findByTestId('userType')).toHaveTextContent('HCO');

        // Simulate logout
        await act(async () => {
            authCallback(null);
        });
        
        expect(await findByTestId('userType')).toBeEmptyDOMElement();
        expect(await findByTestId('userProfile')).toHaveTextContent("null");
        expect(await findByTestId('isPhaUser')).toHaveTextContent('false');
        expect(await findByTestId('currentUser')).toHaveTextContent("null");
    });
  });
});

// Mock implementation for doc to make it usable in setDoc/getDoc calls
(doc as jest.Mock).mockImplementation((dbMock, collectionPath, docId) => {
  return { path: `${collectionPath}/${docId}` }; // Return a simple object path for testing
});

// Mock implementation for collection (if needed directly, though less common in context tests)
(collection as jest.Mock).mockImplementation((dbMock, collectionPath) => {
  return { path: collectionPath };
});
(query as jest.Mock).mockImplementation((collectionRef, ...constraints) => {
    return { collectionRef, constraints }; // Simple mock
});
(where as jest.Mock).mockImplementation((fieldPath, opStr, value) => {
    return { fieldPath, opStr, value }; // Simple mock
});
(limit as jest.Mock).mockImplementation(num => ({ limit: num }));
