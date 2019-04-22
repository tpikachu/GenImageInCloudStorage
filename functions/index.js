const functions = require('firebase-functions');
const admin = require('firebase-admin');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const { createCanvas, Image} = require('canvas');
const request  = require('request');
const fs = require('fs');

function initimage(){
    const canvas = createCanvas(400, 300)
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255,255,255, 1)';
    ctx.fillRect(0, 0, 400, 300);

    return canvas;
}

function drawtext(ctx, str11, str12, str21, str22){
    ctx.fillStyle = 'rgba(255,0,0, 1)';
    ctx.font = '14px Impact';

    ctx.fillText(str11, 40, 200);
    ctx.fillText(str12, 60, 240);
    ctx.fillText(str21, 280, 200);
    ctx.fillText(str22, 300, 240);
}
function drawimage(ctx, posx, posy, buffer, size){
    const img = new Image();

    //drawimage 
    img.onload = () => ctx.drawImage(img,
      0, 0, img.width, img.height, // source dimensions
      posx, posy, size, img.height * size / img.width                 // destination dimensions
    );

    img.onerror = err => { throw err };
    img.src = buffer;
}

function uploadimage(buffer){
    var serviceAccount = require("./test-b34c7-30c9c5737c12.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://test-b34c7.appspot.com"
    });

    
    var name = Number(new Date());
    var storage = admin.storage();
    
    var bucket = storage.bucket();
    
    const file = bucket.file(`Mergeimage/${name}-image.png`)

    var metadata = {
        contentType: 'image/png'
    };

    return new Promise((resolve, reject) => {
        file.save(buffer)
            .then(() => {
                file.setMetadata(metadata);            
                return resolve(file.metadata.mediaLink);
            })
            .catch(err => {reject(err);})
    })
    // var storageRef = storage.ref('Mergeimage/' + name + '-image.png');
    // storageRef.getDownloadURL()
    //     .then(url => console.log(url))
    //     .catch(err => {throw err;})
    
    
    // bucket.upload('swap-horiz.png', options)
    //     .then(data => console.log(data))
    //     .catch(err => {throw err;})
    // 'bucket' is an object defined in the @google-cloud/storage library.
    // See https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/latest/storage/bucket
    // for more details.
}

function getImageUrl(file)
{
    return new Promise((resolve, reject) => {
        file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
        })
        .then(url => {
            console.log(url[0]);
            return resolve(url[0]);
        })
        .catch(err => {throw err;})
    })
}

exports.image_gen = functions.https.onRequest((req, response) => {
    
    const imageurl1 = req.body.imageurl1;
    const imageurl2 = req.body.imageurl2;
    const string11 = req.body.string11;
    const string12 = req.body.string12;
    const string21 = req.body.string21;
    const string22 = req.body.string22;

    var url = imageurl1;

    request({ url, encoding: null }, (err, resp, buffer) => {
        if(err) {throw err;}
        //setbackground
        const canvas = initimage();
        ctx = canvas.getContext('2d');
        
        drawtext(ctx, string11, string12, string21, string22);
        //first image
        drawimage(ctx, 10, 30, buffer, 140);
        console.log('first image added');
    
        
        url = imageurl2;
        request({ url, encoding: null }, (err, resp, buffer1) => {
            if(err)  {throw err;}
            //second image
            drawimage(ctx, 250, 30, buffer1, 140);
            console.log("seconde image added");
    
            //arrow image
            drawimage(ctx, 170, 40, 'swap-horiz.png', 60);
            console.log("arrow image added");
    
            //upload file
            const buf = canvas.toBuffer();
            uploadimage(buf)
                .then(res => {
                    return response.send({url: res});
                })
                .catch(err => {throw err;})
        });
    });
});

