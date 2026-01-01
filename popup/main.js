(function() {
    'use strict';

    const CATEGORIES = {
        'Performance': { key: 'performance', title: 'Performance' },
        'Security': { key: 'security', title: 'Security' },
        'Accessibility': { key: 'accessibility', title: 'Accessibility' },
        'User Experience': { key: 'ux', title: 'User Experience' },
        'Resource Optimization': { key: 'optimization', title: 'Resource Optimization' },
        'SEO': { key: 'seo', title: 'SEO' }
    };

    const elements = {
        mainButton: null,
        copyButton: null,
        resultsButton: null,
        results: null,
        categoryTemplate: null
    };

    let currentResults = null;
    let isAnalyzing = false;
    let enabledCategories = [];

    function init() {
        elements.mainButton = document.getElementById('measurely-main-button');
        elements.copyButton = document.getElementById('measurely-copy-button');
        elements.resultsButton = document.getElementById('measurely-results-button');
        elements.results = document.getElementById('measurely-results');
        elements.categoryTemplate = document.getElementById('category-template');

        if (elements.mainButton) {
            elements.mainButton.addEventListener('click', handleAnalyzeClick);
        }

        if (elements.copyButton) {
            elements.copyButton.addEventListener('click', handleCopyClick);
        }

        if (elements.resultsButton) {
            elements.resultsButton.addEventListener('click', handleResultsClick);
        }

        updateResultsButtonState(false);
        loadEnabledCategories();
    }

    async function loadEnabledCategories() {
        try {
            const result = await chrome.storage.sync.get(['enabledCategories', 'enabledMetrics']);
            
            if (result.enabledMetrics) {
                enabledCategories = Object.entries(CATEGORIES)
                    .filter(([categoryName]) => {
                        const metrics = result.enabledMetrics[categoryName];
                        if (!metrics) return false;
                        return Object.values(metrics).some(enabled => enabled !== false);
                    })
                    .map(([, config]) => config);
            } else {
                enabledCategories = Object.values(CATEGORIES);
            }

            renderEmptyCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            enabledCategories = Object.values(CATEGORIES);
            renderEmptyCategories();
        }
    }

    function renderEmptyCategories() {
        if (!elements.results || !elements.categoryTemplate) return;

        elements.results.innerHTML = '';

        enabledCategories.forEach(category => {
            const clone = elements.categoryTemplate.content.cloneNode(true);
            const article = clone.querySelector('article');
            const heading = clone.querySelector('h2');
            const issuesData = clone.querySelector('data');
            const progressBar = clone.querySelector('[role="progressbar"]');
            const scoreData = clone.querySelector('[role="progressbar"] data');
            const circles = clone.querySelectorAll('circle');

            article.setAttribute('data-category', category.key);
            article.classList.add('measurely-result-section');
            
            heading.textContent = category.title;
            
            if (issuesData) {
                issuesData.classList.add('issue-count');
                issuesData.textContent = '0';
                issuesData.setAttribute('value', '0');
            }
            
            scoreData.textContent = '0';
            scoreData.setAttribute('value', '0');
            scoreData.classList.add('score-number');
            
            progressBar.setAttribute('id', `score-${category.key}`);
            progressBar.classList.add('measurely-score-value', 'score-pending');
            progressBar.setAttribute('aria-label', `${category.title} score`);

            const svg = clone.querySelector('svg');
            svg.classList.add('measurely-score-progress');

            if (circles.length >= 2) {
                circles[0].classList.add('progress-bg');
                circles[1].classList.add('progress-fg');
            }

            elements.results.appendChild(clone);
        });

        if (enabledCategories.length === 0) {
            const message = document.getElementById('measurely-no-metrics-message');
            if (message) {
                message.hidden = false;
            }
        }
    }

    async function handleAnalyzeClick() {
        if (isAnalyzing) return;

        isAnalyzing = true;
        updateButtonState('analyzing');
        updateResultsButtonState(false);

        if (elements.results) {
            elements.results.setAttribute('aria-busy', 'true');
        }

        renderEmptyCategories();
        MeasurelyAnimations.resetAnimations();

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }

            if (!isValidUrl(tab.url)) {
                throw new Error('Cannot analyze this page (chrome:// or edge:// URLs are not supported)');
            }

            currentResults = null;
            await chrome.storage.local.remove(['measurelyResults']);

            MeasurelyAnimations.animateLogo();

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['test/main.js']
            });

            listenForResults();

        } catch (error) {
            showError(error.message);
            isAnalyzing = false;
            updateButtonState('ready');
            if (elements.results) {
                elements.results.setAttribute('aria-busy', 'false');
            }
        }
    }

    function listenForResults() {
        const checkInterval = setInterval(() => {
            chrome.storage.local.get(['measurelyResults'], (result) => {
                if (result.measurelyResults && result.measurelyResults.length > 0) {
                    clearInterval(checkInterval);
                    currentResults = result.measurelyResults;
                    displayResults(result.measurelyResults, true);
                    isAnalyzing = false;
                    updateButtonState('complete');
                    if (elements.results) {
                        elements.results.setAttribute('aria-busy', 'false');
                    }
                }
            });
        }, 500);

        setTimeout(() => {
            if (isAnalyzing) {
                clearInterval(checkInterval);
                showError('Analysis timed out. Please try again.');
                isAnalyzing = false;
                updateButtonState('ready');
                if (elements.results) {
                    elements.results.setAttribute('aria-busy', 'false');
                }
            }
        }, 15000);
    }

    function displayResults(results, animate = true) {
        const scores = calculateCategoryScores(results);
        
        updateResultsButtonState(true);
        
        enabledCategories.forEach(category => {
            const categoryScore = scores[category.key];
            if (!categoryScore) return;

            const article = elements.results.querySelector(`[data-category="${category.key}"]`);
            if (!article) return;

            const issuesData = article.querySelector('header data');
            if (issuesData) {
                issuesData.textContent = categoryScore.issues;
                issuesData.setAttribute('value', categoryScore.issues);
            }
        });
        
        if (animate) {
            animateScoresOnly(scores);
        } else {
            setScoresInstantly(scores);
        }
    }
    
    async function animateScoresOnly(scores) {
        const scoreAnimations = enabledCategories.map(category => {
            const categoryScore = scores[category.key];
            if (!categoryScore) return Promise.resolve();
            
            return MeasurelyAnimations.animateScore(
                `score-${category.key}`, 
                categoryScore.score, 
                categoryScore.issues
            );
        });
        
        await Promise.all(scoreAnimations);
    }
    
    function setScoresInstantly(scores) {
        enabledCategories.forEach(category => {
            const elementId = `score-${category.key}`;
            const container = document.getElementById(elementId);
            if (!container) return;
            
            const categoryScore = scores[category.key];
            if (!categoryScore) return;

            const { score, issues, disabled } = categoryScore;
            const circle = container.querySelector('.progress-fg');
            const numberDisplay = container.querySelector('.score-number');
            const article = container.closest('article');
            const issueDisplay = article ? article.querySelector('.issue-count') : null;
            
            if (disabled || score === null) {
                container.classList.remove('score-pending');
                container.classList.add('score-disabled');
                if (numberDisplay) {
                    numberDisplay.textContent = '-';
                    numberDisplay.setAttribute('title', 'All metrics disabled for this category');
                }
                if (circle) {
                    circle.style.strokeDashoffset = 176;
                }
                container.setAttribute('aria-valuenow', '0');
                return;
            }
            
            container.classList.remove('score-pending', 'score-disabled');
            if (score >= 80) {
                container.classList.add('score-good');
            } else if (score >= 50) {
                container.classList.add('score-ok');
            } else {
                container.classList.add('score-poor');
            }
            
            if (circle) {
                const circumference = 176;
                const offset = circumference - (circumference * score / 100);
                circle.style.strokeDashoffset = offset;
            }
            
            if (numberDisplay) {
                numberDisplay.textContent = score;
                numberDisplay.removeAttribute('title');
            }
            
            container.setAttribute('aria-valuenow', score.toString());
            
            if (issueDisplay && issues > 0) {
                issueDisplay.classList.add('visible');
                issueDisplay.textContent = issues;
            }
        });
    }

    function calculateCategoryScores(results) {
        const categories = {
            Performance: 'performance',
            Security: 'security',
            Accessibility: 'accessibility',
            'User Experience': 'ux',
            'Resource Optimization': 'optimization',
            SEO: 'seo'
        };

        const scores = {};

        Object.entries(categories).forEach(([categoryName, categoryKey]) => {
            const categoryResults = results.filter(r => {
                const testCategory = r.Test.split(' (')[0];
                return testCategory === categoryName;
            });
            
            if (categoryResults.length === 0) {
                scores[categoryKey] = { score: null, issues: 0, disabled: true };
                return;
            }

            let totalScore = 0;
            let totalIssues = 0;
            let goodCount = 0;
            let needsImprovementCount = 0;
            let poorCount = 0;

            categoryResults.forEach(result => {
                totalIssues += result.Issues || 0;

                switch (result.Status) {
                    case 'good':
                        goodCount++;
                        break;
                    case 'needs-improvement':
                        needsImprovementCount++;
                        break;
                    case 'poor':
                        poorCount++;
                        break;
                }
            });

            const totalTests = categoryResults.length;
            const goodWeight = 100;
            const needsImprovementWeight = 50;
            const poorWeight = 0;

            totalScore = (
                (goodCount * goodWeight) +
                (needsImprovementCount * needsImprovementWeight) +
                (poorCount * poorWeight)
            ) / totalTests;

            scores[categoryKey] = {
                score: Math.round(totalScore),
                issues: totalIssues,
                disabled: false
            };
        });

        return scores;
    }

    function handleCopyClick() {
        if (!currentResults) {
            showError('No results to copy');
            return;
        }

        try {
            const resultsJSON = JSON.stringify(currentResults, null, 2);
            
            navigator.clipboard.writeText(resultsJSON).then(() => {
                const originalContent = elements.copyButton.innerHTML;
                elements.copyButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                
                setTimeout(() => {
                    elements.copyButton.innerHTML = originalContent;
                }, 1500);
            }).catch(err => {
                console.error('Copy failed:', err);
                showError('Failed to copy results');
            });

        } catch (error) {
            console.error('Copy error:', error);
            showError('Failed to prepare results for copying');
        }
    }

    function updateButtonState(state) {
        if (!elements.mainButton) return;

        switch (state) {
            case 'analyzing':
                elements.mainButton.disabled = true;
                elements.mainButton.textContent = 'Analyzing...';
                break;
            case 'complete':
                elements.mainButton.disabled = false;
                elements.mainButton.textContent = 'Re-analyze';
                break;
            case 'ready':
            default:
                elements.mainButton.disabled = false;
                elements.mainButton.textContent = 'Analyze';
                break;
        }
    }

    function updateResultsButtonState(hasResults) {
        if (!elements.resultsButton) return;
        elements.resultsButton.disabled = !hasResults;
    }

    function handleResultsClick() {
        if (!currentResults) return;

        chrome.tabs.create({
            url: chrome.runtime.getURL('results/index.html')
        });
    }

    function showError(message) {
        console.error('Measurely Error:', message);
        alert(`Measurely: ${message}`);
    }

    function isValidUrl(url) {
        if (!url) return false;
        
        const invalidPrefixes = [
            'chrome://',
            'chrome-extension://',
            'edge://',
            'about:',
            'data:',
            'file://'
        ];

        return !invalidPrefixes.some(prefix => url.startsWith(prefix));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
