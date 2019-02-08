function CrController(Logic){
	var Clicks = {
		Tiles: function(event){
			if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
		},
		dell: Logic.dell.bind(Logic),
		switch_add: CrSwitch("add", "invis"),
		save: Logic.save.bind(Logic)
	};
	
	var Submits = {
		add: function(){
			var tile = {
				type: this.type.value
			};
			
			if(this.img.files[0]){
				var reader = new FileReader();
				reader.onload = function(e){addTile(tile, e.target.result)};
				
				reader.readAsDataURL(this.img.files[0]);
				this.reset();
			}
			
		}
	}
	
	var Changes = {
		open: OpenFileJSON(Logic.load.bind(Logic))
	}
	
	function addTile(tile, img){
		tile.img = img;
		Logic.add(tile);
	}
	
	return {clicks: Clicks, submits: Submits, changes: Changes};
}

function OpenFileJSON(Open){
	return function(){
		var reader = new FileReader();
		reader.onload = function(e){Open(JSON.parse(e.target.result))};
		reader.readAsText(this.files[0]);
	}
}

function CrSwitch(id, name_class){
	var elem = getNode(id).classList;
	return function(){
		elem.toggle(name_class);
	}
}

function getNode(id){
	var elem = document.getElementById(id);
	if(!elem) throw new Error("Elem is not find!");
	return elem;
}

module.exports = CrController;
