// Updated DataGuidePage with category filtering and expanded content
import { BookOpen, TrendingUp, BarChart3, PieChart, Activity, Lightbulb, Sparkles, ChevronDown, Search, Code2, Calculator, Brain, Target } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface GuideSection {
    id: string;
    title: string;
    icon: any;
    color: string;
    gradient: string;
    content: {
        question: string;
        answer: string;
        example?: string;
        formula?: string;
        visualExample?: string;
        category: 'basics' | 'advanced' | 'practical';
    }[];
}

const sections: GuideSection[] = [
    {
        id: 'boxplot',
        title: 'Mastering Boxplots',
        icon: BarChart3,
        color: 'blue',
        gradient: 'from-blue-600 to-cyan-600',
        content: [
            {
                question: 'What is a boxplot?',
                answer: 'A boxplot (box-and-whisker plot) is a standardized way of displaying data distribution based on five key statistics: minimum, first quartile (Q1), median (Q2), third quartile (Q3), and maximum.',
                visualExample: '📊 Boxplot Structure:\n\n        ┌─────┐\n    ────┤  Q2 ├────  ← Median line\n        │     │\n   Q1 ──┴─────\n   ↓             ↓\nWhisker       Whisker',
                category: 'basics'
            },
            {
                question: 'How to read each component?',
                answer: '**Box (Interquartile Range - IQR):**\n• Contains middle 50% of data\n• Bottom edge: Q1 (25th percentile)\n• Top edge: Q3 (75th percentile)\n• Height = IQR = Q3 - Q1\n\n**Median Line:**\n• Middle value of dataset\n• If closer to Q1: right-skewed\n• If closer to Q3: left-skewed\n\n**Whiskers:**\n• Extend to 1.5 × IQR from box\n• Show data range (excluding outliers)\n\n**Outliers:**\n• Points beyond whiskers\n• Potential anomalies or errors',
                example: 'Salary data: If median is closer to Q1, most people earn lower salaries with few high earners (right-skewed).',
                category: 'advanced'
            },
            {
                question: 'Comparing multiple boxplots',
                answer: 'When comparing groups:\n• **Center**: Which group has higher median?\n• **Spread**: Which has larger IQR (more variability)?\n• **Skewness**: Are distributions symmetric?\n• **Outliers**: Which group has more extreme values?',
                example: '📈 Comparing test scores across 3 classes:\n• Class A: Median 85, narrow box → consistent performance\n• Class B: Median 75, wide box → high variability\n• Class C: Median 80, many outliers → some exceptional students',
                category: 'practical'
            },
            {
                question: 'Common pitfalls',
                answer: '❌ **Mistakes to avoid:**\n• Assuming symmetry without checking\n• Ignoring sample size (boxplots hide this!)\n• Not investigating outliers\n• Comparing boxplots with very different scales\n• Using boxplots for small datasets (<20 points)',
                example: 'A boxplot of 10 data points vs 10,000 looks similar but has vastly different statistical power!',
                category: 'basics'
            },
            {
                question: 'Boxplot vs Violin Plot',
                answer: '**Boxplot:**\n• Shows quartiles and outliers\n• Compact summary\n• Good for comparing many groups\n\n**Violin Plot:**\n• Shows full distribution density\n• Reveals multimodal patterns\n• Better for understanding shape\n\n**When to use:**\n• Boxplot: Quick comparison, many groups\n• Violin: Detailed distribution shape, small number of groups',
                example: '📊 Comparing income across regions:\n• Boxplot: Shows median and spread quickly\n• Violin: Reveals if income is bimodal (two income peaks)',
                category: 'advanced'
            }
        ]
    },
    {
        id: 'distribution',
        title: 'Data Distribution Deep Dive',
        icon: PieChart,
        color: 'purple',
        gradient: 'from-purple-600 to-pink-600',
        content: [
            {
                question: 'What is normal distribution?',
                answer: "The normal (Gaussian) distribution is a bell-shaped, symmetric probability distribution. It's defined by two parameters: mean (μ) and standard deviation (σ).",
                formula: 'f(x) = (1/σ√2π) × e^(-(x-μ)²/2σ²)',
                visualExample: '68% within 1σ\n95% within 2σ\n99.7% within 3σ\n\n    ╱╲\n   ╱  ╲\n  ╱    ╲\n ╱      ╲\n╱________╲',
                category: 'basics'
            },
            {
                question: 'Types of distributions',
                answer: '**Common distributions:**\n\n1. **Normal**: Symmetric bell curve\n   • Height, IQ scores, measurement errors\n\n2. **Skewed Right**: Long tail to right\n   • Income, house prices, reaction times\n\n3. **Skewed Left**: Long tail to left\n   • Age at death, test scores (easy test)\n\n4. **Bimodal**: Two peaks\n   • Heights (male + female combined)\n\n5. **Uniform**: All values equally likely\n   • Random number generators',
                example: '💰 Income is right-skewed: Most people earn moderate amounts, few earn millions.',
                category: 'advanced'
            },
            {
                question: 'Testing for normality',
                answer: 'Methods to check if data is normally distributed:\n\n1. **Visual inspection:**\n   • Histogram: Should look bell-shaped\n   • Q-Q plot: Points should follow diagonal line\n\n2. **Statistical tests:**\n   • Shapiro-Wilk test (n < 2000)\n   • Kolmogorov-Smirnov test\n   • Anderson-Darling test\n\n3. **Descriptive stats:**\n   • Skewness ≈ 0\n   • Kurtosis ≈ 3',
                example: 'If p-value < 0.05 in Shapiro-Wilk test → data is NOT normally distributed',
                category: 'practical'
            },
            {
                question: 'Why does normality matter?',
                answer: 'Many statistical tests assume normality:\n• t-tests\n• ANOVA\n• Linear regression\n• Pearson correlation\n\n**If data is not normal:**\n• Transform it (log, square root, Box-Cox)\n• Use non-parametric tests\n• Use robust methods\n• Increase sample size (Central Limit Theorem)',
                example: 'Log-transform income data to make it more normal before running regression.',
                category: 'basics'
            },
            {
                question: 'Heavy-tailed distributions',
                answer: 'Heavy-tailed distributions (e.g., Cauchy, Pareto) have infinite variance and can produce extreme outliers. They require special modeling techniques.\n\n**Characteristics:**\n• More extreme values than normal distribution\n• Power-law decay instead of exponential\n• Common in: income, city sizes, word frequencies\n\n**Modeling approaches:**\n• Use robust statistics\n• Transform data (log, power)\n• Use specialized distributions (Pareto, log-normal)',
                example: '💰 Wealth distribution: Top 1% owns 50% of wealth → Heavy-tailed (Pareto distribution)',
                category: 'advanced'
            }
        ]
    },
    {
        id: 'outliers',
        title: 'Outlier Detection & Handling',
        icon: Activity,
        color: 'rose',
        gradient: 'from-rose-600 to-orange-600',
        content: [
            {
                question: 'What are outliers?',
                answer: 'Outliers are data points that differ significantly from other observations. They can be:\n\n**Types:**\n• **Univariate**: Extreme in one variable\n• **Multivariate**: Unusual combination of values\n• **Point outliers**: Single extreme value\n• **Contextual outliers**: Unusual in specific context\n• **Collective outliers**: Group of unusual points',
                example: '🏠 House price: $50M in a $200K neighborhood\n🌡️ Temperature: 30°C in Antarctica\n📊 Sales: $0 on Black Friday',
                category: 'basics'
            },
            {
                question: 'Detection methods',
                answer: '**1. Statistical methods:**\n• Z-score: |z| > 3 is outlier\n• IQR method: < Q1-1.5×IQR or > Q3+1.5×IQR\n• Modified Z-score: Uses median instead of mean\n\n**2. Visual methods:**\n• Boxplots\n• Scatter plots\n• Histograms\n\n**3. Advanced methods:**\n• Isolation Forest\n• DBSCAN clustering\n• Local Outlier Factor (LOF)\\n• Mahalanobis distance',
                formula: 'Z-score = (x - μ) / σ\nIQR = Q3 - Q1\nOutlier if: x < Q1 - 1.5×IQR OR x > Q3 + 1.5×IQR',
                category: 'advanced'
            },
            {
                question: 'Should you remove outliers?',
                answer: '⚠️ **Decision framework:**\n\n**Remove if:**\n• Data entry error (typo)\n• Measurement error (sensor malfunction)\n• Not from target population\n• Violates assumptions of analysis\n\n**Keep if:**\n• Genuine extreme value\n• Represents important subgroup\n• Small sample size\n• Research question includes extremes\n\n**Alternative: Transform instead of remove**\n• Winsorize (cap at percentile)\n• Log transform\n• Use robust statistics',
                example: '✅ Remove: Age = 250 years (data error)\n❌ Don\'t remove: Salary = $1M (real CEO salary)\n🔄 Transform: Use median instead of mean for income',
                category: 'practical'
            },
            {
                question: 'Impact of outliers',
                answer: 'Outliers affect:\n\n**Heavily affected:**\n• Mean (very sensitive)\n• Standard deviation\n• Pearson correlation\n• Linear regression coefficients\n• Range\n\n**Robust (resistant):**\n• Median\n• IQR\n• Spearman correlation\n• Quantile regression\n\n**Best practice:** Report both with and without outliers!',
                example: 'Dataset: [10, 12, 11, 13, 100]\nMean with outlier: 29.2\nMean without: 11.5\nMedian (robust): 12',
                category: 'basics'
            },
            {
                question: 'Outlier treatment in time series',
                answer: 'Time series outliers require special handling to preserve temporal patterns.\n\n**Detection methods:**\n• Rolling window statistics\n• Seasonal decomposition\n• ARIMA residuals\n• Change point detection\n\n**Treatment:**\n• Interpolation from neighbors\n• Seasonal adjustment\n• Winsorization with temporal context\n• Flag but don\'t remove (may be real events)',
                example: '📈 Stock price spike on earnings day: Real event, not error. Flag it but keep in analysis.',
                category: 'advanced'
            }
        ]
    },
    {
        id: 'statistics',
        title: 'Essential Statistics',
        icon: Calculator,
        color: 'emerald',
        gradient: 'from-emerald-600 to-teal-600',
        content: [
            {
                question: 'Measures of central tendency',
                answer: '**Mean (Average):**\n• Sum of all values / count\n• Sensitive to outliers\n• Best for symmetric distributions\n\n**Median:**\n• Middle value when sorted\n• Robust to outliers\n• Best for skewed distributions\n\n**Mode:**\n• Most frequent value\n• Can have multiple modes\n• Best for categorical data',
                formula: 'Mean: μ = Σx / n\nMedian: Middle value of sorted data\nMode: Most frequent value',
                example: 'Salaries: [$40K, $45K, $50K, $55K, $500K]\nMean: $138K (misleading!)\nMedian: $50K (better representation)\nMode: None (all unique)',
                category: 'basics'
            },
            {
                question: 'Measures of spread',
                answer: '**Range:**\n• Max - Min\n• Very sensitive to outliers\n\n**Variance:**\n• Average squared deviation from mean\n• Units are squared\n\n**Standard Deviation (SD):**\n• Square root of variance\n• Same units as data\n• 68-95-99.7 rule for normal data\n\n**IQR:**\n• Q3 - Q1\n• Robust to outliers',
                formula: 'Variance: σ² = Σ(x - μ)² / n\nStd Dev: σ = √variance\nIQR = Q3 - Q1',
                category: 'advanced'
            },
            {
                question: 'Percentiles & Quartiles',
                answer: '**Percentiles:**\n• Pth percentile: P% of data below this value\n• P50 = Median\n• P25 = Q1, P75 = Q3\n\n**Quartiles:**\n• Q1 (25th): First quartile\n• Q2 (50th): Median\n• Q3 (75th): Third quartile\n\n**Use cases:**\n• Growth charts (pediatrics)\n• Performance benchmarks\n• Risk assessment',
                example: '🎓 Test score at 90th percentile means you scored better than 90% of students!',
                category: 'practical'
            },
            {
                question: 'Effect size measures',
                answer: "Effect size quantifies the magnitude of differences or relationships beyond p‑values.\n\n**Common measures:**\n• **Cohen's d**: Standardized mean difference\n - Small: 0.2, Medium: 0.5, Large: 0.8\n• ** Pearson's r**: Correlation strength\n  - Small: 0.1, Medium: 0.3, Large: 0.5\n• **Odds ratio**: For binary outcomes\n  - OR = 1: No effect, OR > 1: Positive effect\n\n**Why it matters:**\nA statistically significant result (p < 0.05) can be practically meaningless if effect size is tiny!",
                formula: "Cohen's d = (μ₁ - μ₂) / σ_pooled\nOdds Ratio = (a×d) / (b×c)",
                example: '💊 Drug reduces symptoms: p = 0.04 (significant!) but d = 0.15 (tiny effect) → Not clinically meaningful',
                category: 'advanced'
            }
        ]
    },
    {
        id: 'hypothesis',
        title: 'Hypothesis Testing',
        icon: Target,
        color: 'amber',
        gradient: 'from-amber-600 to-yellow-600',
        content: [
            {
                question: 'What is hypothesis testing?',
                answer: 'A statistical method to make decisions about population parameters based on sample data.\n\n**Steps:**\n1. State null hypothesis (H₀) and alternative (H₁)\n2. Choose significance level (α, usually 0.05)\n3. Calculate test statistic\n4. Find p-value\n5. Make decision: Reject H₀ if p < α',
                example: 'H₀: New drug has no effect\nH₁: New drug reduces symptoms\nIf p = 0.03 < 0.05 → Reject H₀ → Drug works!',
                category: 'basics'
            },
            {
                question: 'Understanding p-values',
                answer: 'P-value = Probability of observing your data (or more extreme) if H₀ is true.\n\n**Interpretation:**\n• p < 0.001: Very strong evidence against H₀\n• p < 0.01: Strong evidence\n• p < 0.05: Moderate evidence (standard threshold)\n• p < 0.10: Weak evidence\n• p ≥ 0.10: Little to no evidence\n\n⚠️ **Common misconception:**\nP-value is NOT the probability that H₀ is true!',
                example: 'p = 0.03 means: "If there\'s truly no effect, there\'s a 3% chance of seeing results this extreme by random chance."',
                category: 'advanced'
            },
            {
                question: 'Type I & Type II errors',
                answer: '**Type I Error (False Positive):**\n• Reject H₀ when it\'s actually true\n• Probability = α (significance level)\n• "Crying wolf"\n\n**Type II Error (False Negative):**\n• Fail to reject H₀ when it\'s false\n• Probability = β\n• Power = 1 - β\n\n**Trade-off:**\nReducing α increases β and vice versa',
                visualExample: '           Reality\n         H₀ True | H₀ False\n      ─────────┼─────────\nReject  Type I  | Correct\n H₀     Error   | (Power)\n      ─────────┼─────────\nFail    Correct | Type II\nReject          | Error',
                category: 'practical'
            },
            {
                question: 'Common statistical tests',
                answer: '**Comparing means:**\n• t-test: 2 groups, normal data\n• ANOVA: 3+ groups, normal data\n• Mann-Whitney U: 2 groups, non‑normal\n• Kruskal-Wallis: 3+ groups, non‑normal\n\n**Relationships:**\n• Pearson correlation: Linear, normal\n• Spearman correlation: Monotonic, any distribution\n• Chi‑square: Categorical variables\n\n**Regression:**\n• Linear regression: Continuous outcome\n• Logistic regression: Binary outcome',
                example: 'Comparing test scores of 2 classes → Use independent t‑test\nComparing 4 teaching methods → Use ANOVA',
                category: 'advanced'
            },
            {
                question: 'Power analysis',
                answer: 'Power analysis determines the sample size needed to detect an effect of a given size with a desired probability (power).\n\n**Key parameters:**\n• **Effect size**: How big is the difference? (d, r, etc.)\n• **Power (1-β)**: Probability of detecting effect (usually 0.80)\n• **Significance level (α)**: Type I error rate (usually 0.05)\n• **Sample size (n)**: What you\'re solving for\n\n**When to use:**\n• Before collecting data (planning)\n• After non-significant result (was study underpowered?)\n• Grant proposals (justify sample size)',
                example: '🔬 To detect medium effect (d=0.5) with 80% power at α=0.05:\n→ Need ~64 participants per group\n→ If you only had 20, study was underpowered!',
                category: 'practical'
            }
        ]
    }
];

export function DataGuidePage() {
    const [expandedSection, setExpandedSection] = useState<string | null>('boxplot');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All Topics', icon: BookOpen },
        { id: 'basics', label: 'Basics', icon: Lightbulb },
        { id: 'advanced', label: 'Advanced', icon: Brain },
        { id: 'practical', label: 'Practical', icon: Target }
    ];

    // Filter sections based on search and selected category
    const filteredSections = sections
        .map(section => {
            const filteredContent = section.content.filter(item => {
                const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                return matchesSearch && matchesCategory;
            });
            return { ...section, content: filteredContent };
        })
        .filter(section => section.content.length > 0);

    const tips = [
        {
            icon: Lightbulb,
            title: 'Start with visualization',
            description: "Always plot your data before running statistical tests. Anscombe's quartet shows 4 datasets with identical statistics but completely different patterns!",
            category: 'basics'
        },
        {
            icon: Sparkles,
            title: 'Clean before analyzing',
            description: 'Handle missing values and outliers before analysis. Use data profiling to understand quality issues. Remember: Garbage in = garbage out!',
            category: 'basics'
        },
        {
            icon: TrendingUp,
            title: 'Context matters',
            description: 'A correlation of 0.3 might be weak in physics but strong in social sciences. Always interpret results within your domain context.',
            category: 'practical'
        },
        {
            icon: Brain,
            title: 'Check assumptions',
            description: 'Every statistical test has assumptions (normality, independence, homoscedasticity). Violating them can lead to invalid conclusions.',
            category: 'advanced'
        },
        {
            icon: Calculator,
            title: 'Sample size matters',
            description: 'Larger samples give more reliable results. Use power analysis to determine required sample size before collecting data.',
            category: 'advanced'
        },
        {
            icon: Code2,
            title: 'Document everything',
            description: 'Keep track of all data transformations, outlier removals, and analysis decisions. Reproducibility is key in data science!',
            category: 'practical'
        }
    ];

    // Filter tips based on search and category
    const filteredTips = tips.filter(tip => {
        const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) || tip.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-8"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50 animate-float">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            Data Science Guide
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                            Master data analysis from basics to advanced concepts
                        </p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search topics, formulas, examples..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all ${selectedCategory === cat.id
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800'}
                                `}
                            >
                                <cat.icon className="w-5 h-5" />
                                <span className="hidden md:inline">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Guide Sections */}
            <div className="max-w-7xl mx-auto space-y-6 mb-12">
                {filteredSections.map((section, index) => {
                    // Auto-expand if searching or if it's the manually toggled section
                    const isExpanded = searchQuery.length > 0 || expandedSection === section.id;

                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card-3d glass-card relative overflow-hidden group"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                            {/* Header - Clickable */}
                            <button
                                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                className="w-full p-6 flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors rounded-t-2xl relative z-10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${section.gradient} shadow-lg`}>
                                        <section.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white text-left">
                                        {section.title}
                                    </h2>
                                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold">
                                        {section.content.length} topics
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Content - Expandable */}
                            {isExpanded && (
                                <div className="overflow-hidden bg-white/30 dark:bg-slate-900/30 rounded-b-2xl">
                                    <div className="p-6 pt-0 space-y-8">
                                        {/* Debug: Check if content exists */}
                                        {section.content.length === 0 && (
                                            <div className="text-center text-gray-500">No content available for this section.</div>
                                        )}

                                        {section.content.map((item, idx) => (
                                            <div key={`${section.id}-item-${idx}`} className="space-y-3">
                                                <h3 className="text-xl font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                    <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white text-sm font-bold`}>{idx + 1}</span>
                                                    {item.question}
                                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full font-bold ${item.category === 'basics' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : item.category === 'advanced' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>{item.category}</span>
                                                </h3>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line pl-10">
                                                    {item.answer}
                                                </p>
                                                {item.formula && (
                                                    <div className="ml-10 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-l-4 border-indigo-500">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Formula</span>
                                                        </div>
                                                        <code className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                                            {item.formula}
                                                        </code>
                                                    </div>
                                                )}
                                                {item.visualExample && (
                                                    <div className="ml-10 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Visual</span>
                                                        </div>
                                                        <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">
                                                            {item.visualExample}
                                                        </pre>
                                                    </div>
                                                )}
                                                {item.example && (
                                                    <div className="ml-10 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Example</span>
                                                        </div>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                                            {item.example}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Decorative corner */}
                            <div className={`absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br ${section.gradient} rounded-full blur-3xl opacity-20 group-hover:scale-150 transition-transform duration-700`} />
                        </motion.div>
                    );
                })}
            </div>

            {/* Pro Tips Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-yellow-500 animate-pulse" />
                    Pro Tips for Data Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTips.map((tip, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="card-3d glass-card p-6 relative overflow-hidden group hover:scale-105 transition-transform duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 mb-4 shadow-lg shadow-yellow-500/50">
                                    <tip.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                    {tip.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {tip.description}
                                </p>
                                <span className="inline-block mt-4 text-xs px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold">
                                    {tip.category}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
