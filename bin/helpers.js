"use strict";
/**
 * Helpers for common form events
 * 
 */

JSONFORMS.helpers = {
    getParsedErrorText: function(response) {
        var text = "There was an error processing your request. Please try submitting again.";

        if (response && response.error) {
            text = '(' + response.error_code + ") " + response.error;
        }
        return text;
    },


    /** 
     * todo: fix up loading images and how forms report state
     */
    addLoadingImg: function(jObj){
        jObj.append('<img class=\"loading\" src="../img/ajax-loader.gif" />').css({opacity:0.5});
    },

    removeLoadingImg: function(jObj){
        jObj.css({opacity:1}).parent().find('.loading, .sm_loading').remove();
    },

    postJSONandDisplayLoading: function(url, args, callback, formJobj, submitJobj) {
        var this_ = this;
        var loadingDiv = this.showLoading(formJobj, submitJobj);

        this.postJSON(url, args, callback, function() {
                          this_.hideLoading(formJobj, submitJobj, loadingDiv);
                      });
    },

    save: function(jObj, cont) {
        try {
            if (jObj.hasClass('disabled')) { return false; }

            this.addLoadingImg(jObj.parent());

            Checker.disableSubmit(jObj);
            Checker.clearError(jObj);

            cont();

        } catch (e) {
            jObj.removeClass('disabled');
            Checker.showError(jObj, JSON.stringify(e));
            this.removeLoadingImg(jObj.parent());
        }
    },

    showHTTPError: function(XMLHttpRequest, textStatus, errorThrown) {
        if (XMLHttpRequest && XMLHttpRequest.status == 404) {
            return;
        } else if (XMLHttpRequest && XMLHttpRequest.status == 502) {
            Modules.Popup.showErrorPopup('Error: you place an incorrectly formed request');
        } else {
            Modules.Popup.showErrorPopup('An unknown error has occured.');
        }
    },

    /**
     *  @param postCallback is used by postJSONandDisplayLoading to return form to normal state
     */
    postJSON: function(url, args, callback, postCallback, errorCont) {
        var this_ = this;
        var getCookie = function(name) {
            var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
            return r ? r[1] : undefined;
        };

        args._xsrf = getCookie("_xsrf");
        jQuery.ajax({
                        type: 'POST',
                        url: '/json/v1/' + url,
                        data: args,
                        success: function(data){
                            try {
                                callback(eval(data));
                                if (postCallback) {
                                    postCallback();
                                }
                            } catch (x) {
                                this_.popup.showErrorPopup(JSON.stringify(x));
                            }
                        },
                        // this wraps the passed errorCont so it is consistent w/ JUMO implementation
                        error: errorCont ? function(){ errorCont(this_.defaultErrorMessage); } : this.showHTTPError,
                        dataType: 'json'
                    });
    },

    initPlaceholder: function(jObj) {
        return jObj.val(jObj.attr('placeholder')).addClass('placeholder');
    },

    fixPlaceHolder: function(jObj, type) {
        var val = this.trim(jObj.val()) || this.trim(jObj.text());
        var placeholder = this.trim(jObj.attr('placeholder'));

        if (type == 'focusin') {
            jObj.removeClass('placeholder');
        }

        if (placeholder == val || (!val && type == 'focus')){
            jObj.val("").removeClass('placeholder').text("");
        } else if ((!val && type == 'focusout') || (!val && type == 'blur')) {
            jObj.val(placeholder).addClass('placeholder').text(placeholder);
        }
    },

    getFormVal: function(jObj) {
        var val = this.trim(jObj.val());
        var placeholder = this.trim(jObj.attr('placeholder'));

        return val == placeholder ? "" : val;
    },

    linkifyTweet: function(text){
        return text.replace(/(^|\s)(@\w+)/gm, '$1<a href="http://twitter.com/$2">$2</a>');
    },

    showhideTabs: function(type, formTypes) {
        type = type.replace(' selected', "");
        type = type.split(' ')[0];
        formTypes.map(function(t) {
                          var jObj = jQuery('#' + t);
                          if (t != type) {
                              jQuery('.' + t).removeClass('selected');
                              jObj.hide(0);
                          } else {
                              jQuery('.' + t).addClass('selected');
                              jQuery(window).scrollTop(0);
                              jObj.show();
                          }
                      });
    },

    getUrlParameterByName: function( name ) {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        if (results == null ) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    },

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
