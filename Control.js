const Hear = require("./Events.js");

function CrController(Logic, Draw){
	
	Hear("switch_add", "click", Draw.switchElem("add", "invis"));

	Hear("Tiles", "click", function(event){
		if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
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
		if(e.target.getAttribute("tile") !== null) Draw.View.current_tile = e.target;
	});
	Hear("View", "dragenter", console.log);
	Hear("View", "dragend", function(e){
		Draw.View.move(e.offsetX, e.offsetY);
	});
	
}

module.exports = CrController;
