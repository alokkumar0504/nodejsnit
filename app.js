let express=require('express')
let app=express()
let mongo=require('mongodb');
let MongoClient=mongo.MongoClient;
let dotenv=require('dotenv');
dotenv.config();
let mongoUrl=process.env.mongoLiveURl;
let bodyParser=require('body-parser');
let cors=require('cors');
let port=process.env.PORT || 9800;
let dbobj;

let authkey="Basic9a8f379e87aaf7cb57354db919eb5d00"
function auth(key){
    if(key==authkey){
        return true;
    }
    return false;
}

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); 

// get heart beat
app.get('/',(req,res)=>{
    res.send('welcome to heart beat')
})

//list of city 
app.get('/location',(req,res)=>{
    //let key=req.query.key//both side same variable os destructring
    //let {key}=req.query;
    let key=req.header('allow-toekn')
    if(key== authkey){
        dbobj.collection('location').find().toArray((err,data)=>{
            if(err) throw err;
            res.send(data)
        })
    }
    else{
        console.log('unaunthicated user');
        res.send('unaunthicated user');
    }
    
})

//list of resturant
/*app.get('/resturant',(req,res)=>{
    let key=req.header('allow-toekn')
    if(auth(key)){
        dbobj.collection('ResturantData').find().toArray((err,data)=>{
            if(err) throw err;
            res.send(data)
        })
    }
    else{
        res.send('unathenticated user');
    }
})*/
//list of resturant as basis for state id
app.get('/resturant',(req,res)=>{
    let query={}
    let stateId=Number(req.query.stateId)
   if(stateId){
        query={'state_id':stateId}
   }
        dbobj.collection('ResturantData').find(query).toArray((err,data)=>{
            if(err) throw err;
            res.send(data)
        })
})

//generic get data for all collection.
app.get('/list/:item',(req,res)=>{
    let collName=req.params.item
        dbobj.collection(collName).find().toArray((err,data)=>{
            if(err) throw err;
            res.send(data)
        })
})

app.get('/restaurant',(req,res) => {
    let query = {}
    let stateId = Number(req.query.stateId)
    let mealId = Number(req.query.mealId)
    if(mealId && stateId){
        query={'mealTypes.mealtype_id':mealId,'state_id':stateId}
    }
    else if(mealId){
        query={'mealTypes.mealtype_id':mealId}
    }
    else if(stateId){
        query = {'state_id':stateId}
    }
    dbobj.collection('ResturantData').find(query).toArray((err,data) => {
        if(err) throw err;
        res.send(data)
    })
})

//filtering data
app.get('/filter/:mealId',(req,res)=>{
    let sort = {cost:1}
    let query = {}
    let skip = 0;
    let limit = 1000000000;
    let mealId = Number(req.params.mealId)
    let  cuisineId= Number(req.query.stateId)
    let lcost=Number(req.query.lcost)
    let hcost=Number(req.query.hcost)
    if(req.query.sort){
        sort={cost:req.query.sort}
    }
    if(req.query.skip && req.query.limit){
        skip = Number(req.query.skip);
        limit = Number(req.query.limit)
    }
    if(cuisineId&&lcost&&hcost){
        query={
            "mealTypes.mealtype_id":mealId,
            "cuisines.cuisine_id":cuisineId,
            $and:[{cost:{$gt:lcost,$lt:hcost}}]
        }
    }
    else if(cuisineId){
        query={"mealsTypes.mealtype_id":mealId,"cuisines.cuisine_id":cuisineId}
    }
   else if(lcost&&hcost){
        query={
            "mealTypes.mealtype_id":mealId,
            $and:[{cost:{$gt:lcost,$lt:hcost}}]
        }
   }
   /*
   else if(lcost&&hcost){
        query={
            "mealTypes.mealtype_id":mealId,
            $and:[{cost:{$gt:lcost,$lt:hcost}}]
        }
    } */
    dbobj.collection('ResturantData').find(query).sort(sort).toArray((err,data) => {
        if(err) throw err;
        res.send(data)
    })

})

/// restaurants details
app.get('/details/:id',(req,res) => {
    let id = Number(req.params.id)
    //let id = mongo.ObjectId(req.params.id)
    dbobj.collection('ResturantData').find({restaurant_id:id}).toArray((err,data) => {
        if(err) throw err;
        res.send(data)
    })
})
///  menu wrt to restaurantss
app.get('/menu/:id',(req,res) => {
    let id = Number(req.params.id)
    //let id = mongo.ObjectId(req.params.id)
    dbobj.collection('ResturantMenu').find({restaurant_id:id}).toArray((err,data) => {
        if(err) throw err;
        res.send(data)
    })
})
// menu wrt to ids
app.post('/menuItem',(req,res) => {
    console.log(req.body)
    if(Array.isArray(req.body)){
        dbobj.collection('ResturantMenu').find({menu_id:{$in:req.body}}).toArray((err,data) => {
            if(err) throw err;
            res.send(data)
        })
    }else{
        res.send('Please Pass the Array Only')
    }
    //res.send('ok data sended')
    
})
//place order
app.post('/placeorder',(req,res)=>{
            dbobj.collection('orderList').insert(req.body,(err,data)=>{
                if(err) throw err;
                //res.send(data)
                res.send('above order is ready to place please wait::: ')

            })
})
//get Order
app.get('/getOrder',(req,res) => {
    let query = {}
    let phno=Number(req.query.phno)
    if(phno){
        query = {'phoneno':phno}
    }
    dbobj.collection('orderList').find(query).toArray((err,data) => {
        if(err) throw err;
        res.send(data)
    })
})
app.put('/updateOrder',(req,res)=>{
    let query={}
    let id=Number(req.query.id);
     if(id){
         query={'id':id}
     }
     dbobj.collection('orderList').updateOne(
        (query),
        {
            $set:{
                "status":req.body.status
            }
        },(err,result)=>{
            if(err) console.log(err);
            res.status(200).send('Status Updated')
        }
    )
})
//Delete Order
app.delete('/removeOrder',(req,res) => {
    let id =Number(req.query.id)
    dbobj.collection('orderList').find({id:id}).toArray((err,result) => {
        if(result.length != 0){
            dbobj.collection('orderList').deleteOne({id:id},(err,result) => {
                if(err) throw err;
                res.send(`Date Removed`)
            })
        }else{
            res.send(`No Result Found`)
        }
    })
    
})
MongoClient.connect(mongoUrl,(err,client)=>{
    if(err){
        console.log('Error while connecting');
    }
    dbobj=client.db('zomato_Api')
    app.listen(port,(err)=>{
        if(err){
            console.log(err);
        } 
        console.log(`listing to port no- ${port}`)
    })
})