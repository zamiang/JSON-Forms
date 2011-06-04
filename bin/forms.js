"use strict";
/**
 *
 * this module takes a blob of json and builds forms for those items
 * JSON -> Creator which returns a val function and the jquery object for that form
 * the val function calls client side validation and returns error text to be used by the jquery object AND returns 'ERROR'
 *
 * @author Brennan Moore brennan@jumo.com
 * @requires jquery
 * @requires ../lib/util.js
 * 
 * compile script: java -jar compiler.jar --js=forms.src.js --js=forms_util.src.js --js_output_file=forms.js
 */

/**
 * takes json and creates html forms that validate themselves on .val()
 *
 * @requires div #form
 * @requires templates/util/form_templates.html
 * 
 * @param formTypes array of names for each tab of the form
 * @param form object keyed by type JSON for each form
 *
 * @param module A form object containing a val function and a jquery object referencen to that form
 * 
 * @note if there is only one formType it will not display tabs
 * 
 */
JSONFORMS = {
    buildForms: function(formTabs, form, jObj) {
        var this_ = this;
        var forms = [];

        var formHTML = formTabs.map(function(type) { return '<div id="' + type + '"></div>'; } ).join("");
        jObj.html(formHTML);            
        
        formTabs.map(function(type) {
                         var id = '#' + type;
                         var jObjArray = form[type].map(function(section) {
                                                            var module = this_.getModuleForSection(section);
                                                            // hide forms -- but keep their values
                                                            if (section.hide !== undefined) { module.jObj.hide(); }
                                                            
                                                            // set text and tip and help
                                                            module.jObj.find('.text').text(section.name + ":");
                                                            module.jObj.find('.tip').html(section.tip);
                                                            module.jObj.find('.help').html(section.help);
                                                            module.jObj.find('.extra_help').html(section.extra_help);

                                                            module.id = section.id;
                                                            module.type = section.type;
                                                            module.required = section.required;                                                            
                                                            module.sub = section.sub;
                                                            module.placeholder = section.placeholder;
                                                            
                                                            forms.push(module);
                                                            
                                                            return module.jObj;
                                                        });
                         jQuery.fn.append.apply(jObj.find(id), jObjArray);
                         return true;
                     });
        
        return forms;
    },

    setupSearch: function(jObj, items, cont, restrictType) {
        var this_ = this;

        if (!jObj || jObj.length < 1){ return; }

        var placeholder = jObj.attr('placeholder');
        jObj
            .val(placeholder)
            .focus(function(){
                       if (jObj.val() == placeholder) {
                           return jObj.val("").removeClass('placeholder');
                       }
                   })
            .focusout(function(){
                          if (jObj.val().length < 1) {
                              jObj.val(placeholder).addClass('placeholder');
                          }
                      })
            .autocomplete({
                              source: function( request, continuation ) {
                                  jQuery.get('/json/v1/search/onebox', {
                              					 search: request.term,
                              					 restrict_type: restrictType
                              				 }, function(response) {
                                                 this_.timesSearched = this_.timesSearched + 1;
                                                 if (response && response.result) {
                                                     return continuation(response.result);
                                                 }
                                                 return continuation([]);
                                             }, false, function(){});
                              },
                              minLength: 2,
                              open: function() {
                                  jQuery(this).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
                              },
                              close: function() {
                                  jQuery(this).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
                              },
                              /*
                               search: function(){
                               // this is the event that could trigger a 'no results' popup
                               jQuery(this).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
                               },
                               */
                              select: function( event, ui ) {
                                  ui.item.query = jObj.val();
                                  jObj.val( ui.item.name );
                                  cont(ui.item);
                                  return false;
                              }
                          })
            .data( "autocomplete" )._renderItem = function( ul, item ) {
                if (item) {
                    jQuery( "<li class=\"clearfix\"></li>" )
                        .data( "item.autocomplete", item ) 
                        .append(this_.getSearchHtmlForEntity(item))
                        .appendTo( ul );
                    return item;
                }
                return "";
            };
    },


    /**
     * takes the formObj and returns a form module
     *
     * @param formObj { id: 'name', name: 'Org Name', type: 'tweet', required: true, val: '{{ entity["name"] }}' }
     *
     **/
    getModuleForSection: function(formObj){
        var module = {};

        if (formObj.type == 'checkbox') {
            module = this.makeCheckboxForm(formObj);

        } else if (formObj.type == 'location') {
            module = this.makeLocationForm(formObj);

        } else if (formObj.type == 'org_search') {
            module = this.makeOrgSearchForm(formObj);

        } else if (formObj.type == 'multi_org_search') {
            module = this.makeMultiOrgSearchForm(formObj);

        } else if (formObj.type == 'list') {
            module = this.makeListForm(formObj);

        } else if (formObj.type == 'multi_location') {
            module = this.makeMultiLocationForm(formObj);

        } else if (formObj.type == 'radio') {
            module = this.makeRadioForm(formObj);

        } else if (formObj.type == 'accomplishments') {
            module = this.makeAccomplishmentsForm(formObj);

        } else if (formObj.type == 'select') {
            module = this.makeSelectForm(formObj);

        } else if (formObj.type == 'statistics') {
            module = this.makeStatisticsForm(formObj);

        } else if (formObj.type == 'dependent_select') {
            module = this.makeDependentSelectForm(formObj);

        } else if (formObj.type == 'text') {
            module = this.makeTextForm(formObj);

        } else if (formObj.type == 'multi_select') {
            module = this.makeMultiSelect(formObj);

        } else if (formObj.type == 'password') {
            module = this.makePasswordForm(formObj);

        } else {
            module = this.makeTweetForm(formObj);
        }

        return module;
    },

    /**
     *
     * MAKERS
     * @returns a object with a jquery object to be appended and a val function to get the val out of the jquery object
     *
     */

    makeSelectForm: function(formObj) {
        var jObj = jQuery('#templates .select_form').clone();
        jObj.find('select').append(this._makeSelectOptions(formObj.options, formObj.val));
        jObj.find('input').val(formObj.val);

        return {
            jObj: jObj,
            val:  function() { return this.jObj.find('select').val(); }
        };
    },

    makeStatisticsForm: function(formObj){
        var module = Util.newify(Accomplishment, jQuery('#templates .accomplishments').clone(), formObj.name, formObj.val, 'statistics');

        return {
            jObj: this.getObj(module, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden),
            val: function() { return module.val(); }
        };
    },

    makeAccomplishmentsForm: function(formObj){
        var module = Util.newify(Accomplishment, jQuery('#templates .accomplishments').clone(), formObj.name, formObj.val);

        return {
            jObj: this.getObj(module, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden),
            val: function() { return module.val(); }
        };
    },

    makeListForm: function(formObj){
        var module = Util.newify(OrderedList, formObj, jQuery("<div><ul></ul></div>"));

        return {
            jObj: this.getObj(module, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden),
            val: function() {
                if (module.val() !== undefined && module.val().length > 0) {
                    return module.val();                                     
                }
                return [];
            }
        };
    },

    makeTweetForm: function(formObj) {
        var jObj;
        var max = formObj.max_length || 200;
        
        if (formObj.counter !== undefined) {
            jObj = jQuery('#templates .text_form').clone();
            jObj.find('.editable').css({height:'94px'}).html(formObj.val);
            
            Util.makeCharCountDiv(jObj.find('.editable'), jObj.find('.tip'), max);
        } else {
            jObj = jQuery('#templates .tweet_form').clone();
            jObj.find('input').val(Util.trim(String(formObj.val)));
        }

        jObj.attr({ 'data-max': max });

        if ((!formObj.val) && formObj.placeholder !== undefined) {                             
            jObj.find('input:eq(0)').attr('placeholder', formObj.placeholder);
            jObj.find('input:eq(0)').val(formObj.placeholder);
            jObj.find('input:eq(0)').addClass('placeholder');
        }
        
        return { jObj: jObj,
                 val: function() {
                     if (this.jObj.find('input').val()) {
                         if (this.jObj.find('input').val() != this.jObj.find('input').attr('placeholder')) {
                             return this.jObj.find('input').val();
                         }
                         return '';
                     } else {
                         if (this.jObj.find('.editable').text() != this.jObj.find('.editable').attr('placeholder')) {
                             return this.jObj.find('.editable').text();
                         }
                         return '';
                     }                     
                 }
               };
    },

    makeLocationForm: function(formObj) {
        var jObj;
        var this_ = this;
        var locString = this.locationToString(formObj.val);

        // TODO refactor this one
        if (locString !== undefined) {
            this_.locationVal = formObj.val;

            jObj = jQuery('#templates .location_form').clone();
            jObj.find('.loc .location_string').text(locString);

        } else {
            jObj = jQuery('#templates .tweet_form').clone();
            this.makeLocationDiv(jObj.find('input'), this);
        }

        if ((!formObj.val) && formObj.placeholder !== undefined) {                             
            jObj.find('input:eq(0)').attr('placeholder', formObj.placeholder);
            jObj.find('input:eq(0)').val(formObj.placeholder);
            jObj.find('input:eq(0)').addClass('placeholder');
        }

        return {
            jObj: jObj,
            val: function() {
                if (this_.locationVal == this.jObj.find('input').attr('placeholder')) {
                    return '';
                } 
                return this_.locationVal;
            }
        };
    },

    makeOrgSearchForm: function(formObj) {
        var jObj;
        var this_ = this;

        jObj = jQuery('#templates .tweet_form').clone();

        // @param 1: input div, 2: data, 3: continuation for selected val
        JSONFORMS.setupSearch(jObj.find('input'), [], function(val){ 
                             formObj['data-val'] = val.id;
                         }, formObj.restrictType);

        jObj.find('input').val(formObj.val);

        return {
            jObj: jObj,
            val: function() { 
                if (this.jObj.find('input').val()) {
                    return [formObj['data-val']]; 
                } else {
                    return [];
                } 
            }
        };
    },

    makeMultiOrgSearchForm: function(formObj) {
        var module = Util.newify(OrderedList, formObj, jQuery("<div><ul></ul></div>"));

        return {
            jObj: this.getObj(module, formObj.id, formObj.name, formObj.tip, formObj.help, formObj.hidden),
            val: function() { return module.val(); }
        };
    },

    makeCheckboxForm: function(formObj){
        var jObj = jQuery('#templates .checkbox').clone();

        if (formObj.text !== undefined) { jObj.append(formObj.text); }
        if (formObj.val != 'False') { jObj.find('input').attr('checked',true); }

        return {
            jObj: jObj,
            val: function() {
                return jObj.find("input['type=checkbox']:checked").length > 0 ? true : false;
            }
        };
    },

    makeRadioForm: function(formObj){
        var jObj = jQuery('#templates .radio_form').clone();

        if (formObj.help !== undefined) {
            jObj.find('.help').val(formObj.help);
        }

        jObj.find('.radio_group').append(this._makeRadioOptions(formObj.options, formObj.val, formObj.name));

        return {
            jObj: jObj,
            val: function() { return jObj.find('input[type=radio]:checked').val(); }
        };
    }, 

    makePasswordForm: function(formObj) {
        var jObj = jQuery('#templates .password_form').clone();

        return {
            jObj: jObj,
            val: function() {
                if (jObj.find('input').val()) {
                    return jObj.find('input').val();
                }
                return undefined;
            }
        };
    },

    makeTextForm: function(formObj) {
        var jObj = jQuery('#templates .text_form').clone();
        var editable = jObj.find('.editable');

        if ((!formObj.val) && formObj.placeholder !== undefined) {                             
            editable.attr('placeholder', formObj.placeholder);
            editable.text(formObj.placeholder);
            editable.addClass('placeholder');
        } else {
            editable.html(formObj.val);
        }

        editable.bind('focus unfocus', function(evt) {                          
                          Util.fixPlaceHolder(jQuery(this), evt.type);
                      });

        return {
            jObj: jObj,
            val: function() {
                if (editable.text() == editable.attr('placeholder')) {
                    return '';
                }
                return editable.text();
            }
        };
    },

    _makeRadioOptions: function(options, selectedVal, name){
        return options.map(function(option) { return "<input type='radio' " + "name='" + name + "' " +
                                              (option.val == selectedVal ? 'checked' : "") + 
                                              (option.val ? ' value="' + option.val + '"' : "") + "/>" +
                                              (option.name || option.val); }).join(''); 
    },
    
    _makeSelectOptions: function(options, selectedVal) {
        return options.map(function(option) { return "<option " +
                                              (option.val == selectedVal ? 'selected' : "") + 
                                              (option.val ? ' value="' + option.val + '"' : "") + ">" + 
                                              (option.name || option.val) + "</option>"; }).join('');

    },

    _makeSelectForm: function(options, selectedVal) {
        return jQuery('<select style="width:100%">' +
                      '<option></option>' + 
                      this._makeSelectOptions(options, selectedVal) +
                      "</select>");
    },

    makeDependentSelectForm: function(formObj) {        
        return Util.newify(DependentSelect, formObj);
    },

    makeMultiLocationForm: function(formObj) {        
        return Util.newify(MultiLocationForm, formObj);
    },

    makeMultiSelect: function(formObj) {
        var select = this._makeSelectForm(formObj.options, formObj.val);
        var extraSelect = formObj.val && formObj.val.length > 0 ? "" : select.clone().val('');

        var jObj = jQuery('<div class="form_group"><div class="label">'
                          + formObj.name
                          + '</div><div class=\"sel\" style="display:inline-block; width:30%;"></div>');

        jQuery.fn.append.apply(jObj.find('.sel'),
                               formObj.val.map(function(val){
                                                   var obj = select.clone();
                                                   obj.val(val + "");
                                                   return obj;
                                               })
                              )
            .append(extraSelect)
            .append(jQuery('#templates .add').clone().click(
                        function(event){
                            event.stopPropagation();
                            jQuery(this).before(select.clone());
                        }) );

        return {
            jObj: jObj,
            val: function() {
                return jObj.find('select').map(function(item){
                                                   var val = jQuery(item).val();
                                                   return val || undefined;
                                               });
            }
        };
    },

    editLocation: function(div) {
        this.locationEdited = true;
        var jObj = jQuery(div).parent().html('<input id="m_location" type="text" style=\"width:282px;\" value=""/>');
        this.parent.locationVal = {};
        this.makeLocationDiv(jObj.find('input'), this.parent);
    },

    /**
     * make location div
     * @param parent requires a setLocationVal method
     * @requires checker
     */
    makeLocationDiv: function(jObj, parent, cont) {
        var this_ = this;
        cont = cont || function(val){ return parent.setLocationVal(val, jObj); };
        
        jObj.autocomplete({
		                      source: function( request, response ) {
                                  Checker.getLocationForString(request.term,
                                                               function(locations){
                                                                   Checker.clearError(jObj);
                                                                   response(locations);
                                                               },
                                                               function(v){ 
                                                                   // todo -- make this display a no results found thing
                                                                   response([]);
                                                               });
			                  },
			                  minLength: 2,
	                          focus: function( event, ui ) {
				                  jObj.val(this_.locationToString(ui.item));
                                  return false;
	                          },
                              open: function() {
				                  jQuery(this).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
			                  },
			                  close: function() {
				                  jQuery(this).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
			                  },
			                  select: function( event, ui ) {
                                  Checker.clearError(jObj);
				                  jObj.val(this_.locationToString(ui.item));
                                  cont(ui.item);
				                  return false;
			                  }
                          }).data( "autocomplete" )._renderItem = function( ul, item ) {
			                  jQuery( "<li></li>" )
				                  .data( "item.autocomplete", item )
				                  .append("<a>" + this_.locationToString(item) + "</a>")
				                  .appendTo( ul );
                              return item;
		                  };
    },

    locationToString: function(location){
        var result = "";

        if (!location)  { return ""; }

        var raw_geodata;
        try {
            if (JSON && JSON.parse && location.raw_geodata){
                raw_geodata = JSON.parse(location.raw_geodata);
                if (raw_geodata && raw_geodata.raw_geodata) {
                    raw_geodata = JSON.parse(raw_geodata.raw_geodata);
                    if (raw_geodata && raw_geodata.raw_geodata) {
                        raw_geodata = JSON.parse(raw_geodata.raw_geodata);
                    }
                }
            }            
        } catch (x) {
            // FUCK THE WORLD 
            // ie7 fails due to 'syntax error'
        }

        if (location.name && location.name != location.locality) {
            result += location.name + " ";

        } else if (raw_geodata && raw_geodata.name && raw_geodata.name != location.locality && raw_geodata.name != location.region && raw_geodata.name != location.country_name) {
            result += raw_geodata.name + " ";

        } else if (location.locality) {
            result += location.locality + ", ";
        }
        
        if (location.region && location.region != location.name) {
            result += location.region + " ";
        } 

        if (location.country_name && location.country_name != location.name) {
            result += location.country_name;
        } 
        
        if (location.type) {
            result += " (" + location.type + ")";
        }
        
        return Util.trim(result);
    },

    makeComboBox: function(jObj, vals, currentValue, parent){
        // append select boxes
        jObj.html("<select>" + vals.map(function(val) {return '<option value="val"' + (val == currentValue ? "selected" : "") + '>' + val + "</option>"; }) + "</select");

        return Util.newify(ComboBox, jObj, vals, currentValue, parent);
    },
    
    // gets the jquery object from a ui module
    getObj: function(module, id, name, tip, help, isHidden){
        return jQuery('<div class="form_group"' +
                      (isHidden ? "style=\"display:none\"" : "") + '><div class="label">' +
                      '<span class="text">' + name + '</span>' + 
                      '<div class="tip">' + (tip || "") + "</div>" +
                      '<div class="help">' + (help || "") + "</div>" +
                      '</div></div>')
            .append(module.jObj);
    }
};