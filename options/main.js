(function() {
    'use strict';

    const CATEGORY_DEFINITIONS = {
        'Performance': {
            description: 'Page load speed, rendering, and responsiveness metrics',
            icon: 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
            metrics: {
                'FCP': 'First Contentful Paint',
                'LCP': 'Largest Contentful Paint',
                'CLS': 'Cumulative Layout Shift',
                'TTFB': 'Time to First Byte',
                'TTI': 'Time to Interactive',
                'TBT': 'Total Blocking Time',
                'FMP': 'First Meaningful Paint',
                'RL': 'Resource Load Time',
                'JSE': 'JavaScript Execution Time',
                'RT': 'Render Time',
                'NT': 'Network Time',
                'FID': 'First Input Delay',
                'INP': 'Interaction to Next Paint',
                'DNSL': 'DNS Lookup Time',
                'TCPT': 'TCP Connection Time',
                'SSLT': 'SSL/TLS Handshake Time',
                'ST': 'Server Timing',
                'ET': 'Element Timing',
                'RTT': 'Resource Timing Details',
                'RHP': 'Resource Hints Present',
                'FDI': 'Font Display Issues',
                'TPI': 'Third-Party Impact',
                'HVP': 'HTTP Version Protocol',
                'CRU': 'Connection Reuse Efficiency',
                'EHS': 'Early Hints Support',
                'CSO': 'Code Splitting Opportunities',
                'TSO': 'Tree Shaking Opportunities',
                'LIL': 'Lazy Loading Implementation',
                'RBR': 'Render-Blocking Resources'
            }
        },
        'Security': {
            description: 'HTTPS, headers, CSP, and security best practices',
            icon: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z',
            metrics: {
                'HSE': 'HTTPS Enabled',
                'MCC': 'Mixed Content Count',
                'CVC': 'CSP Violations',
                'SHP': 'Security Headers Present',
                'SRI': 'Subresource Integrity Coverage',
                'XCT': 'X-Content-Type-Options',
                'PPC': 'Permissions Policy Coverage',
                'CSPA': 'CSP Analysis Score',
                'COEP': 'Cross-Origin-Embedder-Policy',
                'COOP': 'Cross-Origin-Opener-Policy',
                'CORP': 'Cross-Origin-Resource-Policy',
                'HST': 'HSTS Configuration Quality',
                'CSQ': 'Cookie Security Quality',
                'CSPQ': 'CSP Directive Quality',
                'SRIQ': 'SRI Hash Strength',
                'SSC': 'Security Score'
            }
        },
        'Accessibility': {
            description: 'WCAG compliance, ARIA, color contrast, and keyboard navigation',
            icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
            metrics: {
                'AMC': 'Alt Text Missing',
                'CIC': 'Contrast Issues',
                'AEC': 'ARIA Errors',
                'FEC': 'Focusable Elements',
                'FLI': 'Form Label Issues',
                'HHI': 'Heading Hierarchy Issues',
                'LMR': 'Landmark Regions',
                'NTC': 'Non-Text Contrast Issues',
                'LAA': 'Language Attributes',
                'LRI': 'Live Region Issues',
                'FNO': 'Focus Not Obscured',
                'TSM': 'Target Size (Minimum)',
                'CHM': 'Consistent Help',
                'REE': 'Redundant Entry',
                'AIV': 'ARIA Invalid Combinations',
                'ARS': 'ARIA Relationship Errors',
                'DID': 'Duplicate ID Count',
                'DIM': 'Decorative Image Marking',
                'FCI': 'Focus Contrast Issues',
                'FEA': 'Form Error Associations',
                'RFI': 'Required Field Indicators',
                'AAA': 'ARIA Allowed Attributes',
                'ARA': 'ARIA Required Attributes',
                'ARC': 'ARIA Required Children',
                'ARP': 'ARIA Required Parent',
                'AHB': 'ARIA Hidden Body',
                'BTN': 'Button Names',
                'IBN': 'Input Button Names',
                'SEN': 'Select Element Names',
                'FRT': 'Frame Titles',
                'VCA': 'Video Captions',
                'SVA': 'SVG Accessibility',
                'OBA': 'Object Alt Text',
                'AAT': 'Area Alt Text',
                'NIT': 'Nested Interactive',
                'LST': 'List Structure',
                'MVS': 'Meta Viewport Scale',
                'ACV': 'Autocomplete Valid',
                'SRF': 'Scrollable Region Focusable',
                'BYP': 'Bypass Blocks',
                'AVA': 'ARIA Valid Attributes',
                'AVV': 'ARIA Valid Attribute Values',
                'ADR': 'ARIA Deprecated Roles',
                'ARV': 'ARIA Roles Valid',
                'AHF': 'ARIA Hidden Focus',
                'ATN': 'ARIA Tooltip Name',
                'AMN': 'ARIA Meter Name',
                'APN': 'ARIA Progressbar Name',
                'DLS': 'Definition List Structure',
                'DLI': 'DL Item Parents',
                'THA': 'Table Headers Attribute',
                'THD': 'TH Has Data Cells',
                'TSC': 'Table Scope Valid',
                'BLK': 'Blink Elements',
                'MRQ': 'Marquee Elements',
                'MRF': 'Meta Refresh',
                'IIA': 'Input Image Alt',
                'HLV': 'HTML Lang Valid',
                'VLG': 'Valid Lang Attributes',
                'ASC': 'Accessibility Score',
                'KNS': 'Keyboard Navigation Score',
                'LD': 'Link Discernibility'
            }
        },
        'User Experience': {
            description: 'Scroll smoothness, responsiveness, and visual stability',
            icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
            metrics: {
                'ASJ': 'Average Scroll Jank',
                'IRD': 'Interaction Readiness Delay',
                'FDC': 'Frame Drops Count',
                'RMC': 'Reduced Motion Compliance',
                'ILT': 'Input Latency',
                'RVD': 'Responsive Viewport Design',
                'SDC': 'Shadow DOM Coverage',
                'IFC': 'Iframe Content Issues',
                'VSS': 'Visual Stability Score',
                'UXS': 'User Experience Score'
            }
        },
        'Resource Optimization': {
            description: 'Image formats, compression, caching, and bundle sizes',
            icon: 'M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
            metrics: {
                'IOR': 'Image Optimization Rate',
                'ACR': 'Average Compression Ratio',
                'CHR': 'Cache Hit Rate',
                'TBS': 'Total Bundle Size',
                'RWC': 'Resource Waste Count',
                'JSB': 'JavaScript Budget',
                'CSB': 'CSS Budget',
                'IMB': 'Image Budget',
                'RCB': 'Request Count Budget',
                'TPW': 'Total Page Weight',
                'TPB': 'Third-Party Budget',
                'OSC': 'Optimization Score',
                'ISA': 'Image Sizing Accuracy',
                'UCD': 'Unused CSS Bytes'
            }
        },
        'SEO': {
            description: 'Meta tags, structured data, and search engine optimization',
            icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
            metrics: {
                'DTL': 'Document Title',
                'MD': 'Meta Description',
                'VWP': 'Viewport Meta Tag',
                'CNU': 'Canonical URL',
                'RBT': 'Robots Meta Tag',
                'HRF': 'Hreflang Validation',
                'STD': 'Structured Data',
                'OG': 'Open Graph Tags',
                'TWC': 'Twitter Card Tags'
            }
        }
    };

    let settings = {
        enabledCategories: {},
        enabledMetrics: {}
    };

    const elements = {
        categoriesGrid: null,
        enableAllBtn: null,
        disableAllBtn: null,
        resetDefaultsBtn: null,
        searchInput: null,
        statusMessage: null,
        enabledCount: null,
        totalCount: null
    };

    async function init() {
        elements.categoriesGrid = document.getElementById('categoriesGrid');
        elements.enableAllBtn = document.getElementById('enableAll');
        elements.disableAllBtn = document.getElementById('disableAll');
        elements.resetDefaultsBtn = document.getElementById('resetDefaults');
        elements.searchInput = document.getElementById('searchInput');
        elements.statusMessage = document.getElementById('statusMessage');
        elements.enabledCount = document.getElementById('enabledCount');
        elements.totalCount = document.getElementById('totalCount');

        elements.enableAllBtn?.addEventListener('click', handleEnableAll);
        elements.disableAllBtn?.addEventListener('click', handleDisableAll);
        elements.resetDefaultsBtn?.addEventListener('click', handleResetDefaults);
        elements.searchInput?.addEventListener('input', handleSearch);

        await loadSettings();
        await renderCategories();
        updateMetricsCount();
    }

    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['enabledCategories', 'enabledMetrics']);
            
            if (!result.enabledCategories || Object.keys(result.enabledCategories).length === 0) {
                settings = getDefaultSettings();
                await saveSettings();
            } else {
                settings.enabledCategories = result.enabledCategories;
                settings.enabledMetrics = result.enabledMetrics;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = getDefaultSettings();
        }
    }

    function getDefaultSettings() {
        const defaults = {
            enabledCategories: {},
            enabledMetrics: {}
        };

        Object.keys(CATEGORY_DEFINITIONS).forEach(category => {
            defaults.enabledCategories[category] = true;
            defaults.enabledMetrics[category] = {};
            
            Object.keys(CATEGORY_DEFINITIONS[category].metrics).forEach(metricCode => {
                defaults.enabledMetrics[category][metricCode] = true;
            });
        });

        return defaults;
    }

    async function saveSettings() {
        try {
            await chrome.storage.sync.set({
                enabledCategories: settings.enabledCategories,
                enabledMetrics: settings.enabledMetrics
            });
            showStatus('Settings saved', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showStatus('Failed to save settings', 'error');
        }
    }

    async function renderCategories() {
        const template = document.getElementById('categoryTemplate');
        if (!template || !elements.categoriesGrid) return;

        elements.categoriesGrid.innerHTML = '';

        for (const [categoryName, categoryData] of Object.entries(CATEGORY_DEFINITIONS)) {
            const clone = template.content.cloneNode(true);
            
            const card = clone.querySelector('.category-card');
            const checkbox = clone.querySelector('.category-checkbox');
            const nameEl = clone.querySelector('.category-name');
            const descEl = clone.querySelector('.category-description');
            const iconEl = clone.querySelector('.category-icon');
            const metricsList = clone.querySelector('.metrics-list');

            card.dataset.category = categoryName;
            checkbox.checked = settings.enabledCategories[categoryName] !== false;
            nameEl.textContent = categoryName;
            descEl.textContent = categoryData.description;

            // Insert the icon path
            if (iconEl && categoryData.icon) {
                const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.setAttribute('stroke-linecap', 'round');
                pathEl.setAttribute('stroke-linejoin', 'round');
                pathEl.setAttribute('d', categoryData.icon);
                iconEl.appendChild(pathEl);
            }

            checkbox.addEventListener('change', (e) => {
                handleCategoryToggle(categoryName, e.target.checked);
            });

            await renderMetrics(metricsList, categoryName, categoryData.metrics);

            elements.categoriesGrid.appendChild(clone);
        }
    }

    async function renderMetrics(container, categoryName, metrics) {
        const template = document.getElementById('metricTemplate');
        if (!template) return;

        for (const [metricCode, metricName] of Object.entries(metrics)) {
            const clone = template.content.cloneNode(true);
            
            const checkbox = clone.querySelector('.metric-checkbox');
            const codeEl = clone.querySelector('.metric-code');
            const nameEl = clone.querySelector('.metric-name');
            const descEl = clone.querySelector('.metric-description');

            const isEnabled = settings.enabledMetrics[categoryName]?.[metricCode] !== false;
            checkbox.checked = isEnabled;
            checkbox.dataset.category = categoryName;
            checkbox.dataset.metric = metricCode;
            codeEl.textContent = metricCode;
            nameEl.textContent = metricName;

            // Load and set description
            const description = await loadMetricDescription(metricCode);
            if (descEl && description) {
                descEl.textContent = description;
            }

            checkbox.addEventListener('change', (e) => {
                handleMetricToggle(categoryName, metricCode, e.target.checked);
            });

            container.appendChild(clone);
        }
    }

    async function loadMetricDescription(metricCode) {
        try {
            const response = await fetch(`../docs/metrics/${metricCode}.txt`);
            if (!response.ok) return '';
            
            const text = await response.text();
            const lines = text.split('\n');
            
            // Find the "WHAT IT MEASURES" section
            const measureIndex = lines.findIndex(line => line.trim() === 'WHAT IT MEASURES');
            if (measureIndex === -1) return '';
            
            // Get the content after "WHAT IT MEASURES" until the next section or empty line
            let description = '';
            for (let i = measureIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === '' || line.match(/^[A-Z\s]+$/)) {
                    // Stop at empty line or next section header
                    if (description) break;
                    continue;
                }
                description += (description ? ' ' : '') + line;
            }
            
            return description;
        } catch (error) {
            console.error(`Failed to load description for ${metricCode}:`, error);
            return '';
        }
    }

    async function handleCategoryToggle(category, enabled) {
        settings.enabledCategories[category] = enabled;

        if (!settings.enabledMetrics[category]) {
            settings.enabledMetrics[category] = {};
        }

        Object.keys(CATEGORY_DEFINITIONS[category].metrics).forEach(metricCode => {
            settings.enabledMetrics[category][metricCode] = enabled;
        });

        const card = elements.categoriesGrid.querySelector(`[data-category="${category}"]`);
        if (card) {
            const metricCheckboxes = card.querySelectorAll('.metric-checkbox');
            metricCheckboxes.forEach(cb => {
                cb.checked = enabled;
            });
        }

        await saveSettings();
        updateMetricsCount();
    }

    async function handleMetricToggle(category, metricCode, enabled) {
        if (!settings.enabledMetrics[category]) {
            settings.enabledMetrics[category] = {};
        }

        settings.enabledMetrics[category][metricCode] = enabled;

        const categoryMetrics = CATEGORY_DEFINITIONS[category].metrics;
        const allEnabled = Object.keys(categoryMetrics).every(code => 
            settings.enabledMetrics[category][code] !== false
        );
        const noneEnabled = Object.keys(categoryMetrics).every(code => 
            settings.enabledMetrics[category][code] === false
        );

        if (allEnabled) {
            settings.enabledCategories[category] = true;
        } else if (noneEnabled) {
            settings.enabledCategories[category] = false;
        }

        const card = elements.categoriesGrid.querySelector(`[data-category="${category}"]`);
        if (card) {
            const categoryCheckbox = card.querySelector('.category-checkbox');
            if (categoryCheckbox) {
                categoryCheckbox.checked = !noneEnabled;
                categoryCheckbox.indeterminate = !allEnabled && !noneEnabled;
            }
        }

        await saveSettings();
        updateMetricsCount();
    }

    async function handleEnableAll() {
        Object.keys(CATEGORY_DEFINITIONS).forEach(category => {
            settings.enabledCategories[category] = true;
            settings.enabledMetrics[category] = {};
            
            Object.keys(CATEGORY_DEFINITIONS[category].metrics).forEach(metricCode => {
                settings.enabledMetrics[category][metricCode] = true;
            });
        });

        await saveSettings();
        await renderCategories();
        updateMetricsCount();
        showStatus('All metrics enabled', 'success');
    }

    async function handleDisableAll() {
        Object.keys(CATEGORY_DEFINITIONS).forEach(category => {
            settings.enabledCategories[category] = false;
            settings.enabledMetrics[category] = {};
            
            Object.keys(CATEGORY_DEFINITIONS[category].metrics).forEach(metricCode => {
                settings.enabledMetrics[category][metricCode] = false;
            });
        });

        await saveSettings();
        await renderCategories();
        updateMetricsCount();
        showStatus('All metrics disabled', 'success');
    }

    async function handleResetDefaults() {
        if (confirm('Reset all settings to defaults? This will enable all metrics.')) {
            settings = getDefaultSettings();
            await saveSettings();
            await renderCategories();
            updateMetricsCount();
            showStatus('Settings reset to defaults', 'success');
        }
    }

    function updateMetricsCount() {
        let enabledCount = 0;
        let totalCount = 0;

        Object.entries(CATEGORY_DEFINITIONS).forEach(([category, data]) => {
            const metricsInCategory = Object.keys(data.metrics).length;
            totalCount += metricsInCategory;

            Object.keys(data.metrics).forEach(metricCode => {
                if (settings.enabledMetrics[category]?.[metricCode] !== false) {
                    enabledCount++;
                }
            });
        });

        if (elements.enabledCount) {
            elements.enabledCount.textContent = enabledCount;
        }
        if (elements.totalCount) {
            elements.totalCount.textContent = totalCount;
        }

        // Update button states
        if (elements.enableAllBtn) {
            elements.enableAllBtn.disabled = (enabledCount === totalCount);
        }
        if (elements.disableAllBtn) {
            elements.disableAllBtn.disabled = (enabledCount === 0);
        }
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // Show all categories and metrics
            document.querySelectorAll('.category-card').forEach(card => {
                card.classList.remove('hidden');
                card.querySelectorAll('.metric-item').forEach(item => {
                    item.classList.remove('hidden');
                });
            });
            return;
        }

        document.querySelectorAll('.category-card').forEach(card => {
            const categoryName = card.querySelector('.category-name')?.textContent.toLowerCase() || '';
            const categoryMatches = categoryName.includes(searchTerm);
            
            let hasVisibleMetrics = false;
            card.querySelectorAll('.metric-item').forEach(item => {
                const metricCode = item.querySelector('.metric-code')?.textContent.toLowerCase() || '';
                const metricName = item.querySelector('.metric-name')?.textContent.toLowerCase() || '';
                const metricMatches = metricCode.includes(searchTerm) || metricName.includes(searchTerm);
                
                if (categoryMatches || metricMatches) {
                    item.classList.remove('hidden');
                    hasVisibleMetrics = true;
                } else {
                    item.classList.add('hidden');
                }
            });

            // Show category if it matches or has visible metrics
            if (categoryMatches || hasVisibleMetrics) {
                card.classList.remove('hidden');
                // Open details if there are matching metrics inside
                if (hasVisibleMetrics && !categoryMatches) {
                    card.setAttribute('open', '');
                }
            } else {
                card.classList.add('hidden');
            }
        });
    }

    function showStatus(message, type = 'info') {
        if (!elements.statusMessage) return;

        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status-message status-${type} visible`;

        setTimeout(() => {
            elements.statusMessage.classList.remove('visible');
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
