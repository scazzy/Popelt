 /*=================================================================================================
 * @name: Popelt
 * @type: jQuery
 * @author: (c) Elton Jain - @eltonjain
 * @demo: http://welbour.com
 * @version: 1.0
 * @requires jQuery 1.9.1
 *=================================================================================================*/
(function ($) {
// imaginary global variables in scope
var _popups_open = [],
	_popups_open_count = 0,
	_popups = null,
	_popup_current_id = null;
function Popelt(params){
	var _self = this;
	
	//////////////////////////////////////
	// VARIABLES
	//////////////////////////////////////
	var _d 				= $(document)
	  , _w 				= window
	  , _$w				= $(_w)
	  , _wH				= windowHeight()
	  , _wW				= windowWidth()
	  , _prefix			= '__pop'
	  , _btnCloseClass	= 'pop-btn-close'
	  , _closeClass		= 'pop-close'
	  , _popBtnClass	= 'pop-btn'
	  , _popOverlayClass = 'pop-screen'
	  , _popClass 		= 'pop-wrap'
	  , _popContentClass = 'pop-content'
	  , _popActionBlockClass = 'pop-action-block'
	  , _popTitleClass	= 'pop-title'
	  , _id
	  , _zIndex			= 9000
	;

	//////////////////////////////////////
	// DEFAULTS
	//////////////////////////////////////
	var defaults = {
		modal			: false
		, title			: false
		, content		: ''
		, offsetTop		: -1
		, closeButton	: true // X close button
		, closeBtnTooltip : 'Close'
		, width			: 600
		, closeClass	: ''
		, escClose		: true
		, focus			: null // Element to focus
		, contentType	: false // [iframe, ajax, #elementId]
		, loadUrl		: false // iframe/ajax URL
		, buttons		: []
		, fadeSpeed		: 200
		, iframeHeight	: '300px'
		, iframeWidth	: '100%'
		, maxHeight		: false
		, valign		: true
		, responsive	: false
		, overlayColor	: false
		, overlayOpacity: false
	};
	var o = $.extend(defaults, params);
	
	_self.init = function(){
		_popups = (_popups || 0) + 1;
		_id = _prefix + _popups + '__';
		_zIndex +=  _popups;
	};
	
	_self.setContent = function(content){
		o.content = content;
		return _self;
	};

	_self.showPopup = function(){
		// CREATE TEMPLATE ONLY IF IT DOESN'T EXISTS
		// CHECK WITH POPUP ID
		if($('.'+_popClass + '.'+_id).length <= 0) {
			// Create template
			var popHtml, popTitle, popContent, popOverlay, actionPanel;
			
			popOverlay = $('<div>').addClass(_popOverlayClass).addClass(_id).css('z-index',_zIndex);
			if(o.overlayColor){popOverlay.css('background',o.overlayColor);}
			if(o.overlayOpacity){popOverlay.css('opacity',o.overlayOpacity).css('filter','alpha('+o.overlayOpacity*10+')');}
			popContent = $('<div>').addClass(_popContentClass);
			
			if(o.title){
				popTitle = $('<div>').addClass(_popTitleClass).text(o.title);
			}
			
			if(o.content){
				popContent.append(o.content);
			}
			
			if(o.buttons.length){
				actionPanel = $('<div>').addClass(_popActionBlockClass);
				$.each(o.buttons, function( k, v ){
					var classname = v.classname,
						clickEvent = v.clickEvent;
					if( $.isFunction(classname) ) {clickEvent = classname; classname = '';}
				
					var btn = $('<button>')
							  .addClass(_popBtnClass).addClass(v.classname)
							  .text(v.label);
					if(v.clickEvent) {btn.on('click', v.clickEvent);}	
					actionPanel.append(btn);
				});
			}
			// Adding max height to content container
			if(o.maxHeight){
				popContent.css('max-height',o.maxHeight);
			}
			
			popBlock = $('<div>').addClass('pop-block');
			
			if(o.closeButton !== false) {
				var closeButton = $('<span>').addClass('pop-btn-close').html('&times;');
				if(o.closeBtnTooltip){closeButton.attr('title',o.closeBtnTooltip);}
				popBlock.append(closeButton);
			}
			
			popBlock.append(popTitle).append(popContent).append(actionPanel);
			popContainer = $('<div>').addClass('pop-container').width(o.width).append(popBlock);
			
			popContainer.css('margin','0 auto');
			if(o.offsetTop >= 0){
				popContainer.css('margin-top',o.offsetTop);
			}
			if(o.responsive === true){
				popContainer.css('max-width','100%');
			}
				
			popHtml = $('<div>').addClass(_popClass).addClass(_id).css('z-index',_zIndex+1).append(popContainer);
			$('body').append(popOverlay);
			$('body').append(popHtml);
		}

		// if external content, first show popup and fetch and directly show data in dom element
		if( o.contentType ||  o.loadUrl ) {
			renderContent();
		}
		
		// Show popup and overlay
		$('.'+_popOverlayClass + '.'+_id).show();
		$('.'+_popClass + '.'+_id).show();
		
		bindEvents();
		recenter();
		
		// Update number of open popups
		_popups_open_count++;
		_popups_open.push(_id);
		_popup_current_id = _id;

		// Adding noscroll to body
		if($('body').not('.noscroll')){$('body').addClass('noscroll');}
		
		return _self;
	};
	
	_self.addButton = function(label, classname, clickEvent){
		var btn = {label: label};
		if($.isFunction(classname)){
			clickEvent = classname;
			classname = '';
		}			
		btn.classname = classname;
		
		if($.isFunction(clickEvent)){
			btn.clickEvent = clickEvent;
		} else {
			btn.clickEvent = _self.close; // if no event, trigger popup close
		}
		o.buttons.push(btn)
		return btn;
	};
	
	// OK Button
	_self.addOKButton = function(clickEvent){
		_self.addButton('OK',clickEvent);
	};
	// Cancel Button
	_self.addCancelButton = function(){
		_self.addButton('Cancel',_self.close);
	};
	// Close Button
	_self.addCloseButton = function(){
		_self.addButton('Close',_self.close);
	};
	
	_self.closePopup = function(e){
		// closing specific popup if given, else 
		popupId = _popup_current_id ? _popup_current_id : _id;
		
		unbindEvents(popupId);
		
		var popWrap = $('.'+_popClass + '.'+popupId),
			popOverlay = $('.'+_popOverlayClass + '.'+popupId);
		
		popWrap.fadeTo(o.fadeSpeed, 0, function() {
			$(this).remove();
		});
		popOverlay.fadeTo(o.fadeSpeed, 0, function() {
			$(this).remove();
		});
		
		_popups_open_count--;
		_popups_open.pop();
		_popup_current_id = _popups_open[_popups_open.length-1];
		if(_popups_open_count == 0) $('body').removeClass('noscroll');

		return false;
	};
	
	// Alias
	_self.show = _self.showPopup;
	_self.close = _self.closePopup;
	
	_self.init();
	
	return this;
	
	//////////////////////////////////////
	// PRIVATE FUNCTIONS
	//////////////////////////////////////
	function windowHeight(){
		return _w.innerHeight || _$w.height();
	}
	
	function windowWidth(){
		return _w.innerWidth || _$w.width();
	}
	
	function bindEvents(){
		// bind close buttons and overlay
		var popWrap = '.'+_popClass + '.'+_id,
			popOverlay = "."+_popOverlayClass + '.'+_id;
					
		$(popWrap).on('click', '.'+_closeClass, _self.close);
		if(o.closeClass){
			o.closeClass = o.closeClass.replace('.', '');
			$(popWrap).on('click', '.'+o.closeClass, _self.close);
		}
		
		if(o.closeButton === true){
			$(popWrap).on('click', '.'+_btnCloseClass, _self.close);
		}
		
		if(o.modal !== true){
			$('body').on('click', popOverlay+', '+popWrap, _self.close);
			$('body').on('click', popWrap + ' .pop-block', function(e){
				e.stopPropagation();
			});
		}
		
		if (o.escClose !== false) {
			enableEscClose();
		}
		// recenter
		_$w.on('resize', recenter);
	}
	
	function unbindEvents(popupId){
		// bind close buttons and overlay
		var popWrap = '.'+_popClass + '.'+popupId,
			popOverlay = "."+_popOverlayClass + '.'+popupId;
			
		// popwrap and overlay click
		$(popOverlay+', '+popWrap).off('click');
		
		// close buttons click
		$(popWrap + '.'+_closeClass).off('click');
		if(o.closeClass){
			$(popWrap + '.' + o.closeClass.replace('.', '')).off('click');
		}
		//escape close
		_d.off('keydown.'+popupId);
	}
	
	function enableEscClose(){
		_d.on('keydown.'+_id, function(e) {
			if (e.which == 27) {  //escape
				e.stopImmediatePropagation();
				_self.close(_popup_current_id);
				return false;
			}
		});
	}
	
	function updateDomContent(content){
		// set content directly into dom wrapper
		var contentContainer = '.'+_popClass + '.'+_id + ' .'+_popContentClass;
		_self.setContent(content);
		$(contentContainer).append(content);
		enableFocus();
		recenter();
	}
	
	function renderContent(){
		if(o.contentType == 'ajax' && o.loadUrl){
			// load URL via ajax
			$.get(o.loadUrl, function(data){
				var content = $('<div class="pop-ajax-wrapper"></div>').append(data);
				updateDomContent(content);
				return false;
			});
			
		} else if (o.contentType == 'iframe' && o.loadUrl){
			var iframe = $('<iframe class="pop-iframe"></iframe>');
				iframe.attr('src', o.loadUrl);
				
				iframe.css({
					'border': 0,
					'width'	: o.iframeWidth,
					'height': o.iframeHeight
				});
				
				updateDomContent(iframe);
				// dynamic height - coming soon
				
		} else if (o.contentType.indexOf('#') == 0){ // if template from #elementId
			var content = $(o.contentType).html();
			updateDomContent(content);
		}
	}
	
	function enableFocus(){
		var popup = '.'+_popClass + ' ' + '.'+_popContentClass;
		if(o.focus === true){
			$(popup).find('input,textarea').first().focus();
		}
	}
	
	function recenter(){
		// if valign is not false and offsetTop is not given
		if( (o.offsetTop !== '' && o.offsetTop >= 0) || o.valign === false ){
			return false;
		}
		// do recenter
		var contentWrap =  '.'+_popClass+'.'+_id + ' .pop-block',
			_content_w = $(contentWrap).outerWidth(),
			_content_h = $(contentWrap).outerHeight();

		_new_top = ((_wH - _content_h)/2)-20;
		_new_top = _new_top > 0 ? _new_top : 0;
		$('.'+_popClass+'.'+_id + ' .pop-container').css('margin-top', _new_top);	
	}
};
window.Popelt = Popelt;
} (jQuery));
