# Take-Home Pay Calculators

A static multi-country take-home pay calculator project.

Open `index.html` in a browser. No build step or dependencies are required.

## Pages

- `index.html`: country selector.
- `australia.html`: Australian take-home pay calculator for the 2025-26 income year.
- `canada.html`: Canadian take-home pay calculator for the 2026 tax year.

## Scope

Current implemented scope for Australia:

- Accepts annual, monthly, weekly, or hourly gross income.
- Annualises hourly income using the selected full-time hours per week, defaulting to 38.
- Supports Australian resident and foreign resident tax treatment.
- Applies the 2025-26 ATO resident and foreign resident income tax brackets.
- Applies the resident low income tax offset where eligible.
- Applies the Medicare levy for standard Australian residents, including the latest ATO-published low-income phase-in thresholds for a single non-SAPTO taxpayer.
- Applies simple deductions before tax: a work-from-home fixed-rate helper and one apportioned annual other work/business expense amount.
- Calculates employer super guarantee at 12%, with options for super paid on top of salary or included in the entered package.
- Shows the current National Minimum Wage reference rate: $24.95 per hour or $948 per week from 1 July 2025.
- Shows annual take-home before deductible expenses and after deductible expenses so deductions are not treated as a dollar-for-dollar gain.
- Excludes HELP repayments, salary sacrifice, Medicare levy surcharge, family Medicare thresholds, senior/pensioner Medicare thresholds, and detailed depreciation schedules.

Current implemented scope for Canada:

- Accepts annual, monthly, weekly, or hourly gross employment income.
- Supports Canadian provinces and territories except Quebec.
- Applies the 2026 federal brackets, provincial/territorial brackets, basic personal amount credits, CPP, CPP2, and EI.
- Applies a simple annual tax deduction amount before income tax.
- Shows annual take-home before and after the entered annual deductions.
- Excludes Quebec income tax/QPP/QPIP, dependants, benefits, RRSP limit validation, credits beyond the standard employment/basic personal/CPP/EI credits, and full T1 return handling.

## Deduction assumptions

- Work-from-home deductions use the latest bundled ATO fixed rate: 70 cents per recorded work hour, currently published for the 2024-25 income year.
- The fixed-rate work-from-home helper is an estimate only. ATO rules require actual records of hours worked from home and records for covered running expenses.
- The other work/business expenses field applies the selected work/business-use percentage to the annual amount entered.
- The calculator does not decide whether an expense is deductible, reimbursed, private, capital in nature, or already covered by the work-from-home fixed rate.

## Rate updates

The Australia calculator keeps official rates versioned in `tax-australia.js` and attempts a best-effort live source check on page load when served over HTTP. The Canada calculator keeps 2026 CRA rates versioned in `tax-canada.js`.

Direct browser scraping of tax authority pages can be blocked by cross-origin rules or broken by source markup changes, so the app always falls back to bundled official rates. A production version should use a small controlled rates feed or backend job that validates ATO, Fair Work, CRA, and Revenu Quebec changes before publishing them to the calculator.

## Sources

- ATO resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
- ATO foreign resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-foreign-residents/
- ATO Medicare levy reduction thresholds: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- ATO low income tax offset: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset
- ATO super guarantee: https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-contributions/how-much-super-to-pay
- Fair Work minimum wages: https://www.fairwork.gov.au/pay-and-wages/minimum-wages
- ATO claiming deductions: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/how-to-claim-deductions
- ATO business deductions: https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/income-and-deductions-for-business/deductions/
- ATO work from home fixed rate: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/working-from-home-expenses/fixed-rate-method
- CRA 2026 payroll formulas: https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jan/t4127-jan-payroll-deductions-formulas-computer-programs.html
- CRA tax rates for individuals: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
- CRA province or territory of residence: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-address-information/your-province-territory-residence.html
- Revenu Quebec WebRAS: https://www.revenuquebec.ca/en/online-services/tools/webras/
