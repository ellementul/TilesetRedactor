"use strict";

//Craft object.protype
(function(){
	if( typeof(Object.crProp) == "function"){
		return;
	}
	
	
	function constProp(name_prop, value, vis, rewrite){
		
		if(value === undefined) value = true;
		if(vis === undefined) vis = true;

		if(typeof value === "object") Object.freeze(value);
		Object.defineProperty(this, name_prop, {
				value: value,
				enumerable: vis,
				configurable: rewrite,
				writable: rewrite,
			});
	}
	function getSet(name, getter, setter){
		if(typeof setter == "function"){
			Object.defineProperty(this, name, {
				get: getter,
				set: setter,
				enumerable: true,
				configurable: true
			});
		}else{
			Object.defineProperty(this, name, {
				get: getter,
				enumerable: true,
				configurable: true
			});
		}
	}
	
	constProp.call(Object.prototype, 'crProp', constProp, false);
	Object.prototype.crProp('addGetSet', getSet, false);
	
	
	function randIndex(){
		var rand = Math.round((this.length - 1) * Math.random());
		return this[rand];
	}
	
	function AddItem(val){
		if(!this._nulls) this._nulls = [];
		
		if(this._nulls.length){
			var ind = this._nulls.pop();
			this[ind] = val;
			return ind;
		}else{
			return this.push(val) - 1;
		}
	}
	
	function DellItem(ind){
		if(ind > this.length -1) return false;
		
		if(ind == this.length -1){
			this.pop();
		}else{
			if(!this._nulls) this._nulls = [];
			
			this[ind] = undefined;
			this._nulls.push(ind);
		}
		
		return true;	
	}
	
	function createArr(val, length, is_call){
		var arr = [];
		
		if(!length) length = 1;
		if(is_call === undefined) is_call = true;
		
		if(typeof val == 'function' && is_call){
			for(var i = 0; i < length; i++){
				arr.push(val(i, arr));
			}
		}else if(val !== undefined){
			
			for(var i = 0; i < length; i++){
				arr.push(val);
			}
		}

		arr.crProp('rand_i', randIndex);
		arr.crProp('add', AddItem);
		arr.crProp('dell', DellItem);
		
		return arr;
	}
	
	
	
	Array.crProp('create', createArr);
	
	
	if(RegExp.prototype.toJSON !== "function"){
		RegExp.prototype.toJSON = function(){ return this.source; };
	}

})();




