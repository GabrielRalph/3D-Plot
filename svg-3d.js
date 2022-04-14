import {SvgPlus} from "./4.js"
import {Vector, v3, Rotation, Quaternion, BBox, argumentParser} from "./Vector.js"

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
  v = v.mul(Rotation.fromQuaternion(rotation));
  v = v.mul(scale);
  return v;
}

function tnow(){return performance.now()}
function tlog(start, message) {
  let dif = tnow() - start
  console.log(`${message} took: ${Math.round(dif*1e2)/1e2}ms`);
}

function sin(v) {return Math.sin(v);}
function cos(v) {return Math.cos(v);}
function sqrt(v) {return Math.sqrt(v);}

class Element3D {
  constructor(){
    this.props = {};
  }

  update(){
    this._bbox = null;
  }

  render(offset, rotation, scale = 1){
    this.renderCache = {html: "", z: 0, bbox: new BBox()}
  }

  // updates properties before rendering
  updateProps() {
  }

  getBBox(){
    return new BBox();
  }

  toString() {
    this.updateProps(this.rdata, this.props);
    return ""
  }

  get rdata(){
    return this.renderCache;
  }

  get bbox(){
    if (!this._bbox) {
      this._bbox = this.getBBox();
    }
    return this._bbox;
  }

  // computes props string
  get sprops(){
    return propsString(this.props);
  }
}

class Point3D extends Element3D {
  constructor(){
    super();
    this.point = argumentParser(arguments, Vector);
  }

  render(offset, rotation, scale = 1){
    let v = Vector.parse(this.point);
    v = transform(v, offset, rotation, scale);
    this.renderCache = {
      point: v,
      z: v.z,
      bbox: new BBox(v)
    }
  }

  getBBox(){
    return new BBox(this.point);
  }

  toString(){
    super.toString();
    let v = this.rdata.point;
    return `<ellipse cx = "${v.x}" cy = "${v.y}" ${this.sprops}></ellipse>`
  }
}

class Path3D extends Element3D {
  constructor(a) {
    super();
    this.points = [];

    if (a instanceof Array) {
      for (let point of a) {
        let v = Vector.parse(point);
        this.points.push(v);
      }
    }
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
    this.renderCache = {
      z: z,
      bbox: bbox,
      path: d,
    }
  }

  toString(){
    super.toString();
    return `<path d = "${this.rdata.path}" ${this.sprops}></path>`
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

    this._rotation = Quaternion.fromTo(new Vector(1), new Vector(1));
    this._offset = new Vector();
    this._scale = 1;

    this.elements = [];
  }

  get bbox(){
    if (!this._bbox) {
      this._bbox = this.getBBox();
    }
    return this._bbox;
  }

  getBBox(){
    let bbox = new BBox();
    for (let element of this.elements) {
      bbox.add(element.bbox);
    }
    return bbox;
  }

  __render(){
    // Get state information
    let start = tnow();
    let totalBBox = new BBox();
    let offset = this.origin;
    let rotation = this.rotation;
    let scale = this.scale;
    let elements = this.elements;
    // tlog(start, "state information")

    // compute render information [takes ~ 100ms]
    start = tnow();
    for (let element of elements) {
      element.render(offset, rotation, scale);
      totalBBox.add(element.rdata.bbox);
    }
    // tlog(start, "render information");


    //sort elements by z index
    start = tnow();
    elements.sort((a, b) => a.rdata.z > b.rdata.z ? -1 : 1);
    // tlog(start, "sorting by z")

    // takes roughly 10ms
    start = tnow();
    let html = "";
    for (let element of elements) {
      element.rdata.totalBBox = totalBBox;
      html += "" + element;
    }
    // tlog(start, "generating html");

    //display results
    start = tnow();
    this.innerHTML = html;
    // tlog(start, "setting html")
  }

  render(){
    let start = performance.now();

    const event = new Event("render");
    this.dispatchEvent(event);

    this.__render();
    return performance.now() - start;
  }

  addPoint(v) {
    let point = new Point3D(v);
    this.elements.push(point);
    return point;
  }

  addPath(a) {
    let path = new Path3D(a);
    this.elements.push(path);
    return path;
  }

  get rotation(){
    let rotation = this._rotation;
    if (this.parent3D) {
      rotation = this.parent3D.rotation;
    }
    return rotation;
  }

  get origin(){
    let og = new Vector;
    if (this.parent3D) {
      og = og.add(this.parent3D.origin);
    }
    return og;
  }

  get scale(){
    return this._scale;
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

    this._rotation = Quaternion.fromTo(new Vector(1), new Vector(1));
  }

  get rotation(){
    return this._rotation;
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
      bbox.add(g.bbox);
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
    let tv = 0.4;
    let th = -.05;

    this.rotate = (x = 0, y = 0) => {
      tv += y;
      th += x;
    }

    let updateRotation = () => {
      let hs = new Vector(1, 0, 0);
      let he = new Vector(cos(th), sin(th), 0)

      let vs = new Vector(0, 0, -1);
      let ve = new Vector(0, cos(tv), sin(tv));

      let q1 = Quaternion.fromTo(hs, he);
      let q2 = Quaternion.fromTo(vs, ve);
      let q3 = q2.product(q1);
      this._rotation = q3;
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
