const MeasurelyAnimations = (() => {
    'use strict';

    const CONFIG = {
        LOGO_DURATION: 12000,
        SCORE_DURATION: 1300,
        ISSUE_COUNT_DURATION: 2100,
        NUMBER_UPDATE_INTERVAL: 30
    };

    // Check if user prefers reduced motion
    const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    function animateLogo() {
        const logo = document.querySelector('.measurely-logo');
        if (!logo) {
            console.warn('Logo element not found');
            return Promise.resolve();
        }

        // Skip animation if user prefers reduced motion
        if (prefersReducedMotion()) {
            logo.classList.add('complete');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            logo.classList.add('loading');
            
            setTimeout(() => {
                logo.classList.remove('loading');
                logo.classList.add('complete');
                resolve();
            }, CONFIG.LOGO_DURATION);
        });
    }

    function animateScore(elementId, score, issueCount = 0) {
        const container = document.getElementById(elementId);
        if (!container) {
            console.warn(`Score element ${elementId} not found`);
            return Promise.resolve();
        }

        const circle = container.querySelector('.progress-fg');
        const numberDisplay = container.querySelector('.score-number');
        const section = container.closest('.measurely-result-section');
        const issueDisplay = section ? section.querySelector('.issue-count') : null;

        if (!circle || !numberDisplay) {
            console.warn(`Score components missing in ${elementId}`);
            return Promise.resolve();
        }

        if (score === null) {
            return new Promise((resolve) => {
                container.classList.remove('score-pending');
                container.classList.add('score-disabled');
                numberDisplay.textContent = '-';
                numberDisplay.setAttribute('title', 'All metrics disabled for this category');
                circle.style.strokeDashoffset = '176';
                container.setAttribute('aria-valuenow', '0');
                resolve();
            });
        }

        return new Promise((resolve) => {
            const circumference = 176;
            const offset = circumference - (circumference * score / 100);
            
            container.classList.remove('score-pending', 'score-disabled');
            if (score >= 80) {
                container.classList.add('score-good');
            } else if (score >= 50) {
                container.classList.add('score-ok');
            } else {
                container.classList.add('score-poor');
            }
            
            container.setAttribute('aria-valuenow', Math.round(score).toString());
            if (numberDisplay.hasAttribute('title')) {
                numberDisplay.removeAttribute('title');
            }

            // If user prefers reduced motion, show final state immediately
            if (prefersReducedMotion()) {
                circle.style.strokeDashoffset = offset;
                numberDisplay.textContent = Math.round(score);
                
                if (issueCount > 0 && issueDisplay) {
                    issueDisplay.classList.add('visible');
                    issueDisplay.textContent = issueCount;
                }
                resolve();
                return;
            }
            
            requestAnimationFrame(() => {
                circle.style.strokeDashoffset = offset;
            });
            
            let currentScore = 0;
            const increment = score / 50;
            const numberAnimation = setInterval(() => {
                currentScore += increment;
                if (currentScore >= score) {
                    currentScore = score;
                    clearInterval(numberAnimation);
                    
                    container.setAttribute('aria-valuenow', Math.round(score).toString());
                    
                    if (issueCount > 0 && issueDisplay) {
                        animateIssueCount(issueDisplay, issueCount);
                    }
                    resolve();
                }
                const roundedScore = Math.round(currentScore);
                numberDisplay.textContent = roundedScore;
                container.setAttribute('aria-valuenow', roundedScore.toString());
            }, 30);
        });
    }

    function animateIssueCount(element, targetCount) {
        if (!element) return;

        element.classList.add('visible');

        // If user prefers reduced motion, show final count immediately
        if (prefersReducedMotion()) {
            element.textContent = targetCount;
            return;
        }
        
        const startTime = performance.now();
        const duration = CONFIG.ISSUE_COUNT_DURATION;

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const eased = 1 - Math.pow(1 - progress, 2);
            const currentCount = Math.round(eased * targetCount);
            
            element.textContent = currentCount;
            
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        }

        requestAnimationFrame(updateCount);
    }

    function resetAnimations() {
        const logo = document.querySelector('.measurely-logo');
        if (logo) {
            logo.classList.remove('loading', 'complete');
        }

        const scoreElements = [
            'score-performance',
            'score-security',
            'score-accessibility',
            'score-ux',
            'score-optimization',
            'score-seo'
        ];

        scoreElements.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;

            const circle = container.querySelector('.progress-fg');
            const numberDisplay = container.querySelector('.score-number');
            const section = container.closest('.measurely-result-section');
            const issueDisplay = section ? section.querySelector('.issue-count') : null;

            if (circle) {
                circle.style.strokeDashoffset = '176';
            }

            if (numberDisplay) {
                numberDisplay.textContent = '0';
            }

            container.classList.remove('score-good', 'score-ok', 'score-poor');
            container.classList.add('score-pending');

            container.setAttribute('aria-valuenow', '0');

            if (issueDisplay) {
                issueDisplay.classList.remove('visible');
                issueDisplay.textContent = '0';
            }
        });
    }

    async function runFullSequence(scores) {
        resetAnimations();

        await animateLogo();

        const scoreAnimations = [
            animateScore('score-performance', scores.performance.score, scores.performance.issues),
            animateScore('score-security', scores.security.score, scores.security.issues),
            animateScore('score-accessibility', scores.accessibility.score, scores.accessibility.issues),
            animateScore('score-ux', scores.ux.score, scores.ux.issues),
            animateScore('score-optimization', scores.optimization.score, scores.optimization.issues),
            animateScore('score-seo', scores.seo.score, scores.seo.issues)
        ];

        await Promise.all(scoreAnimations);
    }

    return {
        animateLogo,
        animateScore,
        resetAnimations,
        runFullSequence
    };
})();

window.MeasurelyAnimations = MeasurelyAnimations;