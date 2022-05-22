const { Client, Guild, MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")

module.exports = {
    name: "guildCreate",
    once: false,
    /**
     * @param {Client} client
     * @param {Guild} guild
     */
    async execute(client, guild) {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel("Invite Bot")
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setStyle("LINK")
            )

        const embed = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(`This bot uses [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ).

Users with the \`Administrator\` permission can get started by using the following commands:
\`/setupdatechannel #channel\`
\`/setupdaterole @role\`
\`/createrolemenu\`
Examples:
\`/setupdatechannel #roblox-updates\`
\`/setupdaterole @Roblox Update Pings\``)

        guild.channels.cache.get(guild.systemChannelId || guild.channels.cache.find(channel => channel.type === "GUILD_TEXT" && channel.permissionsFor(guild.me).has("SEND_MESSAGES")).id).send({
            embeds: [embed],
            components: [row]
        })
    }
}