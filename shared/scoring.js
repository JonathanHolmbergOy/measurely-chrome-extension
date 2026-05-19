(function() {
    'use strict';

    window.__MEASURELY_SCORING__ = {
        calculateMetricScore(metric) {
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
        },

        calculateCategoryScores(results) {
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
                    scores[categoryKey] = { score: null, issues: 0, disabled: true };
                    return;
                }

                const categoryScores = categoryResults
                    .filter(r => r.Status !== 'no-data')
                    .map(r => this.calculateMetricScore(r));

                const totalIssues = categoryResults.reduce((sum, r) => {
                    return sum + (r.Issues || 0);
                }, 0);

                scores[categoryKey] = {
                    score: categoryScores.length > 0
                        ? Math.round(categoryScores.reduce((sum, s) => sum + s, 0) / categoryScores.length)
                        : 0,
                    issues: totalIssues,
                    disabled: false
                };
            });

            return scores;
        }
    };
})();

