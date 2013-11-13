$(document).ready(function(){

	var canvas = $("#canvas");

	// initialize UI elements
	$(".button").css({userSelect:"none"}).easyHover({
		start: {color:"rgb(200,200,200)",lineHeight:"1.0em",fontSize:18},
		end: {color:"rgb(255,255,255)",lineHeight:"0.9em",fontSize:22}
	});

	// create and start the game object
	var game = new Game(canvas);

	game.start();

	// initialize the new game button functionality
	$("#newgame-btn").click(function(){
		if (!game.locked) {
			game.restart();
		}
	});

});

// game constants
var OPACITY_NORMAL = 0.6;
var OPACITY_CONTROLLED = 0.0;
var OPACITY_HOVER = 0.0;

function Game(canvas) {

	// reference to own object
	var self = this;

	// flag for if we can interact with the UI
	this.locked = true;

	// game components
	this.canvas = canvas;
	this.startMarker = $("#start-marker");
	this.turnsCounter = $("#turns-container");
	this.completionCounter = $("#completion-container");

	// board constants
	this.board = {
		width: 16,
		height: 8,
		hGap: 10,
		vGap: 10,
		animDuration: 250,
		seed: 60
	};

	// tile constants
	this.tile = {
		borderRadius: "5px",
		width: 32,
		height: 32,
		scaleBy: 1.2,
		animDuration: 200
	};

	// set of colors
	this.numColors = 5;
	this.colors = [];
	this.currentColor = -1;

	// game metrics
	this.numTiles = 0;
	this.numTurns = 0;
	this.totalTiles = 0;
	this.totalTurns = 200;

	// cached game metrics
	this._numTiles = -1;
	this._numTurns = -1;
	this._totalTiles = -1;
	this._totalTurns = -1;

	// game variables
	this.anchor = null;
	this.controlled = [];
	// this.adjacentTiles = [];

	this.start = function() {

		// specify animation parameters
		var o = {opacity:0.0}, 
			o_ = {opacity:1.0}, 
			d = self.board.animDuration;

		// first we must create the board!
		self.clear();
		_createBoard();

		// reset the number of turns taken
		this.numTurns = 0;

		// fade everything into existence
		self.startMarker.css(o).stop().animate(o_,d);
		self.turnsCounter.css(o).stop().animate(o_,d);
		self.completionCounter.css(o).stop().animate(o_,d);
		self.canvas.css(o).stop().animate(o_,d,function(){
			self.locked = false;
		});

		// update the HUD, don't animate the text!
		_updateHud(true);
	};

	this.restart = function() {
		// clear the board and recreate it again
		self.clear(function(){
			self.start()
		});
	};

	this.clear = function(cb){
		// define animation parameters
		var o = {opacity:1.0}, 
			o_ = {opacity:0.0}, 
			d = self.board.animDuration;

		// lock UI
		self.locked = true;

		// animate the UI out of existence
		self.startMarker.css(o).stop().animate(o_,d);
		self.turnsCounter.css(o).stop().animate(o_,d);
		self.completionCounter.css(o).stop().animate(o_,d);
		self.canvas.css(o).stop().animate(o_,d,function(){
			self.canvas.empty();
			if (cb) cb();
		})
	};

	function _createBoard() {

		// generate the appropriate number of colors
		self.colors = [];
		for (var i=0; i<self.numColors; i++) {
			self.colors.push(_generateColor());
		}

		// allow the canvas to accept absolute positioned elements within it
		self.canvas.css({
			position: "relative",
			width: self.board.width * (self.tile.width+self.board.hGap) + self.board.hGap,
			height: self.board.height * (self.tile.height+self.board.vGap) + self.board.vGap,
			margin: "0 auto"
		});
		// populate the tiles in the board
		self.totalTiles = 0;
		for (var y=0; y<self.board.height; y++) {
			for (var x=0; x<self.board.width; x++) {

				if (x > 2 || y > 2) {
					if (Math.floor(Math.random()*100) > self.board.seed) continue; 
				}

				// specify tile properties
				var pos = {x:x,y:y};
				var coord = _getCoord(x,y);
				var colorIndex = Math.floor(Math.random()*self.numColors);
				var posStyles = {
					position: "absolute",
					borderRadius: self.tile.borderRadius,
					borderTop: "solid 1px rgb(100,100,100)",
					borderBottom: "solid 1px rgb(50,50,50)",
					width: self.tile.width,
					height: self.tile.height,
					left: coord.x,
					top: coord.y,
				};

				// create the tile object
				var tile = $("<div>")
					.addClass("tile")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.data("colorIndex",colorIndex)
					.css($.extend({ backgroundColor: "rgb("+self.colors[colorIndex]+")"}, posStyles))
					.appendTo(self.canvas);

				// create the corresponding tile mask
				var mask = $("<div>")
					.addClass("tile-mask")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.data("colorIndex",colorIndex)
					.css($.extend({opacity:OPACITY_NORMAL, backgroundColor:"black",cursor:"pointer"}, posStyles))
					.appendTo(self.canvas);

				// define mouse over behaviour
				mask.mouseover(function(){
					var a = _getAnimProperties($(this)),
						p = {width:a.w,height:a.h,left:a.c.x,top:a.c.y},
						p_ = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						o = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_NORMAL},
						o_ = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_HOVER},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});

				// define mouse out behaviour
				mask.mouseout(function(){
					var a = _getAnimProperties($(this)),
						p = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						p_ = {width:a.w,height:a.h,left:a.c.x,top:a.c.y}
						o = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_HOVER},
						o_ = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_NORMAL},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});

				// define click behaviour
				mask.click(function(){
					_takeTurn($(this).data("pos"));
					_updateHud();
				});

				// increment the number of tiles on the board
				self.totalTiles++;
			}
		}
		// set (0,0) as the starting anchor
		_setAnchor({x:0,y:0});
	};

	function _takeTurn(pos) {
		var tile = _getTile("("+pos.x+","+pos.y+")");
		var isControlled = tile.hasClass("controlled");
		var colorIndex = tile.data("colorIndex");

		// only allow the turn to be taken if it is an uncontrolled piece
		if (!isControlled) {

			// check if this tile is isolated, if it is isolated then we know that we
			// are creating a new anchor
			if (!_isAdjacentToControlled(pos)) {
				_setAnchor(pos);
			} else {
				// grow the current controlled group
				_colorSwap(pos,colorIndex);
			}

			// increment hte number fo turns taken
			self.numTurns++;
		}
	}

	function _isAdjacentToControlled(pos) {
		for (var i=self.controlled.length-1;i>=0;i--) {
			if (!self.controlled[i]) continue;

			var x = self.controlled[i].x;
			var y = self.controlled[i].y;
			var tile = _getTile("("+x+","+y+")");

			if (pos.x == x-1 && pos.y == y) return true;
			if (pos.x == x+1 && pos.y == y) return true;
			if (pos.x == x && pos.y == y-1) return true;
			if (pos.x == x && pos.y == y+1) return true;
		}
		return false;
	}

	function _colorSwap(pos,colorIndex) {

		// add clicked tile to the controlled group
		_setControlled(pos);

		// update all existing controlled tiles (and also check if we can add more to the controlled group)
		for (var i=self.controlled.length-1;i>=0;i--) {
			if (!self.controlled[i]) continue;
			
			var x = self.controlled[i].x;
			var y = self.controlled[i].y;
			var tile = _getTile("("+x+","+y+")");
			var color = "rgb("+self.colors[colorIndex]+")";
			
			// animate this tile to the new color
			var a = {backgroundColor:tile.css("background")}, 
				a_ = {backgroundColor:color}, 
				d = self.tile.animDuration;
			tile.stop().css(a).animate(a_,d);



			// see if we can omit this tile now, since it is completely blocked off
			/*
			if (pos.x == x-1 && pos.y == y && pos.x == x+1 && pos.y == y &&
				pos.x == x && pos.y == y-1 && pos.x == x && pos.y == y+1) 
			{
				self.adjacent[i] = null;
			}
			*/
		}
	}

	function _updateHud(noAnimation) {
		var animDuration = noAnimation ? 0 : 200;

		// perform an update anmation of the value has been changed
		if (self.numTurns != self._numTurns) {
			fadeInOut($("#turns-taken"),self.numTurns,animDuration);
		}
		if (self.totalTurns != self._totalTurns) {
			fadeInOut($("#turns-total"),self.totalTurns,animDuration);
		}
		if (self.numTiles != self._numTiles) {
			fadeInOut($("#completion-taken"),self.numTiles,animDuration);
		}
		if (self.totalTiles != self._totalTiles) {
			fadeInOut($("#completion-total"),self.totalTiles,animDuration);
		}
		// update the cached values
		self._numTurns = self.numTurns;
		self._numTiles = self.numTiles;
		self._totalTurns = self.totalTurns;
		self._totalTiles = self.totalTiles;

		// helper function to fade in/out the text upon update
		function fadeInOut(obj,value,duration) {
			obj.css({opacity:1.0}).stop().animate({opacity:0.0},duration,function(){
				$(this).html(value);
				$(this).css({opacity:0.0}).stop().animate({opacity:1.0},duration);
			});
		}
	}

	function _setAnchor(pos) {
		self.anchor = pos;

		// each time a new anchor is set, we will reset the controlled stack
		self.controlled = [];
		_setControlled(pos);

		// get references to the appropriate components
		var tile = _getTile("("+pos.x+","+pos.y+")");
		var mask = _getTileMask("("+pos.x+","+pos.y+")");

		// update the current color index
		self.currentColor = tile.data("colorIndex");

		// mark the tile as the new anchor
		tile.addClass("anchor");
		mask.addClass("anchor");
	}

	function _setControlled(pos) {
		var tile = _getTile("("+pos.x+","+pos.y+")");
		var mask = _getTileMask("("+pos.x+","+pos.y+")");

		// mark the tile as controlled
		tile.addClass("controlled");
		mask.addClass("controlled");

		mask.css({opacity: OPACITY_CONTROLLED});

		// increment the number of controlled tiles
		self.numTiles++;

		// push it onto the controlled stack
		self.controlled.push(pos);
	}

	// function to report animation properties upon mask hover events
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

	// helper functions to generate colors on the fly
	function _generateColor() {
		return [_getHexValue(),_getHexValue(),_getHexValue()];
	}

	function _getHexValue() {
		return Math.min(255,Math.floor(Math.random()*256)+100);
	}

	// helper functions to get tiles/masks
	function _getTile(pos) {
		return $(".tile[pos='"+pos+"']", self.canvas);
	}
	function _getTileMask(pos) {
		return $(".tile-mask[pos='"+pos+"']", self.canvas);
	}

	// returns the literal coordinate of a tile
	function _getCoord(x,y) {
		return {
			x: x*(self.tile.width+self.board.hGap) + self.board.hGap,
			y: y*(self.tile.height+self.board.vGap) + self.board.vGap
		};
	}

}