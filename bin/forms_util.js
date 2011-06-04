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
var DependentSelect = {
    initialize: function(formObj){
        var categories = TOP_LEVEL_CATEGORIES || [];
        var subCategories =  ORG_SUB_CATEGORIES || [];
        var issues = ORG_ISSUES || [];

        subCategories = subCategories.sort(function(a,b) { 
                                               // AHHH why are the property names capitalized in these structures WTF?
                                               if (a && b && b.text && a.text && b.text[0] && a.text[0]) {
                                                   return b.text[0].toLowerCase() < a.text[0].toLowerCase();                                                    
                                               }
                                               return false;
                                           });
        
        this.makeDependentSelectForm(formObj, categories, subCategories, issues);
    },
    
    /** todo: refactor */
    makeDependentSelectForm: function(formObj, categories, subCategories, issues) {
        var this_ = this;
        var mapper = this.getMapper(issues, subCategories);
        var select = this._makeDependentSelectForm(categories, formObj.val);        
        var jObj = this.getJobj(formObj.name);       
        var orderedListModule = JUMO.Util.newify(OrderedList, formObj, jQuery("<div><ul></ul></div>"), false);    
        var obj = FormMaker.getObj(orderedListModule, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden);
        
        obj.children().eq(1).append(jQuery('#templates .add').clone().click(
                                        function(event){
                                            this_._addBlankDependentSelectForm(select, subCategories, issues, jQuery(this).parent().find('ul'));
                                            this_.makeRemove(obj.find('.remove:last'));
                                        }) );
        
        if (!formObj.val || formObj.val.length < 1) {
            this._addBlankDependentSelectForm(select, subCategories, issues, obj.find('ul'));            
        }
        
        this.makeRemove(obj.find('.remove'));
        this.orderedListModule = orderedListModule;
        this.jObj = obj;
    },

    getJobj: function(name) {
      return jQuery('<div class="form_group"><div class="label">' + 
                    name + 
                    '</div><div class=\"sel\" style="width: 80%; display:inline-block; "></div>');        
    },
    
    getMapper: function(issues, subCategories) {
        var mapper = {};
        issues.map(function(issue){ 
                       if (mapper[issue.value.toLowerCase()] === undefined) {
                           mapper[issue.value.toLowerCase()] = {};
                           mapper[issue.value.toLowerCase()].subcategory = issue.when.toLowerCase();
                           
                           subCategories.map(function(subCategory){
                                                 if (issue.when.toLowerCase() == subCategory.value.toLowerCase()) {
                                                     mapper[issue.value.toLowerCase()].category = subCategory.when.toLowerCase();                                                     
                                                 }                                                 
                                             });
                       }
                   });
        return mapper;
    },

    _makeDependentSelectForm: function(options, selectedVal) {
        return jQuery('<div class=\"sortable_item dependent\">' +
                      '<select>' + this._makeDependentSelectOptions(options, selectedVal) + '</select>' + 
                      '<select class="dms_subcategory"></select>' +
                      '<select class="dms_issue"></select>' +
                      '<img class="remove" src="/static/img/close.png" />' +
                      '<img src="/static/img/moveable.png" />' +
                      '</div>');        
    },
    
    _makeDependentSelectOptions: function(options, selectedVal) {
        return options.map(function(option) { 
                               return "<option " + 
                                   (option == selectedVal ? 'selected' : "") + 
                                   (option ? ' value="' + option.toLowerCase() + '"' : "") + ">" +
                                   (option) + "</option>"; }).join(''); 
    },    

    _addBlankDependentSelectForm: function(select, subCategories, issues, obj) {
        var jObj = select.clone();
        var selectObj = jObj.find('select');
        jQuery(selectObj[1]).cascade(jQuery(selectObj[0]), {
                                         list : subCategories,
                                         template: function(item) { return '<option value="' + item.value.toLowerCase() + '">' + item.text + '</option>'; },
                                         match: function(val) { return val ? this.when.toLowerCase() == val.toLowerCase() : false; }
                                     });
        
        jQuery(selectObj[2]).cascade(jQuery(selectObj[1]), {
                                         list : issues,
                                         template: function(item) { return '<option value="' + item.value.toLowerCase() + '">' + item.text + '</option>'; },
                                         match: function(val) { return val ? this.when.toLowerCase() == val.toLowerCase() : false; }
                                     });        
        obj.append(jObj);
    },
    
    
    makeRemove: function(jObj) {
        return jObj.click(function(event){
                              event.stopPropagation();
                              jQuery(this).parent().slideUp('slow', function(){ jQuery(this).remove(); });
                          });
    },
    
    val: function() {
        var arr = [];
        var this_ = this;
        this.jObj.find('.dms_issue').each(function(index){                                              
                                              if (jQuery(this).val() && JUMO.Util.trim(jQuery(this).val()).length > 1 && jQuery(this).val().length < 100) {                                                  
                                                  var val = {
                                                      name: jQuery(this).val(),
                                                      tag_rank:index + 1,
                                                      type:'context'
                                                  };

                                                  if ((val.name !== this_.defaultText) && val.name !== null) {
                                                      arr.push(val);
                                                  }
                                              }
                                          });
        
        arr = arr.concat(this.orderedListModule.val());
        return arr;
    }    
};

var MultiLocationForm = {
    initialize: function(formObj){
        this.defaultText = "enter a location";
        this.makeMultiLocationForm(formObj);
    },
    
    makeMultiLocationForm: function(formObj) {
        var this_ = this;
        var orderedListModule = JUMO.Util.newify(OrderedList, formObj, jQuery("<div><ul></ul></div>"), false);    
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
};


var ComboBox = {
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
};

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

var OrderedList = {
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
            JUMO.setupSearch(textJobj.find('input'), [], function(val){ textJobj.attr({'data-val': val.id }); }, this.section.restrictType);
            
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

                                        if (this_.listType == 'multi_org_search') {
                                            val = jObj.attr('data-val'); //.length < 100 ? jObj.attr('data-val') : undefined;
                                            
                                        } else {   
                                            if (jQuery(div).text() && JUMO.Util.trim(jQuery(div).text()).length > 1 && jQuery(div).text().length < 100) {
                                                val = {
                                                    name:jQuery(div).text(),
                                                    tag_rank:index + 1,
                                                    type:this_.listID
                                                };
                                            }
                                        }
                                        
                                        if ((val && val !== this_.defaultText) && val !== jObj.attr('placeholder')) {
                                            arr.push(val);
                                        }
                                    });
        return arr;
    }
};


/**
 *
 * this will make an accomplishment
 *
 * @requires jqueryui
 * @requires templates/util/form_templates.html
 **/

/**
 jObj.addClass('sortable_cont').html('<ul></ul>').parent().find('.add').remove();
 this.makeSortable(jObj.find('ul'), this.listItems);
 
 this.makeRemove(jObj.find('.remove'));
 
 jObj.append(jQuery('#templates .add').clone().click(function(event){
 jObj.sortable('refresh'); 
 **/

var Accomplishment = {
    // todo: make display default vals
    initialize: function(jObj, name, vals, type) {
        this.name = name;
        this.vals = vals;
        if (type) this.type = type;
        this.jObj = jObj;

        // cleanup vals
        jObj.find('input').val('');

        this.build(vals, jObj.find('ul li'));
        this.setupClick(jObj);

        jObj.find('.year').attr({placeholder:'number'});

        this.jObj.addClass('sortable_cont');
        this.makeSortable(this.jObj.find('ul'));          
        this.makeRemove(this.jObj.find('.remove'));
        
        return this.jObj;
    },
    
    setupClick: function(jObj) {
        var this_ = this;
        
        jObj.append(jQuery('#templates .add').clone().click(function(event){
                                                                event.stopPropagation();

                                                                var newObj = jQuery(jQuery(this).parent().find('.acc_sect')[0]).clone();

                                                                this_.makeRemove(newObj.find('.remove'));
                                                                newObj.find('input').val('').end();

                                                                jObj.find('ul').append(newObj);
                                                                jObj.sortable('refresh');
                                                            }));
    },

    build: function(vals, jObj) {
        vals.map(function(val) {
                     if (val !== undefined && val.year !== undefined) {
                         var newObj = jQuery('#templates .acc_sect:eq(0)').clone();
                         newObj.find('.year').val(val.year);
                         newObj.find('.tweet').val(val.text);

                         jObj.before(newObj);
                     }
                 });
    },
    
    makeSortable: function(jObj){
        var this_ = this;
        var options = {
            handle: '',
            update: function(event, ui) { }
        };

        var userAgent = navigator.userAgent.toLowerCase();
        
        // fix for firefox fail
        if (userAgent.match(/firefox/)) {
            options.start = function (event, ui) { ui.item.css('margin-top', jQuery(window).scrollTop() ); };
            options.beforeStop = function (event, ui) { ui.item.css('margin-top', 0 ); };
        }

        jObj.find('input').focus(function(){ 
                                     jQuery(this).removeClass('placeholder');
                                 });
        
        return jObj.sortable(options);
    },

    makeRemove:function(jObj) {
        return jObj.click(function(event){
                              jQuery(this).parent().slideUp('slow', function(){ jQuery(this).remove(); });
                          });
    },

    getText: function(jObj) {
        if (!jObj.find('.tweet').val()) {
            Checker.showError(jObj, 'Please enter a description', 'accomplishments');
            return false;
        }
        if (jObj.find('.tweet').val() == jObj.find('.tweet').attr('placeholder')) {
            return false;
        }
        return Checker.checkTweet(jObj.find('.tweet'), jObj.find('.tweet').val(), 'Text', 'tweet', true);
    },

    getYear: function(jObj) {                              
        var type = 'number';

        if (!jObj.find('.year').val() || jObj.find('.year').val() == 'year' || jObj.find('.year').val() == 'number') {
            Checker.showError(jObj, 'Please enter a ' + type, 'accomplishments');
            return false;
        }
        if (jObj.find('.year').val() == jObj.find('.year').attr('placeholder')) {
            return false;
        }

        return Checker.checkTweet(jObj.find('.year'), jObj.find('.year').val(), 'Year', 'year', true);
    },

    val:function(){
        var arr = [];
        var this_ = this;
        var noError = true;

        this.jObj.find('.acc_sect, .acc_sect_temp').each(function(index, div){
                                                             var jObj = jQuery(div);
                                                             if (!jObj.find('.year').val() && !jObj.find('.tweet').val()){
                                                                 return;
                                                             }
                                                             
                                                             var text = this_.getText(jObj);
                                                             var year = this_.getYear(jObj);
                                                             
                                                             if (text && year && text != "a short 200 character description") {
                                                                 arr.push({
                                                                              text:text,
                                                                              year:year,
                                                                              link:""
                                                                          });
                                                                 return;
                                                             }
                                                             noError = false;
                                                         });
        return noError ? arr : false;
    }
};


/**
 * utils for validating various types of data
 *
 * each function return a bool
 */

var Validator =  {
    isValidEmail: function(value) {
        // by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
    },

    isValidUrl: function(value) {
        // by Scott Gonzalez: http://projects.scottsplayground.com/iri/
        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
    },

    // going to use for images
    // http://docs.jquery.com/Plugins/Validation/Methods/accept
    accept: function(value, element, param) {
        param = typeof param == "string" ? param.replace(/,/g, '|') : "png|jpe?g|gif";
        return this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
    },

    isValidCreditCard: function(cardnum){
        /**
         * @author Ron Olson (keepberthasurfin@hotmail.com)
         * This script and many more are available free online at
         * The JavaScript Source!! http://javascript.internet.com
         *
         * @author Brennan Moore (brennan@jumo.com) modified this
         *
         **/

        cardnum = cardnum.split(' ').join('');

        if (cardnum === undefined || cardnum.length < 1 || cardnum.length > 19){ return false; }

        var revNum = JUMO.Util.reverse(String(cardnum));
        var total = 0;
        var temp = 0;
        var splitstring = "";

        for (var i = 0; i < revNum.length; i++) {
            temp = 0;
            if (i % 2) {
                temp = revNum.substr(i, 1) * 2;
                if (temp >= 10) {
                    splitstring = String(temp);
                    temp = parseInt(splitstring.substr(0, 1), 10) + parseInt(splitstring.substr(1, 1), 10);
                }
            }
            else temp = revNum.substr(i, 1);
            total += parseInt(temp, 10);
        }
        // if there's no remainder, we return true
        return (total % 10) ? false : true;
    },

    isValidYear: function(value) {
        return /^[12][890][0-9][0-9]$/.test(value);
    },

    isValidName: function(value) {
        return /^[\w ]+$/i.test(value);
    },

    /** @obfiscated */
    isValidString: function(value) {
        // the last character here is weird non ascii (’) -- it appears when copying and pasting from websites
        return /^[\w \d \. \, \' \" \: \@ \; \? \- \# \– \% \& \( \) \! \s \: \; \- \! \r \+ \/ \* \— \’]+$/i.test(value);
    },

    isValidNumber: function(value){
        return JUMO.Util.isNumeric(value);
    },
    
    isValidFbid: function(value){
        return JUMO.Util.isNumeric(value);
    },                     
    
    isValidEINNumber: function(value){
        return JUMO.Util.isNumeric(value) && String(value).length < 10 && String(value).length > 8;
    },

    isValidInternationalNumber: function(value) {
        return true;
        //return /^\+(?:[0-9] ?){6,14}[0-9]$/.test(value);
    },

    isValidPhoneNumber: function(value) {
        return true;
        //return /^(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value);
    },

    isAlphanumeric: function(value) {
        return /^\w+$/i.test(value);
    }
};


/**
 *
 *
 */
var FormUtils = {
    normalizeTwitterId: function(url_string) {  
        try {
            return url_string
                .replace("http://", "")
                .replace("https://", "")
                .replace("www.","")
                .replace("twitter","")
                .replace(".com/","")
                .replace(".com","")
                .replace("@","");            
        } catch (x) {
            return "";
        }
    },    
    
    clearDefault:function(element, defaultValue) {
        if (jQuery(element).val() == defaultValue) {
            jQuery(element).val('');
            jQuery(element).removeClass('placeholder');
        }
    },
    
    getInputs: function(formID) {
        return jQuery('#' + formID + ' input');
    },

    restoreDefault: function(element, defaultValue) {
        if (!jQuery(element).val() || jQuery(element).val() === '') {
            jQuery(element).val(defaultValue);
            jQuery(element).addClass('placeholder');
        }
    },

    checkAll: function() {
        jQuery('input:checkbox').each(function() {
                                          jQuery(this).attr('checked', true);
                                      });
    },

    uncheckAll: function() {
        jQuery('input:checkbox').each(function() {
                                          jQuery(this).attr('checked', false);
                                      });
    },

    attachFormDefaults: function() {
        var this_ = this;
        var inputs = jQuery('input, textarea');
        inputs.each(function(i, el) {
                        jQuery(this).focus(function() {
                                               FormUtils.clearDefault(jQuery(this), jQuery(this).attr('placeholder'));
                                           });
                        jQuery(this).blur(function() {
                                              FormUtils.restoreDefault(jQuery(this), jQuery(this).attr('placeholder'));
                                          });
                        this_.restoreDefault(this);
                    });
    },
    setCursor: function(node,pos) {                         
        var node = ((typeof node == "string") || (node instanceof String)) ? document.getElementById(node) : node;
        
        if (!node) {
            return false;
        } else if (node.createTextRange){
            var textRange = node.createTextRange();
            textRange.collapse(true);
            textRange.moveEnd(pos);
            textRange.moveStart(pos);
            textRange.select();
            return true;
        } else if (node.setSelectionRange){
            node.setSelectionRange(pos,pos);
            return true;
        }
        
        return false;
    }
};

/**
 *
 * checks if forms are valid and displays the appropriate error
 */
var Checker = {
    check: function(jObj, val, name, type, required) {
        if (type == 'multi_select') {
            var arr = [];
            jObj.find('select').map(function(index, item){
                                        var val = jQuery(item).val();
                                        if (val && arr.indexOf(val) < 0) {
                                            arr.push(val);
                                        }
                                    });
            return arr;

        } else if (type == 'list') {
            return val;
            
            /* not required and nothing is there */                           
            // this method is broken for empty lists [] changes them to string TODO 
        } else if (!required && (!val || val.length < 1) && type != 'checkbox') {
            return "";

            /* required and empty */
        } else if (required && (!val || val.length < 1) && type != 'checkbox') {

            // special case for statistics and accomplishments
            if (type == 'statistics' || type == 'accomplishments') {
                return val;                               
            }                           

            this.showError(jObj, 'please enter a ' + name, type);
            return false;

        } else if (type == 'name') {
            return this.checkName(jObj, val, name, type, required);

        } else if (type == 'text') {
            val = JUMO.Util.trim(val);
            return this.checkText(jObj, val, name, type, required);

        } else if (type == 'tweet') {
            return this.checkTweet(jObj, val, name, type, required);

        } else if (type == 'fbid') {
            val = this.cleanupNumber(val); 
            return this.checkFbid(jObj, val, name, type, required);

        } else if (type == 'twitterid') {
            return FormUtils.normalizeTwitterId(val); 

        } else if (type == 'ein') {
            val = this.cleanupNumber(val);
            return this.checkEin(jObj, val, name, type, required);

        } else if (type == 'body') {
            return this.checkBody(jObj, val, name, type, required);

        } else if (type == 'url') {
            return this.checkURL(jObj, val, name, type, required);

        } else if (type == 'email') {
            return this.checkEmail(jObj, val, name, type, required);

        } else if (type == 'password') {
            return this.checkPassword(jObj, val, name, type, required);

        } else if (type == 'year') {
            return this.checkYear(jObj, val, name, type, required);

        } else if (type == 'number') {
            val = this.cleanupNumber(val); 
            return this.checkNumber(jObj, val, name, type, required);

        } else if (type == 'location') {
            /* DO NOT USE THIS FOR LOCATIONS */
            return "";

        } else if (type == 'phone') {
            return this.checkPhoneNumber(jObj, val, name, type, required);

        } else if (type == 'checkbox') {
            return val;
        } else {
            return val;
        }
    },
    cleanupNumber: function(val){
        // these messup on isValidNumber
        // TODO MOVE this to check stuff
        return String(val).replace('\n', "").replace('\r', "").replace('\t', "").replace(' ', '');
    },

    checkPassword: function(jObj, val, name, type, required) {
        if (val.length > 6 && val.length < 200) {
            this.unHighlightDiv(jObj);
            return val;        
        }
        this.showError(jObj, 'Your password must be at least 7 characters', type);
        return false;
    },


    checkYear: function(jObj, val, name, type, required) {
        if (Validator.isValidYear(Number(val))) {
            this.unHighlightDiv(jObj);
            return val;
        }

        this.showError(jObj, 'Please enter a valid year like "1986"', type);
        return false;
    },

    checkNumber: function(jObj, val, name, type, required) {
        if (Validator.isValidNumber(val)) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'Please enter a valid number "1234567890"', type);
        return false;
    },


    checkPhoneNumber: function(jObj, val, name, type, isRequired){
        if (Validator.isValidPhoneNumber(val)) {
            this.unHighlightDiv(jObj);
            return String(val);
        } else if (Validator.isValidInternationalNumber(val)) {
            this.unHighlightDiv(jObj);
            return String(val);
        } else {
            this.showError(jObj, 'Please enter a valid phone number like 1-123-456-7890 or +1-541-754-3010', type);
            return false;
        }
    },

    checkName: function(jObj, val, name, type, isRequired) {
        if (val.length > 0 && val.length < 32) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'Please enter a ' + name, type);
        return false;
    },

    _stripHtml: function(text) {
        return jQuery('<div>' + text + '</div>').text();
    },

    stripHtml: function(text) {
        var t = this._stripHtml(text);

        if (this._stripHtml('<\n>') !== '&lt;\n&gt;') {
            return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }
        return t;
    },


    checkText: function(jObj, val, name, type, isRequired) {
        return val;
    },

    checkTweet : function(jObj, val, name, type, isRequired, maxLength) {
        var max = jObj.attr('data-max') || 200;

        if (val.length < max) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'your ' + name + ' must contain less than ' + max + ' characters', type);
        return false;
    },

    checkFbid: function(jObj, val, name, type, isRequired, maxLength) {
        this.unHighlightDiv(jObj);
        return val;        
    },

    checkEin: function(jObj, val, name, type, isRequired, maxLength) {
        if (val) {
            val = val.replace('-', '');            
        }
        
        if (Validator.isValidEINNumber(val)) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'Please enter a valid EIN', type);
        return false;
    },

    checkBody: function(jObj, val, name, type, isRequired) {
        // TODO
        return val;
    },

    checkURL: function(jObj, baseval, name, type, isRequired) {
        // replace https 
        var val = (baseval.indexOf('http://') < 0 && baseval.indexOf('https://') < 0) ? "http://" + baseval : baseval;                       

        if (isRequired && val.length < 1) {
            this.showError(jObj, 'Please enter a ' + name, type);
            return false;
        }
        else if (val.length > 3 && Validator.isValidUrl(val) && val.length < 200) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'Please enter a valid ' + name, type);
        return false;
    },

    checkEmail: function(jObj, val, name, type, isRequired) {
        if (val == "foo@bar.com"){
            this.errorType = type;
            return this.showError(jObj, 'how dare you try to invoke <a href="http://bar.com/" target="_blank">The Foo</a>', type);
        } else if (val.length > 0 && Validator.isValidEmail(val) && val.length < 200) {
            this.unHighlightDiv(jObj);
            return val;
        }
        this.showError(jObj, 'Please enter a valid E-mail address', type);
        return false;
    },


    showError: function(jObj, text, type) {
        this.highlightDiv(jObj);
        this.errorType = type;

        return this.findNotificationDiv(jObj).slideDown(50).append(text + "<br />");
    },
    
    showParsedError: function(jObj, response) {
        var text = JUMO.Util.getParsedErrorText(response);
        this.highlightDiv(jObj);

        return this.findNotificationDiv(jObj).slideDown(50).append(text + "<br />");
    },

    clearError: function(jObj) {
        this.errorType = undefined;
        return this.findNotificationDiv(jObj).html('').hide();
    },

    disableSubmit: function(jObj) {
        jObj.addClass('disabled');
    },

    enableSubmit: function(jObj) {
        jObj.removeClass('disabled');
    },
    // helpers
    highlightDiv: function(jObj) {
        return jObj.addClass('highlight');
    },
    unHighlightDiv: function(jObj) {
        return jObj.removeClass('highlight');
    },
    findNotificationDiv: function(jObj) {
        var noteObj = jObj.parent().parent().find('.notification');
        return noteObj.length > 0 ? noteObj : jQuery(jQuery.find('.submit_spacer .notification'));
    },
    hideNotificationDiv: function(jObj) {
        return this.findNotificationDiv(jObj).slideUp(100).html('');
    },

    /**
     * returns a location object of some sort
     */
    getLocationForString: function(str, cont, errorcont) {
        Placemaker.getPlaces(str, function(resp) {
                                 if (resp) {
                                     if (!JUMO.Util.isArrayLike(resp)) {
                                         resp = [resp];
                                     }
                                     cont(resp
                                          .filter(function(location){ return location.placeTypeName && location.placeTypeName.content == 'State' ? false : true; })
                                          .map(function(location) {
                                                   // NOT USED: 'continent', 'country', 
                                                   var possibleNames = ['locality1', 'locality2', 'admin1', 'admin2', 'admin3', 'country', 'town', 'suburb']; 
                                                   var postal = location.uzip || (location.postal ? location.postal.content : undefined) || ""; 
                                                   
                                                   var loc = {
                                                       name: location.name ? location.name : "",
                                                       latitude: location.centroid ? location.centroid.latitude : "",
                                                       longitude: location.centroid ? location.centroid.longitude : "",
                                                       'postal_code': postal,
                                                       address: location.line1 ? location.line1 : "",
                                                       type: location.placeTypeName && location.placeTypeName.content ? location.placeTypeName.content  : "",
                                                       raw_geodata: location
                                                   };
                                                   
                                                   possibleNames
                                                       .filter(function(name){ return location[name] ? true : false; })
                                                       .map(function(name){
                                                                var type = location[name].type;
                                                                if (type == 'Country') {
                                                                    loc['country_name'] = location[name].content;           
                                                                } else if (type == 'State' || type == 'County' && location[name].content == 'Brooklyn') { // fuck it -- no idea how to generalize this
                                                                    loc.region = location[name].content;           
                                                                } else if (type == 'Local Administrative Area' || type == 'Town') {
                                                                    loc.locality = location[name].content;           
                                                                }
                                                            });
                                                   return loc;                                                       
                                               })
                                         );
                                 }
                             }, errorcont);
    },
    

    /**
     * used by most forms for validation
     *
     * @param form obj w/ keys for each form field {form: {id: "property_name", name:"", type:"tweet", required: bool, jObj: jqueryobject, sub: 'helper text' },...
     */
    validateFormModules: function(entity_id, form){
        var this_ = this;
        var noError = true;
        var obj = {id: entity_id};

        form.map(function(f) {
                     // TODO validate locations
                     if (f && f !== undefined && f.id !== undefined && f.id != 'location') {
                         var val = this_.check(f.jObj, f.val(), f.id, f.type, f.required);
                         
                         if (val !== false || f.type == 'checkbox') {
                             if (f.sub !== undefined) {
                                 if (!obj[f.sub])  {
                                     obj[f.sub] = {};
                                 }
                                 obj[f.sub][f.id] = val;
                                 return;
                             }
                             obj[f.id] = val;
                             return;
                         }                                        
                         noError = false;
                     }
                 });
        
        if (noError) {
            return obj;
        }
        return undefined;                       
    },
    

    /**
     * old way to validate forms -- still used by the donate page
     *
     * @param form obj w/ keys for each form field {form: {id: "property_name", name:"", type:"tweet", required: bool, jObj: jqueryobject, sub: 'helper text' },...
     */
    getValidatedForm: function(obj, form) {
        var this_ = this;
        var noError = true;
        Object.keys(form).map(function(key) {
                                  form[key].map(function(f) {
                                                    // TODO validate locations
                                                    if (f !== undefined && f.id !== undefined && f.id != 'location') {
                                                        var val = this_.check(jQuery(f.div_id), jQuery(f.div_id).val(), f.name, f.type, f.required);
                                                        
                                                        if (val !== false || f.type == 'checkbox') {
                                                            if (f.sub !== undefined) {
                                                                if (!obj[f.sub])  {
                                                                    obj[f.sub] = {};
                                                                }
                                                                obj[f.sub][f.id] = val;
                                                                return;
                                                            }
                                                            obj[f.id] = val;
                                                            return;
                                                            
                                                        } else {
                                                            noError = false;
                                                        }
                                                    }
                                                });
                              });
        if (noError) {
            return obj;
        }
    }
};

/**
 * UTIL
 * interface for Yahoo geo places api
 */

var Placemaker = {
    config: {
        appID: 'Rl9xiX7a'
    },

    /**
     * 
     * @param text string search query 
     */                      
    getPlaces: function(text,cont,errorcont){
        this.cont = cont;
        this.errorcont = errorcont;

        var query ='select * from geo.places where text="' + text.replace(",", "") + '" | sort(field="areaRank", descending="true")';
        var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + '&format=json&callback=Placemaker.retrieve&appid=' + this.config.appID;
        
        var s = document.createElement('script');
        s.setAttribute('src',url);
        document.getElementsByTagName('head')[0].appendChild(s);
    },
    retrieve: function(resp){
        if (resp !== undefined && resp.query !== undefined && resp.query.count > 0) {
            return this.cont(resp.query.results.place);
        }
        return this.errorcont('location fail');
    }
};
