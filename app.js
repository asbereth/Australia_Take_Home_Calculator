(function () {
  "use strict";

  const tax = window.AustralianTax;
  const form = document.getElementById("calculatorForm");
  const incomeInput = document.getElementById("incomeAmount");
  const hoursInput = document.getElementById("hoursPerWeek");
  const medicareProfile = document.getElementById("medicareProfile");
  const workFromHomeHours = document.getElementById("workFromHomeHours");
  const otherDeductions = document.getElementById("otherDeductions");
  const deductionWorkUsePercent = document.getElementById("deductionWorkUsePercent");

  const rateBadge = document.getElementById("rateBadge");
  const annualTakeHome = document.getElementById("annualTakeHome");
  const monthlyTakeHome = document.getElementById("monthlyTakeHome");
  const weeklyTakeHome = document.getElementById("weeklyTakeHome");
  const hourlyTakeHome = document.getElementById("hourlyTakeHome");
  const effectiveTaxRate = document.getElementById("effectiveTaxRate");
  const annualSuper = document.getElementById("annualSuper");
  const totalPackage = document.getElementById("totalPackage");
  const annualDeductions = document.getElementById("annualDeductions");
  const taxSaved = document.getElementById("taxSaved");
  const annualAfterExpenses = document.getElementById("annualAfterExpenses");
  const taxYearLabel = document.getElementById("taxYearLabel");
  const marginalRateLabel = document.getElementById("marginalRateLabel");
  const breakdownBody = document.getElementById("breakdownBody");
  const bracketBody = document.getElementById("bracketBody");
  const minimumWageHourly = document.getElementById("minimumWageHourly");
  const minimumWageDetail = document.getElementById("minimumWageDetail");
  const minimumWagePackage = document.getElementById("minimumWagePackage");
  const minimumWageSuper = document.getElementById("minimumWageSuper");
  const superAssumption = document.getElementById("superAssumption");
  const deductionAssumption = document.getElementById("deductionAssumption");
  const workFromHomeRateNote = document.getElementById("workFromHomeRateNote");
  const rateStatus = document.getElementById("rateStatus");

  const officialSources = {
    residentRates: "https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents",
    foreignRates: "https://www.ato.gov.au/tax-rates-and-codes/tax-rates-foreign-residents/",
    minimumWage: "https://www.fairwork.gov.au/pay-and-wages/minimum-wages"
  };

  const currencyWhole = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  });

  const currencyCents = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const percent = new Intl.NumberFormat("en-AU", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  function getChecked(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function formatMoney(value, cents) {
    return cents ? currencyCents.format(value) : currencyWhole.format(value);
  }

  function formatDollars(value) {
    return new Intl.NumberFormat("en-AU", {
      maximumFractionDigits: 0
    }).format(value);
  }

  function addBreakdownRow(label, value, options) {
    const row = document.createElement("tr");
    if (options && options.total) row.className = "total-row";

    const labelCell = document.createElement("td");
    labelCell.textContent = label;

    const valueCell = document.createElement("td");
    valueCell.textContent = value;
    valueCell.colSpan = 3;

    row.append(labelCell, valueCell);
    breakdownBody.append(row);
  }

  function renderBreakdown(result) {
    breakdownBody.replaceChildren();
    addBreakdownRow("Cash salary before tax", formatMoney(result.annualIncome));
    addBreakdownRow("Employer super guarantee", formatMoney(result.super.annual));
    addBreakdownRow("Total salary package", formatMoney(result.package.annual));
    addBreakdownRow("Work from home deduction", formatMoney(result.deductions.workFromHome));
    addBreakdownRow("Other expenses entered", formatMoney(result.deductions.otherExpensesGross));
    addBreakdownRow("Other expenses work/business use", percent.format(result.deductions.otherWorkUsePercent));
    addBreakdownRow("Other deductible amount", formatMoney(result.deductions.otherDeductible));
    addBreakdownRow("Total deductions", formatMoney(result.deductions.total));
    addBreakdownRow("Taxable income after deductions", formatMoney(result.taxableIncome));
    addBreakdownRow("Income tax before offsets", formatMoney(result.taxBeforeOffsets));
    addBreakdownRow("LITO entitlement", formatMoney(result.litoEntitlement));
    addBreakdownRow("LITO applied to income tax", `-${formatMoney(result.litoApplied)}`);
    addBreakdownRow("Income tax after offsets", formatMoney(result.incomeTax));
    addBreakdownRow("Medicare levy", formatMoney(result.medicareLevy));
    addBreakdownRow("Total tax", formatMoney(result.totalTax), { total: true });
    addBreakdownRow("Tax saved from deductions", formatMoney(result.taxSavedFromDeductions));
    addBreakdownRow("Annual take-home before expenses", formatMoney(result.takeHome.annual), { total: true });
    addBreakdownRow("Annual take-home after deductible expenses", formatMoney(result.afterExpenses.annual), { total: true });
  }

  function renderBracketRows(result) {
    bracketBody.replaceChildren();

    result.bracketRows.forEach((band) => {
      const row = document.createElement("tr");
      const bandCell = document.createElement("td");
      const rateCell = document.createElement("td");
      const incomeCell = document.createElement("td");
      const taxCell = document.createElement("td");

      bandCell.textContent = band.label;
      rateCell.textContent = percent.format(band.rate);
      incomeCell.textContent = formatMoney(band.taxableInBand);
      taxCell.textContent = formatMoney(band.taxInBand);

      if (band.taxableInBand === 0) {
        incomeCell.className = "muted-cell";
        taxCell.className = "muted-cell";
      }

      row.append(bandCell, rateCell, incomeCell, taxCell);
      bracketBody.append(row);
    });
  }

  function renderMinimumWage(result) {
    const wage = result.minimumWage;
    minimumWageHourly.textContent = `${formatMoney(wage.hourly, true)}/hr`;
    minimumWageDetail.textContent = `${formatMoney(wage.weekly)}/wk, ${formatMoney(wage.annual)}/yr before tax`;
    minimumWagePackage.textContent = `${formatMoney(wage.packageAnnual)}/yr`;
    minimumWageSuper.textContent = `Includes ${percent.format(result.superRate)} super guarantee`;
  }

  function updateMedicareAvailability(residency) {
    const isForeign = residency === "foreign";
    medicareProfile.disabled = isForeign;
    if (isForeign) medicareProfile.value = "standard";
  }

  function setInitialDefaults() {
    const annualPayBasis = form.querySelector('input[name="payBasis"][value="annual"]');
    if (annualPayBasis) annualPayBasis.checked = true;
  }

  function calculate() {
    const residency = getChecked("residency") || "resident";
    updateMedicareAvailability(residency);

    const result = tax.calculateTakeHome({
      amount: incomeInput.value,
      payBasis: getChecked("payBasis") || "annual",
      residency,
      hoursPerWeek: hoursInput.value,
      medicareProfile: medicareProfile.value,
      superMode: getChecked("superMode") || "onTop",
      deductions: {
        workFromHomeHours: workFromHomeHours.value,
        otherExpenses: otherDeductions.value,
        otherWorkUsePercent: deductionWorkUsePercent.value
      }
    });

    annualTakeHome.textContent = formatMoney(result.takeHome.annual);
    monthlyTakeHome.textContent = formatMoney(result.takeHome.monthly);
    weeklyTakeHome.textContent = formatMoney(result.takeHome.weekly);
    hourlyTakeHome.textContent = formatMoney(result.takeHome.hourly, true);
    effectiveTaxRate.textContent = percent.format(result.effectiveTaxRate);
    annualSuper.textContent = formatMoney(result.super.annual);
    totalPackage.textContent = formatMoney(result.package.annual);
    annualDeductions.textContent = formatMoney(result.deductions.total);
    taxSaved.textContent = formatMoney(result.taxSavedFromDeductions);
    annualAfterExpenses.textContent = formatMoney(result.afterExpenses.annual);
    superAssumption.textContent = `${percent.format(result.superRate)} employer SG`;
    deductionAssumption.textContent = `${formatMoney(result.deductions.workFromHomeRate, true)}/hr WFH fixed rate plus apportioned other expenses`;
    workFromHomeRateNote.textContent = `WFH fixed rate: ${formatMoney(result.deductions.workFromHomeRate, true)}/hr, latest bundled ATO rate (${result.deductions.workFromHomeRateYear}). Other expenses are multiplied by the work/business-use percentage.`;

    const residencyLabel = result.residency === "foreign" ? "Non-resident" : "Resident";
    taxYearLabel.textContent = `${residencyLabel}, ${result.taxYear}`;
    marginalRateLabel.textContent = `Marginal rate ${percent.format(result.marginalRate)}`;
    rateBadge.textContent = `ATO, Fair Work rates checked ${result.checkedDateLabel}`;

    renderMinimumWage(result);
    renderBreakdown(result);
    renderBracketRows(result);
  }

  function formatMoneyInput(input) {
    const value = tax.toNumber(input.value);
    if (value > 0) {
      input.value = new Intl.NumberFormat("en-AU", {
        maximumFractionDigits: value % 1 === 0 ? 0 : 2
      }).format(value);
    }
  }

  function parseMoney(value) {
    return tax.toNumber(value);
  }

  function normaliseSourceText(value) {
    return String(value || "").replace(/\u2013|\u2014/g, "-").replace(/\s+/g, " ").trim();
  }

  function makeBracketLabel(from, to) {
    if (from === 0) return `$0 - $${formatDollars(to)}`;
    if (to === Infinity) return `$${formatDollars(from + 1)} and over`;
    return `$${formatDollars(from + 1)} - $${formatDollars(to)}`;
  }

  function parseRateText(text) {
    if (/nil/i.test(text)) return 0;
    const cents = text.match(/(\d+(?:\.\d+)?)\s*c\b/i);
    if (cents) return Number(cents[1]) / 100;
    const percentage = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentage) return Number(percentage[1]) / 100;
    return null;
  }

  function parseBandText(text) {
    const cleanText = normaliseSourceText(text);
    const numbers = cleanText.match(/[0-9][0-9,]*/g) || [];
    if (numbers.length === 0) return null;

    const first = parseMoney(numbers[0]);
    const second = numbers[1] ? parseMoney(numbers[1]) : Infinity;
    const from = first <= 1 ? 0 : first - 1;
    const to = /over/i.test(cleanText) ? Infinity : second;

    return {
      from,
      to,
      label: makeBracketLabel(from, to)
    };
  }

  function parseAtoBrackets(html, headingText) {
    if (!window.DOMParser) return null;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = Array.from(doc.querySelectorAll("h2, h3, h4, table"));
    const headingIndex = nodes.findIndex((node) => {
      return node.tagName !== "TABLE" && normaliseSourceText(node.textContent).includes(headingText);
    });

    if (headingIndex < 0) return null;

    const table = nodes.slice(headingIndex + 1).find((node) => node.tagName === "TABLE");
    if (!table) return null;

    const rows = Array.from(table.querySelectorAll("tbody tr, tr"));
    const brackets = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) return null;

      const band = parseBandText(cells[0].textContent);
      const rate = parseRateText(cells[1].textContent);
      if (!band || rate === null) return null;

      return {
        ...band,
        rate
      };
    }).filter(Boolean);

    return brackets.length > 0 ? brackets : null;
  }

  function parseMinimumWage(html) {
    const text = normaliseSourceText(html);
    const hourly = text.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*(?:per hour|an hour)/i);
    const weekly = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)\s*(?:per week|a week)/i);
    const casual = text.match(/\$([0-9]+(?:\.[0-9]{2})?)\s*(?:per hour|an hour)[^.]{0,140}casual loading/i);
    const effective = text.match(/(?:From|As of)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i);

    if (!hourly || !weekly) return null;

    return {
      hourly: parseMoney(hourly[1]),
      weekly: parseMoney(weekly[1]),
      casualHourly: casual ? parseMoney(casual[1]) : tax.getRateData().nationalMinimumWage.casualHourly,
      hoursPerWeek: 38,
      effectiveFrom: effective ? effective[1] : tax.getRateData().nationalMinimumWage.effectiveFrom
    };
  }

  function setRateStatus(message) {
    rateStatus.textContent = message;
  }

  async function fetchText(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refreshOfficialRatesOnLoad() {
    if (!window.fetch || window.location.protocol === "file:") {
      setRateStatus("Using bundled official rates. Live source checks need the page to be served over HTTP.");
      return;
    }

    const current = tax.getRateData();
    const [residentResult, foreignResult, wageResult] = await Promise.allSettled([
      fetchText(officialSources.residentRates),
      fetchText(officialSources.foreignRates),
      fetchText(officialSources.minimumWage)
    ]);

    const updates = {};
    const refreshed = [];

    if (residentResult.status === "fulfilled") {
      const brackets = parseAtoBrackets(residentResult.value, `Resident tax rates ${current.taxYear}`);
      if (brackets) {
        updates.residentBrackets = brackets;
        refreshed.push("resident brackets");
      }
    }

    if (foreignResult.status === "fulfilled") {
      const brackets = parseAtoBrackets(foreignResult.value, `Foreign resident tax rates ${current.taxYear}`);
      if (brackets) {
        updates.foreignBrackets = brackets;
        refreshed.push("foreign resident brackets");
      }
    }

    if (wageResult.status === "fulfilled") {
      const minimumWage = parseMinimumWage(wageResult.value);
      if (minimumWage) {
        updates.nationalMinimumWage = minimumWage;
        refreshed.push("minimum wage");
      }
    }

    if (refreshed.length > 0) {
      tax.applyRateData(updates);
      calculate();
      setRateStatus(`Live source check refreshed ${refreshed.join(", ")} on this page load.`);
      return;
    }

    setRateStatus("Using bundled official rates. Live source scraping was blocked or the source format changed.");
  }

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  incomeInput.addEventListener("blur", () => formatMoneyInput(incomeInput));
  otherDeductions.addEventListener("blur", () => formatMoneyInput(otherDeductions));

  setInitialDefaults();
  calculate();
  refreshOfficialRatesOnLoad();
})();
