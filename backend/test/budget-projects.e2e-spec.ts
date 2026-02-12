import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Budget Projects E2E Tests', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let authToken: string;
  let projectId: string;
  let planRowId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@alphastarav.com',
        password: 'Admin@123!',
      })
      .expect(200);

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (connection) {
      await connection.collection('budgetprojects').deleteMany({
        name: /E2E Test/,
      });
      await connection.collection('budgetplanrows').deleteMany({});
      await connection.collection('budgetactuals').deleteMany({});
      await connection.collection('budgetauditlog').deleteMany({});
    }
    await app.close();
  });

  describe('E2E Test 1: Project Creation Flow', () => {
    it('should create project → verify plan rows → enter planned amounts → verify totals', async () => {
      // Step 1: Create project
      const createResponse = await request(app.getHttpServer())
        .post('/api/budget-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Project 2025',
          templateType: 'RSAF',
          dateRange: {
            start: '2025-01-01',
            end: '2025-12-31',
          },
          currency: 'USD',
          aircraftScope: {
            type: 'type',
            aircraftTypes: ['A330'],
          },
        })
        .expect(201);

      projectId = createResponse.body._id;
      expect(createResponse.body.name).toBe('E2E Test Project 2025');
      expect(createResponse.body.templateType).toBe('RSAF');

      // Step 2: Verify plan rows were generated
      const tableDataResponse = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(tableDataResponse.body.rows).toBeDefined();
      expect(tableDataResponse.body.rows.length).toBeGreaterThan(0);
      
      // Store first plan row ID for later use
      planRowId = tableDataResponse.body.rows[0]._id;

      // Step 3: Enter planned amounts
      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/plan-row/${planRowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plannedAmount: 50000,
        })
        .expect(200);

      // Step 4: Verify totals
      const updatedTableData = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedTableData.body.grandTotal.budgeted).toBeGreaterThanOrEqual(50000);
      
      // Find the updated row
      const updatedRow = updatedTableData.body.rows.find(
        (r: any) => r._id === planRowId
      );
      expect(updatedRow.plannedAmount).toBe(50000);
    });
  });

  describe('E2E Test 2: Data Entry Flow', () => {
    it('should open project → edit cell → save → verify total → refresh → verify persisted', async () => {
      // Step 1: Get table data
      const tableDataResponse = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const firstRow = tableDataResponse.body.rows[0];
      const period = '2025-01';

      // Step 2: Edit cell (enter actual spend)
      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/actual/${period}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          termId: firstRow.termId,
          amount: 5000,
        })
        .expect(200);

      // Step 3: Verify total updated
      const updatedTableData = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedTableData.body.grandTotal.spent).toBeGreaterThanOrEqual(5000);
      expect(updatedTableData.body.columnTotals[period]).toBeGreaterThanOrEqual(5000);

      // Step 4: Refresh (get data again)
      const refreshedTableData = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 5: Verify persisted
      expect(refreshedTableData.body.grandTotal.spent).toBeGreaterThanOrEqual(5000);
      const refreshedRow = refreshedTableData.body.rows.find(
        (r: any) => r.termId === firstRow.termId
      );
      expect(refreshedRow.actuals[period]).toBe(5000);
    });
  });

  describe('E2E Test 3: Analytics Flow', () => {
    it('should enter actuals → open analytics → verify KPIs → apply filters → verify charts', async () => {
      // Step 1: Enter actuals for multiple months
      const tableDataResponse = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const firstRow = tableDataResponse.body.rows[0];

      // Enter actuals for Jan, Feb, Mar
      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/actual/2025-01`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          termId: firstRow.termId,
          amount: 5000,
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/actual/2025-02`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          termId: firstRow.termId,
          amount: 6000,
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/actual/2025-03`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          termId: firstRow.termId,
          amount: 7000,
        })
        .expect(200);

      // Step 2: Get KPIs
      const kpisResponse = await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/kpis`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 3: Verify KPIs
      expect(kpisResponse.body.totalSpent).toBeGreaterThanOrEqual(18000);
      expect(kpisResponse.body.burnRate).toBeGreaterThan(0);
      expect(kpisResponse.body.remainingBudget).toBeDefined();

      // Step 4: Apply filters and get monthly spend
      const monthlySpendResponse = await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/monthly-spend`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(200);

      // Step 5: Verify charts data
      expect(monthlySpendResponse.body).toBeInstanceOf(Array);
      expect(monthlySpendResponse.body.length).toBeGreaterThan(0);

      // Get cumulative spend
      const cumulativeSpendResponse = await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/cumulative-spend`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cumulativeSpendResponse.body).toBeInstanceOf(Array);
      expect(cumulativeSpendResponse.body.length).toBeGreaterThan(0);
    });
  });

  describe('E2E Test 4: Export Flow', () => {
    it('should create project → export Excel → verify download → export PDF → verify generated', async () => {
      // Step 1: Project already created in previous tests

      // Step 2: Export to Excel
      const excelExportResponse = await request(app.getHttpServer())
        .get(`/api/budget-export/${projectId}/excel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 3: Verify download (check headers and content type)
      expect(excelExportResponse.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(excelExportResponse.headers['content-disposition']).toContain('attachment');
      expect(excelExportResponse.body).toBeDefined();
      expect(excelExportResponse.body.length).toBeGreaterThan(0);

      // Step 4: Export PDF (Note: PDF export is client-side, so we verify the data endpoint)
      const pdfDataResponse = await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/kpis`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 5: Verify PDF data is available
      expect(pdfDataResponse.body).toBeDefined();
      expect(pdfDataResponse.body.totalBudgeted).toBeDefined();
      expect(pdfDataResponse.body.totalSpent).toBeDefined();

      // Verify all chart endpoints are accessible for PDF generation
      await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/monthly-spend`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/cumulative-spend`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/budget-analytics/${projectId}/spend-distribution`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Additional Integration Tests', () => {
    it('should handle audit trail correctly', async () => {
      // Get audit log
      const auditResponse = await request(app.getHttpServer())
        .get(`/api/budget-audit/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(auditResponse.body).toBeInstanceOf(Array);
      expect(auditResponse.body.length).toBeGreaterThan(0);

      // Verify audit entries have required fields
      const firstEntry = auditResponse.body[0];
      expect(firstEntry.projectId).toBe(projectId);
      expect(firstEntry.userId).toBeDefined();
      expect(firstEntry.timestamp).toBeDefined();
      expect(firstEntry.action).toBeDefined();
    });

    it('should handle authorization correctly', async () => {
      // Try to delete project without Admin role (should fail)
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'editor@alphastarav.com',
          password: 'Editor@123!',
        })
        .expect(200);

      const editorToken = loginResponse.body.token;

      await request(app.getHttpServer())
        .delete(`/api/budget-projects/${projectId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);
    });

    it('should validate input correctly', async () => {
      // Try to create project with missing required fields
      await request(app.getHttpServer())
        .post('/api/budget-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Project',
          // Missing templateType, dateRange, currency, aircraftScope
        })
        .expect(400);

      // Try to enter negative amount
      await request(app.getHttpServer())
        .patch(`/api/budget-projects/${projectId}/actual/2025-04`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          termId: 'off-base-maint-intl',
          amount: -1000,
        })
        .expect(400);
    });

    it('should handle filters correctly', async () => {
      // Test year filter on project list
      const projectsResponse = await request(app.getHttpServer())
        .get('/api/budget-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year: 2025 })
        .expect(200);

      expect(projectsResponse.body).toBeInstanceOf(Array);
      
      // All projects should have date ranges overlapping 2025
      projectsResponse.body.forEach((project: any) => {
        const startYear = new Date(project.dateRange.start).getFullYear();
        const endYear = new Date(project.dateRange.end).getFullYear();
        expect(startYear <= 2025 && endYear >= 2025).toBe(true);
      });
    });

    it('should calculate totals correctly', async () => {
      // Get table data
      const tableDataResponse = await request(app.getHttpServer())
        .get(`/api/budget-projects/${projectId}/table-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify row totals
      tableDataResponse.body.rows.forEach((row: any) => {
        const calculatedTotal = Object.values(row.actuals).reduce(
          (sum: number, val: any) => sum + (val || 0),
          0
        );
        expect(row.totalSpent).toBe(calculatedTotal);
      });

      // Verify column totals
      const periods = tableDataResponse.body.periods;
      periods.forEach((period: string) => {
        const calculatedColumnTotal = tableDataResponse.body.rows.reduce(
          (sum: number, row: any) => sum + (row.actuals[period] || 0),
          0
        );
        expect(tableDataResponse.body.columnTotals[period]).toBe(calculatedColumnTotal);
      });

      // Verify grand total
      const calculatedGrandTotalSpent = tableDataResponse.body.rows.reduce(
        (sum: number, row: any) => sum + row.totalSpent,
        0
      );
      expect(tableDataResponse.body.grandTotal.spent).toBe(calculatedGrandTotalSpent);
    });
  });
});
