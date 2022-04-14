import {SvgPlus} from "./4.js"
import {} from "./svg-3d.js"
import {loadGrid} from "./data/gridMaker.js";
import {Vector, v3, Rotation, Quaternion} from "./Vector.js"

class DressGraph extends SvgPlus {
  constructor(el){
    super(el);
    this.loaded = false;
  }

  set file(value){
    this._file = value;
  }
  get file(){
    return this._file;
  }

  onconnect(){
    this.loadGrid(this.file);
  }

  set(){

  }
  get(){
    return false
  }

  async loadGrid(file){
    let plot = this.createChild("svg-3d");
    let grid = await loadGrid(file);

    let m = grid.length;
    let n = grid[0].length;

    let pointProps = (point) => {
      point.updateProps = (info, props) => {
        let zMin = info.totalBBox.min.z;
        let zMax = info.totalBBox.max.z;

        let r = 4 - 2*(info.z - zMin)/(zMax - zMin);
        props.rx = r;
        props.ry = r;
      }
    }

    let paths3D = plot.make3DGroup();
    let points3D = plot.make3DGroup();

    let G = [];
    for (let row of grid) {
      let nrow = [];
      for (let vector of row) {
        let point = points3D.addPoint(vector);
        pointProps(point);
        nrow.push(point);
      }
      G.push(nrow);
    }

    for (let i = 0; i < n; i++) {
      let path = [];
      for (let j = 0; j < m - 1; j++) {
        path.push(grid[j][i]);
      }
      let line = paths3D.addPath(path);
      line.props.class = "cord"
    }

    for (let j = 0; j < m - 1; j++) {
      let path = [];
      for (let i = 0; i < n; i++) {
        path.push(grid[j][i]);
      }
      let line = paths3D.addPath(path);
      line.props.class = "cord"
    }

    let bbox = plot.boundViewBox();
    plot.origin = bbox.center;

    plot.addRotationControlls();
    let time = plot.startRenderAnimation();

    window.onkeydown = (e) => {
      if (e.key == "ArrowUp") {
        plot.rotate(0, 0.1);
        e.preventDefault();
      }else if (e.key == "ArrowDown") {
        plot.rotate(0, -0.1);
        e.preventDefault();
      }else if (e.key == "ArrowRight") {
        plot.rotate(0.1, 0);
        e.preventDefault();
      }else if (e.key == "ArrowLeft") {
        plot.rotate(-0.1, 0);
        e.preventDefault();
      }
    }

    plot.onmousemove = (e) => {
      if (e.buttons == 1) {
        let dx = -e.movementX/200;
        let dy = -e.movementY/200;
        plot.rotate(dx, dy);
      }
    }

    this.set = (x, y, on) => {
      while (y < 0) y += m;
      while (x < 0) x += n;
      if (on) {
        G[y%m][x%n].props.class = "alive"
      } else {
        delete G[y%m][x%n].props.class;
      }
    }

    this.get = (x, y) => {
      while (y < 0) y += m;
      while (x < 0) x += n;
      return G[y%m][x%n].props.class == "alive"
    }

    this.rotate = plot.rotate;

    plot.addEventListener("render", () => {
      const event = new Event("render");
      this.dispatchEvent(event);
    })

    this.n = n;
    this.m = m;

    this.loaded = true;
    const event = new Event("load");
    this.dispatchEvent(event);
    if (this._ready instanceof Function)
      this._ready();
  }

  async ready(){
    if (!this.loaded) {
      return new Promise((resolve, reject) => {
        this._ready = resolve;
      });
    }
  }
}

SvgPlus.defineHTMLElement(DressGraph);
