function codeFunction(code = '', useAPI = {}, file = 'code') {
	let proxyUseAPI = new Proxy(useAPI, {
		has: t => true,
		get: (target, key) => key === Symbol.unscopables ? undefined:target[key]
	});
	
	if(typeof code !== 'string') code = code.toString().replace(/^function.+?\{(.*)\}$/s, '$1');
	return function() { eval(`with(proxyUseAPI) {${code}}; //# sourceURL=${file}`); };
};


'use strict';
let random = (a, b) =>  Math.floor(Math.random()*(1+b-a)+a);
let setPropertyNotEnumerable = (o, id, value, inv = false) => Object.defineProperty(o, id, { value, writable: !inv, enumerable: inv, configurable: !inv });


class EventEmitter {
	constructor() {
		Object.defineProperty(this, '_events', {value: {}});
	}
	on(type, listener) {
		if(typeof listener === 'function') {
			if(!this._events[type]) {
				this._events[type] = [];
				Object.defineProperty(this._events[type], 'store', {value: {}});
				Object.defineProperty(this._events[type], 'once', {value: []});
				
				this._events[type].store.type = type;
				
				this._events[type].store.self = this;
				this._events[type].store.target = this;
				this._events[type].store.emitter = this;
			};
			this._events[type].push(listener);
			return this;
		};
		return Error('Invalid event listener passed');
	}
	once(type, listener) {
		let a = this.on(type, listener);
		this._events[type].once.push(1);
		return a;
	}
	off(type, listener) {
		if(!this._events[type]) return this;
		if(!listener) delete this._events[type];
		else {
			let l = this._events[type].indexOf(listener);
			if(~l) {
				this._events[type].splice(l, 1);
				if(this._events[type].once[l]) this._events[type].once.splice(l, 1);
			};
		};
		return this;
	}
	emit(type, ...args) {
		if(!this._events[type]) return false;
		for(let i = 0; i < this._events[type].length; i++) {
			this._events[type][i].apply(this._events[type].store, args);
			if(this._events[type].once[i]) {
				this._events[type].splice(i, 1);
				this._events[type].once.splice(i--, 1);
			};
		};
		return true;
	}
	toString() {return `[object ${this[Symbol.toStringTag]}]`;}
	[Symbol.toPrimitive](type) {return type === 'string'?`[object ${this[Symbol.toStringTag]}]`:true;}
}
setPropertyNotEnumerable(EventEmitter.prototype, Symbol.toStringTag, 'EventEmitter');


class Child extends EventEmitter {
	constructor() {
		super();
		this._parent = null;
		this._children = [];
	}
	appendChild(child) {
		if(child._parent) child._parent.removeChild(child);
		child._parent = this;
		this._children.push(child);
	}
	removeChild(child) {
		if(child instanceof Child) {
			let l = this._children.indexOf(child);
			if(~l) this._children.splice(l, 1)[0]._parent = null;
		};
	}
	getChildren() { return [...this._children]; };
	getChainParent() {
		let arr = [];
		let pr = this._parent;
		for(let i = 0; pr && i < 100; i++) {
			arr.push(pr);
			pr = pr._parent;
		};
		return arr;
	}
};
setPropertyNotEnumerable(Child.prototype, Symbol.toStringTag, 'Child');


class Scene {
	constructor(scene) { this.scene = new scene(); }
	init() { this.scene.init?.(); }
	updata(dt) { this.scene.updata?.(dt); }
	exit() { this.scene.exit?.(); }
	
	static active_scene = null;
	static set(name) {
		Scene.active_scene?.exit();
		Scene.active_scene = name;
		Scene.active_scene?.init();
	}
}
setPropertyNotEnumerable(Scene.prototype, Symbol.toStringTag, 'Scene');


class VectorN extends Array {
	constructor(...args) {
		super();
		let arr = VectorN.parseArgs(args);
		for(let i = 0; i < arr.length; i++) this[i] = arr[i];
	}
	get x()	 { return this[0]; }
	set x(v) { return this[0] = v; }
	get y()  { return this[1]; }
	set y(v) { return this[1] = v; }
	get z()  { return this[2]; }
	set z(v) { return this[2] = v; }
	get w()  { return this[3]; }
	set w(v) { return this[3] = v; }
	plus(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] += n||0, vecs); }
	minus(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] -= n||0, vecs); }
	inc(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] *= n||1, vecs); }
	div(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] /= n||1, vecs); }
	mod(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] %= n, vecs); }
	set(...vecs) { return VectorN.operation.call(this, (n, i) => this[i] = n, vecs); }
	abs() {
		for(let i = 0; i < this.length; i++) this[i] = Math.abs(this[i]);
		return this;
	}
	inverse(a = 1) {
		for(let i = 0; i < this.length; i++) this[i] = a/this[i];
		return this;
	}
	invert() {
		for(let i = 0; i < this.length; i++) this[i] = -this[i];
		return this;
	}
	floor(i = 1) {
		for(let i = 0; i < this.length; i++) this[i] = Math.floor(this[i]*i)/i;
		return this;
	}
	buf() { return new VectorN(this); }
	normalize(a = 1) {
		let l = this.module/a;
		for(let i = 0; i < this.length; i++) this[i] /= l;
		return this;
	}
	get moduleSq() {
		let x = 0;
		for(let i = 0; i < this.length; i++) x += this[i]**2;
		return x;
	}
	get module() { return Math.sqrt(this.moduleSq); }
	set module(v) { return this.normalize(v); }
	isSame(v) {
		if(this.length !== v.length) return false;
		for(let i = 0; i < this.length; i++) if(this[i] !== v[i]) return false;
		return true;
	}
	
	static parseArgs(args) {
		let arr = [];
		for(let i = 0; i < args.length; i++) {
			if(Array.isArray(args[i])) arr = arr.concat(args[i]);
			else arr.push(args[i]);
		};
		return arr;
	}
	static operation(operation, vecs) {
		let arr = vecs.length === 1 && 'number' === typeof vecs[0] ? vecs[0] : VectorN.parseArgs(vecs);
		let ownArg = 'number' === typeof arr;
		for(let i = 0; i < this.length && (ownArg || i < arr.length); i++) arr[i] !== null && operation(ownArg ? arr : arr[i], i);
		return this;
	}
}
let vecN = (...args) => new VectorN(...args);
setPropertyNotEnumerable(VectorN.prototype, 'add', VectorN.prototype.plus);
setPropertyNotEnumerable(VectorN.prototype, 'sub', VectorN.prototype.minus);
setPropertyNotEnumerable(VectorN.prototype, Symbol.toStringTag, 'VectorN');


class Vector2 {
	constructor(x, y) {
		this.x = +x||0;
		this.y = +y||y!==undefined?+y:+x||0;
	}
	plus(x, y) {
		this.x += x.x!==undefined?x.x:x||0;
		this.y += x.y!==undefined?x.y:y!==undefined?y:x||0;
		return this;
	}
	minus(x, y) {
		this.x -= x.x!==undefined?x.x:x||0;
		this.y -= x.y!==undefined?x.y:y!==undefined?y:x||0;
		return this;
	}
	inc(x, y) {
		this.x *= x.x!==undefined?x.x:x||0;
		this.y *= x.y!==undefined?x.y:y!==undefined?y:x||0;
		return this;
	}
	div(x, y) {
		this.x /= x.x!==undefined?x.x:x||0;
		this.y /= x.y!==undefined?x.y:y!==undefined?y:x||0;
		return this;
	}
	pow(x, y) {
		this.x = Math.pow(this.x, x.x!==undefined?x.x:x||0);
		this.y = Math.pow(this.y, x.y!==undefined?x.y:y!==undefined?y:x||0);
		return this;
	}
	mod(x, y) {
		if(x!==0) this.x %= (x.x!==undefined?x.x:x||0);
		if(y!==0) this.y %= (x.y!==undefined?x.y:y!==undefined?y:x||0);
		return this;
	}
	abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		return this;
	}
	invert() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}
	inverse(a = 1) {
		this.x = a/this.x;
		this.y = a/this.y;
	}
	floor(i = 1) {
		this.x = Math.floor(this.x*i)/i;
		this.y = Math.floor(this.y*i)/i;
		return this;
	}
	
	buf(x = 0, y = 0) {return new Vector2(this.x+(x.x||x), this.y+(x.y||y));}
	ot(x = 0, y = 0) {return new Vector2(this.x-(x.x||x), this.y-(x.y||y));}
	rotate(v) {return Math.atan2(v.y-this.y, v.x-this.x)}
	getDistance(v) {return Math.sqrt(Math.pow(v.x-this.x, 2)+Math.pow(v.y-this.y, 2));}
	
	set(x, y) {
		this.x = x.x!==undefined?x.x:x||0;
		this.y = x.y!==undefined?x.y:y!==undefined?y:x||0;
		return this;
	}
	move(x, y, a) { // a - angle; super
		this.x += x||0;
		this.y += y||0;
		return this;
	}
	moveAngle(mv = 0, a = 0) {
		this.x += mv*Math.cos(a);
		this.y += mv*Math.sin(a);
		return this;
	}
	moveTo(v, mv = 1, t = true) {
		let a = Math.atan2(v.y-this.y, v.x-this.x);
		let cos = Math.cos(a)*mv, sin = Math.sin(a)*mv;
		this.x += (t?(cos>Math.abs(v.x-this.x)?v.x-this.x: cos): cos);
		this.y += (t?(sin>Math.abs(v.y-this.y)?v.y-this.y: sin): sin);
		return this;
	}
	moveTime(v, t = 1) {
		this.x += (v.x-this.x)/(t!==0?t:1);
		this.y += (v.y-this.y)/(t!==0?t:1);
		return this;
	}
	isSame(v) {return this.x===v.x&&this.y===v.y;}
	
	isIntersect(a) {let d=0;for(let c=a.length-1, n=0; n<a.length; c=n++) a[n].y>this.y!=a[c].y>this.y&&this.x<(a[c].x-a[n].x)*(this.y-a[n].y)/(a[c].y-a[n].y)+a[n].x&&(d = !d);return d;}
	isStaticRectIntersect(b) {return this.x>b.pos.x&&this.x<b.pos.x+b.size.x*b.scale.x&&this.y>b.pos.y&&this.y<b.pos.y+b.size.y*b.scale.y;}
	
	set angle(a) {
		let cos = Math.cos(a), sin = Math.sin(a);
		let x = this.x*cos-this.y*sin;
		this.y = this.x*sin+this.y*cos;
		this.x = x;
	}
	get angle() {return Math.atan2(this.y, this.x);}
	get length() {return Math.sqrt(this.x*this.x+this.y*this.y);}
	get lengthSq() {return this.x*this.x+this.y*this.y;}
	
	dot(v) {return this.x*v.x+this.y*v.y;}
	cross(v) {return this.x*v.y-this.y*v.x;}
	normalize(a = 1) {
		let l = Math.sqrt(this.x*this.x+this.y*this.y)/a;
		this.x /= l;
		this.y /= l;
		return this;
	}
	
	toString() {return `Vector2(${this.x}, ${this.y})`;}
	[Symbol.toPrimitive](type) {return type === 'string'?`Vector2(${this.x}, ${this.y})`:true;}
}
let vec2 = (x, y) => new Vector2(x, y);
setPropertyNotEnumerable(Vector2.prototype, Symbol.toStringTag, 'Vector2');
setPropertyNotEnumerable(Vector2.prototype, 'add', Vector2.prototype.plus);
setPropertyNotEnumerable(Vector2.prototype, 'sub', Vector2.prototype.minus);
setPropertyNotEnumerable(Vector2, 'ZERO', Object.freeze(new Vector2()), true);


//======================================================================//
class CanvasEmitCamera {
	constructor(ctx) {
		this.camera = new Vector2();
		this.ctx = ctx;
	}
	get canvas() {return this.ctx.canvas;}
	get globalAlpha() {return this.ctx.globalAlpha;}
	set globalAlpha(v) {return this.ctx.globalAlpha=v;}
	get globalCompositeOperation() {return this.ctx.globalCompositeOperation;}
	set globalCompositeOperation(v) {return this.ctx.globalCompositeOperation=v;}
	get filter() {return this.ctx.filter;}
	set filter(v) {return this.ctx.filter=v;}
	get imageSmoothingEnabled() {return this.ctx.imageSmoothingEnabled;}
	set imageSmoothingEnabled(v) {return this.ctx.imageSmoothingEnabled=v;}
	get imageSmoothingQuality() {return this.ctx.imageSmoothingQuality;}
	set imageSmoothingQuality(v) {return this.ctx.imageSmoothingQuality=v;}
	get strokeStyle() {return this.ctx.strokeStyle;}
	set strokeStyle(v) {return this.ctx.strokeStyle=v;}
	get fillStyle() {return this.ctx.fillStyle;}
	set fillStyle(v) {return this.ctx.fillStyle=v;}
	get shadowOffsetX() {return this.ctx.shadowOffsetX;}
	set shadowOffsetX(v) {return this.ctx.shadowOffsetX=v;}
	get shadowOffsetY() {return this.ctx.shadowOffsetY;}
	set shadowOffsetY(v) {return this.ctx.shadowOffsetY=v;}
	get shadowBlur() {return this.ctx.shadowBlur;}
	set shadowBlur(v) {return this.ctx.shadowBlur=v;}
	get shadowColor() {return this.ctx.shadowColor;}
	set shadowColor(v) {return this.ctx.shadowColor=v;}
	get lineWidth() {return this.ctx.lineWidth;}
	set lineWidth(v) {return this.ctx.lineWidth=v;}
	get lineCap() {return this.ctx.lineCap;}
	set lineCap(v) {return this.ctx.lineCap=v;}
	get lineJoin() {return this.ctx.lineJoin;}
	set lineJoin(v) {return this.ctx.lineJoin=v;}
	get miterLimit() {return this.ctx.miterLimit;}
	set miterLimit(v) {return this.ctx.miterLimit=v;}
	get lineDashOffset() {return this.ctx.lineDashOffset;}
	set lineDashOffset(v) {return this.ctx.lineDashOffset=v;}
	get font() {return this.ctx.font;}
	set font(v) {return this.ctx.font=v;}
	get textAlign() {return this.ctx.textAlign;}
	set textAlign(v) {return this.ctx.textAlign=v;}
	get textBaseline() {return this.ctx.textBaseline;}
	set textBaseline(v) {return this.ctx.textBaseline=v;}
	get direction() {return ctx.direction;}
	set direction(v) {return ctx.direction=v;}
	save() {return this.ctx.save();}
	restore() {return this.ctx.restore();}
	scale(x, y) {return this.ctx.scale(
		x.x!==undefined?x.x:x||0,
		x.y!==undefined?x.y:y||0
	);}
	rotate(a) {return this.ctx.rotate(a);}
	translate(x, y) {return this.ctx.translate(
		(x.x!==undefined?x.x:(x||0))-this.camera.x,
		(x.y!==undefined?x.y:(y||0))-this.camera.y
	);}
	translateInv(x, y) {return this.ctx.translate(
		-((x.x!==undefined?x.x:(x||0))-this.camera.x),
		-((x.y!==undefined?x.y:(y||0))-this.camera.y)
	);}
	setTranslate(a, x, y) {
		this.ctx.translate((x.x!==undefined?x.x:x||0)-this.camera.x, (x.y!==undefined?x.y:y||0)-this.camera.y);
		this.ctx.rotate(a);
		this.ctx.translate(-((x.x!==undefined?x.x:x||0)-this.camera.x), -((x.y!==undefined?x.y:y||0)-this.camera.y))
	}
	transform(a, b, c, d, e, f) {return this.ctx.transform(a, b, c, d, e, f);}
	setTransform(v) {return this.ctx.setTransform(v);}
	getTransform() {return this.ctx.getTransform();}
	resetTransform() {return this.ctx.resetTransform();}
	createLinearGradient(x0, y0, x1, y1) {return this.ctx.createLinearGradient(
		(x0.x!==undefined?x0.x: x0||0) - this.camera.x,
		(x0.y!==undefined?x0.y: y0||0) - this.camera.y,
		(y0.x!==undefined?y0.x: x1.x!==undefined?x1.x: x0.y===undefined?x1: y0||0) - this.camera.x,
		(y0.y!==undefined?y0.y: x1.y!==undefined?x1.y: y1||x1||0) - this.camera.y
	);}
	createRadialGradient(x0, y0, r0, x1, y1, r1) {
		if(x0.x===undefined&&x1.x===undefined) return this.ctx.createRadialGradient(x0-this.camera.x, y0-this.camera.y, r0, x1-this.camera.x, y1-this.camera.y, r1);
		if(x0.x!==undefined&&x1.x!==undefined) return this.ctx.createRadialGradient(x0.x-this.camera.x, x0.y-this.camera.y, y0, r0.x-this.camera.x, r0.y-this.camera.y, x1);
		if(x0.x!==undefined&&x1.x===undefined) return this.ctx.createRadialGradient(x0.x-this.camera.x, x0.y-this.camera.y, y0, r0-this.camera.x, x1-this.camera.y, x2);
		if(x0.x===undefined&&x1.x!==undefined) return this.ctx.createRadialGradient(x0-this.camera.x, y0-this.camera.y, r0, x1.x-this.camera.x, x1.y-this.camera.y, y1);
	}
	createPattern(img, repeat) {return this.ctx.createPattern(img, repeat);}
	clearRect(x, y, w, h) {return this.ctx.clearRect(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(y.x!==undefined?y.x: w.x!==undefined?w.x: x.y===undefined?w: y||0),
		(y.y!==undefined?y.y: w.y!==undefined?w.y: h||w||0)
	);}
	fillRect(x, y, w, h) {return this.ctx.fillRect(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(y.x!==undefined?y.x: w.x!==undefined?w.x: x.y===undefined?w: y||0),
		(y.y!==undefined?y.y: w.y!==undefined?w.y: h||w||0)
	);}
	strokeRect(x, y, w, h) {return this.ctx.strokeRect(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(y.x!==undefined?y.x: w.x!==undefined?w.x: x.y===undefined?w: y||0),
		(y.y!==undefined?y.y: w.y!==undefined?w.y: h||w||0)
	);}
	beginPath() {return this.ctx.beginPath();}
	fill(path) {return path?this.ctx.fill(path):this.ctx.fill();}
	stroke(path) {return path?this.ctx.stroke(path):this.ctx.stroke();}
	drawFocusIfNeeded(path, el) {return this.ctx.drawFocusIfNeeded(path, el);}
	clip(path) {return path?this.ctx.clip(path):this.ctx.clip();}
	isPointInPath(path, x, y, rule) {return this.ctx.isPointInPath(path, x, y, rule);}
	isPointInStroke(path, x, y) {return this.ctx.isPointInStroke(path, x, y);}
	fillText(text, x, y, w) {return this.ctx.fillText(text,
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(x.x!==undefined?y:w)
	);}
	strokeText(text, x, y, w) {return this.ctx.strokeText(text,
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(x.x!==undefined?y:w)
	);}
	measureText(v) {return this.ctx.measureText(v);}
	drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
		if(dx!==undefined) return this.ctx.drawImage(img, sx, sy, sw, sh, dx-this.camera.x, dy-this.camera.y, dw, dh);
		else {return this.ctx.drawImage(img,
			(sx.x!==undefined?sx.x: sx||0) - this.camera.x,
			(sx.y!==undefined?sx.y: sy||0) - this.camera.y,
			(sy.x!==undefined?sy.x: sw.x!==undefined?sw.x: sx.y===undefined?sw: sy||0),
			(sy.y!==undefined?sy.y: sw.y!==undefined?sw.y: sh||sw||0)
		);};
	}
	getImageData(x, y, w, h) {return this.ctx.getImageData(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(y.x!==undefined?y.x: w.x!==undefined?w.x: x.y===undefined?w: y||0),
		(y.y!==undefined?y.y: w.y!==undefined?w.y: h||w||0)
	);}
	putImageData(img, x, y) {return this.ctx.putImageData(img,
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y
	);}
	createImageData(img, w, h) {return this.ctx.createImageData(img, w, h);}
	getContextAttributes() {return this.ctx.getContextAttributes();}
	setLineDash(v) {return this.ctx.setLineDash(v);}
	getLineDash() {return this.ctx.getLineDash();}
	closePath() {return this.ctx.closePath();}
	moveTo(x, y) {return this.ctx.moveTo(
		(x.x!==undefined?x.x:x||0) - this.camera.x,
		(x.y!==undefined?x.y:y||0) - this.camera.y
	);}
	lineTo(x, y) {return this.ctx.lineTo(
		(x.x!==undefined?x.x:x||0) - this.camera.x,
		(x.y!==undefined?x.y:y||0) - this.camera.y
	);}
	quadraticCurveTo(x1, y1, x, y) {return this.ctx.quadraticCurveTo(x1-this.camera.x, y1-this.camera.y, x-this.camera.x, y-this.camera.y);}
	bezierCurveTo(x1, y1, x2, y2, x, y) {return this.ctx.bezierCurveTo(x1-this.camera.x, y1-this.camera.y, x2-this.camera.x, y2-this.camera.y, x-this.camera.x, y-this.camera.y);}
	arcTo(x1, y1, x2, y2, r) {return this.ctx.arcTo(
		x1-this.camera.x, y1-this.camera.y,
		x2-this.camera.x, y2-this.camera.y, r
	);}
	rect(x, y, w, h) {return this.ctx.rect(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(y.x!==undefined?y.x: w.x!==undefined?w.x: x.y===undefined?w: y||0),
		(y.y!==undefined?y.y: w.y!==undefined?w.y: h||w||0)
	);}
	arc(x, y, r, n, m, t) {return this.ctx.arc(
		(x.x!==undefined?x.x: x||0) - this.camera.x,
		(x.y!==undefined?x.y: y||0) - this.camera.y,
		(x.x!==undefined?y:r), (x.x!==undefined?n:m),
		(x.x!==undefined?r:n), (x.x!==undefined?m:t)
	);}
	ellipse(x, y, w, h, n, m, t) {return this.ctx.ellipse(x-this.camera.x, y-this.camera.y, w, h, n, m, t);}


/*
	globalCompositeOperation = source-over
	
	source-over	//	источник-над
	This is the default setting and draws new shapes on top of the existing canvas content.
	Это по умолчанию и рисует новые фигуры поверх существующего содержимого холста.
	
	source-in	//	источник-в
	The new shape is drawn only where both the new shape and the destination canvas overlap.Everything else is made transparent.
	Новая фигура рисуется только там, где перекрываются как новая фигура, так и конечный холст остальное сделано прозрачным.
	
	source-out	//	источник-аут
	The new shape is drawn where it doesn 't overlap the existing canvas content.
	Новая форма рисуется там, где она не перекрывает существующее содержимое холста.
		
	source-atop	//	источник на вершине
	The new shape is only drawn where it overlaps the existing canvas content.
	Новая форма рисуется только там, где она перекрывает существующее содержимое холста.
	
	destination-over	//	назначения-более
	New shapes are drawn behind the existing canvas content.
	Новые формы нарисованы за существующим содержанием холста.
	
	destination-in	//	назначения в
	The existing canvas content is kept where both the new shape and existing canvas content overlap.Everything else is made transparent.
	Существующее содержимое холста сохраняется там, где пересекаются как новая форма, так и существующее содержимое холста остальное сделано прозрачным.
	
	destination-out		//	места назначения из
	The existing content is kept where it doesn 't overlap the new shape.
	Существующий контент хранится там, где он не перекрывает новую форму.
	
	destination-atop	//	назначения, на вершине
	The existing canvas is only kept where it overlaps the new shape.The new shape is drawn behind the canvas content.
	Существующий холст сохраняется только там, где он перекрывает новую форму.Новая форма рисуется за содержимым холста.
	
	lighter	//	более легкий
	Where both shapes overlap the color is determined by adding color values.
	Где обе фигуры перекрываются, цвет определяется путем добавления значений цвета.
	
	copy	//	копия
	Only the new shape is shown.
	Только новая форма отображается.
	
	xor		//	исключающее
	Shapes are made transparent where both overlap and drawn normal everywhere else.
	Фигуры сделаны прозрачными, где и перекрываются, и везде нарисованы нормально остальное.
	
	multiply	//	умножить
	The pixels are of the top layer are multiplied with the corresponding pixel of the bottom layer.A darker picture is the result.
	Пиксели верхнего слоя умножаются на соответствующий пиксель нижнего слоя.В результате получается более темное изображение.
	
	screen	//	экран
	The pixels are inverted, multiplied, and inverted again.A lighter picture is the result(opposite of multiply)
	Пиксели инвертируются, умножаются и снова инвертируются.В результате получается более светлая картинка(противоположно умножению)
	
	overlay	//	наложение
	A combination of multiply and screen.Dark parts on the base layer become darker, and light parts become lighter.
	Комбинация умножения и экрана.Темные части на базовом слое становятся темнее, а светлые части становятся светлее.
	
	darken	//	Омрачать
	Retains the darkest pixels of both layers.
	Сохраняет самые темные пиксели обоих слоев.
	
	lighten	//	светлее
	Retains the lightest pixels of both layers.
	Сохраняет самые светлые пиксели обоих слоев.
	
	color-dodge	//	цвет-додж
	Divides the bottom layer by the inverted top layer.
	Делит нижний слой на перевернутый верхний слой.
	
	color-burn	//	цветной огонь
	Divides the inverted bottom layer by the top layer, and then inverts the result.
	Делит инвертированный нижний слой на верхний, а затем инвертирует результат.
	
	hard-light	//	жесткий свет
	A combination of multiply and screen like overlay, but with top and bottom layer swapped.
	Комбинация умножения и экрана, как наложение, но с заменой верхнего и нижнего слоя.
	
	soft-light	//	мягкий свет
	A softer version of hard - light.Pure black or white does not result in pure black or white.
	Более мягкая версия с жестким освещением.Чистый черный или белый не приводит к чистому черному или белому.
	
	difference	//	разница
	Subtracts the bottom layer from the top layer or the other way round to always get a positive value.
	Вычитает нижний слой из верхнего слоя или наоборот, чтобы всегда получать положительное значение.
	
	exclusion	//	исключение
	Like difference, but with lower contrast.
	Как разница(difference), но с более низким контрастом.
	
	hue	//	оттенок
	Preserves the luma and chroma of the bottom layer, while adopting the hue of the top layer.
	Сохраняет яркость и цветность нижнего слоя, принимая оттенок верхнего слоя.
	
	saturation	//	насыщение
	Preserves the luma and hue of the bottom layer, while adopting the chroma of the top layer.
	Сохраняет яркость и оттенок нижнего слоя, принимая цветность верхнего слоя.
	
	color	//	цвет
	Preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.
	Сохраняет яркость нижнего слоя, при принятии оттенка и цветности верхнего слоя.
	
	luminosity	//	светимость
	Preserves the hue and chroma of the bottom layer, while adopting the luma of the top layer.
	Сохраняет оттенок и цветность нижнего слоя, принимая при этом яркость верхнего слоя.
	
	
	
	filter = none
	
	url()
	CSS < url > .Принимает IRI, указывающий на элемент фильтра SVG, который может быть встроен во внешний файл XML.
	
	blur()
	CSS < length > .Применяет размытие по Гауссу к рисунку.Он определяет значение стандартного отклонения для функции Гаусса, т.Е.Сколько пикселей на экране смешиваются друг с другом;
	таким образом, большее значение создаст больше размытия.Значение 0 оставляет вход без изменений.
	
	brightness()
	CSS < percentage > .Применяет к чертежу линейный множитель, делая его ярче или темнее.Значение ниже 100 % затемняет изображение, в то время как значение выше 100 % делает его ярче.Значение 0 % создает изображение полностью черного цвета, а значение 100 % оставляет входные данные без изменений.
	
	contrast()
	CSS < percentage > .Регулирует контраст рисунка.Значение 0 % создаст рисунок, который полностью черный.Значение 100 % оставляет рисунок без изменений.
	
	drop-shadow()
	Применяет эффект тени к рисунку.Тень - это размытая, смещенная версия альфа - маски рисунка, нарисованного конкретным цветом, составленная под рисунком.Эта функция принимает до пяти аргументов:
	<offset-x>: См. <length>Возможные единицы измерения. Определяет горизонтальное расстояние тени.
	<offset-y>: См. <length>Возможные единицы измерения. Определяет вертикальное расстояние тени.
	<blur-radius>: Чем больше это значение, тем больше размытие, поэтому тень становится больше и светлее. Отрицательные значения не допускаются.
	<color>: Смотрите <color>значения для возможных ключевых слов и обозначений.
	
	grayscale()
	CSS <percentage>. Преобразует рисунок в оттенки серого. Значение 100%полностью серого цвета. Значение 0%оставляет рисунок без изменений.
	
	hue-rotate()
	CSS <angle>. Применяет поворот оттенка на чертеже. Значение 0degоставляет вход без изменений.
	
	invert()
	CSS <percentage>. Инвертирует рисунок. Значение 100%означает полную инверсию. Значение 0%оставляет рисунок без изменений.
	
	opacity()
	CSS <percentage>. Применяет прозрачность к рисунку. Значение 0%средств полностью прозрачно. Значение 100%оставляет рисунок без изменений.
	
	saturate()
	CSS <percentage>. Насыщает рисунок. Значение 0%означает совершенно ненасыщенный. Значение 100%оставляет рисунок без изменений.
	
	sepia()
	CSS <percentage>. Преобразует рисунок в сепию. А стоимость 100%означает совершенно сепия. Значение 0%оставляет рисунок без изменений.
	
	none
	Фильтр не применяется. Начальное значение.
	
	
	
	imageSmoothingEnabled = true
	imageSmoothingQuality = low|medium|high
	lineCap = butt|round|square
	lineJoin = miter|bevel|round
	miterLimit = 10
	font = '10px sans-serif'
	textAlign = start|left|right|center|end
	textBaseline = alphabetic|top|hanging|middle|ideographic|bottom
*/
}
setPropertyNotEnumerable(CanvasEmitCamera.prototype, Symbol.toStringTag, 'CanvasEmitCamera');


class CanvasLeyar extends HTMLElement {
//	connectedCallback() {
//	attributeChangedCallback(name, oldValue, newValue) {
//	static get observedAttributes() { return ['c', 'l']; }
	constructor() {
		super();
		Object.defineProperty(this, '_events', {value: {}});
		
		let root = this.attachShadow({ mode: 'open' });
		let leyars = this.getAttribute('leyar')?.split(/\s+/).reverse()||['back', 'main'];
		
		this._pixelDensity = this.getAttribute('pixelDensity')||1;
		if(this._pixelDensity < 1) this.style.imageRendering = 'pixelated';
		
		let box = this.getBoundingClientRect();
		this._width = box.width;
		this._height = box.height;
		this.canvas = {};
		this.context = {};
		this.canvasEmitCamera = {};
		
		this.style.display = 'grid';
		this.style.alignItems = 'center';
		this.style.justifyItems = 'center';
		
		let tmp = document.createElement('template');
		let el = '';
		for(let i of leyars) el += `<canvas style="width:100%; height:100%; grid-area:1/1/1/1;" id="${i}"></canvas>`;
		el += `<div class="slot" style="width:100%; height:100%; z-index:10; overflow: auto; grid-area:1/1/1/1; align-self:${this.getAttribute('align-slot')||'center'}; justify-self:${this.getAttribute('justify-slot')||'center'};"><slot></slot></div>`;
		tmp.innerHTML = el;
		root.append(tmp.content.cloneNode(true));
		
		tmp.remove();
		tmp = null;
		
		for(let i of leyars) {
			this.canvas[i] = root.getElementById(i);
			this.context[i] = this.canvas[i].getContext('2d');
			this.canvasEmitCamera[i] = new CanvasEmitCamera(this.context[i]);
		};
		this.slotElement = root.querySelector('.slot');
		
		this._updata();
		window.addEventListener('resize', e => {
			this._updata();
			this.emit('resize', e);
		});
		
		this.db = {};
		let loadImage = (src, w, h) => new Promise(res => {
			let el = new Image(w, h);
			el.src = src;
			el.onload = e => res(el);
		});
		let loadAudio = src => new Promise(res => res(new Audio(src)));
	//	this.onloadfiles = null;
		this.loadFiles = function(arr, db = this.db) {
			let proms = [];
			for(let i = 0; i < arr.length; i++) {
				if(arr[i].type == 'image') proms.push(loadImage(arr[i].src||arr[i].path||arr[i].file, arr[i].w||arr[i].width, arr[i].h||arr[i].height));
				else if(arr[i].type == 'audio') proms.push(loadAudio(arr[i].src||arr[i].path||arr[i].file));
			};
			return Promise.all(proms).then(data => {
				for(let i = 0; i < arr.length; i++) db[arr[i].title||arr[i].name] = data[i];
			});
		};
	}
	
	set pixelDensity(v) {
		this._pixelDensity = v;
		if(this.style.imageRendering !== 'pixelated' && this._pixelDensity<1) this.style.imageRendering = 'pixelated';
		else if((this.style.imageRendering !== 'auto' || this.style.imageRendering !== '') && this._pixelDensity>=1) this.style.imageRendering = 'auto';
		this._updata();
		return this._pixelDensity = v;
	}
	get pixelDensity() {return this._pixelDensity;}
	set width(v) {
		v *= this._pixelDensity;
		this._width = v;
		for(let i in this.canvas) this.canvas[i].width = v;
		return this._width;
	}
	get width() {return this._width;}
	set height(v) {
		v *= this._pixelDensity;
		this._height = v;
		for(let i in this.canvas) this.canvas[i].height = v;
		return this._height;
	}
	get height() {return this._height;}
	
	get vw() {return this._width/100;}
	get vh() {return this._height/100;}
	get vwh() {return this._width/this._height;}
	get vhw() {return this._height/this._width;}
	get vmax() {return Math.max(this._width, this._height)/100;}
	get vmin() {return Math.min(this._width, this._height)/100;}
	get size() {return new Vector2(this._width, this._height);}
	
	_updata() {
		let b = this.getBoundingClientRect();
		this._width = b.width*this._pixelDensity;
		this._height = b.height*this._pixelDensity;
		for(let i in this.canvas) {
			this.canvas[i].width = this._width;
			this.canvas[i].height = this._height;
		};
	}
}
setPropertyNotEnumerable(CanvasLeyar.prototype, Symbol.toStringTag, 'CanvasLeyar');
for(let i of ['on', 'once', 'off', 'emit']) setPropertyNotEnumerable(CanvasLeyar.prototype, i, EventEmitter.prototype[i]);
customElements.define('canvas-leyar', CanvasLeyar);
//======================================================================//

class Color {
	constructor(r=0, g=0, b=0, a=0, type='rgb') {
		if(type=='rgb'&&type=='rgba') {
			this.r = Math.floor(loopNum(r, 0, 255));
			this.g = Math.floor(loopNum(g, 0, 255));
			this.b = Math.floor(loopNum(b, 0, 255));
			this.updataRgb();
		} else if(type=='hsl'&&type=='hsla') {
			this.h = Math.floor(loopNum(r, 0, 255));
			this.s = Math.floor(loopNum(g, 0, 255));
			this.l = Math.floor(loopNum(b, 0, 255));
			this.updataHsl();
		};
		this.a = a?Math.floor(loopNum(a*100, 0, 100))/100:0;
	}
	
	
	get rgba() {return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;}
	get rgb()  {return `rgb(${this.r}, ${this.g}, ${this.b})`;}
	get hsla() {return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a})`;}
	get hsl()  {return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;}
	
	set rgb(o) {
		this.r = loopNum(Math.floor(o.r||0), -1, 255);
		this.g = loopNum(Math.floor(o.g||0), -1, 255);
		this.b = loopNum(Math.floor(o.b||0), -1, 255);
		this.updataRgb();
		return `rgb(${this.r}, ${this.g}, ${this.b})`;
	}
	set rgba(o) {
		this.r = loopNum(Math.floor(o.r||0), -1, 255);
		this.g = loopNum(Math.floor(o.g||0), -1, 255);
		this.b = loopNum(Math.floor(o.b||0), -1, 255);
		this.updataRgb();
		this.a = o.a?Math.floor(loopNum(o.a*100, 0, 100))/100:0;
		return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}
	set hsl(o) {
		this.h = loopNum(Math.floor(o.h||0), -1, 360);
		this.s = loopNum(Math.floor(o.s||0), -1, 100);
		this.l = loopNum(Math.floor(o.l||0), -1, 100);
		this.updataHsl();
		return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
	}
	set hsla(o) {
		this.h = loopNum(Math.floor(o.h||0), -1, 360);
		this.s = loopNum(Math.floor(o.s||0), -1, 100);
		this.l = loopNum(Math.floor(o.l||0), -1, 100);
		this.updataHsl();
		this.a = o.a?Math.floor(loopNum(o.a*100, 0, 100))/100:0;
		return `hsla(${this.h}, ${this.s}%, ${this.l}%, ${this.a})`;
	}
	
	updataHsl() {
		let c = Color.hslToRgb(this.h, this.s, this.l);
		this.r = c.r;
		this.g = c.g;
		this.b = c.b;
	}
	updataRgb() {
		let c = Color.rgbToHsl(this.r, this.g, this.b);
		this.h = c.h;
		this.s = c.s;
		this.l = c.l;
	}
	
	random(rm, rn, gm, gn, bm, bn) {
		this.r = random(rn||0, rm>255?rm:255);
		this.g = random(gn||0, gm>255?gm:255);
		this.b = random(bn||0, bm>255?bm:255);
		this.updataRgb();
	}
	
	static parseHEX(color) {
		let u = {}, l = 0;
		if(color.indexOf('#')>-1) {
			l = color.length-1;
			u.c = color.split('').splice(1, l);
			u.r = parseInt([...c].splice(0, 2).join(''), 16);
			u.g = parseInt([...c].splice(2, 2).join(''), 16);
			u.b = parseInt([...c].splice(4, 2).join(''), 16);
			if(color.length>7) u.a = parseInt([...c].splice(6, 2).join(''), 16);
			else u.a = 255;
			u.text = function() {return 'rgba('+u.r+', '+u.g+', '+u.b+', '+u.a+')';};
		} return u;
	}
	static hslToRgb(h, s, l) {
		h/=360, s/=100, l/=100;
		let r, g, b;
		if(s == 0) r = g = b = l;
		else {
			let hue2rgb = function(p, q, t) {
				if(t < 0) t += 1;
				if(t > 1) t -= 1;
				if(t < 1/6) return p + (q - p) * 6 * t;
				if(t < 1/2) return q;
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}
	
			let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			let p = 2 * l - q; // q:0.75, p:0.25
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		} return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
	}
	static rgbToHsl(r, g, b) {
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min) h = s = 0;
		else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
		h = Math.round(h*60), s = Math.round(s*100), l = Math.round(l*100);
		} return {h, s, l};
	}
}