function CrController(Logic){
	var Clicks = {
		Tiles: function(event){
			if(event.target.getAttribute("tile") !== null) Logic.setTile(event.target.getAttribute("tile"));
		},
		dell: Logic.dell.bind(Logic)
	}
	
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
	
	function addTile(tile, img){
		tile.img = img;
		Logic.add(tile);
	}
	
	return {clicks: Clicks, submits: Submits};
}

module.exports = CrController;
