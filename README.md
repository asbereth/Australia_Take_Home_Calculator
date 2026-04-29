# Australian Take-Home Pay Calculator

A static Australian take-home pay calculator for the 2025-26 income year.

Open `index.html` in a browser. No build step or dependencies are required.

## Scope

- Accepts annual, monthly, weekly, or hourly gross income.
- Annualises hourly income using the selected full-time hours per week, defaulting to 38.
- Supports Australian resident and foreign resident tax treatment.
- Applies the 2025-26 ATO resident and foreign resident income tax brackets.
- Applies the resident low income tax offset where eligible.
- Applies the Medicare levy for standard Australian residents, including the latest ATO-published low-income phase-in thresholds for a single non-SAPTO taxpayer.
- Calculates employer super guarantee at 12%, with options for super paid on top of salary or included in the entered package.
- Shows the current National Minimum Wage reference rate: $24.95 per hour or $948 per week from 1 July 2025.
- Excludes HELP repayments, salary sacrifice, deductions, Medicare levy surcharge, family Medicare thresholds, and senior/pensioner Medicare thresholds.

## Rate updates

The calculator keeps official rates versioned in `tax.js` and attempts a best-effort live source check on page load when served over HTTP. Direct browser scraping of ATO and Fair Work pages can be blocked by cross-origin rules or broken by source markup changes, so the app always falls back to bundled official rates. A production version should use a small controlled rates feed or backend job that validates ATO and Fair Work changes before publishing them to the calculator.

## Sources

- ATO resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
- ATO foreign resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-foreign-residents/
- ATO Medicare levy reduction thresholds: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- ATO low income tax offset: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset
- ATO super guarantee: https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-contributions/how-much-super-to-pay
- Fair Work minimum wages: https://www.fairwork.gov.au/pay-and-wages/minimum-wages
