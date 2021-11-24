const Discord = require("discord.js")

module.exports = {
    async execute(client, guild) {
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel("Invite Bot")
                    .setURL("https://discord.com/api/oauth2/authorize?client_id=836942695842447361&permissions=8&scope=bot%20applications.commands")
                    .setStyle("LINK"),
                new Discord.MessageButton()
                    .setLabel("Join Roblox Update Checker Server")
                    .setURL("https://discord.gg/wHy6kkvDQc")
                    .setStyle("LINK")
            )
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(`Hello, I am Roblox Update Checker. As the name suggests I check for Roblox updates.
This bot uses [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ).

Users with the \`Administrator\` permission can get started by using the following commands:
\`/moderation setupdatechannel <channel>\`
\`/moderation setupdaterole <role>\`
\`/moderation createrolemenu\`
Examples:
\`/moderation setupdatechannel #roblox-updates\`
\`/moderation setupdaterole @Roblox Update Pings\``)
        guild.channels.cache.get(guild.systemChannelId || guild.channels.cache.find(channel => channel.type === "GUILD_TEXT" && channel.permissionsFor(guild.me).has("SEND_MESSAGES")).id).send({
            embeds: [embed],
            components: [row]
        })
    }
}