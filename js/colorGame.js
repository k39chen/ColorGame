$(document).ready(function(){

	var canvas = $("#canvas");

	$(".button").css({userSelect:"none"}).easyHover({
		start: {color:"rgb(200,200,200)",lineHeight:"1.0em",fontSize:18},
		end: {color:"rgb(255,255,255)",lineHeight:"0.9em",fontSize:22}
	});

	var game = new Game(canvas);

	game.start();

	$("#newgame-btn").click(function(){
		if (!game.locked) {
			game.restart();
		}
	});

});

function Game(canvas) {

	var self = this;

	this.locked = true;

	// constructor
	this.canvas = canvas;
	this.startMarker = $("#start-marker");
	this.board = {
		width: 16,
		height: 8,
		hGap: 10,
		vGap: 10,
		animDuration: 250,
		seed: 70
	};
	this.tile = {
		borderRadius: "5px",
		width: 32,
		height: 32,
		scaleBy: 1.3,
		animDuration: 200
	}

	this.start = function() {
		// first we must create the board!
		self.clear();
		_createBoard();
		self.startMarker.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration);
		self.canvas.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration,function(){
			self.locked = false;
		});
	};

	this.restart = function() {
		self.clear(function(){
			self.start()
		});
	};

	this.clear = function(cb){
		self.locked = true;
		self.startMarker.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration);
		self.canvas.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration,function(){
			self.canvas.empty();
			if (cb) cb();
		})
	}

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

				if (x > 0 || y > 0) {
					if (Math.floor(Math.random()*100) > self.board.seed) continue; 
				}

				var pos = {x:x,y:y};
				var coord = _getCoord(x,y);
				var color = [_getHexValue(),_getHexValue(),_getHexValue()];
				var posStyles = {
					position: "absolute",
					borderRadius: self.tile.borderRadius,
					borderTop: "solid 1px rgb(180,180,180)",
					borderBottom: "solid 1px rgb(50,50,50)",
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
					var a = _getAnimProperties($(this)),
						p = {width:a.w,height:a.h,left:a.c.x,top:a.c.y},
						p_ = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						o = {opacity:0.4},
						o_ = {opacity:0.0},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});
				mask.mouseout(function(){
					var a = _getAnimProperties($(this)),
						p = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						p_ = {width:a.w,height:a.h,left:a.c.x,top:a.c.y}
						o = {opacity:0.0},
						o_ = {opacity:0.4},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});
			}
		}
		// set (0,0) as the starting anchor

	};

	// generate predictable set of colors
	function _getAnimProperties(tileobj) {
		var w = self.tile.width,
			h = self.tile.height,
			s = self.tile.scaleBy,
			p = tileobj.attr("pos"),
			d = self.tile.animDuration,
			x = tileobj.data("pos").x,
			y = tileobj.data("pos").y,
			c = _getCoord(x,y),
			c_ = {x:c.x-w*(s-1)/2,y:c.y-h*(s-1)/2};
		return {w:w,h:h,s:s,p:p,d:d,x:x,y:y,c:c,c_:c_};
	}

	function _getHexValue() {
		return Math.min(255,Math.floor(Math.random()*256)+100);
	}

	function _getTile(pos) {
		return $("#tile[pos='"+[pos.x,pos.y]+"']", self.canvas);
	}

	function _getCoord(x,y) {
		return {
			x: x*(self.tile.width+self.board.hGap) + self.board.hGap,
			y: y*(self.tile.height+self.board.vGap) + self.board.vGap
		};
	}

}