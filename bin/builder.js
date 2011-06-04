"use strict";
/**
 * 
 * Util functions for forms.js 
 * mostly contains generators for the custom form types we use
 * this is compiled with forms.js and does not need to be loaded separately
 * 
 * + util functions for forms
 * 
 * @function val used to get val out of the dom elements / objects
 *
 * @includes Validator, Checker, Placemaker (yahooapi), OrderedList - maker, Accomplshment - maker, FormUtils
 */


/**
 * 
 * makes a dependent select form
 * [a][b][c]...
 * [a] -> changes ->[b]
 * 
 */
JSONFORMS.builder = {
    parent: JSONFORM,
    MultiLocationForm: {
        initialize: function(formObj){
            this.defaultText = "enter a location";
            this.makeMultiLocationForm(formObj);
        },
        
        makeMultiLocationForm: function(formObj) {
            var this_ = this;
            var orderedListModule = newify(OrderedList, formObj, jQuery("<div><ul></ul></div>"), false);    
            var obj = FormMaker.getObj(orderedListModule, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden);
            
            obj.children().eq(1).append(jQuery('#templates .add').clone().click(
                                            function(event){
                                                this_.addBlankLocationForm(jQuery(this).parent().find('ul'));
                                                this_.makeRemove(obj.find('.remove:last'));
                                            }) );
            
            if (!formObj.val || formObj.val.length < 1) {
                this.addBlankLocationForm(obj.find('ul'));            
            }
            
            this.makeRemove(obj.find('.remove'));
            this.orderedListModule = orderedListModule;
            this.jObj = obj;
        },
        
        addBlankLocationForm: function(obj) {
            var this_ = this;
            var locationobj = jQuery('<div class=\"sortable_item\">' +
                                     '<input type="text" style=\"width:282px;\" value=""/>' +
                                     '<img class="remove" src="/static/img/close.png" />' +
                                     '<img src="/static/img/moveable.png" />' +
                                     '</div>');
            obj.append(locationobj);
            FormMaker.makeLocationDiv(locationobj.find('input'), 
                                      this, 
                                      function(val){ 
                                          this_.setVal(locationobj, val); }); 
        },    

        makeRemove: function(jObj) {
            return jObj.click(function(event){
                                  event.stopPropagation();
                                  jQuery(this).parent().slideUp('slow', function(){ jQuery(this).remove(); });
                              });
        },
        
        setVal: function(jObj, val){
            jObj.data('location', val);
        },

        getVal: function(jObj) {
            return jObj.data('location');
        },
        
        val: function() {
            var arr = [];
            var this_ = this;
            
            this.jObj.find('.sortable_item').each(function(index){     
                                                      var val = this_.getVal(jQuery(this));
                                                      if (val) {
                                                          arr.push(val);                                                                        
                                                      }                                             
                                                  });
            return arr;
        }    
    },

    ComboBox: {
        initialize: function(jObj, vals, currentValue, parent) {    
            var this_ = this;        
            
            /**
             *  EPIC example from jquery ui
             *  'o look how easy it is to create a combo box...'
             * 
             * http://jqueryui.com/demos/autocomplete/#combobox
             */
            jQuery.widget( "ui.combobox", {
                               _create: function() {
                                   var self = this,
			                       select = jObj.find('select').hide(),
			                       selected = select.children( ":selected" ),
			                       value = selected.val() ? selected.text() : "";
                                   
			                       var input = jQuery( "<input>" )
			                           .insertAfter( jObj )
			                           .val( value )
			                           .autocomplete({
					                                     delay: 0,
					                                     minLength: 0,
					                                     source: function( request, response ) {
						                                     var matcher = new RegExp( jQuery.ui.autocomplete.escapeRegex(request.term), "i" );
						                                     response( select.children( "option" ).map(function() {
								                                                                           var text = jQuery( this ).text();
								                                                                           if ( this.value && ( !request.term || matcher.test(text) ) )
									                                                                           return {
										                                                                           label: text.replace(
											                                                                           new RegExp(
												                                                                           "(?![^&;]+;)(?!<[^<>]*)(" +
												                                                                               jQuery.ui.autocomplete.escapeRegex(request.term) +
												                                                                               ")(?![^<>]*>)(?![^&;]+;)", "gi"
											                                                                           ), "<strong>$1</strong>" ),
										                                                                           value: text,
										                                                                           option: this
									                                                                           };
							                                                                           }) );
					                                     },
					                                     select: function( event, ui ) {
						                                     ui.item.option.selected = true;
						                                     self._trigger( "selected", event, {
								                                                item: ui.item.option
							                                                });
					                                     },
					                                     change: function( event, ui ) {
						                                     if ( !ui.item ) {
						                                         var matcher = new RegExp( "^" + jQuery.ui.autocomplete.escapeRegex( jQuery(this).val() ) + "$", "i" ),
						                                         valid = false;
						                                         select.children( "option" ).each(function() {
									                                                                  if ( this.value.match( matcher ) ) {
										                                                                  this.selected = valid = true;
										                                                                  return false;
									                                                                  }
								                                                                  });
						                                     }
					                                     }
					                                 })
				                       .addClass( "ui-widget ui-widget-content ui-corner-left" );
                                   
			                       input.data( "autocomplete" )._renderItem = function( ul, item ) {
		                               return jQuery( "<li></li>" )
				                           .data( "item.autocomplete", item )
				                           .append( "<a>" + item.label + "</a>" )
				                           .appendTo( ul );
			                       };
                                   
			                       jQuery( "<button>▼</button>" )
			                           .attr( "tabIndex", -1 )
			                           .attr( "title", "Show All Items" )
			                           .insertAfter( input )
			                           .button({
					                               icons: {
					                                   primary: "ui-icon-triangle-1-s"
					                               },
					                               text: false
				                               })
			                           .removeClass( "ui-corner-all" )
			                           .addClass( "ui-corner-right ui-button-icon" )
			                           .click(function() {
					                              // close if already visible
					                              if (input.autocomplete( "widget" ).is( ":visible" ) ) {
					                                  input.autocomplete( "close" );
					                                  return;
					                              }
                                                  
					                              // pass empty string as value to search for, displaying all results
					                              input.autocomplete( "search", "" );
					                              input.focus();
				                              });
                               } 
                           });
            return jObj.combobox();
        }
    },

    /**
     *
     * this will make an orderable sortable list
     *
     *
     * @requires jqueryui
     * @requires templates/util/form_templates.html
     *
     * @param listType -- either tag or location
     **/
    OrderedList: {
        initialize: function(section, jObj, allowEdits) {
            var this_ = this;
            this.section = section;
            this.listID = section.id;
            this.listType = section.type;
            this.listItems = section.val;
            this.jObj = jObj;

            jObj.addClass('sortable_cont').html('<ul></ul>').parent().find('.add').remove();
            this.makeSortable(jObj.find('ul'), this.listItems);

            if (allowEdits === undefined) {
                this.makeEditSaveToggle(jObj.find('.edit'));
            } else {
                jObj.find('.edit').hide();
            }

            this.makeRemove(jObj.find('.remove'));
            if (allowEdits !== undefined) {
                return jObj;
            }

            jObj.append(jQuery('#templates .add').clone().click(function(event){
                                                                    event.stopPropagation();
                                                                    this_.makeNewRow(jObj);
                                                                }));

            // add a blank one for geo
            // got to love that an empty list evaluates to true...
            if (!section.val || section.val.length < 1) {
                this.makeNewRow(jObj);
            }

            return jObj;
        },

        makeNewRow: function(jObj) {
            var item = jQuery('#templates .sortable_item').clone().find('.txt').end();
            
            this.makeEditSaveToggle(item.find('.edit'));
            this.makeRemove(item.find('.remove'));
            
            jObj.find('ul').append(item);
            jObj.sortable('refresh');
            
            this.makeEditable(item.parent().find('.txt').last(), item.find('.edit'));            
        },

        makeEditable: function(textJobj, clickedJobj) {
            var this_ = this;
            var val = textJobj.text();

            if (this.listType == 'multi_org_search') {
                textJobj.html('<input type="text" style="width:70%" class=\"placeholder\" placeholder=\"enter the name of an org\" value="' + textJobj.text() + '" />');
                JSONFORMS.setupSearch(textJobj.find('input'), [], function(val){ textJobj.attr({'data-val': val.id }); }, this.section.restrictType);
                
            } else {
                FormMaker.makeComboBox(textJobj, eval(this.listID.toUpperCase() + 'TAGSLIST'), val, this); 
            }

            clickedJobj.text('save');
        },

        makeSortable: function(jObj, items){
            var this_ = this;
            var itemObj = jQuery('#templates .sortable_item');
            var options = { handle: '' };
            var userAgent = navigator.userAgent.toLowerCase();

            jQuery.each(items, function(index, item){
                            if (this_.listType == 'multi_location') {
                                jObj.append(itemObj.clone().data('location', item).find('.txt').text(FormMaker.locationToString(item)).end());
                            }
                            else if (item.name && item.name.length > 0) {
                                jObj.append(itemObj.clone().attr({'data-type': item.type}).find('.txt').text(item.name).end());
                            }
                            else if (this_.section['data-val'] !== undefined) {
                                jObj.append(itemObj.clone().find('.txt').text(item).attr({'data-val': this_.section['data-val'][index]}).end());
                            }
                        });

            return jObj.sortable(options);
        },

        getObj: function() {
            return jQuery('<div class="form_group"><div class="label"><span class="text"></span><div class="tip"></div><div class="help"></div></div></div>').append(this.jObj);
        },

        makeEditSaveToggle: function(jObj) {
            var this_ = this;

            // add handlers for the edit button
            return jObj.click(function(event) {
                                  event.stopPropagation();
                                  var item = jQuery(this);
                                  var type = item.text();
                                  var ti = item.parent().find('.txt');

                                  if (type == 'edit') {
                                      this_.makeEditable(ti, item.parent().find('.edit'));   
                                  } else {
                                      this_._saveEditedTag(item,ti);
                                  }
                              });
        },

        _inputHasValue: function(input) {
            if (!input.val() || input.val().length > 500 || input.val().length < 1 || input.val() == input.attr('placeholder')) {
                return false;
            } 
            return true;
        },

        _saveEditedTag: function(item, ti) {
            if (this.listType == 'multi_org_search') {
                if (!this._inputHasValue(ti.find('input'))) { 
                    return;
                } 
                item.hide(); //.text('edit');
                ti.html(ti.find('input').val());
            } else {
                /** this cancels out stuff not in options
                 var options = ti.parent().find('option').map(function(){ return jQuery(this).text(); }).get();
                 if (options.indexOf(ti.parent().find('input').val()) > -1){                               
                 */
                if (!this._inputHasValue(ti.parent().find('input'))) { 
                    return;
                } 
                item.hide(); //.text('edit');
                ti.html(ti.parent().find('input').val());
                ti.parent().find('input, button').remove();
            }
        },

        makeRemove:function(jObj) {
            return jObj.click(function(event){
                                  event.stopPropagation();
                                  jQuery(this).parent().slideUp('slow', function(){ jQuery(this).remove(); });
                              });
        },

        val:function() {
            var arr = [];
            var this_ = this;
            
            this.jObj.find('.edit').each(function(index, div){ 
                                             if (jQuery(this).text() == 'save'){
                                                 jQuery(this).click();
                                             }
                                         });
            
            this.jObj.find('.txt').each(function(index, div) {
                                            var val;
                                            var jObj = jQuery(div);
                                            
                                            if (jQuery(div).text() && JSONFORMS.Util.trim(jQuery(div).text()).length > 1 && jQuery(div).text().length < 100) {
                                                val = {
                                                    name:jQuery(div).text(),
                                                    tag_rank:index + 1,
                                                    type:this_.listID
                                                };
                                            }
                                            
                                            if ((val && val !== this_.defaultText) && val !== jObj.attr('placeholder')) {
                                                arr.push(val);
                                            }
                                        });
            return arr;
        }
    }
};
