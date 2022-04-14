import {SvgPlus} from "./4.js"
import {Vector3D, v3, Plane, Rotation, Quaternion} from "./Vector.js"

function styleString(style) {
  let str = ""
  if (typeof props === "object" && props != null) {
    for (let key in style) {
      if (str.length > 0) {
        str += ";"
      }
      str += `${key}: ${style[key]}`
    }
  }
  return str;
}
function propsString(props) {
  let str = "";
  if (typeof props === "object" && props != null) {
    for (let key in props) {
      let value = props[key];
      if (key == "style") value = styleString(value);
      if (key[0] != "_") {
        if (str.length > 0) str += " "
        str += `${key} = "${value}"`
      }
    }
  }
  return str;
}
function transform(point, offset, rotation, scale = 1) {
  let v = point.sub(offset);
  v = v.rotate(rotation);
  v = v.mul(scale);

  return v;
}


function sin(v) {return Math.sin(v);}
function cos(v) {return Math.cos(v);}
function sqrt(v) {return Math.sqrt(v);}

class BBox {
  constructor(firstValue){
    let min = null;
    let max = null;

    let addPoint = point => {
      point = v3(point);
      if (min == null) min = v3(point);
      if (max == null) max = v3(point);

      for (let i = 0; i < 3; i++) {
        if (point[i] < min[i]) min[i] = point[i];
        if (point[i] > max[i]) max[i] = point[i];
      }
    }

    this.add = (value) => {
      if (value instanceof BBox) {
        addPoint(value.min);
        addPoint(value.max);
      } else {
        addPoint(value);
      }
    }

    Object.defineProperty(this, "value", {get: () => {return {min: min, max: max}}})
    Object.defineProperty(this, "min", {get: () => v3(min)});
    Object.defineProperty(this, "max", {get: () => v3(max)});
    Object.defineProperty(this, "center", {get: () => this.min.add(this.max).div(2)});

    if (firstValue) {
      this.add(firstValue);
    }
  }
}

class Element3D {
  constructor(){
    this.props = {};
  }

  toString() {return ""}

  render(offset, rotation, scale = 1){
    return {html: "", z: 0, bbox: new BBox()}
  }

  getProps(info){
    this.updateProps(info, this.props);
    return this.props;
  }

  // user settable function
  updateProps(info, props) {
  }

  getBBox(){
    return new BBox();
  }
}
class Point3D extends Element3D {
  constructor(v){
    super();
    Object.defineProperty(this, "point", {
      get: () => v,
      set: (a) => v = v3(a)
    })
  }

  render(offset, rotation, scale = 1){
    let v = transform(this.point, offset, rotation, scale);

    let renderData = {
      html: (info) => {
        let props = propsString(this.getProps(info));
        return `<ellipse cx = "${v.x}" cy = "${v.y}" ${props}></ellipse>`;
      },
      z: v.z,
      bbox: new BBox(v)
    }
    return renderData;
  }

  getBBox(){
    return new BBox(this.point);
  }
}
class Path3D extends Element3D {
  constructor(a) {
    super();
    let points = [];

    if (a instanceof Array) {
      for (let point of a) {
        let v = v3(point);
        points.push(v);
      }
    }

    Object.defineProperty(this, "points", {
      get: () => {
        let itterable = {
          *[Symbol.iterator]() {
            for (let point of points) {
              yield point;
            }
          }
        }
        return itterable;
      }
    })
  }

  render(offset, rotation, scale = 1){
    let d = "";
    let bbox = new BBox();
    for (let point of this.points) {
      let v = transform(point, offset, rotation, scale);
      bbox.add(v);

      d += d.length == 0 ? "M" : "L";
      d += v.x + ", " + v.y;
    }
    let z = bbox.center.z;
    let renderData = {
      z: z,
      bbox: bbox,
      html: (info) => {
        let props = propsString(this.getProps(info));
        return `<path d = "${d}" ${props}></path>`;
      }
    }
    return renderData;
  }

  getBBox(){
    let bbox = new BBox();
    for (let point of this.points) {
      bbox.add(point);
    }
    return bbox;
  }
}

class Group3D extends SvgPlus {
  constructor(){
    super("g");

    this.props = {"g3d": ""}

    let rotation = new Rotation();
    Object.defineProperty(this, "rotation", {
      get: () => {
        let rot = new Rotation(rotation);
        if (this.parent3D) {
          rot.mul(this.parent3D.rotation);
        }
        return rot;
      }
    });

    Object.defineProperty(this, "origin", {
      get: () => {
        let og = v3();
        if (this.parent3D) {
          og = og.add(this.parent3D.origin);
        }
        return og;
      },
    });

    let offset = v3();
    Object.defineProperty(this, "offset", {
      get: () => {
        return offset;
      },
      set: (v) => {
        offset = v3(v);
      }
    });

    let scale = 1;
    Object.defineProperty(this, "scale", {
      get: () => {
        return scale;
      },
      set: (v) => {
        scale = v3(v);
      }
    });

    let elements = [];
    let addElement = (e) => {
      elements.push(e);
      e.id = elements.length - 1;
    }
    Object.defineProperty(this, "bounds", {
      get: () => {
        let bbox = new BBox();
        for (let element of elements) {
          bbox.add(element.getBBox());
        }
        return bbox;
      }
    })

    this.addPoint = (v) => {
      let point = new Point3D(v);
      addElement(point)
      return point;
    }
    this.addPath = (a) => {
      let path = new Path3D(a);
      addElement(path);
      return path;
    }

    let render = () => {
      // compute render
      let renderData = []
      let totalBBox = new BBox();
      let off = this.origin.add(offset);
      let rot = this.rotation;

      for (let element of elements) {
        let data = element.render(off, rot, scale);
        renderData.push(data);
        totalBBox.add(data.bbox);
      }

      //sort elements by z index
      renderData.sort((a, b) => a.z > b.z ? -1 : 1);
      let html = "";
      for (let rdata of renderData) {
        html += rdata.html({
          z: rdata.z,
          bbox: rdata.bbox,
          totalBBox: totalBBox,
        });
      }

      //display results
      this.innerHTML = html;
    }

    this.render = () => {
      let start = performance.now();

      const event = new Event("render");
      this.dispatchEvent(event);

      render();
      return performance.now() - start;
    }
  }
}


class Svg3D extends SvgPlus {
  constructor(el){
    super(el);

    let origin = v3();
    Object.defineProperty(this, "origin", {
      get: () => {
        return origin;
      },
      set: (v) => {
        origin = v3(v);
      }
    });


    let rotation = new Rotation();
    Object.defineProperty(this, "rotation", {
      get: () => rotation
    });
  }

  render(){
    let start = performance.now();

    const event = new Event("render");
    this.dispatchEvent(event);

    for (let g of this.groups) {
      g.render();
    }
    return performance.now() - start;
  }

  get bounds(){
    let bbox = new BBox();
    for (let g of this.groups) {
      bbox.add(g.bounds);
    }
    return bbox;
  }

  get groups() {
    return this.querySelectorAll("g[g3d]");
  }

  make3DGroup(){
    let group = null;
    if (this.svg) {
      group = this.svg.createChild(Group3D);
      group.parent3D = this;
    }
    return group;
  }

  startRenderAnimation(){
    let sum = 0;
    let frames = 0;

    let next = () => {
      let time = this.render();
      frames++;
      sum += time;
      let avgTime = sum / frames
      window.requestAnimationFrame(next);
      // setTimeout(next, avgTime/2);
    }

    window.requestAnimationFrame(next);
  }

  addRotationControlls(){
    let tv = 2.015;
    let th = -0.37;

    this.rotate = (x = 0, y = 0) => {
      tv += y;
      th += x;
    }

    let updateRotation = () => {
      let hs = v3([0, 1, 0]);
      let he = v3([0, cos(th), sin(th)]);

      let vs = v3([0, 1, 0]);
      let ve = v3([sin(tv), cos(tv), 0]);

      let q1 = Quaternion.fromTo(hs, he);
      let q2 = Quaternion.fromTo(vs, ve);

      let q3 = q1.mul(q2);

      this.rotation.fromQuaternion(q3);
    }
    this.addEventListener("render", updateRotation)
  }

  centerOrigin(bbox = this.bounds){
    this.origin = bbox.center;
  }

  onconnect(){
    this.innerHTML = "";
    this.svg = this.createChild("svg");
  }

  boundViewBox(padding = 10, scale = 1){
    let bbox = this.bounds;
    if (this.svg){
      let center = bbox.center;
      let r = center.dist(bbox);
      r = r*scale;

      this.svg.props = {
        viewBox: `${-r -padding} ${-r -padding} ${2*(r + padding)} ${2*(r + padding)}`
      }
    }
    return bbox;
  }
}

SvgPlus.defineHTMLElement(Svg3D, "svg-3d");
