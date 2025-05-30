import { test, expect, Page } from '@playwright/test';
import { HealthSystem, Enrollment } from '@/types'; // Assuming types are available

// Mock Data
const MOCK_PHA_USER = {
  uid: 'pha-user-test-001',
  displayName: 'PHA Tester',
  email: 'pha.tester@example.com',
  userType: 'PHA', // Or however your PHA user is identified
  isPhaUser: true, // Assuming a flag like this might exist
  // Add other necessary fields from your User type
};

const mockHealthSystems: HealthSystem[] = [
  {
    id: 'hs-001',
    name: 'Alpha Health System',
    contactEmail: 'contact@alpha.org',
    registeredByUserId: 'user-alpha-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'John Alpha',
    contactPhone: '111-222-3333',
    address: { street: '1 Alpha Way', city: 'Alphaville', state: 'AS', zip: '10001', country: 'USA'},
    primaryContactNpi: '1234500001',
    status: 'active',
  },
  {
    id: 'hs-002',
    name: 'Beta Health Network',
    contactEmail: 'info@beta.net',
    registeredByUserId: 'user-beta-456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Jane Beta',
    contactPhone: '222-333-4444',
    address: { street: '2 Beta Blvd', city: 'Betatown', state: 'BS', zip: '20002', country: 'USA'},
    primaryContactNpi: '1234500002',
    status: 'active',
  },
  {
    id: 'hs-003',
    name: 'Gamma Care Alliance', // This HS will have no affiliated HCOs in mock data
    contactEmail: 'support@gamma.care',
    registeredByUserId: 'user-gamma-789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactName: 'Sam Gamma',
    contactPhone: '333-444-5555',
    address: { street: '3 Gamma Circle', city: 'Gammacity', state: 'GS', zip: '30003', country: 'USA'},
    primaryContactNpi: '1234500003',
    status: 'pending',
  },
];

const mockEnrollments: Enrollment[] = [
  // HCO 1 for Alpha Health System
  {
    id: 'hco-001',
    organizationInformation: { name: 'Alpha General Hospital', npi: '111000001', type: 'Hospital' },
    practiceInformation: { healthSystem: 'hs-001', address: { street: '10 Health Rd', city: 'Alphaville', state: 'AS', zip: '10011', country: 'USA'} },
    status: 'Approved',
    // Fill minimal required fields for Enrollment type
    providerInformation: { name: 'Dr. A', npi: '1111111111', email: 'dra@alpha.com', phone: '123-123-0001'},
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Admin A', email: 'admina@alpha.com', phone: '123-123-0002'},
    ehrInformation: { systemName: 'EHRAlpha', version: 'v1', isCertified: true, certificationId: 'certA1'},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user',
  },
  // HCO 2 for Alpha Health System
  {
    id: 'hco-002',
    organizationInformation: { name: 'Alpha Specialty Clinic', npi: '111000002', type: 'Clinic' },
    practiceInformation: { healthSystem: 'hs-001', address: { street: '20 Wellness Ave', city: 'Alphaville', state: 'AS', zip: '10012', country: 'USA'} },
    status: 'Submitted',
    providerInformation: { name: 'Dr. B', npi: '2222222222', email: 'drb@alpha.com', phone: '123-123-0003'},
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Admin B', email: 'adminb@alpha.com', phone: '123-123-0004'},
    ehrInformation: { systemName: 'EHRAlpha', version: 'v2', isCertified: true, certificationId: 'certA2'},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user',
  },
  // HCO 1 for Beta Health Network
  {
    id: 'hco-003',
    organizationInformation: { name: 'Beta Urgent Care', npi: '222000001', type: 'Urgent Care' },
    practiceInformation: { healthSystem: 'hs-002', address: { street: '30 Care St', city: 'Betatown', state: 'BS', zip: '20021', country: 'USA'} },
    status: 'Processing',
    providerInformation: { name: 'Dr. C', npi: '3333333333', email: 'drc@beta.com', phone: '234-234-0001'},
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Admin C', email: 'adminc@beta.com', phone: '234-234-0002'},
    ehrInformation: { systemName: 'EHRBeta', version: 'v1b', isCertified: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user',
  },
  // HCO not affiliated with any of the above for testing robustness
   {
    id: 'hco-004',
    organizationInformation: { name: 'Independent Lab', npi: '333000001', type: 'Laboratory' },
    practiceInformation: { healthSystem: 'hs-other', address: { street: '40 Independent Dr', city: 'UnrelatedCity', state: 'IS', zip: '40041', country: 'USA'} },
    status: 'Approved',
    providerInformation: { name: 'Dr. D', npi: '4444444444', email: 'drd@independent.com', phone: '345-345-0001'},
    billingInformation: { sameAsPracticeAddress: true },
    primaryContact: { name: 'Admin D', email: 'admind@independent.com', phone: '345-345-0002'},
    ehrInformation: { systemName: 'EHRIndependent', version: 'vX', isCertified: true, certificationId: 'certInd'},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedByUserId: 'some-user',
  },
];

// Helper to setup mocks
async function setupMocksForPHATab(page: Page) {
  // Mock Firebase Auth (useAuth)
  await page.addInitScript((mockUser) => {
    (window as any).__mockAuth = {
      currentUser: mockUser,
      loading: false,
      // Add other auth functions if HealthSystemsTab or its parents use them
      isPhaUser: true, // Specific for PHA context
      isHealthSystemUser: false,
      isVendorUser: false,
    };
  }, MOCK_PHA_USER);

  // Mock AppContext (useAppContext)
  await page.addInitScript(({ healthSystems, enrollments }) => {
    (window as any).__mockAppContext = {
      healthSystems,
      enrollments,
      loading: false, // Important: set to false for tests assuming data is loaded
      // users: [], // Add if tab relies on users from context
      // vendors: [], // Add if tab relies on vendors from context
      // etc.
    };
  }, { healthSystems: mockHealthSystems, enrollments: mockEnrollments });

  // Intercept calls to context modules
  await page.route('**/src/context/AuthContext.tsx', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from 'react';
        export const useAuth = () => (window as any).__mockAuth;
      `,
    });
  });

  await page.route('**/src/context/AppContext.tsx', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        import React from 'react';
        export const useAppContext = () => (window as any).__mockAppContext;
      `,
    });
  });
}

test.describe('HealthSystemsTab for PHA User', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocksForPHATab(page);
    // Navigate to the page where HealthSystemsTab is rendered.
    // This assumes /admin is the correct page and it renders the relevant tabs for a PHA user.
    // If HealthSystemsTab is part of a more complex routing or conditional rendering,
    // this navigation might need to be adjusted, or a dedicated test page might be needed.
    await page.goto('/admin'); // TODO: Confirm this is the correct page or adjust.

    // It's also possible the tab needs to be clicked if it's not default
    // For example: await page.getByRole('tab', { name: /Health Systems/i }).click();
    // For now, assuming it's visible on /admin load for a PHA user or is the default tab.
  });

  test('should display the Health Systems table with correct data', async ({ page }) => {
    // Verify the table itself is visible
    const healthSystemsTable = page.getByRole('table'); // Adjust selector if needed
    await expect(healthSystemsTable).toBeVisible();

    // Check for table headers (optional, but good practice)
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Contact Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Affiliated HCO Count' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();

    // Verify data for Alpha Health System
    const alphaRow = healthSystemsTable.getByRole('row', { name: /Alpha Health System/i });
    await expect(alphaRow.getByRole('cell', { name: 'Alpha Health System' })).toBeVisible();
    await expect(alphaRow.getByRole('cell', { name: 'contact@alpha.org' })).toBeVisible();
    await expect(alphaRow.getByRole('cell', { name: '2' })).toBeVisible(); // 2 HCOs for Alpha
    await expect(alphaRow.getByRole('cell', { name: 'active' })).toBeVisible();

    // Verify data for Beta Health Network
    const betaRow = healthSystemsTable.getByRole('row', { name: /Beta Health Network/i });
    await expect(betaRow.getByRole('cell', { name: 'Beta Health Network' })).toBeVisible();
    await expect(betaRow.getByRole('cell', { name: 'info@beta.net' })).toBeVisible();
    await expect(betaRow.getByRole('cell', { name: '1' })).toBeVisible(); // 1 HCO for Beta
    await expect(betaRow.getByRole('cell', { name: 'active' })).toBeVisible();

    // Verify data for Gamma Care Alliance (0 HCOs)
    const gammaRow = healthSystemsTable.getByRole('row', { name: /Gamma Care Alliance/i });
    await expect(gammaRow.getByRole('cell', { name: 'Gamma Care Alliance' })).toBeVisible();
    await expect(gammaRow.getByRole('cell', { name: 'support@gamma.care' })).toBeVisible();
    await expect(gammaRow.getByRole('cell', { name: '0' })).toBeVisible(); // 0 HCOs for Gamma
    await expect(gammaRow.getByRole('cell', { name: 'pending' })).toBeVisible();
  });

  test('should not show loading or empty states when data is present', async ({ page }) => {
    // Ensure loading spinner is not present
    await expect(page.getByText(/Loading Health Systems.../i)).not.toBeVisible();
    await expect(page.locator('.animate-spin')).not.toBeVisible(); // Common class for spinners

    // Ensure "no health systems" message is not present
    await expect(page.getByText(/No health systems registered yet/i)).not.toBeVisible();
  });

  test('should display "No health systems registered yet" if no health systems exist', async ({ page }) => {
    // Override AppContext for this specific test
    await page.addInitScript(() => {
      (window as any).__mockAppContext.healthSystems = [];
      (window as any).__mockAppContext.enrollments = []; // Also clear enrollments
    });
    await page.reload(); // Reload to apply new context

    await expect(page.getByText(/No health systems registered yet/i)).toBeVisible();
    await expect(page.getByRole('table')).not.toBeVisible(); // Table should not be there
  });

  test('should show loading state when AppContext is loading', async ({ page }) => {
    // Override AppContext for this specific test
    await page.addInitScript(() => {
      (window as any).__mockAppContext.loading = true;
    });
    await page.reload(); // Reload to apply new context

    await expect(page.getByText(/Loading Health Systems.../i)).toBeVisible();
    // Or check for a specific loader element if one is used, e.g.
    // await expect(page.locator('div[role="status"].spinner')).toBeVisible();
  });
});
