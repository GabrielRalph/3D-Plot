function parseNumber(word) {
  let num = word;
  if (typeof num === "string") {
    num = parseFloat(word);
  }

  if (typeof num !== "number" || Number.isNaN(num)) {
    num = null;
  }
  return num;
}

class NumberArray extends Array {
  push(value){
    value = parseNumber(value);
    if (value != null) {
      super.push(value);
    }
    return this.length;
  }

  unshift(value){
    value = parseNumber(value);
    if (value != null) {
      super.unshift(value);
    }
    return this.length;
  }
}

function parseStringVector(value) {
  let words = value.split(/,\s*/g);
  let nums = new NumberArray();
  for (let word of words) {
    nums.push(word);
  }
  return nums;
}

const STANDARD_KEYS = [
  ["x", "y", "z", "w", "v", "u", "t", "s"],
  ["clientX", "clientY"]
]

function parseObjectVector(obj) {
  let nums = new NumberArray();
  if (obj instanceof Function) {
    nums = parseVector(obj());
  } else if (obj != null) {
    // search for the key scheme
    let n = STANDARD_KEYS.length;
    let ki;
    for (ki = 0; ki < n; ki ++) {
      if (STANDARD_KEYS[ki][0] in obj) break;
    }

    // add values
    if (ki < n) {
      let keys = STANDARD_KEYS[ki];
      for (let key of keys) {
        nums.push(obj[key])
      }
    } else {
      let i = 0;
      while (i in obj) {
        nums.push(obj[i]);
        i++;
      }
    }
  }
  return nums;
}

function parseVector(value) {
  if (value instanceof NumberArray) {
    return value;
  }

  let vector = new NumberArray();
  switch (typeof value) {
    case "string":
      vector = parseStringVector(value);
      break;
    case "number":
      vector.push(value);
      break;
    case "object":
      vector = parseObjectVector(value);
      break;
  }
  return vector;
}

function numberToString(value) {
  return Math.round(value*1e3)/1e3;
}

class Vector {
  constructor(input, n = null, keys = STANDARD_KEYS[0]) {
    input = parseVector(input);
    if (n == null) n = input.length;
    Object.defineProperty(this, "dimension", {
      get: () => n
    })

    let data = {};
    let addKey = (key, i = key) => {
      Object.defineProperty(this, key, {
        get: () => data[i],
        set: (v) => {
          v = parseNumber(v);
          if (v != null) {
            data[i] = v;
          }
        }
      })
    }

    for (let i of this.range) {
      let value = 0;
      if (i < input.length) {
        value = input[i];
      }

      data[i] = value;

      addKey(i);
      if (i < keys.length) {
        addKey(keys[i], i);
      }
    }
  }

  parse(value){
    if (value instanceof Vector && value.dimension == this.dimension) {
      return value;
    }

    return new Vector(value, this.dimension);
  }

  applyPeiceWiseWith(value, op) {
    let num = parseNumber(value);
    let get = (i) => num;
    if (typeof value !== "number") {
      value = this.parse(value);
      get = (i) => value[i];
    }

    let nv = [];
    if (op instanceof Function) {
      for (let i of this.range) {
        nv[i] = op(this[i], get(i));
      }
    }

    return this.parse(nv);
  }

  add(value){
    return this.applyPeiceWiseWith(value, (a, b) => a + b)
  }

  sub(value){
    return this.applyPeiceWiseWith(value, (a, b) => a - b)
  }

  mul(value){
    return this.applyPeiceWiseWith(value, (a, b) => a * b)
  }

  div(value) {
    return this.applyPeiceWiseWith(value, (a, b) => a / b)
  }

  normalize(){
    let norm = this.norm();
    for (let i of this.range) {
      this[i] /= norm;
    }
  }

  norm(){
    let sum = 0;
    for (let i of this.range){
      sum += this[i]*this[i];
    }
    return Math.sqrt(sum);
  }

  dir(){
    let norm = this.norm();
    return this.div(norm);
  }

  dot(value){
    value = this.parse(value);
    let sum = 0;
    for (let i of this.range) {
      sum += this[i]*value[i];
    }
    return sum;
  }

  dist(v) {
    v = this.parse(v);
    let delta = v.sub(this);
    return delta.norm();
  }

  get range(){
    let n = this.dimension;
    let itterable = {
      *[Symbol.iterator]() {
          for (let i = 0; i < n; i++) {
            yield i;
          }
      }
    }
    return itterable
  }

  toString(){
    let str = "";
    for (let i of this.range) {
      if (i != 0) {
        str += ", ";
      }
      str += numberToString(this[i]);
    }
    return str;
  }

  toJSON(){
    return this.toString();
  }
}



function cos(x) {
  return Math.cos(x);
}

function sin(x) {
  return Math.sin(x);
}

function sqrt(v){
  return Math.sqrt(v);
}

class Vector3D extends Vector{
  constructor(input) {
    super(input, 3);
  }

  rotateZ(theta) {
    theta = parseNumber(theta);
    if (theta == null) theta = 0;
    let x = this.x;
    let y = this.y;
    this.x = x * Math.cos(theta) - y * Math.sin(theta);
    this.y = x * Math.sin(theta) + y * Math.cos(theta);
    return this;
  }
  rotateY(theta) {
    theta = parseNumber(theta);
    if (theta == null) theta = 0;
    let x = this.x;
    let z = this.z;
    this.x = x * Math.cos(theta) + z * Math.sin(theta);
    this.z = -x * Math.sin(theta) + z * Math.cos(theta);
    return this;
  }
  rotateX(theta) {
    theta = parseNumber(theta);
    if (theta == null) theta = 0;
    let z = this.z;
    let y = this.y;
    console.log(y);
    this.y = y * Math.cos(theta) - z * Math.sin(theta);
    console.log(y);
    this.z = y * Math.sin(theta) + z * Math.cos(theta);
    return this;
  }

  cross(v) {
    v = this.parse(v);

    return this.parse([
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
    ])
  }

  rotate(r = "0, 0, 0") {
    if (!(r instanceof Rotation)) {
      let v = this.parse(r);
      r = new Rotation();
      r.fromAxisRotation(v);
    }

    return r.apply(this);
  }

  parse(value){
    if (value instanceof Vector3D) {
      return value;
    }

    return new Vector3D(value);
  }
}

function v3(v) {
  return new Vector3D(v);
}


class Plane {
  constructor(norm, tangent) {
    this.norm = norm;
    this.tangent = tangent;
  }

  get norm(){
    return this._norm;
  }
  get tangent(){
    return this._tangent;
  }

  set norm(v){
    this._norm = v3(v).dir();
  }
  set tangent(v){
    this._tangent = v3(v).dir();
  }

  projection(v) {
    v = v3(v);
    let x = v.dot(this.norm);
    let y = v.dot(this.tangent);
    return new Vector([x, y]);
  }

  rotate(v){
    if (v instanceof Rotation) {
      v.apply(this.norm);
      v.apply(this.tangent);
    } else {
      this.norm.rotate(v);
      this.tangent.rotate(v);
    }
  }
  // rotateY(v){
  //   this.norm.rotateY(v);
  //   this.tangent.rotateY(v);
  // }
  // rotateZ(v){
  //   this.norm.rotateZ(v);
  //   this.tangent.rotateZ(v);
  // }

  toString(){
    return `N${this.norm} T${this.tangent}`
  }
}

class Quaternion extends Vector {
  constructor(input) {
    super(input, 4, ["w", "x", "y", "z"]);
  }

  // https://www.xarg.org/proof/quaternion-from-two-vectors/
  fromTo(v1, v2) {
    v1 = v3(v1).dir();
    v2 = v3(v2).dir();

    let v1n = v1.norm();
    let v2n = v2.norm();

    let dot = v1.dot(v2);

    this.w = 1 + v1.dot(v2) / (v1n * v2n);

    let v = v1.cross(v2).div(v1n * v2n);
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    this.normalize()
  }

  static fromTo(v1, v2) {
    let q = new Quaternion();
    q.fromTo(v1, v2);
    return q;
  }

  mul(v){
    let q = this.parse(v);
    let p = this;
    let res = [];
    res[0] = p.w * q.w - p.x * q.x - p.y * q.y - p.z * q.z;
    res[1] = p.w * q.x + p.x * q.w + p.y * q.z - p.z * q.y;
    res[2] = p.w * q.y + p.y * q.w - p.x * q.z + p.z * q.x;
    res[3] = p.w * q.z + p.z * q.w + p.x * q.y - p.y * q.x;

    return this.parse(res);
  }

  parse(value){
    if (value instanceof Quaternion) {
      return value;
    }

    return new Quaternion(value);
  }
}

class Rotation{
  constructor(value){
    this[0] = [1, 0, 0];
    this[1] = [0, 1, 0];
    this[2] = [0, 0, 1];

    if (value instanceof Vector3D) {
      this.fromAxisRotation(value);
    } else if (value instanceof Quaternion) {
      this.fromQuaternion(value);
    } else if (value instanceof Rotation) {
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          this[i][j] = value[i][j]
    }
  }

  fromTo(v1, v2) {
    let q = new Quaternion();
    q.fromTo(v1, v2);
    this.fromQuaternion(q);
    return this;
  }

  fromQuaternion(q) {
    q = new Quaternion(q).dir();
    let w = q.w;
    let x = q.x;
    let y = q.y;
    let z = q.z;

    // https://cseweb.ucsd.edu/classes/wi18/cse169-a/slides/CSE169_03.pdf
    this[0] = [1 - 2*y*y - 2*z*z, 2*x*y - 2*z*w,     2*x*z + 2*y*w];
    this[1] = [2*x*y + 2*z*w,     1 - 2*x*x - 2*z*z, 2*y*z - 2*x*w];
    this[2] = [2*x*z - 2*y*w,     2*y*z + 2*x*w,     1 - 2*x*x - 2*y*y];

    return this;
  }

  static fromQuaternion(q) {
    let r = new Rotation();
    r.fromQuaternion(q);
    return r;
  }

  static fromTo(q) {
    let r = new Rotation();
    r.fromTo(q);
    return r;
  }

  fromAxisRotation(v) {
    v = v3(v);
    let a = v.x;
    let b = v.y;
    let g = v.z;

    this[0] = [];
    this[1] = [];
    this[2] = [];

    this[0][0] = cos(b)*cos(g);
    this[0][1] = sin(a)*sin(b)*cos(g) - cos(a)*sin(g);
    this[0][2] = cos(a)*sin(b)*cos(g) + sin(a)*sin(g);
    this[1][0] = cos(b)*sin(g);
    this[1][1] = sin(a)*sin(b)*sin(g) + cos(a)*cos(g);
    this[1][2] = cos(a)*sin(b)*sin(g) - sin(a)*cos(g);
    this[2][0] = -sin(b);
    this[2][1] = sin(a)*cos(b);
    this[2][2] = cos(a)*cos(b);
  }

  mul(r){
    let nv = [[],[],[]]
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


      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
          this[i][k] = nv[i][k];
        }
      }
    }
  }

  apply(v){
    let x = v.x;
    let y = v.y;
    let z = v.z;
    let r = this;

    let vx = x*r[0][0] + y*r[0][1] + z*r[0][2];
    let vy = x*r[1][0] + y*r[1][1] + z*r[1][2];
    let vz = x*r[2][0] + y*r[2][1] + z*r[2][2];

    return v3([vx, vy, vz]);
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

export {Vector, Vector3D, v3, Plane, Rotation, Quaternion}
