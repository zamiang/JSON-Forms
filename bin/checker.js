"use strict";
/**
 *
 * checks if forms are valid and displays the appropriate error
 */

JSONFORMS.checker = {
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