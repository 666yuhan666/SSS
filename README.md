simpleheat
==========

A super-tiny JavaScript library for drawing heatmaps with Canvas.
Inspired by [heatmap.js](https://github.com/pa7/heatmap.js), but with focus on simplicity and performance.

Powers [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat), a heatmap plugin for [Leaflet](http://leafletjs.com).

Demo: http://mourner.github.io/simpleheat/demo

```js
simpleheat('canvas').data(data).draw();
```

## Reference

#### Constructor

```js
// create a simpleheat object given an id or canvas reference
var heat = simpleheat(canvas);
```

#### Data

```js
// set data of [[x, y, value], ...] format
heat.data(data);

// set max data value (1 by default)
heat.max(max);

// add a data point
heat.add(point);

// clear data
heat.clear();
```

#### Appearance

```js
// set point radius and blur radius (25 and 15 by default)
heat.radius(r, r2);

// set gradient colors as {<stop>: '<color>'}, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
heat.gradient(grad);

// call in case Canvas size changed (returns this for chaining)
// autoDraw: optional boolean - if true, forces a draw after resize
// When autoDraw is undefined, it will auto-draw only if size changed from 0 to valid and there's a pending draw
heat.resize(autoDraw);

// Convenience method: resize and draw in one call
heat.refresh(minOpacity);
```

#### Rendering

```js
// draw the heatmap with optional minimum point opacity (0.05 by default)
// When canvas size is 0, marks _pendingDraw = true for future auto-render
heat.draw(minOpacity);
```

#### State & Status APIs

```js
// Check if canvas has valid dimensions (width > 0 && height > 0)
heat.isReady();  // returns boolean

// Get current and previous canvas dimensions
heat.getCanvasSize();
// Returns: { width, height, previousWidth, previousHeight }

// Check if there's a pending draw request (from calling draw() when size was 0)
heat.hasPendingDraw();  // returns boolean

// Check if any data has been added
heat.hasData();  // returns boolean
```

#### Event Callbacks

```js
// Register a callback for canvas size changes
heat.onSizeChange(function(event, heatInstance) {
    // event contains:
    // - oldWidth, oldHeight: previous dimensions
    // - newWidth, newHeight: current dimensions
    // - becameValid: true if size changed from 0 to valid
});

// Multiple callbacks can be registered
heat.onSizeChange(callback1).onSizeChange(callback2);
```

## Handling Zero-Size Canvas

When using simpleheat in scenarios where the canvas may initially have zero dimensions (e.g., hidden containers, inactive tabs, dynamic size changes), the library now handles these cases gracefully with enhanced state tracking and automatic recovery.

### Enhanced Behavior (v2)

- **Smart `draw()` with pending state**: When canvas width or height is 0, `draw()` marks `_pendingDraw = true` instead of just returning. This enables automatic redraw when canvas becomes valid.
- **Automatic redraw on `resize()`**: When `resize()` detects that canvas changed from 0 to valid size AND there's a pending draw, it automatically calls `draw()`.
- **State tracking**: New internal state variables track previous dimensions, pending draws, and data changes.
- **All configurations preserved**: `data()`, `max()`, `radius()`, `gradient()` settings are never lost during size transitions.

### New Convenience Methods

- **`refresh()`**: Combines `resize(true)` + `draw()` in one call.
- **`isReady()`**: Check if canvas has valid dimensions.
- **`hasPendingDraw()`**: Check if there's a pending draw request.
- **`onSizeChange(callback)`**: Register callbacks for dimension changes.

### Recommended Usage Patterns

#### Pattern 1: Simple (Automatic Recovery)
```js
// Canvas may be hidden (0x0) initially
var heat = simpleheat('canvas')
    .data(data)
    .max(18)
    .radius(30, 20)
    .draw();  // Marks _pendingDraw = true if 0x0

// Later, when container becomes visible:
container.style.display = 'block';
heat.resize();  // Auto-draws if there was a pending draw!
```

#### Pattern 2: Explicit Control
```js
var heat = simpleheat('canvas')
    .data(data)
    .draw();  // Pending if 0x0

// Use status APIs to check state
if (heat.isReady()) {
    console.log('Canvas is ready for drawing');
}
if (heat.hasPendingDraw()) {
    console.log('There is a pending draw request');
}

// Force immediate redraw when canvas becomes valid
heat.resize(true);  // autoDraw = true forces draw
```

#### Pattern 3: Event Callback
```js
var heat = simpleheat('canvas')
    .data(data)
    .onSizeChange(function(event, heat) {
        console.log('Canvas resized:', event.oldWidth + 'x' + event.oldHeight, 
                    '->', event.newWidth + 'x' + event.newHeight);
        if (event.becameValid) {
            console.log('Canvas just became valid!');
        }
    })
    .draw();

// When canvas is resized, callback is automatically invoked
```

#### Pattern 4: One-Call Refresh
```js
// The simplest pattern: use refresh()
var heat = simpleheat('canvas').data(data).draw();

// Later, when canvas becomes visible:
canvas.width = 1000;
canvas.height = 600;
heat.refresh();  // resize + draw in one call
```

### Common Scenarios & Solutions

| Scenario | Solution |
|----------|----------|
| **Hidden container (`display: none`)** | Call `heat.resize()` or `heat.refresh()` after showing |
| **Inactive tab** | Call `heat.refresh()` when tab activates |
| **Dynamic resize** | Use `heat.onSizeChange(callback)` for notifications |
| **Need explicit control** | Use `heat.resize(false)` + manual `draw()` |
| **Simplest usage** | Use `heat.refresh()` for one-call update |

### Complete Enhanced Example

```js
var canvas = document.getElementById('heatmap');
var heat = simpleheat(canvas);

// Configure everything (safe even if canvas is 0x0)
heat
    .data([[100, 100, 5], [200, 200, 3], [300, 300, 4]])
    .max(10)
    .radius(25, 15)
    .gradient({0.2: 'blue', 0.5: 'lime', 1: 'red'})
    .onSizeChange(function(event) {
        console.log('Size changed:', event.becameValid ? '(became valid!)' : '');
    })
    .draw();  // Marks pending if 0x0

// Later, when canvas becomes visible:
canvas.width = 800;
canvas.height = 600;

// Option A: Auto-draw if pending (default behavior)
heat.resize();

// Option B: Force draw regardless
heat.resize(true);

// Option C: One-call refresh
heat.refresh();

// All data, radius, gradient, and settings are preserved!
```

### Backward Compatibility

All existing code continues to work. The enhanced behavior is opt-in through:
- The automatic pending draw tracking (works with existing `draw()` + `resize()` patterns)
- New optional `autoDraw` parameter in `resize()`
- New convenience methods like `refresh()`
