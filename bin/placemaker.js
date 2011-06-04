"use strict";
/**
 * interface for Yahoo geo places api
 * 
 */

JSONFORMS.placemaker =  {
    config: {
        appID: "Rl9xiX7a"
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
