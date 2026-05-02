(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CanadianTax = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const WEEKS_PER_YEAR = 52;
  const MONTHS_PER_YEAR = 12;
  const DEFAULT_HOURS_PER_WEEK = 40;

  const RATE_DATA = {
    taxYear: "2026",
    checkedDateLabel: "Jan 2026",
    federal: {
      brackets: [
        { from: 0, to: 58523, rate: 0.14, label: "$0 - $58,523" },
        { from: 58523, to: 117045, rate: 0.205, label: "$58,524 - $117,045" },
        { from: 117045, to: 181440, rate: 0.26, label: "$117,046 - $181,440" },
        { from: 181440, to: 258482, rate: 0.29, label: "$181,441 - $258,482" },
        { from: 258482, to: Infinity, rate: 0.33, label: "$258,483 and over" }
      ],
      lowestRate: 0.14,
      basicPersonalAmount: {
        max: 16452,
        min: 14829,
        taperFrom: 181440,
        taperTo: 258482
      },
      canadaEmploymentAmount: 1501
    },
    provinces: {
      AB: {
        label: "Alberta",
        basicAmount: 22769,
        brackets: [
          { from: 0, to: 61200, rate: 0.08, label: "$0 - $61,200" },
          { from: 61200, to: 154259, rate: 0.1, label: "$61,201 - $154,259" },
          { from: 154259, to: 185111, rate: 0.12, label: "$154,260 - $185,111" },
          { from: 185111, to: 246813, rate: 0.13, label: "$185,112 - $246,813" },
          { from: 246813, to: 370220, rate: 0.14, label: "$246,814 - $370,220" },
          { from: 370220, to: Infinity, rate: 0.15, label: "$370,221 and over" }
        ]
      },
      BC: {
        label: "British Columbia",
        basicAmount: 13216,
        brackets: [
          { from: 0, to: 50363, rate: 0.0506, label: "$0 - $50,363" },
          { from: 50363, to: 100728, rate: 0.077, label: "$50,364 - $100,728" },
          { from: 100728, to: 115648, rate: 0.105, label: "$100,729 - $115,648" },
          { from: 115648, to: 140430, rate: 0.1229, label: "$115,649 - $140,430" },
          { from: 140430, to: 190405, rate: 0.147, label: "$140,431 - $190,405" },
          { from: 190405, to: 265545, rate: 0.168, label: "$190,406 - $265,545" },
          { from: 265545, to: Infinity, rate: 0.205, label: "$265,546 and over" }
        ],
        taxReduction: {
          fullAmount: 575,
          fullThreshold: 25570,
          cutoff: 41722,
          taperRate: 0.0356
        }
      },
      MB: {
        label: "Manitoba",
        dynamicBasicAmount: "manitoba",
        brackets: [
          { from: 0, to: 47000, rate: 0.108, label: "$0 - $47,000" },
          { from: 47000, to: 100000, rate: 0.1275, label: "$47,001 - $100,000" },
          { from: 100000, to: Infinity, rate: 0.174, label: "$100,001 and over" }
        ]
      },
      NB: {
        label: "New Brunswick",
        basicAmount: 13664,
        brackets: [
          { from: 0, to: 52333, rate: 0.094, label: "$0 - $52,333" },
          { from: 52333, to: 104666, rate: 0.14, label: "$52,334 - $104,666" },
          { from: 104666, to: 193861, rate: 0.16, label: "$104,667 - $193,861" },
          { from: 193861, to: Infinity, rate: 0.195, label: "$193,862 and over" }
        ]
      },
      NL: {
        label: "Newfoundland and Labrador",
        basicAmount: 11188,
        brackets: [
          { from: 0, to: 44678, rate: 0.087, label: "$0 - $44,678" },
          { from: 44678, to: 89354, rate: 0.145, label: "$44,679 - $89,354" },
          { from: 89354, to: 159528, rate: 0.158, label: "$89,355 - $159,528" },
          { from: 159528, to: 223340, rate: 0.178, label: "$159,529 - $223,340" },
          { from: 223340, to: 285319, rate: 0.198, label: "$223,341 - $285,319" },
          { from: 285319, to: 570638, rate: 0.208, label: "$285,320 - $570,638" },
          { from: 570638, to: 1141275, rate: 0.213, label: "$570,639 - $1,141,275" },
          { from: 1141275, to: Infinity, rate: 0.218, label: "$1,141,276 and over" }
        ]
      },
      NS: {
        label: "Nova Scotia",
        basicAmount: 11932,
        brackets: [
          { from: 0, to: 30995, rate: 0.0879, label: "$0 - $30,995" },
          { from: 30995, to: 61991, rate: 0.1495, label: "$30,996 - $61,991" },
          { from: 61991, to: 97417, rate: 0.1667, label: "$61,992 - $97,417" },
          { from: 97417, to: 157124, rate: 0.175, label: "$97,418 - $157,124" },
          { from: 157124, to: Infinity, rate: 0.21, label: "$157,125 and over" }
        ]
      },
      NT: {
        label: "Northwest Territories",
        basicAmount: 18198,
        brackets: [
          { from: 0, to: 53003, rate: 0.059, label: "$0 - $53,003" },
          { from: 53003, to: 106009, rate: 0.086, label: "$53,004 - $106,009" },
          { from: 106009, to: 172346, rate: 0.122, label: "$106,010 - $172,346" },
          { from: 172346, to: Infinity, rate: 0.1405, label: "$172,347 and over" }
        ]
      },
      NU: {
        label: "Nunavut",
        basicAmount: 19659,
        brackets: [
          { from: 0, to: 55801, rate: 0.04, label: "$0 - $55,801" },
          { from: 55801, to: 111602, rate: 0.07, label: "$55,802 - $111,602" },
          { from: 111602, to: 181439, rate: 0.09, label: "$111,603 - $181,439" },
          { from: 181439, to: Infinity, rate: 0.115, label: "$181,440 and over" }
        ]
      },
      ON: {
        label: "Ontario",
        basicAmount: 12989,
        brackets: [
          { from: 0, to: 53891, rate: 0.0505, label: "$0 - $53,891" },
          { from: 53891, to: 107785, rate: 0.0915, label: "$53,892 - $107,785" },
          { from: 107785, to: 150000, rate: 0.1116, label: "$107,786 - $150,000" },
          { from: 150000, to: 220000, rate: 0.1216, label: "$150,001 - $220,000" },
          { from: 220000, to: Infinity, rate: 0.1316, label: "$220,001 and over" }
        ],
        healthPremium: true,
        surtax: true,
        taxReduction: {
          basicAmount: 300
        }
      },
      PE: {
        label: "Prince Edward Island",
        basicAmount: 15000,
        brackets: [
          { from: 0, to: 33928, rate: 0.095, label: "$0 - $33,928" },
          { from: 33928, to: 65820, rate: 0.1347, label: "$33,929 - $65,820" },
          { from: 65820, to: 106890, rate: 0.166, label: "$65,821 - $106,890" },
          { from: 106890, to: 142250, rate: 0.1762, label: "$106,891 - $142,250" },
          { from: 142250, to: Infinity, rate: 0.19, label: "$142,251 and over" }
        ]
      },
      QC: {
        label: "Quebec",
        supported: false,
        unsupportedReason: "Quebec requires a separate Revenu Quebec flow for Quebec income tax, QPP, and QPIP."
      },
      SK: {
        label: "Saskatchewan",
        basicAmount: 20381,
        brackets: [
          { from: 0, to: 54532, rate: 0.105, label: "$0 - $54,532" },
          { from: 54532, to: 155805, rate: 0.125, label: "$54,533 - $155,805" },
          { from: 155805, to: Infinity, rate: 0.145, label: "$155,806 and over" }
        ]
      },
      YT: {
        label: "Yukon",
        dynamicBasicAmount: "federal",
        brackets: [
          { from: 0, to: 58523, rate: 0.064, label: "$0 - $58,523" },
          { from: 58523, to: 117045, rate: 0.09, label: "$58,524 - $117,045" },
          { from: 117045, to: 181440, rate: 0.109, label: "$117,046 - $181,440" },
          { from: 181440, to: 500000, rate: 0.128, label: "$181,441 - $500,000" },
          { from: 500000, to: Infinity, rate: 0.15, label: "$500,001 and over" }
        ],
        employmentAmount: true
      }
    },
    cpp: {
      ympe: 74600,
      yampe: 85000,
      exemption: 3500,
      baseRate: 0.0495,
      firstAdditionalRate: 0.01,
      secondAdditionalRate: 0.04
    },
    ei: {
      maxInsurable: 68900,
      rate: 0.0163,
      maxPremium: 1123.07
    }
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

  function roundCents(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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

  function calculateBracketTax(annualIncome, brackets) {
    const taxableIncome = money(annualIncome);
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

  function calculateFederalBasicPersonalAmount(netIncome) {
    const amount = money(netIncome);
    const bpa = RATE_DATA.federal.basicPersonalAmount;
    if (amount <= bpa.taperFrom) return bpa.max;
    if (amount >= bpa.taperTo) return bpa.min;
    return roundCents(bpa.max - (amount - bpa.taperFrom) * ((bpa.max - bpa.min) / (bpa.taperTo - bpa.taperFrom)));
  }

  function calculateManitobaBasicPersonalAmount(netIncome) {
    const amount = money(netIncome);
    if (amount <= 200000) return 15780;
    if (amount >= 400000) return 0;
    return roundCents(15780 - (amount - 200000) * (15780 / 200000));
  }

  function getProvince(provinceCode) {
    return RATE_DATA.provinces[provinceCode] || RATE_DATA.provinces.ON;
  }

  function calculateProvinceBasicPersonalAmount(provinceCode, taxableIncome) {
    const province = getProvince(provinceCode);
    if (province.dynamicBasicAmount === "federal") return calculateFederalBasicPersonalAmount(taxableIncome);
    if (province.dynamicBasicAmount === "manitoba") return calculateManitobaBasicPersonalAmount(taxableIncome);
    return money(province.basicAmount);
  }

  function calculateCppContributions(annualIncome) {
    const income = money(annualIncome);
    const cpp = RATE_DATA.cpp;
    const contributory = Math.min(Math.max(0, income - cpp.exemption), cpp.ympe - cpp.exemption);
    const secondAdditionalContributory = Math.min(Math.max(0, income - cpp.ympe), cpp.yampe - cpp.ympe);
    const base = roundCents(contributory * cpp.baseRate);
    const firstAdditional = roundCents(contributory * cpp.firstAdditionalRate);
    const secondAdditional = roundCents(secondAdditionalContributory * cpp.secondAdditionalRate);

    return {
      base,
      firstAdditional,
      secondAdditional,
      total: roundCents(base + firstAdditional + secondAdditional)
    };
  }

  function calculateEiPremium(annualIncome) {
    const income = money(annualIncome);
    const ei = RATE_DATA.ei;
    return roundCents(Math.min(income, ei.maxInsurable) * ei.rate);
  }

  function calculateOntarioHealthPremium(taxableIncome) {
    const income = money(taxableIncome);
    if (income <= 20000) return 0;
    if (income <= 36000) return Math.min(300, (income - 20000) * 0.06);
    if (income <= 48000) return Math.min(450, 300 + (income - 36000) * 0.06);
    if (income <= 72000) return Math.min(600, 450 + (income - 48000) * 0.25);
    if (income <= 200000) return Math.min(750, 600 + (income - 72000) * 0.25);
    return Math.min(900, 750 + (income - 200000) * 0.25);
  }

  function calculateOntarioSurtax(provincialTaxBeforeSurtax) {
    const tax = money(provincialTaxBeforeSurtax);
    if (tax <= 5818) return 0;
    if (tax <= 7446) return (tax - 5818) * 0.2;
    return (tax - 5818) * 0.2 + (tax - 7446) * 0.36;
  }

  function calculateOntarioTaxReduction(taxAfterSurtax) {
    const tax = money(taxAfterSurtax);
    const reduction = Math.min(tax, 600 - tax);
    return Math.max(0, reduction);
  }

  function calculateBritishColumbiaTaxReduction(taxableIncome, provincialTax) {
    const income = money(taxableIncome);
    const tax = money(provincialTax);
    const reduction = RATE_DATA.provinces.BC.taxReduction;
    if (income <= reduction.fullThreshold) return Math.min(tax, reduction.fullAmount);
    if (income <= reduction.cutoff) {
      return Math.min(tax, Math.max(0, reduction.fullAmount - (income - reduction.fullThreshold) * reduction.taperRate));
    }
    return 0;
  }

  function calculateFederalTax(taxableIncome, grossIncome, cpp, eiPremium) {
    const bracketResult = calculateBracketTax(taxableIncome, RATE_DATA.federal.brackets);
    const lowestRate = RATE_DATA.federal.lowestRate;
    const basicPersonalAmount = calculateFederalBasicPersonalAmount(taxableIncome);
    const personalCredit = basicPersonalAmount * lowestRate;
    const cppEiCredit = (cpp.base + eiPremium) * lowestRate;
    const employmentAmount = Math.min(money(grossIncome), RATE_DATA.federal.canadaEmploymentAmount);
    const employmentCredit = employmentAmount * lowestRate;
    const credits = personalCredit + cppEiCredit + employmentCredit;

    return {
      bracketTax: roundCents(bracketResult.tax),
      rows: bracketResult.rows,
      basicPersonalAmount,
      credits: roundCents(credits),
      personalCredit: roundCents(personalCredit),
      cppEiCredit: roundCents(cppEiCredit),
      employmentCredit: roundCents(employmentCredit),
      tax: roundCents(Math.max(0, bracketResult.tax - credits))
    };
  }

  function calculateProvinceTax(provinceCode, taxableIncome, grossIncome, cpp, eiPremium) {
    const province = getProvince(provinceCode);
    if (province.supported === false) {
      return {
        supported: false,
        reason: province.unsupportedReason,
        tax: 0,
        rows: []
      };
    }

    const bracketResult = calculateBracketTax(taxableIncome, province.brackets);
    const lowestRate = province.brackets[0].rate;
    const basicPersonalAmount = calculateProvinceBasicPersonalAmount(provinceCode, taxableIncome);
    const personalCredit = basicPersonalAmount * lowestRate;
    const cppEiCredit = (cpp.base + eiPremium) * lowestRate;
    const employmentCredit = province.employmentAmount
      ? Math.min(money(grossIncome), RATE_DATA.federal.canadaEmploymentAmount) * lowestRate
      : 0;
    const credits = personalCredit + cppEiCredit + employmentCredit;
    const baseTax = Math.max(0, bracketResult.tax - credits);
    let surtax = 0;
    let healthPremium = 0;
    let reduction = 0;

    if (provinceCode === "ON") {
      surtax = calculateOntarioSurtax(baseTax);
      healthPremium = calculateOntarioHealthPremium(taxableIncome);
      reduction = calculateOntarioTaxReduction(baseTax + surtax);
    }

    if (provinceCode === "BC") {
      reduction = calculateBritishColumbiaTaxReduction(taxableIncome, baseTax);
    }

    return {
      supported: true,
      bracketTax: roundCents(bracketResult.tax),
      rows: bracketResult.rows,
      basicPersonalAmount,
      credits: roundCents(credits),
      personalCredit: roundCents(personalCredit),
      cppEiCredit: roundCents(cppEiCredit),
      employmentCredit: roundCents(employmentCredit),
      baseTax: roundCents(baseTax),
      surtax: roundCents(surtax),
      healthPremium: roundCents(healthPremium),
      reduction: roundCents(reduction),
      tax: roundCents(Math.max(0, baseTax + surtax + healthPremium - reduction))
    };
  }

  function calculateTakeHome(options) {
    const settings = options || {};
    const provinceCode = settings.province || "ON";
    const province = getProvince(provinceCode);
    const grossAnnualIncome = annualiseIncome(settings.amount, settings.payBasis, settings.hoursPerWeek);
    const deductionAnnual = money(settings.deductions && settings.deductions.annual);
    const cpp = calculateCppContributions(grossAnnualIncome);
    const eiPremium = calculateEiPremium(grossAnnualIncome);
    const enhancedCppDeduction = cpp.firstAdditional + cpp.secondAdditional;
    const taxableIncome = Math.max(0, grossAnnualIncome - deductionAnnual - enhancedCppDeduction);
    const federal = calculateFederalTax(taxableIncome, grossAnnualIncome, cpp, eiPremium);
    const provincial = calculateProvinceTax(provinceCode, taxableIncome, grossAnnualIncome, cpp, eiPremium);
    const totalContributions = provincial.supported === false ? 0 : roundCents(cpp.total + eiPremium);
    const totalTax = provincial.supported === false ? 0 : roundCents(federal.tax + provincial.tax);
    const totalTaxAndContributions = roundCents(totalTax + totalContributions);
    const takeHomeAnnual = Math.max(0, grossAnnualIncome - totalTaxAndContributions);
    const afterDeductionsAnnual = Math.max(0, takeHomeAnnual - deductionAnnual);

    return {
      taxYear: RATE_DATA.taxYear,
      checkedDateLabel: RATE_DATA.checkedDateLabel,
      provinceCode,
      provinceName: province.label,
      supported: provincial.supported !== false,
      unsupportedReason: provincial.reason || "",
      grossAnnualIncome,
      taxableIncome,
      deductionAnnual,
      enhancedCppDeduction,
      gross: periodiseAnnual(grossAnnualIncome, settings.hoursPerWeek),
      takeHome: periodiseAnnual(takeHomeAnnual, settings.hoursPerWeek),
      afterDeductions: periodiseAnnual(afterDeductionsAnnual, settings.hoursPerWeek),
      federal,
      provincial,
      cpp,
      eiPremium,
      totalContributions,
      totalTax,
      totalTaxAndContributions,
      effectiveTaxRate: grossAnnualIncome > 0 ? totalTaxAndContributions / grossAnnualIncome : 0,
      federalRows: federal.rows,
      provincialRows: provincial.rows
    };
  }

  return {
    DEFAULT_HOURS_PER_WEEK,
    RATE_DATA,
    annualiseIncome,
    calculateBracketTax,
    calculateCppContributions,
    calculateEiPremium,
    calculateFederalBasicPersonalAmount,
    calculateTakeHome,
    getProvince,
    periodiseAnnual,
    toNumber
  };
});
