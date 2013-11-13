/**
 * jquery.smartImage.js
 *
 * @requires jquery
 * @author Kevin Chen <k39chen@gmail.com>
 * @copyright 2013, Kevin Chen, All rights reserved.
 */
(function(){
	
	$.fn.easyHover = function(options){

		var settings = $.extend({
			start: {color: "#fff"},
			end: {color: "#ddd"},
			duration: 200
		}, options);

		// intiialize the plugin for all instances
		$(this).each(function(){

			$(this).css(settings.start).hover(
				function(){
					$(this).stop().css(settings.start).animate(settings.end,settings.duration);
				}, 
				function(){
					$(this).stop().css(settings.end).animate(settings.start,settings.duration);
				}
			);
		});
		return this;
	}

})(jQuery);