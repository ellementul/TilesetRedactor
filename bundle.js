(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Lib = require("./drawLib.js");
var durability_types_list = require("./types_durability.json");


var durability_types_cont = Lib.getNode("DurabilityTypes");
var images_cont = Lib.getNode("Images");
var tile_size_cont = Lib.getNode("TileSize");

module.exports = function CrAddForm(){
	return {
			Images: new CrImages(images_cont),
			Type: new CrList(durability_types_cont, durability_types_list),
			Size: tile_size_cont,
			clear: function(){
				this.Images.clear();
			},

			getTile: newTile
	};
}

require("./mof.js");

function CrImages(container){
	var images = [];

	this.add = function(file){
		var reader = new FileReader();
		
		reader.onload = function(e){
			Add(e.target.result);
		};
		reader.readAsText(file);
	};

	this.addGetSet("value",
		function(){
			if(images.length > 0) return images;
		}
	);

	this.clear = function(){
		Array.from(container.children).forEach(elem => elem.remove());
		images = [];
	}

	function Add(img){
		images.push(img);
		container.appendChild(Lib.drawTile(img));
	}
}

function CrList(container, list){

	for (var val in list){
		var opt = document.createElement("p");
		opt.value = list[val];
		opt.innerHTML = val;
		opt.onclick = onclick;
		container.appendChild(opt);
	}
	var defOpt = container.children[0];
	container.value = defOpt.value;
	defOpt.classList.add("option-change");

	return container;

	function onclick(){
		Array.from(this.parentElement.children).forEach(elem => elem.classList.remove("option-change"));
		this.parentElement.value = this.value;
		console.log(this.value);
		this.classList.add("option-change");
	}
}

function newTile(send){
	if(this.Images.value 
		&& this.Type.value
		&& this.Size.value){
		return {
			images: this.Images.value,
			type: this.Type.value,
			size: parseInt(this.Size.value)
		};
	}

}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
},{"./drawLib.js":11,"./mof.js":13,"./types_durability.json":17}],2:[function(require,module,exports){
const Base64 = require('js-base64').Base64;

const CrViewLogic = require("./ViewLogic.js");

const Hear = require("./Events.js");

const CrAddForm = require("./AddForm.js");
const CrTool = require("./Tools.js");
const CrMap = require("./Map.js");






module.exports = function CrDisplay(Inter){
	var Send = Inter.connect(receive);

	var Tiles = new CrTiles();

	var AddForm = new CrAddForm();

	var TileMap = new CrMap();

	var Tool = new CrTool();


	var ViewLogic = new CrViewLogic(AddForm, Tool);

	Hear("AddForm", "submit", function(){
		var tile = AddForm.getTile();
		if(tile){
			Send({
				action: "Add",
				type: "Tile",
				tile: tile
			});
			ViewLogic.switchAddForm();
			AddForm.clear();
		}
	});

	

	function initMap(){

		Hear("Grid", "mousedown", function(e){
				this.is_down = true;
				if(e.target.parentElement.getAttribute("id") == "Grid")
					drawMap(e.target.x, e.target.y);
		});

		Hear("Grid", "mouseup", function(e){
			this.is_down = false;
		});

		Hear("Grid", "mouseover", function(e){
			if(this.is_down && e.target.parentElement.getAttribute("id") == "Grid"){
				drawMap(e.target.x, e.target.y);
			}
		});
	}

	function drawMap(x, y){
		if(typeof Tool.tile == "number")
			Send({
				action: "Draw",
				type: "Map",
				tool: Tool.type,
				coords: {x: x, y: y, z: 1},
				tile_id: Tool.tile
			});
	}


	//Receive------------------------------------------------------
	function receive(mess){
		switch(mess.type){
			case "Tile": receiveTiles(mess); break;
			case "Map": receiveMap(mess); break;
		}
	}

	function receiveTiles(mess){
		switch(mess.action){
			 case "Add":  Tiles.add(mess.tile); break;
		}
	}

	function receiveMap(mess){
		switch(mess.action){
			 case "Create":  {
			 	TileMap.load(mess); initMap(); break;
			 }
		}
	}
}
//Tiles--------------------------------------------------------
const Lib = require("./drawLib.js");

var tiles_cont = Lib.getNode("Tiles");

function CrTiles(container){

	this.add = function(new_tile){
		var tile = Lib.drawTile(new_tile.images[0]);
		tile.tile = new_tile;
		tiles_cont.appendChild(tile);
	}
}

//
},{"./AddForm.js":1,"./Events.js":3,"./Map.js":5,"./Tools.js":7,"./ViewLogic.js":9,"./drawLib.js":11,"js-base64":14}],3:[function(require,module,exports){

function IdEvent(id, name_event, func){
	
	if(name_event == "submit"){
		var old_func = func;
		func = function(e){
			e.preventDefault();
			old_func.apply(this, arguments);
		} 
	}
	
	if(Array.isArray(name_event)){
		name_event.forEach(name => getNode(id).addEventListener(name, func));
	}
	else getNode(id).addEventListener(name_event, func);
}

function Submit(func){
	return function(event){
		event.preventDefault();
		func.apply(this, arguments);
	}
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}

module.exports = IdEvent;

},{}],4:[function(require,module,exports){
require("./mof.js");

var map_size = {width: 20, height: 20, layers: 2};

function CrTiles(){
	var tiles = Array.create();

	this.add = function(new_tile){
		new_tile.id = tiles.add(new_tile);
		return new_tile;
	}
}

var Tiles = new CrTiles();

function CrMap(sizes){
	var cr_line = Array.create.bind(null, null, sizes.width);
	var cr_pline = Array.create.bind(null, cr_line, sizes.width, true);
	var map = Array.create(cr_pline, sizes.layers);

	this.load = function(){
		return {
			action: "Create",
			type: "Map",
			sizes: sizes
		}
	}

	this.draw = function(id_tile, coords, tool){
		if(coords
		&& map[coords.z]
		&& map[coords.z][coords.y]
		&& !map[coords.z][coords.y][coords.x]){

			map[coords.z][coords.y][coords.x] = id_tile;
			return coords;
		}
	}
}

var TileMap = new CrMap(map_size);

module.exports = function CrLogic(Inter){
	var send = Inter.connect(receive);
	send(TileMap.load());

	function receive(mess){
		switch(mess.type){
			case "Tile": receiveTiles(mess); break;
			case "Map": receiveMap(mess); break;
		}
	}

	function receiveTiles(mess){
		switch(mess.action){
			case "Add":  {
				mess.tile = Tiles.add(mess.tile);
				send(mess);
				
			} break;
		}
	}

	function receiveMap(mess){
		switch(mess.action){
			 case "Draw":  {
			 	mess.coords = TileMap.draw(mess.id_tile, mess.coords, mess.tool);
			 	send(mess);
			 }
		}
	}
}

},{"./mof.js":13}],5:[function(require,module,exports){
const Lib = require("./drawLib.js");

var map_size = 20;
var map_cont = Lib.getNode("Map");

module.exports = function CrMap(){

	this.load = function(mess){
		var Grid = CrLayer(mess.sizes, "grid-border");
		Grid.setAttribute("id", "Grid");

		while(mess.sizes.layers--)
			map_cont.appendChild(CrLayer(Object.assign({}, mess.sizes)));

		map_cont.appendChild(Grid);
	}
	
}

function CrLayer(sizes, border){
	var layer = document.createElement("div");
	layer.style.width = "100%";
	layer.style.height = "100%";
	drawGrid(layer, sizes, border);

	this.show = function(){
		layer.style.opacity = 0;
	}

	this.hide = function(){
		layer.style.opacity = 1;
	}

	return layer;
}


function drawGrid(container, grid_size, border){
	var w_size = 100 / grid_size.width;
	var h_size = 100 / grid_size.height;
	for(var i = grid_size.width - 1; i >= 0; i--){
		for(var j = grid_size.height - 1; j >= 0; j--){
			var box = darwBox(i, j, w_size, h_size, border);
			
			container.appendChild(box);
		}
	}
}

function darwBox(x, y, w_size, h_size, border){
	var box = document.createElement('div');
	box.classList.add("box");
	if(border) 
		box.classList.add(border);

	box.style.width = w_size + "%";
	box.style.height = h_size + "%";
	
	box.style.left = x*w_size + "%";
	box.style.top = y*h_size + "%";

	box.x = x;
	box.y = y;
	
	return box;
}
},{"./drawLib.js":11}],6:[function(require,module,exports){
function CrSwitch(name_class, ids){
	if(Array.isArray(ids)){
		var elems = ids.map(getNode);
		elems = elems.map(elem => elem.classList);

		return arrSwicth.bind(null, elems, name_class);
	}
	else if(typeof ids == "object"){
		return objSwitch(ids, name_class);
	}
	else{
		var elem = getNode(ids).classList;
		return oneSwitch.bind(null, name_class, elem);
	}
	
}

function objSwitch(id_obj, class_name){
	for (var key in id_obj){
		id_obj[key] = getNode(id_obj[key]).classList;
	}

	return function(id){
		for (var i in id_obj){
			id_obj[i].add(class_name);
		}
		
		id_obj[id].remove(class_name);
	}
}

function arrSwicth(elem_arr, name_class){
	elem_arr.forEach(oneSwitch.bind(null, name_class));
}

function oneSwitch(name_class, elem){
		elem.toggle(name_class);
}

module.exports = CrSwitch;

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
},{}],7:[function(require,module,exports){
require("./mof.js");
const Lib = require("./drawLib.js");


var tools_cont = Lib.getNode("Tools");

module.exports = function CrTools(){
	var pallet = {};
	var type = "Pen";

	this.addGetSet("tile", 
		function(){
			if(pallet[type]) return pallet[type].id;
		},
		function(val){
			pallet[type] = val;

			changeTileView(val.images[0]);
		}
	);

	this.addGetSet("type", 
		function(){
			return type;
		},
		function(val){
			type = val;
		}
	);

	var tileView = Lib.drawTile();
	tools_cont.appendChild(tileView);

	function changeTileView(image){
		tileView.remove();
		tileView = Lib.drawTile(image);
		tools_cont.appendChild(tileView);
	}
}
},{"./drawLib.js":11,"./mof.js":13}],8:[function(require,module,exports){
require("typesjs");
require("typesjs/str_type");

var types_durability = require("./types_durability.json");

var T = Object.types;

var tile_id_type = T.pos(256);
var coords_type = {x: T.pos(20), y: T.pos(20), z: T.pos(2)};

var tile_type = T.obj({
		id: T.any(undefined, tile_id_type),
		images: T.arr(T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024)),
		type: T.any(Object.values(types_durability)),
		size: T.pos(20)
});

var new_tile_mess_type = T.obj({
	action: "Add",
	type: "Tile",
	tile: tile_type
});

var map_size_type = T.obj({
	width: 20, 
	height: 20, 
	layers: 2
});

var new_map_mess_type = T.obj({
	action: "Create",
	type: "Map",
	sizes: map_size_type
});

var draw_mess_type = {
	action: "Draw",
	type: "Map",
	tool: "Pen",
	coords: coords_type,
	tile_id: tile_id_type
};

var draw_mess_type_with_empty_coords = {
	action: "Draw",
	type: "Map",
	tool: "Pen",
	coords: T.any(undefined, coords_type),
	tile_id: tile_id_type
};

var mess_types_one = T.any(draw_mess_type, new_tile_mess_type);

var mess_types_two = T.any([
	draw_mess_type_with_empty_coords,
	new_tile_mess_type, 
	new_map_mess_type]);

module.exports = [
	function(val){
		if(mess_types_one.test(val))
			throw mess_types_one.test(val);
	}, 
	function(val){
		if(mess_types_two.test(val))
			throw mess_types_two.test(val);
	}];

},{"./types_durability.json":17,"typesjs":16,"typesjs/str_type":15}],9:[function(require,module,exports){
const Hear = require("./Events.js");
const CrSwitchElem = require("./Switch.js");

module.exports = function(Form, Tool){

	this.switchAddForm = CrSwitchElem("invis", "AddForm");

	Hear("add_switch", "click", this.switchAddForm);

	Hear("AddImageInput", "change", function(){
		if(this.files[0])
			Form.Images.add(this.files[0]);
	});

	Hear("Tiles", "click", function(e){
		if(e.target.tile){
			Tool.tile = e.target.tile;
			e.target.classList.add("press");
			setTimeout(()=>e.target.classList.remove("press"), 300)
		}
	});

};
},{"./Events.js":3,"./Switch.js":6}],10:[function(require,module,exports){


const CrInter = require("./inter.js");
var Types = require("./Types.js");

const Display = require("./Display.js");
const CrLogic = require("./Logic.js");

const DisplayInter = new CrInter();
DisplayInter.test(Types, console.log);

Display(DisplayInter);

CrLogic(DisplayInter);





},{"./Display.js":2,"./Logic.js":4,"./Types.js":8,"./inter.js":12}],11:[function(require,module,exports){
exports.drawTile = function(svg_img){
	
	var img = document.createElement('img');
	img.src = "data:image/svg+xml;base64,"+ Base64.encode(svg_img);

	img.classList.add("tile");
	
	return img;
}

exports.getNode = function(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
},{}],12:[function(require,module,exports){
module.exports = function CrInterfice(testes, log){
	var is_test = false;
	
	this.test = function(new_testes, new_log){
		if(new_testes){
			if(typeof(new_testes[0]) == "function" 
			&& typeof(new_testes[1]) == "function"){
				
				testes = new_testes;
				is_test = true;
				
			}else{
				console.error(new Error("Test is not function!"));
				is_test = false;
			}
		}
		if(new_log){
			if(typeof new_log == "function") log = new_log; else log = null;
		}
	}
	
	if(testes) this.test(testes, log);
	
	var InputOne = null;
	var OutputOne = null;
	
	this.connect = function(outputFunc){
		if(OutputOne){
			if(is_test){
				var begFunc = outputFunc;
				outputFunc = function(val){
					testes[0](val);
					if(log) log(" One: ", val);
					begFunc(val);
				}
			}
			return TwoConnect(outputFunc);
		}
		else{
			if(is_test){
				var begFunc = outputFunc;
				outputFunc = function(val){
					testes[1](val);
					if(log) log(" Two: ", val);
					begFunc(val);
				}
			}
			return OneConnect(outputFunc);
		}
	};
	
	function OneConnect(outputFunc){
		OutputOne = outputFunc;
		InputOne = CrHoarder();
		
		return function(val){
			InputOne(val);
		}
	}
	
	function TwoConnect(outputFunc){
		if(InputOne.take) InputOne.take(outputFunc);
		InputOne = outputFunc;
		
		return OutputOne;
	}
}

function CrHoarder(){
	var hoarder = [];
	
	var push = function(val){
		hoarder.push(val);
	};
	
	push.take = function(func){
		if(typeof func != "function") return hoarder;
		
		hoarder.forEach(function(val){
				func(val);
		});
	}
	
	return push;
}
},{}],13:[function(require,module,exports){
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





},{}],14:[function(require,module,exports){
(function (global){
/*
 *  base64.js
 *
 *  Licensed under the BSD 3-Clause License.
 *    http://opensource.org/licenses/BSD-3-Clause
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */
;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory(global)
        : typeof define === 'function' && define.amd
        ? define(factory) : factory(global)
}((
    typeof self !== 'undefined' ? self
        : typeof window !== 'undefined' ? window
        : typeof global !== 'undefined' ? global
: this
), function(global) {
    'use strict';
    // existing version for noConflict()
    global = global || {};
    var _Base64 = global.Base64;
    var version = "2.5.1";
    // if node.js and NOT React Native, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            buffer = eval("require('buffer').Buffer");
        } catch (err) {
            buffer = undefined;
        }
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer ?
        buffer.from && Uint8Array && buffer.from !== Uint8Array.from
        ? function (u) {
            return (u.constructor === buffer.constructor ? u : buffer.from(u))
                .toString('base64')
        }
        :  function (u) {
            return (u.constructor === buffer.constructor ? u : new  buffer(u))
                .toString('base64')
        }
        : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe
            ? _encode(String(u))
            : _encode(String(u)).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var _atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/\S{1,4}/g, cb_decode);
    };
    var atob = function(a) {
        return _atob(String(a).replace(/[^A-Za-z0-9\+\/]/g, ''));
    };
    var _decode = buffer ?
        buffer.from && Uint8Array && buffer.from !== Uint8Array.from
        ? function(a) {
            return (a.constructor === buffer.constructor
                    ? a : buffer.from(a, 'base64')).toString();
        }
        : function(a) {
            return (a.constructor === buffer.constructor
                    ? a : new buffer(a, 'base64')).toString();
        }
        : function(a) { return btou(_atob(a)) };
    var decode = function(a){
        return _decode(
            String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict,
        __buffer__: buffer
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    //
    // export Base64 to the namespace
    //
    if (global['Meteor']) { // Meteor.js
        Base64 = global.Base64;
    }
    // module.exports and AMD are mutually exclusive.
    // module.exports has precedence.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.Base64 = global.Base64;
    }
    else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function(){ return global.Base64 });
    }
    // that's it!
    return {Base64: global.Base64}
}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],15:[function(require,module,exports){
//Craf String
(function(){
	if(typeof(Object.types) !== "object") return;

	var T = Object.types;
	var Doc = T.doc;

	function replaceSpecChar(c){
		switch(c){
			case 'w': return 'a-zA-Z0-9_';
			case 'd': return '0-9';
			case 's': return '\\t\\n\\v\\f\\r ';

			default: return c;
		}
	}

	function rangeInArr(beg, end){
		if(beg > end){
			var tmp = beg;
			beg = end;
			end = tmp;
		}

		var arr = [];
		for(var i = beg; i <= end; i++){
			arr.push(i);
		}

		return arr;
	}

	function parseRange(parse_str){
		if(/\\./.test(parse_str)){
				parse_str = parse_str.replace(/\\(.)/g, function(str, char){ return replaceSpecChar(char);});
		}

		var result = [];

		var beg_char = parse_str[0];
		for(var i = 1; i <= parse_str.length; i++){

			if(parse_str[i-1] !== '\\'
				&&parse_str[i] === '-'
				&&parse_str[i+1]){
				i++;
				var end_char = parse_str[i];

				var arr_chars = rangeInArr(beg_char.charCodeAt(0), end_char.charCodeAt(0));
				result = result.concat(arr_chars);

				i++;
			}else{
				result.push(beg_char.charCodeAt(0));
			}

			beg_char = parse_str[i];
		}
		return result;
	}

	function randIndex(arr){
		var rand = Math.round((arr.length - 1) * Math.random());
		return arr[rand];
	}

	function randChars(chars_arr, size){
		size = T.int(size, 1).rand();
		var str = '';
		while(size){
			var der = randIndex(chars_arr);
			str +=String.fromCharCode(der);
			size--;
		}
		return str;
	}

	function randStr(range, size){

		var parse_range = (range.source).match(/\^\[((\\\]|.)*)\]\*\$/);

		if(!parse_range) throw T.error(arguments, 'Wait arguments: range(RegExp(/^[\w].$/)), size(0<=number)');

		var chars = parseRange(parse_range[1]);

		return randChars.bind(null, chars, size);


	}

	function testStr(range, size){
		return function(str){
			if(typeof(str) !== 'string'){
				var err = this.doc();
				err.params = "Value is not string!";
				return err;
			}

			if(str.length > size){
				var err = this.doc();
				err.params = "Length string is wrong!";
				return err;
			}

			if(!range.test(str)){
				return this.doc();
			}

			return  false;
		}
	}

	function docStr(range, size){
		return T.doc.gen.bind(null, "str", { range: range, length: size});
	}


	var def_size = 17;
	var def_range = /^[\w]*$/;

	function newStr(range, size){
		if(range === null) range = def_range;
		if(size === undefined) size = def_size;

		if(typeof range == "string") range = new RegExp(range);


		if(T.pos.test(size) || !(range instanceof RegExp)){
				throw T.error(arguments, 'Wait arguments: range(RegExp), size(0<=number)');
		}

		return {
			rand: randStr(range, size),
			test: testStr(range, size),
			doc: docStr(range, size)
		};
	}



	T.newType('str',
	{
		name: "String",
		arg: ["range", "length"],
		params: {
				range: {type: 'RegExp || str', default_value: def_range},
				length: {type: 'pos', default_value: def_size}
		}
	},
	{
		New: newStr,
		test: testStr(def_range, def_size),
		rand: randStr(def_range, def_size),
		doc: docStr(def_range, def_size)
	});
})();

},{}],16:[function(require,module,exports){
'use strict';
new (function(){

	if(typeof(Object.types) == "object"){
		return Object.types;
	}

	if(RegExp.prototype.toJSON !== "function"){
		RegExp.prototype.toJSON = function(){ return this.source; };
	}

	var T = this;
	var Doc = {
		types:{
			'bool':{
				name: "Boolean",
				arg: []
			},
			'const': {
				name: "Constant",
				arg: ["value"],
				params: { value: {type: "Something", default_value: null}}
			},
			'pos': {
				name: "Position",
				arg: ['max'],
				params: {max: {type: 'pos', default_value: +2147483647}}

			},

			'int': {
				name: "Integer",
				arg: ["max", "min", "step"],
				params: {
						max: {type: 'int', default_value: +2147483647},
						min: {type: 'int', default_value: -2147483648},
						step: {type: 'pos', default_value: 1}
					}
			},

			'num': {
				name: "Number",
				arg: ["max", "min", "precis"],
				params: {
						max: {type: 'num', default_value: +2147483647},
						min: {type: 'num', default_value: -2147483648},
						precis: {type: 'pos', default_value: 9}
					}
			},
			'arr': {
				name: "Array",
				arg: ["types", "size", "fixed"],
				params: {
						types: {type: "Type || [Type, Type...]", get default_value(){return T.pos}},
						size: {type: 'pos', default_value: 7},
						fixed: {type: 'bool', default_value: true}
					}
			},
			'any': {
				name: "MixType",
				arg: ["types"],
				params: {
						types: {type: "Type, Type... || [Type, Type...]", get default_value(){return [T.pos, T.str]}}
					}
			},
			'obj': {
				name: "Object",
				arg: ["types"],
				params: {types: {type: "Object", default_value: {}}}
			}
		},
		getConst: function(name_type, name_limit){
			return this.types[name_type].params[name_limit].default_value;
		}
	};
	this.doc = {};
	this.doc.json = JSON.stringify(Doc, "", 2);

	Doc.genDoc = (function(name, params){return {name: this.types[name].name, params: params}}).bind(Doc);
	this.doc.gen = Doc.genDoc;




	//Erros
	function argTypeError(wrong_arg, mess){
		if(mess === undefined) mess = '';
		var ER = new TypeError('Argument type is wrong! Arguments(' + forArg(wrong_arg) + ');' + mess);
		ER.wrong_arg = wrong_arg;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(ER, argTypeError);
		}

		return ER;

		function forArg(args){
			var str_args = '';
			for(var i = 0; i < args.length; i++){
				str_args += typeof(args[i]) + ': ' + args[i] + '; ';
			}
			return str_args;
		}
	}
	T.error = argTypeError;

	function typeSyntaxError(wrong_str, mess){
		if(mess === undefined) mess = '';
		var ER = new SyntaxError('Line: ' + wrong_str + '; ' + mess);
		ER.wrong_arg = wrong_str;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(ER, typeSyntaxError);
		}

		return ER;
	}



	function CreateCreator(New, test, rand, doc){
		var creator;
		if(typeof New === "function"){
			creator = function(){
				var tmp_obj = New.apply({}, arguments);
				var new_creator = new CreateCreator(New, tmp_obj.test, tmp_obj.rand, tmp_obj.doc);
				
				return new_creator;
			};
		}else creator = function(){return creator};

		creator.is_creator = true;
		if(typeof test === "function") creator.test = test;
		if(typeof rand === "function") creator.rand = rand;
		if(typeof doc === "function") creator.doc = doc;

		return Object.freeze(creator);
	}
	this.newType = function(key, desc, new_type){
		Doc.types[key] = desc;
		T.names[desc.name] = key;
		this.doc.json = JSON.stringify(Doc, "", 2);

		this[key] = new CreateCreator(new_type.New, new_type.test, new_type.rand, new_type.doc);
	}
	this.newType.doc = '(name, constructor, funcTest, funcRand, funcDoc)';



	//Craft Boolean
		this.bool = new CreateCreator(
			null,
			function(value){
				if(typeof value !== 'boolean'){
					return this.doc();
				}
			},
			function(){
				return !(Math.round(Math.random()));
			},
			Doc.genDoc.bind(null, "bool")
		);



	//Craft Const
		function docConst(val){

			if(typeof(val) === "object" && val !== null){
				val = 'Object';
			}
			if(typeof(val) === "function"){
				val = val.toString();
			}
			return Doc.genDoc.bind(null,"const", {value: val});
		}
		function newConst(val){
			return {
				rand: function(){return val},
				test: function(v){
					if(val !== v) return this.doc();
					return false;
				},
				doc: docConst(val)
			};
		}
		var def_const = newConst(Doc.getConst('const', 'value'));
		this.const = new CreateCreator(newConst, def_const.test, def_const.rand, def_const.doc);

		function tConst(Type){
			if(typeof (Type) !== "function" || !Type.is_creator){
				if(Array.isArray(Type)){

					return T.arr(Type);

				}else if(typeof(Type) == "object" && Type !== null){

					return T.obj(Type);

				}else return T.const(Type);
			}else{
				return Type;
			}
		}


	//Craft Number
		var randNum = function(max, min, precis){
			return function(){
				return +(((max - min)*Math.random() +  min).toFixed(precis));
			}
		};

		var testNum = function(max, min, precis){
			return function(n){
				if(typeof n !== 'number' || !isFinite(n)){
					return this.doc();
				}

				if((n > max)
					||(n < min)
					|| (n.toFixed(precis) != n && n !== 0) ){

					return this.doc();
				}
				return false;
			  };
		};

		var docNum = function(max, min, precis){
			return Doc.genDoc.bind(null, "num", {"max": max, "min": min, "precis": precis});
		}

		var max_def_n = Doc.getConst('num', 'max');
		var min_def_n = Doc.getConst('num', 'min');
		var precis_def = Doc.getConst('num', 'precis');

		this.num = new CreateCreator(
			function(max, min, precis){
				if(max === null) max = max_def_n;
				if(min === undefined||min === null) min = min_def_n;
				if(precis === undefined) precis = precis_def;

				if((typeof min !== 'number' || !isFinite(min))
					||(typeof max !== 'number' || !isFinite(max))
					||(typeof precis !== 'number' || !isFinite(precis))
					||(precis < 0)
					||(precis > 9)
					||(precis % 1 !== 0)){
					throw argTypeError(arguments, 'Wait arguments: min(number), max(number), precis(0<=number<9)');
				}
				if(min > max){
					var t = min;
					min = max;
					max = t;
				}

				return {
					test: testNum(max, min, precis),
					rand: randNum(max, min, precis),
					doc: docNum(max, min, precis)
				}
			},
			testNum(max_def_n, min_def_n, precis_def),
			randNum(max_def_n, min_def_n, precis_def),
			docNum(max_def_n, min_def_n, precis_def)
		);

		var randInt = function(max, min, precis){
			return function(){
				return Math.floor( ((max - (min + 0.1))/precis)*Math.random() ) * precis +  min;
			}
		};

		 var testInt = function(max, min, precis){
			return function(n){
				if(typeof n !== 'number' || !isFinite(n)){
					return this.doc();
				}

				if((n >= max)
					||(n < min)
					||(((n - min) % precis) !== 0) ){
					return this.doc();
				}
				return false;
			  };
		};

		var docInt = function(max, min, step){

				return Doc.genDoc.bind(null, "int", {"max": max, "min": min, "step": step});

		}

		var max_def = Doc.getConst('int', 'max');
		var min_def = Doc.getConst('int', 'min');
		var step_def = Doc.getConst('int', 'step');

		this.int = new CreateCreator(
			function(max, min, step){

				if(max === null) max = max_def;
				if(min === undefined||min === null) min = min_def;
				if(step === undefined) step = step_def;

				if((typeof min !== 'number' || !isFinite(min))
					||(typeof max !== 'number' || !isFinite(max))
					||(Math.round(min) !== min)
					||(Math.round(max) !== max)
					||(step <= 0)
					||(Math.round(step) !== step)){
					throw argTypeError(arguments, 'Wait arguments: min(int), max(int), step(int>0)');
				}
				if(min > max){
					var t = min;
					min = max;
					max = t;
				}

				return {
					test: testInt(max, min, step),
					rand: randInt(max, min, step),
					doc: docInt(max, min, step)
				}
			},
			testInt(max_def, min_def, step_def),
			randInt(max_def, min_def, step_def),
			docInt(max_def, min_def, step_def)
		);

		var docPos = function(max, min, step){

				return Doc.genDoc.bind(null, "pos", {"max": max});

		}

		var max_def_p = Doc.getConst('pos', 'max')
		this.pos = new CreateCreator(
			function(max){

				if(max === null) max = max_def_p;

				if((typeof max !== 'number' || !isFinite(max))
					||(max < 0)){
					throw argTypeError(arguments, 'Wait arguments: min(pos), max(pos), step(pos>0)');
				}

				return {
					test: testInt(max, 0, 1),
					rand: randInt(max, 0, 1),
					doc: docPos(max)
				}
			},
			testInt(max_def_p, 0, 1),
			randInt(max_def_p, 0, 1),
			docPos(max_def_p)
		);





  //Craft Any
  		function randIndex(arr){
			var rand = Math.round((arr.length - 1) * Math.random());
			return arr[rand];
		}

		function randAny(arr){
			return function(){
				return randIndex(arr).rand();
			}
		}

		function testAny(arr){
			return function(val){
				if(arr.every(function(i){return i.test(val)})){
					return this.doc();
				}

				return false;
			}
		}

		function docAny(Types){

			var cont = Types.length;
			var type_docs = [];
			for(var i = 0; i < cont; i++){
				type_docs.push(Types[i].doc());
			}

			return Doc.genDoc.bind(null, "any", {types: type_docs});
		}

		var def_types = Doc.getConst('arr', 'types');
		function newAny(arr){
			if(!Array.isArray(arr) || arguments.length > 1) arr = arguments;

			var len = arr.length;
			var arr_types = [];
			for(var i = 0; i < len; i++){
				arr_types[i] = tConst(arr[i]);
			}

			return{
				test: testAny(arr_types),
				rand: randAny(arr_types),
				doc: docAny(arr_types)
			}
		}

		this.any = new CreateCreator(
			newAny,
			testAny(def_types),
			randAny(def_types),
			docAny(def_types)
		);



	//Craft Array



		function randArray(Type, size, is_fixed){
			var randSize = function (){return size};
			if(!is_fixed){
				randSize = T.pos(size).rand;
			}


			if(Array.isArray(Type)){
				var now_size = randSize();

				return function(){
					var arr = [];

					for(var i = 0, j = 0; i < now_size; i++){

						arr.push(Type[j].rand());

						j++;
						if(j >= Type.length){
							j = 0;
						}
					}
					return arr;
				}
			}



			return function(){
				var arr = [];

				var now_size = randSize();
				for(var i = 0; i < now_size; i++){
					arr.push(Type.rand(i, arr));
				}

				return arr;
			}

		}

		function testArray(Type, size, is_fixed){

			if(Array.isArray(Type)){
				return function(arr){

					if(!Array.isArray(arr)){
						var err = this.doc();
						err.params = "Value is not array!";
						return err;
					}

					if((arr.length > size) || (is_fixed && (arr.length !== size))){
						var err = this.doc();
						err.params = "Array lenght is wrong!";
						return err;
					}

					for(var i = 0, j = 0; i < arr.length; i++){

							var res = Type[j].test(arr[i]);
							if(res){
									var err = this.doc();
									err.params = {index: i, wrong_item: res};
									return err;
							}

							j++;
							if(j >= Type.length){
								j = 0;
							}
					}

					return false;
				}
			}

			return function(arr){
				if(!Array.isArray(arr)){
					var err = this.doc();
					err.params = "Value is not array!";
					return err;
				}

				if((arr.length > size) || (is_fixed && (arr.length !== size))){
					console.log(arr.length, size)
					var err = this.doc();
					err.params = "Array: lenght is wrong!";
					return err;
				}

				var err_arr = arr.filter(Type.test);
				if(err_arr.length != 0){
					var err = this.doc();
					err.params = err_arr;
					return err;
				}

				return false;
			}
		}

		function docArray(Type, size, is_fixed){
			var type_docs = [];
			if(Array.isArray(Type)){
				var cont = Type.length;
				for(var i = 0; i < cont; i++){
					type_docs.push(Type[i].doc());
				}
			}else{
				type_docs = Type.doc();
			}

			return Doc.genDoc.bind(null, "arr", {types: type_docs, size: size, fixed: is_fixed});

		}


		var def_Type = Doc.getConst('arr', 'types');
		var def_Size = Doc.getConst('arr', 'size');
		var def_fixed = Doc.getConst('arr', 'fixed');

		function newArray(Type, size, is_fixed){
			if(Type === null) Type = def_Type;
			if(is_fixed === undefined) is_fixed = def_fixed;

			if(Array.isArray(Type)){
				if(size === undefined||size === null) size = Type.length;

				Type = Type.map(function(item){return tConst(item);});
			}else{
				if(size === undefined||size === null) size = 1;
				Type = tConst(Type);
			}

			if(T.pos.test(size)){
					throw argTypeError(arguments, 'Wait arguments: ' + JSON.stringify(T.pos.test(size)));
			}

			return {
				test: testArray(Type, size, is_fixed),
				rand: randArray(Type, size, is_fixed),
				doc: docArray(Type, size, is_fixed)
			};
		}

		this.arr = new CreateCreator(
			newArray,
			testArray(def_Type, def_Size, def_fixed),
			randArray(def_Type, def_Size, def_fixed),
			docArray(def_Type, def_Size, def_fixed)
		);







	//Craft Object

		function randObj(funcObj){
			return function(){
				var obj = {};
				for(var key in funcObj){
					obj[key] = funcObj[key].rand();
				}
				return obj;
			};
		}

		function testObj(funcObj){
			return function(obj){

				if(typeof obj !== "object" && obj === null){
					var err = this.doc();
					err.params = "Value is not object!";
					return err;
				}

				for(var key in funcObj){
					var res = funcObj[key].test(obj[key]);
					if(res){
						var err = this.doc();
						err.params = {};
						err.params[key] = res;
						return err;
					}
				}

				return false;
			};
		}

		function docOb(funcObj){
			var doc_obj = {};

			for(var key in funcObj){
					doc_obj[key] = funcObj[key].doc();
			}

			return Doc.genDoc.bind(null, "obj", {types: doc_obj});
		}

		function NewObj(tempObj){
			if(typeof tempObj !== 'object') throw argTypeError(arguments, 'Wait arguments: tempObj(Object)');

			var begObj = {};
			var funcObj = {};
			for(var key in tempObj){
				funcObj[key] = tConst(tempObj[key]);
			}

			return{
				test: testObj(funcObj),
				rand: randObj(funcObj),
				doc: docOb(funcObj)
			}
		}
		this.obj = new CreateCreator(NewObj,
			function(obj){return typeof obj === "object"},
			randObj({}),
			Doc.genDoc.bind(null, "obj")
		);





//Craft Type out to  Document

	T.names = {};
	for(var key in Doc.types){
		T.names[Doc.types[key].name] = key;
	}

	this.outDoc = function(tmp){
		if((typeof tmp === "function") && tmp.is_creator) return tmp;

		if(!('name' in tmp)){
			throw new Error();
		}
		var type = tmp.name;

		if('params' in tmp){
			var params = tmp.params;
			switch(T.names[type]){
				case 'obj': {
					var new_obj = {};
					for(var key in params.types){
						new_obj[key] = T.outDoc(params.types[key]);
					}
					params.types = new_obj;
					break;
				}
				case 'any':
				case 'arr': {
					if(Array.isArray(params.types)){
						params.types = params.types.map(T.outDoc.bind(T));
					}else params.types = T.outDoc(params.types);
				}
			}
			return getSimpleType(T.names[type], params);
		}
		return getSimpleType(T.names[type], {});
	}

	function getSimpleType(name, params){
		var arg = [];
		Doc.types[name].arg.forEach(function(key, i){arg[i] = params[key];});
		return T[name].apply(T, arg);
	};

//Support Declarate Function

	function findeParse(str, beg, end){
		var point_beg = str.indexOf(beg);
		if(~point_beg){

			var point_end = point_beg;
			var point_temp = point_beg;
			var level = 1;
			var breakWhile = false;
			while(!breakWhile){
				breakWhile = true;

				if(~point_temp) point_temp = str.indexOf(beg, point_temp + 1);
				if(~point_end) point_end = str.indexOf(end, point_end + 1);

				if(point_temp < point_end){

					if(point_temp > 0){
						breakWhile = false;
						if(str[point_temp - 1] !== '\\') level = level+1;

					}


					if(point_end > 0){
						breakWhile = false;
						if(str[point_end - 1] !== '\\') level = level-1;
						if(level == 0){
							return [point_beg, point_end];
						}
					}
				}else{
					if(point_end > 0){
						breakWhile = false;
						if(str[point_end - 1] !== '\\') level = level-1;
						if(level == 0){
							return [point_beg, point_end];
						}
					}

					if(point_temp > 0){
						breakWhile = false;
						if(str[point_temp - 1] !== '\\') level = level+1;

					}
				}
			}
		}
		return false;
	}

	Object.types = T;
})();

},{}],17:[function(require,module,exports){
module.exports={
	"Дерево": "wood",
	"Камень": "stone",
	"Сталь": "steel",
	"Респ": "spawner"
}
},{}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0tvbG9ib2svRGVza3RvcC9Qb3J0UHJvZy9XaW42NC9ub2RlX3YxMS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiQWRkRm9ybS5qcyIsIkRpc3BsYXkuanMiLCJFdmVudHMuanMiLCJMb2dpYy5qcyIsIk1hcC5qcyIsIlN3aXRjaC5qcyIsIlRvb2xzLmpzIiwiVHlwZXMuanMiLCJWaWV3TG9naWMuanMiLCJicm9tYWluLmpzIiwiZHJhd0xpYi5qcyIsImludGVyLmpzIiwibW9mLmpzIiwibm9kZV9tb2R1bGVzL2pzLWJhc2U2NC9iYXNlNjQuanMiLCJub2RlX21vZHVsZXMvdHlwZXNqcy9zdHJfdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc2pzL3R5cGVzLmpzIiwidHlwZXNfZHVyYWJpbGl0eS5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBMaWIgPSByZXF1aXJlKFwiLi9kcmF3TGliLmpzXCIpO1xyXG52YXIgZHVyYWJpbGl0eV90eXBlc19saXN0ID0gcmVxdWlyZShcIi4vdHlwZXNfZHVyYWJpbGl0eS5qc29uXCIpO1xyXG5cclxuXHJcbnZhciBkdXJhYmlsaXR5X3R5cGVzX2NvbnQgPSBMaWIuZ2V0Tm9kZShcIkR1cmFiaWxpdHlUeXBlc1wiKTtcclxudmFyIGltYWdlc19jb250ID0gTGliLmdldE5vZGUoXCJJbWFnZXNcIik7XHJcbnZhciB0aWxlX3NpemVfY29udCA9IExpYi5nZXROb2RlKFwiVGlsZVNpemVcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENyQWRkRm9ybSgpe1xyXG5cdHJldHVybiB7XHJcblx0XHRcdEltYWdlczogbmV3IENySW1hZ2VzKGltYWdlc19jb250KSxcclxuXHRcdFx0VHlwZTogbmV3IENyTGlzdChkdXJhYmlsaXR5X3R5cGVzX2NvbnQsIGR1cmFiaWxpdHlfdHlwZXNfbGlzdCksXHJcblx0XHRcdFNpemU6IHRpbGVfc2l6ZV9jb250LFxyXG5cdFx0XHRjbGVhcjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR0aGlzLkltYWdlcy5jbGVhcigpO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Z2V0VGlsZTogbmV3VGlsZVxyXG5cdH07XHJcbn1cclxuXHJcbnJlcXVpcmUoXCIuL21vZi5qc1wiKTtcclxuXHJcbmZ1bmN0aW9uIENySW1hZ2VzKGNvbnRhaW5lcil7XHJcblx0dmFyIGltYWdlcyA9IFtdO1xyXG5cclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKGZpbGUpe1xyXG5cdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcclxuXHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKXtcclxuXHRcdFx0QWRkKGUudGFyZ2V0LnJlc3VsdCk7XHJcblx0XHR9O1xyXG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XHJcblx0fTtcclxuXHJcblx0dGhpcy5hZGRHZXRTZXQoXCJ2YWx1ZVwiLFxyXG5cdFx0ZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYoaW1hZ2VzLmxlbmd0aCA+IDApIHJldHVybiBpbWFnZXM7XHJcblx0XHR9XHJcblx0KTtcclxuXHJcblx0dGhpcy5jbGVhciA9IGZ1bmN0aW9uKCl7XHJcblx0XHRBcnJheS5mcm9tKGNvbnRhaW5lci5jaGlsZHJlbikuZm9yRWFjaChlbGVtID0+IGVsZW0ucmVtb3ZlKCkpO1xyXG5cdFx0aW1hZ2VzID0gW107XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBBZGQoaW1nKXtcclxuXHRcdGltYWdlcy5wdXNoKGltZyk7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoTGliLmRyYXdUaWxlKGltZykpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ3JMaXN0KGNvbnRhaW5lciwgbGlzdCl7XHJcblxyXG5cdGZvciAodmFyIHZhbCBpbiBsaXN0KXtcclxuXHRcdHZhciBvcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcclxuXHRcdG9wdC52YWx1ZSA9IGxpc3RbdmFsXTtcclxuXHRcdG9wdC5pbm5lckhUTUwgPSB2YWw7XHJcblx0XHRvcHQub25jbGljayA9IG9uY2xpY2s7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQob3B0KTtcclxuXHR9XHJcblx0dmFyIGRlZk9wdCA9IGNvbnRhaW5lci5jaGlsZHJlblswXTtcclxuXHRjb250YWluZXIudmFsdWUgPSBkZWZPcHQudmFsdWU7XHJcblx0ZGVmT3B0LmNsYXNzTGlzdC5hZGQoXCJvcHRpb24tY2hhbmdlXCIpO1xyXG5cclxuXHRyZXR1cm4gY29udGFpbmVyO1xyXG5cclxuXHRmdW5jdGlvbiBvbmNsaWNrKCl7XHJcblx0XHRBcnJheS5mcm9tKHRoaXMucGFyZW50RWxlbWVudC5jaGlsZHJlbikuZm9yRWFjaChlbGVtID0+IGVsZW0uY2xhc3NMaXN0LnJlbW92ZShcIm9wdGlvbi1jaGFuZ2VcIikpO1xyXG5cdFx0dGhpcy5wYXJlbnRFbGVtZW50LnZhbHVlID0gdGhpcy52YWx1ZTtcclxuXHRcdGNvbnNvbGUubG9nKHRoaXMudmFsdWUpO1xyXG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKFwib3B0aW9uLWNoYW5nZVwiKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld1RpbGUoc2VuZCl7XHJcblx0aWYodGhpcy5JbWFnZXMudmFsdWUgXHJcblx0XHQmJiB0aGlzLlR5cGUudmFsdWVcclxuXHRcdCYmIHRoaXMuU2l6ZS52YWx1ZSl7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRpbWFnZXM6IHRoaXMuSW1hZ2VzLnZhbHVlLFxyXG5cdFx0XHR0eXBlOiB0aGlzLlR5cGUudmFsdWUsXHJcblx0XHRcdHNpemU6IHBhcnNlSW50KHRoaXMuU2l6ZS52YWx1ZSlcclxuXHRcdH07XHJcblx0fVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XHJcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xyXG5cdHJldHVybiBlbGVtO1xyXG59IiwiY29uc3QgQmFzZTY0ID0gcmVxdWlyZSgnanMtYmFzZTY0JykuQmFzZTY0O1xyXG5cclxuY29uc3QgQ3JWaWV3TG9naWMgPSByZXF1aXJlKFwiLi9WaWV3TG9naWMuanNcIik7XHJcblxyXG5jb25zdCBIZWFyID0gcmVxdWlyZShcIi4vRXZlbnRzLmpzXCIpO1xyXG5cclxuY29uc3QgQ3JBZGRGb3JtID0gcmVxdWlyZShcIi4vQWRkRm9ybS5qc1wiKTtcclxuY29uc3QgQ3JUb29sID0gcmVxdWlyZShcIi4vVG9vbHMuanNcIik7XHJcbmNvbnN0IENyTWFwID0gcmVxdWlyZShcIi4vTWFwLmpzXCIpO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENyRGlzcGxheShJbnRlcil7XHJcblx0dmFyIFNlbmQgPSBJbnRlci5jb25uZWN0KHJlY2VpdmUpO1xyXG5cclxuXHR2YXIgVGlsZXMgPSBuZXcgQ3JUaWxlcygpO1xyXG5cclxuXHR2YXIgQWRkRm9ybSA9IG5ldyBDckFkZEZvcm0oKTtcclxuXHJcblx0dmFyIFRpbGVNYXAgPSBuZXcgQ3JNYXAoKTtcclxuXHJcblx0dmFyIFRvb2wgPSBuZXcgQ3JUb29sKCk7XHJcblxyXG5cclxuXHR2YXIgVmlld0xvZ2ljID0gbmV3IENyVmlld0xvZ2ljKEFkZEZvcm0sIFRvb2wpO1xyXG5cclxuXHRIZWFyKFwiQWRkRm9ybVwiLCBcInN1Ym1pdFwiLCBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIHRpbGUgPSBBZGRGb3JtLmdldFRpbGUoKTtcclxuXHRcdGlmKHRpbGUpe1xyXG5cdFx0XHRTZW5kKHtcclxuXHRcdFx0XHRhY3Rpb246IFwiQWRkXCIsXHJcblx0XHRcdFx0dHlwZTogXCJUaWxlXCIsXHJcblx0XHRcdFx0dGlsZTogdGlsZVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0Vmlld0xvZ2ljLnN3aXRjaEFkZEZvcm0oKTtcclxuXHRcdFx0QWRkRm9ybS5jbGVhcigpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRcclxuXHJcblx0ZnVuY3Rpb24gaW5pdE1hcCgpe1xyXG5cclxuXHRcdEhlYXIoXCJHcmlkXCIsIFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0XHRcdHRoaXMuaXNfZG93biA9IHRydWU7XHJcblx0XHRcdFx0aWYoZS50YXJnZXQucGFyZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKSA9PSBcIkdyaWRcIilcclxuXHRcdFx0XHRcdGRyYXdNYXAoZS50YXJnZXQueCwgZS50YXJnZXQueSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRIZWFyKFwiR3JpZFwiLCBcIm1vdXNldXBcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRcdHRoaXMuaXNfZG93biA9IGZhbHNlO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0SGVhcihcIkdyaWRcIiwgXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRcdGlmKHRoaXMuaXNfZG93biAmJiBlLnRhcmdldC5wYXJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcImlkXCIpID09IFwiR3JpZFwiKXtcclxuXHRcdFx0XHRkcmF3TWFwKGUudGFyZ2V0LngsIGUudGFyZ2V0LnkpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRyYXdNYXAoeCwgeSl7XHJcblx0XHRpZih0eXBlb2YgVG9vbC50aWxlID09IFwibnVtYmVyXCIpXHJcblx0XHRcdFNlbmQoe1xyXG5cdFx0XHRcdGFjdGlvbjogXCJEcmF3XCIsXHJcblx0XHRcdFx0dHlwZTogXCJNYXBcIixcclxuXHRcdFx0XHR0b29sOiBUb29sLnR5cGUsXHJcblx0XHRcdFx0Y29vcmRzOiB7eDogeCwgeTogeSwgejogMX0sXHJcblx0XHRcdFx0dGlsZV9pZDogVG9vbC50aWxlXHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblxyXG5cdC8vUmVjZWl2ZS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdGZ1bmN0aW9uIHJlY2VpdmUobWVzcyl7XHJcblx0XHRzd2l0Y2gobWVzcy50eXBlKXtcclxuXHRcdFx0Y2FzZSBcIlRpbGVcIjogcmVjZWl2ZVRpbGVzKG1lc3MpOyBicmVhaztcclxuXHRcdFx0Y2FzZSBcIk1hcFwiOiByZWNlaXZlTWFwKG1lc3MpOyBicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlY2VpdmVUaWxlcyhtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLmFjdGlvbil7XHJcblx0XHRcdCBjYXNlIFwiQWRkXCI6ICBUaWxlcy5hZGQobWVzcy50aWxlKTsgYnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWNlaXZlTWFwKG1lc3Mpe1xyXG5cdFx0c3dpdGNoKG1lc3MuYWN0aW9uKXtcclxuXHRcdFx0IGNhc2UgXCJDcmVhdGVcIjogIHtcclxuXHRcdFx0IFx0VGlsZU1hcC5sb2FkKG1lc3MpOyBpbml0TWFwKCk7IGJyZWFrO1xyXG5cdFx0XHQgfVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4vL1RpbGVzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuY29uc3QgTGliID0gcmVxdWlyZShcIi4vZHJhd0xpYi5qc1wiKTtcclxuXHJcbnZhciB0aWxlc19jb250ID0gTGliLmdldE5vZGUoXCJUaWxlc1wiKTtcclxuXHJcbmZ1bmN0aW9uIENyVGlsZXMoY29udGFpbmVyKXtcclxuXHJcblx0dGhpcy5hZGQgPSBmdW5jdGlvbihuZXdfdGlsZSl7XHJcblx0XHR2YXIgdGlsZSA9IExpYi5kcmF3VGlsZShuZXdfdGlsZS5pbWFnZXNbMF0pO1xyXG5cdFx0dGlsZS50aWxlID0gbmV3X3RpbGU7XHJcblx0XHR0aWxlc19jb250LmFwcGVuZENoaWxkKHRpbGUpO1xyXG5cdH1cclxufVxyXG5cclxuLy8iLCJcclxuZnVuY3Rpb24gSWRFdmVudChpZCwgbmFtZV9ldmVudCwgZnVuYyl7XHJcblx0XHJcblx0aWYobmFtZV9ldmVudCA9PSBcInN1Ym1pdFwiKXtcclxuXHRcdHZhciBvbGRfZnVuYyA9IGZ1bmM7XHJcblx0XHRmdW5jID0gZnVuY3Rpb24oZSl7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0b2xkX2Z1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdH0gXHJcblx0fVxyXG5cdFxyXG5cdGlmKEFycmF5LmlzQXJyYXkobmFtZV9ldmVudCkpe1xyXG5cdFx0bmFtZV9ldmVudC5mb3JFYWNoKG5hbWUgPT4gZ2V0Tm9kZShpZCkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jKSk7XHJcblx0fVxyXG5cdGVsc2UgZ2V0Tm9kZShpZCkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lX2V2ZW50LCBmdW5jKTtcclxufVxyXG5cclxuZnVuY3Rpb24gU3VibWl0KGZ1bmMpe1xyXG5cdHJldHVybiBmdW5jdGlvbihldmVudCl7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XHJcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xyXG5cdHJldHVybiBlbGVtO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElkRXZlbnQ7XHJcbiIsInJlcXVpcmUoXCIuL21vZi5qc1wiKTtcclxuXHJcbnZhciBtYXBfc2l6ZSA9IHt3aWR0aDogMjAsIGhlaWdodDogMjAsIGxheWVyczogMn07XHJcblxyXG5mdW5jdGlvbiBDclRpbGVzKCl7XHJcblx0dmFyIHRpbGVzID0gQXJyYXkuY3JlYXRlKCk7XHJcblxyXG5cdHRoaXMuYWRkID0gZnVuY3Rpb24obmV3X3RpbGUpe1xyXG5cdFx0bmV3X3RpbGUuaWQgPSB0aWxlcy5hZGQobmV3X3RpbGUpO1xyXG5cdFx0cmV0dXJuIG5ld190aWxlO1xyXG5cdH1cclxufVxyXG5cclxudmFyIFRpbGVzID0gbmV3IENyVGlsZXMoKTtcclxuXHJcbmZ1bmN0aW9uIENyTWFwKHNpemVzKXtcclxuXHR2YXIgY3JfbGluZSA9IEFycmF5LmNyZWF0ZS5iaW5kKG51bGwsIG51bGwsIHNpemVzLndpZHRoKTtcclxuXHR2YXIgY3JfcGxpbmUgPSBBcnJheS5jcmVhdGUuYmluZChudWxsLCBjcl9saW5lLCBzaXplcy53aWR0aCwgdHJ1ZSk7XHJcblx0dmFyIG1hcCA9IEFycmF5LmNyZWF0ZShjcl9wbGluZSwgc2l6ZXMubGF5ZXJzKTtcclxuXHJcblx0dGhpcy5sb2FkID0gZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGFjdGlvbjogXCJDcmVhdGVcIixcclxuXHRcdFx0dHlwZTogXCJNYXBcIixcclxuXHRcdFx0c2l6ZXM6IHNpemVzXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR0aGlzLmRyYXcgPSBmdW5jdGlvbihpZF90aWxlLCBjb29yZHMsIHRvb2wpe1xyXG5cdFx0aWYoY29vcmRzXHJcblx0XHQmJiBtYXBbY29vcmRzLnpdXHJcblx0XHQmJiBtYXBbY29vcmRzLnpdW2Nvb3Jkcy55XVxyXG5cdFx0JiYgIW1hcFtjb29yZHMuel1bY29vcmRzLnldW2Nvb3Jkcy54XSl7XHJcblxyXG5cdFx0XHRtYXBbY29vcmRzLnpdW2Nvb3Jkcy55XVtjb29yZHMueF0gPSBpZF90aWxlO1xyXG5cdFx0XHRyZXR1cm4gY29vcmRzO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxudmFyIFRpbGVNYXAgPSBuZXcgQ3JNYXAobWFwX3NpemUpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDckxvZ2ljKEludGVyKXtcclxuXHR2YXIgc2VuZCA9IEludGVyLmNvbm5lY3QocmVjZWl2ZSk7XHJcblx0c2VuZChUaWxlTWFwLmxvYWQoKSk7XHJcblxyXG5cdGZ1bmN0aW9uIHJlY2VpdmUobWVzcyl7XHJcblx0XHRzd2l0Y2gobWVzcy50eXBlKXtcclxuXHRcdFx0Y2FzZSBcIlRpbGVcIjogcmVjZWl2ZVRpbGVzKG1lc3MpOyBicmVhaztcclxuXHRcdFx0Y2FzZSBcIk1hcFwiOiByZWNlaXZlTWFwKG1lc3MpOyBicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlY2VpdmVUaWxlcyhtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLmFjdGlvbil7XHJcblx0XHRcdGNhc2UgXCJBZGRcIjogIHtcclxuXHRcdFx0XHRtZXNzLnRpbGUgPSBUaWxlcy5hZGQobWVzcy50aWxlKTtcclxuXHRcdFx0XHRzZW5kKG1lc3MpO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHR9IGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVjZWl2ZU1hcChtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLmFjdGlvbil7XHJcblx0XHRcdCBjYXNlIFwiRHJhd1wiOiAge1xyXG5cdFx0XHQgXHRtZXNzLmNvb3JkcyA9IFRpbGVNYXAuZHJhdyhtZXNzLmlkX3RpbGUsIG1lc3MuY29vcmRzLCBtZXNzLnRvb2wpO1xyXG5cdFx0XHQgXHRzZW5kKG1lc3MpO1xyXG5cdFx0XHQgfVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4iLCJjb25zdCBMaWIgPSByZXF1aXJlKFwiLi9kcmF3TGliLmpzXCIpO1xyXG5cclxudmFyIG1hcF9zaXplID0gMjA7XHJcbnZhciBtYXBfY29udCA9IExpYi5nZXROb2RlKFwiTWFwXCIpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDck1hcCgpe1xyXG5cclxuXHR0aGlzLmxvYWQgPSBmdW5jdGlvbihtZXNzKXtcclxuXHRcdHZhciBHcmlkID0gQ3JMYXllcihtZXNzLnNpemVzLCBcImdyaWQtYm9yZGVyXCIpO1xyXG5cdFx0R3JpZC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcIkdyaWRcIik7XHJcblxyXG5cdFx0d2hpbGUobWVzcy5zaXplcy5sYXllcnMtLSlcclxuXHRcdFx0bWFwX2NvbnQuYXBwZW5kQ2hpbGQoQ3JMYXllcihPYmplY3QuYXNzaWduKHt9LCBtZXNzLnNpemVzKSkpO1xyXG5cclxuXHRcdG1hcF9jb250LmFwcGVuZENoaWxkKEdyaWQpO1xyXG5cdH1cclxuXHRcclxufVxyXG5cclxuZnVuY3Rpb24gQ3JMYXllcihzaXplcywgYm9yZGVyKXtcclxuXHR2YXIgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cdGxheWVyLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XHJcblx0bGF5ZXIuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XHJcblx0ZHJhd0dyaWQobGF5ZXIsIHNpemVzLCBib3JkZXIpO1xyXG5cclxuXHR0aGlzLnNob3cgPSBmdW5jdGlvbigpe1xyXG5cdFx0bGF5ZXIuc3R5bGUub3BhY2l0eSA9IDA7XHJcblx0fVxyXG5cclxuXHR0aGlzLmhpZGUgPSBmdW5jdGlvbigpe1xyXG5cdFx0bGF5ZXIuc3R5bGUub3BhY2l0eSA9IDE7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbGF5ZXI7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBkcmF3R3JpZChjb250YWluZXIsIGdyaWRfc2l6ZSwgYm9yZGVyKXtcclxuXHR2YXIgd19zaXplID0gMTAwIC8gZ3JpZF9zaXplLndpZHRoO1xyXG5cdHZhciBoX3NpemUgPSAxMDAgLyBncmlkX3NpemUuaGVpZ2h0O1xyXG5cdGZvcih2YXIgaSA9IGdyaWRfc2l6ZS53aWR0aCAtIDE7IGkgPj0gMDsgaS0tKXtcclxuXHRcdGZvcih2YXIgaiA9IGdyaWRfc2l6ZS5oZWlnaHQgLSAxOyBqID49IDA7IGotLSl7XHJcblx0XHRcdHZhciBib3ggPSBkYXJ3Qm94KGksIGosIHdfc2l6ZSwgaF9zaXplLCBib3JkZXIpO1xyXG5cdFx0XHRcclxuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGJveCk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBkYXJ3Qm94KHgsIHksIHdfc2l6ZSwgaF9zaXplLCBib3JkZXIpe1xyXG5cdHZhciBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRib3guY2xhc3NMaXN0LmFkZChcImJveFwiKTtcclxuXHRpZihib3JkZXIpIFxyXG5cdFx0Ym94LmNsYXNzTGlzdC5hZGQoYm9yZGVyKTtcclxuXHJcblx0Ym94LnN0eWxlLndpZHRoID0gd19zaXplICsgXCIlXCI7XHJcblx0Ym94LnN0eWxlLmhlaWdodCA9IGhfc2l6ZSArIFwiJVwiO1xyXG5cdFxyXG5cdGJveC5zdHlsZS5sZWZ0ID0geCp3X3NpemUgKyBcIiVcIjtcclxuXHRib3guc3R5bGUudG9wID0geSpoX3NpemUgKyBcIiVcIjtcclxuXHJcblx0Ym94LnggPSB4O1xyXG5cdGJveC55ID0geTtcclxuXHRcclxuXHRyZXR1cm4gYm94O1xyXG59IiwiZnVuY3Rpb24gQ3JTd2l0Y2gobmFtZV9jbGFzcywgaWRzKXtcblx0aWYoQXJyYXkuaXNBcnJheShpZHMpKXtcblx0XHR2YXIgZWxlbXMgPSBpZHMubWFwKGdldE5vZGUpO1xuXHRcdGVsZW1zID0gZWxlbXMubWFwKGVsZW0gPT4gZWxlbS5jbGFzc0xpc3QpO1xuXG5cdFx0cmV0dXJuIGFyclN3aWN0aC5iaW5kKG51bGwsIGVsZW1zLCBuYW1lX2NsYXNzKTtcblx0fVxuXHRlbHNlIGlmKHR5cGVvZiBpZHMgPT0gXCJvYmplY3RcIil7XG5cdFx0cmV0dXJuIG9ialN3aXRjaChpZHMsIG5hbWVfY2xhc3MpO1xuXHR9XG5cdGVsc2V7XG5cdFx0dmFyIGVsZW0gPSBnZXROb2RlKGlkcykuY2xhc3NMaXN0O1xuXHRcdHJldHVybiBvbmVTd2l0Y2guYmluZChudWxsLCBuYW1lX2NsYXNzLCBlbGVtKTtcblx0fVxuXHRcbn1cblxuZnVuY3Rpb24gb2JqU3dpdGNoKGlkX29iaiwgY2xhc3NfbmFtZSl7XG5cdGZvciAodmFyIGtleSBpbiBpZF9vYmope1xuXHRcdGlkX29ialtrZXldID0gZ2V0Tm9kZShpZF9vYmpba2V5XSkuY2xhc3NMaXN0O1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uKGlkKXtcblx0XHRmb3IgKHZhciBpIGluIGlkX29iail7XG5cdFx0XHRpZF9vYmpbaV0uYWRkKGNsYXNzX25hbWUpO1xuXHRcdH1cblx0XHRcblx0XHRpZF9vYmpbaWRdLnJlbW92ZShjbGFzc19uYW1lKTtcblx0fVxufVxuXG5mdW5jdGlvbiBhcnJTd2ljdGgoZWxlbV9hcnIsIG5hbWVfY2xhc3Mpe1xuXHRlbGVtX2Fyci5mb3JFYWNoKG9uZVN3aXRjaC5iaW5kKG51bGwsIG5hbWVfY2xhc3MpKTtcbn1cblxuZnVuY3Rpb24gb25lU3dpdGNoKG5hbWVfY2xhc3MsIGVsZW0pe1xuXHRcdGVsZW0udG9nZ2xlKG5hbWVfY2xhc3MpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENyU3dpdGNoO1xuXG5mdW5jdGlvbiBnZXROb2RlKGlkKXtcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cdGlmKCFlbGVtKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtIGlzIG5vdCBmaW5kIVwiKTtcblx0cmV0dXJuIGVsZW07XG59IiwicmVxdWlyZShcIi4vbW9mLmpzXCIpO1xyXG5jb25zdCBMaWIgPSByZXF1aXJlKFwiLi9kcmF3TGliLmpzXCIpO1xyXG5cclxuXHJcbnZhciB0b29sc19jb250ID0gTGliLmdldE5vZGUoXCJUb29sc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JUb29scygpe1xyXG5cdHZhciBwYWxsZXQgPSB7fTtcclxuXHR2YXIgdHlwZSA9IFwiUGVuXCI7XHJcblxyXG5cdHRoaXMuYWRkR2V0U2V0KFwidGlsZVwiLCBcclxuXHRcdGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKHBhbGxldFt0eXBlXSkgcmV0dXJuIHBhbGxldFt0eXBlXS5pZDtcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0XHRwYWxsZXRbdHlwZV0gPSB2YWw7XHJcblxyXG5cdFx0XHRjaGFuZ2VUaWxlVmlldyh2YWwuaW1hZ2VzWzBdKTtcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHR0aGlzLmFkZEdldFNldChcInR5cGVcIiwgXHJcblx0XHRmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gdHlwZTtcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0XHR0eXBlID0gdmFsO1xyXG5cdFx0fVxyXG5cdCk7XHJcblxyXG5cdHZhciB0aWxlVmlldyA9IExpYi5kcmF3VGlsZSgpO1xyXG5cdHRvb2xzX2NvbnQuYXBwZW5kQ2hpbGQodGlsZVZpZXcpO1xyXG5cclxuXHRmdW5jdGlvbiBjaGFuZ2VUaWxlVmlldyhpbWFnZSl7XHJcblx0XHR0aWxlVmlldy5yZW1vdmUoKTtcclxuXHRcdHRpbGVWaWV3ID0gTGliLmRyYXdUaWxlKGltYWdlKTtcclxuXHRcdHRvb2xzX2NvbnQuYXBwZW5kQ2hpbGQodGlsZVZpZXcpO1xyXG5cdH1cclxufSIsInJlcXVpcmUoXCJ0eXBlc2pzXCIpO1xyXG5yZXF1aXJlKFwidHlwZXNqcy9zdHJfdHlwZVwiKTtcclxuXHJcbnZhciB0eXBlc19kdXJhYmlsaXR5ID0gcmVxdWlyZShcIi4vdHlwZXNfZHVyYWJpbGl0eS5qc29uXCIpO1xyXG5cclxudmFyIFQgPSBPYmplY3QudHlwZXM7XHJcblxyXG52YXIgdGlsZV9pZF90eXBlID0gVC5wb3MoMjU2KTtcclxudmFyIGNvb3Jkc190eXBlID0ge3g6IFQucG9zKDIwKSwgeTogVC5wb3MoMjApLCB6OiBULnBvcygyKX07XHJcblxyXG52YXIgdGlsZV90eXBlID0gVC5vYmooe1xyXG5cdFx0aWQ6IFQuYW55KHVuZGVmaW5lZCwgdGlsZV9pZF90eXBlKSxcclxuXHRcdGltYWdlczogVC5hcnIoVC5zdHIoL15bXFx3XFxkXFxzKzo7Liw/PSNcXC88PlwiKCktXSokLywgMTAyNCoxMDI0KSksXHJcblx0XHR0eXBlOiBULmFueShPYmplY3QudmFsdWVzKHR5cGVzX2R1cmFiaWxpdHkpKSxcclxuXHRcdHNpemU6IFQucG9zKDIwKVxyXG59KTtcclxuXHJcbnZhciBuZXdfdGlsZV9tZXNzX3R5cGUgPSBULm9iaih7XHJcblx0YWN0aW9uOiBcIkFkZFwiLFxyXG5cdHR5cGU6IFwiVGlsZVwiLFxyXG5cdHRpbGU6IHRpbGVfdHlwZVxyXG59KTtcclxuXHJcbnZhciBtYXBfc2l6ZV90eXBlID0gVC5vYmooe1xyXG5cdHdpZHRoOiAyMCwgXHJcblx0aGVpZ2h0OiAyMCwgXHJcblx0bGF5ZXJzOiAyXHJcbn0pO1xyXG5cclxudmFyIG5ld19tYXBfbWVzc190eXBlID0gVC5vYmooe1xyXG5cdGFjdGlvbjogXCJDcmVhdGVcIixcclxuXHR0eXBlOiBcIk1hcFwiLFxyXG5cdHNpemVzOiBtYXBfc2l6ZV90eXBlXHJcbn0pO1xyXG5cclxudmFyIGRyYXdfbWVzc190eXBlID0ge1xyXG5cdGFjdGlvbjogXCJEcmF3XCIsXHJcblx0dHlwZTogXCJNYXBcIixcclxuXHR0b29sOiBcIlBlblwiLFxyXG5cdGNvb3JkczogY29vcmRzX3R5cGUsXHJcblx0dGlsZV9pZDogdGlsZV9pZF90eXBlXHJcbn07XHJcblxyXG52YXIgZHJhd19tZXNzX3R5cGVfd2l0aF9lbXB0eV9jb29yZHMgPSB7XHJcblx0YWN0aW9uOiBcIkRyYXdcIixcclxuXHR0eXBlOiBcIk1hcFwiLFxyXG5cdHRvb2w6IFwiUGVuXCIsXHJcblx0Y29vcmRzOiBULmFueSh1bmRlZmluZWQsIGNvb3Jkc190eXBlKSxcclxuXHR0aWxlX2lkOiB0aWxlX2lkX3R5cGVcclxufTtcclxuXHJcbnZhciBtZXNzX3R5cGVzX29uZSA9IFQuYW55KGRyYXdfbWVzc190eXBlLCBuZXdfdGlsZV9tZXNzX3R5cGUpO1xyXG5cclxudmFyIG1lc3NfdHlwZXNfdHdvID0gVC5hbnkoW1xyXG5cdGRyYXdfbWVzc190eXBlX3dpdGhfZW1wdHlfY29vcmRzLFxyXG5cdG5ld190aWxlX21lc3NfdHlwZSwgXHJcblx0bmV3X21hcF9tZXNzX3R5cGVdKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gW1xyXG5cdGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRpZihtZXNzX3R5cGVzX29uZS50ZXN0KHZhbCkpXHJcblx0XHRcdHRocm93IG1lc3NfdHlwZXNfb25lLnRlc3QodmFsKTtcclxuXHR9LCBcclxuXHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0aWYobWVzc190eXBlc190d28udGVzdCh2YWwpKVxyXG5cdFx0XHR0aHJvdyBtZXNzX3R5cGVzX3R3by50ZXN0KHZhbCk7XHJcblx0fV07XHJcbiIsImNvbnN0IEhlYXIgPSByZXF1aXJlKFwiLi9FdmVudHMuanNcIik7XHJcbmNvbnN0IENyU3dpdGNoRWxlbSA9IHJlcXVpcmUoXCIuL1N3aXRjaC5qc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oRm9ybSwgVG9vbCl7XHJcblxyXG5cdHRoaXMuc3dpdGNoQWRkRm9ybSA9IENyU3dpdGNoRWxlbShcImludmlzXCIsIFwiQWRkRm9ybVwiKTtcclxuXHJcblx0SGVhcihcImFkZF9zd2l0Y2hcIiwgXCJjbGlja1wiLCB0aGlzLnN3aXRjaEFkZEZvcm0pO1xyXG5cclxuXHRIZWFyKFwiQWRkSW1hZ2VJbnB1dFwiLCBcImNoYW5nZVwiLCBmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcy5maWxlc1swXSlcclxuXHRcdFx0Rm9ybS5JbWFnZXMuYWRkKHRoaXMuZmlsZXNbMF0pO1xyXG5cdH0pO1xyXG5cclxuXHRIZWFyKFwiVGlsZXNcIiwgXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcclxuXHRcdGlmKGUudGFyZ2V0LnRpbGUpe1xyXG5cdFx0XHRUb29sLnRpbGUgPSBlLnRhcmdldC50aWxlO1xyXG5cdFx0XHRlLnRhcmdldC5jbGFzc0xpc3QuYWRkKFwicHJlc3NcIik7XHJcblx0XHRcdHNldFRpbWVvdXQoKCk9PmUudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJwcmVzc1wiKSwgMzAwKVxyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxufTsiLCJcclxuXHJcbmNvbnN0IENySW50ZXIgPSByZXF1aXJlKFwiLi9pbnRlci5qc1wiKTtcclxudmFyIFR5cGVzID0gcmVxdWlyZShcIi4vVHlwZXMuanNcIik7XHJcblxyXG5jb25zdCBEaXNwbGF5ID0gcmVxdWlyZShcIi4vRGlzcGxheS5qc1wiKTtcclxuY29uc3QgQ3JMb2dpYyA9IHJlcXVpcmUoXCIuL0xvZ2ljLmpzXCIpO1xyXG5cclxuY29uc3QgRGlzcGxheUludGVyID0gbmV3IENySW50ZXIoKTtcclxuRGlzcGxheUludGVyLnRlc3QoVHlwZXMsIGNvbnNvbGUubG9nKTtcclxuXHJcbkRpc3BsYXkoRGlzcGxheUludGVyKTtcclxuXHJcbkNyTG9naWMoRGlzcGxheUludGVyKTtcclxuXHJcblxyXG5cclxuXHJcbiIsImV4cG9ydHMuZHJhd1RpbGUgPSBmdW5jdGlvbihzdmdfaW1nKXtcclxuXHRcclxuXHR2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcblx0aW1nLnNyYyA9IFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIisgQmFzZTY0LmVuY29kZShzdmdfaW1nKTtcclxuXHJcblx0aW1nLmNsYXNzTGlzdC5hZGQoXCJ0aWxlXCIpO1xyXG5cdFxyXG5cdHJldHVybiBpbWc7XHJcbn1cclxuXHJcbmV4cG9ydHMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKGlkKXtcclxuXHR2YXIgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuXHRpZighZWxlbSkgdGhyb3cgbmV3IEVycm9yKFwiRWxlbSBpcyBub3QgZmluZCFcIik7XHJcblx0cmV0dXJuIGVsZW07XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENySW50ZXJmaWNlKHRlc3RlcywgbG9nKXtcclxuXHR2YXIgaXNfdGVzdCA9IGZhbHNlO1xyXG5cdFxyXG5cdHRoaXMudGVzdCA9IGZ1bmN0aW9uKG5ld190ZXN0ZXMsIG5ld19sb2cpe1xyXG5cdFx0aWYobmV3X3Rlc3Rlcyl7XHJcblx0XHRcdGlmKHR5cGVvZihuZXdfdGVzdGVzWzBdKSA9PSBcImZ1bmN0aW9uXCIgXHJcblx0XHRcdCYmIHR5cGVvZihuZXdfdGVzdGVzWzFdKSA9PSBcImZ1bmN0aW9uXCIpe1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHRlc3RlcyA9IG5ld190ZXN0ZXM7XHJcblx0XHRcdFx0aXNfdGVzdCA9IHRydWU7XHJcblx0XHRcdFx0XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IobmV3IEVycm9yKFwiVGVzdCBpcyBub3QgZnVuY3Rpb24hXCIpKTtcclxuXHRcdFx0XHRpc190ZXN0ID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmKG5ld19sb2cpe1xyXG5cdFx0XHRpZih0eXBlb2YgbmV3X2xvZyA9PSBcImZ1bmN0aW9uXCIpIGxvZyA9IG5ld19sb2c7IGVsc2UgbG9nID0gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0aWYodGVzdGVzKSB0aGlzLnRlc3QodGVzdGVzLCBsb2cpO1xyXG5cdFxyXG5cdHZhciBJbnB1dE9uZSA9IG51bGw7XHJcblx0dmFyIE91dHB1dE9uZSA9IG51bGw7XHJcblx0XHJcblx0dGhpcy5jb25uZWN0ID0gZnVuY3Rpb24ob3V0cHV0RnVuYyl7XHJcblx0XHRpZihPdXRwdXRPbmUpe1xyXG5cdFx0XHRpZihpc190ZXN0KXtcclxuXHRcdFx0XHR2YXIgYmVnRnVuYyA9IG91dHB1dEZ1bmM7XHJcblx0XHRcdFx0b3V0cHV0RnVuYyA9IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdFx0XHR0ZXN0ZXNbMF0odmFsKTtcclxuXHRcdFx0XHRcdGlmKGxvZykgbG9nKFwiIE9uZTogXCIsIHZhbCk7XHJcblx0XHRcdFx0XHRiZWdGdW5jKHZhbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBUd29Db25uZWN0KG91dHB1dEZ1bmMpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZXtcclxuXHRcdFx0aWYoaXNfdGVzdCl7XHJcblx0XHRcdFx0dmFyIGJlZ0Z1bmMgPSBvdXRwdXRGdW5jO1xyXG5cdFx0XHRcdG91dHB1dEZ1bmMgPSBmdW5jdGlvbih2YWwpe1xyXG5cdFx0XHRcdFx0dGVzdGVzWzFdKHZhbCk7XHJcblx0XHRcdFx0XHRpZihsb2cpIGxvZyhcIiBUd286IFwiLCB2YWwpO1xyXG5cdFx0XHRcdFx0YmVnRnVuYyh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gT25lQ29ubmVjdChvdXRwdXRGdW5jKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cdFxyXG5cdGZ1bmN0aW9uIE9uZUNvbm5lY3Qob3V0cHV0RnVuYyl7XHJcblx0XHRPdXRwdXRPbmUgPSBvdXRwdXRGdW5jO1xyXG5cdFx0SW5wdXRPbmUgPSBDckhvYXJkZXIoKTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdElucHV0T25lKHZhbCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIFR3b0Nvbm5lY3Qob3V0cHV0RnVuYyl7XHJcblx0XHRpZihJbnB1dE9uZS50YWtlKSBJbnB1dE9uZS50YWtlKG91dHB1dEZ1bmMpO1xyXG5cdFx0SW5wdXRPbmUgPSBvdXRwdXRGdW5jO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gT3V0cHV0T25lO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ3JIb2FyZGVyKCl7XHJcblx0dmFyIGhvYXJkZXIgPSBbXTtcclxuXHRcclxuXHR2YXIgcHVzaCA9IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRob2FyZGVyLnB1c2godmFsKTtcclxuXHR9O1xyXG5cdFxyXG5cdHB1c2gudGFrZSA9IGZ1bmN0aW9uKGZ1bmMpe1xyXG5cdFx0aWYodHlwZW9mIGZ1bmMgIT0gXCJmdW5jdGlvblwiKSByZXR1cm4gaG9hcmRlcjtcclxuXHRcdFxyXG5cdFx0aG9hcmRlci5mb3JFYWNoKGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdFx0ZnVuYyh2YWwpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdFxyXG5cdHJldHVybiBwdXNoO1xyXG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vQ3JhZnQgb2JqZWN0LnByb3R5cGVcbihmdW5jdGlvbigpe1xuXHRpZiggdHlwZW9mKE9iamVjdC5jclByb3ApID09IFwiZnVuY3Rpb25cIil7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gY29uc3RQcm9wKG5hbWVfcHJvcCwgdmFsdWUsIHZpcywgcmV3cml0ZSl7XG5cdFx0XG5cdFx0aWYodmFsdWUgPT09IHVuZGVmaW5lZCkgdmFsdWUgPSB0cnVlO1xuXHRcdGlmKHZpcyA9PT0gdW5kZWZpbmVkKSB2aXMgPSB0cnVlO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSBPYmplY3QuZnJlZXplKHZhbHVlKTtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZV9wcm9wLCB7XG5cdFx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdFx0ZW51bWVyYWJsZTogdmlzLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IHJld3JpdGUsXG5cdFx0XHRcdHdyaXRhYmxlOiByZXdyaXRlLFxuXHRcdFx0fSk7XG5cdH1cblx0ZnVuY3Rpb24gZ2V0U2V0KG5hbWUsIGdldHRlciwgc2V0dGVyKXtcblx0XHRpZih0eXBlb2Ygc2V0dGVyID09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuXHRcdFx0XHRnZXQ6IGdldHRlcixcblx0XHRcdFx0c2V0OiBzZXR0ZXIsXG5cdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuXHRcdFx0XHRnZXQ6IGdldHRlcixcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0XG5cdGNvbnN0UHJvcC5jYWxsKE9iamVjdC5wcm90b3R5cGUsICdjclByb3AnLCBjb25zdFByb3AsIGZhbHNlKTtcblx0T2JqZWN0LnByb3RvdHlwZS5jclByb3AoJ2FkZEdldFNldCcsIGdldFNldCwgZmFsc2UpO1xuXHRcblx0XG5cdGZ1bmN0aW9uIHJhbmRJbmRleCgpe1xuXHRcdHZhciByYW5kID0gTWF0aC5yb3VuZCgodGhpcy5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkpO1xuXHRcdHJldHVybiB0aGlzW3JhbmRdO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBBZGRJdGVtKHZhbCl7XG5cdFx0aWYoIXRoaXMuX251bGxzKSB0aGlzLl9udWxscyA9IFtdO1xuXHRcdFxuXHRcdGlmKHRoaXMuX251bGxzLmxlbmd0aCl7XG5cdFx0XHR2YXIgaW5kID0gdGhpcy5fbnVsbHMucG9wKCk7XG5cdFx0XHR0aGlzW2luZF0gPSB2YWw7XG5cdFx0XHRyZXR1cm4gaW5kO1xuXHRcdH1lbHNle1xuXHRcdFx0cmV0dXJuIHRoaXMucHVzaCh2YWwpIC0gMTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIERlbGxJdGVtKGluZCl7XG5cdFx0aWYoaW5kID4gdGhpcy5sZW5ndGggLTEpIHJldHVybiBmYWxzZTtcblx0XHRcblx0XHRpZihpbmQgPT0gdGhpcy5sZW5ndGggLTEpe1xuXHRcdFx0dGhpcy5wb3AoKTtcblx0XHR9ZWxzZXtcblx0XHRcdGlmKCF0aGlzLl9udWxscykgdGhpcy5fbnVsbHMgPSBbXTtcblx0XHRcdFxuXHRcdFx0dGhpc1tpbmRdID0gdW5kZWZpbmVkO1xuXHRcdFx0dGhpcy5fbnVsbHMucHVzaChpbmQpO1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gdHJ1ZTtcdFxuXHR9XG5cdFxuXHRmdW5jdGlvbiBjcmVhdGVBcnIodmFsLCBsZW5ndGgsIGlzX2NhbGwpe1xuXHRcdHZhciBhcnIgPSBbXTtcblx0XHRcblx0XHRpZighbGVuZ3RoKSBsZW5ndGggPSAxO1xuXHRcdGlmKGlzX2NhbGwgPT09IHVuZGVmaW5lZCkgaXNfY2FsbCA9IHRydWU7XG5cdFx0XG5cdFx0aWYodHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nICYmIGlzX2NhbGwpe1xuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKXtcblx0XHRcdFx0YXJyLnB1c2godmFsKGksIGFycikpO1xuXHRcdFx0fVxuXHRcdH1lbHNlIGlmKHZhbCAhPT0gdW5kZWZpbmVkKXtcblx0XHRcdFxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKXtcblx0XHRcdFx0YXJyLnB1c2godmFsKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRhcnIuY3JQcm9wKCdyYW5kX2knLCByYW5kSW5kZXgpO1xuXHRcdGFyci5jclByb3AoJ2FkZCcsIEFkZEl0ZW0pO1xuXHRcdGFyci5jclByb3AoJ2RlbGwnLCBEZWxsSXRlbSk7XG5cdFx0XG5cdFx0cmV0dXJuIGFycjtcblx0fVxuXHRcblx0XG5cdFxuXHRBcnJheS5jclByb3AoJ2NyZWF0ZScsIGNyZWF0ZUFycik7XG5cdFxuXHRcblx0aWYoUmVnRXhwLnByb3RvdHlwZS50b0pTT04gIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0UmVnRXhwLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5zb3VyY2U7IH07XG5cdH1cblxufSkoKTtcblxuXG5cblxuIiwiLypcbiAqICBiYXNlNjQuanNcbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLlxuICogICAgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICpcbiAqICBSZWZlcmVuY2VzOlxuICogICAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjRcbiAqL1xuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGdsb2JhbClcbiAgICAgICAgOiB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWRcbiAgICAgICAgPyBkZWZpbmUoZmFjdG9yeSkgOiBmYWN0b3J5KGdsb2JhbClcbn0oKFxuICAgIHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGZcbiAgICAgICAgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvd1xuICAgICAgICA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsXG46IHRoaXNcbiksIGZ1bmN0aW9uKGdsb2JhbCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBleGlzdGluZyB2ZXJzaW9uIGZvciBub0NvbmZsaWN0KClcbiAgICBnbG9iYWwgPSBnbG9iYWwgfHwge307XG4gICAgdmFyIF9CYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgIHZhciB2ZXJzaW9uID0gXCIyLjUuMVwiO1xuICAgIC8vIGlmIG5vZGUuanMgYW5kIE5PVCBSZWFjdCBOYXRpdmUsIHdlIHVzZSBCdWZmZXJcbiAgICB2YXIgYnVmZmVyO1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYnVmZmVyID0gZXZhbChcInJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlclwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBidWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc3RhbnRzXG4gICAgdmFyIGI2NGNoYXJzXG4gICAgICAgID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuICAgIHZhciBiNjR0YWIgPSBmdW5jdGlvbihiaW4pIHtcbiAgICAgICAgdmFyIHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBiaW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB0W2Jpbi5jaGFyQXQoaSldID0gaTtcbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfShiNjRjaGFycyk7XG4gICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG4gICAgLy8gZW5jb2RlciBzdHVmZlxuICAgIHZhciBjYl91dG9iID0gZnVuY3Rpb24oYykge1xuICAgICAgICBpZiAoYy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICB2YXIgY2MgPSBjLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgICByZXR1cm4gY2MgPCAweDgwID8gY1xuICAgICAgICAgICAgICAgIDogY2MgPCAweDgwMCA/IChmcm9tQ2hhckNvZGUoMHhjMCB8IChjYyA+Pj4gNikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoY2MgJiAweDNmKSkpXG4gICAgICAgICAgICAgICAgOiAoZnJvbUNoYXJDb2RlKDB4ZTAgfCAoKGNjID4+PiAxMikgJiAweDBmKSlcbiAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKChjYyA+Pj4gIDYpICYgMHgzZikpXG4gICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICggY2MgICAgICAgICAmIDB4M2YpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgY2MgPSAweDEwMDAwXG4gICAgICAgICAgICAgICAgKyAoYy5jaGFyQ29kZUF0KDApIC0gMHhEODAwKSAqIDB4NDAwXG4gICAgICAgICAgICAgICAgKyAoYy5jaGFyQ29kZUF0KDEpIC0gMHhEQzAwKTtcbiAgICAgICAgICAgIHJldHVybiAoZnJvbUNoYXJDb2RlKDB4ZjAgfCAoKGNjID4+PiAxOCkgJiAweDA3KSlcbiAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICgoY2MgPj4+IDEyKSAmIDB4M2YpKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKChjYyA+Pj4gIDYpICYgMHgzZikpXG4gICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoIGNjICAgICAgICAgJiAweDNmKSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcmVfdXRvYiA9IC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZGXXxbXlxceDAwLVxceDdGXS9nO1xuICAgIHZhciB1dG9iID0gZnVuY3Rpb24odSkge1xuICAgICAgICByZXR1cm4gdS5yZXBsYWNlKHJlX3V0b2IsIGNiX3V0b2IpO1xuICAgIH07XG4gICAgdmFyIGNiX2VuY29kZSA9IGZ1bmN0aW9uKGNjYykge1xuICAgICAgICB2YXIgcGFkbGVuID0gWzAsIDIsIDFdW2NjYy5sZW5ndGggJSAzXSxcbiAgICAgICAgb3JkID0gY2NjLmNoYXJDb2RlQXQoMCkgPDwgMTZcbiAgICAgICAgICAgIHwgKChjY2MubGVuZ3RoID4gMSA/IGNjYy5jaGFyQ29kZUF0KDEpIDogMCkgPDwgOClcbiAgICAgICAgICAgIHwgKChjY2MubGVuZ3RoID4gMiA/IGNjYy5jaGFyQ29kZUF0KDIpIDogMCkpLFxuICAgICAgICBjaGFycyA9IFtcbiAgICAgICAgICAgIGI2NGNoYXJzLmNoYXJBdCggb3JkID4+PiAxOCksXG4gICAgICAgICAgICBiNjRjaGFycy5jaGFyQXQoKG9yZCA+Pj4gMTIpICYgNjMpLFxuICAgICAgICAgICAgcGFkbGVuID49IDIgPyAnPScgOiBiNjRjaGFycy5jaGFyQXQoKG9yZCA+Pj4gNikgJiA2MyksXG4gICAgICAgICAgICBwYWRsZW4gPj0gMSA/ICc9JyA6IGI2NGNoYXJzLmNoYXJBdChvcmQgJiA2MylcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xuICAgIH07XG4gICAgdmFyIGJ0b2EgPSBnbG9iYWwuYnRvYSA/IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5idG9hKGIpO1xuICAgIH0gOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBiLnJlcGxhY2UoL1tcXHNcXFNdezEsM30vZywgY2JfZW5jb2RlKTtcbiAgICB9O1xuICAgIHZhciBfZW5jb2RlID0gYnVmZmVyID9cbiAgICAgICAgYnVmZmVyLmZyb20gJiYgVWludDhBcnJheSAmJiBidWZmZXIuZnJvbSAhPT0gVWludDhBcnJheS5mcm9tXG4gICAgICAgID8gZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAodS5jb25zdHJ1Y3RvciA9PT0gYnVmZmVyLmNvbnN0cnVjdG9yID8gdSA6IGJ1ZmZlci5mcm9tKHUpKVxuICAgICAgICAgICAgICAgIC50b1N0cmluZygnYmFzZTY0JylcbiAgICAgICAgfVxuICAgICAgICA6ICBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuICh1LmNvbnN0cnVjdG9yID09PSBidWZmZXIuY29uc3RydWN0b3IgPyB1IDogbmV3ICBidWZmZXIodSkpXG4gICAgICAgICAgICAgICAgLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24gKHUpIHsgcmV0dXJuIGJ0b2EodXRvYih1KSkgfVxuICAgIDtcbiAgICB2YXIgZW5jb2RlID0gZnVuY3Rpb24odSwgdXJpc2FmZSkge1xuICAgICAgICByZXR1cm4gIXVyaXNhZmVcbiAgICAgICAgICAgID8gX2VuY29kZShTdHJpbmcodSkpXG4gICAgICAgICAgICA6IF9lbmNvZGUoU3RyaW5nKHUpKS5yZXBsYWNlKC9bK1xcL10vZywgZnVuY3Rpb24obTApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbTAgPT0gJysnID8gJy0nIDogJ18nO1xuICAgICAgICAgICAgfSkucmVwbGFjZSgvPS9nLCAnJyk7XG4gICAgfTtcbiAgICB2YXIgZW5jb2RlVVJJID0gZnVuY3Rpb24odSkgeyByZXR1cm4gZW5jb2RlKHUsIHRydWUpIH07XG4gICAgLy8gZGVjb2RlciBzdHVmZlxuICAgIHZhciByZV9idG91ID0gbmV3IFJlZ0V4cChbXG4gICAgICAgICdbXFx4QzAtXFx4REZdW1xceDgwLVxceEJGXScsXG4gICAgICAgICdbXFx4RTAtXFx4RUZdW1xceDgwLVxceEJGXXsyfScsXG4gICAgICAgICdbXFx4RjAtXFx4RjddW1xceDgwLVxceEJGXXszfSdcbiAgICBdLmpvaW4oJ3wnKSwgJ2cnKTtcbiAgICB2YXIgY2JfYnRvdSA9IGZ1bmN0aW9uKGNjY2MpIHtcbiAgICAgICAgc3dpdGNoKGNjY2MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHZhciBjcCA9ICgoMHgwNyAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgMTgpXG4gICAgICAgICAgICAgICAgfCAgICAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDEyKVxuICAgICAgICAgICAgICAgIHwgICAgKCgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKSA8PCAgNilcbiAgICAgICAgICAgICAgICB8ICAgICAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgzKSksXG4gICAgICAgICAgICBvZmZzZXQgPSBjcCAtIDB4MTAwMDA7XG4gICAgICAgICAgICByZXR1cm4gKGZyb21DaGFyQ29kZSgob2Zmc2V0ICA+Pj4gMTApICsgMHhEODAwKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgob2Zmc2V0ICYgMHgzRkYpICsgMHhEQzAwKSk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBmcm9tQ2hhckNvZGUoXG4gICAgICAgICAgICAgICAgKCgweDBmICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCAxMilcbiAgICAgICAgICAgICAgICAgICAgfCAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpIDw8IDYpXG4gICAgICAgICAgICAgICAgICAgIHwgICgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDIpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAgZnJvbUNoYXJDb2RlKFxuICAgICAgICAgICAgICAgICgoMHgxZiAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgNilcbiAgICAgICAgICAgICAgICAgICAgfCAgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMSkpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgYnRvdSA9IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIGIucmVwbGFjZShyZV9idG91LCBjYl9idG91KTtcbiAgICB9O1xuICAgIHZhciBjYl9kZWNvZGUgPSBmdW5jdGlvbihjY2NjKSB7XG4gICAgICAgIHZhciBsZW4gPSBjY2NjLmxlbmd0aCxcbiAgICAgICAgcGFkbGVuID0gbGVuICUgNCxcbiAgICAgICAgbiA9IChsZW4gPiAwID8gYjY0dGFiW2NjY2MuY2hhckF0KDApXSA8PCAxOCA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAxID8gYjY0dGFiW2NjY2MuY2hhckF0KDEpXSA8PCAxMiA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAyID8gYjY0dGFiW2NjY2MuY2hhckF0KDIpXSA8PCAgNiA6IDApXG4gICAgICAgICAgICB8IChsZW4gPiAzID8gYjY0dGFiW2NjY2MuY2hhckF0KDMpXSAgICAgICA6IDApLFxuICAgICAgICBjaGFycyA9IFtcbiAgICAgICAgICAgIGZyb21DaGFyQ29kZSggbiA+Pj4gMTYpLFxuICAgICAgICAgICAgZnJvbUNoYXJDb2RlKChuID4+PiAgOCkgJiAweGZmKSxcbiAgICAgICAgICAgIGZyb21DaGFyQ29kZSggbiAgICAgICAgICYgMHhmZilcbiAgICAgICAgXTtcbiAgICAgICAgY2hhcnMubGVuZ3RoIC09IFswLCAwLCAyLCAxXVtwYWRsZW5dO1xuICAgICAgICByZXR1cm4gY2hhcnMuam9pbignJyk7XG4gICAgfTtcbiAgICB2YXIgX2F0b2IgPSBnbG9iYWwuYXRvYiA/IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5hdG9iKGEpO1xuICAgIH0gOiBmdW5jdGlvbihhKXtcbiAgICAgICAgcmV0dXJuIGEucmVwbGFjZSgvXFxTezEsNH0vZywgY2JfZGVjb2RlKTtcbiAgICB9O1xuICAgIHZhciBhdG9iID0gZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gX2F0b2IoU3RyaW5nKGEpLnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJykpO1xuICAgIH07XG4gICAgdmFyIF9kZWNvZGUgPSBidWZmZXIgP1xuICAgICAgICBidWZmZXIuZnJvbSAmJiBVaW50OEFycmF5ICYmIGJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb21cbiAgICAgICAgPyBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgICAgICA/IGEgOiBidWZmZXIuZnJvbShhLCAnYmFzZTY0JykpLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICByZXR1cm4gKGEuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgICAgICA/IGEgOiBuZXcgYnVmZmVyKGEsICdiYXNlNjQnKSkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGJ0b3UoX2F0b2IoYSkpIH07XG4gICAgdmFyIGRlY29kZSA9IGZ1bmN0aW9uKGEpe1xuICAgICAgICByZXR1cm4gX2RlY29kZShcbiAgICAgICAgICAgIFN0cmluZyhhKS5yZXBsYWNlKC9bLV9dL2csIGZ1bmN0aW9uKG0wKSB7IHJldHVybiBtMCA9PSAnLScgPyAnKycgOiAnLycgfSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9dL2csICcnKVxuICAgICAgICApO1xuICAgIH07XG4gICAgdmFyIG5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIEJhc2U2NCA9IGdsb2JhbC5CYXNlNjQ7XG4gICAgICAgIGdsb2JhbC5CYXNlNjQgPSBfQmFzZTY0O1xuICAgICAgICByZXR1cm4gQmFzZTY0O1xuICAgIH07XG4gICAgLy8gZXhwb3J0IEJhc2U2NFxuICAgIGdsb2JhbC5CYXNlNjQgPSB7XG4gICAgICAgIFZFUlNJT046IHZlcnNpb24sXG4gICAgICAgIGF0b2I6IGF0b2IsXG4gICAgICAgIGJ0b2E6IGJ0b2EsXG4gICAgICAgIGZyb21CYXNlNjQ6IGRlY29kZSxcbiAgICAgICAgdG9CYXNlNjQ6IGVuY29kZSxcbiAgICAgICAgdXRvYjogdXRvYixcbiAgICAgICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgICAgIGVuY29kZVVSSTogZW5jb2RlVVJJLFxuICAgICAgICBidG91OiBidG91LFxuICAgICAgICBkZWNvZGU6IGRlY29kZSxcbiAgICAgICAgbm9Db25mbGljdDogbm9Db25mbGljdCxcbiAgICAgICAgX19idWZmZXJfXzogYnVmZmVyXG4gICAgfTtcbiAgICAvLyBpZiBFUzUgaXMgYXZhaWxhYmxlLCBtYWtlIEJhc2U2NC5leHRlbmRTdHJpbmcoKSBhdmFpbGFibGVcbiAgICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgbm9FbnVtID0gZnVuY3Rpb24odil7XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOnYsZW51bWVyYWJsZTpmYWxzZSx3cml0YWJsZTp0cnVlLGNvbmZpZ3VyYWJsZTp0cnVlfTtcbiAgICAgICAgfTtcbiAgICAgICAgZ2xvYmFsLkJhc2U2NC5leHRlbmRTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgU3RyaW5nLnByb3RvdHlwZSwgJ2Zyb21CYXNlNjQnLCBub0VudW0oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlKHRoaXMpXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIFN0cmluZy5wcm90b3R5cGUsICd0b0Jhc2U2NCcsIG5vRW51bShmdW5jdGlvbiAodXJpc2FmZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jb2RlKHRoaXMsIHVyaXNhZmUpXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIFN0cmluZy5wcm90b3R5cGUsICd0b0Jhc2U2NFVSSScsIG5vRW51bShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGUodGhpcywgdHJ1ZSlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vXG4gICAgLy8gZXhwb3J0IEJhc2U2NCB0byB0aGUgbmFtZXNwYWNlXG4gICAgLy9cbiAgICBpZiAoZ2xvYmFsWydNZXRlb3InXSkgeyAvLyBNZXRlb3IuanNcbiAgICAgICAgQmFzZTY0ID0gZ2xvYmFsLkJhc2U2NDtcbiAgICB9XG4gICAgLy8gbW9kdWxlLmV4cG9ydHMgYW5kIEFNRCBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLlxuICAgIC8vIG1vZHVsZS5leHBvcnRzIGhhcyBwcmVjZWRlbmNlLlxuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5CYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCl7IHJldHVybiBnbG9iYWwuQmFzZTY0IH0pO1xuICAgIH1cbiAgICAvLyB0aGF0J3MgaXQhXG4gICAgcmV0dXJuIHtCYXNlNjQ6IGdsb2JhbC5CYXNlNjR9XG59KSk7XG4iLCIvL0NyYWYgU3RyaW5nXG4oZnVuY3Rpb24oKXtcblx0aWYodHlwZW9mKE9iamVjdC50eXBlcykgIT09IFwib2JqZWN0XCIpIHJldHVybjtcblxuXHR2YXIgVCA9IE9iamVjdC50eXBlcztcblx0dmFyIERvYyA9IFQuZG9jO1xuXG5cdGZ1bmN0aW9uIHJlcGxhY2VTcGVjQ2hhcihjKXtcblx0XHRzd2l0Y2goYyl7XG5cdFx0XHRjYXNlICd3JzogcmV0dXJuICdhLXpBLVowLTlfJztcblx0XHRcdGNhc2UgJ2QnOiByZXR1cm4gJzAtOSc7XG5cdFx0XHRjYXNlICdzJzogcmV0dXJuICdcXFxcdFxcXFxuXFxcXHZcXFxcZlxcXFxyICc7XG5cblx0XHRcdGRlZmF1bHQ6IHJldHVybiBjO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmdlSW5BcnIoYmVnLCBlbmQpe1xuXHRcdGlmKGJlZyA+IGVuZCl7XG5cdFx0XHR2YXIgdG1wID0gYmVnO1xuXHRcdFx0YmVnID0gZW5kO1xuXHRcdFx0ZW5kID0gdG1wO1xuXHRcdH1cblxuXHRcdHZhciBhcnIgPSBbXTtcblx0XHRmb3IodmFyIGkgPSBiZWc7IGkgPD0gZW5kOyBpKyspe1xuXHRcdFx0YXJyLnB1c2goaSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFycjtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlUmFuZ2UocGFyc2Vfc3RyKXtcblx0XHRpZigvXFxcXC4vLnRlc3QocGFyc2Vfc3RyKSl7XG5cdFx0XHRcdHBhcnNlX3N0ciA9IHBhcnNlX3N0ci5yZXBsYWNlKC9cXFxcKC4pL2csIGZ1bmN0aW9uKHN0ciwgY2hhcil7IHJldHVybiByZXBsYWNlU3BlY0NoYXIoY2hhcik7fSk7XG5cdFx0fVxuXG5cdFx0dmFyIHJlc3VsdCA9IFtdO1xuXG5cdFx0dmFyIGJlZ19jaGFyID0gcGFyc2Vfc3RyWzBdO1xuXHRcdGZvcih2YXIgaSA9IDE7IGkgPD0gcGFyc2Vfc3RyLmxlbmd0aDsgaSsrKXtcblxuXHRcdFx0aWYocGFyc2Vfc3RyW2ktMV0gIT09ICdcXFxcJ1xuXHRcdFx0XHQmJnBhcnNlX3N0cltpXSA9PT0gJy0nXG5cdFx0XHRcdCYmcGFyc2Vfc3RyW2krMV0pe1xuXHRcdFx0XHRpKys7XG5cdFx0XHRcdHZhciBlbmRfY2hhciA9IHBhcnNlX3N0cltpXTtcblxuXHRcdFx0XHR2YXIgYXJyX2NoYXJzID0gcmFuZ2VJbkFycihiZWdfY2hhci5jaGFyQ29kZUF0KDApLCBlbmRfY2hhci5jaGFyQ29kZUF0KDApKTtcblx0XHRcdFx0cmVzdWx0ID0gcmVzdWx0LmNvbmNhdChhcnJfY2hhcnMpO1xuXG5cdFx0XHRcdGkrKztcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyZXN1bHQucHVzaChiZWdfY2hhci5jaGFyQ29kZUF0KDApKTtcblx0XHRcdH1cblxuXHRcdFx0YmVnX2NoYXIgPSBwYXJzZV9zdHJbaV07XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmdW5jdGlvbiByYW5kSW5kZXgoYXJyKXtcblx0XHR2YXIgcmFuZCA9IE1hdGgucm91bmQoKGFyci5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkpO1xuXHRcdHJldHVybiBhcnJbcmFuZF07XG5cdH1cblxuXHRmdW5jdGlvbiByYW5kQ2hhcnMoY2hhcnNfYXJyLCBzaXplKXtcblx0XHRzaXplID0gVC5pbnQoc2l6ZSwgMSkucmFuZCgpO1xuXHRcdHZhciBzdHIgPSAnJztcblx0XHR3aGlsZShzaXplKXtcblx0XHRcdHZhciBkZXIgPSByYW5kSW5kZXgoY2hhcnNfYXJyKTtcblx0XHRcdHN0ciArPVN0cmluZy5mcm9tQ2hhckNvZGUoZGVyKTtcblx0XHRcdHNpemUtLTtcblx0XHR9XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRTdHIocmFuZ2UsIHNpemUpe1xuXG5cdFx0dmFyIHBhcnNlX3JhbmdlID0gKHJhbmdlLnNvdXJjZSkubWF0Y2goL1xcXlxcWygoXFxcXFxcXXwuKSopXFxdXFwqXFwkLyk7XG5cblx0XHRpZighcGFyc2VfcmFuZ2UpIHRocm93IFQuZXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IHJhbmdlKFJlZ0V4cCgvXltcXHddLiQvKSksIHNpemUoMDw9bnVtYmVyKScpO1xuXG5cdFx0dmFyIGNoYXJzID0gcGFyc2VSYW5nZShwYXJzZV9yYW5nZVsxXSk7XG5cblx0XHRyZXR1cm4gcmFuZENoYXJzLmJpbmQobnVsbCwgY2hhcnMsIHNpemUpO1xuXG5cblx0fVxuXG5cdGZ1bmN0aW9uIHRlc3RTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHIpe1xuXHRcdFx0aWYodHlwZW9mKHN0cikgIT09ICdzdHJpbmcnKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBzdHJpbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHN0ci5sZW5ndGggPiBzaXplKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIkxlbmd0aCBzdHJpbmcgaXMgd3JvbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFyYW5nZS50ZXN0KHN0cikpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkb2NTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBULmRvYy5nZW4uYmluZChudWxsLCBcInN0clwiLCB7IHJhbmdlOiByYW5nZSwgbGVuZ3RoOiBzaXplfSk7XG5cdH1cblxuXG5cdHZhciBkZWZfc2l6ZSA9IDE3O1xuXHR2YXIgZGVmX3JhbmdlID0gL15bXFx3XSokLztcblxuXHRmdW5jdGlvbiBuZXdTdHIocmFuZ2UsIHNpemUpe1xuXHRcdGlmKHJhbmdlID09PSBudWxsKSByYW5nZSA9IGRlZl9yYW5nZTtcblx0XHRpZihzaXplID09PSB1bmRlZmluZWQpIHNpemUgPSBkZWZfc2l6ZTtcblxuXHRcdGlmKHR5cGVvZiByYW5nZSA9PSBcInN0cmluZ1wiKSByYW5nZSA9IG5ldyBSZWdFeHAocmFuZ2UpO1xuXG5cblx0XHRpZihULnBvcy50ZXN0KHNpemUpIHx8ICEocmFuZ2UgaW5zdGFuY2VvZiBSZWdFeHApKXtcblx0XHRcdFx0dGhyb3cgVC5lcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogcmFuZ2UoUmVnRXhwKSwgc2l6ZSgwPD1udW1iZXIpJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJhbmQ6IHJhbmRTdHIocmFuZ2UsIHNpemUpLFxuXHRcdFx0dGVzdDogdGVzdFN0cihyYW5nZSwgc2l6ZSksXG5cdFx0XHRkb2M6IGRvY1N0cihyYW5nZSwgc2l6ZSlcblx0XHR9O1xuXHR9XG5cblxuXG5cdFQubmV3VHlwZSgnc3RyJyxcblx0e1xuXHRcdG5hbWU6IFwiU3RyaW5nXCIsXG5cdFx0YXJnOiBbXCJyYW5nZVwiLCBcImxlbmd0aFwiXSxcblx0XHRwYXJhbXM6IHtcblx0XHRcdFx0cmFuZ2U6IHt0eXBlOiAnUmVnRXhwIHx8IHN0cicsIGRlZmF1bHRfdmFsdWU6IGRlZl9yYW5nZX0sXG5cdFx0XHRcdGxlbmd0aDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiBkZWZfc2l6ZX1cblx0XHR9XG5cdH0sXG5cdHtcblx0XHROZXc6IG5ld1N0cixcblx0XHR0ZXN0OiB0ZXN0U3RyKGRlZl9yYW5nZSwgZGVmX3NpemUpLFxuXHRcdHJhbmQ6IHJhbmRTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSksXG5cdFx0ZG9jOiBkb2NTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSlcblx0fSk7XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubmV3IChmdW5jdGlvbigpe1xuXG5cdGlmKHR5cGVvZihPYmplY3QudHlwZXMpID09IFwib2JqZWN0XCIpe1xuXHRcdHJldHVybiBPYmplY3QudHlwZXM7XG5cdH1cblxuXHRpZihSZWdFeHAucHJvdG90eXBlLnRvSlNPTiAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRSZWdFeHAucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnNvdXJjZTsgfTtcblx0fVxuXG5cdHZhciBUID0gdGhpcztcblx0dmFyIERvYyA9IHtcblx0XHR0eXBlczp7XG5cdFx0XHQnYm9vbCc6e1xuXHRcdFx0XHRuYW1lOiBcIkJvb2xlYW5cIixcblx0XHRcdFx0YXJnOiBbXVxuXHRcdFx0fSxcblx0XHRcdCdjb25zdCc6IHtcblx0XHRcdFx0bmFtZTogXCJDb25zdGFudFwiLFxuXHRcdFx0XHRhcmc6IFtcInZhbHVlXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHsgdmFsdWU6IHt0eXBlOiBcIlNvbWV0aGluZ1wiLCBkZWZhdWx0X3ZhbHVlOiBudWxsfX1cblx0XHRcdH0sXG5cdFx0XHQncG9zJzoge1xuXHRcdFx0XHRuYW1lOiBcIlBvc2l0aW9uXCIsXG5cdFx0XHRcdGFyZzogWydtYXgnXSxcblx0XHRcdFx0cGFyYW1zOiB7bWF4OiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6ICsyMTQ3NDgzNjQ3fX1cblxuXHRcdFx0fSxcblxuXHRcdFx0J2ludCc6IHtcblx0XHRcdFx0bmFtZTogXCJJbnRlZ2VyXCIsXG5cdFx0XHRcdGFyZzogW1wibWF4XCIsIFwibWluXCIsIFwic3RlcFwiXSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0XHRtYXg6IHt0eXBlOiAnaW50JywgZGVmYXVsdF92YWx1ZTogKzIxNDc0ODM2NDd9LFxuXHRcdFx0XHRcdFx0bWluOiB7dHlwZTogJ2ludCcsIGRlZmF1bHRfdmFsdWU6IC0yMTQ3NDgzNjQ4fSxcblx0XHRcdFx0XHRcdHN0ZXA6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogMX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHQnbnVtJzoge1xuXHRcdFx0XHRuYW1lOiBcIk51bWJlclwiLFxuXHRcdFx0XHRhcmc6IFtcIm1heFwiLCBcIm1pblwiLCBcInByZWNpc1wiXSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0XHRtYXg6IHt0eXBlOiAnbnVtJywgZGVmYXVsdF92YWx1ZTogKzIxNDc0ODM2NDd9LFxuXHRcdFx0XHRcdFx0bWluOiB7dHlwZTogJ251bScsIGRlZmF1bHRfdmFsdWU6IC0yMTQ3NDgzNjQ4fSxcblx0XHRcdFx0XHRcdHByZWNpczoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiA5fVxuXHRcdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHQnYXJyJzoge1xuXHRcdFx0XHRuYW1lOiBcIkFycmF5XCIsXG5cdFx0XHRcdGFyZzogW1widHlwZXNcIiwgXCJzaXplXCIsIFwiZml4ZWRcIl0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0dHlwZXM6IHt0eXBlOiBcIlR5cGUgfHwgW1R5cGUsIFR5cGUuLi5dXCIsIGdldCBkZWZhdWx0X3ZhbHVlKCl7cmV0dXJuIFQucG9zfX0sXG5cdFx0XHRcdFx0XHRzaXplOiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6IDd9LFxuXHRcdFx0XHRcdFx0Zml4ZWQ6IHt0eXBlOiAnYm9vbCcsIGRlZmF1bHRfdmFsdWU6IHRydWV9XG5cdFx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdhbnknOiB7XG5cdFx0XHRcdG5hbWU6IFwiTWl4VHlwZVwiLFxuXHRcdFx0XHRhcmc6IFtcInR5cGVzXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdHR5cGVzOiB7dHlwZTogXCJUeXBlLCBUeXBlLi4uIHx8IFtUeXBlLCBUeXBlLi4uXVwiLCBnZXQgZGVmYXVsdF92YWx1ZSgpe3JldHVybiBbVC5wb3MsIFQuc3RyXX19XG5cdFx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdvYmonOiB7XG5cdFx0XHRcdG5hbWU6IFwiT2JqZWN0XCIsXG5cdFx0XHRcdGFyZzogW1widHlwZXNcIl0sXG5cdFx0XHRcdHBhcmFtczoge3R5cGVzOiB7dHlwZTogXCJPYmplY3RcIiwgZGVmYXVsdF92YWx1ZToge319fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0Q29uc3Q6IGZ1bmN0aW9uKG5hbWVfdHlwZSwgbmFtZV9saW1pdCl7XG5cdFx0XHRyZXR1cm4gdGhpcy50eXBlc1tuYW1lX3R5cGVdLnBhcmFtc1tuYW1lX2xpbWl0XS5kZWZhdWx0X3ZhbHVlO1xuXHRcdH1cblx0fTtcblx0dGhpcy5kb2MgPSB7fTtcblx0dGhpcy5kb2MuanNvbiA9IEpTT04uc3RyaW5naWZ5KERvYywgXCJcIiwgMik7XG5cblx0RG9jLmdlbkRvYyA9IChmdW5jdGlvbihuYW1lLCBwYXJhbXMpe3JldHVybiB7bmFtZTogdGhpcy50eXBlc1tuYW1lXS5uYW1lLCBwYXJhbXM6IHBhcmFtc319KS5iaW5kKERvYyk7XG5cdHRoaXMuZG9jLmdlbiA9IERvYy5nZW5Eb2M7XG5cblxuXG5cblx0Ly9FcnJvc1xuXHRmdW5jdGlvbiBhcmdUeXBlRXJyb3Iod3JvbmdfYXJnLCBtZXNzKXtcblx0XHRpZihtZXNzID09PSB1bmRlZmluZWQpIG1lc3MgPSAnJztcblx0XHR2YXIgRVIgPSBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCB0eXBlIGlzIHdyb25nISBBcmd1bWVudHMoJyArIGZvckFyZyh3cm9uZ19hcmcpICsgJyk7JyArIG1lc3MpO1xuXHRcdEVSLndyb25nX2FyZyA9IHdyb25nX2FyZztcblxuXHRcdGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHRcdFx0RXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoRVIsIGFyZ1R5cGVFcnJvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEVSO1xuXG5cdFx0ZnVuY3Rpb24gZm9yQXJnKGFyZ3Mpe1xuXHRcdFx0dmFyIHN0cl9hcmdzID0gJyc7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdHN0cl9hcmdzICs9IHR5cGVvZihhcmdzW2ldKSArICc6ICcgKyBhcmdzW2ldICsgJzsgJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdHJfYXJncztcblx0XHR9XG5cdH1cblx0VC5lcnJvciA9IGFyZ1R5cGVFcnJvcjtcblxuXHRmdW5jdGlvbiB0eXBlU3ludGF4RXJyb3Iod3Jvbmdfc3RyLCBtZXNzKXtcblx0XHRpZihtZXNzID09PSB1bmRlZmluZWQpIG1lc3MgPSAnJztcblx0XHR2YXIgRVIgPSBuZXcgU3ludGF4RXJyb3IoJ0xpbmU6ICcgKyB3cm9uZ19zdHIgKyAnOyAnICsgbWVzcyk7XG5cdFx0RVIud3JvbmdfYXJnID0gd3Jvbmdfc3RyO1xuXG5cdFx0aWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShFUiwgdHlwZVN5bnRheEVycm9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gRVI7XG5cdH1cblxuXG5cblx0ZnVuY3Rpb24gQ3JlYXRlQ3JlYXRvcihOZXcsIHRlc3QsIHJhbmQsIGRvYyl7XG5cdFx0dmFyIGNyZWF0b3I7XG5cdFx0aWYodHlwZW9mIE5ldyA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdGNyZWF0b3IgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgdG1wX29iaiA9IE5ldy5hcHBseSh7fSwgYXJndW1lbnRzKTtcblx0XHRcdFx0dmFyIG5ld19jcmVhdG9yID0gbmV3IENyZWF0ZUNyZWF0b3IoTmV3LCB0bXBfb2JqLnRlc3QsIHRtcF9vYmoucmFuZCwgdG1wX29iai5kb2MpO1xuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIG5ld19jcmVhdG9yO1xuXHRcdFx0fTtcblx0XHR9ZWxzZSBjcmVhdG9yID0gZnVuY3Rpb24oKXtyZXR1cm4gY3JlYXRvcn07XG5cblx0XHRjcmVhdG9yLmlzX2NyZWF0b3IgPSB0cnVlO1xuXHRcdGlmKHR5cGVvZiB0ZXN0ID09PSBcImZ1bmN0aW9uXCIpIGNyZWF0b3IudGVzdCA9IHRlc3Q7XG5cdFx0aWYodHlwZW9mIHJhbmQgPT09IFwiZnVuY3Rpb25cIikgY3JlYXRvci5yYW5kID0gcmFuZDtcblx0XHRpZih0eXBlb2YgZG9jID09PSBcImZ1bmN0aW9uXCIpIGNyZWF0b3IuZG9jID0gZG9jO1xuXG5cdFx0cmV0dXJuIE9iamVjdC5mcmVlemUoY3JlYXRvcik7XG5cdH1cblx0dGhpcy5uZXdUeXBlID0gZnVuY3Rpb24oa2V5LCBkZXNjLCBuZXdfdHlwZSl7XG5cdFx0RG9jLnR5cGVzW2tleV0gPSBkZXNjO1xuXHRcdFQubmFtZXNbZGVzYy5uYW1lXSA9IGtleTtcblx0XHR0aGlzLmRvYy5qc29uID0gSlNPTi5zdHJpbmdpZnkoRG9jLCBcIlwiLCAyKTtcblxuXHRcdHRoaXNba2V5XSA9IG5ldyBDcmVhdGVDcmVhdG9yKG5ld190eXBlLk5ldywgbmV3X3R5cGUudGVzdCwgbmV3X3R5cGUucmFuZCwgbmV3X3R5cGUuZG9jKTtcblx0fVxuXHR0aGlzLm5ld1R5cGUuZG9jID0gJyhuYW1lLCBjb25zdHJ1Y3RvciwgZnVuY1Rlc3QsIGZ1bmNSYW5kLCBmdW5jRG9jKSc7XG5cblxuXG5cdC8vQ3JhZnQgQm9vbGVhblxuXHRcdHRoaXMuYm9vbCA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0bnVsbCxcblx0XHRcdGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRcdFx0aWYodHlwZW9mIHZhbHVlICE9PSAnYm9vbGVhbicpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuICEoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKSk7XG5cdFx0XHR9LFxuXHRcdFx0RG9jLmdlbkRvYy5iaW5kKG51bGwsIFwiYm9vbFwiKVxuXHRcdCk7XG5cblxuXG5cdC8vQ3JhZnQgQ29uc3Rcblx0XHRmdW5jdGlvbiBkb2NDb25zdCh2YWwpe1xuXG5cdFx0XHRpZih0eXBlb2YodmFsKSA9PT0gXCJvYmplY3RcIiAmJiB2YWwgIT09IG51bGwpe1xuXHRcdFx0XHR2YWwgPSAnT2JqZWN0Jztcblx0XHRcdH1cblx0XHRcdGlmKHR5cGVvZih2YWwpID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCxcImNvbnN0XCIsIHt2YWx1ZTogdmFsfSk7XG5cdFx0fVxuXHRcdGZ1bmN0aW9uIG5ld0NvbnN0KHZhbCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyYW5kOiBmdW5jdGlvbigpe3JldHVybiB2YWx9LFxuXHRcdFx0XHR0ZXN0OiBmdW5jdGlvbih2KXtcblx0XHRcdFx0XHRpZih2YWwgIT09IHYpIHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZG9jOiBkb2NDb25zdCh2YWwpXG5cdFx0XHR9O1xuXHRcdH1cblx0XHR2YXIgZGVmX2NvbnN0ID0gbmV3Q29uc3QoRG9jLmdldENvbnN0KCdjb25zdCcsICd2YWx1ZScpKTtcblx0XHR0aGlzLmNvbnN0ID0gbmV3IENyZWF0ZUNyZWF0b3IobmV3Q29uc3QsIGRlZl9jb25zdC50ZXN0LCBkZWZfY29uc3QucmFuZCwgZGVmX2NvbnN0LmRvYyk7XG5cblx0XHRmdW5jdGlvbiB0Q29uc3QoVHlwZSl7XG5cdFx0XHRpZih0eXBlb2YgKFR5cGUpICE9PSBcImZ1bmN0aW9uXCIgfHwgIVR5cGUuaXNfY3JlYXRvcil7XG5cdFx0XHRcdGlmKEFycmF5LmlzQXJyYXkoVHlwZSkpe1xuXG5cdFx0XHRcdFx0cmV0dXJuIFQuYXJyKFR5cGUpO1xuXG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZihUeXBlKSA9PSBcIm9iamVjdFwiICYmIFR5cGUgIT09IG51bGwpe1xuXG5cdFx0XHRcdFx0cmV0dXJuIFQub2JqKFR5cGUpO1xuXG5cdFx0XHRcdH1lbHNlIHJldHVybiBULmNvbnN0KFR5cGUpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJldHVybiBUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdC8vQ3JhZnQgTnVtYmVyXG5cdFx0dmFyIHJhbmROdW0gPSBmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4gKygoKG1heCAtIG1pbikqTWF0aC5yYW5kb20oKSArICBtaW4pLnRvRml4ZWQocHJlY2lzKSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciB0ZXN0TnVtID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24obil7XG5cdFx0XHRcdGlmKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobikpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoKG4gPiBtYXgpXG5cdFx0XHRcdFx0fHwobiA8IG1pbilcblx0XHRcdFx0XHR8fCAobi50b0ZpeGVkKHByZWNpcykgIT0gbiAmJiBuICE9PSAwKSApe1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0ICB9O1xuXHRcdH07XG5cblx0XHR2YXIgZG9jTnVtID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwibnVtXCIsIHtcIm1heFwiOiBtYXgsIFwibWluXCI6IG1pbiwgXCJwcmVjaXNcIjogcHJlY2lzfSk7XG5cdFx0fVxuXG5cdFx0dmFyIG1heF9kZWZfbiA9IERvYy5nZXRDb25zdCgnbnVtJywgJ21heCcpO1xuXHRcdHZhciBtaW5fZGVmX24gPSBEb2MuZ2V0Q29uc3QoJ251bScsICdtaW4nKTtcblx0XHR2YXIgcHJlY2lzX2RlZiA9IERvYy5nZXRDb25zdCgnbnVtJywgJ3ByZWNpcycpO1xuXG5cdFx0dGhpcy5udW0gPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0XHRpZihtYXggPT09IG51bGwpIG1heCA9IG1heF9kZWZfbjtcblx0XHRcdFx0aWYobWluID09PSB1bmRlZmluZWR8fG1pbiA9PT0gbnVsbCkgbWluID0gbWluX2RlZl9uO1xuXHRcdFx0XHRpZihwcmVjaXMgPT09IHVuZGVmaW5lZCkgcHJlY2lzID0gcHJlY2lzX2RlZjtcblxuXHRcdFx0XHRpZigodHlwZW9mIG1pbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1pbikpXG5cdFx0XHRcdFx0fHwodHlwZW9mIG1heCAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1heCkpXG5cdFx0XHRcdFx0fHwodHlwZW9mIHByZWNpcyAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHByZWNpcykpXG5cdFx0XHRcdFx0fHwocHJlY2lzIDwgMClcblx0XHRcdFx0XHR8fChwcmVjaXMgPiA5KVxuXHRcdFx0XHRcdHx8KHByZWNpcyAlIDEgIT09IDApKXtcblx0XHRcdFx0XHR0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IG1pbihudW1iZXIpLCBtYXgobnVtYmVyKSwgcHJlY2lzKDA8PW51bWJlcjw5KScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKG1pbiA+IG1heCl7XG5cdFx0XHRcdFx0dmFyIHQgPSBtaW47XG5cdFx0XHRcdFx0bWluID0gbWF4O1xuXHRcdFx0XHRcdG1heCA9IHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRlc3Q6IHRlc3ROdW0obWF4LCBtaW4sIHByZWNpcyksXG5cdFx0XHRcdFx0cmFuZDogcmFuZE51bShtYXgsIG1pbiwgcHJlY2lzKSxcblx0XHRcdFx0XHRkb2M6IGRvY051bShtYXgsIG1pbiwgcHJlY2lzKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dGVzdE51bShtYXhfZGVmX24sIG1pbl9kZWZfbiwgcHJlY2lzX2RlZiksXG5cdFx0XHRyYW5kTnVtKG1heF9kZWZfbiwgbWluX2RlZl9uLCBwcmVjaXNfZGVmKSxcblx0XHRcdGRvY051bShtYXhfZGVmX24sIG1pbl9kZWZfbiwgcHJlY2lzX2RlZilcblx0XHQpO1xuXG5cdFx0dmFyIHJhbmRJbnQgPSBmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5mbG9vciggKChtYXggLSAobWluICsgMC4xKSkvcHJlY2lzKSpNYXRoLnJhbmRvbSgpICkgKiBwcmVjaXMgKyAgbWluO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQgdmFyIHRlc3RJbnQgPSBmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbihuKXtcblx0XHRcdFx0aWYodHlwZW9mIG4gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShuKSl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZigobiA+PSBtYXgpXG5cdFx0XHRcdFx0fHwobiA8IG1pbilcblx0XHRcdFx0XHR8fCgoKG4gLSBtaW4pICUgcHJlY2lzKSAhPT0gMCkgKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHQgIH07XG5cdFx0fTtcblxuXHRcdHZhciBkb2NJbnQgPSBmdW5jdGlvbihtYXgsIG1pbiwgc3RlcCl7XG5cblx0XHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcImludFwiLCB7XCJtYXhcIjogbWF4LCBcIm1pblwiOiBtaW4sIFwic3RlcFwiOiBzdGVwfSk7XG5cblx0XHR9XG5cblx0XHR2YXIgbWF4X2RlZiA9IERvYy5nZXRDb25zdCgnaW50JywgJ21heCcpO1xuXHRcdHZhciBtaW5fZGVmID0gRG9jLmdldENvbnN0KCdpbnQnLCAnbWluJyk7XG5cdFx0dmFyIHN0ZXBfZGVmID0gRG9jLmdldENvbnN0KCdpbnQnLCAnc3RlcCcpO1xuXG5cdFx0dGhpcy5pbnQgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdGZ1bmN0aW9uKG1heCwgbWluLCBzdGVwKXtcblxuXHRcdFx0XHRpZihtYXggPT09IG51bGwpIG1heCA9IG1heF9kZWY7XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkfHxtaW4gPT09IG51bGwpIG1pbiA9IG1pbl9kZWY7XG5cdFx0XHRcdGlmKHN0ZXAgPT09IHVuZGVmaW5lZCkgc3RlcCA9IHN0ZXBfZGVmO1xuXG5cdFx0XHRcdGlmKCh0eXBlb2YgbWluICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobWluKSlcblx0XHRcdFx0XHR8fCh0eXBlb2YgbWF4ICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobWF4KSlcblx0XHRcdFx0XHR8fChNYXRoLnJvdW5kKG1pbikgIT09IG1pbilcblx0XHRcdFx0XHR8fChNYXRoLnJvdW5kKG1heCkgIT09IG1heClcblx0XHRcdFx0XHR8fChzdGVwIDw9IDApXG5cdFx0XHRcdFx0fHwoTWF0aC5yb3VuZChzdGVwKSAhPT0gc3RlcCkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogbWluKGludCksIG1heChpbnQpLCBzdGVwKGludD4wKScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKG1pbiA+IG1heCl7XG5cdFx0XHRcdFx0dmFyIHQgPSBtaW47XG5cdFx0XHRcdFx0bWluID0gbWF4O1xuXHRcdFx0XHRcdG1heCA9IHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRlc3Q6IHRlc3RJbnQobWF4LCBtaW4sIHN0ZXApLFxuXHRcdFx0XHRcdHJhbmQ6IHJhbmRJbnQobWF4LCBtaW4sIHN0ZXApLFxuXHRcdFx0XHRcdGRvYzogZG9jSW50KG1heCwgbWluLCBzdGVwKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dGVzdEludChtYXhfZGVmLCBtaW5fZGVmLCBzdGVwX2RlZiksXG5cdFx0XHRyYW5kSW50KG1heF9kZWYsIG1pbl9kZWYsIHN0ZXBfZGVmKSxcblx0XHRcdGRvY0ludChtYXhfZGVmLCBtaW5fZGVmLCBzdGVwX2RlZilcblx0XHQpO1xuXG5cdFx0dmFyIGRvY1BvcyA9IGZ1bmN0aW9uKG1heCwgbWluLCBzdGVwKXtcblxuXHRcdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwicG9zXCIsIHtcIm1heFwiOiBtYXh9KTtcblxuXHRcdH1cblxuXHRcdHZhciBtYXhfZGVmX3AgPSBEb2MuZ2V0Q29uc3QoJ3BvcycsICdtYXgnKVxuXHRcdHRoaXMucG9zID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRmdW5jdGlvbihtYXgpe1xuXG5cdFx0XHRcdGlmKG1heCA9PT0gbnVsbCkgbWF4ID0gbWF4X2RlZl9wO1xuXG5cdFx0XHRcdGlmKCh0eXBlb2YgbWF4ICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobWF4KSlcblx0XHRcdFx0XHR8fChtYXggPCAwKSl7XG5cdFx0XHRcdFx0dGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiBtaW4ocG9zKSwgbWF4KHBvcyksIHN0ZXAocG9zPjApJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRlc3Q6IHRlc3RJbnQobWF4LCAwLCAxKSxcblx0XHRcdFx0XHRyYW5kOiByYW5kSW50KG1heCwgMCwgMSksXG5cdFx0XHRcdFx0ZG9jOiBkb2NQb3MobWF4KVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dGVzdEludChtYXhfZGVmX3AsIDAsIDEpLFxuXHRcdFx0cmFuZEludChtYXhfZGVmX3AsIDAsIDEpLFxuXHRcdFx0ZG9jUG9zKG1heF9kZWZfcClcblx0XHQpO1xuXG5cblxuXG5cbiAgLy9DcmFmdCBBbnlcbiAgXHRcdGZ1bmN0aW9uIHJhbmRJbmRleChhcnIpe1xuXHRcdFx0dmFyIHJhbmQgPSBNYXRoLnJvdW5kKChhcnIubGVuZ3RoIC0gMSkgKiBNYXRoLnJhbmRvbSgpKTtcblx0XHRcdHJldHVybiBhcnJbcmFuZF07XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcmFuZEFueShhcnIpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiByYW5kSW5kZXgoYXJyKS5yYW5kKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdGVzdEFueShhcnIpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbCl7XG5cdFx0XHRcdGlmKGFyci5ldmVyeShmdW5jdGlvbihpKXtyZXR1cm4gaS50ZXN0KHZhbCl9KSl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZG9jQW55KFR5cGVzKXtcblxuXHRcdFx0dmFyIGNvbnQgPSBUeXBlcy5sZW5ndGg7XG5cdFx0XHR2YXIgdHlwZV9kb2NzID0gW107XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgY29udDsgaSsrKXtcblx0XHRcdFx0dHlwZV9kb2NzLnB1c2goVHlwZXNbaV0uZG9jKCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwiYW55XCIsIHt0eXBlczogdHlwZV9kb2NzfSk7XG5cdFx0fVxuXG5cdFx0dmFyIGRlZl90eXBlcyA9IERvYy5nZXRDb25zdCgnYXJyJywgJ3R5cGVzJyk7XG5cdFx0ZnVuY3Rpb24gbmV3QW55KGFycil7XG5cdFx0XHRpZighQXJyYXkuaXNBcnJheShhcnIpIHx8IGFyZ3VtZW50cy5sZW5ndGggPiAxKSBhcnIgPSBhcmd1bWVudHM7XG5cblx0XHRcdHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuXHRcdFx0dmFyIGFycl90eXBlcyA9IFtdO1xuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKXtcblx0XHRcdFx0YXJyX3R5cGVzW2ldID0gdENvbnN0KGFycltpXSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybntcblx0XHRcdFx0dGVzdDogdGVzdEFueShhcnJfdHlwZXMpLFxuXHRcdFx0XHRyYW5kOiByYW5kQW55KGFycl90eXBlcyksXG5cdFx0XHRcdGRvYzogZG9jQW55KGFycl90eXBlcylcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmFueSA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0bmV3QW55LFxuXHRcdFx0dGVzdEFueShkZWZfdHlwZXMpLFxuXHRcdFx0cmFuZEFueShkZWZfdHlwZXMpLFxuXHRcdFx0ZG9jQW55KGRlZl90eXBlcylcblx0XHQpO1xuXG5cblxuXHQvL0NyYWZ0IEFycmF5XG5cblxuXG5cdFx0ZnVuY3Rpb24gcmFuZEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKXtcblx0XHRcdHZhciByYW5kU2l6ZSA9IGZ1bmN0aW9uICgpe3JldHVybiBzaXplfTtcblx0XHRcdGlmKCFpc19maXhlZCl7XG5cdFx0XHRcdHJhbmRTaXplID0gVC5wb3Moc2l6ZSkucmFuZDtcblx0XHRcdH1cblxuXG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0dmFyIG5vd19zaXplID0gcmFuZFNpemUoKTtcblxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgYXJyID0gW107XG5cblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwLCBqID0gMDsgaSA8IG5vd19zaXplOyBpKyspe1xuXG5cdFx0XHRcdFx0XHRhcnIucHVzaChUeXBlW2pdLnJhbmQoKSk7XG5cblx0XHRcdFx0XHRcdGorKztcblx0XHRcdFx0XHRcdGlmKGogPj0gVHlwZS5sZW5ndGgpe1xuXHRcdFx0XHRcdFx0XHRqID0gMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cblxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBhcnIgPSBbXTtcblxuXHRcdFx0XHR2YXIgbm93X3NpemUgPSByYW5kU2l6ZSgpO1xuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbm93X3NpemU7IGkrKyl7XG5cdFx0XHRcdFx0YXJyLnB1c2goVHlwZS5yYW5kKGksIGFycikpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRlc3RBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoVHlwZSkpe1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oYXJyKXtcblxuXHRcdFx0XHRcdGlmKCFBcnJheS5pc0FycmF5KGFycikpe1xuXHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJWYWx1ZSBpcyBub3QgYXJyYXkhXCI7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKChhcnIubGVuZ3RoID4gc2l6ZSkgfHwgKGlzX2ZpeGVkICYmIChhcnIubGVuZ3RoICE9PSBzaXplKSkpe1xuXHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJBcnJheSBsZW5naHQgaXMgd3JvbmchXCI7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvcih2YXIgaSA9IDAsIGogPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcblxuXHRcdFx0XHRcdFx0XHR2YXIgcmVzID0gVHlwZVtqXS50ZXN0KGFycltpXSk7XG5cdFx0XHRcdFx0XHRcdGlmKHJlcyl7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRcdFx0XHRcdGVyci5wYXJhbXMgPSB7aW5kZXg6IGksIHdyb25nX2l0ZW06IHJlc307XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aisrO1xuXHRcdFx0XHRcdFx0XHRpZihqID49IFR5cGUubGVuZ3RoKXtcblx0XHRcdFx0XHRcdFx0XHRqID0gMDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oYXJyKXtcblx0XHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoYXJyKSl7XG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IGFycmF5IVwiO1xuXHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZigoYXJyLmxlbmd0aCA+IHNpemUpIHx8IChpc19maXhlZCAmJiAoYXJyLmxlbmd0aCAhPT0gc2l6ZSkpKXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhhcnIubGVuZ3RoLCBzaXplKVxuXHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIkFycmF5OiBsZW5naHQgaXMgd3JvbmchXCI7XG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBlcnJfYXJyID0gYXJyLmZpbHRlcihUeXBlLnRlc3QpO1xuXHRcdFx0XHRpZihlcnJfYXJyLmxlbmd0aCAhPSAwKXtcblx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRlcnIucGFyYW1zID0gZXJyX2Fycjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGRvY0FycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKXtcblx0XHRcdHZhciB0eXBlX2RvY3MgPSBbXTtcblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoVHlwZSkpe1xuXHRcdFx0XHR2YXIgY29udCA9IFR5cGUubGVuZ3RoO1xuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgY29udDsgaSsrKXtcblx0XHRcdFx0XHR0eXBlX2RvY3MucHVzaChUeXBlW2ldLmRvYygpKTtcblx0XHRcdFx0fVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHR5cGVfZG9jcyA9IFR5cGUuZG9jKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJhcnJcIiwge3R5cGVzOiB0eXBlX2RvY3MsIHNpemU6IHNpemUsIGZpeGVkOiBpc19maXhlZH0pO1xuXG5cdFx0fVxuXG5cblx0XHR2YXIgZGVmX1R5cGUgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICd0eXBlcycpO1xuXHRcdHZhciBkZWZfU2l6ZSA9IERvYy5nZXRDb25zdCgnYXJyJywgJ3NpemUnKTtcblx0XHR2YXIgZGVmX2ZpeGVkID0gRG9jLmdldENvbnN0KCdhcnInLCAnZml4ZWQnKTtcblxuXHRcdGZ1bmN0aW9uIG5ld0FycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKXtcblx0XHRcdGlmKFR5cGUgPT09IG51bGwpIFR5cGUgPSBkZWZfVHlwZTtcblx0XHRcdGlmKGlzX2ZpeGVkID09PSB1bmRlZmluZWQpIGlzX2ZpeGVkID0gZGVmX2ZpeGVkO1xuXG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0aWYoc2l6ZSA9PT0gdW5kZWZpbmVkfHxzaXplID09PSBudWxsKSBzaXplID0gVHlwZS5sZW5ndGg7XG5cblx0XHRcdFx0VHlwZSA9IFR5cGUubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiB0Q29uc3QoaXRlbSk7fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0aWYoc2l6ZSA9PT0gdW5kZWZpbmVkfHxzaXplID09PSBudWxsKSBzaXplID0gMTtcblx0XHRcdFx0VHlwZSA9IHRDb25zdChUeXBlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoVC5wb3MudGVzdChzaXplKSl7XG5cdFx0XHRcdFx0dGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiAnICsgSlNPTi5zdHJpbmdpZnkoVC5wb3MudGVzdChzaXplKSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0ZXN0OiB0ZXN0QXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpLFxuXHRcdFx0XHRyYW5kOiByYW5kQXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpLFxuXHRcdFx0XHRkb2M6IGRvY0FycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0aGlzLmFyciA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0bmV3QXJyYXksXG5cdFx0XHR0ZXN0QXJyYXkoZGVmX1R5cGUsIGRlZl9TaXplLCBkZWZfZml4ZWQpLFxuXHRcdFx0cmFuZEFycmF5KGRlZl9UeXBlLCBkZWZfU2l6ZSwgZGVmX2ZpeGVkKSxcblx0XHRcdGRvY0FycmF5KGRlZl9UeXBlLCBkZWZfU2l6ZSwgZGVmX2ZpeGVkKVxuXHRcdCk7XG5cblxuXG5cblxuXG5cblx0Ly9DcmFmdCBPYmplY3RcblxuXHRcdGZ1bmN0aW9uIHJhbmRPYmooZnVuY09iail7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIG9iaiA9IHt9O1xuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBmdW5jT2JqKXtcblx0XHRcdFx0XHRvYmpba2V5XSA9IGZ1bmNPYmpba2V5XS5yYW5kKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdGVzdE9iaihmdW5jT2JqKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbihvYmope1xuXG5cdFx0XHRcdGlmKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgb2JqID09PSBudWxsKXtcblx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJWYWx1ZSBpcyBub3Qgb2JqZWN0IVwiO1xuXHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IodmFyIGtleSBpbiBmdW5jT2JqKXtcblx0XHRcdFx0XHR2YXIgcmVzID0gZnVuY09ialtrZXldLnRlc3Qob2JqW2tleV0pO1xuXHRcdFx0XHRcdGlmKHJlcyl7XG5cdFx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRcdGVyci5wYXJhbXMgPSB7fTtcblx0XHRcdFx0XHRcdGVyci5wYXJhbXNba2V5XSA9IHJlcztcblx0XHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBkb2NPYihmdW5jT2JqKXtcblx0XHRcdHZhciBkb2Nfb2JqID0ge307XG5cblx0XHRcdGZvcih2YXIga2V5IGluIGZ1bmNPYmope1xuXHRcdFx0XHRcdGRvY19vYmpba2V5XSA9IGZ1bmNPYmpba2V5XS5kb2MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcIm9ialwiLCB7dHlwZXM6IGRvY19vYmp9KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBOZXdPYmoodGVtcE9iail7XG5cdFx0XHRpZih0eXBlb2YgdGVtcE9iaiAhPT0gJ29iamVjdCcpIHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogdGVtcE9iaihPYmplY3QpJyk7XG5cblx0XHRcdHZhciBiZWdPYmogPSB7fTtcblx0XHRcdHZhciBmdW5jT2JqID0ge307XG5cdFx0XHRmb3IodmFyIGtleSBpbiB0ZW1wT2JqKXtcblx0XHRcdFx0ZnVuY09ialtrZXldID0gdENvbnN0KHRlbXBPYmpba2V5XSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybntcblx0XHRcdFx0dGVzdDogdGVzdE9iaihmdW5jT2JqKSxcblx0XHRcdFx0cmFuZDogcmFuZE9iaihmdW5jT2JqKSxcblx0XHRcdFx0ZG9jOiBkb2NPYihmdW5jT2JqKVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLm9iaiA9IG5ldyBDcmVhdGVDcmVhdG9yKE5ld09iaixcblx0XHRcdGZ1bmN0aW9uKG9iail7cmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCJ9LFxuXHRcdFx0cmFuZE9iaih7fSksXG5cdFx0XHREb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJvYmpcIilcblx0XHQpO1xuXG5cblxuXG5cbi8vQ3JhZnQgVHlwZSBvdXQgdG8gIERvY3VtZW50XG5cblx0VC5uYW1lcyA9IHt9O1xuXHRmb3IodmFyIGtleSBpbiBEb2MudHlwZXMpe1xuXHRcdFQubmFtZXNbRG9jLnR5cGVzW2tleV0ubmFtZV0gPSBrZXk7XG5cdH1cblxuXHR0aGlzLm91dERvYyA9IGZ1bmN0aW9uKHRtcCl7XG5cdFx0aWYoKHR5cGVvZiB0bXAgPT09IFwiZnVuY3Rpb25cIikgJiYgdG1wLmlzX2NyZWF0b3IpIHJldHVybiB0bXA7XG5cblx0XHRpZighKCduYW1lJyBpbiB0bXApKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcigpO1xuXHRcdH1cblx0XHR2YXIgdHlwZSA9IHRtcC5uYW1lO1xuXG5cdFx0aWYoJ3BhcmFtcycgaW4gdG1wKXtcblx0XHRcdHZhciBwYXJhbXMgPSB0bXAucGFyYW1zO1xuXHRcdFx0c3dpdGNoKFQubmFtZXNbdHlwZV0pe1xuXHRcdFx0XHRjYXNlICdvYmonOiB7XG5cdFx0XHRcdFx0dmFyIG5ld19vYmogPSB7fTtcblx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBwYXJhbXMudHlwZXMpe1xuXHRcdFx0XHRcdFx0bmV3X29ialtrZXldID0gVC5vdXREb2MocGFyYW1zLnR5cGVzW2tleV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwYXJhbXMudHlwZXMgPSBuZXdfb2JqO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgJ2FueSc6XG5cdFx0XHRcdGNhc2UgJ2Fycic6IHtcblx0XHRcdFx0XHRpZihBcnJheS5pc0FycmF5KHBhcmFtcy50eXBlcykpe1xuXHRcdFx0XHRcdFx0cGFyYW1zLnR5cGVzID0gcGFyYW1zLnR5cGVzLm1hcChULm91dERvYy5iaW5kKFQpKTtcblx0XHRcdFx0XHR9ZWxzZSBwYXJhbXMudHlwZXMgPSBULm91dERvYyhwYXJhbXMudHlwZXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZ2V0U2ltcGxlVHlwZShULm5hbWVzW3R5cGVdLCBwYXJhbXMpO1xuXHRcdH1cblx0XHRyZXR1cm4gZ2V0U2ltcGxlVHlwZShULm5hbWVzW3R5cGVdLCB7fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTaW1wbGVUeXBlKG5hbWUsIHBhcmFtcyl7XG5cdFx0dmFyIGFyZyA9IFtdO1xuXHRcdERvYy50eXBlc1tuYW1lXS5hcmcuZm9yRWFjaChmdW5jdGlvbihrZXksIGkpe2FyZ1tpXSA9IHBhcmFtc1trZXldO30pO1xuXHRcdHJldHVybiBUW25hbWVdLmFwcGx5KFQsIGFyZyk7XG5cdH07XG5cbi8vU3VwcG9ydCBEZWNsYXJhdGUgRnVuY3Rpb25cblxuXHRmdW5jdGlvbiBmaW5kZVBhcnNlKHN0ciwgYmVnLCBlbmQpe1xuXHRcdHZhciBwb2ludF9iZWcgPSBzdHIuaW5kZXhPZihiZWcpO1xuXHRcdGlmKH5wb2ludF9iZWcpe1xuXG5cdFx0XHR2YXIgcG9pbnRfZW5kID0gcG9pbnRfYmVnO1xuXHRcdFx0dmFyIHBvaW50X3RlbXAgPSBwb2ludF9iZWc7XG5cdFx0XHR2YXIgbGV2ZWwgPSAxO1xuXHRcdFx0dmFyIGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdHdoaWxlKCFicmVha1doaWxlKXtcblx0XHRcdFx0YnJlYWtXaGlsZSA9IHRydWU7XG5cblx0XHRcdFx0aWYofnBvaW50X3RlbXApIHBvaW50X3RlbXAgPSBzdHIuaW5kZXhPZihiZWcsIHBvaW50X3RlbXAgKyAxKTtcblx0XHRcdFx0aWYofnBvaW50X2VuZCkgcG9pbnRfZW5kID0gc3RyLmluZGV4T2YoZW5kLCBwb2ludF9lbmQgKyAxKTtcblxuXHRcdFx0XHRpZihwb2ludF90ZW1wIDwgcG9pbnRfZW5kKXtcblxuXHRcdFx0XHRcdGlmKHBvaW50X3RlbXAgPiAwKXtcblx0XHRcdFx0XHRcdGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGlmKHN0cltwb2ludF90ZW1wIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbCsxO1xuXG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHRpZihwb2ludF9lbmQgPiAwKXtcblx0XHRcdFx0XHRcdGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGlmKHN0cltwb2ludF9lbmQgLSAxXSAhPT0gJ1xcXFwnKSBsZXZlbCA9IGxldmVsLTE7XG5cdFx0XHRcdFx0XHRpZihsZXZlbCA9PSAwKXtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIFtwb2ludF9iZWcsIHBvaW50X2VuZF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRpZihwb2ludF9lbmQgPiAwKXtcblx0XHRcdFx0XHRcdGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGlmKHN0cltwb2ludF9lbmQgLSAxXSAhPT0gJ1xcXFwnKSBsZXZlbCA9IGxldmVsLTE7XG5cdFx0XHRcdFx0XHRpZihsZXZlbCA9PSAwKXtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIFtwb2ludF9iZWcsIHBvaW50X2VuZF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYocG9pbnRfdGVtcCA+IDApe1xuXHRcdFx0XHRcdFx0YnJlYWtXaGlsZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0aWYoc3RyW3BvaW50X3RlbXAgLSAxXSAhPT0gJ1xcXFwnKSBsZXZlbCA9IGxldmVsKzE7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0T2JqZWN0LnR5cGVzID0gVDtcbn0pKCk7XG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCLQlNC10YDQtdCy0L5cIjogXCJ3b29kXCIsXHJcblx0XCLQmtCw0LzQtdC90YxcIjogXCJzdG9uZVwiLFxyXG5cdFwi0KHRgtCw0LvRjFwiOiBcInN0ZWVsXCIsXHJcblx0XCLQoNC10YHQv1wiOiBcInNwYXduZXJcIlxyXG59Il19
