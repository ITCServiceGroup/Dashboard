# Dashboard Filter Changes Implementation Plan

## Current State
- Score values are stored in database as decimals (0-1)
- Time values are stored in database as seconds
- Users must input score filters as decimals (0-1)
- Users must input time filters in seconds

## Proposed Changes

### 1. Score Filter Changes (0-1 to 0-100)
- Update the min-score and max-score input fields to accept values from 0-100
- Modify the filtering logic to convert user input from percentage (0-100) to decimal (0-1) before querying database
- Update any relevant UI labels/placeholders to indicate percentage input
- No changes needed to charts as they already display scores as percentages

### 2. Time Filter Changes (seconds to minutes)
- Update the min-time and max-time input fields to accept values in minutes
- Modify the filtering logic to convert user input from minutes to seconds before querying database
- Update any relevant UI labels/placeholders to indicate minutes input
- No changes needed to charts as they already display time in minutes

## Implementation Steps

1. Update HTML Input Fields:
   - Add min/max attributes to validate input ranges
   - Update placeholders and labels to reflect new units
   - Add "step" attributes to allow decimal inputs if needed

2. Modify Dashboard.js Filtering Logic:
   - Add conversion from percentage to decimal for score filters
   - Add conversion from minutes to seconds for time filters
   - Update the query building logic to use the converted values

3. Testing:
   - Test score filtering with various percentage inputs (0-100)
   - Test time filtering with various minute inputs
   - Verify that charts and data display correctly with the new filtering

## Benefits
- More intuitive user experience with familiar percentage values (0-100)
- More practical time filtering using minutes instead of seconds
- No changes required to database structure or chart display logic

## Risks and Mitigations
- Risk: Users might be confused by the change in input format
  - Mitigation: Clear labels and placeholders indicating expected input format
- Risk: Potential rounding issues in conversions
  - Mitigation: Use appropriate decimal precision in calculations