# Plan: Add Recovery Options to Empty Results Screen

## Problem
When the wizard shows "К сожалению, подходящих вариантов не найдено", the only option is to restart from scratch (6 questions). This is frustrating for users.

## Solution
Add three recovery options to the empty results screen in `results.tsx`:

### 1. Soften Filters
Show which filters are likely too restrictive and offer to relax them one by one.

**Implementation:**
- Add a `getSoftenedFilters(answers)` function that returns suggested filter relaxations
- For each non-"any" answer, suggest relaxing it
- Show buttons like: "Расширить бюджет до $45k-$55k", "Попробовать любой тип кузова", etc.
- Each button calls `onSoftenedFilter(key, "any")` to reset with that specific filter relaxed

**Files to modify:**
- `src/components/choose/results.tsx` - Add filter suggestion UI and callbacks
- `src/components/choose/wizard-client.tsx` - Add `handleSoftenedFilter` function

### 2. View All Vehicles
Add a button to bypass the wizard and show all available vehicles.

**Implementation:**
- Add a "Посмотреть все варианты" button on empty results
- This calls the API with all "any" values (no filtering)
- Show results in the same Results component

**Files to modify:**
- `src/components/choose/results.tsx` - Add "View All" button
- `src/components/choose/wizard-client.tsx` - Add `handleViewAll` function

### 3. Edit Last Answer
Let the user go back to just the last answered question instead of restarting.

**Implementation:**
- Add a "Изменить последний ответ" button on empty results
- This navigates to the step of the last non-"any" answer
- User can change just that one answer and re-submit

**Files to modify:**
- `src/components/choose/results.tsx` - Add "Edit Last Answer" button with callback
- `src/components/choose/wizard-client.tsx` - Add `handleEditLastAnswer` function

## Detailed Changes

### `src/components/choose/results.tsx`

Add new props to `ResultsProps`:
- `onSoftenedFilter?: (key: string, value: string) => void`
- `onViewAll?: () => void`
- `onEditLastAnswer?: () => void`

Add helper function to get softened filters:
```tsx
function getSoftenedFilters(answers: WizardAnswers): Array<{ key: string; label: string }> {
  const filters: Array<{ key: string; label: string }> = [];

  if (answers.budget && answers.budget !== "any") {
    const labels: Record<string, string> = {
      under_35k: "Расширить бюджет до $35k–$45k",
      "35k_45k": "Расширить бюджет до $45k–$55k",
      "45k_55k": "Расширить бюджет до $55k+",
    };
    if (labels[answers.budget]) {
      filters.push({ key: "budget", label: labels[answers.budget] });
    }
  }

  if (answers.bodyType && answers.bodyType !== "any") {
    filters.push({ key: "bodyType", label: "Попробовать любой тип кузова" });
  }

  if (answers.powertrain && answers.powertrain !== "any") {
    filters.push({ key: "powertrain", label: "Попробовать любой тип привода" });
  }

  if (answers.seats && answers.seats !== "any") {
    filters.push({ key: "seats", label: "Попробовать любое кол-во мест" });
  }

  return filters;
}
```

In the empty results Card, add the new UI elements.

### `src/components/choose/wizard-client.tsx`

Add helper function:
```tsx
function getLastAnsweredStep(answers: WizardAnswers): number {
  const stepKeys = ["budget", "bodyType", "powertrain", "seats", "priority", "usage"];
  for (let i = stepKeys.length - 1; i >= 0; i--) {
    if (answers[stepKeys[i as keyof WizardAnswers]] && answers[stepKeys[i as keyof WizardAnswers]] !== "any") {
      return i;
    }
  }
  return 0;
}
```

Add handlers:
```tsx
function handleSoftenedFilter(key: string, value: string) {
  const newAnswers = { ...answers, [key]: value };
  setAnswers(newAnswers);
  // Re-submit with softened filter
  setLoading(true);
  fetch("/api/choose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newAnswers),
  })
    .then((res) => res.json())
    .then((data) => setRecommendations(data.recommendations || []))
    .catch((err) => console.error("Failed to get recommendations:", err))
    .finally(() => setLoading(false));
}

function handleViewAll() {
  const allAny: WizardAnswers = {
    budget: "any",
    bodyType: "any",
    powertrain: "any",
    seats: "any",
    priority: "any",
    usage: "any",
  };
  setAnswers(allAny);
  setLoading(true);
  fetch("/api/choose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allAny),
  })
    .then((res) => res.json())
    .then((data) => setRecommendations(data.recommendations || []))
    .catch((err) => console.error("Failed to get recommendations:", err))
    .finally(() => setLoading(false));
}

function handleEditLastAnswer() {
  const lastStep = getLastAnsweredStep(answers);
  setStep(lastStep);
  setSubmitted(false);
}
```

Pass new props to Results component:
```tsx
<Results
  answers={answers}
  recommendations={recommendations}
  onReset={handleReset}
  onLeadForm={() => setShowLeadForm(true)}
  onSoftenedFilter={handleSoftenedFilter}
  onViewAll={handleViewAll}
  onEditLastAnswer={handleEditLastAnswer}
/>
```

## Testing
1. Test with restrictive filters (e.g., 7 seats + under_35k budget) to trigger empty results
2. Verify soften filters buttons appear and work
3. Verify "View All" shows all vehicles
4. Verify "Edit Last Answer" navigates to correct step
5. Run `npm run lint` and `npm run typecheck` after changes
