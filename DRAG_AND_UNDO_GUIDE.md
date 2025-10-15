# PDF Editor - Drag, Delete & Undo/Redo Guide

## 🎯 How Text Container Movement Works

### Drag & Drop System

The text container movement uses a **sophisticated drag state management system** with the following components:

#### 1. **Drag State Object**
```typescript
interface DragState {
  isDragging: boolean;        // Is the element being dragged?
  isResizing: boolean;        // Is the element being resized?
  resizeHandle: string | null; // Which handle? ('nw', 'ne', 'sw', 'se')
  startX: number;             // Mouse X when drag started
  startY: number;             // Mouse Y when drag started
  startElementX: number;      // Element X when drag started
  startElementY: number;      // Element Y when drag started
  startElementWidth: number;  // Element width when drag started
  startElementHeight: number; // Element height when drag started
}
```

#### 2. **Movement Flow**

**Step 1: Mouse Down (Start Drag)**
```typescript
handleElementMouseDown(event, element)
```
- User clicks on a text box
- System captures:
  - Current mouse position (startX, startY)
  - Element's current position (startElementX, startElementY)
  - Element's current size (startElementWidth, startElementHeight)
- Sets `isDragging = true`
- Cursor changes to "grabbing"

**Step 2: Mouse Move (During Drag)**
```typescript
handleElementMouseMove(event)
```
- Fires continuously while mouse moves
- Calculates:
  ```typescript
  deltaX = currentMouseX - startX
  deltaY = currentMouseY - startY
  ```
- Updates element position:
  ```typescript
  newX = startElementX + deltaX
  newY = startElementY + deltaY
  ```
- Element follows mouse in real-time

**Step 3: Mouse Up (End Drag)**
```typescript
handleElementMouseUp()
```
- User releases mouse button
- Saves current state to history (for undo/redo)
- Resets drag state
- Cursor returns to normal

### Visual Example

```
Initial State:
┌─────────────────┐
│ Text Box        │ (x: 100, y: 100)
│                 │
└─────────────────┘

User clicks and drags 50px right, 30px down:

During Drag:
                  ┌─────────────────┐
                  │ Text Box        │ (x: 150, y: 130)
                  │                 │
                  └─────────────────┘

Delta: x = +50, y = +30
```

---

## ♻️ Undo/Redo System

### How the History Stack Works

The PDF editor maintains **3 arrays** for undo/redo:

```typescript
history: {
  past: EditorElement[][]     // Previous states
  present: EditorElement[]    // Current state
  future: EditorElement[][]   // States to redo
}
```

### Stack Operations

#### **When You Make a Change:**
1. Current state → pushed to `past` array
2. New state → becomes `present`
3. `future` array → cleared (can't redo after new changes)

#### **When You Undo (Ctrl+Z):**
1. Current `present` → pushed to `future` array
2. Last item from `past` → popped and becomes `present`
3. Elements array updated to match `present`

#### **When You Redo (Ctrl+Y):**
1. Current `present` → pushed to `past` array
2. First item from `future` → removed and becomes `present`
3. Elements array updated to match `present`

### Visual Stack Example

```
Initial: Add Text Box A
┌─────────┐
│ Past    │ []
├─────────┤
│ Present │ [A]
├─────────┤
│ Future  │ []
└─────────┘

Add Text Box B
┌─────────┐
│ Past    │ [[A]]
├─────────┤
│ Present │ [A, B]
├─────────┤
│ Future  │ []
└─────────┘

Delete B
┌─────────┐
│ Past    │ [[A], [A,B]]
├─────────┤
│ Present │ [A]
├─────────┤
│ Future  │ []
└─────────┘

Undo (Ctrl+Z) - B comes back!
┌─────────┐
│ Past    │ [[A]]
├─────────┤
│ Present │ [A, B]  ← Restored!
├─────────┤
│ Future  │ [[A]]
└─────────┘

Redo (Ctrl+Y) - B deleted again
┌─────────┐
│ Past    │ [[A], [A,B]]
├─────────┤
│ Present │ [A]  ← B removed
├─────────┤
│ Future  │ []
└─────────┘
```

---

## 🔑 Keyboard Shortcuts

### Undo/Redo
| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| **Undo** | `Ctrl + Z` | `Cmd + Z` |
| **Redo** | `Ctrl + Y` or `Ctrl + Shift + Z` | `Cmd + Shift + Z` |

### Element Management
| Action | Shortcut |
|--------|----------|
| **Delete Selected Element** | `Delete` or `Backspace` |

**Note:** Delete only works when:
- An element is selected
- You're NOT typing in a text box
- The element is on the current page

---

## 🎮 Complete User Flow Examples

### Example 1: Create, Move, Delete, Undo

1. **Create Text Box**
   - Click "Text" tool
   - Click on PDF → Text box appears
   - History: `past=[], present=[TextBox1]`

2. **Move Text Box**
   - Click and drag text box to new position
   - On mouse up → history saved
   - History: `past=[[TextBox1 old position]], present=[TextBox1 new position]`

3. **Delete Text Box**
   - Click Delete button in properties panel
   - History: `past=[...previous states, [TextBox1]], present=[]`

4. **Undo (Ctrl+Z)**
   - Text box reappears!
   - History: `past=[...previous states], present=[TextBox1], future=[[]]`

5. **Redo (Ctrl+Y)**
   - Text box deleted again
   - History: `past=[...previous states, [TextBox1]], present=[], future=[]`

### Example 2: Style Changes with Undo

1. **Add Text "Hello"**
   - Font: Arial, Size: 16px, Color: Black
   - History saved

2. **Change to Bold**
   - Properties panel → click Bold
   - History saved

3. **Change Color to Red**
   - Properties panel → select red
   - History saved

4. **Undo (Ctrl+Z)**
   - Color returns to black

5. **Undo again (Ctrl+Z)**
   - Bold removed, back to normal

6. **Redo (Ctrl+Y)**
   - Bold returns

7. **Redo again (Ctrl+Y)**
   - Color returns to red

---

## 🔧 When History is Saved

History is automatically saved after:

1. ✅ **Adding an element** (text, checkbox, signature, etc.)
2. ✅ **Deleting an element**
3. ✅ **Duplicating an element**
4. ✅ **Finishing a drag** (mouse up after moving)
5. ✅ **Finishing a resize** (mouse up after resizing)
6. ✅ **Layer order changes** (bring to front, send to back)

History is **NOT** saved during:
- ❌ Active dragging (too many saves)
- ❌ Active resizing (too many saves)
- ❌ Typing in text box (saved on blur or significant pause)

This prevents the history from becoming too large with hundreds of intermediate states.

---

## 🎨 Resize System

Similar to drag, but uses **corner handles**:

### Four Resize Handles:
- **NW (North-West)**: Top-left corner
- **NE (North-East)**: Top-right corner
- **SW (South-West)**: Bottom-left corner
- **SE (South-East)**: Bottom-right corner

### Resize Calculation Example (SE Handle):

```typescript
User drags SE handle 50px right, 30px down:

Original:
width: 200px, height: 100px

Delta:
deltaX = +50, deltaY = +30

New size:
width = 200 + 50 = 250px
height = 100 + 30 = 130px

Position stays same (top-left corner doesn't move)
```

### NW Handle (Opposite Corner):

```typescript
User drags NW handle 50px right, 30px down:

Original:
x: 100, y: 100
width: 200px, height: 100px

Delta:
deltaX = +50, deltaY = +30

New position & size:
x = 100 + 50 = 150px  (moves right)
y = 100 + 30 = 130px  (moves down)
width = 200 - 50 = 150px  (shrinks)
height = 100 - 30 = 70px  (shrinks)

Note: Position AND size both change!
```

---

## 💡 Pro Tips

1. **Undo Limit**: History keeps last 50 states to prevent memory issues
2. **Cross-Platform**: Works on Windows, Mac, and Linux
3. **Smart Detection**: Won't delete while typing in text fields
4. **Visual Feedback**: 
   - Blue ring on selection
   - Shadow when selected
   - Handles show resize points
   - Cursor changes (move/grabbing/resize)

---

## 🐛 Troubleshooting

### "Undo not working"
- Check console: Should see "Undo triggered"
- Verify `history.canUndo` is true
- Make sure a change was made first

### "Can't drag text box"
- Ensure element is selected (blue ring)
- Click outside textarea, then on border to drag
- Check that `activeTool` is 'select' or element is already selected

### "Delete key not working"
- Click on element border, not inside textarea
- Make sure element is selected (blue ring)
- Check console for "Element deleted" message

---

This system provides a **professional-grade** editing experience with full undo/redo support! 🚀
