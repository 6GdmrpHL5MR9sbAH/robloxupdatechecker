const Discord = require("discord.js")

module.exports = {
    async execute(client, message) {
        if (message.partial || message.author.bot || message.system || message.channel.id === "868449580067479623" || message.guild.id !== "836941787213725717") {
            return
        }
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel("Go to Channel")
                    .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}`)
                    .setStyle("LINK")
            )
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(`**Deleted message from ${message.author} in ${message.channel}**`)
            .addFields({
                name: "Message",
                value: message.content,
                inline: true
            })
            .setAuthor(`${message.member.displayName} (${message.author.tag})`, message.author.displayAvatarURL({ dynamic: true }))
        client.channels.cache.get("872794614996811816").send({ embeds: [embed], components: [row] })
    }
}