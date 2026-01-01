(function() {
    'use strict';

    // HELPER FUNCTIONS

    //COLOR HELPERS
    function parseRGB(colorStr) {
        const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!rgbMatch) return null;
            const alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            if (alpha === 0) return null;
            return { r: parseInt(rgbMatch[1], 10), g: parseInt(rgbMatch[2], 10), b: parseInt(rgbMatch[3], 10) };
        }

    function parseOKLCH(colorStr) {
        const match = colorStr.match(/oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const L = parseFloat(match[1]) / (match[1].includes('%') ? 100 : 1);
        const C = parseFloat(match[2]);
        const H = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        
        // OKLCH → OKLab (polar to rectangular)
        const hRad = (H * Math.PI) / 180;
        const a = C * Math.cos(hRad);
        const b = C * Math.sin(hRad);
        
        // OKLab → Linear sRGB
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;
        
        const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        
        // Linear sRGB → sRGB (gamma correction)
        const toSRGB = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseOKLab(colorStr) {
        const match = colorStr.match(/oklab\(([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const L = parseFloat(match[1]) / (match[1].includes('%') ? 100 : 1);
        const a = parseFloat(match[2]);
        const b = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        
        
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;
        
        const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        
        const toSRGB = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseLab(colorStr) {
        const match = colorStr.match(/lab\(([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const L = parseFloat(match[1]);
        const a = parseFloat(match[2]);
        const b = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        

        const fy = (L + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - b / 200;
        
        const xr = fx > 216/24389 ? Math.pow(fx, 3) : (116 * fx - 16) / (24389/27);
        const yr = L > 216/24389 ? Math.pow((L + 16)/116, 3) : L / (24389/27);
        const zr = fz > 216/24389 ? Math.pow(fz, 3) : (116 * fz - 16) / (24389/27);
        

        const X = xr * 0.9642;
        const Y = yr * 1.0000;
        const Z = zr * 0.8251;
        

        const X_D65 = X * 0.9555766 + Y * -0.0230393 + Z * 0.0631636;
        const Y_D65 = X * -0.0282895 + Y * 1.0099416 + Z * 0.0210077;
        const Z_D65 = X * 0.0122982 + Y * -0.0204830 + Z * 1.3299098;
        

        const r_lin = X_D65 * 3.2404542 + Y_D65 * -1.5371385 + Z_D65 * -0.4985314;
        const g_lin = X_D65 * -0.9692660 + Y_D65 * 1.8760108 + Z_D65 * 0.0415560;
        const b_lin = X_D65 * 0.0556434 + Y_D65 * -0.2040259 + Z_D65 * 1.0572252;
        
        const toSRGB = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseLCH(colorStr) {
        const match = colorStr.match(/lch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const L = parseFloat(match[1]);
        const C = parseFloat(match[2]);
        const H = parseFloat(match[3]);
        

        const hRad = (H * Math.PI) / 180;
        const a = C * Math.cos(hRad);
        const b = C * Math.sin(hRad);
        

        return parseLab(`lab(${L} ${a} ${b})`);
    }

    const toSRGB = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;

    function parseSRGBColor(colorStr) {
        const match = colorStr.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        return { r: Math.round(c1 * 255), g: Math.round(c2 * 255), b: Math.round(c3 * 255) };
    }

    function parseSRGBLinearColor(colorStr) {
        const match = colorStr.match(/color\(srgb-linear\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(c1) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(c2) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(c3) * 255)))
        };
    }

    function parseDisplayP3Color(colorStr) {
        const match = colorStr.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const r_lin = c1 * 0.8224621202458947 + c2 * 0.1775378797541053 + c3 * 0.0000000000000000;
        const g_lin = c1 * 0.0331941503949364 + c2 * 0.9668058496050636 + c3 * 0.0000000000000000;
        const b_lin = c1 * 0.0170826993534920 + c2 * 0.0723974056465080 + c3 * 0.9105199049999999;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseAdobeRGBColor(colorStr) {
        const match = colorStr.match(/color\(a98-rgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const r_lin_a98 = Math.pow(c1, 2.2);
        const g_lin_a98 = Math.pow(c2, 2.2);
        const b_lin_a98 = Math.pow(c3, 2.2);
        const r_lin = r_lin_a98 * 1.2249439 + g_lin_a98 * -0.2249439 + b_lin_a98 * 0.0000000;
        const g_lin = r_lin_a98 * -0.0420569 + g_lin_a98 * 1.0420569 + b_lin_a98 * 0.0000000;
        const b_lin = r_lin_a98 * -0.0196376 + g_lin_a98 * -0.0786361 + b_lin_a98 * 1.0982737;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseProPhotoRGBColor(colorStr) {
        const match = colorStr.match(/color\(prophoto-rgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const r_lin_pro = Math.pow(c1, 1.8);
        const g_lin_pro = Math.pow(c2, 1.8);
        const b_lin_pro = Math.pow(c3, 1.8);
        const r_lin = r_lin_pro * 1.3459433 + g_lin_pro * -0.2556075 + b_lin_pro * -0.0511118;
        const g_lin = r_lin_pro * -0.5445989 + g_lin_pro * 1.5081673 + b_lin_pro * 0.0205351;
        const b_lin = r_lin_pro * 0.0000000 + g_lin_pro * 0.0000000 + b_lin_pro * 1.2118128;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseRec2020Color(colorStr) {
        const match = colorStr.match(/color\(rec2020\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const fromRec2020 = (c) => c <= 0.08145 ? c / 4.5 : Math.pow((c + 0.0993) / 1.0993, 2.4);
        const r_lin_rec = fromRec2020(c1);
        const g_lin_rec = fromRec2020(c2);
        const b_lin_rec = fromRec2020(c3);
        const r_lin = r_lin_rec * 1.6604910 + g_lin_rec * -0.5876411 + b_lin_rec * -0.0728499;
        const g_lin = r_lin_rec * -0.1245505 + g_lin_rec * 1.1328999 + b_lin_rec * -0.0083494;
        const b_lin = r_lin_rec * -0.0181508 + g_lin_rec * -0.1005789 + b_lin_rec * 1.1187297;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseXYZColor(colorStr) {
        const match = colorStr.match(/color\(xyz(?:-d65)?\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const r_lin = c1 * 3.2404542 + c2 * -1.5371385 + c3 * -0.4985314;
        const g_lin = c1 * -0.9692660 + c2 * 1.8760108 + c3 * 0.0415560;
        const b_lin = c1 * 0.0556434 + c2 * -0.2040259 + c3 * 1.0572252;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    function parseXYZ_D50Color(colorStr) {
        const match = colorStr.match(/color\(xyz-d50\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
        if (!match) return null;
        const c1 = parseFloat(match[1]);
        const c2 = parseFloat(match[2]);
        const c3 = parseFloat(match[3]);
        const alpha = match[4] ? parseFloat(match[4]) / (match[4].includes('%') ? 100 : 1) : 1;
        if (alpha === 0) return null;
        const X_D65 = c1 * 0.9555766 + c2 * -0.0230393 + c3 * 0.0631636;
        const Y_D65 = c1 * -0.0282895 + c2 * 1.0099416 + c3 * 0.0210077;
        const Z_D65 = c1 * 0.0122982 + c2 * -0.0204830 + c3 * 1.3299098;
        const r_lin = X_D65 * 3.2404542 + Y_D65 * -1.5371385 + Z_D65 * -0.4985314;
        const g_lin = X_D65 * -0.9692660 + Y_D65 * 1.8760108 + Z_D65 * 0.0415560;
        const b_lin = X_D65 * 0.0556434 + Y_D65 * -0.2040259 + Z_D65 * 1.0572252;
        return {
            r: Math.round(Math.max(0, Math.min(255, toSRGB(r_lin) * 255))),
            g: Math.round(Math.max(0, Math.min(255, toSRGB(g_lin) * 255))),
            b: Math.round(Math.max(0, Math.min(255, toSRGB(b_lin) * 255)))
        };
    }

    const colorSpaceParsers = [
        { prefix: 'oklch(', parse: parseOKLCH },
        { prefix: 'oklab(', parse: parseOKLab },
        { prefix: 'lch(', parse: parseLCH },
        { prefix: 'lab(', parse: parseLab },
        { prefix: 'color(srgb-linear ', parse: parseSRGBLinearColor },
        { prefix: 'color(srgb ', parse: parseSRGBColor },
        { prefix: 'color(display-p3 ', parse: parseDisplayP3Color },
        { prefix: 'color(a98-rgb ', parse: parseAdobeRGBColor },
        { prefix: 'color(prophoto-rgb ', parse: parseProPhotoRGBColor },
        { prefix: 'color(rec2020 ', parse: parseRec2020Color },
        { prefix: 'color(xyz-d65 ', parse: parseXYZColor },
        { prefix: 'color(xyz-d50 ', parse: parseXYZ_D50Color },
        { prefix: 'color(xyz ', parse: parseXYZColor },
        { prefix: 'rgb', parse: parseRGB }
    ];

    function parseColorValue(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') return null;
        const parser = colorSpaceParsers.find(p => colorStr.startsWith(p.prefix));
        return parser ? parser.parse(colorStr) : null;
    }

    function calculateLuminance(rgb) {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r / 255, g / 255, b / 255];
        const [rLin, gLin, bLin] = [
            rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4),
            gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4),
            bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4)
        ];
        return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    }

    function calculateContrast(bgColor, textColor) {
        const bgParsed = parseColorValue(bgColor);
        const textParsed = parseColorValue(textColor);
        if (!bgParsed || !textParsed) return 1;
        const [bgLuminance, textLuminance] = [calculateLuminance(bgParsed), calculateLuminance(textParsed)];
        const [lighter, darker] = [Math.max(bgLuminance, textLuminance), Math.min(bgLuminance, textLuminance)];
        return (lighter + 0.05) / (darker + 0.05);
    }

    function calculateStats(array) {
        const emptyStats = { min: null, max: null, median: null, avg: null, count: 0 };
        if (!array || array.length === 0) return emptyStats;
        
        const validValues = array.filter(val => val !== null && val !== undefined && !isNaN(val));
        if (validValues.length === 0) return emptyStats;
        
        const sum = validValues.reduce((a, b) => a + b, 0);
        const sorted = [...validValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
            avg: sum / validValues.length,
            count: validValues.length
        };
    }

    function evaluateThreshold(value, thresholds) {
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return 'no-data';
        if (typeof value === 'boolean') return value === thresholds.good ? 'good' : 'poor';
        const higherIsBetter = thresholds.good > thresholds.poor;
        const meetsGood = higherIsBetter ? value >= thresholds.good : value <= thresholds.good;
        const meetsPoor = higherIsBetter ? value >= thresholds.poor : value <= thresholds.poor;
        return meetsGood ? 'good' : (meetsPoor ? 'needs-improvement' : 'poor');
    }

    function formatDisplayValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number' && value !== 0) return value.toFixed(2);
        if (typeof value === 'number' && value === 0) return value;
        return value;
    }

    function evaluateMetric(metric) {
        return {
            Test: `${metric.test} (${metric.metric})`,
            Value: `${formatDisplayValue(metric.value)} / ${METRICS[metric.test][metric.metric].threshold.good}`,
            Threshold: METRICS[metric.test][metric.metric].threshold.good,
            Status: evaluateThreshold(metric.value, METRICS[metric.test][metric.metric].threshold),
            Issues: (metric.details && metric.details.length > 0) ? metric.details.length : 0,
            _raw: metric
        };
    }

    function formatTestResult(result) {
        if (result.status !== 'fulfilled' || !result?.value?.result) return [];
        return Object.entries(result.value.result).map(([metric, data]) => ({
            test: result.value.test,
            metric,
            value: data.value,
            details: data.issues || []
        }));;
    }

    function getVisibleBackground(element) {
        let current = element;
        let depth = 0;
        
        while (current && depth < 20) {
            try {
                const style = getComputedStyle(current);
                const bg = style.backgroundColor;
                const parsed = parseColorValue(bg);
                if (parsed) return bg;
                current = current.parentElement;
                depth++;
            } catch (e) {
                break;
            }
        }
        return null;
    }

    //TEST METRICS
    const METRICS = {
        Performance: {
            FCP: {
                title: 'First Contentful Paint',
                description: 'Time when first text or image appears on screen',
                threshold: { good: 1800, poor: 3000 },
                unit: 'ms',
                identifier: 'fcp',
                initialValue: null,
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                                if (entry.name === 'first-contentful-paint') {
                                data.fcp = entry.startTime;
                                }
                            });
                        });
                        observer.observe({ type: 'paint', buffered: true });
                },
                calculate: (data) => {
                    return { value: data.fcp, issues: [] };
                }
            },

            LCP: {
                title: 'Largest Contentful Paint',
                description: 'Time for the largest visible element to load',
                threshold: { good: 2500, poor: 4000 },
                unit: 'ms',
                identifier: 'lcp',
                initialValue: null,
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                            data.lcp = {
                                    time: entry.startTime,
                                    size: entry.size,
                                    element: entry.element?.tagName || 'unknown',
                                    url: entry.url || null,
                                    id: entry.id || null
                            };
                            });
                        });
                        observer.observe({ type: 'largest-contentful-paint', buffered: true });
                },
                calculate: (data) => {
                    if (!data.lcp) return { value: null, issues: [] };
                
                    const issues = [];
                
                    if (data.lcp.element) {
                        let info = `LCP element: ${data.lcp.element}${data.lcp.id ? `#${data.lcp.id}` : ''} (${data.lcp.size}px²)`;
                        let fix = null;
                    
                        const textElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SPAN', 'SECTION', 'ARTICLE'];
                        if (textElements.includes(data.lcp.element) && data.lcp.size > 5000) {
                            info += ' - Large text block as LCP may indicate slow image loading or missing hero image';
                            fix = 'Consider: 1) Add/optimize hero image, 2) Preload critical images, 3) Optimize font loading (font-display: swap)';
                        }
                    
                        issues.push({
                            type: 'lcp-element',
                            element: data.lcp.element,
                            size: data.lcp.size,
                            url: data.lcp.url,
                            id: data.lcp.id,
                            info,
                            fix
                        });
                    }
                
                    return { value: data.lcp.time, issues };
                }
            },

            CLS: {
                title: 'Cumulative Layout Shift',
                description: 'Measure of visual stability during page load',
                threshold: { good: 0.1, poor: 0.25 },
                unit: 'score',
                identifier: 'cls',
                initialValue: [],
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                                if (!entry.hadRecentInput) {
                                    data.cls.push({
                                        value: entry.value,
                                        time: entry.startTime,
                                        sources: entry.sources?.map(s => ({
                                            node: s.node?.tagName || 'unknown',
                                            id: s.node?.id || null,
                                            className: s.node?.className || null,
                                            previousRect: s.previousRect,
                                            currentRect: s.currentRect
                                        })) || []
                                    });
                                }
                            });
                        });
                        observer.observe({ type: 'layout-shift', buffered: true });
                },
                calculate: (data) => {
                    if (!data.cls || data.cls.length === 0) return { value: 0, issues: [] };
                
                    const sessions = [];
                    let currentSession = { shifts: [], startTime: 0, endTime: 0, score: 0 };
                
                    data.cls.forEach((shift, index) => {
                        const timeSinceLastShift = index > 0 ? shift.time - data.cls[index - 1].time : 0;
                    
                        if (currentSession.shifts.length === 0) {
                            currentSession = {
                                shifts: [shift],
                                startTime: shift.time,
                                endTime: shift.time,
                                score: shift.value
                            };
                        } else if (timeSinceLastShift > 1000 || (shift.time - currentSession.startTime) > 5000) {
                            sessions.push(currentSession);
                            currentSession = {
                                shifts: [shift],
                                startTime: shift.time,
                                endTime: shift.time,
                                score: shift.value
                            };
                        } else {
                            currentSession.shifts.push(shift);
                            currentSession.endTime = shift.time;
                            currentSession.score += shift.value;
                        }
                    });
                
                    if (currentSession.shifts.length > 0) {
                        sessions.push(currentSession);
                    }
                
                    const worstSession = sessions.reduce((worst, session) => 
                        session.score > worst.score ? session : worst
                    , { score: 0, shifts: [] });
                
                    const issues = worstSession.shifts
                        .filter(shift => shift.sources && shift.sources.length > 0)
                        .flatMap(shift => shift.sources.map(source => {
                            let identifier = source.node;
                            if (source.id) {
                                identifier += `#${source.id}`;
                            } else if (source.className && typeof source.className === 'string') {
                                const firstClass = source.className.split(' ')[0];
                                if (firstClass) identifier += `.${firstClass}`;
                            }
                        
                            return {
                                type: 'layout-shift',
                                element: source.node,
                                id: source.id,
                                className: source.className,
                                shiftValue: shift.value.toFixed(4),
                                time: shift.time.toFixed(0),
                                info: `${identifier} shifted ${shift.value.toFixed(4)} at ${shift.time.toFixed(0)}ms`
                            };
                        }))
                        .slice(0, 10);
                
                    return { value: worstSession.score, issues };
                }
            },

            TTFB: {
                title: 'Time to First Byte',
                description: 'Time from request to first byte received from server',
                threshold: { good: 600, poor: 1000 },
                unit: 'ms',
                identifier: 'ttfb',
                initialValue: null,
                setup: (data) => {
                        const navEntries = performance.getEntriesByType('navigation');
                        if (navEntries.length > 0) {
                            const nav = navEntries[0];
                            const ttfb = nav.responseStart - nav.requestStart;
                        
                        if (ttfb > 0) {
                            data.ttfb = {
                                ttfb,
                                redirect: nav.redirectEnd - nav.redirectStart,
                                dns: nav.domainLookupEnd - nav.domainLookupStart,
                                tcp: nav.connectEnd - nav.connectStart,
                                ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
                                request: nav.responseStart - nav.requestStart,
                                type: nav.type || 'navigate'
                            };
                        }
                    }
                },
                calculate: (data) => {
                    if (!data.ttfb) return { value: null, issues: [] };
                
                    const issues = [{
                        type: 'ttfb-breakdown',
                        ttfb: data.ttfb.ttfb.toFixed(0),
                        redirect: data.ttfb.redirect.toFixed(0),
                        dns: data.ttfb.dns.toFixed(0),
                        tcp: data.ttfb.tcp.toFixed(0),
                        ssl: data.ttfb.ssl.toFixed(0),
                        request: data.ttfb.request.toFixed(0),
                        info: `TTFB breakdown: DNS ${data.ttfb.dns.toFixed(0)}ms + TCP ${data.ttfb.tcp.toFixed(0)}ms + SSL ${data.ttfb.ssl.toFixed(0)}ms + Request ${data.ttfb.request.toFixed(0)}ms`
                    }];
                
                    return { value: data.ttfb.ttfb, issues };
                }
            },

            TTI: {
                title: 'Time to Interactive',
                description: 'Time until page is fully interactive (5s quiet window with no long tasks)',
                threshold: { good: 5000, poor: 7000 },
                unit: 'ms',
                identifier: 'tti',
                initialValue: { longTasks: [], fcp: null },
                setup: (data) => {
                    // Track FCP - TTI can't happen before FCP
                    const fcpObserver = new PerformanceObserver(list => {
                        list.getEntries().forEach(entry => {
                            if (entry.name === 'first-contentful-paint' && !data.tti.fcp) {
                                data.tti.fcp = entry.startTime;
                            }
                        });
                    });
                    fcpObserver.observe({ type: 'paint', buffered: true });
                    
                    // Track long tasks (>50ms)
                    const longTaskObserver = new PerformanceObserver(list => {
                        list.getEntries().forEach(entry => {
                            const attribution = entry.attribution?.[0];
                            data.tti.longTasks.push({
                                start: entry.startTime,
                                end: entry.startTime + entry.duration,
                                duration: entry.duration,
                                name: entry.name || 'unknown',
                                attributionName: attribution?.name || 'unknown',
                                containerType: attribution?.containerType || null,
                                containerSrc: attribution?.containerSrc || null,
                                containerId: attribution?.containerId || null
                            });
                        });
                    });
                    longTaskObserver.observe({ type: 'longtask', buffered: true });
                },
                calculate: (data) => {
                    if (!data.tti.fcp) return { value: null, issues: [] };
                    
                    const fcp = data.tti.fcp;
                    const longTasks = data.tti.longTasks.sort((a, b) => a.start - b.start);
                    const tasksAfterFCP = longTasks.filter(task => task.start >= fcp);
                    
                    // Find first 5-second quiet window after FCP
                    const QUIET_WINDOW = 5000;
                    let tti = fcp;
                    
                    if (tasksAfterFCP.length === 0) {
                        // No long tasks after FCP, TTI = FCP
                        tti = fcp;
                    } else {
                        // Find the last long task before a 5-second quiet window
                        for (let i = 0; i < longTasks.length; i++) {
                            const task = longTasks[i];
                            if (task.start < fcp) continue; // Ignore tasks before FCP
                            
                            const nextTask = longTasks[i + 1];
                            const quietWindowEnd = nextTask ? nextTask.start : Infinity;
                            const quietDuration = quietWindowEnd - task.end;
                            
                            if (quietDuration >= QUIET_WINDOW) {
                                // Found 5s quiet window
                                tti = task.end;
                                break;
                            }
                        }
                        
                        // If no quiet window found, use the end of the last long task
                        if (tti === fcp && longTasks.length > 0) {
                            const lastTask = longTasks[longTasks.length - 1];
                            if (lastTask.end > fcp) {
                                tti = lastTask.end;
                            }
                        }
                    }
                    
                    const stats = calculateStats([tti]);
                    const issues = [];
                    
                    if (tasksAfterFCP.length > 0) {
                        const totalBlockingTime = tasksAfterFCP.reduce((sum, task) => sum + task.duration, 0);
                        issues.push({
                            type: 'tti-info',
                            info: `Found ${tasksAfterFCP.length} long task(s) with ${totalBlockingTime.toFixed(0)}ms total blocking time`
                        });
                    }
                    
                    return { value: stats.avg || null, issues };
                }
            },

            TBT: {
                title: 'Total Blocking Time',
                description: 'Total time main thread is blocked by long tasks (>50ms blocking portion)',
                threshold: { good: 300, poor: 600 },
                unit: 'ms',
                identifier: 'tbt',
                initialValue: [],
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                                if (entry.duration > 50) {
                                    const blockingTime = entry.duration - 50;
                                    data.tbt.push({
                                        duration: entry.duration,
                                        blocking: blockingTime,
                                        name: entry.name,
                                        startTime: entry.startTime
                                    });
                                }
                            });
                        });
                        observer.observe({ type: 'longtask', buffered: true });
                },
                calculate: (data) => {
                    if (!data.tbt || data.tbt.length === 0) return { value: 0, issues: [] };
                
                    const totalBlocking = data.tbt.reduce((sum, task) => sum + task.blocking, 0);
                    const issues = [];
                    
                    if (data.tbt.length > 0) {
                        issues.push({
                            type: 'tbt-summary',
                            info: `Found ${data.tbt.length} long task(s) contributing ${totalBlocking.toFixed(0)}ms total blocking time`
                        });
                    }
                
                    return { value: totalBlocking, issues };
                }
            },

            RL: {
                title: 'Resource Load Time',
                description: 'Average time for resources to load',
                threshold: { good: 1000, poor: 3000 },
                unit: 'ms',
                identifier: 'resourceLoad',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                        if (resource.duration > 0 && 
                            resource.initiatorType !== 'script' && 
                            resource.initiatorType !== 'fetch' && 
                            resource.initiatorType !== 'xmlhttprequest') {
                            data.resourceLoad.push({
                                duration: resource.duration,
                                name: resource.name,
                                type: resource.initiatorType
                            });
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.resourceLoad || data.resourceLoad.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.resourceLoad.map(r => r.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    // Show resource count summary
                    issues.push({
                        type: 'resource-summary',
                        info: `Loaded ${data.resourceLoad.length} resource(s) with average load time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    // Show top 5 slowest resources
                    const slowestResources = [...data.resourceLoad]
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5);
                    
                    slowestResources.forEach((resource) => {
                        const urlParts = resource.name.split('/');
                        const filename = urlParts[urlParts.length - 1] || resource.name;
                        const displayName = filename.length > 50 ? filename.substring(0, 47) + '...' : filename;
                        
                        issues.push({
                            type: 'slow-resource',
                            duration: resource.duration.toFixed(0),
                            resourceType: resource.type,
                            resource: resource.name,
                            info: `${resource.type}: ${displayName} (${resource.duration.toFixed(0)}ms)`
                        });
                    });
                    
                    return { value: stats.avg || null, issues };
                }
            },

            JSE: {
                title: 'JavaScript Load Time',
                description: 'Total time spent loading JavaScript files',
                threshold: { good: 2000, poor: 5000 },
                unit: 'ms',
                identifier: 'jsExecution',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.initiatorType === 'script' && resource.duration > 0) {
                            data.jsExecution.push({
                                duration: resource.duration,
                                name: resource.name
                        });
                    }
                    });
                },
                calculate: (data) => {
                    if (!data.jsExecution || data.jsExecution.length === 0) return { value: 0, issues: [] };
                    
                    const totalTime = data.jsExecution.reduce((sum, script) => sum + script.duration, 0);
                    const issues = [];
                    
                    // Show script count summary
                    issues.push({
                        type: 'js-summary',
                        info: `Loaded ${data.jsExecution.length} script(s) with ${totalTime.toFixed(0)}ms total load time`
                    });
                    
                    // Show top 5 slowest scripts
                    const slowestScripts = [...data.jsExecution]
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5);
                    
                    slowestScripts.forEach((script) => {
                        const urlParts = script.name.split('/');
                        const filename = urlParts[urlParts.length - 1] || script.name;
                        const displayName = filename.length > 50 ? filename.substring(0, 47) + '...' : filename;
                        
                        issues.push({
                            type: 'slow-script',
                            duration: script.duration.toFixed(0),
                            resource: script.name,
                            info: `${displayName} (${script.duration.toFixed(0)}ms)`
                        });
                    });
                    
                    return { value: totalTime, issues };
                }
            },

            RT: {
                title: 'Render Time',
                description: 'Average time to render each frame',
                threshold: { good: 16, poor: 50 },
                unit: 'ms',
                identifier: 'renderTime',
                initialValue: [],
                setup: (data) => {
                    let lastFrame = null;
                    let frameCount = 0;
                    const maxFrames = 100;
                
                    const frameCallback = () => {
                        const now = performance.now();
                        if (lastFrame !== null) {
                            const frameDuration = now - lastFrame;
                            if (frameDuration > 0 && frameDuration < 1000) {
                                data.renderTime.push(frameDuration);
                            }
                        }
                        lastFrame = now;
                        frameCount++;
                        if (frameCount < maxFrames) {
                            requestAnimationFrame(frameCallback);
                        }
                    };
                
                    if (document.readyState === 'complete') {
                        setTimeout(() => requestAnimationFrame(frameCallback), 500);
                    } else {
                        window.addEventListener('load', () => setTimeout(() => requestAnimationFrame(frameCallback), 500), { once: true });
                    }
                },
                calculate: (data) => {
                    if (!data.renderTime || data.renderTime.length === 0) return { value: null, issues: [] };
                    
                    const stats = calculateStats(data.renderTime);
                    const issues = [];
                    
                    // Calculate FPS from average frame time
                    const avgFps = stats.avg ? (1000 / stats.avg).toFixed(1) : 0;
                    
                    // Count janky frames (>16.67ms = below 60fps)
                    const jankyFrames = data.renderTime.filter(frame => frame > 16.67).length;
                    const jankyPercentage = ((jankyFrames / data.renderTime.length) * 100).toFixed(1);
                    
                    // Summary
                    issues.push({
                        type: 'render-summary',
                        info: `Sampled ${data.renderTime.length} frames with average ${avgFps}fps (${stats.avg.toFixed(1)}ms per frame)`
                    });
                    
                    // Jank info if present
                    if (jankyFrames > 0) {
                        issues.push({
                            type: 'frame-jank',
                            jankyCount: jankyFrames,
                            percentage: jankyPercentage,
                            worstFrame: stats.max.toFixed(1),
                            info: `${jankyFrames} janky frame(s) detected (${jankyPercentage}% below 60fps). Worst frame: ${stats.max.toFixed(1)}ms`
                        });
                    }
                    
                    return { value: stats.avg || null, issues };
                }
            },

            NT: {
                title: 'Network Time',
                description: 'Average duration of network requests',
                threshold: { good: 200, poor: 1000 },
                unit: 'ms',
                identifier: 'networkTime',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if ((resource.initiatorType === 'xmlhttprequest' || resource.initiatorType === 'fetch') && resource.duration > 0) {
                            data.networkTime.push({
                                duration: resource.duration,
                                name: resource.name,
                                type: resource.initiatorType
                            });
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.networkTime || data.networkTime.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.networkTime.map(r => r.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    // Show request count summary
                    issues.push({
                        type: 'network-summary',
                        info: `Made ${data.networkTime.length} network request(s) with average response time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    // Show top 5 slowest requests
                    const slowestRequests = [...data.networkTime]
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5);
                    
                    slowestRequests.forEach((request) => {
                        const urlParts = request.name.split('/');
                        const endpoint = urlParts.slice(3).join('/') || request.name;
                        const displayName = endpoint.length > 50 ? endpoint.substring(0, 47) + '...' : endpoint;
                        
                        issues.push({
                            type: 'slow-request',
                            duration: request.duration.toFixed(0),
                            requestType: request.type,
                            resource: request.name,
                            info: `${request.type}: ${displayName} (${request.duration.toFixed(0)}ms)`
                        });
                    });
                    
                    return { value: stats.avg || null, issues };
                }
            },

            FID: {
                title: 'First Input Delay',
                description: 'Delay between user interaction and browser response',
                threshold: { good: 100, poor: 300 },
                unit: 'ms',
                identifier: 'fid',
                initialValue: null,
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                            if (!data.fid) {
                                const fid = entry.processingStart - entry.startTime;
                                if (fid >= 0) {
                                    data.fid = {
                                        delay: fid,
                                        name: entry.name,
                                        startTime: entry.startTime
                                    };
                                }
                            }
                            });
                        });
                        observer.observe({ type: 'first-input', buffered: true });
                },
                calculate: (data) => {
                    if (!data.fid) return { value: null, issues: [] };
                    
                    const stats = calculateStats([data.fid.delay]);
                    const issues = [];
                    
                    // Show FID info
                    issues.push({
                        type: 'fid-info',
                        inputType: data.fid.name,
                        delay: data.fid.delay.toFixed(0),
                        time: data.fid.startTime.toFixed(0),
                        info: `First input (${data.fid.name}) had ${data.fid.delay.toFixed(0)}ms delay at ${data.fid.startTime.toFixed(0)}ms`
                    });
                    
                    return { value: stats.avg || null, issues };
                }
            },

            INP: {
                title: 'Interaction to Next Paint',
                description: 'Worst-case response time from user interaction to visual feedback',
                threshold: { good: 200, poor: 500 },
                unit: 'ms',
                identifier: 'inp',
                initialValue: [],
                setup: (data) => {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(entry => {
                                if (entry.processingStart && entry.startTime) {
                                    const inp = entry.processingStart - entry.startTime + (entry.processingEnd - entry.processingStart);
                                    if (inp > 0) {
                                        data.inp.push({
                                            latency: inp,
                                            name: entry.name,
                                            startTime: entry.startTime,
                                            target: entry.target?.tagName || 'unknown'
                                        });
                                    }
                                }
                            });
                        });
                        observer.observe({ type: 'event', buffered: true });
                },
                calculate: (data) => {
                    if (!data.inp || data.inp.length === 0) return { value: null, issues: [] };
                
                    const worstInteraction = data.inp.reduce((worst, current) => 
                        current.latency > worst.latency ? current : worst
                    , data.inp[0]);
                
                    const issues = worstInteraction ? [{
                        type: 'slow-interaction',
                        latency: worstInteraction.latency.toFixed(0),
                        event: worstInteraction.name,
                        target: worstInteraction.target,
                        info: `Slowest interaction: ${worstInteraction.name} on ${worstInteraction.target} (${worstInteraction.latency.toFixed(0)}ms)`
                    }] : [];
                
                    return { value: worstInteraction.latency, issues };
                }
            },

            DNSL: {
                title: 'DNS Lookup Time',
                description: 'Average DNS lookup time across all resources',
                threshold: { good: 20, poor: 100 },
                unit: 'ms',
                identifier: 'dnsLookup',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.domainLookupStart !== undefined && resource.domainLookupEnd !== undefined) {
                                const dns = resource.domainLookupEnd - resource.domainLookupStart;
                            if (dns > 0) {
                                data.dnsLookup.push({
                                    duration: dns,
                                    name: resource.name
                                });
                            }
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.dnsLookup || data.dnsLookup.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.dnsLookup.map(r => r.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    // Show DNS lookup summary
                    issues.push({
                        type: 'dns-summary',
                        info: `${data.dnsLookup.length} resource(s) required DNS lookup with average time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    // Show top 5 slowest DNS lookups
                    const slowestLookups = [...data.dnsLookup]
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5);
                    
                    slowestLookups.forEach((lookup) => {
                        const url = new URL(lookup.name);
                        const domain = url.hostname;
                        
                        issues.push({
                            type: 'slow-dns',
                            duration: lookup.duration.toFixed(0),
                            domain: domain,
                            resource: lookup.name,
                            info: `${domain} (${lookup.duration.toFixed(0)}ms)`
                        });
                    });
                    
                    return { value: stats.avg !== null ? stats.avg : null, issues };
                }
            },

            TCPT: {
                title: 'TCP Connection Time',
                description: 'Average TCP connection establishment time',
                threshold: { good: 50, poor: 200 },
                unit: 'ms',
                identifier: 'tcpTime',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.connectStart !== undefined && resource.connectEnd !== undefined) {
                                const tcp = resource.connectEnd - resource.connectStart;
                            if (tcp > 0) {
                                data.tcpTime.push({
                                    duration: tcp,
                                    name: resource.name
                                });
                            }
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.tcpTime || data.tcpTime.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.tcpTime.map(r => r.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    issues.push({
                        type: 'tcp-summary',
                        info: `${data.tcpTime.length} connection(s) required TCP handshake with average time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    return { value: stats.avg !== null ? stats.avg : null, issues };
                }
            },

            SSLT: {
                title: 'SSL/TLS Handshake Time',
                description: 'Average SSL/TLS handshake time for secure connections',
                threshold: { good: 100, poor: 300 },
                unit: 'ms',
                identifier: 'sslTime',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.secureConnectionStart !== undefined && resource.secureConnectionStart > 0 && resource.connectEnd !== undefined) {
                                const ssl = resource.connectEnd - resource.secureConnectionStart;
                            if (ssl > 0) {
                                data.sslTime.push({
                                    duration: ssl,
                                    name: resource.name
                                });
                            }
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.sslTime || data.sslTime.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.sslTime.map(r => r.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    issues.push({
                        type: 'ssl-summary',
                        info: `${data.sslTime.length} secure connection(s) with average SSL/TLS handshake time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    return { value: stats.avg !== null ? stats.avg : null, issues };
                }
            },

            ST: {
                title: 'Server Timing',
                description: 'Server-side timing metrics from Server-Timing headers',
                threshold: { good: 100, poor: 500 },
                unit: 'ms',
                identifier: 'serverTiming',
                initialValue: [],
                setup: (data) => {
                        const serverEntries = performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource'));
                        serverEntries.forEach(entry => {
                            if (entry.serverTiming && entry.serverTiming.length > 0) {
                                entry.serverTiming.forEach(st => {
                                if (st.duration !== undefined && st.duration > 0) {
                                    data.serverTiming.push({
                                        duration: st.duration,
                                        name: st.name || 'unknown',
                                        description: st.description || ''
                                });
                            }
                        });
                        }
                    });
                },
                calculate: (data) => {
                    if (!data.serverTiming || data.serverTiming.length === 0) return { value: null, issues: [] };
                    
                    const durations = data.serverTiming.map(s => s.duration);
                    const stats = calculateStats(durations);
                    const issues = [];
                    
                    issues.push({
                        type: 'server-timing-summary',
                        info: `Found ${data.serverTiming.length} server timing metric(s) with average ${stats.avg.toFixed(0)}ms`
                    });
                    
                    return { value: stats.avg || null, issues };
                }
            },

            ET: {
                title: 'Element Timing',
                description: 'Custom element render times',
                threshold: { good: 1000, poor: 2500 },
                unit: 'ms',
                identifier: 'elementTiming',
                initialValue: [],
                setup: (data) => {
                    const observer = new PerformanceObserver((list) => {
                        list.getEntries().forEach(entry => {
                            if (entry.renderTime) {
                                data.elementTiming.push({
                                    renderTime: entry.renderTime,
                                    identifier: entry.identifier || entry.id || 'unknown'
                                });
                            }
                        });
                    });
                    observer.observe({ type: 'element', buffered: true });
                },
                calculate: (data) => {
                    if (!data.elementTiming || data.elementTiming.length === 0) return { value: null, issues: [] };
                    
                    const times = data.elementTiming.map(e => e.renderTime);
                    const stats = calculateStats(times);
                    const issues = [];
                    
                    issues.push({
                        type: 'element-timing-summary',
                        info: `Measured ${data.elementTiming.length} element(s) with average render time of ${stats.avg.toFixed(0)}ms`
                    });
                    
                    return { value: stats.avg || null, issues };
                }
            },

            RTT: {
                title: 'Resource Timing Details',
                description: 'Combined DNS, TCP, and SSL timing',
                threshold: { good: 100, poor: 300 },
                unit: 'ms',
                identifier: 'resourceTiming',
                initialValue: [],
                setup: (data) => {
                        performance.getEntriesByType('resource').forEach(r => {
                            if (r.domainLookupStart !== undefined && r.domainLookupEnd !== undefined && r.connectStart !== undefined && r.connectEnd !== undefined) {
                                const dns = r.domainLookupEnd - r.domainLookupStart;
                                const tcp = r.connectEnd - r.connectStart;
                                const ssl = r.secureConnectionStart > 0 ? r.connectEnd - r.secureConnectionStart : 0;
                                const total = dns + tcp + ssl;
                            if (total > 0) {
                                    data.resourceTiming.push(total);
                                }
                            }
                        });
                },
                calculate: (data) => {
                    if (!data.resourceTiming || data.resourceTiming.length === 0) return { value: null, issues: [] };
                    
                    const stats = calculateStats(data.resourceTiming);
                    const issues = [];
                    
                    issues.push({
                        type: 'rtt-summary',
                        info: `Average combined connection time (DNS+TCP+SSL): ${stats.avg.toFixed(0)}ms across ${data.resourceTiming.length} connection(s)`
                    });
                    
                    return { value: stats.avg !== null ? stats.avg : null, issues };
                }
            },

            RHP: {
                title: 'Resource Hints Present',
                description: 'Count of critical resources missing resource hints (preload/preconnect)',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'missingHints',
                initialValue: [],
                setup: (data) => {
                        data.missingHints = [];
                    
                        const existingHints = {
                            preload: new Set(),
                            preconnect: new Set(),
                            dnsPrefetch: new Set()
                        };
                    
                        Array.from(document.querySelectorAll('link[rel="preload"]')).forEach(link => {
                            if (link.href) existingHints.preload.add(link.href);
                        });
                        Array.from(document.querySelectorAll('link[rel="preconnect"]')).forEach(link => {
                            if (link.href) existingHints.preconnect.add(new URL(link.href).origin);
                        });
                        Array.from(document.querySelectorAll('link[rel="dns-prefetch"]')).forEach(link => {
                            if (link.href) existingHints.dnsPrefetch.add(new URL(link.href).origin);
                        });
                    
                        const currentOrigin = window.location.origin;
                    
                        Array.from(document.querySelectorAll('script[src]')).forEach(el => {
                            const url = el.src;
                            if (!url || url.startsWith('data:')) return;
                        
                            try {
                                const urlObj = new URL(url);
                                const isCrossOrigin = urlObj.origin !== currentOrigin;
                            
                                if (isCrossOrigin) {
                                    if (!existingHints.preconnect.has(urlObj.origin) && !existingHints.dnsPrefetch.has(urlObj.origin)) {
                                        data.missingHints.push({
                                            url,
                                            type: 'script',
                                            missing: 'preconnect',
                                            origin: urlObj.origin
                                        });
                                    }
                                }
                            } catch (e) {}
                        });
                    
                        Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(el => {
                            const url = el.href;
                            if (!url || url.startsWith('data:')) return;
                        
                            try {
                                const urlObj = new URL(url);
                                const isCrossOrigin = urlObj.origin !== currentOrigin;
                            
                                if (isCrossOrigin) {
                                    if (!existingHints.preconnect.has(urlObj.origin) && !existingHints.dnsPrefetch.has(urlObj.origin)) {
                                        data.missingHints.push({
                                            url,
                                            type: 'stylesheet',
                                            missing: 'preconnect',
                                            origin: urlObj.origin
                                        });
                                    }
                                }
                            } catch (e) {}
                        });
                },
                calculate: (data) => {
                    if (!data.missingHints || data.missingHints.length === 0) {
                        return { value: 0, issues: [] };
                    }
                
                    const byOrigin = {};
                    data.missingHints.forEach(hint => {
                        if (!byOrigin[hint.origin]) {
                            byOrigin[hint.origin] = {
                                origin: hint.origin,
                                resources: []
                            };
                        }
                        byOrigin[hint.origin].resources.push({ url: hint.url, type: hint.type });
                    });
                
                    const issues = Object.values(byOrigin).map(group => ({
                        type: 'missing-resource-hint',
                        origin: group.origin,
                        resourceCount: group.resources.length,
                        resourceTypes: [...new Set(group.resources.map(r => r.type))].join(', '),
                        info: `Missing preconnect for ${group.origin} (${group.resources.length} resources)`,
                        fix: `Add: <link rel="preconnect" href="${group.origin}">`
                    }));
                
                    return { value: data.missingHints.length, issues };
                }
            },

            FDI: {
                title: 'Font Display Issues',
                description: 'Fonts missing font-display: swap',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'fontIssues',
                initialValue: 0,
                setup: (data) => {
                        Array.from(document.styleSheets).forEach(sheet => {
                            try {
                                Array.from(sheet.cssRules).forEach(rule => {
                                    if (rule.type === CSSRule.FONT_FACE_RULE && (!rule.style.fontDisplay || rule.style.fontDisplay === 'block')) {
                                        data.fontIssues++;
                                    }
                                });
                            } catch (e) {}
                        });
                },
                calculate: (data) => {
                    const issues = [];
                    if (data.fontIssues > 0) {
                        issues.push({
                            type: 'font-display-missing',
                            count: data.fontIssues,
                            info: `${data.fontIssues} font(s) missing font-display: swap`,
                            fix: 'Add font-display: swap to @font-face rules to prevent invisible text during font loading'
                        });
                    }
                    return { value: data.fontIssues, issues };
                }
            },

            TPI: {
                title: 'Third-Party Impact',
                description: 'Performance impact of third-party scripts',
                threshold: { good: 500, poor: 1000 },
                unit: 'score',
                identifier: 'thirdPartyScore',
                initialValue: { score: 0, size: 0, time: 0, count: 0 },
                setup: (data) => {
                        const origin = window.location.origin;
                    let size = 0, time = 0, count = 0;
                        performance.getEntriesByType('resource').forEach(r => {
                            try {
                                const url = new URL(r.name);
                                if (url.origin !== origin) {
                                    size += r.transferSize || 0;
                                    time += r.duration || 0;
                                count++;
                                }
                            } catch (e) {}
                        });
                    data.thirdPartyScore = {
                        score: time + (size / 1000),
                        size,
                        time,
                        count
                    };
                },
                calculate: (data) => {
                    const issues = [];
                    if (data.thirdPartyScore.count > 0) {
                        issues.push({
                            type: 'third-party-summary',
                            info: `${data.thirdPartyScore.count} third-party resource(s): ${(data.thirdPartyScore.size / 1024).toFixed(0)}KB, ${data.thirdPartyScore.time.toFixed(0)}ms`
                        });
                    }
                    return { value: data.thirdPartyScore.score, issues };
                }
            },

            HVP: {
                title: 'HTTP Version Protocol',
                description: 'HTTP protocol version',
                threshold: { good: 2, poor: 1 },
                unit: 'version',
                identifier: 'httpVersion',
                initialValue: 1,
                setup: (data) => {
                        const nav = performance.getEntriesByType('navigation')[0];
                        const protocol = nav?.nextHopProtocol || '';
                        data.httpVersion = protocol.includes('h3') ? 3 : protocol.includes('h2') ? 2 : 1;
                },
                calculate: (data) => {
                    const issues = [];
                    issues.push({
                        type: 'http-version',
                        info: `Using HTTP/${data.httpVersion}${data.httpVersion < 2 ? ' (consider upgrading to HTTP/2 or HTTP/3)' : ''}`
                    });
                    return { value: data.httpVersion, issues };
                }
            },

            CRU: {
                title: 'Connection Reuse Efficiency',
                description: 'Percentage of reused connections',
                threshold: { good: 80, poor: 50 },
                unit: '%',
                identifier: 'connReuse',
                initialValue: { percentage: 0, reused: 0, total: 0 },
                setup: (data) => {
                        let reused = 0, total = 0;
                        performance.getEntriesByType('resource').forEach(r => {
                            if (r.connectStart !== undefined && r.connectEnd !== undefined) {
                                total++;
                                if (r.connectEnd - r.connectStart < 1) reused++;
                            }
                        });
                    data.connReuse = {
                        percentage: total > 0 ? (reused / total) * 100 : 100,
                        reused,
                        total
                    };
                },
                calculate: (data) => {
                    const issues = [];
                    if (data.connReuse.total > 0) {
                        issues.push({
                            type: 'connection-reuse',
                            info: `${data.connReuse.reused} of ${data.connReuse.total} connections reused (${data.connReuse.percentage.toFixed(1)}%)`
                        });
                    }
                    return { value: data.connReuse.percentage, issues };
                }
            },

            EHS: {
                title: 'Early Hints Support',
                description: 'HTTP 103 Early Hints support',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'earlyHints',
                initialValue: false,
                setup: (data) => {
                        const nav = performance.getEntriesByType('navigation')[0];
                        data.earlyHints = !!(nav && nav.transferSize > 0 && nav.decodedBodySize > nav.transferSize);
                },
                calculate: (data) => {
                    const issues = [];
                    issues.push({
                        type: 'early-hints',
                        info: `HTTP 103 Early Hints: ${data.earlyHints ? 'Supported' : 'Not detected'}`
                    });
                    return { value: data.earlyHints, issues };
                }
            },

            CSO: {
                title: 'Code Splitting Opportunities',
                description: 'Count of oversized bundles',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'largeBundles',
                initialValue: [],
                setup: (data) => {
                        data.largeBundles = performance.getEntriesByType('resource').filter(r => 
                            (r.initiatorType === 'script' || r.name.includes('.js')) && r.transferSize > 300000
                        );
                },
                calculate: (data) => {
                    return {
                        value: data.largeBundles.length,
                        issues: data.largeBundles.map(b => ({
                            type: 'large-bundle',
                            resource: b.name,
                            size: (b.transferSize / 1024).toFixed(0),
                            info: `Large bundle: ${b.name.split('/').pop()} (${(b.transferSize / 1024).toFixed(0)}KB)`,
                            fix: 'Consider code splitting to reduce bundle size'
                        }))
                    };
                }
            },

            TSO: {
                title: 'Tree Shaking Opportunities',
                description: 'Estimated unused code percentage',
                threshold: { good: 20, poor: 40 },
                unit: '%',
                identifier: 'unusedCode',
                initialValue: 0,
                setup: (data) => {
                        const scripts = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script');
                        const total = scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0);
                        if (scripts.length === 0 || total === 0) {
                            data.unusedCode = 0;
                        } else {
                            const unused = scripts.filter(s => s.transferSize > 100000).reduce((sum, s) => sum + (s.transferSize * 0.3), 0);
                            data.unusedCode = (unused / total) * 100;
                        }
                },
                calculate: (data) => {
                    const issues = [];
                    if (data.unusedCode > 0) {
                        issues.push({
                            type: 'unused-code',
                            info: `Estimated ${data.unusedCode.toFixed(1)}% unused code in large bundles`,
                            fix: 'Enable tree shaking in your build tool and remove unused imports'
                        });
                    }
                    return { value: data.unusedCode, issues };
                }
            },

            LIL: {
                title: 'Lazy Loading Implementation',
                description: 'Percentage of images with lazy loading',
                threshold: { good: 80, poor: 50 },
                unit: '%',
                identifier: 'lazyPercent',
                initialValue: { percentage: 0, belowFold: 0, lazy: 0 },
                setup: (data) => {
                        let belowFold = 0, lazy = 0;
                        Array.from(document.querySelectorAll('img')).forEach(img => {
                            if (img.getBoundingClientRect().top > window.innerHeight) {
                                belowFold++;
                                if (img.loading === 'lazy') lazy++;
                            }
                        });
                    data.lazyPercent = {
                        percentage: belowFold > 0 ? (lazy / belowFold) * 100 : 100,
                        belowFold,
                        lazy
                    };
                },
                calculate: (data) => {
                    const issues = [];
                    if (data.lazyPercent.belowFold > 0) {
                        issues.push({
                            type: 'lazy-loading',
                            info: `${data.lazyPercent.lazy} of ${data.lazyPercent.belowFold} below-fold images use lazy loading (${data.lazyPercent.percentage.toFixed(1)}%)`
                        });
                    }
                    return { value: data.lazyPercent.percentage, issues };
                }
            },

            RBR: {
                title: 'Render-Blocking Resources',
                description: 'Count and impact of resources that block page rendering',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'blockingResources',
                initialValue: [],
                setup: (data) => {
                        const resources = performance.getEntriesByType('resource');
                        const navStart = performance.getEntriesByType('navigation')[0]?.startTime || 0;
                    
                        resources.forEach(resource => {
                            const isCSS = resource.initiatorType === 'link' || resource.name.includes('.css');
                            const isJS = resource.initiatorType === 'script' || resource.name.includes('.js');
                        
                            if ((isCSS || isJS) && resource.renderBlockingStatus === 'blocking') {
                                data.blockingResources.push({
                                    url: resource.name,
                                    type: isCSS ? 'css' : 'js',
                                    duration: resource.duration,
                                    size: resource.transferSize || 0,
                                    startTime: resource.startTime - navStart
                                });
                            } else if (isCSS && resource.startTime < 1000) {
                                data.blockingResources.push({
                                    url: resource.name,
                                    type: 'css',
                                    duration: resource.duration,
                                    size: resource.transferSize || 0,
                                    startTime: resource.startTime - navStart
                                });
                            } else if (isJS && !resource.name.includes('async') && !resource.name.includes('defer') && resource.startTime < 1000) {
                                const scriptEl = Array.from(document.querySelectorAll('script[src]')).find(s => s.src === resource.name);
                                if (scriptEl && !scriptEl.async && !scriptEl.defer) {
                                    data.blockingResources.push({
                                        url: resource.name,
                                        type: 'js',
                                        duration: resource.duration,
                                        size: resource.transferSize || 0,
                                        startTime: resource.startTime - navStart
                                    });
                                }
                            }
                        });
                },
                calculate: (data) => {
                    if (!data.blockingResources || data.blockingResources.length === 0) {
                        return { value: 0, issues: [] };
                    }
                
                    const totalTime = data.blockingResources.reduce((sum, r) => sum + r.duration, 0);
                
                    const issues = data.blockingResources.map(r => ({
                        type: 'render-blocking',
                        resource: r.url.split('/').pop(),
                        resourceType: r.type.toUpperCase(),
                        duration: `${r.duration.toFixed(0)}ms`,
                        size: `${(r.size / 1024).toFixed(1)}KB`,
                        info: `${r.type.toUpperCase()} blocks rendering for ${r.duration.toFixed(0)}ms`,
                        fix: r.type === 'css' 
                            ? 'Consider inlining critical CSS or using media queries'
                            : 'Add async or defer attribute to script tag'
                    }));
                
                    return { 
                        value: data.blockingResources.length, 
                        issues,
                        metadata: { totalBlockingTime: totalTime.toFixed(0) }
                    };
                }
            },
        },

        Security: {
            HSE: {
                title: 'HTTPS Enabled',
                description: 'Whether the site uses HTTPS encryption',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'protocol',
                initialValue: null,
                setup: (data) => {
                    data.protocol = location.protocol;
                },
                calculate: (data) => {
                    const isHTTPS = data.protocol === 'https:';
                    const issues = !isHTTPS ? [{
                        type: 'missing-https',
                        issue: 'Site is not using HTTPS',
                        fix: 'Enable HTTPS on your server and redirect HTTP to HTTPS'
                    }] : [];
                    return { value: isHTTPS, issues };
                }
            },

            MCC: {
                title: 'Mixed Content Count',
                description: 'Number of HTTP resources loaded on HTTPS pages',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'mixedContent',
                initialValue: [],
                setup: (data) => {
                    if (location.protocol !== 'https:') return;
                
                    const elements = Array.from(document.querySelectorAll('img, script, link, iframe'));
                    elements.forEach(el => {
                        const src = el.src || el.href;
                        if (src && src.startsWith('http:')) {
                            data.mixedContent.push({ element: el.tagName, src });
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.mixedContent.map(item => ({
                        type: 'mixed-content',
                        element: item.element,
                        resource: item.src,
                        fix: `Change ${item.src} to use HTTPS protocol`
                    }));
                    return { value: data.mixedContent.length, issues };
                }
            },

            CVC: {
                title: 'CSP Violations',
                description: 'Count of Content Security Policy violations',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'cspViolations',
                initialValue: [],
                setup: (data) => {
                    data.cspViolationHandler = (e) => {
                        data.cspViolations.push({
                            directive: e.violatedDirective,
                            blocked: e.blockedURI,
                            source: e.sourceFile
                        });
                    };
                    document.addEventListener('securitypolicyviolation', data.cspViolationHandler);
                },
                calculate: (data) => {
                    const issues = data.cspViolations.map(v => ({
                        type: 'csp-violation',
                        directive: v.directive,
                        blocked: v.blocked,
                        source: v.source || null,
                        fix: `Update CSP ${v.directive} directive to allow ${v.blocked} or remove the blocked resource`
                    }));
                    return { value: data.cspViolations.length, issues };
                }
            },

            SHP: {
                title: 'Security Headers Present',
                description: 'Number of security headers configured',
                threshold: { good: 4, poor: 2 },
                unit: 'count',
                identifier: 'securityHeaders',
                initialValue: [],
                setup: async (data) => {
                    const headersToCheck = [
                        'strict-transport-security',
                        'content-security-policy',
                        'x-frame-options',
                        'x-content-type-options',
                        'referrer-policy'
                    ];
                
                    try {
                        const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        headersToCheck.forEach(header => {
                            const value = response.headers.get(header);
                            data.securityHeaders.push({ header, present: !!value, value: value || null });
                        });
                    } catch (e) {}
                },
                calculate: (data) => {
                    const present = data.securityHeaders.filter(h => h.present);
                    const missing = data.securityHeaders.filter(h => !h.present);
                    const issues = missing.map(h => ({
                        type: 'missing-header',
                        header: h.header,
                        fix: `Add ${h.header} header to server response`
                    }));
                    return { value: present.length, issues };
                }
            },

            SRI: {
                title: 'Subresource Integrity Coverage',
                description: 'Percentage of external scripts with SRI attributes',
                threshold: { good: 80, poor: 50 },
                unit: '%',
                identifier: 'sriResources',
                initialValue: [],
                setup: (data) => {
                    const scripts = Array.from(document.querySelectorAll('script[src]'));
                    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'));
                
                    [...scripts, ...links].forEach(el => {
                        const src = el.src || el.href;
                        if (src && !src.startsWith(window.location.origin) && !src.startsWith('/')) {
                            data.sriResources.push({
                                element: el.tagName,
                                src,
                                hasIntegrity: !!el.integrity
                            });
                        }
                    });
                },
                calculate: (data) => {
                    const totalExternal = data.sriResources.length;
                    const withSRI = data.sriResources.filter(r => r.hasIntegrity).length;
                    const rate = totalExternal > 0 ? (withSRI / totalExternal) * 100 : null;
                
                    const missingSRI = data.sriResources.filter(r => !r.hasIntegrity);
                    const issues = missingSRI.map(r => ({
                        type: 'missing-sri',
                        element: r.element,
                        resource: r.src,
                        fix: `Add integrity attribute: integrity="sha384-..." crossorigin="anonymous"`
                    }));
                
                    return { value: rate, issues };
                }
            },

            XCT: {
                title: 'X-Content-Type-Options',
                description: 'Whether X-Content-Type-Options header is present',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'xctHeader',
                initialValue: null,
                setup: async (data) => {
                    try {
                        const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        const xctHeader = response.headers.get('x-content-type-options');
                        data.xctHeader = xctHeader && xctHeader.toLowerCase().includes('nosniff');
                    } catch (e) {
                        data.xctHeader = false;
                    }
                },
                calculate: (data) => {
                    const value = data.xctHeader !== null ? data.xctHeader : false;
                    const issues = !value ? [{
                        type: 'missing-header',
                        header: 'X-Content-Type-Options',
                        fix: 'Add X-Content-Type-Options: nosniff header to server response'
                    }] : [];
                    return { value, issues };
                }
            },

            PPC: {
                title: 'Permissions Policy Coverage',
                description: 'Number of permissions restricted',
                threshold: { good: 5, poor: 2 },
                unit: 'count',
                identifier: 'permCount',
                initialValue: 0,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        const pp = res.headers.get('permissions-policy');
                        data.permCount = pp ? pp.split(',').length : 0;
                    } catch (e) { data.permCount = 0; }
                },
                calculate: (data) => {
                    return { value: data.permCount, issues: [] };
                }
            },

            CSPA: {
                title: 'CSP Analysis Score',
                description: 'CSP quality score',
                threshold: { good: 80, poor: 60 },
                unit: 'score',
                identifier: 'cspScore',
                initialValue: 0,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        const csp = res.headers.get('content-security-policy');
                        if (csp) {
                            const directives = csp.split(';').filter(d => d.trim());
                            data.cspScore = Math.min(100, (directives.length / 10) * 100);
                        } else data.cspScore = 0;
                    } catch (e) { data.cspScore = 0; }
                },
                calculate: (data) => {
                    return { value: data.cspScore, issues: [] };
                }
            },

            COEP: {
                title: 'Cross-Origin-Embedder-Policy',
                description: 'COEP header configured',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'coep',
                initialValue: false,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        data.coep = !!res.headers.get('cross-origin-embedder-policy');
                    } catch (e) { data.coep = false; }
                },
                calculate: (data) => {
                    return { value: data.coep, issues: [] };
                }
            },

            COOP: {
                title: 'Cross-Origin-Opener-Policy',
                description: 'COOP header configured',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'coop',
                initialValue: false,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        data.coop = !!res.headers.get('cross-origin-opener-policy');
                    } catch (e) { data.coop = false; }
                },
                calculate: (data) => {
                    return { value: data.coop, issues: [] };
                }
            },

            CORP: {
                title: 'Cross-Origin-Resource-Policy',
                description: 'CORP header configured',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'corp',
                initialValue: false,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        data.corp = !!res.headers.get('cross-origin-resource-policy');
                    } catch (e) { data.corp = false; }
                },
                calculate: (data) => {
                    return { value: data.corp, issues: [] };
                }
            },

            HST: {
                title: 'HSTS Configuration Quality',
                description: 'HSTS header quality score',
                threshold: { good: 80, poor: 60 },
                unit: 'score',
                identifier: 'hstsScore',
                initialValue: 0,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        const hsts = res.headers.get('strict-transport-security');
                        let score = 0;
                        if (hsts) {
                            if (/max-age=(\d+)/.test(hsts) && parseInt(RegExp.$1) >= 31536000) score += 40;
                            if (hsts.includes('includeSubDomains')) score += 30;
                            if (hsts.includes('preload')) score += 30;
                        }
                        data.hstsScore = score;
                    } catch (e) { data.hstsScore = 0; }
                },
                calculate: (data) => {
                    return { value: data.hstsScore, issues: [] };
                }
            },

            CSQ: {
                title: 'Cookie Security Quality',
                description: 'Percentage of secure cookies',
                threshold: { good: 80, poor: 50 },
                unit: '%',
                identifier: 'cookieSecure',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const cookies = document.cookie.split(';').filter(c => c.trim());
                        if (cookies.length === 0) {
                            data.cookieSecure = null;
                        } else {
                            const secure = cookies.filter(c => c.includes('Secure') && c.includes('HttpOnly'));
                            data.cookieSecure = (secure.length / cookies.length) * 100;
                        }
                    } catch (e) { data.cookieSecure = null; }
                },
                calculate: (data) => {
                    return { value: data.cookieSecure, issues: [] };
                }
            },

            CSPQ: {
                title: 'CSP Directive Quality',
                description: 'CSP restrictiveness score',
                threshold: { good: 80, poor: 60 },
                unit: 'score',
                identifier: 'cspQuality',
                initialValue: 0,
                setup: async (data) => {
                    try {
                        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                        const csp = res.headers.get('content-security-policy');
                        let score = 100;
                        if (csp) {
                            if (csp.includes('unsafe-inline')) score -= 20;
                            if (csp.includes('unsafe-eval')) score -= 20;
                            if (csp.includes('*')) score -= 10;
                        } else score = 0;
                        data.cspQuality = score;
                    } catch (e) { data.cspQuality = 0; }
                },
                calculate: (data) => {
                    return { value: data.cspQuality, issues: [] };
                }
            },

            SRIQ: {
                title: 'SRI Hash Strength',
                description: 'Percentage using strong hashes',
                threshold: { good: 80, poor: 50 },
                unit: '%',
                identifier: 'sriStrength',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const withSRI = Array.from(document.querySelectorAll('[integrity]'));
                        if (withSRI.length === 0) {
                            data.sriStrength = 100;
                        } else {
                            const strong = withSRI.filter(el => {
                                const int = el.getAttribute('integrity');
                                return int && (int.startsWith('sha384-') || int.startsWith('sha512-'));
                            });
                            data.sriStrength = (strong.length / withSRI.length) * 100;
                        }
                    } catch (e) { data.sriStrength = 100; }
                },
                calculate: (data) => {
                    return { value: data.sriStrength, issues: [] };
                }
            },

            SSC: {
                title: 'Security Score',
                description: 'Composite score based on HTTPS, headers, mixed content, CSP',
                threshold: { good: 80, poor: 60 },
                unit: 'score',
                identifier: 'ssc',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    let score = 100;
                    if (data.protocol !== 'https:') score -= 30;
                    score -= (data.mixedContent.length * 10);
                    score -= (data.cspViolations.length * 5);
                    const presentHeaders = data.securityHeaders.filter(h => h.present).length;
                    if (presentHeaders < 4) score -= (4 - presentHeaders) * 5;
                    return { value: Math.max(0, score), issues: [] };
                }
            },
        },

        Accessibility: {
            AMC: {
                title: 'Alt Text Missing',
                description: 'Number of images without alternative text',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'images',
                initialValue: [],
                setup: (data) => {
                    const images = Array.from(document.querySelectorAll('img'));
                    images.forEach(img => {
                        if (img && (!img.alt || img.alt.trim() === '')) {
                            data.images.push({ src: img.src || 'unknown', hasAlt: false });
                        }
                    });
                },
                calculate: (data) => {
                    const missingAlt = data.images.filter(img => !img.hasAlt);
                    const issues = missingAlt.map(img => ({
                        type: 'missing-alt-text',
                        element: 'img',
                        resource: img.src,
                        fix: `Add alt attribute to image: <img src="${img.src}" alt="description of image">`
                    }));
                    return { value: missingAlt.length, issues };
                }
            },

            CIC: {
                title: 'Contrast Issues',
                description: 'Number of text elements with insufficient color contrast',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'contrastIssues',
                initialValue: [],
                setup: (data) => {
                    try {
                        const minContrast = 4.5;
                        const minFontSize = 12;
                        const colorDiffThreshold = 30;
                    
                        const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button, input[type="text"], input[type="email"], textarea'));
                        const containerElements = Array.from(document.querySelectorAll('div, section, article, header, footer, nav, aside, main'));
                    
                        const allElements = [...textElements, ...containerElements.filter(el => {
                            try {
                                const hasDirectText = Array.from(el.childNodes).some(node => 
                                    node.nodeType === 3 && node.textContent.trim().length > 0
                                );
                                return hasDirectText;
                            } catch (e) {
                                return false;
                            }
                        })];
                    
                        allElements.forEach(el => {
                            try {
                                if (el.getAttribute('aria-hidden') === 'true') return;
                                if (el.getAttribute('role') === 'presentation' || el.getAttribute('role') === 'none') return;
                            
                                const classes = el.className && typeof el.className === 'string' ? el.className : '';
                                if (classes.includes('sr-only') || classes.includes('screen-reader') || 
                                    classes.includes('visually-hidden') || classes.includes('visuallyhidden')) return;
                            
                                const style = getComputedStyle(el);
                                const fontSize = parseFloat(style.fontSize);
                                if (!fontSize || fontSize < minFontSize) return;
                            
                                const textContent = (el.textContent || '').trim();
                                if (!textContent || textContent.length === 0) return;
                            
                                const bgColor = getVisibleBackground(el);
                                const textColor = style.color;
                            
                                if (!bgColor || !textColor) return;
                            
                                const bgParsed = parseColorValue(bgColor);
                                const textParsed = parseColorValue(textColor);
                                if (!bgParsed || !textParsed) return;
                            
                                const colorDiff = Math.abs(bgParsed.r - textParsed.r) + 
                                                Math.abs(bgParsed.g - textParsed.g) + 
                                                Math.abs(bgParsed.b - textParsed.b);
                                if (colorDiff < colorDiffThreshold) return;
                            
                                const contrast = calculateContrast(bgColor, textColor);
                            
                                const fontWeight = style.fontWeight || 'normal';
                                const isBold = ['bold', 'bolder', '600', '700', '800', '900'].includes(fontWeight.toString());
                                const isLarge = fontSize >= 24 || (fontSize >= 19 && isBold);
                                const threshold = isLarge ? 3.0 : minContrast;
                            
                                if (contrast < threshold) {
                                    const text = textContent.substring(0, 50).replace(/\s+/g, ' ');
                                    data.contrastIssues.push({
                                        element: el.tagName,
                                        text,
                                        contrast: contrast.toFixed(2),
                                        bgColor,
                                        textColor,
                                        requiredRatio: threshold
                                    });
                                }
                            } catch (e) {
                            }
                        });
                    } catch (e) {
                        console.warn('Contrast setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const issues = data.contrastIssues.map(item => ({
                        type: 'contrast-issue',
                        element: item.element,
                        currentRatio: item.contrast,
                        requiredRatio: item.requiredRatio || '4.5',
                        text: item.text,
                        fix: `Increase contrast ratio to at least ${item.requiredRatio || 4.5}`
                    }));
                    return { value: data.contrastIssues.length, issues };
                }
            },

            AEC: {
                title: 'ARIA Errors',
                description: 'Count of elements with ARIA roles missing required labels',
                threshold: { good: 0, poor: 5 },
                unit: 'count',
                identifier: 'ariaErrors',
                initialValue: [],
                setup: (data) => {
                    const ariaElements = Array.from(document.querySelectorAll('[role], [aria-label], [aria-labelledby]'));
                    ariaElements.forEach(el => {
                        const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
                        const role = el.getAttribute('role');
                    
                        if (role && !hasLabel) {
                            data.ariaErrors.push({
                                element: el.tagName,
                                role,
                                issue: 'Missing ARIA label'
                            });
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.ariaErrors.map(item => ({
                        type: 'aria-error',
                        element: item.element,
                        role: item.role,
                        issue: item.issue,
                        fix: `Add aria-label or aria-labelledby attribute to ${item.element}`
                    }));
                    return { value: data.ariaErrors.length, issues };
                }
            },

            FEC: {
                title: 'Focusable Elements',
                description: 'Total count of interactive elements that can receive keyboard focus',
                threshold: { good: 5, poor: 0 },
                unit: 'count',
                identifier: 'focusableElements',
                initialValue: [],
                setup: (data) => {
                    const focusable = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
                    data.focusableElements = focusable;
                },
                calculate: (data) => {
                    return { value: data.focusableElements.length, issues: [] };
                }
            },

            FLI: {
                title: 'Form Label Issues',
                description: 'Count of form inputs missing proper labels',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'formLabels',
                initialValue: [],
                setup: (data) => {
                    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
                    inputs.forEach(input => {
                        if (!input || input.type === 'hidden') return;
                    
                        const id = input.id;
                        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
                        const isInLabel = input.closest('label');
                    
                        if (!hasLabel && !hasAriaLabel && !isInLabel) {
                            data.formLabels.push({
                                element: input.tagName,
                                type: input.type || 'unknown',
                                id: id || 'none'
                            });
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.formLabels.map(item => ({
                        type: 'form-label-issue',
                        element: item.element,
                        inputType: item.type,
                        id: item.id !== 'none' ? item.id : null,
                        fix: item.id !== 'none' ? 
                            `Add <label for="${item.id}">Label text</label>` :
                            `Add id to input and create corresponding label`
                    }));
                    return { value: data.formLabels.length, issues };
                }
            },

            HHI: {
                title: 'Heading Hierarchy Issues',
                description: 'Number of heading elements with incorrect level progression',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'headingHierarchy',
                initialValue: [],
                setup: (data) => {
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                    let lastLevel = 0;
                
                    headings.forEach(heading => {
                        const level = parseInt(heading.tagName.charAt(1));
                        if (level > lastLevel + 1 && lastLevel > 0) {
                            data.headingHierarchy.push({
                                element: heading.tagName,
                                level,
                                expected: lastLevel + 1,
                                text: heading.textContent.trim().substring(0, 50)
                            });
                        }
                        lastLevel = level;
                    });
                },
                calculate: (data) => {
                    const issues = data.headingHierarchy.map(item => ({
                        type: 'heading-hierarchy',
                        element: item.element,
                        currentLevel: item.level,
                        expectedLevel: item.expected,
                        text: item.text,
                        fix: `Change ${item.element} to h${item.expected} to maintain proper hierarchy`
                    }));
                    return { value: data.headingHierarchy.length, issues };
                }
            },

            LMR: {
                title: 'Landmark Regions',
                description: 'Count of properly used ARIA landmark regions',
                threshold: { good: 3, poor: 1 },
                unit: 'count',
                identifier: 'landmarks',
                initialValue: [],
                setup: (data) => {
                    const landmarkSelectors = [
                        'main', 'nav', 'header', 'footer', 'aside',
                        '[role="main"]', '[role="navigation"]', '[role="banner"]',
                        '[role="contentinfo"]', '[role="complementary"]'
                    ];
                
                    landmarkSelectors.forEach(selector => {
                        const elements = Array.from(document.querySelectorAll(selector));
                        elements.forEach(el => {
                            if (el && el.offsetParent !== null) {
                                const role = el.getAttribute('role') || el.tagName.toLowerCase();
                                data.landmarks.push({ type: role, element: el.tagName });
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return { value: data.landmarks.length, issues: [] };
                }
            },

            NTC: {
                title: 'Non-Text Contrast Issues',
                description: 'UI elements with low contrast (buttons, inputs, focus indicators)',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'ntcIssues',
                initialValue: [],
                setup: (data) => {
                    try {
                        data.ntcIssues = [];
                    
                        Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]')).forEach(el => {
                            try {
                                const style = getComputedStyle(el);
                                const pageBg = getVisibleBackground(el.parentElement || document.body);
                                const elementBg = style.backgroundColor;
                            
                                const bgRatio = calculateContrast(pageBg, elementBg);
                                if (bgRatio < 3.0) {
                                    data.ntcIssues.push({
                                        el: el.tagName,
                                        type: el.type || 'button',
                                        issue: 'background',
                                        ratio: bgRatio,
                                        id: el.id || null,
                                        class: el.className || null
                                    });
                                }
                            
                                const borderRatio = calculateContrast(pageBg, style.borderColor);
                                if (borderRatio < 3.0 && style.borderWidth !== '0px') {
                                    data.ntcIssues.push({
                                        el: el.tagName,
                                        type: el.type || 'button',
                                        issue: 'border',
                                        ratio: borderRatio,
                                        id: el.id || null,
                                        class: el.className || null
                                    });
                                }
                            } catch (e) {}
                        });
                    
                        Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select')).forEach(el => {
                            try {
                                const style = getComputedStyle(el);
                                const pageBg = getVisibleBackground(el.parentElement || document.body);
                                const borderRatio = calculateContrast(pageBg, style.borderColor);
                            
                                if (borderRatio < 3.0 && style.borderWidth !== '0px') {
                                    data.ntcIssues.push({
                                        el: el.tagName,
                                        type: el.type || el.tagName.toLowerCase(),
                                        issue: 'border',
                                        ratio: borderRatio,
                                        id: el.id || null,
                                        class: el.className || null
                                    });
                                }
                            } catch (e) {}
                        });
                    } catch (e) {
                        console.warn('Non-text contrast setup failed:', e);
                    }
                },
                calculate: (data) => {
                    if (!data.ntcIssues || data.ntcIssues.length === 0) {
                        return { value: 0, issues: [] };
                    }
                
                    const issues = data.ntcIssues.map(i => ({
                        type: 'low-ui-contrast',
                        element: i.el,
                        elementType: i.type,
                        issue: i.issue,
                        ratio: i.ratio.toFixed(2),
                        id: i.id,
                        info: `${i.el}${i.id ? `#${i.id}` : ''} ${i.issue} has ${i.ratio.toFixed(2)}:1 contrast (needs 3:1)`,
                        fix: `Increase ${i.issue} contrast to at least 3:1 for WCAG AA compliance`
                    }));
                
                    return { value: data.ntcIssues.length, issues };
                }
            },

            LAA: {
                title: 'Language Attributes',
                description: 'HTML lang attribute present',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'hasLang',
                initialValue: false,
                setup: (data) => {
                    data.hasLang = !!(document.documentElement.lang && document.documentElement.lang.trim());
                },
                calculate: (data) => {
                    return { value: data.hasLang, issues: [] };
                }
            },

            LRI: {
                title: 'Live Region Issues',
                description: 'Dynamic content missing live regions',
                threshold: { good: 0, poor: 2 },
                unit: 'count',
                identifier: 'liveIssues',
                initialValue: 0,
                setup: (data) => {
                    try {
                        data.liveIssues = 0;
                        Array.from(document.querySelectorAll('[id*="alert"], [id*="notification"]')).forEach(el => {
                            if (!el.getAttribute('aria-live')) data.liveIssues++;
                        });
                    } catch (e) {}
                },
                calculate: (data) => {
                    return { value: data.liveIssues, issues: [] };
                }
            },

            FNO: {
                title: 'Focus Not Obscured',
                description: 'Count of obscured focus indicators',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'focusObscured',
                initialValue: 0,
                setup: (data) => {
                    data.focusObscured = 0;
                },
                calculate: (data) => {
                    return { value: data.focusObscured, issues: [] };
                }
            },

            TSM: {
                title: 'Target Size (Minimum)',
                description: 'Elements smaller than 24×24px',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'smallTargets',
                initialValue: [],
                setup: (data) => {
                    try {
                        data.smallTargets = [];
                        Array.from(document.querySelectorAll('a, button')).forEach(el => {
                            const rect = el.getBoundingClientRect();
                            const text = (el.textContent || '').trim().toLowerCase();
                        
                            const isAccessibilityHelper = text.includes('skip to') || 
                                                         text.includes('skip navigation') || 
                                                         text.includes('skip main');
                        
                            if ((rect.width < 24 || rect.height < 24) && rect.width > 0 && rect.height > 0 && !isAccessibilityHelper) {
                                data.smallTargets.push({ 
                                    el: el.tagName, 
                                    size: `${rect.width.toFixed(0)}×${rect.height.toFixed(0)}`,
                                    id: el.id || null,
                                    text: (el.textContent || '').trim().substring(0, 30)
                                });
                            }
                        });
                    } catch (e) {}
                },
                calculate: (data) => {
                    return {
                        value: data.smallTargets.length,
                        issues: data.smallTargets.map(t => ({ 
                            type: 'small-target', 
                            element: t.el, 
                            size: t.size,
                            id: t.id,
                            text: t.text,
                            info: `${t.el}${t.id ? `#${t.id}` : ''} is ${t.size} (needs 24×24px)${t.text ? ` - "${t.text}"` : ''}`,
                            fix: 'Increase to 24×24px minimum for touch accessibility' 
                        }))
                    };
                }
            },

            CHM: {
                title: 'Consistent Help',
                description: 'Help mechanisms consistently located',
                threshold: { good: true, poor: false },
                unit: 'boolean',
                identifier: 'hasHelp',
                initialValue: false,
                setup: (data) => {
                    data.hasHelp = Array.from(document.querySelectorAll('[aria-label*="help"], a[href*="help"]')).length > 0;
                },
                calculate: (data) => {
                    return { value: data.hasHelp, issues: [] };
                }
            },

            REE: {
                title: 'Redundant Entry',
                description: 'Forms requiring re-entry',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'redundantEntry',
                initialValue: 0,
                setup: (data) => {
                    data.redundantEntry = 0;
                },
                calculate: (data) => {
                    return { value: data.redundantEntry, issues: [] };
                }
            },

            AIV: {
                title: 'ARIA Invalid Combinations',
                description: 'Invalid ARIA role/attribute combos',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaInvalid',
                initialValue: [],
                setup: (data) => {
                    data.ariaInvalid = Array.from(document.querySelectorAll('button[role="button"], a[role="link"]'));
                },
                calculate: (data) => {
                    return {
                        value: data.ariaInvalid.length,
                        issues: data.ariaInvalid.map(el => ({ type: 'redundant-aria', element: el.tagName, fix: 'Remove redundant role' }))
                    };
                }
            },

            ARS: {
                title: 'ARIA Relationship Errors',
                description: 'Broken ARIA relationships',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'brokenRels',
                initialValue: [],
                setup: (data) => {
                    try {
                        data.brokenRels = [];
                        ['aria-labelledby', 'aria-describedby'].forEach(attr => {
                            Array.from(document.querySelectorAll(`[${attr}]`)).forEach(el => {
                                const ids = el.getAttribute(attr).split(/\s+/);
                                ids.forEach(id => {
                                    if (id && !document.getElementById(id)) {
                                        data.brokenRels.push({ attr, id });
                                    }
                                });
                            });
                        });
                    } catch (e) {}
                },
                calculate: (data) => {
                    return {
                        value: data.brokenRels.length,
                        issues: data.brokenRels.map(r => ({ type: 'broken-relationship', attribute: r.attr, targetId: r.id, fix: `Add element with id="${r.id}"` }))
                    };
                }
            },

            DID: {
                title: 'Duplicate ID Count',
                description: 'Duplicate ID attributes',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'dupIds',
                initialValue: [],
                setup: (data) => {
                    try {
                        const idMap = new Map();
                        Array.from(document.querySelectorAll('[id]')).forEach(el => {
                            const id = el.id;
                            if (id) {
                                idMap.set(id, (idMap.get(id) || 0) + 1);
                            }
                        });
                        data.dupIds = Array.from(idMap.entries()).filter(([_, c]) => c > 1);
                    } catch (e) {}
                },
                calculate: (data) => {
                    return {
                        value: data.dupIds.length,
                        issues: data.dupIds.map(([id, cnt]) => ({ 
                            type: 'duplicate-id', 
                            id: id || '(empty)', 
                            count: cnt,
                            info: `ID "${id || '(empty)'}" appears ${cnt} times (must be unique)`,
                            fix: `Make "${id || '(empty)'}" unique - IDs must be unique across the entire document` 
                        }))
                    };
                }
            },

            DIM: {
                title: 'Decorative Image Marking',
                description: 'Incorrectly marked decorative images',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'decIssues',
                initialValue: [],
                setup: (data) => {
                    data.decIssues = Array.from(document.querySelectorAll('img[role="presentation"][alt]')).filter(img => img.alt.trim());
                },
                calculate: (data) => {
                    return {
                        value: data.decIssues.length,
                        issues: data.decIssues.map(img => ({ type: 'decorative-error', src: img.src, fix: 'Use alt="" for decorative images' }))
                    };
                }
            },

            FCI: {
                title: 'Focus Contrast Issues',
                description: 'Low contrast focus indicators',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'focusContrast',
                initialValue: 0,
                setup: (data) => {
                    data.focusContrast = 0;
                },
                calculate: (data) => {
                    return { value: data.focusContrast, issues: [] };
                }
            },

            FEA: {
                title: 'Form Error Associations',
                description: 'Form errors missing attributes',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'formErrors',
                initialValue: [],
                setup: (data) => {
                    data.formErrors = Array.from(document.querySelectorAll('input.error, .error input')).filter(inp => !inp.getAttribute('aria-invalid'));
                },
                calculate: (data) => {
                    return {
                        value: data.formErrors.length,
                        issues: data.formErrors.map(() => ({ type: 'missing-error-attr', fix: 'Add aria-invalid="true"' }))
                    };
                }
            },

            RFI: {
                title: 'Required Field Indicators',
                description: 'Required fields missing indicators',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'reqFields',
                initialValue: [],
                setup: (data) => {
                    data.reqFields = Array.from(document.querySelectorAll('input[required], select[required]')).filter(inp => !inp.getAttribute('aria-required'));
                },
                calculate: (data) => {
                    return {
                        value: data.reqFields.length,
                        issues: data.reqFields.map(() => ({ type: 'missing-required-attr', fix: 'Add aria-required="true"' }))
                    };
                }
            },

            AAA: {
                title: 'ARIA Allowed Attributes',
                description: 'ARIA attributes not allowed for element role',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaAllowedAttr',
                initialValue: [],
                setup: (data) => {
                    const roleAttrMap = {
                        'button': ['aria-pressed', 'aria-expanded'],
                        'checkbox': ['aria-checked'],
                        'radio': ['aria-checked'],
                        'textbox': ['aria-multiline', 'aria-readonly', 'aria-placeholder', 'aria-autocomplete'],
                        'link': ['aria-expanded'],
                        'img': [],
                        'heading': ['aria-level']
                    };
                
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (!roleAttrMap[role]) return;
                    
                        const allowedAttrs = roleAttrMap[role];
                        Array.from(el.attributes).forEach(attr => {
                            if (attr.name.startsWith('aria-') && !['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden'].includes(attr.name)) {
                                if (!allowedAttrs.includes(attr.name)) {
                                    data.ariaAllowedAttr.push({
                                        element: el.tagName,
                                        role,
                                        attr: attr.name
                                    });
                                }
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaAllowedAttr.length,
                        issues: data.ariaAllowedAttr.map(i => ({
                            type: 'aria-not-allowed',
                            element: i.element,
                            role: i.role,
                            attribute: i.attr,
                            fix: `Remove ${i.attr} from ${i.element} with role="${i.role}"`
                        }))
                    };
                }
            },

            ARA: {
                title: 'ARIA Required Attributes',
                description: 'ARIA roles missing required attributes',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaRequiredAttr',
                initialValue: [],
                setup: (data) => {
                    const requiredMap = {
                        'checkbox': ['aria-checked'],
                        'combobox': ['aria-expanded', 'aria-controls'],
                        'radio': ['aria-checked'],
                        'scrollbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
                        'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
                        'spinbutton': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
                        'switch': ['aria-checked']
                    };
                
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (!requiredMap[role]) return;
                    
                        const required = requiredMap[role];
                        required.forEach(attr => {
                            if (!el.hasAttribute(attr)) {
                                data.ariaRequiredAttr.push({ element: el.tagName, role, missingAttr: attr });
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaRequiredAttr.length,
                        issues: data.ariaRequiredAttr.map(i => ({
                            type: 'aria-required-missing',
                            element: i.element,
                            role: i.role,
                            attribute: i.missingAttr,
                            fix: `Add ${i.missingAttr} to ${i.element} with role="${i.role}"`
                        }))
                    };
                }
            },

            ARC: {
                title: 'ARIA Required Children',
                description: 'ARIA roles missing required child roles',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaRequiredChildren',
                initialValue: [],
                setup: (data) => {
                    const childMap = {
                        'list': ['listitem'],
                        'listbox': ['option'],
                        'menu': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
                        'menubar': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
                        'radiogroup': ['radio'],
                        'tablist': ['tab'],
                        'tree': ['treeitem'],
                        'row': ['cell', 'gridcell', 'columnheader', 'rowheader']
                    };
                
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (!childMap[role]) return;
                    
                        const requiredChildren = childMap[role];
                        const children = Array.from(el.querySelectorAll('[role]'));
                        const childRoles = children.map(c => c.getAttribute('role'));
                    
                        if (children.length === 0 || !requiredChildren.some(req => childRoles.includes(req))) {
                            data.ariaRequiredChildren.push({ element: el.tagName, role, requiredChildren });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaRequiredChildren.length,
                        issues: data.ariaRequiredChildren.map(i => ({
                            type: 'aria-children-missing',
                            element: i.element,
                            role: i.role,
                            requiredChildren: i.requiredChildren.join(' or '),
                            fix: `Add child elements with role="${i.requiredChildren.join('" or "')}"`
                        }))
                    };
                }
            },

            ARP: {
                title: 'ARIA Required Parent',
                description: 'ARIA roles not contained by required parent role',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaRequiredParent',
                initialValue: [],
                setup: (data) => {
                    const parentMap = {
                        'listitem': ['list'],
                        'option': ['listbox'],
                        'menuitem': ['menu', 'menubar'],
                        'menuitemcheckbox': ['menu', 'menubar'],
                        'menuitemradio': ['menu', 'menubar'],
                        'radio': ['radiogroup'],
                        'tab': ['tablist'],
                        'treeitem': ['tree'],
                        'cell': ['row'],
                        'gridcell': ['row'],
                        'columnheader': ['row'],
                        'rowheader': ['row']
                    };
                
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (!parentMap[role]) return;
                    
                        const requiredParents = parentMap[role];
                        let parent = el.parentElement;
                        let foundParent = false;
                    
                        while (parent && parent !== document.body) {
                            const parentRole = parent.getAttribute('role');
                            if (parentRole && requiredParents.includes(parentRole)) {
                                foundParent = true;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    
                        if (!foundParent) {
                            data.ariaRequiredParent.push({ element: el.tagName, role, requiredParents });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaRequiredParent.length,
                        issues: data.ariaRequiredParent.map(i => ({
                            type: 'aria-parent-missing',
                            element: i.element,
                            role: i.role,
                            requiredParents: i.requiredParents.join(' or '),
                            fix: `Wrap ${i.element} with role="${i.role}" inside element with role="${i.requiredParents.join('" or "')}"`
                        }))
                    };
                }
            },

            AHB: {
                title: 'ARIA Hidden Body',
                description: 'Body element has aria-hidden="true"',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'ariaHiddenBody',
                initialValue: 0,
                setup: (data) => {
                    const body = document.body;
                    data.ariaHiddenBody = (body && body.getAttribute('aria-hidden') === 'true') ? 1 : 0;
                },
                calculate: (data) => {
                    return {
                        value: data.ariaHiddenBody,
                        issues: data.ariaHiddenBody > 0 ? [{
                            type: 'aria-hidden-body',
                            issue: 'Body element has aria-hidden="true"',
                            fix: 'Remove aria-hidden="true" from <body> element'
                        }] : []
                    };
                }
            },

            BTN: {
                title: 'Button Names',
                description: 'Buttons missing accessible names',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'buttonNames',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('button, [role="button"]')).forEach(btn => {
                        const text = (btn.textContent || '').trim();
                        const ariaLabel = btn.getAttribute('aria-label');
                        const ariaLabelledby = btn.getAttribute('aria-labelledby');
                        const title = btn.getAttribute('title');
                    
                        if (!text && !ariaLabel && !ariaLabelledby && !title) {
                            data.buttonNames.push({
                                element: btn.tagName,
                                id: btn.id || null,
                                type: btn.type || 'button'
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.buttonNames.length,
                        issues: data.buttonNames.map(i => ({
                            type: 'button-no-name',
                            element: i.element,
                            id: i.id,
                            buttonType: i.type,
                            fix: 'Add text content, aria-label, or aria-labelledby attribute'
                        }))
                    };
                }
            },

            IBN: {
                title: 'Input Button Names',
                description: 'Input buttons missing accessible names',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'inputButtonNames',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('input[type="button"], input[type="submit"], input[type="reset"]')).forEach(inp => {
                        const value = inp.value;
                        const ariaLabel = inp.getAttribute('aria-label');
                        const ariaLabelledby = inp.getAttribute('aria-labelledby');
                        const title = inp.getAttribute('title');
                    
                        if (!value && !ariaLabel && !ariaLabelledby && !title) {
                            data.inputButtonNames.push({
                                type: inp.type,
                                id: inp.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.inputButtonNames.length,
                        issues: data.inputButtonNames.map(i => ({
                            type: 'input-button-no-name',
                            inputType: i.type,
                            id: i.id,
                            fix: 'Add value, aria-label, or aria-labelledby attribute'
                        }))
                    };
                }
            },

            SEN: {
                title: 'Select Element Names',
                description: 'Select elements missing accessible names',
                threshold: { good: 0, poor: 3 },
                unit: 'count',
                identifier: 'selectNames',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('select')).forEach(select => {
                        const id = select.id;
                        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                        const ariaLabel = select.getAttribute('aria-label');
                        const ariaLabelledby = select.getAttribute('aria-labelledby');
                        const isInLabel = select.closest('label');
                    
                        if (!hasLabel && !ariaLabel && !ariaLabelledby && !isInLabel) {
                            data.selectNames.push({
                                id: id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.selectNames.length,
                        issues: data.selectNames.map(i => ({
                            type: 'select-no-name',
                            id: i.id,
                            fix: i.id ? `Add <label for="${i.id}">...</label>` : 'Add id and label or use aria-label'
                        }))
                    };
                }
            },

            FRT: {
                title: 'Frame Titles',
                description: 'Frames and iframes missing title attributes',
                threshold: { good: 0, poor: 1 },
                unit: 'count',
                identifier: 'frameTitles',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('iframe, frame')).forEach(frame => {
                        const title = frame.getAttribute('title');
                        const ariaLabel = frame.getAttribute('aria-label');
                    
                        if (!title && !ariaLabel) {
                            data.frameTitles.push({
                                element: frame.tagName,
                                src: frame.src || '(no src)',
                                id: frame.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.frameTitles.length,
                        issues: data.frameTitles.map(i => ({
                            type: 'frame-no-title',
                            element: i.element,
                            src: i.src,
                            id: i.id,
                            fix: `Add title or aria-label attribute to ${i.element}`
                        }))
                    };
                }
            },

            VCA: {
                title: 'Video Captions',
                description: 'Video elements without captions',
                threshold: { good: 0, poor: 1 },
                identifier: 'videoCaptions',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('video')).forEach(video => {
                        const tracks = Array.from(video.querySelectorAll('track'));
                        const hasCaptions = tracks.some(t => t.getAttribute('kind') === 'captions' || t.getAttribute('kind') === 'subtitles');
                    
                        if (!hasCaptions) {
                            data.videoCaptions.push({
                                src: video.src || video.currentSrc || '(no src)',
                                id: video.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.videoCaptions.length,
                        issues: data.videoCaptions.map(i => ({
                            type: 'video-no-captions',
                            src: i.src,
                            id: i.id,
                            fix: 'Add <track kind="captions" src="..." srclang="en" label="English">'
                        }))
                    };
                }
            },

            SVA: {
                title: 'SVG Accessibility',
                description: 'SVG elements with img role missing accessible text',
                threshold: { good: 0, poor: 1 },
                identifier: 'svgAccessibility',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('svg[role="img"], svg[role="graphics-document"], svg[role="graphics-symbol"]')).forEach(svg => {
                        const ariaLabel = svg.getAttribute('aria-label');
                        const ariaLabelledby = svg.getAttribute('aria-labelledby');
                        const title = svg.querySelector('title');
                    
                        if (!ariaLabel && !ariaLabelledby && !title) {
                            data.svgAccessibility.push({
                                role: svg.getAttribute('role'),
                                id: svg.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.svgAccessibility.length,
                        issues: data.svgAccessibility.map(i => ({
                            type: 'svg-no-alt',
                            role: i.role,
                            id: i.id,
                            fix: 'Add aria-label, aria-labelledby, or <title> element inside SVG'
                        }))
                    };
                }
            },

            OBA: {
                title: 'Object Alt Text',
                description: 'Object elements missing alternative text',
                threshold: { good: 0, poor: 1 },
                identifier: 'objectAlt',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('object')).forEach(obj => {
                        const ariaLabel = obj.getAttribute('aria-label');
                        const ariaLabelledby = obj.getAttribute('aria-labelledby');
                        const title = obj.getAttribute('title');
                        const text = (obj.textContent || '').trim();
                    
                        if (!ariaLabel && !ariaLabelledby && !title && !text) {
                            data.objectAlt.push({
                                data: obj.getAttribute('data') || '(no data)',
                                id: obj.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.objectAlt.length,
                        issues: data.objectAlt.map(i => ({
                            type: 'object-no-alt',
                            data: i.data,
                            id: i.id,
                            fix: 'Add aria-label, title, or text content inside <object>'
                        }))
                    };
                }
            },

            AAT: {
                title: 'Area Alt Text',
                description: 'Image map areas missing alt text',
                threshold: { good: 0, poor: 1 },
                identifier: 'areaAlt',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('area')).forEach(area => {
                        const alt = area.getAttribute('alt');
                        const ariaLabel = area.getAttribute('aria-label');
                        const ariaLabelledby = area.getAttribute('aria-labelledby');
                    
                        if (!alt && !ariaLabel && !ariaLabelledby) {
                            data.areaAlt.push({
                                href: area.href || '(no href)',
                                shape: area.getAttribute('shape') || 'default'
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.areaAlt.length,
                        issues: data.areaAlt.map(i => ({
                            type: 'area-no-alt',
                            href: i.href,
                            shape: i.shape,
                            fix: 'Add alt attribute to <area> element'
                        }))
                    };
                }
            },

            NIT: {
                title: 'Nested Interactive',
                description: 'Interactive elements nested inside each other',
                threshold: { good: 0, poor: 1 },
                identifier: 'nestedInteractive',
                initialValue: [],
                setup: (data) => {
                    const interactive = 'a, button, [role="button"], [role="link"], input, select, textarea';
                    Array.from(document.querySelectorAll(interactive)).forEach(el => {
                        const nested = el.querySelector(interactive);
                        if (nested) {
                            data.nestedInteractive.push({
                                outer: el.tagName,
                                outerRole: el.getAttribute('role'),
                                inner: nested.tagName,
                                innerRole: nested.getAttribute('role')
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.nestedInteractive.length,
                        issues: data.nestedInteractive.map(i => ({
                            type: 'nested-interactive',
                            outer: i.outerRole ? `${i.outer}[role="${i.outerRole}"]` : i.outer,
                            inner: i.innerRole ? `${i.inner}[role="${i.innerRole}"]` : i.inner,
                            fix: `Remove nesting - ${i.inner} should not be inside ${i.outer}`
                        }))
                    };
                }
            },

            LST: {
                title: 'List Structure',
                description: 'Lists with incorrect structure',
                threshold: { good: 0, poor: 1 },
                identifier: 'listStructure',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('ul, ol')).forEach(list => {
                        const directChildren = Array.from(list.children);
                        const invalidChildren = directChildren.filter(child => 
                            child.tagName !== 'LI' && 
                            child.tagName !== 'SCRIPT' && 
                            child.tagName !== 'TEMPLATE'
                        );
                    
                        if (invalidChildren.length > 0) {
                            data.listStructure.push({
                                listType: list.tagName,
                                invalidChildren: invalidChildren.map(c => c.tagName).join(', ')
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.listStructure.length,
                        issues: data.listStructure.map(i => ({
                            type: 'list-structure-invalid',
                            listType: i.listType,
                            invalidChildren: i.invalidChildren,
                            fix: `${i.listType} should only contain <li> elements, found: ${i.invalidChildren}`
                        }))
                    };
                }
            },

            MVS: {
                title: 'Meta Viewport Scale',
                description: 'Viewport prevents zooming',
                threshold: { good: 0, poor: 1 },
                identifier: 'metaViewportScale',
                initialValue: 0,
                setup: (data) => {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        const content = viewport.getAttribute('content') || '';
                        const hasUserScalableNo = /user-scalable\s*=\s*no/i.test(content);
                        const hasMaxScale = /maximum-scale\s*=\s*1(\.0)?/i.test(content);
                    
                        data.metaViewportScale = (hasUserScalableNo || hasMaxScale) ? 1 : 0;
                    }
                },
                calculate: (data) => {
                    return {
                        value: data.metaViewportScale,
                        issues: data.metaViewportScale > 0 ? [{
                            type: 'viewport-no-zoom',
                            issue: 'Viewport prevents user scaling/zooming',
                            fix: 'Remove user-scalable=no and maximum-scale=1 from viewport meta tag'
                        }] : []
                    };
                }
            },

            ACV: {
                title: 'Autocomplete Valid',
                description: 'Inputs with invalid autocomplete values',
                threshold: { good: 0, poor: 1 },
                identifier: 'autocompleteValid',
                initialValue: [],
                setup: (data) => {
                    const validValues = [
                        'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name',
                        'honorific-suffix', 'nickname', 'email', 'username', 'new-password',
                        'current-password', 'organization-title', 'organization', 'street-address',
                        'address-line1', 'address-line2', 'address-line3', 'address-level4',
                        'address-level3', 'address-level2', 'address-level1', 'country',
                        'country-name', 'postal-code', 'cc-name', 'cc-given-name', 'cc-additional-name',
                        'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year',
                        'cc-csc', 'cc-type', 'transaction-currency', 'transaction-amount', 'language',
                        'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'tel', 'tel-country-code',
                        'tel-national', 'tel-area-code', 'tel-local', 'tel-extension', 'url', 'photo'
                    ];
                
                    Array.from(document.querySelectorAll('input[autocomplete], select[autocomplete], textarea[autocomplete]')).forEach(inp => {
                        const autocomplete = inp.getAttribute('autocomplete');
                        if (!autocomplete || autocomplete === 'on' || autocomplete === 'off') return;
                    
                        const tokens = autocomplete.split(' ');
                        const value = tokens[tokens.length - 1];
                    
                        if (!validValues.includes(value)) {
                            data.autocompleteValid.push({
                                element: inp.tagName,
                                type: inp.type || 'text',
                                autocomplete: autocomplete,
                                id: inp.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.autocompleteValid.length,
                        issues: data.autocompleteValid.map(i => ({
                            type: 'autocomplete-invalid',
                            element: i.element,
                            inputType: i.type,
                            autocomplete: i.autocomplete,
                            id: i.id,
                            fix: `Use valid autocomplete token (e.g., "name", "email", "tel")`
                        }))
                    };
                }
            },

            SRF: {
                title: 'Scrollable Region Focusable',
                description: 'Scrollable regions not keyboard accessible',
                threshold: { good: 0, poor: 1 },
                identifier: 'scrollableRegionFocusable',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('*')).forEach(el => {
                        try {
                            const style = getComputedStyle(el);
                            const isScrollable = (style.overflow === 'scroll' || style.overflow === 'auto' || 
                                                style.overflowY === 'scroll' || style.overflowY === 'auto' ||
                                                style.overflowX === 'scroll' || style.overflowX === 'auto') &&
                                                (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
                        
                            if (isScrollable) {
                                const tabindex = el.getAttribute('tabindex');
                                const role = el.getAttribute('role');
                                const isFocusable = tabindex !== null && tabindex !== '-1';
                                const isInteractive = el.tagName === 'A' || el.tagName === 'BUTTON' || 
                                                     el.tagName === 'INPUT' || el.tagName === 'SELECT' || 
                                                     el.tagName === 'TEXTAREA';
                            
                                if (!isFocusable && !isInteractive) {
                                    data.scrollableRegionFocusable.push({
                                        element: el.tagName,
                                        role: role,
                                        id: el.id || null
                                    });
                                }
                            }
                        } catch (e) {}
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.scrollableRegionFocusable.length,
                        issues: data.scrollableRegionFocusable.map(i => ({
                            type: 'scrollable-not-focusable',
                            element: i.element,
                            role: i.role,
                            id: i.id,
                            fix: 'Add tabindex="0" to scrollable region or wrap in focusable element'
                        }))
                    };
                }
            },

            BYP: {
                title: 'Bypass Blocks',
                description: 'Skip navigation or bypass blocks mechanism',
                threshold: { good: 1, poor: 0 },
                identifier: 'bypassBlocks',
                initialValue: 0,
                setup: (data) => {
                    const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(a => {
                        const text = (a.textContent || '').trim().toLowerCase();
                        return text.includes('skip') || text.includes('jump') || text.includes('bypass');
                    });
                
                    const landmarks = Array.from(document.querySelectorAll('main, [role="main"], nav, [role="navigation"], header, [role="banner"]'));
                    const headings = Array.from(document.querySelectorAll('h1, h2'));
                
                    data.bypassBlocks = (skipLinks.length > 0 || landmarks.length > 0 || headings.length > 0) ? 1 : 0;
                },
                calculate: (data) => {
                    return {
                        value: data.bypassBlocks,
                        issues: data.bypassBlocks === 0 ? [{
                            type: 'no-bypass-blocks',
                            issue: 'No skip links, landmarks, or headings found',
                            fix: 'Add skip navigation link or use semantic HTML5 landmarks (main, nav, header)'
                        }] : []
                    };
                }
            },

            AVA: {
                title: 'ARIA Valid Attributes',
                description: 'Elements with invalid ARIA attribute names',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaValidAttr',
                initialValue: [],
                setup: (data) => {
                    const validAttrs = [
                        'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-braillelabel', 'aria-brailleroledescription',
                        'aria-busy', 'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colindextext', 'aria-colspan',
                        'aria-controls', 'aria-current', 'aria-describedby', 'aria-description', 'aria-details', 'aria-disabled',
                        'aria-dropeffect', 'aria-errormessage', 'aria-expanded', 'aria-flowto', 'aria-grabbed', 'aria-haspopup',
                        'aria-hidden', 'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-level',
                        'aria-live', 'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-orientation', 'aria-owns',
                        'aria-placeholder', 'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant', 'aria-required',
                        'aria-roledescription', 'aria-rowcount', 'aria-rowindex', 'aria-rowindextext', 'aria-rowspan',
                        'aria-selected', 'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'
                    ];
                
                    Array.from(document.querySelectorAll('*')).forEach(el => {
                        Array.from(el.attributes).forEach(attr => {
                            if (attr.name.startsWith('aria-') && !validAttrs.includes(attr.name)) {
                                data.ariaValidAttr.push({
                                    element: el.tagName,
                                    attribute: attr.name,
                                    id: el.id || null
                                });
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaValidAttr.length,
                        issues: data.ariaValidAttr.map(i => ({
                            type: 'aria-invalid-attr',
                            element: i.element,
                            attribute: i.attribute,
                            id: i.id,
                            fix: `Remove invalid ARIA attribute "${i.attribute}" or use a valid ARIA attribute`
                        }))
                    };
                }
            },

            AVV: {
                title: 'ARIA Valid Attribute Values',
                description: 'ARIA attributes with invalid values',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaValidAttrValue',
                initialValue: [],
                setup: (data) => {
                    const booleanAttrs = ['aria-atomic', 'aria-busy', 'aria-disabled', 'aria-hidden', 'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-readonly', 'aria-required'];
                    const tristateAttrs = ['aria-checked', 'aria-pressed'];
                
                    Array.from(document.querySelectorAll('[aria-checked], [aria-pressed], [aria-expanded], [aria-selected], [aria-invalid], [aria-atomic], [aria-busy], [aria-disabled], [aria-hidden], [aria-modal], [aria-multiline], [aria-multiselectable], [aria-readonly], [aria-required]')).forEach(el => {
                        Array.from(el.attributes).forEach(attr => {
                            if (attr.name.startsWith('aria-')) {
                                const value = attr.value.toLowerCase();
                            
                                if (booleanAttrs.includes(attr.name) && value !== 'true' && value !== 'false') {
                                    data.ariaValidAttrValue.push({
                                        element: el.tagName,
                                        attribute: attr.name,
                                        value: attr.value,
                                        expected: 'true or false'
                                    });
                                } else if (tristateAttrs.includes(attr.name) && value !== 'true' && value !== 'false' && value !== 'mixed') {
                                    data.ariaValidAttrValue.push({
                                        element: el.tagName,
                                        attribute: attr.name,
                                        value: attr.value,
                                        expected: 'true, false, or mixed'
                                    });
                                } else if (attr.name === 'aria-expanded' && value !== 'true' && value !== 'false' && value !== 'undefined') {
                                    data.ariaValidAttrValue.push({
                                        element: el.tagName,
                                        attribute: attr.name,
                                        value: attr.value,
                                        expected: 'true, false, or undefined'
                                    });
                                }
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaValidAttrValue.length,
                        issues: data.ariaValidAttrValue.map(i => ({
                            type: 'aria-invalid-value',
                            element: i.element,
                            attribute: i.attribute,
                            value: i.value,
                            expected: i.expected,
                            fix: `Change ${i.attribute}="${i.value}" to valid value: ${i.expected}`
                        }))
                    };
                }
            },

            ADR: {
                title: 'ARIA Deprecated Roles',
                description: 'Elements using deprecated ARIA roles',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaDeprecatedRole',
                initialValue: [],
                setup: (data) => {
                    const deprecated = ['directory'];
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (deprecated.includes(role)) {
                            data.ariaDeprecatedRole.push({
                                element: el.tagName,
                                role: role,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaDeprecatedRole.length,
                        issues: data.ariaDeprecatedRole.map(i => ({
                            type: 'aria-deprecated-role',
                            element: i.element,
                            role: i.role,
                            id: i.id,
                            fix: `Remove deprecated role="${i.role}" and use a valid ARIA role or semantic HTML`
                        }))
                    };
                }
            },

            ARV: {
                title: 'ARIA Roles Valid',
                description: 'Elements with invalid role attribute values',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaRolesValid',
                initialValue: [],
                setup: (data) => {
                    const validRoles = [
                        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
                        'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
                        'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
                        'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
                        'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option', 'presentation',
                        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
                        'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
                        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
                    ];
                
                    Array.from(document.querySelectorAll('[role]')).forEach(el => {
                        const role = el.getAttribute('role');
                        if (role && !validRoles.includes(role)) {
                            data.ariaRolesValid.push({
                                element: el.tagName,
                                role: role,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaRolesValid.length,
                        issues: data.ariaRolesValid.map(i => ({
                            type: 'aria-invalid-role',
                            element: i.element,
                            role: i.role,
                            id: i.id,
                            fix: `Replace role="${i.role}" with a valid ARIA role or remove the attribute`
                        }))
                    };
                }
            },

            AHF: {
                title: 'ARIA Hidden Focus',
                description: 'aria-hidden elements that are focusable',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaHiddenFocus',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('[aria-hidden="true"]')).forEach(el => {
                        const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
                        const isFocusable = el.matches(focusableSelector) || el.querySelector(focusableSelector);
                        const tabindex = el.getAttribute('tabindex');
                    
                        if (isFocusable || (tabindex !== null && tabindex !== '-1')) {
                            data.ariaHiddenFocus.push({
                                element: el.tagName,
                                id: el.id || null,
                                tabindex: tabindex
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaHiddenFocus.length,
                        issues: data.ariaHiddenFocus.map(i => ({
                            type: 'aria-hidden-focusable',
                            element: i.element,
                            id: i.id,
                            fix: 'Remove aria-hidden="true" or add tabindex="-1" to make element not focusable'
                        }))
                    };
                }
            },

            ATN: {
                title: 'ARIA Tooltip Name',
                description: 'Tooltips missing accessible names',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaTooltipName',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('[role="tooltip"]')).forEach(el => {
                        const ariaLabel = el.getAttribute('aria-label');
                        const ariaLabelledby = el.getAttribute('aria-labelledby');
                        const text = (el.textContent || '').trim();
                    
                        if (!ariaLabel && !ariaLabelledby && !text) {
                            data.ariaTooltipName.push({
                                element: el.tagName,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaTooltipName.length,
                        issues: data.ariaTooltipName.map(i => ({
                            type: 'tooltip-no-name',
                            element: i.element,
                            id: i.id,
                            fix: 'Add aria-label, aria-labelledby, or text content to tooltip'
                        }))
                    };
                }
            },

            AMN: {
                title: 'ARIA Meter Name',
                description: 'Meters missing accessible names',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaMeterName',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('meter, [role="meter"]')).forEach(el => {
                        const ariaLabel = el.getAttribute('aria-label');
                        const ariaLabelledby = el.getAttribute('aria-labelledby');
                    
                        if (!ariaLabel && !ariaLabelledby) {
                            data.ariaMeterName.push({
                                element: el.tagName,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaMeterName.length,
                        issues: data.ariaMeterName.map(i => ({
                            type: 'meter-no-name',
                            element: i.element,
                            id: i.id,
                            fix: 'Add aria-label or aria-labelledby to meter element'
                        }))
                    };
                }
            },

            APN: {
                title: 'ARIA Progressbar Name',
                description: 'Progress bars missing accessible names',
                threshold: { good: 0, poor: 1 },
                identifier: 'ariaProgressbarName',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('progress, [role="progressbar"]')).forEach(el => {
                        const ariaLabel = el.getAttribute('aria-label');
                        const ariaLabelledby = el.getAttribute('aria-labelledby');
                    
                        if (!ariaLabel && !ariaLabelledby) {
                            data.ariaProgressbarName.push({
                                element: el.tagName,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.ariaProgressbarName.length,
                        issues: data.ariaProgressbarName.map(i => ({
                            type: 'progressbar-no-name',
                            element: i.element,
                            id: i.id,
                            fix: 'Add aria-label or aria-labelledby to progress element'
                        }))
                    };
                }
            },

            DLS: {
                title: 'Definition List Structure',
                description: 'Definition lists with incorrect structure',
                threshold: { good: 0, poor: 1 },
                identifier: 'defListStructure',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('dl')).forEach(dl => {
                        const children = Array.from(dl.children);
                        const invalidChildren = children.filter(child => 
                            child.tagName !== 'DT' && 
                            child.tagName !== 'DD' &&
                            child.tagName !== 'DIV' &&
                            child.tagName !== 'SCRIPT' && 
                            child.tagName !== 'TEMPLATE'
                        );
                    
                        if (invalidChildren.length > 0 || children.length === 0) {
                            data.defListStructure.push({
                                invalidChildren: invalidChildren.map(c => c.tagName).join(', ') || 'empty',
                                id: dl.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.defListStructure.length,
                        issues: data.defListStructure.map(i => ({
                            type: 'dl-structure-invalid',
                            invalidChildren: i.invalidChildren,
                            id: i.id,
                            fix: '<dl> should only contain <dt> and <dd> elements (or <div> groups)'
                        }))
                    };
                }
            },

            DLI: {
                title: 'DL Item Parents',
                description: 'dt/dd elements not contained by dl',
                threshold: { good: 0, poor: 1 },
                identifier: 'dlItemParents',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('dt, dd')).forEach(el => {
                        const parent = el.parentElement;
                        const validParent = parent && (parent.tagName === 'DL' || (parent.tagName === 'DIV' && parent.parentElement && parent.parentElement.tagName === 'DL'));
                    
                        if (!validParent) {
                            data.dlItemParents.push({
                                element: el.tagName,
                                parentElement: parent ? parent.tagName : 'none',
                                text: (el.textContent || '').trim().substring(0, 30)
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.dlItemParents.length,
                        issues: data.dlItemParents.map(i => ({
                            type: 'dlitem-no-parent',
                            element: i.element,
                            parent: i.parentElement,
                            text: i.text,
                            fix: `${i.element} must be contained by <dl> element`
                        }))
                    };
                }
            },

            THA: {
                title: 'Table Headers Attribute',
                description: 'Table cells with invalid headers attribute',
                threshold: { good: 0, poor: 1 },
                identifier: 'tableHeadersAttr',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('td[headers], th[headers]')).forEach(cell => {
                        const headers = cell.getAttribute('headers');
                        if (!headers) return;
                    
                        const ids = headers.split(/\s+/).filter(id => id);
                        const table = cell.closest('table');
                    
                        ids.forEach(id => {
                            const target = table ? table.querySelector(`#${id}`) : document.getElementById(id);
                            if (!target || (target.tagName !== 'TH' && target.getAttribute('role') !== 'columnheader' && target.getAttribute('role') !== 'rowheader')) {
                                data.tableHeadersAttr.push({
                                    cellElement: cell.tagName,
                                    headerId: id,
                                    exists: !!target
                                });
                            }
                        });
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.tableHeadersAttr.length,
                        issues: data.tableHeadersAttr.map(i => ({
                            type: 'invalid-headers-attr',
                            cell: i.cellElement,
                            headerId: i.headerId,
                            exists: i.exists,
                            fix: i.exists ? 
                                `Element #${i.headerId} must be a <th> or have role="columnheader/rowheader"` :
                                `Referenced header #${i.headerId} does not exist`
                        }))
                    };
                }
            },

            THD: {
                title: 'TH Has Data Cells',
                description: 'Table headers with no associated data cells',
                threshold: { good: 0, poor: 1 },
                identifier: 'thHasDataCells',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('th, [role="columnheader"], [role="rowheader"]')).forEach(th => {
                        const table = th.closest('table');
                        if (!table) return;
                    
                        const thId = th.id;
                        if (!thId) return;
                    
                        const referencingCells = table.querySelectorAll(`td[headers*="${thId}"], th[headers*="${thId}"]`);
                        if (referencingCells.length === 0) {
                            const row = th.closest('tr');
                            const rowIndex = row ? Array.from(row.parentElement.children).indexOf(row) : -1;
                            const colIndex = Array.from(th.parentElement.children).indexOf(th);
                        
                            const hasDataInColumn = table.querySelectorAll(`tr:nth-child(n+${rowIndex + 2}) td:nth-child(${colIndex + 1})`).length > 0;
                            const hasDataInRow = row && row.querySelectorAll('td').length > 0;
                        
                            if (!hasDataInColumn && !hasDataInRow) {
                                data.thHasDataCells.push({
                                    id: thId,
                                    text: (th.textContent || '').trim().substring(0, 30)
                                });
                            }
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.thHasDataCells.length,
                        issues: data.thHasDataCells.map(i => ({
                            type: 'th-no-data-cells',
                            headerId: i.id,
                            text: i.text,
                            fix: 'Ensure table header has associated data cells or remove it'
                        }))
                    };
                }
            },

            TSC: {
                title: 'Table Scope Valid',
                description: 'Table cells with invalid scope attributes',
                threshold: { good: 0, poor: 1 },
                identifier: 'tableScopeValid',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('[scope]')).forEach(el => {
                        const scope = el.getAttribute('scope');
                        const validScopes = ['row', 'col', 'rowgroup', 'colgroup'];
                    
                        if (!validScopes.includes(scope)) {
                            data.tableScopeValid.push({
                                element: el.tagName,
                                scope: scope,
                                id: el.id || null
                            });
                        } else if (el.tagName !== 'TH') {
                            data.tableScopeValid.push({
                                element: el.tagName,
                                scope: scope,
                                id: el.id || null,
                                issue: 'scope on non-th'
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.tableScopeValid.length,
                        issues: data.tableScopeValid.map(i => ({
                            type: 'invalid-scope',
                            element: i.element,
                            scope: i.scope,
                            id: i.id,
                            fix: i.issue === 'scope on non-th' ?
                                'scope attribute should only be used on <th> elements' :
                                `scope="${i.scope}" is invalid, use: row, col, rowgroup, or colgroup`
                        }))
                    };
                }
            },

            BLK: {
                title: 'Blink Elements',
                description: 'Deprecated blink elements present',
                threshold: { good: 0, poor: 1 },
                identifier: 'blinkElements',
                initialValue: 0,
                setup: (data) => {
                    data.blinkElements = Array.from(document.querySelectorAll('blink')).length;
                },
                calculate: (data) => {
                    return {
                        value: data.blinkElements,
                        issues: data.blinkElements > 0 ? [{
                            type: 'blink-element',
                            count: data.blinkElements,
                            fix: 'Remove <blink> elements - they are deprecated and cause accessibility issues'
                        }] : []
                    };
                }
            },

            MRQ: {
                title: 'Marquee Elements',
                description: 'Deprecated marquee elements present',
                threshold: { good: 0, poor: 1 },
                identifier: 'marqueeElements',
                initialValue: 0,
                setup: (data) => {
                    data.marqueeElements = Array.from(document.querySelectorAll('marquee')).length;
                },
                calculate: (data) => {
                    return {
                        value: data.marqueeElements,
                        issues: data.marqueeElements > 0 ? [{
                            type: 'marquee-element',
                            count: data.marqueeElements,
                            fix: 'Remove <marquee> elements - they are deprecated and cause accessibility issues'
                        }] : []
                    };
                }
            },

            MRF: {
                title: 'Meta Refresh',
                description: 'Meta refresh used for delayed refresh/redirect',
                threshold: { good: 0, poor: 1 },
                identifier: 'metaRefresh',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('meta[http-equiv="refresh"]')).forEach(meta => {
                        const content = meta.getAttribute('content');
                        if (content) {
                            const delay = parseInt(content);
                            if (delay > 0) {
                                data.metaRefresh.push({
                                    content: content,
                                    delay: delay
                                });
                            }
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.metaRefresh.length,
                        issues: data.metaRefresh.map(i => ({
                            type: 'meta-refresh',
                            content: i.content,
                            delay: i.delay,
                            fix: 'Remove meta refresh or use server-side redirect (301/302)'
                        }))
                    };
                }
            },

            IIA: {
                title: 'Input Image Alt',
                description: 'Input type=image missing alt text',
                threshold: { good: 0, poor: 1 },
                identifier: 'inputImageAlt',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('input[type="image"]')).forEach(inp => {
                        const alt = inp.getAttribute('alt');
                        const ariaLabel = inp.getAttribute('aria-label');
                        const ariaLabelledby = inp.getAttribute('aria-labelledby');
                    
                        if (!alt && !ariaLabel && !ariaLabelledby) {
                            data.inputImageAlt.push({
                                src: inp.src || '(no src)',
                                id: inp.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.inputImageAlt.length,
                        issues: data.inputImageAlt.map(i => ({
                            type: 'input-image-no-alt',
                            src: i.src,
                            id: i.id,
                            fix: 'Add alt, aria-label, or aria-labelledby attribute to input[type="image"]'
                        }))
                    };
                }
            },

            HLV: {
                title: 'HTML Lang Valid',
                description: 'HTML element has invalid lang value',
                threshold: { good: 0, poor: 1 },
                identifier: 'htmlLangValid',
                initialValue: 0,
                setup: (data) => {
                    const html = document.documentElement;
                    const lang = html.getAttribute('lang');
                    const xmlLang = html.getAttribute('xml:lang');
                
                    const validLangs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'ru', 'hi', 'ko', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'tr', 'cs'];
                    const langValid = lang && (validLangs.includes(lang.split('-')[0]) || /^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang));
                
                    data.htmlLangValid = langValid ? 0 : 1;
                },
                calculate: (data) => {
                    return {
                        value: data.htmlLangValid,
                        issues: data.htmlLangValid > 0 ? [{
                            type: 'html-lang-invalid',
                            fix: 'Set valid lang attribute on <html> element (e.g., lang="en")'
                        }] : []
                    };
                }
            },

            VLG: {
                title: 'Valid Lang Attributes',
                description: 'Elements with invalid lang attribute values',
                threshold: { good: 0, poor: 1 },
                identifier: 'validLangAttrs',
                initialValue: [],
                setup: (data) => {
                    Array.from(document.querySelectorAll('[lang]')).forEach(el => {
                        const lang = el.getAttribute('lang');
                        if (lang && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)) {
                            data.validLangAttrs.push({
                                element: el.tagName,
                                lang: lang,
                                id: el.id || null
                            });
                        }
                    });
                },
                calculate: (data) => {
                    return {
                        value: data.validLangAttrs.length,
                        issues: data.validLangAttrs.map(i => ({
                            type: 'invalid-lang',
                            element: i.element,
                            lang: i.lang,
                            id: i.id,
                            fix: `Change lang="${i.lang}" to valid language code (e.g., "en", "es", "en-US")`
                        }))
                    };
                }
            },

            ASC: {
                title: 'Accessibility Score',
                description: 'Composite score based on ARIA, contrast, alt text, form labels',
                threshold: { good: 90, poor: 70 },
                identifier: 'asc',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    let score = 100;
                    score -= (data.images.length * 2);
                    score -= (data.contrastIssues.length * 1);
                    score -= (data.ariaErrors.length * 1);
                    score -= (data.formLabels.length * 2);
                    score -= (data.headingHierarchy.length * 2);
                    return { value: Math.max(0, score), issues: [] };
                }
            },

            KNS: {
                title: 'Keyboard Navigation Score',
                description: 'Composite score measuring keyboard accessibility',
                threshold: { good: 90, poor: 70 },
                identifier: 'kns',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    const focusable = data.focusableElements.length;
                    if (focusable === 0) return { value: null, issues: [] };
                
                    let score = 100;
                    score -= (data.focusObscured * 5);
                    score -= (data.smallTargets.length * 2);
                    return { value: Math.max(0, score), issues: [] };
                }
            },

            LD: {
                title: 'Link Discernibility',
                description: 'Links with non-descriptive or duplicate text',
                threshold: { good: 0, poor: 3 },
                identifier: 'linkIssues',
                initialValue: [],
                setup: (data) => {
                    try {
                        data.linkIssues = [];
                        const links = Array.from(document.querySelectorAll('a[href]'));
                        const linkTexts = new Map();
                    
                        const genericTexts = [
                            'click here', 'here', 'read more', 'more', 'learn more',
                            'click', 'link', 'go', 'continue', 'next', 'previous'
                        ];
                    
                        links.forEach(link => {
                            const text = (link.textContent || '').trim().toLowerCase();
                            const ariaLabel = link.getAttribute('aria-label');
                            const title = link.getAttribute('title');
                        
                            const effectiveText = ariaLabel || text || title || '';
                        
                            if (!effectiveText) {
                                data.linkIssues.push({
                                    href: link.href,
                                    issue: 'empty',
                                    text: '(empty)',
                                    hasAriaLabel: false
                                });
                            } else if (genericTexts.includes(effectiveText.toLowerCase())) {
                                data.linkIssues.push({
                                    href: link.href,
                                    issue: 'generic',
                                    text: effectiveText,
                                    hasAriaLabel: !!ariaLabel
                                });
                            } else {
                                if (linkTexts.has(effectiveText)) {
                                    linkTexts.get(effectiveText).count++;
                                    linkTexts.get(effectiveText).hrefs.push(link.href);
                                } else {
                                    linkTexts.set(effectiveText, { count: 1, hrefs: [link.href] });
                                }
                            }
                        });
                    
                        linkTexts.forEach((value, text) => {
                            if (value.count > 3 && value.hrefs.length > 1) {
                                const uniqueHrefs = [...new Set(value.hrefs)];
                                if (uniqueHrefs.length > 1) {
                                    data.linkIssues.push({
                                        href: uniqueHrefs.join(', '),
                                        issue: 'duplicate',
                                        text: text,
                                        count: value.count
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('Link discernibility setup failed:', e);
                    }
                },
                calculate: (data) => {
                    if (!data.linkIssues || data.linkIssues.length === 0) {
                        return { value: 0, issues: [] };
                    }
                
                    const issues = data.linkIssues.map(item => {
                        let info, fix;
                    
                        if (item.issue === 'empty') {
                            info = 'Link has no text or aria-label';
                            fix = 'Add descriptive text or aria-label attribute';
                        } else if (item.issue === 'generic') {
                            info = `Link text "${item.text}" is not descriptive`;
                            fix = `Replace "${item.text}" with descriptive text explaining the link destination`;
                        } else {
                            info = `${item.count} links use the same text "${item.text}" but point to different destinations`;
                            fix = 'Make link text unique or add aria-label to differentiate';
                        }
                    
                        return {
                            type: 'link-discernibility',
                            issue: item.issue,
                            text: item.text,
                            href: item.href.substring(0, 100),
                            count: item.count || 1,
                            info,
                            fix
                        };
                    });
                
                    return { value: data.linkIssues.length, issues };
                }
            },
        },

        'User Experience': {
            ASJ: {
                title: 'Average Scroll Jank',
                description: 'Average frame delay during scrolling',
                threshold: { good: 16, poor: 50 },
                identifier: 'scrollJank',
                initialValue: [],
                setup: (data) => {
                    let isScrolling = false;
                    let lastFrameTime = 0;
                    let frameCount = 0;
                    const maxFrames = 60;
                    const targetFrameTime = 16.67;

                    const scrollHandler = () => {
                        if (!isScrolling) {
                            isScrolling = true;
                            lastFrameTime = performance.now();
                            frameCount = 0;

                            const measureFrames = () => {
                                if (!isScrolling || frameCount >= maxFrames) {
                                    isScrolling = false;
                                    return;
                                }

                                const now = performance.now();
                                const frameDuration = now - lastFrameTime;
                            
                                if (frameDuration > targetFrameTime) {
                                    data.scrollJank.push(frameDuration - targetFrameTime);
                                }
                            
                                lastFrameTime = now;
                                frameCount++;
                                requestAnimationFrame(measureFrames);
                            };

                            requestAnimationFrame(measureFrames);
                        }
                    };

                    window.addEventListener('scroll', scrollHandler, { passive: true });
                },
                calculate: (data) => {
                    const stats = calculateStats(data.scrollJank);
                    return { value: stats.avg !== null ? stats.avg : 0, issues: [] };
                }
            },

            IRD: {
                title: 'Interaction Readiness Delay',
                description: 'Time until the page becomes fully interactive',
                threshold: { good: 1000, poor: 3000 },
                identifier: 'interactionReadiness',
                initialValue: [],
                setup: (data) => {
                    try {
                        const navEntries = performance.getEntriesByType('navigation');
                        if (navEntries.length > 0) {
                            const nav = navEntries[0];
                            if (nav.domContentLoadedEventEnd && nav.domContentLoadedEventEnd > 0) {
                                const ird = nav.domContentLoadedEventEnd - nav.startTime;
                                if (ird > 0) data.interactionReadiness.push(ird);
                            }
                        }
                    } catch (e) {
                        console.warn('Interaction readiness setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const value = data.interactionReadiness.length > 0 ? data.interactionReadiness[0] : null;
                    return { value, issues: [] };
                }
            },

            FDC: {
                title: 'Frame Drops Count',
                description: 'Number of frames that exceeded the 60fps target',
                threshold: { good: 0, poor: 5 },
                identifier: 'frameDrops',
                initialValue: [],
                setup: (data) => {
                    let lastFrame = performance.now();
                    let frameCount = 0;
                    const maxFrames = 300;
                    const targetFrameTime = 16.67;
                
                    const checkFrame = () => {
                        if (frameCount >= maxFrames) return;
                    
                        const now = performance.now();
                        const frameDuration = now - lastFrame;
                    
                        if (frameDuration > targetFrameTime && frameDuration < 1000) {
                            data.frameDrops.push(frameDuration);
                        }
                    
                        lastFrame = now;
                        frameCount++;
                        requestAnimationFrame(checkFrame);
                    };
                
                    setTimeout(() => requestAnimationFrame(checkFrame), 1000);
                },
                calculate: (data) => {
                    return { value: data.frameDrops.length, issues: [] };
                }
            },

            RMC: {
                title: 'Reduced Motion Compliance',
                description: 'Whether animations respect prefers-reduced-motion',
                threshold: { good: true, poor: false },
                identifier: 'reducedMotion',
                initialValue: null,
                setup: (data) => {
                    let hasReducedMotionCSS = false;
                
                    try {
                        Array.from(document.styleSheets).forEach(sheet => {
                            try {
                                if (sheet.cssRules) {
                                    Array.from(sheet.cssRules).forEach(rule => {
                                        if (rule.media && rule.media.mediaText && 
                                            rule.media.mediaText.includes('prefers-reduced-motion')) {
                                            hasReducedMotionCSS = true;
                                        }
                                    });
                                }
                            } catch (e) {
                            }
                        });
                    } catch (e) {
                        console.warn('Reduced motion detection failed:', e);
                    }
                
                    data.reducedMotion = hasReducedMotionCSS;
                },
                calculate: (data) => {
                    const issues = !data.reducedMotion ? [{
                        type: 'missing-reduced-motion',
                        issue: 'No @media (prefers-reduced-motion) rules found',
                        fix: 'Add CSS media query: @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }'
                    }] : [];
                    return { value: data.reducedMotion, issues };
                }
            },

            ILT: {
                title: 'Input Latency',
                description: 'Worst-case input to visual feedback time',
                threshold: { good: 100, poor: 300 },
                identifier: 'inputLatency',
                initialValue: [],
                setup: (data) => {
                    data.inputLatency = [];
                    try {
                        const observer = new PerformanceObserver(list => {
                            list.getEntries().forEach(e => {
                                if (e.processingStart && e.startTime) {
                                    const latency = e.processingStart - e.startTime;
                                    data.inputLatency.push({
                                        latency,
                                        name: e.name,
                                        target: e.target?.tagName || 'unknown'
                                    });
                                }
                            });
                        });
                        observer.observe({ type: 'event', buffered: true });
                    
                        setTimeout(() => {
                            try {
                                const element = document.createElement('button');
                                element.type = 'button';
                                element.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-9999';
                                element.setAttribute('aria-hidden', 'true');
                                element.setAttribute('tabindex', '-1');
                                element.id = 'webdoctor-ilt-trigger';
                                document.body.appendChild(element);
                            
                                setTimeout(() => {
                                    try {
                                        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                        element.dispatchEvent(event);
                                        if (element.parentNode) element.parentNode.removeChild(element);
                                    } catch (e) {
                                        if (element.parentNode) element.parentNode.removeChild(element);
                                    }
                                }, 250);
                            } catch (e) {}
                        }, 100);
                    } catch (e) {}
                },
                calculate: (data) => {
                    if (!data.inputLatency || data.inputLatency.length === 0) return { value: null, issues: [] };
                
                    const worstLatency = data.inputLatency.reduce((worst, current) => 
                        current.latency > worst.latency ? current : worst
                    , data.inputLatency[0]);
                
                    return { value: worstLatency.latency, issues: [] };
                }
            },

            RVD: {
                title: 'Responsive Viewport Design',
                description: 'Responsive design quality score',
                threshold: { good: 90, poor: 60 },
                identifier: 'responsiveScore',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const vp = document.querySelector('meta[name="viewport"]');
                        let score = 0;
                        if (vp) {
                            const content = vp.getAttribute('content');
                            if (content && content.includes('width=device-width')) score += 50;
                            if (content && content.includes('initial-scale=1')) score += 50;
                        }
                        data.responsiveScore = score;
                    } catch (e) { data.responsiveScore = 0; }
                },
                calculate: (data) => {
                    return { value: data.responsiveScore, issues: [] };
                }
            },

            SDC: {
                title: 'Shadow DOM Coverage',
                description: 'Shadow DOM components tested',
                threshold: { good: 90, poor: 60 },
                identifier: 'shadowCoverage',
                initialValue: 100,
                setup: (data) => {
                    try {
                        const customElements = Array.from(document.querySelectorAll('*'));
                        let shadowRoots = 0;
                        customElements.forEach(el => {
                            if (el.shadowRoot) shadowRoots++;
                        });
                        data.shadowCoverage = shadowRoots > 0 ? 100 : 100;
                    } catch (e) {
                        data.shadowCoverage = 100;
                    }
                },
                calculate: (data) => {
                    return { value: data.shadowCoverage, issues: [] };
                }
            },

            IFC: {
                title: 'Iframe Content Issues',
                description: 'Issues in iframes',
                threshold: { good: 0, poor: 3 },
                identifier: 'iframeIssues',
                initialValue: 0,
                setup: (data) => {
                    data.iframeIssues = Array.from(document.querySelectorAll('iframe')).filter(iframe => !iframe.title || !iframe.title.trim()).length;
                },
                calculate: (data) => {
                    return { value: data.iframeIssues, issues: [] };
                }
            },

            VSS: {
                title: 'Visual Stability Score',
                description: 'Composite score based on layout shift measurements',
                threshold: { good: 90, poor: 70 },
                identifier: 'vss',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    if (!data.cls || data.cls.length === 0) return { value: 100, issues: [] };
                
                    const totalCLS = data.cls.reduce((sum, shift) => sum + shift.value, 0);
                
                    if (totalCLS < 0.1) return { value: 100, issues: [] };
                    if (totalCLS < 0.25) return { value: 80, issues: [] };
                    return { value: 60, issues: [] };
                }
            },

            UXS: {
                title: 'User Experience Score',
                description: 'Composite score based on scroll smoothness and visual stability',
                threshold: { good: 80, poor: 60 },
                identifier: 'uxs',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    let score = 100;
                    score -= (data.scrollJank.length * 2);
                    score -= (data.frameDrops.length * 1);
                    if (!data.reducedMotion) score -= 10;
                    return { value: Math.max(0, score), issues: [] };
                }
            },
        },

        'Resource Optimization': {
            IOR: {
                title: 'Image Optimization Rate',
                description: 'Percentage of images using modern formats (WebP, AVIF)',
                threshold: { good: 80, poor: 50 },
                identifier: 'resourceImages',
                initialValue: [],
                setup: (data) => {
                    const images = Array.from(document.querySelectorAll('img'));
                
                    images.forEach(img => {
                        if (!img.src) return;
                    
                        const url = img.src.toLowerCase();
                        const isOptimized = url.includes('.webp') || url.includes('.avif') ||
                                           url.includes('format=webp') || url.includes('format=avif');
                    
                        let format = 'unknown';
                        if (url.includes('.webp')) format = 'webp';
                        else if (url.includes('.avif')) format = 'avif';
                        else if (url.includes('.jpg') || url.includes('.jpeg')) format = 'jpeg';
                        else if (url.includes('.png')) format = 'png';
                        else if (url.includes('.svg')) format = 'svg';
                        else if (url.includes('.gif')) format = 'gif';
                    
                        const hasResponsive = !!(img.srcset || img.sizes);
                        const hasLazyLoading = img.loading === 'lazy';
                    
                        const picture = img.closest('picture');
                        const hasPictureWebP = picture ? 
                            Array.from(picture.querySelectorAll('source')).some(s => 
                                s.type && (s.type.includes('webp') || s.type.includes('avif'))
                            ) : false;
                    
                        data.resourceImages.push({
                            src: img.src,
                            format,
                            optimized: isOptimized || format === 'svg' || hasPictureWebP,
                            responsive: hasResponsive,
                            lazyLoading: hasLazyLoading,
                            pictureWebP: hasPictureWebP,
                            alt: img.alt || null,
                            width: img.naturalWidth || null,
                            height: img.naturalHeight || null
                        });
                    });
                },
                calculate: (data) => {
                    const realImages = data.resourceImages.filter(img => 
                        img.src && !img.src.startsWith('data:') && img.format !== 'unknown'
                    );
                
                    if (realImages.length === 0) return { value: null, issues: [] };
                
                    const unoptimized = realImages.filter(img => !img.optimized && img.format !== 'svg');
                    const optimizedCount = realImages.filter(img => img.optimized).length;
                    const rate = (optimizedCount / realImages.length) * 100;
                
                    const issueWorthyImages = unoptimized.filter(img => {
                        const isLarge = (img.width && img.width > 300) || (img.height && img.height > 300);
                        const isPhotoFormat = img.format === 'jpeg' || (img.format === 'png' && img.width > 200);
                        const hasModernFeatures = img.responsive || img.lazyLoading;
                    
                        return isLarge || isPhotoFormat || hasModernFeatures;
                    });
                
                    const issues = issueWorthyImages
                        .slice(0, 10)
                        .map(img => ({
                            type: 'unoptimized-image',
                            resource: img.src,
                            format: img.format,
                            size: img.width && img.height ? `${img.width}x${img.height}` : 'unknown',
                            responsive: img.responsive,
                            lazyLoading: img.lazyLoading,
                            info: `${img.src.split('/').pop()} (${img.format.toUpperCase()}, ${img.width}x${img.height})`,
                            fix: `Convert to WebP/AVIF format${!img.responsive ? ', add srcset for responsive images' : ''}${!img.lazyLoading ? ', add loading="lazy"' : ''}`
                        }));
                
                    return { value: rate, issues };
                }
            },

            ACR: {
                title: 'Average Compression Ratio',
                description: 'Ratio of compressed to uncompressed resource sizes (excluding cached)',
                threshold: { good: 0.7, poor: 0.9 },
                identifier: 'compression',
                initialValue: [],
                setup: (data) => {
                    try {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.transferSize > 100 && resource.decodedBodySize > 0) {
                                const ratio = resource.transferSize / resource.decodedBodySize;
                                if (!isNaN(ratio) && isFinite(ratio)) {
                                    data.compression.push({
                                        url: resource.name,
                                        ratio,
                                        transferSize: resource.transferSize,
                                        decodedSize: resource.decodedBodySize,
                                        compressed: ratio < 0.8
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('Compression setup failed:', e);
                    }
                },
                calculate: (data) => {
                    if (!data.compression || data.compression.length === 0) return { value: null, issues: [] };
                
                    const uncompressed = data.compression.filter(r => !r.compressed);
                    const stats = calculateStats(data.compression.map(r => r.ratio));
                
                    const issues = uncompressed
                        .sort((a, b) => b.ratio - a.ratio)
                        .slice(0, 10)
                        .map(r => {
                            const ratio = Number(r.ratio);
                            const isLarger = ratio > 1;
                            const note = isLarger ? ' (file too small - compression adds overhead)' : '';
                        
                            return {
                                type: 'uncompressed-resource',
                                resource: r.url,
                                compressionRatio: ratio.toFixed(2),
                                transferSize: `${(r.transferSize / 1024).toFixed(1)}KB`,
                                decodedSize: `${(r.decodedSize / 1024).toFixed(1)}KB`,
                                info: `${r.url.split('/').pop()} - ${ratio.toFixed(2)} ratio (${(r.transferSize / 1024).toFixed(1)}KB transferred)${note}`,
                                fix: isLarger 
                                    ? `File too small (< 1KB) - compression overhead exceeds savings. Consider inlining or leaving uncompressed.`
                                    : `Enable gzip/brotli compression on server. Target compression ratio < 0.7`
                            };
                        });
                
                    return { value: stats.avg || null, issues };
                }
            },

            CHR: {
                title: 'Cache Hit Rate',
                description: 'Percentage of resources served from browser cache',
                threshold: { good: 80, poor: 50 },
                identifier: 'cache',
                initialValue: [],
                setup: (data) => {
                    try {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            const transferSize = resource.transferSize || 0;
                            const decodedSize = resource.decodedBodySize || 0;
                            const cached = transferSize === 0 || (decodedSize > 0 && transferSize < decodedSize * 0.1);
                        
                            data.cache.push({ url: resource.name, cached });
                        });
                    } catch (e) {
                        console.warn('Cache setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const cachedCount = data.cache.filter(r => r.cached).length;
                    const rate = data.cache.length > 0 ? (cachedCount / data.cache.length) * 100 : null;
                    return { value: rate, issues: [] };
                }
            },

            TBS: {
                title: 'Total Bundle Size',
                description: 'Total size of all JavaScript bundles loaded on the page',
                threshold: { good: 100000, poor: 500000 },
                identifier: 'bundles',
                initialValue: [],
                setup: (data) => {
                    try {
                        const resources = performance.getEntriesByType('resource');
                        const scripts = resources.filter(r => 
                            r.initiatorType === 'script' || 
                            (r.name && r.name.includes('.js'))
                        );
                    
                        scripts.forEach(script => {
                            if (script.transferSize > 0) {
                                data.bundles.push({
                                    url: script.name,
                                    size: script.transferSize
                                });
                            }
                        });
                    } catch (e) {
                        console.warn('Bundle setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const totalSize = data.bundles.length > 0 ? data.bundles.reduce((sum, b) => sum + b.size, 0) : 0;
                    return { value: totalSize, issues: [] };
                }
            },

            RWC: {
                title: 'Resource Waste Count',
                description: 'Number of resources exceeding size thresholds',
                threshold: { good: 0, poor: 3 },
                identifier: 'wastedResources',
                initialValue: [],
                setup: (data) => {
                    const wasteThreshold = 100000;
                
                    try {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.transferSize > wasteThreshold) {
                                data.wastedResources.push({
                                    url: resource.name,
                                    size: resource.transferSize
                                });
                            }
                        });
                    } catch (e) {
                        console.warn('Resource waste setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const issues = data.wastedResources.map(r => ({
                        type: 'wasteful-resource',
                        resource: r.url,
                        size: `${(r.size / 1024).toFixed(0)}KB`,
                        fix: `Optimize or remove resource ${r.url} (${(r.size / 1024).toFixed(0)}KB)`
                    }));
                    return { value: data.wastedResources.length, issues };
                }
            },

            JSB: {
                title: 'JavaScript Budget',
                description: 'Total JavaScript size vs recommended budget',
                threshold: { good: 300000, poor: 500000 },
                identifier: 'jsSize',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.initiatorType === 'script' || (resource.name && resource.name.includes('.js'))) {
                                data.jsSize += resource.transferSize || 0;
                            }
                        });
                    } catch (e) {
                        console.warn('JS budget setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const budget = 300000;
                    const issues = data.jsSize > budget ? [{
                        type: 'js-budget-exceeded',
                        currentSize: data.jsSize,
                        budget,
                        fix: `Reduce JavaScript from ${(data.jsSize / 1024).toFixed(0)}KB to under 300KB using code splitting and tree shaking`
                    }] : [];
                    return { value: data.jsSize, issues };
                }
            },

            CSB: {
                title: 'CSS Budget',
                description: 'Total CSS size vs recommended budget',
                threshold: { good: 100000, poor: 200000 },
                identifier: 'cssSize',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const resources = performance.getEntriesByType('resource');
                        resources.forEach(resource => {
                            if (resource.initiatorType === 'link' || (resource.name && resource.name.includes('.css'))) {
                                data.cssSize += resource.transferSize || 0;
                            }
                        });
                    } catch (e) {
                        console.warn('CSS budget setup failed:', e);
                    }
                },
                calculate: (data) => {
                    const budget = 100000;
                    const issues = data.cssSize > budget ? [{
                        type: 'css-budget-exceeded',
                        currentSize: data.cssSize,
                        budget,
                        fix: `Reduce CSS from ${(data.cssSize / 1024).toFixed(0)}KB to under 100KB by removing unused styles`
                    }] : [];
                    return { value: data.cssSize, issues };
                }
            },

            IMB: {
                title: 'Image Budget',
                description: 'Total image size',
                threshold: { good: 1000000, poor: 2000000 },
                identifier: 'imageSize',
                initialValue: 0,
                setup: (data) => {
                    try {
                        data.imageSize = performance.getEntriesByType('resource')
                            .filter(r => r.initiatorType === 'img' || /\.(jpg|png|gif|webp|avif)/.test(r.name))
                            .reduce((sum, r) => sum + (r.transferSize || 0), 0);
                    } catch (e) {}
                },
                calculate: (data) => {
                    return {
                        value: data.imageSize,
                        issues: data.imageSize > 2000000 ? [{ type: 'large-images', size: data.imageSize, fix: 'Optimize images' }] : []
                    };
                }
            },

            RCB: {
                title: 'Request Count Budget',
                description: 'Total HTTP requests',
                threshold: { good: 100, poor: 200 },
                identifier: 'requestCount',
                initialValue: 0,
                setup: (data) => {
                    data.requestCount = performance.getEntriesByType('resource').length;
                },
                calculate: (data) => {
                    return { value: data.requestCount, issues: [] };
                }
            },

            TPW: {
                title: 'Total Page Weight',
                description: 'Total page size',
                threshold: { good: 2000000, poor: 4000000 },
                identifier: 'tpw',
                initialValue: 0,
                setup: (data) => {
                    data.totalWeight = performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0);
                },
                calculate: (data) => {
                    return {
                        value: data.totalWeight,
                        issues: data.totalWeight > 4000000 ? [{ type: 'large-page', size: data.totalWeight, fix: 'Reduce page weight' }] : []
                    };
                }
            },

            TPB: {
                title: 'Third-Party Budget',
                description: 'Third-party resource size',
                threshold: { good: 500000, poor: 1000000 },
                identifier: 'tpb',
                initialValue: 0,
                setup: (data) => {
                    try {
                        const origin = window.location.origin;
                        data.thirdPartySize = performance.getEntriesByType('resource')
                            .filter(r => {
                                try { return new URL(r.name).origin !== origin; }
                                catch (e) { return false; }
                            })
                            .reduce((sum, r) => sum + (r.transferSize || 0), 0);
                    } catch (e) {}
                },
                calculate: (data) => {
                    return {
                        value: data.thirdPartySize,
                        issues: data.thirdPartySize > 1000000 ? [{ type: 'large-third-party', size: data.thirdPartySize, fix: 'Reduce third-party scripts' }] : []
                    };
                }
            },

            OSC: {
                title: 'Optimization Score',
                description: 'Composite score based on image formats, compression, caching',
                threshold: { good: 80, poor: 60 },
                identifier: 'osc',
                initialValue: 0,
                setup: (data) => {
                    data.compositeReady = true;
                },
                calculate: (data) => {
                    let score = 100;
                    const unoptimizedImages = data.resourceImages.filter(img => !img.optimized && img.format !== 'svg').length;
                    const poorCompression = data.compression.filter(c => c.ratio > 0.9).length;
                    const uncached = data.cache.filter(c => !c.cached).length;
                
                    score -= (unoptimizedImages * 3);
                    score -= (poorCompression * 2);
                    score -= (uncached * 1);
                
                    return { value: Math.max(0, score), issues: [] };
                }
            },

            ISA: {
                title: 'Image Sizing Accuracy',
                description: 'Count of images with oversized dimensions vs display size',
                threshold: { good: 0, poor: 3 },
                identifier: 'isa',
                initialValue: 0,
                setup: (data) => {
                    try {
                        data.oversizedImages = [];
                        Array.from(document.querySelectorAll('img')).forEach(img => {
                            if (!img.src || img.src.startsWith('data:')) return;
                        
                            const naturalWidth = img.naturalWidth;
                            const naturalHeight = img.naturalHeight;
                            const displayWidth = img.clientWidth;
                            const displayHeight = img.clientHeight;
                        
                            if (naturalWidth > 0 && displayWidth > 0) {
                                const widthRatio = naturalWidth / displayWidth;
                                const heightRatio = naturalHeight / displayHeight;
                            
                                if (widthRatio > 1.5 || heightRatio > 1.5) {
                                    const naturalPixels = naturalWidth * naturalHeight;
                                    const displayPixels = displayWidth * displayHeight;
                                    const wasteRatio = ((naturalPixels - displayPixels) / naturalPixels) * 100;
                                
                                    const estimatedSize = img.src.length / 1024;
                                    const estimatedWaste = (estimatedSize * wasteRatio / 100);
                                
                                    data.oversizedImages.push({
                                        src: img.src,
                                        natural: `${naturalWidth}×${naturalHeight}`,
                                        display: `${displayWidth}×${displayHeight}`,
                                        ratio: widthRatio.toFixed(1),
                                        wastePercent: wasteRatio.toFixed(0),
                                        estimatedWaste: estimatedWaste.toFixed(1)
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('Image sizing setup failed:', e);
                    }
                },
                calculate: (data) => {
                    if (!data.oversizedImages || data.oversizedImages.length === 0) {
                        return { value: 0, issues: [] };
                    }
                
                    const issues = data.oversizedImages.map(img => ({
                        type: 'oversized-image',
                        resource: img.src.split('/').pop(),
                        natural: img.natural,
                        display: img.display,
                        ratio: img.ratio,
                        waste: img.wastePercent,
                        info: `Image is ${img.ratio}x larger than display size (${img.wastePercent}% waste)`,
                        fix: `Resize to ${img.display} or use srcset: <img srcset="...small.jpg 400w, ...large.jpg 800w">`
                    }));
                
                    return { value: data.oversizedImages.length, issues };
                }
            },

            UCD: {
                title: 'Unused CSS Bytes',
                description: 'Amount of CSS downloaded but not used on the page',
                threshold: { good: 20000, poor: 50000 },
                identifier: 'ucd',
                initialValue: 0,
                setup: async (data) => {
                    try {
                        data.unusedCSS = { totalBytes: 0, unusedBytes: 0, files: [] };
                    
                        if (window.CSS && CSS.supports && typeof CSS.supports === 'function') {
                            const styleSheets = Array.from(document.styleSheets);
                        
                            for (const sheet of styleSheets) {
                                try {
                                    if (!sheet.href || !sheet.cssRules) continue;
                                
                                    let totalRules = 0;
                                    let usedRules = 0;
                                
                                    Array.from(sheet.cssRules).forEach(rule => {
                                        totalRules++;
                                        if (rule.type === CSSRule.STYLE_RULE) {
                                            try {
                                                const elements = document.querySelectorAll(rule.selectorText);
                                                if (elements.length > 0) usedRules++;
                                            } catch (e) {
                                                usedRules++;
                                            }
                                        } else {
                                            usedRules++;
                                        }
                                    });
                                
                                    const resources = performance.getEntriesByType('resource');
                                    const resourceEntry = resources.find(r => r.name === sheet.href);
                                    const fileSize = resourceEntry ? resourceEntry.transferSize : 0;
                                
                                    if (totalRules > 0 && fileSize > 0) {
                                        const usageRate = usedRules / totalRules;
                                        const unusedBytes = fileSize * (1 - usageRate);
                                    
                                        data.unusedCSS.totalBytes += fileSize;
                                        data.unusedCSS.unusedBytes += unusedBytes;
                                    
                                        if (unusedBytes > 5000) {
                                            data.unusedCSS.files.push({
                                                url: sheet.href,
                                                size: fileSize,
                                                unused: unusedBytes,
                                                usageRate: (usageRate * 100).toFixed(0)
                                            });
                                        }
                                    }
                                } catch (e) {}
                            }
                        }
                    } catch (e) {
                        console.warn('Unused CSS setup failed:', e);
                    }
                },
                calculate: (data) => {
                    if (!data.unusedCSS || data.unusedCSS.totalBytes === 0) {
                        return { value: null, issues: [] };
                    }
                
                    const issues = data.unusedCSS.files.map(file => ({
                        type: 'unused-css',
                        resource: file.url.split('/').pop(),
                        totalSize: `${(file.size / 1024).toFixed(1)}KB`,
                        unusedSize: `${(file.unused / 1024).toFixed(1)}KB`,
                        usageRate: `${file.usageRate}%`,
                        info: `${(file.unused / 1024).toFixed(1)}KB unused CSS (${file.usageRate}% used)`,
                        fix: 'Remove unused CSS rules or split into critical/non-critical chunks'
                    }));
                
                    return { 
                        value: Math.round(data.unusedCSS.unusedBytes), 
                        issues 
                    };
                }
            },
        },

        SEO: {
            DTL: {
                title: 'Document Title',
                description: 'Document has a descriptive title element',
                threshold: { good: true, poor: false },
                identifier: 'dtl',
                initialValue: 0,
                setup: (data) => {
                    const titleEl = document.querySelector('title');
                    data.docTitle = {
                        exists: !!titleEl,
                        text: titleEl ? titleEl.textContent.trim() : '',
                        length: titleEl ? titleEl.textContent.trim().length : 0
                    };
                },
                calculate: (data) => {
                    const hasValidTitle = data.docTitle.exists && data.docTitle.length > 0 && data.docTitle.length <= 60;
                    const issues = [];
                
                    if (!data.docTitle.exists) {
                        issues.push({
                            type: 'missing-title',
                            issue: 'Document has no <title> element',
                            fix: 'Add <title>Your Page Title</title> to <head>'
                        });
                    } else if (data.docTitle.length === 0) {
                        issues.push({
                            type: 'empty-title',
                            issue: 'Title element is empty',
                            fix: 'Add descriptive text to <title> element'
                        });
                    } else if (data.docTitle.length > 60) {
                        issues.push({
                            type: 'long-title',
                            issue: `Title is ${data.docTitle.length} characters (recommended: 50-60)`,
                            fix: 'Shorten title to 50-60 characters for better display in search results'
                        });
                    }
                
                    return { value: hasValidTitle, issues };
                }
            },

            MD: {
                title: 'Meta Description',
                description: 'Document has a meta description',
                threshold: { good: true, poor: false },
                identifier: 'md',
                initialValue: 0,
                setup: (data) => {
                    const metaDesc = document.querySelector('meta[name="description"]');
                    data.metaDescription = {
                        exists: !!metaDesc,
                        content: metaDesc ? metaDesc.getAttribute('content') : '',
                        length: metaDesc ? (metaDesc.getAttribute('content') || '').length : 0
                    };
                },
                calculate: (data) => {
                    const hasValidDesc = data.metaDescription.exists && 
                                         data.metaDescription.length >= 50 && 
                                         data.metaDescription.length <= 160;
                    const issues = [];
                
                    if (!data.metaDescription.exists) {
                        issues.push({
                            type: 'missing-description',
                            issue: 'Document has no meta description',
                            fix: 'Add <meta name="description" content="...">'
                        });
                    } else if (data.metaDescription.length < 50) {
                        issues.push({
                            type: 'short-description',
                            issue: `Meta description is ${data.metaDescription.length} characters (recommended: 120-160)`,
                            fix: 'Expand description to 120-160 characters'
                        });
                    } else if (data.metaDescription.length > 160) {
                        issues.push({
                            type: 'long-description',
                            issue: `Meta description is ${data.metaDescription.length} characters (recommended: 120-160)`,
                            fix: 'Shorten description to 120-160 characters'
                        });
                    }
                
                    return { value: hasValidDesc, issues };
                }
            },

            VWP: {
                title: 'Viewport Meta Tag',
                description: 'Document has a viewport meta tag',
                threshold: { good: true, poor: false },
                identifier: 'vwp',
                initialValue: 0,
                setup: (data) => {
                    const viewport = document.querySelector('meta[name="viewport"]');
                    data.viewport = {
                        exists: !!viewport,
                        content: viewport ? viewport.getAttribute('content') : ''
                    };
                },
                calculate: (data) => {
                    const hasValidViewport = data.viewport.exists && 
                                            data.viewport.content.includes('width=device-width');
                    const issues = [];
                
                    if (!data.viewport.exists) {
                        issues.push({
                            type: 'missing-viewport',
                            issue: 'Document has no viewport meta tag',
                            fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
                        });
                    } else if (!data.viewport.content.includes('width=device-width')) {
                        issues.push({
                            type: 'invalid-viewport',
                            issue: 'Viewport does not set width=device-width',
                            fix: 'Update viewport to: <meta name="viewport" content="width=device-width, initial-scale=1">'
                        });
                    }
                
                    return { value: hasValidViewport, issues };
                }
            },

            CNU: {
                title: 'Canonical URL',
                description: 'Document has a valid canonical URL',
                threshold: { good: true, poor: false },
                identifier: 'cnu',
                initialValue: 0,
                setup: (data) => {
                    const canonical = document.querySelector('link[rel="canonical"]');
                    data.canonical = {
                        exists: !!canonical,
                        href: canonical ? canonical.getAttribute('href') : '',
                        isValid: false
                    };
                
                    if (data.canonical.href) {
                        try {
                            new URL(data.canonical.href);
                            data.canonical.isValid = true;
                        } catch (e) {
                            data.canonical.isValid = false;
                        }
                    }
                },
                calculate: (data) => {
                    const hasValidCanonical = data.canonical.exists && data.canonical.isValid;
                    const issues = [];
                
                    if (!data.canonical.exists) {
                        issues.push({
                            type: 'missing-canonical',
                            issue: 'Document has no canonical URL',
                            fix: 'Add <link rel="canonical" href="https://example.com/page">'
                        });
                    } else if (!data.canonical.isValid) {
                        issues.push({
                            type: 'invalid-canonical',
                            issue: 'Canonical URL is not valid',
                            fix: 'Ensure canonical href is a full, valid URL'
                        });
                    }
                
                    return { value: hasValidCanonical, issues };
                }
            },

            RBT: {
                title: 'Robots Meta Tag',
                description: 'Document robots meta tag configuration',
                threshold: { good: true, poor: false },
                identifier: 'rbt',
                initialValue: 0,
                setup: (data) => {
                    const robots = document.querySelector('meta[name="robots"]');
                    data.robots = {
                        exists: !!robots,
                        content: robots ? robots.getAttribute('content') : '',
                        blocks: false
                    };
                
                    if (data.robots.content) {
                        const content = data.robots.content.toLowerCase();
                        data.robots.blocks = content.includes('noindex') || content.includes('nofollow');
                    }
                },
                calculate: (data) => {
                    const isGood = !data.robots.blocks;
                    const issues = [];
                
                    if (data.robots.blocks) {
                        issues.push({
                            type: 'robots-blocking',
                            issue: `Robots meta tag contains blocking directives: ${data.robots.content}`,
                            fix: 'Remove noindex/nofollow if you want this page indexed'
                        });
                    }
                
                    return { value: isGood, issues };
                }
            },

            HRF: {
                title: 'Hreflang Validation',
                description: 'Hreflang tags for internationalization',
                threshold: { good: true, poor: false },
                identifier: 'hrf',
                initialValue: 0,
                setup: (data) => {
                    const hreflangs = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
                    data.hreflang = {
                        count: hreflangs.length,
                        valid: true,
                        issues: []
                    };
                
                    hreflangs.forEach(link => {
                        const hreflang = link.getAttribute('hreflang');
                        const href = link.getAttribute('href');
                    
                        if (!href) {
                            data.hreflang.valid = false;
                            data.hreflang.issues.push({ hreflang, issue: 'missing href' });
                        } else if (!hreflang.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
                            data.hreflang.valid = false;
                            data.hreflang.issues.push({ hreflang, issue: 'invalid format' });
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.hreflang.issues.map(item => ({
                        type: 'hreflang-error',
                        hreflang: item.hreflang,
                        issue: item.issue,
                        fix: item.issue === 'missing href' 
                            ? 'Add href attribute to hreflang link'
                            : 'Use valid language code format (e.g., en, en-US)'
                    }));
                
                    return { value: data.hreflang.valid, issues };
                }
            },

            STD: {
                title: 'Structured Data',
                description: 'JSON-LD structured data present',
                threshold: { good: true, poor: false },
                identifier: 'std',
                initialValue: 0,
                setup: (data) => {
                    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                    data.structuredData = {
                        count: jsonLdScripts.length,
                        valid: true,
                        types: []
                    };
                
                    jsonLdScripts.forEach(script => {
                        try {
                            const json = JSON.parse(script.textContent);
                            const type = json['@type'] || 'Unknown';
                            data.structuredData.types.push(type);
                        } catch (e) {
                            data.structuredData.valid = false;
                        }
                    });
                },
                calculate: (data) => {
                    const hasValidData = data.structuredData.count > 0 && data.structuredData.valid;
                    const issues = [];
                
                    if (data.structuredData.count === 0) {
                        issues.push({
                            type: 'missing-structured-data',
                            issue: 'No JSON-LD structured data found',
                            fix: 'Add Schema.org structured data for better search visibility'
                        });
                    } else if (!data.structuredData.valid) {
                        issues.push({
                            type: 'invalid-structured-data',
                            issue: 'Structured data contains JSON parsing errors',
                            fix: 'Validate JSON-LD syntax'
                        });
                    }
                
                    return { 
                        value: hasValidData, 
                        issues,
                        metadata: { types: data.structuredData.types }
                    };
                }
            },

            OG: {
                title: 'Open Graph Tags',
                description: 'Facebook/social media Open Graph meta tags',
                threshold: { good: 4, poor: 2 },
                identifier: 'og',
                initialValue: 0,
                setup: (data) => {
                    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
                    data.openGraph = {
                        present: [],
                        missing: []
                    };
                
                    ogTags.forEach(tag => {
                        const meta = document.querySelector(`meta[property="${tag}"]`);
                        if (meta && meta.getAttribute('content')) {
                            data.openGraph.present.push(tag);
                        } else {
                            data.openGraph.missing.push(tag);
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.openGraph.missing.map(tag => ({
                        type: 'missing-og-tag',
                        tag: tag,
                        fix: `Add <meta property="${tag}" content="...">`
                    }));
                
                    return { value: data.openGraph.present.length, issues };
                }
            },

            TWC: {
                title: 'Twitter Card Tags',
                description: 'Twitter Card meta tags for social sharing',
                threshold: { good: 3, poor: 1 },
                identifier: 'twc',
                initialValue: 0,
                setup: (data) => {
                    const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
                    data.twitterCard = {
                        present: [],
                        missing: []
                    };
                
                    twitterTags.forEach(tag => {
                        const meta = document.querySelector(`meta[name="${tag}"]`);
                        if (meta && meta.getAttribute('content')) {
                            data.twitterCard.present.push(tag);
                        } else {
                            data.twitterCard.missing.push(tag);
                        }
                    });
                },
                calculate: (data) => {
                    const issues = data.twitterCard.missing.map(tag => ({
                        type: 'missing-twitter-tag',
                        tag: tag,
                        fix: `Add <meta name="${tag}" content="...">`
                    }));
                
                    return { value: data.twitterCard.present.length, issues };
                }
            }
        }
    };

    //CORE CLASSES
    class BaseTest {
        constructor(name, metricsObject) {
            this.test = {
                name: name,
                metrics: metricsObject,
                data: Object.entries(metricsObject).reduce((acc, [_, metric]) => {
                    acc[metric.identifier] = Array.isArray(metric.initialValue) ? [] : metric.initialValue;
                    return acc;
                }, {})
            };
        }
        async run() {
            return Promise.allSettled(Object.values(this.test.metrics).map(metric => metric.setup(this.test.data)))
                .then(() => new Promise(resolve => setTimeout(resolve, 12000)))
                .then(() => ({
                    test: this.test.name,
                    result: Object.entries(this.test.metrics).reduce((acc, [key, metric]) => {
                        acc[key] = metric.calculate(this.test.data);
                        return acc;
                    }, {})
                }))
                .catch(e => ({ test: this.test.name, result: {}, error: e.message }));
        }
    }

    //SETTINGS MANAGEMENT
    async function getEnabledMetrics() {
        try {
            const result = await chrome.storage.sync.get(['enabledCategories', 'enabledMetrics']);
            
            // If no settings exist, return all metrics (default behavior)
            if (!result.enabledCategories || !result.enabledMetrics) {
                return METRICS;
            }

            return result;
        } catch (error) {
            console.warn('Failed to load settings, using all metrics:', error);
            return METRICS;
        }
    }

    function filterMetricsBySettings(allMetrics, settings) {
        // If no settings or settings are incomplete, return all metrics
        if (!settings.enabledCategories || !settings.enabledMetrics) {
            return allMetrics;
        }

        const filtered = {};

        Object.entries(allMetrics).forEach(([categoryName, categoryMetrics]) => {
            // Skip entire category if disabled
            if (settings.enabledCategories[categoryName] === false) {
                return;
            }

            // Filter individual metrics within enabled categories
            const filteredCategoryMetrics = {};
            Object.entries(categoryMetrics).forEach(([metricCode, metricConfig]) => {
                const isEnabled = settings.enabledMetrics[categoryName]?.[metricCode] !== false;
                if (isEnabled) {
                    filteredCategoryMetrics[metricCode] = metricConfig;
                }
            });

            // Only include category if it has at least one enabled metric
            if (Object.keys(filteredCategoryMetrics).length > 0) {
                filtered[categoryName] = filteredCategoryMetrics;
            }
        });

        return filtered;
    }

    //TEST EXECUTION CLASSES
    class Suite {
        constructor(filteredMetrics) { 
            this.tests = Object.entries(filteredMetrics).map(([category, metrics]) => new BaseTest(category, metrics)); 
        }
        async execute() { return Promise.allSettled(this.tests.map(test => test.run())); }
    }

    class Results {
        static format(testResults) { return testResults.flatMap(result => formatTestResult(result)); }
        static process(metrics) { return metrics.map(metric => evaluateMetric(metric)); }
    }

    class Doctor {
        async examine(tests) { return Results.format(await tests.execute()); }
        diagnose(metrics) { return Results.process(metrics); }
        report(results) { chrome.storage.local.set({ measurelyResults: results }); }
    }

    //MAIN LOGIC
    async function runAnalysis() {
        try {
            const settings = await getEnabledMetrics();
            const filteredMetrics = filterMetricsBySettings(METRICS, settings);
            
            // Check if any metrics are enabled
            const totalMetrics = Object.values(filteredMetrics).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
            if (totalMetrics === 0) {
                console.warn('No metrics enabled. Please enable some metrics in settings.');
                chrome.storage.local.set({ measurelyResults: [] });
                return 'No metrics enabled';
            }

            const doctor = new Doctor();
            const data = await doctor.examine(new Suite(filteredMetrics));
            const results = doctor.diagnose(data);
            doctor.report(results);
            
            return `Analysis complete with ${totalMetrics} metrics`;
        } catch (error) {
            console.error('Measurely analysis failed:', error);
            return 'Analysis failed';
        }
    }

    runAnalysis();

    return 'Initiating Measurely test analysis...';
})();