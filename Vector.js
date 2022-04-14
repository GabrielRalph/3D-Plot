function sqrt(v){
  return Math.sqrt(v)
}
function cos(x) {
  return Math.cos(x);
}
function sin(x) {
  return Math.sin(x);
}

function argumentParser(args, className) {
  let v = args[0];
  if (!(v instanceof className)) {
    //array
    if (v instanceof Array) {
      v = className.fromArray(v);

    //number
    } else if (typeof v === "number") {
      v = className.fromArray(args);

    // string
    } else if (typeof v === "string") {
      v = className.fromString(v);
    } else {
      v = new className;
    }
  }

  return v;
}

function argumentsIs(args, className) {
  for (let arg of args) {
    if (!(arg instanceof className)) {
      return false;
    }
  }
  return true;
}

class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  get x(){return this._x}
  get y(){return this._y}
  get z(){return this._z}

  set x(x){
    this._x = Vector.number(x);
  }
  set y(y){
    this._y = Vector.number(y);
  }
  set z(z){
    this._z = Vector.number(z);
  }

  //
  set() {
    let v = this.parser(arguments);
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
  }

  pwo(v, op) {
    return new Vector(op(this.x, v.x), op(this.y, v.y), op(this.z, v.z))
  }
  pws(v, op) {
    return op(this.x, v.x) + op(this.y, v.y) + op(this.z, v.z);
  }

  // peice wise operations
  add() {
    let v = this.parser(arguments);
    return this.pwo(v, (a, b) => a + b);
  }

  mul() {
    let a1 = arguments[0];
    if (a1 instanceof Rotation) {
      return a1.vecMul(this);
    } else {
      let v = this.parser(arguments);
      return this.pwo(v, (a, b) => a * b);
    }
  }

  div() {
    let v = this.parser(arguments);
    return this.pwo(v, (a, b) => a / b);
  }

  sub() {
    let v = this.parser(arguments);
    return this.pwo(v, (a, b) => a - b)
  }

  dot() {
    let v = this.parser(arguments);
    return this.pws(v, (a, b) => a * b)
  }

  // derived operations
  norm() {
    return sqrt(this.dot(this));
  }

  normalize() {
    this.set(this.unit());
  }

  unit() {
    return this.div(this.norm());
  }

  dist() {
    let v = this.parser(arguments);
    return v.sub(this).norm();
  }

  clone(){
    return this.mul(1);
  }

  // vector specific operations
  cross() {
    let v = this.parser(arguments);

    return new Vector(
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
    )
  }

  parser(args) {
    return argumentParser(args, Vector);
  }

  static parse() {
    return argumentParser(arguments, Vector);
  }

  static fromArray(a, i=0){
    let x = 0;
    let y = 0;
    let z = 0;
    let n = a.length - i;
    if (n > 0) {
      x = Vector.number(a[i]);
      y = x;
      z = x;
    }

    if (n > 1) {
      y = Vector.number(a[i+1])
      z = 0;
    }

    if (n > 2) {
      z = Vector.number(a[i + 2]);
    }

    return new Vector(x, y, z);
  }

  static fromString(str) {
    let words = str.split(/,\s*/g);
    let x = Vector.number(words[0])
    let y = Vector.number(words[1])
    let z = Vector.number(words[2])
    return new Vector(x, y, z);
  }

  static number(value) {
    if (typeof value === "string") {
      value = parseFloat(value);
    }

    if (typeof value !== "number") {
      value = NaN;
    }

    return value;
  }

  static is(){
    return argumentsIs(arguments, Vector);
  }
}

class Quaternion extends Vector {
  constructor(w = 0, x = 0, y = 0, z = 0) {
    super(x, y, z);
    this._w = w;
  }

  pwo(v, op) {
    return new Quaternion(op(this.w, v.w), op(this.x, v.x), op(this.y, v.y), op(this.z, v.z))
  }
  pws(v, op) {
    return op(this.w, v.w) + op(this.x, v.x) + op(this.y, v.y) + op(this.z, v.z);
  }

  set w(v){this._w = Vector.number(v)}
  get w(){return this._w;}

  set() {
    let v = this.parser(arguments);
    this.w = v.w;
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
  }

  // https://cseweb.ucsd.edu/classes/wi18/cse169-a/slides/CSE169_03.pdf
  product(){
    let q = this.parser(arguments);
    let p = this;

    let w = p.w * q.w - p.x * q.x - p.y * q.y - p.z * q.z;
    let x = p.w * q.x + p.x * q.w + p.y * q.z - p.z * q.y;
    let y = p.w * q.y + p.y * q.w - p.x * q.z + p.z * q.x;
    let z = p.w * q.z + p.z * q.w + p.x * q.y - p.y * q.x;

    return new Quaternion(w, x, y, z);
  }

  parser(args) {
    return argumentParser(args, Quaternion);
  }

  static parse() {
    return argumentParser(arguments, Quaternion);
  }

  static fromArray(a, i=0){
    let w = 0;
    let x = 0;
    let y = 0;
    let z = 0;

    let n = a.length - i;
    if (n > 0) {
      w = Vector.number(a[i]);
      x = w;
      y = w;
      z = w;
    }
    if (n > 1) {
      x = Vector.number(a[i+1])
      y = 0;
      z = 0;
    }

    if (n > 2) {
      y = Vector.number(a[i + 2]);
      z = 0;
    }

    if (n > 3) {
      z = Vector.number(a[i + 3]);
    }

    return new Quaternion(w, x, y, z);
  }

  static fromString(str) {
    let words = str.split(/,\s*/g);
    let w = Vector.number(words[0])
    let x = Vector.number(words[1])
    let y = Vector.number(words[2])
    let z = Vector.number(words[3])
    return new Quaternion(w, x, y, z);
  }

  static is(){
    return argumentsIs(arguments, Quaternion);
  }

  // https://www.xarg.org/proof/quaternion-from-two-vectors/
  static fromTo(v1, v2, normalize = true) {
    let q = null;
    if (Vector.is(v1, v2)) {
      let v1n = v1.norm();
      let v2n = v2.norm();
      if (normalize) {
        v1 = v1.div(v1n);
        v2 = v2.div(v2n);
        v1n = 1;
        v2n = 1;
      }
      // console.log(v1n, v2n);
      let dot = v1.dot(v2);
      let w = 1 + v1.dot(v2) / (v1n * v2n);
      let v = v1.cross(v2).div(v1n * v2n);
      q = new Quaternion(w, v.x, v.y, v.z);
    }else {
      q = new Quaternion
    }

    return q;
  }
}

class Rotation{
  constructor(value){
    if (value instanceof Array) {
      this[0] = value[0];
      this[1] = value[1];
      this[2] = value[2];
    } else {
      this[0] = [0,0,0];
      this[1] = [0,0,0];
      this[2] = [0,0,0];
    }
  }

  set(r){
    if (r instanceof Rotation) {
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          this[i][j] = r[i][j]
    }
  }

  fromTo(v1, v2) {
    let r = Rotation.fromTo(v1, v2);
    this.set(r);
  }

  fromQuaternion(q) {
    let r = Rotation.fromQuaternion(q);
    this.set(r);
  }

  static fromTo(v1, v2) {
    let q = Quaternion.fromTo(v1, v2);
    return Roation.fromQuaternion(q);
  }

  // https://cseweb.ucsd.edu/classes/wi18/cse169-a/slides/CSE169_03.pdf
  static fromQuaternion(q) {
    let res = null;
    if (Quaternion.is(q)) {
      q = q.unit();
      let w = q.w;
      let x = q.x;
      let y = q.y;
      let z = q.z;
      res = [
        [1 - 2*y*y - 2*z*z, 2*x*y - 2*z*w,     2*x*z + 2*y*w],
        [2*x*y + 2*z*w,     1 - 2*x*x - 2*z*z, 2*y*z - 2*x*w],
        [2*x*z - 2*y*w,     2*y*z + 2*x*w,     1 - 2*x*x - 2*y*y],
      ]
    }
    return new Rotation(res);
  }

  // wikipedia 3d euler rotation
  static fromAxisRotation() {
    let v = argumentParser(arguments, Vector);
    let a = v.x;
    let b = v.y;
    let g = v.z;

    let ca = cos(a);
    let sa = sin(a);
    let cb = cos(b);
    let sb = sin(b);
    let cg = cos(g);
    let sg = sin(g);

    let res = [
      [cb*cg, sa*sb*cg - ca*sg, ca*sb*cg + sa*sg],
      [cb*sg, sa*sb*sg + ca*cg, ca*sb*sg - sa*cg],
      [-sb,   a*cb,             ca*cb           ]
    ]
    return new Rotation(res);
  }

  mul(r){
    let nv = [[0, 0, 0],[0, 0, 0],[0, 0, 0]]
    if (r instanceof Rotation) {
      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
          let value = 0;
          for (let j = 0; j < 3; j++) {
            value += this[i][j] * r[j][k]
          }
          nv[i][k] = value;
        }
      }
    }
    return new Rotation(nv);
  }

  vecMul(v){
    if (v instanceof Vector) {
      let r = this;
      return new Vector(
        v.x*r[0][0] + v.y*r[0][1] + v.z*r[0][2],
        v.x*r[1][0] + v.y*r[1][1] + v.z*r[1][2],
        v.x*r[2][0] + v.y*r[2][1] + v.z*r[2][2]
      );
    } else {
      return new Vector;
    }
  }

  toString(){
    let str = "";
    for (let i = 0; i < 3; i++) {
      let line = "";
      for (let j = 0; j < 3; j++) {
        if (line.length > 0) line += " "
        line += numberToString(this[i][j]);
      }
      if (str.length > 0) str += "\n";
      str += line;
    }
    return str
  }
}

class BBox {
  constructor(firstValue){
    this._min = null;
    this._max = null;
    if (firstValue) {
      this.add(firstValue);
    }
  }

  get min(){
    return this._min.clone();
  }

  get max(){
    return this._max.clone();
  }

  get center(){
    return this._min.add(this._max).div(2)
  }

  add(){
    let value = arguments[0];
    if (value instanceof BBox) {
      this.addPoint(value._min);
      this.addPoint(value._max);
    } else {
      value = argumentParser(arguments, Vector);
      this.addPoint(value);
    }
  }

  addPoint(v){
    if (this._min == null) this._min = v.clone();
    if (this._max == null) this._max = v.clone();

    for (let i of ["x", "y", "z"]) {
      if (v[i] < this._min[i]) this._min[i] = v[i];
      if (v[i] > this._max[i]) this._max[i] = v[i];
    }
  }
}

function v3(){
  return argumentParser(arguments, Vector);
}

export {BBox, Vector, Quaternion, Rotation, v3, argumentParser}
