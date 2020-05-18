// ==UserScript==
// @name         Profanity Logger Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.0.4
// @description  Logs anyone who cusses in the web console!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-Profanity-Logger-Bot/MPP-Profanity-Logger-Bot.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-Profanity-Logger-Bot/favicon.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     FilthyWords https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en
// @run-at       document-end
// @noframes
// ==/UserScript==

/* globals MPP */

// =============================================== FILES

// filthy words to log in console
var fileFilthyWords = GM_getResourceText("FilthyWords").split('\n');
// need to remove empty elements in array
var filthyWords = fileFilthyWords.filter(function (word) {
    return word != "";
});

// ============================================== CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered

// URLs
const FEEDBACK_URL = "-----------------";

// Players listed by IDs (these are the _id strings) and their encountered name (name at the time of ban)
const BANNED_PLAYERS = [
//  ["cb066e42-6b29-42a1-b686-2b17dcf77156", "Fake user"],
//  empty for now
];

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)

// Bot constant settings
const CLEAR_LINES = 9; // may be changed if needed, but this number seems to be the magic number
const CLEAR_TEXT = "—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬";
const BOT_LOG_PROFANITY = true; // this is just to log anyone swearing in the room in case it's not kid friendly so they can be banned from the room

// Bot custom constants
const PREFIX = "!";
const PREFIX_LENGTH = PREFIX.length;
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to LDNOOBW for the list of filthy words that are constantly updated."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["ban [user id]","bans the player while running the bot"],
    ["unban [user id]","unbans the player if they were banned while running the bot"],
    ["listban", "shows all the permanently and temporarily banned players"],
    ["clear", "clears the chat"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["active [choice]", "turns the bot on or off (bot owner only)"]
];
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_BAN = PRE_MSG + "[Ban]";
const PRE_UNBAN = PRE_MSG + "[Unban]";
const PRE_LISTBAN = PRE_MSG + "[Listban]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_ERROR = PRE_MSG + "Error!";
const NOT_OWNER = "The bot isn't the owner of the room";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

// ============================================== VARIABLES

var active = true; // turn off the bot if needed
var currentRoom = null; // updates when it connects to room
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message
var endDelay; // used in multiline chats send commands

// Players listed by IDs (these are the _id strings) and their encountered name (name at the time of band)
var tempBannedPlayers = [
//  empty for now, this is for adding and removing users via commands
];

// ============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Puts quotes around string
var quoteString = function(string) {
    var newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
}

// Set the bot on or off (only from bot)
var setActive = function(args, userId, yourId) {
    if (userId != yourId) return;
    var choice = args[0];
    var newActive = null;
    switch(choice.toLowerCase()) {
        case "false": case "off": case "no": case "0": newActive = false; break;
        case "true": case "on": case "yes": case "1": newActive = true; break;
        default: console.log("Invalid choice. Bot wasn't turned off or on.");
    }
    if (exists(newActive)) {
        active = newActive;
        console.log("Bot was turned " + (newActive ? "on" : "off") + '.');
    }
}

// Logs any filthy words used in chat from the user
var checkForFilthyWords = function(username, userId, yourId, msg) {
    // exit if it's the bot's message
    if (userId == yourId) return;
    // get msg as array of words
    var msgWords = msg.trim().split(' ');
    // log any users that cuss
    var hasFilth = false;
    var i;
    for(i = 0; i < filthyWords.length; ++i) {
        if (!hasFilth) {
            var j;
            for(j = 0; j < msgWords.length; ++j) {
                if (msgWords[j] == filthyWords[i]) hasFilth = true;
            }
        }
    }
    if (hasFilth) console.log("%c" + username + " (" + userId + ") said: " + quoteString(msg), CONSOLE_IMPORTANT_STYLE);
}

// Makes all commands into one string
var formattedCommands = function(commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    var commands = '';
    var i;
    for(i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' ' : '') + prefix + commandsArray[i][0];
    }
    return commands;
}

// Gets 1 command and info about it into a string
var formatCommandInfo = function(commandsArray, commandIndex) {
    return LIST_BULLET + PREFIX + commandsArray[commandIndex][0] + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Send messages without worrying about timing
var mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, delay);
}

// Send multiline chats, and return final delay to make things easier for timings
var mppChatMultiSend = function(strArray, optionalPrefix, initialDelay) {
    if (!exists(optionalPrefix)) optionalPrefix = '';
    var newDelay = 0;
    var i;
    for (i = 0; i < strArray.length; ++i) {
        var currentString = strArray[i];
        if (currentString != "") {
            ++newDelay;
            mppChatSend(optionalPrefix + strArray[i], chatDelay * newDelay);
        }
    }
    return chatDelay * newDelay;
}

// Gets the players (from and _id and username array) and puts them into a string
var getPlayers = function(playersArray) {
    var allPlayers = "[none]";
    var playersSize = playersArray.length;
    if (playersSize > 0) {
        allPlayers = playersArray[0][1] + quoteString(playersArray[0][0]);
        // add more perm banned players
        if (playersSize > 1) {
            var i;
            for(i = 1; i < playersSize; ++i) {
                allPlayers += ", " + playersArray[i][0];
            }
        }
    }
    return allPlayers;
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR;
    // if cmd is empty somehow, show it
    if (exists(cmd) && cmd != "") {
        // if we're in the fishing room, ignore the fishing commands
        error += " Invalid command, " + quoteString(cmd) + " doesn't exist";
        cmd = cmd.toLowerCase();
    } else error += " No command entered";
    if (currentRoom == "test/fishing") console.log(error);
    else mppChatSend(error, 0);
}

// Commands
var help = function(command) {
    if (!exists(command) || command == "") mppChatSend(PRE_HELP + " Commands: " + formattedCommands(COMMANDS, LIST_BULLET + PREFIX, true), 0);
    else {
        var valid = null;
        var commandIndex = null;
        command = command.toLowerCase();
        // check commands array
        var i;
        for(i = 0; i < COMMANDS.length; ++i) {
            if (COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandIndex = i;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(COMMANDS, commandIndex), 0);
        else cmdNotFound(command);
    }
}
var about = function() {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION, 0);
    mppChatSend(BOT_AUTHOR + ' ' + BOT_NAMESPACE, 0);
}
var ban = function(userId, yourId) {
    var error = PRE_ERROR + " (ban)";
    if (!exists(userId)) {
        mppChatSend(error + " Nothing entered", 0);
        return;
    } else userId = userId.toLowerCase();
    // check user is not self
    if (userId == yourId) mppChatSend(error + " Can't ban yourself", 0);
    else {
        var permBanned = false;
        var tempBanned = false;
        // check if user is in perm ban
        var bannedPlayersSize = BANNED_PLAYERS.length;
        if (bannedPlayersSize > 0) {
            var i;
            for(i = 0; i < bannedPlayersSize; ++i) {
                if (userId == BANNED_PLAYERS[i][0]) {
                    permBanned = true;
                    mppChatSend(error + " This user is already permanently banned (set by script constants)", 0);
                };
            }
        }
        // check if user is in temp ban
        var tempBannedPlayersSize = tempBannedPlayers.length;
        if (tempBannedPlayersSize > 0) {
            var j;
            for(j = 0; j < tempBannedPlayersSize; ++j) {
                if (userId == tempBannedPlayers[j][0]) {
                    tempBanned = true;
                    mppChatSend(error + " This user is already temporarily banned (set by using the command)", 0);
                }
            }
        }
        // otherwise ban them
        if (!permBanned && !tempBanned) {
            var username = null;
            // get the user's name
            var usersInRoom = Object.values(MPP.client.ppl);
            var k;
            for(k = 0; k < usersInRoom.length; k++) {
                var possibleParticipant = usersInRoom[k];
                var possibleUserId = possibleParticipant._id;
                var possibleUsername = possibleParticipant.name;
                if (userId == possibleUserId) {
                    username = possibleUsername;
                }
            }
            // add to ban list
            if (username != null) {
                tempBannedPlayers.push([userId, username]);
                MPP.client.sendArray([{m: "kickban", _id: userId, ms: 3600000}]);
                mppChatSend(PRE_BAN + ' ' + quoteString(username) + " (" + userId + ") has been banned", 0);
            } else mppChatSend(PRE_BAN + ' ' + quoteString(userId) + " isn't a valid user id", 0);
        }
    }
}
var unban = function(userId, yourId) {
    var error = PRE_ERROR + " (unban)";
    if (!exists(userId)) {
        mppChatSend(error + " Nothing entered", 0);
        return;
    } else userId = userId.toLowerCase();
    // check user is not self
    if (userId == yourId) mppChatSend(error + " Can't unban yourself", 0);
    else {
        var permBanned = false;
        var tempBanned = false;
        // check if user is in perm ban
        var bannedPlayersSize = BANNED_PLAYERS.length;
        if (bannedPlayersSize > 0) {
            var i;
            for(i = 0; i < bannedPlayersSize; ++i) {
                if (userId == BANNED_PLAYERS[i][0]) {
                    permBanned = true;
                    mppChatSend(error + " Permanently banned players can only be unbanned from editing the script constants", 0);
                };
            }
        }
        // check if user is in temp ban
        var tempBannedPlayersSize = tempBannedPlayers.length;
        if (tempBannedPlayersSize > 0) {
            var j;
            for(j = 0; j < tempBannedPlayersSize; ++j) {
                if (userId == tempBannedPlayers[j][0]) {
                    tempBanned = true;
                }
            }
        }
        // if they were temp banned, unban them
        if (!permBanned && tempBanned) {
            var index = null;
            var username = null;
            // get the user's name
            var k;
            for(k = 0; k < tempBannedPlayers.length; k++) {
                var unbanningParticipant = tempBannedPlayers[k];
                var unbanningUserId = unbanningParticipant[0];
                var unbanningUsername = unbanningParticipant[1];
                if (userId == unbanningUserId) {
                    index = k;
                    username = unbanningUsername;
                }
            }
            // add to ban list
            if (index != null) {
                tempBannedPlayers.splice(index, 1);
                mppChatSend(PRE_UNBAN + ' ' + quoteString(username) + " (" + userId + ") has been unbanned", 0);
            } else mppChatSend(PRE_UNBAN + ' ' + quoteString(userId) + " isn't a valid user id", 0);
        }
    }
}
var listban = function() {
    mppChatSend(PRE_LISTBAN, 0);
    mppChatSend("Permanent: " + getPlayers(BANNED_PLAYERS), 0);
    mppChatSend("Temporary: " + getPlayers(tempBannedPlayers), 0);
}
var clear = function() {
    // clear the chat of current messages (can be slow)
    var i;
    for (i = 0; i < CLEAR_LINES; ++i) {
        mppChatSend(CLEAR_TEXT, chatDelay * i);
        if (i == CLEAR_LINES - 1) setTimeout(MPP.chat.clear, chatDelay * (i + 1));
    }
}
var feedback = function() {
    // just sends feedback url to user
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.", 0);
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    // if user switches to VPN, these need to update
    var yourParticipant = MPP.client.getOwnParticipant();
    var yourId = yourParticipant._id;
    var yourUsername = yourParticipant.name;
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;
    // make sure the start of the input matches prefix
    if (userId == yourId && input.startsWith(PREFIX)) {
        // evaluate input into command and possible arguments
        var message = input.substring(PREFIX_LENGTH).trim();
        var hasArgs = message.indexOf(' ');
        var command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1) : null;
        var arguments = (hasArgs != -1) ? argumentsString.split(' ') : null;
        // look through commands
        switch (command.toLowerCase()) {
            case "help": case "h": if (active) help(argumentsString); break;
            case "about": case "ab": if (active) about(); break;
            case "ban": case "b": if (active) ban(argumentsString, yourId); break;
            case "unban": case "ub": if (active) unban(argumentsString, yourId); break;
            case "listban": case "lb": if (active) listban(); break;
            case "clear": case "cl": if (active) clear(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "active": case "a": setActive(arguments, userId, yourId); break;
            default: if (active) cmdNotFound(command); break;
        }
    }
    if (active && BOT_LOG_PROFANITY) checkForFilthyWords(username, userId, yourId, input);
});
MPP.client.on("ch", function(msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
    // update current room info
    currentRoom = MPP.client.channel._id;
});
MPP.client.on('p', function(msg) {
    var userId = msg._id;
    // kick ban all the banned players
    var bannedPlayer = null;
    var bannedPlayersSize = BANNED_PLAYERS.length;
    if (bannedPlayersSize > 0) {
        var i;
        for(i = 0; i < bannedPlayersSize; ++i) {
            bannedPlayer = BANNED_PLAYERS[i][0];
            if (userId == bannedPlayer) MPP.client.sendArray([{m: "kickban", _id: bannedPlayer, ms: 3600000}]);
        }
    }
    var tempBannedPlayersSize = tempBannedPlayers.length;
    if (tempBannedPlayersSize > 0) {
        var j;
        for(j = 0; j < tempBannedPlayersSize; ++j) {
            bannedPlayer = tempBannedPlayers[j][0];
            if (userId == bannedPlayer) MPP.client.sendArray([{m: "kickban", _id: bannedPlayer, ms: 3600000}]);
        }
    }
});

// =============================================== INTERVALS

// Automatically turns off the sound warning
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);

                active = true;
                currentRoom = MPP.client.channel._id;
                if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                console.log(PRE_MSG + " Online!");
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);