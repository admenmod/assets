'use strict';
class TouchesController {
	constructor(el, filter = () => true) {
		this.active = [];
		this.touches = [];
		
		el.addEventListener('touchstart', e => {
			if(!filter(e)) return;
			
			if(e.touches.length > this.touches.length) this.touches.push(new TouchesController.Touch(this.touches.length));
			
			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				if(this.active.includes(id)) continue;
				
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];
				
				tTouch.down = true;
				
				tTouch.fD = true;
				tTouch.fP = true;
				
				tTouch.bx = tTouch.x = eTouch.clientX;
				tTouch.by = tTouch.y = eTouch.clientY;
				
				this.active.push(id);
			};
		}, { passive: true });
		
		el.addEventListener('touchend', e => {
			if(!filter(e)) return;
			
			for(let k = 0; k < this.active.length; k++) {
				let c = false;
				for(let i = 0; i < e.touches.length; i++) {
					if(this.active[k] === e.touches[i].identifier) c = true;
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
			if(!filter(e)) return;
			
			for(let i = 0; i < e.touches.length; i++) {
				let id = e.touches[i].identifier;
				let tTouch = this.touches[id];
				let eTouch = e.touches[i];
				
				if(tTouch && tTouch.x !== eTouch.clientX && tTouch.y !== eTouch.clientY) {
					tTouch.x = eTouch.clientX;
					tTouch.y = eTouch.clientY;
					
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
	
	isDown() { return this.touches.some(i => i.isDown()); }
	isPress() { return this.touches.some(i => i.isPress()); }
	isUp() { return this.touches.some(i => i.isUp()); }
	isMove() { return this.touches.some(i => i.isMove()); }
	isTimeDown(time) { return this.touches.some(i => i.isTimeDown(time)); }
	
	findTouch(cb = () => true) { return this.touches.find(t => t.isPress() && cb(t)); }
	isStaticRectIntersect(a) { return this.touches.some(i => i.isStaticRectIntersect(a)); }
	nullify() { for(let i = 0; i < this.touches.length; i++) this.touches[i].nullify(); }
};

TouchesController.Touch = class {
	constructor(id) {
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
	
	get speed() { return Math.sqrt(this.sx**2 + this.sy**2); }
	get dx() { return this.x-this.bx; }
	get dy() { return this.y-this.by; }
	get beeline() { return Math.sqrt(this.dx**2 + this.dy**2); }
	
	isDown() { return this.fD; }
	isPress() { return this.fP; }
	isUp() { return this.fU; }
	isMove() { return this.fM; }
	isTimeDown(time = 30) {
		if(this.down && this.downTime >= time) {
			this.down = false;
			this.downTime = 0;
			return true;
		};
		return false;
	}
	nullify() {
		this.fP = this.fU = this.fC = this.fM = this.fdbC = false;
		if(this.down) this.downTime++;
	}
};
