import {SvgPlus} from "../4.js"
import {Vector3D, v3} from "../Vector.js"

function min(){
  let min = null;
  for (let arg of arguments) {
    if (min === null || arg > min) {
      min = arg;
    }
  }
  return min;
}

async function getSplines(filename){
  let data = await fetch(filename);
  let text = await data.text();

  // extract svg text
  let start = text.match(/<svg [^>]*>/);
  let end = text.match(/<\/svg>/);
  if (start && end) {
    text = text.slice(start.index, end.index + end[0].length);
  }

  // Parse svg text
  let svg = SvgPlus.parseSVGString(text);
  let splineGroup = svg.getElementById("splines");

  // Parse splines and set z heights
  let splines = [];
  for (let spline of splineGroup.children) {
    if (spline.tagName == "path") {
      let name = spline.id;
      let z = 0;
      if (name[0] == "Z" || name[0] == "z") {
        z = parseFloat(name.slice(1));
      }
      spline.z = z;
      splines.push(spline);
    }
  }

  // Sort splines in accending z height
  splines.sort((a, b) => a.z > b.z ? 1 : -1);

  return splines;
}

function createSplineSegments(splines, n) {
  for (let spline of splines) {
    let segment = [];
    let length = spline.getTotalLength();

    // devide spline into n points
    for (let i = 0; i < n; i++) {
      let p = spline.getPointAtLength(length * i / n);
      p = v3(p); // parse 3d vector
      p.z = spline.z;    // set z height
      segment.push(p);
    }

    spline.segment = segment;
  }
}

function splineLurp(bottom, top, zIncGoal) {
  let B = bottom.segment;
  let T = top.segment;
  let zB = bottom.z;
  let zT = top.z;
  let n = min(T.length, B.length);

  let segments = [];

  // calculate the actual z delta in order to closely meet goals
  let zDelta = zT - zB; // 22 answer (1)
  let incs = Math.round(zDelta / zIncGoal); // 22/5 = 4.4 = 4
  let zInc = zDelta / incs;                 // 5.2
  if (n && n > 0 && incs > 0) {

    // for each z increment not the start and not the end
    for (let i = 0; i < incs; i++) {
      let lurp = ((i+1)*zInc)/zDelta;

      let segment = [];
      for (let i = 0; i < n; i++) {
        // equation of linear interpolation
        let p = T[i].mul(lurp).add(B[i].mul(1 - lurp));
        segment.push(p);
      }
      segments.push(segment);
    }
  }

  return segments;
}

function totalLurp(splines, m) {
  let zStart = splines[0].z;
  let zEnd = splines[splines.length - 1].z;
  let zInc = (zEnd - zStart) / (m);


  let B = null;
  let T = null;
  let i = 0;
  let n = 0;
  let next = () => {
    B = splines[i];
    T = splines[i + 1];
    n = min(B.segment.length, T.segment.length);
    i++;
  }
  next();


  let segments = [];
  for (let i = 0; i <= m; i++) {
    let z = zInc*i;

    // choose the right two segients
    while (z > T.z) {
      next();
    }

    let segment = [];
    let lurp = (z - B.z) / (T.z - B.z);
    for (let j = 0; j < n; j++) {
      let p = T.segment[j].mul(lurp).add(B.segment[j].mul(1 - lurp));
      segment.push(p);
    }
    segments.push(segment);
  }
  return segments;
}

function createGrid(splines, n, m) {
  createSplineSegments(splines, n);
  let G = totalLurp(splines, m);
  return G;
}

async function saveGrid(filename, n, m) {
  let splines = await getSplines(filename);
  let grid = createGrid(splines, n, m);

  let str = JSON.stringify(grid, null, " ");

  var blob = new Blob([str], {type: "text/plain"});
  let url = window.URL.createObjectURL(blob);

  var a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', "grid.json")
  document.body.prepend(a);
  a.click()
  a.remove();
}

async function loadGrid(filename) {
  let data = await fetch(filename);
  let jsonText = await data.text();
  let G = JSON.parse(jsonText, (key, value) => {
    if (typeof value === "string") {
      value = v3(value);
    }
    return value;
  })

  return G;
}

export {saveGrid, loadGrid}
