// Log Channel Creations (Staff Server) \\
const Discord = require("discord.js")

module.exports = {
    async execute(client, channel) {
        if (channel.guild && channel.guild.id === "836941787213725717") {
            let type = "Unknown"
            if (channel.type === "GUILD_TEXT") type = "Text Channel"
            else if (channel.type === "GUILD_VOICE") type = "Voice Channel"
            else if (channel.type === "GUILD_CATEGORY") type = "Category"
            else if (channel.type === "GUILD_NEWS") type = "Announcement Channel"
            else if (channel.type === "GUILD_NEWS_THREAD") type = "News Thread"
            else if (channel.type === "GUILD_PUBLIC_THREAD") type = "Public Thread"
            else if (channel.type === "GUILD_PRIVATE_THREAD") type = "Private Thread"
            else type = channel.type
            const row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setLabel("Go to Channel")
                        .setURL(`https://discord.com/channels/${channel.guild.id}/${channel.id}`)
                        .setStyle("LINK")
                        .setDisabled(type === "Category" ? true : false)
                )
            const embed = new Discord.MessageEmbed()
                .setColor("BLUE")
                .setTitle(`${type} Created`)
                .addFields(
                    {
                        name: "Name",
                        value: channel.name,
                        inline: true
                    },
                    {
                        name: "ID",
                        value: channel.id,
                        inline: true
                    }
                )
            if (channel.parent) {
                embed.addFields({
                    name: "Category",
                    value: channel.parent.name,
                    inline: true
                })
            }
            client.channels.cache.get("872794253464584232").send({ embeds: [embed], components: [row] })
        }
    }
}