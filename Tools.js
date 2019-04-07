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