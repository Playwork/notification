/**
 * Created by Absoluteplay on 12/5/2559.
 */
var express = require('express');

module.exports = function (server, localhost) {
    'use strict';
    var router = express.Router();
    //var server = require('http').Server(app);
    var socketio = require('socket.io');
    var ioRedis = require('ioredis');
    var clientRedis = new ioRedis({port: 6379, host: localhost, db: 3});
    var request = require('request');
    var io = socketio(server);
    var BASE_URL = 'http://localhost:3000';
    if (process.env.NODE_ENV !== 'dev') {
        BASE_URL = 'https://api.vingtv.com';
    }
    var kue = require('kue');
    var jobs = kue.createQueue({
        prefix: 'q',
        redis: {
            port: 6379,
            host: localhost,
            //auth: 'password',
            db: 4, // if provided select a non-default redis db
            options: {
                // see https://github.com/mranney/node_redis#rediscreateclient
            }
        }
    });


    var postUser = function (callback) {
        request.post({url: BASE_URL + '/api/Members/login', form: {email: 'socket@ving.co.th', password: 'Ltl5MvYYpMmzdOvbtSO5xA=='}},
            function (error, response, body) {
                if (response && response.statusCode == 200) {


                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {

                    console.log('error: ' + response.statusCode + 'cannot login admin user');
                    console.log(error);
                    clientRedis.sadd('log:postUser', 'cannot login admin user');

                    return callback(response, body);
                }
            });
    };
    var userAdminToken = '';


    var getMember = function (memberId, accessToken, callback) {
        // Get member Detail
        request.get(BASE_URL + '/api/Members/' + memberId + '?access_token=' + accessToken,
            function (error, response, body) {
                if (response && response.statusCode == 200) {
                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {

                    console.log('error: ' + response.statusCode + 'cannot get member');

                    return callback(response, body);
                }
            });
    };

    var getChannel = function (accessToken, callback) {
        // Get member Detail
        request.get(BASE_URL + '/api/Channels?access_token=' + accessToken,
            function (error, response, body) {
                if (response && response.statusCode == 200) {
                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {

                    console.log('error: ' + response.statusCode + 'cannot get channel');

                    return callback(error, body);
                }
            });
    };

    var getProgram = function (channelId, memberId, accessToken, callback) {
        // Get member Detail
        //http://192.168.120.204/api/Channels/view?access_token=M5PAEVWhDM8wspOsfeSPLBu01BjrS0w9DwZB3qOJJ6uNoFVLPQaLHQ5a6tfriAUL&memberId=5739a68d155cdd7f28d15603&channelId=56f3d22f58f151bb17862b85&version=apple&device_token=socket
        request.get(BASE_URL + '/api/Channels/view?access_token=' + accessToken + '&memberId=' + memberId + '&channelId=' + channelId + '&version=apple&device_token=socket_server',
            function (error, response, body) {

                if (response && response.statusCode == 200) {

                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {
                    if (response) {
                        console.log('accessToken' + accessToken);
                        console.log('memberId' + memberId);
                        console.log('channelId' + channelId);
                        console.log('error: ' + response.statusCode + 'cannot get program');
                    }

                    return callback(error, body);
                }
            });
    };

    var postLikeProgram = function (programId, memberId, accessToken, callback) {
        request.post({
                url: BASE_URL + '/api/Likes?access_token=' + accessToken,
                form: {programId: programId, memberId: memberId}
            },
            function (error, response, body) {

                if (response && response.statusCode == 200) {


                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {
                    if (response) {
                        console.log('error: ' + response.statusCode + 'cannot post like ');
                    }

                    return callback(error, body);
                }
            });
    };


    var postUnLikeProgram = function (programId, memberId, accessToken, callback) {

        request.post({
                url: BASE_URL + '/api/Likes/unlike?access_token=' + accessToken + '',
                form: {programId: programId, memberId: memberId}
            },
            function (error, response, body) {

                if (response && response.statusCode == 200) {


                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {
                    if (response) {
                        console.log('error: ' + response.statusCode + 'cannot post unlike');
                    }

                    return callback(error, body);
                }
            });
    };

    var postFollowProgram = function (programId, memberId, accessToken, callback) {
        request.post({
                url: BASE_URL + '/api/Follows?access_token=' + accessToken,
                form: {programId: programId, memberId: memberId}
            },
            function (error, response, body) {

                if (response && response.statusCode == 200) {


                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {
                    if (response) {
                        console.log('error: ' + response.statusCode + 'cannot post follow');
                    }

                    return callback(error, body);
                }
            });
    };

    var postUnFollowProgram = function (programId, memberId, accessToken, callback) {
        request.post({
                url: BASE_URL + '/api/Follows/unfollow?access_token=' + accessToken,
                form: {programId: programId, memberId: memberId}
            },
            function (error, response, body) {

                if (response && response.statusCode == 200) {


                    var member = JSON.parse(body);

                    return callback(null, member);
                } else {
                    if (response) {
                        console.log('error: ' + response.statusCode + 'cannot post unfollow');
                    }

                    return callback(error, body);
                }
            });
    };
    var numClients = {};
    var member = {};
    io.on('connection', function (socket) {

        delete io.sockets.connected[socket.id];

        socket.on('join', function (data, cb) {

            socket.channel = data.channel;
            socket.memberId = data.memberId;
            socket.accessToken = data.accessToken;

            socket.join(socket.channel);


            getMember(socket.memberId, socket.accessToken, function (err, result) {

                if (err) {
                    console.log(err.body);
                    io.sockets.connected[socket.id] = socket;
                    cb(JSON.parse(err.body));
                    socket.disconnect('unauthorized');
                    return false;
                }
                try {
                    if (JSON.parse(result).error) {
                        cb(err.body);
                        socket.disconnect('unauthorized');
                        return false;
                    }
                } catch (e) {

                }

                member = result;
                socket.member = member;

                io.sockets.connected[socket.id] = socket;

                clientRedis.get('socket:' + socket.memberId, function (err, socket_key) {

                    if (socket_key) {
                        if (socket.id === socket_key) {

                        }
                    } else {

                        clientRedis.set('socket:' + data.memberId, socket.id);

                    }

                });


                clientRedis.sadd('channel:viewer:' + socket.channel, JSON.stringify(socket.member), function (err, result) {
                    if (err) {
                        console.log(err);
                        return false;
                    }
                    clientRedis.smembers('channel:viewer:' + socket.channel, function (err, result) {

                        clientRedis.llen('channel:message:' + socket.channel, function (err, length) {
                            clientRedis.lrange('channel:message:' + socket.channel, length - 20, length, function (err, message) {
                                if (err) {
                                    console.log(err);
                                    return false;
                                }

                                var member = [];
                                var temp_data = {};
                                result.forEach(function (value) {
                                    temp_data = JSON.parse(value);
                                    member.push({
                                        user_id: temp_data.id,
                                        displayName: temp_data.displayName,
                                        profile_pic: temp_data.profile_pic,
                                        socket_id: socket.id
                                    });

                                });

                                var history = [];
                                message.forEach(function (value) {
                                    temp_data = JSON.parse(value);

                                    history.push({
                                        user_id: temp_data.user.id,
                                        displayName: temp_data.user.displayName,
                                        profile_pic: temp_data.user.profile_pic,
                                        message: temp_data.message,
                                        created_at: temp_data.created_at
                                    });

                                });
                                var new_member = {
                                    user_id: socket.memberId,
                                    displayName: socket.member.displayName,
                                    profile_pic: socket.member.profile_pic,
                                    socket_id: socket.id
                                };


                                io.to(socket.channel).emit('joined', new_member);
                                io.to(socket.channel).emit('joined_' + socket.memberId, {
                                    member: member,
                                    history: history
                                });
                                var all_program = [];

                                clientRedis.smembers('channel:update', function (err, update_program) {

                                    update_program.forEach(function (value) {
                                        temp_data = JSON.parse(value);
                                        all_program.push({
                                            name: temp_data.name,
                                            start: temp_data.start,
                                            end: temp_data.end,
                                            day: temp_data.day,
                                            description: temp_data.description,
                                            showtime: temp_data.showtime,
                                            id: temp_data.id,
                                            landscape: temp_data.landscape,
                                            portrait: temp_data.portrait,
                                            channelId: temp_data.channelId,
                                            channelName: temp_data.channelName,
                                            channelNameEng: temp_data.channelNameEng,
                                            channelNameTh: temp_data.channelNameTh
                                        });

                                    });
                                    cb(all_program);

                                });


                            });

                        });


                    });
                });


                clientRedis.get('channel:view:' + socket.channel + ':' + socket.memberId, function (err, exits) {

                    if (!exits) {
                        clientRedis.setex('channel:view:' + socket.channel + ':' + socket.memberId, 3600, JSON.stringify(socket.member));
                        clientRedis.incr('channel:' + socket.channel + ':views');
                    }
                    clientRedis.get('channel:' + socket.channel + ':views', function (err, views) {
                        io.to(socket.channel).emit('views', {views: views});
                    });

                });


            });


        });


        socket.on('history', function (data) {
            clientRedis.llen('channel:message:' + data.channel, function (err, length) {
                clientRedis.lrange('channel:message:' + data.channel, length - 20, length, function (err, message) {
                    //console.log(message);

                });

            });

        });

        socket.on('leave', function () {


            socket.disconnect(socket.channel);

        });

        socket.on('disconnect', function () {
            if (socket.member) {

                var leaved_member = {
                    id: socket.memberId,
                    displayName: socket.member.displayName,
                    profile_pic: socket.member.profile_pic
                };

                io.to(socket.channel).emit('leaved', leaved_member);

                clientRedis.srem('channel:viewer:' + socket.channel, JSON.stringify(socket.member), function (err, result) {

                });

                clientRedis.del('socket:' + socket.memberId);
            }


        });


        socket.on('send.message', function (data) {

            var new_member = {
                id: socket.memberId,
                displayName: socket.member.displayName,
                profile_pic: socket.member.profile_pic
            };

            create(data.message, socket.channel, new_member);

        });

        socket.on('like', function (program) {

            like(socket.channel, program, socket.memberId, socket.accessToken);
        });

        socket.on('unlike', function (program) {
            unlike(socket.channel, program, socket.memberId, socket.accessToken);
        });

        socket.on('follow', function (program) {

            follow(socket.channel, program, socket.memberId, socket.accessToken);
        });

        socket.on('unfollow', function (program) {
            unfollow(socket.channel, program, socket.memberId, socket.accessToken);
        });

    });

    function taskUserAdmin() {

        jobs.create('user', {}).delay(1000).priority('high')
            .removeOnComplete(true)
            .save();

    }

    taskUserAdmin();

    jobs.process('user', 1, function (job, done) {
        postUser(function (response, result) {

            if (response !== null) {
                if (response.statusCode !== 200) {
                    console.log('relogin');
                    taskUserAdmin();
                }

            } else {
                userAdminToken = result.token;
                jobs.create('channel', {
                    accessToken: userAdminToken
                }).delay(1000).priority('high')
                    .removeOnComplete(true)
                    .save();
            }


        });

        done();
    });

    function taskChannel() {

        if (userAdminToken !== '') {
            jobs.create('channel', {
                accessToken: userAdminToken
            }).delay(60000).priority('high')
                .removeOnComplete(true)
                .save();
        }


        setTimeout(taskChannel, 360000);

    }


    function taskProgram() {

        if (userAdminToken !== '') {
            jobs.create('program', {
                accessToken: userAdminToken
            }).priority('high')
                .removeOnComplete(true)
                .save();
        }

        setTimeout(taskProgram, 30000);

    }

    jobs.process('channel', 1, function (job, done) {


        if (job.data.accessToken) {

            getChannel(job.data.accessToken.id, function (err, result) {

                result.forEach(function (value) {

                    clientRedis.sadd('channel:list', JSON.stringify(value), function (err, result) {
                        if (err) {

                            return false;
                        }


                    });
                });
                if (result) {
                    taskProgram();
                }

            });
            done();
        }


    });

    jobs.process('program', 1, function (job, done) {

        if (job.data.accessToken) {
            var value = '';

            clientRedis.smembers('channel:list', function (err, result) {


                for (var i = 0; i < result.length; i++) {

                    value = JSON.parse(result[i]);


                    jobs.create('update_program', {
                        title: value.id,
                        channelId: value.id,
                        channelNameEng: value.nameEng,
                        channelNameTh: value.nameTh,
                        accessToken: job.data.accessToken
                    }).priority('high')
                        .removeOnComplete(true)
                        .save();

                    if (i == (result.length - 1)) {

                        done();

                    }
                }


            });


        } else {
            done();
        }


    });

    jobs.process('update_program', 1, function (job, done) {

        var temp_channel_id = job.data.channelId;

        var totalLike = 0;
        var totalFollow = 0;
        getProgram(temp_channel_id, job.data.accessToken.userId, job.data.accessToken.id, function (err, current_program) {
            if (err) {
                console.log(err);

                return false;
            }
            try {
                clientRedis.set('channel:' + current_program.channel.id + ':live', JSON.stringify(current_program));
                totalLike = parseInt(current_program.program.likes);
                totalFollow = parseInt(current_program.program.follows);
                clientRedis.set('channel:' + current_program.channel.id + ':' + current_program.program.id + ':like', totalLike);
                clientRedis.set('channel:' + current_program.channel.id + ':' + current_program.program.id + ':follow', totalFollow);
            } catch (e) {
                console.log(e);
            }


        });


        clientRedis.get('channel:' + temp_channel_id + ':live', function (err, live_program) {


            if (live_program) {
                var live = JSON.parse(live_program);


                clientRedis.get('channel:' + temp_channel_id + ':last_program', function (err, last_programs) {

                    if (last_programs) {

                        var last_program = JSON.parse(last_programs);

                        if (live.program.id !== last_program.program.id) {

                            if (live_program) {

                                var onair_program = {
                                    name: live.program.name,
                                    start: live.program.start,
                                    end: live.program.end,
                                    day: live.program.day,
                                    description: live.program.description,
                                    showtime: live.program.showtime,
                                    id: live.program.id,
                                    landscape: live.program.landscape,
                                    portrait: live.program.portrait,
                                    channelId: live.program.channelId,
                                    channelName: live.channel.name,
                                    channelNameEng: live.channel.nameEng,
                                    channelNameTh: live.channel.nameTh
                                };

                                var remove_program = {
                                    name: last_program.program.name,
                                    start: last_program.program.start,
                                    end: last_program.program.end,
                                    day: last_program.program.day,
                                    description: last_program.program.description,
                                    showtime: last_program.program.showtime,
                                    id: last_program.program.id,
                                    landscape: last_program.program.landscape,
                                    portrait: last_program.program.portrait,
                                    channelId: last_program.program.channelId,
                                    channelName: last_program.channel.name,
                                    channelNameEng: last_program.channel.nameEng,
                                    channelNameTh: last_program.channel.nameTh
                                };

                                //io.to(job.data.channelId).emit('update.program', onair_program);
                                clientRedis.set('channel:' + temp_channel_id + ':last_program', live_program);

                                clientRedis.srem('channel:update', JSON.stringify(remove_program), function (err, result) {
                                    if (err) {

                                        return false;
                                    }

                                });
                                clientRedis.sadd('channel:update', JSON.stringify(onair_program), function (err, result) {
                                    if (err) {

                                        return false;
                                    }

                                });

                                clientRedis.smembers('channel:update', function (err, update_programs) {


                                    var update_program = [];
                                    update_programs.forEach(function (value) {
                                        var temp_data = JSON.parse(value);
                                        update_program.push({
                                            name: temp_data.name,
                                            start: temp_data.start,
                                            end: temp_data.end,
                                            day: temp_data.day,
                                            description: temp_data.description,
                                            showtime: temp_data.showtime,
                                            id: temp_data.id,
                                            landscape: temp_data.landscape,
                                            portrait: temp_data.portrait,
                                            channelId: temp_data.channelId,
                                            channelName: temp_data.channelName,
                                            channelNameEng: temp_data.channelNameEng,
                                            channelNameTh: temp_data.channelNameTh
                                        });

                                    });


                                    clientRedis.smembers('channel:list', function (err, channels) {
                                        channels.forEach(function (channel) {
                                            io.to(JSON.parse(channel).id).emit('update.channel', update_program);

                                        });
                                    });
                                });


                            }

                        }
                    } else {
                        clientRedis.set('channel:' + temp_channel_id + ':last_program', live_program);

                        var new_program = {
                            name: live.program.name,
                            start: live.program.start,
                            end: live.program.end,
                            day: live.program.day,
                            description: live.program.description,
                            showtime: live.program.showtime,
                            id: live.program.id,
                            landscape: live.program.landscape,
                            portrait: live.program.portrait,
                            channelId: live.program.channelId,
                            channelName: live.channel.name,
                            channelNameEng: live.channel.nameEng,
                            channelNameTh: live.channel.nameTh
                        };
                        clientRedis.sadd('channel:update', JSON.stringify(new_program), function (err, result) {
                            if (err) {

                                return false;
                            }
                        });
                    }

                });


            }


        });

        done();
    });

    function create(message, channel, member) {

        var job = jobs.create('message', {
            title: message,
            message: message,
            channel: channel,
            member: member
        }).priority('high')
            .removeOnComplete(true).save();
        job.on('complete', function () {
            var d = new Date();
            var created_at = Math.floor(d.getTime() / 1000);
            clientRedis.rpush('channel:message:' + channel, JSON.stringify({
                user: member,
                message: message,
                created_at: created_at
            }), function (err, result) {
                if (err) {
                    console.log(err);
                    return err;
                }
            });

        });

    }

    function like(channel, programId, memberId, accessToken) {
        if (channel && programId && memberId && accessToken) {
            jobs.create('like', {
                title: memberId,
                channelId: channel,
                programId: programId,
                memberId: memberId,
                accessToken: accessToken
            }).priority('high')
                .removeOnComplete(true)
                .save();
        }

    }

    function unlike(channel, programId, memberId, accessToken) {
        if (channel && programId && memberId && accessToken) {

            jobs.create('unlike', {
                title: memberId,
                channelId: channel,
                programId: programId,
                memberId: memberId,
                accessToken: accessToken
            }).priority('high')
                .removeOnComplete(true).save();
        }


    }

    function follow(channel, programId, memberId, accessToken) {
        if (channel && programId && memberId && accessToken) {
            jobs.create('follow', {
                title: memberId,
                channelId: channel,
                programId: programId,
                memberId: memberId,
                accessToken: accessToken
            }).priority('high')
                .removeOnComplete(true)
                .save();
        }

    }

    function unfollow(channel, programId, memberId, accessToken) {
        if (channel && programId && memberId && accessToken) {
            jobs.create('unfollow', {
                title: memberId,
                channelId: channel,
                programId: programId,
                memberId: memberId,
                accessToken: accessToken
            }).priority('high')
                .removeOnComplete(true)
                .save();
        }

    }


    jobs.process('message', 1, function (job, done) {
        var message = job.data.message;
        var channel = job.data.channel;
        var member = job.data.member;
        var d = new Date();
        var created_at = Math.floor(d.getTime() / 1000);
        io.to(channel).emit('receive.message', {
            user_id: member.id,
            displayName: member.displayName,
            profile_pic: member.profile_pic,
            message: message,
            created_at: created_at
        });

        setTimeout(function () {
            done();
        }, 800);
    });

    jobs.process('like', 1, function (job, done) {

        postLikeProgram(job.data.programId, job.data.memberId, job.data.accessToken, function (err, result) {

            if (err) {
                return false;
            }
            var like_data = {};
            try {
                like_data = JSON.parse(result);

            } catch (e) {
                console.log(e); //error in the above string(in this case,yes)!

            }

            if (like_data.error) {
                console.log(job.data.memberId);
                console.log(like_data.error);
            } else {

                clientRedis.incr('channel:' + job.data.channelId + ':' + job.data.programId + ':like', function (err, total) {
                    //console.log(total);
                    io.to(job.data.channelId).emit('update.like', {like: total, memberId: job.data.memberId});
                });
            }


        });
        done();
    });


    jobs.process('unlike', 1, function (job, done) {

        postUnLikeProgram(job.data.programId, job.data.memberId, job.data.accessToken, function (err, result) {

            if (err) {
                return false;
            }
            if (result.status == 'success') {

                clientRedis.decr('channel:' + job.data.channelId + ':' + job.data.programId + ':like', function (err, total) {
                    io.to(job.data.channelId).emit('update.like', {like: total, memberId: job.data.memberId});
                });

            }


        });
        done();
    });


    jobs.process('follow', 1, function (job, done) {

        postFollowProgram(job.data.programId, job.data.memberId, job.data.accessToken, function (err, result) {

            if (err) {
                return false;
            }
            var follow_data = {};
            try {
                follow_data = JSON.parse(result);

            } catch (e) {
                console.log(e); //error in the above string(in this case,yes)!

            }

            if (follow_data.error) {
                console.log(job.data.memberId);
                console.log(follow_data.error);
            } else {

                clientRedis.incr('channel:' + job.data.channelId + ':' + job.data.programId + ':follow', function (err, total) {
                    //console.log(total);
                    io.to(job.data.channelId).emit('update.follow', {follow: total, memberId: job.data.memberId});
                });
            }


        });
        done();
    });

    jobs.process('unfollow', 1, function (job, done) {

        postUnFollowProgram(job.data.programId, job.data.memberId, job.data.accessToken, function (err, result) {

            if (err) {
                return false;
            }
            var follow_data = {};
            try {
                follow_data = JSON.parse(result);

            } catch (e) {
                console.log(e); //error in the above string(in this case,yes)!

            }

            if (follow_data.error) {
                console.log(job.data.memberId);
                console.log(follow_data.error);
            } else {

                clientRedis.decr('channel:' + job.data.channelId + ':' + job.data.programId + ':follow', function (err, total) {
                    //console.log(total);
                    io.to(job.data.channelId).emit('update.follow', {follow: total, memberId: job.data.memberId});
                });
            }


        });
        done();
    });


    //kue.app.listen(6666);

    router.get('/population', function (req, res) {
        var population = 0;

        if (numClients[req.query.channel] !== undefined) {
            population = numClients[req.query.channel];

        }
        io.to(req.query.channel).emit('population', population);
        res.json({success: true, msg: 'channel ' + req.query.channel, total: population});
    });

    return router;

};
