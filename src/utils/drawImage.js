import { polygonConfig, circlePointConfig, lineConfig, groupConfig, rectConfig } from './cnavasConfig';

export class PolygonHole extends window.fabric.Polygon {
  constructor(paths, options = {}) {
    const [outer, ...holes] = paths;
    super(outer, options);
    this.fillRule = "evenodd";
    this.holes = holes;
  }

  holesRender(ctx) {
    const { x, y } = this.pathOffset;

    this.holes.forEach((hole) => {
      const len = hole.length;
      ctx.moveTo(hole[0].x - x, hole[0].y - y);
      for (let i = 0; i < len; i += 1) {
        const point = hole[i];
        ctx.lineTo(point.x - x, point.y - y);
      }
      ctx.closePath();
    });
  }

  _render(ctx) {
    if (!this.commonRender(ctx)) {
      return;
    }
    ctx.closePath();
    this.holesRender(ctx);
    this._renderPaintInOrder(ctx);
  }
}

class DrawImage {
  // create canvas
  createCanvas(canvasDom, config = {}) {
    const canvas = new window.fabric.Canvas(canvasDom, config);
    this.canvas = canvas;
    return canvas;
  }
  createStaticCanvas(canvasDom, config = {}) {
    return new window.fabric.StaticCanvas(canvasDom, config);
  }

  // draw poing
  generatePoint(x, y) {
    return new window.fabric.Point(x, y);
  }
  // draw line
  generateLine(points, config = {}) {
    const line = new window.fabric.Line(points, {
      ...lineConfig,
      ...config,
    });
    return line;
  }

  // draw polygon
  generatePolygon(points, config = {}) {
    const polygon = new window.fabric.Polygon(points, {
      ...polygonConfig,
      ...config,
      noScaleCache: false,
      strokeUniform: true,
    });
    return polygon;
  }

  // draw circle
  generateCircle(points, config = {}) {
    const circle = new window.fabric.Circle({
      ...circlePointConfig,
      left: points.x,
      top: points.y,
      name: "circle-" + points.name,
      id: "circle-" + points.name,
      ...config,
    });
    return circle;
  }

  generateRect(points, config = {}) {
    const rect = new window.fabric.Rect({
      ...rectConfig,
      ...points,
      ...config,
    });
    return rect;
  }

  generateGroup(arr, config = {}) {
    const group = new window.fabric.Group(arr, {
      name: "group",
      originX: "center",
      originY: "center",
      ...groupConfig,
      ...config,
    });
    const controlVisible = config.controlVisible || groupConfig.controlVisible;

    Object.keys(controlVisible).forEach((item) =>
      group.setControlVisible(item, controlVisible[item])
    );
    return group;
  }

  // ????????????????????????????????????????????????
  getIntersectionByPreAndTarget(perObjects, target) {
    const relationshipList = [];
    const noRelationshipList = [];
    perObjects.forEach((item) => {
      if (this.isIntersectsWithObject(item, target)) {
        relationshipList.push(item);
      } else {
        noRelationshipList.push(item);
      }
    });
    return {
      relationshipList,
      noRelationshipList,
    };
  }

  // ????????????????????????????????????????????????
  getContainerByPreOrTarget(perObjects, target) {
    const containerList = [];
    const noContainerList = [];
    perObjects.forEach((item) => {
      if (this.isContainedWithinObject(item, target)) {
        containerList.push(item);
      } else if (this.isContainedWithinObject(target, item)) {
      } else {
        noContainerList.push(item);
      }
    });

    return {
      containerList,
      noContainerList,
    };
  }

  // Determine whether there is an intersection between two graphics
  isIntersectsWithObject(poly1, poly2) {
    return this.polygonPolygon(poly1.get("points"), poly2.get("points"));
    // return poly1.intersectsWithObject(poly2);
  }

  // Determine whether the two graphics are in a containment relationship
  // isContainedWithinObject(poly1, poly2) {
  //   // Only judge whether the original image contains the target image
  //   return poly2.isContainedWithinObject(poly1);
  // }
  isContainedWithinObject(poly1, poly2) {
    const that = this;
    const a = poly1.points;
    const b = poly2.points;
    let count = 0;
    // ????????????????????????????????????
    for (let i = 0, l = b.length; i < l; ++i) {
      if (that.pointInPolygon(b[i], a)) {
        count += 1;
      } else {
        return false;
      }
    }
    if (count >= b.length) {
      return true;
    }
    return false;
  }

  editPolygon(poly) {
    const that = this;
    this.canvas.setActiveObject(poly);
    let lastControl = poly.points.length - 1;
    poly.cornerStyle = "circle";
    poly.cornerColor = "yellow";
    poly.controls = poly.points.reduce(function (acc, point, index) {
      acc["p" + index] = that.setControl({
        index,
        lastControl,
      });
      return acc;
    }, {});
  }

  setControl({ lastControl, index }) {
    const that = this;
    return new window.fabric.Control({
      positionHandler: that.polygonPositionHandler,
      actionHandler: that.anchorWrapper(
        index > 0 ? index - 1 : lastControl,
        that.actionHandler
      ),
      actionName: "modifyPolygon",
      pointIndex: index,
    });
  }

  polygonPositionHandler(dim, finalMatrix, fabricObject) {
    let x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
      y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
    return window.fabric.util.transformPoint(
      { x: x, y: y },
      window.fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  actionHandler(eventData, transform, x, y) {
    let polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(
        new window.fabric.Point(x, y),
        "center",
        "center"
      ),
      polygonBaseSize = polygon._getNonTransformedDimensions(),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x:
          (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
          polygon.pathOffset.x,
        y:
          (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
          polygon.pathOffset.y,
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  }

  anchorWrapper(anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      var fabricObject = transform.target,
        absolutePoint = window.fabric.util.transformPoint(
          {
            x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
          },
          fabricObject.calcTransformMatrix()
        ),
        actionPerformed = fn(eventData, transform, x, y),
        // newDim = fabricObject._setPositionDimensions({}),
        polygonBaseSize = fabricObject._getNonTransformedDimensions(),
        newX =
          (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
          polygonBaseSize.x,
        newY =
          (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
          polygonBaseSize.y;
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    };
  }

  polygonPolygon(a, b) {
    const that = this;
    // a???????????????b???????????????????????????
    for (let i = 0, l = a.length; i < l; ++i) {
      let a1 = a[i];
      let a2 = a[(i + 1) % l];

      if (that.linePolygon(a1, a2, b)) return true;
    }

    // ????????????????????????????????????
    for (let i = 0, l = b.length; i < l; ++i) {
      if (that.pointInPolygon(b[i], a)) return true;
    }

    // ????????????????????????????????????
    for (let i = 0, l = a.length; i < l; ++i) {
      if (that.pointInPolygon(a[i], b)) return true;
    }

    return false;
  }
  linePolygon(a1, a2, b) {
    const that = this;
    const length = b.length;

    for (let i = 0; i < length; ++i) {
      let b1 = b[i];
      let b2 = b[(i + 1) % length];

      if (that.lineLine(a1, a2, b1, b2)) return true;
    }

    return false;
  }
  pointInPolygon(point, polygon) {
    //* ???????????????????????????????????????
    //* ????????????????????????????????????????????????????????????????????????????????????????????????
    //* ???????????????????????????????????????????????????????????????????????????????????????????????????
    let inside = false;
    let x = point.x;
    let y = point.y;

    // use some raycasting to test hits
    // https://github.com/substack/point-in-polygon/blob/master/index.js
    let length = polygon.length;

    for (let i = 0, j = length - 1; i < length; j = i++) {
      let xi = polygon[i].x,
        yi = polygon[i].y,
        xj = polygon[j].x,
        yj = polygon[j].y,
        intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      // (yi > y) !== (yj > y)?????????????????????????????????y???????????????????????????y????????????????????????y
      //  (x < (xj - xi) * (y - yi) / (yj - yi) + xi) ???????????????????????????????????????????????????
      if (intersect) inside = !inside;
    }

    return inside;
  }

  lineLine(a1, a2, b1, b2) {
    // b1->b2?????? ??? a1->b1??????????????????
    let ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    // a1->a2?????? ??? a1->b1??????????????????
    let ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    // a1->a2?????? ??? b1->b2??????????????????
    let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    // u_b == 0???????????????0??????180 ?????????????????????????????????
    if (u_b !== 0) {
      let ua = ua_t / u_b;
      let ub = ub_t / u_b;

      if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        return true;
      }
    }

    return false;
  }
}

export default DrawImage;
