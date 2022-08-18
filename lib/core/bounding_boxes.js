/**
 * @licstart The following is the entire license notice for the
 * Javascript code in this page
 *
 * Copyright 2020 Mozilla Foundation
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

var BoundingBoxesCalculator = function PartialEvaluatorClosure() {
  function BoundingBoxesCalculator(ignoreCalculations) {
    this.textStateManager = new _evaluator.StateManager(new _evaluator.TextState());
    this.graphicsStateManager = new _evaluator.StateManager(new GraphicsState());
    this.clipping = false;
    this.boundingBoxesStack = new BoundingBoxStack();
    this.boundingBoxes = {};
    this.ignoreCalculations = ignoreCalculations;
  }

  BoundingBoxesCalculator.prototype = {
    getTopPoints: function BoundingBoxesCalculator_getTopPoints(x0, y0, x1, y1, h) {
      let l = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));

      if (l === 0) {
        return [x1 + h, y1 + h, x0 + h, y0 + h];
      }

      let e = [(x1 - x0) / l, (y1 - y0) / l];
      let rotated_e = [-e[1], e[0]];
      let result_vector = [rotated_e[0] * h, rotated_e[1] * h];
      return [x1 + result_vector[0], y1 + result_vector[1], x0 + result_vector[0], y0 + result_vector[1]];
    },
    getTextBoundingBox: function BoundingBoxesCalculator_getTextBoundingBox(glyphs) {
      let tx = 0;
      let ty = 0;
      let ctm = this.graphicsStateManager.state.ctm;
      let descent = (this.textStateManager.state.font.descent || 0) * this.textStateManager.state.fontSize;
      let ascent = (this.textStateManager.state.font.ascent || 1) * this.textStateManager.state.fontSize;
      let rise = this.textStateManager.state.textRise * this.textStateManager.state.fontSize;

      let shift = _util.Util.applyTransform([0, descent + rise], this.textStateManager.state.textMatrix);

      shift[0] -= this.textStateManager.state.textMatrix[4];
      shift[1] -= this.textStateManager.state.textMatrix[5];

      let height = _util.Util.applyTransform([0, ascent + rise], this.textStateManager.state.textMatrix);

      height[0] -= this.textStateManager.state.textMatrix[4] + shift[0];
      height[1] -= this.textStateManager.state.textMatrix[5] + shift[1];
      height = Math.sqrt(height[0] * height[0] + height[1] * height[1]);
      let [tx0, ty0] = [this.textStateManager.state.textMatrix[4] + shift[0], this.textStateManager.state.textMatrix[5] + shift[1]];

      for (let i = 0; i < glyphs.length; i++) {
        let glyph = glyphs[i];

        if ((0, _util.isNum)(glyph)) {
          if (this.textStateManager.state.font.vertical) {
            ty = -glyph / 1000 * this.textStateManager.state.fontSize * this.textStateManager.state.textHScale;
          } else {
            tx = -glyph / 1000 * this.textStateManager.state.fontSize * this.textStateManager.state.textHScale;
          }
        } else {
          let glyphWidth = null;

          if (this.textStateManager.state.font.vertical && glyph.vmetric) {
            glyphWidth = glyph.vmetric[0];
          } else {
            glyphWidth = glyph.width;
          }

          if (!this.textStateManager.state.font.vertical) {
            let w0 = glyphWidth * (this.textStateManager.state.fontMatrix ? this.textStateManager.state.fontMatrix[0] : 1 / 1000);
            tx = (w0 * this.textStateManager.state.fontSize + this.textStateManager.state.charSpacing + (glyph.isSpace ? this.textStateManager.state.wordSpacing : 0)) * this.textStateManager.state.textHScale;
          } else {
            let w1 = glyphWidth * (this.textStateManager.state.fontMatrix ? this.textStateManager.state.fontMatrix[0] : 1 / 1000);
            ty = w1 * this.textStateManager.state.fontSize + this.textStateManager.state.charSpacing + (glyph.isSpace ? this.textStateManager.state.wordSpacing : 0);
          }
        }

        this.textStateManager.state.translateTextMatrix(tx, ty);
      }

      let [tx1, ty1] = [this.textStateManager.state.textMatrix[4] + shift[0], this.textStateManager.state.textMatrix[5] + shift[1]];
      let [tx2, ty2, tx3, ty3] = this.getTopPoints(tx0, ty0, tx1, ty1, height);

      if (this.textStateManager.state.textMatrix[3] < 0) {
        ty0 += height * this.textStateManager.state.textMatrix[3];
        ty1 += height * this.textStateManager.state.textMatrix[3];
        ty2 += height * this.textStateManager.state.textMatrix[3];
        ty3 += height * this.textStateManager.state.textMatrix[3];
      }

      let [x0, y0] = _util.Util.applyTransform([tx0, ty0], ctm);

      let [x1, y1] = _util.Util.applyTransform([tx1, ty1], ctm);

      let [x2, y2] = _util.Util.applyTransform([tx2, ty2], ctm);

      let [x3, y3] = _util.Util.applyTransform([tx3, ty3], ctm);

      let minX = Math.min(x0, x1, x2, x3);
      let maxX = Math.max(x0, x1, x2, x3);
      let minY = Math.min(y0, y1, y2, y3);
      let maxY = Math.max(y0, y1, y2, y3);
      this.boundingBoxesStack.save(minX, minY, maxX - minX, maxY - minY);
    },
    getClippingGraphicsBoundingBox: function BoundingBoxesCalculator_getClippingGraphicsBoundingBox() {
      let state = this.graphicsStateManager.state;

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
      let clippingBBox = this.getClippingGraphicsBoundingBox();

      if (clippingBBox === null) {
        return;
      }

      let x = clippingBBox.x;
      let y = clippingBBox.y;
      let w = clippingBBox.w;
      let h = clippingBBox.h;
      this.boundingBoxesStack.save(x, y, w, h);
    },
    getRectBoundingBox: function getRectBoundingBox(x, y, w, h) {
      let state = this.graphicsStateManager.state;

      let [x1, y1] = _util.Util.applyTransform([x, y], state.ctm);

      let [x2, y2] = _util.Util.applyTransform([x + w, y], state.ctm);

      let [x3, y3] = _util.Util.applyTransform([x, y + h], state.ctm);

      let [x4, y4] = _util.Util.applyTransform([x + w, y + h], state.ctm);

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
      let state = this.graphicsStateManager.state;
      [x, y] = _util.Util.applyTransform([x, y], state.ctm);

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
      let sqrt;
      let root_1;
      let root_2;
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
      let state = this.graphicsStateManager.state;

      if (op !== _util.OPS.curveTo2) {
        [x1, y1] = _util.Util.applyTransform([x1, y1], state.ctm);
      }

      [x2, y2] = _util.Util.applyTransform([x2, y2], state.ctm);
      [x3, y3] = _util.Util.applyTransform([x3, y3], state.ctm);
      let curveX = this.getCurve(x0, x1, x2, x3);
      let curveY = this.getCurve(y0, y1, y2, y3);
      let [root_1, root_2] = this.getCurveRoots(x0, x1, x2, x3);
      let minX = Math.min(x0, x3, root_1 !== null ? curveX(root_1) : Number.MAX_VALUE, root_2 !== null ? curveX(root_2) : Number.MAX_VALUE);
      let maxX = Math.max(x0, x3, root_1 !== null ? curveX(root_1) : Number.MIN_VALUE, root_2 !== null ? curveX(root_2) : Number.MIN_VALUE);
      [root_1, root_2] = this.getCurveRoots(y0, y1, y2, y3);
      let minY = Math.min(y0, y3, root_1 !== null ? curveY(root_1) : Number.MAX_VALUE, root_2 !== null ? curveY(root_2) : Number.MAX_VALUE);
      let maxY = Math.max(y0, y3, root_1 !== null ? curveY(root_1) : Number.MIN_VALUE, root_2 !== null ? curveY(root_2) : Number.MIN_VALUE);
      let x = minX;
      let y = minY;
      let h = maxY - minY;
      let w = maxX - minX;

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
        let state = this.graphicsStateManager.state;

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
      let state = this.graphicsStateManager.state;

      let [x0, y0] = _util.Util.applyTransform([0, 0], state.ctm);

      let [x1, y1] = _util.Util.applyTransform([0, 1], state.ctm);

      let [x2, y2] = _util.Util.applyTransform([1, 1], state.ctm);

      let [x3, y3] = _util.Util.applyTransform([1, 0], state.ctm);

      state.x = Math.min(x0, x1, x2, x3);
      state.y = Math.min(y0, y1, y2, y3);
      state.w = Math.max(x0, x1, x2, x3) - state.x;
      state.h = Math.max(y0, y1, y2, y3) - state.y;
    },
    parseOperator: function BoundingBoxesCalculator_parseOperator(fn, args) {
      if (this.ignoreCalculations) {
        return;
      }

      switch (fn | 0) {
        case _util.OPS.restore:
          this.graphicsStateManager.restore();
          this.textStateManager.restore();
          break;

        case _util.OPS.save:
          this.graphicsStateManager.save();
          this.textStateManager.save();
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
          this.textStateManager.state.fontSize = args[0];
          this.textStateManager.state.fontMatrix = args[1].font.fontMatrix;
          this.textStateManager.state.font = args[1].font;
          break;

        case _util.OPS.setTextMatrix:
          this.textStateManager.state.setTextMatrix(args[0], args[1], args[2], args[3], args[4], args[5]);
          this.textStateManager.state.setTextLineMatrix(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;

        case _util.OPS.nextLine:
          this.textStateManager.state.carriageReturn();
          break;

        case _util.OPS.setCharSpacing:
          this.textStateManager.state.charSpacing = args[0];
          break;

        case _util.OPS.setWordSpacing:
          this.textStateManager.state.wordSpacing = args[0];
          break;

        case _util.OPS.setHScale:
          this.textStateManager.state.textHScale = args[0] / 100;
          break;

        case _util.OPS.setLeading:
          this.textStateManager.state.leading = args[0];
          break;

        case _util.OPS.setTextRise:
          this.textStateManager.state.textRise = args[0];
          break;

        case _util.OPS.setLeadingMoveText:
          this.textStateManager.state.leading = -args[1];
          this.textStateManager.state.translateTextLineMatrix(...args);
          this.textStateManager.state.textMatrix = this.textStateManager.state.textLineMatrix.slice();
          break;

        case _util.OPS.moveText:
          this.textStateManager.state.translateTextLineMatrix(args[0], args[1]);
          this.textStateManager.state.textMatrix = this.textStateManager.state.textLineMatrix.slice();
          break;

        case _util.OPS.beginText:
          this.textStateManager.state.textMatrix = _util.IDENTITY_MATRIX.slice();
          this.textStateManager.state.textLineMatrix = _util.IDENTITY_MATRIX.slice();
          break;

        case _util.OPS.moveTo:
          let ctm = this.graphicsStateManager.state.ctm.slice();
          [this.graphicsStateManager.state.move_x, this.graphicsStateManager.state.move_y] = _util.Util.applyTransform(args, ctm);
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
          let boundingBox = this.boundingBoxesStack.end();

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
      this.textStateManager.state.fontMatrix = translated.font.fontMatrix;
      this.textStateManager.state.font = translated.font;
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
      let current = this.stack[this.stack.length - 1];

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
      let last = this.stack.pop();

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