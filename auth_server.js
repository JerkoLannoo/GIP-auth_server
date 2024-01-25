const express = require('express');
const app = express()
const http = require('http');
var server=http.createServer(app);
var mysql = require('mysql');
const bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
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
app.post("/authenticate", function(req,res){
   // console.log(req.body)
    let datum = new Date().getTime()
    con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>used AND activeDate<="+datum+";", function(err,result){
        if(err){
            console.log(err)
            res.sendStatus(400)
        }
        else if(result.length) {
            con.query("UPDATE beurten SET used=used+1, loginDate="+datum+" WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>used AND activeDate<="+datum+";", function(err,result){
                if(err){
                    console.log(err)
                    res.send(400)
                }
                else {
                    console.log("ok")
                    res.send({result:1, message:"OK"})
                } 
            })
        } 
        else res.send({result:0, message:"Verkeerde gebruikersnaam of wachtwoord."})
    })
})
app.post("/authorize", function(req,res){
    let datum = new Date().getTime()
    console.log(req.body)
    console.log(datum)
    con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+"  AND activeDate<="+datum+";", function(err,result){
        console.log(result)
        if(err){
            console.log(err)
            res.sendStatus(400)
        }
        else if(result.length) {
            var duratief = result[0].time
            console.log("found, duration: "+duratief+" OR data: "+result[0].data)
            if(result[0].adblock&&result[0].data==5) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_5GB_adblock", "time_balance:": "100s"})//time balance is niet gedocumenteerd
            else if(result[0].adblock&&result[0].data==10) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_10GB_adblock", "time_balance:": "100s"})
            else if(result[0].adblock&&result[0].data==15) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_15GB_adblock", "time_balance:": "100s"})
            else if(result[0].data==5) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_5GB", "time_balance:": "100s"})
            else if(result[0].data==15) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_10GB", "time_balance:": "100s"})
            else if(result[0].data==10) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_15GB", "time_balance:": "100s"})
            else if(result[0].adblock) res.send({"access_duration":"1j","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln_adblock", "time_balance:": "100s"})
            else res.send({"access_duration":duratief+"h","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"lln", "time_balance:": "100s"})
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