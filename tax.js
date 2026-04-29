(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AustralianTax = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const WEEKS_PER_YEAR = 52;
  const MONTHS_PER_YEAR = 12;
  const DEFAULT_HOURS_PER_WEEK = 38;

  const DEFAULT_RATE_DATA = {
    taxYear: "2025-26",
    checkedDateLabel: "Apr 2026",
    residentBrackets: [
      { from: 0, to: 18200, rate: 0, label: "$0 - $18,200" },
      { from: 18200, to: 45000, rate: 0.16, label: "$18,201 - $45,000" },
      { from: 45000, to: 135000, rate: 0.3, label: "$45,001 - $135,000" },
      { from: 135000, to: 190000, rate: 0.37, label: "$135,001 - $190,000" },
      { from: 190000, to: Infinity, rate: 0.45, label: "$190,001 and over" }
    ],
    foreignBrackets: [
      { from: 0, to: 135000, rate: 0.3, label: "$0 - $135,000" },
      { from: 135000, to: 190000, rate: 0.37, label: "$135,001 - $190,000" },
      { from: 190000, to: Infinity, rate: 0.45, label: "$190,001 and over" }
    ],
    medicareLevy: {
      rate: 0.02,
      lowerThreshold: 27222,
      upperThreshold: 34027,
      phaseInRate: 0.1
    },
    lowIncomeTaxOffset: {
      maxOffset: 700,
      fullThreshold: 37500,
      firstTaperThreshold: 45000,
      cutoff: 66667,
      firstTaperRate: 0.05,
      secondBaseOffset: 325,
      secondTaperRate: 0.015
    },
    superGuarantee: {
      rate: 0.12,
      effectiveFrom: "2025-07-01"
    },
    nationalMinimumWage: {
      hourly: 24.95,
      weekly: 948,
      casualHourly: 31.19,
      hoursPerWeek: 38,
      effectiveFrom: "2025-07-01"
    }
  };

  let activeRateData = cloneRateData(DEFAULT_RATE_DATA);

  function cloneBracket(bracket) {
    return {
      from: money(bracket.from),
      to: bracket.to === Infinity || bracket.to === null ? Infinity : money(bracket.to),
      rate: Math.max(0, toNumber(bracket.rate)),
      label: String(bracket.label || "")
    };
  }

  function cloneRateData(data) {
    return {
      taxYear: data.taxYear,
      checkedDateLabel: data.checkedDateLabel,
      residentBrackets: data.residentBrackets.map(cloneBracket),
      foreignBrackets: data.foreignBrackets.map(cloneBracket),
      medicareLevy: { ...data.medicareLevy },
      lowIncomeTaxOffset: { ...data.lowIncomeTaxOffset },
      superGuarantee: { ...data.superGuarantee },
      nationalMinimumWage: { ...data.nationalMinimumWage }
    };
  }

  function validBrackets(brackets) {
    return Array.isArray(brackets) && brackets.length > 0 && brackets.every((bracket) => {
      return Number.isFinite(bracket.from) && bracket.to > bracket.from && Number.isFinite(bracket.rate);
    });
  }

  function applyRateData(nextData) {
    if (!nextData || typeof nextData !== "object") return getRateData();

    const merged = cloneRateData(activeRateData);
    if (nextData.taxYear) merged.taxYear = String(nextData.taxYear);
    if (nextData.checkedDateLabel) merged.checkedDateLabel = String(nextData.checkedDateLabel);

    if (validBrackets(nextData.residentBrackets)) {
      merged.residentBrackets = nextData.residentBrackets.map(cloneBracket);
    }

    if (validBrackets(nextData.foreignBrackets)) {
      merged.foreignBrackets = nextData.foreignBrackets.map(cloneBracket);
    }

    if (nextData.medicareLevy) {
      merged.medicareLevy = { ...merged.medicareLevy, ...nextData.medicareLevy };
    }

    if (nextData.lowIncomeTaxOffset) {
      merged.lowIncomeTaxOffset = { ...merged.lowIncomeTaxOffset, ...nextData.lowIncomeTaxOffset };
    }

    if (nextData.superGuarantee) {
      merged.superGuarantee = { ...merged.superGuarantee, ...nextData.superGuarantee };
    }

    if (nextData.nationalMinimumWage) {
      merged.nationalMinimumWage = { ...merged.nationalMinimumWage, ...nextData.nationalMinimumWage };
    }

    activeRateData = cloneRateData(merged);
    return getRateData();
  }

  function getRateData() {
    return cloneRateData(activeRateData);
  }

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
    return residency === "foreign" ? activeRateData.foreignBrackets : activeRateData.residentBrackets;
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
    const lito = activeRateData.lowIncomeTaxOffset;

    if (residency === "foreign" || income > lito.cutoff) return 0;
    if (income <= lito.fullThreshold) return lito.maxOffset;
    if (income <= lito.firstTaperThreshold) {
      return Math.max(0, lito.maxOffset - (income - lito.fullThreshold) * lito.firstTaperRate);
    }
    return Math.max(0, lito.secondBaseOffset - (income - lito.firstTaperThreshold) * lito.secondTaperRate);
  }

  function calculateMedicareLevy(annualIncome, residency, medicareProfile) {
    const income = money(annualIncome);
    const levy = activeRateData.medicareLevy;

    if (residency === "foreign" || medicareProfile === "exempt" || income <= levy.lowerThreshold) {
      return 0;
    }

    if (income <= levy.upperThreshold) {
      return Math.max(0, (income - levy.lowerThreshold) * levy.phaseInRate);
    }

    return income * levy.rate;
  }

  function calculateSuperAmounts(enteredAnnualIncome, superMode) {
    const enteredAnnual = money(enteredAnnualIncome);
    const rate = Math.max(0, toNumber(activeRateData.superGuarantee.rate));

    if (superMode === "included") {
      const cashAnnual = rate > 0 ? enteredAnnual / (1 + rate) : enteredAnnual;
      return {
        mode: "included",
        rate,
        cashAnnual,
        superAnnual: Math.max(0, enteredAnnual - cashAnnual),
        packageAnnual: enteredAnnual
      };
    }

    return {
      mode: "onTop",
      rate,
      cashAnnual: enteredAnnual,
      superAnnual: enteredAnnual * rate,
      packageAnnual: enteredAnnual * (1 + rate)
    };
  }

  function calculateMinimumWageReference() {
    const wage = activeRateData.nationalMinimumWage;
    const superRate = Math.max(0, toNumber(activeRateData.superGuarantee.rate));
    const annual = money(wage.weekly) * WEEKS_PER_YEAR;
    const superAnnual = annual * superRate;

    return {
      hourly: money(wage.hourly),
      weekly: money(wage.weekly),
      annual,
      casualHourly: money(wage.casualHourly),
      hoursPerWeek: normaliseHours(wage.hoursPerWeek),
      effectiveFrom: wage.effectiveFrom,
      superAnnual,
      packageAnnual: annual + superAnnual
    };
  }

  function getMarginalRate(annualIncome, residency) {
    const income = money(annualIncome);
    const bracket = getBrackets(residency).find((item) => income > item.from && income <= item.to);
    return bracket ? bracket.rate : getBrackets(residency)[0].rate;
  }

  function calculateTakeHome(options) {
    const enteredAnnualIncome = annualiseIncome(options.amount, options.payBasis, options.hoursPerWeek);
    const residency = options.residency === "foreign" ? "foreign" : "resident";
    const medicareProfile = options.medicareProfile === "exempt" ? "exempt" : "standard";
    const superAmounts = calculateSuperAmounts(enteredAnnualIncome, options.superMode);
    const annualIncome = superAmounts.cashAnnual;
    const bracketResult = calculateBracketTax(annualIncome, residency);
    const litoEntitlement = calculateLitoEntitlement(annualIncome, residency);
    const litoApplied = Math.min(bracketResult.tax, litoEntitlement);
    const incomeTax = Math.max(0, bracketResult.tax - litoApplied);
    const medicareLevy = calculateMedicareLevy(annualIncome, residency, medicareProfile);
    const totalTax = incomeTax + medicareLevy;
    const takeHomeAnnual = Math.max(0, annualIncome - totalTax);

    return {
      taxYear: activeRateData.taxYear,
      checkedDateLabel: activeRateData.checkedDateLabel,
      residency,
      enteredAnnualIncome,
      annualIncome,
      gross: periodiseAnnual(annualIncome, options.hoursPerWeek),
      takeHome: periodiseAnnual(takeHomeAnnual, options.hoursPerWeek),
      super: periodiseAnnual(superAmounts.superAnnual, options.hoursPerWeek),
      package: periodiseAnnual(superAmounts.packageAnnual, options.hoursPerWeek),
      superMode: superAmounts.mode,
      superRate: superAmounts.rate,
      taxBeforeOffsets: bracketResult.tax,
      litoEntitlement,
      litoApplied,
      incomeTax,
      medicareLevy,
      totalTax,
      effectiveTaxRate: annualIncome > 0 ? totalTax / annualIncome : 0,
      marginalRate: getMarginalRate(annualIncome, residency),
      bracketRows: bracketResult.rows,
      minimumWage: calculateMinimumWageReference()
    };
  }

  return {
    TAX_YEAR: DEFAULT_RATE_DATA.taxYear,
    DEFAULT_HOURS_PER_WEEK,
    DEFAULT_RATE_DATA: cloneRateData(DEFAULT_RATE_DATA),
    RESIDENT_BRACKETS: DEFAULT_RATE_DATA.residentBrackets.map(cloneBracket),
    FOREIGN_BRACKETS: DEFAULT_RATE_DATA.foreignBrackets.map(cloneBracket),
    MEDICARE_LEVY: { ...DEFAULT_RATE_DATA.medicareLevy },
    annualiseIncome,
    applyRateData,
    calculateTakeHome,
    calculateBracketTax,
    calculateLitoEntitlement,
    calculateMedicareLevy,
    calculateMinimumWageReference,
    calculateSuperAmounts,
    getRateData,
    periodiseAnnual,
    toNumber
  };
});
