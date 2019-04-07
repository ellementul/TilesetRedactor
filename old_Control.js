const Hear = require("./Events.js");

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

