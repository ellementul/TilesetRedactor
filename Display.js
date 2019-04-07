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