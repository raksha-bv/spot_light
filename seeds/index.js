const mongoose=require('mongoose')
const Spot=require('../models/spot')
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/spot-light');
}
const db= mongoose.connection
db.on("error", console.error.bind(console,"connection error:"))
db.once("open",()=>{
    console.log("database connected")
})

const sample = array => array[Math.floor(Math.random() * array.length)];
const seedDB = async ()=>{
    await Spot.deleteMany({})
    for (let i = 0; i < 10; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price=Math.floor(Math.random() * 20)+10
        const place = new Spot({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
              type: "Point",
              coordinates: [
                cities[random1000].longitude,
                cities[random1000].latitude,
            ]
            },
            author: '65f5d2c5a7291008d993f149',
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dol pariatur amet quia eum saepe necessitatibus ea incidunt praesentium aspernatur quibusdam enim beatae, aliquid dicta!',
            price,
            images: [
              {
                url: 'https://res.cloudinary.com/dqdjdjtgm/image/upload/v1710915389/YelpCamp/u7tobgqnqhoylw7womv3.jpg',
                filename: 'YelpCamp/u7tobgqnqhoylw7womv3'
              },
              {
                url: 'https://res.cloudinary.com/dqdjdjtgm/image/upload/v1710915391/YelpCamp/fdlhimqev7pvifl0sqqn.jpg',
                filename: 'YelpCamp/fdlhimqev7pvifl0sqqn'
              }
            ]
        })
        await place.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})