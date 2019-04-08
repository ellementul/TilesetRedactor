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
},{"./drawLib.js":12,"./mof.js":14,"./types_durability.json":18}],2:[function(require,module,exports){
const Base64 = require('js-base64').Base64;

const CrViewLogic = require("./ViewLogic.js");

const Hear = require("./Events.js");

const CrAddForm = require("./AddForm.js");
const CrTool = require("./Tools.js");
const CrTiles = require("./Tiles.js");
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
		else if(Tool.type == "Clear")
			Send({
				action: "Draw",
				type: "Map",
				tool: Tool.type,
				coords: {x: x, y: y, z: 1}
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
			case "Create":  
				TileMap.load(mess.sizes); initMap(); 
				break;
			case "Draw":
				TileMap.draw(mess);
				break;
		}
	}
}
//Tiles--------------------------------------------------------


//
},{"./AddForm.js":1,"./Events.js":3,"./Map.js":5,"./Tiles.js":7,"./Tools.js":8,"./ViewLogic.js":10,"js-base64":15}],3:[function(require,module,exports){

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

	this.getTile = function(id){
		return tiles[id];
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

	this.draw = function(mess){
		var new_mess = {
			action: "Draw",
			type: "Map",
			tool: mess.tool,
			coords: mess.coords
		};

		switch(mess.tool){
			case "Pen":  
				new_mess.coords = Pen(mess.tile_id, mess.coords);
				new_mess.tile_id = mess.tile_id;
				break;
			case "Clear": 
				new_mess.coords = Clear(mess.coords);
				break;
		}

		return new_mess;
	}

	function Pen(tile_id, coords){
		var tile = Tiles.getTile(tile_id);
		if(is_coords(coords, tile.size) && is_empty(coords, tile.size)){

			fillBox(tile, coords, tile.size);
			return [coords];
		}else return [];
	}

	function Clear(coords){
		if(is_coords(coords) && !is_empty(coords)){
			coords = clearBox(map[coords.z][coords.y][coords.x]);
			return [coords];
		}else return [];
	}

	function fillBox(tile, coords, size){
		var box = {coords: coords, size: tile.size, tile_id: tile.id};
		var size = tile.size;

		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				map[coords.z][coords.y + j][coords.x + i] = box;
			}
		}

		return coords;
	}

	function clearBox(box){
		var coords = box.coords;
		var size = box.size;

		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				map[coords.z][coords.y + j][coords.x + i] = null;
			}
		}
		return coords;
	}

	function is_coords(coords, size=1){
		return coords 
		&& map[coords.z] 
		&& map[coords.z][coords.y] 
		&& map[coords.z][coords.y + size - 1]
		&& map[coords.z][coords.y][coords.x] !== undefined
		&& map[coords.z][coords.y + size - 1][coords.x + size - 1] !== undefined;
	}

	function is_empty(coords, size=1){
		for(var i = size - 1; i >= 0; i--){
			for(var j = size - 1; j >= 0; j--){
				if(map[coords.z][coords.y + j][coords.x + i] !== null)
					return false;
			}
		}
		return true;
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
			case "Add":  
				mess.tile = Tiles.add(mess.tile);
				send(mess);
				break;
		}
	}

	function receiveMap(mess){
		switch(mess.action){
			 case "Draw":
			 	mess = TileMap.draw(mess);
			 	send(mess);
			 	break;
		}
	}
}

},{"./mof.js":14}],5:[function(require,module,exports){
const Lib = require("./drawLib.js");

var map_size = 20;
var map_cont = Lib.getNode("Map");
var Tiles = Lib.getNode("Tiles");

module.exports = function CrMap(){

	map_cont.load = function(sizes){
		var Grid = CrGrid(sizes, "grid-border");
		Grid.setAttribute("id", "Grid");

		while(sizes.layers--)
			map_cont.appendChild(CrLayer(sizes));

		map_cont.appendChild(Grid);
	}

	map_cont.draw = function(mess){
		var coords = mess.coords;
		if(coords.length == 0) return;

		if(mess.tool == "Pen"){
			var tile = Tiles.getTile(mess.tile_id);

			this.children[coords[0].z].pen(tile, coords);			
		}
		if(mess.tool == "Clear") this.children[coords[0].z].clear(mess.coords);
	}

	return map_cont;
	
}

function CrLayer(sizes){
	var layer = document.createElement("div");
	layer.classList.add("layer");
	layer.style.width = "100%";
	layer.style.height = "100%";

	var w_size = 100 / sizes.width;
	var h_size = 100 / sizes.height;

	layer.show = function(){
		layer.style.opacity = 0;
	}

	layer.hide = function(){
		layer.style.opacity = 1;
	}

	layer.clear = function(coords){
		coords = coords[0];

		if(!layer[coords.y] || !layer[coords.y][coords.x]) throw new Error();
		layer[coords.y][coords.x].remove();
	}

	layer.pen = function(tile, coords){
		coords = coords[0];

		var box = Lib.drawTile(tile.images[0]);
		box.tile = tile.id;
		box.classList.add("box");

		box.style.width = tile.size*w_size + "%";
		box.style.height = tile.size*h_size + "%";

		box.style.left = coords.x*w_size + "%";
		box.style.top = coords.y*h_size + "%";

		layer.appendChild(box);

		if(!layer[coords.y]) layer[coords.y] = [];
		layer[coords.y][coords.x] = box;
	}

	return layer;
}

function CrGrid(sizes, border){
	var layer = document.createElement("div");
	layer.classList.add("layer");
	layer.style.width = "100%";
	layer.style.height = "100%";
	drawGrid(layer, sizes, border);

	layer.show = function(){
		layer.style.opacity = 0;
	}

	layer.hide = function(){
		layer.style.opacity = 1;
	}

	return layer;
}


function drawGrid(container, grid_size, border){
	var w_size = 100 / grid_size.width;
	var h_size = 100 / grid_size.height;
	for(var i = grid_size.width - 1; i >= 0; i--){
		for(var j = grid_size.height - 1; j >= 0; j--){
			var box = darwBox(w_size, h_size, border);

			box.style.left = i*w_size + "%";
			box.style.top = j*h_size + "%";

			box.x = i;
			box.y = j;
			
			container.appendChild(box);
		}
	}
}

function darwBox(width, height, border){
	var box = document.createElement('div');
	box.classList.add("box");
	if(border) 
		box.classList.add(border);

	box.style.width = width + "%";
	box.style.height = height + "%";

	return box;
}
},{"./drawLib.js":12}],6:[function(require,module,exports){
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
const Lib = require("./drawLib.js");

var tiles_cont = Lib.getNode("Tiles");

module.exports = function CrTiles(container){
	var tiles = [];

	tiles_cont.add = function(new_tile){
		var tile = Lib.drawTile(new_tile.images[0]);
		tile.tile = new_tile;
		tiles_cont.appendChild(tile);

		tiles[new_tile.id] = new_tile;
	}

	tiles_cont.getTile = function(id){
		return tiles[id];
	}

	return tiles_cont;
}
},{"./drawLib.js":12}],8:[function(require,module,exports){
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
			
			if(pallet[type]) 
				changeTileView(pallet[type].images[0]);
			else
				changeTileView(null);
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
},{"./drawLib.js":12,"./mof.js":14}],9:[function(require,module,exports){
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

var clear_mess_type = {
	action: "Draw",
	type: "Map",
	tool: "Clear",
	coords: coords_type
};

var clear_mess_type_for_display = {
	action: "Draw",
	type: "Map",
	tool: "Clear",
	coords: T.arr(coords_type, 20, false)
};

var draw_mess_type_for_display = {
	action: "Draw",
	type: "Map",
	tool: "Pen",
	coords: T.arr(coords_type, 20, false),
	tile_id: tile_id_type
};

var mess_types_one = T.any([
	draw_mess_type, 
	new_tile_mess_type, 
	clear_mess_type]);

var mess_types_two = T.any([
	draw_mess_type_for_display,
	new_tile_mess_type, 
	new_map_mess_type,
	clear_mess_type_for_display]);

module.exports = [
	function(val){
		if(mess_types_one.test(val))
			throw mess_types_one.test(val);
	}, 
	function(val){
		if(mess_types_two.test(val))
			throw mess_types_two.test(val);
	}];

},{"./types_durability.json":18,"typesjs":17,"typesjs/str_type":16}],10:[function(require,module,exports){
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
			Press(e);
		}
	});

	Hear("Tools", "click", function(e){
		if(e.target.getAttribute("tool")){
			Tool.type = e.target.getAttribute("tool");
			Press(e);
		}
	});

	Hear("Map", "dragstart", function(e){
		e.preventDefault();
	});

	

};

function Press(e){
		e.target.classList.add("press");
		setTimeout(()=>e.target.classList.remove("press"), 300);
}
},{"./Events.js":3,"./Switch.js":6}],11:[function(require,module,exports){


const CrInter = require("./inter.js");
var Types = require("./Types.js");

const Display = require("./Display.js");
const CrLogic = require("./Logic.js");

const DisplayInter = new CrInter();
DisplayInter.test(Types, console.log);

Display(DisplayInter);

CrLogic(DisplayInter);





},{"./Display.js":2,"./Logic.js":4,"./Types.js":9,"./inter.js":13}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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





},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
module.exports={
	"Дерево": "wood",
	"Камень": "stone",
	"Сталь": "steel",
	"Респ": "spawner"
}
},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0tvbG9ib2svRGVza3RvcC9Qb3J0UHJvZy9XaW42NC9ub2RlX3YxMS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiQWRkRm9ybS5qcyIsIkRpc3BsYXkuanMiLCJFdmVudHMuanMiLCJMb2dpYy5qcyIsIk1hcC5qcyIsIlN3aXRjaC5qcyIsIlRpbGVzLmpzIiwiVG9vbHMuanMiLCJUeXBlcy5qcyIsIlZpZXdMb2dpYy5qcyIsImJyb21haW4uanMiLCJkcmF3TGliLmpzIiwiaW50ZXIuanMiLCJtb2YuanMiLCJub2RlX21vZHVsZXMvanMtYmFzZTY0L2Jhc2U2NC5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc2pzL3N0cl90eXBlLmpzIiwibm9kZV9tb2R1bGVzL3R5cGVzanMvdHlwZXMuanMiLCJ0eXBlc19kdXJhYmlsaXR5Lmpzb24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBMaWIgPSByZXF1aXJlKFwiLi9kcmF3TGliLmpzXCIpO1xyXG52YXIgZHVyYWJpbGl0eV90eXBlc19saXN0ID0gcmVxdWlyZShcIi4vdHlwZXNfZHVyYWJpbGl0eS5qc29uXCIpO1xyXG5cclxuXHJcbnZhciBkdXJhYmlsaXR5X3R5cGVzX2NvbnQgPSBMaWIuZ2V0Tm9kZShcIkR1cmFiaWxpdHlUeXBlc1wiKTtcclxudmFyIGltYWdlc19jb250ID0gTGliLmdldE5vZGUoXCJJbWFnZXNcIik7XHJcbnZhciB0aWxlX3NpemVfY29udCA9IExpYi5nZXROb2RlKFwiVGlsZVNpemVcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENyQWRkRm9ybSgpe1xyXG5cdHJldHVybiB7XHJcblx0XHRcdEltYWdlczogbmV3IENySW1hZ2VzKGltYWdlc19jb250KSxcclxuXHRcdFx0VHlwZTogbmV3IENyTGlzdChkdXJhYmlsaXR5X3R5cGVzX2NvbnQsIGR1cmFiaWxpdHlfdHlwZXNfbGlzdCksXHJcblx0XHRcdFNpemU6IHRpbGVfc2l6ZV9jb250LFxyXG5cdFx0XHRjbGVhcjogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR0aGlzLkltYWdlcy5jbGVhcigpO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0Z2V0VGlsZTogbmV3VGlsZVxyXG5cdH07XHJcbn1cclxuXHJcbnJlcXVpcmUoXCIuL21vZi5qc1wiKTtcclxuXHJcbmZ1bmN0aW9uIENySW1hZ2VzKGNvbnRhaW5lcil7XHJcblx0dmFyIGltYWdlcyA9IFtdO1xyXG5cclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKGZpbGUpe1xyXG5cdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcclxuXHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKXtcclxuXHRcdFx0QWRkKGUudGFyZ2V0LnJlc3VsdCk7XHJcblx0XHR9O1xyXG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XHJcblx0fTtcclxuXHJcblx0dGhpcy5hZGRHZXRTZXQoXCJ2YWx1ZVwiLFxyXG5cdFx0ZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYoaW1hZ2VzLmxlbmd0aCA+IDApIHJldHVybiBpbWFnZXM7XHJcblx0XHR9XHJcblx0KTtcclxuXHJcblx0dGhpcy5jbGVhciA9IGZ1bmN0aW9uKCl7XHJcblx0XHRBcnJheS5mcm9tKGNvbnRhaW5lci5jaGlsZHJlbikuZm9yRWFjaChlbGVtID0+IGVsZW0ucmVtb3ZlKCkpO1xyXG5cdFx0aW1hZ2VzID0gW107XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBBZGQoaW1nKXtcclxuXHRcdGltYWdlcy5wdXNoKGltZyk7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoTGliLmRyYXdUaWxlKGltZykpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ3JMaXN0KGNvbnRhaW5lciwgbGlzdCl7XHJcblxyXG5cdGZvciAodmFyIHZhbCBpbiBsaXN0KXtcclxuXHRcdHZhciBvcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcclxuXHRcdG9wdC52YWx1ZSA9IGxpc3RbdmFsXTtcclxuXHRcdG9wdC5pbm5lckhUTUwgPSB2YWw7XHJcblx0XHRvcHQub25jbGljayA9IG9uY2xpY2s7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQob3B0KTtcclxuXHR9XHJcblx0dmFyIGRlZk9wdCA9IGNvbnRhaW5lci5jaGlsZHJlblswXTtcclxuXHRjb250YWluZXIudmFsdWUgPSBkZWZPcHQudmFsdWU7XHJcblx0ZGVmT3B0LmNsYXNzTGlzdC5hZGQoXCJvcHRpb24tY2hhbmdlXCIpO1xyXG5cclxuXHRyZXR1cm4gY29udGFpbmVyO1xyXG5cclxuXHRmdW5jdGlvbiBvbmNsaWNrKCl7XHJcblx0XHRBcnJheS5mcm9tKHRoaXMucGFyZW50RWxlbWVudC5jaGlsZHJlbikuZm9yRWFjaChlbGVtID0+IGVsZW0uY2xhc3NMaXN0LnJlbW92ZShcIm9wdGlvbi1jaGFuZ2VcIikpO1xyXG5cdFx0dGhpcy5wYXJlbnRFbGVtZW50LnZhbHVlID0gdGhpcy52YWx1ZTtcclxuXHRcdGNvbnNvbGUubG9nKHRoaXMudmFsdWUpO1xyXG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKFwib3B0aW9uLWNoYW5nZVwiKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld1RpbGUoc2VuZCl7XHJcblx0aWYodGhpcy5JbWFnZXMudmFsdWUgXHJcblx0XHQmJiB0aGlzLlR5cGUudmFsdWVcclxuXHRcdCYmIHRoaXMuU2l6ZS52YWx1ZSl7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRpbWFnZXM6IHRoaXMuSW1hZ2VzLnZhbHVlLFxyXG5cdFx0XHR0eXBlOiB0aGlzLlR5cGUudmFsdWUsXHJcblx0XHRcdHNpemU6IHBhcnNlSW50KHRoaXMuU2l6ZS52YWx1ZSlcclxuXHRcdH07XHJcblx0fVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XHJcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xyXG5cdHJldHVybiBlbGVtO1xyXG59IiwiY29uc3QgQmFzZTY0ID0gcmVxdWlyZSgnanMtYmFzZTY0JykuQmFzZTY0O1xyXG5cclxuY29uc3QgQ3JWaWV3TG9naWMgPSByZXF1aXJlKFwiLi9WaWV3TG9naWMuanNcIik7XHJcblxyXG5jb25zdCBIZWFyID0gcmVxdWlyZShcIi4vRXZlbnRzLmpzXCIpO1xyXG5cclxuY29uc3QgQ3JBZGRGb3JtID0gcmVxdWlyZShcIi4vQWRkRm9ybS5qc1wiKTtcclxuY29uc3QgQ3JUb29sID0gcmVxdWlyZShcIi4vVG9vbHMuanNcIik7XHJcbmNvbnN0IENyVGlsZXMgPSByZXF1aXJlKFwiLi9UaWxlcy5qc1wiKTtcclxuY29uc3QgQ3JNYXAgPSByZXF1aXJlKFwiLi9NYXAuanNcIik7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JEaXNwbGF5KEludGVyKXtcclxuXHR2YXIgU2VuZCA9IEludGVyLmNvbm5lY3QocmVjZWl2ZSk7XHJcblxyXG5cdHZhciBUaWxlcyA9IG5ldyBDclRpbGVzKCk7XHJcblxyXG5cdHZhciBBZGRGb3JtID0gbmV3IENyQWRkRm9ybSgpO1xyXG5cclxuXHR2YXIgVGlsZU1hcCA9IG5ldyBDck1hcCgpO1xyXG5cclxuXHR2YXIgVG9vbCA9IG5ldyBDclRvb2woKTtcclxuXHJcblxyXG5cdHZhciBWaWV3TG9naWMgPSBuZXcgQ3JWaWV3TG9naWMoQWRkRm9ybSwgVG9vbCk7XHJcblxyXG5cdEhlYXIoXCJBZGRGb3JtXCIsIFwic3VibWl0XCIsIGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgdGlsZSA9IEFkZEZvcm0uZ2V0VGlsZSgpO1xyXG5cdFx0aWYodGlsZSl7XHJcblx0XHRcdFNlbmQoe1xyXG5cdFx0XHRcdGFjdGlvbjogXCJBZGRcIixcclxuXHRcdFx0XHR0eXBlOiBcIlRpbGVcIixcclxuXHRcdFx0XHR0aWxlOiB0aWxlXHJcblx0XHRcdH0pO1xyXG5cdFx0XHRWaWV3TG9naWMuc3dpdGNoQWRkRm9ybSgpO1xyXG5cdFx0XHRBZGRGb3JtLmNsZWFyKCk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdFxyXG5cclxuXHRmdW5jdGlvbiBpbml0TWFwKCl7XHJcblxyXG5cdFx0SGVhcihcIkdyaWRcIiwgXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRcdFx0dGhpcy5pc19kb3duID0gdHJ1ZTtcclxuXHRcdFx0XHRpZihlLnRhcmdldC5wYXJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcImlkXCIpID09IFwiR3JpZFwiKVxyXG5cdFx0XHRcdFx0ZHJhd01hcChlLnRhcmdldC54LCBlLnRhcmdldC55KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdEhlYXIoXCJHcmlkXCIsIFwibW91c2V1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRcdFx0dGhpcy5pc19kb3duID0gZmFsc2U7XHJcblx0XHR9KTtcclxuXHJcblx0XHRIZWFyKFwiR3JpZFwiLCBcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihlKXtcclxuXHRcdFx0aWYodGhpcy5pc19kb3duICYmIGUudGFyZ2V0LnBhcmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIikgPT0gXCJHcmlkXCIpe1xyXG5cdFx0XHRcdGRyYXdNYXAoZS50YXJnZXQueCwgZS50YXJnZXQueSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZHJhd01hcCh4LCB5KXtcclxuXHRcdGlmKHR5cGVvZiBUb29sLnRpbGUgPT0gXCJudW1iZXJcIilcclxuXHRcdFx0U2VuZCh7XHJcblx0XHRcdFx0YWN0aW9uOiBcIkRyYXdcIixcclxuXHRcdFx0XHR0eXBlOiBcIk1hcFwiLFxyXG5cdFx0XHRcdHRvb2w6IFRvb2wudHlwZSxcclxuXHRcdFx0XHRjb29yZHM6IHt4OiB4LCB5OiB5LCB6OiAxfSxcclxuXHRcdFx0XHR0aWxlX2lkOiBUb29sLnRpbGVcclxuXHRcdFx0fSk7XHJcblx0XHRlbHNlIGlmKFRvb2wudHlwZSA9PSBcIkNsZWFyXCIpXHJcblx0XHRcdFNlbmQoe1xyXG5cdFx0XHRcdGFjdGlvbjogXCJEcmF3XCIsXHJcblx0XHRcdFx0dHlwZTogXCJNYXBcIixcclxuXHRcdFx0XHR0b29sOiBUb29sLnR5cGUsXHJcblx0XHRcdFx0Y29vcmRzOiB7eDogeCwgeTogeSwgejogMX1cclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHJcblx0Ly9SZWNlaXZlLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0ZnVuY3Rpb24gcmVjZWl2ZShtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLnR5cGUpe1xyXG5cdFx0XHRjYXNlIFwiVGlsZVwiOiByZWNlaXZlVGlsZXMobWVzcyk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlIFwiTWFwXCI6IHJlY2VpdmVNYXAobWVzcyk7IGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVjZWl2ZVRpbGVzKG1lc3Mpe1xyXG5cdFx0c3dpdGNoKG1lc3MuYWN0aW9uKXtcclxuXHRcdFx0Y2FzZSBcIkFkZFwiOiAgVGlsZXMuYWRkKG1lc3MudGlsZSk7IGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVjZWl2ZU1hcChtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLmFjdGlvbil7XHJcblx0XHRcdGNhc2UgXCJDcmVhdGVcIjogIFxyXG5cdFx0XHRcdFRpbGVNYXAubG9hZChtZXNzLnNpemVzKTsgaW5pdE1hcCgpOyBcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSBcIkRyYXdcIjpcclxuXHRcdFx0XHRUaWxlTWFwLmRyYXcobWVzcyk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbi8vVGlsZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbi8vIiwiXHJcbmZ1bmN0aW9uIElkRXZlbnQoaWQsIG5hbWVfZXZlbnQsIGZ1bmMpe1xyXG5cdFxyXG5cdGlmKG5hbWVfZXZlbnQgPT0gXCJzdWJtaXRcIil7XHJcblx0XHR2YXIgb2xkX2Z1bmMgPSBmdW5jO1xyXG5cdFx0ZnVuYyA9IGZ1bmN0aW9uKGUpe1xyXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdG9sZF9mdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0XHR9IFxyXG5cdH1cclxuXHRcclxuXHRpZihBcnJheS5pc0FycmF5KG5hbWVfZXZlbnQpKXtcclxuXHRcdG5hbWVfZXZlbnQuZm9yRWFjaChuYW1lID0+IGdldE5vZGUoaWQpLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZnVuYykpO1xyXG5cdH1cclxuXHRlbHNlIGdldE5vZGUoaWQpLmFkZEV2ZW50TGlzdGVuZXIobmFtZV9ldmVudCwgZnVuYyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFN1Ym1pdChmdW5jKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE5vZGUoaWQpe1xyXG5cdHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG5cdGlmKCFlbGVtKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtIGlzIG5vdCBmaW5kIVwiKTtcclxuXHRyZXR1cm4gZWxlbTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJZEV2ZW50O1xyXG4iLCJyZXF1aXJlKFwiLi9tb2YuanNcIik7XHJcblxyXG52YXIgbWFwX3NpemUgPSB7d2lkdGg6IDIwLCBoZWlnaHQ6IDIwLCBsYXllcnM6IDJ9O1xyXG5cclxuZnVuY3Rpb24gQ3JUaWxlcygpe1xyXG5cdHZhciB0aWxlcyA9IEFycmF5LmNyZWF0ZSgpO1xyXG5cclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKG5ld190aWxlKXtcclxuXHRcdG5ld190aWxlLmlkID0gdGlsZXMuYWRkKG5ld190aWxlKTtcclxuXHRcdHJldHVybiBuZXdfdGlsZTtcclxuXHR9XHJcblxyXG5cdHRoaXMuZ2V0VGlsZSA9IGZ1bmN0aW9uKGlkKXtcclxuXHRcdHJldHVybiB0aWxlc1tpZF07XHJcblx0fVxyXG59XHJcblxyXG52YXIgVGlsZXMgPSBuZXcgQ3JUaWxlcygpO1xyXG5cclxuZnVuY3Rpb24gQ3JNYXAoc2l6ZXMpe1xyXG5cdHZhciBjcl9saW5lID0gQXJyYXkuY3JlYXRlLmJpbmQobnVsbCwgbnVsbCwgc2l6ZXMud2lkdGgpO1xyXG5cdHZhciBjcl9wbGluZSA9IEFycmF5LmNyZWF0ZS5iaW5kKG51bGwsIGNyX2xpbmUsIHNpemVzLndpZHRoLCB0cnVlKTtcclxuXHR2YXIgbWFwID0gQXJyYXkuY3JlYXRlKGNyX3BsaW5lLCBzaXplcy5sYXllcnMpO1xyXG5cclxuXHR0aGlzLmxvYWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0YWN0aW9uOiBcIkNyZWF0ZVwiLFxyXG5cdFx0XHR0eXBlOiBcIk1hcFwiLFxyXG5cdFx0XHRzaXplczogc2l6ZXNcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHRoaXMuZHJhdyA9IGZ1bmN0aW9uKG1lc3Mpe1xyXG5cdFx0dmFyIG5ld19tZXNzID0ge1xyXG5cdFx0XHRhY3Rpb246IFwiRHJhd1wiLFxyXG5cdFx0XHR0eXBlOiBcIk1hcFwiLFxyXG5cdFx0XHR0b29sOiBtZXNzLnRvb2wsXHJcblx0XHRcdGNvb3JkczogbWVzcy5jb29yZHNcclxuXHRcdH07XHJcblxyXG5cdFx0c3dpdGNoKG1lc3MudG9vbCl7XHJcblx0XHRcdGNhc2UgXCJQZW5cIjogIFxyXG5cdFx0XHRcdG5ld19tZXNzLmNvb3JkcyA9IFBlbihtZXNzLnRpbGVfaWQsIG1lc3MuY29vcmRzKTtcclxuXHRcdFx0XHRuZXdfbWVzcy50aWxlX2lkID0gbWVzcy50aWxlX2lkO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlIFwiQ2xlYXJcIjogXHJcblx0XHRcdFx0bmV3X21lc3MuY29vcmRzID0gQ2xlYXIobWVzcy5jb29yZHMpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBuZXdfbWVzcztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIFBlbih0aWxlX2lkLCBjb29yZHMpe1xyXG5cdFx0dmFyIHRpbGUgPSBUaWxlcy5nZXRUaWxlKHRpbGVfaWQpO1xyXG5cdFx0aWYoaXNfY29vcmRzKGNvb3JkcywgdGlsZS5zaXplKSAmJiBpc19lbXB0eShjb29yZHMsIHRpbGUuc2l6ZSkpe1xyXG5cclxuXHRcdFx0ZmlsbEJveCh0aWxlLCBjb29yZHMsIHRpbGUuc2l6ZSk7XHJcblx0XHRcdHJldHVybiBbY29vcmRzXTtcclxuXHRcdH1lbHNlIHJldHVybiBbXTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIENsZWFyKGNvb3Jkcyl7XHJcblx0XHRpZihpc19jb29yZHMoY29vcmRzKSAmJiAhaXNfZW1wdHkoY29vcmRzKSl7XHJcblx0XHRcdGNvb3JkcyA9IGNsZWFyQm94KG1hcFtjb29yZHMuel1bY29vcmRzLnldW2Nvb3Jkcy54XSk7XHJcblx0XHRcdHJldHVybiBbY29vcmRzXTtcclxuXHRcdH1lbHNlIHJldHVybiBbXTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGZpbGxCb3godGlsZSwgY29vcmRzLCBzaXplKXtcclxuXHRcdHZhciBib3ggPSB7Y29vcmRzOiBjb29yZHMsIHNpemU6IHRpbGUuc2l6ZSwgdGlsZV9pZDogdGlsZS5pZH07XHJcblx0XHR2YXIgc2l6ZSA9IHRpbGUuc2l6ZTtcclxuXHJcblx0XHRmb3IodmFyIGkgPSBzaXplIC0gMTsgaSA+PSAwOyBpLS0pe1xyXG5cdFx0XHRmb3IodmFyIGogPSBzaXplIC0gMTsgaiA+PSAwOyBqLS0pe1xyXG5cdFx0XHRcdG1hcFtjb29yZHMuel1bY29vcmRzLnkgKyBqXVtjb29yZHMueCArIGldID0gYm94O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNvb3JkcztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNsZWFyQm94KGJveCl7XHJcblx0XHR2YXIgY29vcmRzID0gYm94LmNvb3JkcztcclxuXHRcdHZhciBzaXplID0gYm94LnNpemU7XHJcblxyXG5cdFx0Zm9yKHZhciBpID0gc2l6ZSAtIDE7IGkgPj0gMDsgaS0tKXtcclxuXHRcdFx0Zm9yKHZhciBqID0gc2l6ZSAtIDE7IGogPj0gMDsgai0tKXtcclxuXHRcdFx0XHRtYXBbY29vcmRzLnpdW2Nvb3Jkcy55ICsgal1bY29vcmRzLnggKyBpXSA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjb29yZHM7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc19jb29yZHMoY29vcmRzLCBzaXplPTEpe1xyXG5cdFx0cmV0dXJuIGNvb3JkcyBcclxuXHRcdCYmIG1hcFtjb29yZHMuel0gXHJcblx0XHQmJiBtYXBbY29vcmRzLnpdW2Nvb3Jkcy55XSBcclxuXHRcdCYmIG1hcFtjb29yZHMuel1bY29vcmRzLnkgKyBzaXplIC0gMV1cclxuXHRcdCYmIG1hcFtjb29yZHMuel1bY29vcmRzLnldW2Nvb3Jkcy54XSAhPT0gdW5kZWZpbmVkXHJcblx0XHQmJiBtYXBbY29vcmRzLnpdW2Nvb3Jkcy55ICsgc2l6ZSAtIDFdW2Nvb3Jkcy54ICsgc2l6ZSAtIDFdICE9PSB1bmRlZmluZWQ7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc19lbXB0eShjb29yZHMsIHNpemU9MSl7XHJcblx0XHRmb3IodmFyIGkgPSBzaXplIC0gMTsgaSA+PSAwOyBpLS0pe1xyXG5cdFx0XHRmb3IodmFyIGogPSBzaXplIC0gMTsgaiA+PSAwOyBqLS0pe1xyXG5cdFx0XHRcdGlmKG1hcFtjb29yZHMuel1bY29vcmRzLnkgKyBqXVtjb29yZHMueCArIGldICE9PSBudWxsKVxyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcbn1cclxuXHJcbnZhciBUaWxlTWFwID0gbmV3IENyTWFwKG1hcF9zaXplKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JMb2dpYyhJbnRlcil7XHJcblx0dmFyIHNlbmQgPSBJbnRlci5jb25uZWN0KHJlY2VpdmUpO1xyXG5cdHNlbmQoVGlsZU1hcC5sb2FkKCkpO1xyXG5cclxuXHRmdW5jdGlvbiByZWNlaXZlKG1lc3Mpe1xyXG5cdFx0c3dpdGNoKG1lc3MudHlwZSl7XHJcblx0XHRcdGNhc2UgXCJUaWxlXCI6IHJlY2VpdmVUaWxlcyhtZXNzKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgXCJNYXBcIjogcmVjZWl2ZU1hcChtZXNzKTsgYnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWNlaXZlVGlsZXMobWVzcyl7XHJcblx0XHRzd2l0Y2gobWVzcy5hY3Rpb24pe1xyXG5cdFx0XHRjYXNlIFwiQWRkXCI6ICBcclxuXHRcdFx0XHRtZXNzLnRpbGUgPSBUaWxlcy5hZGQobWVzcy50aWxlKTtcclxuXHRcdFx0XHRzZW5kKG1lc3MpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVjZWl2ZU1hcChtZXNzKXtcclxuXHRcdHN3aXRjaChtZXNzLmFjdGlvbil7XHJcblx0XHRcdCBjYXNlIFwiRHJhd1wiOlxyXG5cdFx0XHQgXHRtZXNzID0gVGlsZU1hcC5kcmF3KG1lc3MpO1xyXG5cdFx0XHQgXHRzZW5kKG1lc3MpO1xyXG5cdFx0XHQgXHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuIiwiY29uc3QgTGliID0gcmVxdWlyZShcIi4vZHJhd0xpYi5qc1wiKTtcclxuXHJcbnZhciBtYXBfc2l6ZSA9IDIwO1xyXG52YXIgbWFwX2NvbnQgPSBMaWIuZ2V0Tm9kZShcIk1hcFwiKTtcclxudmFyIFRpbGVzID0gTGliLmdldE5vZGUoXCJUaWxlc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JNYXAoKXtcclxuXHJcblx0bWFwX2NvbnQubG9hZCA9IGZ1bmN0aW9uKHNpemVzKXtcclxuXHRcdHZhciBHcmlkID0gQ3JHcmlkKHNpemVzLCBcImdyaWQtYm9yZGVyXCIpO1xyXG5cdFx0R3JpZC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcIkdyaWRcIik7XHJcblxyXG5cdFx0d2hpbGUoc2l6ZXMubGF5ZXJzLS0pXHJcblx0XHRcdG1hcF9jb250LmFwcGVuZENoaWxkKENyTGF5ZXIoc2l6ZXMpKTtcclxuXHJcblx0XHRtYXBfY29udC5hcHBlbmRDaGlsZChHcmlkKTtcclxuXHR9XHJcblxyXG5cdG1hcF9jb250LmRyYXcgPSBmdW5jdGlvbihtZXNzKXtcclxuXHRcdHZhciBjb29yZHMgPSBtZXNzLmNvb3JkcztcclxuXHRcdGlmKGNvb3Jkcy5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdGlmKG1lc3MudG9vbCA9PSBcIlBlblwiKXtcclxuXHRcdFx0dmFyIHRpbGUgPSBUaWxlcy5nZXRUaWxlKG1lc3MudGlsZV9pZCk7XHJcblxyXG5cdFx0XHR0aGlzLmNoaWxkcmVuW2Nvb3Jkc1swXS56XS5wZW4odGlsZSwgY29vcmRzKTtcdFx0XHRcclxuXHRcdH1cclxuXHRcdGlmKG1lc3MudG9vbCA9PSBcIkNsZWFyXCIpIHRoaXMuY2hpbGRyZW5bY29vcmRzWzBdLnpdLmNsZWFyKG1lc3MuY29vcmRzKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBtYXBfY29udDtcclxuXHRcclxufVxyXG5cclxuZnVuY3Rpb24gQ3JMYXllcihzaXplcyl7XHJcblx0dmFyIGxheWVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHRsYXllci5jbGFzc0xpc3QuYWRkKFwibGF5ZXJcIik7XHJcblx0bGF5ZXIuc3R5bGUud2lkdGggPSBcIjEwMCVcIjtcclxuXHRsYXllci5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcclxuXHJcblx0dmFyIHdfc2l6ZSA9IDEwMCAvIHNpemVzLndpZHRoO1xyXG5cdHZhciBoX3NpemUgPSAxMDAgLyBzaXplcy5oZWlnaHQ7XHJcblxyXG5cdGxheWVyLnNob3cgPSBmdW5jdGlvbigpe1xyXG5cdFx0bGF5ZXIuc3R5bGUub3BhY2l0eSA9IDA7XHJcblx0fVxyXG5cclxuXHRsYXllci5oaWRlID0gZnVuY3Rpb24oKXtcclxuXHRcdGxheWVyLnN0eWxlLm9wYWNpdHkgPSAxO1xyXG5cdH1cclxuXHJcblx0bGF5ZXIuY2xlYXIgPSBmdW5jdGlvbihjb29yZHMpe1xyXG5cdFx0Y29vcmRzID0gY29vcmRzWzBdO1xyXG5cclxuXHRcdGlmKCFsYXllcltjb29yZHMueV0gfHwgIWxheWVyW2Nvb3Jkcy55XVtjb29yZHMueF0pIHRocm93IG5ldyBFcnJvcigpO1xyXG5cdFx0bGF5ZXJbY29vcmRzLnldW2Nvb3Jkcy54XS5yZW1vdmUoKTtcclxuXHR9XHJcblxyXG5cdGxheWVyLnBlbiA9IGZ1bmN0aW9uKHRpbGUsIGNvb3Jkcyl7XHJcblx0XHRjb29yZHMgPSBjb29yZHNbMF07XHJcblxyXG5cdFx0dmFyIGJveCA9IExpYi5kcmF3VGlsZSh0aWxlLmltYWdlc1swXSk7XHJcblx0XHRib3gudGlsZSA9IHRpbGUuaWQ7XHJcblx0XHRib3guY2xhc3NMaXN0LmFkZChcImJveFwiKTtcclxuXHJcblx0XHRib3guc3R5bGUud2lkdGggPSB0aWxlLnNpemUqd19zaXplICsgXCIlXCI7XHJcblx0XHRib3guc3R5bGUuaGVpZ2h0ID0gdGlsZS5zaXplKmhfc2l6ZSArIFwiJVwiO1xyXG5cclxuXHRcdGJveC5zdHlsZS5sZWZ0ID0gY29vcmRzLngqd19zaXplICsgXCIlXCI7XHJcblx0XHRib3guc3R5bGUudG9wID0gY29vcmRzLnkqaF9zaXplICsgXCIlXCI7XHJcblxyXG5cdFx0bGF5ZXIuYXBwZW5kQ2hpbGQoYm94KTtcclxuXHJcblx0XHRpZighbGF5ZXJbY29vcmRzLnldKSBsYXllcltjb29yZHMueV0gPSBbXTtcclxuXHRcdGxheWVyW2Nvb3Jkcy55XVtjb29yZHMueF0gPSBib3g7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbGF5ZXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENyR3JpZChzaXplcywgYm9yZGVyKXtcclxuXHR2YXIgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cdGxheWVyLmNsYXNzTGlzdC5hZGQoXCJsYXllclwiKTtcclxuXHRsYXllci5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xyXG5cdGxheWVyLnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xyXG5cdGRyYXdHcmlkKGxheWVyLCBzaXplcywgYm9yZGVyKTtcclxuXHJcblx0bGF5ZXIuc2hvdyA9IGZ1bmN0aW9uKCl7XHJcblx0XHRsYXllci5zdHlsZS5vcGFjaXR5ID0gMDtcclxuXHR9XHJcblxyXG5cdGxheWVyLmhpZGUgPSBmdW5jdGlvbigpe1xyXG5cdFx0bGF5ZXIuc3R5bGUub3BhY2l0eSA9IDE7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbGF5ZXI7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBkcmF3R3JpZChjb250YWluZXIsIGdyaWRfc2l6ZSwgYm9yZGVyKXtcclxuXHR2YXIgd19zaXplID0gMTAwIC8gZ3JpZF9zaXplLndpZHRoO1xyXG5cdHZhciBoX3NpemUgPSAxMDAgLyBncmlkX3NpemUuaGVpZ2h0O1xyXG5cdGZvcih2YXIgaSA9IGdyaWRfc2l6ZS53aWR0aCAtIDE7IGkgPj0gMDsgaS0tKXtcclxuXHRcdGZvcih2YXIgaiA9IGdyaWRfc2l6ZS5oZWlnaHQgLSAxOyBqID49IDA7IGotLSl7XHJcblx0XHRcdHZhciBib3ggPSBkYXJ3Qm94KHdfc2l6ZSwgaF9zaXplLCBib3JkZXIpO1xyXG5cclxuXHRcdFx0Ym94LnN0eWxlLmxlZnQgPSBpKndfc2l6ZSArIFwiJVwiO1xyXG5cdFx0XHRib3guc3R5bGUudG9wID0gaipoX3NpemUgKyBcIiVcIjtcclxuXHJcblx0XHRcdGJveC54ID0gaTtcclxuXHRcdFx0Ym94LnkgPSBqO1xyXG5cdFx0XHRcclxuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGJveCk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBkYXJ3Qm94KHdpZHRoLCBoZWlnaHQsIGJvcmRlcil7XHJcblx0dmFyIGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdGJveC5jbGFzc0xpc3QuYWRkKFwiYm94XCIpO1xyXG5cdGlmKGJvcmRlcikgXHJcblx0XHRib3guY2xhc3NMaXN0LmFkZChib3JkZXIpO1xyXG5cclxuXHRib3guc3R5bGUud2lkdGggPSB3aWR0aCArIFwiJVwiO1xyXG5cdGJveC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBcIiVcIjtcclxuXHJcblx0cmV0dXJuIGJveDtcclxufSIsImZ1bmN0aW9uIENyU3dpdGNoKG5hbWVfY2xhc3MsIGlkcyl7XG5cdGlmKEFycmF5LmlzQXJyYXkoaWRzKSl7XG5cdFx0dmFyIGVsZW1zID0gaWRzLm1hcChnZXROb2RlKTtcblx0XHRlbGVtcyA9IGVsZW1zLm1hcChlbGVtID0+IGVsZW0uY2xhc3NMaXN0KTtcblxuXHRcdHJldHVybiBhcnJTd2ljdGguYmluZChudWxsLCBlbGVtcywgbmFtZV9jbGFzcyk7XG5cdH1cblx0ZWxzZSBpZih0eXBlb2YgaWRzID09IFwib2JqZWN0XCIpe1xuXHRcdHJldHVybiBvYmpTd2l0Y2goaWRzLCBuYW1lX2NsYXNzKTtcblx0fVxuXHRlbHNle1xuXHRcdHZhciBlbGVtID0gZ2V0Tm9kZShpZHMpLmNsYXNzTGlzdDtcblx0XHRyZXR1cm4gb25lU3dpdGNoLmJpbmQobnVsbCwgbmFtZV9jbGFzcywgZWxlbSk7XG5cdH1cblx0XG59XG5cbmZ1bmN0aW9uIG9ialN3aXRjaChpZF9vYmosIGNsYXNzX25hbWUpe1xuXHRmb3IgKHZhciBrZXkgaW4gaWRfb2JqKXtcblx0XHRpZF9vYmpba2V5XSA9IGdldE5vZGUoaWRfb2JqW2tleV0pLmNsYXNzTGlzdDtcblx0fVxuXG5cdHJldHVybiBmdW5jdGlvbihpZCl7XG5cdFx0Zm9yICh2YXIgaSBpbiBpZF9vYmope1xuXHRcdFx0aWRfb2JqW2ldLmFkZChjbGFzc19uYW1lKTtcblx0XHR9XG5cdFx0XG5cdFx0aWRfb2JqW2lkXS5yZW1vdmUoY2xhc3NfbmFtZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gYXJyU3dpY3RoKGVsZW1fYXJyLCBuYW1lX2NsYXNzKXtcblx0ZWxlbV9hcnIuZm9yRWFjaChvbmVTd2l0Y2guYmluZChudWxsLCBuYW1lX2NsYXNzKSk7XG59XG5cbmZ1bmN0aW9uIG9uZVN3aXRjaChuYW1lX2NsYXNzLCBlbGVtKXtcblx0XHRlbGVtLnRvZ2dsZShuYW1lX2NsYXNzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDclN3aXRjaDtcblxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XG5cdHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXHRpZighZWxlbSkgdGhyb3cgbmV3IEVycm9yKFwiRWxlbSBpcyBub3QgZmluZCFcIik7XG5cdHJldHVybiBlbGVtO1xufSIsImNvbnN0IExpYiA9IHJlcXVpcmUoXCIuL2RyYXdMaWIuanNcIik7XHJcblxyXG52YXIgdGlsZXNfY29udCA9IExpYi5nZXROb2RlKFwiVGlsZXNcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENyVGlsZXMoY29udGFpbmVyKXtcclxuXHR2YXIgdGlsZXMgPSBbXTtcclxuXHJcblx0dGlsZXNfY29udC5hZGQgPSBmdW5jdGlvbihuZXdfdGlsZSl7XHJcblx0XHR2YXIgdGlsZSA9IExpYi5kcmF3VGlsZShuZXdfdGlsZS5pbWFnZXNbMF0pO1xyXG5cdFx0dGlsZS50aWxlID0gbmV3X3RpbGU7XHJcblx0XHR0aWxlc19jb250LmFwcGVuZENoaWxkKHRpbGUpO1xyXG5cclxuXHRcdHRpbGVzW25ld190aWxlLmlkXSA9IG5ld190aWxlO1xyXG5cdH1cclxuXHJcblx0dGlsZXNfY29udC5nZXRUaWxlID0gZnVuY3Rpb24oaWQpe1xyXG5cdFx0cmV0dXJuIHRpbGVzW2lkXTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aWxlc19jb250O1xyXG59IiwicmVxdWlyZShcIi4vbW9mLmpzXCIpO1xyXG5jb25zdCBMaWIgPSByZXF1aXJlKFwiLi9kcmF3TGliLmpzXCIpO1xyXG5cclxuXHJcbnZhciB0b29sc19jb250ID0gTGliLmdldE5vZGUoXCJUb29sc1wiKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JUb29scygpe1xyXG5cdHZhciBwYWxsZXQgPSB7fTtcclxuXHR2YXIgdHlwZSA9IFwiUGVuXCI7XHJcblxyXG5cdHRoaXMuYWRkR2V0U2V0KFwidGlsZVwiLCBcclxuXHRcdGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmKHBhbGxldFt0eXBlXSkgcmV0dXJuIHBhbGxldFt0eXBlXS5pZDtcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0XHRwYWxsZXRbdHlwZV0gPSB2YWw7XHJcblxyXG5cdFx0XHRjaGFuZ2VUaWxlVmlldyh2YWwuaW1hZ2VzWzBdKTtcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHR0aGlzLmFkZEdldFNldChcInR5cGVcIiwgXHJcblx0XHRmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gdHlwZTtcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0XHR0eXBlID0gdmFsO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYocGFsbGV0W3R5cGVdKSBcclxuXHRcdFx0XHRjaGFuZ2VUaWxlVmlldyhwYWxsZXRbdHlwZV0uaW1hZ2VzWzBdKTtcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdGNoYW5nZVRpbGVWaWV3KG51bGwpO1xyXG5cdFx0fVxyXG5cdCk7XHJcblxyXG5cdHZhciB0aWxlVmlldyA9IExpYi5kcmF3VGlsZSgpO1xyXG5cdHRvb2xzX2NvbnQuYXBwZW5kQ2hpbGQodGlsZVZpZXcpO1xyXG5cclxuXHRmdW5jdGlvbiBjaGFuZ2VUaWxlVmlldyhpbWFnZSl7XHJcblx0XHR0aWxlVmlldy5yZW1vdmUoKTtcclxuXHRcdHRpbGVWaWV3ID0gTGliLmRyYXdUaWxlKGltYWdlKTtcclxuXHRcdHRvb2xzX2NvbnQuYXBwZW5kQ2hpbGQodGlsZVZpZXcpO1xyXG5cdH1cclxufSIsInJlcXVpcmUoXCJ0eXBlc2pzXCIpO1xyXG5yZXF1aXJlKFwidHlwZXNqcy9zdHJfdHlwZVwiKTtcclxuXHJcbnZhciB0eXBlc19kdXJhYmlsaXR5ID0gcmVxdWlyZShcIi4vdHlwZXNfZHVyYWJpbGl0eS5qc29uXCIpO1xyXG5cclxudmFyIFQgPSBPYmplY3QudHlwZXM7XHJcblxyXG52YXIgdGlsZV9pZF90eXBlID0gVC5wb3MoMjU2KTtcclxudmFyIGNvb3Jkc190eXBlID0ge3g6IFQucG9zKDIwKSwgeTogVC5wb3MoMjApLCB6OiBULnBvcygyKX07XHJcblxyXG52YXIgdGlsZV90eXBlID0gVC5vYmooe1xyXG5cdFx0aWQ6IFQuYW55KHVuZGVmaW5lZCwgdGlsZV9pZF90eXBlKSxcclxuXHRcdGltYWdlczogVC5hcnIoVC5zdHIoL15bXFx3XFxkXFxzKzo7Liw/PSNcXC88PlwiKCktXSokLywgMTAyNCoxMDI0KSksXHJcblx0XHR0eXBlOiBULmFueShPYmplY3QudmFsdWVzKHR5cGVzX2R1cmFiaWxpdHkpKSxcclxuXHRcdHNpemU6IFQucG9zKDIwKVxyXG59KTtcclxuXHJcbnZhciBuZXdfdGlsZV9tZXNzX3R5cGUgPSBULm9iaih7XHJcblx0YWN0aW9uOiBcIkFkZFwiLFxyXG5cdHR5cGU6IFwiVGlsZVwiLFxyXG5cdHRpbGU6IHRpbGVfdHlwZVxyXG59KTtcclxuXHJcbnZhciBtYXBfc2l6ZV90eXBlID0gVC5vYmooe1xyXG5cdHdpZHRoOiAyMCwgXHJcblx0aGVpZ2h0OiAyMCwgXHJcblx0bGF5ZXJzOiAyXHJcbn0pO1xyXG5cclxudmFyIG5ld19tYXBfbWVzc190eXBlID0gVC5vYmooe1xyXG5cdGFjdGlvbjogXCJDcmVhdGVcIixcclxuXHR0eXBlOiBcIk1hcFwiLFxyXG5cdHNpemVzOiBtYXBfc2l6ZV90eXBlXHJcbn0pO1xyXG5cclxudmFyIGRyYXdfbWVzc190eXBlID0ge1xyXG5cdGFjdGlvbjogXCJEcmF3XCIsXHJcblx0dHlwZTogXCJNYXBcIixcclxuXHR0b29sOiBcIlBlblwiLFxyXG5cdGNvb3JkczogY29vcmRzX3R5cGUsXHJcblx0dGlsZV9pZDogdGlsZV9pZF90eXBlXHJcbn07XHJcblxyXG52YXIgY2xlYXJfbWVzc190eXBlID0ge1xyXG5cdGFjdGlvbjogXCJEcmF3XCIsXHJcblx0dHlwZTogXCJNYXBcIixcclxuXHR0b29sOiBcIkNsZWFyXCIsXHJcblx0Y29vcmRzOiBjb29yZHNfdHlwZVxyXG59O1xyXG5cclxudmFyIGNsZWFyX21lc3NfdHlwZV9mb3JfZGlzcGxheSA9IHtcclxuXHRhY3Rpb246IFwiRHJhd1wiLFxyXG5cdHR5cGU6IFwiTWFwXCIsXHJcblx0dG9vbDogXCJDbGVhclwiLFxyXG5cdGNvb3JkczogVC5hcnIoY29vcmRzX3R5cGUsIDIwLCBmYWxzZSlcclxufTtcclxuXHJcbnZhciBkcmF3X21lc3NfdHlwZV9mb3JfZGlzcGxheSA9IHtcclxuXHRhY3Rpb246IFwiRHJhd1wiLFxyXG5cdHR5cGU6IFwiTWFwXCIsXHJcblx0dG9vbDogXCJQZW5cIixcclxuXHRjb29yZHM6IFQuYXJyKGNvb3Jkc190eXBlLCAyMCwgZmFsc2UpLFxyXG5cdHRpbGVfaWQ6IHRpbGVfaWRfdHlwZVxyXG59O1xyXG5cclxudmFyIG1lc3NfdHlwZXNfb25lID0gVC5hbnkoW1xyXG5cdGRyYXdfbWVzc190eXBlLCBcclxuXHRuZXdfdGlsZV9tZXNzX3R5cGUsIFxyXG5cdGNsZWFyX21lc3NfdHlwZV0pO1xyXG5cclxudmFyIG1lc3NfdHlwZXNfdHdvID0gVC5hbnkoW1xyXG5cdGRyYXdfbWVzc190eXBlX2Zvcl9kaXNwbGF5LFxyXG5cdG5ld190aWxlX21lc3NfdHlwZSwgXHJcblx0bmV3X21hcF9tZXNzX3R5cGUsXHJcblx0Y2xlYXJfbWVzc190eXBlX2Zvcl9kaXNwbGF5XSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtcclxuXHRmdW5jdGlvbih2YWwpe1xyXG5cdFx0aWYobWVzc190eXBlc19vbmUudGVzdCh2YWwpKVxyXG5cdFx0XHR0aHJvdyBtZXNzX3R5cGVzX29uZS50ZXN0KHZhbCk7XHJcblx0fSwgXHJcblx0ZnVuY3Rpb24odmFsKXtcclxuXHRcdGlmKG1lc3NfdHlwZXNfdHdvLnRlc3QodmFsKSlcclxuXHRcdFx0dGhyb3cgbWVzc190eXBlc190d28udGVzdCh2YWwpO1xyXG5cdH1dO1xyXG4iLCJjb25zdCBIZWFyID0gcmVxdWlyZShcIi4vRXZlbnRzLmpzXCIpO1xyXG5jb25zdCBDclN3aXRjaEVsZW0gPSByZXF1aXJlKFwiLi9Td2l0Y2guanNcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKEZvcm0sIFRvb2wpe1xyXG5cclxuXHR0aGlzLnN3aXRjaEFkZEZvcm0gPSBDclN3aXRjaEVsZW0oXCJpbnZpc1wiLCBcIkFkZEZvcm1cIik7XHJcblxyXG5cdEhlYXIoXCJhZGRfc3dpdGNoXCIsIFwiY2xpY2tcIiwgdGhpcy5zd2l0Y2hBZGRGb3JtKTtcclxuXHJcblx0SGVhcihcIkFkZEltYWdlSW5wdXRcIiwgXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMuZmlsZXNbMF0pXHJcblx0XHRcdEZvcm0uSW1hZ2VzLmFkZCh0aGlzLmZpbGVzWzBdKTtcclxuXHR9KTtcclxuXHJcblx0SGVhcihcIlRpbGVzXCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRpZihlLnRhcmdldC50aWxlKXtcclxuXHRcdFx0VG9vbC50aWxlID0gZS50YXJnZXQudGlsZTtcclxuXHRcdFx0UHJlc3MoZSk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdEhlYXIoXCJUb29sc1wiLCBcImNsaWNrXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwidG9vbFwiKSl7XHJcblx0XHRcdFRvb2wudHlwZSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcInRvb2xcIik7XHJcblx0XHRcdFByZXNzKGUpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRIZWFyKFwiTWFwXCIsIFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH0pO1xyXG5cclxuXHRcclxuXHJcbn07XHJcblxyXG5mdW5jdGlvbiBQcmVzcyhlKXtcclxuXHRcdGUudGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJwcmVzc1wiKTtcclxuXHRcdHNldFRpbWVvdXQoKCk9PmUudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJwcmVzc1wiKSwgMzAwKTtcclxufSIsIlxyXG5cclxuY29uc3QgQ3JJbnRlciA9IHJlcXVpcmUoXCIuL2ludGVyLmpzXCIpO1xyXG52YXIgVHlwZXMgPSByZXF1aXJlKFwiLi9UeXBlcy5qc1wiKTtcclxuXHJcbmNvbnN0IERpc3BsYXkgPSByZXF1aXJlKFwiLi9EaXNwbGF5LmpzXCIpO1xyXG5jb25zdCBDckxvZ2ljID0gcmVxdWlyZShcIi4vTG9naWMuanNcIik7XHJcblxyXG5jb25zdCBEaXNwbGF5SW50ZXIgPSBuZXcgQ3JJbnRlcigpO1xyXG5EaXNwbGF5SW50ZXIudGVzdChUeXBlcywgY29uc29sZS5sb2cpO1xyXG5cclxuRGlzcGxheShEaXNwbGF5SW50ZXIpO1xyXG5cclxuQ3JMb2dpYyhEaXNwbGF5SW50ZXIpO1xyXG5cclxuXHJcblxyXG5cclxuIiwiZXhwb3J0cy5kcmF3VGlsZSA9IGZ1bmN0aW9uKHN2Z19pbWcpe1xyXG5cdFxyXG5cdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHRpbWcuc3JjID0gXCJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFwiKyBCYXNlNjQuZW5jb2RlKHN2Z19pbWcpO1xyXG5cclxuXHRpbWcuY2xhc3NMaXN0LmFkZChcInRpbGVcIik7XHJcblx0XHJcblx0cmV0dXJuIGltZztcclxufVxyXG5cclxuZXhwb3J0cy5nZXROb2RlID0gZnVuY3Rpb24oaWQpe1xyXG5cdHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG5cdGlmKCFlbGVtKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtIGlzIG5vdCBmaW5kIVwiKTtcclxuXHRyZXR1cm4gZWxlbTtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3JJbnRlcmZpY2UodGVzdGVzLCBsb2cpe1xyXG5cdHZhciBpc190ZXN0ID0gZmFsc2U7XHJcblx0XHJcblx0dGhpcy50ZXN0ID0gZnVuY3Rpb24obmV3X3Rlc3RlcywgbmV3X2xvZyl7XHJcblx0XHRpZihuZXdfdGVzdGVzKXtcclxuXHRcdFx0aWYodHlwZW9mKG5ld190ZXN0ZXNbMF0pID09IFwiZnVuY3Rpb25cIiBcclxuXHRcdFx0JiYgdHlwZW9mKG5ld190ZXN0ZXNbMV0pID09IFwiZnVuY3Rpb25cIil7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dGVzdGVzID0gbmV3X3Rlc3RlcztcclxuXHRcdFx0XHRpc190ZXN0ID0gdHJ1ZTtcclxuXHRcdFx0XHRcclxuXHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0Y29uc29sZS5lcnJvcihuZXcgRXJyb3IoXCJUZXN0IGlzIG5vdCBmdW5jdGlvbiFcIikpO1xyXG5cdFx0XHRcdGlzX3Rlc3QgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYobmV3X2xvZyl7XHJcblx0XHRcdGlmKHR5cGVvZiBuZXdfbG9nID09IFwiZnVuY3Rpb25cIikgbG9nID0gbmV3X2xvZzsgZWxzZSBsb2cgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHRpZih0ZXN0ZXMpIHRoaXMudGVzdCh0ZXN0ZXMsIGxvZyk7XHJcblx0XHJcblx0dmFyIElucHV0T25lID0gbnVsbDtcclxuXHR2YXIgT3V0cHV0T25lID0gbnVsbDtcclxuXHRcclxuXHR0aGlzLmNvbm5lY3QgPSBmdW5jdGlvbihvdXRwdXRGdW5jKXtcclxuXHRcdGlmKE91dHB1dE9uZSl7XHJcblx0XHRcdGlmKGlzX3Rlc3Qpe1xyXG5cdFx0XHRcdHZhciBiZWdGdW5jID0gb3V0cHV0RnVuYztcclxuXHRcdFx0XHRvdXRwdXRGdW5jID0gZnVuY3Rpb24odmFsKXtcclxuXHRcdFx0XHRcdHRlc3Rlc1swXSh2YWwpO1xyXG5cdFx0XHRcdFx0aWYobG9nKSBsb2coXCIgT25lOiBcIiwgdmFsKTtcclxuXHRcdFx0XHRcdGJlZ0Z1bmModmFsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIFR3b0Nvbm5lY3Qob3V0cHV0RnVuYyk7XHJcblx0XHR9XHJcblx0XHRlbHNle1xyXG5cdFx0XHRpZihpc190ZXN0KXtcclxuXHRcdFx0XHR2YXIgYmVnRnVuYyA9IG91dHB1dEZ1bmM7XHJcblx0XHRcdFx0b3V0cHV0RnVuYyA9IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRcdFx0XHR0ZXN0ZXNbMV0odmFsKTtcclxuXHRcdFx0XHRcdGlmKGxvZykgbG9nKFwiIFR3bzogXCIsIHZhbCk7XHJcblx0XHRcdFx0XHRiZWdGdW5jKHZhbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBPbmVDb25uZWN0KG91dHB1dEZ1bmMpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0XHJcblx0ZnVuY3Rpb24gT25lQ29ubmVjdChvdXRwdXRGdW5jKXtcclxuXHRcdE91dHB1dE9uZSA9IG91dHB1dEZ1bmM7XHJcblx0XHRJbnB1dE9uZSA9IENySG9hcmRlcigpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24odmFsKXtcclxuXHRcdFx0SW5wdXRPbmUodmFsKTtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gVHdvQ29ubmVjdChvdXRwdXRGdW5jKXtcclxuXHRcdGlmKElucHV0T25lLnRha2UpIElucHV0T25lLnRha2Uob3V0cHV0RnVuYyk7XHJcblx0XHRJbnB1dE9uZSA9IG91dHB1dEZ1bmM7XHJcblx0XHRcclxuXHRcdHJldHVybiBPdXRwdXRPbmU7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBDckhvYXJkZXIoKXtcclxuXHR2YXIgaG9hcmRlciA9IFtdO1xyXG5cdFxyXG5cdHZhciBwdXNoID0gZnVuY3Rpb24odmFsKXtcclxuXHRcdGhvYXJkZXIucHVzaCh2YWwpO1xyXG5cdH07XHJcblx0XHJcblx0cHVzaC50YWtlID0gZnVuY3Rpb24oZnVuYyl7XHJcblx0XHRpZih0eXBlb2YgZnVuYyAhPSBcImZ1bmN0aW9uXCIpIHJldHVybiBob2FyZGVyO1xyXG5cdFx0XHJcblx0XHRob2FyZGVyLmZvckVhY2goZnVuY3Rpb24odmFsKXtcclxuXHRcdFx0XHRmdW5jKHZhbCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0XHJcblx0cmV0dXJuIHB1c2g7XHJcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuLy9DcmFmdCBvYmplY3QucHJvdHlwZVxuKGZ1bmN0aW9uKCl7XG5cdGlmKCB0eXBlb2YoT2JqZWN0LmNyUHJvcCkgPT0gXCJmdW5jdGlvblwiKXtcblx0XHRyZXR1cm47XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBjb25zdFByb3AobmFtZV9wcm9wLCB2YWx1ZSwgdmlzLCByZXdyaXRlKXtcblx0XHRcblx0XHRpZih2YWx1ZSA9PT0gdW5kZWZpbmVkKSB2YWx1ZSA9IHRydWU7XG5cdFx0aWYodmlzID09PSB1bmRlZmluZWQpIHZpcyA9IHRydWU7XG5cblx0XHRpZih0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIE9iamVjdC5mcmVlemUodmFsdWUpO1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lX3Byb3AsIHtcblx0XHRcdFx0dmFsdWU6IHZhbHVlLFxuXHRcdFx0XHRlbnVtZXJhYmxlOiB2aXMsXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogcmV3cml0ZSxcblx0XHRcdFx0d3JpdGFibGU6IHJld3JpdGUsXG5cdFx0XHR9KTtcblx0fVxuXHRmdW5jdGlvbiBnZXRTZXQobmFtZSwgZ2V0dGVyLCBzZXR0ZXIpe1xuXHRcdGlmKHR5cGVvZiBzZXR0ZXIgPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRzZXQ6IHNldHRlcixcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9ZWxzZXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0Y29uc3RQcm9wLmNhbGwoT2JqZWN0LnByb3RvdHlwZSwgJ2NyUHJvcCcsIGNvbnN0UHJvcCwgZmFsc2UpO1xuXHRPYmplY3QucHJvdG90eXBlLmNyUHJvcCgnYWRkR2V0U2V0JywgZ2V0U2V0LCBmYWxzZSk7XG5cdFxuXHRcblx0ZnVuY3Rpb24gcmFuZEluZGV4KCl7XG5cdFx0dmFyIHJhbmQgPSBNYXRoLnJvdW5kKCh0aGlzLmxlbmd0aCAtIDEpICogTWF0aC5yYW5kb20oKSk7XG5cdFx0cmV0dXJuIHRoaXNbcmFuZF07XG5cdH1cblx0XG5cdGZ1bmN0aW9uIEFkZEl0ZW0odmFsKXtcblx0XHRpZighdGhpcy5fbnVsbHMpIHRoaXMuX251bGxzID0gW107XG5cdFx0XG5cdFx0aWYodGhpcy5fbnVsbHMubGVuZ3RoKXtcblx0XHRcdHZhciBpbmQgPSB0aGlzLl9udWxscy5wb3AoKTtcblx0XHRcdHRoaXNbaW5kXSA9IHZhbDtcblx0XHRcdHJldHVybiBpbmQ7XG5cdFx0fWVsc2V7XG5cdFx0XHRyZXR1cm4gdGhpcy5wdXNoKHZhbCkgLSAxO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gRGVsbEl0ZW0oaW5kKXtcblx0XHRpZihpbmQgPiB0aGlzLmxlbmd0aCAtMSkgcmV0dXJuIGZhbHNlO1xuXHRcdFxuXHRcdGlmKGluZCA9PSB0aGlzLmxlbmd0aCAtMSl7XG5cdFx0XHR0aGlzLnBvcCgpO1xuXHRcdH1lbHNle1xuXHRcdFx0aWYoIXRoaXMuX251bGxzKSB0aGlzLl9udWxscyA9IFtdO1xuXHRcdFx0XG5cdFx0XHR0aGlzW2luZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHR0aGlzLl9udWxscy5wdXNoKGluZCk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB0cnVlO1x0XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGNyZWF0ZUFycih2YWwsIGxlbmd0aCwgaXNfY2FsbCl7XG5cdFx0dmFyIGFyciA9IFtdO1xuXHRcdFxuXHRcdGlmKCFsZW5ndGgpIGxlbmd0aCA9IDE7XG5cdFx0aWYoaXNfY2FsbCA9PT0gdW5kZWZpbmVkKSBpc19jYWxsID0gdHJ1ZTtcblx0XHRcblx0XHRpZih0eXBlb2YgdmFsID09ICdmdW5jdGlvbicgJiYgaXNfY2FsbCl7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRhcnIucHVzaCh2YWwoaSwgYXJyKSk7XG5cdFx0XHR9XG5cdFx0fWVsc2UgaWYodmFsICE9PSB1bmRlZmluZWQpe1xuXHRcdFx0XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRhcnIucHVzaCh2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGFyci5jclByb3AoJ3JhbmRfaScsIHJhbmRJbmRleCk7XG5cdFx0YXJyLmNyUHJvcCgnYWRkJywgQWRkSXRlbSk7XG5cdFx0YXJyLmNyUHJvcCgnZGVsbCcsIERlbGxJdGVtKTtcblx0XHRcblx0XHRyZXR1cm4gYXJyO1xuXHR9XG5cdFxuXHRcblx0XG5cdEFycmF5LmNyUHJvcCgnY3JlYXRlJywgY3JlYXRlQXJyKTtcblx0XG5cdFxuXHRpZihSZWdFeHAucHJvdG90eXBlLnRvSlNPTiAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRSZWdFeHAucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnNvdXJjZTsgfTtcblx0fVxuXG59KSgpO1xuXG5cblxuXG4iLCIvKlxuICogIGJhc2U2NC5qc1xuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQlNEIDMtQ2xhdXNlIExpY2Vuc2UuXG4gKiAgICBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKlxuICogIFJlZmVyZW5jZXM6XG4gKiAgICBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NFxuICovXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZ2xvYmFsKVxuICAgICAgICA6IHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZFxuICAgICAgICA/IGRlZmluZShmYWN0b3J5KSA6IGZhY3RvcnkoZ2xvYmFsKVxufSgoXG4gICAgdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZlxuICAgICAgICA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93XG4gICAgICAgIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWxcbjogdGhpc1xuKSwgZnVuY3Rpb24oZ2xvYmFsKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIGV4aXN0aW5nIHZlcnNpb24gZm9yIG5vQ29uZmxpY3QoKVxuICAgIGdsb2JhbCA9IGdsb2JhbCB8fCB7fTtcbiAgICB2YXIgX0Jhc2U2NCA9IGdsb2JhbC5CYXNlNjQ7XG4gICAgdmFyIHZlcnNpb24gPSBcIjIuNS4xXCI7XG4gICAgLy8gaWYgbm9kZS5qcyBhbmQgTk9UIFJlYWN0IE5hdGl2ZSwgd2UgdXNlIEJ1ZmZlclxuICAgIHZhciBidWZmZXI7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBidWZmZXIgPSBldmFsKFwicmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyXCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGJ1ZmZlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zdGFudHNcbiAgICB2YXIgYjY0Y2hhcnNcbiAgICAgICAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG4gICAgdmFyIGI2NHRhYiA9IGZ1bmN0aW9uKGJpbikge1xuICAgICAgICB2YXIgdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGJpbi5sZW5ndGg7IGkgPCBsOyBpKyspIHRbYmluLmNoYXJBdChpKV0gPSBpO1xuICAgICAgICByZXR1cm4gdDtcbiAgICB9KGI2NGNoYXJzKTtcbiAgICB2YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcbiAgICAvLyBlbmNvZGVyIHN0dWZmXG4gICAgdmFyIGNiX3V0b2IgPSBmdW5jdGlvbihjKSB7XG4gICAgICAgIGlmIChjLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHZhciBjYyA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgICAgIHJldHVybiBjYyA8IDB4ODAgPyBjXG4gICAgICAgICAgICAgICAgOiBjYyA8IDB4ODAwID8gKGZyb21DaGFyQ29kZSgweGMwIHwgKGNjID4+PiA2KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8IChjYyAmIDB4M2YpKSlcbiAgICAgICAgICAgICAgICA6IChmcm9tQ2hhckNvZGUoMHhlMCB8ICgoY2MgPj4+IDEyKSAmIDB4MGYpKVxuICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoKGNjID4+PiAgNikgJiAweDNmKSlcbiAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKCBjYyAgICAgICAgICYgMHgzZikpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBjYyA9IDB4MTAwMDBcbiAgICAgICAgICAgICAgICArIChjLmNoYXJDb2RlQXQoMCkgLSAweEQ4MDApICogMHg0MDBcbiAgICAgICAgICAgICAgICArIChjLmNoYXJDb2RlQXQoMSkgLSAweERDMDApO1xuICAgICAgICAgICAgcmV0dXJuIChmcm9tQ2hhckNvZGUoMHhmMCB8ICgoY2MgPj4+IDE4KSAmIDB4MDcpKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKChjYyA+Pj4gMTIpICYgMHgzZikpXG4gICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoKGNjID4+PiAgNikgJiAweDNmKSlcbiAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICggY2MgICAgICAgICAmIDB4M2YpKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciByZV91dG9iID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRkZdfFteXFx4MDAtXFx4N0ZdL2c7XG4gICAgdmFyIHV0b2IgPSBmdW5jdGlvbih1KSB7XG4gICAgICAgIHJldHVybiB1LnJlcGxhY2UocmVfdXRvYiwgY2JfdXRvYik7XG4gICAgfTtcbiAgICB2YXIgY2JfZW5jb2RlID0gZnVuY3Rpb24oY2NjKSB7XG4gICAgICAgIHZhciBwYWRsZW4gPSBbMCwgMiwgMV1bY2NjLmxlbmd0aCAlIDNdLFxuICAgICAgICBvcmQgPSBjY2MuY2hhckNvZGVBdCgwKSA8PCAxNlxuICAgICAgICAgICAgfCAoKGNjYy5sZW5ndGggPiAxID8gY2NjLmNoYXJDb2RlQXQoMSkgOiAwKSA8PCA4KVxuICAgICAgICAgICAgfCAoKGNjYy5sZW5ndGggPiAyID8gY2NjLmNoYXJDb2RlQXQoMikgOiAwKSksXG4gICAgICAgIGNoYXJzID0gW1xuICAgICAgICAgICAgYjY0Y2hhcnMuY2hhckF0KCBvcmQgPj4+IDE4KSxcbiAgICAgICAgICAgIGI2NGNoYXJzLmNoYXJBdCgob3JkID4+PiAxMikgJiA2MyksXG4gICAgICAgICAgICBwYWRsZW4gPj0gMiA/ICc9JyA6IGI2NGNoYXJzLmNoYXJBdCgob3JkID4+PiA2KSAmIDYzKSxcbiAgICAgICAgICAgIHBhZGxlbiA+PSAxID8gJz0nIDogYjY0Y2hhcnMuY2hhckF0KG9yZCAmIDYzKVxuICAgICAgICBdO1xuICAgICAgICByZXR1cm4gY2hhcnMuam9pbignJyk7XG4gICAgfTtcbiAgICB2YXIgYnRvYSA9IGdsb2JhbC5idG9hID8gZnVuY3Rpb24oYikge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLmJ0b2EoYik7XG4gICAgfSA6IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIGIucmVwbGFjZSgvW1xcc1xcU117MSwzfS9nLCBjYl9lbmNvZGUpO1xuICAgIH07XG4gICAgdmFyIF9lbmNvZGUgPSBidWZmZXIgP1xuICAgICAgICBidWZmZXIuZnJvbSAmJiBVaW50OEFycmF5ICYmIGJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb21cbiAgICAgICAgPyBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuICh1LmNvbnN0cnVjdG9yID09PSBidWZmZXIuY29uc3RydWN0b3IgPyB1IDogYnVmZmVyLmZyb20odSkpXG4gICAgICAgICAgICAgICAgLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICB9XG4gICAgICAgIDogIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gKHUuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvciA/IHUgOiBuZXcgIGJ1ZmZlcih1KSlcbiAgICAgICAgICAgICAgICAudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbiAodSkgeyByZXR1cm4gYnRvYSh1dG9iKHUpKSB9XG4gICAgO1xuICAgIHZhciBlbmNvZGUgPSBmdW5jdGlvbih1LCB1cmlzYWZlKSB7XG4gICAgICAgIHJldHVybiAhdXJpc2FmZVxuICAgICAgICAgICAgPyBfZW5jb2RlKFN0cmluZyh1KSlcbiAgICAgICAgICAgIDogX2VuY29kZShTdHJpbmcodSkpLnJlcGxhY2UoL1srXFwvXS9nLCBmdW5jdGlvbihtMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtMCA9PSAnKycgPyAnLScgOiAnXyc7XG4gICAgICAgICAgICB9KS5yZXBsYWNlKC89L2csICcnKTtcbiAgICB9O1xuICAgIHZhciBlbmNvZGVVUkkgPSBmdW5jdGlvbih1KSB7IHJldHVybiBlbmNvZGUodSwgdHJ1ZSkgfTtcbiAgICAvLyBkZWNvZGVyIHN0dWZmXG4gICAgdmFyIHJlX2J0b3UgPSBuZXcgUmVnRXhwKFtcbiAgICAgICAgJ1tcXHhDMC1cXHhERl1bXFx4ODAtXFx4QkZdJyxcbiAgICAgICAgJ1tcXHhFMC1cXHhFRl1bXFx4ODAtXFx4QkZdezJ9JyxcbiAgICAgICAgJ1tcXHhGMC1cXHhGN11bXFx4ODAtXFx4QkZdezN9J1xuICAgIF0uam9pbignfCcpLCAnZycpO1xuICAgIHZhciBjYl9idG91ID0gZnVuY3Rpb24oY2NjYykge1xuICAgICAgICBzd2l0Y2goY2NjYy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgdmFyIGNwID0gKCgweDA3ICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCAxOClcbiAgICAgICAgICAgICAgICB8ICAgICgoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSkgPDwgMTIpXG4gICAgICAgICAgICAgICAgfCAgICAoKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMikpIDw8ICA2KVxuICAgICAgICAgICAgICAgIHwgICAgICgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDMpKSxcbiAgICAgICAgICAgIG9mZnNldCA9IGNwIC0gMHgxMDAwMDtcbiAgICAgICAgICAgIHJldHVybiAoZnJvbUNoYXJDb2RlKChvZmZzZXQgID4+PiAxMCkgKyAweEQ4MDApXG4gICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKChvZmZzZXQgJiAweDNGRikgKyAweERDMDApKTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIGZyb21DaGFyQ29kZShcbiAgICAgICAgICAgICAgICAoKDB4MGYgJiBjY2NjLmNoYXJDb2RlQXQoMCkpIDw8IDEyKVxuICAgICAgICAgICAgICAgICAgICB8ICgoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSkgPDwgNilcbiAgICAgICAgICAgICAgICAgICAgfCAgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMikpXG4gICAgICAgICAgICApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICBmcm9tQ2hhckNvZGUoXG4gICAgICAgICAgICAgICAgKCgweDFmICYgY2NjYy5jaGFyQ29kZUF0KDApKSA8PCA2KVxuICAgICAgICAgICAgICAgICAgICB8ICAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgxKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBidG91ID0gZnVuY3Rpb24oYikge1xuICAgICAgICByZXR1cm4gYi5yZXBsYWNlKHJlX2J0b3UsIGNiX2J0b3UpO1xuICAgIH07XG4gICAgdmFyIGNiX2RlY29kZSA9IGZ1bmN0aW9uKGNjY2MpIHtcbiAgICAgICAgdmFyIGxlbiA9IGNjY2MubGVuZ3RoLFxuICAgICAgICBwYWRsZW4gPSBsZW4gJSA0LFxuICAgICAgICBuID0gKGxlbiA+IDAgPyBiNjR0YWJbY2NjYy5jaGFyQXQoMCldIDw8IDE4IDogMClcbiAgICAgICAgICAgIHwgKGxlbiA+IDEgPyBiNjR0YWJbY2NjYy5jaGFyQXQoMSldIDw8IDEyIDogMClcbiAgICAgICAgICAgIHwgKGxlbiA+IDIgPyBiNjR0YWJbY2NjYy5jaGFyQXQoMildIDw8ICA2IDogMClcbiAgICAgICAgICAgIHwgKGxlbiA+IDMgPyBiNjR0YWJbY2NjYy5jaGFyQXQoMyldICAgICAgIDogMCksXG4gICAgICAgIGNoYXJzID0gW1xuICAgICAgICAgICAgZnJvbUNoYXJDb2RlKCBuID4+PiAxNiksXG4gICAgICAgICAgICBmcm9tQ2hhckNvZGUoKG4gPj4+ICA4KSAmIDB4ZmYpLFxuICAgICAgICAgICAgZnJvbUNoYXJDb2RlKCBuICAgICAgICAgJiAweGZmKVxuICAgICAgICBdO1xuICAgICAgICBjaGFycy5sZW5ndGggLT0gWzAsIDAsIDIsIDFdW3BhZGxlbl07XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbiAgICB9O1xuICAgIHZhciBfYXRvYiA9IGdsb2JhbC5hdG9iID8gZnVuY3Rpb24oYSkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLmF0b2IoYSk7XG4gICAgfSA6IGZ1bmN0aW9uKGEpe1xuICAgICAgICByZXR1cm4gYS5yZXBsYWNlKC9cXFN7MSw0fS9nLCBjYl9kZWNvZGUpO1xuICAgIH07XG4gICAgdmFyIGF0b2IgPSBmdW5jdGlvbihhKSB7XG4gICAgICAgIHJldHVybiBfYXRvYihTdHJpbmcoYSkucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9dL2csICcnKSk7XG4gICAgfTtcbiAgICB2YXIgX2RlY29kZSA9IGJ1ZmZlciA/XG4gICAgICAgIGJ1ZmZlci5mcm9tICYmIFVpbnQ4QXJyYXkgJiYgYnVmZmVyLmZyb20gIT09IFVpbnQ4QXJyYXkuZnJvbVxuICAgICAgICA/IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHJldHVybiAoYS5jb25zdHJ1Y3RvciA9PT0gYnVmZmVyLmNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgICAgID8gYSA6IGJ1ZmZlci5mcm9tKGEsICdiYXNlNjQnKSkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHJldHVybiAoYS5jb25zdHJ1Y3RvciA9PT0gYnVmZmVyLmNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgICAgID8gYSA6IG5ldyBidWZmZXIoYSwgJ2Jhc2U2NCcpKS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24oYSkgeyByZXR1cm4gYnRvdShfYXRvYihhKSkgfTtcbiAgICB2YXIgZGVjb2RlID0gZnVuY3Rpb24oYSl7XG4gICAgICAgIHJldHVybiBfZGVjb2RlKFxuICAgICAgICAgICAgU3RyaW5nKGEpLnJlcGxhY2UoL1stX10vZywgZnVuY3Rpb24obTApIHsgcmV0dXJuIG0wID09ICctJyA/ICcrJyA6ICcvJyB9KVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgJycpXG4gICAgICAgICk7XG4gICAgfTtcbiAgICB2YXIgbm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgQmFzZTY0ID0gZ2xvYmFsLkJhc2U2NDtcbiAgICAgICAgZ2xvYmFsLkJhc2U2NCA9IF9CYXNlNjQ7XG4gICAgICAgIHJldHVybiBCYXNlNjQ7XG4gICAgfTtcbiAgICAvLyBleHBvcnQgQmFzZTY0XG4gICAgZ2xvYmFsLkJhc2U2NCA9IHtcbiAgICAgICAgVkVSU0lPTjogdmVyc2lvbixcbiAgICAgICAgYXRvYjogYXRvYixcbiAgICAgICAgYnRvYTogYnRvYSxcbiAgICAgICAgZnJvbUJhc2U2NDogZGVjb2RlLFxuICAgICAgICB0b0Jhc2U2NDogZW5jb2RlLFxuICAgICAgICB1dG9iOiB1dG9iLFxuICAgICAgICBlbmNvZGU6IGVuY29kZSxcbiAgICAgICAgZW5jb2RlVVJJOiBlbmNvZGVVUkksXG4gICAgICAgIGJ0b3U6IGJ0b3UsXG4gICAgICAgIGRlY29kZTogZGVjb2RlLFxuICAgICAgICBub0NvbmZsaWN0OiBub0NvbmZsaWN0LFxuICAgICAgICBfX2J1ZmZlcl9fOiBidWZmZXJcbiAgICB9O1xuICAgIC8vIGlmIEVTNSBpcyBhdmFpbGFibGUsIG1ha2UgQmFzZTY0LmV4dGVuZFN0cmluZygpIGF2YWlsYWJsZVxuICAgIGlmICh0eXBlb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBub0VudW0gPSBmdW5jdGlvbih2KXtcbiAgICAgICAgICAgIHJldHVybiB7dmFsdWU6dixlbnVtZXJhYmxlOmZhbHNlLHdyaXRhYmxlOnRydWUsY29uZmlndXJhYmxlOnRydWV9O1xuICAgICAgICB9O1xuICAgICAgICBnbG9iYWwuQmFzZTY0LmV4dGVuZFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgICAgICAgICAgICBTdHJpbmcucHJvdG90eXBlLCAnZnJvbUJhc2U2NCcsIG5vRW51bShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGUodGhpcylcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgU3RyaW5nLnByb3RvdHlwZSwgJ3RvQmFzZTY0Jywgbm9FbnVtKGZ1bmN0aW9uICh1cmlzYWZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGUodGhpcywgdXJpc2FmZSlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICAgICAgICAgICAgU3RyaW5nLnByb3RvdHlwZSwgJ3RvQmFzZTY0VVJJJywgbm9FbnVtKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZSh0aGlzLCB0cnVlKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy9cbiAgICAvLyBleHBvcnQgQmFzZTY0IHRvIHRoZSBuYW1lc3BhY2VcbiAgICAvL1xuICAgIGlmIChnbG9iYWxbJ01ldGVvciddKSB7IC8vIE1ldGVvci5qc1xuICAgICAgICBCYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgIH1cbiAgICAvLyBtb2R1bGUuZXhwb3J0cyBhbmQgQU1EIGFyZSBtdXR1YWxseSBleGNsdXNpdmUuXG4gICAgLy8gbW9kdWxlLmV4cG9ydHMgaGFzIHByZWNlZGVuY2UuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLkJhc2U2NCA9IGdsb2JhbC5CYXNlNjQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKXsgcmV0dXJuIGdsb2JhbC5CYXNlNjQgfSk7XG4gICAgfVxuICAgIC8vIHRoYXQncyBpdCFcbiAgICByZXR1cm4ge0Jhc2U2NDogZ2xvYmFsLkJhc2U2NH1cbn0pKTtcbiIsIi8vQ3JhZiBTdHJpbmdcbihmdW5jdGlvbigpe1xuXHRpZih0eXBlb2YoT2JqZWN0LnR5cGVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuXG5cdHZhciBUID0gT2JqZWN0LnR5cGVzO1xuXHR2YXIgRG9jID0gVC5kb2M7XG5cblx0ZnVuY3Rpb24gcmVwbGFjZVNwZWNDaGFyKGMpe1xuXHRcdHN3aXRjaChjKXtcblx0XHRcdGNhc2UgJ3cnOiByZXR1cm4gJ2EtekEtWjAtOV8nO1xuXHRcdFx0Y2FzZSAnZCc6IHJldHVybiAnMC05Jztcblx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ1xcXFx0XFxcXG5cXFxcdlxcXFxmXFxcXHIgJztcblxuXHRcdFx0ZGVmYXVsdDogcmV0dXJuIGM7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZ2VJbkFycihiZWcsIGVuZCl7XG5cdFx0aWYoYmVnID4gZW5kKXtcblx0XHRcdHZhciB0bXAgPSBiZWc7XG5cdFx0XHRiZWcgPSBlbmQ7XG5cdFx0XHRlbmQgPSB0bXA7XG5cdFx0fVxuXG5cdFx0dmFyIGFyciA9IFtdO1xuXHRcdGZvcih2YXIgaSA9IGJlZzsgaSA8PSBlbmQ7IGkrKyl7XG5cdFx0XHRhcnIucHVzaChpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VSYW5nZShwYXJzZV9zdHIpe1xuXHRcdGlmKC9cXFxcLi8udGVzdChwYXJzZV9zdHIpKXtcblx0XHRcdFx0cGFyc2Vfc3RyID0gcGFyc2Vfc3RyLnJlcGxhY2UoL1xcXFwoLikvZywgZnVuY3Rpb24oc3RyLCBjaGFyKXsgcmV0dXJuIHJlcGxhY2VTcGVjQ2hhcihjaGFyKTt9KTtcblx0XHR9XG5cblx0XHR2YXIgcmVzdWx0ID0gW107XG5cblx0XHR2YXIgYmVnX2NoYXIgPSBwYXJzZV9zdHJbMF07XG5cdFx0Zm9yKHZhciBpID0gMTsgaSA8PSBwYXJzZV9zdHIubGVuZ3RoOyBpKyspe1xuXG5cdFx0XHRpZihwYXJzZV9zdHJbaS0xXSAhPT0gJ1xcXFwnXG5cdFx0XHRcdCYmcGFyc2Vfc3RyW2ldID09PSAnLSdcblx0XHRcdFx0JiZwYXJzZV9zdHJbaSsxXSl7XG5cdFx0XHRcdGkrKztcblx0XHRcdFx0dmFyIGVuZF9jaGFyID0gcGFyc2Vfc3RyW2ldO1xuXG5cdFx0XHRcdHZhciBhcnJfY2hhcnMgPSByYW5nZUluQXJyKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCksIGVuZF9jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0XHRyZXN1bHQgPSByZXN1bHQuY29uY2F0KGFycl9jaGFycyk7XG5cblx0XHRcdFx0aSsrO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRiZWdfY2hhciA9IHBhcnNlX3N0cltpXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRJbmRleChhcnIpe1xuXHRcdHZhciByYW5kID0gTWF0aC5yb3VuZCgoYXJyLmxlbmd0aCAtIDEpICogTWF0aC5yYW5kb20oKSk7XG5cdFx0cmV0dXJuIGFycltyYW5kXTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRDaGFycyhjaGFyc19hcnIsIHNpemUpe1xuXHRcdHNpemUgPSBULmludChzaXplLCAxKS5yYW5kKCk7XG5cdFx0dmFyIHN0ciA9ICcnO1xuXHRcdHdoaWxlKHNpemUpe1xuXHRcdFx0dmFyIGRlciA9IHJhbmRJbmRleChjaGFyc19hcnIpO1xuXHRcdFx0c3RyICs9U3RyaW5nLmZyb21DaGFyQ29kZShkZXIpO1xuXHRcdFx0c2l6ZS0tO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZFN0cihyYW5nZSwgc2l6ZSl7XG5cblx0XHR2YXIgcGFyc2VfcmFuZ2UgPSAocmFuZ2Uuc291cmNlKS5tYXRjaCgvXFxeXFxbKChcXFxcXFxdfC4pKilcXF1cXCpcXCQvKTtcblxuXHRcdGlmKCFwYXJzZV9yYW5nZSkgdGhyb3cgVC5lcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogcmFuZ2UoUmVnRXhwKC9eW1xcd10uJC8pKSwgc2l6ZSgwPD1udW1iZXIpJyk7XG5cblx0XHR2YXIgY2hhcnMgPSBwYXJzZVJhbmdlKHBhcnNlX3JhbmdlWzFdKTtcblxuXHRcdHJldHVybiByYW5kQ2hhcnMuYmluZChudWxsLCBjaGFycywgc2l6ZSk7XG5cblxuXHR9XG5cblx0ZnVuY3Rpb24gdGVzdFN0cihyYW5nZSwgc2l6ZSl7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKHN0cil7XG5cdFx0XHRpZih0eXBlb2Yoc3RyKSAhPT0gJ3N0cmluZycpe1xuXHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IHN0cmluZyFcIjtcblx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdH1cblxuXHRcdFx0aWYoc3RyLmxlbmd0aCA+IHNpemUpe1xuXHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiTGVuZ3RoIHN0cmluZyBpcyB3cm9uZyFcIjtcblx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdH1cblxuXHRcdFx0aWYoIXJhbmdlLnRlc3Qoc3RyKSl7XG5cdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRvY1N0cihyYW5nZSwgc2l6ZSl7XG5cdFx0cmV0dXJuIFQuZG9jLmdlbi5iaW5kKG51bGwsIFwic3RyXCIsIHsgcmFuZ2U6IHJhbmdlLCBsZW5ndGg6IHNpemV9KTtcblx0fVxuXG5cblx0dmFyIGRlZl9zaXplID0gMTc7XG5cdHZhciBkZWZfcmFuZ2UgPSAvXltcXHddKiQvO1xuXG5cdGZ1bmN0aW9uIG5ld1N0cihyYW5nZSwgc2l6ZSl7XG5cdFx0aWYocmFuZ2UgPT09IG51bGwpIHJhbmdlID0gZGVmX3JhbmdlO1xuXHRcdGlmKHNpemUgPT09IHVuZGVmaW5lZCkgc2l6ZSA9IGRlZl9zaXplO1xuXG5cdFx0aWYodHlwZW9mIHJhbmdlID09IFwic3RyaW5nXCIpIHJhbmdlID0gbmV3IFJlZ0V4cChyYW5nZSk7XG5cblxuXHRcdGlmKFQucG9zLnRlc3Qoc2l6ZSkgfHwgIShyYW5nZSBpbnN0YW5jZW9mIFJlZ0V4cCkpe1xuXHRcdFx0XHR0aHJvdyBULmVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiByYW5nZShSZWdFeHApLCBzaXplKDA8PW51bWJlciknKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmFuZDogcmFuZFN0cihyYW5nZSwgc2l6ZSksXG5cdFx0XHR0ZXN0OiB0ZXN0U3RyKHJhbmdlLCBzaXplKSxcblx0XHRcdGRvYzogZG9jU3RyKHJhbmdlLCBzaXplKVxuXHRcdH07XG5cdH1cblxuXG5cblx0VC5uZXdUeXBlKCdzdHInLFxuXHR7XG5cdFx0bmFtZTogXCJTdHJpbmdcIixcblx0XHRhcmc6IFtcInJhbmdlXCIsIFwibGVuZ3RoXCJdLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0XHRyYW5nZToge3R5cGU6ICdSZWdFeHAgfHwgc3RyJywgZGVmYXVsdF92YWx1ZTogZGVmX3JhbmdlfSxcblx0XHRcdFx0bGVuZ3RoOiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6IGRlZl9zaXplfVxuXHRcdH1cblx0fSxcblx0e1xuXHRcdE5ldzogbmV3U3RyLFxuXHRcdHRlc3Q6IHRlc3RTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSksXG5cdFx0cmFuZDogcmFuZFN0cihkZWZfcmFuZ2UsIGRlZl9zaXplKSxcblx0XHRkb2M6IGRvY1N0cihkZWZfcmFuZ2UsIGRlZl9zaXplKVxuXHR9KTtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5uZXcgKGZ1bmN0aW9uKCl7XG5cblx0aWYodHlwZW9mKE9iamVjdC50eXBlcykgPT0gXCJvYmplY3RcIil7XG5cdFx0cmV0dXJuIE9iamVjdC50eXBlcztcblx0fVxuXG5cdGlmKFJlZ0V4cC5wcm90b3R5cGUudG9KU09OICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFJlZ0V4cC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuc291cmNlOyB9O1xuXHR9XG5cblx0dmFyIFQgPSB0aGlzO1xuXHR2YXIgRG9jID0ge1xuXHRcdHR5cGVzOntcblx0XHRcdCdib29sJzp7XG5cdFx0XHRcdG5hbWU6IFwiQm9vbGVhblwiLFxuXHRcdFx0XHRhcmc6IFtdXG5cdFx0XHR9LFxuXHRcdFx0J2NvbnN0Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkNvbnN0YW50XCIsXG5cdFx0XHRcdGFyZzogW1widmFsdWVcIl0sXG5cdFx0XHRcdHBhcmFtczogeyB2YWx1ZToge3R5cGU6IFwiU29tZXRoaW5nXCIsIGRlZmF1bHRfdmFsdWU6IG51bGx9fVxuXHRcdFx0fSxcblx0XHRcdCdwb3MnOiB7XG5cdFx0XHRcdG5hbWU6IFwiUG9zaXRpb25cIixcblx0XHRcdFx0YXJnOiBbJ21heCddLFxuXHRcdFx0XHRwYXJhbXM6IHttYXg6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogKzIxNDc0ODM2NDd9fVxuXG5cdFx0XHR9LFxuXG5cdFx0XHQnaW50Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkludGVnZXJcIixcblx0XHRcdFx0YXJnOiBbXCJtYXhcIiwgXCJtaW5cIiwgXCJzdGVwXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdpbnQnLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnaW50JywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0c3RlcDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiAxfVxuXHRcdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdCdudW0nOiB7XG5cdFx0XHRcdG5hbWU6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdGFyZzogW1wibWF4XCIsIFwibWluXCIsIFwicHJlY2lzXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdudW0nLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnbnVtJywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0cHJlY2lzOiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6IDl9XG5cdFx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdhcnInOiB7XG5cdFx0XHRcdG5hbWU6IFwiQXJyYXlcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiLCBcInNpemVcIiwgXCJmaXhlZFwiXSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0XHR0eXBlczoge3R5cGU6IFwiVHlwZSB8fCBbVHlwZSwgVHlwZS4uLl1cIiwgZ2V0IGRlZmF1bHRfdmFsdWUoKXtyZXR1cm4gVC5wb3N9fSxcblx0XHRcdFx0XHRcdHNpemU6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogN30sXG5cdFx0XHRcdFx0XHRmaXhlZDoge3R5cGU6ICdib29sJywgZGVmYXVsdF92YWx1ZTogdHJ1ZX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J2FueSc6IHtcblx0XHRcdFx0bmFtZTogXCJNaXhUeXBlXCIsXG5cdFx0XHRcdGFyZzogW1widHlwZXNcIl0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0dHlwZXM6IHt0eXBlOiBcIlR5cGUsIFR5cGUuLi4gfHwgW1R5cGUsIFR5cGUuLi5dXCIsIGdldCBkZWZhdWx0X3ZhbHVlKCl7cmV0dXJuIFtULnBvcywgVC5zdHJdfX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J29iaic6IHtcblx0XHRcdFx0bmFtZTogXCJPYmplY3RcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiXSxcblx0XHRcdFx0cGFyYW1zOiB7dHlwZXM6IHt0eXBlOiBcIk9iamVjdFwiLCBkZWZhdWx0X3ZhbHVlOiB7fX19XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRnZXRDb25zdDogZnVuY3Rpb24obmFtZV90eXBlLCBuYW1lX2xpbWl0KXtcblx0XHRcdHJldHVybiB0aGlzLnR5cGVzW25hbWVfdHlwZV0ucGFyYW1zW25hbWVfbGltaXRdLmRlZmF1bHRfdmFsdWU7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmRvYyA9IHt9O1xuXHR0aGlzLmRvYy5qc29uID0gSlNPTi5zdHJpbmdpZnkoRG9jLCBcIlwiLCAyKTtcblxuXHREb2MuZ2VuRG9jID0gKGZ1bmN0aW9uKG5hbWUsIHBhcmFtcyl7cmV0dXJuIHtuYW1lOiB0aGlzLnR5cGVzW25hbWVdLm5hbWUsIHBhcmFtczogcGFyYW1zfX0pLmJpbmQoRG9jKTtcblx0dGhpcy5kb2MuZ2VuID0gRG9jLmdlbkRvYztcblxuXG5cblxuXHQvL0Vycm9zXG5cdGZ1bmN0aW9uIGFyZ1R5cGVFcnJvcih3cm9uZ19hcmcsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IHR5cGUgaXMgd3JvbmchIEFyZ3VtZW50cygnICsgZm9yQXJnKHdyb25nX2FyZykgKyAnKTsnICsgbWVzcyk7XG5cdFx0RVIud3JvbmdfYXJnID0gd3JvbmdfYXJnO1xuXG5cdFx0aWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShFUiwgYXJnVHlwZUVycm9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gRVI7XG5cblx0XHRmdW5jdGlvbiBmb3JBcmcoYXJncyl7XG5cdFx0XHR2YXIgc3RyX2FyZ3MgPSAnJztcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0c3RyX2FyZ3MgKz0gdHlwZW9mKGFyZ3NbaV0pICsgJzogJyArIGFyZ3NbaV0gKyAnOyAnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHN0cl9hcmdzO1xuXHRcdH1cblx0fVxuXHRULmVycm9yID0gYXJnVHlwZUVycm9yO1xuXG5cdGZ1bmN0aW9uIHR5cGVTeW50YXhFcnJvcih3cm9uZ19zdHIsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBTeW50YXhFcnJvcignTGluZTogJyArIHdyb25nX3N0ciArICc7ICcgKyBtZXNzKTtcblx0XHRFUi53cm9uZ19hcmcgPSB3cm9uZ19zdHI7XG5cblx0XHRpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0XHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKEVSLCB0eXBlU3ludGF4RXJyb3IpO1xuXHRcdH1cblxuXHRcdHJldHVybiBFUjtcblx0fVxuXG5cblxuXHRmdW5jdGlvbiBDcmVhdGVDcmVhdG9yKE5ldywgdGVzdCwgcmFuZCwgZG9jKXtcblx0XHR2YXIgY3JlYXRvcjtcblx0XHRpZih0eXBlb2YgTmV3ID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0Y3JlYXRvciA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB0bXBfb2JqID0gTmV3LmFwcGx5KHt9LCBhcmd1bWVudHMpO1xuXHRcdFx0XHR2YXIgbmV3X2NyZWF0b3IgPSBuZXcgQ3JlYXRlQ3JlYXRvcihOZXcsIHRtcF9vYmoudGVzdCwgdG1wX29iai5yYW5kLCB0bXBfb2JqLmRvYyk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3X2NyZWF0b3I7XG5cdFx0XHR9O1xuXHRcdH1lbHNlIGNyZWF0b3IgPSBmdW5jdGlvbigpe3JldHVybiBjcmVhdG9yfTtcblxuXHRcdGNyZWF0b3IuaXNfY3JlYXRvciA9IHRydWU7XG5cdFx0aWYodHlwZW9mIHRlc3QgPT09IFwiZnVuY3Rpb25cIikgY3JlYXRvci50ZXN0ID0gdGVzdDtcblx0XHRpZih0eXBlb2YgcmFuZCA9PT0gXCJmdW5jdGlvblwiKSBjcmVhdG9yLnJhbmQgPSByYW5kO1xuXHRcdGlmKHR5cGVvZiBkb2MgPT09IFwiZnVuY3Rpb25cIikgY3JlYXRvci5kb2MgPSBkb2M7XG5cblx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShjcmVhdG9yKTtcblx0fVxuXHR0aGlzLm5ld1R5cGUgPSBmdW5jdGlvbihrZXksIGRlc2MsIG5ld190eXBlKXtcblx0XHREb2MudHlwZXNba2V5XSA9IGRlc2M7XG5cdFx0VC5uYW1lc1tkZXNjLm5hbWVdID0ga2V5O1xuXHRcdHRoaXMuZG9jLmpzb24gPSBKU09OLnN0cmluZ2lmeShEb2MsIFwiXCIsIDIpO1xuXG5cdFx0dGhpc1trZXldID0gbmV3IENyZWF0ZUNyZWF0b3IobmV3X3R5cGUuTmV3LCBuZXdfdHlwZS50ZXN0LCBuZXdfdHlwZS5yYW5kLCBuZXdfdHlwZS5kb2MpO1xuXHR9XG5cdHRoaXMubmV3VHlwZS5kb2MgPSAnKG5hbWUsIGNvbnN0cnVjdG9yLCBmdW5jVGVzdCwgZnVuY1JhbmQsIGZ1bmNEb2MpJztcblxuXG5cblx0Ly9DcmFmdCBCb29sZWFuXG5cdFx0dGhpcy5ib29sID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRudWxsLFxuXHRcdFx0ZnVuY3Rpb24odmFsdWUpe1xuXHRcdFx0XHRpZih0eXBlb2YgdmFsdWUgIT09ICdib29sZWFuJyl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4gIShNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpKTtcblx0XHRcdH0sXG5cdFx0XHREb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJib29sXCIpXG5cdFx0KTtcblxuXG5cblx0Ly9DcmFmdCBDb25zdFxuXHRcdGZ1bmN0aW9uIGRvY0NvbnN0KHZhbCl7XG5cblx0XHRcdGlmKHR5cGVvZih2YWwpID09PSBcIm9iamVjdFwiICYmIHZhbCAhPT0gbnVsbCl7XG5cdFx0XHRcdHZhbCA9ICdPYmplY3QnO1xuXHRcdFx0fVxuXHRcdFx0aWYodHlwZW9mKHZhbCkgPT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdHZhbCA9IHZhbC50b1N0cmluZygpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLFwiY29uc3RcIiwge3ZhbHVlOiB2YWx9KTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gbmV3Q29uc3QodmFsKXtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHJhbmQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHZhbH0sXG5cdFx0XHRcdHRlc3Q6IGZ1bmN0aW9uKHYpe1xuXHRcdFx0XHRcdGlmKHZhbCAhPT0gdikgcmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRkb2M6IGRvY0NvbnN0KHZhbClcblx0XHRcdH07XG5cdFx0fVxuXHRcdHZhciBkZWZfY29uc3QgPSBuZXdDb25zdChEb2MuZ2V0Q29uc3QoJ2NvbnN0JywgJ3ZhbHVlJykpO1xuXHRcdHRoaXMuY29uc3QgPSBuZXcgQ3JlYXRlQ3JlYXRvcihuZXdDb25zdCwgZGVmX2NvbnN0LnRlc3QsIGRlZl9jb25zdC5yYW5kLCBkZWZfY29uc3QuZG9jKTtcblxuXHRcdGZ1bmN0aW9uIHRDb25zdChUeXBlKXtcblx0XHRcdGlmKHR5cGVvZiAoVHlwZSkgIT09IFwiZnVuY3Rpb25cIiB8fCAhVHlwZS5pc19jcmVhdG9yKXtcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cblx0XHRcdFx0XHRyZXR1cm4gVC5hcnIoVHlwZSk7XG5cblx0XHRcdFx0fWVsc2UgaWYodHlwZW9mKFR5cGUpID09IFwib2JqZWN0XCIgJiYgVHlwZSAhPT0gbnVsbCl7XG5cblx0XHRcdFx0XHRyZXR1cm4gVC5vYmooVHlwZSk7XG5cblx0XHRcdFx0fWVsc2UgcmV0dXJuIFQuY29uc3QoVHlwZSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0cmV0dXJuIFR5cGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0Ly9DcmFmdCBOdW1iZXJcblx0XHR2YXIgcmFuZE51bSA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiArKCgobWF4IC0gbWluKSpNYXRoLnJhbmRvbSgpICsgIG1pbikudG9GaXhlZChwcmVjaXMpKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIHRlc3ROdW0gPSBmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbihuKXtcblx0XHRcdFx0aWYodHlwZW9mIG4gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShuKSl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZigobiA+IG1heClcblx0XHRcdFx0XHR8fChuIDwgbWluKVxuXHRcdFx0XHRcdHx8IChuLnRvRml4ZWQocHJlY2lzKSAhPSBuICYmIG4gIT09IDApICl7XG5cblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHQgIH07XG5cdFx0fTtcblxuXHRcdHZhciBkb2NOdW0gPSBmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJudW1cIiwge1wibWF4XCI6IG1heCwgXCJtaW5cIjogbWluLCBcInByZWNpc1wiOiBwcmVjaXN9KTtcblx0XHR9XG5cblx0XHR2YXIgbWF4X2RlZl9uID0gRG9jLmdldENvbnN0KCdudW0nLCAnbWF4Jyk7XG5cdFx0dmFyIG1pbl9kZWZfbiA9IERvYy5nZXRDb25zdCgnbnVtJywgJ21pbicpO1xuXHRcdHZhciBwcmVjaXNfZGVmID0gRG9jLmdldENvbnN0KCdudW0nLCAncHJlY2lzJyk7XG5cblx0XHR0aGlzLm51bSA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0ZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRcdGlmKG1heCA9PT0gbnVsbCkgbWF4ID0gbWF4X2RlZl9uO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZHx8bWluID09PSBudWxsKSBtaW4gPSBtaW5fZGVmX247XG5cdFx0XHRcdGlmKHByZWNpcyA9PT0gdW5kZWZpbmVkKSBwcmVjaXMgPSBwcmVjaXNfZGVmO1xuXG5cdFx0XHRcdGlmKCh0eXBlb2YgbWluICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobWluKSlcblx0XHRcdFx0XHR8fCh0eXBlb2YgbWF4ICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobWF4KSlcblx0XHRcdFx0XHR8fCh0eXBlb2YgcHJlY2lzICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocHJlY2lzKSlcblx0XHRcdFx0XHR8fChwcmVjaXMgPCAwKVxuXHRcdFx0XHRcdHx8KHByZWNpcyA+IDkpXG5cdFx0XHRcdFx0fHwocHJlY2lzICUgMSAhPT0gMCkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogbWluKG51bWJlciksIG1heChudW1iZXIpLCBwcmVjaXMoMDw9bnVtYmVyPDkpJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYobWluID4gbWF4KXtcblx0XHRcdFx0XHR2YXIgdCA9IG1pbjtcblx0XHRcdFx0XHRtaW4gPSBtYXg7XG5cdFx0XHRcdFx0bWF4ID0gdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dGVzdDogdGVzdE51bShtYXgsIG1pbiwgcHJlY2lzKSxcblx0XHRcdFx0XHRyYW5kOiByYW5kTnVtKG1heCwgbWluLCBwcmVjaXMpLFxuXHRcdFx0XHRcdGRvYzogZG9jTnVtKG1heCwgbWluLCBwcmVjaXMpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0ZXN0TnVtKG1heF9kZWZfbiwgbWluX2RlZl9uLCBwcmVjaXNfZGVmKSxcblx0XHRcdHJhbmROdW0obWF4X2RlZl9uLCBtaW5fZGVmX24sIHByZWNpc19kZWYpLFxuXHRcdFx0ZG9jTnVtKG1heF9kZWZfbiwgbWluX2RlZl9uLCBwcmVjaXNfZGVmKVxuXHRcdCk7XG5cblx0XHR2YXIgcmFuZEludCA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBNYXRoLmZsb29yKCAoKG1heCAtIChtaW4gKyAwLjEpKS9wcmVjaXMpKk1hdGgucmFuZG9tKCkgKSAqIHByZWNpcyArICBtaW47XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCB2YXIgdGVzdEludCA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKG4pe1xuXHRcdFx0XHRpZih0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG4pKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKChuID49IG1heClcblx0XHRcdFx0XHR8fChuIDwgbWluKVxuXHRcdFx0XHRcdHx8KCgobiAtIG1pbikgJSBwcmVjaXMpICE9PSAwKSApe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdCAgfTtcblx0XHR9O1xuXG5cdFx0dmFyIGRvY0ludCA9IGZ1bmN0aW9uKG1heCwgbWluLCBzdGVwKXtcblxuXHRcdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwiaW50XCIsIHtcIm1heFwiOiBtYXgsIFwibWluXCI6IG1pbiwgXCJzdGVwXCI6IHN0ZXB9KTtcblxuXHRcdH1cblxuXHRcdHZhciBtYXhfZGVmID0gRG9jLmdldENvbnN0KCdpbnQnLCAnbWF4Jyk7XG5cdFx0dmFyIG1pbl9kZWYgPSBEb2MuZ2V0Q29uc3QoJ2ludCcsICdtaW4nKTtcblx0XHR2YXIgc3RlcF9kZWYgPSBEb2MuZ2V0Q29uc3QoJ2ludCcsICdzdGVwJyk7XG5cblx0XHR0aGlzLmludCA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0ZnVuY3Rpb24obWF4LCBtaW4sIHN0ZXApe1xuXG5cdFx0XHRcdGlmKG1heCA9PT0gbnVsbCkgbWF4ID0gbWF4X2RlZjtcblx0XHRcdFx0aWYobWluID09PSB1bmRlZmluZWR8fG1pbiA9PT0gbnVsbCkgbWluID0gbWluX2RlZjtcblx0XHRcdFx0aWYoc3RlcCA9PT0gdW5kZWZpbmVkKSBzdGVwID0gc3RlcF9kZWY7XG5cblx0XHRcdFx0aWYoKHR5cGVvZiBtaW4gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtaW4pKVxuXHRcdFx0XHRcdHx8KHR5cGVvZiBtYXggIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtYXgpKVxuXHRcdFx0XHRcdHx8KE1hdGgucm91bmQobWluKSAhPT0gbWluKVxuXHRcdFx0XHRcdHx8KE1hdGgucm91bmQobWF4KSAhPT0gbWF4KVxuXHRcdFx0XHRcdHx8KHN0ZXAgPD0gMClcblx0XHRcdFx0XHR8fChNYXRoLnJvdW5kKHN0ZXApICE9PSBzdGVwKSl7XG5cdFx0XHRcdFx0dGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiBtaW4oaW50KSwgbWF4KGludCksIHN0ZXAoaW50PjApJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYobWluID4gbWF4KXtcblx0XHRcdFx0XHR2YXIgdCA9IG1pbjtcblx0XHRcdFx0XHRtaW4gPSBtYXg7XG5cdFx0XHRcdFx0bWF4ID0gdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dGVzdDogdGVzdEludChtYXgsIG1pbiwgc3RlcCksXG5cdFx0XHRcdFx0cmFuZDogcmFuZEludChtYXgsIG1pbiwgc3RlcCksXG5cdFx0XHRcdFx0ZG9jOiBkb2NJbnQobWF4LCBtaW4sIHN0ZXApXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0ZXN0SW50KG1heF9kZWYsIG1pbl9kZWYsIHN0ZXBfZGVmKSxcblx0XHRcdHJhbmRJbnQobWF4X2RlZiwgbWluX2RlZiwgc3RlcF9kZWYpLFxuXHRcdFx0ZG9jSW50KG1heF9kZWYsIG1pbl9kZWYsIHN0ZXBfZGVmKVxuXHRcdCk7XG5cblx0XHR2YXIgZG9jUG9zID0gZnVuY3Rpb24obWF4LCBtaW4sIHN0ZXApe1xuXG5cdFx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJwb3NcIiwge1wibWF4XCI6IG1heH0pO1xuXG5cdFx0fVxuXG5cdFx0dmFyIG1heF9kZWZfcCA9IERvYy5nZXRDb25zdCgncG9zJywgJ21heCcpXG5cdFx0dGhpcy5wb3MgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdGZ1bmN0aW9uKG1heCl7XG5cblx0XHRcdFx0aWYobWF4ID09PSBudWxsKSBtYXggPSBtYXhfZGVmX3A7XG5cblx0XHRcdFx0aWYoKHR5cGVvZiBtYXggIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtYXgpKVxuXHRcdFx0XHRcdHx8KG1heCA8IDApKXtcblx0XHRcdFx0XHR0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IG1pbihwb3MpLCBtYXgocG9zKSwgc3RlcChwb3M+MCknKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dGVzdDogdGVzdEludChtYXgsIDAsIDEpLFxuXHRcdFx0XHRcdHJhbmQ6IHJhbmRJbnQobWF4LCAwLCAxKSxcblx0XHRcdFx0XHRkb2M6IGRvY1BvcyhtYXgpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0ZXN0SW50KG1heF9kZWZfcCwgMCwgMSksXG5cdFx0XHRyYW5kSW50KG1heF9kZWZfcCwgMCwgMSksXG5cdFx0XHRkb2NQb3MobWF4X2RlZl9wKVxuXHRcdCk7XG5cblxuXG5cblxuICAvL0NyYWZ0IEFueVxuICBcdFx0ZnVuY3Rpb24gcmFuZEluZGV4KGFycil7XG5cdFx0XHR2YXIgcmFuZCA9IE1hdGgucm91bmQoKGFyci5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkpO1xuXHRcdFx0cmV0dXJuIGFycltyYW5kXTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiByYW5kQW55KGFycil7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIHJhbmRJbmRleChhcnIpLnJhbmQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0ZXN0QW55KGFycil7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0aWYoYXJyLmV2ZXJ5KGZ1bmN0aW9uKGkpe3JldHVybiBpLnRlc3QodmFsKX0pKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBkb2NBbnkoVHlwZXMpe1xuXG5cdFx0XHR2YXIgY29udCA9IFR5cGVzLmxlbmd0aDtcblx0XHRcdHZhciB0eXBlX2RvY3MgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBjb250OyBpKyspe1xuXHRcdFx0XHR0eXBlX2RvY3MucHVzaChUeXBlc1tpXS5kb2MoKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJhbnlcIiwge3R5cGVzOiB0eXBlX2RvY3N9KTtcblx0XHR9XG5cblx0XHR2YXIgZGVmX3R5cGVzID0gRG9jLmdldENvbnN0KCdhcnInLCAndHlwZXMnKTtcblx0XHRmdW5jdGlvbiBuZXdBbnkoYXJyKXtcblx0XHRcdGlmKCFBcnJheS5pc0FycmF5KGFycikgfHwgYXJndW1lbnRzLmxlbmd0aCA+IDEpIGFyciA9IGFyZ3VtZW50cztcblxuXHRcdFx0dmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cdFx0XHR2YXIgYXJyX3R5cGVzID0gW107XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHRhcnJfdHlwZXNbaV0gPSB0Q29uc3QoYXJyW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJue1xuXHRcdFx0XHR0ZXN0OiB0ZXN0QW55KGFycl90eXBlcyksXG5cdFx0XHRcdHJhbmQ6IHJhbmRBbnkoYXJyX3R5cGVzKSxcblx0XHRcdFx0ZG9jOiBkb2NBbnkoYXJyX3R5cGVzKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuYW55ID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRuZXdBbnksXG5cdFx0XHR0ZXN0QW55KGRlZl90eXBlcyksXG5cdFx0XHRyYW5kQW55KGRlZl90eXBlcyksXG5cdFx0XHRkb2NBbnkoZGVmX3R5cGVzKVxuXHRcdCk7XG5cblxuXG5cdC8vQ3JhZnQgQXJyYXlcblxuXG5cblx0XHRmdW5jdGlvbiByYW5kQXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpe1xuXHRcdFx0dmFyIHJhbmRTaXplID0gZnVuY3Rpb24gKCl7cmV0dXJuIHNpemV9O1xuXHRcdFx0aWYoIWlzX2ZpeGVkKXtcblx0XHRcdFx0cmFuZFNpemUgPSBULnBvcyhzaXplKS5yYW5kO1xuXHRcdFx0fVxuXG5cblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoVHlwZSkpe1xuXHRcdFx0XHR2YXIgbm93X3NpemUgPSByYW5kU2l6ZSgpO1xuXG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBhcnIgPSBbXTtcblxuXHRcdFx0XHRcdGZvcih2YXIgaSA9IDAsIGogPSAwOyBpIDwgbm93X3NpemU7IGkrKyl7XG5cblx0XHRcdFx0XHRcdGFyci5wdXNoKFR5cGVbal0ucmFuZCgpKTtcblxuXHRcdFx0XHRcdFx0aisrO1xuXHRcdFx0XHRcdFx0aWYoaiA+PSBUeXBlLmxlbmd0aCl7XG5cdFx0XHRcdFx0XHRcdGogPSAwO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gYXJyO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblxuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGFyciA9IFtdO1xuXG5cdFx0XHRcdHZhciBub3dfc2l6ZSA9IHJhbmRTaXplKCk7XG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBub3dfc2l6ZTsgaSsrKXtcblx0XHRcdFx0XHRhcnIucHVzaChUeXBlLnJhbmQoaSwgYXJyKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gYXJyO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdGVzdEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKXtcblxuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbihhcnIpe1xuXG5cdFx0XHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoYXJyKSl7XG5cdFx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBhcnJheSFcIjtcblx0XHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoKGFyci5sZW5ndGggPiBzaXplKSB8fCAoaXNfZml4ZWQgJiYgKGFyci5sZW5ndGggIT09IHNpemUpKSl7XG5cdFx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIkFycmF5IGxlbmdodCBpcyB3cm9uZyFcIjtcblx0XHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Zm9yKHZhciBpID0gMCwgaiA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspe1xuXG5cdFx0XHRcdFx0XHRcdHZhciByZXMgPSBUeXBlW2pdLnRlc3QoYXJyW2ldKTtcblx0XHRcdFx0XHRcdFx0aWYocmVzKXtcblx0XHRcdFx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IHtpbmRleDogaSwgd3JvbmdfaXRlbTogcmVzfTtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRqKys7XG5cdFx0XHRcdFx0XHRcdGlmKGogPj0gVHlwZS5sZW5ndGgpe1xuXHRcdFx0XHRcdFx0XHRcdGogPSAwO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmdW5jdGlvbihhcnIpe1xuXHRcdFx0XHRpZighQXJyYXkuaXNBcnJheShhcnIpKXtcblx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJWYWx1ZSBpcyBub3QgYXJyYXkhXCI7XG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKChhcnIubGVuZ3RoID4gc2l6ZSkgfHwgKGlzX2ZpeGVkICYmIChhcnIubGVuZ3RoICE9PSBzaXplKSkpe1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGFyci5sZW5ndGgsIHNpemUpXG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiQXJyYXk6IGxlbmdodCBpcyB3cm9uZyFcIjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGVycl9hcnIgPSBhcnIuZmlsdGVyKFR5cGUudGVzdCk7XG5cdFx0XHRcdGlmKGVycl9hcnIubGVuZ3RoICE9IDApe1xuXHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdGVyci5wYXJhbXMgPSBlcnJfYXJyO1xuXHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZG9jQXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpe1xuXHRcdFx0dmFyIHR5cGVfZG9jcyA9IFtdO1xuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdHZhciBjb250ID0gVHlwZS5sZW5ndGg7XG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBjb250OyBpKyspe1xuXHRcdFx0XHRcdHR5cGVfZG9jcy5wdXNoKFR5cGVbaV0uZG9jKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0dHlwZV9kb2NzID0gVHlwZS5kb2MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcImFyclwiLCB7dHlwZXM6IHR5cGVfZG9jcywgc2l6ZTogc2l6ZSwgZml4ZWQ6IGlzX2ZpeGVkfSk7XG5cblx0XHR9XG5cblxuXHRcdHZhciBkZWZfVHlwZSA9IERvYy5nZXRDb25zdCgnYXJyJywgJ3R5cGVzJyk7XG5cdFx0dmFyIGRlZl9TaXplID0gRG9jLmdldENvbnN0KCdhcnInLCAnc2l6ZScpO1xuXHRcdHZhciBkZWZfZml4ZWQgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICdmaXhlZCcpO1xuXG5cdFx0ZnVuY3Rpb24gbmV3QXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpe1xuXHRcdFx0aWYoVHlwZSA9PT0gbnVsbCkgVHlwZSA9IGRlZl9UeXBlO1xuXHRcdFx0aWYoaXNfZml4ZWQgPT09IHVuZGVmaW5lZCkgaXNfZml4ZWQgPSBkZWZfZml4ZWQ7XG5cblx0XHRcdGlmKEFycmF5LmlzQXJyYXkoVHlwZSkpe1xuXHRcdFx0XHRpZihzaXplID09PSB1bmRlZmluZWR8fHNpemUgPT09IG51bGwpIHNpemUgPSBUeXBlLmxlbmd0aDtcblxuXHRcdFx0XHRUeXBlID0gVHlwZS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIHRDb25zdChpdGVtKTt9KTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRpZihzaXplID09PSB1bmRlZmluZWR8fHNpemUgPT09IG51bGwpIHNpemUgPSAxO1xuXHRcdFx0XHRUeXBlID0gdENvbnN0KFR5cGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihULnBvcy50ZXN0KHNpemUpKXtcblx0XHRcdFx0XHR0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6ICcgKyBKU09OLnN0cmluZ2lmeShULnBvcy50ZXN0KHNpemUpKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRlc3Q6IHRlc3RBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCksXG5cdFx0XHRcdHJhbmQ6IHJhbmRBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCksXG5cdFx0XHRcdGRvYzogZG9jQXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRoaXMuYXJyID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRuZXdBcnJheSxcblx0XHRcdHRlc3RBcnJheShkZWZfVHlwZSwgZGVmX1NpemUsIGRlZl9maXhlZCksXG5cdFx0XHRyYW5kQXJyYXkoZGVmX1R5cGUsIGRlZl9TaXplLCBkZWZfZml4ZWQpLFxuXHRcdFx0ZG9jQXJyYXkoZGVmX1R5cGUsIGRlZl9TaXplLCBkZWZfZml4ZWQpXG5cdFx0KTtcblxuXG5cblxuXG5cblxuXHQvL0NyYWZ0IE9iamVjdFxuXG5cdFx0ZnVuY3Rpb24gcmFuZE9iaihmdW5jT2JqKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgb2JqID0ge307XG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGZ1bmNPYmope1xuXHRcdFx0XHRcdG9ialtrZXldID0gZnVuY09ialtrZXldLnJhbmQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gb2JqO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0ZXN0T2JqKGZ1bmNPYmope1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKG9iail7XG5cblx0XHRcdFx0aWYodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIiAmJiBvYmogPT09IG51bGwpe1xuXHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBvYmplY3QhXCI7XG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcih2YXIga2V5IGluIGZ1bmNPYmope1xuXHRcdFx0XHRcdHZhciByZXMgPSBmdW5jT2JqW2tleV0udGVzdChvYmpba2V5XSk7XG5cdFx0XHRcdFx0aWYocmVzKXtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IHt9O1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtc1trZXldID0gcmVzO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGRvY09iKGZ1bmNPYmope1xuXHRcdFx0dmFyIGRvY19vYmogPSB7fTtcblxuXHRcdFx0Zm9yKHZhciBrZXkgaW4gZnVuY09iail7XG5cdFx0XHRcdFx0ZG9jX29ialtrZXldID0gZnVuY09ialtrZXldLmRvYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwib2JqXCIsIHt0eXBlczogZG9jX29ian0pO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIE5ld09iaih0ZW1wT2JqKXtcblx0XHRcdGlmKHR5cGVvZiB0ZW1wT2JqICE9PSAnb2JqZWN0JykgdGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiB0ZW1wT2JqKE9iamVjdCknKTtcblxuXHRcdFx0dmFyIGJlZ09iaiA9IHt9O1xuXHRcdFx0dmFyIGZ1bmNPYmogPSB7fTtcblx0XHRcdGZvcih2YXIga2V5IGluIHRlbXBPYmope1xuXHRcdFx0XHRmdW5jT2JqW2tleV0gPSB0Q29uc3QodGVtcE9ialtrZXldKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJue1xuXHRcdFx0XHR0ZXN0OiB0ZXN0T2JqKGZ1bmNPYmopLFxuXHRcdFx0XHRyYW5kOiByYW5kT2JqKGZ1bmNPYmopLFxuXHRcdFx0XHRkb2M6IGRvY09iKGZ1bmNPYmopXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMub2JqID0gbmV3IENyZWF0ZUNyZWF0b3IoTmV3T2JqLFxuXHRcdFx0ZnVuY3Rpb24ob2JqKXtyZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIn0sXG5cdFx0XHRyYW5kT2JqKHt9KSxcblx0XHRcdERvYy5nZW5Eb2MuYmluZChudWxsLCBcIm9ialwiKVxuXHRcdCk7XG5cblxuXG5cblxuLy9DcmFmdCBUeXBlIG91dCB0byAgRG9jdW1lbnRcblxuXHRULm5hbWVzID0ge307XG5cdGZvcih2YXIga2V5IGluIERvYy50eXBlcyl7XG5cdFx0VC5uYW1lc1tEb2MudHlwZXNba2V5XS5uYW1lXSA9IGtleTtcblx0fVxuXG5cdHRoaXMub3V0RG9jID0gZnVuY3Rpb24odG1wKXtcblx0XHRpZigodHlwZW9mIHRtcCA9PT0gXCJmdW5jdGlvblwiKSAmJiB0bXAuaXNfY3JlYXRvcikgcmV0dXJuIHRtcDtcblxuXHRcdGlmKCEoJ25hbWUnIGluIHRtcCkpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdFx0fVxuXHRcdHZhciB0eXBlID0gdG1wLm5hbWU7XG5cblx0XHRpZigncGFyYW1zJyBpbiB0bXApe1xuXHRcdFx0dmFyIHBhcmFtcyA9IHRtcC5wYXJhbXM7XG5cdFx0XHRzd2l0Y2goVC5uYW1lc1t0eXBlXSl7XG5cdFx0XHRcdGNhc2UgJ29iaic6IHtcblx0XHRcdFx0XHR2YXIgbmV3X29iaiA9IHt9O1xuXHRcdFx0XHRcdGZvcih2YXIga2V5IGluIHBhcmFtcy50eXBlcyl7XG5cdFx0XHRcdFx0XHRuZXdfb2JqW2tleV0gPSBULm91dERvYyhwYXJhbXMudHlwZXNba2V5XSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBhcmFtcy50eXBlcyA9IG5ld19vYmo7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSAnYW55Jzpcblx0XHRcdFx0Y2FzZSAnYXJyJzoge1xuXHRcdFx0XHRcdGlmKEFycmF5LmlzQXJyYXkocGFyYW1zLnR5cGVzKSl7XG5cdFx0XHRcdFx0XHRwYXJhbXMudHlwZXMgPSBwYXJhbXMudHlwZXMubWFwKFQub3V0RG9jLmJpbmQoVCkpO1xuXHRcdFx0XHRcdH1lbHNlIHBhcmFtcy50eXBlcyA9IFQub3V0RG9jKHBhcmFtcy50eXBlcyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBnZXRTaW1wbGVUeXBlKFQubmFtZXNbdHlwZV0sIHBhcmFtcyk7XG5cdFx0fVxuXHRcdHJldHVybiBnZXRTaW1wbGVUeXBlKFQubmFtZXNbdHlwZV0sIHt9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFNpbXBsZVR5cGUobmFtZSwgcGFyYW1zKXtcblx0XHR2YXIgYXJnID0gW107XG5cdFx0RG9jLnR5cGVzW25hbWVdLmFyZy5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgaSl7YXJnW2ldID0gcGFyYW1zW2tleV07fSk7XG5cdFx0cmV0dXJuIFRbbmFtZV0uYXBwbHkoVCwgYXJnKTtcblx0fTtcblxuLy9TdXBwb3J0IERlY2xhcmF0ZSBGdW5jdGlvblxuXG5cdGZ1bmN0aW9uIGZpbmRlUGFyc2Uoc3RyLCBiZWcsIGVuZCl7XG5cdFx0dmFyIHBvaW50X2JlZyA9IHN0ci5pbmRleE9mKGJlZyk7XG5cdFx0aWYofnBvaW50X2JlZyl7XG5cblx0XHRcdHZhciBwb2ludF9lbmQgPSBwb2ludF9iZWc7XG5cdFx0XHR2YXIgcG9pbnRfdGVtcCA9IHBvaW50X2JlZztcblx0XHRcdHZhciBsZXZlbCA9IDE7XG5cdFx0XHR2YXIgYnJlYWtXaGlsZSA9IGZhbHNlO1xuXHRcdFx0d2hpbGUoIWJyZWFrV2hpbGUpe1xuXHRcdFx0XHRicmVha1doaWxlID0gdHJ1ZTtcblxuXHRcdFx0XHRpZih+cG9pbnRfdGVtcCkgcG9pbnRfdGVtcCA9IHN0ci5pbmRleE9mKGJlZywgcG9pbnRfdGVtcCArIDEpO1xuXHRcdFx0XHRpZih+cG9pbnRfZW5kKSBwb2ludF9lbmQgPSBzdHIuaW5kZXhPZihlbmQsIHBvaW50X2VuZCArIDEpO1xuXG5cdFx0XHRcdGlmKHBvaW50X3RlbXAgPCBwb2ludF9lbmQpe1xuXG5cdFx0XHRcdFx0aWYocG9pbnRfdGVtcCA+IDApe1xuXHRcdFx0XHRcdFx0YnJlYWtXaGlsZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0aWYoc3RyW3BvaW50X3RlbXAgLSAxXSAhPT0gJ1xcXFwnKSBsZXZlbCA9IGxldmVsKzE7XG5cblx0XHRcdFx0XHR9XG5cblxuXHRcdFx0XHRcdGlmKHBvaW50X2VuZCA+IDApe1xuXHRcdFx0XHRcdFx0YnJlYWtXaGlsZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0aWYoc3RyW3BvaW50X2VuZCAtIDFdICE9PSAnXFxcXCcpIGxldmVsID0gbGV2ZWwtMTtcblx0XHRcdFx0XHRcdGlmKGxldmVsID09IDApe1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gW3BvaW50X2JlZywgcG9pbnRfZW5kXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdGlmKHBvaW50X2VuZCA+IDApe1xuXHRcdFx0XHRcdFx0YnJlYWtXaGlsZSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0aWYoc3RyW3BvaW50X2VuZCAtIDFdICE9PSAnXFxcXCcpIGxldmVsID0gbGV2ZWwtMTtcblx0XHRcdFx0XHRcdGlmKGxldmVsID09IDApe1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gW3BvaW50X2JlZywgcG9pbnRfZW5kXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZihwb2ludF90ZW1wID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfdGVtcCAtIDFdICE9PSAnXFxcXCcpIGxldmVsID0gbGV2ZWwrMTtcblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRPYmplY3QudHlwZXMgPSBUO1xufSkoKTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRcItCU0LXRgNC10LLQvlwiOiBcIndvb2RcIixcclxuXHRcItCa0LDQvNC10L3RjFwiOiBcInN0b25lXCIsXHJcblx0XCLQodGC0LDQu9GMXCI6IFwic3RlZWxcIixcclxuXHRcItCg0LXRgdC/XCI6IFwic3Bhd25lclwiXHJcbn0iXX0=
