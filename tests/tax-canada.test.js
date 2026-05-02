const assert = require("node:assert/strict");
const test = require("node:test");

const tax = require("../tax-canada.js");

function calculate(options) {
  return tax.calculateTakeHome({
    amount: 100000,
    payBasis: "annual",
    province: "ON",
    hoursPerWeek: 40,
    deductions: {
      annual: 0
    },
    ...options
  });
}

test("calculates standard Ontario annual employment estimate", () => {
  const result = calculate();

  assert.equal(result.supported, true);
  assert.equal(result.grossAnnualIncome, 100000);
  assert.equal(result.cpp.base, 3519.45);
  assert.equal(result.cpp.firstAdditional, 711);
  assert.equal(result.cpp.secondAdditional, 416);
  assert.equal(result.cpp.total, 4646.45);
  assert.equal(result.eiPremium, 1123.07);
  assert.equal(result.taxableIncome, 98873);
  assert.equal(result.federal.tax, 13301.6);
  assert.equal(result.provincial.surtax, 25.79);
  assert.equal(result.provincial.healthPremium, 750);
  assert.equal(result.provincial.tax, 6722.75);
  assert.equal(result.totalTaxAndContributions, 25793.87);
  assert.equal(result.takeHome.annual, 74206.13);
});

test("applies annual deductions before calculating Canada income tax", () => {
  const result = calculate({
    deductions: {
      annual: "5,000"
    }
  });

  assert.equal(result.deductionAnnual, 5000);
  assert.equal(result.taxableIncome, 93873);
  assert.equal(result.afterDeductions.annual, 70714.42);
});

test("supports province-specific rates", () => {
  const britishColumbia = calculate({ province: "BC" });
  const alberta = calculate({ province: "AB" });

  assert.equal(britishColumbia.provinceName, "British Columbia");
  assert.equal(britishColumbia.provincial.tax, 5380);
  assert.equal(alberta.provinceName, "Alberta");
  assert.equal(alberta.provincial.tax, 6470.38);
});

test("calculates Quebec with QPP, QPIP, Quebec tax, and federal abatement", () => {
  const result = calculate({ province: "QC" });

  assert.equal(result.supported, true);
  assert.equal(result.provinceName, "Quebec");
  assert.equal(result.pensionPlanName, "QPP");
  assert.equal(result.cpp.base, 3768.3);
  assert.equal(result.cpp.firstAdditional, 711);
  assert.equal(result.cpp.secondAdditional, 416);
  assert.equal(result.cpp.total, 4895.3);
  assert.equal(result.eiPremium, 895.7);
  assert.equal(result.qpipPremium, 430);
  assert.equal(result.federalTaxableIncome, 98873);
  assert.equal(result.provincialTaxableIncome, 97423);
  assert.equal(result.quebecWorkerDeduction, 1450);
  assert.equal(result.federal.abatement, 2184.33);
  assert.equal(result.federal.tax, 11054.06);
  assert.equal(result.provincial.tax, 13139.84);
  assert.equal(result.totalTaxAndContributions, 30414.9);
  assert.equal(result.takeHome.annual, 69585.1);
});
