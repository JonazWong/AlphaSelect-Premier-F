---
description: "Use when creating or modifying Next.js 15 App Router pages in frontend/src/app/**/page.tsx. Enforces Cyberpunk theme styling, i18n integration, responsive design, and chart.js patterns."
applyTo: "frontend/src/app/**/page.tsx"
---
# Frontend Page Component Guidelines

## Required Pattern (Client Component)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function YourFeaturePage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">
        {t('yourFeature.title')}
      </h1>
      {/* Content */}
    </div>
  );
}
```

## Critical Styling Rules

### 1. Cyberpunk Theme Colors (ONLY)
**NEVER** hardcode colors. Use ONLY these Tailwind tokens from `tailwind.config.ts`:

```tsx
// Background colors
bg-background     // Dark blue (#0A1628) - page background
bg-card          // Card background (#1A2332)

// Text colors
text-primary     // Cyan (#00D9FF) - headings, primary CTAs
text-secondary   // Purple (#B24BF3) - secondary text
text-accent      // Green (#00FFB3) - highlights, success states
text-white       // White - body text

// Neon shadows (for emphasis)
shadow-neon-cyan
shadow-neon-purple
shadow-neon-green

// Gradients
bg-gradient-cyan-purple
```

### 2. Card Layout Pattern

```tsx
<div className="bg-card rounded-lg p-6 shadow-neon-cyan">
  <h2 className="text-xl font-bold text-primary mb-4">
    {t('section.title')}
  </h2>
  <div className="space-y-4">
    {/* Card content */}
  </div>
</div>
```

### 3. Responsive Grid Layout

```tsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-card rounded-lg p-4">
      {/* Item content */}
    </div>
  ))}
</div>

// Full-width on mobile, 2 columns on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Content */}
</div>
```

### 4. Button Styling

```tsx
// Primary action
<button className="bg-primary text-background px-6 py-2 rounded-lg shadow-neon-cyan hover:bg-opacity-80 transition-all">
  {t('button.submit')}
</button>

// Secondary action
<button className="bg-secondary text-white px-6 py-2 rounded-lg shadow-neon-purple hover:bg-opacity-80 transition-all">
  {t('button.cancel')}
</button>

// Danger/warning
<button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all">
  {t('button.delete')}
</button>
```

## Internationalization (i18n)

### 1. Always Use Translation Keys

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Correct
<h1>{t('cryptoRadar.title')}</h1>
<p>{t('cryptoRadar.description')}</p>

// WRONG - never hardcode text
<h1>Crypto Radar</h1>
```

### 2. Add Keys to Translation Files

Add to **both** `frontend/public/locales/zh-TW/translation.json` and `en-US/translation.json`:

```json
{
  "yourFeature": {
    "title": "功能標題",
    "description": "描述文字",
    "loading": "載入中...",
    "error": "載入失敗",
    "noData": "無數據"
  }
}
```

## API Integration

### 1. Fetch Pattern

```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/your-endpoint?symbol=BTC_USDT`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    setData(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    // Show error to user
  } finally {
    setLoading(false);
  }
};
```

### 2. Loading State

```tsx
{loading ? (
  <div className="flex items-center justify-center h-64">
    <div className="text-secondary text-lg">
      {t('common.loading')}
    </div>
  </div>
) : (
  // Render data
)}
```

### 3. Error State

```tsx
{error && (
  <div className="bg-red-900/20 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
    {t('common.error')}: {error}
  </div>
)}
```

### 4. Empty State

```tsx
{data.length === 0 && !loading && (
  <div className="text-center text-secondary py-12">
    {t('common.noData')}
  </div>
)}
```

## Chart.js Integration

### 1. Chart Setup

```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register once at top of component
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

### 2. Chart Data (Cyberpunk Colors)

```typescript
const chartData = {
  labels: timestamps,
  datasets: [
    {
      label: 'Price (USD)',
      data: prices,
      borderColor: '#00D9FF',              // Primary cyan
      backgroundColor: 'rgba(0, 217, 255, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,                         // Smooth curves
      pointRadius: 0,                       // Hide points on line
      pointHoverRadius: 5,                  // Show on hover
    }
  ]
};
```

### 3. Chart Options (Themed)

```typescript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { 
        color: '#00D9FF',                   // Primary cyan
        font: { size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(26, 35, 50, 0.95)',
      titleColor: '#00D9FF',
      bodyColor: '#FFFFFF',
      borderColor: '#00D9FF',
      borderWidth: 1
    }
  },
  scales: {
    x: { 
      ticks: { color: '#B24BF3' },          // Secondary purple
      grid: { color: 'rgba(178, 75, 243, 0.1)' }
    },
    y: {
      ticks: { color: '#00FFB3' },          // Accent green
      grid: { color: 'rgba(0, 255, 179, 0.1)' }
    }
  }
};
```

### 4. Chart Container

```tsx
<div className="bg-card rounded-lg p-6 shadow-neon-cyan">
  <h3 className="text-lg font-bold text-primary mb-4">
    {t('chart.priceHistory')}
  </h3>
  <div className="h-[400px]">
    <Line data={chartData} options={chartOptions} />
  </div>
</div>
```

## State Management (Zustand)

Use Zustand for cross-page state (e.g., selected symbol):

```typescript
import { useGlobalStore } from '@/stores/globalStore';

const { selectedSymbol, setSelectedSymbol } = useGlobalStore();

// Use in component
<select 
  value={selectedSymbol}
  onChange={(e) => setSelectedSymbol(e.target.value)}
  className="bg-card text-white p-2 rounded"
>
  {/* Options */}
</select>
```

## Performance Best Practices

1. **Debounce user input** for search/filter
2. **Memoize expensive calculations** with `useMemo`
3. **Virtualize long lists** if >100 items
4. **Lazy load images** with Next.js `Image` component
5. **Use `useCallback`** for event handlers passed to child components

## Mobile Responsiveness

Always test on mobile breakpoints:

```tsx
// Hide on mobile, show on tablet+
<div className="hidden md:block">Desktop only</div>

// Full width on mobile, fixed width on desktop
<div className="w-full lg:w-1/2">Responsive width</div>

// Stack on mobile, side-by-side on desktop
<div className="flex flex-col lg:flex-row gap-4">
  <div className="flex-1">Left</div>
  <div className="flex-1">Right</div>
</div>
```

## Accessibility

- Add `aria-label` to icon-only buttons
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Ensure sufficient color contrast (Cyberpunk theme already compliant)
- Support keyboard navigation (focus states)

## Common Patterns

### Loading Skeleton

```tsx
{loading ? (
  <div className="animate-pulse">
    <div className="h-8 bg-card rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-card rounded"></div>
  </div>
) : (
  // Actual content
)}
```

### Data Table

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead className="border-b border-primary">
      <tr>
        <th className="p-3 text-primary">{t('table.symbol')}</th>
        <th className="p-3 text-primary">{t('table.price')}</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id} className="border-b border-card hover:bg-card/50">
          <td className="p-3 text-white">{item.symbol}</td>
          <td className="p-3 text-accent">${item.price.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Badge/Tag Component

```tsx
<span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
  {tag}
</span>
```
