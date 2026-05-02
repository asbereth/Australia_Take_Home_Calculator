(function () {
  "use strict";

  const tax = window.CanadianTax;
  const form = document.getElementById("canadaCalculatorForm");
  const incomeInput = document.getElementById("canadaIncomeAmount");
  const provinceInput = document.getElementById("province");
  const hoursInput = document.getElementById("canadaHoursPerWeek");
  const annualDeductionsInput = document.getElementById("canadaAnnualDeductions");

  const rateBadge = document.getElementById("canadaRateBadge");
  const annualTakeHome = document.getElementById("canadaAnnualTakeHome");
  const monthlyTakeHome = document.getElementById("canadaMonthlyTakeHome");
  const weeklyTakeHome = document.getElementById("canadaWeeklyTakeHome");
  const hourlyTakeHome = document.getElementById("canadaHourlyTakeHome");
  const effectiveTaxRate = document.getElementById("canadaEffectiveTaxRate");
  const federalTax = document.getElementById("canadaFederalTax");
  const provincialTax = document.getElementById("canadaProvincialTax");
  const pensionLabel = document.getElementById("canadaPensionLabel");
  const eiLabel = document.getElementById("canadaEiLabel");
  const cpp = document.getElementById("canadaCpp");
  const ei = document.getElementById("canadaEi");
  const afterDeductions = document.getElementById("canadaAfterDeductions");
  const taxYearLabel = document.getElementById("canadaTaxYearLabel");
  const provinceAssumption = document.getElementById("canadaProvinceAssumption");
  const notice = document.getElementById("canadaNotice");
  const breakdownBody = document.getElementById("canadaBreakdownBody");
  const bracketBody = document.getElementById("canadaBracketBody");
  const rateStatus = document.getElementById("canadaRateStatus");

  const currencyWhole = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  });

  const currencyCents = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const percent = new Intl.NumberFormat("en-CA", {
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

  function addSectionRow(body, label) {
    const row = document.createElement("tr");
    row.className = "section-row";

    const cell = document.createElement("td");
    cell.textContent = label;
    cell.colSpan = 4;

    row.append(cell);
    body.append(row);
  }

  function addBracketRows(label, rows) {
    rows.forEach((band) => {
      const row = document.createElement("tr");
      const bandCell = document.createElement("td");
      const rateCell = document.createElement("td");
      const incomeCell = document.createElement("td");
      const taxCell = document.createElement("td");

      bandCell.textContent = `${label}: ${band.label}`;
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

  function renderUnsupported(result) {
    notice.hidden = false;
    notice.textContent = result.unsupportedReason;

    annualTakeHome.textContent = "Not available";
    monthlyTakeHome.textContent = "$0";
    weeklyTakeHome.textContent = "$0";
    hourlyTakeHome.textContent = "$0.00";
    effectiveTaxRate.textContent = "0.0%";
    federalTax.textContent = "$0";
    provincialTax.textContent = "$0";
    pensionLabel.textContent = "CPP";
    eiLabel.textContent = "EI";
    cpp.textContent = "$0";
    ei.textContent = "$0";
    afterDeductions.textContent = "$0";

    breakdownBody.replaceChildren();
    bracketBody.replaceChildren();
    addSectionRow(breakdownBody, "Status");
    addBreakdownRow("Selected province", result.provinceName);
    addBreakdownRow("Status", result.unsupportedReason);
  }

  function renderBreakdown(result) {
    breakdownBody.replaceChildren();
    addSectionRow(breakdownBody, "Income");
    addBreakdownRow("Gross employment income", formatMoney(result.grossAnnualIncome));
    addBreakdownRow("Tax deductions entered", formatMoney(result.deductionAnnual));
    addBreakdownRow(`Enhanced ${result.pensionPlanName} deduction`, formatMoney(result.enhancedPensionDeduction));
    if (result.quebecWorkerDeduction > 0) addBreakdownRow("Quebec worker deduction", formatMoney(result.quebecWorkerDeduction));
    if (result.federalTaxableIncome === result.provincialTaxableIncome) {
      addBreakdownRow("Taxable income", formatMoney(result.taxableIncome));
    } else {
      addBreakdownRow("Federal taxable income", formatMoney(result.federalTaxableIncome));
      addBreakdownRow(`${result.provinceName} taxable income`, formatMoney(result.provincialTaxableIncome));
    }

    addSectionRow(breakdownBody, "Federal");
    addBreakdownRow("Federal basic tax", formatMoney(result.federal.bracketTax));
    addBreakdownRow("Federal credits", `-${formatMoney(result.federal.credits)}`);
    if (result.federal.abatement > 0) addBreakdownRow("Federal Quebec abatement", `-${formatMoney(result.federal.abatement)}`);
    addBreakdownRow("Federal tax", formatMoney(result.federal.tax));

    addSectionRow(breakdownBody, result.provinceName);
    addBreakdownRow(`${result.provinceName} basic tax`, formatMoney(result.provincial.bracketTax));
    addBreakdownRow(`${result.provinceName} credits`, `-${formatMoney(result.provincial.credits)}`);
    if (result.provinceCode === "ON" || result.provincial.surtax > 0) {
      addBreakdownRow(`${result.provinceName} surtax`, formatMoney(result.provincial.surtax));
    }
    if (result.provincial.healthPremium > 0) addBreakdownRow(`${result.provinceName} health premium`, formatMoney(result.provincial.healthPremium));
    if (result.provincial.reduction > 0) addBreakdownRow(`${result.provinceName} tax reduction`, `-${formatMoney(result.provincial.reduction)}`);
    addBreakdownRow(`${result.provinceName} tax`, formatMoney(result.provincial.tax));

    addSectionRow(breakdownBody, "Payroll and totals");
    addBreakdownRow(`${result.pensionPlanName} contributions`, formatMoney(result.cpp.total));
    addBreakdownRow("EI premium", formatMoney(result.eiPremium));
    if (result.qpipPremium > 0) addBreakdownRow("QPIP premium", formatMoney(result.qpipPremium));
    addBreakdownRow("Total tax and payroll contributions", formatMoney(result.totalTaxAndContributions), { total: true });
    addBreakdownRow("Annual take-home before deductions", formatMoney(result.takeHome.annual), { total: true });
    addBreakdownRow("Annual take-home after deductions", formatMoney(result.afterDeductions.annual), { total: true });
  }

  function renderBracketRows(result) {
    bracketBody.replaceChildren();
    addSectionRow(bracketBody, "Federal");
    addBracketRows("Federal", result.federalRows);
    addSectionRow(bracketBody, result.provinceName);
    addBracketRows(result.provinceName, result.provincialRows);
  }

  function renderResult(result) {
    const provinceLabel = `${result.provinceName}, ${result.taxYear}`;
    taxYearLabel.textContent = provinceLabel;
    provinceAssumption.textContent = result.supported ? `${result.provinceName} rates and credits` : `${result.provinceName} not implemented`;
    rateBadge.textContent = result.provinceCode === "QC"
      ? `CRA/Revenu Quebec rates checked ${result.checkedDateLabel}`
      : `CRA rates checked ${result.checkedDateLabel}`;
    rateStatus.textContent = result.supported
      ? result.provinceCode === "QC"
        ? "Using bundled CRA and Revenu Quebec 2026 rates for a standard employment estimate."
        : "Using bundled CRA 2026 rates for a standard employment estimate."
      : result.unsupportedReason;

    if (!result.supported) {
      renderUnsupported(result);
      return;
    }

    notice.hidden = true;
    notice.textContent = "";

    annualTakeHome.textContent = formatMoney(result.takeHome.annual);
    monthlyTakeHome.textContent = formatMoney(result.takeHome.monthly);
    weeklyTakeHome.textContent = formatMoney(result.takeHome.weekly);
    hourlyTakeHome.textContent = formatMoney(result.takeHome.hourly, true);
    effectiveTaxRate.textContent = percent.format(result.effectiveTaxRate);
    federalTax.textContent = formatMoney(result.federal.tax);
    provincialTax.textContent = formatMoney(result.provincial.tax);
    pensionLabel.textContent = result.pensionPlanName;
    eiLabel.textContent = result.qpipPremium > 0 ? "EI + QPIP" : "EI";
    cpp.textContent = formatMoney(result.cpp.total);
    ei.textContent = formatMoney(result.eiPremium + result.qpipPremium);
    afterDeductions.textContent = formatMoney(result.afterDeductions.annual);

    renderBreakdown(result);
    renderBracketRows(result);
  }

  function calculate() {
    const result = tax.calculateTakeHome({
      amount: incomeInput.value,
      payBasis: getChecked("canadaPayBasis") || "annual",
      province: provinceInput.value || "ON",
      hoursPerWeek: hoursInput.value,
      deductions: {
        annual: annualDeductionsInput.value
      }
    });

    renderResult(result);
  }

  function formatMoneyInput(input) {
    const value = tax.toNumber(input.value);
    if (value > 0) {
      input.value = new Intl.NumberFormat("en-CA", {
        maximumFractionDigits: value % 1 === 0 ? 0 : 2
      }).format(value);
    }
  }

  function setInitialDefaults() {
    const annualPayBasis = form.querySelector('input[name="canadaPayBasis"][value="annual"]');
    if (annualPayBasis) annualPayBasis.checked = true;
  }

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  incomeInput.addEventListener("blur", () => formatMoneyInput(incomeInput));
  annualDeductionsInput.addEventListener("blur", () => formatMoneyInput(annualDeductionsInput));

  setInitialDefaults();
  calculate();
})();
