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
- Excludes HELP repayments, salary sacrifice, deductions, superannuation, Medicare levy surcharge, family Medicare thresholds, and senior/pensioner Medicare thresholds.

## Rate updates

The calculator keeps tax rates versioned in `tax.js` rather than scraping the ATO website on page load. Live scraping from a static browser page is brittle because public web pages can change markup, block cross-origin requests, or be temporarily unavailable. A production version should use a small controlled rates feed or backend job that validates ATO changes before publishing them to the calculator.

## Sources

- ATO resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
- ATO foreign resident tax rates: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-foreign-residents/
- ATO Medicare levy reduction thresholds: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- ATO low income tax offset: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset
