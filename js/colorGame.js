$(document).ready(function(){

	var canvas = $("#canvas");

	var game = new Game(canvas);

	game.start();

});

function Game(canvas) {

	var self = this;

	// constructor
	this.canvas = canvas;
	this.board = {
		width: 16,
		height: 16,
		hGap: 10,
		vGap: 10
	};
	this.tile = {
		width: 32,
		height: 32,
		scaleBy: 1.3,
		animDuration: 200
	}

	this.start = function() {

		// first we must create the board!
		_createBoard();

	};

	this.restart = function() {

	};

	this.gameOver = function() {

	};

	function _createBoard() {

		// allow the canvas to accept absolute positioned elements within it
		self.canvas.css({
			position: "relative",
			width: self.board.width * (self.tile.width+self.board.hGap) + self.board.hGap,
			height: self.board.height * (self.tile.height+self.board.vGap) + self.board.vGap,
			margin: "0 auto"
		});
		// populate the tiles in the board
		for (var y=0; y<self.board.height; y++) {
			for (var x=0; x<self.board.width; x++) {

				var pos = {x:x,y:y};
				var coord = _getCoord(x,y);
				var color = [_getHexValue(),_getHexValue(),_getHexValue()];
				var posStyles = {
					position: "absolute",
					borderRadius: "0",
					width: self.tile.width,
					height: self.tile.height,
					left: coord.x,
					top: coord.y,
				};
				var tile = $("<div>")
					.addClass("tile")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.css($.extend({ background: "rgb("+color+")"}, posStyles))
					.appendTo(self.canvas);
				var mask = $("<div>")
					.addClass("tile-mask")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.css($.extend({opacity:0.4, background:"black",cursor:"pointer"}, posStyles))
					.appendTo(self.canvas);

				mask.mouseover(function(){

					var w = self.tile.width;
					var h = self.tile.height;
					var s = self.tile.scaleBy;
					var p = $(this).attr("pos");
					var d = self.tile.animDuration;
					var x = $(this).data("pos").x;
					var y = $(this).data("pos").y;
					var c = _getCoord(x,y);
					var c_ = {x:c.x-w*(s-1)/2,y:c.y-h*(s-1)/2};

					var startProp = {width:w,height:h,left:c.x,top:c.y};
					var endProp = {width:w*s,height:h*s,left:c_.x,top:c_.y};

					// animate the mask
					$(this).stop()
						.css($.extend({opacity: 0.4}, startProp))
						.animate($.extend({opacity: 0.0}, endProp), d);
					$(".tile[pos='"+p+"']", self.canvas).stop()
						.css(startProp)
						.animate(endProp, d);
				});
				mask.mouseout(function(){

					var w = self.tile.width;
					var h = self.tile.height;
					var s = self.tile.scaleBy;
					var p = $(this).attr("pos");
					var d = self.tile.animDuration;
					var x = $(this).data("pos").x;
					var y = $(this).data("pos").y;
					var c = _getCoord(x,y);
					var c_ = {x:c.x-w*(s-1)/2,y:c.y-h*(s-1)/2};

					var startProp = {width:w*s,height:h*s,left:c_.x,top:c_.y};
					var endProp = {width:w,height:h,left:c.x,top:c.y};
					
					// animate the mask
					$(this).stop()
						.css($.extend({opacity: 0.0}, startProp))
						.animate($.extend({opacity: 0.4}, endProp), d);
					$(".tile[pos='"+p+"']", self.canvas).stop()
						.css(startProp)
						.animate(endProp, d);
				});
			}
		}

	};

	function _getHexValue() {
		return Math.min(255,Math.floor(Math.random()*256)+100);
	}

	function _getCoord(x,y) {
		return {
			x: x*(self.tile.width+self.board.hGap) + self.board.hGap,
			y: y*(self.tile.height+self.board.vGap) + self.board.vGap
		};
	}

}