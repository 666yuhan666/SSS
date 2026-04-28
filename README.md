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
- **`becameInvalid` detection (v2.1)**: When canvas changes from valid size to 0, `resize()` marks `_pendingDraw = true`. This ensures that when canvas recovers from 0, it will automatically redraw even if `draw()` was called before the canvas became 0.
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

---

## Resize 使用时机指南

### 何时应该调用 resize()

| 场景 | 时机 | 推荐调用方式 |
|------|------|-------------|
| **修改 canvas.width/height 后** | 立即调用 | `heat.resize()` |
| **容器从隐藏变为显示** | 显示后调用 | `heat.resize()` 或 `heat.refresh()` |
| **Tab 从未激活变为激活** | 激活时调用 | `heat.refresh()` |
| **窗口 resize 后** | 尺寸稳定后调用 | `heat.resize(true)` |
| **需要强制重绘时** | 任何时候 | `heat.refresh()` |

### resize() 参数行为详解

| 调用方式 | 条件 | 行为 |
|----------|------|------|
| `heat.resize()` | 尺寸从 0→有效 + 有待绘制 | ✅ 自动重绘 |
| `heat.resize()` | 其他情况 | 只同步尺寸，不重绘 |
| `heat.resize(true)` | 任何情况 | ✅ 强制重绘 |
| `heat.resize(false)` | 任何情况 | 只同步尺寸，不重绘 |

### 便捷方法对比

| 方法 | 等价于 | 适用场景 |
|------|--------|---------|
| `heat.refresh()` | `heat.resize(true).draw()` | 最简单，一键完成 |
| `heat.resize()` | 智能判断 | 需要精细控制时 |
| `heat.resize(true)` | 强制重绘 | 需要确保绘制时 |
| `heat.resize(false)` | 只同步尺寸 | 需要完全控制时 |

---

## 边界行为速查表

### 0 宽高场景行为

| 操作 | 0 宽度时 | 0 高度时 | 0x0 时 |
|------|----------|----------|---------|
| `heat.draw()` | ✅ 安全跳过，标记 `_pendingDraw=true` | ✅ 安全跳过，标记 `_pendingDraw=true` | ✅ 安全跳过，标记 `_pendingDraw=true` |
| `heat.data()` | ✅ 数据保持，不丢失 | ✅ 数据保持，不丢失 | ✅ 数据保持，不丢失 |
| `heat.max()` | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 |
| `heat.radius()` | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 |
| `heat.gradient()` | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 | ✅ 配置保持，不丢失 |
| `heat.add()` | ✅ 数据追加，不丢失 | ✅ 数据追加，不丢失 | ✅ 数据追加，不丢失 |

### 尺寸恢复场景行为

| 场景 | 行为 |
|------|------|
| 从有效→0 尺寸 + `heat.resize()` | ✅ 标记 `_pendingDraw=true`（新增 v2.1） |
| 从 0→有效尺寸 + `heat.resize()` + 有待绘制 | ✅ 自动重绘 |
| 从 0→有效尺寸 + `heat.resize()` + 无待绘制 | 只同步尺寸 |
| 从 0→有效尺寸 + `heat.refresh()` | ✅ 强制重绘 |
| 有效→有效 + `heat.resize()` | 只同步尺寸 |
| 有效→有效 + `heat.resize(true)` | ✅ 强制重绘 |
| 多次尺寸切换 | ✅ 所有配置保持不变 |

### 状态 API 参考

| API | 用途 | 返回值示例 |
|-----|------|------------|
| `heat.isReady()` | 检查是否有有效尺寸 | `true` / `false` |
| `heat.hasPendingDraw()` | 检查是否有待执行绘制 | `true` / `false` |
| `heat.hasData()` | 检查是否有数据 | `true` / `false` |
| `heat.getCanvasSize()` | 获取尺寸信息 | `{ width, height, previousWidth, previousHeight }` |

---

## 验证示例

### 交互式验证 Demo

项目包含 `demo-validation.html`，可用于手动验证所有边界场景：

- 场景 1: 0 宽高跳过绘制
- 场景 2: 恢复尺寸后重绘
- 场景 3: 已有数据保留
- 场景 4: 半径配置保留
- 场景 5: 渐变配置保留
- 场景 6: resize 使用时机

### 自动化测试

- `test-zero-size-comprehensive.html`: 第一轮测试（20 个用例）- 基础 0 尺寸处理
- `test-resize-enhanced.html`: 第二轮测试（25 个用例）- 增强 resize 行为和状态追踪
- `test-resize-autoredraw.html`: 第三轮测试（8 个用例）- 自动重绘逻辑验证（v2.1 新增）

**测试覆盖的核心场景**：

| 场景 | 测试文件 | 状态 |
|------|----------|------|
| 0 宽高跳过绘制 | test-zero-size-comprehensive.html, test-resize-autoredraw.html | ✅ |
| 恢复尺寸后重绘 | test-zero-size-comprehensive.html, test-resize-enhanced.html, test-resize-autoredraw.html | ✅ |
| 已有数据保留 | test-zero-size-comprehensive.html, test-resize-autoredraw.html | ✅ |
| 半径配置保留 | test-zero-size-comprehensive.html, test-resize-autoredraw.html | ✅ |
| 渐变配置保留 | test-zero-size-comprehensive.html, test-resize-autoredraw.html | ✅ |
| 从有效→0→有效自动重绘（v2.1 新增） | test-resize-autoredraw.html | ✅ |
| 连续多次 resize 不损坏状态 | test-resize-autoredraw.html | ✅ |
