const assert = require("node:assert/strict");
const test = require("node:test");

const tax = require("../tax-australia.js");

function calculate(options) {
  return tax.calculateTakeHome({
    amount: 100000,
    payBasis: "annual",
    residency: "resident",
    hoursPerWeek: 38,
    medicareProfile: "standard",
    superMode: "onTop",
    ...options
  });
}

test("keeps the existing no-deduction result stable", () => {
  const result = calculate();

  assert.equal(result.taxableIncome, 100000);
  assert.equal(result.deductions.total, 0);
  assert.equal(result.totalTax, 22788);
  assert.equal(result.takeHome.annual, 77212);
  assert.equal(result.afterExpenses.annual, 77212);
});

test("applies apportioned other deductions to taxable income", () => {
  const result = calculate({
    deductions: {
      otherExpenses: "2,000",
      otherWorkUsePercent: "50"
    }
  });

  assert.equal(result.deductions.otherExpensesGross, 2000);
  assert.equal(result.deductions.otherWorkUsePercent, 0.5);
  assert.equal(result.deductions.otherDeductible, 1000);
  assert.equal(result.deductions.total, 1000);
  assert.equal(result.taxableIncome, 99000);
  assert.equal(result.totalTax, 22468);
  assert.equal(result.taxSavedFromDeductions, 320);
  assert.equal(result.takeHome.annual, 77532);
  assert.equal(result.afterExpenses.annual, 76532);
});

test("calculates work from home fixed-rate deductions with cents disregarded", () => {
  const result = calculate({
    amount: 0,
    deductions: {
      workFromHomeHours: 843
    }
  });

  assert.equal(result.deductions.workFromHomeRate, 0.7);
  assert.equal(result.deductions.workFromHome, 590);
  assert.equal(result.deductions.total, 590);
});

test("uses taxable income after deductions for LITO", () => {
  const result = calculate({
    amount: 40000,
    deductions: {
      otherExpenses: 5000,
      otherWorkUsePercent: 100
    }
  });

  assert.equal(result.taxableIncome, 35000);
  assert.equal(result.litoEntitlement, 700);
  assert.equal(result.litoApplied, 700);
  assert.equal(result.incomeTax, 1988);
});
