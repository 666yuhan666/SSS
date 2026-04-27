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
heat.resize();
```

#### Rendering

```js
// draw the heatmap with optional minimum point opacity (0.05 by default)
heat.draw(minOpacity);
```

## Handling Zero-Size Canvas

When using simpleheat in scenarios where the canvas may initially have zero dimensions (e.g., hidden containers, inactive tabs, dynamic size changes), the library now handles these cases gracefully:

### Behavior

- **`draw()` with zero size**: When canvas width or height is 0, `draw()` will safely skip rendering without throwing errors. All configured data and settings remain intact.
- **Data preservation**: All configurations (`data()`, `max()`, `radius()`, `gradient()`) are preserved even when the canvas has zero size.
- **Chainable API**: All methods remain chainable, including `draw()` and `resize()`.

### Recommended Usage

When the canvas may be hidden or have zero size initially:

```js
// Create instance (canvas may be 0x0 at this point)
var heat = simpleheat('canvas')
    .data(data)
    .max(18)
    .radius(30, 20)
    .draw();  // Safe to call even if canvas is 0x0

// Later, when container becomes visible or canvas is resized:
canvas.width = 1000;
canvas.height = 600;
heat.resize()  // Sync internal dimensions with canvas
    .draw();   // Now renders normally
```

### Common Scenarios

1. **Hidden containers (`display: none`)**: The canvas may report 0x0 dimensions. Call `resize()` after showing the container.
2. **Inactive tabs**: Tab content may not be measured until activated. Call `resize()` when the tab becomes active.
3. **Dynamic resizing**: After changing `canvas.width` or `canvas.height`, always call `resize()` before `draw()`.

### Complete Example

```js
var canvas = document.getElementById('heatmap');
var heat = simpleheat(canvas);

// Set up data and configuration (safe even if canvas is 0x0)
heat.data([[100, 100, 5], [200, 200, 3], [300, 300, 4]])
    .max(10)
    .radius(25, 15)
    .draw();  // Safe skip if 0x0

// Later, when canvas becomes visible:
canvas.width = 800;
canvas.height = 600;
heat.resize().draw();  // Now renders with all preserved data
```
