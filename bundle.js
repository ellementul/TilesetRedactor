(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Hear = require("./Events.js");
const Chromath = require('chromath');

module.exports = function(Logic){
	
	

	Hear("Tiles", "click", function(event){
		if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
	});

	Hear("add", "submit", function(){ 

		var tile = {
			type: this.type.value
		};

		if(tile.type == "color")
			tile.color = new Chromath(this.color.value).toRGBAObject();

		if(tile.type == "svg"){
			if(this.img_tile.files[0])
				tile.files = this.img_tile.files;
			else return; 
		}

		if(tile.type == "phisic"){
			tile.durability = this.durability.value;

			if(this.img_obj.files[0])
				tile.files = this.img_obj.files;
			else return; 
		}

		Logic.add(tile);
		
	});
	Hear("dell", "click", Logic.dell.bind(Logic));
	
	Hear("save", "click", Logic.save.bind(Logic));
	Hear("open", "change", function(){
		if(this.files[0]) Logic.load(this.files[0]);
	});
	
	
	Hear("View", "click", function(e){
		e.stopPropagation();
		var box = e.currentTarget.getBoundingClientRect();
		var x = e.clientX - box.left;
		var y = e.clientY - box.top;
		
		Logic.showTile(x, y);
	});
	
	Hear("Width", "change", function(e){
		Logic.resizeTile(parseInt(e.target.value));
	});
	Hear("Height", "change", function(e){
		Logic.resizeTile(null, parseInt(e.target.value));
	});
};


},{"./Events.js":4,"chromath":10}],2:[function(require,module,exports){
const Hear = require("./Events.js");

module.exports = function(Draw){

	Hear("switch_add", "click", Draw.switchElem("invis", ["add", "tile_size"]));

	var switchTypeTile = Draw.switchElem("invis", {
		svg: "type_svg", 
		color: "type_color", 
		phisic: "type_phisic"});

	Hear("type", "change", function(e){
		switchTypeTile(e.target.value);
		getNode("OK").classList.remove("invis");
	});

	Hear("clear", "click", Draw.View.clear);

};

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}
},{"./Events.js":4}],3:[function(require,module,exports){
require("typesjs");
const RGB = require('chromath').rgb;

var Base64 = require('js-base64').Base64;
const CrSwitches = require("./CrSwitches.js");


var id_tiles_list = "Tiles";
var id_view = "View";
var id_types = "select_types";
var id_dur = "select_durability";

var type_tile = {
	"Фоновый тайл": "svg", 
	"Цветной тайл": "color", 
	"Игровой объект": "phisic"
};
var types_durability = require("./types_durability.json");


function CrTiles(id){
	var container = getNode(id);
	var current_tile = null; 

	
	this.addGetSet("current_tile", 
		function(){
			return current_tile;
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
		var tile = drawTile(new_tile);

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
		elems.forEach(tile => tile.remove());
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

drawSelect(getNode(id_types), type_tile, "type");
drawSelect(getNode(id_dur), types_durability, "durability");

var Draw = {
	Tiles: new CrTiles(id_tiles_list),
	View: new CrView(id_view),
	switchElem: require("./Switch.js")
};

CrSwitches(Draw);
module.exports = Draw;

function drawSelect(container, list, name){
	var select = document.createElement("select");
		select.setAttribute("name", name);
		select.setAttribute("id", name);

	for (var val in list){
		var opt = document.createElement("option");
		opt.value = list[val];
		opt.innerHTML = val;
		select.appendChild(opt);
	}

	container.insertAdjacentElement("afterEnd", select);
}

function drawTile(new_tile){
	
	if(new_tile.type == "color"){
		var img = document.createElement('img');
		img.style.backgroundColor = new RGB(new_tile.color).toString();
	}
	if(new_tile.type == "svg" || new_tile.type == "phisic"){
		var img = document.createElement('img');
		img.src = "data:image/svg+xml;base64,"+ Base64.encode(new_tile.img);
		console.log(img.src);
	}

	img.classList.add("tile");
	img.setAttribute("tile", new_tile.id);
	img.setAttribute("draggable", true);
	
	return img;
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}

},{"./CrSwitches.js":2,"./Switch.js":6,"./types_durability.json":22,"chromath":10,"js-base64":18,"typesjs":21}],4:[function(require,module,exports){

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

},{}],5:[function(require,module,exports){
var Types = require("./Types.js");
var T = Object.types;

var Files = require("./SysFiles.js");


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
	
	this.add = function(tile){
		if(tile.files){
			var files = tile.files;
			delete tile.files;

			if((tile.type == "svg" || tile.type == "phisic") && files[0]){
				Files.open(files[0], function(img){
					tile.img = img.content;
					Add(tile);
				});
			}
		}
		else Add(tile);
	};

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
		Files.save("tileset.json", JSON.stringify(data, null, 1));
	}
	this.load = function(file, is_save=false){
		if(is_save) this.save();

		var self = this;
		Files.open(file, function(file){
			Load(JSON.parse(file.content));
			self.setTile(0);
		});


	}
	
	this.getTile = function(){
		var tile = Object.assign({}, current_tile);
		if(tile.width === undefined) tile.width = def_width;
		if(tile.height === undefined) tile.height = def_height;
		
		return tile;
	}

	this.showTile = function(x, y){
		if(current_tile) 
			Draw.View.add(this.getTile(), x, y);
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
	
	function Load(new_tiles){

		Clear();
		new_tiles.tiles.forEach(Add);
		
		def_width = new_tiles.width;
		def_height = new_tiles.height;
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

},{"./SysFiles.js":7,"./Types.js":8}],6:[function(require,module,exports){
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
var FileSaver = require('file-saver');

function Open(file, callback){
	var reader = new FileReader();
	
	reader.onload = function(e){
		file.content = e.target.result;
		file.name = name;
		callback(file);
	};
	reader.readAsText(file);
}

function Save(name, text){
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	FileSaver.saveAs(blob, name);
}

module.exports = {save: Save, open: Open};
},{"file-saver":17}],8:[function(require,module,exports){
require("typesjs");
require("typesjs/str_type");

var types_durability = require("./types_durability.json");

var T = Object.types;

var type_tile = T.obj({
		type: "color",
		color: {r: T.pos(256), b: T.pos(256), g: T.pos(256), a: T.any(undefined, T.num)}
	});
var type_tile_svg = T.obj({
		type: "svg",
		img: T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024)
});
var type_tile_phisic = T.obj({
		type: "phisic",
		img: T.str(/^[\w\d\s+:;.,?=#\/<>"()-]*$/, 1024*1024),
		durability: T.any(Object.values(types_durability))
});
module.exports = {
	tile: T.any(type_tile_svg, type_tile, type_tile_phisic)
};

},{"./types_durability.json":22,"typesjs":21,"typesjs/str_type":20}],9:[function(require,module,exports){
const Draw = require("./Draw.js");
const CrLogic = require("./Logic.js");
const CrController = require("./Control.js");

var Logic = new CrLogic(Draw);
CrController(Logic);





},{"./Control.js":1,"./Draw.js":3,"./Logic.js":5}],10:[function(require,module,exports){
var Chromath = require('./src/chromath.js');
module.exports = Chromath;

},{"./src/chromath.js":11}],11:[function(require,module,exports){
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

},{"./colornames_css2":12,"./colornames_css3":13,"./parsers":14,"./prototype":15,"./util":16}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./util":16}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
(function (global){
(function(a,b){if("function"==typeof define&&define.amd)define([],b);else if("undefined"!=typeof exports)b();else{b(),a.FileSaver={exports:{}}.exports}})(this,function(){"use strict";function b(a,b){return"undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Depricated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(b,c,d){var e=new XMLHttpRequest;e.open("GET",b),e.responseType="blob",e.onload=function(){a(e.response,c,d)},e.onerror=function(){console.error("could not download file")},e.send()}function d(a){var b=new XMLHttpRequest;return b.open("HEAD",a,!1),b.send(),200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b)}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof global&&global.global===global?global:void 0,a=f.saveAs||"object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href)},4E4),setTimeout(function(){e(j)},0))}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else{var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i)})}}:function(a,b,d,e){if(e=e||open("","_blank"),e&&(e.document.title=e.document.body.innerText="downloading..."),"string"==typeof a)return c(a,b,d);var g="application/octet-stream"===a.type,h=/constructor/i.test(f.HTMLElement)||f.safari,i=/CriOS\/[\d]+/.test(navigator.userAgent);if((i||g&&h)&&"object"==typeof FileReader){var j=new FileReader;j.onloadend=function(){var a=j.result;a=i?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),e?e.location.href=a:location=a,e=null},j.readAsDataURL(a)}else{var k=f.URL||f.webkitURL,l=k.createObjectURL(a);e?e.location=l:location.href=l,e=null,setTimeout(function(){k.revokeObjectURL(l)},4E4)}};f.saveAs=a.saveAs=a,"undefined"!=typeof module&&(module.exports=a)});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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





},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"./mof.js":19}],22:[function(require,module,exports){
module.exports={
	"Дерево": "wood",
	"Камень": "stone",
	"Сталь": "steel",
	"Респ": "spawner"
}
},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0tvbG9ib2svRGVza3RvcC9Qb3J0UHJvZy9XaW42NC9ub2RlX3YxMS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiQ29udHJvbC5qcyIsIkNyU3dpdGNoZXMuanMiLCJEcmF3LmpzIiwiRXZlbnRzLmpzIiwiTG9naWMuanMiLCJTd2l0Y2guanMiLCJTeXNGaWxlcy5qcyIsIlR5cGVzLmpzIiwiYnJvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9zcmMvY2hyb21hdGguanMiLCJub2RlX21vZHVsZXMvY2hyb21hdGgvc3JjL2NvbG9ybmFtZXNfY3NzMi5qcyIsIm5vZGVfbW9kdWxlcy9jaHJvbWF0aC9zcmMvY29sb3JuYW1lc19jc3MzLmpzIiwibm9kZV9tb2R1bGVzL2Nocm9tYXRoL3NyYy9wYXJzZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Nocm9tYXRoL3NyYy9wcm90b3R5cGUuanMiLCJub2RlX21vZHVsZXMvY2hyb21hdGgvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZmlsZS1zYXZlci9kaXN0L0ZpbGVTYXZlci5taW4uanMiLCJub2RlX21vZHVsZXMvanMtYmFzZTY0L2Jhc2U2NC5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc2pzL21vZi5qcyIsIm5vZGVfbW9kdWxlcy90eXBlc2pzL3N0cl90eXBlLmpzIiwibm9kZV9tb2R1bGVzL3R5cGVzanMvdHlwZXMuanMiLCJ0eXBlc19kdXJhYmlsaXR5Lmpzb24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM0dBO0FBQ0E7QUFDQTs7Ozs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3VCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBIZWFyID0gcmVxdWlyZShcIi4vRXZlbnRzLmpzXCIpO1xyXG5jb25zdCBDaHJvbWF0aCA9IHJlcXVpcmUoJ2Nocm9tYXRoJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKExvZ2ljKXtcclxuXHRcclxuXHRcclxuXHJcblx0SGVhcihcIlRpbGVzXCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24oZXZlbnQpe1xyXG5cdFx0aWYoZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZShcInRpbGVcIikgIT09IG51bGwpIExvZ2ljLnNldFRpbGUoZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZShcInRpbGVcIikpO1xyXG5cdH0pO1xyXG5cclxuXHRIZWFyKFwiYWRkXCIsIFwic3VibWl0XCIsIGZ1bmN0aW9uKCl7IFxyXG5cclxuXHRcdHZhciB0aWxlID0ge1xyXG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUudmFsdWVcclxuXHRcdH07XHJcblxyXG5cdFx0aWYodGlsZS50eXBlID09IFwiY29sb3JcIilcclxuXHRcdFx0dGlsZS5jb2xvciA9IG5ldyBDaHJvbWF0aCh0aGlzLmNvbG9yLnZhbHVlKS50b1JHQkFPYmplY3QoKTtcclxuXHJcblx0XHRpZih0aWxlLnR5cGUgPT0gXCJzdmdcIil7XHJcblx0XHRcdGlmKHRoaXMuaW1nX3RpbGUuZmlsZXNbMF0pXHJcblx0XHRcdFx0dGlsZS5maWxlcyA9IHRoaXMuaW1nX3RpbGUuZmlsZXM7XHJcblx0XHRcdGVsc2UgcmV0dXJuOyBcclxuXHRcdH1cclxuXHJcblx0XHRpZih0aWxlLnR5cGUgPT0gXCJwaGlzaWNcIil7XHJcblx0XHRcdHRpbGUuZHVyYWJpbGl0eSA9IHRoaXMuZHVyYWJpbGl0eS52YWx1ZTtcclxuXHJcblx0XHRcdGlmKHRoaXMuaW1nX29iai5maWxlc1swXSlcclxuXHRcdFx0XHR0aWxlLmZpbGVzID0gdGhpcy5pbWdfb2JqLmZpbGVzO1xyXG5cdFx0XHRlbHNlIHJldHVybjsgXHJcblx0XHR9XHJcblxyXG5cdFx0TG9naWMuYWRkKHRpbGUpO1xyXG5cdFx0XHJcblx0fSk7XHJcblx0SGVhcihcImRlbGxcIiwgXCJjbGlja1wiLCBMb2dpYy5kZWxsLmJpbmQoTG9naWMpKTtcclxuXHRcclxuXHRIZWFyKFwic2F2ZVwiLCBcImNsaWNrXCIsIExvZ2ljLnNhdmUuYmluZChMb2dpYykpO1xyXG5cdEhlYXIoXCJvcGVuXCIsIFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzLmZpbGVzWzBdKSBMb2dpYy5sb2FkKHRoaXMuZmlsZXNbMF0pO1xyXG5cdH0pO1xyXG5cdFxyXG5cdFxyXG5cdEhlYXIoXCJWaWV3XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSl7XHJcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0dmFyIGJveCA9IGUuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdHZhciB4ID0gZS5jbGllbnRYIC0gYm94LmxlZnQ7XHJcblx0XHR2YXIgeSA9IGUuY2xpZW50WSAtIGJveC50b3A7XHJcblx0XHRcclxuXHRcdExvZ2ljLnNob3dUaWxlKHgsIHkpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdEhlYXIoXCJXaWR0aFwiLCBcImNoYW5nZVwiLCBmdW5jdGlvbihlKXtcclxuXHRcdExvZ2ljLnJlc2l6ZVRpbGUocGFyc2VJbnQoZS50YXJnZXQudmFsdWUpKTtcclxuXHR9KTtcclxuXHRIZWFyKFwiSGVpZ2h0XCIsIFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0TG9naWMucmVzaXplVGlsZShudWxsLCBwYXJzZUludChlLnRhcmdldC52YWx1ZSkpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuIiwiY29uc3QgSGVhciA9IHJlcXVpcmUoXCIuL0V2ZW50cy5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihEcmF3KXtcblxuXHRIZWFyKFwic3dpdGNoX2FkZFwiLCBcImNsaWNrXCIsIERyYXcuc3dpdGNoRWxlbShcImludmlzXCIsIFtcImFkZFwiLCBcInRpbGVfc2l6ZVwiXSkpO1xuXG5cdHZhciBzd2l0Y2hUeXBlVGlsZSA9IERyYXcuc3dpdGNoRWxlbShcImludmlzXCIsIHtcblx0XHRzdmc6IFwidHlwZV9zdmdcIiwgXG5cdFx0Y29sb3I6IFwidHlwZV9jb2xvclwiLCBcblx0XHRwaGlzaWM6IFwidHlwZV9waGlzaWNcIn0pO1xuXG5cdEhlYXIoXCJ0eXBlXCIsIFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGUpe1xuXHRcdHN3aXRjaFR5cGVUaWxlKGUudGFyZ2V0LnZhbHVlKTtcblx0XHRnZXROb2RlKFwiT0tcIikuY2xhc3NMaXN0LnJlbW92ZShcImludmlzXCIpO1xuXHR9KTtcblxuXHRIZWFyKFwiY2xlYXJcIiwgXCJjbGlja1wiLCBEcmF3LlZpZXcuY2xlYXIpO1xuXG59O1xuXG5mdW5jdGlvbiBnZXROb2RlKGlkKXtcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cdGlmKCFlbGVtKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtIGlzIG5vdCBmaW5kIVwiKTtcblx0cmV0dXJuIGVsZW07XG59IiwicmVxdWlyZShcInR5cGVzanNcIik7XHJcbmNvbnN0IFJHQiA9IHJlcXVpcmUoJ2Nocm9tYXRoJykucmdiO1xyXG5cclxudmFyIEJhc2U2NCA9IHJlcXVpcmUoJ2pzLWJhc2U2NCcpLkJhc2U2NDtcclxuY29uc3QgQ3JTd2l0Y2hlcyA9IHJlcXVpcmUoXCIuL0NyU3dpdGNoZXMuanNcIik7XHJcblxyXG5cclxudmFyIGlkX3RpbGVzX2xpc3QgPSBcIlRpbGVzXCI7XHJcbnZhciBpZF92aWV3ID0gXCJWaWV3XCI7XHJcbnZhciBpZF90eXBlcyA9IFwic2VsZWN0X3R5cGVzXCI7XHJcbnZhciBpZF9kdXIgPSBcInNlbGVjdF9kdXJhYmlsaXR5XCI7XHJcblxyXG52YXIgdHlwZV90aWxlID0ge1xyXG5cdFwi0KTQvtC90L7QstGL0Lkg0YLQsNC50LtcIjogXCJzdmdcIiwgXHJcblx0XCLQptCy0LXRgtC90L7QuSDRgtCw0LnQu1wiOiBcImNvbG9yXCIsIFxyXG5cdFwi0JjQs9GA0L7QstC+0Lkg0L7QsdGK0LXQutGCXCI6IFwicGhpc2ljXCJcclxufTtcclxudmFyIHR5cGVzX2R1cmFiaWxpdHkgPSByZXF1aXJlKFwiLi90eXBlc19kdXJhYmlsaXR5Lmpzb25cIik7XHJcblxyXG5cclxuZnVuY3Rpb24gQ3JUaWxlcyhpZCl7XHJcblx0dmFyIGNvbnRhaW5lciA9IGdldE5vZGUoaWQpO1xyXG5cdHZhciBjdXJyZW50X3RpbGUgPSBudWxsOyBcclxuXHJcblx0XHJcblx0dGhpcy5hZGRHZXRTZXQoXCJjdXJyZW50X3RpbGVcIiwgXHJcblx0XHRmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gY3VycmVudF90aWxlO1xyXG5cdFx0fSwgXHJcblx0XHRmdW5jdGlvbihuZXdfdGlsZSl7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgdGlsZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbdGlsZT1cIicgKyBuZXdfdGlsZS5pZCArICdcIl0nKTtcclxuXHRcdFx0aWYoIXRpbGUpIHRocm93IG5ldyBFcnJvcihcIlRpbGUgaXMgbm90IGZpbmQhXCIpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYoY3VycmVudF90aWxlKSBjdXJyZW50X3RpbGUuY2xhc3NMaXN0LnJlbW92ZShcImNoYW5nZWRcIik7XHJcblx0XHRcdHRpbGUuY2xhc3NMaXN0LmFkZChcImNoYW5nZWRcIik7XHJcblx0XHRcdGN1cnJlbnRfdGlsZSA9IHRpbGU7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihuZXdfdGlsZS53aWR0aCkgZ2V0Tm9kZShcIldpZHRoXCIpLnZhbHVlID0gbmV3X3RpbGUud2lkdGg7IFxyXG5cdFx0XHRlbHNlIGdldE5vZGUoXCJXaWR0aFwiKS52YWx1ZSA9IG51bGw7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihuZXdfdGlsZS5oZWlnaHQpIGdldE5vZGUoXCJIZWlnaHRcIikudmFsdWUgPSBuZXdfdGlsZS5oZWlnaHQ7XHJcblx0XHRcdGVsc2UgZ2V0Tm9kZShcIkhlaWdodFwiKS52YWx1ZSA9IG51bGw7XHJcblx0XHR9XHJcblx0KTtcclxuXHRcclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKG5ld190aWxlKXtcclxuXHRcdHZhciBUaWxlID0gZHJhd1RpbGUobmV3X3RpbGUpO1xyXG5cdFx0XHJcblx0XHRpZihjdXJyZW50X3RpbGUpIGN1cnJlbnRfdGlsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVCZWdpblwiLCBUaWxlKTtcclxuXHRcdGVsc2UgY29udGFpbmVyLmFwcGVuZENoaWxkKFRpbGUpO1xyXG5cdH1cclxuXHRcclxuXHR0aGlzLmRlbGwgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y3VycmVudF90aWxlLmNsYXNzTGlzdC5yZW1vdmUoXCJjaGFuZ2VkXCIpO1xyXG5cdFx0Y3VycmVudF90aWxlLnJlbW92ZSgpO1xyXG5cdFx0Y3VycmVudF90aWxlID0gbnVsbDtcclxuXHR9XHJcblxyXG5cdHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XHJcblx0XHRjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ3JWaWV3KGlkKXtcclxuXHR2YXIgY29udGFpbmVyID0gZ2V0Tm9kZShpZCk7XHJcblx0dmFyIHNpemUgPSAyMDtcclxuXHR0aGlzLmN1cnJlbnRfdGlsZSA9IG51bGw7XHJcblx0XHJcblx0ZHJhd0dyaWQoY29udGFpbmVyLCBzaXplKTtcclxuXHRcclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKG5ld190aWxlLCB4LCB5KXtcclxuXHRcdHZhciB0aWxlID0gZHJhd1RpbGUobmV3X3RpbGUpO1xyXG5cclxuXHRcdHRpbGUuc3R5bGUud2lkdGggPSAobmV3X3RpbGUud2lkdGggKiAoMTAwIC8gc2l6ZSkpICsgXCIlXCI7XHJcblx0XHR0aWxlLnN0eWxlLmhlaWdodCA9IChuZXdfdGlsZS5oZWlnaHQgKiAoMTAwIC8gc2l6ZSkpICsgXCIlXCI7XHJcblx0XHRcclxuXHRcdHRpbGUuc3R5bGUubGVmdCA9IHggICsgXCJweFwiO1xyXG5cdFx0dGlsZS5zdHlsZS50b3AgPSB5ICsgXCJweFwiO1xyXG5cdFx0XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQodGlsZSk7XHJcblx0XHROb3JtVGlsZSh0aWxlKTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5kZWxsID0gZnVuY3Rpb24oaWRfdGlsZSl7XHJcblx0XHR2YXIgdGlsZXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnW3RpbGU9XCInICsgaWRfdGlsZSArICdcIl0nKTtcclxuXHRcdHRpbGVzLmZvckVhY2godGlsZSA9PiB0aWxlLnJlbW92ZSgpKTtcclxuXHR9XHJcblx0dGhpcy5jbGVhciA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgdGlsZXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnW3RpbGVdJyk7XHJcblx0XHR0aWxlcy5mb3JFYWNoKHRpbGUgPT4gdGlsZS5yZW1vdmUoKSk7XHJcblx0fVxyXG5cdFxyXG5cdHRoaXMucmVzaXplID0gZnVuY3Rpb24odGlsZSl7XHJcblx0XHR2YXIgZWxlbXMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnW3RpbGU9XCInICsgdGlsZS5pZCArICdcIl0nKTtcclxuXHRcdGVsZW1zLmZvckVhY2godGlsZSA9PiB0aWxlLnJlbW92ZSgpKTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5tb3ZlID0gZnVuY3Rpb24oeCwgeSl7XHJcblx0XHRpZih0aGlzLmN1cnJlbnRfdGlsZSl7XHJcblx0XHRcdHZhciB0aWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmN1cnJlbnRfdGlsZSk7XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLmN1cnJlbnRfdGlsZS5zdHlsZS5sZWZ0ID0gKHBhcnNlRmxvYXQodGlsZS5sZWZ0KSArIHgpICsgXCJweFwiO1xyXG5cdFx0XHR0aGlzLmN1cnJlbnRfdGlsZS5zdHlsZS50b3AgPSAocGFyc2VGbG9hdCh0aWxlLnRvcCkgKyB5KSArIFwicHhcIjtcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblx0dGhpcy5ub3JtID0gZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMuY3VycmVudF90aWxlKSBOb3JtVGlsZSh0aGlzLmN1cnJlbnRfdGlsZSk7XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIE5vcm1UaWxlKHRpbGUpe1xyXG5cdFx0dmFyIGJveCA9IGdldENvbXB1dGVkU3R5bGUodGlsZSk7XHJcblx0XHR0aWxlLnN0eWxlLmxlZnQgPSBOb3JtQ29vcmQocGFyc2VGbG9hdChib3gubGVmdCksIHBhcnNlRmxvYXQoYm94LndpZHRoKSkgKyBcIiVcIjtcclxuXHRcdHRpbGUuc3R5bGUudG9wID0gTm9ybUNvb3JkKHBhcnNlRmxvYXQoYm94LnRvcCksIHBhcnNlRmxvYXQoYm94LmhlaWdodCkpICsgXCIlXCI7XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIE5vcm1Db29yZChjb29yZCwgcyl7XHJcblx0XHR2YXIgY29uX3NpemUgPSBwYXJzZUZsb2F0KGdldENvbXB1dGVkU3R5bGUoY29udGFpbmVyKS53aWR0aCk7XHJcblx0XHRcclxuXHRcdGlmKGNvb3JkICsgcyA+IGNvbl9zaXplKSBjb29yZCA9IGNvbl9zaXplIC0gcztcclxuXHRcdGlmKGNvb3JkIDwgMCkgY29vcmQgPSAwO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gTWF0aC5yb3VuZCgoY29vcmQgLyBjb25fc2l6ZSkgKiBzaXplKSAqICgxMDAgLyBzaXplKTtcclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gZHJhd0dyaWQoY29udGFpbmVyLCBncmlkX3NpemUpe1xyXG5cdFx0dmFyIHNpemUgPSAxMDAgLyBncmlkX3NpemU7XHJcblx0XHRmb3IodmFyIGkgPSBncmlkX3NpemUgLSAxOyBpID49IDA7IGktLSl7XHJcblx0XHRcdGZvcih2YXIgaiA9IGdyaWRfc2l6ZSAtIDE7IGogPj0gMDsgai0tKXtcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoZGFyd0JveChpKnNpemUsIGoqc2l6ZSwgc2l6ZSkpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cdGZ1bmN0aW9uIGRhcndCb3goeCwgeSwgc2l6ZSl7XHJcblx0XHR2YXIgYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRib3guY2xhc3NMaXN0LmFkZChcImJveFwiKTtcclxuXHRcdGJveC5zdHlsZS53aWR0aCA9IHNpemUgKyBcIiVcIjtcclxuXHRcdGJveC5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCIlXCI7XHJcblx0XHRcclxuXHRcdGJveC5zdHlsZS5sZWZ0ID0geCArIFwiJVwiO1xyXG5cdFx0Ym94LnN0eWxlLnRvcCA9IHkgKyBcIiVcIjtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIGJveDtcclxuXHR9XHJcblx0XHJcbn1cclxuXHJcbmRyYXdTZWxlY3QoZ2V0Tm9kZShpZF90eXBlcyksIHR5cGVfdGlsZSwgXCJ0eXBlXCIpO1xyXG5kcmF3U2VsZWN0KGdldE5vZGUoaWRfZHVyKSwgdHlwZXNfZHVyYWJpbGl0eSwgXCJkdXJhYmlsaXR5XCIpO1xyXG5cclxudmFyIERyYXcgPSB7XHJcblx0VGlsZXM6IG5ldyBDclRpbGVzKGlkX3RpbGVzX2xpc3QpLFxyXG5cdFZpZXc6IG5ldyBDclZpZXcoaWRfdmlldyksXHJcblx0c3dpdGNoRWxlbTogcmVxdWlyZShcIi4vU3dpdGNoLmpzXCIpXHJcbn07XHJcblxyXG5DclN3aXRjaGVzKERyYXcpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IERyYXc7XHJcblxyXG5mdW5jdGlvbiBkcmF3U2VsZWN0KGNvbnRhaW5lciwgbGlzdCwgbmFtZSl7XHJcblx0dmFyIHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XHJcblx0XHRzZWxlY3Quc2V0QXR0cmlidXRlKFwibmFtZVwiLCBuYW1lKTtcclxuXHRcdHNlbGVjdC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBuYW1lKTtcclxuXHJcblx0Zm9yICh2YXIgdmFsIGluIGxpc3Qpe1xyXG5cdFx0dmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XHJcblx0XHRvcHQudmFsdWUgPSBsaXN0W3ZhbF07XHJcblx0XHRvcHQuaW5uZXJIVE1MID0gdmFsO1xyXG5cdFx0c2VsZWN0LmFwcGVuZENoaWxkKG9wdCk7XHJcblx0fVxyXG5cclxuXHRjb250YWluZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJFbmRcIiwgc2VsZWN0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhd1RpbGUobmV3X3RpbGUpe1xyXG5cdFxyXG5cdGlmKG5ld190aWxlLnR5cGUgPT0gXCJjb2xvclwiKXtcclxuXHRcdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHRcdGltZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBuZXcgUkdCKG5ld190aWxlLmNvbG9yKS50b1N0cmluZygpO1xyXG5cdH1cclxuXHRpZihuZXdfdGlsZS50eXBlID09IFwic3ZnXCIgfHwgbmV3X3RpbGUudHlwZSA9PSBcInBoaXNpY1wiKXtcclxuXHRcdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHRcdGltZy5zcmMgPSBcImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsXCIrIEJhc2U2NC5lbmNvZGUobmV3X3RpbGUuaW1nKTtcclxuXHRcdGNvbnNvbGUubG9nKGltZy5zcmMpO1xyXG5cdH1cclxuXHJcblx0aW1nLmNsYXNzTGlzdC5hZGQoXCJ0aWxlXCIpO1xyXG5cdGltZy5zZXRBdHRyaWJ1dGUoXCJ0aWxlXCIsIG5ld190aWxlLmlkKTtcclxuXHRpbWcuc2V0QXR0cmlidXRlKFwiZHJhZ2dhYmxlXCIsIHRydWUpO1xyXG5cdFxyXG5cdHJldHVybiBpbWc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE5vZGUoaWQpe1xyXG5cdHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG5cdGlmKCFlbGVtKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtIGlzIG5vdCBmaW5kIVwiKTtcclxuXHRyZXR1cm4gZWxlbTtcclxufVxyXG4iLCJcclxuZnVuY3Rpb24gSWRFdmVudChpZCwgbmFtZV9ldmVudCwgZnVuYyl7XHJcblx0XHJcblx0aWYobmFtZV9ldmVudCA9PSBcInN1Ym1pdFwiKXtcclxuXHRcdHZhciBvbGRfZnVuYyA9IGZ1bmM7XHJcblx0XHRmdW5jID0gZnVuY3Rpb24oZSl7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0b2xkX2Z1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdH0gXHJcblx0fVxyXG5cdFxyXG5cdGlmKEFycmF5LmlzQXJyYXkobmFtZV9ldmVudCkpe1xyXG5cdFx0bmFtZV9ldmVudC5mb3JFYWNoKG5hbWUgPT4gZ2V0Tm9kZShpZCkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jKSk7XHJcblx0fVxyXG5cdGVsc2UgZ2V0Tm9kZShpZCkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lX2V2ZW50LCBmdW5jKTtcclxufVxyXG5cclxuZnVuY3Rpb24gU3VibWl0KGZ1bmMpe1xyXG5cdHJldHVybiBmdW5jdGlvbihldmVudCl7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZShpZCl7XHJcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xyXG5cdHJldHVybiBlbGVtO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IElkRXZlbnQ7XHJcbiIsInZhciBUeXBlcyA9IHJlcXVpcmUoXCIuL1R5cGVzLmpzXCIpO1xyXG52YXIgVCA9IE9iamVjdC50eXBlcztcclxuXHJcbnZhciBGaWxlcyA9IHJlcXVpcmUoXCIuL1N5c0ZpbGVzLmpzXCIpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIENyTG9naWMoRHJhdyl7XHJcblx0dmFyIHRpbGVzID0gW107XHJcblx0dmFyIGN1cnJlbnRfdGlsZSA9IG51bGw7XHJcblx0dmFyIHRpbGVzX2NvdW50ID0gMDtcclxuXHRcclxuXHR2YXIgZGVmX3dpZHRoID0gMTtcclxuXHR2YXIgZGVmX2hlaWdodCA9IDE7XHJcblx0XHJcblx0dGhpcy5zZXRUaWxlID0gZnVuY3Rpb24odmFsKXtcclxuXHRcdHZhciBmaW5kZWRfdGlsZSA9IGdldFRpbGUodmFsKTtcclxuXHRcdFxyXG5cdFx0aWYoIWZpbmRlZF90aWxlKSB0aHJvdyBuZXcgRXJyb3IoXCJUaWxlIGlzIG5vdCBmaW5kIVwiKTtcclxuXHRcdFxyXG5cdFx0RHJhdy5UaWxlcy5jdXJyZW50X3RpbGUgPSBmaW5kZWRfdGlsZTtcclxuXHRcdGN1cnJlbnRfdGlsZSA9IGZpbmRlZF90aWxlO1xyXG5cdH1cclxuXHRcclxuXHR0aGlzLmFkZCA9IGZ1bmN0aW9uKHRpbGUpe1xyXG5cdFx0aWYodGlsZS5maWxlcyl7XHJcblx0XHRcdHZhciBmaWxlcyA9IHRpbGUuZmlsZXM7XHJcblx0XHRcdGRlbGV0ZSB0aWxlLmZpbGVzO1xyXG5cclxuXHRcdFx0aWYoKHRpbGUudHlwZSA9PSBcInN2Z1wiIHx8IHRpbGUudHlwZSA9PSBcInBoaXNpY1wiKSAmJiBmaWxlc1swXSl7XHJcblx0XHRcdFx0RmlsZXMub3BlbihmaWxlc1swXSwgZnVuY3Rpb24oaW1nKXtcclxuXHRcdFx0XHRcdHRpbGUuaW1nID0gaW1nLmNvbnRlbnQ7XHJcblx0XHRcdFx0XHRBZGQodGlsZSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgQWRkKHRpbGUpO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuZGVsbCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRpZihjdXJyZW50X3RpbGUgIT09IG51bGwpe1xyXG5cdFx0XHREcmF3LlZpZXcuZGVsbChjdXJyZW50X3RpbGUuaWQpO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGluZGV4ID0gdGlsZXMuaW5kZXhPZihjdXJyZW50X3RpbGUpO1xyXG5cdFx0XHR0aWxlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cdFx0XHREcmF3LlRpbGVzLmRlbGwoKTtcclxuXHRcdFx0XHJcblx0XHRcdGlmKHRpbGVzWzBdKXtcclxuXHRcdFx0XHRjdXJyZW50X3RpbGUgPSB0aWxlc1swXTtcclxuXHRcdFx0XHREcmF3LlRpbGVzLmN1cnJlbnRfdGlsZSA9IHRpbGVzWzBdO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2V7XHJcblx0XHRcdFx0Y3VycmVudF90aWxlID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHR0aGlzLnNhdmUgPSBmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGRhdGEgPSB0aWxlcy5tYXAoZnVuY3Rpb24odGlsZSwgaSl7XHJcblx0XHRcdHRpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB0aWxlKTtcclxuXHRcdFx0dGlsZS5pZCA9IGk7IFxyXG5cdFx0XHRyZXR1cm4gdGlsZTsgXHJcblx0XHR9KTtcclxuXHRcdGRhdGEgPSB7dGlsZXM6IGRhdGEsIHdpZHRoOiBkZWZfd2lkdGgsIGhlaWdodDogZGVmX2hlaWdodH1cclxuXHRcdEZpbGVzLnNhdmUoXCJ0aWxlc2V0Lmpzb25cIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMSkpO1xyXG5cdH1cclxuXHR0aGlzLmxvYWQgPSBmdW5jdGlvbihmaWxlLCBpc19zYXZlPWZhbHNlKXtcclxuXHRcdGlmKGlzX3NhdmUpIHRoaXMuc2F2ZSgpO1xyXG5cclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHRcdEZpbGVzLm9wZW4oZmlsZSwgZnVuY3Rpb24oZmlsZSl7XHJcblx0XHRcdExvYWQoSlNPTi5wYXJzZShmaWxlLmNvbnRlbnQpKTtcclxuXHRcdFx0c2VsZi5zZXRUaWxlKDApO1xyXG5cdFx0fSk7XHJcblxyXG5cclxuXHR9XHJcblx0XHJcblx0dGhpcy5nZXRUaWxlID0gZnVuY3Rpb24oKXtcclxuXHRcdHZhciB0aWxlID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudF90aWxlKTtcclxuXHRcdGlmKHRpbGUud2lkdGggPT09IHVuZGVmaW5lZCkgdGlsZS53aWR0aCA9IGRlZl93aWR0aDtcclxuXHRcdGlmKHRpbGUuaGVpZ2h0ID09PSB1bmRlZmluZWQpIHRpbGUuaGVpZ2h0ID0gZGVmX2hlaWdodDtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHRpbGU7XHJcblx0fVxyXG5cclxuXHR0aGlzLnNob3dUaWxlID0gZnVuY3Rpb24oeCwgeSl7XHJcblx0XHRpZihjdXJyZW50X3RpbGUpIFxyXG5cdFx0XHREcmF3LlZpZXcuYWRkKHRoaXMuZ2V0VGlsZSgpLCB4LCB5KTtcclxuXHR9XHJcblx0XHJcblx0dGhpcy5yZXNpemVUaWxlID0gZnVuY3Rpb24odywgaCl7XHJcblx0XHRpZihjdXJyZW50X3RpbGUpe1xyXG5cdFx0XHRpZighY3VycmVudF90aWxlLndpZHRoKSBjdXJyZW50X3RpbGUud2lkdGggPSBkZWZfd2lkdGg7XHJcblx0XHRcdGlmKCFjdXJyZW50X3RpbGUuaGVpZ2h0KSBjdXJyZW50X3RpbGUuaGVpZ2h0ID0gZGVmX2hlaWdodDtcclxuXHRcdFx0XHJcblx0XHRcdGlmKCFULnBvcy50ZXN0KHcpKSBjdXJyZW50X3RpbGUud2lkdGggPSB3O1xyXG5cdFx0XHRpZighVC5wb3MudGVzdChoKSkgY3VycmVudF90aWxlLmhlaWdodCA9IGg7XHJcblx0XHRcdFxyXG5cdFx0XHREcmF3LlZpZXcucmVzaXplKGN1cnJlbnRfdGlsZSk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihjdXJyZW50X3RpbGUud2lkdGggPT09IGRlZl93aWR0aCkgY3VycmVudF90aWxlLndpZHRoID0gdW5kZWZpbmVkO1xyXG5cdFx0XHRpZihjdXJyZW50X3RpbGUuaGVpZ2h0ID09PSBkZWZfaGVpZ2h0KSBjdXJyZW50X3RpbGUuaGVpZ2h0ID0gdW5kZWZpbmVkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxuXHRmdW5jdGlvbiBnZXRUaWxlKGlkKXtcclxuXHRcdHJldHVybiB0aWxlcy5maWx0ZXIodGlsZSA9PiBpZCA9PSB0aWxlLmlkKVswXTtcclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gQWRkKHRpbGUpe1xyXG5cdFx0aWYoVHlwZXMudGlsZS50ZXN0KHRpbGUpKSB0aHJvdyBUeXBlcy50aWxlLnRlc3QodGlsZSk7XHJcblx0XHR0aWxlLmlkID0gdGlsZXNfY291bnQrKztcclxuXHRcdFxyXG5cdFx0aWYoY3VycmVudF90aWxlID09PSBudWxsKXRpbGVzLnB1c2godGlsZSk7XHJcblx0XHRlbHNlIHRpbGVzLnNwbGljZShnZXRUaWxlKGN1cnJlbnRfdGlsZSksIDAsIHRpbGUpO1xyXG5cdFx0XHJcblx0XHREcmF3LlRpbGVzLmFkZCh0aWxlKTtcclxuXHR9XHJcblx0XHJcblx0ZnVuY3Rpb24gTG9hZChuZXdfdGlsZXMpe1xyXG5cclxuXHRcdENsZWFyKCk7XHJcblx0XHRuZXdfdGlsZXMudGlsZXMuZm9yRWFjaChBZGQpO1xyXG5cdFx0XHJcblx0XHRkZWZfd2lkdGggPSBuZXdfdGlsZXMud2lkdGg7XHJcblx0XHRkZWZfaGVpZ2h0ID0gbmV3X3RpbGVzLmhlaWdodDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIENsZWFyKCl7XHJcblx0XHREcmF3LlZpZXcuY2xlYXIoKTtcclxuXHRcdERyYXcuVGlsZXMuY2xlYXIoKTtcclxuXHRcdHRpbGVzID0gW107XHJcblx0XHRjdXJyZW50X3RpbGUgPSBudWxsO1xyXG5cdFx0dGlsZXNfY291bnQgPSAwO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDckxvZ2ljO1xyXG4iLCJmdW5jdGlvbiBDclN3aXRjaChuYW1lX2NsYXNzLCBpZHMpe1xuXHRpZihBcnJheS5pc0FycmF5KGlkcykpe1xuXHRcdHZhciBlbGVtcyA9IGlkcy5tYXAoZ2V0Tm9kZSk7XG5cdFx0ZWxlbXMgPSBlbGVtcy5tYXAoZWxlbSA9PiBlbGVtLmNsYXNzTGlzdCk7XG5cblx0XHRyZXR1cm4gYXJyU3dpY3RoLmJpbmQobnVsbCwgZWxlbXMsIG5hbWVfY2xhc3MpO1xuXHR9XG5cdGVsc2UgaWYodHlwZW9mIGlkcyA9PSBcIm9iamVjdFwiKXtcblx0XHRyZXR1cm4gb2JqU3dpdGNoKGlkcywgbmFtZV9jbGFzcyk7XG5cdH1cblx0ZWxzZXtcblx0XHR2YXIgZWxlbSA9IGdldE5vZGUoaWRzKS5jbGFzc0xpc3Q7XG5cdFx0cmV0dXJuIG9uZVN3aXRjaC5iaW5kKG51bGwsIG5hbWVfY2xhc3MsIGVsZW0pO1xuXHR9XG5cdFxufVxuXG5mdW5jdGlvbiBvYmpTd2l0Y2goaWRfb2JqLCBjbGFzc19uYW1lKXtcblx0Zm9yICh2YXIga2V5IGluIGlkX29iail7XG5cdFx0aWRfb2JqW2tleV0gPSBnZXROb2RlKGlkX29ialtrZXldKS5jbGFzc0xpc3Q7XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24oaWQpe1xuXHRcdGZvciAodmFyIGkgaW4gaWRfb2JqKXtcblx0XHRcdGlkX29ialtpXS5hZGQoY2xhc3NfbmFtZSk7XG5cdFx0fVxuXHRcdFxuXHRcdGlkX29ialtpZF0ucmVtb3ZlKGNsYXNzX25hbWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFyclN3aWN0aChlbGVtX2FyciwgbmFtZV9jbGFzcyl7XG5cdGVsZW1fYXJyLmZvckVhY2gob25lU3dpdGNoLmJpbmQobnVsbCwgbmFtZV9jbGFzcykpO1xufVxuXG5mdW5jdGlvbiBvbmVTd2l0Y2gobmFtZV9jbGFzcywgZWxlbSl7XG5cdFx0ZWxlbS50b2dnbGUobmFtZV9jbGFzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ3JTd2l0Y2g7XG5cbmZ1bmN0aW9uIGdldE5vZGUoaWQpe1xuXHR2YXIgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblx0aWYoIWVsZW0pIHRocm93IG5ldyBFcnJvcihcIkVsZW0gaXMgbm90IGZpbmQhXCIpO1xuXHRyZXR1cm4gZWxlbTtcbn0iLCJ2YXIgRmlsZVNhdmVyID0gcmVxdWlyZSgnZmlsZS1zYXZlcicpO1xuXG5mdW5jdGlvbiBPcGVuKGZpbGUsIGNhbGxiYWNrKXtcblx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFxuXHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSl7XG5cdFx0ZmlsZS5jb250ZW50ID0gZS50YXJnZXQucmVzdWx0O1xuXHRcdGZpbGUubmFtZSA9IG5hbWU7XG5cdFx0Y2FsbGJhY2soZmlsZSk7XG5cdH07XG5cdHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xufVxuXG5mdW5jdGlvbiBTYXZlKG5hbWUsIHRleHQpe1xuXHR2YXIgYmxvYiA9IG5ldyBCbG9iKFt0ZXh0XSwge3R5cGU6IFwidGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04XCJ9KTtcblx0RmlsZVNhdmVyLnNhdmVBcyhibG9iLCBuYW1lKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7c2F2ZTogU2F2ZSwgb3BlbjogT3Blbn07IiwicmVxdWlyZShcInR5cGVzanNcIik7XHJcbnJlcXVpcmUoXCJ0eXBlc2pzL3N0cl90eXBlXCIpO1xyXG5cclxudmFyIHR5cGVzX2R1cmFiaWxpdHkgPSByZXF1aXJlKFwiLi90eXBlc19kdXJhYmlsaXR5Lmpzb25cIik7XHJcblxyXG52YXIgVCA9IE9iamVjdC50eXBlcztcclxuXHJcbnZhciB0eXBlX3RpbGUgPSBULm9iaih7XHJcblx0XHR0eXBlOiBcImNvbG9yXCIsXHJcblx0XHRjb2xvcjoge3I6IFQucG9zKDI1NiksIGI6IFQucG9zKDI1NiksIGc6IFQucG9zKDI1NiksIGE6IFQuYW55KHVuZGVmaW5lZCwgVC5udW0pfVxyXG5cdH0pO1xyXG52YXIgdHlwZV90aWxlX3N2ZyA9IFQub2JqKHtcclxuXHRcdHR5cGU6IFwic3ZnXCIsXHJcblx0XHRpbWc6IFQuc3RyKC9eW1xcd1xcZFxccys6Oy4sPz0jXFwvPD5cIigpLV0qJC8sIDEwMjQqMTAyNClcclxufSk7XHJcbnZhciB0eXBlX3RpbGVfcGhpc2ljID0gVC5vYmooe1xyXG5cdFx0dHlwZTogXCJwaGlzaWNcIixcclxuXHRcdGltZzogVC5zdHIoL15bXFx3XFxkXFxzKzo7Liw/PSNcXC88PlwiKCktXSokLywgMTAyNCoxMDI0KSxcclxuXHRcdGR1cmFiaWxpdHk6IFQuYW55KE9iamVjdC52YWx1ZXModHlwZXNfZHVyYWJpbGl0eSkpXHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHR0aWxlOiBULmFueSh0eXBlX3RpbGVfc3ZnLCB0eXBlX3RpbGUsIHR5cGVfdGlsZV9waGlzaWMpXHJcbn07XHJcbiIsImNvbnN0IERyYXcgPSByZXF1aXJlKFwiLi9EcmF3LmpzXCIpO1xyXG5jb25zdCBDckxvZ2ljID0gcmVxdWlyZShcIi4vTG9naWMuanNcIik7XHJcbmNvbnN0IENyQ29udHJvbGxlciA9IHJlcXVpcmUoXCIuL0NvbnRyb2wuanNcIik7XHJcblxyXG52YXIgTG9naWMgPSBuZXcgQ3JMb2dpYyhEcmF3KTtcclxuQ3JDb250cm9sbGVyKExvZ2ljKTtcclxuXHJcblxyXG5cclxuXHJcbiIsInZhciBDaHJvbWF0aCA9IHJlcXVpcmUoJy4vc3JjL2Nocm9tYXRoLmpzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IENocm9tYXRoO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbi8qXG4gICBDbGFzczogQ2hyb21hdGhcbiovXG4vLyBHcm91cDogQ29uc3RydWN0b3JzXG4vKlxuICAgQ29uc3RydWN0b3I6IENocm9tYXRoXG4gICBDcmVhdGUgYSBuZXcgQ2hyb21hdGggaW5zdGFuY2UgZnJvbSBhIHN0cmluZyBvciBpbnRlZ2VyXG5cbiAgIFBhcmFtZXRlcnM6XG4gICBtaXhlZCAtIFRoZSB2YWx1ZSB0byB1c2UgZm9yIGNyZWF0aW5nIHRoZSBjb2xvclxuXG4gICBSZXR1cm5zOlxuICAgPENocm9tYXRoPiBpbnN0YW5jZVxuXG4gICBQcm9wZXJ0aWVzOlxuICAgciAtIFRoZSByZWQgY2hhbm5lbCBvZiB0aGUgUkdCIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAyNTUuXG4gICBnIC0gVGhlIGdyZWVuIGNoYW5uZWwgb2YgdGhlIFJHQiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMjU1LlxuICAgYiAtIFRoZSBibHVlIGNoYW5uZWwgb2YgdGhlIFJHQiByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMjU1LlxuICAgYSAtIFRoZSBhbHBoYSBjaGFubmVsIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxLlxuICAgaCAtIFRoZSBodWUgb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDM2MC5cbiAgIHNsIC0gVGhlIHNhdHVyYXRpb24gb2YgdGhlIEhTTCByZXByZXNlbnRhdGlvbiBvZiB0aGUgQ2hyb21hdGguIEEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMS5cbiAgIHN2IC0gVGhlIHNhdHVyYXRpb24gb2YgdGhlIEhTVi9IU0IgcmVwcmVzZW50YXRpb24gb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEuXG4gICBsIC0gVGhlIGxpZ2h0bmVzcyBvZiB0aGUgSFNMIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDaHJvbWF0aC4gQSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxLlxuICAgdiAtIFRoZSBsaWdodG5lc3Mgb2YgdGhlIEhTVi9IU0IgcmVwcmVzZW50YXRpb24gb2YgdGhlIENocm9tYXRoLiBBIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEuXG5cbiAgIEV4YW1wbGVzOlxuICAoc3RhcnQgY29kZSlcbi8vIFRoZXJlIGFyZSBtYW55IHdheXMgdG8gY3JlYXRlIGEgQ2hyb21hdGggaW5zdGFuY2Vcbm5ldyBDaHJvbWF0aCgnI0ZGMDAwMCcpOyAgICAgICAgICAgICAgICAgIC8vIEhleCAoNiBjaGFyYWN0ZXJzIHdpdGggaGFzaClcbm5ldyBDaHJvbWF0aCgnRkYwMDAwJyk7ICAgICAgICAgICAgICAgICAgIC8vIEhleCAoNiBjaGFyYWN0ZXJzIHdpdGhvdXQgaGFzaClcbm5ldyBDaHJvbWF0aCgnI0YwMCcpOyAgICAgICAgICAgICAgICAgICAgIC8vIEhleCAoMyBjaGFyYWN0ZXJzIHdpdGggaGFzaClcbm5ldyBDaHJvbWF0aCgnRjAwJyk7ICAgICAgICAgICAgICAgICAgICAgIC8vIEhleCAoMyBjaGFyYWN0ZXJzIHdpdGhvdXQgaGFzaClcbm5ldyBDaHJvbWF0aCgncmVkJyk7ICAgICAgICAgICAgICAgICAgICAgIC8vIENTUy9TVkcgQ29sb3IgbmFtZVxubmV3IENocm9tYXRoKCdyZ2IoMjU1LCAwLCAwKScpOyAgICAgICAgICAgLy8gUkdCIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7cjogMjU1LCBnOiAwLCBiOiAwfSk7ICAgICAgIC8vIFJHQiB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ3JnYmEoMjU1LCAwLCAwLCAxKScpOyAgICAgICAvLyBSR0JBIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7cjogMjU1LCBnOiAwLCBiOiAwLCBhOiAxfSk7IC8vIFJHQkEgdmlhIG9iamVjdFxubmV3IENocm9tYXRoKCdoc2woMCwgMTAwJSwgNTAlKScpOyAgICAgICAgLy8gSFNMIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgbDogMC41fSk7ICAgICAgIC8vIEhTTCB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzbGEoMCwgMTAwJSwgNTAlLCAxKScpOyAgICAvLyBIU0xBIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgbDogMC41LCBhOiAxfSk7IC8vIEhTTEEgdmlhIG9iamVjdFxubmV3IENocm9tYXRoKCdoc3YoMCwgMTAwJSwgMTAwJSknKTsgICAgICAgLy8gSFNWIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgdjogMX0pOyAgICAgICAgIC8vIEhTViB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzdmEoMCwgMTAwJSwgMTAwJSwgMSknKTsgICAvLyBIU1ZBIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgdjogMSwgYTogMX0pOyAgIC8vIEhTVkEgdmlhIG9iamVjdFxubmV3IENocm9tYXRoKCdoc2IoMCwgMTAwJSwgMTAwJSknKTsgICAgICAgLy8gSFNCIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgYjogMX0pOyAgICAgICAgIC8vIEhTQiB2aWEgb2JqZWN0XG5uZXcgQ2hyb21hdGgoJ2hzYmEoMCwgMTAwJSwgMTAwJSwgMSknKTsgICAvLyBIU0JBIHZpYSBDU1Ncbm5ldyBDaHJvbWF0aCh7aDogMCwgczogMSwgYjogMSwgYTogMX0pOyAgIC8vIEhTQkEgdmlhIG9iamVjdFxubmV3IENocm9tYXRoKDE2NzExNjgwKTsgICAgICAgICAgICAgICAgICAgLy8gUkdCIHZpYSBpbnRlZ2VyIChhbHBoYSBjdXJyZW50bHkgaWdub3JlZClcbihlbmQgY29kZSlcbiovXG5mdW5jdGlvbiBDaHJvbWF0aCggbWl4ZWQgKVxue1xuICAgIHZhciBjaGFubmVscywgY29sb3IsIGhzbCwgaHN2LCByZ2I7XG5cbiAgICBpZiAodXRpbC5pc1N0cmluZyhtaXhlZCkgfHwgdXRpbC5pc051bWJlcihtaXhlZCkpIHtcbiAgICAgICAgY2hhbm5lbHMgPSBDaHJvbWF0aC5wYXJzZShtaXhlZCk7XG4gICAgfSBlbHNlIGlmICh1dGlsLmlzQXJyYXkobWl4ZWQpKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cmUgaG93IHRvIHBhcnNlIGFycmF5IGAnK21peGVkKydgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnLCBwbGVhc2UgcGFzcyBhbiBvYmplY3Qgb3IgQ1NTIHN0eWxlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ29yIHRyeSBDaHJvbWF0aC5yZ2IsIENocm9tYXRoLmhzbCwgb3IgQ2hyb21hdGguaHN2J1xuICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAobWl4ZWQgaW5zdGFuY2VvZiBDaHJvbWF0aCkge1xuICAgICAgICBjaGFubmVscyA9IHV0aWwubWVyZ2Uoe30sIG1peGVkKTtcbiAgICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QobWl4ZWQpKXtcbiAgICAgICAgY2hhbm5lbHMgPSB1dGlsLm1lcmdlKHt9LCBtaXhlZCk7XG4gICAgfVxuXG4gICAgaWYgKCEgY2hhbm5lbHMpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IHBhcnNlIGAnK21peGVkKydgJyk7XG4gICAgZWxzZSBpZiAoIWlzRmluaXRlKGNoYW5uZWxzLmEpKVxuICAgICAgICBjaGFubmVscy5hID0gMTtcblxuICAgIGlmICgncicgaW4gY2hhbm5lbHMgKXtcbiAgICAgICAgcmdiID0gdXRpbC5yZ2Iuc2NhbGVkMDEoW2NoYW5uZWxzLnIsIGNoYW5uZWxzLmcsIGNoYW5uZWxzLmJdKTtcbiAgICAgICAgaHNsID0gQ2hyb21hdGgucmdiMmhzbChyZ2IpO1xuICAgICAgICBoc3YgPSBDaHJvbWF0aC5yZ2IyaHN2KHJnYik7XG4gICAgfSBlbHNlIGlmICgnaCcgaW4gY2hhbm5lbHMgKXtcbiAgICAgICAgaWYgKCdsJyBpbiBjaGFubmVscyl7XG4gICAgICAgICAgICBoc2wgPSB1dGlsLmhzbC5zY2FsZWQoW2NoYW5uZWxzLmgsIGNoYW5uZWxzLnMsIGNoYW5uZWxzLmxdKTtcbiAgICAgICAgICAgIHJnYiA9IENocm9tYXRoLmhzbDJyZ2IoaHNsKTtcbiAgICAgICAgICAgIGhzdiA9IENocm9tYXRoLnJnYjJoc3YocmdiKTtcbiAgICAgICAgfSBlbHNlIGlmICgndicgaW4gY2hhbm5lbHMgfHwgJ2InIGluIGNoYW5uZWxzKSB7XG4gICAgICAgICAgICBpZiAoJ2InIGluIGNoYW5uZWxzKSBjaGFubmVscy52ID0gY2hhbm5lbHMuYjtcbiAgICAgICAgICAgIGhzdiA9IHV0aWwuaHNsLnNjYWxlZChbY2hhbm5lbHMuaCwgY2hhbm5lbHMucywgY2hhbm5lbHMudl0pO1xuICAgICAgICAgICAgcmdiID0gQ2hyb21hdGguaHN2MnJnYihoc3YpO1xuICAgICAgICAgICAgaHNsID0gQ2hyb21hdGgucmdiMmhzbChyZ2IpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICB1dGlsLm1lcmdlKHRoaXMsIHtcbiAgICAgICAgcjogIHJnYlswXSwgIGc6IHJnYlsxXSwgYjogcmdiWzJdLFxuICAgICAgICBoOiAgaHNsWzBdLCBzbDogaHNsWzFdLCBsOiBoc2xbMl0sXG4gICAgICAgIHN2OiBoc3ZbMV0sICB2OiBoc3ZbMl0sIGE6IGNoYW5uZWxzLmFcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKlxuICBDb25zdHJ1Y3RvcjogQ2hyb21hdGgucmdiXG4gIENyZWF0ZSBhIG5ldyA8Q2hyb21hdGg+IGluc3RhbmNlIGZyb20gUkdCIHZhbHVlc1xuXG4gIFBhcmFtZXRlcnM6XG4gIHIgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIGdyZWVuIGNoYW5uZWwgT1IgQXJyYXkgT1Igb2JqZWN0ICh3aXRoIGtleXMgcixnLGIpIG9mIFJHQiB2YWx1ZXNcbiAgZyAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgZ3JlZW4gY2hhbm5lbFxuICBiIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSByZWQgY2hhbm5lbFxuICBhIC0gKE9wdGlvbmFsKSBGbG9hdCwgMC0xLCByZXByZXNlbnRpbmcgdGhlIGFscGhhIGNoYW5uZWxcblxuIFJldHVybnM6XG4gPENocm9tYXRoPlxuXG4gRXhhbXBsZXM6XG4gPiA+IG5ldyBDaHJvbWF0aC5yZ2IoMTIzLCAyMzQsIDU2KS50b1N0cmluZygpXG4gPiBcIiM3QkVBMzhcIlxuXG4gPiA+IG5ldyBDaHJvbWF0aC5yZ2IoWzEyMywgMjM0LCA1Nl0pLnRvU3RyaW5nKClcbiA+IFwiIzdCRUEzOFwiXG5cbiA+ID4gbmV3IENocm9tYXRoLnJnYih7cjogMTIzLCBnOiAyMzQsIGI6IDU2fSkudG9TdHJpbmcoKVxuID4gXCIjN0JFQTM4XCJcbiAqL1xuQ2hyb21hdGgucmdiID0gZnVuY3Rpb24gKHIsIGcsIGIsIGEpXG57XG4gICAgdmFyIHJnYmEgPSB1dGlsLnJnYi5mcm9tQXJncyhyLCBnLCBiLCBhKTtcbiAgICByID0gcmdiYVswXSwgZyA9IHJnYmFbMV0sIGIgPSByZ2JhWzJdLCBhID0gcmdiYVszXTtcblxuICAgIHJldHVybiBuZXcgQ2hyb21hdGgoe3I6IHIsIGc6IGcsIGI6IGIsIGE6IGF9KTtcbn07XG5cbi8qXG4gIENvbnN0cnVjdG9yOiBDaHJvbWF0aC5yZ2JhXG4gIEFsaWFzIGZvciA8Q2hyb21hdGgucmdiPlxuKi9cbkNocm9tYXRoLnJnYmEgPSBDaHJvbWF0aC5yZ2I7XG5cbi8qXG4gIENvbnN0cnVjdG9yOiBDaHJvbWF0aC5oc2xcbiAgQ3JlYXRlIGEgbmV3IENocm9tYXRoIGluc3RhbmNlIGZyb20gSFNMIHZhbHVlc1xuXG4gIFBhcmFtZXRlcnM6XG4gIGggLSBOdW1iZXIsIC1JbmZpbml0eSAtIEluZmluaXR5LCByZXByZXNlbnRpbmcgdGhlIGh1ZSBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyBoLHMsbCkgb2YgSFNMIHZhbHVlc1xuICBzIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgc2F0dXJhdGlvblxuICBsIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgbGlnaHRuZXNzXG4gIGEgLSAoT3B0aW9uYWwpIEZsb2F0LCAwLTEsIHJlcHJlc2VudGluZyB0aGUgYWxwaGEgY2hhbm5lbFxuXG4gIFJldHVybnM6XG4gIDxDaHJvbWF0aD5cblxuICBFeGFtcGxlczpcbiAgPiA+IG5ldyBDaHJvbWF0aC5oc2woMjQwLCAxLCAwLjUpLnRvU3RyaW5nKClcbiAgPiBcIiMwMDAwRkZcIlxuXG4gID4gPiBuZXcgQ2hyb21hdGguaHNsKFsyNDAsIDEsIDAuNV0pLnRvU3RyaW5nKClcbiAgPiBcIiMwMDAwRkZcIlxuXG4gID4gbmV3IENocm9tYXRoLmhzbCh7aDoyNDAsIHM6MSwgbDowLjV9KS50b1N0cmluZygpXG4gID4gXCIjMDAwMEZGXCJcbiAqL1xuQ2hyb21hdGguaHNsID0gZnVuY3Rpb24gKGgsIHMsIGwsIGEpXG57XG4gICAgdmFyIGhzbGEgPSB1dGlsLmhzbC5mcm9tQXJncyhoLCBzLCBsLCBhKTtcbiAgICBoID0gaHNsYVswXSwgcyA9IGhzbGFbMV0sIGwgPSBoc2xhWzJdLCBhID0gaHNsYVszXTtcblxuICAgIHJldHVybiBuZXcgQ2hyb21hdGgoe2g6IGgsIHM6IHMsIGw6IGwsIGE6IGF9KTtcbn07XG5cbi8qXG4gIENvbnN0cnVjdG9yOiBDaHJvbWF0aC5oc2xhXG4gIEFsaWFzIGZvciA8Q2hyb21hdGguaHNsPlxuKi9cbkNocm9tYXRoLmhzbGEgPSBDaHJvbWF0aC5oc2w7XG5cbi8qXG4gIENvbnN0cnVjdG9yOiBDaHJvbWF0aC5oc3ZcbiAgQ3JlYXRlIGEgbmV3IENocm9tYXRoIGluc3RhbmNlIGZyb20gSFNWIHZhbHVlc1xuXG4gIFBhcmFtZXRlcnM6XG4gIGggLSBOdW1iZXIsIC1JbmZpbml0eSAtIEluZmluaXR5LCByZXByZXNlbnRpbmcgdGhlIGh1ZSBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyBoLHMsbCkgb2YgSFNWIHZhbHVlc1xuICBzIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgc2F0dXJhdGlvblxuICB2IC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgbGlnaHRuZXNzXG4gIGEgLSAoT3B0aW9uYWwpIEZsb2F0LCAwLTEsIHJlcHJlc2VudGluZyB0aGUgYWxwaGEgY2hhbm5lbFxuXG4gIFJldHVybnM6XG4gIDxDaHJvbWF0aD5cblxuICBFeGFtcGxlczpcbiAgPiA+IG5ldyBDaHJvbWF0aC5oc3YoMjQwLCAxLCAxKS50b1N0cmluZygpXG4gID4gXCIjMDAwMEZGXCJcblxuICA+ID4gbmV3IENocm9tYXRoLmhzdihbMjQwLCAxLCAxXSkudG9TdHJpbmcoKVxuICA+IFwiIzAwMDBGRlwiXG5cbiAgPiA+IG5ldyBDaHJvbWF0aC5oc3Yoe2g6MjQwLCBzOjEsIHY6MX0pLnRvU3RyaW5nKClcbiAgPiBcIiMwMDAwRkZcIlxuICovXG5DaHJvbWF0aC5oc3YgPSBmdW5jdGlvbiAoaCwgcywgdiwgYSlcbntcbiAgICB2YXIgaHN2YSA9IHV0aWwuaHNsLmZyb21BcmdzKGgsIHMsIHYsIGEpO1xuICAgIGggPSBoc3ZhWzBdLCBzID0gaHN2YVsxXSwgdiA9IGhzdmFbMl0sIGEgPSBoc3ZhWzNdO1xuXG4gICAgcmV0dXJuIG5ldyBDaHJvbWF0aCh7aDogaCwgczogcywgdjogdiwgYTogYX0pO1xufTtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzdmFcbiAgQWxpYXMgZm9yIDxDaHJvbWF0aC5oc3Y+XG4qL1xuQ2hyb21hdGguaHN2YSA9IENocm9tYXRoLmhzdjtcblxuLypcbiAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzYlxuICBBbGlhcyBmb3IgPENocm9tYXRoLmhzdj5cbiAqL1xuQ2hyb21hdGguaHNiID0gQ2hyb21hdGguaHN2O1xuXG4vKlxuICAgQ29uc3RydWN0b3I6IENocm9tYXRoLmhzYmFcbiAgIEFsaWFzIGZvciA8Q2hyb21hdGguaHN2YT5cbiAqL1xuQ2hyb21hdGguaHNiYSA9IENocm9tYXRoLmhzdmE7XG5cbi8vIEdyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIHJlcHJlc2VudGF0aW9uXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnRvSW50ZWdlclxuICBDb252ZXJ0IGEgY29sb3IgaW50byBhbiBpbnRlZ2VyIChhbHBoYSBjaGFubmVsIGN1cnJlbnRseSBvbWl0dGVkKVxuXG4gIFBhcmFtZXRlcnM6XG4gIGNvbG9yIC0gQWNjZXB0cyB0aGUgc2FtZSBhcmd1bWVudHMgYXMgdGhlIENocm9tYXRoIGNvbnN0cnVjdG9yXG5cbiAgUmV0dXJuczpcbiAgaW50ZWdlclxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGgudG9JbnRlZ2VyKCdncmVlbicpO1xuICA+IDMyNzY4XG5cbiAgPiA+IENocm9tYXRoLnRvSW50ZWdlcignd2hpdGUnKTtcbiAgPiAxNjc3NzIxNVxuKi9cbkNocm9tYXRoLnRvSW50ZWdlciA9IGZ1bmN0aW9uIChjb2xvcilcbntcbiAgICAvLyBjcmVhdGUgc29tZXRoaW5nIGxpa2UgJzAwODAwMCcgKGdyZWVuKVxuICAgIHZhciBoZXg2ID0gbmV3IENocm9tYXRoKGNvbG9yKS5oZXgoKS5qb2luKCcnKTtcblxuICAgIC8vIEFyZ3VtZW50cyBiZWdpbm5pbmcgd2l0aCBgMHhgIGFyZSB0cmVhdGVkIGFzIGhleCB2YWx1ZXNcbiAgICByZXR1cm4gTnVtYmVyKCcweCcgKyBoZXg2KTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudG9OYW1lXG4gIFJldHVybiB0aGUgVzNDIGNvbG9yIG5hbWUgb2YgdGhlIGNvbG9yIGl0IG1hdGNoZXNcblxuICBQYXJhbWV0ZXJzOlxuICBjb21wYXJpc29uXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC50b05hbWUoJ3JnYigyNTUsIDAsIDI1NSknKTtcbiAgPiAnZnVjaHNpYSdcblxuICA+ID4gQ2hyb21hdGgudG9OYW1lKDY1NTM1KTtcbiAgPiAnYXF1YSdcbiovXG5DaHJvbWF0aC50b05hbWUgPSBmdW5jdGlvbiAoY29tcGFyaXNvbilcbntcbiAgICBjb21wYXJpc29uID0gK25ldyBDaHJvbWF0aChjb21wYXJpc29uKTtcbiAgICBmb3IgKHZhciBjb2xvciBpbiBDaHJvbWF0aC5jb2xvcnMpIGlmICgrQ2hyb21hdGhbY29sb3JdID09IGNvbXBhcmlzb24pIHJldHVybiBjb2xvcjtcbn07XG5cbi8vIEdyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIGNvbG9yIGNvbnZlcnNpb25cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgucmdiMmhleFxuICBDb252ZXJ0IGFuIFJHQiB2YWx1ZSB0byBhIEhleCB2YWx1ZVxuXG4gIFJldHVybnM6IGFycmF5XG5cbiAgRXhhbXBsZTpcbiAgPiA+IENocm9tYXRoLnJnYjJoZXgoNTAsIDEwMCwgMTUwKVxuICA+IFwiWzMyLCA2NCwgOTZdXCJcbiAqL1xuQ2hyb21hdGgucmdiMmhleCA9IGZ1bmN0aW9uIHJnYjJoZXgociwgZywgYilcbntcbiAgICB2YXIgcmdiID0gdXRpbC5yZ2Iuc2NhbGVkMDEociwgZywgYik7XG4gICAgdmFyIGhleCA9IHJnYi5tYXAoZnVuY3Rpb24gKHBjdCkge1xuICAgICAgdmFyIGRlYyA9IE1hdGgucm91bmQocGN0ICogMjU1KTtcbiAgICAgIHZhciBoZXggPSBkZWMudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgICByZXR1cm4gdXRpbC5scGFkKGhleCwgMiwgMCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGV4O1xufTtcblxuLy8gQ29udmVydGVkIGZyb20gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTViNHZW5lcmFsX2FwcHJvYWNoXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnJnYjJoc2xcbiAgQ29udmVydCBSR0IgdG8gSFNMXG5cbiAgUGFyYW1ldGVyczpcbiAgciAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgZ3JlZW4gY2hhbm5lbCBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyByLGcsYikgb2YgUkdCIHZhbHVlc1xuICBnIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSBncmVlbiBjaGFubmVsXG4gIGIgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIHJlZCBjaGFubmVsXG5cbiAgUmV0dXJuczogYXJyYXlcblxuICA+ID4gQ2hyb21hdGgucmdiMmhzbCgwLCAyNTUsIDApO1xuICA+IFsgMTIwLCAxLCAwLjUgXVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHNsKFswLCAwLCAyNTVdKTtcbiAgPiBbIDI0MCwgMSwgMC41IF1cblxuICA+ID4gQ2hyb21hdGgucmdiMmhzbCh7cjogMjU1LCBnOiAwLCBiOiAwfSk7XG4gID4gWyAwLCAxLCAwLjUgXVxuICovXG5DaHJvbWF0aC5yZ2IyaHNsID0gZnVuY3Rpb24gcmdiMmhzbChyLCBnLCBiKVxue1xuICAgIHZhciByZ2IgPSB1dGlsLnJnYi5zY2FsZWQwMShyLCBnLCBiKTtcbiAgICByID0gcmdiWzBdLCBnID0gcmdiWzFdLCBiID0gcmdiWzJdO1xuXG4gICAgdmFyIE0gPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgbSA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBDID0gTSAtIG07XG4gICAgdmFyIEwgPSAwLjUqKE0gKyBtKTtcbiAgICB2YXIgUyA9IChDID09PSAwKSA/IDAgOiBDLygxLU1hdGguYWJzKDIqTC0xKSk7XG5cbiAgICB2YXIgaDtcbiAgICBpZiAoQyA9PT0gMCkgaCA9IDA7IC8vIHNwZWMnZCBhcyB1bmRlZmluZWQsIGJ1dCB1c3VhbGx5IHNldCB0byAwXG4gICAgZWxzZSBpZiAoTSA9PT0gcikgaCA9ICgoZy1iKS9DKSAlIDY7XG4gICAgZWxzZSBpZiAoTSA9PT0gZykgaCA9ICgoYi1yKS9DKSArIDI7XG4gICAgZWxzZSBpZiAoTSA9PT0gYikgaCA9ICgoci1nKS9DKSArIDQ7XG5cbiAgICB2YXIgSCA9IDYwICogaDtcblxuICAgIHJldHVybiBbSCwgcGFyc2VGbG9hdChTKSwgcGFyc2VGbG9hdChMKV07XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnJnYjJoc3ZcbiAgQ29udmVydCBSR0IgdG8gSFNWXG5cbiAgUGFyYW1ldGVyczpcbiAgciAtIE51bWJlciwgMC0yNTUsIHJlcHJlc2VudGluZyB0aGUgZ3JlZW4gY2hhbm5lbCBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyByLGcsYikgb2YgUkdCIHZhbHVlc1xuICBnIC0gTnVtYmVyLCAwLTI1NSwgcmVwcmVzZW50aW5nIHRoZSBncmVlbiBjaGFubmVsXG4gIGIgLSBOdW1iZXIsIDAtMjU1LCByZXByZXNlbnRpbmcgdGhlIHJlZCBjaGFubmVsXG5cbiAgUmV0dXJuczpcbiAgQXJyYXlcblxuICA+ID4gQ2hyb21hdGgucmdiMmhzdigwLCAyNTUsIDApO1xuICA+IFsgMTIwLCAxLCAxIF1cblxuICA+ID4gQ2hyb21hdGgucmdiMmhzdihbMCwgMCwgMjU1XSk7XG4gID4gWyAyNDAsIDEsIDEgXVxuXG4gID4gPiBDaHJvbWF0aC5yZ2IyaHN2KHtyOiAyNTUsIGc6IDAsIGI6IDB9KTtcbiAgPiBbIDAsIDEsIDEgXVxuICovXG5DaHJvbWF0aC5yZ2IyaHN2ID0gZnVuY3Rpb24gcmdiMmhzdihyLCBnLCBiKVxue1xuICAgIHZhciByZ2IgPSB1dGlsLnJnYi5zY2FsZWQwMShyLCBnLCBiKTtcbiAgICByID0gcmdiWzBdLCBnID0gcmdiWzFdLCBiID0gcmdiWzJdO1xuXG4gICAgdmFyIE0gPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgbSA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBDID0gTSAtIG07XG4gICAgdmFyIEwgPSBNO1xuICAgIHZhciBTID0gKEMgPT09IDApID8gMCA6IEMvTTtcblxuICAgIHZhciBoO1xuICAgIGlmIChDID09PSAwKSBoID0gMDsgLy8gc3BlYydkIGFzIHVuZGVmaW5lZCwgYnV0IHVzdWFsbHkgc2V0IHRvIDBcbiAgICBlbHNlIGlmIChNID09PSByKSBoID0gKChnLWIpL0MpICUgNjtcbiAgICBlbHNlIGlmIChNID09PSBnKSBoID0gKChiLXIpL0MpICsgMjtcbiAgICBlbHNlIGlmIChNID09PSBiKSBoID0gKChyLWcpL0MpICsgNDtcblxuICAgIHZhciBIID0gNjAgKiBoO1xuXG4gICAgcmV0dXJuIFtILCBwYXJzZUZsb2F0KFMpLCBwYXJzZUZsb2F0KEwpXTtcbn07XG5cbi8qXG4gICBNZXRob2Q6IENocm9tYXRoLnJnYjJoc2JcbiAgIEFsaWFzIGZvciA8Q2hyb21hdGgucmdiMmhzdj5cbiAqL1xuQ2hyb21hdGgucmdiMmhzYiA9IENocm9tYXRoLnJnYjJoc3Y7XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguaHNsMnJnYlxuICBDb252ZXJ0IGZyb20gSFNMIHRvIFJHQlxuXG4gIFBhcmFtZXRlcnM6XG4gIGggLSBOdW1iZXIsIC1JbmZpbml0eSAtIEluZmluaXR5LCByZXByZXNlbnRpbmcgdGhlIGh1ZSBPUiBBcnJheSBPUiBvYmplY3QgKHdpdGgga2V5cyBoLHMsbCkgb2YgSFNMIHZhbHVlc1xuICBzIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgc2F0dXJhdGlvblxuICBsIC0gTnVtYmVyLCAwLTEsIHJlcHJlc2VudGluZyB0aGUgbGlnaHRuZXNzXG5cbiAgUmV0dXJuczpcbiAgYXJyYXlcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmhzbDJyZ2IoMzYwLCAxLCAwLjUpO1xuICA+IFsgMjU1LCAwLCAwIF1cblxuICA+ID4gQ2hyb21hdGguaHNsMnJnYihbMCwgMSwgMC41XSk7XG4gID4gWyAyNTUsIDAsIDAgXVxuXG4gID4gPiBDaHJvbWF0aC5oc2wycmdiKHtoOiAyMTAsIHM6MSwgdjogMC41fSk7XG4gID4gWyAwLCAxMjcuNSwgMjU1IF1cbiAqL1xuLy8gVE9ETzogQ2FuIEkgJT0gaHAgYW5kIHRoZW4gZG8gYSBzd2l0Y2g/XG5DaHJvbWF0aC5oc2wycmdiID0gZnVuY3Rpb24gaHNsMnJnYihoLCBzLCBsKVxue1xuICAgIHZhciBoc2wgPSB1dGlsLmhzbC5zY2FsZWQoaCwgcywgbCk7XG4gICAgaD1oc2xbMF0sIHM9aHNsWzFdLCBsPWhzbFsyXTtcblxuICAgIHZhciBDID0gKDEgLSBNYXRoLmFicygyKmwtMSkpICogcztcbiAgICB2YXIgaHAgPSBoLzYwO1xuICAgIHZhciBYID0gQyAqICgxLU1hdGguYWJzKGhwJTItMSkpO1xuICAgIHZhciByZ2IsIG07XG5cbiAgICBzd2l0Y2ggKE1hdGguZmxvb3IoaHApKXtcbiAgICBjYXNlIDA6ICByZ2IgPSBbQyxYLDBdOyBicmVhaztcbiAgICBjYXNlIDE6ICByZ2IgPSBbWCxDLDBdOyBicmVhaztcbiAgICBjYXNlIDI6ICByZ2IgPSBbMCxDLFhdOyBicmVhaztcbiAgICBjYXNlIDM6ICByZ2IgPSBbMCxYLENdOyBicmVhaztcbiAgICBjYXNlIDQ6ICByZ2IgPSBbWCwwLENdOyBicmVhaztcbiAgICBjYXNlIDU6ICByZ2IgPSBbQywwLFhdOyBicmVhaztcbiAgICBkZWZhdWx0OiByZ2IgPSBbMCwwLDBdO1xuICAgIH1cblxuICAgIG0gPSBsIC0gKEMvMik7XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAocmdiWzBdK20pLFxuICAgICAgICAocmdiWzFdK20pLFxuICAgICAgICAocmdiWzJdK20pXG4gICAgXTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguaHN2MnJnYlxuICBDb252ZXJ0IEhTViB0byBSR0JcblxuICBQYXJhbWV0ZXJzOlxuICBoIC0gTnVtYmVyLCAtSW5maW5pdHkgLSBJbmZpbml0eSwgcmVwcmVzZW50aW5nIHRoZSBodWUgT1IgQXJyYXkgT1Igb2JqZWN0ICh3aXRoIGtleXMgaCxzLHYgb3IgaCxzLGIpIG9mIEhTViB2YWx1ZXNcbiAgcyAtIE51bWJlciwgMC0xLCByZXByZXNlbnRpbmcgdGhlIHNhdHVyYXRpb25cbiAgdiAtIE51bWJlciwgMC0xLCByZXByZXNlbnRpbmcgdGhlIGxpZ2h0bmVzc1xuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGguaHN2MnJnYigzNjAsIDEsIDEpO1xuICA+IFsgMjU1LCAwLCAwIF1cblxuICA+ID4gQ2hyb21hdGguaHN2MnJnYihbMCwgMSwgMC41XSk7XG4gID4gWyAxMjcuNSwgMCwgMCBdXG5cbiAgPiA+IENocm9tYXRoLmhzdjJyZ2Ioe2g6IDIxMCwgczogMC41LCB2OiAxfSk7XG4gID4gWyAxMjcuNSwgMTkxLjI1LCAyNTUgXVxuICovXG5DaHJvbWF0aC5oc3YycmdiID0gZnVuY3Rpb24gaHN2MnJnYihoLCBzLCB2KVxue1xuICAgIHZhciBoc3YgPSB1dGlsLmhzbC5zY2FsZWQoaCwgcywgdik7XG4gICAgaD1oc3ZbMF0sIHM9aHN2WzFdLCB2PWhzdlsyXTtcblxuICAgIHZhciBDID0gdiAqIHM7XG4gICAgdmFyIGhwID0gaC82MDtcbiAgICB2YXIgWCA9IEMqKDEtTWF0aC5hYnMoaHAlMi0xKSk7XG4gICAgdmFyIHJnYiwgbTtcblxuICAgIGlmIChoID09IHVuZGVmaW5lZCkgICAgICAgICByZ2IgPSBbMCwwLDBdO1xuICAgIGVsc2UgaWYgKDAgPD0gaHAgJiYgaHAgPCAxKSByZ2IgPSBbQyxYLDBdO1xuICAgIGVsc2UgaWYgKDEgPD0gaHAgJiYgaHAgPCAyKSByZ2IgPSBbWCxDLDBdO1xuICAgIGVsc2UgaWYgKDIgPD0gaHAgJiYgaHAgPCAzKSByZ2IgPSBbMCxDLFhdO1xuICAgIGVsc2UgaWYgKDMgPD0gaHAgJiYgaHAgPCA0KSByZ2IgPSBbMCxYLENdO1xuICAgIGVsc2UgaWYgKDQgPD0gaHAgJiYgaHAgPCA1KSByZ2IgPSBbWCwwLENdO1xuICAgIGVsc2UgaWYgKDUgPD0gaHAgJiYgaHAgPCA2KSByZ2IgPSBbQywwLFhdO1xuXG4gICAgbSA9IHYgLSBDO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgKHJnYlswXSttKSxcbiAgICAgICAgKHJnYlsxXSttKSxcbiAgICAgICAgKHJnYlsyXSttKVxuICAgIF07XG59O1xuXG4vKlxuICAgTWV0aG9kOiBDaHJvbWF0aC5oc2IycmdiXG4gICBBbGlhcyBmb3IgPENocm9tYXRoLmhzdjJyZ2I+XG4gKi9cbkNocm9tYXRoLmhzYjJyZ2IgPSBDaHJvbWF0aC5oc3YycmdiO1xuXG4vKlxuICAgIFByb3BlcnR5OiBDaHJvbWF0aC5jb252ZXJ0XG4gICAgQWxpYXNlcyBmb3IgdGhlIENocm9tYXRoLngyeSBmdW5jdGlvbnMuXG4gICAgVXNlIGxpa2UgQ2hyb21hdGguY29udmVydFt4XVt5XShhcmdzKSBvciBDaHJvbWF0aC5jb252ZXJ0LngueShhcmdzKVxuKi9cbkNocm9tYXRoLmNvbnZlcnQgPSB7XG4gICAgcmdiOiB7XG4gICAgICAgIGhleDogQ2hyb21hdGguaHN2MnJnYixcbiAgICAgICAgaHNsOiBDaHJvbWF0aC5yZ2IyaHNsLFxuICAgICAgICBoc3Y6IENocm9tYXRoLnJnYjJoc3ZcbiAgICB9LFxuICAgIGhzbDoge1xuICAgICAgICByZ2I6IENocm9tYXRoLmhzbDJyZ2JcbiAgICB9LFxuICAgIGhzdjoge1xuICAgICAgICByZ2I6IENocm9tYXRoLmhzdjJyZ2JcbiAgICB9XG59O1xuXG4vKiBHcm91cDogU3RhdGljIG1ldGhvZHMgLSBjb2xvciBzY2hlbWUgKi9cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguY29tcGxlbWVudFxuICBSZXR1cm4gdGhlIGNvbXBsZW1lbnQgb2YgdGhlIGdpdmVuIGNvbG9yXG5cbiAgUmV0dXJuczogPENocm9tYXRoPlxuXG4gID4gPiBDaHJvbWF0aC5jb21wbGVtZW50KG5ldyBDaHJvbWF0aCgncmVkJykpO1xuICA+IHsgcjogMCwgZzogMjU1LCBiOiAyNTUsIGE6IDEsIGg6IDE4MCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfVxuXG4gID4gPiBDaHJvbWF0aC5jb21wbGVtZW50KG5ldyBDaHJvbWF0aCgncmVkJykpLnRvU3RyaW5nKCk7XG4gID4gJyMwMEZGRkYnXG4gKi9cbkNocm9tYXRoLmNvbXBsZW1lbnQgPSBmdW5jdGlvbiAoY29sb3IpXG57XG4gICAgdmFyIGMgPSBuZXcgQ2hyb21hdGgoY29sb3IpO1xuICAgIHZhciBoc2wgPSBjLnRvSFNMT2JqZWN0KCk7XG5cbiAgICBoc2wuaCA9IChoc2wuaCArIDE4MCkgJSAzNjA7XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKGhzbCk7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnRyaWFkXG4gIENyZWF0ZSBhIHRyaWFkIGNvbG9yIHNjaGVtZSBmcm9tIHRoZSBnaXZlbiBDaHJvbWF0aC5cblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLnRyaWFkKENocm9tYXRoLnllbGxvdylcbiAgPiBbIHsgcjogMjU1LCBnOiAyNTUsIGI6IDAsIGE6IDEsIGg6IDYwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9LFxuICA+ICAgeyByOiAwLCBnOiAyNTUsIGI6IDI1NSwgYTogMSwgaDogMTgwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9LFxuICA+ICAgeyByOiAyNTUsIGc6IDAsIGI6IDI1NSwgYTogMSwgaDogMzAwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9IF1cblxuID4gPiBDaHJvbWF0aC50cmlhZChDaHJvbWF0aC55ZWxsb3cpLnRvU3RyaW5nKCk7XG4gPiAnI0ZGRkYwMCwjMDBGRkZGLCNGRjAwRkYnXG4qL1xuQ2hyb21hdGgudHJpYWQgPSBmdW5jdGlvbiAoY29sb3IpXG57XG4gICAgdmFyIGMgPSBuZXcgQ2hyb21hdGgoY29sb3IpO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgYyxcbiAgICAgICAgbmV3IENocm9tYXRoKHtyOiBjLmIsIGc6IGMuciwgYjogYy5nfSksXG4gICAgICAgIG5ldyBDaHJvbWF0aCh7cjogYy5nLCBnOiBjLmIsIGI6IGMucn0pXG4gICAgXTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgudGV0cmFkXG4gIENyZWF0ZSBhIHRldHJhZCBjb2xvciBzY2hlbWUgZnJvbSB0aGUgZ2l2ZW4gQ2hyb21hdGguXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC50ZXRyYWQoQ2hyb21hdGguY3lhbilcbiAgPiBbIHsgcjogMCwgZzogMjU1LCBiOiAyNTUsIGE6IDEsIGg6IDE4MCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMjU1LCBnOiAwLCBiOiAyNTUsIGE6IDEsIGg6IDMwMCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSxcbiAgPiAgIHsgcjogMjU1LCBnOiAyNTUsIGI6IDAsIGE6IDEsIGg6IDYwLCBzbDogMSwgc3Y6IDEsIGw6IDAuNSwgdjogMSB9LFxuICA+ICAgeyByOiAwLCBnOiAyNTUsIGI6IDAsIGE6IDEsIGg6IDEyMCwgc2w6IDEsIHN2OiAxLCBsOiAwLjUsIHY6IDEgfSBdXG5cbiAgPiA+IENocm9tYXRoLnRldHJhZChDaHJvbWF0aC5jeWFuKS50b1N0cmluZygpO1xuICA+ICcjMDBGRkZGLCNGRjAwRkYsI0ZGRkYwMCwjMDBGRjAwJ1xuKi9cbkNocm9tYXRoLnRldHJhZCA9IGZ1bmN0aW9uIChjb2xvcilcbntcbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvcik7XG5cbiAgICByZXR1cm4gW1xuICAgICAgICBjLFxuICAgICAgICBuZXcgQ2hyb21hdGgoe3I6IGMuYiwgZzogYy5yLCBiOiBjLmJ9KSxcbiAgICAgICAgbmV3IENocm9tYXRoKHtyOiBjLmIsIGc6IGMuZywgYjogYy5yfSksXG4gICAgICAgIG5ldyBDaHJvbWF0aCh7cjogYy5yLCBnOiBjLmIsIGI6IGMucn0pXG4gICAgXTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguYW5hbG9nb3VzXG4gIEZpbmQgYW5hbG9nb3VzIGNvbG9ycyBmcm9tIGEgZ2l2ZW4gY29sb3JcblxuICBQYXJhbWV0ZXJzOlxuICBtaXhlZCAtIEFueSBhcmd1bWVudCB3aGljaCBpcyBwYXNzZWQgdG8gPENocm9tYXRoPlxuICByZXN1bHRzIC0gSG93IG1hbnkgY29sb3JzIHRvIHJldHVybiAoZGVmYXVsdCA9IDMpXG4gIHNsaWNlcyAtIEhvdyBtYW55IHBpZWNlcyBhcmUgaW4gdGhlIGNvbG9yIHdoZWVsIChkZWZhdWx0ID0gMTIpXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5hbmFsb2dvdXMobmV3IENocm9tYXRoKCdyZ2IoMCwgMjU1LCAyNTUpJykpXG4gID4gWyB7IHI6IDAsIGc6IDI1NSwgYjogMjU1LCBhOiAxLCBoOiAxODAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMTAxLCBhOiAxLCBoOiAxNDQsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMTUzLCBhOiAxLCBoOiAxNTYsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMjAzLCBhOiAxLCBoOiAxNjgsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDI1NSwgYjogMjU1LCBhOiAxLCBoOiAxODAsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDIwMywgYjogMjU1LCBhOiAxLCBoOiAxOTIsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDE1MywgYjogMjU1LCBhOiAxLCBoOiAyMDQsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0sXG4gID4gICB7IHI6IDAsIGc6IDEwMSwgYjogMjU1LCBhOiAxLCBoOiAyMTYsIHNsOiAxLCBzdjogMSwgbDogMC41LCB2OiAxIH0gXVxuXG4gID4gPiBDaHJvbWF0aC5hbmFsb2dvdXMobmV3IENocm9tYXRoKCdyZ2IoMCwgMjU1LCAyNTUpJykpLnRvU3RyaW5nKClcbiAgPiAnIzAwRkZGRiwjMDBGRjY1LCMwMEZGOTksIzAwRkZDQiwjMDBGRkZGLCMwMENCRkYsIzAwOTlGRiwjMDA2NUZGJ1xuICovXG5DaHJvbWF0aC5hbmFsb2dvdXMgPSBmdW5jdGlvbiAoY29sb3IsIHJlc3VsdHMsIHNsaWNlcylcbntcbiAgICBpZiAoIWlzRmluaXRlKHJlc3VsdHMpKSByZXN1bHRzID0gMztcbiAgICBpZiAoIWlzRmluaXRlKHNsaWNlcykpIHNsaWNlcyA9IDEyO1xuXG4gICAgdmFyIGMgPSBuZXcgQ2hyb21hdGgoY29sb3IpO1xuICAgIHZhciBoc3YgPSBjLnRvSFNWT2JqZWN0KCk7XG4gICAgdmFyIHNsaWNlID0gMzYwIC8gc2xpY2VzO1xuICAgIHZhciByZXQgPSBbIGMgXTtcblxuICAgIGhzdi5oID0gKChoc3YuaCAtIChzbGljZXMgKiByZXN1bHRzID4+IDEpKSArIDcyMCkgJSAzNjA7XG4gICAgd2hpbGUgKC0tcmVzdWx0cykge1xuICAgICAgICBoc3YuaCA9IChoc3YuaCArIHNsaWNlKSAlIDM2MDtcbiAgICAgICAgcmV0LnB1c2gobmV3IENocm9tYXRoKGhzdikpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLm1vbm9jaHJvbWF0aWNcbiAgUmV0dXJuIGEgc2VyaWVzIG9mIHRoZSBnaXZlbiBjb2xvciBhdCB2YXJpb3VzIGxpZ2h0bmVzc2VzXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5tb25vY2hyb21hdGljKCdyZ2IoMCwgMTAwLCAyNTUpJykuZm9yRWFjaChmdW5jdGlvbiAoYyl7IGNvbnNvbGUubG9nKGMudG9IU1ZTdHJpbmcoKSk7IH0pXG4gID4gaHN2KDIxNiwxMDAlLDIwJSlcbiAgPiBoc3YoMjE2LDEwMCUsNDAlKVxuICA+IGhzdigyMTYsMTAwJSw2MCUpXG4gID4gaHN2KDIxNiwxMDAlLDgwJSlcbiAgPiBoc3YoMjE2LDEwMCUsMTAwJSlcbiovXG5DaHJvbWF0aC5tb25vY2hyb21hdGljID0gZnVuY3Rpb24gKGNvbG9yLCByZXN1bHRzKVxue1xuICAgIGlmICghcmVzdWx0cykgcmVzdWx0cyA9IDU7XG5cbiAgICB2YXIgYyA9IG5ldyBDaHJvbWF0aChjb2xvcik7XG4gICAgdmFyIGhzdiA9IGMudG9IU1ZPYmplY3QoKTtcbiAgICB2YXIgaW5jID0gMSAvIHJlc3VsdHM7XG4gICAgdmFyIHJldCA9IFtdLCBzdGVwID0gMDtcblxuICAgIHdoaWxlIChzdGVwKysgPCByZXN1bHRzKSB7XG4gICAgICAgIGhzdi52ID0gc3RlcCAqIGluYztcbiAgICAgICAgcmV0LnB1c2gobmV3IENocm9tYXRoKGhzdikpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnNwbGl0Y29tcGxlbWVudFxuICBHZW5lcmF0ZSBhIHNwbGl0IGNvbXBsZW1lbnQgY29sb3Igc2NoZW1lIGZyb20gdGhlIGdpdmVuIGNvbG9yXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5zcGxpdGNvbXBsZW1lbnQoJ3JnYigwLCAxMDAsIDI1NSknKVxuICA+IFsgeyByOiAwLCBnOiAxMDAsIGI6IDI1NSwgaDogMjE2LjQ3MDU4ODIzNTI5NDE0LCBzbDogMSwgbDogMC41LCBzdjogMSwgdjogMSwgYTogMSB9LFxuICA+ICAgeyByOiAyNTUsIGc6IDE4MywgYjogMCwgaDogNDMuMTk5OTk5OTk5OTk5OTksIHNsOiAxLCBsOiAwLjUsIHN2OiAxLCB2OiAxLCBhOiAxIH0sXG4gID4gICB7IHI6IDI1NSwgZzogNzMsIGI6IDAsIGg6IDE3LjI3OTk5OTk5OTk5OTk3Mywgc2w6IDEsIGw6IDAuNSwgc3Y6IDEsIHY6IDEsIGE6IDEgfSBdXG5cbiAgPiA+IENocm9tYXRoLnNwbGl0Y29tcGxlbWVudCgncmdiKDAsIDEwMCwgMjU1KScpLnRvU3RyaW5nKClcbiAgPiAnIzAwNjRGRiwjRkZCNzAwLCNGRjQ5MDAnXG4gKi9cbkNocm9tYXRoLnNwbGl0Y29tcGxlbWVudCA9IGZ1bmN0aW9uIChjb2xvcilcbntcbiAgICB2YXIgcmVmID0gbmV3IENocm9tYXRoKGNvbG9yKTtcbiAgICB2YXIgaHN2ID0gcmVmLnRvSFNWT2JqZWN0KCk7XG5cbiAgICB2YXIgYSA9IG5ldyBDaHJvbWF0aC5oc3Yoe1xuICAgICAgICBoOiAoaHN2LmggKyAxNTApICUgMzYwLFxuICAgICAgICBzOiBoc3YucyxcbiAgICAgICAgdjogaHN2LnZcbiAgICB9KTtcblxuICAgIHZhciBiID0gbmV3IENocm9tYXRoLmhzdih7XG4gICAgICAgIGg6IChoc3YuaCArIDIxMCkgJSAzNjAsXG4gICAgICAgIHM6IGhzdi5zLFxuICAgICAgICB2OiBoc3YudlxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFtyZWYsIGEsIGJdO1xufTtcblxuLy9Hcm91cDogU3RhdGljIG1ldGhvZHMgLSBjb2xvciBhbHRlcmF0aW9uXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnRpbnRcbiAgTGlnaHRlbiBhIGNvbG9yIGJ5IGFkZGluZyBhIHBlcmNlbnRhZ2Ugb2Ygd2hpdGUgdG8gaXRcblxuICBSZXR1cm5zIDxDaHJvbWF0aD5cblxuICA+ID4gQ2hyb21hdGgudGludCgncmdiKDAsIDEwMCwgMjU1KScsIDAuNSkudG9SR0JTdHJpbmcoKTtcbiAgPiAncmdiKDEyNywxNzcsMjU1KSdcbiovXG5DaHJvbWF0aC50aW50ID0gZnVuY3Rpb24gKCBmcm9tLCBieSApXG57XG4gICAgcmV0dXJuIENocm9tYXRoLnRvd2FyZHMoIGZyb20sICcjRkZGRkZGJywgYnkgKTtcbn07XG5cbi8qXG4gICBNZXRob2Q6IENocm9tYXRoLmxpZ2h0ZW5cbiAgIEFsaWFzIGZvciA8Q2hyb21hdGgudGludD5cbiovXG5DaHJvbWF0aC5saWdodGVuID0gQ2hyb21hdGgudGludDtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5zaGFkZVxuICBEYXJrZW4gYSBjb2xvciBieSBhZGRpbmcgYSBwZXJjZW50YWdlIG9mIGJsYWNrIHRvIGl0XG5cbiAgRXhhbXBsZTpcbiAgPiA+IENocm9tYXRoLmRhcmtlbigncmdiKDAsIDEwMCwgMjU1KScsIDAuNSkudG9SR0JTdHJpbmcoKTtcbiAgPiAncmdiKDAsNTAsMTI3KSdcbiAqL1xuQ2hyb21hdGguc2hhZGUgPSBmdW5jdGlvbiAoIGZyb20sIGJ5IClcbntcbiAgICByZXR1cm4gQ2hyb21hdGgudG93YXJkcyggZnJvbSwgJyMwMDAwMDAnLCBieSApO1xufTtcblxuLypcbiAgIE1ldGhvZDogQ2hyb21hdGguZGFya2VuXG4gICBBbGlhcyBmb3IgPENocm9tYXRoLnNoYWRlPlxuICovXG5DaHJvbWF0aC5kYXJrZW4gPSBDaHJvbWF0aC5zaGFkZTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5kZXNhdHVyYXRlXG4gIERlc2F0dXJhdGUgYSBjb2xvciB1c2luZyBhbnkgb2YgMyBhcHByb2FjaGVzXG5cbiAgUGFyYW1ldGVyczpcbiAgY29sb3IgLSBhbnkgYXJndW1lbnQgYWNjZXB0ZWQgYnkgdGhlIDxDaHJvbWF0aD4gY29uc3RydWN0b3JcbiAgZm9ybXVsYSAtIFRoZSBmb3JtdWxhIHRvIHVzZSAoZnJvbSA8eGFyZydzIGdyZXlmaWx0ZXIgYXQgaHR0cDovL3d3dy54YXJnLm9yZy9wcm9qZWN0L2pxdWVyeS1jb2xvci1wbHVnaW4teGNvbG9yPilcbiAgLSAxIC0geGFyZydzIG93biBmb3JtdWxhXG4gIC0gMiAtIFN1bidzIGZvcm11bGE6ICgxIC0gYXZnKSAvICgxMDAgLyAzNSkgKyBhdmcpXG4gIC0gZW1wdHkgLSBUaGUgb2Z0LXNlZW4gMzAlIHJlZCwgNTklIGdyZWVuLCAxMSUgYmx1ZSBmb3JtdWxhXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5kZXNhdHVyYXRlKCdyZWQnKS50b1N0cmluZygpXG4gID4gXCIjNEM0QzRDXCJcblxuICA+ID4gQ2hyb21hdGguZGVzYXR1cmF0ZSgncmVkJywgMSkudG9TdHJpbmcoKVxuICA+IFwiIzM3MzczN1wiXG5cbiAgPiA+IENocm9tYXRoLmRlc2F0dXJhdGUoJ3JlZCcsIDIpLnRvU3RyaW5nKClcbiAgPiBcIiM5MDkwOTBcIlxuKi9cbkNocm9tYXRoLmRlc2F0dXJhdGUgPSBmdW5jdGlvbiAoY29sb3IsIGZvcm11bGEpXG57XG4gICAgdmFyIGMgPSBuZXcgQ2hyb21hdGgoY29sb3IpLCByZ2IsIGF2ZztcblxuICAgIHN3aXRjaCAoZm9ybXVsYSkge1xuICAgIGNhc2UgMTogLy8geGFyZydzIGZvcm11bGFcbiAgICAgICAgYXZnID0gLjM1ICsgMTMgKiAoYy5yICsgYy5nICsgYy5iKSAvIDYwOyBicmVhaztcbiAgICBjYXNlIDI6IC8vIFN1bidzIGZvcm11bGE6ICgxIC0gYXZnKSAvICgxMDAgLyAzNSkgKyBhdmcpXG4gICAgICAgIGF2ZyA9ICgxMyAqIChjLnIgKyBjLmcgKyBjLmIpICsgNTM1NSkgLyA2MDsgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgYXZnID0gYy5yICogLjMgKyBjLmcgKiAuNTkgKyBjLmIgKiAuMTE7XG4gICAgfVxuXG4gICAgYXZnID0gdXRpbC5jbGFtcChhdmcsIDAsIDI1NSk7XG4gICAgcmdiID0ge3I6IGF2ZywgZzogYXZnLCBiOiBhdmd9O1xuXG4gICAgcmV0dXJuIG5ldyBDaHJvbWF0aChyZ2IpO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5ncmV5c2NhbGVcbiAgQWxpYXMgZm9yIDxDaHJvbWF0aC5kZXNhdHVyYXRlPlxuKi9cbkNocm9tYXRoLmdyZXlzY2FsZSA9IENocm9tYXRoLmRlc2F0dXJhdGU7XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgud2Vic2FmZVxuICBDb252ZXJ0IGEgY29sb3IgdG8gb25lIG9mIHRoZSAyMTYgXCJ3ZWJzYWZlXCIgY29sb3JzXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC53ZWJzYWZlKCcjQUJDREVGJykudG9TdHJpbmcoKVxuICA+ICcjOTlDQ0ZGJ1xuXG4gID4gPiBDaHJvbWF0aC53ZWJzYWZlKCcjQkJDREVGJykudG9TdHJpbmcoKVxuICA+ICcjQ0NDQ0ZGJ1xuICovXG5DaHJvbWF0aC53ZWJzYWZlID0gZnVuY3Rpb24gKGNvbG9yKVxue1xuICAgIGNvbG9yID0gbmV3IENocm9tYXRoKGNvbG9yKTtcblxuICAgIGNvbG9yLnIgPSBNYXRoLnJvdW5kKGNvbG9yLnIgLyA1MSkgKiA1MTtcbiAgICBjb2xvci5nID0gTWF0aC5yb3VuZChjb2xvci5nIC8gNTEpICogNTE7XG4gICAgY29sb3IuYiA9IE1hdGgucm91bmQoY29sb3IuYiAvIDUxKSAqIDUxO1xuXG4gICAgcmV0dXJuIG5ldyBDaHJvbWF0aChjb2xvcik7XG59O1xuXG4vL0dyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIGNvbG9yIGNvbWJpbmF0aW9uXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLmFkZGl0aXZlXG4gIENvbWJpbmUgYW55IG51bWJlciBjb2xvcnMgdXNpbmcgYWRkaXRpdmUgY29sb3JcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmFkZGl0aXZlKCcjRjAwJywgJyMwRjAnKS50b1N0cmluZygpO1xuICA+ICcjRkZGRjAwJ1xuXG4gID4gPiBDaHJvbWF0aC5hZGRpdGl2ZSgnI0YwMCcsICcjMEYwJykudG9TdHJpbmcoKSA9PSBDaHJvbWF0aC55ZWxsb3cudG9TdHJpbmcoKTtcbiAgPiB0cnVlXG5cbiAgPiA+IENocm9tYXRoLmFkZGl0aXZlKCdyZWQnLCAnIzBGMCcsICdyZ2IoMCwgMCwgMjU1KScpLnRvU3RyaW5nKCkgPT0gQ2hyb21hdGgud2hpdGUudG9TdHJpbmcoKTtcbiAgPiB0cnVlXG4gKi9cbkNocm9tYXRoLmFkZGl0aXZlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGgtMiwgaT0tMSwgYSwgYjtcbiAgICB3aGlsZSAoaSsrIDwgYXJncyl7XG5cbiAgICAgICAgYSA9IGEgfHwgbmV3IENocm9tYXRoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIGIgPSBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2krMV0pO1xuXG4gICAgICAgIGlmICgoYS5yICs9IGIucikgPiAyNTUpIGEuciA9IDI1NTtcbiAgICAgICAgaWYgKChhLmcgKz0gYi5nKSA+IDI1NSkgYS5nID0gMjU1O1xuICAgICAgICBpZiAoKGEuYiArPSBiLmIpID4gMjU1KSBhLmIgPSAyNTU7XG5cbiAgICAgICAgYSA9IG5ldyBDaHJvbWF0aChhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGguc3VidHJhY3RpdmVcbiAgQ29tYmluZSBhbnkgbnVtYmVyIG9mIGNvbG9ycyB1c2luZyBzdWJ0cmFjdGl2ZSBjb2xvclxuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGguc3VidHJhY3RpdmUoJ3llbGxvdycsICdtYWdlbnRhJykudG9TdHJpbmcoKTtcbiAgPiAnI0ZGMDAwMCdcblxuICA+ID4gQ2hyb21hdGguc3VidHJhY3RpdmUoJ3llbGxvdycsICdtYWdlbnRhJykudG9TdHJpbmcoKSA9PT0gQ2hyb21hdGgucmVkLnRvU3RyaW5nKCk7XG4gID4gdHJ1ZVxuXG4gID4gPiBDaHJvbWF0aC5zdWJ0cmFjdGl2ZSgnY3lhbicsICdtYWdlbnRhJywgJ3llbGxvdycpLnRvU3RyaW5nKCk7XG4gID4gJyMwMDAwMDAnXG5cbiAgPiA+IENocm9tYXRoLnN1YnRyYWN0aXZlKCdyZWQnLCAnIzBGMCcsICdyZ2IoMCwgMCwgMjU1KScpLnRvU3RyaW5nKCk7XG4gID4gJyMwMDAwMDAnXG4qL1xuQ2hyb21hdGguc3VidHJhY3RpdmUgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aC0yLCBpPS0xLCBhLCBiO1xuICAgIHdoaWxlIChpKysgPCBhcmdzKXtcblxuICAgICAgICBhID0gYSB8fCBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2ldKTtcbiAgICAgICAgYiA9IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaSsxXSk7XG5cbiAgICAgICAgaWYgKChhLnIgKz0gYi5yIC0gMjU1KSA8IDApIGEuciA9IDA7XG4gICAgICAgIGlmICgoYS5nICs9IGIuZyAtIDI1NSkgPCAwKSBhLmcgPSAwO1xuICAgICAgICBpZiAoKGEuYiArPSBiLmIgLSAyNTUpIDwgMCkgYS5iID0gMDtcblxuICAgICAgICBhID0gbmV3IENocm9tYXRoKGEpO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5tdWx0aXBseVxuICBNdWx0aXBseSBhbnkgbnVtYmVyIG9mIGNvbG9yc1xuXG4gIEV4YW1wbGVzOlxuICA+ID4gQ2hyb21hdGgubXVsdGlwbHkoQ2hyb21hdGgubGlnaHRnb2xkZW5yb2R5ZWxsb3csIENocm9tYXRoLmxpZ2h0Ymx1ZSkudG9TdHJpbmcoKTtcbiAgPiBcIiNBOUQzQkRcIlxuXG4gID4gPiBDaHJvbWF0aC5tdWx0aXBseShDaHJvbWF0aC5vbGRsYWNlLCBDaHJvbWF0aC5saWdodGJsdWUsIENocm9tYXRoLmRhcmtibHVlKS50b1N0cmluZygpO1xuICA+IFwiIzAwMDA3MFwiXG4qL1xuQ2hyb21hdGgubXVsdGlwbHkgPSBmdW5jdGlvbiAoKVxue1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aC0yLCBpPS0xLCBhLCBiO1xuICAgIHdoaWxlIChpKysgPCBhcmdzKXtcblxuICAgICAgICBhID0gYSB8fCBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2ldKTtcbiAgICAgICAgYiA9IG5ldyBDaHJvbWF0aChhcmd1bWVudHNbaSsxXSk7XG5cbiAgICAgICAgYS5yID0gKGEuciAvIDI1NSAqIGIucil8MDtcbiAgICAgICAgYS5nID0gKGEuZyAvIDI1NSAqIGIuZyl8MDtcbiAgICAgICAgYS5iID0gKGEuYiAvIDI1NSAqIGIuYil8MDtcblxuICAgICAgICBhID0gbmV3IENocm9tYXRoKGEpO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufTtcblxuLypcbiAgTWV0aG9kOiBDaHJvbWF0aC5hdmVyYWdlXG4gIEF2ZXJhZ2VzIGFueSBudW1iZXIgb2YgY29sb3JzXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5hdmVyYWdlKENocm9tYXRoLmxpZ2h0Z29sZGVucm9keWVsbG93LCBDaHJvbWF0aC5saWdodGJsdWUpLnRvU3RyaW5nKClcbiAgPiBcIiNEM0U5RENcIlxuXG4gID4gPiBDaHJvbWF0aC5hdmVyYWdlKENocm9tYXRoLm9sZGxhY2UsIENocm9tYXRoLmxpZ2h0Ymx1ZSwgQ2hyb21hdGguZGFya2JsdWUpLnRvU3RyaW5nKClcbiAgPiBcIiM2QTczQjhcIlxuICovXG5DaHJvbWF0aC5hdmVyYWdlID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGgtMiwgaT0tMSwgYSwgYjtcbiAgICB3aGlsZSAoaSsrIDwgYXJncyl7XG5cbiAgICAgICAgYSA9IGEgfHwgbmV3IENocm9tYXRoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIGIgPSBuZXcgQ2hyb21hdGgoYXJndW1lbnRzW2krMV0pO1xuXG4gICAgICAgIGEuciA9IChhLnIgKyBiLnIpID4+IDE7XG4gICAgICAgIGEuZyA9IChhLmcgKyBiLmcpID4+IDE7XG4gICAgICAgIGEuYiA9IChhLmIgKyBiLmIpID4+IDE7XG5cbiAgICAgICAgYSA9IG5ldyBDaHJvbWF0aChhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYTtcbn07XG5cbi8qXG4gIE1ldGhvZDogQ2hyb21hdGgub3ZlcmxheVxuICBBZGQgb25lIGNvbG9yIG9uIHRvcCBvZiBhbm90aGVyIHdpdGggYSBnaXZlbiB0cmFuc3BhcmVuY3lcblxuICBFeGFtcGxlczpcbiAgPiA+IENocm9tYXRoLmF2ZXJhZ2UoQ2hyb21hdGgubGlnaHRnb2xkZW5yb2R5ZWxsb3csIENocm9tYXRoLmxpZ2h0Ymx1ZSkudG9TdHJpbmcoKVxuICA+IFwiI0QzRTlEQ1wiXG5cbiAgPiA+IENocm9tYXRoLmF2ZXJhZ2UoQ2hyb21hdGgub2xkbGFjZSwgQ2hyb21hdGgubGlnaHRibHVlLCBDaHJvbWF0aC5kYXJrYmx1ZSkudG9TdHJpbmcoKVxuICA+IFwiIzZBNzNCOFwiXG4gKi9cbkNocm9tYXRoLm92ZXJsYXkgPSBmdW5jdGlvbiAodG9wLCBib3R0b20sIG9wYWNpdHkpXG57XG4gICAgdmFyIGEgPSBuZXcgQ2hyb21hdGgodG9wKTtcbiAgICB2YXIgYiA9IG5ldyBDaHJvbWF0aChib3R0b20pO1xuXG4gICAgaWYgKG9wYWNpdHkgPiAxKSBvcGFjaXR5IC89IDEwMDtcbiAgICBvcGFjaXR5ID0gdXRpbC5jbGFtcChvcGFjaXR5IC0gMSArIGIuYSwgMCwgMSk7XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKHtcbiAgICAgICAgcjogdXRpbC5sZXJwKGEuciwgYi5yLCBvcGFjaXR5KSxcbiAgICAgICAgZzogdXRpbC5sZXJwKGEuZywgYi5nLCBvcGFjaXR5KSxcbiAgICAgICAgYjogdXRpbC5sZXJwKGEuYiwgYi5iLCBvcGFjaXR5KVxuICAgIH0pO1xufTtcblxuXG4vL0dyb3VwOiBTdGF0aWMgbWV0aG9kcyAtIG90aGVyXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnRvd2FyZHNcbiAgTW92ZSBmcm9tIG9uZSBjb2xvciB0b3dhcmRzIGFub3RoZXIgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UgKDAtMSwgMC0xMDApXG5cbiAgUGFyYW1ldGVyczpcbiAgZnJvbSAtIFRoZSBzdGFydGluZyBjb2xvclxuICB0byAtIFRoZSBkZXN0aW5hdGlvbiBjb2xvclxuICBieSAtIFRoZSBwZXJjZW50YWdlLCBleHByZXNzZWQgYXMgYSBmbG9hdGluZyBudW1iZXIgYmV0d2VlbiAwIGFuZCAxLCB0byBtb3ZlIHRvd2FyZHMgdGhlIGRlc3RpbmF0aW9uIGNvbG9yXG4gIGludGVycG9sYXRvciAtIFRoZSBmdW5jdGlvbiB0byB1c2UgZm9yIGludGVycG9sYXRpbmcgYmV0d2VlbiB0aGUgdHdvIHBvaW50cy4gRGVmYXVsdHMgdG8gTGluZWFyIEludGVycG9sYXRpb24uIEZ1bmN0aW9uIGhhcyB0aGUgc2lnbmF0dXJlIGAoZnJvbSwgdG8sIGJ5KWAgd2l0aCB0aGUgcGFyYW1ldGVycyBoYXZpbmcgdGhlIHNhbWUgbWVhbmluZyBhcyB0aG9zZSBpbiBgdG93YXJkc2AuXG5cbiAgPiA+IENocm9tYXRoLnRvd2FyZHMoJ3JlZCcsICd5ZWxsb3cnLCAwLjUpLnRvU3RyaW5nKClcbiAgPiBcIiNGRjdGMDBcIlxuKi9cbkNocm9tYXRoLnRvd2FyZHMgPSBmdW5jdGlvbiAoZnJvbSwgdG8sIGJ5LCBpbnRlcnBvbGF0b3IpXG57XG4gICAgaWYgKCF0bykgeyByZXR1cm4gZnJvbTsgfVxuICAgIGlmICghaXNGaW5pdGUoYnkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1R5cGVFcnJvcjogYGJ5YCgnICsgYnkgICsnKSBzaG91bGQgYmUgYmV0d2VlbiAwIGFuZCAxJyk7XG4gICAgaWYgKCEoZnJvbSBpbnN0YW5jZW9mIENocm9tYXRoKSkgZnJvbSA9IG5ldyBDaHJvbWF0aChmcm9tKTtcbiAgICBpZiAoISh0byBpbnN0YW5jZW9mIENocm9tYXRoKSkgdG8gPSBuZXcgQ2hyb21hdGgodG8gfHwgJyNGRkZGRkYnKTtcbiAgICBpZiAoIWludGVycG9sYXRvcikgaW50ZXJwb2xhdG9yID0gdXRpbC5sZXJwO1xuICAgIGJ5ID0gcGFyc2VGbG9hdChieSk7XG5cbiAgICByZXR1cm4gbmV3IENocm9tYXRoKHtcbiAgICAgICAgcjogaW50ZXJwb2xhdG9yKGZyb20uciwgdG8uciwgYnkpLFxuICAgICAgICBnOiBpbnRlcnBvbGF0b3IoZnJvbS5nLCB0by5nLCBieSksXG4gICAgICAgIGI6IGludGVycG9sYXRvcihmcm9tLmIsIHRvLmIsIGJ5KSxcbiAgICAgICAgYTogaW50ZXJwb2xhdG9yKGZyb20uYSwgdG8uYSwgYnkpXG4gICAgfSk7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLmdyYWRpZW50XG4gIENyZWF0ZSBhbiBhcnJheSBvZiBDaHJvbWF0aCBvYmplY3RzXG5cbiAgUGFyYW1ldGVyczpcbiAgZnJvbSAtIFRoZSBiZWdpbm5pbmcgY29sb3Igb2YgdGhlIGdyYWRpZW50XG4gIHRvIC0gVGhlIGVuZCBjb2xvciBvZiB0aGUgZ3JhZGllbnRcbiAgc2xpY2VzIC0gVGhlIG51bWJlciBvZiBjb2xvcnMgaW4gdGhlIGFycmF5XG4gIHNsaWNlIC0gVGhlIGNvbG9yIGF0IGEgc3BlY2lmaWMsIDEtYmFzZWQsIHNsaWNlIGluZGV4XG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5ncmFkaWVudCgncmVkJywgJ3llbGxvdycpLmxlbmd0aDtcbiAgPiAyMFxuXG4gID4gPiBDaHJvbWF0aC5ncmFkaWVudCgncmVkJywgJ3llbGxvdycsIDUpLnRvU3RyaW5nKCk7XG4gID4gXCIjRkYwMDAwLCNGRjNGMDAsI0ZGN0YwMCwjRkZCRjAwLCNGRkZGMDBcIlxuXG4gID4gPiBDaHJvbWF0aC5ncmFkaWVudCgncmVkJywgJ3llbGxvdycsIDUsIDIpLnRvU3RyaW5nKCk7XG4gID4gXCIjRkY3RjAwXCJcblxuICA+ID4gQ2hyb21hdGguZ3JhZGllbnQoJ3JlZCcsICd5ZWxsb3cnLCA1KVsyXS50b1N0cmluZygpO1xuICA+IFwiI0ZGN0YwMFwiXG4gKi9cbkNocm9tYXRoLmdyYWRpZW50ID0gZnVuY3Rpb24gKGZyb20sIHRvLCBzbGljZXMsIHNsaWNlKVxue1xuICAgIHZhciBncmFkaWVudCA9IFtdLCBzdG9wcztcblxuICAgIGlmICghIHNsaWNlcykgc2xpY2VzID0gMjA7XG4gICAgc3RvcHMgPSAoc2xpY2VzLTEpO1xuXG4gICAgaWYgKGlzRmluaXRlKHNsaWNlKSkgcmV0dXJuIENocm9tYXRoLnRvd2FyZHMoZnJvbSwgdG8sIHNsaWNlL3N0b3BzKTtcbiAgICBlbHNlIHNsaWNlID0gLTE7XG5cbiAgICB3aGlsZSAoKytzbGljZSA8IHNsaWNlcyl7XG4gICAgICAgIGdyYWRpZW50LnB1c2goQ2hyb21hdGgudG93YXJkcyhmcm9tLCB0bywgc2xpY2Uvc3RvcHMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JhZGllbnQ7XG59O1xuXG4vKlxuICBNZXRob2Q6IENocm9tYXRoLnBhcnNlXG4gIEl0ZXJhdGUgdGhyb3VnaCB0aGUgb2JqZWN0cyBzZXQgaW4gQ2hyb21hdGgucGFyc2VycyBhbmQsIGlmIGEgbWF0Y2ggaXMgbWFkZSwgcmV0dXJuIHRoZSB2YWx1ZSBzcGVjaWZpZWQgYnkgdGhlIG1hdGNoaW5nIHBhcnNlcnMgYHByb2Nlc3NgIGZ1bmN0aW9uXG5cbiAgUGFyYW1ldGVyczpcbiAgc3RyaW5nIC0gVGhlIHN0cmluZyB0byBwYXJzZVxuXG4gIEV4YW1wbGU6XG4gID4gPiBDaHJvbWF0aC5wYXJzZSgncmdiKDAsIDEyOCwgMjU1KScpXG4gID4geyByOiAwLCBnOiAxMjgsIGI6IDI1NSwgYTogdW5kZWZpbmVkIH1cbiAqL1xuQ2hyb21hdGgucGFyc2UgPSBmdW5jdGlvbiAoc3RyaW5nKVxue1xuICAgIHZhciBwYXJzZXJzID0gQ2hyb21hdGgucGFyc2VycywgaSwgbCwgcGFyc2VyLCBwYXJ0cywgY2hhbm5lbHM7XG5cbiAgICBmb3IgKGkgPSAwLCBsID0gcGFyc2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgcGFyc2VyID0gcGFyc2Vyc1tpXTtcbiAgICAgICAgcGFydHMgPSBwYXJzZXIucmVnZXguZXhlYyhzdHJpbmcpO1xuICAgICAgICBpZiAocGFydHMgJiYgcGFydHMubGVuZ3RoKSBjaGFubmVscyA9IHBhcnNlci5wcm9jZXNzLmFwcGx5KHRoaXMsIHBhcnRzKTtcbiAgICAgICAgaWYgKGNoYW5uZWxzKSByZXR1cm4gY2hhbm5lbHM7XG4gICAgfVxufTtcblxuLy8gR3JvdXA6IFN0YXRpYyBwcm9wZXJ0aWVzXG4vKlxuICBQcm9wZXJ0eTogQ2hyb21hdGgucGFyc2Vyc1xuICAgQW4gYXJyYXkgb2Ygb2JqZWN0cyBmb3IgYXR0ZW1wdGluZyB0byBjb252ZXJ0IGEgc3RyaW5nIGRlc2NyaWJpbmcgYSBjb2xvciBpbnRvIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSB2YXJpb3VzIGNoYW5uZWxzLiBObyB1c2VyIGFjdGlvbiBpcyByZXF1aXJlZCBidXQgcGFyc2VycyBjYW4gYmVcblxuICAgT2JqZWN0IHByb3BlcnRpZXM6XG4gICByZWdleCAtIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHRlc3QgdGhlIHN0cmluZyBvciBudW1lcmljIGlucHV0XG4gICBwcm9jZXNzIC0gZnVuY3Rpb24gd2hpY2ggaXMgcGFzc2VkIHRoZSByZXN1bHRzIG9mIGByZWdleC5tYXRjaGAgYW5kIHJldHVybnMgYW4gb2JqZWN0IHdpdGggZWl0aGVyIHRoZSByZ2IsIGhzbCwgaHN2LCBvciBoc2IgY2hhbm5lbHMgb2YgdGhlIENocm9tYXRoLlxuXG4gICBFeGFtcGxlczpcbihzdGFydCBjb2RlKVxuLy8gQWRkIGEgcGFyc2VyXG5DaHJvbWF0aC5wYXJzZXJzLnB1c2goe1xuICAgIGV4YW1wbGU6IFszNTU0NDMxLCAxNjgwOTk4NF0sXG4gICAgcmVnZXg6IC9eXFxkKyQvLFxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChjb2xvcil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBjb2xvciA+PiAxNiAmIDI1NSxcbiAgICAgICAgICAgIGc6IGNvbG9yID4+IDggJiAyNTUsXG4gICAgICAgICAgICBiOiBjb2xvciAmIDI1NVxuICAgICAgICB9O1xuICAgIH1cbn0pO1xuKGVuZCBjb2RlKVxuKHN0YXJ0IGNvZGUpXG4vLyBPdmVycmlkZSBlbnRpcmVseVxuQ2hyb21hdGgucGFyc2VycyA9IFtcbiAgIHtcbiAgICAgICBleGFtcGxlOiBbMzU1NDQzMSwgMTY4MDk5ODRdLFxuICAgICAgIHJlZ2V4OiAvXlxcZCskLyxcbiAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoY29sb3Ipe1xuICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgcjogY29sb3IgPj4gMTYgJiAyNTUsXG4gICAgICAgICAgICAgICBnOiBjb2xvciA+PiA4ICYgMjU1LFxuICAgICAgICAgICAgICAgYjogY29sb3IgJiAyNTVcbiAgICAgICAgICAgfTtcbiAgICAgICB9XG4gICB9LFxuXG4gICB7XG4gICAgICAgZXhhbXBsZTogWycjZmIwJywgJ2YwZiddLFxuICAgICAgIHJlZ2V4OiAvXiM/KFtcXGRBLUZdezF9KShbXFxkQS1GXXsxfSkoW1xcZEEtRl17MX0pJC9pLFxuICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIChoZXgsIHIsIGcsIGIpe1xuICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgcjogcGFyc2VJbnQociArIHIsIDE2KSxcbiAgICAgICAgICAgICAgIGc6IHBhcnNlSW50KGcgKyBnLCAxNiksXG4gICAgICAgICAgICAgICBiOiBwYXJzZUludChiICsgYiwgMTYpXG4gICAgICAgICAgIH07XG4gICAgICAgfVxuICAgfVxuKGVuZCBjb2RlKVxuICovXG5DaHJvbWF0aC5wYXJzZXJzID0gcmVxdWlyZSgnLi9wYXJzZXJzJykucGFyc2VycztcblxuLy8gR3JvdXA6IEluc3RhbmNlIG1ldGhvZHMgLSBjb2xvciByZXByZXNlbnRhdGlvblxuQ2hyb21hdGgucHJvdG90eXBlID0gcmVxdWlyZSgnLi9wcm90b3R5cGUnKShDaHJvbWF0aCk7XG5cbi8qXG4gIFByb3BlcnR5OiBDaHJvbWF0aC5jb2xvcnNcbiAgT2JqZWN0LCBpbmRleGVkIGJ5IFNWRy9DU1MgY29sb3IgbmFtZSwgb2YgPENocm9tYXRoPiBpbnN0YW5jZXNcbiAgVGhlIGNvbG9yIG5hbWVzIGZyb20gQ1NTIGFuZCBTVkcgMS4wXG5cbiAgRXhhbXBsZXM6XG4gID4gPiBDaHJvbWF0aC5jb2xvcnMuYWxpY2VibHVlLnRvUkdCQXJyYXkoKVxuICA+IFsyNDAsIDI0OCwgMjU1XVxuXG4gID4gPiBDaHJvbWF0aC5jb2xvcnMuYmVpZ2UudG9TdHJpbmcoKVxuICA+IFwiI0Y1RjVEQ1wiXG5cbiAgPiAvLyBDYW4gYWxzbyBiZSBhY2Nlc3NlZCB3aXRob3V0IGAuY29sb3JgXG4gID4gPiBDaHJvbWF0aC5hbGljZWJsdWUudG9SR0JBcnJheSgpXG4gID4gWzI0MCwgMjQ4LCAyNTVdXG5cbiAgPiA+IENocm9tYXRoLmJlaWdlLnRvU3RyaW5nKClcbiAgPiBcIiNGNUY1RENcIlxuKi9cbnZhciBjc3MyQ29sb3JzICA9IHJlcXVpcmUoJy4vY29sb3JuYW1lc19jc3MyJyk7XG52YXIgY3NzM0NvbG9ycyAgPSByZXF1aXJlKCcuL2NvbG9ybmFtZXNfY3NzMycpO1xudmFyIGFsbENvbG9ycyAgID0gdXRpbC5tZXJnZSh7fSwgY3NzMkNvbG9ycywgY3NzM0NvbG9ycyk7XG5DaHJvbWF0aC5jb2xvcnMgPSB7fTtcbmZvciAodmFyIGNvbG9yTmFtZSBpbiBhbGxDb2xvcnMpIHtcbiAgICAvLyBlLmcuLCBDaHJvbWF0aC53aGVhdCBhbmQgQ2hyb21hdGguY29sb3JzLndoZWF0XG4gICAgQ2hyb21hdGhbY29sb3JOYW1lXSA9IENocm9tYXRoLmNvbG9yc1tjb2xvck5hbWVdID0gbmV3IENocm9tYXRoKGFsbENvbG9yc1tjb2xvck5hbWVdKTtcbn1cbi8vIGFkZCBhIHBhcnNlciBmb3IgdGhlIGNvbG9yIG5hbWVzXG5DaHJvbWF0aC5wYXJzZXJzLnB1c2goe1xuICAgIGV4YW1wbGU6IFsncmVkJywgJ2J1cmx5d29vZCddLFxuICAgIHJlZ2V4OiAvXlthLXpdKyQvaSxcbiAgICBwcm9jZXNzOiBmdW5jdGlvbiAoY29sb3JOYW1lKXtcbiAgICAgICAgaWYgKENocm9tYXRoLmNvbG9yc1tjb2xvck5hbWVdKSByZXR1cm4gQ2hyb21hdGguY29sb3JzW2NvbG9yTmFtZV07XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hyb21hdGg7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLyBmcm9tIGh0dHA6Ly93d3cudzMub3JnL1RSL1JFQy1odG1sNDAvdHlwZXMuaHRtbCNoLTYuNVxuICAgIGFxdWEgICAgOiB7cjogMCwgICBnOiAyNTUsIGI6IDI1NX0sXG4gICAgYmxhY2sgICA6IHtyOiAwLCAgIGc6IDAsICAgYjogMH0sXG4gICAgYmx1ZSAgICA6IHtyOiAwLCAgIGc6IDAsICAgYjogMjU1fSxcbiAgICBmdWNoc2lhIDoge3I6IDI1NSwgZzogMCwgICBiOiAyNTV9LFxuICAgIGdyYXkgICAgOiB7cjogMTI4LCBnOiAxMjgsIGI6IDEyOH0sXG4gICAgZ3JlZW4gICA6IHtyOiAwLCAgIGc6IDEyOCwgYjogMH0sXG4gICAgbGltZSAgICA6IHtyOiAwLCAgIGc6IDI1NSwgYjogMH0sXG4gICAgbWFyb29uICA6IHtyOiAxMjgsIGc6IDAsICAgYjogMH0sXG4gICAgbmF2eSAgICA6IHtyOiAwLCAgIGc6IDAsICAgYjogMTI4fSxcbiAgICBvbGl2ZSAgIDoge3I6IDEyOCwgZzogMTI4LCBiOiAwfSxcbiAgICBwdXJwbGUgIDoge3I6IDEyOCwgZzogMCwgICBiOiAxMjh9LFxuICAgIHJlZCAgICAgOiB7cjogMjU1LCBnOiAwLCAgIGI6IDB9LFxuICAgIHNpbHZlciAgOiB7cjogMTkyLCBnOiAxOTIsIGI6IDE5Mn0sXG4gICAgdGVhbCAgICA6IHtyOiAwLCAgIGc6IDEyOCwgYjogMTI4fSxcbiAgICB3aGl0ZSAgIDoge3I6IDI1NSwgZzogMjU1LCBiOiAyNTV9LFxuICAgIHllbGxvdyAgOiB7cjogMjU1LCBnOiAyNTUsIGI6IDB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1jb2xvci8jc3ZnLWNvbG9yXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3R5cGVzLmh0bWwjQ29sb3JLZXl3b3Jkc1xuICAgIGFsaWNlYmx1ZSAgICAgICAgICAgIDoge3I6IDI0MCwgZzogMjQ4LCBiOiAyNTV9LFxuICAgIGFudGlxdWV3aGl0ZSAgICAgICAgIDoge3I6IDI1MCwgZzogMjM1LCBiOiAyMTV9LFxuICAgIGFxdWFtYXJpbmUgICAgICAgICAgIDoge3I6IDEyNywgZzogMjU1LCBiOiAyMTJ9LFxuICAgIGF6dXJlICAgICAgICAgICAgICAgIDoge3I6IDI0MCwgZzogMjU1LCBiOiAyNTV9LFxuICAgIGJlaWdlICAgICAgICAgICAgICAgIDoge3I6IDI0NSwgZzogMjQ1LCBiOiAyMjB9LFxuICAgIGJpc3F1ZSAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjI4LCBiOiAxOTZ9LFxuICAgIGJsYW5jaGVkYWxtb25kICAgICAgIDoge3I6IDI1NSwgZzogMjM1LCBiOiAyMDV9LFxuICAgIGJsdWV2aW9sZXQgICAgICAgICAgIDoge3I6IDEzOCwgZzogNDMsICBiOiAyMjZ9LFxuICAgIGJyb3duICAgICAgICAgICAgICAgIDoge3I6IDE2NSwgZzogNDIsICBiOiA0Mn0sXG4gICAgYnVybHl3b29kICAgICAgICAgICAgOiB7cjogMjIyLCBnOiAxODQsIGI6IDEzNX0sXG4gICAgY2FkZXRibHVlICAgICAgICAgICAgOiB7cjogOTUsICBnOiAxNTgsIGI6IDE2MH0sXG4gICAgY2hhcnRyZXVzZSAgICAgICAgICAgOiB7cjogMTI3LCBnOiAyNTUsIGI6IDB9LFxuICAgIGNob2NvbGF0ZSAgICAgICAgICAgIDoge3I6IDIxMCwgZzogMTA1LCBiOiAzMH0sXG4gICAgY29yYWwgICAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAxMjcsIGI6IDgwfSxcbiAgICBjb3JuZmxvd2VyYmx1ZSAgICAgICA6IHtyOiAxMDAsIGc6IDE0OSwgYjogMjM3fSxcbiAgICBjb3Juc2lsayAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDI0OCwgYjogMjIwfSxcbiAgICBjcmltc29uICAgICAgICAgICAgICA6IHtyOiAyMjAsIGc6IDIwLCAgYjogNjB9LFxuICAgIGN5YW4gICAgICAgICAgICAgICAgIDoge3I6IDAsICAgZzogMjU1LCBiOiAyNTV9LFxuICAgIGRhcmtibHVlICAgICAgICAgICAgIDoge3I6IDAsICAgZzogMCwgICBiOiAxMzl9LFxuICAgIGRhcmtjeWFuICAgICAgICAgICAgIDoge3I6IDAsICAgZzogMTM5LCBiOiAxMzl9LFxuICAgIGRhcmtnb2xkZW5yb2QgICAgICAgIDoge3I6IDE4NCwgZzogMTM0LCBiOiAxMX0sXG4gICAgZGFya2dyYXkgICAgICAgICAgICAgOiB7cjogMTY5LCBnOiAxNjksIGI6IDE2OX0sXG4gICAgZGFya2dyZWVuICAgICAgICAgICAgOiB7cjogMCwgICBnOiAxMDAsIGI6IDB9LFxuICAgIGRhcmtncmV5ICAgICAgICAgICAgIDoge3I6IDE2OSwgZzogMTY5LCBiOiAxNjl9LFxuICAgIGRhcmtraGFraSAgICAgICAgICAgIDoge3I6IDE4OSwgZzogMTgzLCBiOiAxMDd9LFxuICAgIGRhcmttYWdlbnRhICAgICAgICAgIDoge3I6IDEzOSwgZzogMCwgICBiOiAxMzl9LFxuICAgIGRhcmtvbGl2ZWdyZWVuICAgICAgIDoge3I6IDg1LCAgZzogMTA3LCBiOiA0N30sXG4gICAgZGFya29yYW5nZSAgICAgICAgICAgOiB7cjogMjU1LCBnOiAxNDAsIGI6IDB9LFxuICAgIGRhcmtvcmNoaWQgICAgICAgICAgIDoge3I6IDE1MywgZzogNTAsICBiOiAyMDR9LFxuICAgIGRhcmtyZWQgICAgICAgICAgICAgIDoge3I6IDEzOSwgZzogMCwgICBiOiAwfSxcbiAgICBkYXJrc2FsbW9uICAgICAgICAgICA6IHtyOiAyMzMsIGc6IDE1MCwgYjogMTIyfSxcbiAgICBkYXJrc2VhZ3JlZW4gICAgICAgICA6IHtyOiAxNDMsIGc6IDE4OCwgYjogMTQzfSxcbiAgICBkYXJrc2xhdGVibHVlICAgICAgICA6IHtyOiA3MiwgIGc6IDYxLCAgYjogMTM5fSxcbiAgICBkYXJrc2xhdGVncmF5ICAgICAgICA6IHtyOiA0NywgIGc6IDc5LCAgYjogNzl9LFxuICAgIGRhcmtzbGF0ZWdyZXkgICAgICAgIDoge3I6IDQ3LCAgZzogNzksICBiOiA3OX0sXG4gICAgZGFya3R1cnF1b2lzZSAgICAgICAgOiB7cjogMCwgICBnOiAyMDYsIGI6IDIwOX0sXG4gICAgZGFya3Zpb2xldCAgICAgICAgICAgOiB7cjogMTQ4LCBnOiAwLCAgIGI6IDIxMX0sXG4gICAgZGVlcHBpbmsgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyMCwgIGI6IDE0N30sXG4gICAgZGVlcHNreWJsdWUgICAgICAgICAgOiB7cjogMCwgICBnOiAxOTEsIGI6IDI1NX0sXG4gICAgZGltZ3JheSAgICAgICAgICAgICAgOiB7cjogMTA1LCBnOiAxMDUsIGI6IDEwNX0sXG4gICAgZGltZ3JleSAgICAgICAgICAgICAgOiB7cjogMTA1LCBnOiAxMDUsIGI6IDEwNX0sXG4gICAgZG9kZ2VyYmx1ZSAgICAgICAgICAgOiB7cjogMzAsICBnOiAxNDQsIGI6IDI1NX0sXG4gICAgZmlyZWJyaWNrICAgICAgICAgICAgOiB7cjogMTc4LCBnOiAzNCwgIGI6IDM0fSxcbiAgICBmbG9yYWx3aGl0ZSAgICAgICAgICA6IHtyOiAyNTUsIGc6IDI1MCwgYjogMjQwfSxcbiAgICBmb3Jlc3RncmVlbiAgICAgICAgICA6IHtyOiAzNCwgIGc6IDEzOSwgYjogMzR9LFxuICAgIGdhaW5zYm9ybyAgICAgICAgICAgIDoge3I6IDIyMCwgZzogMjIwLCBiOiAyMjB9LFxuICAgIGdob3N0d2hpdGUgICAgICAgICAgIDoge3I6IDI0OCwgZzogMjQ4LCBiOiAyNTV9LFxuICAgIGdvbGQgICAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjE1LCBiOiAwfSxcbiAgICBnb2xkZW5yb2QgICAgICAgICAgICA6IHtyOiAyMTgsIGc6IDE2NSwgYjogMzJ9LFxuICAgIGdyZWVueWVsbG93ICAgICAgICAgIDoge3I6IDE3MywgZzogMjU1LCBiOiA0N30sXG4gICAgZ3JleSAgICAgICAgICAgICAgICAgOiB7cjogMTI4LCBnOiAxMjgsIGI6IDEyOH0sXG4gICAgaG9uZXlkZXcgICAgICAgICAgICAgOiB7cjogMjQwLCBnOiAyNTUsIGI6IDI0MH0sXG4gICAgaG90cGluayAgICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAxMDUsIGI6IDE4MH0sXG4gICAgaW5kaWFucmVkICAgICAgICAgICAgOiB7cjogMjA1LCBnOiA5MiwgIGI6IDkyfSxcbiAgICBpbmRpZ28gICAgICAgICAgICAgICA6IHtyOiA3NSwgIGc6IDAsICAgYjogMTMwfSxcbiAgICBpdm9yeSAgICAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDI1NSwgYjogMjQwfSxcbiAgICBraGFraSAgICAgICAgICAgICAgICA6IHtyOiAyNDAsIGc6IDIzMCwgYjogMTQwfSxcbiAgICBsYXZlbmRlciAgICAgICAgICAgICA6IHtyOiAyMzAsIGc6IDIzMCwgYjogMjUwfSxcbiAgICBsYXZlbmRlcmJsdXNoICAgICAgICA6IHtyOiAyNTUsIGc6IDI0MCwgYjogMjQ1fSxcbiAgICBsYXduZ3JlZW4gICAgICAgICAgICA6IHtyOiAxMjQsIGc6IDI1MiwgYjogMH0sXG4gICAgbGVtb25jaGlmZm9uICAgICAgICAgOiB7cjogMjU1LCBnOiAyNTAsIGI6IDIwNX0sXG4gICAgbGlnaHRibHVlICAgICAgICAgICAgOiB7cjogMTczLCBnOiAyMTYsIGI6IDIzMH0sXG4gICAgbGlnaHRjb3JhbCAgICAgICAgICAgOiB7cjogMjQwLCBnOiAxMjgsIGI6IDEyOH0sXG4gICAgbGlnaHRjeWFuICAgICAgICAgICAgOiB7cjogMjI0LCBnOiAyNTUsIGI6IDI1NX0sXG4gICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3cgOiB7cjogMjUwLCBnOiAyNTAsIGI6IDIxMH0sXG4gICAgbGlnaHRncmF5ICAgICAgICAgICAgOiB7cjogMjExLCBnOiAyMTEsIGI6IDIxMX0sXG4gICAgbGlnaHRncmVlbiAgICAgICAgICAgOiB7cjogMTQ0LCBnOiAyMzgsIGI6IDE0NH0sXG4gICAgbGlnaHRncmV5ICAgICAgICAgICAgOiB7cjogMjExLCBnOiAyMTEsIGI6IDIxMX0sXG4gICAgbGlnaHRwaW5rICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAxODIsIGI6IDE5M30sXG4gICAgbGlnaHRzYWxtb24gICAgICAgICAgOiB7cjogMjU1LCBnOiAxNjAsIGI6IDEyMn0sXG4gICAgbGlnaHRzZWFncmVlbiAgICAgICAgOiB7cjogMzIsICBnOiAxNzgsIGI6IDE3MH0sXG4gICAgbGlnaHRza3libHVlICAgICAgICAgOiB7cjogMTM1LCBnOiAyMDYsIGI6IDI1MH0sXG4gICAgbGlnaHRzbGF0ZWdyYXkgICAgICAgOiB7cjogMTE5LCBnOiAxMzYsIGI6IDE1M30sXG4gICAgbGlnaHRzbGF0ZWdyZXkgICAgICAgOiB7cjogMTE5LCBnOiAxMzYsIGI6IDE1M30sXG4gICAgbGlnaHRzdGVlbGJsdWUgICAgICAgOiB7cjogMTc2LCBnOiAxOTYsIGI6IDIyMn0sXG4gICAgbGlnaHR5ZWxsb3cgICAgICAgICAgOiB7cjogMjU1LCBnOiAyNTUsIGI6IDIyNH0sXG4gICAgbGltZWdyZWVuICAgICAgICAgICAgOiB7cjogNTAsICBnOiAyMDUsIGI6IDUwfSxcbiAgICBsaW5lbiAgICAgICAgICAgICAgICA6IHtyOiAyNTAsIGc6IDI0MCwgYjogMjMwfSxcbiAgICBtYWdlbnRhICAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDAsICAgYjogMjU1fSxcbiAgICBtZWRpdW1hcXVhbWFyaW5lICAgICA6IHtyOiAxMDIsIGc6IDIwNSwgYjogMTcwfSxcbiAgICBtZWRpdW1ibHVlICAgICAgICAgICA6IHtyOiAwLCAgIGc6IDAsICAgYjogMjA1fSxcbiAgICBtZWRpdW1vcmNoaWQgICAgICAgICA6IHtyOiAxODYsIGc6IDg1LCAgYjogMjExfSxcbiAgICBtZWRpdW1wdXJwbGUgICAgICAgICA6IHtyOiAxNDcsIGc6IDExMiwgYjogMjE5fSxcbiAgICBtZWRpdW1zZWFncmVlbiAgICAgICA6IHtyOiA2MCwgIGc6IDE3OSwgYjogMTEzfSxcbiAgICBtZWRpdW1zbGF0ZWJsdWUgICAgICA6IHtyOiAxMjMsIGc6IDEwNCwgYjogMjM4fSxcbiAgICBtZWRpdW1zcHJpbmdncmVlbiAgICA6IHtyOiAwLCAgIGc6IDI1MCwgYjogMTU0fSxcbiAgICBtZWRpdW10dXJxdW9pc2UgICAgICA6IHtyOiA3MiwgIGc6IDIwOSwgYjogMjA0fSxcbiAgICBtZWRpdW12aW9sZXRyZWQgICAgICA6IHtyOiAxOTksIGc6IDIxLCAgYjogMTMzfSxcbiAgICBtaWRuaWdodGJsdWUgICAgICAgICA6IHtyOiAyNSwgIGc6IDI1LCAgYjogMTEyfSxcbiAgICBtaW50Y3JlYW0gICAgICAgICAgICA6IHtyOiAyNDUsIGc6IDI1NSwgYjogMjUwfSxcbiAgICBtaXN0eXJvc2UgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIyOCwgYjogMjI1fSxcbiAgICBtb2NjYXNpbiAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIyOCwgYjogMTgxfSxcbiAgICBuYXZham93aGl0ZSAgICAgICAgICA6IHtyOiAyNTUsIGc6IDIyMiwgYjogMTczfSxcbiAgICBvbGRsYWNlICAgICAgICAgICAgICA6IHtyOiAyNTMsIGc6IDI0NSwgYjogMjMwfSxcbiAgICBvbGl2ZWRyYWIgICAgICAgICAgICA6IHtyOiAxMDcsIGc6IDE0MiwgYjogMzV9LFxuICAgIG9yYW5nZSAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMTY1LCBiOiAwfSxcbiAgICBvcmFuZ2VyZWQgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDY5LCAgYjogMH0sXG4gICAgb3JjaGlkICAgICAgICAgICAgICAgOiB7cjogMjE4LCBnOiAxMTIsIGI6IDIxNH0sXG4gICAgcGFsZWdvbGRlbnJvZCAgICAgICAgOiB7cjogMjM4LCBnOiAyMzIsIGI6IDE3MH0sXG4gICAgcGFsZWdyZWVuICAgICAgICAgICAgOiB7cjogMTUyLCBnOiAyNTEsIGI6IDE1Mn0sXG4gICAgcGFsZXR1cnF1b2lzZSAgICAgICAgOiB7cjogMTc1LCBnOiAyMzgsIGI6IDIzOH0sXG4gICAgcGFsZXZpb2xldHJlZCAgICAgICAgOiB7cjogMjE5LCBnOiAxMTIsIGI6IDE0N30sXG4gICAgcGFwYXlhd2hpcCAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyMzksIGI6IDIxM30sXG4gICAgcGVhY2hwdWZmICAgICAgICAgICAgOiB7cjogMjU1LCBnOiAyMTgsIGI6IDE4NX0sXG4gICAgcGVydSAgICAgICAgICAgICAgICAgOiB7cjogMjA1LCBnOiAxMzMsIGI6IDYzfSxcbiAgICBwaW5rICAgICAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDE5MiwgYjogMjAzfSxcbiAgICBwbHVtICAgICAgICAgICAgICAgICA6IHtyOiAyMjEsIGc6IDE2MCwgYjogMjIxfSxcbiAgICBwb3dkZXJibHVlICAgICAgICAgICA6IHtyOiAxNzYsIGc6IDIyNCwgYjogMjMwfSxcbiAgICByb3N5YnJvd24gICAgICAgICAgICA6IHtyOiAxODgsIGc6IDE0MywgYjogMTQzfSxcbiAgICByb3lhbGJsdWUgICAgICAgICAgICA6IHtyOiA2NSwgIGc6IDEwNSwgYjogMjI1fSxcbiAgICBzYWRkbGVicm93biAgICAgICAgICA6IHtyOiAxMzksIGc6IDY5LCAgYjogMTl9LFxuICAgIHNhbG1vbiAgICAgICAgICAgICAgIDoge3I6IDI1MCwgZzogMTI4LCBiOiAxMTR9LFxuICAgIHNhbmR5YnJvd24gICAgICAgICAgIDoge3I6IDI0NCwgZzogMTY0LCBiOiA5Nn0sXG4gICAgc2VhZ3JlZW4gICAgICAgICAgICAgOiB7cjogNDYsICBnOiAxMzksIGI6IDg3fSxcbiAgICBzZWFzaGVsbCAgICAgICAgICAgICA6IHtyOiAyNTUsIGc6IDI0NSwgYjogMjM4fSxcbiAgICBzaWVubmEgICAgICAgICAgICAgICA6IHtyOiAxNjAsIGc6IDgyLCAgYjogNDV9LFxuICAgIHNreWJsdWUgICAgICAgICAgICAgIDoge3I6IDEzNSwgZzogMjA2LCBiOiAyMzV9LFxuICAgIHNsYXRlYmx1ZSAgICAgICAgICAgIDoge3I6IDEwNiwgZzogOTAsICBiOiAyMDV9LFxuICAgIHNsYXRlZ3JheSAgICAgICAgICAgIDoge3I6IDExMiwgZzogMTI4LCBiOiAxNDR9LFxuICAgIHNsYXRlZ3JleSAgICAgICAgICAgIDoge3I6IDExMiwgZzogMTI4LCBiOiAxNDR9LFxuICAgIHNub3cgICAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogMjUwLCBiOiAyNTB9LFxuICAgIHNwcmluZ2dyZWVuICAgICAgICAgIDoge3I6IDAsICAgZzogMjU1LCBiOiAxMjd9LFxuICAgIHN0ZWVsYmx1ZSAgICAgICAgICAgIDoge3I6IDcwLCAgZzogMTMwLCBiOiAxODB9LFxuICAgIHRhbiAgICAgICAgICAgICAgICAgIDoge3I6IDIxMCwgZzogMTgwLCBiOiAxNDB9LFxuICAgIHRoaXN0bGUgICAgICAgICAgICAgIDoge3I6IDIxNiwgZzogMTkxLCBiOiAyMTZ9LFxuICAgIHRvbWF0byAgICAgICAgICAgICAgIDoge3I6IDI1NSwgZzogOTksICBiOiA3MX0sXG4gICAgdHVycXVvaXNlICAgICAgICAgICAgOiB7cjogNjQsICBnOiAyMjQsIGI6IDIwOH0sXG4gICAgdmlvbGV0ICAgICAgICAgICAgICAgOiB7cjogMjM4LCBnOiAxMzAsIGI6IDIzOH0sXG4gICAgd2hlYXQgICAgICAgICAgICAgICAgOiB7cjogMjQ1LCBnOiAyMjIsIGI6IDE3OX0sXG4gICAgd2hpdGVzbW9rZSAgICAgICAgICAgOiB7cjogMjQ1LCBnOiAyNDUsIGI6IDI0NX0sXG4gICAgeWVsbG93Z3JlZW4gICAgICAgICAgOiB7cjogMTU0LCBnOiAyMDUsIGI6IDUwfVxufVxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcGFyc2VyczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBleGFtcGxlOiBbMzU1NDQzMSwgMTY4MDk5ODRdLFxuICAgICAgICAgICAgcmVnZXg6IC9eXFxkKyQvLFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKGNvbG9yKXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAvL2E6IGNvbG9yID4+IDI0ICYgMjU1LFxuICAgICAgICAgICAgICAgICAgICByOiBjb2xvciA+PiAxNiAmIDI1NSxcbiAgICAgICAgICAgICAgICAgICAgZzogY29sb3IgPj4gOCAmIDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYjogY29sb3IgJiAyNTVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV4YW1wbGU6IFsnI2ZiMCcsICdmMGYnXSxcbiAgICAgICAgICAgIHJlZ2V4OiAvXiM/KFtcXGRBLUZdezF9KShbXFxkQS1GXXsxfSkoW1xcZEEtRl17MX0pJC9pLFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKGhleCwgciwgZywgYil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcjogcGFyc2VJbnQociArIHIsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgZzogcGFyc2VJbnQoZyArIGcsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgYjogcGFyc2VJbnQoYiArIGIsIDE2KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAge1xuICAgICAgICAgICAgZXhhbXBsZTogWycjMDBmZjAwJywgJzMzNjY5OSddLFxuICAgICAgICAgICAgcmVnZXg6IC9eIz8oW1xcZEEtRl17Mn0pKFtcXGRBLUZdezJ9KShbXFxkQS1GXXsyfSkkL2ksXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoaGV4LCByLCBnLCBiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByOiBwYXJzZUludChyLCAxNiksXG4gICAgICAgICAgICAgICAgICAgIGc6IHBhcnNlSW50KGcsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgYjogcGFyc2VJbnQoYiwgMTYpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB7XG4gICAgICAgICAgICBleGFtcGxlOiBbJ3JnYigxMjMsIDIzNCwgNDUpJywgJ3JnYigyNSwgNTAlLCAxMDAlKScsICdyZ2JhKDEyJSwgMzQsIDU2JSwgMC43OCknXSxcbiAgICAgICAgICAgIC8vIHJlZ2V4OiAvXnJnYmEqXFwoKFxcZHsxLDN9XFwlKiksXFxzKihcXGR7MSwzfVxcJSopLFxccyooXFxkezEsM31cXCUqKSg/OixcXHMqKFswLTkuXSspKT9cXCkvLFxuICAgICAgICAgICAgcmVnZXg6IC9ecmdiYSpcXCgoWzAtOV0qXFwuP1swLTldK1xcJSopLFxccyooWzAtOV0qXFwuP1swLTldK1xcJSopLFxccyooWzAtOV0qXFwuP1swLTldK1xcJSopKD86LFxccyooWzAtOS5dKykpP1xcKS8sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAocyxyLGcsYixhKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHIgPSByICYmIHIuc2xpY2UoLTEpID09ICclJyA/IChyLnNsaWNlKDAsLTEpIC8gMTAwKSA6IHIqMTtcbiAgICAgICAgICAgICAgICBnID0gZyAmJiBnLnNsaWNlKC0xKSA9PSAnJScgPyAoZy5zbGljZSgwLC0xKSAvIDEwMCkgOiBnKjE7XG4gICAgICAgICAgICAgICAgYiA9IGIgJiYgYi5zbGljZSgtMSkgPT0gJyUnID8gKGIuc2xpY2UoMCwtMSkgLyAxMDApIDogYioxO1xuICAgICAgICAgICAgICAgIGEgPSBhKjE7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByOiB1dGlsLmNsYW1wKHIsIDAsIDI1NSksXG4gICAgICAgICAgICAgICAgICAgIGc6IHV0aWwuY2xhbXAoZywgMCwgMjU1KSxcbiAgICAgICAgICAgICAgICAgICAgYjogdXRpbC5jbGFtcChiLCAwLCAyNTUpLFxuICAgICAgICAgICAgICAgICAgICBhOiB1dGlsLmNsYW1wKGEsIDAsIDEpIHx8IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAge1xuICAgICAgICAgICAgZXhhbXBsZTogWydoc2woMTIzLCAzNCUsIDQ1JSknLCAnaHNsYSgyNSwgNTAlLCAxMDAlLCAwLjc1KScsICdoc3YoMTIsIDM0JSwgNTYlKSddLFxuICAgICAgICAgICAgcmVnZXg6IC9eaHMoW2J2bF0pYSpcXCgoXFxkezEsM31cXCUqKSxcXHMqKFxcZHsxLDN9XFwlKiksXFxzKihcXGR7MSwzfVxcJSopKD86LFxccyooWzAtOS5dKykpP1xcKS8sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoYyxsdixoLHMsbCxhKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGggKj0gMTtcbiAgICAgICAgICAgICAgICBzID0gcy5zbGljZSgwLC0xKSAvIDEwMDtcbiAgICAgICAgICAgICAgICBsID0gbC5zbGljZSgwLC0xKSAvIDEwMDtcbiAgICAgICAgICAgICAgICBhICo9IDE7XG5cbiAgICAgICAgICAgICAgICB2YXIgb2JqID0ge1xuICAgICAgICAgICAgICAgICAgICBoOiB1dGlsLmNsYW1wKGgsIDAsIDM2MCksXG4gICAgICAgICAgICAgICAgICAgIGE6IHV0aWwuY2xhbXAobCwgMCwgMSlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIGBzYCBpcyB1c2VkIGluIG1hbnkgZGlmZmVyZW50IHNwYWNlcyAoSFNMLCBIU1YsIEhTQilcbiAgICAgICAgICAgICAgICAvLyBzbyB3ZSB1c2UgYHNsYCwgYHN2YCBhbmQgYHNiYCB0byBkaWZmZXJlbnRpYXRlXG4gICAgICAgICAgICAgICAgb2JqWydzJytsdl0gPSB1dGlsLmNsYW1wKHMsIDAsIDEpLFxuICAgICAgICAgICAgICAgIG9ialtsdl0gPSB1dGlsLmNsYW1wKGwsIDAsIDEpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIF1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIENocm9tYXRoUHJvdG90eXBlKENocm9tYXRoKSB7XG4gIHJldHVybiB7XG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b05hbWVcbiAgICAgICAgIENhbGwgPENocm9tYXRoLnRvTmFtZT4gb24gdGhlIGN1cnJlbnQgaW5zdGFuY2VcbiAgICAgICAgID4gPiB2YXIgY29sb3IgPSBuZXcgQ2hyb21hdGgoJ3JnYigxNzMsIDIxNiwgMjMwKScpO1xuICAgICAgICAgPiA+IGNvbG9yLnRvTmFtZSgpO1xuICAgICAgICAgPiBcImxpZ2h0Ymx1ZVwiXG4gICAgICAqL1xuICAgICAgdG9OYW1lOiBmdW5jdGlvbiAoKXsgcmV0dXJuIENocm9tYXRoLnRvTmFtZSh0aGlzKTsgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9TdHJpbmdcbiAgICAgICAgIERpc3BsYXkgdGhlIGluc3RhbmNlIGFzIGEgc3RyaW5nLiBEZWZhdWx0cyB0byA8Q2hyb21hdGgudG9IZXhTdHJpbmc+XG4gICAgICAgICA+ID4gdmFyIGNvbG9yID0gQ2hyb21hdGgucmdiKDU2LCA3OCwgOTApO1xuICAgICAgICAgPiA+IENvbG9yLnRvSGV4U3RyaW5nKCk7XG4gICAgICAgICA+IFwiIzM4NEU1QVwiXG4gICAgICAqL1xuICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b0hleFN0cmluZygpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB2YWx1ZU9mXG4gICAgICAgICBEaXNwbGF5IHRoZSBpbnN0YW5jZSBhcyBhbiBpbnRlZ2VyLiBEZWZhdWx0cyB0byA8Q2hyb21hdGgudG9JbnRlZ2VyPlxuICAgICAgICAgPiA+IHZhciB5ZWxsb3cgPSBuZXcgQ2hyb21hdGgoJ3llbGxvdycpO1xuICAgICAgICAgPiA+IHllbGxvdy52YWx1ZU9mKCk7XG4gICAgICAgICA+IDE2Nzc2OTYwXG4gICAgICAgICA+ID4gK3llbGxvd1xuICAgICAgICAgPiAxNjc3Njk2MFxuICAgICAgKi9cbiAgICAgIHZhbHVlT2Y6IGZ1bmN0aW9uICgpeyByZXR1cm4gQ2hyb21hdGgudG9JbnRlZ2VyKHRoaXMpOyB9LFxuXG4gICAgLypcbiAgICAgICBNZXRob2Q6IHJnYlxuICAgICAgIFJldHVybiB0aGUgUkdCIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ3JlZCcpLnJnYigpO1xuICAgICAgID4gWzI1NSwgMCwgMF1cbiAgICAqL1xuICAgICAgcmdiOiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9SR0JBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1JHQkFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIFJHQiBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBDaHJvbWF0aC5idXJseXdvb2QudG9SR0JBcnJheSgpO1xuICAgICAgICAgPiBbMjU1LCAxODQsIDEzNV1cbiAgICAgICovXG4gICAgICB0b1JHQkFycmF5OiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9SR0JBQXJyYXkoKS5zbGljZSgwLDMpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1JHQk9iamVjdFxuICAgICAgICAgUmV0dXJuIHRoZSBSR0Igb2JqZWN0IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnYnVybHl3b29kJykudG9SR0JPYmplY3QoKTtcbiAgICAgICAgID4ge3I6IDI1NSwgZzogMTg0LCBiOiAxMzV9XG4gICAgICAqL1xuICAgICAgdG9SR0JPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIHJnYiA9IHRoaXMudG9SR0JBcnJheSgpO1xuXG4gICAgICAgICAgcmV0dXJuIHtyOiByZ2JbMF0sIGc6IHJnYlsxXSwgYjogcmdiWzJdfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvUkdCU3RyaW5nXG4gICAgICAgICBSZXR1cm4gdGhlIFJHQiBzdHJpbmcgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdhbGljZWJsdWUnKS50b1JHQlN0cmluZygpO1xuICAgICAgICAgPiBcInJnYigyNDAsMjQ4LDI1NSlcIlxuICAgICAgKi9cbiAgICAgIHRvUkdCU3RyaW5nOiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHJldHVybiBcInJnYihcIisgdGhpcy50b1JHQkFycmF5KCkuam9pbihcIixcIikgK1wiKVwiO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogcmdiYVxuICAgICAgICAgUmV0dXJuIHRoZSBSR0JBIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgncmVkJykucmdiYSgpO1xuICAgICAgICAgPiBbMjU1LCAwLCAwLCAxXVxuICAgICAgKi9cbiAgICAgIHJnYmE6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b1JHQkFBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b1JHQkFBcnJheVxuICAgICAgICAgUmV0dXJuIHRoZSBSR0JBIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IENocm9tYXRoLmxpbWUudG9SR0JBQXJyYXkoKTtcbiAgICAgICAgID4gWzAsIDI1NSwgMCwgMV1cbiAgICAgICovXG4gICAgICB0b1JHQkFBcnJheTogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgcmdiYSA9IFtcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZCh0aGlzLnIqMjU1KSxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZCh0aGlzLmcqMjU1KSxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZCh0aGlzLmIqMjU1KSxcbiAgICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLmEpXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHJldHVybiByZ2JhO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9SR0JBT2JqZWN0XG4gICAgICAgICBSZXR1cm4gdGhlIFJHQkEgb2JqZWN0IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IENocm9tYXRoLmNhZGV0Ymx1ZS50b1JHQkFPYmplY3QoKTtcbiAgICAgICAgID4ge3I6IDk1LCBnOiAxNTgsIGI6IDE2MH1cbiAgICAgICovXG4gICAgICB0b1JHQkFPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIHJnYmEgPSB0aGlzLnRvUkdCQUFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4ge3I6IHJnYmFbMF0sIGc6IHJnYmFbMV0sIGI6IHJnYmFbMl0sIGE6IHJnYmFbM119O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9SR0JBU3RyaW5nXG4gICAgICAgICBSZXR1cm4gdGhlIFJHQkEgc3RyaW5nIG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnZGFya2JsdWUnKS50b1JHQkFTdHJpbmcoKTtcbiAgICAgICAgID4gXCJyZ2JhKDAsMCwxMzksMSlcIlxuICAgICAgKi9cbiAgICAgIHRvUkdCQVN0cmluZzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgcmV0dXJuIFwicmdiYShcIisgdGhpcy50b1JHQkFBcnJheSgpLmpvaW4oXCIsXCIpICtcIilcIjtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGhleFxuICAgICAgICAgUmV0dXJuIHRoZSBoZXggYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+IG5ldyBDaHJvbWF0aCgnZGFya2dyZWVuJykuaGV4KClcbiAgICAgICAgIFsgJzAwJywgJzY0JywgJzAwJyBdXG4gICAgICAqL1xuICAgICAgaGV4OiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9IZXhBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICBNZXRob2Q6IHRvSGV4QXJyYXlcbiAgICAgICAgIFJldHVybiB0aGUgaGV4IGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICA+ID4gQ2hyb21hdGguZmlyZWJyaWNrLnRvSGV4QXJyYXkoKTtcbiAgICAgICAgPiBbXCJCMlwiLCBcIjIyXCIsIFwiMjJcIl1cbiAgICAgICovXG4gICAgICB0b0hleEFycmF5OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgucmdiMmhleCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSGV4T2JqZWN0XG4gICAgICAgICBSZXR1cm4gdGhlIGhleCBvYmplY3Qgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGguZ2FpbnNib3JvLnRvSGV4T2JqZWN0KCk7XG4gICAgICAgICA+IHtyOiBcIkRDXCIsIGc6IFwiRENcIiwgYjogXCJEQ1wifVxuICAgICAgKi9cbiAgICAgIHRvSGV4T2JqZWN0OiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHZhciBoZXggPSB0aGlzLnRvSGV4QXJyYXkoKTtcblxuICAgICAgICAgIHJldHVybiB7IHI6IGhleFswXSwgZzogaGV4WzFdLCBiOiBoZXhbMl0gfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgIE1ldGhvZDogdG9IZXhTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgaGV4IHN0cmluZyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgPiA+IENocm9tYXRoLmhvbmV5ZGV3LnRvSGV4U3RyaW5nKCk7XG4gICAgICAgID4gXCIjRjBGRkYwXCJcbiAgICAgICovXG4gICAgICB0b0hleFN0cmluZzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGhleCA9IHRoaXMudG9IZXhBcnJheSgpO1xuXG4gICAgICAgICAgcmV0dXJuICcjJyArIGhleC5qb2luKCcnKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGhzbFxuICAgICAgICAgUmV0dXJuIHRoZSBIU0wgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID5uZXcgQ2hyb21hdGgoJ2dyZWVuJykuaHNsKCk7XG4gICAgICAgICA+IFsxMjAsIDEsIDAuMjUwOTgwMzkyMTU2ODYyNzRdXG4gICAgICAqL1xuICAgICAgaHNsOiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMudG9IU0xBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTTEFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIEhTTCBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ3JlZCcpLnRvSFNMQXJyYXkoKTtcbiAgICAgICAgID4gWzAsIDEsIDAuNV1cbiAgICAgICovXG4gICAgICB0b0hTTEFycmF5OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy50b0hTTEFBcnJheSgpLnNsaWNlKDAsMyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTTE9iamVjdFxuICAgICAgICAgUmV0dXJuIHRoZSBIU0wgb2JqZWN0IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgncmVkJykudG9IU0xPYmplY3QoKTtcbiAgICAgICAgIFtoOjAsIHM6MSwgbDowLjVdXG4gICAgICAqL1xuICAgICAgdG9IU0xPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIGhzbCA9IHRoaXMudG9IU0xBcnJheSgpO1xuXG4gICAgICAgICAgcmV0dXJuIHtoOiBoc2xbMF0sIHM6IGhzbFsxXSwgbDogaHNsWzJdfTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNMU3RyaW5nXG4gICAgICAgICBSZXR1cm4gdGhlIEhTTCBzdHJpbmcgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdyZWQnKS50b0hTTFN0cmluZygpO1xuICAgICAgICAgPiBcImhzbCgwLDEsMC41KVwiXG4gICAgICAqL1xuICAgICAgdG9IU0xTdHJpbmc6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHZhciBoc2xhID0gdGhpcy50b0hTTEFBcnJheSgpO1xuICAgICAgICAgIHZhciB2YWxzID0gW1xuICAgICAgICAgICAgICBoc2xhWzBdLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzbGFbMV0qMTAwKSsnJScsXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHNsYVsyXSoxMDApKyclJ1xuICAgICAgICAgIF07XG5cbiAgICAgICAgICByZXR1cm4gJ2hzbCgnKyB2YWxzICsnKSc7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICBNZXRob2Q6IGhzbGFcbiAgICAgICAgUmV0dXJuIHRoZSBIU0xBIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdncmVlbicpLmhzbGEoKTtcbiAgICAgICAgPiBbMTIwLCAxLCAwLjI1MDk4MDM5MjE1Njg2Mjc0LCAxXVxuICAgICAgKi9cbiAgICAgIGhzbGE6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy50b0hTTEFBcnJheSgpOyB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTTEFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIEhTTEEgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGguYW50aXF1ZXdoaXRlLnRvSFNMQUFycmF5KCk7XG4gICAgICAgICA+IFszNCwgMC43Nzc3Nzc3Nzc3Nzc3NzczLCAwLjkxMTc2NDcwNTg4MjM1MjksIDFdXG4gICAgICAqL1xuICAgICAgdG9IU0xBQXJyYXk6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZCh0aGlzLmgpLFxuICAgICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMuc2wpLFxuICAgICAgICAgICAgICBwYXJzZUZsb2F0KHRoaXMubCksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5hKVxuICAgICAgICAgIF07XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTTEFPYmplY3RcbiAgICAgICAgIFJldHVybiB0aGUgSFNMQSBvYmplY3Qgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gQ2hyb21hdGguYW50aXF1ZXdoaXRlLnRvSFNMQUFycmF5KCk7XG4gICAgICAgICA+IHtoOjM0LCBzOjAuNzc3Nzc3Nzc3Nzc3Nzc3MywgbDowLjkxMTc2NDcwNTg4MjM1MjksIGE6MX1cbiAgICAgICovXG4gICAgICB0b0hTTEFPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIGhzbGEgPSB0aGlzLnRvSFNMQUFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4ge2g6IGhzbGFbMF0sIHM6IGhzbGFbMV0sIGw6IGhzbGFbMl0sIGE6IGhzbGFbM119O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0xBU3RyaW5nXG4gICAgICAgICBSZXR1cm4gdGhlIEhTTEEgc3RyaW5nIG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IENocm9tYXRoLmFudGlxdWV3aGl0ZS50b0hTTEFTdHJpbmcoKTtcbiAgICAgICAgID4gXCJoc2xhKDM0LDAuNzc3Nzc3Nzc3Nzc3Nzc3MywwLjkxMTc2NDcwNTg4MjM1MjksMSlcIlxuICAgICAgKi9cbiAgICAgIHRvSFNMQVN0cmluZzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGhzbGEgPSB0aGlzLnRvSFNMQUFycmF5KCk7XG4gICAgICAgICAgdmFyIHZhbHMgPSBbXG4gICAgICAgICAgICAgIGhzbGFbMF0sXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHNsYVsxXSoxMDApKyclJyxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc2xhWzJdKjEwMCkrJyUnLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzbGFbM10pXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHJldHVybiAnaHNsYSgnKyB2YWxzICsnKSc7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBoc3ZcbiAgICAgICAgIFJldHVybiB0aGUgSFNWIGFycmF5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnYmx1ZScpLmhzdigpO1xuICAgICAgICAgPiBbMjQwLCAxLCAxXVxuICAgICAgKi9cbiAgICAgIGhzdjogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLnRvSFNWQXJyYXkoKTsgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU1ZBcnJheVxuICAgICAgICAgUmV0dXJuIHRoZSBIU1YgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCduYXZham93aGl0ZScpLnRvSFNWQXJyYXkoKTtcbiAgICAgICAgID4gWzM2LCAwLjMyMTU2ODYyNzQ1MDk4MDM2LCAxXVxuICAgICAgKi9cbiAgICAgIHRvSFNWQXJyYXk6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9IU1ZBQXJyYXkoKS5zbGljZSgwLDMpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU1ZPYmplY3RcbiAgICAgICAgIFJldHVybiB0aGUgSFNWIG9iamVjdCBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ25hdmFqb3doaXRlJykudG9IU1ZPYmplY3QoKTtcbiAgICAgICAgID4ge2gzNiwgczowLjMyMTU2ODYyNzQ1MDk4MDM2LCB2OjF9XG4gICAgICAqL1xuICAgICAgdG9IU1ZPYmplY3Q6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgdmFyIGhzdmEgPSB0aGlzLnRvSFNWQUFycmF5KCk7XG5cbiAgICAgICAgICByZXR1cm4ge2g6IGhzdmFbMF0sIHM6IGhzdmFbMV0sIHY6IGhzdmFbMl19O1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU1ZTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgSFNWIHN0cmluZyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ25hdmFqb3doaXRlJykudG9IU1ZTdHJpbmcoKTtcbiAgICAgICAgID4gXCJoc3YoMzYsMzIuMTU2ODYyNzQ1MDk4MDQlLDEwMCUpXCJcbiAgICAgICovXG4gICAgICB0b0hTVlN0cmluZzogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgaHN2ID0gdGhpcy50b0hTVkFycmF5KCk7XG4gICAgICAgICAgdmFyIHZhbHMgPSBbXG4gICAgICAgICAgICAgIGhzdlswXSxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc3ZbMV0qMTAwKSsnJScsXG4gICAgICAgICAgICAgIE1hdGgucm91bmQoaHN2WzJdKjEwMCkrJyUnXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIHJldHVybiAnaHN2KCcrIHZhbHMgKycpJztcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGhzdmFcbiAgICAgICAgIFJldHVybiB0aGUgSFNWQSBhcnJheSBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ2JsdWUnKS5oc3ZhKCk7XG4gICAgICAgICA+IFsyNDAsIDEsIDEsIDFdXG4gICAgICAqL1xuICAgICAgaHN2YTogZnVuY3Rpb24gKCl7IHJldHVybiB0aGlzLnRvSFNWQUFycmF5KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNWQUFycmF5XG4gICAgICAgICBSZXR1cm4gdGhlIEhTVkEgYXJyYXkgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdvbGl2ZScpLnRvSFNWQUFycmF5KCk7XG4gICAgICAgICA+IFs2MCwgMSwgMC41MDE5NjA3ODQzMTM3MjU1LCAxXVxuICAgICAgKi9cbiAgICAgIHRvSFNWQUFycmF5OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICBNYXRoLnJvdW5kKHRoaXMuaCksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy5zdiksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQodGhpcy52KSxcbiAgICAgICAgICAgICAgcGFyc2VGbG9hdCh0aGlzLmEpXG4gICAgICAgICAgXTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNWQU9iamVjdFxuICAgICAgICAgUmV0dXJuIHRoZSBIU1ZBIG9iamVjdCBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29saXZlJykudG9IU1ZBQXJyYXkoKTtcbiAgICAgICAgID4ge2g6NjAsIHM6IDEsIHY6MC41MDE5NjA3ODQzMTM3MjU1LCBhOjF9XG4gICAgICAqL1xuICAgICAgdG9IU1ZBT2JqZWN0OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICB2YXIgaHN2YSA9IHRoaXMudG9IU1ZBQXJyYXkoKTtcblxuICAgICAgICAgIHJldHVybiB7aDogaHN2YVswXSwgczogaHN2YVsxXSwgbDogaHN2YVsyXSwgYTogaHN2YVszXX07XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTVkFTdHJpbmdcbiAgICAgICAgIFJldHVybiB0aGUgSFNWQSBzdHJpbmcgb2YgdGhlIGluc3RhbmNlXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdvbGl2ZScpLnRvSFNWQVN0cmluZygpO1xuICAgICAgICAgPiBcImhzdmEoNjAsMTAwJSw1MC4xOTYwNzg0MzEzNzI1NSUsMSlcIlxuICAgICAgKi9cbiAgICAgIHRvSFNWQVN0cmluZzogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICB2YXIgaHN2YSA9IHRoaXMudG9IU1ZBQXJyYXkoKTtcbiAgICAgICAgICB2YXIgdmFscyA9IFtcbiAgICAgICAgICAgICAgaHN2YVswXSxcbiAgICAgICAgICAgICAgTWF0aC5yb3VuZChoc3ZhWzFdKjEwMCkrJyUnLFxuICAgICAgICAgICAgICBNYXRoLnJvdW5kKGhzdmFbMl0qMTAwKSsnJScsXG4gICAgICAgICAgICAgIGhzdmFbM11cbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmV0dXJuICdoc3ZhKCcrIHZhbHMgKycpJztcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGhzYlxuICAgICAgICAgQWxpYXMgZm9yIDxoc3Y+XG4gICAgICAqL1xuICAgICAgaHNiOiBmdW5jdGlvbiAoKXsgcmV0dXJuIHRoaXMuaHN2KCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNCQXJyYXlcbiAgICAgICAgIEFsaWFzIGZvciA8dG9IU0JBcnJheT5cbiAgICAgICovXG4gICAgICB0b0hTQkFycmF5OiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNWQXJyYXkoKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNCT2JqZWN0XG4gICAgICAgICBBbGlhcyBmb3IgPHRvSFNWT2JqZWN0PlxuICAgICAgKi9cbiAgICAgIHRvSFNCT2JqZWN0OiBmdW5jdGlvbiAoKVxuICAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNWT2JqZWN0KCk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0b0hTQlN0cmluZ1xuICAgICAgICAgQWxpYXMgZm9yIDx0b0hTVlN0cmluZz5cbiAgICAgICovXG4gICAgICB0b0hTQlN0cmluZzogZnVuY3Rpb24gKClcbiAgICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50b0hTVlN0cmluZygpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogaHNiYVxuICAgICAgICAgQWxpYXMgZm9yIDxoc3ZhPlxuICAgICAgKi9cbiAgICAgIGhzYmE6IGZ1bmN0aW9uICgpeyByZXR1cm4gdGhpcy5oc3ZhKCk7IH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHRvSFNCQUFycmF5XG4gICAgICAgICBBbGlhcyBmb3IgPHRvSFNWQUFycmF5PlxuICAgICAgKi9cbiAgICAgIHRvSFNCQUFycmF5OiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gdGhpcy50b0hTVkFBcnJheSgpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0JBT2JqZWN0XG4gICAgICAgICBBbGlhcyBmb3IgPHRvSFNWQU9iamVjdD5cbiAgICAgICovXG4gICAgICB0b0hTQkFPYmplY3Q6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvSFNWQU9iamVjdCgpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG9IU0JBU3RyaW5nXG4gICAgICAgICBBbGlhcyBmb3IgPHRvSFNWQVN0cmluZz5cbiAgICAgICovXG4gICAgICB0b0hTQkFTdHJpbmc6IGZ1bmN0aW9uICgpXG4gICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9IU1ZBU3RyaW5nKCk7XG4gICAgICB9LFxuXG4gICAgICAvL0dyb3VwOiBJbnN0YW5jZSBtZXRob2RzIC0gY29sb3Igc2NoZW1lXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBjb21wbGVtZW50XG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguY29tcGxlbWVudD4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5yZWQuY29tcGxlbWVudCgpLnJnYigpO1xuICAgICAgICAgPiBbMCwgMjU1LCAyNTVdXG4gICAgICAqL1xuICAgICAgY29tcGxlbWVudDogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmNvbXBsZW1lbnQodGhpcyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0cmlhZFxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnRyaWFkPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnaHNsKDAsIDEwMCUsIDUwJSknKS50cmlhZCgpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiI0ZGMDAwMCwjMDBGRjAwLCMwMDAwRkZcIlxuICAgICAgKi9cbiAgICAgIHRyaWFkOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgudHJpYWQodGhpcyk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiB0ZXRyYWRcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC50ZXRyYWQ+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gQ2hyb21hdGguaHNiKDI0MCwgMSwgMSkudHJpYWQoKTtcbiAgICAgICAgID4gW0Nocm9tYXRoLCBDaHJvbWF0aCwgQ2hyb21hdGhdXG4gICAgICAqL1xuICAgICAgdGV0cmFkOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgudGV0cmFkKHRoaXMpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogYW5hbG9nb3VzXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguYW5hbG9nb3VzPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IENocm9tYXRoLmhzYigxMjAsIDEsIDEpLmFuYWxvZ291cygpO1xuICAgICAgICAgPiBbQ2hyb21hdGgsIENocm9tYXRoLCBDaHJvbWF0aCwgQ2hyb21hdGgsIENocm9tYXRoLCBDaHJvbWF0aCwgQ2hyb21hdGgsIENocm9tYXRoXVxuXG4gICAgICAgICA+ID4gQ2hyb21hdGguaHNiKDE4MCwgMSwgMSkuYW5hbG9nb3VzKDUpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiIzAwRkZGRiwjMDBGRkIyLCMwMEZGRTUsIzAwRTVGRiwjMDBCMkZGXCJcblxuICAgICAgICAgPiA+IENocm9tYXRoLmhzYigxODAsIDEsIDEpLmFuYWxvZ291cyg1LCAxMCkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjMDBGRkZGLCMwMEZGMTksIzAwRkZCMiwjMDBCMkZGLCMwMDE5RkZcIlxuICAgICAgKi9cbiAgICAgIGFuYWxvZ291czogZnVuY3Rpb24gKHJlc3VsdHMsIHNsaWNlcyl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmFuYWxvZ291cyh0aGlzLCByZXN1bHRzLCBzbGljZXMpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgTWV0aG9kOiBtb25vY2hyb21hdGljXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGgubW9ub2Nocm9tYXRpYz4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgPiA+IENocm9tYXRoLmJsdWUubW9ub2Nocm9tYXRpYygpLnRvU3RyaW5nKCk7XG4gICAgICAgID4gXCIjMDAwMDMzLCMwMDAwNjYsIzAwMDA5OSwjMDAwMENDLCMwMDAwRkZcIlxuICAgICAgKi9cbiAgICAgIG1vbm9jaHJvbWF0aWM6IGZ1bmN0aW9uIChyZXN1bHRzKXtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGgubW9ub2Nocm9tYXRpYyh0aGlzLCByZXN1bHRzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHNwbGl0Y29tcGxlbWVudFxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnNwbGl0Y29tcGxlbWVudD4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5ibHVlLnNwbGl0Y29tcGxlbWVudCgpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiIzAwMDBGRiwjRkZDQzAwLCNGRjUxMDBcIlxuICAgICAgKi9cbiAgICAgIHNwbGl0Y29tcGxlbWVudDogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLnNwbGl0Y29tcGxlbWVudCh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIEdyb3VwOiBJbnN0YW5jZSBtZXRob2RzIC0gY29sb3IgYWx0ZXJhdGlvblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdGludFxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnRpbnQ+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCd5ZWxsb3cnKS50aW50KDAuMjUpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiI0ZGRkYzRlwiXG4gICAgICAqL1xuICAgICAgdGludDogZnVuY3Rpb24gKGJ5KSB7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLnRpbnQodGhpcywgYnkpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogbGlnaHRlblxuICAgICAgICAgQWxpYXMgZm9yIDx0aW50PlxuICAgICAgKi9cbiAgICAgIGxpZ2h0ZW46IGZ1bmN0aW9uIChieSkge1xuICAgICAgICByZXR1cm4gdGhpcy50aW50KGJ5KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgIE1ldGhvZDogc2hhZGVcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5zaGFkZT4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgneWVsbG93Jykuc2hhZGUoMC4yNSkudG9TdHJpbmcoKTtcbiAgICAgICAgPiBcIiNCRkJGMDBcIlxuICAgICAgKi9cbiAgICAgIHNoYWRlOiBmdW5jdGlvbiAoYnkpIHtcbiAgICAgICAgICByZXR1cm4gQ2hyb21hdGguc2hhZGUodGhpcywgYnkpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogZGFya2VuXG4gICAgICAgICBBbGlhcyBmb3IgPHNoYWRlPlxuICAgICAgKi9cbiAgICAgIGRhcmtlbjogZnVuY3Rpb24gKGJ5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYWRlKGJ5KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGRlc2F0dXJhdGVcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5kZXNhdHVyYXRlPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29yYW5nZScpLmRlc2F0dXJhdGUoKS50b1N0cmluZygpO1xuICAgICAgID4gXCIjQURBREFEXCJcblxuICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJ29yYW5nZScpLmRlc2F0dXJhdGUoMSkudG9TdHJpbmcoKTtcbiAgICAgICA+IFwiIzVCNUI1QlwiXG5cbiAgICAgICA+ID4gbmV3IENocm9tYXRoKCdvcmFuZ2UnKS5kZXNhdHVyYXRlKDIpLnRvU3RyaW5nKCk7XG4gICAgICAgPiBcIiNCNEI0QjRcIlxuICAgICAgICovXG4gICAgICBkZXNhdHVyYXRlOiBmdW5jdGlvbiAoZm9ybXVsYSl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmRlc2F0dXJhdGUodGhpcywgZm9ybXVsYSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICBNZXRob2Q6IGdyZXlzY2FsZVxuICAgICAgICBBbGlhcyBmb3IgPGRlc2F0dXJhdGU+XG4gICAgICAqL1xuICAgICAgZ3JleXNjYWxlOiBmdW5jdGlvbiAoZm9ybXVsYSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNhdHVyYXRlKGZvcm11bGEpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogd2Vic2FmZVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLndlYnNhZmU+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gQ2hyb21hdGgucmdiKDEyMywgMjM0LCA1NikudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjN0JFQTM4XCJcblxuICAgICAgICAgPiBDaHJvbWF0aC5yZ2IoMTIzLCAyMzQsIDU2KS53ZWJzYWZlKCkudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjNjZGRjMzXCJcbiAgICAgICAqL1xuICAgICAgd2Vic2FmZTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLndlYnNhZmUodGhpcyk7XG4gICAgICB9LFxuXG4gICAgICAvLyBHcm91cDogSW5zdGFuY2UgbWV0aG9kcyAtIGNvbG9yIGNvbWJpbmF0aW9uXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBhZGRpdGl2ZVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLmFkZGl0aXZlPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgncmVkJykuYWRkaXRpdmUoJyMwMEZGMDAnLCAnYmx1ZScpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiI0ZGRkZGRlwiXG4gICAgICAqL1xuICAgICAgYWRkaXRpdmU6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHZhciBhcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5hZGRpdGl2ZS5hcHBseShDaHJvbWF0aCwgW3RoaXNdLmNvbmNhdChhcnIpKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IHN1YnRyYWN0aXZlXG4gICAgICAgICBDYWxscyA8Q2hyb21hdGguc3VidHJhY3RpdmU+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCdjeWFuJykuc3VidHJhY3RpdmUoJ21hZ2VudGEnLCAneWVsbG93JykudG9TdHJpbmcoKTtcbiAgICAgICAgID4gXCIjMDAwMDAwXCJcbiAgICAgICovXG4gICAgICBzdWJ0cmFjdGl2ZTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgdmFyIGFyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLnN1YnRyYWN0aXZlLmFwcGx5KENocm9tYXRoLCBbdGhpc10uY29uY2F0KGFycikpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogbXVsdGlwbHlcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5tdWx0aXBseT4gd2l0aCB0aGUgY3VycmVudCBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyXG5cbiAgICAgICAgID4gPiBDaHJvbWF0aC5saWdodGN5YW4ubXVsdGlwbHkoQ2hyb21hdGguYnJvd24pLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiIzkwMkEyQVwiXG4gICAgICAqL1xuICAgICAgbXVsdGlwbHk6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHZhciBhcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5tdWx0aXBseS5hcHBseShDaHJvbWF0aCwgW3RoaXNdLmNvbmNhdChhcnIpKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qXG4gICAgICAgICBNZXRob2Q6IGF2ZXJhZ2VcbiAgICAgICAgIENhbGxzIDxDaHJvbWF0aC5hdmVyYWdlPiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IENocm9tYXRoLmJsYWNrLmF2ZXJhZ2UoJ3doaXRlJykucmdiKCk7XG4gICAgICAgICA+IFsxMjcsIDEyNywgMTI3XVxuICAgICAgKi9cbiAgICAgIGF2ZXJhZ2U6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgIHZhciBhcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC5hdmVyYWdlLmFwcGx5KENocm9tYXRoLCBbdGhpc10uY29uY2F0KGFycikpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogb3ZlcmxheVxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLm92ZXJsYXk+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgPiA+IENocm9tYXRoLnJlZC5vdmVybGF5KCdncmVlbicsIDAuNCkudG9TdHJpbmcoKTtcbiAgICAgICA+IFwiIzk5MzMwMFwiXG5cbiAgICAgICA+ID4gQ2hyb21hdGgucmVkLm92ZXJsYXkoJ2dyZWVuJywgMSkudG9TdHJpbmcoKTtcbiAgICAgICA+IFwiIzAwODAwMFwiXG5cbiAgICAgICA+ID4gQ2hyb21hdGgucmVkLm92ZXJsYXkoJ2dyZWVuJywgMCkudG9TdHJpbmcoKTtcbiAgICAgICA+IFwiI0ZGMDAwMFwiXG4gICAgICAgKi9cbiAgICAgIG92ZXJsYXk6IGZ1bmN0aW9uIChib3R0b20sIHRyYW5zcGFyZW5jeSl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLm92ZXJsYXkodGhpcywgYm90dG9tLCB0cmFuc3BhcmVuY3kpO1xuICAgICAgfSxcblxuICAgICAgLy8gR3JvdXA6IEluc3RhbmNlIG1ldGhvZHMgLSBvdGhlclxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogY2xvbmVcbiAgICAgICAgIFJldHVybiBhbiBpbmRlcGVuZGVudCBjb3B5IG9mIHRoZSBpbnN0YW5jZVxuICAgICAgKi9cbiAgICAgIGNsb25lOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICByZXR1cm4gbmV3IENocm9tYXRoKHRoaXMpO1xuICAgICAgfSxcblxuICAgICAgLypcbiAgICAgICAgIE1ldGhvZDogdG93YXJkc1xuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLnRvd2FyZHM+IHdpdGggdGhlIGN1cnJlbnQgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuXG4gICAgICAgICA+ID4gdmFyIHJlZCA9IG5ldyBDaHJvbWF0aCgncmVkJyk7XG4gICAgICAgICA+ID4gcmVkLnRvd2FyZHMoJ3llbGxvdycsIDAuNTUpLnRvU3RyaW5nKCk7XG4gICAgICAgICA+IFwiI0ZGOEMwMFwiXG4gICAgICAqL1xuICAgICAgdG93YXJkczogZnVuY3Rpb24gKHRvLCBieSkge1xuICAgICAgICAgIHJldHVybiBDaHJvbWF0aC50b3dhcmRzKHRoaXMsIHRvLCBieSk7XG4gICAgICB9LFxuXG4gICAgICAvKlxuICAgICAgICAgTWV0aG9kOiBncmFkaWVudFxuICAgICAgICAgQ2FsbHMgPENocm9tYXRoLmdyYWRpZW50PiB3aXRoIHRoZSBjdXJyZW50IGluc3RhbmNlIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcblxuICAgICAgICAgPiA+IG5ldyBDaHJvbWF0aCgnI0YwMCcpLmdyYWRpZW50KCcjMDBGJykudG9TdHJpbmcoKVxuICAgICAgICAgPiBcIiNGRjAwMDAsI0YxMDAwRCwjRTQwMDFBLCNENjAwMjgsI0M5MDAzNSwjQkIwMDQzLCNBRTAwNTAsI0ExMDA1RCwjOTMwMDZCLCM4NjAwNzgsIzc4MDA4NiwjNkIwMDkzLCM1RDAwQTEsIzUwMDBBRSwjNDMwMEJCLCMzNTAwQzksIzI4MDBENiwjMUEwMEU0LCMwRDAwRjEsIzAwMDBGRlwiXG5cbiAgICAgICAgID4gPiBuZXcgQ2hyb21hdGgoJyNGMDAnKS5ncmFkaWVudCgnIzAwRicsIDUpLnRvU3RyaW5nKClcbiAgICAgICAgID4gXCIjRkYwMDAwLCNCRjAwM0YsIzdGMDA3RiwjM0YwMEJGLCMwMDAwRkZcIlxuXG4gICAgICAgICA+ID4gbmV3IENocm9tYXRoKCcjRjAwJykuZ3JhZGllbnQoJyMwMEYnLCA1LCAzKS50b1N0cmluZygpXG4gICAgICAgICA+IFwiIzNGMDBCRlwiXG4gICAgICAqL1xuICAgICAgZ3JhZGllbnQ6IGZ1bmN0aW9uICh0bywgc2xpY2VzLCBzbGljZSl7XG4gICAgICAgICAgcmV0dXJuIENocm9tYXRoLmdyYWRpZW50KHRoaXMsIHRvLCBzbGljZXMsIHNsaWNlKTtcbiAgICAgIH1cbiAgfTtcbn07XG4iLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmNsYW1wID0gZnVuY3Rpb24gKCB2YWwsIG1pbiwgbWF4ICkge1xuICAgIGlmICh2YWwgPiBtYXgpIHJldHVybiBtYXg7XG4gICAgaWYgKHZhbCA8IG1pbikgcmV0dXJuIG1pbjtcbiAgICByZXR1cm4gdmFsO1xufTtcblxudXRpbC5tZXJnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVzdCA9IGFyZ3VtZW50c1swXSwgaT0xLCBzb3VyY2UsIHByb3A7XG4gICAgd2hpbGUgKHNvdXJjZSA9IGFyZ3VtZW50c1tpKytdKVxuICAgICAgICBmb3IgKHByb3AgaW4gc291cmNlKSBkZXN0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuXG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuXG51dGlsLmlzQXJyYXkgPSBmdW5jdGlvbiAoIHRlc3QgKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0ZXN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnV0aWwuaXNTdHJpbmcgPSBmdW5jdGlvbiAoIHRlc3QgKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0ZXN0KSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG59O1xuXG51dGlsLmlzTnVtYmVyID0gZnVuY3Rpb24gKCB0ZXN0ICkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGVzdCkgPT09ICdbb2JqZWN0IE51bWJlcl0nO1xufTtcblxudXRpbC5pc09iamVjdCA9IGZ1bmN0aW9uICggdGVzdCApIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRlc3QpID09PSAnW29iamVjdCBPYmplY3RdJztcbn07XG5cbnV0aWwubHBhZCA9IGZ1bmN0aW9uICggdmFsLCBsZW4sIHBhZCApIHtcbiAgICB2YWwgPSB2YWwudG9TdHJpbmcoKTtcbiAgICBpZiAoIWxlbikgbGVuID0gMjtcbiAgICBpZiAoIXBhZCkgcGFkID0gJzAnO1xuXG4gICAgd2hpbGUgKHZhbC5sZW5ndGggPCBsZW4pIHZhbCA9IHBhZCt2YWw7XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxudXRpbC5sZXJwID0gZnVuY3Rpb24gKGZyb20sIHRvLCBieSkge1xuICAgIHJldHVybiBmcm9tICsgKHRvLWZyb20pICogYnk7XG59O1xuXG51dGlsLnRpbWVzID0gZnVuY3Rpb24gKG4sIGZuLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHJlc3VsdHMgPSBbXTsgaSA8IG47IGkrKykge1xuICAgICAgICByZXN1bHRzW2ldID0gZm4uY2FsbChjb250ZXh0LCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG51dGlsLnJnYiA9IHtcbiAgICBmcm9tQXJnczogZnVuY3Rpb24gKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgdmFyIHJnYiA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBpZiAodXRpbC5pc0FycmF5KHJnYikpeyByPXJnYlswXTsgZz1yZ2JbMV07IGI9cmdiWzJdOyBhPXJnYlszXTsgfVxuICAgICAgICBpZiAodXRpbC5pc09iamVjdChyZ2IpKXsgcj1yZ2IucjsgZz1yZ2IuZzsgYj1yZ2IuYjsgYT1yZ2IuYTsgIH1cblxuICAgICAgICByZXR1cm4gW3IsIGcsIGIsIGFdO1xuICAgIH0sXG4gICAgc2NhbGVkMDE6IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgICAgIGlmICghaXNGaW5pdGUoYXJndW1lbnRzWzFdKSl7XG4gICAgICAgICAgICB2YXIgcmdiID0gdXRpbC5yZ2IuZnJvbUFyZ3MociwgZywgYik7XG4gICAgICAgICAgICByID0gcmdiWzBdLCBnID0gcmdiWzFdLCBiID0gcmdiWzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHIgPiAxKSByIC89IDI1NTtcbiAgICAgICAgaWYgKGcgPiAxKSBnIC89IDI1NTtcbiAgICAgICAgaWYgKGIgPiAxKSBiIC89IDI1NTtcblxuICAgICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH0sXG4gICAgcGN0V2l0aFN5bWJvbDogZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgdmFyIHJnYiA9IHRoaXMuc2NhbGVkMDEociwgZywgYik7XG5cbiAgICAgICAgcmV0dXJuIHJnYi5tYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHYgKiAyNTUpICsgJyUnO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG51dGlsLmhzbCA9IHtcbiAgICBmcm9tQXJnczogZnVuY3Rpb24gKGgsIHMsIGwsIGEpIHtcbiAgICAgICAgdmFyIGhzbCA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBpZiAodXRpbC5pc0FycmF5KGhzbCkpeyBoPWhzbFswXTsgcz1oc2xbMV07IGw9aHNsWzJdOyBhPWhzbFszXTsgfVxuICAgICAgICBpZiAodXRpbC5pc09iamVjdChoc2wpKXsgaD1oc2wuaDsgcz1oc2wuczsgbD0oaHNsLmwgfHwgaHNsLnYpOyBhPWhzbC5hOyB9XG5cbiAgICAgICAgcmV0dXJuIFtoLCBzLCBsLCBhXTtcbiAgICB9LFxuICAgIHNjYWxlZDogZnVuY3Rpb24gKGgsIHMsIGwpIHtcbiAgICAgICAgaWYgKCFpc0Zpbml0ZShhcmd1bWVudHNbMV0pKXtcbiAgICAgICAgICAgIHZhciBoc2wgPSB1dGlsLmhzbC5mcm9tQXJncyhoLCBzLCBsKTtcbiAgICAgICAgICAgIGggPSBoc2xbMF0sIHMgPSBoc2xbMV0sIGwgPSBoc2xbMl07XG4gICAgICAgIH1cblxuICAgICAgICBoID0gKCgoaCAlIDM2MCkgKyAzNjApICUgMzYwKTtcbiAgICAgICAgaWYgKHMgPiAxKSBzIC89IDEwMDtcbiAgICAgICAgaWYgKGwgPiAxKSBsIC89IDEwMDtcblxuICAgICAgICByZXR1cm4gW2gsIHMsIGxdO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiIsIihmdW5jdGlvbihhLGIpe2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sYik7ZWxzZSBpZihcInVuZGVmaW5lZFwiIT10eXBlb2YgZXhwb3J0cyliKCk7ZWxzZXtiKCksYS5GaWxlU2F2ZXI9e2V4cG9ydHM6e319LmV4cG9ydHN9fSkodGhpcyxmdW5jdGlvbigpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGIoYSxiKXtyZXR1cm5cInVuZGVmaW5lZFwiPT10eXBlb2YgYj9iPXthdXRvQm9tOiExfTpcIm9iamVjdFwiIT10eXBlb2YgYiYmKGNvbnNvbGUud2FybihcIkRlcHJpY2F0ZWQ6IEV4cGVjdGVkIHRoaXJkIGFyZ3VtZW50IHRvIGJlIGEgb2JqZWN0XCIpLGI9e2F1dG9Cb206IWJ9KSxiLmF1dG9Cb20mJi9eXFxzKig/OnRleHRcXC9cXFMqfGFwcGxpY2F0aW9uXFwveG1sfFxcUypcXC9cXFMqXFwreG1sKVxccyo7LipjaGFyc2V0XFxzKj1cXHMqdXRmLTgvaS50ZXN0KGEudHlwZSk/bmV3IEJsb2IoW1wiXFx1RkVGRlwiLGFdLHt0eXBlOmEudHlwZX0pOmF9ZnVuY3Rpb24gYyhiLGMsZCl7dmFyIGU9bmV3IFhNTEh0dHBSZXF1ZXN0O2Uub3BlbihcIkdFVFwiLGIpLGUucmVzcG9uc2VUeXBlPVwiYmxvYlwiLGUub25sb2FkPWZ1bmN0aW9uKCl7YShlLnJlc3BvbnNlLGMsZCl9LGUub25lcnJvcj1mdW5jdGlvbigpe2NvbnNvbGUuZXJyb3IoXCJjb3VsZCBub3QgZG93bmxvYWQgZmlsZVwiKX0sZS5zZW5kKCl9ZnVuY3Rpb24gZChhKXt2YXIgYj1uZXcgWE1MSHR0cFJlcXVlc3Q7cmV0dXJuIGIub3BlbihcIkhFQURcIixhLCExKSxiLnNlbmQoKSwyMDA8PWIuc3RhdHVzJiYyOTk+PWIuc3RhdHVzfWZ1bmN0aW9uIGUoYSl7dHJ5e2EuZGlzcGF0Y2hFdmVudChuZXcgTW91c2VFdmVudChcImNsaWNrXCIpKX1jYXRjaChjKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO2IuaW5pdE1vdXNlRXZlbnQoXCJjbGlja1wiLCEwLCEwLHdpbmRvdywwLDAsMCw4MCwyMCwhMSwhMSwhMSwhMSwwLG51bGwpLGEuZGlzcGF0Y2hFdmVudChiKX19dmFyIGY9XCJvYmplY3RcIj09dHlwZW9mIHdpbmRvdyYmd2luZG93LndpbmRvdz09PXdpbmRvdz93aW5kb3c6XCJvYmplY3RcIj09dHlwZW9mIHNlbGYmJnNlbGYuc2VsZj09PXNlbGY/c2VsZjpcIm9iamVjdFwiPT10eXBlb2YgZ2xvYmFsJiZnbG9iYWwuZ2xvYmFsPT09Z2xvYmFsP2dsb2JhbDp2b2lkIDAsYT1mLnNhdmVBc3x8XCJvYmplY3RcIiE9dHlwZW9mIHdpbmRvd3x8d2luZG93IT09Zj9mdW5jdGlvbigpe306XCJkb3dubG9hZFwiaW4gSFRNTEFuY2hvckVsZW1lbnQucHJvdG90eXBlP2Z1bmN0aW9uKGIsZyxoKXt2YXIgaT1mLlVSTHx8Zi53ZWJraXRVUkwsaj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtnPWd8fGIubmFtZXx8XCJkb3dubG9hZFwiLGouZG93bmxvYWQ9ZyxqLnJlbD1cIm5vb3BlbmVyXCIsXCJzdHJpbmdcIj09dHlwZW9mIGI/KGouaHJlZj1iLGoub3JpZ2luPT09bG9jYXRpb24ub3JpZ2luP2Uoaik6ZChqLmhyZWYpP2MoYixnLGgpOmUoaixqLnRhcmdldD1cIl9ibGFua1wiKSk6KGouaHJlZj1pLmNyZWF0ZU9iamVjdFVSTChiKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7aS5yZXZva2VPYmplY3RVUkwoai5ocmVmKX0sNEU0KSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ZShqKX0sMCkpfTpcIm1zU2F2ZU9yT3BlbkJsb2JcImluIG5hdmlnYXRvcj9mdW5jdGlvbihmLGcsaCl7aWYoZz1nfHxmLm5hbWV8fFwiZG93bmxvYWRcIixcInN0cmluZ1wiIT10eXBlb2YgZiluYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihiKGYsaCksZyk7ZWxzZSBpZihkKGYpKWMoZixnLGgpO2Vsc2V7dmFyIGk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7aS5ocmVmPWYsaS50YXJnZXQ9XCJfYmxhbmtcIixzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ZShpKX0pfX06ZnVuY3Rpb24oYSxiLGQsZSl7aWYoZT1lfHxvcGVuKFwiXCIsXCJfYmxhbmtcIiksZSYmKGUuZG9jdW1lbnQudGl0bGU9ZS5kb2N1bWVudC5ib2R5LmlubmVyVGV4dD1cImRvd25sb2FkaW5nLi4uXCIpLFwic3RyaW5nXCI9PXR5cGVvZiBhKXJldHVybiBjKGEsYixkKTt2YXIgZz1cImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiPT09YS50eXBlLGg9L2NvbnN0cnVjdG9yL2kudGVzdChmLkhUTUxFbGVtZW50KXx8Zi5zYWZhcmksaT0vQ3JpT1NcXC9bXFxkXSsvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7aWYoKGl8fGcmJmgpJiZcIm9iamVjdFwiPT10eXBlb2YgRmlsZVJlYWRlcil7dmFyIGo9bmV3IEZpbGVSZWFkZXI7ai5vbmxvYWRlbmQ9ZnVuY3Rpb24oKXt2YXIgYT1qLnJlc3VsdDthPWk/YTphLnJlcGxhY2UoL15kYXRhOlteO10qOy8sXCJkYXRhOmF0dGFjaG1lbnQvZmlsZTtcIiksZT9lLmxvY2F0aW9uLmhyZWY9YTpsb2NhdGlvbj1hLGU9bnVsbH0sai5yZWFkQXNEYXRhVVJMKGEpfWVsc2V7dmFyIGs9Zi5VUkx8fGYud2Via2l0VVJMLGw9ay5jcmVhdGVPYmplY3RVUkwoYSk7ZT9lLmxvY2F0aW9uPWw6bG9jYXRpb24uaHJlZj1sLGU9bnVsbCxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ay5yZXZva2VPYmplY3RVUkwobCl9LDRFNCl9fTtmLnNhdmVBcz1hLnNhdmVBcz1hLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUmJihtb2R1bGUuZXhwb3J0cz1hKX0pO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1GaWxlU2F2ZXIubWluLmpzLm1hcCIsIi8qXG4gKiAgYmFzZTY0LmpzXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZS5cbiAqICAgIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqXG4gKiAgUmVmZXJlbmNlczpcbiAqICAgIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0XG4gKi9cbjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShnbG9iYWwpXG4gICAgICAgIDogdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kXG4gICAgICAgID8gZGVmaW5lKGZhY3RvcnkpIDogZmFjdG9yeShnbG9iYWwpXG59KChcbiAgICB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmXG4gICAgICAgIDogdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3dcbiAgICAgICAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFxuOiB0aGlzXG4pLCBmdW5jdGlvbihnbG9iYWwpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gZXhpc3RpbmcgdmVyc2lvbiBmb3Igbm9Db25mbGljdCgpXG4gICAgZ2xvYmFsID0gZ2xvYmFsIHx8IHt9O1xuICAgIHZhciBfQmFzZTY0ID0gZ2xvYmFsLkJhc2U2NDtcbiAgICB2YXIgdmVyc2lvbiA9IFwiMi41LjFcIjtcbiAgICAvLyBpZiBub2RlLmpzIGFuZCBOT1QgUmVhY3QgTmF0aXZlLCB3ZSB1c2UgQnVmZmVyXG4gICAgdmFyIGJ1ZmZlcjtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJ1ZmZlciA9IGV2YWwoXCJyZXF1aXJlKCdidWZmZXInKS5CdWZmZXJcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgYnVmZmVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnN0YW50c1xuICAgIHZhciBiNjRjaGFyc1xuICAgICAgICA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcbiAgICB2YXIgYjY0dGFiID0gZnVuY3Rpb24oYmluKSB7XG4gICAgICAgIHZhciB0ID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYmluLmxlbmd0aDsgaSA8IGw7IGkrKykgdFtiaW4uY2hhckF0KGkpXSA9IGk7XG4gICAgICAgIHJldHVybiB0O1xuICAgIH0oYjY0Y2hhcnMpO1xuICAgIHZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuICAgIC8vIGVuY29kZXIgc3R1ZmZcbiAgICB2YXIgY2JfdXRvYiA9IGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgaWYgKGMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgdmFyIGNjID0gYy5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgcmV0dXJuIGNjIDwgMHg4MCA/IGNcbiAgICAgICAgICAgICAgICA6IGNjIDwgMHg4MDAgPyAoZnJvbUNoYXJDb2RlKDB4YzAgfCAoY2MgPj4+IDYpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKGNjICYgMHgzZikpKVxuICAgICAgICAgICAgICAgIDogKGZyb21DaGFyQ29kZSgweGUwIHwgKChjYyA+Pj4gMTIpICYgMHgwZikpXG4gICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICgoY2MgPj4+ICA2KSAmIDB4M2YpKVxuICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoIGNjICAgICAgICAgJiAweDNmKSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGNjID0gMHgxMDAwMFxuICAgICAgICAgICAgICAgICsgKGMuY2hhckNvZGVBdCgwKSAtIDB4RDgwMCkgKiAweDQwMFxuICAgICAgICAgICAgICAgICsgKGMuY2hhckNvZGVBdCgxKSAtIDB4REMwMCk7XG4gICAgICAgICAgICByZXR1cm4gKGZyb21DaGFyQ29kZSgweGYwIHwgKChjYyA+Pj4gMTgpICYgMHgwNykpXG4gICAgICAgICAgICAgICAgICAgICsgZnJvbUNoYXJDb2RlKDB4ODAgfCAoKGNjID4+PiAxMikgJiAweDNmKSlcbiAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoMHg4MCB8ICgoY2MgPj4+ICA2KSAmIDB4M2YpKVxuICAgICAgICAgICAgICAgICAgICArIGZyb21DaGFyQ29kZSgweDgwIHwgKCBjYyAgICAgICAgICYgMHgzZikpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHJlX3V0b2IgPSAvW1xcdUQ4MDAtXFx1REJGRl1bXFx1REMwMC1cXHVERkZGRl18W15cXHgwMC1cXHg3Rl0vZztcbiAgICB2YXIgdXRvYiA9IGZ1bmN0aW9uKHUpIHtcbiAgICAgICAgcmV0dXJuIHUucmVwbGFjZShyZV91dG9iLCBjYl91dG9iKTtcbiAgICB9O1xuICAgIHZhciBjYl9lbmNvZGUgPSBmdW5jdGlvbihjY2MpIHtcbiAgICAgICAgdmFyIHBhZGxlbiA9IFswLCAyLCAxXVtjY2MubGVuZ3RoICUgM10sXG4gICAgICAgIG9yZCA9IGNjYy5jaGFyQ29kZUF0KDApIDw8IDE2XG4gICAgICAgICAgICB8ICgoY2NjLmxlbmd0aCA+IDEgPyBjY2MuY2hhckNvZGVBdCgxKSA6IDApIDw8IDgpXG4gICAgICAgICAgICB8ICgoY2NjLmxlbmd0aCA+IDIgPyBjY2MuY2hhckNvZGVBdCgyKSA6IDApKSxcbiAgICAgICAgY2hhcnMgPSBbXG4gICAgICAgICAgICBiNjRjaGFycy5jaGFyQXQoIG9yZCA+Pj4gMTgpLFxuICAgICAgICAgICAgYjY0Y2hhcnMuY2hhckF0KChvcmQgPj4+IDEyKSAmIDYzKSxcbiAgICAgICAgICAgIHBhZGxlbiA+PSAyID8gJz0nIDogYjY0Y2hhcnMuY2hhckF0KChvcmQgPj4+IDYpICYgNjMpLFxuICAgICAgICAgICAgcGFkbGVuID49IDEgPyAnPScgOiBiNjRjaGFycy5jaGFyQXQob3JkICYgNjMpXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbiAgICB9O1xuICAgIHZhciBidG9hID0gZ2xvYmFsLmJ0b2EgPyBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuYnRvYShiKTtcbiAgICB9IDogZnVuY3Rpb24oYikge1xuICAgICAgICByZXR1cm4gYi5yZXBsYWNlKC9bXFxzXFxTXXsxLDN9L2csIGNiX2VuY29kZSk7XG4gICAgfTtcbiAgICB2YXIgX2VuY29kZSA9IGJ1ZmZlciA/XG4gICAgICAgIGJ1ZmZlci5mcm9tICYmIFVpbnQ4QXJyYXkgJiYgYnVmZmVyLmZyb20gIT09IFVpbnQ4QXJyYXkuZnJvbVxuICAgICAgICA/IGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gKHUuY29uc3RydWN0b3IgPT09IGJ1ZmZlci5jb25zdHJ1Y3RvciA/IHUgOiBidWZmZXIuZnJvbSh1KSlcbiAgICAgICAgICAgICAgICAudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICAgIH1cbiAgICAgICAgOiAgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAodS5jb25zdHJ1Y3RvciA9PT0gYnVmZmVyLmNvbnN0cnVjdG9yID8gdSA6IG5ldyAgYnVmZmVyKHUpKVxuICAgICAgICAgICAgICAgIC50b1N0cmluZygnYmFzZTY0JylcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uICh1KSB7IHJldHVybiBidG9hKHV0b2IodSkpIH1cbiAgICA7XG4gICAgdmFyIGVuY29kZSA9IGZ1bmN0aW9uKHUsIHVyaXNhZmUpIHtcbiAgICAgICAgcmV0dXJuICF1cmlzYWZlXG4gICAgICAgICAgICA/IF9lbmNvZGUoU3RyaW5nKHUpKVxuICAgICAgICAgICAgOiBfZW5jb2RlKFN0cmluZyh1KSkucmVwbGFjZSgvWytcXC9dL2csIGZ1bmN0aW9uKG0wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG0wID09ICcrJyA/ICctJyA6ICdfJztcbiAgICAgICAgICAgIH0pLnJlcGxhY2UoLz0vZywgJycpO1xuICAgIH07XG4gICAgdmFyIGVuY29kZVVSSSA9IGZ1bmN0aW9uKHUpIHsgcmV0dXJuIGVuY29kZSh1LCB0cnVlKSB9O1xuICAgIC8vIGRlY29kZXIgc3R1ZmZcbiAgICB2YXIgcmVfYnRvdSA9IG5ldyBSZWdFeHAoW1xuICAgICAgICAnW1xceEMwLVxceERGXVtcXHg4MC1cXHhCRl0nLFxuICAgICAgICAnW1xceEUwLVxceEVGXVtcXHg4MC1cXHhCRl17Mn0nLFxuICAgICAgICAnW1xceEYwLVxceEY3XVtcXHg4MC1cXHhCRl17M30nXG4gICAgXS5qb2luKCd8JyksICdnJyk7XG4gICAgdmFyIGNiX2J0b3UgPSBmdW5jdGlvbihjY2NjKSB7XG4gICAgICAgIHN3aXRjaChjY2NjLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICB2YXIgY3AgPSAoKDB4MDcgJiBjY2NjLmNoYXJDb2RlQXQoMCkpIDw8IDE4KVxuICAgICAgICAgICAgICAgIHwgICAgKCgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDEpKSA8PCAxMilcbiAgICAgICAgICAgICAgICB8ICAgICgoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgyKSkgPDwgIDYpXG4gICAgICAgICAgICAgICAgfCAgICAgKDB4M2YgJiBjY2NjLmNoYXJDb2RlQXQoMykpLFxuICAgICAgICAgICAgb2Zmc2V0ID0gY3AgLSAweDEwMDAwO1xuICAgICAgICAgICAgcmV0dXJuIChmcm9tQ2hhckNvZGUoKG9mZnNldCAgPj4+IDEwKSArIDB4RDgwMClcbiAgICAgICAgICAgICAgICAgICAgKyBmcm9tQ2hhckNvZGUoKG9mZnNldCAmIDB4M0ZGKSArIDB4REMwMCkpO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gZnJvbUNoYXJDb2RlKFxuICAgICAgICAgICAgICAgICgoMHgwZiAmIGNjY2MuY2hhckNvZGVBdCgwKSkgPDwgMTIpXG4gICAgICAgICAgICAgICAgICAgIHwgKCgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDEpKSA8PCA2KVxuICAgICAgICAgICAgICAgICAgICB8ICAoMHgzZiAmIGNjY2MuY2hhckNvZGVBdCgyKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gIGZyb21DaGFyQ29kZShcbiAgICAgICAgICAgICAgICAoKDB4MWYgJiBjY2NjLmNoYXJDb2RlQXQoMCkpIDw8IDYpXG4gICAgICAgICAgICAgICAgICAgIHwgICgweDNmICYgY2NjYy5jaGFyQ29kZUF0KDEpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGJ0b3UgPSBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBiLnJlcGxhY2UocmVfYnRvdSwgY2JfYnRvdSk7XG4gICAgfTtcbiAgICB2YXIgY2JfZGVjb2RlID0gZnVuY3Rpb24oY2NjYykge1xuICAgICAgICB2YXIgbGVuID0gY2NjYy5sZW5ndGgsXG4gICAgICAgIHBhZGxlbiA9IGxlbiAlIDQsXG4gICAgICAgIG4gPSAobGVuID4gMCA/IGI2NHRhYltjY2NjLmNoYXJBdCgwKV0gPDwgMTggOiAwKVxuICAgICAgICAgICAgfCAobGVuID4gMSA/IGI2NHRhYltjY2NjLmNoYXJBdCgxKV0gPDwgMTIgOiAwKVxuICAgICAgICAgICAgfCAobGVuID4gMiA/IGI2NHRhYltjY2NjLmNoYXJBdCgyKV0gPDwgIDYgOiAwKVxuICAgICAgICAgICAgfCAobGVuID4gMyA/IGI2NHRhYltjY2NjLmNoYXJBdCgzKV0gICAgICAgOiAwKSxcbiAgICAgICAgY2hhcnMgPSBbXG4gICAgICAgICAgICBmcm9tQ2hhckNvZGUoIG4gPj4+IDE2KSxcbiAgICAgICAgICAgIGZyb21DaGFyQ29kZSgobiA+Pj4gIDgpICYgMHhmZiksXG4gICAgICAgICAgICBmcm9tQ2hhckNvZGUoIG4gICAgICAgICAmIDB4ZmYpXG4gICAgICAgIF07XG4gICAgICAgIGNoYXJzLmxlbmd0aCAtPSBbMCwgMCwgMiwgMV1bcGFkbGVuXTtcbiAgICAgICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xuICAgIH07XG4gICAgdmFyIF9hdG9iID0gZ2xvYmFsLmF0b2IgPyBmdW5jdGlvbihhKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuYXRvYihhKTtcbiAgICB9IDogZnVuY3Rpb24oYSl7XG4gICAgICAgIHJldHVybiBhLnJlcGxhY2UoL1xcU3sxLDR9L2csIGNiX2RlY29kZSk7XG4gICAgfTtcbiAgICB2YXIgYXRvYiA9IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgcmV0dXJuIF9hdG9iKFN0cmluZyhhKS5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgJycpKTtcbiAgICB9O1xuICAgIHZhciBfZGVjb2RlID0gYnVmZmVyID9cbiAgICAgICAgYnVmZmVyLmZyb20gJiYgVWludDhBcnJheSAmJiBidWZmZXIuZnJvbSAhPT0gVWludDhBcnJheS5mcm9tXG4gICAgICAgID8gZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgcmV0dXJuIChhLmNvbnN0cnVjdG9yID09PSBidWZmZXIuY29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICAgICAgPyBhIDogYnVmZmVyLmZyb20oYSwgJ2Jhc2U2NCcpKS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgcmV0dXJuIChhLmNvbnN0cnVjdG9yID09PSBidWZmZXIuY29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICAgICAgPyBhIDogbmV3IGJ1ZmZlcihhLCAnYmFzZTY0JykpLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbihhKSB7IHJldHVybiBidG91KF9hdG9iKGEpKSB9O1xuICAgIHZhciBkZWNvZGUgPSBmdW5jdGlvbihhKXtcbiAgICAgICAgcmV0dXJuIF9kZWNvZGUoXG4gICAgICAgICAgICBTdHJpbmcoYSkucmVwbGFjZSgvWy1fXS9nLCBmdW5jdGlvbihtMCkgeyByZXR1cm4gbTAgPT0gJy0nID8gJysnIDogJy8nIH0pXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJylcbiAgICAgICAgKTtcbiAgICB9O1xuICAgIHZhciBub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBCYXNlNjQgPSBnbG9iYWwuQmFzZTY0O1xuICAgICAgICBnbG9iYWwuQmFzZTY0ID0gX0Jhc2U2NDtcbiAgICAgICAgcmV0dXJuIEJhc2U2NDtcbiAgICB9O1xuICAgIC8vIGV4cG9ydCBCYXNlNjRcbiAgICBnbG9iYWwuQmFzZTY0ID0ge1xuICAgICAgICBWRVJTSU9OOiB2ZXJzaW9uLFxuICAgICAgICBhdG9iOiBhdG9iLFxuICAgICAgICBidG9hOiBidG9hLFxuICAgICAgICBmcm9tQmFzZTY0OiBkZWNvZGUsXG4gICAgICAgIHRvQmFzZTY0OiBlbmNvZGUsXG4gICAgICAgIHV0b2I6IHV0b2IsXG4gICAgICAgIGVuY29kZTogZW5jb2RlLFxuICAgICAgICBlbmNvZGVVUkk6IGVuY29kZVVSSSxcbiAgICAgICAgYnRvdTogYnRvdSxcbiAgICAgICAgZGVjb2RlOiBkZWNvZGUsXG4gICAgICAgIG5vQ29uZmxpY3Q6IG5vQ29uZmxpY3QsXG4gICAgICAgIF9fYnVmZmVyX186IGJ1ZmZlclxuICAgIH07XG4gICAgLy8gaWYgRVM1IGlzIGF2YWlsYWJsZSwgbWFrZSBCYXNlNjQuZXh0ZW5kU3RyaW5nKCkgYXZhaWxhYmxlXG4gICAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIG5vRW51bSA9IGZ1bmN0aW9uKHYpe1xuICAgICAgICAgICAgcmV0dXJuIHt2YWx1ZTp2LGVudW1lcmFibGU6ZmFsc2Usd3JpdGFibGU6dHJ1ZSxjb25maWd1cmFibGU6dHJ1ZX07XG4gICAgICAgIH07XG4gICAgICAgIGdsb2JhbC5CYXNlNjQuZXh0ZW5kU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIFN0cmluZy5wcm90b3R5cGUsICdmcm9tQmFzZTY0Jywgbm9FbnVtKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29kZSh0aGlzKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgICAgICAgICAgICBTdHJpbmcucHJvdG90eXBlLCAndG9CYXNlNjQnLCBub0VudW0oZnVuY3Rpb24gKHVyaXNhZmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZSh0aGlzLCB1cmlzYWZlKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgICAgICAgICAgICBTdHJpbmcucHJvdG90eXBlLCAndG9CYXNlNjRVUkknLCBub0VudW0oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jb2RlKHRoaXMsIHRydWUpXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvL1xuICAgIC8vIGV4cG9ydCBCYXNlNjQgdG8gdGhlIG5hbWVzcGFjZVxuICAgIC8vXG4gICAgaWYgKGdsb2JhbFsnTWV0ZW9yJ10pIHsgLy8gTWV0ZW9yLmpzXG4gICAgICAgIEJhc2U2NCA9IGdsb2JhbC5CYXNlNjQ7XG4gICAgfVxuICAgIC8vIG1vZHVsZS5leHBvcnRzIGFuZCBBTUQgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS5cbiAgICAvLyBtb2R1bGUuZXhwb3J0cyBoYXMgcHJlY2VkZW5jZS5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuQmFzZTY0ID0gZ2xvYmFsLkJhc2U2NDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpeyByZXR1cm4gZ2xvYmFsLkJhc2U2NCB9KTtcbiAgICB9XG4gICAgLy8gdGhhdCdzIGl0IVxuICAgIHJldHVybiB7QmFzZTY0OiBnbG9iYWwuQmFzZTY0fVxufSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vQ3JhZnQgb2JqZWN0LnByb3R5cGVcbihmdW5jdGlvbigpe1xuXHRpZiggdHlwZW9mKE9iamVjdC5hZGRDb25zdFByb3ApID09IFwiZnVuY3Rpb25cIil7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gY29uc3RQcm9wKG5hbWVfcHJvcCwgdmFsdWUsIHZpcyl7XG5cdFx0aWYodmlzID09PSB1bmRlZmluZWQpIHZpcyA9IHRydWU7XG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSBPYmplY3QuZnJlZXplKHZhbHVlKTtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZV9wcm9wLCB7XG5cdFx0XHRcdHZhbHVlOiB2YWx1ZSxcblx0XHRcdFx0ZW51bWVyYWJsZTogdmlzXG5cdFx0XHR9KTtcblx0fVxuXHRmdW5jdGlvbiBnZXRTZXQobmFtZSwgZ2V0dGVyLCBzZXR0ZXIpe1xuXHRcdGlmKHR5cGVvZiBzZXR0ZXIgPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRzZXQ6IHNldHRlcixcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9ZWxzZXtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG5cdFx0XHRcdGdldDogZ2V0dGVyLFxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRcblx0Y29uc3RQcm9wLmNhbGwoT2JqZWN0LnByb3RvdHlwZSwgJ2FkZENvbnN0UHJvcCcsIGNvbnN0UHJvcCwgZmFsc2UpO1xuXHRPYmplY3QucHJvdG90eXBlLmFkZENvbnN0UHJvcCgnYWRkR2V0U2V0JywgZ2V0U2V0LCBmYWxzZSk7XG5cdFxuXHRcblx0aWYodHlwZW9mKE9iamVjdC5wcm90b3R5cGUudG9Tb3VyY2UpICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAndG9Tb3VyY2UnLHtcblx0XHRcdHZhbHVlOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBzdHIgPSAneyc7XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gdGhpcyl7XG5cdFx0XHRcdFx0XHRzdHIgKz0gJyAnICsga2V5ICsgJzogJyArIHRoaXNba2V5XSArICcsJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoc3RyLmxlbmd0aCA+IDIpIHN0ciA9IHN0ci5zbGljZSgwLCAtMSkgKyAnICc7XG5cdFx0XHRcdFx0cmV0dXJuIHN0ciArICd9Jztcblx0XHRcdFx0fSxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlXG5cdFx0fSk7XG5cdH1cblx0XG5cdFxuXHRpZih0eXBlb2YoT2JqZWN0LnZhbHVlcykgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0dmFyIHZhbF9PYmogPSBmdW5jdGlvbihvYmope1xuXHRcdFx0dmFyIHZhbHMgPSBbXTtcblx0XHRcdFxuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0XHR2YWxzLnB1c2gob2JqW2tleV0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gdmFscztcblx0XHR9O1xuXHRcdFxuXHRcdCBPYmplY3QuYWRkQ29uc3RQcm9wKCd2YWx1ZXMnLCB2YWxfT2JqLmJpbmQoT2JqZWN0KSk7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJhbmRJbmRleCgpe1xuXHRcdHZhciByYW5kID0gTWF0aC5yb3VuZCgodGhpcy5sZW5ndGggLSAxKSAqIE1hdGgucmFuZG9tKCkpO1xuXHRcdHJldHVybiB0aGlzW3JhbmRdO1xuXHR9XG5cdEFycmF5LnByb3RvdHlwZS5hZGRDb25zdFByb3AoJ3JhbmRfaScsIHJhbmRJbmRleCk7XG5cdFxuXHRcblx0ZnVuY3Rpb24gY3JlYXRlQXJyKHZhbCwgbGVuZ3RoLCBpc19jYWxsKXtcblx0XHR2YXIgYXJyID0gW107XG5cdFx0XG5cdFx0aWYoIWxlbmd0aCkgbGVuZ3RoID0gMTtcblx0XHRpZihpc19jYWxsID09PSB1bmRlZmluZWQpIGlzX2NhbGwgPSB0cnVlO1xuXHRcdFxuXHRcdGlmKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJyAmJiBpc19jYWxsKXtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyl7XG5cdFx0XHRcdGFyci5wdXNoKHZhbChpLCBhcnIpKTtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdFxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKXtcblx0XHRcdFx0YXJyLnB1c2godmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGFycjtcblx0fVxuXHRcblx0QXJyYXkucHJvdG90eXBlLmFkZENvbnN0UHJvcCgnYWRkJywgZnVuY3Rpb24odmFsKXtcblx0XHRpZighdGhpcy5fbnVsbHMpIHRoaXMuX251bGxzID0gW107XG5cdFx0XG5cdFx0aWYodGhpcy5fbnVsbHMubGVuZ3RoKXtcblx0XHRcdHZhciBpbmQgPSB0aGlzLl9udWxscy5wb3AoKTtcblx0XHRcdHRoaXNbaW5kXSA9IHZhbDtcblx0XHRcdHJldHVybiBpbmQ7XG5cdFx0fWVsc2V7XG5cdFx0XHRyZXR1cm4gdGhpcy5wdXNoKHZhbCkgLSAxO1xuXHRcdH1cblx0fSk7XG5cdFxuXHRBcnJheS5wcm90b3R5cGUuYWRkQ29uc3RQcm9wKCdkZWxsJywgZnVuY3Rpb24oaW5kKXtcblx0XHRpZihpbmQgPiB0aGlzLmxlbmd0aCAtMSkgcmV0dXJuIGZhbHNlO1xuXHRcdFxuXHRcdGlmKGluZCA9PSB0aGlzLmxlbmd0aCAtMSl7XG5cdFx0XHR0aGlzLnBvcCgpO1xuXHRcdH1lbHNle1xuXHRcdFx0aWYoIXRoaXMuX251bGxzKSB0aGlzLl9udWxscyA9IFtdO1xuXHRcdFx0XG5cdFx0XHR0aGlzW2luZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHR0aGlzLl9udWxscy5wdXNoKGluZCk7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiB0cnVlO1x0XG5cdH0pO1xuXHRcblx0QXJyYXkuYWRkQ29uc3RQcm9wKCdjcmVhdGUnLCBjcmVhdGVBcnIpO1xuXHRcblx0XG5cdGlmKFJlZ0V4cC5wcm90b3R5cGUudG9KU09OICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFJlZ0V4cC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuc291cmNlOyB9O1xuXHR9XG5cbn0pKCk7XG5cblxuXG5cbiIsIi8vQ3JhZiBTdHJpbmdcbihmdW5jdGlvbigpe1xuXHRpZih0eXBlb2YoT2JqZWN0LnR5cGVzKSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuXG5cdHZhciBUID0gT2JqZWN0LnR5cGVzO1xuXHR2YXIgRG9jID0gVC5kb2M7XG5cblx0ZnVuY3Rpb24gcmVwbGFjZVNwZWNDaGFyKGMpe1xuXHRcdHN3aXRjaChjKXtcblx0XHRcdGNhc2UgJ3cnOiByZXR1cm4gJ2EtekEtWjAtOV8nO1xuXHRcdFx0Y2FzZSAnZCc6IHJldHVybiAnMC05Jztcblx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ1xcXFx0XFxcXG5cXFxcdlxcXFxmXFxcXHIgJztcblxuXHRcdFx0ZGVmYXVsdDogcmV0dXJuIGM7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZ2VJbkFycihiZWcsIGVuZCl7XG5cdFx0aWYoYmVnID4gZW5kKXtcblx0XHRcdHZhciB0bXAgPSBiZWc7XG5cdFx0XHRiZWcgPSBlbmQ7XG5cdFx0XHRlbmQgPSB0bXA7XG5cdFx0fVxuXG5cdFx0dmFyIGFyciA9IFtdO1xuXHRcdGZvcih2YXIgaSA9IGJlZzsgaSA8PSBlbmQ7IGkrKyl7XG5cdFx0XHRhcnIucHVzaChpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VSYW5nZShwYXJzZV9zdHIpe1xuXHRcdGlmKC9cXFxcLi8udGVzdChwYXJzZV9zdHIpKXtcblx0XHRcdFx0cGFyc2Vfc3RyID0gcGFyc2Vfc3RyLnJlcGxhY2UoL1xcXFwoLikvZywgZnVuY3Rpb24oc3RyLCBjaGFyKXsgcmV0dXJuIHJlcGxhY2VTcGVjQ2hhcihjaGFyKTt9KTtcblx0XHR9XG5cblx0XHR2YXIgcmVzdWx0ID0gW107XG5cblx0XHR2YXIgYmVnX2NoYXIgPSBwYXJzZV9zdHJbMF07XG5cdFx0Zm9yKHZhciBpID0gMTsgaSA8PSBwYXJzZV9zdHIubGVuZ3RoOyBpKyspe1xuXG5cdFx0XHRpZihwYXJzZV9zdHJbaS0xXSAhPT0gJ1xcXFwnXG5cdFx0XHRcdCYmcGFyc2Vfc3RyW2ldID09PSAnLSdcblx0XHRcdFx0JiZwYXJzZV9zdHJbaSsxXSl7XG5cdFx0XHRcdGkrKztcblx0XHRcdFx0dmFyIGVuZF9jaGFyID0gcGFyc2Vfc3RyW2ldO1xuXG5cdFx0XHRcdHZhciBhcnJfY2hhcnMgPSByYW5nZUluQXJyKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCksIGVuZF9jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0XHRyZXN1bHQgPSByZXN1bHQuY29uY2F0KGFycl9jaGFycyk7XG5cblx0XHRcdFx0aSsrO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKGJlZ19jaGFyLmNoYXJDb2RlQXQoMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRiZWdfY2hhciA9IHBhcnNlX3N0cltpXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRDaGFycyhjaGFyc19hcnIsIHNpemUpe1xuXHRcdHNpemUgPSBULmludChzaXplLCAxKS5yYW5kKCk7XG5cdFx0dmFyIHN0ciA9ICcnO1xuXHRcdHdoaWxlKHNpemUpe1xuXHRcdFx0dmFyIGRlciA9IGNoYXJzX2Fyci5yYW5kX2koKTtcblx0XHRcdHN0ciArPVN0cmluZy5mcm9tQ2hhckNvZGUoZGVyKTtcblx0XHRcdHNpemUtLTtcblx0XHR9XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRTdHIocmFuZ2UsIHNpemUpe1xuXG5cdFx0dmFyIHBhcnNlX3JhbmdlID0gKHJhbmdlLnNvdXJjZSkubWF0Y2goL1xcXlxcWygoXFxcXFxcXXwuKSopXFxdXFwqXFwkLyk7XG5cblx0XHRpZighcGFyc2VfcmFuZ2UpIHRocm93IFQuZXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IHJhbmdlKFJlZ0V4cCgvXltcXHddLiQvKSksIHNpemUoMDw9bnVtYmVyKScpO1xuXG5cdFx0dmFyIGNoYXJzID0gcGFyc2VSYW5nZShwYXJzZV9yYW5nZVsxXSk7XG5cblx0XHRyZXR1cm4gcmFuZENoYXJzLmJpbmQobnVsbCwgY2hhcnMsIHNpemUpO1xuXG5cblx0fVxuXG5cdGZ1bmN0aW9uIHRlc3RTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBmdW5jdGlvbihzdHIpe1xuXHRcdFx0aWYodHlwZW9mKHN0cikgIT09ICdzdHJpbmcnKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBzdHJpbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHN0ci5sZW5ndGggPiBzaXplKXtcblx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdGVyci5wYXJhbXMgPSBcIkxlbmd0aCBzdHJpbmcgaXMgd3JvbmchXCI7XG5cdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFyYW5nZS50ZXN0KHN0cikpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkb2NTdHIocmFuZ2UsIHNpemUpe1xuXHRcdHJldHVybiBULmRvYy5nZW4uYmluZChudWxsLCBcInN0clwiLCB7IHJhbmdlOiByYW5nZSwgbGVuZ3RoOiBzaXplfSk7XG5cdH1cblxuXG5cdHZhciBkZWZfc2l6ZSA9IDE3O1xuXHR2YXIgZGVmX3JhbmdlID0gL15bXFx3XSokLztcblxuXHRmdW5jdGlvbiBuZXdTdHIocmFuZ2UsIHNpemUpe1xuXHRcdGlmKHJhbmdlID09PSBudWxsKSByYW5nZSA9IGRlZl9yYW5nZTtcblx0XHRpZihzaXplID09PSB1bmRlZmluZWQpIHNpemUgPSBkZWZfc2l6ZTtcblxuXHRcdGlmKHR5cGVvZiByYW5nZSA9PSBcInN0cmluZ1wiKSByYW5nZSA9IG5ldyBSZWdFeHAocmFuZ2UpO1xuXG5cblx0XHRpZihULnBvcy50ZXN0KHNpemUpIHx8ICEocmFuZ2UgaW5zdGFuY2VvZiBSZWdFeHApKXtcblx0XHRcdFx0dGhyb3cgVC5lcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogcmFuZ2UoUmVnRXhwKSwgc2l6ZSgwPD1udW1iZXIpJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJhbmQ6IHJhbmRTdHIocmFuZ2UsIHNpemUpLFxuXHRcdFx0dGVzdDogdGVzdFN0cihyYW5nZSwgc2l6ZSksXG5cdFx0XHRkb2M6IGRvY1N0cihyYW5nZSwgc2l6ZSlcblx0XHR9O1xuXHR9XG5cblxuXG5cdFQubmV3VHlwZSgnc3RyJyxcblx0e1xuXHRcdG5hbWU6IFwiU3RyaW5nXCIsXG5cdFx0YXJnOiBbXCJyYW5nZVwiLCBcImxlbmd0aFwiXSxcblx0XHRwYXJhbXM6IHtcblx0XHRcdFx0cmFuZ2U6IHt0eXBlOiAnUmVnRXhwIHx8IHN0cicsIGRlZmF1bHRfdmFsdWU6IGRlZl9yYW5nZX0sXG5cdFx0XHRcdGxlbmd0aDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiBkZWZfc2l6ZX1cblx0XHR9XG5cdH0sXG5cdHtcblx0XHROZXc6IG5ld1N0cixcblx0XHR0ZXN0OiB0ZXN0U3RyKGRlZl9yYW5nZSwgZGVmX3NpemUpLFxuXHRcdHJhbmQ6IHJhbmRTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSksXG5cdFx0ZG9jOiBkb2NTdHIoZGVmX3JhbmdlLCBkZWZfc2l6ZSlcblx0fSk7XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubmV3IChmdW5jdGlvbigpe1xuXHRpZih0eXBlb2YoT2JqZWN0LmFkZENvbnN0UHJvcCkgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0aWYodHlwZW9mIG1vZHVsZSA9PSBcIm9iamVjdFwiKXtcblx0XHRcdHJlcXVpcmUoXCIuL21vZi5qc1wiKTtcblx0XHR9ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCLQotGA0LXQsdGD0LXRgtGM0YHRjyDQsdC40LHQu9C40L7RgtC10LrQsCBtb2YuanNcIik7XG5cdH1cblxuXHRpZih0eXBlb2YoT2JqZWN0LnR5cGVzKSA9PSBcIm9iamVjdFwiKXtcblx0XHRyZXR1cm4gT2JqZWN0LnR5cGVzO1xuXHR9XG5cblx0dmFyIFQgPSB0aGlzO1xuXHR2YXIgRG9jID0ge1xuXHRcdHR5cGVzOntcblx0XHRcdCdib29sJzp7XG5cdFx0XHRcdG5hbWU6IFwiQm9vbGVhblwiLFxuXHRcdFx0XHRhcmc6IFtdXG5cdFx0XHR9LFxuXHRcdFx0J2NvbnN0Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkNvbnN0YW50XCIsXG5cdFx0XHRcdGFyZzogW1widmFsdWVcIl0sXG5cdFx0XHRcdHBhcmFtczogeyB2YWx1ZToge3R5cGU6IFwiU29tZXRoaW5nXCIsIGRlZmF1bHRfdmFsdWU6IG51bGx9fVxuXHRcdFx0fSxcblx0XHRcdCdwb3MnOiB7XG5cdFx0XHRcdG5hbWU6IFwiUG9zaXRpb25cIixcblx0XHRcdFx0YXJnOiBbJ21heCddLFxuXHRcdFx0XHRwYXJhbXM6IHttYXg6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogKzIxNDc0ODM2NDd9fVxuXG5cdFx0XHR9LFxuXG5cdFx0XHQnaW50Jzoge1xuXHRcdFx0XHRuYW1lOiBcIkludGVnZXJcIixcblx0XHRcdFx0YXJnOiBbXCJtYXhcIiwgXCJtaW5cIiwgXCJzdGVwXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdpbnQnLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnaW50JywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0c3RlcDoge3R5cGU6ICdwb3MnLCBkZWZhdWx0X3ZhbHVlOiAxfVxuXHRcdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdCdudW0nOiB7XG5cdFx0XHRcdG5hbWU6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdGFyZzogW1wibWF4XCIsIFwibWluXCIsIFwicHJlY2lzXCJdLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRcdG1heDoge3R5cGU6ICdudW0nLCBkZWZhdWx0X3ZhbHVlOiArMjE0NzQ4MzY0N30sXG5cdFx0XHRcdFx0XHRtaW46IHt0eXBlOiAnbnVtJywgZGVmYXVsdF92YWx1ZTogLTIxNDc0ODM2NDh9LFxuXHRcdFx0XHRcdFx0cHJlY2lzOiB7dHlwZTogJ3BvcycsIGRlZmF1bHRfdmFsdWU6IDl9XG5cdFx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdhcnInOiB7XG5cdFx0XHRcdG5hbWU6IFwiQXJyYXlcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiLCBcInNpemVcIiwgXCJmaXhlZFwiXSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0XHR0eXBlczoge3R5cGU6IFwiVHlwZSB8fCBbVHlwZSwgVHlwZS4uLl1cIiwgZ2V0IGRlZmF1bHRfdmFsdWUoKXtyZXR1cm4gVC5wb3N9fSxcblx0XHRcdFx0XHRcdHNpemU6IHt0eXBlOiAncG9zJywgZGVmYXVsdF92YWx1ZTogN30sXG5cdFx0XHRcdFx0XHRmaXhlZDoge3R5cGU6ICdib29sJywgZGVmYXVsdF92YWx1ZTogdHJ1ZX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J2FueSc6IHtcblx0XHRcdFx0bmFtZTogXCJNaXhUeXBlXCIsXG5cdFx0XHRcdGFyZzogW1widHlwZXNcIl0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdFx0dHlwZXM6IHt0eXBlOiBcIlR5cGUsIFR5cGUuLi4gfHwgW1R5cGUsIFR5cGUuLi5dXCIsIGdldCBkZWZhdWx0X3ZhbHVlKCl7cmV0dXJuIFtULnBvcywgVC5zdHJdfX1cblx0XHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J29iaic6IHtcblx0XHRcdFx0bmFtZTogXCJPYmplY3RcIixcblx0XHRcdFx0YXJnOiBbXCJ0eXBlc1wiXSxcblx0XHRcdFx0cGFyYW1zOiB7dHlwZXM6IHt0eXBlOiBcIk9iamVjdFwiLCBkZWZhdWx0X3ZhbHVlOiB7fX19XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRnZXRDb25zdDogZnVuY3Rpb24obmFtZV90eXBlLCBuYW1lX2xpbWl0KXtcblx0XHRcdHJldHVybiB0aGlzLnR5cGVzW25hbWVfdHlwZV0ucGFyYW1zW25hbWVfbGltaXRdLmRlZmF1bHRfdmFsdWU7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmRvYyA9IHt9O1xuXHR0aGlzLmRvYy5qc29uID0gSlNPTi5zdHJpbmdpZnkoRG9jLCBcIlwiLCAyKTtcblxuXHREb2MuZ2VuRG9jID0gKGZ1bmN0aW9uKG5hbWUsIHBhcmFtcyl7cmV0dXJuIHtuYW1lOiB0aGlzLnR5cGVzW25hbWVdLm5hbWUsIHBhcmFtczogcGFyYW1zfX0pLmJpbmQoRG9jKTtcblx0dGhpcy5kb2MuZ2VuID0gRG9jLmdlbkRvYztcblxuXG5cblxuXHQvL0Vycm9zXG5cdGZ1bmN0aW9uIGFyZ1R5cGVFcnJvcih3cm9uZ19hcmcsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IHR5cGUgaXMgd3JvbmchIEFyZ3VtZW50cygnICsgZm9yQXJnKHdyb25nX2FyZykgKyAnKTsnICsgbWVzcyk7XG5cdFx0RVIud3JvbmdfYXJnID0gd3JvbmdfYXJnO1xuXG5cdFx0aWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShFUiwgYXJnVHlwZUVycm9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gRVI7XG5cblx0XHRmdW5jdGlvbiBmb3JBcmcoYXJncyl7XG5cdFx0XHR2YXIgc3RyX2FyZ3MgPSAnJztcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0c3RyX2FyZ3MgKz0gdHlwZW9mKGFyZ3NbaV0pICsgJzogJyArIGFyZ3NbaV0gKyAnOyAnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHN0cl9hcmdzO1xuXHRcdH1cblx0fVxuXHRULmVycm9yID0gYXJnVHlwZUVycm9yO1xuXG5cdGZ1bmN0aW9uIHR5cGVTeW50YXhFcnJvcih3cm9uZ19zdHIsIG1lc3Mpe1xuXHRcdGlmKG1lc3MgPT09IHVuZGVmaW5lZCkgbWVzcyA9ICcnO1xuXHRcdHZhciBFUiA9IG5ldyBTeW50YXhFcnJvcignTGluZTogJyArIHdyb25nX3N0ciArICc7ICcgKyBtZXNzKTtcblx0XHRFUi53cm9uZ19hcmcgPSB3cm9uZ19zdHI7XG5cblx0XHRpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0XHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKEVSLCB0eXBlU3ludGF4RXJyb3IpO1xuXHRcdH1cblxuXHRcdHJldHVybiBFUjtcblx0fVxuXG5cblxuXHRmdW5jdGlvbiBDcmVhdGVDcmVhdG9yKE5ldywgdGVzdCwgcmFuZCwgZG9jKXtcblx0XHR2YXIgY3JlYXRvcjtcblx0XHRpZih0eXBlb2YgTmV3ID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0Y3JlYXRvciA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB0bXBfb2JqID0gTmV3LmFwcGx5KHt9LCBhcmd1bWVudHMpO1xuXHRcdFx0XHR2YXIgbmV3X2NyZWF0b3IgPSBuZXcgQ3JlYXRlQ3JlYXRvcihOZXcpO1xuXHRcdFx0XHRmb3IodmFyIGtleSBpbiB0bXBfb2JqKXtcblx0XHRcdFx0XHRuZXdfY3JlYXRvci5hZGRDb25zdFByb3Aoa2V5LCB0bXBfb2JqW2tleV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBuZXdfY3JlYXRvcjtcblx0XHRcdH07XG5cdFx0fWVsc2UgY3JlYXRvciA9IGZ1bmN0aW9uKCl7cmV0dXJuIGNyZWF0b3J9O1xuXG5cdFx0Y3JlYXRvci5hZGRDb25zdFByb3AoJ2lzX2NyZWF0b3InLCB0cnVlKTtcblx0XHRpZih0eXBlb2YgdGVzdCA9PT0gXCJmdW5jdGlvblwiKSBjcmVhdG9yLmFkZENvbnN0UHJvcCgndGVzdCcsIHRlc3QpO1xuXHRcdGlmKHR5cGVvZiByYW5kID09PSBcImZ1bmN0aW9uXCIpIGNyZWF0b3IuYWRkQ29uc3RQcm9wKCdyYW5kJywgcmFuZCk7XG5cdFx0aWYodHlwZW9mIGRvYyA9PT0gXCJmdW5jdGlvblwiKSBjcmVhdG9yLmFkZENvbnN0UHJvcCgnZG9jJywgZG9jKTtcblxuXHRcdHJldHVybiBjcmVhdG9yO1xuXHR9XG5cdHRoaXMubmV3VHlwZSA9IGZ1bmN0aW9uKGtleSwgZGVzYywgbmV3X3R5cGUpe1xuXHRcdERvYy50eXBlc1trZXldID0gZGVzYztcblx0XHRULm5hbWVzW2Rlc2MubmFtZV0gPSBrZXk7XG5cdFx0dGhpcy5kb2MuanNvbiA9IEpTT04uc3RyaW5naWZ5KERvYywgXCJcIiwgMik7XG5cblx0XHR0aGlzW2tleV0gPSBuZXcgQ3JlYXRlQ3JlYXRvcihuZXdfdHlwZS5OZXcsIG5ld190eXBlLnRlc3QsIG5ld190eXBlLnJhbmQsIG5ld190eXBlLmRvYyk7XG5cdH1cblx0dGhpcy5uZXdUeXBlLmRvYyA9ICcobmFtZSwgY29uc3RydWN0b3IsIGZ1bmNUZXN0LCBmdW5jUmFuZCwgZnVuY0RvYyknO1xuXG5cblxuXHQvL0NyYWZ0IEJvb2xlYW5cblx0XHR0aGlzLmJvb2wgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG51bGwsXG5cdFx0XHRmdW5jdGlvbih2YWx1ZSl7XG5cdFx0XHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gJ2Jvb2xlYW4nKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiAhKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSkpO1xuXHRcdFx0fSxcblx0XHRcdERvYy5nZW5Eb2MuYmluZChudWxsLCBcImJvb2xcIilcblx0XHQpO1xuXG5cblxuXHQvL0NyYWZ0IENvbnN0XG5cdFx0ZnVuY3Rpb24gZG9jQ29uc3QodmFsKXtcblxuXHRcdFx0aWYodHlwZW9mKHZhbCkgPT09IFwib2JqZWN0XCIgJiYgdmFsICE9PSBudWxsKXtcblx0XHRcdFx0dmFsID0gJ09iamVjdCc7XG5cdFx0XHR9XG5cdFx0XHRpZih0eXBlb2YodmFsKSA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0dmFsID0gdmFsLnRvU3RyaW5nKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsXCJjb25zdFwiLCB7dmFsdWU6IHZhbH0pO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBuZXdDb25zdCh2YWwpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cmFuZDogZnVuY3Rpb24oKXtyZXR1cm4gdmFsfSxcblx0XHRcdFx0dGVzdDogZnVuY3Rpb24odil7XG5cdFx0XHRcdFx0aWYodmFsICE9PSB2KSByZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRvYzogZG9jQ29uc3QodmFsKVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0dmFyIGRlZl9jb25zdCA9IG5ld0NvbnN0KERvYy5nZXRDb25zdCgnY29uc3QnLCAndmFsdWUnKSk7XG5cdFx0dGhpcy5jb25zdCA9IG5ldyBDcmVhdGVDcmVhdG9yKG5ld0NvbnN0LCBkZWZfY29uc3QudGVzdCwgZGVmX2NvbnN0LnJhbmQsIGRlZl9jb25zdC5kb2MpO1xuXG5cdFx0ZnVuY3Rpb24gdENvbnN0KFR5cGUpe1xuXHRcdFx0aWYodHlwZW9mIChUeXBlKSAhPT0gXCJmdW5jdGlvblwiIHx8ICFUeXBlLmlzX2NyZWF0b3Ipe1xuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblxuXHRcdFx0XHRcdHJldHVybiBULmFycihUeXBlKTtcblxuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YoVHlwZSkgPT0gXCJvYmplY3RcIiAmJiBUeXBlICE9PSBudWxsKXtcblxuXHRcdFx0XHRcdHJldHVybiBULm9iaihUeXBlKTtcblxuXHRcdFx0XHR9ZWxzZSByZXR1cm4gVC5jb25zdChUeXBlKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyZXR1cm4gVHlwZTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHQvL0NyYWZ0IE51bWJlclxuXHRcdHZhciByYW5kTnVtID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuICsoKChtYXggLSBtaW4pKk1hdGgucmFuZG9tKCkgKyAgbWluKS50b0ZpeGVkKHByZWNpcykpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgdGVzdE51bSA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKG4pe1xuXHRcdFx0XHRpZih0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG4pKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKChuID4gbWF4KVxuXHRcdFx0XHRcdHx8KG4gPCBtaW4pXG5cdFx0XHRcdFx0fHwgKG4udG9GaXhlZChwcmVjaXMpICE9IG4gJiYgbiAhPT0gMCkgKXtcblxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdCAgfTtcblx0XHR9O1xuXG5cdFx0dmFyIGRvY051bSA9IGZ1bmN0aW9uKG1heCwgbWluLCBwcmVjaXMpe1xuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcIm51bVwiLCB7XCJtYXhcIjogbWF4LCBcIm1pblwiOiBtaW4sIFwicHJlY2lzXCI6IHByZWNpc30pO1xuXHRcdH1cblxuXHRcdHZhciBtYXhfZGVmX24gPSBEb2MuZ2V0Q29uc3QoJ251bScsICdtYXgnKTtcblx0XHR2YXIgbWluX2RlZl9uID0gRG9jLmdldENvbnN0KCdudW0nLCAnbWluJyk7XG5cdFx0dmFyIHByZWNpc19kZWYgPSBEb2MuZ2V0Q29uc3QoJ251bScsICdwcmVjaXMnKTtcblxuXHRcdHRoaXMubnVtID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRmdW5jdGlvbihtYXgsIG1pbiwgcHJlY2lzKXtcblx0XHRcdFx0aWYobWF4ID09PSBudWxsKSBtYXggPSBtYXhfZGVmX247XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkfHxtaW4gPT09IG51bGwpIG1pbiA9IG1pbl9kZWZfbjtcblx0XHRcdFx0aWYocHJlY2lzID09PSB1bmRlZmluZWQpIHByZWNpcyA9IHByZWNpc19kZWY7XG5cblx0XHRcdFx0aWYoKHR5cGVvZiBtaW4gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtaW4pKVxuXHRcdFx0XHRcdHx8KHR5cGVvZiBtYXggIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShtYXgpKVxuXHRcdFx0XHRcdHx8KHR5cGVvZiBwcmVjaXMgIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShwcmVjaXMpKVxuXHRcdFx0XHRcdHx8KHByZWNpcyA8IDApXG5cdFx0XHRcdFx0fHwocHJlY2lzID4gOSlcblx0XHRcdFx0XHR8fChwcmVjaXMgJSAxICE9PSAwKSl7XG5cdFx0XHRcdFx0dGhyb3cgYXJnVHlwZUVycm9yKGFyZ3VtZW50cywgJ1dhaXQgYXJndW1lbnRzOiBtaW4obnVtYmVyKSwgbWF4KG51bWJlciksIHByZWNpcygwPD1udW1iZXI8OSknKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihtaW4gPiBtYXgpe1xuXHRcdFx0XHRcdHZhciB0ID0gbWluO1xuXHRcdFx0XHRcdG1pbiA9IG1heDtcblx0XHRcdFx0XHRtYXggPSB0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0TnVtKG1heCwgbWluLCBwcmVjaXMpLFxuXHRcdFx0XHRcdHJhbmQ6IHJhbmROdW0obWF4LCBtaW4sIHByZWNpcyksXG5cdFx0XHRcdFx0ZG9jOiBkb2NOdW0obWF4LCBtaW4sIHByZWNpcylcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3ROdW0obWF4X2RlZl9uLCBtaW5fZGVmX24sIHByZWNpc19kZWYpLFxuXHRcdFx0cmFuZE51bShtYXhfZGVmX24sIG1pbl9kZWZfbiwgcHJlY2lzX2RlZiksXG5cdFx0XHRkb2NOdW0obWF4X2RlZl9uLCBtaW5fZGVmX24sIHByZWNpc19kZWYpXG5cdFx0KTtcblxuXHRcdHZhciByYW5kSW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIE1hdGguZmxvb3IoICgobWF4IC0gKG1pbiArIDAuMSkpL3ByZWNpcykqTWF0aC5yYW5kb20oKSApICogcHJlY2lzICsgIG1pbjtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0IHZhciB0ZXN0SW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHByZWNpcyl7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24obil7XG5cdFx0XHRcdGlmKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUobikpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoKG4gPj0gbWF4KVxuXHRcdFx0XHRcdHx8KG4gPCBtaW4pXG5cdFx0XHRcdFx0fHwoKChuIC0gbWluKSAlIHByZWNpcykgIT09IDApICl7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG9jKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0ICB9O1xuXHRcdH07XG5cblx0XHR2YXIgZG9jSW50ID0gZnVuY3Rpb24obWF4LCBtaW4sIHN0ZXApe1xuXG5cdFx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJpbnRcIiwge1wibWF4XCI6IG1heCwgXCJtaW5cIjogbWluLCBcInN0ZXBcIjogc3RlcH0pO1xuXG5cdFx0fVxuXG5cdFx0dmFyIG1heF9kZWYgPSBEb2MuZ2V0Q29uc3QoJ2ludCcsICdtYXgnKTtcblx0XHR2YXIgbWluX2RlZiA9IERvYy5nZXRDb25zdCgnaW50JywgJ21pbicpO1xuXHRcdHZhciBzdGVwX2RlZiA9IERvYy5nZXRDb25zdCgnaW50JywgJ3N0ZXAnKTtcblxuXHRcdHRoaXMuaW50ID0gbmV3IENyZWF0ZUNyZWF0b3IoXG5cdFx0XHRmdW5jdGlvbihtYXgsIG1pbiwgc3RlcCl7XG5cblx0XHRcdFx0aWYobWF4ID09PSBudWxsKSBtYXggPSBtYXhfZGVmO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZHx8bWluID09PSBudWxsKSBtaW4gPSBtaW5fZGVmO1xuXHRcdFx0XHRpZihzdGVwID09PSB1bmRlZmluZWQpIHN0ZXAgPSBzdGVwX2RlZjtcblxuXHRcdFx0XHRpZigodHlwZW9mIG1pbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1pbikpXG5cdFx0XHRcdFx0fHwodHlwZW9mIG1heCAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1heCkpXG5cdFx0XHRcdFx0fHwoTWF0aC5yb3VuZChtaW4pICE9PSBtaW4pXG5cdFx0XHRcdFx0fHwoTWF0aC5yb3VuZChtYXgpICE9PSBtYXgpXG5cdFx0XHRcdFx0fHwoc3RlcCA8PSAwKVxuXHRcdFx0XHRcdHx8KE1hdGgucm91bmQoc3RlcCkgIT09IHN0ZXApKXtcblx0XHRcdFx0XHR0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IG1pbihpbnQpLCBtYXgoaW50KSwgc3RlcChpbnQ+MCknKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihtaW4gPiBtYXgpe1xuXHRcdFx0XHRcdHZhciB0ID0gbWluO1xuXHRcdFx0XHRcdG1pbiA9IG1heDtcblx0XHRcdFx0XHRtYXggPSB0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0SW50KG1heCwgbWluLCBzdGVwKSxcblx0XHRcdFx0XHRyYW5kOiByYW5kSW50KG1heCwgbWluLCBzdGVwKSxcblx0XHRcdFx0XHRkb2M6IGRvY0ludChtYXgsIG1pbiwgc3RlcClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3RJbnQobWF4X2RlZiwgbWluX2RlZiwgc3RlcF9kZWYpLFxuXHRcdFx0cmFuZEludChtYXhfZGVmLCBtaW5fZGVmLCBzdGVwX2RlZiksXG5cdFx0XHRkb2NJbnQobWF4X2RlZiwgbWluX2RlZiwgc3RlcF9kZWYpXG5cdFx0KTtcblxuXHRcdHZhciBkb2NQb3MgPSBmdW5jdGlvbihtYXgsIG1pbiwgc3RlcCl7XG5cblx0XHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcInBvc1wiLCB7XCJtYXhcIjogbWF4fSk7XG5cblx0XHR9XG5cblx0XHR2YXIgbWF4X2RlZl9wID0gRG9jLmdldENvbnN0KCdwb3MnLCAnbWF4Jylcblx0XHR0aGlzLnBvcyA9IG5ldyBDcmVhdGVDcmVhdG9yKFxuXHRcdFx0ZnVuY3Rpb24obWF4KXtcblxuXHRcdFx0XHRpZihtYXggPT09IG51bGwpIG1heCA9IG1heF9kZWZfcDtcblxuXHRcdFx0XHRpZigodHlwZW9mIG1heCAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKG1heCkpXG5cdFx0XHRcdFx0fHwobWF4IDwgMCkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogbWluKHBvcyksIG1heChwb3MpLCBzdGVwKHBvcz4wKScpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0ZXN0OiB0ZXN0SW50KG1heCwgMCwgMSksXG5cdFx0XHRcdFx0cmFuZDogcmFuZEludChtYXgsIDAsIDEpLFxuXHRcdFx0XHRcdGRvYzogZG9jUG9zKG1heClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRlc3RJbnQobWF4X2RlZl9wLCAwLCAxKSxcblx0XHRcdHJhbmRJbnQobWF4X2RlZl9wLCAwLCAxKSxcblx0XHRcdGRvY1BvcyhtYXhfZGVmX3ApXG5cdFx0KTtcblxuXG5cblxuXG4gIC8vQ3JhZnQgQW55XG5cdFx0ZnVuY3Rpb24gcmFuZEFueShhcnIpe1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBhcnIucmFuZF9pKCkucmFuZCgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRlc3RBbnkoYXJyKXtcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWwpe1xuXHRcdFx0XHRpZihhcnIuZXZlcnkoZnVuY3Rpb24oaSl7cmV0dXJuIGkudGVzdCh2YWwpfSkpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGRvY0FueShUeXBlcyl7XG5cblx0XHRcdHZhciBjb250ID0gVHlwZXMubGVuZ3RoO1xuXHRcdFx0dmFyIHR5cGVfZG9jcyA9IFtdO1xuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGNvbnQ7IGkrKyl7XG5cdFx0XHRcdHR5cGVfZG9jcy5wdXNoKFR5cGVzW2ldLmRvYygpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIERvYy5nZW5Eb2MuYmluZChudWxsLCBcImFueVwiLCB7dHlwZXM6IHR5cGVfZG9jc30pO1xuXHRcdH1cblxuXHRcdHZhciBkZWZfdHlwZXMgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICd0eXBlcycpO1xuXHRcdGZ1bmN0aW9uIG5ld0FueShhcnIpe1xuXHRcdFx0aWYoIUFycmF5LmlzQXJyYXkoYXJyKSB8fCBhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJyID0gYXJndW1lbnRzO1xuXG5cdFx0XHR2YXIgbGVuID0gYXJyLmxlbmd0aDtcblx0XHRcdHZhciBhcnJfdHlwZXMgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG5cdFx0XHRcdGFycl90eXBlc1tpXSA9IHRDb25zdChhcnJbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm57XG5cdFx0XHRcdHRlc3Q6IHRlc3RBbnkoYXJyX3R5cGVzKSxcblx0XHRcdFx0cmFuZDogcmFuZEFueShhcnJfdHlwZXMpLFxuXHRcdFx0XHRkb2M6IGRvY0FueShhcnJfdHlwZXMpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5hbnkgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG5ld0FueSxcblx0XHRcdHRlc3RBbnkoZGVmX3R5cGVzKSxcblx0XHRcdHJhbmRBbnkoZGVmX3R5cGVzKSxcblx0XHRcdGRvY0FueShkZWZfdHlwZXMpXG5cdFx0KTtcblxuXG5cblx0Ly9DcmFmdCBBcnJheVxuXG5cblxuXHRcdGZ1bmN0aW9uIHJhbmRBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHR2YXIgcmFuZFNpemUgPSBmdW5jdGlvbiAoKXtyZXR1cm4gc2l6ZX07XG5cdFx0XHRpZighaXNfZml4ZWQpe1xuXHRcdFx0XHRyYW5kU2l6ZSA9IFQucG9zKHNpemUpLnJhbmQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdHZhciBub3dfc2l6ZSA9IHJhbmRTaXplKCk7XG5cblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIGFyciA9IFtdO1xuXG5cdFx0XHRcdFx0Zm9yKHZhciBpID0gMCwgaiA9IDA7IGkgPCBub3dfc2l6ZTsgaSsrKXtcblxuXHRcdFx0XHRcdFx0YXJyLnB1c2goVHlwZVtqXS5yYW5kKCkpO1xuXG5cdFx0XHRcdFx0XHRqKys7XG5cdFx0XHRcdFx0XHRpZihqID49IFR5cGUubGVuZ3RoKXtcblx0XHRcdFx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXG5cblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgYXJyID0gW107XG5cblx0XHRcdFx0dmFyIG5vd19zaXplID0gcmFuZFNpemUoKTtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IG5vd19zaXplOyBpKyspe1xuXHRcdFx0XHRcdGFyci5wdXNoKFR5cGUucmFuZChpLCBhcnIpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0ZXN0QXJyYXkoVHlwZSwgc2l6ZSwgaXNfZml4ZWQpe1xuXG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGFycil7XG5cblx0XHRcdFx0XHRpZighQXJyYXkuaXNBcnJheShhcnIpKXtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IGFycmF5IVwiO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZigoYXJyLmxlbmd0aCA+IHNpemUpIHx8IChpc19maXhlZCAmJiAoYXJyLmxlbmd0aCAhPT0gc2l6ZSkpKXtcblx0XHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiQXJyYXkgbGVuZ2h0IGlzIHdyb25nIVwiO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwLCBqID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7XG5cblx0XHRcdFx0XHRcdFx0dmFyIHJlcyA9IFR5cGVbal0udGVzdChhcnJbaV0pO1xuXHRcdFx0XHRcdFx0XHRpZihyZXMpe1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRlcnIucGFyYW1zID0ge2luZGV4OiBpLCB3cm9uZ19pdGVtOiByZXN9O1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGorKztcblx0XHRcdFx0XHRcdFx0aWYoaiA+PSBUeXBlLmxlbmd0aCl7XG5cdFx0XHRcdFx0XHRcdFx0aiA9IDA7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGFycil7XG5cdFx0XHRcdGlmKCFBcnJheS5pc0FycmF5KGFycikpe1xuXHRcdFx0XHRcdHZhciBlcnIgPSB0aGlzLmRvYygpO1xuXHRcdFx0XHRcdGVyci5wYXJhbXMgPSBcIlZhbHVlIGlzIG5vdCBhcnJheSFcIjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoKGFyci5sZW5ndGggPiBzaXplKSB8fCAoaXNfZml4ZWQgJiYgKGFyci5sZW5ndGggIT09IHNpemUpKSl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYXJyLmxlbmd0aCwgc2l6ZSlcblx0XHRcdFx0XHR2YXIgZXJyID0gdGhpcy5kb2MoKTtcblx0XHRcdFx0XHRlcnIucGFyYW1zID0gXCJBcnJheTogbGVuZ2h0IGlzIHdyb25nIVwiO1xuXHRcdFx0XHRcdHJldHVybiBlcnI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZXJyX2FyciA9IGFyci5maWx0ZXIoVHlwZS50ZXN0KTtcblx0XHRcdFx0aWYoZXJyX2Fyci5sZW5ndGggIT0gMCl7XG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IGVycl9hcnI7XG5cdFx0XHRcdFx0cmV0dXJuIGVycjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBkb2NBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHR2YXIgdHlwZV9kb2NzID0gW107XG5cdFx0XHRpZihBcnJheS5pc0FycmF5KFR5cGUpKXtcblx0XHRcdFx0dmFyIGNvbnQgPSBUeXBlLmxlbmd0aDtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGNvbnQ7IGkrKyl7XG5cdFx0XHRcdFx0dHlwZV9kb2NzLnB1c2goVHlwZVtpXS5kb2MoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1lbHNle1xuXHRcdFx0XHR0eXBlX2RvY3MgPSBUeXBlLmRvYygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gRG9jLmdlbkRvYy5iaW5kKG51bGwsIFwiYXJyXCIsIHt0eXBlczogdHlwZV9kb2NzLCBzaXplOiBzaXplLCBmaXhlZDogaXNfZml4ZWR9KTtcblxuXHRcdH1cblxuXG5cdFx0dmFyIGRlZl9UeXBlID0gRG9jLmdldENvbnN0KCdhcnInLCAndHlwZXMnKTtcblx0XHR2YXIgZGVmX1NpemUgPSBEb2MuZ2V0Q29uc3QoJ2FycicsICdzaXplJyk7XG5cdFx0dmFyIGRlZl9maXhlZCA9IERvYy5nZXRDb25zdCgnYXJyJywgJ2ZpeGVkJyk7XG5cblx0XHRmdW5jdGlvbiBuZXdBcnJheShUeXBlLCBzaXplLCBpc19maXhlZCl7XG5cdFx0XHRpZihUeXBlID09PSBudWxsKSBUeXBlID0gZGVmX1R5cGU7XG5cdFx0XHRpZihpc19maXhlZCA9PT0gdW5kZWZpbmVkKSBpc19maXhlZCA9IGRlZl9maXhlZDtcblxuXHRcdFx0aWYoQXJyYXkuaXNBcnJheShUeXBlKSl7XG5cdFx0XHRcdGlmKHNpemUgPT09IHVuZGVmaW5lZHx8c2l6ZSA9PT0gbnVsbCkgc2l6ZSA9IFR5cGUubGVuZ3RoO1xuXG5cdFx0XHRcdFR5cGUgPSBUeXBlLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gdENvbnN0KGl0ZW0pO30pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGlmKHNpemUgPT09IHVuZGVmaW5lZHx8c2l6ZSA9PT0gbnVsbCkgc2l6ZSA9IDE7XG5cdFx0XHRcdFR5cGUgPSB0Q29uc3QoVHlwZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKFQucG9zLnRlc3Qoc2l6ZSkpe1xuXHRcdFx0XHRcdHRocm93IGFyZ1R5cGVFcnJvcihhcmd1bWVudHMsICdXYWl0IGFyZ3VtZW50czogJyArIEpTT04uc3RyaW5naWZ5KFQucG9zLnRlc3Qoc2l6ZSkpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dGVzdDogdGVzdEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKSxcblx0XHRcdFx0cmFuZDogcmFuZEFycmF5KFR5cGUsIHNpemUsIGlzX2ZpeGVkKSxcblx0XHRcdFx0ZG9jOiBkb2NBcnJheShUeXBlLCBzaXplLCBpc19maXhlZClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5hcnIgPSBuZXcgQ3JlYXRlQ3JlYXRvcihcblx0XHRcdG5ld0FycmF5LFxuXHRcdFx0dGVzdEFycmF5KGRlZl9UeXBlLCBkZWZfU2l6ZSwgZGVmX2ZpeGVkKSxcblx0XHRcdHJhbmRBcnJheShkZWZfVHlwZSwgZGVmX1NpemUsIGRlZl9maXhlZCksXG5cdFx0XHRkb2NBcnJheShkZWZfVHlwZSwgZGVmX1NpemUsIGRlZl9maXhlZClcblx0XHQpO1xuXG5cblxuXG5cblxuXG5cdC8vQ3JhZnQgT2JqZWN0XG5cblx0XHRmdW5jdGlvbiByYW5kT2JqKGZ1bmNPYmope1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBvYmogPSB7fTtcblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZnVuY09iail7XG5cdFx0XHRcdFx0b2JqW2tleV0gPSBmdW5jT2JqW2tleV0ucmFuZCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBvYmo7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRlc3RPYmooZnVuY09iail7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24ob2JqKXtcblxuXHRcdFx0XHRpZih0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIG9iaiA9PT0gbnVsbCl7XG5cdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0ZXJyLnBhcmFtcyA9IFwiVmFsdWUgaXMgbm90IG9iamVjdCFcIjtcblx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gZnVuY09iail7XG5cdFx0XHRcdFx0dmFyIHJlcyA9IGZ1bmNPYmpba2V5XS50ZXN0KG9ialtrZXldKTtcblx0XHRcdFx0XHRpZihyZXMpe1xuXHRcdFx0XHRcdFx0dmFyIGVyciA9IHRoaXMuZG9jKCk7XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zID0ge307XG5cdFx0XHRcdFx0XHRlcnIucGFyYW1zW2tleV0gPSByZXM7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZXJyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZG9jT2IoZnVuY09iail7XG5cdFx0XHR2YXIgZG9jX29iaiA9IHt9O1xuXG5cdFx0XHRmb3IodmFyIGtleSBpbiBmdW5jT2JqKXtcblx0XHRcdFx0XHRkb2Nfb2JqW2tleV0gPSBmdW5jT2JqW2tleV0uZG9jKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBEb2MuZ2VuRG9jLmJpbmQobnVsbCwgXCJvYmpcIiwge3R5cGVzOiBkb2Nfb2JqfSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gTmV3T2JqKHRlbXBPYmope1xuXHRcdFx0aWYodHlwZW9mIHRlbXBPYmogIT09ICdvYmplY3QnKSB0aHJvdyBhcmdUeXBlRXJyb3IoYXJndW1lbnRzLCAnV2FpdCBhcmd1bWVudHM6IHRlbXBPYmooT2JqZWN0KScpO1xuXG5cdFx0XHR2YXIgYmVnT2JqID0ge307XG5cdFx0XHR2YXIgZnVuY09iaiA9IHt9O1xuXHRcdFx0Zm9yKHZhciBrZXkgaW4gdGVtcE9iail7XG5cdFx0XHRcdGZ1bmNPYmpba2V5XSA9IHRDb25zdCh0ZW1wT2JqW2tleV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm57XG5cdFx0XHRcdHRlc3Q6IHRlc3RPYmooZnVuY09iaiksXG5cdFx0XHRcdHJhbmQ6IHJhbmRPYmooZnVuY09iaiksXG5cdFx0XHRcdGRvYzogZG9jT2IoZnVuY09iailcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5vYmogPSBuZXcgQ3JlYXRlQ3JlYXRvcihOZXdPYmosXG5cdFx0XHRmdW5jdGlvbihvYmope3JldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwifSxcblx0XHRcdHJhbmRPYmooe30pLFxuXHRcdFx0RG9jLmdlbkRvYy5iaW5kKG51bGwsIFwib2JqXCIpXG5cdFx0KTtcblxuXG5cblxuXG4vL0NyYWZ0IFR5cGUgb3V0IHRvICBEb2N1bWVudFxuXG5cdFQubmFtZXMgPSB7fTtcblx0Zm9yKHZhciBrZXkgaW4gRG9jLnR5cGVzKXtcblx0XHRULm5hbWVzW0RvYy50eXBlc1trZXldLm5hbWVdID0ga2V5O1xuXHR9XG5cblx0dGhpcy5vdXREb2MgPSBmdW5jdGlvbih0bXApe1xuXHRcdGlmKCh0eXBlb2YgdG1wID09PSBcImZ1bmN0aW9uXCIpICYmIHRtcC5pc19jcmVhdG9yKSByZXR1cm4gdG1wO1xuXG5cdFx0aWYoISgnbmFtZScgaW4gdG1wKSl7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoKTtcblx0XHR9XG5cdFx0dmFyIHR5cGUgPSB0bXAubmFtZTtcblxuXHRcdGlmKCdwYXJhbXMnIGluIHRtcCl7XG5cdFx0XHR2YXIgcGFyYW1zID0gdG1wLnBhcmFtcztcblx0XHRcdHN3aXRjaChULm5hbWVzW3R5cGVdKXtcblx0XHRcdFx0Y2FzZSAnb2JqJzoge1xuXHRcdFx0XHRcdHZhciBuZXdfb2JqID0ge307XG5cdFx0XHRcdFx0Zm9yKHZhciBrZXkgaW4gcGFyYW1zLnR5cGVzKXtcblx0XHRcdFx0XHRcdG5ld19vYmpba2V5XSA9IFQub3V0RG9jKHBhcmFtcy50eXBlc1trZXldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFyYW1zLnR5cGVzID0gbmV3X29iajtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlICdhbnknOlxuXHRcdFx0XHRjYXNlICdhcnInOiB7XG5cdFx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShwYXJhbXMudHlwZXMpKXtcblx0XHRcdFx0XHRcdHBhcmFtcy50eXBlcyA9IHBhcmFtcy50eXBlcy5tYXAoVC5vdXREb2MuYmluZChUKSk7XG5cdFx0XHRcdFx0fWVsc2UgcGFyYW1zLnR5cGVzID0gVC5vdXREb2MocGFyYW1zLnR5cGVzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGdldFNpbXBsZVR5cGUoVC5uYW1lc1t0eXBlXSwgcGFyYW1zKTtcblx0XHR9XG5cdFx0cmV0dXJuIGdldFNpbXBsZVR5cGUoVC5uYW1lc1t0eXBlXSwge30pO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0U2ltcGxlVHlwZShuYW1lLCBwYXJhbXMpe1xuXHRcdHZhciBhcmcgPSBbXTtcblx0XHREb2MudHlwZXNbbmFtZV0uYXJnLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpKXthcmdbaV0gPSBwYXJhbXNba2V5XTt9KTtcblx0XHRyZXR1cm4gVFtuYW1lXS5hcHBseShULCBhcmcpO1xuXHR9O1xuXG4vL1N1cHBvcnQgRGVjbGFyYXRlIEZ1bmN0aW9uXG5cblx0ZnVuY3Rpb24gZmluZGVQYXJzZShzdHIsIGJlZywgZW5kKXtcblx0XHR2YXIgcG9pbnRfYmVnID0gc3RyLmluZGV4T2YoYmVnKTtcblx0XHRpZih+cG9pbnRfYmVnKXtcblxuXHRcdFx0dmFyIHBvaW50X2VuZCA9IHBvaW50X2JlZztcblx0XHRcdHZhciBwb2ludF90ZW1wID0gcG9pbnRfYmVnO1xuXHRcdFx0dmFyIGxldmVsID0gMTtcblx0XHRcdHZhciBicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHR3aGlsZSghYnJlYWtXaGlsZSl7XG5cdFx0XHRcdGJyZWFrV2hpbGUgPSB0cnVlO1xuXG5cdFx0XHRcdGlmKH5wb2ludF90ZW1wKSBwb2ludF90ZW1wID0gc3RyLmluZGV4T2YoYmVnLCBwb2ludF90ZW1wICsgMSk7XG5cdFx0XHRcdGlmKH5wb2ludF9lbmQpIHBvaW50X2VuZCA9IHN0ci5pbmRleE9mKGVuZCwgcG9pbnRfZW5kICsgMSk7XG5cblx0XHRcdFx0aWYocG9pbnRfdGVtcCA8IHBvaW50X2VuZCl7XG5cblx0XHRcdFx0XHRpZihwb2ludF90ZW1wID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfdGVtcCAtIDFdICE9PSAnXFxcXCcpIGxldmVsID0gbGV2ZWwrMTtcblxuXHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0aWYocG9pbnRfZW5kID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfZW5kIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbC0xO1xuXHRcdFx0XHRcdFx0aWYobGV2ZWwgPT0gMCl7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbcG9pbnRfYmVnLCBwb2ludF9lbmRdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0aWYocG9pbnRfZW5kID4gMCl7XG5cdFx0XHRcdFx0XHRicmVha1doaWxlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZihzdHJbcG9pbnRfZW5kIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbC0xO1xuXHRcdFx0XHRcdFx0aWYobGV2ZWwgPT0gMCl7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBbcG9pbnRfYmVnLCBwb2ludF9lbmRdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKHBvaW50X3RlbXAgPiAwKXtcblx0XHRcdFx0XHRcdGJyZWFrV2hpbGUgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGlmKHN0cltwb2ludF90ZW1wIC0gMV0gIT09ICdcXFxcJykgbGV2ZWwgPSBsZXZlbCsxO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdE9iamVjdC50eXBlcyA9IFQ7XG59KSgpO1xuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG5cdFwi0JTQtdGA0LXQstC+XCI6IFwid29vZFwiLFxyXG5cdFwi0JrQsNC80LXQvdGMXCI6IFwic3RvbmVcIixcclxuXHRcItCh0YLQsNC70YxcIjogXCJzdGVlbFwiLFxyXG5cdFwi0KDQtdGB0L9cIjogXCJzcGF3bmVyXCJcclxufSJdfQ==
