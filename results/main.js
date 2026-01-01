(function() {
    'use strict';

    const elements = {
        content: null,
        categoriesNav: null,
        metricsTable: null,
        filterBar: null,
        copyButton: null,
        searchInput: null
    };

    let allResults = [];
    let currentFilter = 'all';
    let currentSearchTerm = '';
    let enabledCategories = {};

    function init() {
        elements.content = document.getElementById('content');
        elements.categoriesNav = document.getElementById('categoriesNav');
        elements.metricsTable = document.getElementById('metricsList');
        elements.filterBar = document.getElementById('filterBar');
        elements.copyButton = document.getElementById('copyButton');
        elements.searchInput = document.getElementById('searchInput');

        loadSettings();
        loadResults();

        if (elements.filterBar) {
            elements.filterBar.addEventListener('click', handleFilterClick);
        }

        if (elements.copyButton) {
            elements.copyButton.addEventListener('click', handleCopyClick);
        }

        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', handleSearchInput);
        }

        if (elements.categoriesNav) {
            elements.categoriesNav.addEventListener('click', handleCategoryClick);
        }
    }

    function loadResults() {
        chrome.storage.local.get(['measurelyResults'], (result) => {
            if (result.measurelyResults && result.measurelyResults.length > 0) {
                allResults = result.measurelyResults;
                displayResults(allResults);
                elements.content.setAttribute('aria-busy', 'false');
            } else {
                elements.content.innerHTML = '<p style="padding: 2em; text-align: center;">No results found. Please run an analysis first.</p>';
                elements.content.setAttribute('aria-busy', 'false');
            }
        });
    }

    function handleFilterClick(e) {
        if (!e.target.classList.contains('filter-btn')) return;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        e.target.classList.add('active');
        e.target.setAttribute('aria-pressed', 'true');

        currentFilter = e.target.dataset.filter;
        filterResults();
    }

    function handleCopyClick() {
        if (!allResults || allResults.length === 0) {
            alert('No results to copy');
            return;
        }

        try {
            // Get filtered results based on current filter and search
            const filteredResults = getFilteredResults();
            
            if (filteredResults.length === 0) {
                alert('No results match the current filter');
                return;
            }
            
            const resultsJSON = JSON.stringify(filteredResults, null, 2);
            
            navigator.clipboard.writeText(resultsJSON).then(() => {
                const originalContent = elements.copyButton.innerHTML;
                elements.copyButton.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                
                setTimeout(() => {
                    elements.copyButton.innerHTML = originalContent;
                }, 1500);
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('Failed to copy results');
            });
        } catch (error) {
            console.error('Copy error:', error);
            alert('Failed to prepare results for copying');
        }
    }

    function getFilteredResults() {
        return allResults.filter(result => {
            const status = result.status;
            const metricName = `${result.category} - ${result.metric}`.toLowerCase();
            const issuesCount = result.issues?.length || 0;
            const hasIssues = issuesCount > 0;
            
            let showByFilter = true;
            let showBySearch = true;

            switch (currentFilter) {
                case 'good':
                    showByFilter = status === 'good';
                    break;
                case 'ok':
                    showByFilter = status === 'needs-improvement';
                    break;
                case 'poor':
                    showByFilter = status === 'poor';
                    break;
                case 'no-data':
                    showByFilter = status === 'no-data';
                    break;
                case 'issues':
                    showByFilter = hasIssues;
                    break;
                case 'all':
                default:
                    showByFilter = true;
            }

            if (currentSearchTerm) {
                showBySearch = metricName.includes(currentSearchTerm);
            }

            return showByFilter && showBySearch;
        });
    }

    function handleSearchInput(e) {
        currentSearchTerm = e.target.value.toLowerCase();
        filterResults();
    }

    function loadSettings() {
        chrome.storage.sync.get(['enabledCategories', 'enabledMetrics'], (result) => {
            if (result.enabledCategories) {
                enabledCategories = result.enabledCategories;
                updateCategoryButtonsVisibility();
            }
        });
    }

    function updateCategoryButtonsVisibility() {
        const categoryMap = {
            'performance': 'Performance',
            'security': 'Security',
            'accessibility': 'Accessibility',
            'ux': 'User Experience',
            'optimization': 'Resource Optimization',
            'seo': 'SEO'
        };

        Object.keys(categoryMap).forEach(key => {
            const categoryName = categoryMap[key];
            const isEnabled = enabledCategories[categoryName] !== false;
            const link = elements.categoriesNav?.querySelector(`[data-category="${key}"]`);
            
            if (link) {
                if (!isEnabled) {
                    link.classList.add('disabled');
                    link.setAttribute('aria-disabled', 'true');
                } else {
                    link.classList.remove('disabled');
                    link.removeAttribute('aria-disabled');
                }
            }
        });
    }

    function handleCategoryClick(e) {
        const link = e.target.closest('.category-button');
        if (!link || link.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }
    }

    function displayResults(results) {
        displaySummary(results);
        displayMetricsTable(results);
    }

    function displaySummary(results) {
        const scores = calculateCategoryScores(results);
        const issuesCounts = calculateCategoryIssues(results);

        const categories = [
            { key: 'performance' },
            { key: 'security' },
            { key: 'accessibility' },
            { key: 'ux' },
            { key: 'optimization' },
            { key: 'seo' }
        ];

        categories.forEach(cat => {
            const button = elements.categoriesNav.querySelector(`[data-category="${cat.key}"]`);
            if (!button) return;

            const score = scores[cat.key];
            const issues = issuesCounts[cat.key];
            const strokeColor = getScoreColor(score);
            const strokeDashoffset = 176 - (176 * score / 100);

            const issuesCountEl = button.querySelector('.issues-count');
            if (issuesCountEl) {
                issuesCountEl.textContent = issues;
            }

            const scoreValueEl = button.querySelector('.score-value');
            if (scoreValueEl) {
                scoreValueEl.textContent = score;
                scoreValueEl.className = `score-value ${getScoreClass(score)}`;
            }

            const circleProgress = button.querySelector('.score-circle-progress');
            if (circleProgress) {
                circleProgress.setAttribute('stroke', strokeColor);
                circleProgress.setAttribute('stroke-dashoffset', strokeDashoffset);
            }
        });
    }

    function calculateCategoryIssues(results) {
        const categories = {
            'Performance': 'performance',
            'Security': 'security',
            'Accessibility': 'accessibility',
            'User Experience': 'ux',
            'Resource Optimization': 'optimization',
            'SEO': 'seo'
        };

        const issuesCounts = {};
        
        Object.entries(categories).forEach(([categoryName, categoryKey]) => {
            const categoryResults = results.filter(r => {
                const testCategory = r.Test.split(' (')[0];
                return testCategory === categoryName;
            });

            const totalIssues = categoryResults.reduce((sum, r) => {
                return sum + (r.Issues || 0);
            }, 0);

            issuesCounts[categoryKey] = totalIssues;
        });

        return issuesCounts;
    }

    function getScoreColor(score) {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#fb923c';
        return '#ef4444';
    }

    function getMetricDescription(test) {
        const descriptions = {
            // Performance
            'FCP': 'Time from navigation to when first text or image is rendered on screen',
            'LCP': 'Time for the largest visible element to load and render within the viewport',
            'TBT': 'Total time the main thread is blocked by long tasks between FCP and TTI',
            'CLS': 'Measure of visual stability during page load, quantifying unexpected layout shifts',
            'FID': 'Delay between first interaction and when browser can begin processing event handlers',
            'INP': 'Response time from user interaction to visual feedback throughout page lifecycle',
            'FMP': 'Time when primary content becomes visible to users',
            'TTFB': 'Time from HTTP request to when first byte of response is received from server',
            'TTI': 'Time until page is fully interactive and reliably responsive to user input',
            'RL': 'Average time for resources to load from request start until response complete',
            'RT': 'Average time to render each frame, targeting 60fps for optimal experience',
            'NT': 'Average duration of network requests for data fetching and API response times',
            'JSE': 'Total time spent executing JavaScript code during page load',
            'ET': 'Custom element render times for critical page elements marked with elementtiming attribute',
            'IRD': 'Time until page becomes fully interactive and ready for user input',
            'FDC': 'Number of frames that exceeded 60fps target causing visible stuttering',
            'ASJ': 'Average frame delay during scrolling interactions measured in milliseconds',
            'ILT': 'Time from user input event to visual feedback or response',
            'RTT': 'Round-trip time for network requests from client to server and back',
            'RBR': 'Count and impact of CSS and JavaScript resources that block page rendering',
            
            // Security
            'HSE': 'Whether site uses HTTPS encryption for secure data transmission',
            'HST': 'HSTS header quality score based on max-age duration and includeSubDomains flag',
            'MCC': 'Number of HTTP resources loaded on HTTPS pages creating security vulnerabilities',
            'SHP': 'Number of security headers configured to protect against common web attacks',
            'CSPA': 'Content Security Policy quality score based on directive coverage and restrictiveness',
            'CSPQ': 'CSP directive restrictiveness score evaluating security of each directive',
            'CVC': 'Count of Content Security Policy violations detected during page load',
            'SRI': 'Percentage of external scripts and stylesheets with Subresource Integrity attributes',
            'SRIQ': 'Percentage of SRI attributes using strong hash algorithms like SHA-384 or SHA-512',
            'CSQ': 'Percentage of cookies with security flags properly configured',
            'XCT': 'Whether X-Content-Type-Options header is present to prevent MIME-sniffing attacks',
            'COEP': 'Whether Cross-Origin-Embedder-Policy header is configured for cross-origin isolation',
            'COOP': 'Whether Cross-Origin-Opener-Policy header prevents cross-origin window access attacks',
            'CORP': 'Whether Cross-Origin-Resource-Policy header controls which origins can load resources',
            'PPC': 'Number of browser permissions properly restricted via Permissions-Policy header',
            'SSC': 'Composite security score based on HTTPS, headers, mixed content, and CSP violations',
            
            // Accessibility
            'AMC': 'Number of images without alternative text descriptions for screen readers',
            'CIC': 'Number of text elements with insufficient color contrast ratios',
            'HHI': 'Number of heading elements with incorrect level progression',
            'FLI': 'Count of form inputs missing proper labels or ARIA labels',
            'AIV': 'Count of elements with invalid ARIA role or attribute combinations',
            'ARS': 'Count of broken ARIA relationships referencing non-existent element IDs',
            'LMR': 'Count of properly used ARIA landmark regions or semantic HTML5 elements',
            'FEC': 'Total count of interactive elements that can receive keyboard focus',
            'KNS': 'Composite score measuring keyboard accessibility and focus management',
            'FCI': 'Count of focus indicators that don\'t meet minimum contrast requirements',
            'TSM': 'Count of interactive elements smaller than 24×24 CSS pixels',
            'LAA': 'Whether HTML document and elements have proper lang attributes',
            'LRI': 'Count of dynamic content areas missing ARIA live regions',
            'DID': 'Count of duplicate ID attributes where multiple elements share same id',
            'ASC': 'Composite accessibility score aggregating multiple WCAG compliance metrics',
            'AEC': 'Count of elements with ARIA roles missing required accessible names',
            'DIM': 'Count of decorative images incorrectly marked with alt text',
            'FEA': 'Count of form inputs with errors missing proper ARIA error association attributes',
            'RFI': 'Count of required form fields missing visual and programmatic indicators',
            'REE': 'Count of forms requiring users to re-enter same information unnecessarily',
            'FNO': 'Count of focus indicators obscured by other content like sticky headers or modals',
            'NTC': 'Count of UI elements with low contrast borders, outlines, or backgrounds',
            'IFC': 'Count of accessibility and security issues found in iframes',
            'SDC': 'Percentage of Shadow DOM components tested for accessibility and performance issues',
            'AAA': 'Elements with ARIA roles using disallowed ARIA attributes',
            'ARA': 'Elements with ARIA roles missing required ARIA attributes',
            'ARC': 'Elements with ARIA roles missing required child roles',
            'ARP': 'Elements with ARIA roles missing required parent roles',
            'AHB': 'Whether body element has aria-hidden="true" hiding entire page',
            'IBN': 'Input buttons of type button, submit, reset missing discernible names',
            'SEN': 'Select dropdown elements missing accessible names',
            'FRT': 'Frame and iframe elements missing title or aria-label attributes',
            'VCA': 'Video elements missing caption or subtitle tracks',
            'SVA': 'SVG elements with img role missing accessible text',
            'OBA': 'Object elements missing alternative text or fallback content',
            'AAT': 'Area elements in image maps missing alt text',
            'BYP': 'Pages missing mechanisms to bypass repetitive content blocks',
            'AVA': 'Elements using invalid ARIA attribute names',
            'AVV': 'ARIA attributes with invalid values according to their type',
            'ADR': 'Elements using deprecated ARIA roles needing modern alternatives',
            'ARV': 'Elements with invalid role attribute values',
            'AHF': 'Elements with aria-hidden="true" that are still focusable',
            'ATN': 'Elements with role="tooltip" missing accessible names',
            'AMN': 'Meter elements missing accessible names',
            'APN': 'Progress bar elements missing accessible names',
            'DLS': 'Definition list elements with invalid structure',
            'DLI': 'dt and dd elements not properly contained by dl elements',
            'BTN': 'Buttons missing discernible accessible names',
            'NIT': 'Interactive elements nested inside other interactive elements',
            'LST': 'List elements with invalid structure breaking screen reader navigation',
            'THA': 'Table cells with headers attribute referencing invalid th elements',
            'THD': 'Table header elements without associated data cells',
            'TSC': 'Table cells with invalid scope attribute values',
            'BLK': 'Deprecated blink elements causing content to flash repeatedly',
            'MRQ': 'Deprecated marquee elements causing automatic content scrolling',
            'MRF': 'Meta refresh tags automatically refreshing or redirecting pages',
            'IIA': 'Input elements with type="image" missing alt text',
            'HLV': 'HTML element missing or having invalid lang attribute',
            'VLG': 'Elements with lang attributes using invalid language codes',
            'ACV': 'Form inputs with invalid autocomplete attribute values',
            'SRF': 'Scrollable regions not keyboard accessible via tabindex',
            'MVS': 'Viewport meta tags preventing zooming with user-scalable=no',
            'LD': 'Links with non-descriptive text, empty text, or duplicate ambiguous text',
            
            // User Experience
            'RMC': 'Whether animations respect prefers-reduced-motion CSS media query setting',
            'VSS': 'Composite score based on layout shift measurements and visual stability',
            'RVD': 'Score based on responsive design quality across mobile, tablet, and desktop viewports',
            'CHM': 'Whether help mechanisms are consistently located across pages',
            'UXS': 'Composite score based on scroll smoothness, visual stability, and interaction quality',
            
            // Resource Optimization
            'IMB': 'Total image size compared to recommended performance budget',
            'JSB': 'Total JavaScript size compared to recommended performance budget',
            'CSB': 'Total CSS size compared to recommended performance budget',
            'IOR': 'Percentage of images using modern formats like WebP or AVIF',
            'ACR': 'Ratio of compressed to uncompressed resource sizes',
            'CHR': 'Percentage of resources served from browser cache versus network',
            'LIL': 'Percentage of below-the-fold images using lazy loading',
            'TPI': 'Performance impact score of third-party scripts combining blocking time and resource usage',
            'TPW': 'Total page size including all resources measured in megabytes',
            'OSC': 'Composite score based on image formats, compression, caching, and resource efficiency',
            'TBS': 'Total size of all JavaScript bundles loaded on the page',
            'CSO': 'Count of JavaScript bundles that should be split into smaller chunks',
            'TSO': 'Estimated percentage of unused code that could be removed through tree shaking',
            'RHP': 'Count of critical resources missing resource hints for faster loading',
            'CRU': 'Percentage of HTTP requests that reuse existing TCP connections',
            'HVP': 'HTTP protocol version detected and its performance impact',
            'DNSL': 'Average DNS lookup time across all resources',
            'SSLT': 'Average SSL/TLS handshake time for secure HTTPS connections',
            'TCPT': 'Average TCP connection establishment time measured in milliseconds',
            'FDI': 'Count of font-face rules missing font-display property causing FOIT',
            'RWC': 'Number of resources exceeding recommended size thresholds',
            'TPB': 'Total size and impact of third-party resources compared to performance budget',
            'RCB': 'Total HTTP requests compared to recommended budget',
            'EHS': 'Whether server supports HTTP 103 Early Hints for faster resource loading',
            'ST': 'Server-side timing metrics from Server-Timing HTTP headers',
            'ISA': 'Count of images with oversized dimensions compared to display size',
            'UCD': 'Amount of CSS downloaded but not actually used on the page',
            
            // SEO
            'DTL': 'Whether document has descriptive title element with proper length',
            'MD': 'Whether document has meta description with proper length',
            'VWP': 'Whether document has viewport meta tag with width=device-width',
            'CNU': 'Whether document has valid canonical URL link element',
            'RBT': 'Whether robots meta tag contains blocking directives like noindex or nofollow',
            'HRF': 'Validation of hreflang tags for internationalization with proper format',
            'STD': 'Whether JSON-LD structured data is present and valid',
            'OG': 'Count of Open Graph meta tags present for social media sharing',
            'TWC': 'Count of Twitter Card meta tags present for social sharing'
        };
        
        const match = test.match(/\(([A-Z]+)\)/);
        if (match && descriptions[match[1]]) {
            return descriptions[match[1]];
        }
        
        return '';
    }

    function displayMetricsTable(results) {
        const template = document.getElementById('metricTemplate');
        if (!template) {
            console.error('Metric template not found');
            return;
        }

        elements.metricsTable.innerHTML = '';

        const categories = {
            'Performance': [],
            'Security': [],
            'Accessibility': [],
            'User Experience': [],
            'Resource Optimization': [],
            'SEO': []
        };

        results.forEach(result => {
            const category = result.Test.split(' (')[0];
            if (categories[category]) {
                categories[category].push(result);
            }
        });

        Object.entries(categories).forEach(([categoryName, metrics]) => {
            if (metrics.length === 0) return;

            const section = document.createElement('section');
            section.className = 'metrics-category';
            const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
            section.setAttribute('data-category', categorySlug);
            section.setAttribute('id', categorySlug);

            const categoryHeading = document.createElement('h2');
            categoryHeading.className = 'category-heading';
            categoryHeading.textContent = categoryName;
            section.appendChild(categoryHeading);

            const metricsList = document.createElement('ul');
            metricsList.className = 'category-metrics-list';

            metrics.forEach(metric => {
            const issuesCount = metric.Issues || 0;
            const hasIssues = issuesCount > 0;
            const hasDetails = metric._raw && metric._raw.details && metric._raw.details.length > 0;

                const listItem = document.createElement('li');

                const clone = template.content.cloneNode(true);
                const details = clone.querySelector('.metric-details');
                const summary = clone.querySelector('.metric-summary');
                const nameCategory = clone.querySelector('.name-category');
                const nameCode = clone.querySelector('.name-code');
                const metricDescription = clone.querySelector('.metric-description');
                const valueActual = clone.querySelector('.value-actual');
                const valueThreshold = clone.querySelector('.value-threshold');
                const statusIcons = clone.querySelectorAll('.status-icon');
                const issuesCountSpan = clone.querySelector('.metric-issues-count');
                const issuesList = clone.querySelector('.metric-issues-list');

                details.setAttribute('data-status', metric.Status);
                details.setAttribute('data-category', categoryName.toLowerCase().replace(/\s+/g, '-'));

                if (hasIssues) {
                    details.setAttribute('open', '');
                }

                const nameParts = metric.Test.match(/^(.+?)(\s*\([^)]+\))$/);
                if (nameParts) {
                    nameCategory.textContent = nameParts[1];
                    nameCode.textContent = nameParts[2];
                } else {
                    nameCategory.textContent = metric.Test;
                }

                const description = getMetricDescription(metric.Test);
                if (description) {
                    metricDescription.textContent = description;
                }

                const valueParts = metric.Value.split(' / ');
                if (valueParts.length === 2) {
                    valueActual.textContent = valueParts[0];
                    valueThreshold.textContent = valueParts[1];
                } else {
                    valueActual.textContent = metric.Value;
                    valueThreshold.textContent = '';
                    const separator = clone.querySelector('.value-separator');
                    if (separator) separator.style.display = 'none';
                }

                const statusClass = getStatusClass(metric.Status);
                statusIcons.forEach(icon => {
                    if (icon.classList.contains(`status-${statusClass}`)) {
                        icon.style.display = 'inline';
                    } else {
                        icon.style.display = 'none';
                    }
                });

                if (hasIssues) {
                    const badge = document.createElement('span');
                    badge.className = 'issues-badge';
                    badge.setAttribute('aria-label', `${issuesCount} issue${issuesCount > 1 ? 's' : ''}`);
                    badge.textContent = issuesCount;
                    issuesCountSpan.appendChild(badge);
                } else {
                    const noIssues = document.createElement('span');
                    noIssues.setAttribute('aria-label', 'No issues');
                    noIssues.textContent = '-';
                    issuesCountSpan.appendChild(noIssues);
                    
                    details.setAttribute('disabled', '');
                    summary.setAttribute('tabindex', '-1');
                }

                if (hasDetails) {
                    metric._raw.details.forEach((issue, idx) => {
                        const issueItem = document.createElement('li');
                        issueItem.className = 'metric-issue-item';
                        const number = document.createElement('strong');
                        number.textContent = `${idx + 1}. `;
                        issueItem.appendChild(number);
                        
                        const issueContent = formatIssueElements(issue);
                        issueItem.appendChild(issueContent);
                        
                        issuesList.appendChild(issueItem);
                    });
                } else if (hasIssues) {
                    const message = document.createElement('p');
                    message.textContent = `${issuesCount} issue${issuesCount > 1 ? 's' : ''} found, but no detailed information available.`;
                    issuesList.parentNode.replaceChild(message, issuesList);
                } else {
                    issuesList.remove();
                }

                listItem.appendChild(clone);
                metricsList.appendChild(listItem);
            });

            section.appendChild(metricsList);
            elements.metricsTable.appendChild(section);
        });
    }

    function formatIssueElements(issue) {
        const container = document.createElement('div');
        container.className = 'issue-content';
        
        // Type (bold and on its own line)
        if (issue.type) {
            const typeEl = document.createElement('div');
            typeEl.className = 'issue-type';
            typeEl.textContent = `[${issue.type}]`;
            container.appendChild(typeEl);
        }
        
        // Details container
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'issue-details';
        
        const details = [];
        if (issue.element) details.push(`Element: ${issue.element}`);
        if (issue.resource) details.push(`Resource: ${truncate(issue.resource, 60)}`);
        if (issue.info) details.push(issue.info);
        
        if (details.length > 0) {
            detailsContainer.textContent = details.join(' | ');
            container.appendChild(detailsContainer);
        }
        
        // Fix (italic and on new line)
        if (issue.fix) {
            const fixEl = document.createElement('div');
            fixEl.className = 'issue-fix';
            fixEl.textContent = `Fix: ${issue.fix}`;
            container.appendChild(fixEl);
        }
        
        // Fallback if no structured data
        if (container.children.length === 0) {
            container.textContent = JSON.stringify(issue);
        }
        
        return container;
    }

    function formatIssue(issue) {
        const parts = [];

        if (issue.type) parts.push(`[${issue.type}]`);
        if (issue.element) parts.push(`Element: ${issue.element}`);
        if (issue.resource) parts.push(`Resource: ${truncate(issue.resource, 60)}`);
        if (issue.info) parts.push(issue.info);
        if (issue.fix) parts.push(`Fix: ${issue.fix}`);

        if (parts.length === 0) {
            return JSON.stringify(issue);
        }

        return parts.join(' | ');
    }

    function truncate(str, maxLen) {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen - 3) + '...';
    }

    function filterResults() {
        const sections = elements.metricsTable.querySelectorAll('.metrics-category');

        sections.forEach(section => {
            const details = section.querySelectorAll('.metric-details');
            let hasVisibleMetrics = false;

        details.forEach(detail => {
            const status = detail.dataset.status;
                const metricName = detail.querySelector('.metric-name')?.textContent.toLowerCase() || '';
                const issuesCount = detail.querySelector('.issues-badge')?.textContent || '0';
                const hasIssues = parseInt(issuesCount) > 0;
                
                let showByFilter = true;
                let showBySearch = true;

            switch (currentFilter) {
                    case 'good':
                        showByFilter = status === 'good';
                        break;
                    case 'ok':
                        showByFilter = status === 'needs-improvement';
                        break;
                case 'poor':
                        showByFilter = status === 'poor';
                    break;
                    case 'no-data':
                        showByFilter = status === 'no-data';
                        break;
                    case 'issues':
                        showByFilter = hasIssues;
                    break;
                case 'all':
                default:
                        showByFilter = true;
                }

                if (currentSearchTerm) {
                    showBySearch = metricName.includes(currentSearchTerm);
                }

                const showMetric = showByFilter && showBySearch;
                const listItem = detail.closest('li');
                if (listItem) {
                    listItem.style.display = showMetric ? '' : 'none';
                }

                if (showMetric) {
                    hasVisibleMetrics = true;
                }
            });

            section.style.display = hasVisibleMetrics ? '' : 'none';
        });
    }

    function calculateCategoryScores(results) {
        const categories = {
            'Performance': 'performance',
            'Security': 'security',
            'Accessibility': 'accessibility',
            'User Experience': 'ux',
            'Resource Optimization': 'optimization',
            'SEO': 'seo'
        };

        const scores = {};
        
        Object.entries(categories).forEach(([categoryName, categoryKey]) => {
            const categoryResults = results.filter(r => {
                const testCategory = r.Test.split(' (')[0];
                return testCategory === categoryName;
            });

            if (categoryResults.length === 0) {
                scores[categoryKey] = 0;
                return;
            }

            const categoryScores = categoryResults
                .filter(r => r.Status !== 'no-data')
                .map(r => calculateMetricScore(r));

            scores[categoryKey] = categoryScores.length > 0
                ? Math.round(categoryScores.reduce((sum, s) => sum + s, 0) / categoryScores.length)
                : 0;
        });

        return scores;
    }

    function calculateMetricScore(metric) {
        switch (metric.Status) {
            case 'good':
                return 100;
            case 'needs-improvement':
                return 60;
            case 'poor':
                return 20;
            case 'no-data':
            case 'not-measurable':
            default:
                return 0;
        }
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-good';
        if (score >= 50) return 'score-ok';
        return 'score-poor';
    }

    function getStatusClass(status) {
        switch (status) {
            case 'good':
                return 'good';
            case 'needs-improvement':
                return 'ok';
            case 'poor':
                return 'poor';
            case 'no-data':
            case 'not-measurable':
            default:
                return 'no-data';
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
