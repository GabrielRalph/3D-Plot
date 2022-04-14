class PlusError{
  constructor(message, class_name = "Object"){
    this.msg = message;
    this.cls = class_name;
    let stack = new Error('helloworld');
    this.stack = stack.stack
  }

  _parse_stack(){
    let stack = this.stack
    let lines = stack.split('at ');
    let message = '';
    let con = 0;
    let tab = "";
    for (var i = 2; i < lines.length-1; i++){
      let conf = false;

      let clas = null;
      let lctn = null;
      let mthd = null;

      let line = lines[i];
      line = lines[i].replace(/\t|\n|\[.*\] |  +/g, '').replace(/ \((.*)\)/g, (a,b) =>{
        b = b.split('/');
        b = b[b.length - 1];
        b = b.split(':')

        lctn = `${b[0]} line ${b[1]}`;
        return ''
      })
      let parts = line.split(/ |\./g);

      if (parts.length === 3 && parts[1] == "get" || parts[1] == "set"){
        mthd = `${parts[1]}ting ${parts[2]} of ${parts[0]}\t (${lctn})`
      }else if(parts.length == 2){
        mthd = `whilst calling ${parts[1]} of ${parts[0]}\t (${lctn})`
      }
      if (parts[0] === 'new'){
        con++;
        conf = true;
        mthd = `whilst constructing new ${parts[1]}\t (${lctn})`
        clas = parts[1];
      }else if(parts[0] === 'Object'){
        clas = this.cls;
      }else{
        clas = parts[0];
      }
      if ((conf && con == 1)||(!conf)){
        message = mthd + '\n' + tab + message;
      }
      tab += '\t'
      // stack_data.push(this._stack_line_parser(line))
    }
    return 'Error\n' + message + tab + this.msg
  }

  toString(){
    return this._parse_stack()
  }
}

class SvgPlus{
  constructor(el){
    el = SvgPlus.parseElement(el);
    let prototype = Object.getPrototypeOf(this);
    SvgPlus.extend(el, prototype);
    return el;
  }

  saveSvg(name = 'default'){
    let output = this.outerHTML;

    // Remove excess white space
    output = output.replace(/ ( +)/g, '').replace(/^(\n)/gm, '')
    output = output.replace(/></g, '>\n<')

    //Autoindent
    output = output.split('\n');
    var depth = 0;
    var newOutput = ''
    for (var i = 0; i < output.length; i++){
      depth += (output[i].search(/<\/(g|svg)>/) == -1)?0:-1;
      for (var j = 0; j < depth; j++){
        newOutput += '\t'
      }
      newOutput += output[i] + '\n';
      depth += (output[i].search(/<(g|svg)(\s|\S)*?>/) == -1)?0:1;
    }

    window.localStorage.setItem('output', newOutput)

    var blob = new Blob([newOutput], {type: "text/plain"});
    var url = null;

    if (url == null){
      url = window.URL.createObjectURL(blob);

      var a = document.createElement('a')
      a.setAttribute('href', url)
      a.setAttribute('download', name + '.svg')
      document.body.prepend(a);
      a.click()
      a.remove();
    }
  }

  watch(config, callback){
    this._mutationObserver = new MutationObserver((mutation, observer) => {
      if (!(callback instanceof Function)){
        if (this.onmutation instanceof Function){
          this.onmutation(mutation, observer);
        }else{
          return;
        }
      }else{
        callback(mutation, observer);
      }
    })

    this._mutationObserver.observe(this, config);
  }

  stopWatch(){
    if (this._mutationObserver instanceof MutationObserver){
      this._mutationObserver.disconnect();
    }
  }

  set styles(styles){
    if (typeof styles !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof styles}`
      return
    }
    this._style_set = typeof this._style_set != 'object' ? {} : this._style_set;
    for (var style in styles){
      var value = `${styles[style]}`
      if (value != null){
        let set = true;
        try{
          this.style.setProperty(style, value);
        }catch(e){
          set = false;
          throw e
        }
        if (set){
          this._style_set[style] = value;
        }
      }
    }
  }

  get styles(){
    return this._style_set;
  }

  set class(val){
    this.props = {class: val}
  }

  get class(){
    return this.getAttribute('class');
  }

  set props (props){
    if (typeof props !== 'object'){
      throw `Error setting styles:\nstyles must be set using an object, not ${typeof props}`
      return
    }
    this._prop_set = typeof this._prop_set != 'object' ? {} : this._prop_set;
    for (var prop in props){
      var value = props[prop]
      if (prop == 'style' || prop == 'styles'){
        this.styles = value
      }else if (prop == "innerHTML" || prop == "content") {
        this.innerHTML = value;
      }else if (value != null){
        let set = true;
        try{
          this.setAttribute(prop,value);
        }catch(e){
          set = false;
          throw e
        }
        if (set){
          this._prop_set[prop] = value;
        }
      }
    }
  }

  get props(){
    return this._prop_set;
  }

  createChild(){
    return this.makeChild.apply(this, arguments)
  }

  makeChild(){
    let Name = arguments[0];
    let child;

    if (Name instanceof Function && Name.prototype instanceof SvgPlus){
      if (arguments.length > 1){
        child = new Name(arguments[1]);
      }else{
        child = new Name();
      }
    }else{
      child = new SvgPlus(Name);
      try{
        if (arguments[1]){
          child.props = arguments[1];
        }
      }catch(e){
        console.error(e);
      }
    }

    this.appendChild(child);
    return child;
  }

  /**
    Wave transistion

    @param update update(progress) function to be called on each animation frame
      update function will be passed a number from 0 to 1 which will be the
      ellapsed time mapped to a wave.

    @param dir
      true:  0 -> 1,
      false: 1 -> 0

    @param duration in milliseconds


  */
  async waveTransition(update, duration = 500, dir = false){
    if (!(update instanceof Function)) return 0;

    duration = parseInt(duration);
    if (Number.isNaN(duration)) return 0;

    return new Promise((resolve, reject) => {
      let t0;
      let end = false;

      let next = (t) => {
        let dt = t - t0;

        if (dt > duration) {
          end = true;
          dt = duration;
        }

        let theta = Math.PI * ( dt / duration  +  (dir ? 1 : 0) );
        let progress =  ( Math.cos(theta) + 1 ) / 2;

        update(progress);

        if (!end){
          window.requestAnimationFrame(next);
        }else{
          resolve(progress);
        }
      };
      window.requestAnimationFrame((t) => {
        t0 = t;
        window.requestAnimationFrame(next);
      })
    })
  }

  async animateAlgorithm(algorithm){

    if (!(algorithm.begin instanceof Function || aglorthim.start instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a begin/start function`);
    if (!(algorithm.next instanceof Function || aglorthim.draw instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a next/draw function`);
    if (!(algorithm.end instanceof Function)) throw '' + new PlusError(`Aglorithm's must contain a end function`);

    let start, next;
    let end = algorithm.end;

    if (aglorthim.begin instanceof Function){
      start = algorithm.begin;
    }else{
      start = algorithm.start;
    }

    if (algorithm.next instanceof Function){
      next = algorithm.next
    }else{
      next = algorithm.draw;
    }

    return new Promise((resolve, reject) => {

      start();
      let i = 0;
      let nextFrame = (t) => {
        if (next(t, i) === true){
          window.requestAnimationFrame(nextFrame);
        }else{
          resolve(end());
        }
        i++;
      }
      window.requestAnimationFrame(nextFrame);
    });
  }

  static make(name){
    if (` animate animateMotion animateTransform circle clipPath
      color-profile defs desc discard ellipse feBlend feColorMatrix
      feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting
      feDisplacementMap feDistantLight feDropShadow feFlood feFuncA
      feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode
      feMorphology feOffset fePointLight feSpecularLighting feSpotLight
      feTile feTurbulence filter foreignObject g hatch hatchpath image
      line linearGradient marker mask mesh meshgradient meshpatch meshrow
      metadata mpath path pattern polygon polyline radialGradient rect
      script set solidcolor stop style svg switch symbol text textPath
      title tspan unknown use view `.indexOf(` ${name} `) != -1){
      return document.createElementNS("http://www.w3.org/2000/svg", name);
    }else{
      return document.createElement(name);
    }
  }

  static parseElement(elem = null) {
    if (elem == null){
      throw `${new PlusError('null element given to parser')}`
    }
    if (typeof elem === 'string'){
      let _elem = null;
      if((/<.*?><.*?>/g).test(elem)){
        try{
          _elem = SvgPlus.parseSVGString(elem)
        }catch(e){
          throw e
        }
      }else{
        _elem = document.getElementById(elem);
      }

      if (_elem == null){
        _elem = SvgPlus.make(elem);
      }


      if (_elem == null){
        throw `${new PlusError(`Could not parse ${elem}.`)}`
        return null
      }else{
        try {
          _elem = this.parseElement(_elem);
        }catch(e){
          throw e
          return null
        }
        return _elem
      }
    }else if (elem instanceof Element){
      return elem
    }else{
      throw 'invalid element'
      return null
    }
  }

  static parseSVGString(string){
    let parser = new DOMParser()
    let doc = parser.parseFromString(string, "image/svg+xml");
    let errors = doc.getElementsByTagName('parsererror');
    if (errors && errors.length > 0){
      throw '' + new PlusError(`${errors[0]}`)
      return null
    }
    return doc.firstChild
  }

  static extend(elem, proto){
    let res = null
    if (proto != Object.prototype){
      let _proto = Object.getPrototypeOf(proto);
      res = SvgPlus.extend(elem, _proto);
    }else{
      res = null;
    }

    if (res == null) {
      return elem;
    }

    let keys = [];
    if (!SvgPlus.is(elem, proto.constructor)){
      keys = Object.getOwnPropertyNames(proto);
    }else {
      res = null;
    }
    if (res != null) {
      let build = false
      for (let key of keys) {
        var prop = Object.getOwnPropertyDescriptor(proto, key);
        if (key != 'constructor'){
          if (key == 'build'){
            Object.defineProperty(elem, 'plus_constructor', prop);
            build = true;
          }else{
            if (key in elem){
              try {
                elem[key] = proto[key];
              }catch (e){
                throw '' + new PlusError(`The class property ${key} was unable to be set\n${e}`);
              }
            }else{
              Object.defineProperty(elem, key, prop);
            }
          }
        }else{
          if ('__+' in elem){
            if (Array.isArray(elem['__+'])){
              elem['__+'].push(proto.constructor)
            }
          }else{
            elem['__+'] = [proto.constructor]
          }
        }
      }
      if(build){ elem.plus_constructor()}

    }
    return elem;
  }

  static is(element, classDef){
    if (element instanceof Element){
      if ('__+' in element && Array.isArray(element['__+'])){
        for (var instance of element['__+']){
          if (instance === classDef){
            return true;
          }
        }
      }

    }
    return false;
  }

  static defineHTMLElement(classDef, className){
    if (!className)
      className = classDef.name.replace(/(\w)([A-Z][^A-Z])/g, "$1-$2").toLowerCase();
    let props = Object.getOwnPropertyDescriptors(classDef.prototype);

    let setters = [];
    for (let propName in props) {
      let prop = props[propName]
      if ("set" in prop && prop.set instanceof Function) {
        setters.push(propName);
      }
    }
    let htmlClass = class extends HTMLElement{
      constructor(){
        super();
        if (!SvgPlus.is(this, classDef)) {
          new classDef(this);
        }
      }

      applyAttributes(){
        for (let setter of setters) {
          let value = this.getAttribute(setter);
          if (value != null) {
            this[setter] = value;
          }
        }
      }

      connectedCallback(){
        if (this.isConnected) {
          if (this.onconnect instanceof Function) {
            this.onconnect();
          }
        }
      }

      disconnectedCallback(){
        if (this.ondisconnect instanceof Function) {
          this.ondisconnect();
        }
      }

      adoptedCallback(){
        if (this.onadopt instanceof Function) {
          this.onadopt();
        }
      }

      attributeChangedCallback(name, oldv, newv){
        this[name] = newv;
      }

      static get observedAttributes() { return setters; }
    }
    // console.log(className+ " custom element defined");
    customElements.define(className, htmlClass);
  }
}

export {SvgPlus}
