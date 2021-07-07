import { terminal as term } from 'terminal-kit';
import { logger as log, logDemo } from './loggyboi';
import * as helpers from './helpers';
import { v3 as hue } from 'node-hue-api';
// import colormap from './colormap';
import colors from './colors';
import { HueFacade } from './hue';
import * as tmi from 'tmi.js';
import * as fs from 'fs';
import secrets from './secrets';



const deskLight = 55;
const rearLeft = 54;
const rearRight = 56;
const studioLights = [ deskLight, rearLeft, rearRight ];

log.silly('BOOTING UP!');

// huetools.listLights(secrets.hue.ip, secrets.hue.user);
const facade = new HueFacade(secrets.hue.ip, secrets.hue.user, studioLights);


// lights in the studio
/**
 * STUDIO LIGHTS
 * 54 - Office - Bun; Door
 * 55 - Office - Bun; Desk
 * 56 - Office - Bun; Closet
*/

// connectyboi
const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "debug" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: secrets.twitch.botName,
		password: secrets.twitch.authyboi
	},
	channels: [ secrets.twitch.channel ]
});

client.connect();  // DON'T ACCIDENTALLY REMOVE THIS

// listen for !commands
client.on('message', (channel, tags, message, self) => {
    log.info(message);
	if(self || !message.startsWith('!')) return;  // ignore self and non-commands

    // adds the stuff we need into a ctx object
    const ctx = {
        channel: channel,
        author: tags.username,
        client: client,
        args: message.slice(1).split(' '),
        tags: tags
    }
    ctx.command = ctx.args.shift().toLowerCase();
    ctx.message = ctx.args.join(' ');

    /** TAGS
     * badge-info, badges, client-nonce, color, display-name, emotes, 
     * flags, id, mod, room-id, subscriber, tmi-sent-ts, turbo, 
     * user-id, user-type, emotes-raw, badge-info-raw, badges-raw, 
     * username, message-type
     */

    const commandDefinitions = {
        'tags': getTags,
        'help': helpCommand,
        'color': color,
    };

    if(commandDefinitions[ctx.command]) {
        commandDefinitions[ctx.command](ctx);
    } else {
        client.say(ctx.channel, 'that\'s not a command');
    }

});


function getTags(ctx) {
    log.info(Object.keys(ctx.tags));
    client.say(ctx.channel, `${Object.keys(ctx.tags)}`);
}

function helpCommand(ctx) {
    // TODO fill this in lmao
}

// TODO: this is a mess
function color(ctx) {
    const helperText = `@${ctx.author}, please provide a color as an argument (using a name, hexcode, or rgb(r,g,b))`
    const rgbRegex = /^rgb\(\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*,\s*(\d|[1-9]\d|1\d{2}|2[0-5]{2})\s*\)$/

    if (ctx.args.length === 0) { client.say(ctx.channel, helperText); return; }  // handle no args

    const colorRequested = ctx.args[0].toLowerCase();

    if (colorRequested.match(/^#[0-9a-f]{6}$/i) || colorRequested.match(/^#[0-9a-f]{3}$/i)) {
        // it's a hex value
        // TODO: make sure the light's turned on
        let colorRGB = helpers.hexToRGB(ctx.args[0]);
        let colorXy = helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]);
        facade.changeColors(colorXy, 255);
    } else if (colorRequested.match(rgbRegex)) {
        // it's an rgb value
        let colorRGB = colorRequested.split('(')[1].split(')')[0].split(',');
        log.silly(colorRGB);
        facade.changeColors(helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]), 255);
    } else if (colorRequested === 'random') {
        let randomColor = helpers.hexToRGB(helpers.getRandomColor());
        log.info(`changing the lights to a random color: ${randomColor}`)
        facade.changeColors(helpers.RGBtoXY(randomColor[0], randomColor[1], randomColor[2]) , 255);
        return;
    } else if (colors[colorRequested]) {
        // it's a named color
        if (colorRequested === 'black') { facade.setLightState(false); return;}  // handle black
        let colorRGB = helpers.hexToRGB(colors[colorRequested]);
        let colorXy = helpers.RGBtoXY(colorRGB[0], colorRGB[1], colorRGB[2]);
        facade.changeColors(colorXy, 255);
    } else {
        // something was wrong with the command
        client.say(ctx.channel, helperText);
    }
}


// TODO make this default to a scene
// facade.changeColors(helpers.RGBtoXY(255, 0, 255) , 255);  // default to a color on start


////////////////////// DEMO STUFF //////////////////////

// logDemo();

/** terminal-kit demo
 // term.grabInput( { mouse: 'button' } ) ;
term.on( 'key' , function( key , matches , data ) {

    switch ( key )
    {
        case 'UP' : term.up( 1 ) ; break ;
        case 'DOWN' : term.down( 1 ) ; break ;
        case 'LEFT' : term.left( 1 ) ; break ;
        case 'RIGHT' : term.right( 1 ) ; break ;
        case 'CTRL_C' : process.exit() ; break ;
        default:
            // Echo anything else
            term.noFormat(
                Buffer.isBuffer( data.code ) ?
                    data.code :
                    String.fromCharCode( data.code )
            ) ;
            break ;
    }
} ) ;

term.on( 'mouse' , function( name , data ) {
    term.moveTo( data.x , data.y ) ;
} ) ;
*/

// export default function hello(user = '    World') {
//   const u = user.trimStart().trimEnd();
//   return `Hello ${u}!\n`;
// }

// if (require.main === module) {
//   process.stdout.write(hello());
// }