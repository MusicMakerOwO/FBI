'use strict';

const InteractionCreateAction = require(`${__dirname}/../../../node_modules/discord.js/src/client/actions/InteractionCreate`);

const { InteractionType: DiscordInteractionType, ComponentType, ApplicationCommandType } = require('discord-api-types/v10');
const AutocompleteInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/AutocompleteInteraction`);
const ButtonInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/ButtonInteraction`);
const ChannelSelectMenuInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/ChannelSelectMenuInteraction`);
const ChatInputCommandInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/ChatInputCommandInteraction`);
const MentionableSelectMenuInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/MentionableSelectMenuInteraction`);
const MessageContextMenuCommandInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/MessageContextMenuCommandInteraction`);
const ModalSubmitInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/ModalSubmitInteraction`);
const RoleSelectMenuInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/RoleSelectMenuInteraction`);
const StringSelectMenuInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/StringSelectMenuInteraction`);
const UserContextMenuCommandInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/UserContextMenuCommandInteraction`);
const UserSelectMenuInteraction = require(`${__dirname}/../../../node_modules/discord.js/src/structures/UserSelectMenuInteraction`);
const Events = require(`${__dirname}/../../../node_modules/discord.js/src/util/Events`);

// TS has no knowdledge of bound function so `this` will always be unreachable
function handle(data: any) { // type isn't relevant in the slightest
	// @ts-ignore
	const client = this.client;

	// Resolve and cache partial channels for Interaction#channel getter
	// @ts-ignore
	const channel = data.channel && this.getChannel(data.channel);

	// Do not emit this for interactions that cache messages that are non-text-based.
	let InteractionClass;

	switch (data.type) {
		case DiscordInteractionType.ApplicationCommand:
			switch (data.data.type) {
				case ApplicationCommandType.ChatInput:
					InteractionClass = ChatInputCommandInteraction;
					break;
				case ApplicationCommandType.User:
					InteractionClass = UserContextMenuCommandInteraction;
					break;
				case ApplicationCommandType.Message:
					if (channel && !channel.isTextBased()) return;
					InteractionClass = MessageContextMenuCommandInteraction;
					break;
				default:
					client.emit(Events.Debug, `[INTERACTION] Received application command interaction with unknown type: ${data.data.type}`);
					return;
			}
			break;
		case DiscordInteractionType.MessageComponent:
			if (channel && !channel.isTextBased()) return;

			switch (data.data.component_type) {
				case ComponentType.Button:
					InteractionClass = ButtonInteraction;
					break;
				case ComponentType.StringSelect:
					InteractionClass = StringSelectMenuInteraction;
					break;
				case ComponentType.UserSelect:
					InteractionClass = UserSelectMenuInteraction;
					break;
				case ComponentType.RoleSelect:
					InteractionClass = RoleSelectMenuInteraction;
					break;
				case ComponentType.MentionableSelect:
					InteractionClass = MentionableSelectMenuInteraction;
					break;
				case ComponentType.ChannelSelect:
					InteractionClass = ChannelSelectMenuInteraction;
					break;
				default:
					client.emit(Events.Debug, `[INTERACTION] Received component interaction with unknown type: ${data.data.component_type}`);
					return;
			}
			break;
		case DiscordInteractionType.ApplicationCommandAutocomplete:
			InteractionClass = AutocompleteInteraction;
			break;
		case DiscordInteractionType.ModalSubmit:
			InteractionClass = ModalSubmitInteraction;
			break;
		default:
			client.emit(Events.Debug, `[INTERACTION] Received interaction with unknown type: ${data.type}`);
			return;
	}

	const interaction = new InteractionClass(client, data);

	/**
	 * Emitted when an interaction is created.
	 * @event Client#interactionCreate
	 * @param {BaseInteraction} interaction The interaction which was created
	 */

	const messageID = interaction.messageID || interaction.messageId || 'message' in interaction ? interaction.message.id : null;

	const activeCollector = client.activeCollectors.get(messageID);
	if (activeCollector) {
		activeCollector.handleInteraction(interaction);
	} else {
		client.emit(Events.InteractionCreate, interaction);
	}
}


// Auto run on import, no action needed
InteractionCreateAction.prototype.handle = handle;