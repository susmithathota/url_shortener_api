var express = require("express");
var mongo= require("mongodb").MongoClient;

require('dotenv').config({
  silent: true
});

var app= express();

mongo.connect(process.env.MONGO_URI,function(err,db){
    if(err) {
        throw err;
    }
    else{
        console.log('connected to Mongodb on 27017');
    }
    db.createCollection('sites',{
        capped: true,
        size: 5242880,
        max: 5000
    });

app.get('/new/:url*',function(req,res){
    
    var url= req.url.slice(5);
    var urlObj= {};
    if(validateURL(url)){
        urlObj = {
            'original_url': url,
            'short_url' : process.env.APP_ORGURL + genRandom()
        };
        res.send(urlObj);
        save(urlObj,db);
    }
    else{
        res.send({'err':'incorrect url'});
    }
});

app.get('/:url',function(req,res){
    var url= process.env.APP_ORGURL + req.params.url;
    if(url!==process.env.APP_ORGURL+'favicon.ico'){
        findURL(url,db,res);
    }
});

function genRandom(){
    var num= Math.floor(100000 + Math.random()*900000);
    return num.toString().slice(0,4);
}

function save(obj,db){
    var sites= db.collection('sites');
    sites.save(obj,function(err,result){
        if(err) throw err;
        console.log('saved ' + obj);
    });
}

function findURL(urlLink,db,res){
    var sites=db.collection('sites');
    sites.findOne({'short_url':urlLink},function(err,result){
        if(err) throw err;
        if(result){
        console.log('redirecting to ' + result.original_url)
        res.redirect(result.original_url);
        }
        else{
            res.send({'err':'url not found in db'});
        }
    });
}

function validateURL(url){
    var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
}
app.listen(8080,function(){
    console.log('running at 8080');
});

});