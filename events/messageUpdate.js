const Discord = require("discord.js")

module.exports = {
    async execute(client, oldMessage, newMessage) {
        if (oldMessage.partial || newMessage.author.bot || newMessage.content === oldMessage.content || newMessage.channel.id === "868449580067479623" || newMessage.guild.id !== "836941787213725717") {
            return
        }
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel("Jump to Message")
                    .setURL(newMessage.url)
                    .setStyle("LINK")
            )
        const embed = new Discord.MessageEmbed()
            .setColor("BLUE")
            .setDescription(`**Edited message from ${newMessage.author} in ${newMessage.channel}**`)
            .setAuthor(`${newMessage.member.displayName} (${newMessage.author.tag})`, newMessage.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: "Old Message",
                    value: oldMessage.content.length > 1024 ? "```Goes over the 1024 character limit.```" : oldMessage.content
                },
                {
                    name: "New Message",
                    value: newMessage.content.length > 1024 ? "```Goes over the 1024 character limit.```" : newMessage.content
                }
            )
        client.channels.cache.get("872794614996811816").send({ embeds: [embed], components: [row] })
    }
}