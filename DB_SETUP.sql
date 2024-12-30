-- This is a lookup for every single stored asset in the system
-- Things like icons, images, videos, stickers/emojis, etc
-- If a user or guild has an icon it will show up in here with an ID
CREATE TABLE IF NOT EXISTS Assets (
	asset_id INTEGER PRIMARY KEY AUTOINCREMENT,

	-- Avoid storing duplicates, this is only a lookup for the storage location : [HASH].[EXTENSION]
	url TEXT NOT NULL UNIQUE,
	hash TEXT NOT NULL,
	fileName TEXT ALWAYS AS (hash || '.' || extension) VIRTUAL,

	id TEXT NOT NULL, -- Discord Snowflake
	extension TEXT NOT NULL,

	width INTEGER,
	height INTEGER,
	size INTEGER,
	
	created_at DATETIME GENERATED ALWAYS AS ({{SNOWFLAKE_DATE}}) VIRTUAL
);
CREATE INDEX IF NOT EXISTS assets_hash ON Assets (hash);
CREATE INDEX IF NOT EXISTS assets_url  ON Assets (url);

CREATE TABLE IF NOT EXISTS Guilds (
	id TEXT NOT NULL PRIMARY KEY, -- Discord Snowflake
	name TEXT NOT NULL,
	asset_id INTEGER,
	-- {{...}} denotes an external macro, see Utils/Database for available macros
	createdAt DATETIME GENERATED ALWAYS AS ({{SNOWFLAKE_DATE}}) VIRTUAL
);

CREATE TABLE IF NOT EXISTS Users (
	id TEXT NOT NULL PRIMARY KEY,
	username TEXT NOT NULL,
	bot INTEGER NOT NULL DEFAULT 0,
	asset_id INTEGER,
	createdAt DATETIME GENERATED ALWAYS AS ({{SNOWFLAKE_DATE}}) VIRTUAL
);

CREATE TABLE IF NOT EXISTS Members (
	user_id TEXT NOT NULL,
	guild_id TEXT NOT NULL,
	joined_at DATETIME,
	left_at DATETIME,
	PRIMARY KEY(user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS Channels (
	id TEXT NOT NULL PRIMARY KEY,
	guild_id TEXT NOT NULL,
	name TEXT NOT NULL,
	parent_id TEXT,
	type INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS Emojis (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL,
	animated INTEGER NOT NULL DEFAULT 0,
	asset_id INTEGER,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Stickers (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL,
	asset_id INTEGER,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Attachments (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL,
	message_id TEXT NOT NULL,
	asset_id INTEGER,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS attachments_message_id ON Attachments (message_id);

/*
export interface BasicEmbed {
	// This is here for completeness and avoid nested loops
	// It's a little bit more ram but the coede is simpler
	messageID: string;

	title: string | null;
	description: string | null;
	url: string | null;
	timestamp: string | null;
	color: number | null;

	// Unwraping objects make it easier for the database
	footer_text: string | null;
	footer_icon: string | null;

	thumbnail_url: string | null;

	image_url: string | null;

	author_name: string | null;
	author_url: string | null;
	author_icon: string | null;

	fields: EmbedField[];
}

export interface EmbedField {
	name: string;
	value: string;
	inline?: boolean;
}
*/

CREATE TABLE IF NOT EXISTS Embeds (
	id TEXT NOT NULL PRIMARY KEY,
	message_id TEXT NOT NULL,
	title TEXT,
	description TEXT,
	url TEXT,
	timestamp TEXT,
	color INTEGER,
	footer_text TEXT,
	footer_icon TEXT,
	thumbnail_url TEXT,
	image_url TEXT,
	author_name TEXT,
	author_url TEXT,
	author_icon TEXT
);

CREATE TABLE IF NOT EXISTS EmbedFields (
	id INTEGER PRIMARY KEY AUTOINCREMENT, -- Only used for ordering, this has no impact on the data
	embed_id TEXT NOT NULL,
	name TEXT NOT NULL,
	value TEXT NOT NULL,
	inline INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Messages (
	id TEXT NOT NULL PRIMARY KEY,
	guild_id TEXT NOT NULL,
	channel_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	content TEXT,
	sticker_id TEXT,
	created_at DATETIME GENERATED ALWAYS AS ({{SNOWFLAKE_DATE}}) VIRTUAL
);