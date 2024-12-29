import { MicroClient } from "../typings"
import { Message } from "discord.js"

/*
{
	channelId: '1087118874031427624',
	guildId: '602329986463957025',
	id: '1322420428802756671',
	createdTimestamp: 1735359999610,
	type: 0,
	system: false,
	content: 'abcde 💀 <:legend_smirk:1200443084341792918><a:death:809490758176079903>',
	author: {
		id: '556949122003894296',
		bot: false,
		system: false,
		flags: { bitfield: 4194432 },
		username: 'musicmaker',
		globalName: 'Music Maker',
		discriminator: '0',
		avatar: '7da6803394126ea8822e2d3a52341a2a',
		banner: undefined,
		accentColor: undefined,
		avatarDecoration: null,
		avatarDecorationData: null
	},
	pinned: false,
	tts: false,
	nonce: '1322420426915184640',
	embeds: [],
	components: [],
	attachments: {
		'1322420428228001864': {
			attachment: 'https://cdn.discordapp.com/attachments/1087118874031427624/1322420428228001864/Stereo_Test_-_LeftRight_Audio_Test_for_HeadphonesSpeakers.mp3?ex=6770cf7f&is=676f7dff&hm=16044b56b9e651e084dc5c2418b80026b8f5e0d4510d4835d70873d6d65352fb&',
			name: 'Stereo_Test_-_LeftRight_Audio_Test_for_HeadphonesSpeakers.mp3',
			id: '1322420428228001864',
			size: 501061,
			url: 'https://cdn.discordapp.com/attachments/1087118874031427624/1322420428228001864/Stereo_Test_-_LeftRight_Audio_Test_for_HeadphonesSpeakers.mp3?ex=6770cf7f&is=676f7dff&hm=16044b56b9e651e084dc5c2418b80026b8f5e0d4510d4835d70873d6d65352fb&',
			proxyURL: 'https://media.discordapp.net/attachments/1087118874031427624/1322420428228001864/Stereo_Test_-_LeftRight_Audio_Test_for_HeadphonesSpeakers.mp3?ex=6770cf7f&is=676f7dff&hm=16044b56b9e651e084dc5c2418b80026b8f5e0d4510d4835d70873d6d65352fb&',
			height: null,
			width: null,
			contentType: 'audio/mpeg',
			description: null,
			ephemeral: false,
			duration: null,
			waveform: null,
			flags: { bitfield: 0 },
			title: 'Stereo Test - LeftRight Audio Test for HeadphonesSpeakers'
		},
		'1322420428874055752': {
			attachment: 'https://cdn.discordapp.com/attachments/1087118874031427624/1322420428874055752/Charlie_optimized.png?ex=6770cf7f&is=676f7dff&hm=52b13dfd65275477d6f8755a55f4a6e8c65c195a7406472b5a10a3f2e30615c7&',
			name: 'Charlie_optimized.png',
			id: '1322420428874055752',
			size: 2989,
			url: 'https://cdn.discordapp.com/attachments/1087118874031427624/1322420428874055752/Charlie_optimized.png?ex=6770cf7f&is=676f7dff&hm=52b13dfd65275477d6f8755a55f4a6e8c65c195a7406472b5a10a3f2e30615c7&',
			proxyURL: 'https://media.discordapp.net/attachments/1087118874031427624/1322420428874055752/Charlie_optimized.png?ex=6770cf7f&is=676f7dff&hm=52b13dfd65275477d6f8755a55f4a6e8c65c195a7406472b5a10a3f2e30615c7&',
			height: 64,
			width: 64,
			contentType: 'image/png',
			description: null,
			ephemeral: false,
			duration: null,
			waveform: null,
			flags: { bitfield: 0 },
			title: null
		}
	},
	stickers: {
		'1161933251158487040': {
			id: '1161933251158487040',
			description: null,
			type: null,
			format: 1,
			name: 'Pockyflump',
			packId: null,
			tags: null,
			available: null,
			guildId: null,
			user: null,
			sortValue: null
		}
	},
	position: null,
	roleSubscriptionData: null,
	resolved: null,
	editedTimestamp: null,
	reactions: { message: [Circular * 1] },
	mentions: {
		everyone: false,
		users: {},
		roles: {},
		_members: null,
		_channels: null,
		_parsedUsers: null,
		crosspostedChannels: {},
		repliedUser: null
	},
	webhookId: null,
	groupActivityApplication: null,
	applicationId: null,
	activity: null,
	flags: { bitfield: 0 },
	reference: null,
	interactionMetadata: null,
	interaction: null,
	poll: null,
	call: null
}
*/

import SimplifyMessage from "../Utils/Parsers/SimplifyMessage"

export default {
	name: 'messageCreate',
	execute: async function (client: MicroClient, message: Message) {
		if (!message.guild) return; // Either the API had a goof or the message was sent in DMs

		const simplified = SimplifyMessage(message);

		client.messageCache.add(simplified);

		// add images to the download queue
		// These will be processed sometime later in bulk

		for (let i = 0; i < simplified.attachments.length; i++) {
			const attachment = simplified.attachments[i];
			client.downloadQueue.push(['Attachments', attachment.id, attachment.url]);
		}

		for (let i = 0; i < simplified.emojis.length; i++) {
			const emoji = simplified.emojis[i];
			client.downloadQueue.push(['Emojis', emoji.id, emoji.url]);
		}

		if (simplified.sticker) {
			client.downloadQueue.push(['Stickers', simplified.sticker.id, simplified.sticker.url]);
		}

		client.downloadQueue.push(['Users', simplified.user.id, simplified.user.icon.url]);

		if (simplified.guild.icon) {
			client.downloadQueue.push(['Guilds', simplified.guild.id, simplified.guild.icon.url]);
		}
	}
}
