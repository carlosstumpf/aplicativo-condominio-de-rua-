/**
 * Billing Dashboard Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getBillingStats,
  getBatchBillingStats,
  getPaymentStatusBreakdown,
  getMonthlyBillingTrend,
  getMoradorPaymentStatus,
  getPaymentMethodBreakdown,
  getOverdueBillings,
  calculatePaymentForecast,
} from "@/server/_core/billing-analytics-db";

describe("Billing Analytics", () => {
  describe("getBillingStats", () => {
    it("should return overall billing statistics", async () => {
      const stats = await getBillingStats();

      expect(stats).toBeDefined();
      expect(stats.totalBillings).toBeGreaterThan(0);
      expect(stats.totalAmount).toBeGreaterThan(0);
      expect(stats.paidAmount).toBeLessThanOrEqual(stats.totalAmount);
      expect(stats.pendingAmount).toBeLessThanOrEqual(stats.totalAmount);
      expect(stats.overdueAmount).toBeLessThanOrEqual(stats.totalAmount);
      expect(stats.paymentRate).toBeGreaterThanOrEqual(0);
      expect(stats.paymentRate).toBeLessThanOrEqual(100);
    });

    it("should have consistent amount totals", async () => {
      const stats = await getBillingStats();
      const total = stats.paidAmount + stats.pendingAmount + stats.overdueAmount;

      expect(total).toBeLessThanOrEqual(stats.totalAmount + 0.01); // Allow for rounding
    });
  });

  describe("getBatchBillingStats", () => {
    it("should return batch billing statistics", async () => {
      const stats = await getBatchBillingStats(1);

      expect(stats).toBeDefined();
      expect(stats.batchId).toBe(1);
      expect(stats.totalMoradores).toBeGreaterThan(0);
      expect(stats.totalAmount).toBeGreaterThan(0);
      expect(stats.paidCount).toBeLessThanOrEqual(stats.totalMoradores);
      expect(stats.pendingCount).toBeLessThanOrEqual(stats.totalMoradores);
      expect(stats.overdueCount).toBeLessThanOrEqual(stats.totalMoradores);
      expect(stats.paymentRate).toBeGreaterThanOrEqual(0);
      expect(stats.paymentRate).toBeLessThanOrEqual(100);
    });

    it("should have consistent count totals", async () => {
      const stats = await getBatchBillingStats(1);
      const total = stats.paidCount + stats.pendingCount + stats.overdueCount;

      expect(total).toBeLessThanOrEqual(stats.totalMoradores);
    });
  });

  describe("getPaymentStatusBreakdown", () => {
    it("should return payment status breakdown", async () => {
      const breakdown = await getPaymentStatusBreakdown();

      expect(breakdown).toBeDefined();
      expect(breakdown.length).toBeGreaterThan(0);

      breakdown.forEach((item) => {
        expect(item.status).toBeDefined();
        expect(item.count).toBeGreaterThanOrEqual(0);
        expect(item.amount).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeLessThanOrEqual(100);
      });
    });

    it("should have percentages that sum to 100", async () => {
      const breakdown = await getPaymentStatusBreakdown();
      const totalPercentage = breakdown.reduce((sum, item) => sum + item.percentage, 0);

      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe("getMonthlyBillingTrend", () => {
    it("should return monthly billing trend", async () => {
      const trend = await getMonthlyBillingTrend(6);

      expect(trend).toBeDefined();
      expect(trend.length).toBe(6);

      trend.forEach((month) => {
        expect(month.month).toBeDefined();
        expect(month.totalBilled).toBeGreaterThan(0);
        expect(month.totalPaid).toBeGreaterThanOrEqual(0);
        expect(month.totalPending).toBeGreaterThanOrEqual(0);
        expect(month.paymentRate).toBeGreaterThanOrEqual(0);
        expect(month.paymentRate).toBeLessThanOrEqual(100);
      });
    });

    it("should return correct number of months", async () => {
      const trend3 = await getMonthlyBillingTrend(3);
      const trend12 = await getMonthlyBillingTrend(12);

      expect(trend3.length).toBe(3);
      expect(trend12.length).toBe(12);
    });
  });

  describe("getMoradorPaymentStatus", () => {
    it("should return morador payment status", async () => {
      const status = await getMoradorPaymentStatus(1);

      expect(status).toBeDefined();
      expect(status.moradorId).toBe(1);
      expect(status.moradorName).toBeDefined();
      expect(status.email).toBeDefined();
      expect(status.totalBilled).toBeGreaterThanOrEqual(0);
      expect(status.totalPaid).toBeGreaterThanOrEqual(0);
      expect(status.totalPending).toBeGreaterThanOrEqual(0);
      expect(status.totalOverdue).toBeGreaterThanOrEqual(0);
      expect(status.paymentRate).toBeGreaterThanOrEqual(0);
      expect(status.paymentRate).toBeLessThanOrEqual(100);
    });

    it("should have consistent amount totals", async () => {
      const status = await getMoradorPaymentStatus(1);
      const total = status.totalPaid + status.totalPending + status.totalOverdue;

      expect(total).toBeLessThanOrEqual(status.totalBilled + 0.01); // Allow for rounding
    });
  });

  describe("getPaymentMethodBreakdown", () => {
    it("should return payment method breakdown", async () => {
      const breakdown = await getPaymentMethodBreakdown();

      expect(breakdown).toBeDefined();
      expect(breakdown.length).toBeGreaterThan(0);

      breakdown.forEach((item) => {
        expect(item.status).toBeDefined();
        expect(["PIX", "Boleto", "Transferência"]).toContain(item.status);
        expect(item.count).toBeGreaterThanOrEqual(0);
        expect(item.amount).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("getOverdueBillings", () => {
    it("should return overdue billings", async () => {
      const overdue = await getOverdueBillings(10);

      expect(overdue).toBeDefined();
      expect(Array.isArray(overdue)).toBe(true);

      overdue.forEach((item) => {
        expect(item.totalOverdue).toBeGreaterThan(0);
      });
    });

    it("should respect limit parameter", async () => {
      const overdue5 = await getOverdueBillings(5);
      const overdue10 = await getOverdueBillings(10);

      expect(overdue5.length).toBeLessThanOrEqual(5);
      expect(overdue10.length).toBeLessThanOrEqual(10);
    });
  });

  describe("calculatePaymentForecast", () => {
    it("should return payment forecast", async () => {
      const forecast = await calculatePaymentForecast(1);

      expect(forecast).toBeDefined();
      expect(forecast.expectedDate).toBeInstanceOf(Date);
      expect(forecast.expectedAmount).toBeGreaterThan(0);
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(100);
    });

    it("should have future expected date", async () => {
      const forecast = await calculatePaymentForecast(1);
      const now = new Date();

      expect(forecast.expectedDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe("Billing Dashboard Integration", () => {
    it("should load all dashboard components", async () => {
      const stats = await getBillingStats();
      const breakdown = await getPaymentStatusBreakdown();
      const trend = await getMonthlyBillingTrend(6);
      const methods = await getPaymentMethodBreakdown();

      expect(stats).toBeDefined();
      expect(breakdown).toBeDefined();
      expect(trend).toBeDefined();
      expect(methods).toBeDefined();
    });

    it("should have consistent data across components", async () => {
      const stats = await getBillingStats();
      const breakdown = await getPaymentStatusBreakdown();

      const totalFromBreakdown = breakdown.reduce((sum, item) => sum + item.amount, 0);
      expect(totalFromBreakdown).toBeCloseTo(stats.totalAmount, -2); // Allow for rounding
    });

    it("should calculate payment rates correctly", async () => {
      const stats = await getBillingStats();
      const expectedRate = (stats.paidAmount / stats.totalAmount) * 100;

      expect(stats.paymentRate).toBeCloseTo(expectedRate, 1);
    });
  });
});
