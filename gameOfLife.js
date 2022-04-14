class GameOfLife {
  constructor(n, m){
    this.oldLiving = [];

    // dummy grid
    let g = []
    for (let j = 0; j < m; j++) {
      let r = []
      for (let i = 0; i < n; i ++) r.push(0);
      g.push(r);
    }

    this.n = n;
    this.m = m;

    this.set = (x, y, value) => {
      g[y%m][x%n] = value;
    }
    this.get = (x, y) => {
      return g[y%m][x%n];
    }
  }

  neighbors(x, y){
    let n = this.n;
    let m = this.m;
    x = parseFloat(x);
    y = parseFloat(y);
    return [
      [(x + 1)%n, y], [(n + x - 1)%n, y],
      [x, (y + 1)%m], [x, (m + y - 1)%m],
      [(x + 1)%n, (y + 1)%m], [(x + 1)%n, (m + y - 1)%m],
      [(n + x - 1)%n, (y + 1)%m], [(n + x - 1)%n, (m + y - 1)%m],
    ]
  }

  deadNeighbors(x, y){
    let dn = [];
    let nb = this.neighbors(x, y);
    for (let [dx, dy] of nb) {
      if (this.get(dx, dy)) {
        dn.push([dx, dy])
      }
    }
    return dn;
  }

  livingNeighbors(x, y){
    let sum = 0;
    for (let [nx, ny] of this.neighbors(x, y)) {
      if (this.get(nx, ny)) {
        sum ++;
      }
    }
    return sum;
  }

  addLiving(x, y) {
    this.oldLiving.push([x, y]);
    this.set(x, y, true);
  }

  nextIterration(){
    let oldLiving = this.oldLiving;
    // console.log(oldLiving);
    let living = [];
    let dying = [];

    for (let [lx, ly] of oldLiving) {
      let ln = this.livingNeighbors(lx, ly);
      // console.log(ln);
      if (ln == 2 || ln == 3) {
        living.push([lx, ly]);
      } else {
        dying.push([lx, ly]);
      }
    }

    let visited = {};
    for (let [lx, ly] of oldLiving) {
      for (let [nx, ny] of this.neighbors(lx, ly)) {
        if (!this.get(nx, ny)) {
          if (!(nx in visited)) visited[nx] = {};
          visited[nx][ny] = true;
        }
      }
    }


    for (let nx in visited) {
      for (let ny in visited[nx]) {
        let ln = this.livingNeighbors(nx, ny);

        if (ln == 3 || Math.round(Math.random()*1000) == 19) {
          living.push([nx, ny]);
        }
      }
    }

    for (let [lx, ly] of living) {
      this.set(lx, ly, true);
    }

    for (let [dx, dy] of dying) {
      this.set(dx, dy, false);
    }

    this.oldLiving = living;
  }


  addGlider(x, y){
    this.addLiving(x, y);
    this.addLiving(x + 1, y);
    this.addLiving(x + 2, y);
    this.addLiving(x + 2, y + 1);
    this.addLiving(x + 1, y + 2);
  }
  addMW(x, y){
    this.addLiving(x, y);
    this.addLiving(x, y + 1);
    this.addLiving(x, y + 2);
    this.addLiving(x + 1, y + 3);
    this.addLiving(x + 1, y);
    this.addLiving(x + 2, y);
    this.addLiving(x + 3, y);
    this.addLiving(x + 4, y);
    this.addLiving(x + 5, y);
    this.addLiving(x + 6, y + 1);
    this.addLiving(x + 6, y + 4);
    this.addLiving(x + 7, y + 4);
    this.addLiving(x + 7, y + 7);
    this.addLiving(x + 5, y + 3);
  }
}

export {GameOfLife}
