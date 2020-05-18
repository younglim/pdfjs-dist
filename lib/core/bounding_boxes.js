/**
 * @licstart The following is the entire license notice for the
 * Javascript code in this page
 *
 * Copyright 2018 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * Javascript code in this page
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BoundingBoxesCalculator = void 0;

var _util = require("../shared/util");

var _evaluator = require("./evaluator");

var _primitives = require("./primitives");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var BoundingBoxesCalculator = function PartialEvaluatorClosure() {
  function BoundingBoxesCalculator(ignoreCalculations) {
    this.textState = new _evaluator.TextState();
    this.graphicsStateManager = new _evaluator.StateManager(new GraphicsState());
    this.clipping = false;
    this.boundingBoxesStack = new BoundingBoxStack();
    this.boundingBoxes = {};
    this.ignoreCalculations = ignoreCalculations;
  }

  BoundingBoxesCalculator.prototype = {
    getTopPoints: function BoundingBoxesCalculator_getTopPoints(x0, y0, x1, y1, h) {
      var l = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));

      if (l === 0) {
        return [x1 + h, y1 + h, x0 + h, y0 + h];
      }

      var e = [(x1 - x0) / l, (y1 - y0) / l];
      var rotated_e = [-e[1], e[0]];
      var result_vector = [rotated_e[0] * h, rotated_e[1] * h];
      return [x1 + result_vector[0], y1 + result_vector[1], x0 + result_vector[0], y0 + result_vector[1]];
    },
    getTextBoundingBox: function BoundingBoxesCalculator_getTextBoundingBox(glyphs) {
      var tx = 0;
      var ty = 0;
      var ctm = this.graphicsStateManager.state.ctm;
      var descent = (this.textState.font.descent || 0) * this.textState.fontSize;
      var ascent = (this.textState.font.ascent || 1) * this.textState.fontSize;
      var rise = this.textState.textRise * this.textState.fontSize;

      var shift = _util.Util.applyTransform([0, descent + rise], this.textState.textMatrix);

      shift[0] -= this.textState.textMatrix[4];
      shift[1] -= this.textState.textMatrix[5];

      var height = _util.Util.applyTransform([0, ascent + rise], this.textState.textMatrix);

      height[0] -= this.textState.textMatrix[4] + shift[0];
      height[1] -= this.textState.textMatrix[5] + shift[1];
      height = Math.sqrt(height[0] * height[0] + height[1] * height[1]);
      var tx0 = this.textState.textMatrix[4] + shift[0],
          ty0 = this.textState.textMatrix[5] + shift[1];

      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];

        if ((0, _util.isNum)(glyph)) {
          if (this.textState.font.vertical) {
            ty = -glyph / 1000 * this.textState.fontSize * this.textState.textHScale;
          } else {
            tx = -glyph / 1000 * this.textState.fontSize * this.textState.textHScale;
          }
        } else {
          var glyphWidth = null;

          if (this.textState.font.vertical && glyph.vmetric) {
            glyphWidth = glyph.vmetric[0];
          } else {
            glyphWidth = glyph.width;
          }

          if (!this.textState.font.vertical) {
            var w0 = glyphWidth * (this.textState.fontMatrix ? this.textState.fontMatrix[0] : 1 / 1000);
            tx = (w0 * this.textState.fontSize + this.textState.charSpacing + (glyph.isSpace ? this.textState.wordSpacing : 0)) * this.textState.textHScale;
          } else {
            var w1 = glyphWidth * (this.textState.fontMatrix ? this.textState.fontMatrix[0] : 1 / 1000);
            ty = w1 * this.textState.fontSize + this.textState.charSpacing + (glyph.isSpace ? this.textState.wordSpacing : 0);
          }
        }

        this.textState.translateTextMatrix(tx, ty);
      }

      var tx1 = this.textState.textMatrix[4] + shift[0],
          ty1 = this.textState.textMatrix[5] + shift[1];

      var _this$getTopPoints = this.getTopPoints(tx0, ty0, this.textState.textMatrix[4] + shift[0], this.textState.textMatrix[5] + shift[1], height),
          _this$getTopPoints2 = _slicedToArray(_this$getTopPoints, 4),
          tx2 = _this$getTopPoints2[0],
          ty2 = _this$getTopPoints2[1],
          tx3 = _this$getTopPoints2[2],
          ty3 = _this$getTopPoints2[3];

      var _Util$applyTransform = _util.Util.applyTransform([tx0, ty0], ctm),
          _Util$applyTransform2 = _slicedToArray(_Util$applyTransform, 2),
          x0 = _Util$applyTransform2[0],
          y0 = _Util$applyTransform2[1];

      var _Util$applyTransform3 = _util.Util.applyTransform([tx1, ty1], ctm),
          _Util$applyTransform4 = _slicedToArray(_Util$applyTransform3, 2),
          x1 = _Util$applyTransform4[0],
          y1 = _Util$applyTransform4[1];

      var _Util$applyTransform5 = _util.Util.applyTransform([tx2, ty2], ctm),
          _Util$applyTransform6 = _slicedToArray(_Util$applyTransform5, 2),
          x2 = _Util$applyTransform6[0],
          y2 = _Util$applyTransform6[1];

      var _Util$applyTransform7 = _util.Util.applyTransform([tx3, ty3], ctm),
          _Util$applyTransform8 = _slicedToArray(_Util$applyTransform7, 2),
          x3 = _Util$applyTransform8[0],
          y3 = _Util$applyTransform8[1];

      var minX = Math.min(x0, x1, x2, x3);
      var maxX = Math.max(x0, x1, x2, x3);
      var minY = Math.min(y0, y1, y2, y3);
      var maxY = Math.max(y0, y1, y2, y3);
      this.boundingBoxesStack.save(minX, minY, maxX - minX, maxY - minY);
    },
    getClippingGraphicsBoundingBox: function BoundingBoxesCalculator_getClippingGraphicsBoundingBox() {
      var state = this.graphicsStateManager.state;

      if (state.clip === null) {
        return {
          x: state.x,
          y: state.y,
          w: state.w,
          h: state.h
        };
      }

      if (state.x < state.clip.x && state.x + state.w < state.clip.x || state.x > state.clip.x + state.clip.w && state.x + state.w > state.clip.x + state.clip.w || state.y < state.clip.y && state.y + state.h < state.clip.y || state.y > state.clip.y + state.clip.h && state.y + state.h > state.clip.y + state.clip.h) {
        return null;
      }

      return {
        x: Math.max(state.x, state.clip.x),
        y: Math.max(state.y, state.clip.y),
        w: Math.min(state.x + state.w, state.clip.x + state.clip.w) - Math.max(state.x, state.clip.x),
        h: Math.min(state.y + state.h, state.clip.y + state.clip.h) - Math.max(state.y, state.clip.y)
      };
    },
    saveGraphicsBoundingBox: function saveGraphicsBoundingBox() {
      var clippingBBox = this.getClippingGraphicsBoundingBox();

      if (clippingBBox === null) {
        return;
      }

      var x = clippingBBox.x;
      var y = clippingBBox.y;
      var w = clippingBBox.w;
      var h = clippingBBox.h;
      this.boundingBoxesStack.save(x, y, w, h);
    },
    getRectBoundingBox: function getRectBoundingBox(x, y, w, h) {
      var state = this.graphicsStateManager.state;

      var _Util$applyTransform9 = _util.Util.applyTransform([x, y], state.ctm),
          _Util$applyTransform10 = _slicedToArray(_Util$applyTransform9, 2),
          x1 = _Util$applyTransform10[0],
          y1 = _Util$applyTransform10[1];

      var _Util$applyTransform11 = _util.Util.applyTransform([x + w, y], state.ctm),
          _Util$applyTransform12 = _slicedToArray(_Util$applyTransform11, 2),
          x2 = _Util$applyTransform12[0],
          y2 = _Util$applyTransform12[1];

      var _Util$applyTransform13 = _util.Util.applyTransform([x, y + h], state.ctm),
          _Util$applyTransform14 = _slicedToArray(_Util$applyTransform13, 2),
          x3 = _Util$applyTransform14[0],
          y3 = _Util$applyTransform14[1];

      var _Util$applyTransform15 = _util.Util.applyTransform([x + w, y + h], state.ctm),
          _Util$applyTransform16 = _slicedToArray(_Util$applyTransform15, 2),
          x4 = _Util$applyTransform16[0],
          y4 = _Util$applyTransform16[1];

      x = Math.min(x1, x2, x3, x4);
      y = Math.min(y1, y2, y3, y4);
      w = Math.max(x1, x2, x3, x4) - x;
      h = Math.max(y1, y2, y3, y4) - y;

      if (state.w === null) {
        state.w = Math.abs(w);
      } else {
        state.w = Math.max(state.x + state.w, x, x + w) - Math.min(state.x, x, x + w);
      }

      if (state.h === null) {
        state.h = Math.abs(h);
      } else {
        state.h = Math.max(state.y + state.h, y, y + h) - Math.min(state.y, y, y + h);
      }

      if (state.x === null) {
        state.x = Math.min(x, x + w);
      } else {
        state.x = Math.min(state.x, x, x + w);
      }

      if (state.y === null) {
        state.y = Math.min(y, y + h);
      } else {
        state.y = Math.min(state.y, y, y + h);
      }
    },
    getLineBoundingBox: function getLineBoundingBox(x, y) {
      var state = this.graphicsStateManager.state;

      var _Util$applyTransform17 = _util.Util.applyTransform([x, y], state.ctm);

      var _Util$applyTransform18 = _slicedToArray(_Util$applyTransform17, 2);

      x = _Util$applyTransform18[0];
      y = _Util$applyTransform18[1];

      if (state.w === null) {
        state.w = Math.abs(x - state.move_x);
      } else {
        state.w = Math.max(x, state.move_x, state.x + state.w) - Math.min(x, state.move_x, state.x);
      }

      if (state.h === null) {
        state.h = Math.abs(y - state.move_y);
      } else {
        state.h = Math.max(y, state.move_y, state.y + state.h) - Math.min(y, state.move_y, state.y);
      }

      if (state.x === null) {
        state.x = Math.min(x, state.move_x);
      } else {
        state.x = Math.min(x, state.move_x, state.x);
      }

      if (state.y === null) {
        state.y = Math.min(y, state.move_y);
      } else {
        state.y = Math.min(y, state.move_y, state.y);
      }

      state.move_x = x;
      state.move_y = y;
    },
    getCurve: function getCurve(a, b, c, d) {
      return function curve(t) {
        return Math.pow(1 - t, 3) * a + 3 * t * Math.pow(1 - t, 2) * b + 3 * t * t * (1 - t) * c + t * t * t * d;
      };
    },
    getCurveRoots: function getCurveRoots(a, b, c, d) {
      var sqrt;
      var root_1;
      var root_2;
      sqrt = Math.pow(6 * a - 12 * b + 6 * c, 2) - 4 * (3 * b - 3 * a) * (-3 * a + 9 * b - 9 * c + 3 * d);
      root_1 = null;
      root_2 = null;

      if (Math.abs(a + 3 * c - 3 * b - d) > Math.pow(0.1, -10)) {
        if (sqrt >= 0) {
          root_1 = (-6 * a + 12 * b - 6 * c + Math.sqrt(sqrt)) / (2 * (-3 * a + 9 * b - 9 * c + 3 * d));
          root_2 = (-6 * a + 12 * b - 6 * c - Math.sqrt(sqrt)) / (2 * (-3 * a + 9 * b - 9 * c + 3 * d));
        }
      } else if (sqrt > Math.pow(0.1, -10)) {
        root_1 = (a - b) / (2 * a - 4 * b + 2 * c);
      }

      if (root_1 !== null && (root_1 < 0 || root_1 > 1)) {
        root_1 = null;
      }

      if (root_2 !== null && (root_2 < 0 || root_2 > 1)) {
        root_2 = null;
      }

      return [root_1, root_2];
    },
    getCurveBoundingBox: function getCurveBoundingBox(op, x0, y0, x1, y1, x2, y2, x3, y3) {
      var state = this.graphicsStateManager.state;

      if (op !== _util.OPS.curveTo2) {
        var _Util$applyTransform19 = _util.Util.applyTransform([x1, y1], state.ctm);

        var _Util$applyTransform20 = _slicedToArray(_Util$applyTransform19, 2);

        x1 = _Util$applyTransform20[0];
        y1 = _Util$applyTransform20[1];
      }

      var _Util$applyTransform21 = _util.Util.applyTransform([x2, y2], state.ctm);

      var _Util$applyTransform22 = _slicedToArray(_Util$applyTransform21, 2);

      x2 = _Util$applyTransform22[0];
      y2 = _Util$applyTransform22[1];

      var _Util$applyTransform23 = _util.Util.applyTransform([x3, y3], state.ctm);

      var _Util$applyTransform24 = _slicedToArray(_Util$applyTransform23, 2);

      x3 = _Util$applyTransform24[0];
      y3 = _Util$applyTransform24[1];
      var curveX = this.getCurve(x0, x1, x2, x3);
      var curveY = this.getCurve(y0, y1, y2, y3);

      var _this$getCurveRoots = this.getCurveRoots(x0, x1, x2, x3),
          _this$getCurveRoots2 = _slicedToArray(_this$getCurveRoots, 2),
          root_1 = _this$getCurveRoots2[0],
          root_2 = _this$getCurveRoots2[1];

      var minX = Math.min(x0, x3, root_1 !== null ? curveX(root_1) : Number.MAX_VALUE, root_2 !== null ? curveX(root_2) : Number.MAX_VALUE);
      var maxX = Math.max(x0, x3, root_1 !== null ? curveX(root_1) : Number.MIN_VALUE, root_2 !== null ? curveX(root_2) : Number.MIN_VALUE);

      var _this$getCurveRoots3 = this.getCurveRoots(y0, y1, y2, y3);

      var _this$getCurveRoots4 = _slicedToArray(_this$getCurveRoots3, 2);

      root_1 = _this$getCurveRoots4[0];
      root_2 = _this$getCurveRoots4[1];
      var minY = Math.min(y0, y3, root_1 !== null ? curveY(root_1) : Number.MAX_VALUE, root_2 !== null ? curveY(root_2) : Number.MAX_VALUE);
      var maxY = Math.max(y0, y3, root_1 !== null ? curveY(root_1) : Number.MIN_VALUE, root_2 !== null ? curveY(root_2) : Number.MIN_VALUE);
      var x = minX;
      var y = minY;
      var h = maxY - minY;
      var w = maxX - minX;

      if (state.w === null) {
        state.w = Math.abs(w);
      } else {
        state.w = Math.max(state.x + state.w, x, x + w) - Math.min(state.x, x, x + w);
      }

      if (state.h === null) {
        state.h = Math.abs(h);
      } else {
        state.h = Math.max(state.y + state.h, y, y + h) - Math.min(state.y, y, y + h);
      }

      if (state.x === null) {
        state.x = Math.min(x, x + w);
      } else {
        state.x = Math.min(state.x, x, x + w);
      }

      if (state.y === null) {
        state.y = Math.min(y, y + h);
      } else {
        state.y = Math.min(state.y, y, y + h);
      }

      state.move_x = x;
      state.move_y = y;
    },
    getClip: function getClip() {
      if (this.clipping) {
        var state = this.graphicsStateManager.state;

        if (state.clip === null) {
          state.clip = {
            x: state.x,
            y: state.y,
            w: state.w,
            h: state.h
          };
        } else {
          state.clip = {
            x: Math.max(state.x, state.clip.x),
            y: Math.max(state.y, state.clip.y),
            w: Math.min(state.x + state.w, state.clip.x + state.clip.w) - Math.max(state.x, state.clip.x),
            h: Math.min(state.y + state.h, state.clip.y + state.clip.h) - Math.max(state.y, state.clip.y)
          };
        }

        this.clipping = false;
      }
    },
    getImageBoundingBox: function getImageBoundingBox() {
      var state = this.graphicsStateManager.state;

      var _Util$applyTransform25 = _util.Util.applyTransform([0, 0], state.ctm),
          _Util$applyTransform26 = _slicedToArray(_Util$applyTransform25, 2),
          x0 = _Util$applyTransform26[0],
          y0 = _Util$applyTransform26[1];

      var _Util$applyTransform27 = _util.Util.applyTransform([0, 1], state.ctm),
          _Util$applyTransform28 = _slicedToArray(_Util$applyTransform27, 2),
          x1 = _Util$applyTransform28[0],
          y1 = _Util$applyTransform28[1];

      var _Util$applyTransform29 = _util.Util.applyTransform([1, 1], state.ctm),
          _Util$applyTransform30 = _slicedToArray(_Util$applyTransform29, 2),
          x2 = _Util$applyTransform30[0],
          y2 = _Util$applyTransform30[1];

      var _Util$applyTransform31 = _util.Util.applyTransform([1, 0], state.ctm),
          _Util$applyTransform32 = _slicedToArray(_Util$applyTransform31, 2),
          x3 = _Util$applyTransform32[0],
          y3 = _Util$applyTransform32[1];

      state.x = Math.min(x0, x1, x2, x3);
      state.y = Math.min(y0, y1, y2, y3);
      state.w = Math.max(x0, x1, x2, x3) - state.x;
      state.h = Math.max(y0, y1, y2, y3) - state.y;
    },
    parseOperator: function BoundingBoxesCalculator_parseOperator(fn, args) {
      var _this$textState;

      if (this.ignoreCalculations) {
        return;
      }

      switch (fn | 0) {
        case _util.OPS.restore:
          this.graphicsStateManager.restore();
          break;

        case _util.OPS.save:
          this.graphicsStateManager.save();
          break;

        case _util.OPS.fill:
        case _util.OPS.eoFill:
        case _util.OPS.eoFillStroke:
        case _util.OPS.fillStroke:
        case _util.OPS.stroke:
        case _util.OPS.closeEOFillStroke:
        case _util.OPS.closeFillStroke:
        case _util.OPS.closeStroke:
          this.getClip();
          this.saveGraphicsBoundingBox();
          break;

        case _util.OPS.endPath:
          this.getClip();
          this.graphicsStateManager.state.clean();
          break;

        case _util.OPS.transform:
          this.graphicsStateManager.state.ctm = _util.Util.transform(this.graphicsStateManager.state.ctm, args);
          break;

        case _util.OPS.clip:
        case _util.OPS.eoClip:
          this.clipping = true;
          break;

        case _util.OPS.setFont:
          this.textState.fontSize = args[0];
          this.textState.fontMatrix = args[1].font.fontMatrix;
          this.textState.font = args[1].font;
          break;

        case _util.OPS.setTextMatrix:
          this.textState.setTextMatrix(args[0], args[1], args[2], args[3], args[4], args[5]);
          this.textState.setTextLineMatrix(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;

        case _util.OPS.nextLine:
          this.textState.carriageReturn();
          break;

        case _util.OPS.setCharSpacing:
          this.textState.charSpacing = args[0];
          break;

        case _util.OPS.setWordSpacing:
          this.textState.wordSpacing = args[0];
          break;

        case _util.OPS.setHScale:
          this.textState.textHScale = args[0] / 100;
          break;

        case _util.OPS.setLeading:
          this.textState.leading = args[0];
          break;

        case _util.OPS.setTextRise:
          this.textState.textRise = args[0];
          break;

        case _util.OPS.setLeadingMoveText:
          this.textState.leading = -args[1];

          (_this$textState = this.textState).translateTextLineMatrix.apply(_this$textState, _toConsumableArray(args));

          this.textState.textMatrix = this.textState.textLineMatrix.slice();
          break;

        case _util.OPS.moveText:
          this.textState.translateTextLineMatrix(args[0], args[1]);
          this.textState.textMatrix = this.textState.textLineMatrix.slice();
          break;

        case _util.OPS.beginText:
          this.textState.textMatrix = _util.IDENTITY_MATRIX.slice();
          this.textState.textLineMatrix = _util.IDENTITY_MATRIX.slice();
          break;

        case _util.OPS.moveTo:
          var ctm = this.graphicsStateManager.state.ctm.slice();

          var _Util$applyTransform33 = _util.Util.applyTransform(args, ctm);

          var _Util$applyTransform34 = _slicedToArray(_Util$applyTransform33, 2);

          this.graphicsStateManager.state.move_x = _Util$applyTransform34[0];
          this.graphicsStateManager.state.move_y = _Util$applyTransform34[1];
          break;

        case _util.OPS.lineTo:
          this.getLineBoundingBox(args[0], args[1]);
          break;

        case _util.OPS.curveTo:
          this.getCurveBoundingBox(_util.OPS.curveTo, this.graphicsStateManager.state.move_x, this.graphicsStateManager.state.move_y, args[0], args[1], args[2], args[3], args[4], args[5]);
          break;

        case _util.OPS.curveTo2:
          this.getCurveBoundingBox(_util.OPS.curveTo2, this.graphicsStateManager.state.move_x, this.graphicsStateManager.state.move_y, this.graphicsStateManager.state.move_x, this.graphicsStateManager.state.move_y, args[0], args[1], args[2], args[3]);
          break;

        case _util.OPS.curveTo3:
          this.getCurveBoundingBox(_util.OPS.curveTo3, this.graphicsStateManager.state.move_x, this.graphicsStateManager.state.move_y, args[0], args[1], args[2], args[3], args[2], args[3]);
          break;

        case _util.OPS.rectangle:
          this.getRectBoundingBox(args[0], args[1], args[2], args[3]);
          break;

        case _util.OPS.markPoint:
        case _util.OPS.markPointProps:
        case _util.OPS.beginMarkedContent:
          this.boundingBoxesStack.begin();
          break;

        case _util.OPS.beginMarkedContentProps:
          if ((0, _primitives.isDict)(args[1]) && args[1].has('MCID')) {
            this.boundingBoxesStack.begin(args[1].get('MCID'));
            this.graphicsStateManager.state.x = null;
            this.graphicsStateManager.state.y = null;
            this.graphicsStateManager.state.w = null;
            this.graphicsStateManager.state.h = null;
          } else {
            this.boundingBoxesStack.begin();
          }

          break;

        case _util.OPS.endMarkedContent:
          var boundingBox = this.boundingBoxesStack.end();

          if (boundingBox !== null) {
            this.boundingBoxes[boundingBox.mcid] = {
              x: boundingBox.x,
              y: boundingBox.y,
              width: boundingBox.w,
              height: boundingBox.h
            };
          }

          break;

        case _util.OPS.paintXObject:
          if (args[0] === 'Image') {
            this.getImageBoundingBox();
            this.saveGraphicsBoundingBox();
          }

          break;

        case _util.OPS.showText:
          this.getTextBoundingBox(args[0]);
          break;

        default:
          break;
      }
    },
    setFont: function BoundingBoxesCalculator_setFont(translated) {
      this.textState.fontMatrix = translated.font.fontMatrix;
      this.textState.font = translated.font;
    }
  };
  return BoundingBoxesCalculator;
}();

exports.BoundingBoxesCalculator = BoundingBoxesCalculator;

var GraphicsState = function GraphicsState() {
  function GraphicsState() {
    this.x = null;
    this.y = null;
    this.w = null;
    this.h = null;
    this.move_x = null;
    this.move_y = null;
    this.ctm = _util.IDENTITY_MATRIX.slice();
    this.clip = null;
  }

  GraphicsState.prototype = {
    clone: function GraphicsState_clone() {
      var clone = Object.create(this);
      clone.ctm = this.ctm.slice();
      return clone;
    },
    clean: function GraphicsState_clear() {
      this.x = null;
      this.y = null;
      this.w = null;
      this.h = null;
      this.move_x = 0;
      this.move_y = 0;
      this.ctm = _util.IDENTITY_MATRIX.slice();
    }
  };
  return GraphicsState;
}();

var BoundingBoxStack = function BoundingBoxStack() {
  function BoundingBoxStack() {
    this.stack = [];
  }

  BoundingBoxStack.prototype = {
    begin: function BoundingBoxStack_begin(mcid) {
      this.stack.push({
        x: null,
        y: null,
        w: null,
        h: null,
        mcid: Number.isInteger(mcid) ? mcid : null
      });
    },
    save: function BoundingBoxStack_save(x, y, w, h) {
      var current = this.stack[this.stack.length - 1];

      if (!current) {
        return;
      }

      if (current.w === null) {
        current.w = w;
      } else {
        current.w = Math.max(current.x + current.w, x + w) - Math.min(current.x, x);
      }

      if (current.x === null) {
        current.x = x;
      } else {
        current.x = Math.min(current.x, x);
      }

      if (current.h === null) {
        current.h = h;
      } else {
        current.h = Math.max(current.y + current.h, y + h) - Math.min(current.y, y);
      }

      if (current.y === null) {
        current.y = y;
      } else {
        current.y = Math.min(current.y, y);
      }
    },
    end: function BoundingBoxStack_end() {
      var last = this.stack.pop();

      if (last.mcid !== null) {
        return last;
      } else {
        this.save(last.x, last.y, last.w, last.h);
        return null;
      }
    }
  };
  return BoundingBoxStack;
}();