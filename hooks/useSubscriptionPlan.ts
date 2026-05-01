// Placeholder — returns a fixed plan for UI purposes.
// Replace with real Supabase profile query when auth/billing is wired up.

export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export function useSubscriptionPlan(): SubscriptionPlan {
  // ברירת מחדל: מסלול שאינו אנטרפרייז → מסך "נכסים" הוא רשימת נכסים.
  // החלף ל־'enterprise' לבדיקת מסך פרויקטים + נכסים בודדים.
  return 'enterprise';
}
