'use strict';
class TouchesControl {
	constructor(el, some = () => false) {
		this.active = [];
		this.touches = [];
		
		el.addEventListener('touchstart', e => {
			if(some(e)) return;
			
			if(e.touches.length > this.touches.length) this.touches.push(new TouchesControl.Touch(this.touches.length));
			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				if(this.active.includes(id)) continue;
				
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];
				
				tTouch.down = true;
				
				tTouch.fD = true;
				tTouch.fP = true;
				
				tTouch.bx = tTouch.x = Math.floor(eTouch.clientX*10000)/10000;
				tTouch.by = tTouch.y = Math.floor(eTouch.clientY*10000)/10000;
				
				this.active.push(id);
			};
		}, { passive: true });
		
		el.addEventListener('touchend', e => {
			if(some(e)) return;
			
			for(let k = 0; k < this.active.length; k++) {
				let c = false;
				for(let i = 0; i < e.touches.length; i++) {
					let id = e.touches[i].identifier;
					if(this.active[k] === id) { c = true; continue; };
				};
				if(c) continue;
				
				let tTouch = this.touches[this.active[k]];
				
				tTouch.fU = true;
				tTouch.fD = false;
				
				tTouch.down = false;
				tTouch.downTime = 0;
				
				this.active.splice(k, 1);
			};
		}, { passive: true });
		
		el.addEventListener('touchmove', e => {
			if(some(e)) return;
			
			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];
				
				let ev = vec2(eTouch.clientX, eTouch.clientY).floor(10000);
				
				if(tTouch && !tTouch.isSame(ev)) {
					tTouch.set(ev);
					
					tTouch.fM = true;
					tTouch.down = false;
					tTouch.downTime = 0;
					
					tTouch.sx = tTouch.x-tTouch.px;
					tTouch.sy = tTouch.y-tTouch.py;
					tTouch.px = tTouch.x;
					tTouch.py = tTouch.y;
				};
			};
		}, { passive: true });
	}
	
	isDown() {return this.touches.some(i => i.isDown());}
	isPress() {return this.touches.some(i => i.isPress());}
	isUp() {return this.touches.some(i => i.isUp());}
	isMove() {return this.touches.some(i => i.isMove());}
	isTimeDown(time) {return this.touches.some(i => i.isTimeDown(time));}
	
	findTouch(cb = () => true) { return this.touches.find(t => t.isPress() && cb(t)); }
	isStaticRectIntersect(pos, size) { return this.touches.some(i => i.isStaticRectIntersect(pos, size)); }
	onNull() { for(let i = 0; i < this.touches.length; i++) this.touches[i].onNull(); }
};

TouchesControl.Touch = class extends Vector2 {
	constructor(id) {
		super();
		this.id = id;
		
		this.x  = this.y  = 0; // position
		this.sx = this.sy = 0; // speed
		this.px = this.py = 0; // fixPrevPosition
		this.bx = this.by = 0; // fixStartPosition
		
		this.fD = !1;
		this.fP = !1;
		this.fU = !1;
		this.fM = !1;
		this.fC = !1;
		this.fdbC = !1;
		
		this.downTime = 0;
		this.down = false;
	}
	
	get speed() {return Math.sqrt(this.sx**2 + this.sy**2);}
	get dx() {return this.x-this.bx;}
	get dy() {return this.y-this.by;}
	get beeline() {return Math.sqrt(this.dx**2 + this.dy**2);}
	
	isDown() {return this.fD;}
	isPress() {return this.fP;}
	isUp() {return this.fU;}
	isMove() {return this.fM;}
	isTimeDown(time = 30) {
		if(this.down && this.downTime >= time) {
			this.down = false;
			this.downTime = 0;
			return true;
		};
		return false;
	}
	onNull() {
		this.fP = this.fU = this.fC = this.fM = this.fdbC = false;
		if(this.down) this.downTime++;
	}
};
