import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  apiAuth,
  apiStaff,
  apiLeads,
  apiFollowUps,
  apiCustomers,
  apiProjects,
  apiPayments,
  apiActivity,
  apiDashboard,
} from '../src/services/api';
import { StaffProfile } from '../src/types';

describe('TinyPlayStudioz Security & Access Control Test Suite', () => {
  let superAdmin: StaffProfile;
  let salesA: StaffProfile;
  let salesB: StaffProfile;
  let disabledSales: StaffProfile;

  beforeAll(async () => {
    // Authenticate as Super Admin
    superAdmin = await apiAuth.loginWithStaffId('ADMIN-001', 'password123');

    // Dynamically provision test sales reps for security isolation tests
    salesA = await apiStaff.createStaff({
      staff_id: 'SALES-TEST-01',
      full_name: 'Test Salesperson Alpha',
      password: 'password123',
      role: 'SALES',
    });

    salesB = await apiStaff.createStaff({
      staff_id: 'SALES-TEST-02',
      full_name: 'Test Salesperson Beta',
      password: 'password123',
      role: 'SALES',
    });

    disabledSales = await apiStaff.createStaff({
      staff_id: 'SALES-TEST-DIS',
      full_name: 'Disabled Test Staff',
      password: 'password123',
      role: 'SALES',
    });
    await apiStaff.toggleActive(disabledSales.id, false);
  });

  beforeEach(async () => {
    // Return to Super Admin context before each test
    await apiAuth.loginWithStaffId('ADMIN-001', 'password123');
  });

  it('1. Super Admin can view company-wide activity history and financial reports', async () => {
    const logs = await apiActivity.listActivityLogs();
    expect(Array.isArray(logs)).toBe(true);

    const metrics = await apiDashboard.getMetrics(superAdmin);
    expect(metrics).toBeDefined();
    expect(Array.isArray(metrics.pipelineDistribution)).toBe(true);
    expect(Array.isArray(metrics.salesByStaff)).toBe(true);
  });

  it('2. Disabled staff account is blocked from CRM access', async () => {
    await expect(apiAuth.loginWithStaffId('SALES-TEST-DIS', 'password123')).rejects.toThrow(
      /deactivated|disabled/i
    );
  });

  it('3. Salesperson is restricted from viewing Activity Logs', async () => {
    // Log in as Salesperson
    await apiAuth.loginWithStaffId(salesA.staff_id, 'password123');

    // Attempting to list activity logs must throw unauthorized
    await expect(apiActivity.listActivityLogs()).rejects.toThrow(/Access denied|restricted/i);
  });

  it('4. Salesperson A cannot access unassigned leads of Salesperson B', async () => {
    // Sales B logs in and creates a lead
    await apiAuth.loginWithStaffId(salesB.staff_id, 'password123');
    const leadB = await apiLeads.createLead({
      customer_name: 'Confidential Client B',
      platform: 'Instagram',
      handle: `client_b_${Date.now()}`,
      game_type: '2D Platformer',
      estimated_budget_bdt: 25000,
      lead_source: 'Instagram DM',
      status: 'Interested',
      priority: 'Hot',
    });

    // Authenticate as Sales A
    await apiAuth.loginWithStaffId(salesA.staff_id, 'password123');

    // Lead B is assigned to Sales B; Sales A access must fail
    await expect(apiLeads.getLead(leadB.id)).rejects.toThrow(/Unauthorized/i);
  });

  it('5. End-to-End Business Flow: Admin creates staff -> Sales logs in -> Adds lead -> Follow-up -> Converts to Project -> Records payment -> Admin audits', async () => {
    // Step 1: Admin creates a new salesperson
    await apiAuth.loginWithStaffId('ADMIN-001', 'password123');
    const newStaffId = `SALES-${Date.now().toString().slice(-4)}`;
    const createdSales = await apiStaff.createStaff({
      staff_id: newStaffId,
      full_name: 'Live Pipeline Engineer',
      password: 'password123',
      role: 'SALES',
    });
    expect(createdSales.staff_id).toBe(newStaffId);
    expect(createdSales.is_active).toBe(true);

    // Step 2: Salesperson logs in
    const activeSales = await apiAuth.loginWithStaffId(newStaffId, 'password123');
    expect(activeSales.staff_id).toBe(newStaffId);

    // Step 3: Salesperson adds a potential customer (Lead)
    const newLead = await apiLeads.createLead({
      customer_name: 'Imtiaz Shovon',
      platform: 'Instagram',
      handle: `imtiaz_${Date.now()}`,
      phone: '+880 1711-889900',
      game_type: '2D Endless Runner',
      estimated_budget_bdt: 12000,
      lead_source: 'Instagram DM',
      status: 'Interested',
      priority: 'Hot',
      conversation_notes: 'Wants anniversary retro game',
      next_follow_up_at: new Date(Date.now() + 86400000).toISOString(),
      follow_up_reason: 'Call to review character sprite choices',
    });
    expect(newLead.id).toBeDefined();
    expect(newLead.customer_name).toBe('Imtiaz Shovon');
    expect(newLead.is_converted).toBe(false);

    // Step 4: Schedule and complete follow-up
    const followUp = await apiFollowUps.createFollowUp({
      lead_id: newLead.id,
      customer_name: newLead.customer_name,
      scheduled_at: new Date().toISOString(),
      reason: 'Call to confirm game specs',
    });
    expect(followUp.status).toBe('Pending');

    const completedFollowUp = await apiFollowUps.completeFollowUp(
      followUp.id,
      'Client agreed to 2D Endless Runner with Dhaka theme.'
    );
    expect(completedFollowUp.status).toBe('Completed');

    // Step 5: Convert lead into confirmed customer & active game project with advance payment
    const conversion = await apiLeads.convertLeadToCustomer(newLead.id, {
      game_title: 'Imtiaz: Old Dhaka Sprint',
      agreed_price_bdt: 12000,
      assigned_developer: 'Rakib',
      target_delivery_date: '2026-12-01',
      advance_payment: {
        amount_bdt: 6000,
        payment_method: 'bKash',
        transaction_ref: 'BK994821',
        notes: '50% booking advance payment',
      },
    });

    expect(conversion.contact.display_name).toBe('Imtiaz Shovon');
    expect(conversion.project.title).toBe('Imtiaz: Old Dhaka Sprint');
    expect(conversion.project.agreed_price_bdt).toBe(12000);
    expect(conversion.project.total_paid_bdt).toBe(6000);
    expect(conversion.project.remaining_balance_bdt).toBe(6000);
    expect(conversion.payment?.amount_bdt).toBe(6000);

    // Step 6: Record final payment
    const finalPayment = await apiPayments.recordPayment({
      project_id: conversion.project.id,
      amount_bdt: 6000,
      payment_type: 'Final',
      payment_method: 'bKash',
      transaction_ref: 'BK994822',
      payment_date: '2026-10-16',
      notes: 'Final delivery payment',
    });
    expect(finalPayment.amount_bdt).toBe(6000);

    // Verify remaining balance is automatically 0
    const updatedProject = await apiProjects.getProject(conversion.project.id);
    expect(updatedProject?.total_paid_bdt).toBe(12000);
    expect(updatedProject?.remaining_balance_bdt).toBe(0);

    // Step 7: Super Admin logs in and inspects complete audit trail
    await apiAuth.loginWithStaffId('ADMIN-001', 'password123');
    const logs = await apiActivity.listActivityLogs();
    const relatedLogs = logs.filter((l) =>
      l.description.includes(newStaffId) || l.description.includes('Imtiaz')
    );
    expect(relatedLogs.length).toBeGreaterThan(0);
  });

  it('6. Deletion Authorization: Super Admin can delete records; Salesperson is strictly blocked', async () => {
    // Authenticate as Super Admin and create a dummy lead
    await apiAuth.loginWithStaffId('ADMIN-001', 'password123');
    const testLead = await apiLeads.createLead({
      customer_name: 'Delete Test Customer',
      platform: 'Instagram',
      handle: `delete_test_${Date.now()}`,
      game_type: 'Puzzle',
      estimated_budget_bdt: 999,
      lead_source: 'Direct Message',
      status: 'New',
      priority: 'Cold',
    });

    // Step 1: Switch to Salesperson and attempt to delete the lead -> MUST FAIL
    await apiAuth.loginWithStaffId(salesA.staff_id, 'password123');
    await expect(apiLeads.deleteLead(testLead.id)).rejects.toThrow(/Unauthorized/i);

    // Step 2: Switch back to Super Admin and delete the lead -> MUST SUCCEED
    await apiAuth.loginWithStaffId('ADMIN-001', 'password123');
    await expect(apiLeads.deleteLead(testLead.id)).resolves.not.toThrow();

    // Verify lead is gone
    const deletedLead = await apiLeads.getLead(testLead.id);
    expect(deletedLead).toBeNull();
  });
});
