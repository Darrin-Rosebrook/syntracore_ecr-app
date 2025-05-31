import { test, expect, Page } from '@playwright/test';

// Mock data (will be filled in later)
const MOCK_USER_UID = 'test-hs-user-123';
const MOCK_HEALTH_SYSTEM_ID = 'hs-abc-789';

const mockHealthSystems = [
  {
    id: MOCK_HEALTH_SYSTEM_ID,
    name: 'Test Health System Alpha',
    registeredByUserId: MOCK_USER_UID,
    // Add other necessary fields for HealthSystem type
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Dr. Test',
    contactEmail: 'test@healthsystem.com',
    contactPhone: '123-456-7890',
    address: {
      street: '123 Health St',
      city: 'Testville',
      state: 'TS',
      zip: '12345',
      country: 'USA',
    },
    primaryContactNpi: '1234567890',
    status: 'active',
  },
  {
    id: 'other-hs-id-456',
    name: 'Other Health System Beta',
    registeredByUserId: 'other-user-789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Dr. Other',
    contactEmail: 'other@healthsystem.com',
    contactPhone: '987-654-3210',
    address: {
      street: '456 Care Ave',
      city: 'Othertown',
      state: 'OT',
      zip: '67890',
      country: 'USA',
    },
    primaryContactNpi: '0987654321',
    status: 'active',
  },
];

const mockEnrollments = [
  {
    id: 'hco1-mhs',
    organizationInformation: {
      name: 'HCO Alpha (Belongs to Test HS)',
      npi: '1112223331',
      type: 'Hospital',
    },
    practiceInformation: {
      healthSystem: MOCK_HEALTH_SYSTEM_ID,
      address: { street: '1 Main St', city: 'TestCityA', state: 'TS', zip: '10001', country: 'USA' },
    },
    status: 'Submitted',
    // Add other necessary fields for Enrollment type
    providerInformation: { name: 'Provider A', npi: '111000111', email: 'pa@hco.com', phone: '111-111-1111' },
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Contact A', email: 'ca@hco.com', phone: '111-222-1111' },
    ehrInformation: { systemName: 'EHR System A', version: '1.0', isCertified: true, certificationId: 'CERT1' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user-id',
  },
  {
    id: 'hco2-mhs',
    organizationInformation: {
      name: 'Lab Beta (Belongs to Test HS)',
      npi: '4445556662',
      type: 'Laboratory',
    },
    practiceInformation: {
      healthSystem: MOCK_HEALTH_SYSTEM_ID,
      address: { street: '2 Lab Rd', city: 'TestCityB', state: 'TS', zip: '10002', country: 'USA' },
    },
    status: 'Processing',
    providerInformation: { name: 'Provider B', npi: '222000222', email: 'pb@hco.com', phone: '222-111-1111' },
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Contact B', email: 'cb@hco.com', phone: '222-222-2222' },
    ehrInformation: { systemName: 'EHR System B', version: '2.0', isCertified: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user-id',
  },
  {
    id: 'hco3-other',
    organizationInformation: {
      name: 'HCO Gamma (Other HS)',
      npi: '7778889993',
      type: 'Clinic',
    },
    practiceInformation: {
      healthSystem: 'other-hs-id-456', // Belongs to a different health system
      address: { street: '3 Side St', city: 'Otherville', state: 'OT', zip: '20001', country: 'USA' },
    },
    status: 'Approved',
    providerInformation: { name: 'Provider C', npi: '333000333', email: 'pc@hco.com', phone: '333-111-1111' },
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Contact C', email: 'cc@hco.com', phone: '333-333-3333' },
    ehrInformation: { systemName: 'EHR System C', version: '3.0', isCertified: true, certificationId: 'CERT3' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user-id',
  },
];

async function setupMocks(page: Page) {
  // Mock Firebase Auth (useAuth)
  await page.addInitScript((MOCK_USER_UID) => {
    const mockAuth = {
      currentUser: {
        uid: MOCK_USER_UID,
        displayName: 'Test HS User',
        email: 'hsuser@test.com',
        // Add other properties if your component uses them
      },
      loading: false,
      logOut: async () => { console.log('Mock logout'); },
      // Add other functions/properties from useAuth if needed
    };
    (window as any).__mockAuth = mockAuth;
  }, MOCK_USER_UID);

  // Mock AppContext (useAppContext)
  await page.addInitScript(({ mockHealthSystems, mockEnrollments }) => {
    const mockAppContext = {
      healthSystems: mockHealthSystems,
      enrollments: mockEnrollments,
      loading: false,
      // Add other context values/functions if needed by the page
      // For example:
      // users: [],
      // vendors: [],
      // resources: [],
      // etc.
    };
    (window as any).__mockAppContext = mockAppContext;
  }, { mockHealthSystems, mockEnrollments });

  // Intercept calls to context modules and provide mocks
  await page.route('**/src/context/AuthContext.tsx', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from 'react';
        export const useAuth = () => (window as any).__mockAuth;
        // If AuthProvider is used directly, mock it too or ensure it's not rendered in test
      `,
    });
  });

  await page.route('**/src/context/AppContext.tsx', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from 'react';
        export const useAppContext = () => (window as any).__mockAppContext;
        // If AppProvider is used directly, mock it too
      `,
    });
  });
}


test.describe('Health System Portal Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/health-system-portal');
  });

  test('should display portal title and user information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Health System Portal: Test HS User/i })).toBeVisible();
  });

  test('should display HCOs associated with the logged-in Health System', async ({ page }) => {
    // Check for HCO Alpha
    await expect(page.getByRole('cell', { name: 'HCO Alpha (Belongs to Test HS)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '1112223331' })).toBeVisible(); // NPI for HCO Alpha
    await expect(page.getByRole('cell', { name: 'TestCityA' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'TS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Submitted' })).toBeVisible();


    // Check for Lab Beta
    await expect(page.getByRole('cell', { name: 'Lab Beta (Belongs to Test HS)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '4445556662' })).toBeVisible(); // NPI for Lab Beta
     await expect(page.getByRole('cell', { name: 'TestCityB' })).toBeVisible();

    // Ensure the table is visible
    const hcoTable = page.getByRole('table');
    await expect(hcoTable).toBeVisible();
    const rows = hcoTable.getByRole('row');
    await expect(rows).toHaveCount(3); // Header row + 2 data rows for this HS
  });

  test('should NOT display HCOs associated with other Health Systems', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'HCO Gamma (Other HS)' })).not.toBeVisible();
    await expect(page.getByRole('cell', { name: '7778889993' })).not.toBeVisible(); // NPI for HCO Gamma
  });

  test('should display "Register Individual HCO/Lab" section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Register Individual HCO\/Lab/i })).toBeVisible();
    const registerLink = page.getByRole('link', { name: /Go to HCO & Lab Registration Form/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/hco-registration');
  });

  test('should display "Bulk Upload HCOs/Labs" section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Bulk Upload HCOs\/Labs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload CSV \(Disabled\)/i })).toBeVisible();
    await expect(page.getByText(/Bulk Upload Coming Soon/i)).toBeVisible();
  });

  test('should show loading state if no health system ID found for user initially', async ({ page }) => {
    // Override mock for this specific test
    await page.addInitScript(() => {
      (window as any).__mockAuth.currentUser.uid = 'user-without-hs'; // UID not matching any healthSystem.registeredByUserId
    });
    await page.reload(); // Reload to apply the new init script for this test case

    await expect(page.getByText('Health System Not Identified')).toBeVisible();
    await expect(page.getByText(/We could not identify a Health System associated with your user account/)).toBeVisible();
  });

  test('should show empty state if health system identified but no HCOs are associated', async ({ page }) => {
    // Override mock for this specific test
    await page.addInitScript(({ MOCK_HEALTH_SYSTEM_ID_NO_HCOS }) => {
       // User is still MOCK_USER_UID, associated with MOCK_HEALTH_SYSTEM_ID
       // But we provide an empty enrollments list
      (window as any).__mockAppContext.enrollments = [];
    }, { MOCK_HEALTH_SYSTEM_ID }); // Pass MOCK_HEALTH_SYSTEM_ID for context

    await page.reload();

    await expect(page.getByText('No HCOs Found')).toBeVisible();
    await expect(page.getByText(/No HCOs or Labs are currently registered under your Health System/)).toBeVisible();
  });
});
