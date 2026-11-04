# Bill Splitter

Split a restaurant bill in seconds, or settle up a trip with friends and see exactly who pays whom.

**Live demo:** https://vikaskapuganti.github.io/bill-splitter/

## What it does

- **Split a bill:** enter the amount, number of people and any tip or service charge. Optional round-up to the next rupee.
- **Settle a trip:** add everyone and what they paid. It works out each person's share and the fewest payments needed to settle up.
- **Copy for WhatsApp:** one tap copies a clean summary to paste in your group chat.
- **Remembers your data** if you refresh, works on phone and desktop, with automatic dark mode.

## How settling up works

```
share   = total spent / number of people
balance = amount paid - share
```

People with a negative balance pay people with a positive balance. The largest debts are matched with the largest credits first, which keeps the number of payments small. Amounts are calculated in paise to avoid rounding errors.

## Built with

HTML, CSS and JavaScript. No frameworks, no libraries, hosted on GitHub Pages.

## Run it locally

1. Download or clone this repository.
2. Open `index.html` in any browser.

## Author

Built by [Vikas Kapuganti](https://github.com/vikaskapuganti).
