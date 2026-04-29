(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AustralianTax = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TAX_YEAR = "2025-26";
  const WEEKS_PER_YEAR = 52;
  const MONTHS_PER_YEAR = 12;
  const DEFAULT_HOURS_PER_WEEK = 38;

  const RESIDENT_BRACKETS = [
    { from: 0, to: 18200, rate: 0, label: "$0 - $18,200" },
    { from: 18200, to: 45000, rate: 0.16, label: "$18,201 - $45,000" },
    { from: 45000, to: 135000, rate: 0.3, label: "$45,001 - $135,000" },
    { from: 135000, to: 190000, rate: 0.37, label: "$135,001 - $190,000" },
    { from: 190000, to: Infinity, rate: 0.45, label: "$190,001 and over" }
  ];

  const FOREIGN_BRACKETS = [
    { from: 0, to: 135000, rate: 0.3, label: "$0 - $135,000" },
    { from: 135000, to: 190000, rate: 0.37, label: "$135,001 - $190,000" },
    { from: 190000, to: Infinity, rate: 0.45, label: "$190,001 and over" }
  ];

  const MEDICARE_LEVY = {
    rate: 0.02,
    lowerThreshold: 27222,
    upperThreshold: 34027,
    phaseInRate: 0.1
  };

  function toNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function money(value) {
    return Math.max(0, toNumber(value));
  }

  function normaliseHours(value) {
    const hours = money(value);
    if (hours <= 0) return DEFAULT_HOURS_PER_WEEK;
    return Math.min(hours, 168);
  }

  function annualiseIncome(amount, payBasis, hoursPerWeek) {
    const value = money(amount);
    const hours = normaliseHours(hoursPerWeek);

    switch (payBasis) {
      case "hourly":
        return value * hours * WEEKS_PER_YEAR;
      case "weekly":
        return value * WEEKS_PER_YEAR;
      case "monthly":
        return value * MONTHS_PER_YEAR;
      case "annual":
      default:
        return value;
    }
  }

  function periodiseAnnual(amount, hoursPerWeek) {
    const annual = money(amount);
    const hours = normaliseHours(hoursPerWeek);

    return {
      annual,
      monthly: annual / MONTHS_PER_YEAR,
      weekly: annual / WEEKS_PER_YEAR,
      hourly: annual / (hours * WEEKS_PER_YEAR)
    };
  }

  function getBrackets(residency) {
    return residency === "foreign" ? FOREIGN_BRACKETS : RESIDENT_BRACKETS;
  }

  function calculateBracketTax(annualIncome, residency) {
    const taxableIncome = money(annualIncome);
    const brackets = getBrackets(residency);
    let tax = 0;

    const rows = brackets.map((bracket) => {
      const bandEnd = bracket.to === Infinity ? taxableIncome : Math.min(taxableIncome, bracket.to);
      const taxableInBand = Math.max(0, bandEnd - bracket.from);
      const taxInBand = taxableInBand * bracket.rate;
      tax += taxInBand;

      return {
        ...bracket,
        taxableInBand,
        taxInBand
      };
    });

    return {
      tax,
      rows
    };
  }

  function calculateLitoEntitlement(annualIncome, residency) {
    const income = money(annualIncome);

    if (residency === "foreign" || income > 66667) return 0;
    if (income <= 37500) return 700;
    if (income <= 45000) return Math.max(0, 700 - (income - 37500) * 0.05);
    return Math.max(0, 325 - (income - 45000) * 0.015);
  }

  function calculateMedicareLevy(annualIncome, residency, medicareProfile) {
    const income = money(annualIncome);

    if (residency === "foreign" || medicareProfile === "exempt" || income <= MEDICARE_LEVY.lowerThreshold) {
      return 0;
    }

    if (income <= MEDICARE_LEVY.upperThreshold) {
      return Math.max(0, (income - MEDICARE_LEVY.lowerThreshold) * MEDICARE_LEVY.phaseInRate);
    }

    return income * MEDICARE_LEVY.rate;
  }

  function getMarginalRate(annualIncome, residency) {
    const income = money(annualIncome);
    const bracket = getBrackets(residency).find((item) => income > item.from && income <= item.to);
    return bracket ? bracket.rate : getBrackets(residency)[0].rate;
  }

  function calculateTakeHome(options) {
    const annualIncome = annualiseIncome(options.amount, options.payBasis, options.hoursPerWeek);
    const residency = options.residency === "foreign" ? "foreign" : "resident";
    const medicareProfile = options.medicareProfile === "exempt" ? "exempt" : "standard";
    const bracketResult = calculateBracketTax(annualIncome, residency);
    const litoEntitlement = calculateLitoEntitlement(annualIncome, residency);
    const litoApplied = Math.min(bracketResult.tax, litoEntitlement);
    const incomeTax = Math.max(0, bracketResult.tax - litoApplied);
    const medicareLevy = calculateMedicareLevy(annualIncome, residency, medicareProfile);
    const totalTax = incomeTax + medicareLevy;
    const takeHomeAnnual = Math.max(0, annualIncome - totalTax);

    return {
      taxYear: TAX_YEAR,
      residency,
      annualIncome,
      gross: periodiseAnnual(annualIncome, options.hoursPerWeek),
      takeHome: periodiseAnnual(takeHomeAnnual, options.hoursPerWeek),
      taxBeforeOffsets: bracketResult.tax,
      litoEntitlement,
      litoApplied,
      incomeTax,
      medicareLevy,
      totalTax,
      effectiveTaxRate: annualIncome > 0 ? totalTax / annualIncome : 0,
      marginalRate: getMarginalRate(annualIncome, residency),
      bracketRows: bracketResult.rows
    };
  }

  return {
    TAX_YEAR,
    DEFAULT_HOURS_PER_WEEK,
    RESIDENT_BRACKETS,
    FOREIGN_BRACKETS,
    MEDICARE_LEVY,
    annualiseIncome,
    calculateTakeHome,
    calculateBracketTax,
    calculateLitoEntitlement,
    calculateMedicareLevy,
    periodiseAnnual,
    toNumber
  };
});
