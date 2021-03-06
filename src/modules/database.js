const mongoose = require('mongoose');
const User = require('../schemas/user');
const Meme = require('../schemas/meme');
const memes = require('./memes');
const axios = require("axios");

require('dotenv').load();
mongoose.connect(process.env.DB_LINK, (err) => {
    if (err) {
        return console.log('err:', err)
    } else {
        return console.log('db connected');
    };
});
mongoose.Promise = global.Promise;

const createUser = function (object) {
    return new Promise((resolve, reject) => {
        let user = new User(object);
        user.avatar = {
            default: true
        };
        user.currentMemeId = 1;

        user.save((err, data) => {
            if (err) {
                console.log(err);
                reject({
                    message: 'Username is already taken.',
                    status: 402
                });
            } else {
                resolve(data);
            }
        });
    });
};

const getUserById = function (userId) {
    return User.find({ id: userId })
        .then(data => {
            if (data.length === 0) {
                return Promise.resolve('no user');
            }
            return Promise.resolve(data[0]);
        })
        .catch(err => {
            console.log(err);
            return Promise.reject(err);
        })
};

const isUserExist = function (username) {
    return User.findOne({
        username: username
    })
        .then(data => {
            if (data == null) {
                return Promise.resolve(false);
            }
            else {
                return Promise.resolve(true);
            }
        })
        .catch(err => {
            console.log(err);
            return Promise.reject(err);
        })
};

const getUserByPassHash = function (username, passHash) {
    return User.findOne({
        username: username,
        passHash: passHash
    })
        .then(data => {
            if (data == null) {
                return Promise.reject('No user with that username and hash');
            } else {
                return Promise.resolve(data);
            }
        })
        .catch(err => {
            console.log(err);
            return Promise.reject(err);
        })
};

const getAvatar = function (id) {
    return User.findOne({ id: id }, { avatar: 1 })
        .then(data => {
            return Promise.resolve(data);
        })
        .catch(err => {
            return Promise.reject(err)
        })
};

const updateAvatar = function (userId, contentype, data) {
    let upd = {
        avatar: {
            default: false,
            contentType: contentype,
            data: data
        }
    };
    return User.findOneAndUpdate({ id: userId }, upd)
        .then((data) => {
            return Promise.resolve(data)
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

const createMeme = function (url) {
    return new Promise((resolve, reject) => {
        let meme = new Meme();
        meme.url = url;
        meme.votes = 0;
        meme.views = 0;

        meme.save((err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

const addNewMemes = function (count) {
    let currentPage = Number(Math.floor(count / 50) + 1);
    console.log('currentPage : ', currentPage);

    let url = 'https://api.imgur.com/3/g/memes/top/' + currentPage;
    return axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'CLIENT-ID 66cf648f30b3bd9' //need to fix later
        }
    })
        .then((response) => {
            // console.log('memes: ', response.data.data);
            let memes = response.data.data;
            console.log('memes.length : ', memes.length);

            for (let i = 0; i < memes.length; i++) {
                console.log('i = ', i);
                let meme = memes[i];
                let memeUrl
                try {
                    memeUrl = meme.images[0].link;
                } catch (err) {
                    memeUrl = meme.link;
                }
                console.log(memeUrl);   
                createMeme(memeUrl)
                    .then((data) => {
                        console.log('meme created');
                    })
                    .catch((err) => {
                        console.log(err);         
                    });
            }
            // console.log(response.data.data[id].images[0].link); //image link
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

const getMemesCount = function () {
    return Meme.count()
        .then((data) => {
            return Promise.resolve(data);
        })
        .catch((err) => {
            return Promise.resolve(err);            
        });
}

const getMeme = function (meme_id) {
    return Meme.findOne({ meme_id: meme_id })
        .then((data) => {
            if (data == null) {
                return Promise.reject(`meme_id ${meme_id} does not exist`);
            }
            return Promise.resolve(data);
        })
        .catch((err) => {
            return Promise.reject(err)
        })
};

const voteForMeme = function (user, likedMeme_id, another_id) {
    let firstMeme, secondMeme;
    return Meme.findOneAndUpdate({ meme_id: likedMeme_id }, { $inc: { votes: 1, views: 1 } })
        .then((data) => {
            console.log('data : ', data);
            return Meme.findOneAndUpdate({ meme_id: another_id }, { $inc: { views: 1 } });
        })
        .then((data) => {
            return User.findOneAndUpdate({ id: user.id }, { $inc: { currentMemeId: 2 } });
        })
        .then((data) => {
            return getMemesCount()
                .then((count) => {
                    if ((user.currentMemeId + 2) > count) {
                        return addNewMemes(count);
                    }
                })
                .catch((err) => {
                    console.log(err);
                })
        })
        .then((data) => {
            return getMeme(user.currentMemeId);
        })
        .then((data) => {
            firstMeme = data;
            return getMeme(user.currentMemeId + 1);
        })
        .then((data) => {
            secondMeme = data;
            return Promise.resolve({
                left: firstMeme,
                right: secondMeme
            });
        })
        .catch((err) => {
            console.log('err : ', err);
            return Promise.reject(err);
        });
}

module.exports = {
    createUser: createUser,
    getUserByPassHash: getUserByPassHash,
    getById: getUserById,
    isUserExist: isUserExist,
    getAvatar: getAvatar,
    updateAvatar: updateAvatar,
    createMeme: createMeme,
    getMeme: getMeme,
    voteForMeme: voteForMeme
};