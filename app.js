(function () {
  "use strict";

  const tax = window.AustralianTax;
  const form = document.getElementById("calculatorForm");
  const incomeInput = document.getElementById("incomeAmount");
  const hoursInput = document.getElementById("hoursPerWeek");
  const medicareProfile = document.getElementById("medicareProfile");

  const annualTakeHome = document.getElementById("annualTakeHome");
  const monthlyTakeHome = document.getElementById("monthlyTakeHome");
  const weeklyTakeHome = document.getElementById("weeklyTakeHome");
  const hourlyTakeHome = document.getElementById("hourlyTakeHome");
  const effectiveTaxRate = document.getElementById("effectiveTaxRate");
  const taxYearLabel = document.getElementById("taxYearLabel");
  const marginalRateLabel = document.getElementById("marginalRateLabel");
  const breakdownBody = document.getElementById("breakdownBody");
  const bracketBody = document.getElementById("bracketBody");

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
    addBreakdownRow("Gross annual income", formatMoney(result.annualIncome));
    addBreakdownRow("Income tax before offsets", formatMoney(result.taxBeforeOffsets));
    addBreakdownRow("Low income tax offset", `-${formatMoney(result.litoApplied)}`);
    addBreakdownRow("Income tax after offsets", formatMoney(result.incomeTax));
    addBreakdownRow("Medicare levy", formatMoney(result.medicareLevy));
    addBreakdownRow("Total tax", formatMoney(result.totalTax), { total: true });
    addBreakdownRow("Annual take-home", formatMoney(result.takeHome.annual), { total: true });
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

  function updateMedicareAvailability(residency) {
    const isForeign = residency === "foreign";
    medicareProfile.disabled = isForeign;
    if (isForeign) medicareProfile.value = "standard";
  }

  function calculate() {
    const residency = getChecked("residency") || "resident";
    updateMedicareAvailability(residency);

    const result = tax.calculateTakeHome({
      amount: incomeInput.value,
      payBasis: getChecked("payBasis") || "annual",
      residency,
      hoursPerWeek: hoursInput.value,
      medicareProfile: medicareProfile.value
    });

    annualTakeHome.textContent = formatMoney(result.takeHome.annual);
    monthlyTakeHome.textContent = formatMoney(result.takeHome.monthly);
    weeklyTakeHome.textContent = formatMoney(result.takeHome.weekly);
    hourlyTakeHome.textContent = formatMoney(result.takeHome.hourly, true);
    effectiveTaxRate.textContent = percent.format(result.effectiveTaxRate);

    const residencyLabel = result.residency === "foreign" ? "Non-resident" : "Resident";
    taxYearLabel.textContent = `${residencyLabel}, ${result.taxYear}`;
    marginalRateLabel.textContent = `Marginal rate ${percent.format(result.marginalRate)}`;

    renderBreakdown(result);
    renderBracketRows(result);
  }

  function formatIncomeInput() {
    const value = tax.toNumber(incomeInput.value);
    if (value > 0) {
      incomeInput.value = new Intl.NumberFormat("en-AU", {
        maximumFractionDigits: value % 1 === 0 ? 0 : 2
      }).format(value);
    }
  }

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  incomeInput.addEventListener("blur", formatIncomeInput);

  calculate();
})();
