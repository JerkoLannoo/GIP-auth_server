const express = require('express');
const app = express()
const http = require('http');
var server=http.createServer(app);
const https = require('https');
var mysql = require('mysql');
const bodyParser = require('body-parser');
const { rejects } = require('assert');
var token;
var passwd = "TG9KNHRJRDhSaUtMcjdueFZRU1RUREU5ZEs3a1Zo"
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var pfcon = mysql.createConnection({
    host: "192.168.100.2",
    user: "pf",
    password: "ARF843U425>D<>[a",
    database:"pf",
    multipleStatements:true
  });
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6IctGip2023",
    database:"gip",
    multipleStatements:true
  });
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
})
//app.use(express.static('/votez/'));
setInterval(() => {
  con.query("SELECT 1;", function (err, result) {
    if (err) console.log(err);
    else console.log("SELECT 1")
  });
}, 3600000);
pfLogin()
setInterval(() => {
    pfLogin()
  }, 10*60*1000);
app.post("/authenticate", function(req,res){
    console.log(req.body)
let datum = new Date().getTime()
return new Promise((resolve, reject)=>{
        con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>used AND activeDate<="+datum+"; SELECT * FROM settings; SELECT * FROM blacklist;",[1,2,3], function(err,result){
            if(err){
                console.log(err)
                reject("Er ging iets mis.")
            }
            else if(!result[0].length) reject("Verkeerde gebruikersnaam of wachtwoord.")
            else if(result[1].length) {
                console.log(result[1])
                var beurten = result[0]
                var users = result[1][0]
                var ban = result[2]
                pfcon.query("SELECT status FROM node WHERE status='reg'", function(err, result){
                    if(err){
                        console.log(err)
                        reject("Er ging iets mis.")
                    }
                    else if(result.length){
                       console.log("registered devices: "+result.length+", max users: "+users+"; verbannen? "+ban.filter(e => e.email === beurten[0].email).length)
                       if(users.max_users>result.length&&users.allow_logins&&ban.filter(e => e.email === beurten[0].email).length==0) resolve(result)
                       else if(ban.filter(e => e.email === beurten[0].email).length>0) reject("Je bent verbannen.")
                       else if(!users.allow_logins) reject("Je kan je momenteel niet inloggen.")
                       else reject("Het netwerk is volzet.")
                    }
                    else if(!result.length) {
                        if(users.allow_logins&&ban.filter(e => e.email === beurten[0].email).length==0) resolve("ok")
                        else if(ban.filter(e => e.email === beurten[0].email).length>0) reject("Je bent verbannen.")
                        else if(!users.allow_logins) reject("Je kan je momenteel niet inloggen.")
                        else reject("Het netwerk is volzet.")
                    }
                    else reject("Er ging iets mis.")
                })
            } 
        })
    }).then(value=>{
        con.query("UPDATE beurten SET used=used+1, loginDate="+datum+" WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>used AND activeDate<="+datum+" LIMIT 1;", function(err,result){//LIMIT 1 neemt alleen de eerste rij
            if(err){
                console.log(err)
                reject("Er ging iets mis.")
            }
            else {
                console.log("ok")
                res.send({result:1, message:"OK"})
            } 
        })
    }).catch(err=>{
        res.send({result:0, message:err})
    })
})
app.post("/authorize", function(req,res){
    let datum = new Date().getTime()
    con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+"  AND activeDate<="+datum+";", function(err,result){
        if(err){
            console.log(err)
            res.sendStatus(400)
        }
        else if(result.length) {
            var duratief = result[0].time
            console.log("found, duration: "+duratief+" OR data: "+result[0].data)
            if(result[0].adblock&&result[0].data==5) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_5GB_adblock", "time_balance:": "100s"})//time balance is niet gedocumenteerd
            else if(result[0].adblock&&result[0].data==10) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_10GB_adblock", "time_balance:": "100s"})
            else if(result[0].adblock&&result[0].data==15) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_15GB_adblock", "time_balance:": "100s"})
            else if(result[0].data==5) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_5GB", "time_balance:": "100s"})
            else if(result[0].data==15) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_10GB", "time_balance:": "100s"})
            else if(result[0].data==10) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_15GB", "time_balance:": "100s"})
            else if(result[0].adblock) res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_adblock", "time_balance:": "100s"})
            else res.send({"access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln", "time_balance:": "100s"})
            setTimeout(() => {
                if(result[0].data!=null){
                    setData(req.body.mac, result[0].data, function(success){
                        console.log(success)
                })
                }
                else{
                    setTime(req.body.mac, result[0].time, function(success){
                        console.log(success)
                    })
                }
            }, 2000);
        }
        else {
            console.log("NOT FOUND")
            res.send(400)
        } 
    })
})
server.listen(8000, ()=>{
  console.log("luisteren ")
})
function setData(mac, data,callback){
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
          console.log("token: "+token + ", mac: "+mac)
          let jsondata={
            'bandwidth_balance':data*1024*1024*1024
          }
          console.log(jsondata)
          var options = {
            host: '192.168.100.2',
            path: "/api/v1/node/"+mac,
            port: 9999,
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization' : token
            }
          }
          var httpreq = https.request(options, function (response) {
           // response.setEncoding('utf8');
           console.log(response.statusCode +" "+ response.statusMessage)
           if(response.statusCode==200){
           callback(true)
           }
           else  callback("") 
           response.on("error", ()=>{
            callback("") 
           })
          });
          httpreq.end(JSON.stringify(jsondata))
  }
  function setTime(mac, time,callback){
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      console.log("token: "+token + ", mac: "+mac)
      let jsondata={
        'time_balance':time*3600
      }
      console.log(jsondata)
      var options = {
        host: '192.168.100.2',
        path: "/api/v1/node/"+mac,
        port: 9999,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization' : token
        }
      }
      var httpreq = https.request(options, function (response) {
       // response.setEncoding('utf8');
       console.log(response.statusCode +" "+ response.statusMessage)
       if(response.statusCode==200){
       callback(true)
       }
       else  callback("") 
       response.on("error", ()=>{
        callback("") 
       })
      });
      httpreq.end(JSON.stringify(jsondata))
}
  function pfLogin (){
    console.log("logging in")
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    data={"username":"admin", "password": "Gip"}
    var options = {
      host: '192.168.100.2',
      path: "/api/v1/login",
      port: 9999,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }}
    var httpreq = https.request(options, function (response) {
      response.setEncoding('utf8');
      console.log(response.statusCode)
      response.on('data', (d) => {
        let res = JSON.parse(d)
        console.log("loged in, token:" +res.token)
        token = res.token
      });
      response.on('error', (d) => {
      });
  })
    httpreq.end(JSON.stringify(data))
  }