# תוכנית יישום: החלפת MOCK חוזים בפיד בנתונים אמיתיים

## בעיה
בטאב "פיד" בחלון פרטי נכס, לחיצה על פילטר "חוזים" מציגה נתוני MOCK
שנוצרים על ידי `makeFeed()` — אין חיבור לשרת.

## קובץ מושפע
`knock-front/components/modules/assets/DetailTabsScreen.tsx`

---

## שלבים

### שלב 1 — הסרת חוזים מ-`makeFeed()`
- [x] בפונקציה `makeFeed()`: הסר את `'contract'` ממערך `kinds`
  ```ts
  // לפני:
  const kinds: FeedKind[] = ['task', 'payment', 'message', 'contract'];
  // אחרי:
  const kinds: FeedKind[] = ['task', 'payment', 'message'];
  ```
- [x] הסר את שורת הכותרת `'חוזה עודכן'` מה-title switch (כי 'contract' לא יגיע יותר)
- [x] ב-`TARGET_IDS`: רוקן את מערך `contract` → `contract: []`

### שלב 2 — הוספת props ל-`FeedTab`
- [x] שנה את ה-signature של הפונקציה:
  ```ts
  // לפני:
  function FeedTab()
  // אחרי:
  function FeedTab({ entityId, mode }: { entityId: string; mode: DetailMode })
  ```

### שלב 3 — שליפת חוזים אמיתיים מהשרת
- [x] הוסף state בתוך `FeedTab`:
  ```ts
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  ```
- [x] הוסף `useEffect` לשליפה מהשרת (רק כשה-mode הוא `'asset'`):
  ```ts
  useEffect(() => {
    if (mode !== 'asset') return;
    let cancelled = false;
    fetchContracts({ propertyId: entityId })
      .then((data) => { if (!cancelled) setContracts(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mode, entityId]);
  ```

### שלב 4 — הצגת חוזים אמיתיים כשהפילטר "חוזים" פעיל
- [x] כשה-`filter === 'contract'`: הצג רשימת חוזים אמיתיים (לא את timeline הפיד)
- [x] כל שורת חוזה תציג: שם הצד השני, תאריכים, badge סטטוס (פעיל / לא בתוקף)
- [x] לחיצה על חוזה → ניווט ל-`/(app)/contracts/${item.id}`
- [x] אם אין חוזים → `EmptyState` עם כיתוב "אין חוזים"

### שלב 5 — העברת props מ-`DetailTabsScreen`
- [x] בפונקציה `renderContent()`, בcase של `'feed'`:
  ```ts
  // לפני:
  case 'feed':
    return <FeedTab />;
  // אחרי:
  case 'feed':
    return <FeedTab entityId={id} mode={mode} />;
  ```

---

## מה *לא* משתנה
- שאר הפילטרים (הכל, משימות, תשלומים, הודעות) ממשיכים לעבוד עם MOCK כרגיל
- ה-MainTab (טאב "חוזה") לא נגעים בו — הוא כבר שולף נתונים אמיתיים
- לא נוצרים קבצים חדשים
