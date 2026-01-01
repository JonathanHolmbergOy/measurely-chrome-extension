# Privacy Policy for Measurely Chrome Extension

**Last Updated:** January 1, 2026

## Overview

Measurely is a web performance analysis tool that helps developers measure and optimize their websites. This extension **does not collect, transmit, or store any personal data outside your browser**.

## Data Collection & Usage

### What We Access

When you click "Analyze Page", Measurely analyzes the current webpage to measure:

- **Performance metrics** (page load times, Core Web Vitals)
- **Security headers** (HTTPS, CSP, security policies)
- **Accessibility features** (ARIA labels, contrast ratios, alt text)
- **SEO elements** (meta tags, structured data)
- **Resource loading** (scripts, stylesheets, images)

### How Data Is Stored

- **Analysis Results:** Stored locally in your browser using `chrome.storage.local`
- **User Settings:** Metric preferences synced across your Chrome browsers using `chrome.storage.sync`
- **No External Servers:** All data remains in your browser - nothing is transmitted to external servers

### What We DO NOT Collect

- ❌ Personal information (name, email, address)
- ❌ Browsing history
- ❌ Passwords or credentials
- ❌ Financial information
- ❌ Location data
- ❌ User tracking or analytics

## Permissions Explained

### Required Permissions

- **activeTab:** Access the current tab when you click "Analyze Page"
- **scripting:** Inject analysis code to measure performance metrics
- **storage:** Store analysis results and user settings locally
- **tabs:** Open results in a new tab
- **<all_urls>:** Analyze any website you choose to test

### No Third-Party Data Sharing

Measurely **does not share, sell, or transmit any data** to third parties. All analysis happens entirely within your browser.

## Data Security

Since all data is stored locally in your browser:

- Data is protected by Chrome's built-in security
- No transmission means no interception risk
- You can clear all data by removing the extension

## User Control

You can:

- Enable/disable specific metrics in the Options page
- Clear stored results by removing the extension
- Review source code on [GitHub](https://github.com/yourusername/measurely-chrome-extension)

## Changes to This Policy

We will update this policy if data handling practices change. Check the "Last Updated" date above.

## Contact

For questions about privacy: [your-email@example.com]

## Open Source

Measurely is open source. Review the code: https://github.com/yourusername/measurely-chrome-extension

---

**Summary:** Measurely analyzes websites locally in your browser. No data leaves your device. No tracking. No external servers.
