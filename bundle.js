(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Hear = require("./Events.js");

function CrController(Logic, Draw){
	
	Hear("switch_add", "click", Draw.switchElem("add", "invis"));

	Hear("Tiles", "mousedown", function(event){
		if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
	});
	Hear("Tiles", "dragstart", function(event){
		event.dataTransfer.effectAllowed = 'move';
	});
	
	Hear("add", "submit", function(){
		var tile = {
			type: this.type.value
		};
		
		if(this.img.files[0]){
			var reader = new FileReader();
			reader.onload = function(e){
				var img = e.target.result;
				tile.img = img;
				Logic.add(tile);
			};
			
			reader.readAsDataURL(this.img.files[0]);
			this.reset();
		}
		
	});
	Hear("dell", "click", Logic.dell.bind(Logic));
	
	Hear("save", "click", Logic.save.bind(Logic));
	Hear("open", "change", Draw.openJSON(Logic.load.bind(Logic)));
	
	Hear("View", "dragstart", function(e){
		e.preventDefault();
		if(e.target.getAttribute("tile") !== null) Draw.View.current_tile = e.target;
	});
	Hear("View", "mouseup", function(e){
		Draw.View.norm();
		Draw.View.current_tile = null;
	});
	Hear("View", ["mouseover", "mouseout"], function(e){
		if(e.target !== e.currnetTarget) return;
		Draw.View.norm();
		Draw.View.current_tile = null;
	});
	Hear("View", "mousemove", function(e){
		if(Draw.View.current_tile) Draw.View.move(e.movementX, e.movementY);
	});
	Hear("View", "dragenter", function(e){
		e.preventDefault();
	});
	Hear("View", "dragover", function(e){
		e.preventDefault();
	});
	Hear("View", "drop", function(e){
		e.stopPropagation();
		var box = e.currentTarget.getBoundingClientRect();
		var x = e.clientX - box.left;
		var y = e.clientY - box.top;
		
		if(Logic.getTile()) Draw.View.add(Logic.getTile(), x, y);
	});
	
	Hear("Width", "change", function(e){
		Logic.resizeTile(parseInt(e.target.value));
	});
	Hear("Height", "change", function(e){
		Logic.resizeTile(null, parseInt(e.target.value));
	});
}

module.exports = CrController;

},{"./Events.js":3}],2:[function(require,module,exports){
require("typesjs");
const RGB = require('chromath').rgb;
var FileSaver = require('file-saver');

var id_tiles_list = "Tiles";
var id_view = "View";

function CrTiles(id){
	var container = getNode(id);
	var current_tile = null;
	
	this.addGetSet("current_tile", 
		function(){
			return current_tile.tile;
		}, 
		function(new_tile){
			
			var tile = container.querySelector('[tile="' + new_tile.id + '"]');
			if(!tile) throw new Error("Tile is not find!");
			
			if(current_tile) current_tile.classList.remove("changed");
			tile.classList.add("changed");
			current_tile = tile;
			
			if(new_tile.width) getNode("Width").value = new_tile.width; 
			else getNode("Width").value = null;
			
			if(new_tile.height) getNode("Height").value = new_tile.height;
			else getNode("Height").value = null;
		}
	);
	
	this.add = function(new_tile){
		var Tile = drawTile(new_tile);
		
		if(current_tile) current_tile.insertAdjacentElement("beforeBegin", Tile);
		else container.appendChild(Tile);
	}
	
	this.dell = function(){
		current_tile.classList.remove("changed");
		current_tile.remove();
		current_tile = null;
	}

	this.clear = function(){
		container.innerHTML = "";
		current_tile = null;
	}
}

function CrView(id){
	var container = getNode(id);
	var size = 20;
	this.current_tile = null;
	
	drawGrid(container, size);
	
	this.add = function(new_tile, x, y){
		tile = drawTile(new_tile);
		tile.style.width = (new_tile.width * (100 / size)) + "%";
		tile.style.height = (new_tile.height * (100 / size)) + "%";
		
		tile.style.left = x  + "px";
		tile.style.top = y + "px";
		
		container.appendChild(tile);
		NormTile(tile);
	}
	
	this.dell = function(id_tile){
		var tiles = container.querySelectorAll('[tile="' + id_tile + '"]');
		tiles.forEach(tile => tile.remove());
	}
	this.clear = function(){
		var tiles = container.querySelectorAll('[tile]');
		tiles.forEach(tile => tile.remove());
	}
	
	this.resize = function(tile){
		var elems = container.querySelectorAll('[tile="' + tile.id + '"]');
		elems.forEach(function(elem){
			elem.style.width = (tile.width * (100 / size)) + "%";
			elem.style.height = (tile.height * (100 / size)) + "%";
		});
	}
	
	this.move = function(x, y){
		if(this.current_tile){
			var tile = getComputedStyle(this.current_tile);
			
			this.current_tile.style.left = (parseFloat(tile.left) + x) + "px";
			this.current_tile.style.top = (parseFloat(tile.top) + y) + "px";
		}
	}
	
	this.norm = function(){
		if(this.current_tile) NormTile(this.current_tile);
	}
	
	function NormTile(tile){
		var box = getComputedStyle(tile);
		tile.style.left = NormCoord(parseFloat(box.left), parseFloat(box.width)) + "%";
		tile.style.top = NormCoord(parseFloat(box.top), parseFloat(box.height)) + "%";
	}
	
	function NormCoord(coord, s){
		var con_size = parseFloat(getComputedStyle(container).width);
		
		if(coord + s > con_size) coord = con_size - s;
		if(coord < 0) coord = 0;
		
		return Math.round((coord / con_size) * size) * (100 / size);
	}
	
	function drawGrid(container, grid_size){
		var size = 100 / grid_size;
		for(var i = grid_size - 1; i >= 0; i--){
			for(var j = grid_size - 1; j >= 0; j--){
				container.appendChild(darwBox(i*size, j*size, size));
			}
		}
	}
	
	function darwBox(x, y, size){
		var box = document.createElement('div');
		box.classList.add("box");
		box.style.width = size + "%";
		box.style.height = size + "%";
		
		box.style.left = x + "%";
		box.style.top = y + "%";
		
		return box;
	}
	
}

module.exports = {
	Tiles: new CrTiles(id_tiles_list),
	View: new CrView(id_view),
	save: Save,
	openJSON: OpenFileJSON,
	switchElem: CrSwitch
}

function OpenFileJSON(Open){
	return function(){
		if(this.files[0]){
			var reader = new FileReader();
			reader.onload = function(e){Open(JSON.parse(e.target.result))};
			reader.readAsText(this.files[0]);
		}
	}
}

function Save(name, text){
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	FileSaver.saveAs(blob, name);
}

function CrSwitch(id, name_class){
	var elem = getNode(id).classList;
	return function(){
		elem.toggle(name_class);
	}
}


function drawTile(new_tile){
	
	if(new_tile.type == "color"){
		var Tile = document.createElement('div');
		Tile.classList.add("tile");
		Tile.setAttribute("tile", new_tile.id);
		Tile.setAttribute("draggable", true);
		Tile.style.backgroundColor = new RGB(new_tile.color).toString();
		return Tile;
	}
	if(new_tile.type == "svg"){
		var img = document.createElement('img');
		img.classList.add("tile");
		img.setAttribute("tile", new_tile.id);
		img.setAttribute("draggable", true);
		img.src = new_tile.img;
		return img;
	}
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}

},{"chromath":8,"file-saver":15,"typesjs":18}],3:[function(require,module,exports){

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
var Types = require("./Types.js");
var T = Object.types;



function CrLogic(Draw){
	var tiles = [];
	var current_tile = null;
	var tiles_count = 0;
	
	var def_width = 1;
	var def_height = 1;
	
	this.setTile = function(val){
		var finded_tile = getTile(val);
		
		if(!finded_tile) throw new Error("Tile is not find!");
		
		Draw.Tiles.current_tile = finded_tile;
		current_tile = finded_tile;
	}
	
	this.add = Add;
	this.dell = function(){
		if(current_tile !== null){
			Draw.View.dell(current_tile.id);
			
			var index = tiles.indexOf(current_tile);
			tiles.splice(index, 1);
			Draw.Tiles.dell();
			
			if(tiles[0]){
				current_tile = tiles[0];
				Draw.Tiles.current_tile = tiles[0];
			}
			else{
				current_tile = null;
			}
		}
	}
	
	this.save = function(){
		var data = tiles.map(function(tile, i){
			tile = Object.assign({}, tile);
			tile.id = i; 
			return tile; 
		});
		data = {tiles: data, width: def_width, height: def_height}
		Draw.save("tileset.json", JSON.stringify(data, null, 1));
	}
	this.load = function(new_tiles, is_save=true){
		if(is_save) this.save();
		Clear();
		new_tiles.tiles.forEach(Add);
		this.setTile(0);
		
		def_width = new_tiles.width;
		def_height = new_tiles.height;
	}
	
	this.getTile = function(){
		var tile = Object.assign({}, current_tile);
		if(tile.width === undefined) tile.width = def_width;
		if(tile.height === undefined) tile.height = def_height;
		
		return tile;
	}
	
	this.resizeTile = function(w, h){
		if(current_tile){
			if(!current_tile.width) current_tile.width = def_width;
			if(!current_tile.height) current_tile.height = def_height;
			
			if(!T.pos.test(w)) current_tile.width = w;
			if(!T.pos.test(h)) current_tile.height = h;
			
			Draw.View.resize(current_tile);
			
			if(current_tile.width === def_width) current_tile.width = undefined;
			if(current_tile.height === def_height) current_tile.height = undefined;
		}
	}
	
	function getTile(id){
		return tiles.filter(tile => id == tile.id)[0];
	}
	
	function Add(tile){
		if(Types.tile.test(tile)) throw Types.tile.test(tile);
		tile.id = tiles_count++;
		
		if(current_tile === null)tiles.push(tile);
		else tiles.splice(getTile(current_tile), 0, tile);
		
		Draw.Tiles.add(tile);
	}
	
	function Clear(){
		Draw.View.clear();
		Draw.Tiles.clear();
		tiles = [];
		current_tile = null;
		tiles_count = 0;
	}
}

module.exports = CrLogic;

},{"./Types.js":5}],5:[function(require,module,exports){
require("typesjs");
require("typesjs/str_type");

var T = Object.types;

var type_tile = T.obj({
		type: "color",
		color: {r: T.pos(256), b: T.pos(256), g: T.pos(256)}
	});
var type_tile_svg = T.obj({
		type: "svg",
		img: T.str(/^[\w\d+:;,=/]*$/, 1024*1024)
});
module.exports = {
	tile: T.any(type_tile_svg, type_tile), 
	tiles: T.arr(type_tile, 15)
};

},{"typesjs":18,"typesjs/str_type":17}],6:[function(require,module,exports){
const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrController = require("./Control.js");

var Types = require("./Types.js");
var Tiles = require("./new_tileset.json");

function Init(){
	var Logic = new CrLogic(Draw);
	Logic.load(Tiles, false);
	CrController(Logic, Draw);
}

Init();





},{"./Control.js":1,"./Draw.js":2,"./Logic.js":4,"./Types.js":5,"./new_tileset.json":7}],7:[function(require,module,exports){
module.exports={
 "tiles": [
  {
   "type": "color",
   "color": {
    "r": 0,
    "b": 0,
    "g": 0
   },
   "id": 0
  },
  {
   "type": "color",
   "color": {
    "r": 255,
    "b": 255,
    "g": 255
   },
   "id": 1
  }
 ],
 "width": 1,
 "height": 1
}

},{}],8:[function(require,module,exports){
var Chromath = require('./src/chromath.js');
module.exports = Chromath;

},{"./src/chromath.js":9}],9:[function(require,module,exports){
var util = require('./util');
/*
   Class: Chromath
*/
// Group: Constructors
/*
   Constructor: Chromath
   Create a new Chromath instance from a string or integer

   Parameters:
   mixed - The value to use for creating the color

   Returns:
   <Chromath> instance

   Properties:
   r - The red channel of the RGB representation of the Chromath. A number between 0 and 255.
   g - The green channel of the RGB representation of the Chromath. A number between 0 and 255.
   b - The blue channel of the RGB representation of the Chromath. A number between 0 and 255.
   a - The alpha channel of the Chromath. A number between 0 and 1.
   h - The hue of the Chromath. A number between 0 and 360.
   sl - The saturation of the HSL representation of the Chromath. A number between 0 and 1.
   sv - The saturation of the HSV/HSB representation of the Chromath. A number between 0 and 1.
   l - The lightness of the HSL representation of the Chromath. A number between 0 and 1.
   v - The lightness of the HSV/HSB representation of the Chromath. A number between 0 and 1.

   Examples:
  (start code)
// There are many ways to create a Chromath instance
new Chromath('#FF0000');                  // Hex (6 characters with hash)
new Chromath('FF0000');                   // Hex (6 characters without hash)
new Chromath('#F00');                     // Hex (3 characters with hash)
new Chromath('F00');                      // Hex (3 characters without hash)
new Chromath('red');                      // CSS/SVG Color name
new Chromath('rgb(255, 0, 0)');           // RGB via CSS
new Chromath({r: 255, g: 0, b: 0});       // RGB via object
new Chromath('rgba(255, 0, 0, 1)');       // RGBA via CSS
new Chromath({r: 255, g: 0, b: 0, a: 1}); // RGBA via object
new Chromath('hsl(0, 100%, 50%)');        // HSL via CSS
new Chromath({h: 0, s: 1, l: 0.5});       // HSL via object
new Chromath('hsla(0, 100%, 50%, 1)');    // HSLA via CSS
new Chromath({h: 0, s: 1, l: 0.5, a: 1}); // HSLA via object
new Chromath('hsv(0, 100%, 100%)');       // HSV via CSS
new Chromath({h: 0, s: 1, v: 1});         // HSV via object
new Chromath('hsva(0, 100%, 100%, 1)');   // HSVA via CSS
new Chromath({h: 0, s: 1, v: 1, a: 1});   // HSVA via object
new Chromath('hsb(0, 100%, 100%)');       // HSB via CSS
new Chromath({h: 0, s: 1, b: 1});         // HSB via object
new Chromath('hsba(0, 100%, 100%, 1)');   // HSBA via CSS
new Chromath({h: 0, s: 1, b: 1, a: 1});   // HSBA via object
new Chromath(16711680);                   // RGB via integer (alpha currently ignored)
(end code)
*/
function Chromath( mixed )
{
    var channels, color, hsl, hsv, rgb;

    if (util.isString(mixed) || util.isNumber(mixed)) {
        channels = Chromath.parse(mixed);
    } else if (util.isArray(mixed)){
        throw new Error('Unsure how to parse array `'+mixed+'`' +
                        ', please pass an object or CSS style ' +
                        'or try Chromath.rgb, Chromath.hsl, or Chromath.hsv'
                       );
    } else if (mixed instanceof Chromath) {
        channels = util.merge({}, mixed);
    } else if (util.isObject(mixed)){
        channels = util.merge({}, mixed);
    }

    if (! channels)
        throw new Error('Could not parse `'+mixed+'`');
    else if (!isFinite(channels.a))
        channels.a = 1;

    if ('r' in channels ){
        rgb = util.rgb.scaled01([channels.r, channels.g, channels.b]);
        hsl = Chromath.rgb2hsl(rgb);
        hsv = Chromath.rgb2hsv(rgb);
    } else if ('h' in channels ){
        if ('l' in channels){
            hsl = util.hsl.scaled([channels.h, channels.s, channels.l]);
            rgb = Chromath.hsl2rgb(hsl);
            hsv = Chromath.rgb2hsv(rgb);
        } else if ('v' in channels || 'b' in channels) {
            if ('b' in channels) channels.v = channels.b;
            hsv = util.hsl.scaled([channels.h, channels.s, channels.v]);
            rgb = Chromath.hsv2rgb(hsv);
            hsl = Chromath.rgb2hsl(rgb);
        }
    }


    util.merge(this, {
        r:  rgb[0],  g: rgb[1], b: rgb[2],
        h:  hsl[0], sl: hsl[1], l: hsl[2],
        sv: hsv[1],  v: hsv[2], a: channels.a
    });

    return this;
}

/*
  Constructor: Chromath.rgb
  Create a new <Chromath> instance from RGB values

  Parameters:
  r - Number, 0-255, representing the green channel OR Array OR object (with keys r,g,b) of RGB values
  g - Number, 0-255, representing the green channel
  b - Number, 0-255, representing the red channel
  a - (Optional) Float, 0-1, representing the alpha channel

 Returns:
 <Chromath>

 Examples:
 > > new Chromath.rgb(123, 234, 56).toString()
 > "#7BEA38"

 > > new Chromath.rgb([123, 234, 56]).toString()
 > "#7BEA38"

 > > new Chromath.rgb({r: 123, g: 234, b: 56}).toString()
 > "#7BEA38"
 */
Chromath.rgb = function (r, g, b, a)
{
    var rgba = util.rgb.fromArgs(r, g, b, a);
    r = rgba[0], g = rgba[1], b = rgba[2], a = rgba[3];

    return new Chromath({r: r, g: g, b: b, a: a});
};

/*
  Constructor: Chromath.rgba
  Alias for <Chromath.rgb>
*/
Chromath.rgba = Chromath.rgb;

/*
  Constructor: Chromath.hsl
  Create a new Chromath instance from HSL values

  Parameters:
  h - Number, -Infinity - Infinity, representing the hue OR Array OR object (with keys h,s,l) of HSL values
  s - Number, 0-1, representing the saturation
  l - Number, 0-1, representing the lightness
  a - (Optional) Float, 0-1, representing the alpha channel

  Returns:
  <Chromath>

  Examples:
  > > new Chromath.hsl(240, 1, 0.5).toString()
  > "#0000FF"

  > > new Chromath.hsl([240, 1, 0.5]).toString()
  > "#0000FF"

  > new Chromath.hsl({h:240, s:1, l:0.5}).toString()
  > "#0000FF"
 */
Chromath.hsl = function (h, s, l, a)
{
    var hsla = util.hsl.fromArgs(h, s, l, a);
    h = hsla[0], s = hsla[1], l = hsla[2], a = hsla[3];

    return new Chromath({h: h, s: s, l: l, a: a});
};

/*
  Constructor: Chromath.hsla
  Alias for <Chromath.hsl>
*/
Chromath.hsla = Chromath.hsl;

/*
  Constructor: Chromath.hsv
  Create a new Chromath instance from HSV values

  Parameters:
  h - Number, -Infinity - Infinity, representing the hue OR Array OR object (with keys h,s,l) of HSV values
  s - Number, 0-1, representing the saturation
  v - Number, 0-1, representing the lightness
  a - (Optional) Float, 0-1, representing the alpha channel

  Returns:
  <Chromath>

  Examples:
  > > new Chromath.hsv(240, 1, 1).toString()
  > "#0000FF"

  > > new Chromath.hsv([240, 1, 1]).toString()
  > "#0000FF"

  > > new Chromath.hsv({h:240, s:1, v:1}).toString()
  > "#0000FF"
 */
Chromath.hsv = function (h, s, v, a)
{
    var hsva = util.hsl.fromArgs(h, s, v, a);
    h = hsva[0], s = hsva[1], v = hsva[2], a = hsva[3];

    return new Chromath({h: h, s: s, v: v, a: a});
};

/*
  Constructor: Chromath.hsva
  Alias for <Chromath.hsv>
*/
Chromath.hsva = Chromath.hsv;

/*
  Constructor: Chromath.hsb
  Alias for <Chromath.hsv>
 */
Chromath.hsb = Chromath.hsv;

/*
   Constructor: Chromath.hsba
   Alias for <Chromath.hsva>
 */
Chromath.hsba = Chromath.hsva;

// Group: Static methods - representation
/*
  Method: Chromath.toInteger
  Convert a color into an integer (alpha channel currently omitted)

  Parameters:
  color - Accepts the same arguments as the Chromath constructor

  Returns:
  integer

  Examples:
  > > Chromath.toInteger('green');
  > 32768

  > > Chromath.toInteger('white');
  > 16777215
*/
Chromath.toInteger = function (color)
{
    // create something like '008000' (green)
    var hex6 = new Chromath(color).hex().join('');

    // Arguments beginning with `0x` are treated as hex values
    return Number('0x' + hex6);
};

/*
  Method: Chromath.toName
  Return the W3C color name of the color it matches

  Parameters:
  comparison

  Examples:
  > > Chromath.toName('rgb(255, 0, 255)');
  > 'fuchsia'

  > > Chromath.toName(65535);
  > 'aqua'
*/
Chromath.toName = function (comparison)
{
    comparison = +new Chromath(comparison);
    for (var color in Chromath.colors) if (+Chromath[color] == comparison) return color;
};

// Group: Static methods - color conversion
/*
  Method: Chromath.rgb2hex
  Convert an RGB value to a Hex value

  Returns: array

  Example:
  > > Chromath.rgb2hex(50, 100, 150)
  > "[32, 64, 96]"
 */
Chromath.rgb2hex = function rgb2hex(r, g, b)
{
    var rgb = util.rgb.scaled01(r, g, b);
    var hex = rgb.map(function (pct) {
      var dec = Math.round(pct * 255);
      var hex = dec.toString(16).toUpperCase();
      return util.lpad(hex, 2, 0);
    });

    return hex;
};

// Converted from http://en.wikipedia.org/wiki/HSL_and_HSV#General_approach
/*
  Method: Chromath.rgb2hsl
  Convert RGB to HSL

  Parameters:
  r - Number, 0-255, representing the green channel OR Array OR object (with keys r,g,b) of RGB values
  g - Number, 0-255, representing the green channel
  b - Number, 0-255, representing the red channel

  Returns: array

  > > Chromath.rgb2hsl(0, 255, 0);
  > [ 120, 1, 0.5 ]

  > > Chromath.rgb2hsl([0, 0, 255]);
  > [ 240, 1, 0.5 ]

  > > Chromath.rgb2hsl({r: 255, g: 0, b: 0});
  > [ 0, 1, 0.5 ]
 */
Chromath.rgb2hsl = function rgb2hsl(r, g, b)
{
    var rgb = util.rgb.scaled01(r, g, b);
    r = rgb[0], g = rgb[1], b = rgb[2];

    var M = Math.max(r, g, b);
    var m = Math.min(r, g, b);
    var C = M - m;
    var L = 0.5*(M + m);
    var S = (C === 0) ? 0 : C/(1-Math.abs(2*L-1));

    var h;
    if (C === 0) h = 0; // spec'd as undefined, but usually set to 0
    else if (M === r) h = ((g-b)/C) % 6;
    else if (M === g) h = ((b-r)/C) + 2;
    else if (M === b) h = ((r-g)/C) + 4;

    var H = 60 * h;

    return [H, parseFloat(S), parseFloat(L)];
};

/*
  Method: Chromath.rgb2hsv
  Convert RGB to HSV

  Parameters:
  r - Number, 0-255, representing the green channel OR Array OR object (with keys r,g,b) of RGB values
  g - Number, 0-255, representing the green channel
  b - Number, 0-255, representing the red channel

  Returns:
  Array

  > > Chromath.rgb2hsv(0, 255, 0);
  > [ 120, 1, 1 ]

  > > Chromath.rgb2hsv([0, 0, 255]);
  > [ 240, 1, 1 ]

  > > Chromath.rgb2hsv({r: 255, g: 0, b: 0});
  > [ 0, 1, 1 ]
 */
Chromath.rgb2hsv = function rgb2hsv(r, g, b)
{
    var rgb = util.rgb.scaled01(r, g, b);
    r = rgb[0], g = rgb[1], b = rgb[2];

    var M = Math.max(r, g, b);
    var m = Math.min(r, g, b);
    var C = M - m;
    var L = M;
    var S = (C === 0) ? 0 : C/M;

    var h;
    if (C === 0) h = 0; // spec'd as undefined, but usually set to 0
    else if (M === r) h = ((g-b)/C) % 6;
    else if (M === g) h = ((b-r)/C) + 2;
    else if (M === b) h = ((r-g)/C) + 4;

    var H = 60 * h;

    return [H, parseFloat(S), parseFloat(L)];
};

/*
   Method: Chromath.rgb2hsb
   Alias for <Chromath.rgb2hsv>
 */
Chromath.rgb2hsb = Chromath.rgb2hsv;

/*
  Method: Chromath.hsl2rgb
  Convert from HSL to RGB

  Parameters:
  h - Number, -Infinity - Infinity, representing the hue OR Array OR object (with keys h,s,l) of HSL values
  s - Number, 0-1, representing the saturation
  l - Number, 0-1, representing the lightness

  Returns:
  array

  Examples:
  > > Chromath.hsl2rgb(360, 1, 0.5);
  > [ 255, 0, 0 ]

  > > Chromath.hsl2rgb([0, 1, 0.5]);
  > [ 255, 0, 0 ]

  > > Chromath.hsl2rgb({h: 210, s:1, v: 0.5});
  > [ 0, 127.5, 255 ]
 */
// TODO: Can I %= hp and then do a switch?
Chromath.hsl2rgb = function hsl2rgb(h, s, l)
{
    var hsl = util.hsl.scaled(h, s, l);
    h=hsl[0], s=hsl[1], l=hsl[2];

    var C = (1 - Math.abs(2*l-1)) * s;
    var hp = h/60;
    var X = C * (1-Math.abs(hp%2-1));
    var rgb, m;

    switch (Math.floor(hp)){
    case 0:  rgb = [C,X,0]; break;
    case 1:  rgb = [X,C,0]; break;
    case 2:  rgb = [0,C,X]; break;
    case 3:  rgb = [0,X,C]; break;
    case 4:  rgb = [X,0,C]; break;
    case 5:  rgb = [C,0,X]; break;
    default: rgb = [0,0,0];
    }

    m = l - (C/2);

    return [
        (rgb[0]+m),
        (rgb[1]+m),
        (rgb[2]+m)
    ];
};

/*
  Method: Chromath.hsv2rgb
  Convert HSV to RGB

  Parameters:
  h - Number, -Infinity - Infinity, representing the hue OR Array OR object (with keys h,s,v or h,s,b) of HSV values
  s - Number, 0-1, representing the saturation
  v - Number, 0-1, representing the lightness

  Examples:
  > > Chromath.hsv2rgb(360, 1, 1);
  > [ 255, 0, 0 ]

  > > Chromath.hsv2rgb([0, 1, 0.5]);
  > [ 127.5, 0, 0 ]

  > > Chromath.hsv2rgb({h: 210, s: 0.5, v: 1});
  > [ 127.5, 191.25, 255 ]
 */
Chromath.hsv2rgb = function hsv2rgb(h, s, v)
{
    var hsv = util.hsl.scaled(h, s, v);
    h=hsv[0], s=hsv[1], v=hsv[2];

    var C = v * s;
    var hp = h/60;
    var X = C*(1-Math.abs(hp%2-1));
    var rgb, m;

    if (h == undefined)         rgb = [0,0,0];
    else if (0 <= hp && hp < 1) rgb = [C,X,0];
    else if (1 <= hp && hp < 2) rgb = [X,C,0];
    else if (2 <= hp && hp < 3) rgb = [0,C,X];
    else if (3 <= hp && hp < 4) rgb = [0,X,C];
    else if (4 <= hp && hp < 5) rgb = [X,0,C];
    else if (5 <= hp && hp < 6) rgb = [C,0,X];

    m = v - C;

    return [
        (rgb[0]+m),
        (rgb[1]+m),
        (rgb[2]+m)
    ];
};

/*
   Method: Chromath.hsb2rgb
   Alias for <Chromath.hsv2rgb>
 */
Chromath.hsb2rgb = Chromath.hsv2rgb;

/*
    Property: Chromath.convert
    Aliases for the Chromath.x2y functions.
    Use like Chromath.convert[x][y](args) or Chromath.convert.x.y(args)
*/
Chromath.convert = {
    rgb: {
        hex: Chromath.hsv2rgb,
        hsl: Chromath.rgb2hsl,
        hsv: Chromath.rgb2hsv
    },
    hsl: {
        rgb: Chromath.hsl2rgb
    },
    hsv: {
        rgb: Chromath.hsv2rgb
    }
};

/* Group: Static methods - color scheme */
/*
  Method: Chromath.complement
  Return the complement of the given color

  Returns: <Chromath>

  > > Chromath.complement(new Chromath('red'));
  > { r: 0, g: 255, b: 255, a: 1, h: 180, sl: 1, sv: 1, l: 0.5, v: 1 }

  > > Chromath.complement(new Chromath('red')).toString();
  > '#00FFFF'
 */
Chromath.complement = function (color)
{
    var c = new Chromath(color);
    var hsl = c.toHSLObject();

    hsl.h = (hsl.h + 180) % 360;

    return new Chromath(hsl);
};

/*
  Method: Chromath.triad
  Create a triad color scheme from the given Chromath.

  Examples:
  > > Chromath.triad(Chromath.yellow)
  > [ { r: 255, g: 255, b: 0, a: 1, h: 60, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 255, a: 1, h: 180, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 255, g: 0, b: 255, a: 1, h: 300, sl: 1, sv: 1, l: 0.5, v: 1 } ]

 > > Chromath.triad(Chromath.yellow).toString();
 > '#FFFF00,#00FFFF,#FF00FF'
*/
Chromath.triad = function (color)
{
    var c = new Chromath(color);

    return [
        c,
        new Chromath({r: c.b, g: c.r, b: c.g}),
        new Chromath({r: c.g, g: c.b, b: c.r})
    ];
};

/*
  Method: Chromath.tetrad
  Create a tetrad color scheme from the given Chromath.

  Examples:
  > > Chromath.tetrad(Chromath.cyan)
  > [ { r: 0, g: 255, b: 255, a: 1, h: 180, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 255, g: 0, b: 255, a: 1, h: 300, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 255, g: 255, b: 0, a: 1, h: 60, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 0, a: 1, h: 120, sl: 1, sv: 1, l: 0.5, v: 1 } ]

  > > Chromath.tetrad(Chromath.cyan).toString();
  > '#00FFFF,#FF00FF,#FFFF00,#00FF00'
*/
Chromath.tetrad = function (color)
{
    var c = new Chromath(color);

    return [
        c,
        new Chromath({r: c.b, g: c.r, b: c.b}),
        new Chromath({r: c.b, g: c.g, b: c.r}),
        new Chromath({r: c.r, g: c.b, b: c.r})
    ];
};

/*
  Method: Chromath.analogous
  Find analogous colors from a given color

  Parameters:
  mixed - Any argument which is passed to <Chromath>
  results - How many colors to return (default = 3)
  slices - How many pieces are in the color wheel (default = 12)

  Examples:
  > > Chromath.analogous(new Chromath('rgb(0, 255, 255)'))
  > [ { r: 0, g: 255, b: 255, a: 1, h: 180, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 101, a: 1, h: 144, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 153, a: 1, h: 156, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 203, a: 1, h: 168, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 255, b: 255, a: 1, h: 180, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 203, b: 255, a: 1, h: 192, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 153, b: 255, a: 1, h: 204, sl: 1, sv: 1, l: 0.5, v: 1 },
  >   { r: 0, g: 101, b: 255, a: 1, h: 216, sl: 1, sv: 1, l: 0.5, v: 1 } ]

  > > Chromath.analogous(new Chromath('rgb(0, 255, 255)')).toString()
  > '#00FFFF,#00FF65,#00FF99,#00FFCB,#00FFFF,#00CBFF,#0099FF,#0065FF'
 */
Chromath.analogous = function (color, results, slices)
{
    if (!isFinite(results)) results = 3;
    if (!isFinite(slices)) slices = 12;

    var c = new Chromath(color);
    var hsv = c.toHSVObject();
    var slice = 360 / slices;
    var ret = [ c ];

    hsv.h = ((hsv.h - (slices * results >> 1)) + 720) % 360;
    while (--results) {
        hsv.h = (hsv.h + slice) % 360;
        ret.push(new Chromath(hsv));
    }

    return ret;
};

/*
  Method: Chromath.monochromatic
  Return a series of the given color at various lightnesses

  Examples:
  > > Chromath.monochromatic('rgb(0, 100, 255)').forEach(function (c){ console.log(c.toHSVString()); })
  > hsv(216,100%,20%)
  > hsv(216,100%,40%)
  > hsv(216,100%,60%)
  > hsv(216,100%,80%)
  > hsv(216,100%,100%)
*/
Chromath.monochromatic = function (color, results)
{
    if (!results) results = 5;

    var c = new Chromath(color);
    var hsv = c.toHSVObject();
    var inc = 1 / results;
    var ret = [], step = 0;

    while (step++ < results) {
        hsv.v = step * inc;
        ret.push(new Chromath(hsv));
    }

    return ret;
};

/*
  Method: Chromath.splitcomplement
  Generate a split complement color scheme from the given color

  Examples:
  > > Chromath.splitcomplement('rgb(0, 100, 255)')
  > [ { r: 0, g: 100, b: 255, h: 216.47058823529414, sl: 1, l: 0.5, sv: 1, v: 1, a: 1 },
  >   { r: 255, g: 183, b: 0, h: 43.19999999999999, sl: 1, l: 0.5, sv: 1, v: 1, a: 1 },
  >   { r: 255, g: 73, b: 0, h: 17.279999999999973, sl: 1, l: 0.5, sv: 1, v: 1, a: 1 } ]

  > > Chromath.splitcomplement('rgb(0, 100, 255)').toString()
  > '#0064FF,#FFB700,#FF4900'
 */
Chromath.splitcomplement = function (color)
{
    var ref = new Chromath(color);
    var hsv = ref.toHSVObject();

    var a = new Chromath.hsv({
        h: (hsv.h + 150) % 360,
        s: hsv.s,
        v: hsv.v
    });

    var b = new Chromath.hsv({
        h: (hsv.h + 210) % 360,
        s: hsv.s,
        v: hsv.v
    });

    return [ref, a, b];
};

//Group: Static methods - color alteration
/*
  Method: Chromath.tint
  Lighten a color by adding a percentage of white to it

  Returns <Chromath>

  > > Chromath.tint('rgb(0, 100, 255)', 0.5).toRGBString();
  > 'rgb(127,177,255)'
*/
Chromath.tint = function ( from, by )
{
    return Chromath.towards( from, '#FFFFFF', by );
};

/*
   Method: Chromath.lighten
   Alias for <Chromath.tint>
*/
Chromath.lighten = Chromath.tint;

/*
  Method: Chromath.shade
  Darken a color by adding a percentage of black to it

  Example:
  > > Chromath.darken('rgb(0, 100, 255)', 0.5).toRGBString();
  > 'rgb(0,50,127)'
 */
Chromath.shade = function ( from, by )
{
    return Chromath.towards( from, '#000000', by );
};

/*
   Method: Chromath.darken
   Alias for <Chromath.shade>
 */
Chromath.darken = Chromath.shade;

/*
  Method: Chromath.desaturate
  Desaturate a color using any of 3 approaches

  Parameters:
  color - any argument accepted by the <Chromath> constructor
  formula - The formula to use (from <xarg's greyfilter at http://www.xarg.org/project/jquery-color-plugin-xcolor>)
  - 1 - xarg's own formula
  - 2 - Sun's formula: (1 - avg) / (100 / 35) + avg)
  - empty - The oft-seen 30% red, 59% green, 11% blue formula

  Examples:
  > > Chromath.desaturate('red').toString()
  > "#4C4C4C"

  > > Chromath.desaturate('red', 1).toString()
  > "#373737"

  > > Chromath.desaturate('red', 2).toString()
  > "#909090"
*/
Chromath.desaturate = function (color, formula)
{
    var c = new Chromath(color), rgb, avg;

    switch (formula) {
    case 1: // xarg's formula
        avg = .35 + 13 * (c.r + c.g + c.b) / 60; break;
    case 2: // Sun's formula: (1 - avg) / (100 / 35) + avg)
        avg = (13 * (c.r + c.g + c.b) + 5355) / 60; break;
    default:
        avg = c.r * .3 + c.g * .59 + c.b * .11;
    }

    avg = util.clamp(avg, 0, 255);
    rgb = {r: avg, g: avg, b: avg};

    return new Chromath(rgb);
};

/*
  Method: Chromath.greyscale
  Alias for <Chromath.desaturate>
*/
Chromath.greyscale = Chromath.desaturate;

/*
  Method: Chromath.websafe
  Convert a color to one of the 216 "websafe" colors

  Examples:
  > > Chromath.websafe('#ABCDEF').toString()
  > '#99CCFF'

  > > Chromath.websafe('#BBCDEF').toString()
  > '#CCCCFF'
 */
Chromath.websafe = function (color)
{
    color = new Chromath(color);

    color.r = Math.round(color.r / 51) * 51;
    color.g = Math.round(color.g / 51) * 51;
    color.b = Math.round(color.b / 51) * 51;

    return new Chromath(color);
};

//Group: Static methods - color combination
/*
  Method: Chromath.additive
  Combine any number colors using additive color

  Examples:
  > > Chromath.additive('#F00', '#0F0').toString();
  > '#FFFF00'

  > > Chromath.additive('#F00', '#0F0').toString() == Chromath.yellow.toString();
  > true

  > > Chromath.additive('red', '#0F0', 'rgb(0, 0, 255)').toString() == Chromath.white.toString();
  > true
 */
Chromath.additive = function ()
{
    var args = arguments.length-2, i=-1, a, b;
    while (i++ < args){

        a = a || new Chromath(arguments[i]);
        b = new Chromath(arguments[i+1]);

        if ((a.r += b.r) > 255) a.r = 255;
        if ((a.g += b.g) > 255) a.g = 255;
        if ((a.b += b.b) > 255) a.b = 255;

        a = new Chromath(a);
    }

    return a;
};

/*
  Method: Chromath.subtractive
  Combine any number of colors using subtractive color

  Examples:
  > > Chromath.subtractive('yellow', 'magenta').toString();
  > '#FF0000'

  > > Chromath.subtractive('yellow', 'magenta').toString() === Chromath.red.toString();
  > true

  > > Chromath.subtractive('cyan', 'magenta', 'yellow').toString();
  > '#000000'

  > > Chromath.subtractive('red', '#0F0', 'rgb(0, 0, 255)').toString();
  > '#000000'
*/
Chromath.subtractive = function ()
{
    var args = arguments.length-2, i=-1, a, b;
    while (i++ < args){

        a = a || new Chromath(arguments[i]);
        b = new Chromath(arguments[i+1]);

        if ((a.r += b.r - 255) < 0) a.r = 0;
        if ((a.g += b.g - 255) < 0) a.g = 0;
        if ((a.b += b.b - 255) < 0) a.b = 0;

        a = new Chromath(a);
    }

    return a;
};

/*
  Method: Chromath.multiply
  Multiply any number of colors

  Examples:
  > > Chromath.multiply(Chromath.lightgoldenrodyellow, Chromath.lightblue).toString();
  > "#A9D3BD"

  > > Chromath.multiply(Chromath.oldlace, Chromath.lightblue, Chromath.darkblue).toString();
  > "#000070"
*/
Chromath.multiply = function ()
{
    var args = arguments.length-2, i=-1, a, b;
    while (i++ < args){

        a = a || new Chromath(arguments[i]);
        b = new Chromath(arguments[i+1]);

        a.r = (a.r / 255 * b.r)|0;
        a.g = (a.g / 255 * b.g)|0;
        a.b = (a.b / 255 * b.b)|0;

        a = new Chromath(a);
    }

    return a;
};

/*
  Method: Chromath.average
  Averages any number of colors

  Examples:
  > > Chromath.average(Chromath.lightgoldenrodyellow, Chromath.lightblue).toString()
  > "#D3E9DC"

  > > Chromath.average(Chromath.oldlace, Chromath.lightblue, Chromath.darkblue).toString()
  > "#6A73B8"
 */
Chromath.average = function ()
{
    var args = arguments.length-2, i=-1, a, b;
    while (i++ < args){

        a = a || new Chromath(arguments[i]);
        b = new Chromath(arguments[i+1]);

        a.r = (a.r + b.r) >> 1;
        a.g = (a.g + b.g) >> 1;
        a.b = (a.b + b.b) >> 1;

        a = new Chromath(a);
    }

    return a;
};

/*
  Method: Chromath.overlay
  Add one color on top of another with a given transparency

  Examples:
  > > Chromath.average(Chromath.lightgoldenrodyellow, Chromath.lightblue).toString()
  > "#D3E9DC"

  > > Chromath.average(Chromath.oldlace, Chromath.lightblue, Chromath.darkblue).toString()
  > "#6A73B8"
 */
Chromath.overlay = function (top, bottom, opacity)
{
    var a = new Chromath(top);
    var b = new Chromath(bottom);

    if (opacity > 1) opacity /= 100;
    opacity = util.clamp(opacity - 1 + b.a, 0, 1);

    return new Chromath({
        r: util.lerp(a.r, b.r, opacity),
        g: util.lerp(a.g, b.g, opacity),
        b: util.lerp(a.b, b.b, opacity)
    });
};


//Group: Static methods - other
/*
  Method: Chromath.towards
  Move from one color towards another by the given percentage (0-1, 0-100)

  Parameters:
  from - The starting color
  to - The destination color
  by - The percentage, expressed as a floating number between 0 and 1, to move towards the destination color
  interpolator - The function to use for interpolating between the two points. Defaults to Linear Interpolation. Function has the signature `(from, to, by)` with the parameters having the same meaning as those in `towards`.

  > > Chromath.towards('red', 'yellow', 0.5).toString()
  > "#FF7F00"
*/
Chromath.towards = function (from, to, by, interpolator)
{
    if (!to) { return from; }
    if (!isFinite(by))
        throw new Error('TypeError: `by`(' + by  +') should be between 0 and 1');
    if (!(from instanceof Chromath)) from = new Chromath(from);
    if (!(to instanceof Chromath)) to = new Chromath(to || '#FFFFFF');
    if (!interpolator) interpolator = util.lerp;
    by = parseFloat(by);

    return new Chromath({
        r: interpolator(from.r, to.r, by),
        g: interpolator(from.g, to.g, by),
        b: interpolator(from.b, to.b, by),
        a: interpolator(from.a, to.a, by)
    });
};

/*
  Method: Chromath.gradient
  Create an array of Chromath objects

  Parameters:
  from - The beginning color of the gradient
  to - The end color of the gradient
  slices - The number of colors in the array
  slice - The color at a specific, 1-based, slice index

  Examples:
  > > Chromath.gradient('red', 'yellow').length;
  > 20

  > > Chromath.gradient('red', 'yellow', 5).toString();
  > "#FF0000,#FF3F00,#FF7F00,#FFBF00,#FFFF00"

  > > Chromath.gradient('red', 'yellow', 5, 2).toString();
  > "#FF7F00"

  > > Chromath.gradient('red', 'yellow', 5)[2].toString();
  > "#FF7F00"
 */
Chromath.gradient = function (from, to, slices, slice)
{
    var gradient = [], stops;

    if (! slices) slices = 20;
    stops = (slices-1);

    if (isFinite(slice)) return Chromath.towards(from, to, slice/stops);
    else slice = -1;

    while (++slice < slices){
        gradient.push(Chromath.towards(from, to, slice/stops));
    }

    return gradient;
};

/*
  Method: Chromath.parse
  Iterate through the objects set in Chromath.parsers and, if a match is made, return the value specified by the matching parsers `process` function

  Parameters:
  string - The string to parse

  Example:
  > > Chromath.parse('rgb(0, 128, 255)')
  > { r: 0, g: 128, b: 255, a: undefined }
 */
Chromath.parse = function (string)
{
    var parsers = Chromath.parsers, i, l, parser, parts, channels;

    for (i = 0, l = parsers.length; i < l; i++) {
        parser = parsers[i];
        parts = parser.regex.exec(string);
        if (parts && parts.length) channels = parser.process.apply(this, parts);
        if (channels) return channels;
    }
};

// Group: Static properties
/*
  Property: Chromath.parsers
   An array of objects for attempting to convert a string describing a color into an object containing the various channels. No user action is required but parsers can be

   Object properties:
   regex - regular expression used to test the string or numeric input
   process - function which is passed the results of `regex.match` and returns an object with either the rgb, hsl, hsv, or hsb channels of the Chromath.

   Examples:
(start code)
// Add a parser
Chromath.parsers.push({
    example: [3554431, 16809984],
    regex: /^\d+$/,
    process: function (color){
        return {
            r: color >> 16 & 255,
            g: color >> 8 & 255,
            b: color & 255
        };
    }
});
(end code)
(start code)
// Override entirely
Chromath.parsers = [
   {
       example: [3554431, 16809984],
       regex: /^\d+$/,
       process: function (color){
           return {
               r: color >> 16 & 255,
               g: color >> 8 & 255,
               b: color & 255
           };
       }
   },

   {
       example: ['#fb0', 'f0f'],
       regex: /^#?([\dA-F]{1})([\dA-F]{1})([\dA-F]{1})$/i,
       process: function (hex, r, g, b){
           return {
               r: parseInt(r + r, 16),
               g: parseInt(g + g, 16),
               b: parseInt(b + b, 16)
           };
       }
   }
(end code)
 */
Chromath.parsers = require('./parsers').parsers;

// Group: Instance methods - color representation
Chromath.prototype = require('./prototype')(Chromath);

/*
  Property: Chromath.colors
  Object, indexed by SVG/CSS color name, of <Chromath> instances
  The color names from CSS and SVG 1.0

  Examples:
  > > Chromath.colors.aliceblue.toRGBArray()
  > [240, 248, 255]

  > > Chromath.colors.beige.toString()
  > "#F5F5DC"

  > // Can also be accessed without `.color`
  > > Chromath.aliceblue.toRGBArray()
  > [240, 248, 255]

  > > Chromath.beige.toString()
  > "#F5F5DC"
*/
var css2Colors  = require('./colornames_css2');
var css3Colors  = require('./colornames_css3');
var allColors   = util.merge({}, css2Colors, css3Colors);
Chromath.colors = {};
for (var colorName in allColors) {
    // e.g., Chromath.wheat and Chromath.colors.wheat
    Chromath[colorName] = Chromath.colors[colorName] = new Chromath(allColors[colorName]);
}
// add a parser for the color names
Chromath.parsers.push({
    example: ['red', 'burlywood'],
    regex: /^[a-z]+$/i,
    process: function (colorName){
        if (Chromath.colors[colorName]) return Chromath.colors[colorName];
    }
});

module.exports = Chromath;

},{"./colornames_css2":10,"./colornames_css3":11,"./parsers":12,"./prototype":13,"./util":14}],10:[function(require,module,exports){
module.exports = {
    // from http://www.w3.org/TR/REC-html40/types.html#h-6.5
    aqua    : {r: 0,   g: 255, b: 255},
    black   : {r: 0,   g: 0,   b: 0},
    blue    : {r: 0,   g: 0,   b: 255},
    fuchsia : {r: 255, g: 0,   b: 255},
    gray    : {r: 128, g: 128, b: 128},
    green   : {r: 0,   g: 128, b: 0},
    lime    : {r: 0,   g: 255, b: 0},
    maroon  : {r: 128, g: 0,   b: 0},
    navy    : {r: 0,   g: 0,   b: 128},
    olive   : {r: 128, g: 128, b: 0},
    purple  : {r: 128, g: 0,   b: 128},
    red     : {r: 255, g: 0,   b: 0},
    silver  : {r: 192, g: 192, b: 192},
    teal    : {r: 0,   g: 128, b: 128},
    white   : {r: 255, g: 255, b: 255},
    yellow  : {r: 255, g: 255, b: 0}
};

},{}],11:[function(require,module,exports){
module.exports = {
    // http://www.w3.org/TR/css3-color/#svg-color
    // http://www.w3.org/TR/SVG/types.html#ColorKeywords
    aliceblue            : {r: 240, g: 248, b: 255},
    antiquewhite         : {r: 250, g: 235, b: 215},
    aquamarine           : {r: 127, g: 255, b: 212},
    azure                : {r: 240, g: 255, b: 255},
    beige                : {r: 245, g: 245, b: 220},
    bisque               : {r: 255, g: 228, b: 196},
    blanchedalmond       : {r: 255, g: 235, b: 205},
    blueviolet           : {r: 138, g: 43,  b: 226},
    brown                : {r: 165, g: 42,  b: 42},
    burlywood            : {r: 222, g: 184, b: 135},
    cadetblue            : {r: 95,  g: 158, b: 160},
    chartreuse           : {r: 127, g: 255, b: 0},
    chocolate            : {r: 210, g: 105, b: 30},
    coral                : {r: 255, g: 127, b: 80},
    cornflowerblue       : {r: 100, g: 149, b: 237},
    cornsilk             : {r: 255, g: 248, b: 220},
    crimson              : {r: 220, g: 20,  b: 60},
    cyan                 : {r: 0,   g: 255, b: 255},
    darkblue             : {r: 0,   g: 0,   b: 139},
    darkcyan             : {r: 0,   g: 139, b: 139},
    darkgoldenrod        : {r: 184, g: 134, b: 11},
    darkgray             : {r: 169, g: 169, b: 169},
    darkgreen            : {r: 0,   g: 100, b: 0},
    darkgrey             : {r: 169, g: 169, b: 169},
    darkkhaki            : {r: 189, g: 183, b: 107},
    darkmagenta          : {r: 139, g: 0,   b: 139},
    darkolivegreen       : {r: 85,  g: 107, b: 47},
    darkorange           : {r: 255, g: 140, b: 0},
    darkorchid           : {r: 153, g: 50,  b: 204},
    darkred              : {r: 139, g: 0,   b: 0},
    darksalmon           : {r: 233, g: 150, b: 122},
    darkseagreen         : {r: 143, g: 188, b: 143},
    darkslateblue        : {r: 72,  g: 61,  b: 139},
    darkslategray        : {r: 47,  g: 79,  b: 79},
    darkslategrey        : {r: 47,  g: 79,  b: 79},
    darkturquoise        : {r: 0,   g: 206, b: 209},
    darkviolet           : {r: 148, g: 0,   b: 211},
    deeppink             : {r: 255, g: 20,  b: 147},
    deepskyblue          : {r: 0,   g: 191, b: 255},
    dimgray              : {r: 105, g: 105, b: 105},
    dimgrey              : {r: 105, g: 105, b: 105},
    dodgerblue           : {r: 30,  g: 144, b: 255},
    firebrick            : {r: 178, g: 34,  b: 34},
    floralwhite          : {r: 255, g: 250, b: 240},
    forestgreen          : {r: 34,  g: 139, b: 34},
    gainsboro            : {r: 220, g: 220, b: 220},
    ghostwhite           : {r: 248, g: 248, b: 255},
    gold                 : {r: 255, g: 215, b: 0},
    goldenrod            : {r: 218, g: 165, b: 32},
    greenyellow          : {r: 173, g: 255, b: 47},
    grey                 : {r: 128, g: 128, b: 128},
    honeydew             : {r: 240, g: 255, b: 240},
    hotpink              : {r: 255, g: 105, b: 180},
    indianred            : {r: 205, g: 92,  b: 92},
    indigo               : {r: 75,  g: 0,   b: 130},
    ivory                : {r: 255, g: 255, b: 240},
    khaki                : {r: 240, g: 230, b: 140},
    lavender             : {r: 230, g: 230, b: 250},
    lavenderblush        : {r: 255, g: 240, b: 245},
    lawngreen            : {r: 124, g: 252, b: 0},
    lemonchiffon         : {r: 255, g: 250, b: 205},
    lightblue            : {r: 173, g: 216, b: 230},
    lightcoral           : {r: 240, g: 128, b: 128},
    lightcyan            : {r: 224, g: 255, b: 255},
    lightgoldenrodyellow : {r: 250, g: 250, b: 210},
    lightgray            : {r: 211, g: 211, b: 211},
    lightgreen           : {r: 144, g: 238, b: 144},
    lightgrey            : {r: 211, g: 211, b: 211},
    lightpink            : {r: 255, g: 182, b: 193},
    lightsalmon          : {r: 255, g: 160, b: 122},
    lightseagreen        : {r: 32,  g: 178, b: 170},
    lightskyblue         : {r: 135, g: 206, b: 250},
    lightslategray       : {r: 119, g: 136, b: 153},
    lightslategrey       : {r: 119, g: 136, b: 153},
    lightsteelblue       : {r: 176, g: 196, b: 222},
    lightyellow          : {r: 255, g: 255, b: 224},
    limegreen            : {r: 50,  g: 205, b: 50},
    linen                : {r: 250, g: 240, b: 230},
    magenta              : {r: 255, g: 0,   b: 255},
    mediumaquamarine     : {r: 102, g: 205, b: 170},
    mediumblue           : {r: 0,   g: 0,   b: 205},
    mediumorchid         : {r: 186, g: 85,  b: 211},
    mediumpurple         : {r: 147, g: 112, b: 219},
    mediumseagreen       : {r: 60,  g: 179, b: 113},
    mediumslateblue      : {r: 123, g: 104, b: 238},
    mediumspringgreen    : {r: 0,   g: 250, b: 154},
    mediumturquoise      : {r: 72,  g: 209, b: 204},
    mediumvioletred      : {r: 199, g: 21,  b: 133},
    midnightblue         : {r: 25,  g: 25,  b: 112},
    mintcream            : {r: 245, g: 255, b: 250},
    mistyrose            : {r: 255, g: 228, b: 225},
    moccasin             : {r: 255, g: 228, b: 181},
    navajowhite          : {r: 255, g: 222, b: 173},
    oldlace              : {r: 253, g: 245, b: 230},
    olivedrab            : {r: 107, g: 142, b: 35},
    orange               : {r: 255, g: 165, b: 0},
    orangered            : {r: 255, g: 69,  b: 0},
    orchid               : {r: 218, g: 112, b: 214},
    palegoldenrod        : {r: 238, g: 232, b: 170},
    palegreen            : {r: 152, g: 251, b: 152},
    paleturquoise        : {r: 175, g: 238, b: 238},
    palevioletred        : {r: 219, g: 112, b: 147},
    papayawhip           : {r: 255, g: 239, b: 213},
    peachpuff            : {r: 255, g: 218, b: 185},
    peru                 : {r: 205, g: 133, b: 63},
    pink                 : {r: 255, g: 192, b: 203},
    plum                 : {r: 221, g: 160, b: 221},
    powderblue           : {r: 176, g: 224, b: 230},
    rosybrown            : {r: 188, g: 143, b: 143},
    royalblue            : {r: 65,  g: 105, b: 225},
    saddlebrown          : {r: 139, g: 69,  b: 19},
    salmon               : {r: 250, g: 128, b: 114},
    sandybrown           : {r: 244, g: 164, b: 96},
    seagreen             : {r: 46,  g: 139, b: 87},
    seashell             : {r: 255, g: 245, b: 238},
    sienna               : {r: 160, g: 82,  b: 45},
    skyblue              : {r: 135, g: 206, b: 235},
    slateblue            : {r: 106, g: 90,  b: 205},
    slategray            : {r: 112, g: 128, b: 144},
    slategrey            : {r: 112, g: 128, b: 144},
    snow                 : {r: 255, g: 250, b: 250},
    springgreen          : {r: 0,   g: 255, b: 127},
    steelblue            : {r: 70,  g: 130, b: 180},
    tan                  : {r: 210, g: 180, b: 140},
    thistle              : {r: 216, g: 191, b: 216},
    tomato               : {r: 255, g: 99,  b: 71},
    turquoise            : {r: 64,  g: 224, b: 208},
    violet               : {r: 238, g: 130, b: 238},
    wheat                : {r: 245, g: 222, b: 179},
    whitesmoke           : {r: 245, g: 245, b: 245},
    yellowgreen          : {r: 154, g: 205, b: 50}
}

},{}],12:[function(require,module,exports){
var util = require('./util');

module.exports = {
    parsers: [
        {
            example: [3554431, 16809984],
            regex: /^\d+$/,
            process: function (color){
                return {
                    //a: color >> 24 & 255,
                    r: color >> 16 & 255,
                    g: color >> 8 & 255,
                    b: color & 255
                };
            }
        },

        {
            example: ['#fb0', 'f0f'],
            regex: /^#?([\dA-F]{1})([\dA-F]{1})([\dA-F]{1})$/i,
            process: function (hex, r, g, b){
                return {
                    r: parseInt(r + r, 16),
                    g: parseInt(g + g, 16),
                    b: parseInt(b + b, 16)
                };
            }
        },

        {
            example: ['#00ff00', '336699'],
            regex: /^#?([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})$/i,
            process: function (hex, r, g, b){
                return {
                    r: parseInt(r, 16),
                    g: parseInt(g, 16),
                    b: parseInt(b, 16)
                };
            }
        },

        {
            example: ['rgb(123, 234, 45)', 'rgb(25, 50%, 100%)', 'rgba(12%, 34, 56%, 0.78)'],
            // regex: /^rgba*\((\d{1,3}\%*),\s*(\d{1,3}\%*),\s*(\d{1,3}\%*)(?:,\s*([0-9.]+))?\)/,
            regex: /^rgba*\(([0-9]*\.?[0-9]+\%*),\s*([0-9]*\.?[0-9]+\%*),\s*([0-9]*\.?[0-9]+\%*)(?:,\s*([0-9.]+))?\)/,
            process: function (s,r,g,b,a)
            {
                r = r && r.slice(-1) == '%' ? (r.slice(0,-1) / 100) : r*1;
                g = g && g.slice(-1) == '%' ? (g.slice(0,-1) / 100) : g*1;
                b = b && b.slice(-1) == '%' ? (b.slice(0,-1) / 100) : b*1;
                a = a*1;

                return {
                    r: util.clamp(r, 0, 255),
                    g: util.clamp(g, 0, 255),
                    b: util.clamp(b, 0, 255),
                    a: util.clamp(a, 0, 1) || undefined
                };
            }
        },

        {
            example: ['hsl(123, 34%, 45%)', 'hsla(25, 50%, 100%, 0.75)', 'hsv(12, 34%, 56%)'],
            regex: /^hs([bvl])a*\((\d{1,3}\%*),\s*(\d{1,3}\%*),\s*(\d{1,3}\%*)(?:,\s*([0-9.]+))?\)/,
            process: function (c,lv,h,s,l,a)
            {
                h *= 1;
                s = s.slice(0,-1) / 100;
                l = l.slice(0,-1) / 100;
                a *= 1;

                var obj = {
                    h: util.clamp(h, 0, 360),
                    a: util.clamp(l, 0, 1)
                };
                // `s` is used in many different spaces (HSL, HSV, HSB)
                // so we use `sl`, `sv` and `sb` to differentiate
                obj['s'+lv] = util.clamp(s, 0, 1),
                obj[lv] = util.clamp(l, 0, 1);

                return obj;
            }
        }
    ]
};

},{"./util":14}],13:[function(require,module,exports){
module.exports = function ChromathPrototype(Chromath) {
  return {
      /*
         Method: toName
         Call <Chromath.toName> on the current instance
         > > var color = new Chromath('rgb(173, 216, 230)');
         > > color.toName();
         > "lightblue"
      */
      toName: function (){ return Chromath.toName(this); },

      /*
         Method: toString
         Display the instance as a string. Defaults to <Chromath.toHexString>
         > > var color = Chromath.rgb(56, 78, 90);
         > > Color.toHexString();
         > "#384E5A"
      */
      toString: function (){ return this.toHexString(); },

      /*
         Method: valueOf
         Display the instance as an integer. Defaults to <Chromath.toInteger>
         > > var yellow = new Chromath('yellow');
         > > yellow.valueOf();
         > 16776960
         > > +yellow
         > 16776960
      */
      valueOf: function (){ return Chromath.toInteger(this); },

    /*
       Method: rgb
       Return the RGB array of the instance
       > > new Chromath('red').rgb();
       > [255, 0, 0]
    */
      rgb: function (){ return this.toRGBArray(); },

      /*
         Method: toRGBArray
         Return the RGB array of the instance
         > > Chromath.burlywood.toRGBArray();
         > [255, 184, 135]
      */
      toRGBArray: function (){ return this.toRGBAArray().slice(0,3); },

      /*
         Method: toRGBObject
         Return the RGB object of the instance
         > > new Chromath('burlywood').toRGBObject();
         > {r: 255, g: 184, b: 135}
      */
      toRGBObject: function ()
      {
          var rgb = this.toRGBArray();

          return {r: rgb[0], g: rgb[1], b: rgb[2]};
      },

      /*
         Method: toRGBString
         Return the RGB string of the instance
         > > new Chromath('aliceblue').toRGBString();
         > "rgb(240,248,255)"
      */
      toRGBString: function ()
      {
          return "rgb("+ this.toRGBArray().join(",") +")";
      },

      /*
         Method: rgba
         Return the RGBA array of the instance
         > > new Chromath('red').rgba();
         > [255, 0, 0, 1]
      */
      rgba: function (){ return this.toRGBAArray(); },

      /*
         Method: toRGBAArray
         Return the RGBA array of the instance
         > > Chromath.lime.toRGBAArray();
         > [0, 255, 0, 1]
      */
      toRGBAArray: function ()
      {
          var rgba = [
              Math.round(this.r*255),
              Math.round(this.g*255),
              Math.round(this.b*255),
              parseFloat(this.a)
          ];

          return rgba;
      },

      /*
         Method: toRGBAObject
         Return the RGBA object of the instance
         > > Chromath.cadetblue.toRGBAObject();
         > {r: 95, g: 158, b: 160}
      */
      toRGBAObject: function ()
      {
          var rgba = this.toRGBAArray();

          return {r: rgba[0], g: rgba[1], b: rgba[2], a: rgba[3]};
      },

      /*
         Method: toRGBAString
         Return the RGBA string of the instance
         > > new Chromath('darkblue').toRGBAString();
         > "rgba(0,0,139,1)"
      */
      toRGBAString: function (){
          return "rgba("+ this.toRGBAArray().join(",") +")";
      },

      /*
         Method: hex
         Return the hex array of the instance
         > new Chromath('darkgreen').hex()
         [ '00', '64', '00' ]
      */
      hex: function (){ return this.toHexArray(); },

      /*
        Method: toHexArray
         Return the hex array of the instance
        > > Chromath.firebrick.toHexArray();
        > ["B2", "22", "22"]
      */
      toHexArray: function (){
          return Chromath.rgb2hex(this.r, this.g, this.b);
      },

      /*
         Method: toHexObject
         Return the hex object of the instance
         > > Chromath.gainsboro.toHexObject();
         > {r: "DC", g: "DC", b: "DC"}
      */
      toHexObject: function ()
      {
          var hex = this.toHexArray();

          return { r: hex[0], g: hex[1], b: hex[2] };
      },

      /*
        Method: toHexString
         Return the hex string of the instance
        > > Chromath.honeydew.toHexString();
        > "#F0FFF0"
      */
      toHexString: function (){
          var hex = this.toHexArray();

          return '#' + hex.join('');
      },

      /*
         Method: hsl
         Return the HSL array of the instance
         > >new Chromath('green').hsl();
         > [120, 1, 0.25098039215686274]
      */
      hsl: function (){ return this.toHSLArray(); },

      /*
         Method: toHSLArray
         Return the HSL array of the instance
         > > new Chromath('red').toHSLArray();
         > [0, 1, 0.5]
      */
      toHSLArray: function (){
          return this.toHSLAArray().slice(0,3);
      },

      /*
         Method: toHSLObject
         Return the HSL object of the instance
         > > new Chromath('red').toHSLObject();
         [h:0, s:1, l:0.5]
      */
      toHSLObject: function ()
      {
          var hsl = this.toHSLArray();

          return {h: hsl[0], s: hsl[1], l: hsl[2]};
      },

      /*
         Method: toHSLString
         Return the HSL string of the instance
         > > new Chromath('red').toHSLString();
         > "hsl(0,1,0.5)"
      */
      toHSLString: function (){
          var hsla = this.toHSLAArray();
          var vals = [
              hsla[0],
              Math.round(hsla[1]*100)+'%',
              Math.round(hsla[2]*100)+'%'
          ];

          return 'hsl('+ vals +')';
      },

      /*
        Method: hsla
        Return the HSLA array of the instance
        > > new Chromath('green').hsla();
        > [120, 1, 0.25098039215686274, 1]
      */
      hsla: function (){ return this.toHSLAArray(); },

      /*
         Method: toHSLArray
         Return the HSLA array of the instance
         > > Chromath.antiquewhite.toHSLAArray();
         > [34, 0.7777777777777773, 0.9117647058823529, 1]
      */
      toHSLAArray: function ()
      {
          return [
              Math.round(this.h),
              parseFloat(this.sl),
              parseFloat(this.l),
              parseFloat(this.a)
          ];
      },

      /*
         Method: toHSLAObject
         Return the HSLA object of the instance
         > > Chromath.antiquewhite.toHSLAArray();
         > {h:34, s:0.7777777777777773, l:0.9117647058823529, a:1}
      */
      toHSLAObject: function ()
      {
          var hsla = this.toHSLAArray();

          return {h: hsla[0], s: hsla[1], l: hsla[2], a: hsla[3]};
      },

      /*
         Method: toHSLAString
         Return the HSLA string of the instance
         > > Chromath.antiquewhite.toHSLAString();
         > "hsla(34,0.7777777777777773,0.9117647058823529,1)"
      */
      toHSLAString: function (){
          var hsla = this.toHSLAArray();
          var vals = [
              hsla[0],
              Math.round(hsla[1]*100)+'%',
              Math.round(hsla[2]*100)+'%',
              Math.round(hsla[3])
          ];

          return 'hsla('+ vals +')';
      },

      /*
         Method: hsv
         Return the HSV array of the instance
         > > new Chromath('blue').hsv();
         > [240, 1, 1]
      */
      hsv: function (){ return this.toHSVArray(); },

      /*
         Method: toHSVArray
         Return the HSV array of the instance
         > > new Chromath('navajowhite').toHSVArray();
         > [36, 0.32156862745098036, 1]
      */
      toHSVArray: function ()
      {
          return this.toHSVAArray().slice(0,3);
      },

      /*
         Method: toHSVObject
         Return the HSV object of the instance
         > > new Chromath('navajowhite').toHSVObject();
         > {h36, s:0.32156862745098036, v:1}
      */
      toHSVObject: function ()
      {
          var hsva = this.toHSVAArray();

          return {h: hsva[0], s: hsva[1], v: hsva[2]};
      },

      /*
         Method: toHSVString
         Return the HSV string of the instance
         > > new Chromath('navajowhite').toHSVString();
         > "hsv(36,32.15686274509804%,100%)"
      */
      toHSVString: function ()
      {
          var hsv = this.toHSVArray();
          var vals = [
              hsv[0],
              Math.round(hsv[1]*100)+'%',
              Math.round(hsv[2]*100)+'%'
          ];

          return 'hsv('+ vals +')';
      },

      /*
         Method: hsva
         Return the HSVA array of the instance
         > > new Chromath('blue').hsva();
         > [240, 1, 1, 1]
      */
      hsva: function (){ return this.toHSVAArray(); },

      /*
         Method: toHSVAArray
         Return the HSVA array of the instance
         > > new Chromath('olive').toHSVAArray();
         > [60, 1, 0.5019607843137255, 1]
      */
      toHSVAArray: function (){
          return [
              Math.round(this.h),
              parseFloat(this.sv),
              parseFloat(this.v),
              parseFloat(this.a)
          ];
      },

      /*
         Method: toHSVAObject
         Return the HSVA object of the instance
         > > new Chromath('olive').toHSVAArray();
         > {h:60, s: 1, v:0.5019607843137255, a:1}
      */
      toHSVAObject: function (){
          var hsva = this.toHSVAArray();

          return {h: hsva[0], s: hsva[1], l: hsva[2], a: hsva[3]};
      },

      /*
         Method: toHSVAString
         Return the HSVA string of the instance
         > > new Chromath('olive').toHSVAString();
         > "hsva(60,100%,50.19607843137255%,1)"
      */
      toHSVAString: function ()
      {
          var hsva = this.toHSVAArray();
          var vals = [
              hsva[0],
              Math.round(hsva[1]*100)+'%',
              Math.round(hsva[2]*100)+'%',
              hsva[3]
          ];

          return 'hsva('+ vals +')';
      },

      /*
         Method: hsb
         Alias for <hsv>
      */
      hsb: function (){ return this.hsv(); },

      /*
         Method: toHSBArray
         Alias for <toHSBArray>
      */
      toHSBArray: function ()
      {
          return this.toHSVArray();
      },

      /*
         Method: toHSBObject
         Alias for <toHSVObject>
      */
      toHSBObject: function ()
      {
          return this.toHSVObject();
      },

      /*
         Method: toHSBString
         Alias for <toHSVString>
      */
      toHSBString: function ()
      {
          return this.toHSVString();
      },

      /*
         Method: hsba
         Alias for <hsva>
      */
      hsba: function (){ return this.hsva(); },

      /*
         Method: toHSBAArray
         Alias for <toHSVAArray>
      */
      toHSBAArray: function (){
          return this.toHSVAArray();
      },

      /*
         Method: toHSBAObject
         Alias for <toHSVAObject>
      */
      toHSBAObject: function (){
          return this.toHSVAObject();
      },

      /*
         Method: toHSBAString
         Alias for <toHSVAString>
      */
      toHSBAString: function ()
      {
          return this.toHSVAString();
      },

      //Group: Instance methods - color scheme
      /*
         Method: complement
         Calls <Chromath.complement> with the current instance as the first parameter

         > > Chromath.red.complement().rgb();
         > [0, 255, 255]
      */
      complement: function (){
          return Chromath.complement(this);
      },

      /*
         Method: triad
         Calls <Chromath.triad> with the current instance as the first parameter

         > > new Chromath('hsl(0, 100%, 50%)').triad().toString();
         > "#FF0000,#00FF00,#0000FF"
      */
      triad: function (){
          return Chromath.triad(this);
      },

      /*
         Method: tetrad
         Calls <Chromath.tetrad> with the current instance as the first parameter

         > > Chromath.hsb(240, 1, 1).triad();
         > [Chromath, Chromath, Chromath]
      */
      tetrad: function (){
          return Chromath.tetrad(this);
      },

      /*
         Method: analogous
         Calls <Chromath.analogous> with the current instance as the first parameter

         > > Chromath.hsb(120, 1, 1).analogous();
         > [Chromath, Chromath, Chromath, Chromath, Chromath, Chromath, Chromath, Chromath]

         > > Chromath.hsb(180, 1, 1).analogous(5).toString();
         > "#00FFFF,#00FFB2,#00FFE5,#00E5FF,#00B2FF"

         > > Chromath.hsb(180, 1, 1).analogous(5, 10).toString();
         > "#00FFFF,#00FF19,#00FFB2,#00B2FF,#0019FF"
      */
      analogous: function (results, slices){
          return Chromath.analogous(this, results, slices);
      },

      /*
        Method: monochromatic
         Calls <Chromath.monochromatic> with the current instance as the first parameter

        > > Chromath.blue.monochromatic().toString();
        > "#000033,#000066,#000099,#0000CC,#0000FF"
      */
      monochromatic: function (results){
          return Chromath.monochromatic(this, results);
      },

      /*
         Method: splitcomplement
         Calls <Chromath.splitcomplement> with the current instance as the first parameter

         > > Chromath.blue.splitcomplement().toString();
         > "#0000FF,#FFCC00,#FF5100"
      */
      splitcomplement: function (){
          return Chromath.splitcomplement(this);
      },

      // Group: Instance methods - color alteration
      /*
         Method: tint
         Calls <Chromath.tint> with the current instance as the first parameter

         > > new Chromath('yellow').tint(0.25).toString();
         > "#FFFF3F"
      */
      tint: function (by) {
          return Chromath.tint(this, by);
      },

      /*
         Method: lighten
         Alias for <tint>
      */
      lighten: function (by) {
        return this.tint(by);
      },

      /*
        Method: shade
         Calls <Chromath.shade> with the current instance as the first parameter

        > > new Chromath('yellow').shade(0.25).toString();
        > "#BFBF00"
      */
      shade: function (by) {
          return Chromath.shade(this, by);
      },

      /*
         Method: darken
         Alias for <shade>
      */
      darken: function (by) {
        return this.shade(by);
      },

      /*
         Method: desaturate
         Calls <Chromath.desaturate> with the current instance as the first parameter

       > > new Chromath('orange').desaturate().toString();
       > "#ADADAD"

       > > new Chromath('orange').desaturate(1).toString();
       > "#5B5B5B"

       > > new Chromath('orange').desaturate(2).toString();
       > "#B4B4B4"
       */
      desaturate: function (formula){
          return Chromath.desaturate(this, formula);
      },

      /*
        Method: greyscale
        Alias for <desaturate>
      */
      greyscale: function (formula) {
        return this.desaturate(formula);
      },

      /*
         Method: websafe
         Calls <Chromath.websafe> with the current instance as the first parameter

         > > Chromath.rgb(123, 234, 56).toString();
         > "#7BEA38"

         > Chromath.rgb(123, 234, 56).websafe().toString();
         > "#66FF33"
       */
      websafe: function (){
          return Chromath.websafe(this);
      },

      // Group: Instance methods - color combination
      /*
         Method: additive
         Calls <Chromath.additive> with the current instance as the first parameter

         > > new Chromath('red').additive('#00FF00', 'blue').toString();
         > "#FFFFFF"
      */
      additive: function (){
          var arr = Array.prototype.slice.call(arguments);
          return Chromath.additive.apply(Chromath, [this].concat(arr));
      },

      /*
         Method: subtractive
         Calls <Chromath.subtractive> with the current instance as the first parameter

         > > new Chromath('cyan').subtractive('magenta', 'yellow').toString();
         > "#000000"
      */
      subtractive: function (){
          var arr = Array.prototype.slice.call(arguments);
          return Chromath.subtractive.apply(Chromath, [this].concat(arr));
      },

      /*
         Method: multiply
         Calls <Chromath.multiply> with the current instance as the first parameter

         > > Chromath.lightcyan.multiply(Chromath.brown).toString();
         > "#902A2A"
      */
      multiply: function (){
          var arr = Array.prototype.slice.call(arguments);
          return Chromath.multiply.apply(Chromath, [this].concat(arr));
      },

      /*
         Method: average
         Calls <Chromath.average> with the current instance as the first parameter

         > > Chromath.black.average('white').rgb();
         > [127, 127, 127]
      */
      average: function (){
          var arr = Array.prototype.slice.call(arguments);
          return Chromath.average.apply(Chromath, [this].concat(arr));
      },

      /*
         Method: overlay
         Calls <Chromath.overlay> with the current instance as the first parameter

       > > Chromath.red.overlay('green', 0.4).toString();
       > "#993300"

       > > Chromath.red.overlay('green', 1).toString();
       > "#008000"

       > > Chromath.red.overlay('green', 0).toString();
       > "#FF0000"
       */
      overlay: function (bottom, transparency){
          return Chromath.overlay(this, bottom, transparency);
      },

      // Group: Instance methods - other
      /*
         Method: clone
         Return an independent copy of the instance
      */
      clone: function (){
          return new Chromath(this);
      },

      /*
         Method: towards
         Calls <Chromath.towards> with the current instance as the first parameter

         > > var red = new Chromath('red');
         > > red.towards('yellow', 0.55).toString();
         > "#FF8C00"
      */
      towards: function (to, by) {
          return Chromath.towards(this, to, by);
      },

      /*
         Method: gradient
         Calls <Chromath.gradient> with the current instance as the first parameter

         > > new Chromath('#F00').gradient('#00F').toString()
         > "#FF0000,#F1000D,#E4001A,#D60028,#C90035,#BB0043,#AE0050,#A1005D,#93006B,#860078,#780086,#6B0093,#5D00A1,#5000AE,#4300BB,#3500C9,#2800D6,#1A00E4,#0D00F1,#0000FF"

         > > new Chromath('#F00').gradient('#00F', 5).toString()
         > "#FF0000,#BF003F,#7F007F,#3F00BF,#0000FF"

         > > new Chromath('#F00').gradient('#00F', 5, 3).toString()
         > "#3F00BF"
      */
      gradient: function (to, slices, slice){
          return Chromath.gradient(this, to, slices, slice);
      }
  };
};

},{}],14:[function(require,module,exports){
var util = {};

util.clamp = function ( val, min, max ) {
    if (val > max) return max;
    if (val < min) return min;
    return val;
};

util.merge = function () {
    var dest = arguments[0], i=1, source, prop;
    while (source = arguments[i++])
        for (prop in source) dest[prop] = source[prop];

    return dest;
};

util.isArray = function ( test ) {
    return Object.prototype.toString.call(test) === '[object Array]';
};

util.isString = function ( test ) {
    return Object.prototype.toString.call(test) === '[object String]';
};

util.isNumber = function ( test ) {
    return Object.prototype.toString.call(test) === '[object Number]';
};

util.isObject = function ( test ) {
    return Object.prototype.toString.call(test) === '[object Object]';
};

util.lpad = function ( val, len, pad ) {
    val = val.toString();
    if (!len) len = 2;
    if (!pad) pad = '0';

    while (val.length < len) val = pad+val;

    return val;
};

util.lerp = function (from, to, by) {
    return from + (to-from) * by;
};

util.times = function (n, fn, context) {
    for (var i = 0, results = []; i < n; i++) {
        results[i] = fn.call(context, i);
    }
    return results;
};

util.rgb = {
    fromArgs: function (r, g, b, a) {
        var rgb = arguments[0];

        if (util.isArray(rgb)){ r=rgb[0]; g=rgb[1]; b=rgb[2]; a=rgb[3]; }
        if (util.isObject(rgb)){ r=rgb.r; g=rgb.g; b=rgb.b; a=rgb.a;  }

        return [r, g, b, a];
    },
    scaled01: function (r, g, b) {
        if (!isFinite(arguments[1])){
            var rgb = util.rgb.fromArgs(r, g, b);
            r = rgb[0], g = rgb[1], b = rgb[2];
        }

        if (r > 1) r /= 255;
        if (g > 1) g /= 255;
        if (b > 1) b /= 255;

        return [r, g, b];
    },
    pctWithSymbol: function (r, g, b) {
        var rgb = this.scaled01(r, g, b);

        return rgb.map(function (v) {
            return Math.round(v * 255) + '%';
        });
    }
};

util.hsl = {
    fromArgs: function (h, s, l, a) {
        var hsl = arguments[0];

        if (util.isArray(hsl)){ h=hsl[0]; s=hsl[1]; l=hsl[2]; a=hsl[3]; }
        if (util.isObject(hsl)){ h=hsl.h; s=hsl.s; l=(hsl.l || hsl.v); a=hsl.a; }

        return [h, s, l, a];
    },
    scaled: function (h, s, l) {
        if (!isFinite(arguments[1])){
            var hsl = util.hsl.fromArgs(h, s, l);
            h = hsl[0], s = hsl[1], l = hsl[2];
        }

        h = (((h % 360) + 360) % 360);
        if (s > 1) s /= 100;
        if (l > 1) l /= 100;

        return [h, s, l];
    }
};

module.exports = util;

},{}],15:[function(require,module,exports){
(function (global){
(function(a,b){if("function"==typeof define&&define.amd)define([],b);else if("undefined"!=typeof exports)b();else{b(),a.FileSaver={exports:{}}.exports}})(this,function(){"use strict";function b(a,b){return"undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Depricated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(b,c,d){var e=new XMLHttpRequest;e.open("GET",b),e.responseType="blob",e.onload=function(){a(e.response,c,d)},e.onerror=function(){console.error("could not download file")},e.send()}function d(a){var b=new XMLHttpRequest;return b.open("HEAD",a,!1),b.send(),200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b)}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof global&&global.global===global?global:void 0,a=f.saveAs||"object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href)},4E4),setTimeout(function(){e(j)},0))}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else{var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i)})}}:function(a,b,d,e){if(e=e||open("","_blank"),e&&(e.document.title=e.document.body.innerText="downloading..."),"string"==typeof a)return c(a,b,d);var g="application/octet-stream"===a.type,h=/constructor/i.test(f.HTMLElement)||f.safari,i=/CriOS\/[\d]+/.test(navigator.userAgent);if((i||g&&h)&&"object"==typeof FileReader){var j=new FileReader;j.onloadend=function(){var a=j.result;a=i?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),e?e.location.href=a:location=a,e=null},j.readAsDataURL(a)}else{var k=f.URL||f.webkitURL,l=k.createObjectURL(a);e?e.location=l:location.href=l,e=null,setTimeout(function(){k.revokeObjectURL(l)},4E4)}};f.saveAs=a.saveAs=a,"undefined"!=typeof module&&(module.exports=a)});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],16:[function(require,module,exports){
"use strict";

//Craft object.protype
(function(){
	if( typeof(Object.addConstProp) == "function"){
		return;
	}
	
	
	function constProp(name_prop, value, vis){
		if(vis === undefined) vis = true;
		if(typeof value === "object") Object.freeze(value);
		Object.defineProperty(this, name_prop, {
				value: value,
				enumerable: vis
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
	
	constProp.call(Object.prototype, 'addConstProp', constProp, false);
	Object.prototype.addConstProp('addGetSet', getSet, false);
	
	
	if(typeof(Object.prototype.toSource) !== "function"){
		Object.defineProperty(Object.prototype, 'toSource',{
			value: function(){
					var str = '{';
					for(var key in this){
						str += ' ' + key + ': ' + this[key] + ',';
					}
					if(str.length > 2) str = str.slice(0, -1) + ' ';
					return str + '}';
				},
			enumerable: false
		});
	}
	
	
	if(typeof(Object.values) !== "function"){
		var val_Obj = function(obj){
			var vals = [];
			
			for (var key in obj) {
				vals.push(obj[key]);
			}
			
			return vals;
		};
		
		 Object.addConstProp('values', val_Obj.bind(Object));
	}
	
	function randIndex(){
		var rand = Math.round((this.length - 1) * Math.random());
		return this[rand];
	}
	Array.prototype.addConstProp('rand_i', randIndex);
	
	
	function createArr(val, length, is_call){
		var arr = [];
		
		if(!length) length = 1;
		if(is_call === undefined) is_call = true;
		
		if(typeof val == 'function' && is_call){
			for(var i = 0; i < length; i++){
				arr.push(val(i, arr));
			}
		}else{
			
			for(var i = 0; i < length; i++){
				arr.push(val);
			}
		}
		
		return arr;
	}
	
	Array.prototype.addConstProp('add', function(val){
		if(!this._nulls) this._nulls = [];
		
		if(this._nulls.length){
			var ind = this._nulls.pop();
			this[ind] = val;
			return ind;
		}else{
			return this.push(val) - 1;
		}
	});
	
	Array.prototype.addConstProp('dell', function(ind){
		if(ind > this.length -1) return false;
		
		if(ind == this.length -1){
			this.pop();
		}else{
			if(!this._nulls) this._nulls = [];
			
			this[ind] = undefined;
			this._nulls.push(ind);
		}
		
		return true;	
	});
	
	Array.addConstProp('create', createArr);
	
	
	if(RegExp.prototype.toJSON !== "function"){
		RegExp.prototype.toJSON = function(){ return this.source; };
	}

})();





},{}],17:[function(require,module,exports){
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

	function randChars(chars_arr, size){
		size = T.int(size, 1).rand();
		var str = '';
		while(size){
			var der = chars_arr.rand_i();
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

},{}],18:[function(require,module,exports){
'use strict';
new (function(){
	if(typeof(Object.addConstProp) !== "function"){
		if(typeof module == "object"){
			require("./mof.js");
		}else throw new Error("Требуеться библиотека mof.js");
	}

	if(typeof(Object.types) == "object"){
		return Object.types;
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
				var new_creator = new CreateCreator(New);
				for(var key in tmp_obj){
					new_creator.addConstProp(key, tmp_obj[key]);
				}
				return new_creator;
			};
		}else creator = function(){return creator};

		creator.addConstProp('is_creator', true);
		if(typeof test === "function") creator.addConstProp('test', test);
		if(typeof rand === "function") creator.addConstProp('rand', rand);
		if(typeof doc === "function") creator.addConstProp('doc', doc);

		return creator;
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
		function randAny(arr){
			return function(){
				return arr.rand_i().rand();
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

},{"./mof.js":16}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDb250cm9sLmpzIiwiRHJhdy5qcyIsIkV2ZW50cy5qcyIsIkxvZ2ljLmpzIiwiVHlwZXMuanMiLCJicm9tYWluLmpzIiwibmV3X3RpbGVzZXQuanNvbiIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9zcmMvY2hyb21hdGguanMiLCJub2RlX21vZHVsZXMvY2hyb21hdGgvc3JjL2NvbG9ybmFtZXNfY3NzMi5qcyIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9zcmMvY29sb3JuYW1lc19jc3MzLmpzIiwibm9kZV9tb2R1bGVzL2Nocm9tYXRoL3NyYy9wYXJzZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Nocm9tYXRoL3NyYy9wcm90b3R5cGUuanMiLCJub2RlX21vZHVsZXMvY2hyb21hdGgvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZmlsZS1zYXZlci9kaXN0L0ZpbGVTYXZlci5taW4uanMiLCJub2RlX21vZHVsZXMvdHlwZXNqcy9tb2YuanMiLCJub2RlX21vZHVsZXMvdHlwZXNqcy9zdHJfdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc2pzL3R5cGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDam5DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbHJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNHQTtBQUNBO0FBQ0E7Ozs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgSGVhciA9IHJlcXVpcmUoXCIuL0V2ZW50cy5qc1wiKTtcclxuXHJcbmZ1bmN0aW9uIENyQ29udHJvbGxlcihMb2dpYywgRHJhdyl7XHJcblx0XHJcblx0SGVhcihcInN3aXRjaF9hZGRcIiwgXCJjbGlja1wiLCBEcmF3LnN3aXRjaEVsZW0oXCJhZGRcIiwgXCJpbnZpc1wiKSk7XHJcblxyXG5cdEhlYXIoXCJUaWxlc1wiLCBcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldmVudCl7XHJcblx0XHRpZihldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKFwidGlsZVwiKSAhPT0gbnVsbCkgTG9naWMuc2V0VGlsZShldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKFwidGlsZVwiKSk7XHJcblx0fSk7XHJcblx0SGVhcihcIlRpbGVzXCIsIFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcdGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gJ21vdmUnO1xyXG5cdH0pO1xyXG5cdFxyXG5cdEhlYXIoXCJhZGRcIiwgXCJzdWJtaXRcIiwgZnVuY3Rpb24oKXtcclxuXHRcdHZhciB0aWxlID0ge1xyXG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUudmFsdWVcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdGlmKHRoaXMuaW1nLmZpbGVzWzBdKXtcclxuXHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKXtcclxuXHRcdFx0XHR2YXIgaW1nID0gZS50YXJnZXQucmVzdWx0O1xyXG5cdFx0XHRcdHRpbGUuaW1nID0gaW1nO1xyXG5cdFx0XHRcdExvZ2ljLmFkZCh0aWxlKTtcclxuXHRcdFx0fTtcclxuXHRcdFx0XHJcblx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoaXMuaW1nLmZpbGVzWzBdKTtcclxuXHRcdFx0dGhpcy5yZXNldCgpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0fSk7XHJcblx0SGVhcihcImRlbGxcIiwgXCJjbGlja1wiLCBMb2dpYy5kZWxsLmJpbmQoTG9naWMpKTtcclxuXHRcclxuXHRIZWFyKFwic2F2ZVwiLCBcImNsaWNrXCIsIExvZ2ljLnNhdmUuYmluZChMb2dpYykpO1xyXG5cdEhlYXIoXCJvcGVuXCIsIFwiY2hhbmdlXCIsIERyYXcub3BlbkpTT04oTG9naWMubG9hZC5iaW5kKExvZ2ljKSkpO1xyXG5cdFxyXG5cdEhlYXIoXCJWaWV3XCIsIFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0aWYoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwidGlsZVwiKSAhPT0gbnVsbCkgRHJhdy5WaWV3LmN1cnJlbnRfdGlsZSA9IGUudGFyZ2V0O1xyXG5cdH0pO1xyXG5cdEhlYXIoXCJWaWV3XCIsIFwibW91c2V1cFwiLCBmdW5jdGlvbihlKXtcclxuXHRcdERyYXcuVmlldy5ub3JtKCk7XHJcblx0XHREcmF3LlZpZXcuY3VycmVudF90aWxlID0gbnVsbDtcclxuXHR9KTtcclxuXHRIZWFyKFwiVmlld1wiLCBbXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiXSwgZnVuY3Rpb24oZSl7XHJcblx0XHRpZihlLnRhcmdldCAhPT0gZS5jdXJybmV0VGFyZ2V0KSByZXR1cm47XHJcblx0XHREcmF3LlZpZXcubm9ybSgpO1xyXG5cdFx0RHJhdy5WaWV3LmN1cnJlbnRfdGlsZSA9IG51bGw7XHJcblx0fSk7XHJcblx0SGVhcihcIlZpZXdcIiwgXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRpZihEcmF3LlZpZXcuY3VycmVudF90aWxlKSBEcmF3LlZpZXcubW92ZShlLm1vdmVtZW50WCwgZS5tb3ZlbWVudFkpO1xyXG5cdH0pO1xyXG5cdEhlYXIoXCJWaWV3XCIsIFwiZHJhZ2VudGVyXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdH0pO1xyXG5cdEhlYXIoXCJWaWV3XCIsIFwiZHJhZ292ZXJcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0fSk7XHJcblx0SGVhcihcIlZpZXdcIiwgXCJkcm9wXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdHZhciBib3ggPSBlLmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHR2YXIgeCA9IGUuY2xpZW50WCAtIGJveC5sZWZ0O1xyXG5cdFx0dmFyIHkgPSBlLmNsaWVudFkgLSBib3gudG9wO1xyXG5cdFx0XHJcblx0XHRpZihMb2dpYy5nZXRUaWxlKCkpIERyYXcuVmlldy5hZGQoTG9naWMuZ2V0VGlsZSgpLCB4LCB5KTtcclxuXHR9KTtcclxuXHRcclxuXHRIZWFyKFwiV2lkdGhcIiwgXCJjaGFuZ2VcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRMb2dpYy5yZXNpemVUaWxlKHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKSk7XHJcblx0fSk7XHJcblx0SGVhcihcIkhlaWdodFwiLCBcImNoYW5nZVwiLCBmdW5jdGlvbihlKXtcclxuXHRcdExvZ2ljLnJlc2l6ZVRpbGUobnVsbCwgcGFyc2VJbnQoZS50YXJnZXQudmFsdWUpKTtcclxuXHR9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDckNvbnRyb2xsZXI7XHJcbiIsInJlcXVpcmUoXCJ0eXBlc2pzXCIpO1xyXG5jb25zdCBSR0IgPSByZXF1aXJlKCdjaHJvbWF0aCcpLnJnYjtcclxudmFyIEZpbGVTYXZlciA9IHJlcXVpcmUoJ2ZpbGUtc2F2ZXInKTtcclxuXHJcbnZhciBpZF90aWxlc19saXN0ID0gXCJUaWxlc1wiO1xyXG52YXIgaWRfdmlldyA9IFwiVmlld1wiO1xyXG5cclxuZnVuY3Rpb24gQ3JUaWxlcyhpZCl7XHJcblx0dmFyIGNvbnRhaW5lciA9IGdldE5vZGUoaWQpO1xyXG5cdHZhciBjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdFxyXG5cdHRoaXMuYWRkR2V0U2V0KFwiY3VycmVudF90aWxlXCIsIFxyXG5cdFx0ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGN1cnJlbnRfdGlsZS50aWxlO1xyXG5cdFx0fSwgXHJcblx0XHRmdW5jdGlvbihuZXdfdGlsZSl7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgdGlsZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbdGlsZT1cIicgKyBuZXdfdGlsZS5pZCArICdcIl0nKTtcclxuXHRcdFx0aWYoIXRpbGUpIHRocm93IG5ldyBFcnJvcihcIlRpbGUgaXMgbm90IGZpbmQhXCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYoY3VycmVudF90aWxlKSBjdXJyZW50X3RpbGUuY2xhc3NMaXN0LnJlbW92ZShcImNoYW5nZWRcIik7XHJcblx0XHRcdHRpbGUuY2xhc3NMaXN0LmFkZChcImNoYW5nZWRcIik7XHJcblx0XHRcdGN1cnJlbnRfdGlsZSA9IHRpbGU7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihuZXdfdGlsZS53aWR0aCkgZ2V0Tm9kZShcIldpZHRoXCIpLnZhbHVlID0gbmV3X3RpbGUud2lkdGg7IFxyXG5cdFx0XHRlbHNlIGdldE5vZGUoXCJXaWR0aFwiKS52YWx1ZSA9IG51bGw7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihuZXdfdGlsZS5oZWlnaHQpIGdldE5vZGUoXCJIZWlnaHRcIikudmFsdWUgPSBuZXdfdGlsZS5oZWlnaHQ7XHJcblx0XHRcdGVsc2UgZ2V0Tm9kZShcIkhlaWdodFwiKS52YWx1ZSA9IG51bGw7XHJcblx0XHR9XHJcblx0KTtcclxuXHRcclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKG5ld190aWxlKXtcclxuXHRcdHZhciBUaWxlID0gZHJhd1RpbGUobmV3X3RpbGUpO1xyXG5cdFx0XHJcblx0XHRpZihjdXJyZW50X3RpbGUpIGN1cnJlbnRfdGlsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVCZWdpblwiLCBUaWxlKTtcclxuXHRcdGVsc2UgY29udGFpbmVyLmFwcGVuZENoaWxkKFRpbGUpO1xyXG5cdH1cclxuXHRcclxuXHR0aGlzLmRlbGwgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y3VycmVudF90aWxlLmNsYXNzTGlzdC5yZW1vdmUoXCJjaGFuZ2VkXCIpO1xyXG5cdFx0Y3VycmVudF90aWxlLnJlbW92ZSgpO1xyXG5cdFx0Y3VycmVudF90aWxlID0gbnVsbDtcclxuXHR9XHJcblxyXG5cdHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XHJcblx0XHRjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ3JWaWV3KGlkKXtcclxuXHR2YXIgY29udGFpbmVyID0gZ2V0Tm9kZShpZCk7XHJcblx0dmFyIHNpemUgPSAyMDtcclxuXHR0aGlzLmN1cnJlbnRfdGlsZSA9IG51bGw7XHJcblx0XHJcblx0ZHJhd0dyaWQoY29udGFpbmVyLCBzaXplKTtcclxuXHRcclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKG5ld190aWxlLCB4LCB5KXtcclxuXHRcdHRpbGUgPSBkcmF3VGlsZShuZXdfdGlsZSk7XHJcblx0XHR0aWxlLnN0eWxlLndpZHRoID0gKG5ld190aWxlLndpZHRoICogKDEwMCAvIHNpemUpKSArIFwiJVwiO1xyXG5cdFx0dGlsZS5zdHlsZS5oZWlnaHQgPSAobmV3X3RpbGUuaGVpZ2h0ICogKDEwMCAvIHNpemUpKSArIFwiJVwiO1xyXG5cdFx0XHJcblx0XHR0aWxlLnN0eWxlLmxlZnQgPSB4ICArIFwicHhcIjtcclxuXHRcdHRpbGUuc3R5bGUudG9wID0geSArIFwicHhcIjtcclxuXHRcdFxyXG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHRpbGUpO1xyXG5cdFx0Tm9ybVRpbGUodGlsZSk7XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMuZGVsbCA9IGZ1bmN0aW9uKGlkX3RpbGUpe1xyXG5cdFx0dmFyIHRpbGVzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0aWxlPVwiJyArIGlkX3RpbGUgKyAnXCJdJyk7XHJcblx0XHR0aWxlcy5mb3JFYWNoKHRpbGUgPT4gdGlsZS5yZW1vdmUoKSk7XHJcblx0fVxyXG5cdHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIHRpbGVzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0aWxlXScpO1xyXG5cdFx0dGlsZXMuZm9yRWFjaCh0aWxlID0+IHRpbGUucmVtb3ZlKCkpO1xyXG5cdH1cclxuXHRcclxuXHR0aGlzLnJlc2l6ZSA9IGZ1bmN0aW9uKHRpbGUpe1xyXG5cdFx0dmFyIGVsZW1zID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0aWxlPVwiJyArIHRpbGUuaWQgKyAnXCJdJyk7XHJcblx0XHRlbGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW0pe1xyXG5cdFx0XHRlbGVtLnN0eWxlLndpZHRoID0gKHRpbGUud2lkdGggKiAoMTAwIC8gc2l6ZSkpICsgXCIlXCI7XHJcblx0XHRcdGVsZW0uc3R5bGUuaGVpZ2h0ID0gKHRpbGUuaGVpZ2h0ICogKDEwMCAvIHNpemUpKSArIFwiJVwiO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMubW92ZSA9IGZ1bmN0aW9uKHgsIHkpe1xyXG5cdFx0aWYodGhpcy5jdXJyZW50X3RpbGUpe1xyXG5cdFx0XHR2YXIgdGlsZSA9IGdldENvbXB1dGVkU3R5bGUodGhpcy5jdXJyZW50X3RpbGUpO1xyXG5cdFx0XHRcclxuXHRcdFx0dGhpcy5jdXJyZW50X3RpbGUuc3R5bGUubGVmdCA9IChwYXJzZUZsb2F0KHRpbGUubGVmdCkgKyB4KSArIFwicHhcIjtcclxuXHRcdFx0dGhpcy5jdXJyZW50X3RpbGUuc3R5bGUudG9wID0gKHBhcnNlRmxvYXQodGlsZS50b3ApICsgeSkgKyBcInB4XCI7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMubm9ybSA9IGZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzLmN1cnJlbnRfdGlsZSkgTm9ybVRpbGUodGhpcy5jdXJyZW50X3RpbGUpO1xyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBOb3JtVGlsZSh0aWxlKXtcclxuXHRcdHZhciBib3ggPSBnZXRDb21wdXRlZFN0eWxlKHRpbGUpO1xyXG5cdFx0dGlsZS5zdHlsZS5sZWZ0ID0gTm9ybUNvb3JkKHBhcnNlRmxvYXQoYm94LmxlZnQpLCBwYXJzZUZsb2F0KGJveC53aWR0aCkpICsgXCIlXCI7XHJcblx0XHR0aWxlLnN0eWxlLnRvcCA9IE5vcm1Db29yZChwYXJzZUZsb2F0KGJveC50b3ApLCBwYXJzZUZsb2F0KGJveC5oZWlnaHQpKSArIFwiJVwiO1xyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBOb3JtQ29vcmQoY29vcmQsIHMpe1xyXG5cdFx0dmFyIGNvbl9zaXplID0gcGFyc2VGbG9hdChnZXRDb21wdXRlZFN0eWxlKGNvbnRhaW5lcikud2lkdGgpO1xyXG5cdFx0XHJcblx0XHRpZihjb29yZCArIHMgPiBjb25fc2l6ZSkgY29vcmQgPSBjb25fc2l6ZSAtIHM7XHJcblx0XHRpZihjb29yZCA8IDApIGNvb3JkID0gMDtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIE1hdGgucm91bmQoKGNvb3JkIC8gY29uX3NpemUpICogc2l6ZSkgKiAoMTAwIC8gc2l6ZSk7XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIGRyYXdHcmlkKGNvbnRhaW5lciwgZ3JpZF9zaXplKXtcclxuXHRcdHZhciBzaXplID0gMTAwIC8gZ3JpZF9zaXplO1xyXG5cdFx0Zm9yKHZhciBpID0gZ3JpZF9zaXplIC0gMTsgaSA+PSAwOyBpLS0pe1xyXG5cdFx0XHRmb3IodmFyIGogPSBncmlkX3NpemUgLSAxOyBqID49IDA7IGotLSl7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGRhcndCb3goaSpzaXplLCBqKnNpemUsIHNpemUpKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBkYXJ3Qm94KHgsIHksIHNpemUpe1xyXG5cdFx0dmFyIGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0Ym94LmNsYXNzTGlzdC5hZGQoXCJib3hcIik7XHJcblx0XHRib3guc3R5bGUud2lkdGggPSBzaXplICsgXCIlXCI7XHJcblx0XHRib3guc3R5bGUuaGVpZ2h0ID0gc2l6ZSArIFwiJVwiO1xyXG5cdFx0XHJcblx0XHRib3guc3R5bGUubGVmdCA9IHggKyBcIiVcIjtcclxuXHRcdGJveC5zdHlsZS50b3AgPSB5ICsgXCIlXCI7XHJcblx0XHRcclxuXHRcdHJldHVybiBib3g7XHJcblx0fVxyXG5cdFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRUaWxlczogbmV3IENyVGlsZXMoaWRfdGlsZXNfbGlzdCksXHJcblx0VmlldzogbmV3IENyVmlldyhpZF92aWV3KSxcclxuXHRzYXZlOiBTYXZlLFxyXG5cdG9wZW5KU09OOiBPcGVuRmlsZUpTT04sXHJcblx0c3dpdGNoRWxlbTogQ3JTd2l0Y2hcclxufVxyXG5cclxuZnVuY3Rpb24gT3BlbkZpbGVKU09OKE9wZW4pe1xyXG5cdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcy5maWxlc1swXSl7XHJcblx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSl7T3BlbihKU09OLnBhcnNlKGUudGFyZ2V0LnJlc3VsdCkpfTtcclxuXHRcdFx0cmVhZGVyLnJlYWRBc1RleHQodGhpcy5maWxlc1swXSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBTYXZlKG5hbWUsIHRleHQpe1xyXG5cdHZhciBibG9iID0gbmV3IEJsb2IoW3RleHRdLCB7dHlwZTogXCJ0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLThcIn0pO1xyXG5cdEZpbGVTYXZlci5zYXZlQXMoYmxvYiwgbmFtZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENyU3dpdGNoKGlkLCBuYW1lX2NsYXNzKXtcclxuXHR2YXIgZWxlbSA9IGdldE5vZGUoaWQpLmNsYXNzTGlzdDtcclxuXHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdGVsZW0udG9nZ2xlKG5hbWVfY2xhc3MpO1xyXG5cdH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGRyYXdUaWxlKG5ld190aWxlKXtcclxuXHRcclxuXHRpZihuZXdfdGlsZS50eXBlID09IFwiY29sb3JcIil7XHJcblx0XHR2YXIgVGlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0VGlsZS5jbGFzc0xpc3QuYWRkKFwidGlsZVwiKTtcclxuXHRcdFRpbGUuc2V0QXR0cmlidXRlKFwidGlsZVwiLCBuZXdfdGlsZS5pZCk7XHJcblx0XHRUaWxlLnNldEF0dHJpYnV0ZShcImRyYWdnYWJsZVwiLCB0cnVlKTtcclxuXHRcdFRpbGUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbmV3IFJHQihuZXdfdGlsZS5jb2xvcikudG9TdHJpbmcoKTtcclxuXHRcdHJldHVybiBUaWxlO1xyXG5cdH1cclxuXHRpZihuZXdfdGlsZS50eXBlID09IFwic3ZnXCIpe1xyXG5cdFx0dmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG5cdFx0aW1nLmNsYXNzTGlzdC5hZGQoXCJ0aWxlXCIpO1xyXG5cdFx0aW1nLnNldEF0dHJpYnV0ZShcInRpbGVcIiwgbmV3X3RpbGUuaWQpO1xyXG5cdFx0aW1nLnNldEF0dHJpYnV0ZShcImRyYWdnYWJsZVwiLCB0cnVlKTtcclxuXHRcdGltZy5zcmMgPSBuZXdfdGlsZS5pbWc7XHJcblx0XHRyZXR1cm4gaW1nO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XHJcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xyXG5cdHJldHVybiBlbGVtO1xyXG59XHJcbiIsIlxyXG5mdW5jdGlvbiBJZEV2ZW50KGlkLCBuYW1lX2V2ZW50LCBmdW5jKXtcclxuXHRcclxuXHRpZihuYW1lX2V2ZW50ID09IFwic3VibWl0XCIpe1xyXG5cdFx0dmFyIG9sZF9mdW5jID0gZnVuYztcclxuXHRcdGZ1bmMgPSBmdW5jdGlvbihlKXtcclxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRvbGRfZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0fSBcclxuXHR9XHJcblx0XHJcblx0aWYoQXJyYXkuaXNBcnJheShuYW1lX2V2ZW50KSl7XHJcblx0XHRuYW1lX2V2ZW50LmZvckVhY2gobmFtZSA9PiBnZXROb2RlKGlkKS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZ1bmMpKTtcclxuXHR9XHJcblx0ZWxzZSBnZXROb2RlKGlkKS5hZGRFdmVudExpc3RlbmVyKG5hbWVfZXZlbnQsIGZ1bmMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTdWJtaXQoZnVuYyl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKGV2ZW50KXtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXROb2RlKGlkKXtcclxuXHR2YXIgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuXHRpZighZWxlbSkgdGhyb3cgbmV3IEVycm9yKFwiRWxlbSBpcyBub3QgZmluZCFcIik7XHJcblx0cmV0dXJuIGVsZW07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSWRFdmVudDtcclxuIiwidmFyIFR5cGVzID0gcmVxdWlyZShcIi4vVHlwZXMuanNcIik7XHJcbnZhciBUID0gT2JqZWN0LnR5cGVzO1xyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBDckxvZ2ljKERyYXcpe1xyXG5cdHZhciB0aWxlcyA9IFtdO1xyXG5cdHZhciBjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdHZhciB0aWxlc19jb3VudCA9IDA7XHJcblx0XHJcblx0dmFyIGRlZl93aWR0aCA9IDE7XHJcblx0dmFyIGRlZl9oZWlnaHQgPSAxO1xyXG5cdFxyXG5cdHRoaXMuc2V0VGlsZSA9IGZ1bmN0aW9uKHZhbCl7XHJcblx0XHR2YXIgZmluZGVkX3RpbGUgPSBnZXRUaWxlKHZhbCk7XHJcblx0XHRcclxuXHRcdGlmKCFmaW5kZWRfdGlsZSkgdGhyb3cgbmV3IEVycm9yKFwiVGlsZSBpcyBub3QgZmluZCFcIik7XHJcblx0XHRcclxuXHRcdERyYXcuVGlsZXMuY3VycmVudF90aWxlID0gZmluZGVkX3RpbGU7XHJcblx0XHRjdXJyZW50X3RpbGUgPSBmaW5kZWRfdGlsZTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5hZGQgPSBBZGQ7XHJcblx0dGhpcy5kZWxsID0gZnVuY3Rpb24oKXtcclxuXHRcdGlmKGN1cnJlbnRfdGlsZSAhPT0gbnVsbCl7XHJcblx0XHRcdERyYXcuVmlldy5kZWxsKGN1cnJlbnRfdGlsZS5pZCk7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaW5kZXggPSB0aWxlcy5pbmRleE9mKGN1cnJlbnRfdGlsZSk7XHJcblx0XHRcdHRpbGVzLnNwbGljZShpbmRleCwgMSk7XHJcblx0XHRcdERyYXcuVGlsZXMuZGVsbCgpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYodGlsZXNbMF0pe1xyXG5cdFx0XHRcdGN1cnJlbnRfdGlsZSA9IHRpbGVzWzBdO1xyXG5cdFx0XHRcdERyYXcuVGlsZXMuY3VycmVudF90aWxlID0gdGlsZXNbMF07XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZXtcclxuXHRcdFx0XHRjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgZGF0YSA9IHRpbGVzLm1hcChmdW5jdGlvbih0aWxlLCBpKXtcclxuXHRcdFx0dGlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHRpbGUpO1xyXG5cdFx0XHR0aWxlLmlkID0gaTsgXHJcblx0XHRcdHJldHVybiB0aWxlOyBcclxuXHRcdH0pO1xyXG5cdFx0ZGF0YSA9IHt0aWxlczogZGF0YSwgd2lkdGg6IGRlZl93aWR0aCwgaGVpZ2h0OiBkZWZfaGVpZ2h0fVxyXG5cdFx0RHJhdy5zYXZlKFwidGlsZXNldC5qc29uXCIsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDEpKTtcclxuXHR9XHJcblx0dGhpcy5sb2FkID0gZnVuY3Rpb24obmV3X3RpbGVzLCBpc19zYXZlPXRydWUpe1xyXG5cdFx0aWYoaXNfc2F2ZSkgdGhpcy5zYXZlKCk7XHJcblx0XHRDbGVhcigpO1xyXG5cdFx0bmV3X3RpbGVzLnRpbGVzLmZvckVhY2goQWRkKTtcclxuXHRcdHRoaXMuc2V0VGlsZSgwKTtcclxuXHRcdFxyXG5cdFx0ZGVmX3dpZHRoID0gbmV3X3RpbGVzLndpZHRoO1xyXG5cdFx0ZGVmX2hlaWdodCA9IG5ld190aWxlcy5oZWlnaHQ7XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMuZ2V0VGlsZSA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgdGlsZSA9IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRfdGlsZSk7XHJcblx0XHRpZih0aWxlLndpZHRoID09PSB1bmRlZmluZWQpIHRpbGUud2lkdGggPSBkZWZfd2lkdGg7XHJcblx0XHRpZih0aWxlLmhlaWdodCA9PT0gdW5kZWZpbmVkKSB0aWxlLmhlaWdodCA9IGRlZl9oZWlnaHQ7XHJcblx0XHRcclxuXHRcdHJldHVybiB0aWxlO1xyXG5cdH1cclxuXHRcclxuXHR0aGlzLnJlc2l6ZVRpbGUgPSBmdW5jdGlvbih3LCBoKXtcclxuXHRcdGlmKGN1cnJlbnRfdGlsZSl7XHJcblx0XHRcdGlmKCFjdXJyZW50X3RpbGUud2lkdGgpIGN1cnJlbnRfdGlsZS53aWR0aCA9IGRlZl93aWR0aDtcclxuXHRcdFx0aWYoIWN1cnJlbnRfdGlsZS5oZWlnaHQpIGN1cnJlbnRfdGlsZS5oZWlnaHQgPSBkZWZfaGVpZ2h0O1xyXG5cdFx0XHRcclxuXHRcdFx0aWYoIVQucG9zLnRlc3QodykpIGN1cnJlbnRfdGlsZS53aWR0aCA9IHc7XHJcblx0XHRcdGlmKCFULnBvcy50ZXN0KGgpKSBjdXJyZW50X3RpbGUuaGVpZ2h0ID0gaDtcclxuXHRcdFx0XHJcblx0XHRcdERyYXcuVmlldy5yZXNpemUoY3VycmVudF90aWxlKTtcclxuXHRcdFx0XHJcblx0XHRcdGlmKGN1cnJlbnRfdGlsZS53aWR0aCA9PT0gZGVmX3dpZHRoKSBjdXJyZW50X3RpbGUud2lkdGggPSB1bmRlZmluZWQ7XHJcblx0XHRcdGlmKGN1cnJlbnRfdGlsZS5oZWlnaHQgPT09IGRlZl9oZWlnaHQpIGN1cnJlbnRfdGlsZS5oZWlnaHQgPSB1bmRlZmluZWQ7XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIGdldFRpbGUoaWQpe1xyXG5cdFx0cmV0dXJuIHRpbGVzLmZpbHRlcih0aWxlID0+IGlkID09IHRpbGUuaWQpWzBdO1xyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBBZGQodGlsZSl7XHJcblx0XHRpZihUeXBlcy50aWxlLnRlc3QodGlsZSkpIHRocm93IFR5cGVzLnRpbGUudGVzdCh0aWxlKTtcclxuXHRcdHRpbGUuaWQgPSB0aWxlc19jb3VudCsrO1xyXG5cdFx0XHJcblx0XHRpZihjdXJyZW50X3RpbGUgPT09IG51bGwpdGlsZXMucHVzaCh0aWxlKTtcclxuXHRcdGVsc2UgdGlsZXMuc3BsaWNlKGdldFRpbGUoY3VycmVudF90aWxlKSwgMCwgdGlsZSk7XHJcblx0XHRcclxuXHRcdERyYXcuVGlsZXMuYWRkKHRpbGUpO1xyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBDbGVhcigpe1xyXG5cdFx0RHJhdy5WaWV3LmNsZWFyKCk7XHJcblx0XHREcmF3LlRpbGVzLmNsZWFyKCk7XHJcblx0XHR0aWxlcyA9IFtdO1xyXG5cdFx0Y3VycmVudF90aWxlID0gbnVsbDtcclxuXHRcdHRpbGVzX2NvdW50ID0gMDtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ3JMb2dpYztcclxuIiwicmVxdWlyZShcInR5cGVzanNcIik7XHJcbnJlcXVpcmUoXCJ0eXBlc2pzL3N0cl90eXBlXCIpO1xyXG5cclxudmFyIFQgPSBPYmplY3QudHlwZXM7XHJcblxyXG52YXIgdHlwZV90aWxlID0gVC5vYmooe1xyXG5cdFx0dHlwZTogXCJjb2xvclwiLFxyXG5cdFx0Y29sb3I6IHtyOiBULnBvcygyNTYpLCBiOiBULnBvcygyNTYpLCBnOiBULnBvcygyNTYpfVxyXG5cdH0pO1xyXG52YXIgdHlwZV90aWxlX3N2ZyA9IFQub2JqKHtcclxuXHRcdHR5cGU6IFwic3ZnXCIsXHJcblx0XHRpbWc6IFQuc3RyKC9eW1xcd1xcZCs6Oyw9L10qJC8sIDEwMjQqMTAyNClcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cdHRpbGU6IFQuYW55KHR5cGVfdGlsZV9zdmcsIHR5cGVfdGlsZSksIFxyXG5cdHRpbGVzOiBULmFycih0eXBlX3RpbGUsIDE1KVxyXG59O1xyXG4iLCJjb25zdCBEcmF3ID0gcmVxdWlyZShcIi4vRHJhdy5qc1wiKTtcclxuY29uc3QgQ3JMb2dpYyA9IHJlcXVpcmUoXCIuL0xvZ2ljLmpzXCIpO1xyXG5jb25zdCBDckNvbnRyb2xsZXIgPSByZXF1aXJlKFwiLi9Db250cm9sLmpzXCIpO1xyXG5cclxudmFyIFR5cGVzID0gcmVxdWlyZShcIi4vVHlwZXMuanNcIik7XHJcbnZhciBUaWxlcyA9IHJlcXVpcmUoXCIuL25ld190aWxlc2V0Lmpzb25cIik7XHJcblxyXG5mdW5jdGlvbiBJbml0KCl7XHJcblx0dmFyIExvZ2ljID0gbmV3IENyTG9naWMoRHJhdyk7XHJcblx0TG9naWMubG9hZChUaWxlcywgZmFsc2UpO1xyXG5cdENyQ29udHJvbGxlcihMb2dpYywgRHJhdyk7XHJcbn1cclxuXHJcbkluaXQoKTtcclxuXHJcblxyXG5cclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiBcInRpbGVzXCI6IFtcbiAge1xuICAgXCJ0eXBlXCI6IFwiY29sb3JcIixcbiAgIFwiY29sb3JcIjoge1xuICAgIFwiclwiOiAwLFxuICAgIFwiYlwiOiAwLFxuICAgIFwiZ1wiOiAwXG4gICB9LFxuICAgXCJpZFwiOiAwXG4gIH0sXG4gIHtcbiAgIFwidHlwZVwiOiBcImNvbG9yXCIsXG4gICBcImNvbG9yXCI6IHtcbiAgICBcInJcIjogMjU1LFxuICAgIFwiYlwiOiAyNTUsXG4gICAgXCJnXCI6IDI1NVxuICAgfSxcbiAgIFwiaWRcIjogMVxuICB9XG4gXSxcbiBcIndpZHRoXCI6IDEsXG4gXCJoZWlnaHRcIjogMVxufVxuIiwidmFyIENocm9tYXRoID0gcmVxdWlyZSgnLi9zcmMvY2hyb21hdGguanMnKTtcbm1vZHVsZS5leHBvcnRzID0gQ2hyb21hdGg7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuLypcbiAgIENsYXNzOiBDaHJvbWF0aFxuKi9cbi8vIEdyb3VwOiBDb25zdHJ1Y3RvcnNcbi8qXG4gICBDb25zdHJ1Y3RvcjogQ2hyb21hdGhcbiAgIENyZWF0ZSBhIG5ldyBDaHJvbWF0aCBpbnN0YW5jZSBmcm9tIGEgc3RyaW5nIG9yIGludGVnZXJcblxuICAgUGFyYW1ldGVyczpcbiAgIG1peGVkIC0gVGhlIHZhbHVlIHRvIHVzZSBmb3IgY3JlYXRpbmcgdGhlIGNvbG9yXG5cbiAgIFJldHVybnM6XG4gICA8Q2hyb21hdGg+IGluc3RhbmNlXG5cbiAgIFByb3BlcnRpZXM6XG4gICByIC0gVGhlIHJlZCBjaGFubmVsIG9mIHRoZSBSR0IgcmVwcmVzZW50YXRpb24gb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDI1NS5cbiAgIGcgLSBUaGUgZ3JlZW4gY2hhbm5lbCBvZiB0aGUgUkdCIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAyNTUuXG4gICBiIC0gVGhlIGJsdWUgY2hhbm5lbCBvZiB0aGUgUkdCIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAyNTUuXG4gICBhIC0gVGhlIGFscGhhIGNoYW5uZWwgb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEuXG4gICBoIC0gVGhlIGh1ZSBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMzYwLlxuICAgc2wgLSBUaGUgc2F0dXJhdGlvbiBvZiB0aGUgSFNMIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxLlxuICAgc3YgLSBUaGUgc2F0dXJhdGlvbiBvZiB0aGUgSFNWL0hTQiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMS5cbiAgIGwgLSBUaGUgbGlnaHRuZXNzIG9mIHRoZSBIU0wgcmVwcmVzZW50YXRpb24gb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEuXG4gICB2IC0gVGhlIGxpZ2h0bmVzcyBvZiB0aGUgSFNWL0hTQiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMS5cblxuICAgRXhhbXBsZXM6XG4gIChzdGFydCBjb2RlKVxuLy8gVGhlcmUgYXJlIG1hbnkgd2F5cyB0byBjcmVhdGUgYSBDaHJvbWF0aCBpbnN0YW5jZVxubmV3IENocm9tYXRoKCcjRkYwMDAwJyk7ICAgICAgICAgICAgICAgICAgLy8gSGV4ICg2IGNoYXJhY3RlcnMgd2l0aCBoYXNoKVxubmV3IENocm9tYXRoKCdGRjAwMDAnKTsgICAgICAgICAgICAgICAgICAgLy8gSGV4ICg2IGNoYXJhY3RlcnMgd2l0aG91dCBoYXNoKVxubmV3IENocm9tYXRoKCcjRjAwJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gSGV4ICgzIGNoYXJhY3RlcnMgd2l0aCBoYXNoKVxubmV3IENocm9tYXRoKCdGMDAnKTsgICAgICAgICAgICAgICAgICAgICAgLy8gSGV4ICgzIGNoYXJhY3RlcnMgd2l0aG91dCBoYXNoKVxubmV3IENocm9tYXRoKCdyZWQnKTsgICAgICAgICAgICAgICAgICAgICAgLy8gQ1NTL1NWRyBDb2xvciBuYW1lXG5uZXcgQ2hyb21hdGgoJ3JnYigyNTUsIDAsIDApJyk7ICAgICAgICAgICAvLyBSR0IgdmlhIENTU1xubmV3IENocm9tYXRoKHtyOiAyNTUsIGc6IDAsIGI6IDB9KTsgICAgICAgLy8gUkdCIHZpYSBvYmplY3Rcbm5ldyBDaHJvbWF0aCgncmdiYSgyNTUsIDAsIDAsIDEpJyk7ICAgICAgIC8vIFJHQkEgdmlhIENTU1xubmV3IENocm9tYXRoKHtyOiAyNTUsIGc6IDAsIGI6IDAsIGE6IDF9KTsgLy8gUkdCQSB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzbCgwLCAxMDAlLCA1MCUpJyk7ICAgICAgICAvLyBIU0wgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCBsOiAwLjV9KTsgICAgICAgLy8gSFNMIHZpYSBvYmplY3Rcbm5ldyBDaHJvbWF0aCgnaHNsYSgwLCAxMDAlLCA1MCUsIDEpJyk7ICAgIC8vIEhTTEEgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCBsOiAwLjUsIGE6IDF9KTsgLy8gSFNMQSB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzdigwLCAxMDAlLCAxMDAlKScpOyAgICAgICAvLyBIU1YgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCB2OiAxfSk7ICAgICAgICAgLy8gSFNWIHZpYSBvYmplY3Rcbm5ldyBDaHJvbWF0aCgnaHN2YSgwLCAxMDAlLCAxMDAlLCAxKScpOyAgIC8vIEhTVkEgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCB2OiAxLCBhOiAxfSk7ICAgLy8gSFNWQSB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzYigwLCAxMDAlLCAxMDAlKScpOyAgICAgICAvLyBIU0IgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCBiOiAxfSk7ICAgICAgICAgLy8gSFNCIHZpYSBvYmplY3Rcbm5ldyBDaHJvbWF0aCgnaHNiYSgwLCAxMDAlLCAxMDAlLCAxKScpOyAgIC8vIEhTQkEgdmlhIENTU1xubmV3IENocm9tYXRoKHtoOiAwLCBzOiAxLCBiOiAxLCBhOiAxfSk7ICAgLy8gSFNCQSB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoMTY3MTE2ODApOyAgICAgICAgICAgICAgICAgICAvLyBSR0IgdmlhIGludGVnZXIgKGFscGhhIGN1cnJlbnRseSBpZ25vcmVkKVxuKGVuZCBjb2RlKVxuKi9cbmZ1bmN0aW9uIENocm9tYXRoKCBtaXhlZCApXG57XG4gICAgdmFyIGNoYW5uZWxzLCBjb2xvciwgaHNsLCBoc3YsIHJnYjtcblxuICAgIGlmICh1dGlsLmlzU3RyaW5nKG1peGVkKSB8fCB1dGlsLmlzTnVtYmVyKG1peGVkKSkge1xuICAgICAgICBjaGFubmVscyA9IENocm9tYXRoLnBhcnNlKG1peGVkKTtcbiAgICB9IGVsc2UgaWYgKHV0aWwuaXNBcnJheShtaXhlZCkpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VyZSBob3cgdG8gcGFyc2UgYXJyYXkgYCcrbWl4ZWQrJ2AnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcsIHBsZWFzZSBwYXNzIGFuIG9iamVjdCBvciBDU1Mgc3R5bGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnb3IgdHJ5IENocm9tYXRoLnJnYiwgQ2hyb21hdGguaHNsLCBvciBDaHJvbWF0aC5oc3YnXG4gICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgfSBlbHNlIGlmIChtaXhlZCBpbnN0YW5jZW9mIENocm9tYXRoKSB7XG4gICAgICAgIGNoYW5uZWxzID0gdXRpbC5tZXJnZSh7fSwgbWl4ZWQpO1xuICAgIH0gZWxzZSBpZiAodXRpbC5pc09iamVjdChtaXhlZCkpe1xuICAgICAgICBjaGFubmVscyA9IHV0aWwubWVyZ2Uoe30sIG1peGVkKTtcbiAgICB9XG5cbiAgICBpZiAoISBjaGFubmVscylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcGFyc2UgYCcrbWl4ZWQrJ2AnKTtcbiAgICBlbHNlIGlmICghaXNGaW5pdGUoY2hhbm5lbHMuYSkpXG4gICAgICAgIGNoYW5uZWxzLmEgPSAxO1xuXG4gICAgaWYgKCdyJyBpbiBjaGFubmVscyApe1xuICAgICAgICByZ2IgPSB1dGlsLnJnYi5zY2FsZWQwMShbY2hhbm5lbHMuciwgY2hhbm5lbHMuZywgY2hhbm5lbHMuYl0pO1xuICAgICAgICBoc2wgPSBDaHJvbWF0aC5yZ2IyaHNsKHJnYik7XG4gICAgICAgIGhzdiA9IENocm9tYXRoLnJnYjJoc3YocmdiKTtcbiAgICB9IGVsc2UgaWYgKCdoJyBpbiBjaGFubmVscyApe1xuICAgICAgICBpZiAoJ2wnIGluIGNoYW5uZWxzKXtcbiAgICAgICAgICAgIGhzbCA9IHV0aWwuaHNsLnNjYWxlZChbY2hhbm5lbHMuaCwgY2hhbm5lbHMucywgY2hhbm5lbHMubF0pO1xuICAgICAgICAgICAgcmdiID0gQ2hyb21hdGguaHNsMnJnYihoc2wpO1xuICAgICAgICAgICAgaHN2ID0gQ2hyb21hdGgucmdiMmhzdihyZ2IpO1xuICAgICAgICB9IGVsc2UgaWYgKCd2JyBpbiBjaGFubmVscyB8fCAnYicgaW4gY2hhbm5lbHMpIHtcbiAgICAgICAgICAgIGlmICgnYicgaW4gY2hhbm5lbHMpIGNoYW5uZWxzLnYgPSBjaGFubmVscy5iO1xuICAgICAgICAgICAgaHN2ID0gdXRpbC5oc2wuc2NhbGVkKFtjaGFubmVscy5oLCBjaGFubmVscy5zLCBjaGFubmVscy52XSk7XG4gICAgICAgICAgICByZ2IgPSBDaHJvbWF0aC5oc3YycmdiKGhzdik7XG4gICAgICAgICAgICBoc2wgPSBDaHJvbWF0aC5yZ2IyaHNsKHJnYik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHV0aWwubWVyZ2UodGhpcywge1xuICAgICAgICByOiAgcmdiWzBdLCAgZzogcmdiWzFdLCBiOiByZ2JbMl0sXG4gICAgICAgIGg6ICBoc2xbMF0sIHNsOiBoc2xbMV0sIGw6IGhzbFsyXSxcbiAgICAgICAgc3Y6IGhzdlsxXSwgIHY6IGhzdlsyXSwgYTogY2hhbm5lbHMuYVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8qXG4gIENvbnN0cnVjdG9yOiBDaHJvbWF0aC5yZ2JcbiAgQ3JlYXRlIGEgbmV3IDxDaHJvbWF0aD4gaW5zdGFuY2UgZnJvbSBSR0IgdmFsdWVzXG5cbiAgUGFyYW1ldGVyczpcbiAgciAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgZ3JlZW4gY2hhbm5lbCBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyByLGcsYikgb2YgUkdCIHZhbHVlc1xuICBnIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSBncmVlbiBjaGFubmVsXG4gIGIgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIHJlZCBjaGFubmVsXG4gIGEgLSAoT3B0aW9uYWwpIEZsb2F0LCAwLTEsIHJlcHJlc2VudGluZyB0aGUgYWxwaGEgY2hhbm5lbFxuXG4gUmV0dXJuczpcbiA8Q2hyb21hdGg+XG5cbiBFeGFtcGxlczpcbiA+ID4gbmV3IENocm9tYXRoLnJnYigxMjMsIDIzNCwgNTYpLnRvU3RyaW5nKClcbiA+IFwiIzdCRUEzOFwiXG5cbiA+ID4gbmV3IENocm9tYXRoLnJnYihbMTIzLCAyMzQsIDU2XSkudG9TdHJpbmcoKVxuID4gXCIjN0JFQTM4XCJcblxuID4gPiBuZXcgQ2hyb21hdGgucmdiKHtyOiAxMjMsIGc6IDIzNCwgYjogNTZ9KS50b1N0cmluZygpXG4gPiBcIiM3QkVBMzhcIlxuICovXG5DaHJvbWF0aC5yZ2IgPSBmdW5jdGlvbiAociwgZywgYiwgYSlcbntcbiAgICB2YXIgcmdiYSA9IHV0aWwucmdiLmZyb21BcmdzKHIsIGcsIGIsIGEpO1xuICAgIHIgPSByZ2JhWzBdLCBnID0gcmdiYVsxXSwgYiA9IHJnYmFbMl0sIGEgPSByZ2JhWzNdO1xuXG4gICAgcmV0dXJuIG5ldyBDaHJvbWF0aCh7cjogciwgZzogZywgYjogYiwgYTogYX0pO1xufTtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLnJnYmFcbiAgQWxpYXMgZm9yIDxDaHJvbWF0aC5yZ2I+XG4qL1xuQ2hyb21hdGgucmdiYSA9IENocm9tYXRoLnJnYjtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzbFxuICBDcmVhdGUgYSBuZXcgQ2hyb21hdGggaW5zdGFuY2UgZnJvbSBIU0wgdmFsdWVzXG5cbiAgUGFyYW1ldGVyczpcbiAgaCAtIE51bWJlciwgLUluZmluaXR5IC0gSW5maW5pdHksIHJlcHJlc2VudGluZyB0aGUgaHVlIE9SIEFycmF5IE9SIG9iamVjdCAod2l0aCBrZXlzIGgscyxsKSBvZiBIU0wgdmFsdWVzXG4gIHMgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBzYXR1cmF0aW9uXG4gIGwgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBsaWdodG5lc3NcbiAgYSAtIChPcHRpb25hbCkgRmxvYXQsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBhbHBoYSBjaGFubmVsXG5cbiAgUmV0dXJuczpcbiAgPENocm9tYXRoPlxuXG4gIEV4YW1wbGVzOlxuICA+ID4gbmV3IENocm9tYXRoLmhzbCgyNDAsIDEsIDAuNSkudG9TdHJpbmcoKVxuICA+IFwiIzAwMDBGRlwiXG5cbiAgPiA+IG5ldyBDaHJvbWF0aC5oc2woWzI0MCwgMSwgMC41XSkudG9TdHJpbmcoKVxuICA+IFwiIzAwMDBGRlwiXG5cbiAgPiBuZXcgQ2hyb21hdGguaHNsKHtoOjI0MCwgczoxLCBsOjAuNX0pLnRvU3RyaW5nKClcbiAgPiBcIiMwMDAwRkZcIlxuICovXG5DaHJvbWF0aC5oc2wgPSBmdW5jdGlvbiAoaCwgcywgbCwgYSlcbntcbiAgICB2YXIgaHNsYSA9IHV0aWwuaHNsLmZyb21BcmdzKGgsIHMsIGwsIGEpO1xuICAgIGggPSBoc2xhWzBdLCBzID0gaHNsYVsxXSwgbCA9IGhzbGFbMl0sIGEgPSBoc2xhWzNdO1xuXG4gICAgcmV0dXJuIG5ldyBDaHJvbWF0aCh7aDogaCwgczogcywgbDogbCwgYTogYX0pO1xufTtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzbGFcbiAgQWxpYXMgZm9yIDxDaHJvbWF0aC5oc2w+XG4qL1xuQ2hyb21hdGguaHNsYSA9IENocm9tYXRoLmhzbDtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzdlxuICBDcmVhdGUgYSBuZXcgQ2hyb21hdGggaW5zdGFuY2UgZnJvbSBIU1YgdmFsdWVzXG5cbiAgUGFyYW1ldGVyczpcbiAgaCAtIE51bWJlciwgLUluZmluaXR5IC0gSW5maW5pdHksIHJlcHJlc2VudGluZyB0aGUgaHVlIE9SIEFycmF5IE9SIG9iamVjdCAod2l0aCBrZXlzIGgscyxsKSBvZiBIU1YgdmFsdWVzXG4gIHMgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBzYXR1cmF0aW9uXG4gIHYgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBsaWdodG5lc3NcbiAgYSAtIChPcHRpb25hbCkgRmxvYXQsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBhbHBoYSBjaGFubmVsXG5cbiAgUmV0dXJuczpcbiAgPENocm9tYXRoPlxuXG4gIEV4YW1wbGVzOlxuICA+ID4gbmV3IENocm9tYXRoLmhzdigyNDAsIDEsIDEpLnRvU3RyaW5nKClcbiAgPiBcIiMwMDAwRkZcIlxuXG4gID4gPiBuZXcgQ2hyb21hdGguaHN2KFsyNDAsIDEsIDFdKS50b1N0cmluZygpXG4gID4gXCIjMDAwMEZGXCJcblxuICA+ID4gbmV3IENocm9tYXRoLmhzdih7aDoyNDAsIHM6MSwgdjoxfSkudG9TdHJpbmcoKVxuICA+IFwiIzAwMDBGRlwiXG4gKi9cbkNocm9tYXRoLmhzdiA9IGZ1bmN0aW9uIChoLCBzLCB2LCBhKVxue1xuICAgIHZhciBoc3ZhID0gdXRpbC5oc2wuZnJvbUFyZ3MoaCwgcywgdiwgYSk7XG4gICAgaCA9IGhzdmFbMF0sIHMgPSBoc3ZhWzFdLCB2ID0gaHN2YVsyXSwgYSA9IGhzdmFbM107XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKHtoOiBoLCBzOiBzLCB2OiB2LCBhOiBhfSk7XG59O1xuXG4vKlxuICBDb25zdHJ1Y3RvcjogQ2hyb21hdGguaHN2YVxuICBBbGlhcyBmb3IgPENocm9tYXRoLmhzdj5cbiovXG5DaHJvbWF0aC5oc3ZhID0gQ2hyb21hdGguaHN2O1xuXG4vKlxuICBDb25zdHJ1Y3RvcjogQ2hyb21hdGguaHNiXG4gIEFsaWFzIGZvciA8Q2hyb21hdGguaHN2PlxuICovXG5DaHJvbWF0aC5oc2IgPSBDaHJvbWF0aC5oc3Y7XG5cbi8qXG4gICBDb25zdHJ1Y3RvcjogQ2hyb21hdGguaHNiYVxuICAgQWxpYXMgZm9yIDxDaHJvbWF0aC5oc3ZhPlxuICovXG5DaHJvbWF0aC5oc2JhID0gQ2hyb21hdGguaHN2YTtcblxuLy8gR3JvdXA6IFN0YXRpYyBtZXRob2RzIC0gcmVwcmVzZW50YXRpb25cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudG9JbnRlZ2VyXG4gIENvbnZlcnQgYSBjb2xvciBpbnRvIGFuIGludGVnZXIgKGFscGhhIGNoYW5uZWwgY3VycmVudGx5IG9taXR0ZWQpXG5cbiAgUGFyYW1ldGVyczpcbiAgY29sb3IgLSBBY2NlcHRzIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyB0aGUgQ2hyb21hdGggY29uc3RydWN0b3JcblxuICBSZXR1cm5zOlxuICBpbnRlZ2VyXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC50b0ludGVnZXIoJ2dyZWVuJyk7XG4gID4gMzI3NjhcblxuICA+ID4gQ2hyb21hdGgudG9JbnRlZ2VyKCd3aGl0ZScpO1xuICA+IDE2Nzc3MjE1XG4qL1xuQ2hyb21hdGgudG9JbnRlZ2VyID0gZnVuY3Rpb24gKGNvbG9yKVxue1xuICAgIC8vIGNyZWF0ZSBzb21ldGhpbmcgbGlrZSAnMDA4MDAwJyAoZ3JlZW4pXG4gICAgdmFyIGhleDYgPSBuZXcgQ2hyb21hdGgoY29sb3IpLmhleCgpLmpvaW4oJycpO1xuXG4gICAgLy8gQXJndW1lbnRzIGJlZ2lubmluZyB3aXRoIGAweGAgYXJlIHRyZWF0ZWQgYXMgaGV4IHZhbHVlc1xuICAgIHJldHVybiBOdW1iZXIoJzB4JyArIGhleDYpO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC50b05hbWVcbiAgUmV0dXJuIHRoZSBXM0MgY29sb3IgbmFtZSBvZiB0aGUgY29sb3IgaXQgbWF0Y2hlc1xuXG4gIFBhcmFtZXRlcnM6XG4gIGNvbXBhcmlzb25cblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLnRvTmFtZSgncmdiKDI1NSwgMCwgMjU1KScpO1xuICA+ICdmdWNoc2lhJ1xuXG4gID4gPiBDaHJvbWF0aC50b05hbWUoNjU1MzUpO1xuICA+ICdhcXVhJ1xuKi9cbkNocm9tYXRoLnRvTmFtZSA9IGZ1bmN0aW9uIChjb21wYXJpc29uKVxue1xuICAgIGNvbXBhcmlzb24gPSArbmV3IENocm9tYXRoKGNvbXBhcmlzb24pO1xuICAgIGZvciAodmFyIGNvbG9yIGluIENocm9tYXRoLmNvbG9ycykgaWYgKCtDaHJvbWF0aFtjb2xvcl0gPT0gY29tcGFyaXNvbikgcmV0dXJuIGNvbG9yO1xufTtcblxuLy8gR3JvdXA6IFN0YXRpYyBtZXRob2RzIC0gY29sb3IgY29udmVyc2lvblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5yZ2IyaGV4XG4gIENvbnZlcnQgYW4gUkdCIHZhbHVlIHRvIGEgSGV4IHZhbHVlXG5cbiAgUmV0dXJuczogYXJyYXlcblxuICBFeGFtcGxlOlxuICA+ID4gQ2hyb21hdGgucmdiMmhleCg1MCwgMTAwLCAxNTApXG4gID4gXCJbMzIsIDY0LCA5Nl1cIlxuICovXG5DaHJvbWF0aC5yZ2IyaGV4ID0gZnVuY3Rpb24gcmdiMmhleChyLCBnLCBiKVxue1xuICAgIHZhciByZ2IgPSB1dGlsLnJnYi5zY2FsZWQwMShyLCBnLCBiKTtcbiAgICB2YXIgaGV4ID0gcmdiLm1hcChmdW5jdGlvbiAocGN0KSB7XG4gICAgICB2YXIgZGVjID0gTWF0aC5yb3VuZChwY3QgKiAyNTUpO1xuICAgICAgdmFyIGhleCA9IGRlYy50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICAgIHJldHVybiB1dGlsLmxwYWQoaGV4LCAyLCAwKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBoZXg7XG59O1xuXG4vLyBDb252ZXJ0ZWQgZnJvbSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0dlbmVyYWxfYXBwcm9hY2hcbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgucmdiMmhzbFxuICBDb252ZXJ0IFJHQiB0byBIU0xcblxuICBQYXJhbWV0ZXJzOlxuICByIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSBncmVlbiBjaGFubmVsIE9SIEFycmF5IE9SIG9iamVjdCAod2l0aCBrZXlzIHIsZyxiKSBvZiBSR0IgdmFsdWVzXG4gIGcgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIGdyZWVuIGNoYW5uZWxcbiAgYiAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgcmVkIGNoYW5uZWxcblxuICBSZXR1cm5zOiBhcnJheVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHNsKDAsIDI1NSwgMCk7XG4gID4gWyAxMjAsIDEsIDAuNSBdXG5cbiAgPiA+IENocm9tYXRoLnJnYjJoc2woWzAsIDAsIDI1NV0pO1xuICA+IFsgMjQwLCAxLCAwLjUgXVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHNsKHtyOiAyNTUsIGc6IDAsIGI6IDB9KTtcbiAgPiBbIDAsIDEsIDAuNSBdXG4gKi9cbkNocm9tYXRoLnJnYjJoc2wgPSBmdW5jdGlvbiByZ2IyaHNsKHIsIGcsIGIpXG57XG4gICAgdmFyIHJnYiA9IHV0aWwucmdiLnNjYWxlZDAxKHIsIGcsIGIpO1xuICAgIHIgPSByZ2JbMF0sIGcgPSByZ2JbMV0sIGIgPSByZ2JbMl07XG5cbiAgICB2YXIgTSA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBtID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIEMgPSBNIC0gbTtcbiAgICB2YXIgTCA9IDAuNSooTSArIG0pO1xuICAgIHZhciBTID0gKEMgPT09IDApID8gMCA6IEMvKDEtTWF0aC5hYnMoMipMLTEpKTtcblxuICAgIHZhciBoO1xuICAgIGlmIChDID09PSAwKSBoID0gMDsgLy8gc3BlYydkIGFzIHVuZGVmaW5lZCwgYnV0IHVzdWFsbHkgc2V0IHRvIDBcbiAgICBlbHNlIGlmIChNID09PSByKSBoID0gKChnLWIpL0MpICUgNjtcbiAgICBlbHNlIGlmIChNID09PSBnKSBoID0gKChiLXIpL0MpICsgMjtcbiAgICBlbHNlIGlmIChNID09PSBiKSBoID0gKChyLWcpL0MpICsgNDtcblxuICAgIHZhciBIID0gNjAgKiBoO1xuXG4gICAgcmV0dXJuIFtILCBwYXJzZUZsb2F0KFMpLCBwYXJzZUZsb2F0KEwpXTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgucmdiMmhzdlxuICBDb252ZXJ0IFJHQiB0byBIU1ZcblxuICBQYXJhbWV0ZXJzOlxuICByIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSBncmVlbiBjaGFubmVsIE9SIEFycmF5IE9SIG9iamVjdCAod2l0aCBrZXlzIHIsZyxiKSBvZiBSR0IgdmFsdWVzXG4gIGcgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIGdyZWVuIGNoYW5uZWxcbiAgYiAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgcmVkIGNoYW5uZWxcblxuICBSZXR1cm5zOlxuICBBcnJheVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHN2KDAsIDI1NSwgMCk7XG4gID4gWyAxMjAsIDEsIDEgXVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHN2KFswLCAwLCAyNTVdKTtcbiAgPiBbIDI0MCwgMSwgMSBdXG5cbiAgPiA+IENocm9tYXRoLnJnYjJoc3Yoe3I6IDI1NSwgZzogMCwgYjogMH0pO1xuICA+IFsgMCwgMSwgMSBdXG4gKi9cbkNocm9tYXRoLnJnYjJoc3YgPSBmdW5jdGlvbiByZ2IyaHN2KHIsIGcsIGIpXG57XG4gICAgdmFyIHJnYiA9IHV0aWwucmdiLnNjYWxlZDAxKHIsIGcsIGIpO1xuICAgIHIgPSByZ2JbMF0sIGcgPSByZ2JbMV0sIGIgPSByZ2JbMl07XG5cbiAgICB2YXIgTSA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBtID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIEMgPSBNIC0gbTtcbiAgICB2YXIgTCA9IE07XG4gICAgdmFyIFMgPSAoQyA9PT0gMCkgPyAwIDogQy9NO1xuXG4gICAgdmFyIGg7XG4gICAgaWYgKEMgPT09IDApIGggPSAwOyAvLyBzcGVjJ2QgYXMgdW5kZWZpbmVkLCBidXQgdXN1YWxseSBzZXQgdG8gMFxuICAgIGVsc2UgaWYgKE0gPT09IHIpIGggPSAoKGctYikvQykgJSA2O1xuICAgIGVsc2UgaWYgKE0gPT09IGcpIGggPSAoKGItcikvQykgKyAyO1xuICAgIGVsc2UgaWYgKE0gPT09IGIpIGggPSAoKHItZykvQykgKyA0O1xuXG4gICAgdmFyIEggPSA2MCAqIGg7XG5cbiAgICByZXR1cm4gW0gsIHBhcnNlRmxvYXQoUyksIHBhcnNlRmxvYXQoTCldO1xufTtcblxuLypcbiAgIE1ldGhvZDogQ2hyb21hdGgucmdiMmhzYlxuICAgQWxpYXMgZm9yIDxDaHJvbWF0aC5yZ2IyaHN2PlxuICovXG5DaHJvbWF0aC5yZ2IyaHNiID0gQ2hyb21hdGgucmdiMmhzdjtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5oc2wycmdiXG4gIENvbnZlcnQgZnJvbSBIU0wgdG8gUkdCXG5cbiAgUGFyYW1ldGVyczpcbiAgaCAtIE51bWJlciwgLUluZmluaXR5IC0gSW5maW5pdHksIHJlcHJlc2VudGluZyB0aGUgaHVlIE9SIEFycmF5IE9SIG9iamVjdCAod2l0aCBrZXlzIGgscyxsKSBvZiBIU0wgdmFsdWVzXG4gIHMgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBzYXR1cmF0aW9uXG4gIGwgLSBOdW1iZXIsIDAtMSwgcmVwcmVzZW50aW5nIHRoZSBsaWdodG5lc3NcblxuICBSZXR1cm5zOlxuICBhcnJheVxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGguaHNsMnJnYigzNjAsIDEsIDAuNSk7XG4gID4gWyAyNTUsIDAsIDAgXVxuXG4gID4gPiBDaHJvbWF0aC5oc2wycmdiKFswLCAxLCAwLjVdKTtcbiAgPiBbIDI1NSwgMCwgMCBdXG5cbiAgPiA+IENocm9tYXRoLmhzbDJyZ2Ioe2g6IDIxMCwgczoxLCB2OiAwLjV9KTtcbiAgPiBbIDAsIDEyNy41LCAyNTUgXVxuICovXG4vLyBUT0RPOiBDYW4gSSAlPSBocCBhbmQgdGhlbiBkbyBhIHN3aXRjaD9cbkNocm9tYXRoLmhzbDJyZ2IgPSBmdW5jdGlvbiBoc2wycmdiKGgsIHMsIGwpXG57XG4gICAgdmFyIGhzbCA9IHV0aWwuaHNsLnNjYWxlZChoLCBzLCBsKTtcbiAgICBoPWhzbFswXSwgcz1oc2xbMV0sIGw9aHNsWzJdO1xuXG4gICAgdmFyIEMgPSAoMSAtIE1hdGguYWJzKDIqbC0xKSkgKiBzO1xuICAgIHZhciBocCA9IGgvNjA7XG4gICAgdmFyIFggPSBDICogKDEtTWF0aC5hYnMoaHAlMi0xKSk7XG4gICAgdmFyIHJnYiwgbTtcblxuICAgIHN3aXRjaCAoTWF0aC5mbG9vcihocCkpe1xuICAgIGNhc2UgMDogIHJnYiA9IFtDLFgsMF07IGJyZWFrO1xuICAgIGNhc2UgMTogIHJnYiA9IFtYLEMsMF07IGJyZWFrO1xuICAgIGNhc2UgMjogIHJnYiA9IFswLEMsWF07IGJyZWFrO1xuICAgIGNhc2UgMzogIHJnYiA9IFswLFgsQ107IGJyZWFrO1xuICAgIGNhc2UgNDogIHJnYiA9IFtYLDAsQ107IGJyZWFrO1xuICAgIGNhc2UgNTogIHJnYiA9IFtDLDAsWF07IGJyZWFrO1xuICAgIGRlZmF1bHQ6IHJnYiA9IFswLDAsMF07XG4gICAgfVxuXG4gICAgbSA9IGwgLSAoQy8yKTtcblxuICAgIHJldHVybiBbXG4gICAgICAgIChyZ2JbMF0rbSksXG4gICAgICAgIChyZ2JbMV0rbSksXG4gICAgICAgIChyZ2JbMl0rbSlcbiAgICBdO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5oc3YycmdiXG4gIENvbnZlcnQgSFNWIHRvIFJHQlxuXG4gIFBhcmFtZXRlcnM6XG4gIGggLSBOdW1iZXIsIC1JbmZpbml0eSAtIEluZmluaXR5LCByZXByZXNlbnRpbmcgdGhlIGh1ZSBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyBoLHMsdiBvciBoLHMsYikgb2YgSFNWIHZhbHVlc1xuICBzIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgc2F0dXJhdGlvblxuICB2IC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgbGlnaHRuZXNzXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5oc3YycmdiKDM2MCwgMSwgMSk7XG4gID4gWyAyNTUsIDAsIDAgXVxuXG4gID4gPiBDaHJvbWF0aC5oc3YycmdiKFswLCAxLCAwLjVdKTtcbiAgPiBbIDEyNy41LCAwLCAwIF1cblxuICA+ID4gQ2hyb21hdGguaHN2MnJnYih7aDogMjEwLCBzOiAwLjUsIHY6IDF9KTtcbiAgPiBbIDEyNy41LCAxOTEuMjUsIDI1NSBdXG4gKi9cbkNocm9tYXRoLmhzdjJyZ2IgPSBmdW5jdGlvbiBoc3YycmdiKGgsIHMsIHYpXG57XG4gICAgdmFyIGhzdiA9IHV0aWwuaHNsLnNjYWxlZChoLCBzLCB2KTtcbiAgICBoPWhzdlswXSwgcz1oc3ZbMV0sIHY9aHN2WzJdO1xuXG4gICAgdmFyIEMgPSB2ICogcztcbiAgICB2YXIgaHAgPSBoLzYwO1xuICAgIHZhciBYID0gQyooMS1NYXRoLmFicyhocCUyLTEpKTtcbiAgICB2YXIgcmdiLCBtO1xuXG4gICAgaWYgKGggPT0gdW5kZWZpbmVkKSAgICAgICAgIHJnYiA9IFswLDAsMF07XG4gICAgZWxzZSBpZiAoMCA8PSBocCAmJiBocCA8IDEpIHJnYiA9IFtDLFgsMF07XG4gICAgZWxzZSBpZiAoMSA8PSBocCAmJiBocCA8IDIpIHJnYiA9IFtYLEMsMF07XG4gICAgZWxzZSBpZiAoMiA8PSBocCAmJiBocCA8IDMpIHJnYiA9IFswLEMsWF07XG4gICAgZWxzZSBpZiAoMyA8PSBocCAmJiBocCA8IDQpIHJnYiA9IFswLFgsQ107XG4gICAgZWxzZSBpZiAoNCA8PSBocCAmJiBocCA8IDUpIHJnYiA9IFtYLDAsQ107XG4gICAgZWxzZSBpZiAoNSA8PSBocCAmJiBocCA8IDYpIHJnYiA9IFtDLDAsWF07XG5cbiAgICBtID0gdiAtIEM7XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAocmdiWzBdK20pLFxuICAgICAgICAocmdiWzFdK20pLFxuICAgICAgICAocmdiWzJdK20pXG4gICAgXTtcbn07XG5cbi8qXG4gICBNZXRob2Q6IENocm9tYXRoLmhzYjJyZ2JcbiAgIEFsaWFzIGZvciA8Q2hyb21hdGguaHN2MnJnYj5cbiAqL1xuQ2hyb21hdGguaHNiMnJnYiA9IENocm9tYXRoLmhzdjJyZ2I7XG5cbi8qXG4gICAgUHJvcGVydHk6IENocm9tYXRoLmNvbnZlcnRcbiAgICBBbGlhc2VzIGZvciB0aGUgQ2hyb21hdGgueDJ5IGZ1bmN0aW9ucy5cbiAgICBVc2UgbGlrZSBDaHJvbWF0aC5jb252ZXJ0W3hdW3ldKGFyZ3MpIG9yIENocm9tYXRoLmNvbnZlcnQueC55KGFyZ3MpXG4qL1xuQ2hyb21hdGguY29udmVydCA9IHtcbiAgICByZ2I6IHtcbiAgICAgICAgaGV4OiBDaHJvbWF0aC5oc3YycmdiLFxuICAgICAgICBoc2w6IENocm9tYXRoLnJnYjJoc2wsXG4gICAgICAgIGhzdjogQ2hyb21hdGgucmdiMmhzdlxuICAgIH0sXG4gICAgaHNsOiB7XG4gICAgICAgIHJnYjogQ2hyb21hdGguaHNsMnJnYlxuICAgIH0sXG4gICAgaHN2OiB7XG4gICAgICAgIHJnYjogQ2hyb21hdGguaHN2MnJnYlxuICAgIH1cbn07XG5cbi8qIEdyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIGNvbG9yIHNjaGVtZSAqL1xuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5jb21wbGVtZW50XG4gIFJldHVybiB0aGUgY29tcGxlbWVudCBvZiB0aGUgZ2l2ZW4gY29sb3JcblxuICBSZXR1cm5zOiA8Q2hyb21hdGg+XG5cbiAgPiA+IENocm9tYXRoLmNvbXBsZW1lbnQobmV3IENocm9tYXRoKCdyZWQnKSk7XG4gID4geyByOiAwLCBnOiAyNTUsIGI6IDI1NSwgYTogMSwgaDogMTgwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9XG5cbiAgPiA+IENocm9tYXRoLmNvbXBsZW1lbnQobmV3IENocm9tYXRoKCdyZWQnKSkudG9TdHJpbmcoKTtcbiAgPiAnIzAwRkZGRidcbiAqL1xuQ2hyb21hdGguY29tcGxlbWVudCA9IGZ1bmN0aW9uIChjb2xvcilcbntcbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvcik7XG4gICAgdmFyIGhzbCA9IGMudG9IU0xPYmplY3QoKTtcblxuICAgIGhzbC5oID0gKGhzbC5oICsgMTgwKSAlIDM2MDtcblxuICAgIHJldHVybiBuZXcgQ2hyb21hdGgoaHNsKTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudHJpYWRcbiAgQ3JlYXRlIGEgdHJpYWQgY29sb3Igc2NoZW1lIGZyb20gdGhlIGdpdmVuIENocm9tYXRoLlxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGgudHJpYWQoQ2hyb21hdGgueWVsbG93KVxuICA+IFsgeyByOiAyNTUsIGc6IDI1NSwgYjogMCwgYTogMSwgaDogNjAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMjU1LCBhOiAxLCBoOiAxODAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDI1NSwgZzogMCwgYjogMjU1LCBhOiAxLCBoOiAzMDAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0gXVxuXG4gPiA+IENocm9tYXRoLnRyaWFkKENocm9tYXRoLnllbGxvdykudG9TdHJpbmcoKTtcbiA+ICcjRkZGRjAwLCMwMEZGRkYsI0ZGMDBGRidcbiovXG5DaHJvbWF0aC50cmlhZCA9IGZ1bmN0aW9uIChjb2xvcilcbntcbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvcik7XG5cbiAgICByZXR1cm4gW1xuICAgICAgICBjLFxuICAgICAgICBuZXcgQ2hyb21hdGgoe3I6IGMuYiwgZzogYy5yLCBiOiBjLmd9KSxcbiAgICAgICAgbmV3IENocm9tYXRoKHtyOiBjLmcsIGc6IGMuYiwgYjogYy5yfSlcbiAgICBdO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC50ZXRyYWRcbiAgQ3JlYXRlIGEgdGV0cmFkIGNvbG9yIHNjaGVtZSBmcm9tIHRoZSBnaXZlbiBDaHJvbWF0aC5cblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLnRldHJhZChDaHJvbWF0aC5jeWFuKVxuICA+IFsgeyByOiAwLCBnOiAyNTUsIGI6IDI1NSwgYTogMSwgaDogMTgwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9LFxuICA+ICAgeyByOiAyNTUsIGc6IDAsIGI6IDI1NSwgYTogMSwgaDogMzAwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9LFxuICA+ICAgeyByOiAyNTUsIGc6IDI1NSwgYjogMCwgYTogMSwgaDogNjAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMCwgYTogMSwgaDogMTIwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9IF1cblxuICA+ID4gQ2hyb21hdGgudGV0cmFkKENocm9tYXRoLmN5YW4pLnRvU3RyaW5nKCk7XG4gID4gJyMwMEZGRkYsI0ZGMDBGRiwjRkZGRjAwLCMwMEZGMDAnXG4qL1xuQ2hyb21hdGgudGV0cmFkID0gZnVuY3Rpb24gKGNvbG9yKVxue1xuICAgIHZhciBjID0gbmV3IENocm9tYXRoKGNvbG9yKTtcblxuICAgIHJldHVybiBbXG4gICAgICAgIGMsXG4gICAgICAgIG5ldyBDaHJvbWF0aCh7cjogYy5iLCBnOiBjLnIsIGI6IGMuYn0pLFxuICAgICAgICBuZXcgQ2hyb21hdGgoe3I6IGMuYiwgZzogYy5nLCBiOiBjLnJ9KSxcbiAgICAgICAgbmV3IENocm9tYXRoKHtyOiBjLnIsIGc6IGMuYiwgYjogYy5yfSlcbiAgICBdO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5hbmFsb2dvdXNcbiAgRmluZCBhbmFsb2dvdXMgY29sb3JzIGZyb20gYSBnaXZlbiBjb2xvclxuXG4gIFBhcmFtZXRlcnM6XG4gIG1peGVkIC0gQW55IGFyZ3VtZW50IHdoaWNoIGlzIHBhc3NlZCB0byA8Q2hyb21hdGg+XG4gIHJlc3VsdHMgLSBIb3cgbWFueSBjb2xvcnMgdG8gcmV0dXJuIChkZWZhdWx0ID0gMylcbiAgc2xpY2VzIC0gSG93IG1hbnkgcGllY2VzIGFyZSBpbiB0aGUgY29sb3Igd2hlZWwgKGRlZmF1bHQgPSAxMilcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmFuYWxvZ291cyhuZXcgQ2hyb21hdGgoJ3JnYigwLCAyNTUsIDI1NSknKSlcbiAgPiBbIHsgcjogMCwgZzogMjU1LCBiOiAyNTUsIGE6IDEsIGg6IDE4MCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMjU1LCBiOiAxMDEsIGE6IDEsIGg6IDE0NCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMjU1LCBiOiAxNTMsIGE6IDEsIGg6IDE1Niwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMjU1LCBiOiAyMDMsIGE6IDEsIGg6IDE2OCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMjU1LCBiOiAyNTUsIGE6IDEsIGg6IDE4MCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMjAzLCBiOiAyNTUsIGE6IDEsIGg6IDE5Miwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMTUzLCBiOiAyNTUsIGE6IDEsIGg6IDIwNCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMCwgZzogMTAxLCBiOiAyNTUsIGE6IDEsIGg6IDIxNiwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSBdXG5cbiAgPiA+IENocm9tYXRoLmFuYWxvZ291cyhuZXcgQ2hyb21hdGgoJ3JnYigwLCAyNTUsIDI1NSknKSkudG9TdHJpbmcoKVxuICA+ICcjMDBGRkZGLCMwMEZGNjUsIzAwRkY5OSwjMDBGRkNCLCMwMEZGRkYsIzAwQ0JGRiwjMDA5OUZGLCMwMDY1RkYnXG4gKi9cbkNocm9tYXRoLmFuYWxvZ291cyA9IGZ1bmN0aW9uIChjb2xvciwgcmVzdWx0cywgc2xpY2VzKVxue1xuICAgIGlmICghaXNGaW5pdGUocmVzdWx0cykpIHJlc3VsdHMgPSAzO1xuICAgIGlmICghaXNGaW5pdGUoc2xpY2VzKSkgc2xpY2VzID0gMTI7XG5cbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvcik7XG4gICAgdmFyIGhzdiA9IGMudG9IU1ZPYmplY3QoKTtcbiAgICB2YXIgc2xpY2UgPSAzNjAgLyBzbGljZXM7XG4gICAgdmFyIHJldCA9IFsgYyBdO1xuXG4gICAgaHN2LmggPSAoKGhzdi5oIC0gKHNsaWNlcyAqIHJlc3VsdHMgPj4gMSkpICsgNzIwKSAlIDM2MDtcbiAgICB3aGlsZSAoLS1yZXN1bHRzKSB7XG4gICAgICAgIGhzdi5oID0gKGhzdi5oICsgc2xpY2UpICUgMzYwO1xuICAgICAgICByZXQucHVzaChuZXcgQ2hyb21hdGgoaHN2KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgubW9ub2Nocm9tYXRpY1xuICBSZXR1cm4gYSBzZXJpZXMgb2YgdGhlIGdpdmVuIGNvbG9yIGF0IHZhcmlvdXMgbGlnaHRuZXNzZXNcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLm1vbm9jaHJvbWF0aWMoJ3JnYigwLCAxMDAsIDI1NSknKS5mb3JFYWNoKGZ1bmN0aW9uIChjKXsgY29uc29sZS5sb2coYy50b0hTVlN0cmluZygpKTsgfSlcbiAgPiBoc3YoMjE2LDEwMCUsMjAlKVxuICA+IGhzdigyMTYsMTAwJSw0MCUpXG4gID4gaHN2KDIxNiwxMDAlLDYwJSlcbiAgPiBoc3YoMjE2LDEwMCUsODAlKVxuICA+IGhzdigyMTYsMTAwJSwxMDAlKVxuKi9cbkNocm9tYXRoLm1vbm9jaHJvbWF0aWMgPSBmdW5jdGlvbiAoY29sb3IsIHJlc3VsdHMpXG57XG4gICAgaWYgKCFyZXN1bHRzKSByZXN1bHRzID0gNTtcblxuICAgIHZhciBjID0gbmV3IENocm9tYXRoKGNvbG9yKTtcbiAgICB2YXIgaHN2ID0gYy50b0hTVk9iamVjdCgpO1xuICAgIHZhciBpbmMgPSAxIC8gcmVzdWx0cztcbiAgICB2YXIgcmV0ID0gW10sIHN0ZXAgPSAwO1xuXG4gICAgd2hpbGUgKHN0ZXArKyA8IHJlc3VsdHMpIHtcbiAgICAgICAgaHN2LnYgPSBzdGVwICogaW5jO1xuICAgICAgICByZXQucHVzaChuZXcgQ2hyb21hdGgoaHN2KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguc3BsaXRjb21wbGVtZW50XG4gIEdlbmVyYXRlIGEgc3BsaXQgY29tcGxlbWVudCBjb2xvciBzY2hlbWUgZnJvbSB0aGUgZ2l2ZW4gY29sb3JcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLnNwbGl0Y29tcGxlbWVudCgncmdiKDAsIDEwMCwgMjU1KScpXG4gID4gWyB7IHI6IDAsIGc6IDEwMCwgYjogMjU1LCBoOiAyMTYuNDcwNTg4MjM1Mjk0MTQsIHNsOiAxLCBsOiAwLjUsIHN2OiAxLCB2OiAxLCBhOiAxIH0sXG4gID4gICB7IHI6IDI1NSwgZzogMTgzLCBiOiAwLCBoOiA0My4xOTk5OTk5OTk5OTk5OSwgc2w6IDEsIGw6IDAuNSwgc3Y6IDEsIHY6IDEsIGE6IDEgfSxcbiAgPiAgIHsgcjogMjU1LCBnOiA3MywgYjogMCwgaDogMTcuMjc5OTk5OTk5OTk5OTczLCBzbDogMSwgbDogMC41LCBzdjogMSwgdjogMSwgYTogMSB9IF1cblxuICA+ID4gQ2hyb21hdGguc3BsaXRjb21wbGVtZW50KCdyZ2IoMCwgMTAwLCAyNTUpJykudG9TdHJpbmcoKVxuICA+ICcjMDA2NEZGLCNGRkI3MDAsI0ZGNDkwMCdcbiAqL1xuQ2hyb21hdGguc3BsaXRjb21wbGVtZW50ID0gZnVuY3Rpb24gKGNvbG9yKVxue1xuICAgIHZhciByZWYgPSBuZXcgQ2hyb21hdGgoY29sb3IpO1xuICAgIHZhciBoc3YgPSByZWYudG9IU1ZPYmplY3QoKTtcblxuICAgIHZhciBhID0gbmV3IENocm9tYXRoLmhzdih7XG4gICAgICAgIGg6IChoc3YuaCArIDE1MCkgJSAzNjAsXG4gICAgICAgIHM6IGhzdi5zLFxuICAgICAgICB2OiBoc3YudlxuICAgIH0pO1xuXG4gICAgdmFyIGIgPSBuZXcgQ2hyb21hdGguaHN2KHtcbiAgICAgICAgaDogKGhzdi5oICsgMjEwKSAlIDM2MCxcbiAgICAgICAgczogaHN2LnMsXG4gICAgICAgIHY6IGhzdi52XG4gICAgfSk7XG5cbiAgICByZXR1cm4gW3JlZiwgYSwgYl07XG59O1xuXG4vL0dyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIGNvbG9yIGFsdGVyYXRpb25cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudGludFxuICBMaWdodGVuIGEgY29sb3IgYnkgYWRkaW5nIGEgcGVyY2VudGFnZSBvZiB3aGl0ZSB0byBpdFxuXG4gIFJldHVybnMgPENocm9tYXRoPlxuXG4gID4gPiBDaHJvbWF0aC50aW50KCdyZ2IoMCwgMTAwLCAyNTUpJywgMC41KS50b1JHQlN0cmluZygpO1xuICA+ICdyZ2IoMTI3LDE3NywyNTUpJ1xuKi9cbkNocm9tYXRoLnRpbnQgPSBmdW5jdGlvbiAoIGZyb20sIGJ5IClcbntcbiAgICByZXR1cm4gQ2hyb21hdGgudG93YXJkcyggZnJvbSwgJyNGRkZGRkYnLCBieSApO1xufTtcblxuLypcbiAgIE1ldGhvZDogQ2hyb21hdGgubGlnaHRlblxuICAgQWxpYXMgZm9yIDxDaHJvbWF0aC50aW50PlxuKi9cbkNocm9tYXRoLmxpZ2h0ZW4gPSBDaHJvbWF0aC50aW50O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnNoYWRlXG4gIERhcmtlbiBhIGNvbG9yIGJ5IGFkZGluZyBhIHBlcmNlbnRhZ2Ugb2YgYmxhY2sgdG8gaXRcblxuICBFeGFtcGxlOlxuICA+ID4gQ2hyb21hdGguZGFya2VuKCdyZ2IoMCwgMTAwLCAyNTUpJywgMC41KS50b1JHQlN0cmluZygpO1xuICA+ICdyZ2IoMCw1MCwxMjcpJ1xuICovXG5DaHJvbWF0aC5zaGFkZSA9IGZ1bmN0aW9uICggZnJvbSwgYnkgKVxue1xuICAgIHJldHVybiBDaHJvbWF0aC50b3dhcmRzKCBmcm9tLCAnIzAwMDAwMCcsIGJ5ICk7XG59O1xuXG4vKlxuICAgTWV0aG9kOiBDaHJvbWF0aC5kYXJrZW5cbiAgIEFsaWFzIGZvciA8Q2hyb21hdGguc2hhZGU+XG4gKi9cbkNocm9tYXRoLmRhcmtlbiA9IENocm9tYXRoLnNoYWRlO1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLmRlc2F0dXJhdGVcbiAgRGVzYXR1cmF0ZSBhIGNvbG9yIHVzaW5nIGFueSBvZiAzIGFwcHJvYWNoZXNcblxuICBQYXJhbWV0ZXJzOlxuICBjb2xvciAtIGFueSBhcmd1bWVudCBhY2NlcHRlZCBieSB0aGUgPENocm9tYXRoPiBjb25zdHJ1Y3RvclxuICBmb3JtdWxhIC0gVGhlIGZvcm11bGEgdG8gdXNlIChmcm9tIDx4YXJnJ3MgZ3JleWZpbHRlciBhdCBodHRwOi8vd3d3Lnhhcmcub3JnL3Byb2plY3QvanF1ZXJ5LWNvbG9yLXBsdWdpbi14Y29sb3I+KVxuICAtIDEgLSB4YXJnJ3Mgb3duIGZvcm11bGFcbiAgLSAyIC0gU3VuJ3MgZm9ybXVsYTogKDEgLSBhdmcpIC8gKDEwMCAvIDM1KSArIGF2ZylcbiAgLSBlbXB0eSAtIFRoZSBvZnQtc2VlbiAzMCUgcmVkLCA1OSUgZ3JlZW4sIDExJSBibHVlIGZvcm11bGFcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmRlc2F0dXJhdGUoJ3JlZCcpLnRvU3RyaW5nKClcbiAgPiBcIiM0QzRDNENcIlxuXG4gID4gPiBDaHJvbWF0aC5kZXNhdHVyYXRlKCdyZWQnLCAxKS50b1N0cmluZygpXG4gID4gXCIjMzczNzM3XCJcblxuICA+ID4gQ2hyb21hdGguZGVzYXR1cmF0ZSgncmVkJywgMikudG9TdHJpbmcoKVxuICA+IFwiIzkwOTA5MFwiXG4qL1xuQ2hyb21hdGguZGVzYXR1cmF0ZSA9IGZ1bmN0aW9uIChjb2xvciwgZm9ybXVsYSlcbntcbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvciksIHJnYiwgYXZnO1xuXG4gICAgc3dpdGNoIChmb3JtdWxhKSB7XG4gICAgY2FzZSAxOiAvLyB4YXJnJ3MgZm9ybXVsYVxuICAgICAgICBhdmcgPSAuMzUgKyAxMyAqIChjLnIgKyBjLmcgKyBjLmIpIC8gNjA7IGJyZWFrO1xuICAgIGNhc2UgMjogLy8gU3VuJ3MgZm9ybXVsYTogKDEgLSBhdmcpIC8gKDEwMCAvIDM1KSArIGF2ZylcbiAgICAgICAgYXZnID0gKDEzICogKGMuciArIGMuZyArIGMuYikgKyA1MzU1KSAvIDYwOyBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgICBhdmcgPSBjLnIgKiAuMyArIGMuZyAqIC41OSArIGMuYiAqIC4xMTtcbiAgICB9XG5cbiAgICBhdmcgPSB1dGlsLmNsYW1wKGF2ZywgMCwgMjU1KTtcbiAgICByZ2IgPSB7cjogYXZnLCBnOiBhdmcsIGI6IGF2Z307XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKHJnYik7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLmdyZXlzY2FsZVxuICBBbGlhcyBmb3IgPENocm9tYXRoLmRlc2F0dXJhdGU+XG4qL1xuQ2hyb21hdGguZ3JleXNjYWxlID0gQ2hyb21hdGguZGVzYXR1cmF0ZTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC53ZWJzYWZlXG4gIENvbnZlcnQgYSBjb2xvciB0byBvbmUgb2YgdGhlIDIxNiBcIndlYnNhZmVcIiBjb2xvcnNcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLndlYnNhZmUoJyNBQkNERUYnKS50b1N0cmluZygpXG4gID4gJyM5OUNDRkYnXG5cbiAgPiA+IENocm9tYXRoLndlYnNhZmUoJyNCQkNERUYnKS50b1N0cmluZygpXG4gID4gJyNDQ0NDRkYnXG4gKi9cbkNocm9tYXRoLndlYnNhZmUgPSBmdW5jdGlvbiAoY29sb3IpXG57XG4gICAgY29sb3IgPSBuZXcgQ2hyb21hdGgoY29sb3IpO1xuXG4gICAgY29sb3IuciA9IE1hdGgucm91bmQoY29sb3IuciAvIDUxKSAqIDUxO1xuICAgIGNvbG9yLmcgPSBNYXRoLnJvdW5kKGNvbG9yLmcgLyA1MSkgKiA1MTtcbiAgICBjb2xvci5iID0gTWF0aC5yb3VuZChjb2xvci5iIC8gNTEpICogNTE7XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKGNvbG9yKTtcbn07XG5cbi8vR3JvdXA6IFN0YXRpYyBtZXRob2RzIC0gY29sb3IgY29tYmluYXRpb25cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguYWRkaXRpdmVcbiAgQ29tYmluZSBhbnkgbnVtYmVyIGNvbG9ycyB1c2luZyBhZGRpdGl2ZSBjb2xvclxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGguYWRkaXRpdmUoJyNGMDAnLCAnIzBGMCcpLnRvU3RyaW5nKCk7XG4gID4gJyNGRkZGMDAnXG5cbiAgPiA+IENocm9tYXRoLmFkZGl0aXZlKCcjRjAwJywgJyMwRjAnKS50b1N0cmluZygpID09IENocm9tYXRoLnllbGxvdy50b1N0cmluZygpO1xuICA+IHRydWVcblxuICA+ID4gQ2hyb21hdGguYWRkaXRpdmUoJ3JlZCcsICcjMEYwJywgJ3JnYigwLCAwLCAyNTUpJykudG9TdHJpbmcoKSA9PSBDaHJvbWF0aC53aGl0ZS50b1N0cmluZygpO1xuICA+IHRydWVcbiAqL1xuQ2hyb21hdGguYWRkaXRpdmUgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aC0yLCBpPS0xLCBhLCBiO1xuICAgIHdoaWxlIChpKysgPCBhcmdzKXtcblxuICAgICAgICBhID0gYSB8fCBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2ldKTtcbiAgICAgICAgYiA9IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaSsxXSk7XG5cbiAgICAgICAgaWYgKChhLnIgKz0gYi5yKSA+IDI1NSkgYS5yID0gMjU1O1xuICAgICAgICBpZiAoKGEuZyArPSBiLmcpID4gMjU1KSBhLmcgPSAyNTU7XG4gICAgICAgIGlmICgoYS5iICs9IGIuYikgPiAyNTUpIGEuYiA9IDI1NTtcblxuICAgICAgICBhID0gbmV3IENocm9tYXRoKGEpO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5zdWJ0cmFjdGl2ZVxuICBDb21iaW5lIGFueSBudW1iZXIgb2YgY29sb3JzIHVzaW5nIHN1YnRyYWN0aXZlIGNvbG9yXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5zdWJ0cmFjdGl2ZSgneWVsbG93JywgJ21hZ2VudGEnKS50b1N0cmluZygpO1xuICA+ICcjRkYwMDAwJ1xuXG4gID4gPiBDaHJvbWF0aC5zdWJ0cmFjdGl2ZSgneWVsbG93JywgJ21hZ2VudGEnKS50b1N0cmluZygpID09PSBDaHJvbWF0aC5yZWQudG9TdHJpbmcoKTtcbiAgPiB0cnVlXG5cbiAgPiA+IENocm9tYXRoLnN1YnRyYWN0aXZlKCdjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93JykudG9TdHJpbmcoKTtcbiAgPiAnIzAwMDAwMCdcblxuICA+ID4gQ2hyb21hdGguc3VidHJhY3RpdmUoJ3JlZCcsICcjMEYwJywgJ3JnYigwLCAwLCAyNTUpJykudG9TdHJpbmcoKTtcbiAgPiAnIzAwMDAwMCdcbiovXG5DaHJvbWF0aC5zdWJ0cmFjdGl2ZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoLTIsIGk9LTEsIGEsIGI7XG4gICAgd2hpbGUgKGkrKyA8IGFyZ3Mpe1xuXG4gICAgICAgIGEgPSBhIHx8IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaV0pO1xuICAgICAgICBiID0gbmV3IENocm9tYXRoKGFyZ3VtZW50c1tpKzFdKTtcblxuICAgICAgICBpZiAoKGEuciArPSBiLnIgLSAyNTUpIDwgMCkgYS5yID0gMDtcbiAgICAgICAgaWYgKChhLmcgKz0gYi5nIC0gMjU1KSA8IDApIGEuZyA9IDA7XG4gICAgICAgIGlmICgoYS5iICs9IGIuYiAtIDI1NSkgPCAwKSBhLmIgPSAwO1xuXG4gICAgICAgIGEgPSBuZXcgQ2hyb21hdGgoYSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLm11bHRpcGx5XG4gIE11bHRpcGx5IGFueSBudW1iZXIgb2YgY29sb3JzXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5tdWx0aXBseShDaHJvbWF0aC5saWdodGdvbGRlbnJvZHllbGxvdywgQ2hyb21hdGgubGlnaHRibHVlKS50b1N0cmluZygpO1xuICA+IFwiI0E5RDNCRFwiXG5cbiAgPiA+IENocm9tYXRoLm11bHRpcGx5KENocm9tYXRoLm9sZGxhY2UsIENocm9tYXRoLmxpZ2h0Ymx1ZSwgQ2hyb21hdGguZGFya2JsdWUpLnRvU3RyaW5nKCk7XG4gID4gXCIjMDAwMDcwXCJcbiovXG5DaHJvbWF0aC5tdWx0aXBseSA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoLTIsIGk9LTEsIGEsIGI7XG4gICAgd2hpbGUgKGkrKyA8IGFyZ3Mpe1xuXG4gICAgICAgIGEgPSBhIHx8IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaV0pO1xuICAgICAgICBiID0gbmV3IENocm9tYXRoKGFyZ3VtZW50c1tpKzFdKTtcblxuICAgICAgICBhLnIgPSAoYS5yIC8gMjU1ICogYi5yKXwwO1xuICAgICAgICBhLmcgPSAoYS5nIC8gMjU1ICogYi5nKXwwO1xuICAgICAgICBhLmIgPSAoYS5iIC8gMjU1ICogYi5iKXwwO1xuXG4gICAgICAgIGEgPSBuZXcgQ2hyb21hdGgoYSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLmF2ZXJhZ2VcbiAgQXZlcmFnZXMgYW55IG51bWJlciBvZiBjb2xvcnNcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmF2ZXJhZ2UoQ2hyb21hdGgubGlnaHRnb2xkZW5yb2R5ZWxsb3csIENocm9tYXRoLmxpZ2h0Ymx1ZSkudG9TdHJpbmcoKVxuICA+IFwiI0QzRTlEQ1wiXG5cbiAgPiA+IENocm9tYXRoLmF2ZXJhZ2UoQ2hyb21hdGgub2xkbGFjZSwgQ2hyb21hdGgubGlnaHRibHVlLCBDaHJvbWF0aC5kYXJrYmx1ZSkudG9TdHJpbmcoKVxuICA+IFwiIzZBNzNCOFwiXG4gKi9cbkNocm9tYXRoLmF2ZXJhZ2UgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aC0yLCBpPS0xLCBhLCBiO1xuICAgIHdoaWxlIChpKysgPCBhcmdzKXtcblxuICAgICAgICBhID0gYSB8fCBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2ldKTtcbiAgICAgICAgYiA9IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaSsxXSk7XG5cbiAgICAgICAgYS5yID0gKGEuciArIGIucikgPj4gMTtcbiAgICAgICAgYS5nID0gKGEuZyArIGIuZykgPj4gMTtcbiAgICAgICAgYS5iID0gKGEuYiArIGIuYikgPj4gMTtcblxuICAgICAgICBhID0gbmV3IENocm9tYXRoKGEpO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5vdmVybGF5XG4gIEFkZCBvbmUgY29sb3Igb24gdG9wIG9mIGFub3RoZXIgd2l0aCBhIGdpdmVuIHRyYW5zcGFyZW5jeVxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGguYXZlcmFnZShDaHJvbWF0aC5saWdodGdvbGRlbnJvZHllbGxvdywgQ2hyb21hdGgubGlnaHRibHVlKS50b1N0cmluZygpXG4gID4gXCIjRDNFOURDXCJcblxuICA+ID4gQ2hyb21hdGguYXZlcmFnZShDaHJvbWF0aC5vbGRsYWNlLCBDaHJvbWF0aC5saWdodGJsdWUsIENocm9tYXRoLmRhcmtibHVlKS50b1N0cmluZygpXG4gID4gXCIjNkE3M0I4XCJcbiAqL1xuQ2hyb21hdGgub3ZlcmxheSA9IGZ1bmN0aW9uICh0b3AsIGJvdHRvbSwgb3BhY2l0eSlcbntcbiAgICB2YXIgYSA9IG5ldyBDaHJvbWF0aCh0b3ApO1xuICAgIHZhciBiID0gbmV3IENocm9tYXRoKGJvdHRvbSk7XG5cbiAgICBpZiAob3BhY2l0eSA+IDEpIG9wYWNpdHkgLz0gMTAwO1xuICAgIG9wYWNpdHkgPSB1dGlsLmNsYW1wKG9wYWNpdHkgLSAxICsgYi5hLCAwLCAxKTtcblxuICAgIHJldHVybiBuZXcgQ2hyb21hdGgoe1xuICAgICAgICByOiB1dGlsLmxlcnAoYS5yLCBiLnIsIG9wYWNpdHkpLFxuICAgICAgICBnOiB1dGlsLmxlcnAoYS5nLCBiLmcsIG9wYWNpdHkpLFxuICAgICAgICBiOiB1dGlsLmxlcnAoYS5iLCBiLmIsIG9wYWNpdHkpXG4gICAgfSk7XG59O1xuXG5cbi8vR3JvdXA6IFN0YXRpYyBtZXRob2RzIC0gb3RoZXJcbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudG93YXJkc1xuICBNb3ZlIGZyb20gb25lIGNvbG9yIHRvd2FyZHMgYW5vdGhlciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZSAoMC0xLCAwLTEwMClcblxuICBQYXJhbWV0ZXJzOlxuICBmcm9tIC0gVGhlIHN0YXJ0aW5nIGNvbG9yXG4gIHRvIC0gVGhlIGRlc3RpbmF0aW9uIGNvbG9yXG4gIGJ5IC0gVGhlIHBlcmNlbnRhZ2UsIGV4cHJlc3NlZCBhcyBhIGZsb2F0aW5nIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEsIHRvIG1vdmUgdG93YXJkcyB0aGUgZGVzdGluYXRpb24gY29sb3JcbiAgaW50ZXJwb2xhdG9yIC0gVGhlIGZ1bmN0aW9uIHRvIHVzZSBmb3IgaW50ZXJwb2xhdGluZyBiZXR3ZWVuIHRoZSB0d28gcG9pbnRzLiBEZWZhdWx0cyB0byBMaW5lYXIgSW50ZXJwb2xhdGlvbi4gRnVuY3Rpb24gaGFzIHRoZSBzaWduYXR1cmUgYChmcm9tLCB0bywgYnkpYCB3aXRoIHRoZSBwYXJhbWV0ZXJzIGhhdmluZyB0aGUgc2FtZSBtZWFuaW5nIGFzIHRob3NlIGluIGB0b3dhcmRzYC5cblxuICA+ID4gQ2hyb21hdGgudG93YXJkcygncmVkJywgJ3llbGxvdycsIDAuNSkudG9TdHJpbmcoKVxuICA+IFwiI0ZGN0YwMFwiXG4qL1xuQ2hyb21hdGgudG93YXJkcyA9IGZ1bmN0aW9uIChmcm9tLCB0bywgYnksIGludGVycG9sYXRvcilcbntcbiAgICBpZiAoIXRvKSB7IHJldHVybiBmcm9tOyB9XG4gICAgaWYgKCFpc0Zpbml0ZShieSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVHlwZUVycm9yOiBgYnlgKCcgKyBieSAgKycpIHNob3VsZCBiZSBiZXR3ZWVuIDAgYW5kIDEnKTtcbiAgICBpZiAoIShmcm9tIGluc3RhbmNlb2YgQ2hyb21hdGgpKSBmcm9tID0gbmV3IENocm9tYXRoKGZyb20pO1xuICAgIGlmICghKHRvIGluc3RhbmNlb2YgQ2hyb21hdGgpKSB0byA9IG5ldyBDaHJvbWF0aCh0byB8fCAnI0ZGRkZGRicpO1xuICAgIGlmICghaW50ZXJwb2xhdG9yKSBpbnRlcnBvbGF0b3IgPSB1dGlsLmxlcnA7XG4gICAgYnkgPSBwYXJzZUZsb2F0KGJ5KTtcblxuICAgIHJldHVybiBuZXcgQ2hyb21hdGgoe1xuICAgICAgICByOiBpbnRlcnBvbGF0b3IoZnJvbS5yLCB0by5yLCBieSksXG4gICAgICAgIGc6IGludGVycG9sYXRvcihmcm9tLmcsIHRvLmcsIGJ5KSxcbiAgICAgICAgYjogaW50ZXJwb2xhdG9yKGZyb20uYiwgdG8uYiwgYnkpLFxuICAgICAgICBhOiBpbnRlcnBvbGF0b3IoZnJvbS5hLCB0by5hLCBieSlcbiAgICB9KTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguZ3JhZGllbnRcbiAgQ3JlYXRlIGFuIGFycmF5IG9mIENocm9tYXRoIG9iamVjdHNcblxuICBQYXJhbWV0ZXJzOlxuICBmcm9tIC0gVGhlIGJlZ2lubmluZyBjb2xvciBvZiB0aGUgZ3JhZGllbnRcbiAgdG8gLSBUaGUgZW5kIGNvbG9yIG9mIHRoZSBncmFkaWVudFxuICBzbGljZXMgLSBUaGUgbnVtYmVyIG9mIGNvbG9ycyBpbiB0aGUgYXJyYXlcbiAgc2xpY2UgLSBUaGUgY29sb3IgYXQgYSBzcGVjaWZpYywgMS1iYXNlZCwgc2xpY2UgaW5kZXhcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmdyYWRpZW50KCdyZWQnLCAneWVsbG93JykubGVuZ3RoO1xuICA+IDIwXG5cbiAgPiA+IENocm9tYXRoLmdyYWRpZW50KCdyZWQnLCAneWVsbG93JywgNSkudG9TdHJpbmcoKTtcbiAgPiBcIiNGRjAwMDAsI0ZGM0YwMCwjRkY3RjAwLCNGRkJGMDAsI0ZGRkYwMFwiXG5cbiAgPiA+IENocm9tYXRoLmdyYWRpZW50KCdyZWQnLCAneWVsbG93JywgNSwgMikudG9TdHJpbmcoKTtcbiAgPiBcIiNGRjdGMDBcIlxuXG4gID4gPiBDaHJvbWF0aC5ncmFkaWVudCgncmVkJywgJ3llbGxvdycsIDUpWzJdLnRvU3RyaW5nKCk7XG4gID4gXCIjRkY3RjAwXCJcbiAqL1xuQ2hyb21hdGguZ3JhZGllbnQgPSBmdW5jdGlvbiAoZnJvbSwgdG8sIHNsaWNlcywgc2xpY2UpXG57XG4gICAgdmFyIGdyYWRpZW50ID0gW10sIHN0b3BzO1xuXG4gICAgaWYgKCEgc2xpY2VzKSBzbGljZXMgPSAyMDtcbiAgICBzdG9wcyA9IChzbGljZXMtMSk7XG5cbiAgICBpZiAoaXNGaW5pdGUoc2xpY2UpKSByZXR1cm4gQ2hyb21hdGgudG93YXJkcyhmcm9tLCB0bywgc2xpY2Uvc3RvcHMpO1xuICAgIGVsc2Ugc2xpY2UgPSAtMTtcblxuICAgIHdoaWxlICgrK3NsaWNlIDwgc2xpY2VzKXtcbiAgICAgICAgZ3JhZGllbnQucHVzaChDaHJvbWF0aC50b3dhcmRzKGZyb20sIHRvLCBzbGljZS9zdG9wcykpO1xuICAgIH1cblxuICAgIHJldHVybiBncmFkaWVudDtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgucGFyc2VcbiAgSXRlcmF0ZSB0aHJvdWdoIHRoZSBvYmplY3RzIHNldCBpbiBDaHJvbWF0aC5wYXJzZXJzIGFuZCwgaWYgYSBtYXRjaCBpcyBtYWRlLCByZXR1cm4gdGhlIHZhbHVlIHNwZWNpZmllZCBieSB0aGUgbWF0Y2hpbmcgcGFyc2VycyBgcHJvY2Vzc2AgZnVuY3Rpb25cblxuICBQYXJhbWV0ZXJzOlxuICBzdHJpbmcgLSBUaGUgc3RyaW5nIHRvIHBhcnNlXG5cbiAgRXhhbXBsZTpcbiAgPiA+IENocm9tYXRoLnBhcnNlKCdyZ2IoMCwgMTI4LCAyNTUpJylcbiAgPiB7IHI6IDAsIGc6IDEyOCwgYjogMjU1LCBhOiB1bmRlZmluZWQgfVxuICovXG5DaHJvbWF0aC5wYXJzZSA9IGZ1bmN0aW9uIChzdHJpbmcpXG57XG4gICAgdmFyIHBhcnNlcnMgPSBDaHJvbWF0aC5wYXJzZXJzLCBpLCBsLCBwYXJzZXIsIHBhcnRzLCBjaGFubmVscztcblxuICAgIGZvciAoaSA9IDAsIGwgPSBwYXJzZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBwYXJzZXIgPSBwYXJzZXJzW2ldO1xuICAgICAgICBwYXJ0cyA9IHBhcnNlci5yZWdleC5leGVjKHN0cmluZyk7XG4gICAgICAgIGlmIChwYXJ0cyAmJiBwYXJ0cy5sZW5ndGgpIGNoYW5uZWxzID0gcGFyc2VyLnByb2Nlc3MuYXBwbHkodGhpcywgcGFydHMpO1xuICAgICAgICBpZiAoY2hhbm5lbHMpIHJldHVybiBjaGFubmVscztcbiAgICB9XG59O1xuXG4vLyBHcm91cDogU3RhdGljIHByb3BlcnRpZXNcbi8qXG4gIFByb3BlcnR5OiBDaHJvbWF0aC5wYXJzZXJzXG4gICBBbiBhcnJheSBvZiBvYmplY3RzIGZvciBhdHRlbXB0aW5nIHRvIGNvbnZlcnQgYSBzdHJpbmcgZGVzY3JpYmluZyBhIGNvbG9yIGludG8gYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHZhcmlvdXMgY2hhbm5lbHMuIE5vIHVzZXIgYWN0aW9uIGlzIHJlcXVpcmVkIGJ1dCBwYXJzZXJzIGNhbiBiZVxuXG4gICBPYmplY3QgcHJvcGVydGllczpcbiAgIHJlZ2V4IC0gcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdGVzdCB0aGUgc3RyaW5nIG9yIG51bWVyaWMgaW5wdXRcbiAgIHByb2Nlc3MgLSBmdW5jdGlvbiB3aGljaCBpcyBwYXNzZWQgdGhlIHJlc3VsdHMgb2YgYHJlZ2V4Lm1hdGNoYCBhbmQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBlaXRoZXIgdGhlIHJnYiwgaHNsLCBoc3YsIG9yIGhzYiBjaGFubmVscyBvZiB0aGUgQ2hyb21hdGguXG5cbiAgIEV4YW1wbGVzOlxuKHN0YXJ0IGNvZGUpXG4vLyBBZGQgYSBwYXJzZXJcbkNocm9tYXRoLnBhcnNlcnMucHVzaCh7XG4gICAgZXhhbXBsZTogWzM1NTQ0MzEsIDE2ODA5OTg0XSxcbiAgICByZWdleDogL15cXGQrJC8sXG4gICAgcHJvY2VzczogZnVuY3Rpb24gKGNvbG9yKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IGNvbG9yID4+IDE2ICYgMjU1LFxuICAgICAgICAgICAgZzogY29sb3IgPj4gOCAmIDI1NSxcbiAgICAgICAgICAgIGI6IGNvbG9yICYgMjU1XG4gICAgICAgIH07XG4gICAgfVxufSk7XG4oZW5kIGNvZGUpXG4oc3RhcnQgY29kZSlcbi8vIE92ZXJyaWRlIGVudGlyZWx5XG5DaHJvbWF0aC5wYXJzZXJzID0gW1xuICAge1xuICAgICAgIGV4YW1wbGU6IFszNTU0NDMxLCAxNjgwOTk4NF0sXG4gICAgICAgcmVnZXg6IC9eXFxkKyQvLFxuICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChjb2xvcil7XG4gICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICByOiBjb2xvciA+PiAxNiAmIDI1NSxcbiAgICAgICAgICAgICAgIGc6IGNvbG9yID4+IDggJiAyNTUsXG4gICAgICAgICAgICAgICBiOiBjb2xvciAmIDI1NVxuICAgICAgICAgICB9O1xuICAgICAgIH1cbiAgIH0sXG5cbiAgIHtcbiAgICAgICBleGFtcGxlOiBbJyNmYjAnLCAnZjBmJ10sXG4gICAgICAgcmVnZXg6IC9eIz8oW1xcZEEtRl17MX0pKFtcXGRBLUZdezF9KShbXFxkQS1GXXsxfSkkL2ksXG4gICAgICAgcHJvY2VzczogZnVuY3Rpb24gKGhleCwgciwgZywgYil7XG4gICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICByOiBwYXJzZUludChyICsgciwgMTYpLFxuICAgICAgICAgICAgICAgZzogcGFyc2VJbnQoZyArIGcsIDE2KSxcbiAgICAgICAgICAgICAgIGI6IHBhcnNlSW50KGIgKyBiLCAxNilcbiAgICAgICAgICAgfTtcbiAgICAgICB9XG4gICB9XG4oZW5kIGNvZGUpXG4gKi9cbkNocm9tYXRoLnBhcnNlcnMgPSByZXF1aXJlKCcuL3BhcnNlcnMnKS5wYXJzZXJzO1xuXG4vLyBHcm91cDogSW5zdGFuY2UgbWV0aG9kcyAtIGNvbG9yIHJlcHJlc2VudGF0aW9uXG5DaHJvbWF0aC5wcm90b3R5cGUgPSByZXF1aXJlKCcuL3Byb3RvdHlwZScpKENocm9tYXRoKTtcblxuLypcbiAgUHJvcGVydHk6IENocm9tYXRoLmNvbG9yc1xuICBPYmplY3QsIGluZGV4ZWQgYnkgU1ZHL0NTUyBjb2xvciBuYW1lLCBvZiA8Q2hyb21hdGg+IGluc3RhbmNlc1xuICBUaGUgY29sb3IgbmFtZXMgZnJvbSBDU1MgYW5kIFNWRyAxLjBcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmNvbG9ycy5hbGljZWJsdWUudG9SR0JBcnJheSgpXG4gID4gWzI0MCwgMjQ4LCAyNTVdXG5cbiAgPiA+IENocm9tYXRoLmNvbG9ycy5iZWlnZS50b1N0cmluZygpXG4gID4gXCIjRjVGNURDXCJcblxuICA+IC8vIENhbiBhbHNvIGJlIGFjY2Vzc2VkIHdpdGhvdXQgYC5jb2xvcmBcbiAgPiA+IENocm9tYXRoLmFsaWNlYmx1ZS50b1JHQkFycmF5KClcbiAgPiBbMjQwLCAyNDgsIDI1NV1cblxuICA+ID4gQ2hyb21hdGguYmVpZ2UudG9TdHJpbmcoKVxuICA+IFwiI0Y1RjVEQ1wiXG4qL1xudmFyIGNzczJDb2xvcnMgID0gcmVxdWlyZSgnLi9jb2xvcm5hbWVzX2NzczInKTtcbnZhciBjc3MzQ29sb3JzICA9IHJlcXVpcmUoJy4vY29sb3JuYW1lc19jc3MzJyk7XG52YXIgYWxsQ29sb3JzICAgPSB1dGlsLm1lcmdlKHt9LCBjc3MyQ29sb3JzLCBjc3MzQ29sb3JzKTtcbkNocm9tYXRoLmNvbG9ycyA9IHt9O1xuZm9yICh2YXIgY29sb3JOYW1lIGluIGFsbENvbG9ycykge1xuICAgIC8vIGUuZy4sIENocm9tYXRoLndoZWF0IGFuZCBDaHJvbWF0aC5jb2xvcnMud2hlYXRcbiAgICBDaHJvbWF0aFtjb2xvck5hbWVdID0gQ2hyb21hdGguY29sb3JzW2NvbG9yTmFtZV0gPSBuZXcgQ2hyb21hdGgoYWxsQ29sb3JzW2NvbG9yTmFtZV0pO1xufVxuLy8gYWRkIGEgcGFyc2VyIGZvciB0aGUgY29sb3IgbmFtZXNcbkNocm9tYXRoLnBhcnNlcnMucHVzaCh7XG4gICAgZXhhbXBsZTogWydyZWQnLCAnYnVybHl3b29kJ10sXG4gICAgcmVnZXg6IC9eW2Etel0rJC9pLFxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChjb2xvck5hbWUpe1xuICAgICAgICBpZiAoQ2hyb21hdGguY29sb3JzW2NvbG9yTmFtZV0pIHJldHVybiBDaHJvbWF0aC5jb2xvcnNbY29sb3JOYW1lXTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaHJvbWF0aDtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vIGZyb20gaHR0cDovL3d3dy53My5vcmcvVFIvUkVDLWh0bWw0MC90eXBlcy5odG1sI2gtNi41XG4gICAgYXF1YSAgICA6IHtyOiAwLCAgIGc6IDI1NSwgYjogMjU1fSxcbiAgICBibGFjayAgIDoge3I6IDAsICAgZzogMCwgICBiOiAwfSxcbiAgICBibHVlICAgIDoge3I6IDAsICAgZzogMCwgICBiOiAyNTV9LFxuICAgIGZ1Y2hzaWEgOiB7cjogMjU1LCBnOiAwLCAgIGI6IDI1NX0sXG4gICAgZ3JheSAgICA6IHtyOiAxMjgsIGc6IDEyOCwgYjogMTI4fSxcbiAgICBncmVlbiAgIDoge3I6IDAsICAgZzogMTI4LCBiOiAwfSxcbiAgICBsaW1lICAgIDoge3I6IDAsICAgZzogMjU1LCBiOiAwfSxcbiAgICBtYXJvb24gIDoge3I6IDEyOCwgZzogMCwgICBiOiAwfSxcbiAgICBuYXZ5ICAgIDoge3I6IDAsICAgZzogMCwgICBiOiAxMjh9LFxuICAgIG9saXZlICAgOiB7cjogMTI4LCBnOiAxMjgsIGI6IDB9LFxuICAgIHB1cnBsZSAgOiB7cjogMTI4LCBnOiAwLCAgIGI6IDEyOH0sXG4gICAgcmVkICAgICA6IHtyOiAyNTUsIGc6IDAsICAgYjogMH0sXG4gICAgc2lsdmVyICA6IHtyOiAxOTIsIGc6IDE5MiwgYjogMTkyfSxcbiAgICB0ZWFsICAgIDoge3I6IDAsICAgZzogMTI4LCBiOiAxMjh9LFxuICAgIHdoaXRlICAgOiB7cjogMjU1LCBnOiAyNTUsIGI6IDI1NX0sXG4gICAgeWVsbG93ICA6IHtyOiAyNTUsIGc6IDI1NSwgYjogMH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLWNvbG9yLyNzdmctY29sb3JcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvdHlwZXMuaHRtbCNDb2xvcktleXdvcmRzXG4gICAgYWxpY2VibHVlICAgICAgICAgICAgOiB7cjogMjQwLCBnOiAyNDgsIGI6IDI1NX0sXG4gICAgYW50aXF1ZXdoaXRlICAgICAgICAgOiB7cjogMjUwLCBnOiAyMzUsIGI6IDIxNX0sXG4gICAgYXF1YW1hcmluZSAgICAgICAgICAgOiB7cjogMTI3LCBnOiAyNTUsIGI6IDIxMn0sXG4gICAgYXp1cmUgICAgICAgICAgICAgICAgOiB7cjogMjQwLCBnOiAyNTUsIGI6IDI1NX0sXG4gICAgYmVpZ2UgICAgICAgICAgICAgICAgOiB7cjogMjQ1LCBnOiAyNDUsIGI6IDIyMH0sXG4gICAgYmlzcXVlICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyMjgsIGI6IDE5Nn0sXG4gICAgYmxhbmNoZWRhbG1vbmQgICAgICAgOiB7cjogMjU1LCBnOiAyMzUsIGI6IDIwNX0sXG4gICAgYmx1ZXZpb2xldCAgICAgICAgICAgOiB7cjogMTM4LCBnOiA0MywgIGI6IDIyNn0sXG4gICAgYnJvd24gICAgICAgICAgICAgICAgOiB7cjogMTY1LCBnOiA0MiwgIGI6IDQyfSxcbiAgICBidXJseXdvb2QgICAgICAgICAgICA6IHtyOiAyMjIsIGc6IDE4NCwgYjogMTM1fSxcbiAgICBjYWRldGJsdWUgICAgICAgICAgICA6IHtyOiA5NSwgIGc6IDE1OCwgYjogMTYwfSxcbiAgICBjaGFydHJldXNlICAgICAgICAgICA6IHtyOiAxMjcsIGc6IDI1NSwgYjogMH0sXG4gICAgY2hvY29sYXRlICAgICAgICAgICAgOiB7cjogMjEwLCBnOiAxMDUsIGI6IDMwfSxcbiAgICBjb3JhbCAgICAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDEyNywgYjogODB9LFxuICAgIGNvcm5mbG93ZXJibHVlICAgICAgIDoge3I6IDEwMCwgZzogMTQ5LCBiOiAyMzd9LFxuICAgIGNvcm5zaWxrICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjQ4LCBiOiAyMjB9LFxuICAgIGNyaW1zb24gICAgICAgICAgICAgIDoge3I6IDIyMCwgZzogMjAsICBiOiA2MH0sXG4gICAgY3lhbiAgICAgICAgICAgICAgICAgOiB7cjogMCwgICBnOiAyNTUsIGI6IDI1NX0sXG4gICAgZGFya2JsdWUgICAgICAgICAgICAgOiB7cjogMCwgICBnOiAwLCAgIGI6IDEzOX0sXG4gICAgZGFya2N5YW4gICAgICAgICAgICAgOiB7cjogMCwgICBnOiAxMzksIGI6IDEzOX0sXG4gICAgZGFya2dvbGRlbnJvZCAgICAgICAgOiB7cjogMTg0LCBnOiAxMzQsIGI6IDExfSxcbiAgICBkYXJrZ3JheSAgICAgICAgICAgICA6IHtyOiAxNjksIGc6IDE2OSwgYjogMTY5fSxcbiAgICBkYXJrZ3JlZW4gICAgICAgICAgICA6IHtyOiAwLCAgIGc6IDEwMCwgYjogMH0sXG4gICAgZGFya2dyZXkgICAgICAgICAgICAgOiB7cjogMTY5LCBnOiAxNjksIGI6IDE2OX0sXG4gICAgZGFya2toYWtpICAgICAgICAgICAgOiB7cjogMTg5LCBnOiAxODMsIGI6IDEwN30sXG4gICAgZGFya21hZ2VudGEgICAgICAgICAgOiB7cjogMTM5LCBnOiAwLCAgIGI6IDEzOX0sXG4gICAgZGFya29saXZlZ3JlZW4gICAgICAgOiB7cjogODUsICBnOiAxMDcsIGI6IDQ3fSxcbiAgICBkYXJrb3JhbmdlICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDE0MCwgYjogMH0sXG4gICAgZGFya29yY2hpZCAgICAgICAgICAgOiB7cjogMTUzLCBnOiA1MCwgIGI6IDIwNH0sXG4gICAgZGFya3JlZCAgICAgICAgICAgICAgOiB7cjogMTM5LCBnOiAwLCAgIGI6IDB9LFxuICAgIGRhcmtzYWxtb24gICAgICAgICAgIDoge3I6IDIzMywgZzogMTUwLCBiOiAxMjJ9LFxuICAgIGRhcmtzZWFncmVlbiAgICAgICAgIDoge3I6IDE0MywgZzogMTg4LCBiOiAxNDN9LFxuICAgIGRhcmtzbGF0ZWJsdWUgICAgICAgIDoge3I6IDcyLCAgZzogNjEsICBiOiAxMzl9LFxuICAgIGRhcmtzbGF0ZWdyYXkgICAgICAgIDoge3I6IDQ3LCAgZzogNzksICBiOiA3OX0sXG4gICAgZGFya3NsYXRlZ3JleSAgICAgICAgOiB7cjogNDcsICBnOiA3OSwgIGI6IDc5fSxcbiAgICBkYXJrdHVycXVvaXNlICAgICAgICA6IHtyOiAwLCAgIGc6IDIwNiwgYjogMjA5fSxcbiAgICBkYXJrdmlvbGV0ICAgICAgICAgICA6IHtyOiAxNDgsIGc6IDAsICAgYjogMjExfSxcbiAgICBkZWVwcGluayAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIwLCAgYjogMTQ3fSxcbiAgICBkZWVwc2t5Ymx1ZSAgICAgICAgICA6IHtyOiAwLCAgIGc6IDE5MSwgYjogMjU1fSxcbiAgICBkaW1ncmF5ICAgICAgICAgICAgICA6IHtyOiAxMDUsIGc6IDEwNSwgYjogMTA1fSxcbiAgICBkaW1ncmV5ICAgICAgICAgICAgICA6IHtyOiAxMDUsIGc6IDEwNSwgYjogMTA1fSxcbiAgICBkb2RnZXJibHVlICAgICAgICAgICA6IHtyOiAzMCwgIGc6IDE0NCwgYjogMjU1fSxcbiAgICBmaXJlYnJpY2sgICAgICAgICAgICA6IHtyOiAxNzgsIGc6IDM0LCAgYjogMzR9LFxuICAgIGZsb3JhbHdoaXRlICAgICAgICAgIDoge3I6IDI1NSwgZzogMjUwLCBiOiAyNDB9LFxuICAgIGZvcmVzdGdyZWVuICAgICAgICAgIDoge3I6IDM0LCAgZzogMTM5LCBiOiAzNH0sXG4gICAgZ2FpbnNib3JvICAgICAgICAgICAgOiB7cjogMjIwLCBnOiAyMjAsIGI6IDIyMH0sXG4gICAgZ2hvc3R3aGl0ZSAgICAgICAgICAgOiB7cjogMjQ4LCBnOiAyNDgsIGI6IDI1NX0sXG4gICAgZ29sZCAgICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyMTUsIGI6IDB9LFxuICAgIGdvbGRlbnJvZCAgICAgICAgICAgIDoge3I6IDIxOCwgZzogMTY1LCBiOiAzMn0sXG4gICAgZ3JlZW55ZWxsb3cgICAgICAgICAgOiB7cjogMTczLCBnOiAyNTUsIGI6IDQ3fSxcbiAgICBncmV5ICAgICAgICAgICAgICAgICA6IHtyOiAxMjgsIGc6IDEyOCwgYjogMTI4fSxcbiAgICBob25leWRldyAgICAgICAgICAgICA6IHtyOiAyNDAsIGc6IDI1NSwgYjogMjQwfSxcbiAgICBob3RwaW5rICAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDEwNSwgYjogMTgwfSxcbiAgICBpbmRpYW5yZWQgICAgICAgICAgICA6IHtyOiAyMDUsIGc6IDkyLCAgYjogOTJ9LFxuICAgIGluZGlnbyAgICAgICAgICAgICAgIDoge3I6IDc1LCAgZzogMCwgICBiOiAxMzB9LFxuICAgIGl2b3J5ICAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjU1LCBiOiAyNDB9LFxuICAgIGtoYWtpICAgICAgICAgICAgICAgIDoge3I6IDI0MCwgZzogMjMwLCBiOiAxNDB9LFxuICAgIGxhdmVuZGVyICAgICAgICAgICAgIDoge3I6IDIzMCwgZzogMjMwLCBiOiAyNTB9LFxuICAgIGxhdmVuZGVyYmx1c2ggICAgICAgIDoge3I6IDI1NSwgZzogMjQwLCBiOiAyNDV9LFxuICAgIGxhd25ncmVlbiAgICAgICAgICAgIDoge3I6IDEyNCwgZzogMjUyLCBiOiAwfSxcbiAgICBsZW1vbmNoaWZmb24gICAgICAgICA6IHtyOiAyNTUsIGc6IDI1MCwgYjogMjA1fSxcbiAgICBsaWdodGJsdWUgICAgICAgICAgICA6IHtyOiAxNzMsIGc6IDIxNiwgYjogMjMwfSxcbiAgICBsaWdodGNvcmFsICAgICAgICAgICA6IHtyOiAyNDAsIGc6IDEyOCwgYjogMTI4fSxcbiAgICBsaWdodGN5YW4gICAgICAgICAgICA6IHtyOiAyMjQsIGc6IDI1NSwgYjogMjU1fSxcbiAgICBsaWdodGdvbGRlbnJvZHllbGxvdyA6IHtyOiAyNTAsIGc6IDI1MCwgYjogMjEwfSxcbiAgICBsaWdodGdyYXkgICAgICAgICAgICA6IHtyOiAyMTEsIGc6IDIxMSwgYjogMjExfSxcbiAgICBsaWdodGdyZWVuICAgICAgICAgICA6IHtyOiAxNDQsIGc6IDIzOCwgYjogMTQ0fSxcbiAgICBsaWdodGdyZXkgICAgICAgICAgICA6IHtyOiAyMTEsIGc6IDIxMSwgYjogMjExfSxcbiAgICBsaWdodHBpbmsgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDE4MiwgYjogMTkzfSxcbiAgICBsaWdodHNhbG1vbiAgICAgICAgICA6IHtyOiAyNTUsIGc6IDE2MCwgYjogMTIyfSxcbiAgICBsaWdodHNlYWdyZWVuICAgICAgICA6IHtyOiAzMiwgIGc6IDE3OCwgYjogMTcwfSxcbiAgICBsaWdodHNreWJsdWUgICAgICAgICA6IHtyOiAxMzUsIGc6IDIwNiwgYjogMjUwfSxcbiAgICBsaWdodHNsYXRlZ3JheSAgICAgICA6IHtyOiAxMTksIGc6IDEzNiwgYjogMTUzfSxcbiAgICBsaWdodHNsYXRlZ3JleSAgICAgICA6IHtyOiAxMTksIGc6IDEzNiwgYjogMTUzfSxcbiAgICBsaWdodHN0ZWVsYmx1ZSAgICAgICA6IHtyOiAxNzYsIGc6IDE5NiwgYjogMjIyfSxcbiAgICBsaWdodHllbGxvdyAgICAgICAgICA6IHtyOiAyNTUsIGc6IDI1NSwgYjogMjI0fSxcbiAgICBsaW1lZ3JlZW4gICAgICAgICAgICA6IHtyOiA1MCwgIGc6IDIwNSwgYjogNTB9LFxuICAgIGxpbmVuICAgICAgICAgICAgICAgIDoge3I6IDI1MCwgZzogMjQwLCBiOiAyMzB9LFxuICAgIG1hZ2VudGEgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMCwgICBiOiAyNTV9LFxuICAgIG1lZGl1bWFxdWFtYXJpbmUgICAgIDoge3I6IDEwMiwgZzogMjA1LCBiOiAxNzB9LFxuICAgIG1lZGl1bWJsdWUgICAgICAgICAgIDoge3I6IDAsICAgZzogMCwgICBiOiAyMDV9LFxuICAgIG1lZGl1bW9yY2hpZCAgICAgICAgIDoge3I6IDE4NiwgZzogODUsICBiOiAyMTF9LFxuICAgIG1lZGl1bXB1cnBsZSAgICAgICAgIDoge3I6IDE0NywgZzogMTEyLCBiOiAyMTl9LFxuICAgIG1lZGl1bXNlYWdyZWVuICAgICAgIDoge3I6IDYwLCAgZzogMTc5LCBiOiAxMTN9LFxuICAgIG1lZGl1bXNsYXRlYmx1ZSAgICAgIDoge3I6IDEyMywgZzogMTA0LCBiOiAyMzh9LFxuICAgIG1lZGl1bXNwcmluZ2dyZWVuICAgIDoge3I6IDAsICAgZzogMjUwLCBiOiAxNTR9LFxuICAgIG1lZGl1bXR1cnF1b2lzZSAgICAgIDoge3I6IDcyLCAgZzogMjA5LCBiOiAyMDR9LFxuICAgIG1lZGl1bXZpb2xldHJlZCAgICAgIDoge3I6IDE5OSwgZzogMjEsICBiOiAxMzN9LFxuICAgIG1pZG5pZ2h0Ymx1ZSAgICAgICAgIDoge3I6IDI1LCAgZzogMjUsICBiOiAxMTJ9LFxuICAgIG1pbnRjcmVhbSAgICAgICAgICAgIDoge3I6IDI0NSwgZzogMjU1LCBiOiAyNTB9LFxuICAgIG1pc3R5cm9zZSAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjI4LCBiOiAyMjV9LFxuICAgIG1vY2Nhc2luICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjI4LCBiOiAxODF9LFxuICAgIG5hdmFqb3doaXRlICAgICAgICAgIDoge3I6IDI1NSwgZzogMjIyLCBiOiAxNzN9LFxuICAgIG9sZGxhY2UgICAgICAgICAgICAgIDoge3I6IDI1MywgZzogMjQ1LCBiOiAyMzB9LFxuICAgIG9saXZlZHJhYiAgICAgICAgICAgIDoge3I6IDEwNywgZzogMTQyLCBiOiAzNX0sXG4gICAgb3JhbmdlICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAxNjUsIGI6IDB9LFxuICAgIG9yYW5nZXJlZCAgICAgICAgICAgIDoge3I6IDI1NSwgZzogNjksICBiOiAwfSxcbiAgICBvcmNoaWQgICAgICAgICAgICAgICA6IHtyOiAyMTgsIGc6IDExMiwgYjogMjE0fSxcbiAgICBwYWxlZ29sZGVucm9kICAgICAgICA6IHtyOiAyMzgsIGc6IDIzMiwgYjogMTcwfSxcbiAgICBwYWxlZ3JlZW4gICAgICAgICAgICA6IHtyOiAxNTIsIGc6IDI1MSwgYjogMTUyfSxcbiAgICBwYWxldHVycXVvaXNlICAgICAgICA6IHtyOiAxNzUsIGc6IDIzOCwgYjogMjM4fSxcbiAgICBwYWxldmlvbGV0cmVkICAgICAgICA6IHtyOiAyMTksIGc6IDExMiwgYjogMTQ3fSxcbiAgICBwYXBheWF3aGlwICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIzOSwgYjogMjEzfSxcbiAgICBwZWFjaHB1ZmYgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIxOCwgYjogMTg1fSxcbiAgICBwZXJ1ICAgICAgICAgICAgICAgICA6IHtyOiAyMDUsIGc6IDEzMywgYjogNjN9LFxuICAgIHBpbmsgICAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMTkyLCBiOiAyMDN9LFxuICAgIHBsdW0gICAgICAgICAgICAgICAgIDoge3I6IDIyMSwgZzogMTYwLCBiOiAyMjF9LFxuICAgIHBvd2RlcmJsdWUgICAgICAgICAgIDoge3I6IDE3NiwgZzogMjI0LCBiOiAyMzB9LFxuICAgIHJvc3licm93biAgICAgICAgICAgIDoge3I6IDE4OCwgZzogMTQzLCBiOiAxNDN9LFxuICAgIHJveWFsYmx1ZSAgICAgICAgICAgIDoge3I6IDY1LCAgZzogMTA1LCBiOiAyMjV9LFxuICAgIHNhZGRsZWJyb3duICAgICAgICAgIDoge3I6IDEzOSwgZzogNjksICBiOiAxOX0sXG4gICAgc2FsbW9uICAgICAgICAgICAgICAgOiB7cjogMjUwLCBnOiAxMjgsIGI6IDExNH0sXG4gICAgc2FuZHlicm93biAgICAgICAgICAgOiB7cjogMjQ0LCBnOiAxNjQsIGI6IDk2fSxcbiAgICBzZWFncmVlbiAgICAgICAgICAgICA6IHtyOiA0NiwgIGc6IDEzOSwgYjogODd9LFxuICAgIHNlYXNoZWxsICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjQ1LCBiOiAyMzh9LFxuICAgIHNpZW5uYSAgICAgICAgICAgICAgIDoge3I6IDE2MCwgZzogODIsICBiOiA0NX0sXG4gICAgc2t5Ymx1ZSAgICAgICAgICAgICAgOiB7cjogMTM1LCBnOiAyMDYsIGI6IDIzNX0sXG4gICAgc2xhdGVibHVlICAgICAgICAgICAgOiB7cjogMTA2LCBnOiA5MCwgIGI6IDIwNX0sXG4gICAgc2xhdGVncmF5ICAgICAgICAgICAgOiB7cjogMTEyLCBnOiAxMjgsIGI6IDE0NH0sXG4gICAgc2xhdGVncmV5ICAgICAgICAgICAgOiB7cjogMTEyLCBnOiAxMjgsIGI6IDE0NH0sXG4gICAgc25vdyAgICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyNTAsIGI6IDI1MH0sXG4gICAgc3ByaW5nZ3JlZW4gICAgICAgICAgOiB7cjogMCwgICBnOiAyNTUsIGI6IDEyN30sXG4gICAgc3RlZWxibHVlICAgICAgICAgICAgOiB7cjogNzAsICBnOiAxMzAsIGI6IDE4MH0sXG4gICAgdGFuICAgICAgICAgICAgICAgICAgOiB7cjogMjEwLCBnOiAxODAsIGI6IDE0MH0sXG4gICAgdGhpc3RsZSAgICAgICAgICAgICAgOiB7cjogMjE2LCBnOiAxOTEsIGI6IDIxNn0sXG4gICAgdG9tYXRvICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiA5OSwgIGI6IDcxfSxcbiAgICB0dXJxdW9pc2UgICAgICAgICAgICA6IHtyOiA2NCwgIGc6IDIyNCwgYjogMjA4fSxcbiAgICB2aW9sZXQgICAgICAgICAgICAgICA6IHtyOiAyMzgsIGc6IDEzMCwgYjogMjM4fSxcbiAgICB3aGVhdCAgICAgICAgICAgICAgICA6IHtyOiAyNDUsIGc6IDIyMiwgYjogMTc5fSxcbiAgICB3aGl0ZXNtb2tlICAgICAgICAgICA6IHtyOiAyNDUsIGc6IDI0NSwgYjogMjQ1fSxcbiAgICB5ZWxsb3dncmVlbiAgICAgICAgICA6IHtyOiAxNTQsIGc6IDIwNSwgYjogNTB9XG59XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV4YW1wbGU6IFszNTU0NDMxLCAxNjgwOTk4NF0sXG4gICAgICAgICAgICByZWdleDogL15cXGQrJC8sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoY29sb3Ipe1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIC8vYTogY29sb3IgPj4gMjQgJiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIHI6IGNvbG9yID4+IDE2ICYgMjU1LFxuICAgICAgICAgICAgICAgICAgICBnOiBjb2xvciA+PiA4ICYgMjU1LFxuICAgICAgICAgICAgICAgICAgICBiOiBjb2xvciAmIDI1NVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAge1xuICAgICAgICAgICAgZXhhbXBsZTogWycjZmIwJywgJ2YwZiddLFxuICAgICAgICAgICAgcmVnZXg6IC9eIz8oW1xcZEEtRl17MX0pKFtcXGRBLUZdezF9KShbXFxkQS1GXXsxfSkkL2ksXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoaGV4LCByLCBnLCBiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByOiBwYXJzZUludChyICsgciwgMTYpLFxuICAgICAgICAgICAgICAgICAgICBnOiBwYXJzZUludChnICsgZywgMTYpLFxuICAgICAgICAgICAgICAgICAgICBiOiBwYXJzZUludChiICsgYiwgMTYpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB7XG4gICAgICAgICAgICBleGFtcGxlOiBbJyMwMGZmMDAnLCAnMzM2Njk5J10sXG4gICAgICAgICAgICByZWdleDogL14jPyhbXFxkQS1GXXsyfSkoW1xcZEEtRl17Mn0pKFtcXGRBLUZdezJ9KSQvaSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChoZXgsIHIsIGcsIGIpe1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHI6IHBhcnNlSW50KHIsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgZzogcGFyc2VJbnQoZywgMTYpLFxuICAgICAgICAgICAgICAgICAgICBiOiBwYXJzZUludChiLCAxNilcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV4YW1wbGU6IFsncmdiKDEyMywgMjM0LCA0NSknLCAncmdiKDI1LCA1MCUsIDEwMCUpJywgJ3JnYmEoMTIlLCAzNCwgNTYlLCAwLjc4KSddLFxuICAgICAgICAgICAgLy8gcmVnZXg6IC9ecmdiYSpcXCgoXFxkezEsM31cXCUqKSxcXHMqKFxcZHsxLDN9XFwlKiksXFxzKihcXGR7MSwzfVxcJSopKD86LFxccyooWzAtOS5dKykpP1xcKS8sXG4gICAgICAgICAgICByZWdleDogL15yZ2JhKlxcKChbMC05XSpcXC4/WzAtOV0rXFwlKiksXFxzKihbMC05XSpcXC4/WzAtOV0rXFwlKiksXFxzKihbMC05XSpcXC4/WzAtOV0rXFwlKikoPzosXFxzKihbMC05Ll0rKSk/XFwpLyxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChzLHIsZyxiLGEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgciA9IHIgJiYgci5zbGljZSgtMSkgPT0gJyUnID8gKHIuc2xpY2UoMCwtMSkgLyAxMDApIDogcioxO1xuICAgICAgICAgICAgICAgIGcgPSBnICYmIGcuc2xpY2UoLTEpID09ICclJyA/IChnLnNsaWNlKDAsLTEpIC8gMTAwKSA6IGcqMTtcbiAgICAgICAgICAgICAgICBiID0gYiAmJiBiLnNsaWNlKC0xKSA9PSAnJScgPyAoYi5zbGljZSgwLC0xKSAvIDEwMCkgOiBiKjE7XG4gICAgICAgICAgICAgICAgYSA9IGEqMTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHI6IHV0aWwuY2xhbXAociwgMCwgMjU1KSxcbiAgICAgICAgICAgICAgICAgICAgZzogdXRpbC5jbGFtcChnLCAwLCAyNTUpLFxuICAgICAgICAgICAgICAgICAgICBiOiB1dGlsLmNsYW1wKGIsIDAsIDI1NSksXG4gICAgICAgICAgICAgICAgICAgIGE6IHV0aWwuY2xhbXAoYSwgMCwgMSkgfHwgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB7XG4gICAgICAgICAgICBleGFtcGxlOiBbJ2hzbCgxMjMsIDM0JSwgNDUlKScsICdoc2xhKDI1LCA1MCUsIDEwMCUsIDAuNzUpJywgJ2hzdigxMiwgMzQlLCA1NiUpJ10sXG4gICAgICAgICAgICByZWdleDogL15ocyhbYnZsXSlhKlxcKChcXGR7MSwzfVxcJSopLFxccyooXFxkezEsM31cXCUqKSxcXHMqKFxcZHsxLDN9XFwlKikoPzosXFxzKihbMC05Ll0rKSk/XFwpLyxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChjLGx2LGgscyxsLGEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaCAqPSAxO1xuICAgICAgICAgICAgICAgIHMgPSBzLnNsaWNlKDAsLTEpIC8gMTAwO1xuICAgICAgICAgICAgICAgIGwgPSBsLnNsaWNlKDAsLTEpIC8gMTAwO1xuICAgICAgICAgICAgICAgIGEgKj0gMTtcblxuICAgICAgICAgICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgICAgICAgICAgIGg6IHV0aWwuY2xhbXAoaCwgMCwgMzYwKSxcbiAgICAgICAgICAgICAgICAgICAgYTogdXRpbC5jbGFtcChsLCAwLCAxKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gYHNgIGlzIHVzZWQgaW4gbWFueSBkaWZmZXJlbnQgc3BhY2VzIChIU0wsIEhTViwgSFNCKVxuICAgICAgICAgICAgICAgIC8vIHNvIHdlIHVzZSBgc2xgLCBgc3ZgIGFuZCBgc2JgIHRvIGRpZmZlcmVudGlhdGVcbiAgICAgICAgICAgICAgICBvYmpbJ3MnK2x2XSA9IHV0aWwuY2xhbXAocywgMCwgMSksXG4gICAgICAgICAgICAgICAgb2JqW2x2XSA9IHV0aWwuY2xhbXAobCwgMCwgMSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgXVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2hyb21hdGhQcm90b3R5cGUoQ2hyb21hdGgpIHtcbiAgcmV0dXJuIHtcbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvTmFtZVxuICAgICAgICAgQ2FsbCA8Q2hyb21hdGgudG9OYW1lPiBvbiB0aGUgY3VycmVudCBpbnN0YW5jZVxuICAgICAgICAgPiA+IHZhciBjb2xvciA9IG5ldyBDaHJvbWF0aCgncmdiKDE3MywgMjE2LCAyMzApJyk7XG4gICAgICAgICA+ID4gY29sb3IudG9OYW1lKCk7XG4gICAgICAgICA+IFwibGlnaHRibHVlXCJcbiAgICAgICovXG4gICAgICB0b05hbWU6IGZ1bmN0aW9uICgpeyByZXR1cm4gQ2hyb21hdGgudG9OYW1lKHRoaXMpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1N0cmluZ1xuICAgICAgICAgRGlzcGxheSB0aGUgaW5zdGFuY2UgYXMgYSBzdHJpbmcuIERlZmF1bHRzIHRvIDxDaHJvbWF0aC50b0hleFN0cmluZz5cbiAgICAgICAgID4gPiB2YXIgY29sb3IgPSBDaHJvbWF0aC5yZ2IoNTYsIDc4LCA5MCk7XG4gICAgICAgICA+ID4gQ29sb3IudG9IZXhTdHJpbmcoKTtcbiAgICAgICAgID4gXCIjMzg0RTVBXCJcbiAgICAgICovXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLnRvSGV4U3RyaW5nKCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHZhbHVlT2ZcbiAgICAgICAgIERpc3BsYXkgdGhlIGluc3RhbmNlIGFzIGFuIGludGVnZXIuIERlZmF1bHRzIHRvIDxDaHJvbWF0aC50b0ludGVnZXI+XG4gICAgICAgICA+ID4gdmFyIHllbGxvdyA9IG5ldyBDaHJvbWF0aCgneWVsbG93Jyk7XG4gICAgICAgICA+ID4geWVsbG93LnZhbHVlT2YoKTtcbiAgICAgICAgID4gMTY3NzY5NjBcbiAgICAgICAgID4gPiAreWVsbG93XG4gICAgICAgICA+IDE2Nzc2OTYwXG4gICAgICAqL1xuICAgICAgdmFsdWVPZjogZnVuY3Rpb24gKCl7IHJldHVybiBDaHJvbWF0aC50b0ludGVnZXIodGhpcyk7IH0sXG5cbiAgICAvKlxuICAgICAgIE1ldGhvZDogcmdiXG4gICAgICAgUmV0dXJuIHRoZSBSR0IgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgPiA+IG5ldyBDaHJvbWF0aCgncmVkJykucmdiKCk7XG4gICAgICAgPiBbMjU1LCAwLCAwXVxuICAgICovXG4gICAgICByZ2I6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b1JHQkFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvUkdCQXJyYXlcbiAgICAgICAgIFJldHVybiB0aGUgUkdCIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IENocm9tYXRoLmJ1cmx5d29vZC50b1JHQkFycmF5KCk7XG4gICAgICAgICA+IFsyNTUsIDE4NCwgMTM1XVxuICAgICAgKi9cbiAgICAgIHRvUkdCQXJyYXk6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b1JHQkFBcnJheSgpLnNsaWNlKDAsMyk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvUkdCT2JqZWN0XG4gICAgICAgICBSZXR1cm4gdGhlIFJHQiBvYmplY3Qgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdidXJseXdvb2QnKS50b1JHQk9iamVjdCgpO1xuICAgICAgICAgPiB7cjogMjU1LCBnOiAxODQsIGI6IDEzNX1cbiAgICAgICovXG4gICAgICB0b1JHQk9iamVjdDogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgcmdiID0gdGhpcy50b1JHQkFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4ge3I6IHJnYlswXSwgZzogcmdiWzFdLCBiOiByZ2JbMl19O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9SR0JTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgUkdCIHN0cmluZyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ2FsaWNlYmx1ZScpLnRvUkdCU3RyaW5nKCk7XG4gICAgICAgICA+IFwicmdiKDI0MCwyNDgsMjU1KVwiXG4gICAgICAqL1xuICAgICAgdG9SR0JTdHJpbmc6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIFwicmdiKFwiKyB0aGlzLnRvUkdCQXJyYXkoKS5qb2luKFwiLFwiKSArXCIpXCI7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiByZ2JhXG4gICAgICAgICBSZXR1cm4gdGhlIFJHQkEgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdyZWQnKS5yZ2JhKCk7XG4gICAgICAgICA+IFsyNTUsIDAsIDAsIDFdXG4gICAgICAqL1xuICAgICAgcmdiYTogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLnRvUkdCQUFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvUkdCQUFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIFJHQkEgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGgubGltZS50b1JHQkFBcnJheSgpO1xuICAgICAgICAgPiBbMCwgMjU1LCAwLCAxXVxuICAgICAgKi9cbiAgICAgIHRvUkdCQUFycmF5OiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHZhciByZ2JhID0gW1xuICAgICAgICAgICAgICBNYXRoLnJvdW5kKHRoaXMucioyNTUpLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKHRoaXMuZyoyNTUpLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKHRoaXMuYioyNTUpLFxuICAgICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMuYSlcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmV0dXJuIHJnYmE7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1JHQkFPYmplY3RcbiAgICAgICAgIFJldHVybiB0aGUgUkdCQSBvYmplY3Qgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGguY2FkZXRibHVlLnRvUkdCQU9iamVjdCgpO1xuICAgICAgICAgPiB7cjogOTUsIGc6IDE1OCwgYjogMTYwfVxuICAgICAgKi9cbiAgICAgIHRvUkdCQU9iamVjdDogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgcmdiYSA9IHRoaXMudG9SR0JBQXJyYXkoKTtcblxuICAgICAgICAgIHJldHVybiB7cjogcmdiYVswXSwgZzogcmdiYVsxXSwgYjogcmdiYVsyXSwgYTogcmdiYVszXX07XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1JHQkFTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgUkdCQSBzdHJpbmcgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdkYXJrYmx1ZScpLnRvUkdCQVN0cmluZygpO1xuICAgICAgICAgPiBcInJnYmEoMCwwLDEzOSwxKVwiXG4gICAgICAqL1xuICAgICAgdG9SR0JBU3RyaW5nOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gXCJyZ2JhKFwiKyB0aGlzLnRvUkdCQUFycmF5KCkuam9pbihcIixcIikgK1wiKVwiO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogaGV4XG4gICAgICAgICBSZXR1cm4gdGhlIGhleCBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gbmV3IENocm9tYXRoKCdkYXJrZ3JlZW4nKS5oZXgoKVxuICAgICAgICAgWyAnMDAnLCAnNjQnLCAnMDAnIF1cbiAgICAgICovXG4gICAgICBoZXg6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b0hleEFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgIE1ldGhvZDogdG9IZXhBcnJheVxuICAgICAgICAgUmV0dXJuIHRoZSBoZXggYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgID4gPiBDaHJvbWF0aC5maXJlYnJpY2sudG9IZXhBcnJheSgpO1xuICAgICAgICA+IFtcIkIyXCIsIFwiMjJcIiwgXCIyMlwiXVxuICAgICAgKi9cbiAgICAgIHRvSGV4QXJyYXk6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5yZ2IyaGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IZXhPYmplY3RcbiAgICAgICAgIFJldHVybiB0aGUgaGV4IG9iamVjdCBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBDaHJvbWF0aC5nYWluc2Jvcm8udG9IZXhPYmplY3QoKTtcbiAgICAgICAgID4ge3I6IFwiRENcIiwgZzogXCJEQ1wiLCBiOiBcIkRDXCJ9XG4gICAgICAqL1xuICAgICAgdG9IZXhPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIGhleCA9IHRoaXMudG9IZXhBcnJheSgpO1xuXG4gICAgICAgICAgcmV0dXJuIHsgcjogaGV4WzBdLCBnOiBoZXhbMV0sIGI6IGhleFsyXSB9O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgTWV0aG9kOiB0b0hleFN0cmluZ1xuICAgICAgICAgUmV0dXJuIHRoZSBoZXggc3RyaW5nIG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICA+ID4gQ2hyb21hdGguaG9uZXlkZXcudG9IZXhTdHJpbmcoKTtcbiAgICAgICAgPiBcIiNGMEZGRjBcIlxuICAgICAgKi9cbiAgICAgIHRvSGV4U3RyaW5nOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICB2YXIgaGV4ID0gdGhpcy50b0hleEFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4gJyMnICsgaGV4LmpvaW4oJycpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogaHNsXG4gICAgICAgICBSZXR1cm4gdGhlIEhTTCBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPm5ldyBDaHJvbWF0aCgnZ3JlZW4nKS5oc2woKTtcbiAgICAgICAgID4gWzEyMCwgMSwgMC4yNTA5ODAzOTIxNTY4NjI3NF1cbiAgICAgICovXG4gICAgICBoc2w6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b0hTTEFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNMQXJyYXlcbiAgICAgICAgIFJldHVybiB0aGUgSFNMIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgncmVkJykudG9IU0xBcnJheSgpO1xuICAgICAgICAgPiBbMCwgMSwgMC41XVxuICAgICAgKi9cbiAgICAgIHRvSFNMQXJyYXk6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNMQUFycmF5KCkuc2xpY2UoMCwzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNMT2JqZWN0XG4gICAgICAgICBSZXR1cm4gdGhlIEhTTCBvYmplY3Qgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdyZWQnKS50b0hTTE9iamVjdCgpO1xuICAgICAgICAgW2g6MCwgczoxLCBsOjAuNV1cbiAgICAgICovXG4gICAgICB0b0hTTE9iamVjdDogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgaHNsID0gdGhpcy50b0hTTEFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4ge2g6IGhzbFswXSwgczogaHNsWzFdLCBsOiBoc2xbMl19O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0xTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgSFNMIHN0cmluZyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ3JlZCcpLnRvSFNMU3RyaW5nKCk7XG4gICAgICAgICA+IFwiaHNsKDAsMSwwLjUpXCJcbiAgICAgICovXG4gICAgICB0b0hTTFN0cmluZzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGhzbGEgPSB0aGlzLnRvSFNMQUFycmF5KCk7XG4gICAgICAgICAgdmFyIHZhbHMgPSBbXG4gICAgICAgICAgICAgIGhzbGFbMF0sXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHNsYVsxXSoxMDApKyclJyxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc2xhWzJdKjEwMCkrJyUnXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHJldHVybiAnaHNsKCcrIHZhbHMgKycpJztcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgIE1ldGhvZDogaHNsYVxuICAgICAgICBSZXR1cm4gdGhlIEhTTEEgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ2dyZWVuJykuaHNsYSgpO1xuICAgICAgICA+IFsxMjAsIDEsIDAuMjUwOTgwMzkyMTU2ODYyNzQsIDFdXG4gICAgICAqL1xuICAgICAgaHNsYTogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLnRvSFNMQUFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNMQXJyYXlcbiAgICAgICAgIFJldHVybiB0aGUgSFNMQSBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBDaHJvbWF0aC5hbnRpcXVld2hpdGUudG9IU0xBQXJyYXkoKTtcbiAgICAgICAgID4gWzM0LCAwLjc3Nzc3Nzc3Nzc3Nzc3NzMsIDAuOTExNzY0NzA1ODgyMzUyOSwgMV1cbiAgICAgICovXG4gICAgICB0b0hTTEFBcnJheTogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICBNYXRoLnJvdW5kKHRoaXMuaCksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5zbCksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5sKSxcbiAgICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLmEpXG4gICAgICAgICAgXTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNMQU9iamVjdFxuICAgICAgICAgUmV0dXJuIHRoZSBIU0xBIG9iamVjdCBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBDaHJvbWF0aC5hbnRpcXVld2hpdGUudG9IU0xBQXJyYXkoKTtcbiAgICAgICAgID4ge2g6MzQsIHM6MC43Nzc3Nzc3Nzc3Nzc3NzczLCBsOjAuOTExNzY0NzA1ODgyMzUyOSwgYToxfVxuICAgICAgKi9cbiAgICAgIHRvSFNMQU9iamVjdDogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgaHNsYSA9IHRoaXMudG9IU0xBQXJyYXkoKTtcblxuICAgICAgICAgIHJldHVybiB7aDogaHNsYVswXSwgczogaHNsYVsxXSwgbDogaHNsYVsyXSwgYTogaHNsYVszXX07XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTTEFTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgSFNMQSBzdHJpbmcgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGguYW50aXF1ZXdoaXRlLnRvSFNMQVN0cmluZygpO1xuICAgICAgICAgPiBcImhzbGEoMzQsMC43Nzc3Nzc3Nzc3Nzc3NzczLDAuOTExNzY0NzA1ODgyMzUyOSwxKVwiXG4gICAgICAqL1xuICAgICAgdG9IU0xBU3RyaW5nOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICB2YXIgaHNsYSA9IHRoaXMudG9IU0xBQXJyYXkoKTtcbiAgICAgICAgICB2YXIgdmFscyA9IFtcbiAgICAgICAgICAgICAgaHNsYVswXSxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc2xhWzFdKjEwMCkrJyUnLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzbGFbMl0qMTAwKSsnJScsXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHNsYVszXSlcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmV0dXJuICdoc2xhKCcrIHZhbHMgKycpJztcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGhzdlxuICAgICAgICAgUmV0dXJuIHRoZSBIU1YgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdibHVlJykuaHN2KCk7XG4gICAgICAgICA+IFsyNDAsIDEsIDFdXG4gICAgICAqL1xuICAgICAgaHN2OiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9IU1ZBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTVkFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIEhTViBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ25hdmFqb3doaXRlJykudG9IU1ZBcnJheSgpO1xuICAgICAgICAgPiBbMzYsIDAuMzIxNTY4NjI3NDUwOTgwMzYsIDFdXG4gICAgICAqL1xuICAgICAgdG9IU1ZBcnJheTogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50b0hTVkFBcnJheSgpLnNsaWNlKDAsMyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTVk9iamVjdFxuICAgICAgICAgUmV0dXJuIHRoZSBIU1Ygb2JqZWN0IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnbmF2YWpvd2hpdGUnKS50b0hTVk9iamVjdCgpO1xuICAgICAgICAgPiB7aDM2LCBzOjAuMzIxNTY4NjI3NDUwOTgwMzYsIHY6MX1cbiAgICAgICovXG4gICAgICB0b0hTVk9iamVjdDogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgaHN2YSA9IHRoaXMudG9IU1ZBQXJyYXkoKTtcblxuICAgICAgICAgIHJldHVybiB7aDogaHN2YVswXSwgczogaHN2YVsxXSwgdjogaHN2YVsyXX07XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTVlN0cmluZ1xuICAgICAgICAgUmV0dXJuIHRoZSBIU1Ygc3RyaW5nIG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnbmF2YWpvd2hpdGUnKS50b0hTVlN0cmluZygpO1xuICAgICAgICAgPiBcImhzdigzNiwzMi4xNTY4NjI3NDUwOTgwNCUsMTAwJSlcIlxuICAgICAgKi9cbiAgICAgIHRvSFNWU3RyaW5nOiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHZhciBoc3YgPSB0aGlzLnRvSFNWQXJyYXkoKTtcbiAgICAgICAgICB2YXIgdmFscyA9IFtcbiAgICAgICAgICAgICAgaHN2WzBdLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzdlsxXSoxMDApKyclJyxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc3ZbMl0qMTAwKSsnJSdcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmV0dXJuICdoc3YoJysgdmFscyArJyknO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogaHN2YVxuICAgICAgICAgUmV0dXJuIHRoZSBIU1ZBIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnYmx1ZScpLmhzdmEoKTtcbiAgICAgICAgID4gWzI0MCwgMSwgMSwgMV1cbiAgICAgICovXG4gICAgICBoc3ZhOiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9IU1ZBQXJyYXkoKTsgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU1ZBQXJyYXlcbiAgICAgICAgIFJldHVybiB0aGUgSFNWQSBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29saXZlJykudG9IU1ZBQXJyYXkoKTtcbiAgICAgICAgID4gWzYwLCAxLCAwLjUwMTk2MDc4NDMxMzcyNTUsIDFdXG4gICAgICAqL1xuICAgICAgdG9IU1ZBQXJyYXk6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgIE1hdGgucm91bmQodGhpcy5oKSxcbiAgICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLnN2KSxcbiAgICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLnYpLFxuICAgICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMuYSlcbiAgICAgICAgICBdO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU1ZBT2JqZWN0XG4gICAgICAgICBSZXR1cm4gdGhlIEhTVkEgb2JqZWN0IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnb2xpdmUnKS50b0hTVkFBcnJheSgpO1xuICAgICAgICAgPiB7aDo2MCwgczogMSwgdjowLjUwMTk2MDc4NDMxMzcyNTUsIGE6MX1cbiAgICAgICovXG4gICAgICB0b0hTVkFPYmplY3Q6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHZhciBoc3ZhID0gdGhpcy50b0hTVkFBcnJheSgpO1xuXG4gICAgICAgICAgcmV0dXJuIHtoOiBoc3ZhWzBdLCBzOiBoc3ZhWzFdLCBsOiBoc3ZhWzJdLCBhOiBoc3ZhWzNdfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNWQVN0cmluZ1xuICAgICAgICAgUmV0dXJuIHRoZSBIU1ZBIHN0cmluZyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29saXZlJykudG9IU1ZBU3RyaW5nKCk7XG4gICAgICAgICA+IFwiaHN2YSg2MCwxMDAlLDUwLjE5NjA3ODQzMTM3MjU1JSwxKVwiXG4gICAgICAqL1xuICAgICAgdG9IU1ZBU3RyaW5nOiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHZhciBoc3ZhID0gdGhpcy50b0hTVkFBcnJheSgpO1xuICAgICAgICAgIHZhciB2YWxzID0gW1xuICAgICAgICAgICAgICBoc3ZhWzBdLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzdmFbMV0qMTAwKSsnJScsXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHN2YVsyXSoxMDApKyclJyxcbiAgICAgICAgICAgICAgaHN2YVszXVxuICAgICAgICAgIF07XG5cbiAgICAgICAgICByZXR1cm4gJ2hzdmEoJysgdmFscyArJyknO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogaHNiXG4gICAgICAgICBBbGlhcyBmb3IgPGhzdj5cbiAgICAgICovXG4gICAgICBoc2I6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy5oc3YoKTsgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0JBcnJheVxuICAgICAgICAgQWxpYXMgZm9yIDx0b0hTQkFycmF5PlxuICAgICAgKi9cbiAgICAgIHRvSFNCQXJyYXk6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9IU1ZBcnJheSgpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0JPYmplY3RcbiAgICAgICAgIEFsaWFzIGZvciA8dG9IU1ZPYmplY3Q+XG4gICAgICAqL1xuICAgICAgdG9IU0JPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9IU1ZPYmplY3QoKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNCU3RyaW5nXG4gICAgICAgICBBbGlhcyBmb3IgPHRvSFNWU3RyaW5nPlxuICAgICAgKi9cbiAgICAgIHRvSFNCU3RyaW5nOiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNWU3RyaW5nKCk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBoc2JhXG4gICAgICAgICBBbGlhcyBmb3IgPGhzdmE+XG4gICAgICAqL1xuICAgICAgaHNiYTogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLmhzdmEoKTsgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0JBQXJyYXlcbiAgICAgICAgIEFsaWFzIGZvciA8dG9IU1ZBQXJyYXk+XG4gICAgICAqL1xuICAgICAgdG9IU0JBQXJyYXk6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNWQUFycmF5KCk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTQkFPYmplY3RcbiAgICAgICAgIEFsaWFzIGZvciA8dG9IU1ZBT2JqZWN0PlxuICAgICAgKi9cbiAgICAgIHRvSFNCQU9iamVjdDogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9IU1ZBT2JqZWN0KCk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTQkFTdHJpbmdcbiAgICAgICAgIEFsaWFzIGZvciA8dG9IU1ZBU3RyaW5nPlxuICAgICAgKi9cbiAgICAgIHRvSFNCQVN0cmluZzogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50b0hTVkFTdHJpbmcoKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vR3JvdXA6IEluc3RhbmNlIG1ldGhvZHMgLSBjb2xvciBzY2hlbWVcbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGNvbXBsZW1lbnRcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5jb21wbGVtZW50PiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IENocm9tYXRoLnJlZC5jb21wbGVtZW50KCkucmdiKCk7XG4gICAgICAgICA+IFswLCAyNTUsIDI1NV1cbiAgICAgICovXG4gICAgICBjb21wbGVtZW50OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguY29tcGxlbWVudCh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRyaWFkXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgudHJpYWQ+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdoc2woMCwgMTAwJSwgNTAlKScpLnRyaWFkKCkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjRkYwMDAwLCMwMEZGMDAsIzAwMDBGRlwiXG4gICAgICAqL1xuICAgICAgdHJpYWQ6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC50cmlhZCh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRldHJhZFxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnRldHJhZD4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5oc2IoMjQwLCAxLCAxKS50cmlhZCgpO1xuICAgICAgICAgPiBbQ2hyb21hdGgsIENocm9tYXRoLCBDaHJvbWF0aF1cbiAgICAgICovXG4gICAgICB0ZXRyYWQ6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC50ZXRyYWQodGhpcyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBhbmFsb2dvdXNcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5hbmFsb2dvdXM+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gQ2hyb21hdGguaHNiKDEyMCwgMSwgMSkuYW5hbG9nb3VzKCk7XG4gICAgICAgICA+IFtDaHJvbWF0aCwgQ2hyb21hdGgsIENocm9tYXRoLCBDaHJvbWF0aCwgQ2hyb21hdGgsIENocm9tYXRoLCBDaHJvbWF0aCwgQ2hyb21hdGhdXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5oc2IoMTgwLCAxLCAxKS5hbmFsb2dvdXMoNSkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjMDBGRkZGLCMwMEZGQjIsIzAwRkZFNSwjMDBFNUZGLCMwMEIyRkZcIlxuXG4gICAgICAgICA+ID4gQ2hyb21hdGguaHNiKDE4MCwgMSwgMSkuYW5hbG9nb3VzKDUsIDEwKS50b1N0cmluZygpO1xuICAgICAgICAgPiBcIiMwMEZGRkYsIzAwRkYxOSwjMDBGRkIyLCMwMEIyRkYsIzAwMTlGRlwiXG4gICAgICAqL1xuICAgICAgYW5hbG9nb3VzOiBmdW5jdGlvbiAocmVzdWx0cywgc2xpY2VzKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguYW5hbG9nb3VzKHRoaXMsIHJlc3VsdHMsIHNsaWNlcyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICBNZXRob2Q6IG1vbm9jaHJvbWF0aWNcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5tb25vY2hyb21hdGljPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICA+ID4gQ2hyb21hdGguYmx1ZS5tb25vY2hyb21hdGljKCkudG9TdHJpbmcoKTtcbiAgICAgICAgPiBcIiMwMDAwMzMsIzAwMDA2NiwjMDAwMDk5LCMwMDAwQ0MsIzAwMDBGRlwiXG4gICAgICAqL1xuICAgICAgbW9ub2Nocm9tYXRpYzogZnVuY3Rpb24gKHJlc3VsdHMpe1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5tb25vY2hyb21hdGljKHRoaXMsIHJlc3VsdHMpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogc3BsaXRjb21wbGVtZW50XG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguc3BsaXRjb21wbGVtZW50PiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IENocm9tYXRoLmJsdWUuc3BsaXRjb21wbGVtZW50KCkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjMDAwMEZGLCNGRkNDMDAsI0ZGNTEwMFwiXG4gICAgICAqL1xuICAgICAgc3BsaXRjb21wbGVtZW50OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguc3BsaXRjb21wbGVtZW50KHRoaXMpO1xuICAgICAgfSxcblxuICAgICAgLy8gR3JvdXA6IEluc3RhbmNlIG1ldGhvZHMgLSBjb2xvciBhbHRlcmF0aW9uXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0aW50XG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgudGludD4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ3llbGxvdycpLnRpbnQoMC4yNSkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjRkZGRjNGXCJcbiAgICAgICovXG4gICAgICB0aW50OiBmdW5jdGlvbiAoYnkpIHtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgudGludCh0aGlzLCBieSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBsaWdodGVuXG4gICAgICAgICBBbGlhcyBmb3IgPHRpbnQ+XG4gICAgICAqL1xuICAgICAgbGlnaHRlbjogZnVuY3Rpb24gKGJ5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRpbnQoYnkpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgTWV0aG9kOiBzaGFkZVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnNoYWRlPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICA+ID4gbmV3IENocm9tYXRoKCd5ZWxsb3cnKS5zaGFkZSgwLjI1KS50b1N0cmluZygpO1xuICAgICAgICA+IFwiI0JGQkYwMFwiXG4gICAgICAqL1xuICAgICAgc2hhZGU6IGZ1bmN0aW9uIChieSkge1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5zaGFkZSh0aGlzLCBieSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBkYXJrZW5cbiAgICAgICAgIEFsaWFzIGZvciA8c2hhZGU+XG4gICAgICAqL1xuICAgICAgZGFya2VuOiBmdW5jdGlvbiAoYnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hhZGUoYnkpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogZGVzYXR1cmF0ZVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLmRlc2F0dXJhdGU+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnb3JhbmdlJykuZGVzYXR1cmF0ZSgpLnRvU3RyaW5nKCk7XG4gICAgICAgPiBcIiNBREFEQURcIlxuXG4gICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnb3JhbmdlJykuZGVzYXR1cmF0ZSgxKS50b1N0cmluZygpO1xuICAgICAgID4gXCIjNUI1QjVCXCJcblxuICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29yYW5nZScpLmRlc2F0dXJhdGUoMikudG9TdHJpbmcoKTtcbiAgICAgICA+IFwiI0I0QjRCNFwiXG4gICAgICAgKi9cbiAgICAgIGRlc2F0dXJhdGU6IGZ1bmN0aW9uIChmb3JtdWxhKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguZGVzYXR1cmF0ZSh0aGlzLCBmb3JtdWxhKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgIE1ldGhvZDogZ3JleXNjYWxlXG4gICAgICAgIEFsaWFzIGZvciA8ZGVzYXR1cmF0ZT5cbiAgICAgICovXG4gICAgICBncmV5c2NhbGU6IGZ1bmN0aW9uIChmb3JtdWxhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2F0dXJhdGUoZm9ybXVsYSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB3ZWJzYWZlXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgud2Vic2FmZT4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5yZ2IoMTIzLCAyMzQsIDU2KS50b1N0cmluZygpO1xuICAgICAgICAgPiBcIiM3QkVBMzhcIlxuXG4gICAgICAgICA+IENocm9tYXRoLnJnYigxMjMsIDIzNCwgNTYpLndlYnNhZmUoKS50b1N0cmluZygpO1xuICAgICAgICAgPiBcIiM2NkZGMzNcIlxuICAgICAgICovXG4gICAgICB3ZWJzYWZlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgud2Vic2FmZSh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIEdyb3VwOiBJbnN0YW5jZSBtZXRob2RzIC0gY29sb3IgY29tYmluYXRpb25cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGFkZGl0aXZlXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguYWRkaXRpdmU+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdyZWQnKS5hZGRpdGl2ZSgnIzAwRkYwMCcsICdibHVlJykudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjRkZGRkZGXCJcbiAgICAgICovXG4gICAgICBhZGRpdGl2ZTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGFyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmFkZGl0aXZlLmFwcGx5KENocm9tYXRoLCBbdGhpc10uY29uY2F0KGFycikpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogc3VidHJhY3RpdmVcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5zdWJ0cmFjdGl2ZT4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ2N5YW4nKS5zdWJ0cmFjdGl2ZSgnbWFnZW50YScsICd5ZWxsb3cnKS50b1N0cmluZygpO1xuICAgICAgICAgPiBcIiMwMDAwMDBcIlxuICAgICAgKi9cbiAgICAgIHN1YnRyYWN0aXZlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICB2YXIgYXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguc3VidHJhY3RpdmUuYXBwbHkoQ2hyb21hdGgsIFt0aGlzXS5jb25jYXQoYXJyKSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBtdWx0aXBseVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLm11bHRpcGx5PiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IENocm9tYXRoLmxpZ2h0Y3lhbi5tdWx0aXBseShDaHJvbWF0aC5icm93bikudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjOTAyQTJBXCJcbiAgICAgICovXG4gICAgICBtdWx0aXBseTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGFyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLm11bHRpcGx5LmFwcGx5KENocm9tYXRoLCBbdGhpc10uY29uY2F0KGFycikpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogYXZlcmFnZVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLmF2ZXJhZ2U+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gQ2hyb21hdGguYmxhY2suYXZlcmFnZSgnd2hpdGUnKS5yZ2IoKTtcbiAgICAgICAgID4gWzEyNywgMTI3LCAxMjddXG4gICAgICAqL1xuICAgICAgYXZlcmFnZTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGFyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmF2ZXJhZ2UuYXBwbHkoQ2hyb21hdGgsIFt0aGlzXS5jb25jYXQoYXJyKSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBvdmVybGF5XG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgub3ZlcmxheT4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICA+ID4gQ2hyb21hdGgucmVkLm92ZXJsYXkoJ2dyZWVuJywgMC40KS50b1N0cmluZygpO1xuICAgICAgID4gXCIjOTkzMzAwXCJcblxuICAgICAgID4gPiBDaHJvbWF0aC5yZWQub3ZlcmxheSgnZ3JlZW4nLCAxKS50b1N0cmluZygpO1xuICAgICAgID4gXCIjMDA4MDAwXCJcblxuICAgICAgID4gPiBDaHJvbWF0aC5yZWQub3ZlcmxheSgnZ3JlZW4nLCAwKS50b1N0cmluZygpO1xuICAgICAgID4gXCIjRkYwMDAwXCJcbiAgICAgICAqL1xuICAgICAgb3ZlcmxheTogZnVuY3Rpb24gKGJvdHRvbSwgdHJhbnNwYXJlbmN5KXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgub3ZlcmxheSh0aGlzLCBib3R0b20sIHRyYW5zcGFyZW5jeSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBHcm91cDogSW5zdGFuY2UgbWV0aG9kcyAtIG90aGVyXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBjbG9uZVxuICAgICAgICAgUmV0dXJuIGFuIGluZGVwZW5kZW50IGNvcHkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAqL1xuICAgICAgY2xvbmU6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiBuZXcgQ2hyb21hdGgodGhpcyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b3dhcmRzXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgudG93YXJkcz4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiB2YXIgcmVkID0gbmV3IENocm9tYXRoKCdyZWQnKTtcbiAgICAgICAgID4gPiByZWQudG93YXJkcygneWVsbG93JywgMC41NSkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjRkY4QzAwXCJcbiAgICAgICovXG4gICAgICB0b3dhcmRzOiBmdW5jdGlvbiAodG8sIGJ5KSB7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLnRvd2FyZHModGhpcywgdG8sIGJ5KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGdyYWRpZW50XG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguZ3JhZGllbnQ+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCcjRjAwJykuZ3JhZGllbnQoJyMwMEYnKS50b1N0cmluZygpXG4gICAgICAgICA+IFwiI0ZGMDAwMCwjRjEwMDBELCNFNDAwMUEsI0Q2MDAyOCwjQzkwMDM1LCNCQjAwNDMsI0FFMDA1MCwjQTEwMDVELCM5MzAwNkIsIzg2MDA3OCwjNzgwMDg2LCM2QjAwOTMsIzVEMDBBMSwjNTAwMEFFLCM0MzAwQkIsIzM1MDBDOSwjMjgwMEQ2LCMxQTAwRTQsIzBEMDBGMSwjMDAwMEZGXCJcblxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnI0YwMCcpLmdyYWRpZW50KCcjMDBGJywgNSkudG9TdHJpbmcoKVxuICAgICAgICAgPiBcIiNGRjAwMDAsI0JGMDAzRiwjN0YwMDdGLCMzRjAwQkYsIzAwMDBGRlwiXG5cbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJyNGMDAnKS5ncmFkaWVudCgnIzAwRicsIDUsIDMpLnRvU3RyaW5nKClcbiAgICAgICAgID4gXCIjM0YwMEJGXCJcbiAgICAgICovXG4gICAgICBncmFkaWVudDogZnVuY3Rpb24gKHRvLCBzbGljZXMsIHNsaWNlKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguZ3JhZGllbnQodGhpcywgdG8sIHNsaWNlcywgc2xpY2UpO1xuICAgICAgfVxuICB9O1xufTtcbiIsInZhciB1dGlsID0ge307XG5cbnV0aWwuY2xhbXAgPSBmdW5jdGlvbiAoIHZhbCwgbWluLCBtYXggKSB7XG4gICAgaWYgKHZhbCA+IG1heCkgcmV0dXJuIG1heDtcbiAgICBpZiAodmFsIDwgbWluKSByZXR1cm4gbWluO1xuICAgIHJldHVybiB2YWw7XG59O1xuXG51dGlsLm1lcmdlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZXN0ID0gYXJndW1lbnRzWzBdLCBpPTEsIHNvdXJjZSwgcHJvcDtcbiAgICB3aGlsZSAoc291cmNlID0gYXJndW1lbnRzW2krK10pXG4gICAgICAgIGZvciAocHJvcCBpbiBzb3VyY2UpIGRlc3RbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbnV0aWwuaXNBcnJheSA9IGZ1bmN0aW9uICggdGVzdCApIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRlc3QpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudXRpbC5pc1N0cmluZyA9IGZ1bmN0aW9uICggdGVzdCApIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRlc3QpID09PSAnW29iamVjdCBTdHJpbmddJztcbn07XG5cbnV0aWwuaXNOdW1iZXIgPSBmdW5jdGlvbiAoIHRlc3QgKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0ZXN0KSA9PT0gJ1tvYmplY3QgTnVtYmVyXSc7XG59O1xuXG51dGlsLmlzT2JqZWN0ID0gZnVuY3Rpb24gKCB0ZXN0ICkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGVzdCkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcblxudXRpbC5scGFkID0gZnVuY3Rpb24gKCB2YWwsIGxlbiwgcGFkICkge1xuICAgIHZhbCA9IHZhbC50b1N0cmluZygpO1xuICAgIGlmICghbGVuKSBsZW4gPSAyO1xuICAgIGlmICghcGFkKSBwYWQgPSAnMCc7XG5cbiAgICB3aGlsZSAodmFsLmxlbmd0aCA8IGxlbikgdmFsID0gcGFkK3ZhbDtcblxuICAgIHJldHVybiB2YWw7XG59O1xuXG51dGlsLmxlcnAgPSBmdW5jdGlvbiAoZnJvbSwgdG8sIGJ5KSB7XG4gICAgcmV0dXJuIGZyb20gKyAodG8tZnJvbSkgKiBieTtcbn07XG5cbnV0aWwudGltZXMgPSBmdW5jdGlvbiAobiwgZm4sIGNvbnRleHQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcmVzdWx0cyA9IFtdOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHJlc3VsdHNbaV0gPSBmbi5jYWxsKGNvbnRleHQsIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cbnV0aWwucmdiID0ge1xuICAgIGZyb21BcmdzOiBmdW5jdGlvbiAociwgZywgYiwgYSkge1xuICAgICAgICB2YXIgcmdiID0gYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIGlmICh1dGlsLmlzQXJyYXkocmdiKSl7IHI9cmdiWzBdOyBnPXJnYlsxXTsgYj1yZ2JbMl07IGE9cmdiWzNdOyB9XG4gICAgICAgIGlmICh1dGlsLmlzT2JqZWN0KHJnYikpeyByPXJnYi5yOyBnPXJnYi5nOyBiPXJnYi5iOyBhPXJnYi5hOyAgfVxuXG4gICAgICAgIHJldHVybiBbciwgZywgYiwgYV07XG4gICAgfSxcbiAgICBzY2FsZWQwMTogZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgaWYgKCFpc0Zpbml0ZShhcmd1bWVudHNbMV0pKXtcbiAgICAgICAgICAgIHZhciByZ2IgPSB1dGlsLnJnYi5mcm9tQXJncyhyLCBnLCBiKTtcbiAgICAgICAgICAgIHIgPSByZ2JbMF0sIGcgPSByZ2JbMV0sIGIgPSByZ2JbMl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAociA+IDEpIHIgLz0gMjU1O1xuICAgICAgICBpZiAoZyA+IDEpIGcgLz0gMjU1O1xuICAgICAgICBpZiAoYiA+IDEpIGIgLz0gMjU1O1xuXG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSxcbiAgICBwY3RXaXRoU3ltYm9sOiBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICB2YXIgcmdiID0gdGhpcy5zY2FsZWQwMShyLCBnLCBiKTtcblxuICAgICAgICByZXR1cm4gcmdiLm1hcChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodiAqIDI1NSkgKyAnJSc7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbnV0aWwuaHNsID0ge1xuICAgIGZyb21BcmdzOiBmdW5jdGlvbiAoaCwgcywgbCwgYSkge1xuICAgICAgICB2YXIgaHNsID0gYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIGlmICh1dGlsLmlzQXJyYXkoaHNsKSl7IGg9aHNsWzBdOyBzPWhzbFsxXTsgbD1oc2xbMl07IGE9aHNsWzNdOyB9XG4gICAgICAgIGlmICh1dGlsLmlzT2JqZWN0KGhzbCkpeyBoPWhzbC5oOyBzPWhzbC5zOyBsPShoc2wubCB8fCBoc2wudik7IGE9aHNsLmE7IH1cblxuICAgICAgICByZXR1cm4gW2gsIHMsIGwsIGFdO1xuICAgIH0sXG4gICAgc2NhbGVkOiBmdW5jdGlvbiAoaCwgcywgbCkge1xuICAgICAgICBpZiAoIWlzRmluaXRlKGFyZ3VtZW50c1sxXSkpe1xuICAgICAgICAgICAgdmFyIGhzbCA9IHV0aWwuaHNsLmZyb21BcmdzKGgsIHMsIGwpO1xuICAgICAgICAgICAgaCA9IGhzbFswXSwgcyA9IGhzbFsxXSwgbCA9IGhzbFsyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGggPSAoKChoICUgMzYwKSArIDM2MCkgJSAzNjApO1xuICAgICAgICBpZiAocyA+IDEpIHMgLz0gMTAwO1xuICAgICAgICBpZiAobCA+IDEpIGwgLz0gMTAwO1xuXG4gICAgICAgIHJldHVybiBbaCwgcywgbF07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIiwiKGZ1bmN0aW9uKGEsYil7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxiKTtlbHNlIGlmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBleHBvcnRzKWIoKTtlbHNle2IoKSxhLkZpbGVTYXZlcj17ZXhwb3J0czp7fX0uZXhwb3J0c319KSh0aGlzLGZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gYihhLGIpe3JldHVyblwidW5kZWZpbmVkXCI9PXR5cGVvZiBiP2I9e2F1dG9Cb206ITF9Olwib2JqZWN0XCIhPXR5cGVvZiBiJiYoY29uc29sZS53YXJuKFwiRGVwcmljYXRlZDogRXhwZWN0ZWQgdGhpcmQgYXJndW1lbnQgdG8gYmUgYSBvYmplY3RcIiksYj17YXV0b0JvbTohYn0pLGIuYXV0b0JvbSYmL15cXHMqKD86dGV4dFxcL1xcUyp8YXBwbGljYXRpb25cXC94bWx8XFxTKlxcL1xcUypcXCt4bWwpXFxzKjsuKmNoYXJzZXRcXHMqPVxccyp1dGYtOC9pLnRlc3QoYS50eXBlKT9uZXcgQmxvYihbXCJcXHVGRUZGXCIsYV0se3R5cGU6YS50eXBlfSk6YX1mdW5jdGlvbiBjKGIsYyxkKXt2YXIgZT1uZXcgWE1MSHR0cFJlcXVlc3Q7ZS5vcGVuKFwiR0VUXCIsYiksZS5yZXNwb25zZVR5cGU9XCJibG9iXCIsZS5vbmxvYWQ9ZnVuY3Rpb24oKXthKGUucmVzcG9uc2UsYyxkKX0sZS5vbmVycm9yPWZ1bmN0aW9uKCl7Y29uc29sZS5lcnJvcihcImNvdWxkIG5vdCBkb3dubG9hZCBmaWxlXCIpfSxlLnNlbmQoKX1mdW5jdGlvbiBkKGEpe3ZhciBiPW5ldyBYTUxIdHRwUmVxdWVzdDtyZXR1cm4gYi5vcGVuKFwiSEVBRFwiLGEsITEpLGIuc2VuZCgpLDIwMDw9Yi5zdGF0dXMmJjI5OT49Yi5zdGF0dXN9ZnVuY3Rpb24gZShhKXt0cnl7YS5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIikpfWNhdGNoKGMpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiTW91c2VFdmVudHNcIik7Yi5pbml0TW91c2VFdmVudChcImNsaWNrXCIsITAsITAsd2luZG93LDAsMCwwLDgwLDIwLCExLCExLCExLCExLDAsbnVsbCksYS5kaXNwYXRjaEV2ZW50KGIpfX12YXIgZj1cIm9iamVjdFwiPT10eXBlb2Ygd2luZG93JiZ3aW5kb3cud2luZG93PT09d2luZG93P3dpbmRvdzpcIm9iamVjdFwiPT10eXBlb2Ygc2VsZiYmc2VsZi5zZWxmPT09c2VsZj9zZWxmOlwib2JqZWN0XCI9PXR5cGVvZiBnbG9iYWwmJmdsb2JhbC5nbG9iYWw9PT1nbG9iYWw/Z2xvYmFsOnZvaWQgMCxhPWYuc2F2ZUFzfHxcIm9iamVjdFwiIT10eXBlb2Ygd2luZG93fHx3aW5kb3chPT1mP2Z1bmN0aW9uKCl7fTpcImRvd25sb2FkXCJpbiBIVE1MQW5jaG9yRWxlbWVudC5wcm90b3R5cGU/ZnVuY3Rpb24oYixnLGgpe3ZhciBpPWYuVVJMfHxmLndlYmtpdFVSTCxqPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO2c9Z3x8Yi5uYW1lfHxcImRvd25sb2FkXCIsai5kb3dubG9hZD1nLGoucmVsPVwibm9vcGVuZXJcIixcInN0cmluZ1wiPT10eXBlb2YgYj8oai5ocmVmPWIsai5vcmlnaW49PT1sb2NhdGlvbi5vcmlnaW4/ZShqKTpkKGouaHJlZik/YyhiLGcsaCk6ZShqLGoudGFyZ2V0PVwiX2JsYW5rXCIpKTooai5ocmVmPWkuY3JlYXRlT2JqZWN0VVJMKGIpLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtpLnJldm9rZU9iamVjdFVSTChqLmhyZWYpfSw0RTQpLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtlKGopfSwwKSl9OlwibXNTYXZlT3JPcGVuQmxvYlwiaW4gbmF2aWdhdG9yP2Z1bmN0aW9uKGYsZyxoKXtpZihnPWd8fGYubmFtZXx8XCJkb3dubG9hZFwiLFwic3RyaW5nXCIhPXR5cGVvZiBmKW5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGIoZixoKSxnKTtlbHNlIGlmKGQoZikpYyhmLGcsaCk7ZWxzZXt2YXIgaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtpLmhyZWY9ZixpLnRhcmdldD1cIl9ibGFua1wiLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtlKGkpfSl9fTpmdW5jdGlvbihhLGIsZCxlKXtpZihlPWV8fG9wZW4oXCJcIixcIl9ibGFua1wiKSxlJiYoZS5kb2N1bWVudC50aXRsZT1lLmRvY3VtZW50LmJvZHkuaW5uZXJUZXh0PVwiZG93bmxvYWRpbmcuLi5cIiksXCJzdHJpbmdcIj09dHlwZW9mIGEpcmV0dXJuIGMoYSxiLGQpO3ZhciBnPVwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI9PT1hLnR5cGUsaD0vY29uc3RydWN0b3IvaS50ZXN0KGYuSFRNTEVsZW1lbnQpfHxmLnNhZmFyaSxpPS9DcmlPU1xcL1tcXGRdKy8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtpZigoaXx8ZyYmaCkmJlwib2JqZWN0XCI9PXR5cGVvZiBGaWxlUmVhZGVyKXt2YXIgaj1uZXcgRmlsZVJlYWRlcjtqLm9ubG9hZGVuZD1mdW5jdGlvbigpe3ZhciBhPWoucmVzdWx0O2E9aT9hOmEucmVwbGFjZSgvXmRhdGE6W147XSo7LyxcImRhdGE6YXR0YWNobWVudC9maWxlO1wiKSxlP2UubG9jYXRpb24uaHJlZj1hOmxvY2F0aW9uPWEsZT1udWxsfSxqLnJlYWRBc0RhdGFVUkwoYSl9ZWxzZXt2YXIgaz1mLlVSTHx8Zi53ZWJraXRVUkwsbD1rLmNyZWF0ZU9iamVjdFVSTChhKTtlP2UubG9jYXRpb249bDpsb2NhdGlvbi5ocmVmPWwsZT1udWxsLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtrLnJldm9rZU9iamVjdFVSTChsKX0sNEU0KX19O2Yuc2F2ZUFzPWEuc2F2ZUFzPWEsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSYmKG1vZHVsZS5leHBvcnRzPWEpfSk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZpbGVTYXZlci5taW4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vQ3JhZnQgb2JqZWN0LnByb3R5cGVcbihmdW5jdGlvbigpe1xuXHRpZiggdHlwZW9mKE9iamVjdC5hZGRDb25zdFByb3ApID09IFwiZnVuY3Rpb25cIil7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gY29uc3RQcm9wKG5hbWVfcHJvcCwgdmFsdWUsIHZpcyl7XG5cdFx0aWYodmlzID09PSB1bmRlZmluZWQpIHZpcyA9IHRydWU7XG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSBPYmplY3QuZnJlZXplKHZhbHVlKTtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZV9wcm9wLCB7XG5cdFx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdFx0ZW51bWVyYWJsZTogdmlzXG5cdFx0XHR9KTtcblx0fVxuXHRmdW5jdGlvbiBnZXRTZXQobmFtZSwgZ2V0dGVyLCBzZXR0ZXIpe1xuXHRcdGlmKHR5cGVvZiBzZXR0ZXIgPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRzZXQ6IHNldHRlcixcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9ZWxzZXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0Y29uc3RQcm9wLmNhbGwoT2JqZWN0LnByb3RvdHlwZSwgJ2FkZENvbnN0UHJvcCcsIGNvbnN0UHJvcCwgZmFsc2UpO1xuXHRPYmplY3QucHJvdG90eXBlLmFkZENvbnN0UHJvcCgnYWRkR2V0U2V0JywgZ2V0U2V0LCBmYWxzZSk7XG5cdFxuXHRcblx0aWYodHlwZW9mKE9iamVjdC5wcm90b3R5cGUudG9Tb3VyY2UpICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAndG9Tb3VyY2UnLHtcblx0XHRcdHZhbHVlOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBzdHIgPSAneyc7XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gdGhpcyl7XG5cdFx0XHRcdFx0XHRzdHIgKz0gJyAnICsga2V5ICsgJzogJyArIHRoaXNba2V5XSArICcsJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoc3RyLmxlbmd0aCA+IDIpIHN0ciA9IHN0ci5zbGljZSgwLCAtMSkgKyAnICc7XG5cdFx0XHRcdFx0cmV0dXJuIHN0ciArICd9Jztcblx0XHRcdFx0fSxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlXG5cdFx0fSk7XG5cdH1cblx0XG5cdFxuXHRpZih0eXBlb2YoT2JqZWN0LnZhbHVlcykgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0dmFyIHZhbF9PYmogPSBmdW5jdGlvbihvYmope1xuXHRcdFx0dmFyIHZhbHMgPSBbXTtcblx0XHRcdFxuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0XHR2YWxzLnB1c2gob2JqW2tleV0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gdmFscztcblx0XHR9O1xuXHRcdFxuXHRcdCBPYmplY3QuYWRkQ29uc3RQcm9wKCd2YWx1ZXMnLCB2YWxfT2JqLmJpbmQoT2JqZWN0KSk7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJhbmRJbmRleCgpe1xuXHRcdHZhciByYW5kID0gTWF0aC5yb3VuZCgodGhpcy5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkpO1xuXHRcdHJldHVybiB0aGlzW3JhbmRdO1xuXHR9XG5cdEFycmF5LnByb3RvdHlwZS5hZGRDb25zdFByb3AoJ3JhbmRfaScsIHJhbmRJbmRleCk7XG5cdFxuXHRcblx0ZnVuY3Rpb24gY3JlYXRlQXJyKHZhbCwgbGVuZ3RoLCBpc19jYWxsKXtcblx0XHR2YXIgYXJyID0gW107XG5cdFx0XG5cdFx0aWYoIWxlbmd0aCkgbGVuZ3RoID0gMTtcblx0XHRpZihpc19jYWxsID09PSB1bmRlZmluZWQpIGlzX2NhbGwgPSB0cnVlO1xuXHRcdFxuXHRcdGlmKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJyAmJiBpc19jYWxsKXtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyl7XG5cdFx0XHRcdGFyci5wdXNoKHZhbChpLCBhcnIpKTtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdFxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKXtcblx0XHRcdFx0YXJyLnB1c2godmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGFycjtcblx0fVxuXHRcblx0QXJyYXkucHJvdG90eXBlLmFkZENvbnN0UHJvcCgnYWRkJywgZnVuY3Rpb24odmFsKXtcblx0XHRpZighdGhpcy5fbnVsbHMpIHRoaXMuX251bGxzID0gW107XG5cdFx0XG5cdFx0aWYodGhpcy5fbnVsbHMubGVuZ3RoKXtcblx0XHRcdHZhciBpbmQgPSB0aGlzLl9udWxscy5wb3AoKTtcblx0XHRcdHRoaXNbaW5kXSA9IHZhbDtcblx0XHRcdHJldHVybiBpbmQ7XG5cdFx0fWVsc2V7XG5cdFx0XHRyZXR1cm4gdGhpcy5wdXNoKHZhbCkgLSAxO1xuXHRcdH1cblx0fSk7XG5cdFxuXHRBcnJheS5wcm90b3R5cGUuYWRkQ29uc3RQcm9wKCdkZWxsJywgZnVuY3Rpb24oaW5kKXtcblx0XHRpZihpbmQgPiB0aGlzLmxlbmd0aCAtMSkgcmV0dXJuIGZhbHNlO1xuXHRcdFxuXHRcdGlmKGluZCA9PSB0aGlzLmxlbmd0aCAtMSl7XG5cdFx0XHR0aGlzLnBvcCgpO1xuXHRcdH1lbHNle1xuXHRcdFx0aWYoIXRoaXMuX251bGxzKSB0aGlzLl9udWxscyA9IFtdO1xuXHRcdFx0XG5cdFx0XHR0aGlzW2luZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHR0aGlzLl9udWxscy5wdXNoKGluZCk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB0cnVlO1x0XG5cdH0pO1xuXHRcblx0QXJyYXkuYWRkQ29uc3RQcm9wKCdjcmVhdGUnLCBjcmVhdGVBcnIpO1xuXHRcblx0XG5cdGlmKFJlZ0V4cC5wcm90b3R5cGUudG9KU09OICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFJlZ0V4cC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuc291cmNlOyB9O1xuXHR9XG5cbn0pKCk7XG5cblxuXG5cbiIsIi8vQ3JhZiBTdHJpbmdcbihmdW5jdGlvbigpe1xuXHRpZih0eXBlb2YoT2JqZWN0LnR5cGVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuXG5cdHZhciBUID0gT2JqZWN0LnR5cGVzO1xuXHR2YXIgRG9jID0gVC5kb2M7XG5cblx0ZnVuY3Rpb24gcmVwbGFjZVNwZWNDaGFyKGMpe1xuXHRcdHN3aXRjaChjKXtcblx0XHRcdGNhc2UgJ3cnOiByZXR1cm4gJ2EtekEtWjAtOV8nO1xuXHRcdFx0Y2FzZSAnZCc6IHJldHVybiAnMC05Jztcblx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ1xcXFx0XFxcXG5cXFxcdlxcXFxmXFxcXHIgJztcblxuXHRcdFx0ZGVmYXVsdDogcmV0dXJuIGM7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZ2VJbkFycihiZWcsIGVuZCl7XG5cdFx0aWYoYmVnID4gZW5kKXtcblx0XHRcdHZhciB0bXAgPSBiZWc7XG5cdFx0XHRiZWcgPSBlbmQ7XG5cdFx0XHRlbmQgPSB0bXA7XG5cdFx0fVxuXG5cdFx0dmFyIGFyciA9IFtdO1xuXHRcdGZvcih2YXIgaSA9IGJlZzsgaSA8PSBlbmQ7IGkrKyl7XG5cdFx0XHRhcnIucHVzaChpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VSYW5nZShwYXJzZV9zdHIpe1xuXHRcdGlmKC9cXFxcLi8udGVzdChwYXJzZV9zdHIpKXtcblx0XHRcdFx0cGFyc2Vfc3RyID0gcGFyc2Vfc3RyLnJlcGxhY2UoL1xcXFwoLikvZywgZnVuY3Rpb24oc3RyLCBjaGFyKXsgcmV0dXJuIHJlcGxhY2VTcGVjQ2hhcihjaGFyKTt9KTtcblx0XHR9XG5cblx0XHR2YXIgcmVzdWx0ID0gW107XG5cblx0XHR2YXIgYmVnX2NoYXIgPSBwYXJzZV9zdHJbMF07XG5cdFx0Zm9yKHZhciBpID0gMTsgaSA8PSBwYXJzZV9zdHIubGVuZ3RoOyBpKyspe1xuXG5cdFx0XHRpZihwYXJzZV9zdHJbaS0xXSAhPT0gJ1xcXFwnXG5cdFx0XHRcdCYmcGFyc2Vfc3RyW2ldID09PSAnLSdcblx0XHRcdFx0JiZwYXJzZV9zdHJbaSsxXSl7XG5cdFx0XHRcdGkrKztcblx0XHRcdFx0dmFyIGVuZF9jaGFyID0gcGFyc2Vfc3RyW2ldO1xuXG5cdFx0XHRcdHZhciBhcnJfY2hhcnMgPSByYW5nZUluQXJyKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCksIGVuZF9jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0XHRyZXN1bHQgPSByZXN1bHQuY29uY2F0KGFycl9jaGFycyk7XG5cblx0XHRcdFx0aSsrO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRiZWdfY2hhciA9IHBhcnNlX3N0cltpXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRDaGFycyhjaGFyc19hcnIsIHNpemUpe1xuXHRcdHNpemUgPSBULmludChzaXplLCAxKS5yYW5kKCk7XG5cdFx0dmFyIHN0ciA9ICcnO1xuXHRcdHdoaWxlKHNpemUpe1xuXHRcdFx0dmFyIGRlciA9IGNoYXJzX2Fyci5yYW5kX2koKTtcblx0XHRcdHN0ciArPVN0cmluZy5mcm9tQ2hhckNvZGUoZGVyKTtcblx0XHRcdHNpemUtLTtcblx0XHR9XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRTdHIocmFuZ2UsIHNpemUpe1xuXG5cdFx0dmFyIHBhcnNlX3JhbmdlID0gKHJhbmdlLnNvdXJjZSkubWF0Y2goL1xcXlxcWygoXFxcXFxcXXwuKSopXFxdXFwqXFwkLyk7XG5cblx0XHRpZighcGFyc2VfcmFuZ2UpIHRocm93IFQuZXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IHJhbmdlKFJlZ0V4cCgvXltcXHddLiQvKSksIHNpemUoMDw9bnVtYmVyKScpO1xuXG5cdFx0dmFyIGNoYXJzID0gcGFyc2VSYW5nZShwYXJzZV9yYW5nZVsxXSk7XG5cblx0XHRyZXR1cm4gcmFuZENoYXJzLmJpbmQobnVsbCwgY2hhcnMsIHNpemUpO1xuXG5cblx0fVxuXG5cdGZ1bmN0aW9uIHRlc3RTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHIpe1xuXHRcdFx0aWYodHlwZW9mKHN0cikgIT09ICdzdHJpbmcnKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBzdHJpbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHN0ci5sZW5ndGggPiBzaXplKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIkxlbmd0aCBzdHJpbmcgaXMgd3JvbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFyYW5nZS50ZXN0KHN0cikpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkb2NTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBULmRvYy5nZW4uYmluZChudWxsLCBcInN0clwiLCB7IHJhbmdlOiByYW5nZSwgbGVuZ3RoOiBzaXplfSk7XG5cdH1cblxuXG5cdHZhciBkZWZfc2l6ZSA9IDE3O1xuXHR2YXIgZGVmX3JhbmdlID0gL15bXFx3XSokLztcblxuXHRmdW5jdGlvbiBuZXdTdHIocmFuZ2UsIHNpemUpe1xuXHRcdGlmKHJhbmdlID09PSBudWxsKSByYW5nZSA9IGRlZl9yYW5nZTtcblx0XHRpZihzaXplID09PSB1bmRlZmluZWQpIHNpemUgPSBkZWZfc2l6ZTtcblxuXHRcdGlmKHR5cGVvZiByYW5nZSA9PSBcInN0cmluZ1wiKSByYW5nZSA9IG5ldyBSZWdFeHAocmFuZ2UpO1xuXG5cblx0XHRpZihULnBvcy50ZXN0KHNpemUpIHx8ICEocmFuZ2UgaW5zdGFuY2VvZiBSZWdFeHApKXtcblx0XHRcdFx0dGhyb3cgVC5lcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogcmFuZ2UoUmVnRXhwKSwgc2l6ZSgwPD1udW1iZXIpJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJhbmQ6IHJhbmRTdHIocmFuZ2UsIHNpemUpLFxuXHRcdFx0dGVzdDogdGVzdFN0cihyYW5nZSwgc2l6ZSksXG5cdFx0XHRkb2M6IGRvY1N0cihyYW5nZSwgc2l6ZSlcblx0XHR9O1xuXHR9XG5cblxuXG5cdFQubmV3VHlwZSgnc3RyJyxcblx0e1xuXHRcdG5hbWU6IFwiU3RyaW5nXCIsXG5cdFx0YXJnOiBbXCJyYW5nZVwiLCBcImxlbmd0aFwiXSxcblx0XHRwYXJhbXM6IHtcblx0XHRcdFx0cmFuZ2U6IHt0eXBlOiAnUmVnRXhwIHx8IHN0cicsIGRlZmF1bHRfdmFsdWU6IGRlZl9yYW5nZX0sXG5cdFx0XHRcdGxlbmd0aDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiBkZWZfc2l6ZX1cblx0XHR9XG5cdH0sXG5cdHtcblx0XHROZXc6IG5ld1N0cixcblx0XHR0ZXN0OiB0ZXN0U3RyKGRlZl9yYW5nZSwgZGVmX3NpemUpLFxuXHRcdHJhbmQ6IHJhbmRTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSksXG5cdFx0ZG9jOiBkb2NTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSlcblx0fSk7XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubmV3IChmdW5jdGlvbigpe1xuXHRpZih0eXBlb2YoT2JqZWN0LmFkZENvbnN0UHJvcCkgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0aWYodHlwZW9mIG1vZHVsZSA9PSBcIm9iamVjdFwiKXtcblx0XHRcdHJlcXVpcmUoXCIuL21vZi5qc1wiKTtcblx0XHR9ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCLQotGA0LXQsdGD0LXRgtGM0YHRjyDQsdC40LHQu9C40L7RgtC10LrQsCBtb2YuanNcIik7XG5cdH1cblxuXHRpZih0eXBlb2YoT2JqZWN0LnR5cGVzKSA9PSBcIm9iamVjdFwiKXtcblx0XHRyZXR1cm4gT2JqZWN0LnR5cGVzO1xuXHR9XG5cblx0dmFyIFQgPSB0aGlzO1xuXHR2YXIgRG9jID0ge1xuXHRcdHR5cGVzOntcblx0XHRcdCdib29sJzp7XG5cdFx0XHRcdG5hbWU6IFwiQm9vbGVhblwiLFxuXHRcdFx0XHRhcmc6IFtdXG5cdFx0XHR9LFxuXHRcdFx0J2NvbnN0Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkNvbnN0YW50XCIsXG5cdFx0XHRcdGFyZzogW1widmFsdWVcIl0sXG5cdFx0XHRcdHBhcmFtczogeyB2YWx1ZToge3R5cGU6IFwiU29tZXRoaW5nXCIsIGRlZmF1bHRfdmFsdWU6IG51bGx9fVxuXHRcdFx0fSxcblx0XHRcdCdwb3MnOiB7XG5cdFx0XHRcdG5hbWU6IFwiUG9zaXRpb25cIixcblx0XHRcdFx0YXJnOiBbJ21heCddLFxuXHRcdFx0XHRwYXJhbXM6IHttYXg6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogKzIxNDc0ODM2NDd9fVxuXG5cdFx0XHR9LFxuXG5cdFx0XHQnaW50Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkludGVnZXJcIixcblx0XHRcdFx0YXJnOiBbXCJtYXhcIiwgXCJtaW5cIiwgXCJzdGVwXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdpbnQnLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnaW50JywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0c3RlcDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiAxfVxuXHRcdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdCdudW0nOiB7XG5cdFx0XHRcdG5hbWU6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdGFyZzogW1wibWF4XCIsIFwibWluXCIsIFwicHJlY2lzXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdudW0nLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnbnVtJywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0cHJlY2lzOiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6IDl9XG5cdFx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdhcnInOiB7XG5cdFx0XHRcdG5hbWU6IFwiQXJyYXlcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiLCBcInNpemVcIiwgXCJmaXhlZFwiXSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0XHR0eXBlczoge3R5cGU6IFwiVHlwZSB8fCBbVHlwZSwgVHlwZS4uLl1cIiwgZ2V0IGRlZmF1bHRfdmFsdWUoKXtyZXR1cm4gVC5wb3N9fSxcblx0XHRcdFx0XHRcdHNpemU6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogN30sXG5cdFx0XHRcdFx0XHRmaXhlZDoge3R5cGU6ICdib29sJywgZGVmYXVsdF92YWx1ZTogdHJ1ZX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J2FueSc6IHtcblx0XHRcdFx0bmFtZTogXCJNaXhUeXBlXCIsXG5cdFx0XHRcdGFyZzogW1widHlwZXNcIl0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0dHlwZXM6IHt0eXBlOiBcIlR5cGUsIFR5cGUuLi4gfHwgW1R5cGUsIFR5cGUuLi5dXCIsIGdldCBkZWZhdWx0X3ZhbHVlKCl7cmV0dXJuIFtULnBvcywgVC5zdHJdfX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J29iaic6IHtcblx0XHRcdFx0bmFtZTogXCJPYmplY3RcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiXSxcblx0XHRcdFx0cGFyYW1zOiB7dHlwZXM6IHt0eXBlOiBcIk9iamVjdFwiLCBkZWZhdWx0X3ZhbHVlOiB7fX19XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRnZXRDb25zdDogZnVuY3Rpb24obmFtZV90eXBlLCBuYW1lX2xpbWl0KXtcblx0XHRcdHJldHVybiB0aGlzLnR5cGVzW25hbWVfdHlwZV0ucGFyYW1zW25hbWVfbGltaXRdLmRlZmF1bHRfdmFsdWU7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmRvYyA9IHt9O1xuXHR0aGlzLmRvYy5qc29uID0gSlNPTi5zdHJpbmdpZnkoRG9jLCBcIlwiLCAyKTtcblxuXHREb2MuZ2VuRG9jID0gKGZ1bmN0aW9uKG5hbWUsIHBhcmFtcyl7cmV0dXJuIHtuYW1lOiB0aGlzLnR5cGVzW25hbWVdLm5hbWUsIHBhcmFtczogcGFyYW1zfX0pLmJpbmQoRG9jKTtcblx0dGhpcy5kb2MuZ2VuID0gRG9jLmdlbkRvYztcblxuXG5cblxuXHQvL0Vycm9zXG5cdGZ1bmN0aW9uIGFyZ1R5cGVFcnJvcih3cm9uZ19hcmcsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IHR5cGUgaXMgd3JvbmchIEFyZ3VtZW50cygnICsgZm9yQXJnKHdyb25nX2FyZykgKyAnKTsnICsgbWVzcyk7XG5cdFx0RVIud3JvbmdfYXJnID0gd3JvbmdfYXJnO1xuXG5cdFx0aWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShFUiwgYXJnVHlwZUVycm9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gRVI7XG5cblx0XHRmdW5jdGlvbiBmb3JBcmcoYXJncyl7XG5cdFx0XHR2YXIgc3RyX2FyZ3MgPSAnJztcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0c3RyX2FyZ3MgKz0gdHlwZW9mKGFyZ3NbaV0pICsgJzogJyArIGFyZ3NbaV0gKyAnOyAnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHN0cl9hcmdzO1xuXHRcdH1cblx0fVxuXHRULmVycm9yID0gYXJnVHlwZUVycm9yO1xuXG5cdGZ1bmN0aW9uIHR5cGVTeW50YXhFcnJvcih3cm9uZ19zdHIsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBTeW50YXhFcnJvcignTGluZTogJyArIHdyb25nX3N0ciArICc7ICcgKyBtZXNzKTtcblx0XHRFUi53cm9uZ19hcmcgPSB3cm9uZ19zdHI7XG5cblx0XHRpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0XHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKEVSLCB0eXBlU3ludGF4RXJyb3IpO1xuXHRcdH1cblxuXHRcdHJldHVybiBFUjtcblx0fVxuXG5cblxuXHRmdW5jdGlvbiBDcmVhdGVDcmVhdG9yKE5ldywgdGVzdCwgcmFuZCwgZG9jKXtcblx0XHR2YXIgY3JlYXRvcjtcblx0XHRpZih0eXBlb2YgTmV3ID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0Y3JlYXRvciA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB0bXBfb2JqID0gTmV3LmFwcGx5KHt9LCBhcmd1bWVudHMpO1xuXHRcdFx0XHR2YXIgbmV3X2NyZWF0b3IgPSBuZXcgQ3JlYXRlQ3JlYXRvcihOZXcpO1xuXHRcdFx0XHRmb3IodmFyIGtleSBpbiB0bXBfb2JqKXtcblx0XHRcdFx0XHRuZXdfY3JlYXRvci5hZGRDb25zdFByb3Aoa2V5LCB0bXBfb2JqW2tleV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBuZXdfY3JlYXRvcjtcblx0XHRcdH07XG5cdFx0fWVsc2UgY3JlYXRvciA9IGZ1bmN0aW9uKCl7cmV0dXJuIGNyZWF0b3J9O1xuXG5cdFx0Y3JlYXRvci5hZGRDb25zdFByb3AoJ2lzX2NyZWF0b3InLCB0cnVlKTtcblx0XHRpZih0eXBlb2YgdGVzdCA9PT0gXCJmdW5jdGlvblwiKSBjcmVhdG9yLmFkZENvbnN0UHJvcCgndGVzdCcsIHRlc3QpO1xuXHRcdGlmKHR5cGVvZiByYW5kID09PSBcImZ1bmN0aW9uXCIpIGNyZWF0b3IuYWRkQ29uc3RQcm9wKCdyYW5kJywgcmFuZCk7XG5cdFx0aWYodHlwZW9mIGRvYyA9PT0gXCJmdW5jdGlvblwiKSBjcmVhdG9yLmFkZENvbnN0UHJvcCgnZG9jJywgZG9jKTtcblxuXHRcdHJldHVybiBjcmVhdG9yO1xuXHR9XG5cdHRoaXMubmV3VHlwZSA9IGZ1bmN0aW9uKGtleSwgZGVzYywgbmV3X3R5cGUpe1xuXHRcdERvYy50eXBlc1trZXldID0gZGVzYztcblx0XHRULm5hbWVzW2Rlc2MubmFtZV0gPSBrZXk7XG5cdFx0dGhpcy5kb2MuanNvbiA9IEpTT04uc3RyaW5naWZ5KERvYywgXCJcIiwgMik7XG5cblx0XHR0aGlzW2tleV0gPSBuZXcgQ3JlYXRlQ3JlYXRvcihuZXdfdHlwZS5OZXcsIG5ld190eXBlLnRlc3QsIG5ld190eXBlLnJhbmQsIG5ld190eXBlLmRvYyk7XG5cdH1cblx0dGhpcy5uZXdUeXBlLmRvYyA9ICcobmFtZSwgY29uc3RydWN0b3IsIGZ1bmNUZXN0LCBmdW5jUmFuZCwgZnVuY0RvYyknO1xuXG5cblxuXHQvL0NyYWZ0IEJvb2xlYW5cblx0XHR0aGlzLmJvb2wgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG51bGwsXG5cdFx0XHRmdW5jdGlvbih2YWx1ZSl7XG5cdFx0XHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gJ2Jvb2xlYW4nKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiAhKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSkpO1xuXHRcdFx0fSxcblx0XHRcdERvYy5nZW5Eb2MuYmluZChudWxsLCBcImJvb2xcIilcblx0XHQpO1xuXG5cblxuXHQvL0NyYWZ0IENvbnN0XG5cdFx0ZnVuY3Rpb24gZG9jQ29uc3QodmFsKXtcblxuXHRcdFx0aWYodHlwZW9mKHZhbCkgPT09IFwib2JqZWN0XCIgJiYgdmFsICE9PSBudWxsKXtcblx0XHRcdFx0dmFsID0gJ09iamVjdCc7XG5cdFx0XHR9XG5cdFx0XHRpZih0eXBlb2YodmFsKSA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0dmFsID0gdmFsLnRvU3RyaW5nKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsXCJjb25zdFwiLCB7dmFsdWU6IHZhbH0pO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBuZXdDb25zdCh2YWwpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cmFuZDogZnVuY3Rpb24oKXtyZXR1cm4gdmFsfSxcblx0XHRcdFx0dGVzdDogZnVuY3Rpb24odil7XG5cdFx0XHRcdFx0aWYodmFsICE9PSB2KSByZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRvYzogZG9jQ29uc3QodmFsKVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0dmFyIGRlZl9jb25zdCA9IG5ld0NvbnN0KERvYy5nZXRDb25zdCgnY29uc3QnLCAndmFsdWUnKSk7XG5cdFx0dGhpcy5jb25zdCA9IG5ldyBDcmVhdGVDcmVhdG9yKG5ld0NvbnN0LCBkZWZfY29uc3QudGVzdCwgZGVmX2NvbnN0LnJhbmQsIGRlZl9jb25zdC5kb2MpO1xuXG5cdFx0ZnVuY3Rpb24gdENvbnN0KFR5cGUpe1xuXHRcdFx0aWYodHlwZW9mIChUeXBlKSAhPT0gXCJmdW5jdGlvblwiIHx8ICFUeXBlLmlzX2NyZWF0b3Ipe1xuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblxuXHRcdFx0XHRcdHJldHVybiBULmFycihUeXBlKTtcblxuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YoVHlwZSkgPT0gXCJvYmplY3RcIiAmJiBUeXBlICE9PSBudWxsKXtcblxuXHRcdFx0XHRcdHJldHVybiBULm9iaihUeXBlKTtcblxuXHRcdFx0XHR9ZWxzZSByZXR1cm4gVC5jb25zdChUeXBlKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyZXR1cm4gVHlwZTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHQvL0NyYWZ0IE51bWJlclxuXHRcdHZhciByYW5kTnVtID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuICsoKChtYXggLSBtaW4pKk1hdGgucmFuZG9tKCkgKyAgbWluKS50b0ZpeGVkKHByZWNpcykpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgdGVzdE51bSA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKG4pe1xuXHRcdFx0XHRpZih0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG4pKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKChuID4gbWF4KVxuXHRcdFx0XHRcdHx8KG4gPCBtaW4pXG5cdFx0XHRcdFx0fHwgKG4udG9GaXhlZChwcmVjaXMpICE9IG4gJiYgbiAhPT0gMCkgKXtcblxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdCAgfTtcblx0XHR9O1xuXG5cdFx0dmFyIGRvY051bSA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcIm51bVwiLCB7XCJtYXhcIjogbWF4LCBcIm1pblwiOiBtaW4sIFwicHJlY2lzXCI6IHByZWNpc30pO1xuXHRcdH1cblxuXHRcdHZhciBtYXhfZGVmX24gPSBEb2MuZ2V0Q29uc3QoJ251bScsICdtYXgnKTtcblx0XHR2YXIgbWluX2RlZl9uID0gRG9jLmdldENvbnN0KCdudW0nLCAnbWluJyk7XG5cdFx0dmFyIHByZWNpc19kZWYgPSBEb2MuZ2V0Q29uc3QoJ251bScsICdwcmVjaXMnKTtcblxuXHRcdHRoaXMubnVtID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdFx0aWYobWF4ID09PSBudWxsKSBtYXggPSBtYXhfZGVmX247XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkfHxtaW4gPT09IG51bGwpIG1pbiA9IG1pbl9kZWZfbjtcblx0XHRcdFx0aWYocHJlY2lzID09PSB1bmRlZmluZWQpIHByZWNpcyA9IHByZWNpc19kZWY7XG5cblx0XHRcdFx0aWYoKHR5cGVvZiBtaW4gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtaW4pKVxuXHRcdFx0XHRcdHx8KHR5cGVvZiBtYXggIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtYXgpKVxuXHRcdFx0XHRcdHx8KHR5cGVvZiBwcmVjaXMgIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShwcmVjaXMpKVxuXHRcdFx0XHRcdHx8KHByZWNpcyA8IDApXG5cdFx0XHRcdFx0fHwocHJlY2lzID4gOSlcblx0XHRcdFx0XHR8fChwcmVjaXMgJSAxICE9PSAwKSl7XG5cdFx0XHRcdFx0dGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiBtaW4obnVtYmVyKSwgbWF4KG51bWJlciksIHByZWNpcygwPD1udW1iZXI8OSknKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihtaW4gPiBtYXgpe1xuXHRcdFx0XHRcdHZhciB0ID0gbWluO1xuXHRcdFx0XHRcdG1pbiA9IG1heDtcblx0XHRcdFx0XHRtYXggPSB0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0TnVtKG1heCwgbWluLCBwcmVjaXMpLFxuXHRcdFx0XHRcdHJhbmQ6IHJhbmROdW0obWF4LCBtaW4sIHByZWNpcyksXG5cdFx0XHRcdFx0ZG9jOiBkb2NOdW0obWF4LCBtaW4sIHByZWNpcylcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3ROdW0obWF4X2RlZl9uLCBtaW5fZGVmX24sIHByZWNpc19kZWYpLFxuXHRcdFx0cmFuZE51bShtYXhfZGVmX24sIG1pbl9kZWZfbiwgcHJlY2lzX2RlZiksXG5cdFx0XHRkb2NOdW0obWF4X2RlZl9uLCBtaW5fZGVmX24sIHByZWNpc19kZWYpXG5cdFx0KTtcblxuXHRcdHZhciByYW5kSW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIE1hdGguZmxvb3IoICgobWF4IC0gKG1pbiArIDAuMSkpL3ByZWNpcykqTWF0aC5yYW5kb20oKSApICogcHJlY2lzICsgIG1pbjtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0IHZhciB0ZXN0SW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24obil7XG5cdFx0XHRcdGlmKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobikpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoKG4gPj0gbWF4KVxuXHRcdFx0XHRcdHx8KG4gPCBtaW4pXG5cdFx0XHRcdFx0fHwoKChuIC0gbWluKSAlIHByZWNpcykgIT09IDApICl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0ICB9O1xuXHRcdH07XG5cblx0XHR2YXIgZG9jSW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHN0ZXApe1xuXG5cdFx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJpbnRcIiwge1wibWF4XCI6IG1heCwgXCJtaW5cIjogbWluLCBcInN0ZXBcIjogc3RlcH0pO1xuXG5cdFx0fVxuXG5cdFx0dmFyIG1heF9kZWYgPSBEb2MuZ2V0Q29uc3QoJ2ludCcsICdtYXgnKTtcblx0XHR2YXIgbWluX2RlZiA9IERvYy5nZXRDb25zdCgnaW50JywgJ21pbicpO1xuXHRcdHZhciBzdGVwX2RlZiA9IERvYy5nZXRDb25zdCgnaW50JywgJ3N0ZXAnKTtcblxuXHRcdHRoaXMuaW50ID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRmdW5jdGlvbihtYXgsIG1pbiwgc3RlcCl7XG5cblx0XHRcdFx0aWYobWF4ID09PSBudWxsKSBtYXggPSBtYXhfZGVmO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZHx8bWluID09PSBudWxsKSBtaW4gPSBtaW5fZGVmO1xuXHRcdFx0XHRpZihzdGVwID09PSB1bmRlZmluZWQpIHN0ZXAgPSBzdGVwX2RlZjtcblxuXHRcdFx0XHRpZigodHlwZW9mIG1pbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1pbikpXG5cdFx0XHRcdFx0fHwodHlwZW9mIG1heCAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1heCkpXG5cdFx0XHRcdFx0fHwoTWF0aC5yb3VuZChtaW4pICE9PSBtaW4pXG5cdFx0XHRcdFx0fHwoTWF0aC5yb3VuZChtYXgpICE9PSBtYXgpXG5cdFx0XHRcdFx0fHwoc3RlcCA8PSAwKVxuXHRcdFx0XHRcdHx8KE1hdGgucm91bmQoc3RlcCkgIT09IHN0ZXApKXtcblx0XHRcdFx0XHR0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IG1pbihpbnQpLCBtYXgoaW50KSwgc3RlcChpbnQ+MCknKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihtaW4gPiBtYXgpe1xuXHRcdFx0XHRcdHZhciB0ID0gbWluO1xuXHRcdFx0XHRcdG1pbiA9IG1heDtcblx0XHRcdFx0XHRtYXggPSB0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0SW50KG1heCwgbWluLCBzdGVwKSxcblx0XHRcdFx0XHRyYW5kOiByYW5kSW50KG1heCwgbWluLCBzdGVwKSxcblx0XHRcdFx0XHRkb2M6IGRvY0ludChtYXgsIG1pbiwgc3RlcClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3RJbnQobWF4X2RlZiwgbWluX2RlZiwgc3RlcF9kZWYpLFxuXHRcdFx0cmFuZEludChtYXhfZGVmLCBtaW5fZGVmLCBzdGVwX2RlZiksXG5cdFx0XHRkb2NJbnQobWF4X2RlZiwgbWluX2RlZiwgc3RlcF9kZWYpXG5cdFx0KTtcblxuXHRcdHZhciBkb2NQb3MgPSBmdW5jdGlvbihtYXgsIG1pbiwgc3RlcCl7XG5cblx0XHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcInBvc1wiLCB7XCJtYXhcIjogbWF4fSk7XG5cblx0XHR9XG5cblx0XHR2YXIgbWF4X2RlZl9wID0gRG9jLmdldENvbnN0KCdwb3MnLCAnbWF4Jylcblx0XHR0aGlzLnBvcyA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0ZnVuY3Rpb24obWF4KXtcblxuXHRcdFx0XHRpZihtYXggPT09IG51bGwpIG1heCA9IG1heF9kZWZfcDtcblxuXHRcdFx0XHRpZigodHlwZW9mIG1heCAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1heCkpXG5cdFx0XHRcdFx0fHwobWF4IDwgMCkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogbWluKHBvcyksIG1heChwb3MpLCBzdGVwKHBvcz4wKScpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0SW50KG1heCwgMCwgMSksXG5cdFx0XHRcdFx0cmFuZDogcmFuZEludChtYXgsIDAsIDEpLFxuXHRcdFx0XHRcdGRvYzogZG9jUG9zKG1heClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3RJbnQobWF4X2RlZl9wLCAwLCAxKSxcblx0XHRcdHJhbmRJbnQobWF4X2RlZl9wLCAwLCAxKSxcblx0XHRcdGRvY1BvcyhtYXhfZGVmX3ApXG5cdFx0KTtcblxuXG5cblxuXG4gIC8vQ3JhZnQgQW55XG5cdFx0ZnVuY3Rpb24gcmFuZEFueShhcnIpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBhcnIucmFuZF9pKCkucmFuZCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRlc3RBbnkoYXJyKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWwpe1xuXHRcdFx0XHRpZihhcnIuZXZlcnkoZnVuY3Rpb24oaSl7cmV0dXJuIGkudGVzdCh2YWwpfSkpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGRvY0FueShUeXBlcyl7XG5cblx0XHRcdHZhciBjb250ID0gVHlwZXMubGVuZ3RoO1xuXHRcdFx0dmFyIHR5cGVfZG9jcyA9IFtdO1xuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGNvbnQ7IGkrKyl7XG5cdFx0XHRcdHR5cGVfZG9jcy5wdXNoKFR5cGVzW2ldLmRvYygpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcImFueVwiLCB7dHlwZXM6IHR5cGVfZG9jc30pO1xuXHRcdH1cblxuXHRcdHZhciBkZWZfdHlwZXMgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICd0eXBlcycpO1xuXHRcdGZ1bmN0aW9uIG5ld0FueShhcnIpe1xuXHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoYXJyKSB8fCBhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJyID0gYXJndW1lbnRzO1xuXG5cdFx0XHR2YXIgbGVuID0gYXJyLmxlbmd0aDtcblx0XHRcdHZhciBhcnJfdHlwZXMgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG5cdFx0XHRcdGFycl90eXBlc1tpXSA9IHRDb25zdChhcnJbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm57XG5cdFx0XHRcdHRlc3Q6IHRlc3RBbnkoYXJyX3R5cGVzKSxcblx0XHRcdFx0cmFuZDogcmFuZEFueShhcnJfdHlwZXMpLFxuXHRcdFx0XHRkb2M6IGRvY0FueShhcnJfdHlwZXMpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5hbnkgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG5ld0FueSxcblx0XHRcdHRlc3RBbnkoZGVmX3R5cGVzKSxcblx0XHRcdHJhbmRBbnkoZGVmX3R5cGVzKSxcblx0XHRcdGRvY0FueShkZWZfdHlwZXMpXG5cdFx0KTtcblxuXG5cblx0Ly9DcmFmdCBBcnJheVxuXG5cblxuXHRcdGZ1bmN0aW9uIHJhbmRBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHR2YXIgcmFuZFNpemUgPSBmdW5jdGlvbiAoKXtyZXR1cm4gc2l6ZX07XG5cdFx0XHRpZighaXNfZml4ZWQpe1xuXHRcdFx0XHRyYW5kU2l6ZSA9IFQucG9zKHNpemUpLnJhbmQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdHZhciBub3dfc2l6ZSA9IHJhbmRTaXplKCk7XG5cblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIGFyciA9IFtdO1xuXG5cdFx0XHRcdFx0Zm9yKHZhciBpID0gMCwgaiA9IDA7IGkgPCBub3dfc2l6ZTsgaSsrKXtcblxuXHRcdFx0XHRcdFx0YXJyLnB1c2goVHlwZVtqXS5yYW5kKCkpO1xuXG5cdFx0XHRcdFx0XHRqKys7XG5cdFx0XHRcdFx0XHRpZihqID49IFR5cGUubGVuZ3RoKXtcblx0XHRcdFx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXG5cblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgYXJyID0gW107XG5cblx0XHRcdFx0dmFyIG5vd19zaXplID0gcmFuZFNpemUoKTtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IG5vd19zaXplOyBpKyspe1xuXHRcdFx0XHRcdGFyci5wdXNoKFR5cGUucmFuZChpLCBhcnIpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0ZXN0QXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpe1xuXG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGFycil7XG5cblx0XHRcdFx0XHRpZighQXJyYXkuaXNBcnJheShhcnIpKXtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IGFycmF5IVwiO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZigoYXJyLmxlbmd0aCA+IHNpemUpIHx8IChpc19maXhlZCAmJiAoYXJyLmxlbmd0aCAhPT0gc2l6ZSkpKXtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiQXJyYXkgbGVuZ2h0IGlzIHdyb25nIVwiO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwLCBqID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7XG5cblx0XHRcdFx0XHRcdFx0dmFyIHJlcyA9IFR5cGVbal0udGVzdChhcnJbaV0pO1xuXHRcdFx0XHRcdFx0XHRpZihyZXMpe1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnIucGFyYW1zID0ge2luZGV4OiBpLCB3cm9uZ19pdGVtOiByZXN9O1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGorKztcblx0XHRcdFx0XHRcdFx0aWYoaiA+PSBUeXBlLmxlbmd0aCl7XG5cdFx0XHRcdFx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGFycil7XG5cdFx0XHRcdGlmKCFBcnJheS5pc0FycmF5KGFycikpe1xuXHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBhcnJheSFcIjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoKGFyci5sZW5ndGggPiBzaXplKSB8fCAoaXNfZml4ZWQgJiYgKGFyci5sZW5ndGggIT09IHNpemUpKSl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYXJyLmxlbmd0aCwgc2l6ZSlcblx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJBcnJheTogbGVuZ2h0IGlzIHdyb25nIVwiO1xuXHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZXJyX2FyciA9IGFyci5maWx0ZXIoVHlwZS50ZXN0KTtcblx0XHRcdFx0aWYoZXJyX2Fyci5sZW5ndGggIT0gMCl7XG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IGVycl9hcnI7XG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBkb2NBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHR2YXIgdHlwZV9kb2NzID0gW107XG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0dmFyIGNvbnQgPSBUeXBlLmxlbmd0aDtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGNvbnQ7IGkrKyl7XG5cdFx0XHRcdFx0dHlwZV9kb2NzLnB1c2goVHlwZVtpXS5kb2MoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1lbHNle1xuXHRcdFx0XHR0eXBlX2RvY3MgPSBUeXBlLmRvYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwiYXJyXCIsIHt0eXBlczogdHlwZV9kb2NzLCBzaXplOiBzaXplLCBmaXhlZDogaXNfZml4ZWR9KTtcblxuXHRcdH1cblxuXG5cdFx0dmFyIGRlZl9UeXBlID0gRG9jLmdldENvbnN0KCdhcnInLCAndHlwZXMnKTtcblx0XHR2YXIgZGVmX1NpemUgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICdzaXplJyk7XG5cdFx0dmFyIGRlZl9maXhlZCA9IERvYy5nZXRDb25zdCgnYXJyJywgJ2ZpeGVkJyk7XG5cblx0XHRmdW5jdGlvbiBuZXdBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHRpZihUeXBlID09PSBudWxsKSBUeXBlID0gZGVmX1R5cGU7XG5cdFx0XHRpZihpc19maXhlZCA9PT0gdW5kZWZpbmVkKSBpc19maXhlZCA9IGRlZl9maXhlZDtcblxuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdGlmKHNpemUgPT09IHVuZGVmaW5lZHx8c2l6ZSA9PT0gbnVsbCkgc2l6ZSA9IFR5cGUubGVuZ3RoO1xuXG5cdFx0XHRcdFR5cGUgPSBUeXBlLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gdENvbnN0KGl0ZW0pO30pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGlmKHNpemUgPT09IHVuZGVmaW5lZHx8c2l6ZSA9PT0gbnVsbCkgc2l6ZSA9IDE7XG5cdFx0XHRcdFR5cGUgPSB0Q29uc3QoVHlwZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKFQucG9zLnRlc3Qoc2l6ZSkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogJyArIEpTT04uc3RyaW5naWZ5KFQucG9zLnRlc3Qoc2l6ZSkpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dGVzdDogdGVzdEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKSxcblx0XHRcdFx0cmFuZDogcmFuZEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKSxcblx0XHRcdFx0ZG9jOiBkb2NBcnJheShUeXBlLCBzaXplLCBpc19maXhlZClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5hcnIgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG5ld0FycmF5LFxuXHRcdFx0dGVzdEFycmF5KGRlZl9UeXBlLCBkZWZfU2l6ZSwgZGVmX2ZpeGVkKSxcblx0XHRcdHJhbmRBcnJheShkZWZfVHlwZSwgZGVmX1NpemUsIGRlZl9maXhlZCksXG5cdFx0XHRkb2NBcnJheShkZWZfVHlwZSwgZGVmX1NpemUsIGRlZl9maXhlZClcblx0XHQpO1xuXG5cblxuXG5cblxuXG5cdC8vQ3JhZnQgT2JqZWN0XG5cblx0XHRmdW5jdGlvbiByYW5kT2JqKGZ1bmNPYmope1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBvYmogPSB7fTtcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZnVuY09iail7XG5cdFx0XHRcdFx0b2JqW2tleV0gPSBmdW5jT2JqW2tleV0ucmFuZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBvYmo7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRlc3RPYmooZnVuY09iail7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24ob2JqKXtcblxuXHRcdFx0XHRpZih0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIG9iaiA9PT0gbnVsbCl7XG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IG9iamVjdCFcIjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZnVuY09iail7XG5cdFx0XHRcdFx0dmFyIHJlcyA9IGZ1bmNPYmpba2V5XS50ZXN0KG9ialtrZXldKTtcblx0XHRcdFx0XHRpZihyZXMpe1xuXHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zID0ge307XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zW2tleV0gPSByZXM7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZG9jT2IoZnVuY09iail7XG5cdFx0XHR2YXIgZG9jX29iaiA9IHt9O1xuXG5cdFx0XHRmb3IodmFyIGtleSBpbiBmdW5jT2JqKXtcblx0XHRcdFx0XHRkb2Nfb2JqW2tleV0gPSBmdW5jT2JqW2tleV0uZG9jKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJvYmpcIiwge3R5cGVzOiBkb2Nfb2JqfSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gTmV3T2JqKHRlbXBPYmope1xuXHRcdFx0aWYodHlwZW9mIHRlbXBPYmogIT09ICdvYmplY3QnKSB0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IHRlbXBPYmooT2JqZWN0KScpO1xuXG5cdFx0XHR2YXIgYmVnT2JqID0ge307XG5cdFx0XHR2YXIgZnVuY09iaiA9IHt9O1xuXHRcdFx0Zm9yKHZhciBrZXkgaW4gdGVtcE9iail7XG5cdFx0XHRcdGZ1bmNPYmpba2V5XSA9IHRDb25zdCh0ZW1wT2JqW2tleV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm57XG5cdFx0XHRcdHRlc3Q6IHRlc3RPYmooZnVuY09iaiksXG5cdFx0XHRcdHJhbmQ6IHJhbmRPYmooZnVuY09iaiksXG5cdFx0XHRcdGRvYzogZG9jT2IoZnVuY09iailcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5vYmogPSBuZXcgQ3JlYXRlQ3JlYXRvcihOZXdPYmosXG5cdFx0XHRmdW5jdGlvbihvYmope3JldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwifSxcblx0XHRcdHJhbmRPYmooe30pLFxuXHRcdFx0RG9jLmdlbkRvYy5iaW5kKG51bGwsIFwib2JqXCIpXG5cdFx0KTtcblxuXG5cblxuXG4vL0NyYWZ0IFR5cGUgb3V0IHRvICBEb2N1bWVudFxuXG5cdFQubmFtZXMgPSB7fTtcblx0Zm9yKHZhciBrZXkgaW4gRG9jLnR5cGVzKXtcblx0XHRULm5hbWVzW0RvYy50eXBlc1trZXldLm5hbWVdID0ga2V5O1xuXHR9XG5cblx0dGhpcy5vdXREb2MgPSBmdW5jdGlvbih0bXApe1xuXHRcdGlmKCh0eXBlb2YgdG1wID09PSBcImZ1bmN0aW9uXCIpICYmIHRtcC5pc19jcmVhdG9yKSByZXR1cm4gdG1wO1xuXG5cdFx0aWYoISgnbmFtZScgaW4gdG1wKSl7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoKTtcblx0XHR9XG5cdFx0dmFyIHR5cGUgPSB0bXAubmFtZTtcblxuXHRcdGlmKCdwYXJhbXMnIGluIHRtcCl7XG5cdFx0XHR2YXIgcGFyYW1zID0gdG1wLnBhcmFtcztcblx0XHRcdHN3aXRjaChULm5hbWVzW3R5cGVdKXtcblx0XHRcdFx0Y2FzZSAnb2JqJzoge1xuXHRcdFx0XHRcdHZhciBuZXdfb2JqID0ge307XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gcGFyYW1zLnR5cGVzKXtcblx0XHRcdFx0XHRcdG5ld19vYmpba2V5XSA9IFQub3V0RG9jKHBhcmFtcy50eXBlc1trZXldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFyYW1zLnR5cGVzID0gbmV3X29iajtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlICdhbnknOlxuXHRcdFx0XHRjYXNlICdhcnInOiB7XG5cdFx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShwYXJhbXMudHlwZXMpKXtcblx0XHRcdFx0XHRcdHBhcmFtcy50eXBlcyA9IHBhcmFtcy50eXBlcy5tYXAoVC5vdXREb2MuYmluZChUKSk7XG5cdFx0XHRcdFx0fWVsc2UgcGFyYW1zLnR5cGVzID0gVC5vdXREb2MocGFyYW1zLnR5cGVzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGdldFNpbXBsZVR5cGUoVC5uYW1lc1t0eXBlXSwgcGFyYW1zKTtcblx0XHR9XG5cdFx0cmV0dXJuIGdldFNpbXBsZVR5cGUoVC5uYW1lc1t0eXBlXSwge30pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0U2ltcGxlVHlwZShuYW1lLCBwYXJhbXMpe1xuXHRcdHZhciBhcmcgPSBbXTtcblx0XHREb2MudHlwZXNbbmFtZV0uYXJnLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpKXthcmdbaV0gPSBwYXJhbXNba2V5XTt9KTtcblx0XHRyZXR1cm4gVFtuYW1lXS5hcHBseShULCBhcmcpO1xuXHR9O1xuXG4vL1N1cHBvcnQgRGVjbGFyYXRlIEZ1bmN0aW9uXG5cblx0ZnVuY3Rpb24gZmluZGVQYXJzZShzdHIsIGJlZywgZW5kKXtcblx0XHR2YXIgcG9pbnRfYmVnID0gc3RyLmluZGV4T2YoYmVnKTtcblx0XHRpZih+cG9pbnRfYmVnKXtcblxuXHRcdFx0dmFyIHBvaW50X2VuZCA9IHBvaW50X2JlZztcblx0XHRcdHZhciBwb2ludF90ZW1wID0gcG9pbnRfYmVnO1xuXHRcdFx0dmFyIGxldmVsID0gMTtcblx0XHRcdHZhciBicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHR3aGlsZSghYnJlYWtXaGlsZSl7XG5cdFx0XHRcdGJyZWFrV2hpbGUgPSB0cnVlO1xuXG5cdFx0XHRcdGlmKH5wb2ludF90ZW1wKSBwb2ludF90ZW1wID0gc3RyLmluZGV4T2YoYmVnLCBwb2ludF90ZW1wICsgMSk7XG5cdFx0XHRcdGlmKH5wb2ludF9lbmQpIHBvaW50X2VuZCA9IHN0ci5pbmRleE9mKGVuZCwgcG9pbnRfZW5kICsgMSk7XG5cblx0XHRcdFx0aWYocG9pbnRfdGVtcCA8IHBvaW50X2VuZCl7XG5cblx0XHRcdFx0XHRpZihwb2ludF90ZW1wID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfdGVtcCAtIDFdICE9PSAnXFxcXCcpIGxldmVsID0gbGV2ZWwrMTtcblxuXHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0aWYocG9pbnRfZW5kID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfZW5kIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbC0xO1xuXHRcdFx0XHRcdFx0aWYobGV2ZWwgPT0gMCl7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbcG9pbnRfYmVnLCBwb2ludF9lbmRdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0aWYocG9pbnRfZW5kID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfZW5kIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbC0xO1xuXHRcdFx0XHRcdFx0aWYobGV2ZWwgPT0gMCl7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbcG9pbnRfYmVnLCBwb2ludF9lbmRdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKHBvaW50X3RlbXAgPiAwKXtcblx0XHRcdFx0XHRcdGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGlmKHN0cltwb2ludF90ZW1wIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbCsxO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdE9iamVjdC50eXBlcyA9IFQ7XG59KSgpO1xuIl19
