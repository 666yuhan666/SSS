'use strict';

if (typeof module !== 'undefined') module.exports = simpleheat;

function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d', {willReadFrequently: true});
    this._width = canvas.width;
    this._height = canvas.height;

    this._prevWidth = this._width;
    this._prevHeight = this._height;

    this._max = 1;
    this._data = [];

    this._pendingDraw = false;
    this._dataChanged = false;
    this._sizeChangeCallbacks = [];
}

simpleheat.prototype = {

    defaultRadius: 25,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        this._dataChanged = true;
        return this;
    },

    max: function (max) {
        this._max = max;
        this._dataChanged = true;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        this._dataChanged = true;
        return this;
    },

    clear: function () {
        this._data = [];
        this._dataChanged = true;
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 15 : blur;

        var circle = this._circle = this._createCanvas(),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        this._dataChanged = true;
        return this;
    },

    resize: function (autoDraw) {
        var oldWidth = this._width;
        var oldHeight = this._height;
        var hadValidSize = this._hasValidSize();

        this._prevWidth = this._width;
        this._prevHeight = this._height;

        this._width = this._canvas.width;
        this._height = this._canvas.height;

        var sizeChanged = (oldWidth !== this._width) || (oldHeight !== this._height);
        var nowHasValidSize = this._hasValidSize();
        var becameValid = !hadValidSize && nowHasValidSize;

        if (sizeChanged) {
            this._notifySizeChange({
                oldWidth: oldWidth,
                oldHeight: oldHeight,
                newWidth: this._width,
                newHeight: this._height,
                becameValid: becameValid
            });
        }

        var shouldAutoDraw = (autoDraw === undefined) ? (becameValid && this._pendingDraw) : autoDraw;

        if (shouldAutoDraw && nowHasValidSize) {
            this.draw();
        }

        return this;
    },

    refresh: function (minOpacity) {
        this.resize(false);
        return this.draw(minOpacity);
    },

    onSizeChange: function (callback) {
        if (typeof callback === 'function') {
            this._sizeChangeCallbacks.push(callback);
        }
        return this;
    },

    _notifySizeChange: function (event) {
        for (var i = 0; i < this._sizeChangeCallbacks.length; i++) {
            try {
                this._sizeChangeCallbacks[i](event, this);
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) {
                    console.error('simpleheat size change callback error:', e);
                }
            }
        }
    },

    isReady: function () {
        return this._hasValidSize();
    },

    getCanvasSize: function () {
        return {
            width: this._width,
            height: this._height,
            previousWidth: this._prevWidth,
            previousHeight: this._prevHeight
        };
    },

    hasPendingDraw: function () {
        return this._pendingDraw;
    },

    hasData: function () {
        return this._data && this._data.length > 0;
    },

    _hasValidSize: function () {
        return this._width > 0 && this._height > 0;
    },

    gradient: function (grad) {
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d', {willReadFrequently: true}),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;
        this._dataChanged = true;

        return this;
    },

    draw: function (minOpacity) {
        if (!this._hasValidSize()) {
            this._pendingDraw = true;
            return this;
        }

        if (!this._circle) this.radius(this.defaultRadius);
        if (!this._grad) this.gradient(this.defaultGradient);

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.min(Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity), 1);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        this._pendingDraw = false;
        this._dataChanged = false;

        return this;
    },

    _colorize: function (pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4;

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            return new this._canvas.constructor();
        }
    }
};
