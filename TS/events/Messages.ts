import { MicroClient } from "../typings"
import { Message } from "discord.js"

export default {
	name: 'messageCreate',
	execute: async function (client: MicroClient, message: Message) {
		console.log(message);
	}
}